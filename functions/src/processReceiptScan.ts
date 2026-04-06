/**
 * processReceiptScan — Firestore onCreate Trigger (Story 18-13a)
 *
 * Fires when queueReceiptScan creates a pending_scans/{scanId} document.
 * Fetches images from Storage, calls Gemini with retry, generates thumbnail,
 * and updates the doc with result or failure + credit refund.
 *
 * - Trigger: Firestore onCreate on pending_scans/{scanId}
 * - Timeout: 300s (Gemini calls take 30-40s + image processing)
 * - Memory: 1GB (image buffer processing)
 * - Credit refund on failure is atomic (status=failed + creditDeducted=false)
 */

import { randomBytes } from 'crypto'
import * as functions from 'firebase-functions'
import { parseJsonWithRepair } from './utils/jsonRepair'
import * as admin from 'firebase-admin'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { resizeAndCompress, generateThumbnail } from './imageProcessing'
import { withRetry, isTransientGeminiError, GEMINI_RETRY_DELAY_MS } from './utils/retryHelper'
import { buildPrompt, getActivePrompt } from './prompts'
import type { ReceiptType } from './prompts'
import { isFixtureMode, loadFixture } from './fixtureHelper'

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp()
}

/** App ID for Firestore credit paths */
const APP_ID = 'boletapp-d609f'

// Gemini AI lazy init (same pattern as analyzeReceipt)
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured.')
  }
  return new GoogleGenerativeAI(apiKey)
}

const ALLOWED_GEMINI_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']

// SSRF prevention: only fetch images from trusted Firebase Storage origins
const ALLOWED_URL_ORIGINS: readonly string[] = [
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  'boletapp-d609f.firebasestorage.app',
]

/** Max image size in bytes (10MB) */
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024

function validateImageUrl(url: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Invalid image URL format')
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Image URL must use HTTPS')
  }
  if (!ALLOWED_URL_ORIGINS.includes(parsed.hostname)) {
    throw new Error('Image URL origin is not permitted')
  }
}

async function fetchImageFromUrl(url: string): Promise<Buffer> {
  validateImageUrl(url)
  const response = await fetch(url)
  if (!response.ok) {
    console.error(`fetchImageFromUrl: upstream error ${response.status} for URL hostname ${new URL(url).hostname}`)
    throw new Error('Failed to fetch image from Storage')
  }
  // OOM prevention: reject oversized responses before buffering
  const contentLength = Number(response.headers.get('content-length') || 0)
  if (contentLength > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(`Image exceeds size limit: ${(contentLength / (1024 * 1024)).toFixed(1)}MB`)
  }
  const arrayBuffer = await response.arrayBuffer()
  if (arrayBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(`Image exceeds size limit: ${(arrayBuffer.byteLength / (1024 * 1024)).toFixed(1)}MB`)
  }
  return Buffer.from(arrayBuffer)
}

function generateTransactionId(): string {
  return randomBytes(15).toString('base64url')
}

/**
 * Coerce Gemini string-typed numeric values to actual numbers.
 * CLP-only: strips Chilean thousands separators (dots and commas).
 * For multi-currency support (USD/EUR), revisit before enabling non-CLP prompts
 * — dot is the decimal separator in those currencies.
 */
function parseGeminiNumber(value: unknown): unknown {
  if (typeof value !== 'string') return value
  if (value === '') return NaN
  const cleaned = value.replace(/[.,]/g, '')
  const num = Number(cleaned)
  return num
}

function coerceGeminiNumericFields(obj: Record<string, unknown>): Record<string, unknown> {
  const coerced = { ...obj }
  // Coerce null/missing fields to safe defaults (Gemini sometimes returns null for unreadable fields)
  if (coerced.date == null || typeof coerced.date !== 'string') {
    coerced.date = new Date().toISOString().split('T')[0]
  }
  if (coerced.merchant == null || typeof coerced.merchant !== 'string') {
    coerced.merchant = 'Unknown'
  }
  if (coerced.category == null || typeof coerced.category !== 'string') {
    coerced.category = 'Other'
  }
  if (!Array.isArray(coerced.items)) {
    coerced.items = []
  }
  if ('total' in coerced) coerced.total = parseGeminiNumber(coerced.total)
  if ('items' in coerced && Array.isArray(coerced.items)) {
    coerced.items = coerced.items
      .map((item: Record<string, unknown>) => {
        const coercedItem = { ...item }
        // Remap legacy 'price' field if Gemini returns old schema
        if (!('totalPrice' in coercedItem) && 'price' in coercedItem) {
          coercedItem.totalPrice = coercedItem.price
          delete coercedItem.price
        }
        if ('totalPrice' in coercedItem) coercedItem.totalPrice = parseGeminiNumber(coercedItem.totalPrice)
        if ('unitPrice' in coercedItem) coercedItem.unitPrice = parseGeminiNumber(coercedItem.unitPrice)
        if ('qty' in coercedItem) coercedItem.qty = parseGeminiNumber(coercedItem.qty)
        if ('quantity' in coercedItem && !('qty' in coercedItem)) {
          coercedItem.qty = parseGeminiNumber(coercedItem.quantity)
        }
        return coercedItem
      })
      .filter((item: Record<string, unknown>) => {
        const price = item.totalPrice ?? item.unitPrice ?? 0
        return typeof price === 'number' && price !== 0
      })
  }

  // Coerce null/NaN total: compute from items sum, fallback 0
  if (typeof coerced.total !== 'number' || !Number.isFinite(coerced.total as number)) {
    const items = (coerced.items ?? []) as Record<string, unknown>[]
    const sum = items.reduce((acc: number, item: Record<string, unknown>) => {
      const price = item.totalPrice
      return acc + (typeof price === 'number' && Number.isFinite(price) ? price : 0)
    }, 0)
    coerced.total = sum
  }

  return coerced
}

