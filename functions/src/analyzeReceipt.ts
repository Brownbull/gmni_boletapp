import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { base64ToBuffer, resizeAndCompress, generateThumbnail } from './imageProcessing'
import { uploadReceiptImages } from './storageService'
import { buildPrompt, getActivePrompt } from './prompts'
import type { ReceiptType } from './prompts'

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp()
}

// Initialize Gemini AI with API key from Firebase config
const getGenAI = () => {
  const apiKey = functions.config().gemini?.api_key || process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured')
  }
  return new GoogleGenerativeAI(apiKey)
}

// Rate limiting: Store user request timestamps in memory
// In production, consider using Cloud Firestore or Redis for distributed rate limiting
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

  // Check if user has exceeded the limit
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true // Rate limit exceeded
  }

  // Add current request timestamp
  recentRequests.push(now)
  requestTimestamps.set(userId, recentRequests)

  return false // Within rate limit
}

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
  const match = b64.match(/^data:(.+);base64,(.+)$/)

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
 * Story 14.15b: Fetch image from URL and return as Buffer
 * Used for re-scanning transactions with stored images
 * @param url Image URL (Firebase Storage download URL)
 * @returns Buffer containing image data
 */
async function fetchImageFromUrl(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Failed to fetch image from URL: ${response.status} ${response.statusText}`
    )
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Story 14.15b: Check if a string is a URL (for re-scan detection)
 */
function isUrl(str: string): boolean {
  return str.startsWith('http://') || str.startsWith('https://')
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
    price: number
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
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < 20; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
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

    // Story 14.15b: Detect if this is a re-scan (images are URLs, not base64)
    const isRescan = data.isRescan || (data.images.length > 0 && isUrl(data.images[0]))

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
      // Using stable GA model - gemini-2.0-flash has better rate limits than experimental
      // Pricing: $0.10/1M input tokens, $0.40/1M output tokens
      const model = genAI.getGenerativeModel(
        { model: 'gemini-2.0-flash' },
        { apiVersion: 'v1beta' }
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

      // Call Gemini API with optimized images
      const result = await model.generateContent([
        { text: prompt },
        ...imageParts
      ])

      const response = result.response
      const text = response.text()

      // Parse JSON response (use same cleanJson logic as client)
      const cleanedText = text
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .replace(/^```\s*/i, '')
        .trim()

      const parsed: GeminiAnalysisResult = JSON.parse(cleanedText)

      // Log successful analysis (helpful for monitoring)
      console.log(`Receipt analyzed for user ${userId}: ${parsed.merchant}`)

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
          'Failed to analyze receipt. Please try again or enter manually.',
          error.message
        )
      }

      throw new functions.https.HttpsError(
        'internal',
        'Failed to analyze receipt. Please try again or enter manually.'
      )
    }
  }
)
