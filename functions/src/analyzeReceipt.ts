import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { processReceiptImages } from './imageProcessing'
import { uploadReceiptImages } from './storageService'

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
  currency: string
}

/**
 * Response from Gemini AI analysis (parsed from receipt)
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
  }>
}

/**
 * Full response from analyzeReceipt Cloud Function
 * Includes Gemini analysis plus image storage URLs
 */
interface AnalyzeReceiptResponse extends GeminiAnalysisResult {
  transactionId: string        // Pre-generated ID for Firestore document
  imageUrls?: string[]         // Full-size image download URLs
  thumbnailUrl?: string        // Thumbnail download URL
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

    if (!data.currency || typeof data.currency !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'currency string is required'
      )
    }

    // Validate image size and count
    validateImages(data.images)

    // Generate transaction ID upfront (needed for storage path)
    const transactionId = generateTransactionId()

    try {
      const genAI = getGenAI()
      // Using stable GA model - gemini-2.0-flash has better rate limits than experimental
      // Pricing: $0.10/1M input tokens, $0.40/1M output tokens
      const model = genAI.getGenerativeModel(
        { model: 'gemini-2.0-flash' },
        { apiVersion: 'v1beta' }
      )

      // Convert base64 images to Gemini format with strict MIME type validation
      const imageParts = data.images.map((b64: string) => {
        const mimeType = extractMimeType(b64)
        const match = b64.match(/^data:(.+);base64,(.+)$/)
        return {
          inlineData: {
            mimeType,
            data: match ? match[2] : b64
          }
        }
      })

      // Build prompt (matching existing logic from src/services/gemini.ts)
      const todayStr = new Date().toISOString().split('T')[0]
      const prompt = `Analyze receipt. Context: ${data.currency}. Today: ${todayStr}. Strict JSON output. Return 'total' and 'price' as INTEGERS (no dots/commas). Extract: merchant (store name), date (YYYY-MM-DD), total, category (one of: Supermarket, Restaurant, Bakery, Butcher, Bazaar, Veterinary, PetShop, Medical, Pharmacy, Technology, StreetVendor, Transport, Services, Other). Items: name, price, category (Fresh Food, Pantry, Drinks, Household, Personal Care, Pets, Electronics, Apparel, Other), subcategory. If multiple dates, choose closest to today.`

      // Call Gemini API
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

      // Process and store images (graceful failure - don't fail transaction if storage fails)
      let imageUrls: string[] | undefined
      let thumbnailUrl: string | undefined

      try {
        // Process images: resize, compress, generate thumbnail
        const { fullSizeBuffers, thumbnailBuffer } = await processReceiptImages(data.images)

        // Upload to Firebase Storage
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

      // Return combined response
      return {
        ...parsed,
        transactionId,
        imageUrls,
        thumbnailUrl
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
