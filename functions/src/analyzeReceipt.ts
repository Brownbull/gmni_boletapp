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

    try {
      const genAI = getGenAI()
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

      // Convert base64 images to Gemini format
      const imageParts = data.images.map((b64: string) => {
        const match = b64.match(/^data:(.+);base64,(.+)$/)
        return {
          inlineData: {
            mimeType: match ? match[1] : 'image/jpeg',
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

      // Provide user-friendly error message
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
