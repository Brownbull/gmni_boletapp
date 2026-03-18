/**
 * queueReceiptScan — HTTPS Callable (Story 18-13a)
 *
 * Accepts a scan request, deducts credit atomically, creates a pending scan
 * document, and returns immediately. The heavy Gemini processing happens
 * asynchronously in the processReceiptScan onCreate trigger.
 *
 * - Authentication: Required (Firebase Auth)
 * - Rate Limit: 10 requests/minute/user (in-memory)
 * - Idempotent: existing pending doc returns scanId without re-deducting
 * - Credit deduction + doc creation in single runTransaction (TOCTOU-safe)
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { RECEIPT_TYPES } from './prompts'
import type { ReceiptType } from './prompts'

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp()
}

/** App ID for Firestore credit paths */
const APP_ID = 'boletapp-d609f'

/** Processing deadline: 5 minutes from creation */
const PROCESSING_DEADLINE_MS = 5 * 60 * 1000

// SSRF prevention: only accept images from trusted Firebase Storage origins
const ALLOWED_URL_ORIGINS: readonly string[] = [
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
]

// UUID v1-v5 format validation (prevents path-traversal in scanId)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Rate limiting (in-memory, same accepted-risk pattern as analyzeReceipt)
const requestTimestamps = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 10

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

/** Maximum number of images per scan */
const MAX_IMAGE_COUNT = 5

/**
 * Validates that a URL is safe to fetch (SSRF prevention).
 * Reused pattern from analyzeReceipt (TD-15b-36).
 */
function validateImageUrl(url: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid image URL format')
  }
  if (parsed.protocol !== 'https:') {
    throw new functions.https.HttpsError('invalid-argument', 'Image URL must use HTTPS')
  }
  if (!ALLOWED_URL_ORIGINS.includes(parsed.hostname)) {
    throw new functions.https.HttpsError('invalid-argument', 'Image URL origin is not permitted')
  }
}

interface QueueReceiptScanRequest {
  scanId: string
  imageUrls: string[]
  receiptType?: ReceiptType
}

interface QueueReceiptScanResponse {
  scanId: string
}

export const queueReceiptScan = functions.https.onCall(
  async (
    data: QueueReceiptScanRequest,
    context: functions.https.CallableContext
  ): Promise<QueueReceiptScanResponse> => {
    // 1. Auth check
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
    }
    const userId = context.auth.uid

    // 2. Rate limit
    if (checkRateLimit(userId)) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Rate limit exceeded. Please wait before scanning again.'
      )
    }

    // 3. Validate scanId (UUID format — reject path-traversal)
    if (!data.scanId || typeof data.scanId !== 'string' || !UUID_REGEX.test(data.scanId)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'scanId must be a valid UUID v4'
      )
    }

    // 4. Validate imageUrls
    if (!Array.isArray(data.imageUrls) || data.imageUrls.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'imageUrls must be a non-empty array'
      )
    }
    if (data.imageUrls.length > MAX_IMAGE_COUNT) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Maximum ${MAX_IMAGE_COUNT} images allowed, received ${data.imageUrls.length}`
      )
    }
    for (const url of data.imageUrls) {
      validateImageUrl(url)
    }

    // 5. Validate receiptType if provided
    if (data.receiptType !== undefined) {
      if (!RECEIPT_TYPES.includes(data.receiptType)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Invalid receiptType'
        )
      }
    }

    // 6. Atomic: idempotency check + credit deduction + doc creation
    const db = admin.firestore()
    const pendingRef = db.doc(`pending_scans/${data.scanId}`)
    const creditsRef = db.doc(`artifacts/${APP_ID}/users/${userId}/credits/balance`)

    await db.runTransaction(async (transaction) => {
      const existingDoc = await transaction.get(pendingRef)

      // Idempotent: if doc exists, return without re-deducting
      if (existingDoc.exists) {
        return
      }

      // Read credits
      const creditsSnap = await transaction.get(creditsRef)
      const credits = creditsSnap.data()
      const remaining = credits?.remaining ?? 0

      if (remaining < 1) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          'Insufficient credits for scanning'
        )
      }

      // Deduct 1 credit
      transaction.update(creditsRef, {
        remaining: remaining - 1,
        used: (credits?.used ?? 0) + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      // Create pending scan doc
      const now = Date.now()
      transaction.set(pendingRef, {
        scanId: data.scanId,
        userId,
        status: 'processing',
        imageUrls: data.imageUrls,
        createdAt: admin.firestore.Timestamp.fromMillis(now),
        processingDeadline: admin.firestore.Timestamp.fromMillis(now + PROCESSING_DEADLINE_MS),
        creditDeducted: true,
        ...(data.receiptType !== undefined && { receiptType: data.receiptType }),
      })
    })

    return { scanId: data.scanId }
  }
)
