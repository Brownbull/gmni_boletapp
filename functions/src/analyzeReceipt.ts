import * as functions from 'firebase-functions'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

interface AnalyzeReceiptResponse {
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

    try {
      const genAI = getGenAI()
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

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

      const parsed: AnalyzeReceiptResponse = JSON.parse(cleanedText)

      // Log successful analysis (helpful for monitoring)
      console.log(`Receipt analyzed for user ${context.auth.uid}: ${parsed.merchant}`)

      return parsed
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