interface GeminiValidationDiagnostic {
  valid: boolean
  failedField?: string
  expectedType?: string
  actualType?: string
  actualValue?: string
}

function validateGeminiResult(result: unknown): GeminiValidationDiagnostic {
  if (!result || typeof result !== 'object') {
    return { valid: false, failedField: 'root', expectedType: 'object', actualType: typeof result }
  }
  const r = result as Record<string, unknown>
  if (typeof r.merchant !== 'string') {
    return { valid: false, failedField: 'merchant', expectedType: 'string', actualType: typeof r.merchant, actualValue: String(r.merchant) }
  }
  if (typeof r.date !== 'string') {
    return { valid: false, failedField: 'date', expectedType: 'string', actualType: typeof r.date, actualValue: String(r.date) }
  }
  if (typeof r.total !== 'number' || !isFinite(r.total)) {
    return { valid: false, failedField: 'total', expectedType: 'number', actualType: typeof r.total, actualValue: String(r.total) }
  }
  if (typeof r.category !== 'string') {
    return { valid: false, failedField: 'category', expectedType: 'string', actualType: typeof r.category, actualValue: String(r.category) }
  }
  if ('items' in r && !Array.isArray(r.items)) {
    return { valid: false, failedField: 'items', expectedType: 'array', actualType: typeof r.items, actualValue: String(r.items) }
  }
  return { valid: true }
}

