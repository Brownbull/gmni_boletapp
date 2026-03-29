/**
 * cleanupPendingScans — Scheduled Function (Story 18-13a)
 *
 * Runs every 60 minutes to:
 * 1. Auto-fail stale processing scans (past deadline) with credit refund
 * 2. Delete expired scans (older than 24h), triggering onDelete cascade
 *
 * MUST be pubsub.schedule only — NOT exposed as HTTP endpoint (AC-ARCH-NO-5).
 * Batch deletes chunked at 500 ops (AC-ARCH-PATTERN-8).
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp()
}

const APP_ID = 'boletapp-d609f'
const BATCH_SIZE = 500
const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours (all docs)
const RESOLVED_TTL_MS = 60 * 60 * 1000 // 1 hour (completed/failed docs)

export const cleanupPendingScans = functions.pubsub
  .schedule('every 60 minutes')
  .timeZone('UTC')
  .onRun(async () => {
    const db = admin.firestore()
    const now = Date.now()
    const cutoff = admin.firestore.Timestamp.fromMillis(now - TTL_MS)
    const nowTimestamp = admin.firestore.Timestamp.fromMillis(now)

    let autoFailedCount = 0
    let deletedCount = 0

    // Phase 1: Auto-fail stale processing scans (past processingDeadline)
    const staleQuery = db.collection('pending_scans')
      .where('status', '==', 'processing')
      .where('processingDeadline', '<', nowTimestamp)
      .limit(BATCH_SIZE)

    const staleSnapshot = await staleQuery.get()
    for (const doc of staleSnapshot.docs) {
      const data = doc.data()
      const userId: string = data.userId
      const creditsRef = db.doc(`artifacts/${APP_ID}/users/${userId}/credits/balance`)

      await db.runTransaction(async (transaction) => {
        const creditsSnap = await transaction.get(creditsRef)
        const credits = creditsSnap.data()
        transaction.update(creditsRef, {
          remaining: (credits?.remaining ?? 0) + 1,
          used: Math.max(0, (credits?.used ?? 0) - 1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
        transaction.update(doc.ref, {
          status: 'failed',
          error: 'Processing deadline exceeded',
          creditDeducted: false,
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      })
      autoFailedCount++
    }

    // Phase 2: Delete resolved docs (completed/failed) older than 1 hour
    const resolvedCutoff = admin.firestore.Timestamp.fromMillis(now - RESOLVED_TTL_MS)
    let resolvedDeletedCount = 0
    for (const status of ['completed', 'failed'] as const) {
      const resolvedQuery = db.collection('pending_scans')
        .where('status', '==', status)
        .where('createdAt', '<', resolvedCutoff)
        .limit(BATCH_SIZE)

      const resolvedSnapshot = await resolvedQuery.get()
      if (!resolvedSnapshot.empty) {
        const batch = db.batch()
        for (const doc of resolvedSnapshot.docs) {
          batch.delete(doc.ref)
        }
        await batch.commit()
        resolvedDeletedCount += resolvedSnapshot.size
      }
    }

    // Phase 3: Delete all docs older than 24h (catch-all), paginated
    let hasMore = true
    while (hasMore) {
      const expiredQuery = db.collection('pending_scans')
        .where('createdAt', '<', cutoff)
        .limit(BATCH_SIZE)

      const expiredSnapshot = await expiredQuery.get()

      if (expiredSnapshot.empty) {
        hasMore = false
        break
      }

      const batch = db.batch()
      for (const doc of expiredSnapshot.docs) {
        batch.delete(doc.ref)
      }
      await batch.commit()
      deletedCount += expiredSnapshot.size

      // If we got fewer than BATCH_SIZE, we're done
      if (expiredSnapshot.size < BATCH_SIZE) {
        hasMore = false
      }
    }

    console.log(
      `cleanupPendingScans: auto-failed=${autoFailedCount}, resolved-deleted=${resolvedDeletedCount}, expired-deleted=${deletedCount}`
    )
  })
