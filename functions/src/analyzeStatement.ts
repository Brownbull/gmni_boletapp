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
 * Type guard: validates parsed JSON conforms to StatementResult.
 */
function isValidStatementResult(value: unknown): value is StatementResult {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>

  // Validate statementInfo
  if (typeof v['statementInfo'] !== 'object' || v['statementInfo'] === null) return false
  const info = v['statementInfo'] as Record<string, unknown>
  if (typeof info['bank'] !== 'string') return false
  if (typeof info['currency'] !== 'string') return false

  // Validate transactions array
  if (!Array.isArray(v['transactions'])) return false
  for (const tx of v['transactions'] as unknown[]) {
    if (typeof tx !== 'object' || tx === null) return false
    const t = tx as Record<string, unknown>
    if (typeof t['date'] !== 'string') return false
    if (typeof t['description'] !== 'string') return false
    if (typeof t['amount'] !== 'number' || !Number.isFinite(t['amount'])) return false
    if (typeof t['type'] !== 'string') return false
    if (!VALID_STATEMENT_TYPES.has(t['type'] as string)) return false
  }

  // Validate metadata
  if (typeof v['metadata'] !== 'object' || v['metadata'] === null) return false
  const meta = v['metadata'] as Record<string, unknown>
  if (typeof meta['totalTransactions'] !== 'number') return false

  return true
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
      if (!isValidStatementResult(rawParsed)) {
        const fields = typeof rawParsed === 'object' && rawParsed !== null ? Object.keys(rawParsed) : []
        console.error('Statement response failed schema validation. Fields:', fields.join(', '))
        throw new functions.https.HttpsError(
          'internal',
          'Statement analysis returned unexpected format. Please try again.'
        )
      }
      const parsed: StatementResult = rawParsed

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