export const processReceiptScan = functions
  .runWith({ timeoutSeconds: 300, memory: '1GB' })
  .firestore
  .document('pending_scans/{scanId}')
  .onCreate(async (snapshot, context) => {
    const scanId = context.params.scanId
    const data = snapshot.data()
    const userId: string = data.userId
    const db = admin.firestore()
    const docRef = db.doc(`pending_scans/${scanId}`)

    // Idempotency guard: Cloud Functions may re-deliver events
    const currentSnap = await docRef.get()
    const currentData = currentSnap.data()
    if (currentData?.status !== 'processing') {
      console.log(`processReceiptScan: scan ${scanId} already ${currentData?.status}, skipping`)
      return
    }

    try {
      // 1. Validate imageUrls against ALLOWED_URL_ORIGINS (SSRF prevention)
      for (const url of data.imageUrls) {
        validateImageUrl(url)
      }

      // 2. Validate image sizes from Storage metadata
      const bucket = admin.storage().bucket()
      for (const url of data.imageUrls) {
        // Extract storage path from public URL
        const urlObj = new URL(url)
        const pathMatch = urlObj.pathname.match(/\/[^/]+\/o\/(.+?)(\?|$)/) ||
                          urlObj.pathname.match(/\/[^/]+\/(.+?)(\?|$)/)
        if (pathMatch) {
          const storagePath = decodeURIComponent(pathMatch[1])
          const [metadata] = await bucket.file(storagePath).getMetadata()
          const size = Number(metadata.size)
          if (size > MAX_IMAGE_SIZE_BYTES) {
            throw new Error(`Image exceeds size limit: ${(size / (1024 * 1024)).toFixed(1)}MB`)
          }
        } else {
          console.warn(`processReceiptScan: could not extract storage path from URL, skipping metadata size check`)
        }
      }

      // 3. Fetch + resize/compress images
      const rawBuffers: Buffer[] = []
      const fullSizeBuffers: Buffer[] = []
      for (const url of data.imageUrls) {
        const imageBuffer = await fetchImageFromUrl(url)
        rawBuffers.push(imageBuffer)
        const processed = await resizeAndCompress(imageBuffer)
        fullSizeBuffers.push(processed.buffer)
      }

      // 4. Get raw response text — from fixture (staging) or Gemini API (production)
      let text: string
      if (isFixtureMode()) {
        text = await loadFixture(rawBuffers)
        console.log(`processReceiptScan: FIXTURE MODE — loaded fixture for scan ${scanId}`)
      } else {
        const genAI = getGenAI()
        const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
        if (!ALLOWED_GEMINI_MODELS.includes(geminiModel)) {
          throw new Error('Invalid GEMINI_MODEL configuration')
        }
        const model = genAI.getGenerativeModel(
          { model: geminiModel },
          { apiVersion: 'v1' }
        )

        const imageParts = fullSizeBuffers.map((buffer: Buffer) => ({
          inlineData: {
            mimeType: 'image/jpeg',
            data: buffer.toString('base64'),
          },
        }))

        const prompt = buildPrompt({
          receiptType: data.receiptType as ReceiptType | undefined,
          context: 'production',
        })

        const result = await withRetry(
          () => model.generateContent([{ text: prompt }, ...imageParts]),
          isTransientGeminiError,
          { maxRetries: 1, delayMs: GEMINI_RETRY_DELAY_MS }
        )

        text = result.response.text()
      }
      const cleanedText = text
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .replace(/^```\s*/i, '')
        .trim()

      const rawParsed: unknown = parseJsonWithRepair(cleanedText)
      // Log raw Gemini items count for debugging empty items issue
      const rawObj = rawParsed as Record<string, unknown>
      const rawItems = Array.isArray(rawObj?.items) ? rawObj.items : []
      console.log(`processReceiptScan: Gemini returned ${rawItems.length} raw items for scan ${scanId}`)
      if (rawItems.length > 0) {
        console.log(`processReceiptScan: first item sample: ${JSON.stringify(rawItems[0])}`)
      }
      const coerced = typeof rawParsed === 'object' && rawParsed !== null
        ? coerceGeminiNumericFields(rawParsed as Record<string, unknown>)
        : rawParsed
      const coercedItems = Array.isArray((coerced as Record<string, unknown>)?.items) ? (coerced as Record<string, unknown>).items as unknown[] : []
      if (rawItems.length > 0 && coercedItems.length === 0) {
        console.warn(`processReceiptScan: all ${rawItems.length} items filtered by coercion for scan ${scanId}`)
      }
      const diagnostic = validateGeminiResult(coerced)
      if (!diagnostic.valid) {
        console.error(
          `Gemini validation failed for scan ${scanId}: field="${diagnostic.failedField}" expected="${diagnostic.expectedType}" actual="${diagnostic.actualType}"`
        )
        throw new Error('Receipt analysis returned unexpected format')
      }
      const parsed = coerced as Record<string, unknown>

      // 5. Generate thumbnail + transactionId
      const transactionId = generateTransactionId()
      const thumbnailResult = await generateThumbnail(fullSizeBuffers[0])

      // Upload thumbnail to permanent receipts path (not pending_scans/ which gets cleaned up)
      const thumbnailPath = `users/${userId}/receipts/${transactionId}/thumbnail.jpg`
      const thumbnailFile = bucket.file(thumbnailPath)
      // public: true matches existing receipt image pattern (storageService.ts uploadImage/uploadThumbnail).
      // URLs are unguessable (contain userId+scanId). Project-wide signed URL migration tracked separately.
      await thumbnailFile.save(thumbnailResult.buffer, {
        contentType: 'image/jpeg',
        metadata: { cacheControl: 'public, max-age=31536000' },
        public: true,
      })
      const thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/${thumbnailPath}`

      const activePrompt = getActivePrompt('production')

      // 6. Success: single atomic update
      await docRef.update({
        status: 'completed',
        result: {
          ...parsed,
          transactionId,
          imageUrls: data.imageUrls,
          thumbnailUrl,
          promptVersion: activePrompt.version,
          merchantSource: 'scan',
        },
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      console.log(`processReceiptScan: scan ${scanId} completed, transactionId=${transactionId}`)
    } catch (error) {
      // 7. Failure: atomic update + credit refund via runTransaction
      const errorMessage = error instanceof Error ? error.message.slice(0, 500) : 'Unknown error'
      console.error(`processReceiptScan: scan ${scanId} failed:`, errorMessage)

      const creditsRef = db.doc(`artifacts/${APP_ID}/users/${userId}/credits/balance`)

      await db.runTransaction(async (transaction) => {
        // Check creditDeducted flag before refunding — prevents double-refund
        // if cleanup/delete fires concurrently
        const docSnap = await transaction.get(docRef)
        const docData = docSnap.data()
        const shouldRefund = docData?.creditDeducted === true

        if (shouldRefund) {
          const creditsSnap = await transaction.get(creditsRef)
          const credits = creditsSnap.data()
          transaction.update(creditsRef, {
            remaining: (credits?.remaining ?? 0) + 1,
            used: Math.max(0, (credits?.used ?? 0) - 1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          })
        }

        // Update pending doc: status=failed + creditDeducted=false in SAME write
        transaction.update(docRef, {
          status: 'failed',
          error: errorMessage,
          creditDeducted: false,
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      })
    }
  })
