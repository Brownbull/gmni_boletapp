/**
 * onPendingScanDeleted — Firestore onDelete Trigger (Story 18-13a)
 *
 * Fires when a pending_scans/{scanId} document is deleted (user cancel or
 * cleanup cascade). Refunds credit if still deducted, deletes Storage images.
 *
 * Credit refund logic:
 * - creditDeducted=true → processor didn't handle it → refund via transaction
 * - creditDeducted=false → processor already refunded → skip (prevents double-refund)
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { deletePendingScanImages } from './storageService'

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp()
}

const APP_ID = 'boletapp-d609f'

export const onPendingScanDeleted = functions.firestore
  .document('pending_scans/{scanId}')
  .onDelete(async (snapshot, context) => {
    const scanId = context.params.scanId
    const data = snapshot.data()
    const userId: string = data.userId

    // Refund credit only if processor didn't already refund
    if (data.creditDeducted === true) {
      const db = admin.firestore()
      const creditsRef = db.doc(`artifacts/${APP_ID}/users/${userId}/credits/balance`)

      await db.runTransaction(async (transaction) => {
        const creditsSnap = await transaction.get(creditsRef)
        const credits = creditsSnap.data()
        transaction.update(creditsRef, {
          remaining: (credits?.remaining ?? 0) + 1,
          used: Math.max(0, (credits?.used ?? 0) - 1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      })

      console.log(`onPendingScanDeleted: refunded credit for scan ${scanId}`)
    }

    // Only delete Storage images for non-completed scans.
    // Completed scans have thumbnailUrl referenced by saved transactions.
    if (data.status !== 'completed') {
      await deletePendingScanImages(userId, scanId)
    }
  })
