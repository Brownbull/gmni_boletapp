/**
 * analyzeStatement — Cloud Function for credit card statement extraction
 *
 * Story 18-1/18-3: Extracts multiple transactions from Chilean credit card
 * statement PDFs using Gemini AI.
 *
 * Key differences from analyzeReceipt:
 * - Input: PDF file (not image)
 * - Output: Array of transactions + statement metadata
 * - No image processing/storage (PDFs are not stored)
 * - Uses statement-specific prompt (prompt-testing/prompts/statement/)
 */

import * as functions from 'firebase-functions'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildStatementPrompt, getActiveStatementPrompt } from './prompts/statement'
import type { StatementResult } from './prompts/statement'

// ============================================================================
// Configuration
// ============================================================================

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY not configured. ' +
      'Add GEMINI_API_KEY to functions/.env (local) or set via Secret Manager (production).'
    )
  }
  return new GoogleGenerativeAI(apiKey)
}

const ALLOWED_GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']

// PDF validation
const MAX_PDF_SIZE_MB = 7 // Firebase callable 10MB body limit minus base64 ~33% overhead
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024
const MAX_BASE64_LENGTH = Math.ceil(MAX_PDF_SIZE_BYTES * 4 / 3) + 256 // base64 overhead + data URI prefix

// Valid transaction types for schema validation
const VALID_STATEMENT_TYPES = new Set(['cargo', 'abono', 'interes', 'comision', 'seguro', 'otro'])

// Rate limiting (same pattern as analyzeReceipt)
const requestTimestamps = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 5 // Statements are heavier — lower limit

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userRequests = requestTimestamps.get(userId) || []
  const recentRequests = userRequests.filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
  )
  if (recentRequests.length === 0) {
    requestTimestamps.delete(userId)
  }
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true
  }
  recentRequests.push(now)
  requestTimestamps.set(userId, recentRequests)
  return false
}

// ============================================================================
// Types
// ============================================================================

interface AnalyzeStatementRequest {
  /** Base64-encoded PDF file (with or without data URI prefix) */
  pdf: string
  /** Prompt selection context (defaults to 'production') */
  promptContext?: 'production' | 'development'
}

