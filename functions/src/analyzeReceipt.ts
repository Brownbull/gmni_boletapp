import { randomBytes } from 'crypto'
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { base64ToBuffer, resizeAndCompress, generateThumbnail } from './imageProcessing'
import { withRetry, isTransientGeminiError, GEMINI_RETRY_DELAY_MS } from './utils/retryHelper'
import { uploadReceiptImages } from './storageService'
import { buildPrompt, getActivePrompt, RECEIPT_TYPES } from './prompts'
import type { ReceiptType } from './prompts'

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp()
}

// Initialize Gemini AI with API key from environment variable
// Story 15b-5a: Removed deprecated functions.config() fallback (shutdown March 2026)
// Config source: functions/.env for deploy, Secret Manager for future
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

// SSRF prevention: only fetch images from trusted Firebase Storage origins (TD-15b-36)
const ALLOWED_URL_ORIGINS: readonly string[] = [
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
]

// Rate limiting: Store user request timestamps in memory.
//
// ACCEPTED RISK (TD-15b-36): This Map resets on every Cloud Function cold start.
// Because Cloud Functions can run on multiple instances simultaneously, each instance
// maintains its own counter — a user can exceed the stated limit by issuing requests
// across instances. This provides best-effort rate limiting, not guaranteed enforcement.
//
// Firestore counter approach considered and deferred:
//   - Pro: Distributed, survives cold starts, accurate across instances
//   - Con: Adds 1 Firestore read + 1 write per scan call; at current traffic levels
//     (< 100 scans/day) the cost and latency overhead is not justified
//   - Revisit when: sustained traffic > 500 scans/day or abuse detected in logs
//
// For now, this in-memory limiter blocks accidental hammering and is sufficient
// for current usage patterns.
const requestTimestamps = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // 10 requests per minute per user

/**
 * Check if user has exceeded rate limit
 * @param userId User ID from Firebase Auth
 * @returns true if rate limit exceeded, false otherwise
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userRequests = requestTimestamps.get(userId) || []

  // Remove timestamps outside the current window
  const recentRequests = userRequests.filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
  )

  // Cleanup stale entry if no recent requests
  if (recentRequests.length === 0) {
    requestTimestamps.delete(userId)
  }

  // Check if user has exceeded the limit
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true // Rate limit exceeded
  }

  // Add current request timestamp
  recentRequests.push(now)
  requestTimestamps.set(userId, recentRequests)

  return false // Within rate limit
}

// Gemini model allowlist (Story 15b-5a: configurable via GEMINI_MODEL env var)
const ALLOWED_GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']

// Image validation constants
const MAX_IMAGE_SIZE_MB = 10
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
const MAX_IMAGE_COUNT = 5

/**
 * Validate image size and count
 * @param images Array of base64-encoded images
 * @throws HttpsError if validation fails
 */
function validateImages(images: string[]): void {
  // Validate image count
  if (images.length > MAX_IMAGE_COUNT) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Maximum ${MAX_IMAGE_COUNT} images allowed, received ${images.length}`
    )
  }

  // Validate each image size
  images.forEach((image, index) => {
    // Estimate size from base64 string (base64 is ~33% larger than original)
    const sizeBytes = Math.floor((image.length * 3) / 4)

    if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
      const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2)
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Image ${index + 1} is too large (${sizeMB}MB). Maximum size is ${MAX_IMAGE_SIZE_MB}MB`
      )
    }
  })
}

/**
 * Extract MIME type from base64 data URI
 * @param b64 Base64-encoded image with data URI prefix
 * @returns MIME type string
 * @throws HttpsError if MIME type is invalid
 */