interface AnalyzeStatementResponse extends StatementResult {
  /** Version of prompt used for extraction */
  promptVersion: string
  /** Gemini model used */
  model: string
  /** Processing time in milliseconds */
  latencyMs: number
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Coerce a string-typed numeric value from Gemini to an actual number.
 * Strips dots and commas (Chilean thousands separators: "15.990" → 15990).
 *
 * CLP-only assumption: all values are integers per prompt instructions.
 * WARNING: strips ALL dots/commas — "1.50" becomes 150 (100x error for decimals).
 * If multi-currency decimal handling is added (Epic 18.5), update this function.
 *
 * @returns The original value if not a string, or the parsed number (may be NaN).
 */
function parseGeminiNumber(value: unknown): unknown {
  if (typeof value !== 'string') return value
  if (value === '') return NaN
  const cleaned = value.replace(/[.,]/g, '')
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : NaN
}

/**
 * Coerce known numeric fields in a raw Gemini statement response.
 * Applied BEFORE validation — does not relax the type guard.
 * Fields: transactions[].amount, transactions[].originalAmount (skip null),
 *         statementInfo.totalDebit (skip null), statementInfo.totalCredit (skip null),
 *         metadata.totalTransactions, metadata.confidence, metadata.pageCount
 */
function coerceStatementNumericFields(raw: Record<string, unknown>): Record<string, unknown> {
  const result = { ...raw }

  if (typeof result['statementInfo'] === 'object' && result['statementInfo'] !== null) {
    const info = { ...(result['statementInfo'] as Record<string, unknown>) }
    if (info['totalDebit'] != null) {
      info['totalDebit'] = parseGeminiNumber(info['totalDebit'])
    }
    if (info['totalCredit'] != null) {
      info['totalCredit'] = parseGeminiNumber(info['totalCredit'])
    }
    result['statementInfo'] = info
  }

  if (Array.isArray(result['transactions'])) {
    result['transactions'] = (result['transactions'] as unknown[]).map((tx) => {
      if (typeof tx !== 'object' || tx === null) return tx
      const t = { ...(tx as Record<string, unknown>) }
      t['amount'] = parseGeminiNumber(t['amount'])
      if (t['originalAmount'] != null) {
        t['originalAmount'] = parseGeminiNumber(t['originalAmount'])
      }
      return t
    })
  }

  if (typeof result['metadata'] === 'object' && result['metadata'] !== null) {
    const meta = { ...(result['metadata'] as Record<string, unknown>) }
    meta['totalTransactions'] = parseGeminiNumber(meta['totalTransactions'])
    if ('confidence' in meta) {
      meta['confidence'] = parseGeminiNumber(meta['confidence'])
    }
    if ('pageCount' in meta) {
      meta['pageCount'] = parseGeminiNumber(meta['pageCount'])
    }
    result['metadata'] = meta
  }

  return result
}

interface ValidationDiagnostic {
  valid: boolean
  failedField?: string
  expectedType?: string
  actualType?: string
  actualValue?: string
}

/**
 * Validate a Gemini statement response with diagnostic output.
 * Mirrors isValidStatementResult checks but captures the first failure point.
 * Privacy: logs only the failed field's value, not the full response.
 */
function validateStatementResult(value: unknown): ValidationDiagnostic {
  if (typeof value !== 'object' || value === null) {
    return { valid: false, failedField: '(root)', expectedType: 'object', actualType: typeof value, actualValue: String(value) }
  }
  const v = value as Record<string, unknown>

  if (typeof v['statementInfo'] !== 'object' || v['statementInfo'] === null) {
    return { valid: false, failedField: 'statementInfo', expectedType: 'object', actualType: typeof v['statementInfo'], actualValue: String(v['statementInfo']) }
  }
  const info = v['statementInfo'] as Record<string, unknown>
  if (typeof info['bank'] !== 'string') {
    return { valid: false, failedField: 'statementInfo.bank', expectedType: 'string', actualType: typeof info['bank'], actualValue: String(info['bank']) }
  }
  if (typeof info['currency'] !== 'string') {
    return { valid: false, failedField: 'statementInfo.currency', expectedType: 'string', actualType: typeof info['currency'], actualValue: String(info['currency']) }
  }

  if (!Array.isArray(v['transactions'])) {
    return { valid: false, failedField: 'transactions', expectedType: 'array', actualType: typeof v['transactions'], actualValue: String(v['transactions']) }
  }
  for (let idx = 0; idx < (v['transactions'] as unknown[]).length; idx++) {
    const tx = (v['transactions'] as unknown[])[idx]
    if (typeof tx !== 'object' || tx === null) {
      return { valid: false, failedField: `transactions[${idx}]`, expectedType: 'object', actualType: typeof tx, actualValue: String(tx) }
    }
    const t = tx as Record<string, unknown>
    if (typeof t['date'] !== 'string') {
      return { valid: false, failedField: `transactions[${idx}].date`, expectedType: 'string', actualType: typeof t['date'], actualValue: String(t['date']) }
    }
    if (typeof t['description'] !== 'string') {
      return { valid: false, failedField: `transactions[${idx}].description`, expectedType: 'string', actualType: typeof t['description'], actualValue: String(t['description']) }
    }
    if (typeof t['amount'] !== 'number' || !Number.isFinite(t['amount'])) {
      return { valid: false, failedField: `transactions[${idx}].amount`, expectedType: 'number (finite)', actualType: typeof t['amount'], actualValue: String(t['amount']) }
    }
    if (typeof t['type'] !== 'string') {
      return { valid: false, failedField: `transactions[${idx}].type`, expectedType: 'string', actualType: typeof t['type'], actualValue: String(t['type']) }
    }
    if (!VALID_STATEMENT_TYPES.has(t['type'] as string)) {
      return { valid: false, failedField: `transactions[${idx}].type`, expectedType: 'one of: cargo|abono|interes|comision|seguro|otro', actualType: 'string', actualValue: String(t['type']) }
    }
  }

  if (typeof v['metadata'] !== 'object' || v['metadata'] === null) {
    return { valid: false, failedField: 'metadata', expectedType: 'object', actualType: typeof v['metadata'], actualValue: String(v['metadata']) }
  }
  const meta = v['metadata'] as Record<string, unknown>
  if (typeof meta['totalTransactions'] !== 'number' || !Number.isFinite(meta['totalTransactions'])) {
    return { valid: false, failedField: 'metadata.totalTransactions', expectedType: 'number (finite)', actualType: typeof meta['totalTransactions'], actualValue: String(meta['totalTransactions']) }
  }

  return { valid: true }
}

/**
 * Extract raw base64 from a data URI or plain base64 string.
 */
function extractBase64(input: string): string {
  const match = input.match(/^data:[^;]+;base64,(.+)$/)
  return match ? match[1] : input
}

// ============================================================================
// Cloud Function
// ============================================================================

export const analyzeStatement = functions
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onCall(
  async (
    data: AnalyzeStatementRequest,
    context: functions.https.CallableContext
  ): Promise<AnalyzeStatementResponse> => {
    const startTime = Date.now()

    // Require authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be logged in to analyze statements'
      )
    }

    // Check rate limit
    const userId = context.auth.uid
    if (checkRateLimit(userId)) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX_REQUESTS} requests per minute.`
      )
    }

    // Validate input
    if (!data.pdf || typeof data.pdf !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'pdf field is required and must be a base64-encoded PDF string'
      )
    }

    // Restrict promptContext — only allow 'development' in emulator
    const promptContext: 'production' | 'development' =
      process.env.FUNCTIONS_EMULATOR === 'true' && data.promptContext === 'development'
        ? 'development'
        : 'production'

    // Guard against oversized payloads before base64 processing
    if (data.pdf.length > MAX_BASE64_LENGTH) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `PDF payload too large. Maximum size is ${MAX_PDF_SIZE_MB}MB`
      )
    }

    // Validate PDF content
    const pdfBase64 = extractBase64(data.pdf)

    // Verify PDF magic bytes (%PDF- header)
    const pdfHeaderBytes = Buffer.from(pdfBase64.slice(0, 12), 'base64')
    if (pdfHeaderBytes.length < 5 || pdfHeaderBytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'File is not a valid PDF document'
      )
    }

    // Validate PDF size
    const estimatedSize = Math.floor((pdfBase64.length * 3) / 4)
    if (estimatedSize > MAX_PDF_SIZE_BYTES) {
      const sizeMB = (estimatedSize / (1024 * 1024)).toFixed(2)
      throw new functions.https.HttpsError(
        'invalid-argument',
        `PDF is too large (${sizeMB}MB). Maximum size is ${MAX_PDF_SIZE_MB}MB`
      )
    }

    try {
      // Initialize Gemini
      const genAI = getGenAI()
      const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
      if (!ALLOWED_GEMINI_MODELS.includes(geminiModel)) {
        throw new functions.https.HttpsError('internal', 'Invalid GEMINI_MODEL configuration.')
      }
      const model = genAI.getGenerativeModel(
        { model: geminiModel },
        { apiVersion: 'v1' }
      )

      // Build prompt
      const prompt = buildStatementPrompt({
        context: promptContext,
      })

      // Call Gemini with PDF
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfBase64,
              },
            },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 65536,
          responseMimeType: 'application/json',
        },
      })

      const response = result.response
      const text = response.text()

      // Parse response
      const cleanedText = text
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .replace(/^```\s*/i, '')
        .trim()

      const rawParsed: unknown = JSON.parse(cleanedText)
      const coerced = typeof rawParsed === 'object' && rawParsed !== null
        ? coerceStatementNumericFields(rawParsed as Record<string, unknown>)
        : rawParsed
      const diagnostic = validateStatementResult(coerced)
      if (!diagnostic.valid) {
        console.error(
          `Gemini statement validation failed: field="${diagnostic.failedField}" expected="${diagnostic.expectedType}" actual="${diagnostic.actualType}" value="${diagnostic.actualValue}"`
        )
        throw new functions.https.HttpsError(
          'internal',
          'Statement analysis returned unexpected format. Please try again.'
        )
      }
      const parsed = coerced as StatementResult

      const latencyMs = Date.now() - startTime
      const activePrompt = getActiveStatementPrompt(promptContext)

      console.log(
        `Statement analyzed: ${parsed.transactions.length} transactions, ${latencyMs}ms`
      )

      return {
        ...parsed,
        promptVersion: activePrompt.version,
        model: geminiModel,
        latencyMs,
      }
    } catch (error) {
      console.error('Error analyzing statement:', error)

      if (error instanceof functions.https.HttpsError) {
        throw error
      }

      throw new functions.https.HttpsError(
        'internal',
        'Failed to analyze statement. Please try again.'
      )
    }
  }
)