function extractMimeType(b64: string): string {
  const match = b64.match(/^data:([^;]+);base64,/)

  if (!match || !match[1]) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid image format. Expected data URI with MIME type (e.g., data:image/jpeg;base64,...)'
    )
  }

  const mimeType = match[1]
  const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

  if (!validMimeTypes.includes(mimeType)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Unsupported image format: ${mimeType}. Supported formats: ${validMimeTypes.join(', ')}`
    )
  }

  return mimeType
}

interface AnalyzeReceiptRequest {
  images: string[]
  currency?: string  // Optional for V3 (auto-detects), required for V1/V2
  receiptType?: ReceiptType  // Optional hint for document type (defaults to 'auto')
  promptContext?: 'production' | 'development'  // Prompt selection context (defaults to 'production')
  // Story 14.15b: Re-scan support - if true, images are URLs from Firebase Storage (not base64)
  isRescan?: boolean
}

/**
 * Validates that a URL is safe to fetch as a receipt image (TD-15b-36).
 * Prevents SSRF by enforcing HTTPS protocol and hostname allowlist.
 * @throws HttpsError('invalid-argument') for any disallowed URL
 */
function validateImageUrl(url: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid image URL format'
    )
  }
  if (parsed.protocol !== 'https:') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Image URL must use HTTPS'
    )
  }
  if (!ALLOWED_URL_ORIGINS.includes(parsed.hostname)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Image URL origin is not permitted'
    )
  }
}

/**
 * Story 14.15b: Fetch image from URL and return as Buffer
 * Used for re-scanning transactions with stored images
 * @param url Image URL (Firebase Storage download URL)
 * @returns Buffer containing image data
 */
async function fetchImageFromUrl(url: string): Promise<Buffer> {
  validateImageUrl(url)
  const response = await fetch(url)
  if (!response.ok) {
    // Log upstream details server-side only — do NOT expose to caller (TD-15b-36 AC4)
    console.error(`fetchImageFromUrl: upstream error ${response.status} for URL hostname ${new URL(url).hostname}`)
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Failed to fetch image. Please try re-scanning.'
    )
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Returns true only for HTTPS URLs.
 * HTTP URLs are rejected — re-scan images must always use HTTPS (TD-15b-36 AC2).
 * Note: http:// and other schemes are intentionally classified as non-URL (base64 path),
 * where they fail at extractMimeType. This is by design — only HTTPS is valid for re-scan.
 */
function isUrl(str: string): boolean {
  return str.startsWith('https://')
}

/**
 * Classify an image array as all-URL or all-base64 (TD-15b-37 AC1).
 * Rejects mixed arrays (some URLs + some base64) to prevent misclassification.
 * Precondition: images must be non-empty (caller validates at line 333).
 * @throws HttpsError('invalid-argument') if images are a mix of URLs and base64
 */
function classifyImages(images: string[]): 'url' | 'base64' {
  let urlCount = 0
  for (const img of images) {
    if (isUrl(img)) urlCount++
  }
  if (urlCount > 0 && urlCount < images.length) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Mixed image types are not supported. All images must be either base64 or URLs.'
    )
  }
  return urlCount > 0 ? 'url' : 'base64'
}

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
 * Coerce known numeric fields in a raw Gemini receipt response.
 * Applied BEFORE validation — does not relax the type guard.
 * Fields: total, items[].totalPrice, items[].quantity, metadata.confidence
 */
function coerceGeminiNumericFields(raw: Record<string, unknown>): Record<string, unknown> {
  const result = { ...raw }
  result['total'] = parseGeminiNumber(result['total'])

  if (Array.isArray(result['items'])) {
    result['items'] = (result['items'] as unknown[]).map((item) => {
      if (typeof item !== 'object' || item === null) return item
      const i = { ...(item as Record<string, unknown>) }
      // Defense-in-depth: remap legacy 'price' field if Gemini returns old schema
      if (!('totalPrice' in i) && 'price' in i) {
        i['totalPrice'] = i['price']
        delete i['price']
      }
      i['totalPrice'] = parseGeminiNumber(i['totalPrice'])
      if ('unitPrice' in i) {
        const coerced = parseGeminiNumber(i['unitPrice'])
        i['unitPrice'] = (typeof coerced === 'number' && Number.isFinite(coerced)) ? coerced : undefined
      }
      if ('quantity' in i) {
        i['quantity'] = parseGeminiNumber(i['quantity'])
      }
      return i
    })
  }

  if (typeof result['metadata'] === 'object' && result['metadata'] !== null) {
    const meta = { ...(result['metadata'] as Record<string, unknown>) }
    if ('confidence' in meta) {
      meta['confidence'] = parseGeminiNumber(meta['confidence'])
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
 * Validate a Gemini receipt response with diagnostic output.
 * Mirrors isValidGeminiAnalysisResult checks but captures the first failure point.
 * Privacy: logs only the failed field's value, not the full response.
 */
function validateGeminiResult(value: unknown): ValidationDiagnostic {
  if (typeof value !== 'object' || value === null) {
    return { valid: false, failedField: '(root)', expectedType: 'object', actualType: typeof value, actualValue: String(value) }
  }
  const v = value as Record<string, unknown>
  if (typeof v['merchant'] !== 'string') {
    return { valid: false, failedField: 'merchant', expectedType: 'string', actualType: typeof v['merchant'], actualValue: String(v['merchant']) }
  }
  if (typeof v['date'] !== 'string') {
    return { valid: false, failedField: 'date', expectedType: 'string', actualType: typeof v['date'], actualValue: String(v['date']) }
  }
  if (typeof v['total'] !== 'number' || !Number.isFinite(v['total'])) {
    return { valid: false, failedField: 'total', expectedType: 'number (finite)', actualType: typeof v['total'], actualValue: String(v['total']) }
  }
  if (typeof v['category'] !== 'string') {
    return { valid: false, failedField: 'category', expectedType: 'string', actualType: typeof v['category'], actualValue: String(v['category']) }
  }
  if (!Array.isArray(v['items'])) {
    return { valid: false, failedField: 'items', expectedType: 'array', actualType: typeof v['items'], actualValue: String(v['items']) }
  }
  for (let idx = 0; idx < (v['items'] as unknown[]).length; idx++) {
    const item = (v['items'] as unknown[])[idx]
    if (typeof item !== 'object' || item === null) {
      return { valid: false, failedField: `items[${idx}]`, expectedType: 'object', actualType: typeof item, actualValue: String(item) }
    }
    const i = item as Record<string, unknown>
    if (typeof i['name'] !== 'string') {
      return { valid: false, failedField: `items[${idx}].name`, expectedType: 'string', actualType: typeof i['name'], actualValue: String(i['name']) }
    }
    if (typeof i['totalPrice'] !== 'number' || !Number.isFinite(i['totalPrice'])) {
      return { valid: false, failedField: `items[${idx}].totalPrice`, expectedType: 'number (finite)', actualType: typeof i['totalPrice'], actualValue: String(i['totalPrice']) }
    }
  }
  return { valid: true }
}

/**
 * Response from Gemini AI analysis (parsed from receipt)
 * Includes v2.6.0 fields: time, currency, country, city, metadata
 */
interface GeminiAnalysisResult {
  merchant: string
  date: string
  total: number
  category: string
  items: Array<{
    name: string
    totalPrice: number
    unitPrice?: number
    category?: string
    quantity?: number
    subcategory?: string
  }>
  // v2.6.0 fields - extracted from receipt by Gemini
  time?: string           // HH:MM format (e.g., "14:35")
  currency?: string       // Detected currency code (e.g., "USD", "CLP")
  country?: string        // Country name or null if not detected
  city?: string           // City name or null if not detected
  metadata?: {
    receiptType?: string  // Detected receipt type (e.g., "receipt", "invoice")
    confidence?: number   // Confidence score 0.0-1.0
  }
}

/**
 * Full response from analyzeReceipt Cloud Function
 * Includes Gemini analysis plus image storage URLs and tracking fields
 */
interface AnalyzeReceiptResponse extends GeminiAnalysisResult {
  transactionId: string        // Pre-generated ID for Firestore document
  imageUrls?: string[]         // Full-size image download URLs
  thumbnailUrl?: string        // Thumbnail download URL
  // Story 9.1: Additional tracking fields
  promptVersion: string        // Version of prompt used for extraction (e.g., "2.6.0")
  merchantSource: 'scan'       // Source of merchant name (always 'scan' for new receipts)
  receiptType?: string         // Flattened from metadata.receiptType for client convenience
}

/**
 * Generate a unique transaction ID (Firestore-style)
 */
function generateTransactionId(): string {
  return randomBytes(15).toString('base64url')
}

/**
 * Cloud Function to analyze receipt images using Gemini AI
 * Requires Firebase Authentication
 */
export const analyzeReceipt = functions.https.onCall(
  async (
    data: AnalyzeReceiptRequest,
    context: functions.https.CallableContext
  ): Promise<AnalyzeReceiptResponse> => {
    // Require authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be logged in to analyze receipts'
      )
    }

    // Check rate limit
    const userId = context.auth.uid
    if (checkRateLimit(userId)) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX_REQUESTS} requests per minute. Please try again in a moment.`
      )
    }

    // Validate input
    if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'images array is required and must not be empty'
      )
    }

    // Currency is optional for V3 (auto-detects from receipt)
    // For V1/V2 prompts, currency should be provided but we'll allow fallback
    if (data.currency !== undefined && typeof data.currency !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'currency must be a string if provided'
      )
    }

    // TD-15b-37 AC2: Validate receiptType against known values before any processing
    if (data.receiptType !== undefined &&
        !(RECEIPT_TYPES as readonly string[]).includes(data.receiptType)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid receipt type'
      )
    }

    // TD-15b-37 AC1: Determine scan mode with mixed-array protection
    let isRescan: boolean
    if (data.isRescan === true) {
      // Explicit flag: trust user intent, individual URLs validated in fetchImageFromUrl.
      // Note: if caller sends isRescan=true with mixed base64+URL array, base64 entries
      // fail in fetchImageFromUrl with 'Image URL must use HTTPS' — safe but unintuitive.
      isRescan = true
    } else {
      // Auto-detect: classify ALL images, reject mixed arrays (base64 + URL)
      const imageType = classifyImages(data.images)
      isRescan = imageType === 'url'
    }

    // Only validate base64 images (not URLs)
    if (!isRescan) {
      validateImages(data.images)
    }

    // Generate transaction ID upfront (needed for storage path)
    const transactionId = generateTransactionId()

    try {
      // =========================================================================
      // STEP 1: Pre-process images BEFORE Gemini API call
      // =========================================================================
      // This optimization reduces API costs by ~80% by sending smaller images.
      // Images are resized to max 1200x1600px and compressed to JPEG 80%.
      // The same processed images are reused for storage (no double processing).
      // Story 14.15b: For re-scans, fetch images from URLs instead of base64.
      // =========================================================================

      const fullSizeBuffers: Buffer[] = []

      if (isRescan) {
        // Story 14.15b: Re-scan - fetch images from URLs
        console.log(`Re-scan: fetching ${data.images.length} images from URLs`)
        for (const url of data.images) {
          const imageBuffer = await fetchImageFromUrl(url)
          const processed = await resizeAndCompress(imageBuffer)
          fullSizeBuffers.push(processed.buffer)
        }
      } else {
        // Normal scan - process base64 images
        // Validate MIME types first (before any processing)
        data.images.forEach((b64: string) => extractMimeType(b64))

        // Process all images: resize, compress, strip EXIF
        for (const b64 of data.images) {
          const inputBuffer = base64ToBuffer(b64)
          const processed = await resizeAndCompress(inputBuffer)
          fullSizeBuffers.push(processed.buffer)
        }
      }

      // Generate thumbnail from first image only (for new scans)
      // For re-scans, thumbnail already exists so we skip this
      let thumbnailBuffer: Buffer | null = null
      if (!isRescan) {
        const firstImageBuffer = base64ToBuffer(data.images[0])
        const thumbnail = await generateThumbnail(firstImageBuffer)
        thumbnailBuffer = thumbnail.buffer
      }

      // =========================================================================
      // STEP 2: Call Gemini API with optimized images
      // =========================================================================
      const genAI = getGenAI()
      // Story 15b-5a: Configurable model via env var, default to gemini-2.5-flash (stable GA)
      const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
      if (!ALLOWED_GEMINI_MODELS.includes(geminiModel)) {
        throw new functions.https.HttpsError('internal', 'Invalid GEMINI_MODEL configuration. Contact administrator.')
      }
      const model = genAI.getGenerativeModel(
        { model: geminiModel },
        { apiVersion: 'v1' }
      )

      // Convert pre-processed buffers to Gemini format (all are JPEG now)
      const imageParts = fullSizeBuffers.map((buffer: Buffer) => ({
        inlineData: {
          mimeType: 'image/jpeg',
          data: buffer.toString('base64')
        }
      }))

      // Build prompt from shared prompts library (single source of truth)
      // Uses PRODUCTION_PROMPT or DEV_PROMPT based on context parameter
      // - Mobile app: omits context → uses PRODUCTION_PROMPT (default)
      // - Test harness: sends context='development' → uses DEV_PROMPT
      const prompt = buildPrompt({
        currency: data.currency,
        receiptType: data.receiptType,  // Defaults to 'auto' if not provided
        context: data.promptContext,    // 'production' (default) or 'development'
        // date is auto-generated to today's date
      })

      // Call Gemini API with optimized images (TD-18-4: auto-retry on transient errors)
      // ACCEPTED RISK: retry consumes 2 Gemini API calls per 1 rate-limit slot.
      // At maxRetries=1 this is a fixed 2x multiplier, acceptable at current traffic (<100 scans/day).
      const result = await withRetry(
        () => model.generateContent([{ text: prompt }, ...imageParts]),
        isTransientGeminiError,
        { maxRetries: 1, delayMs: GEMINI_RETRY_DELAY_MS }
      )

      const response = result.response
      const text = response.text()

      // Parse JSON response (use same cleanJson logic as client)
      const cleanedText = text
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .replace(/^```\s*/i, '')
        .trim()

      const rawParsed: unknown = JSON.parse(cleanedText)
      const coerced = typeof rawParsed === 'object' && rawParsed !== null
        ? coerceGeminiNumericFields(rawParsed as Record<string, unknown>)
        : rawParsed
      const diagnostic = validateGeminiResult(coerced)
      if (!diagnostic.valid) {
        console.error(
          `Gemini receipt validation failed: field="${diagnostic.failedField}" expected="${diagnostic.expectedType}" actual="${diagnostic.actualType}" value="${diagnostic.actualValue}"`
        )
        throw new functions.https.HttpsError(
          'internal',
          'Receipt analysis returned unexpected format. Please try again.'
        )
      }
      const parsed = coerced as GeminiAnalysisResult

      // Log successful analysis (helpful for monitoring)
      console.log(`Receipt analyzed: transaction ${transactionId}`)

      // =========================================================================
      // STEP 3: Store pre-processed images (reuse buffers - no double processing)
      // Story 14.15b: Skip storage for re-scans (images already stored)
      // =========================================================================
      let imageUrls: string[] | undefined
      let thumbnailUrl: string | undefined

      if (!isRescan && thumbnailBuffer) {
        try {
          // Upload pre-processed images to Firebase Storage (already compressed)
          const uploadResult = await uploadReceiptImages(
            userId,
            transactionId,
            fullSizeBuffers,
            thumbnailBuffer
          )

          imageUrls = uploadResult.imageUrls
          thumbnailUrl = uploadResult.thumbnailUrl

          console.log(`Images stored for transaction ${transactionId}: ${imageUrls.length} images + thumbnail`)
        } catch (storageError) {
          // Log storage error but don't fail the transaction
          console.error(`Image storage failed for transaction ${transactionId}:`, storageError)
          // Continue without images - transaction data is still valuable
        }
      } else {
        // For re-scans, return the original URLs (passed in as images)
        imageUrls = data.images
        console.log(`Re-scan complete for ${data.images.length} images`)
      }

      // Get prompt version for tracking (Story 9.1)
      const activePrompt = getActivePrompt(data.promptContext)

      // Return combined response with v2.6.0 tracking fields
      return {
        ...parsed,
        transactionId,
        imageUrls,
        thumbnailUrl,
        // Story 9.1: Add tracking fields for new transaction fields
        promptVersion: activePrompt.version,
        merchantSource: 'scan' as const,
        // Flatten receiptType from metadata for client convenience
        receiptType: parsed.metadata?.receiptType
      }
    } catch (error) {
      console.error('Error analyzing receipt:', error)

      // Re-throw HttpsError instances directly (e.g., from validation functions)
      if (error instanceof functions.https.HttpsError) {
        throw error
      }

      // Provide user-friendly error message for other errors
      if (error instanceof Error) {
        throw new functions.https.HttpsError(
          'internal',
          'Failed to analyze receipt. Please try again or enter manually.'
        )
      }

      throw new functions.https.HttpsError(
        'internal',
        'Failed to analyze receipt. Please try again or enter manually.'
      )
    }
  }
)
