import * as functions from 'firebase-functions'
import { deleteTransactionImages as deleteStorageImages } from './storageService'

/**
 * Firestore trigger that deletes associated images when a transaction is deleted.
 * This ensures cascade delete of Storage images to prevent orphaned files.
 *
 * Path: /artifacts/{appId}/users/{userId}/transactions/{transactionId}
 *
 * The function:
 * 1. Fires when a transaction document is deleted
 * 2. Extracts userId and transactionId from the document path
 * 3. Deletes the entire Storage folder at `users/{userId}/receipts/{transactionId}/`
 *
 * Error Handling:
 * - Storage deletion failures are logged but don't throw errors
 * - The transaction is already deleted, so we can't reverse that
 * - Orphaned images are acceptable (cleanup job can be added later)
 */
export const onTransactionDeleted = functions.firestore
  .document('artifacts/{appId}/users/{userId}/transactions/{transactionId}')
  .onDelete(async (snapshot, context) => {
    const { userId, transactionId } = context.params

    console.log(`Transaction deleted: ${transactionId} (user: ${userId})`)

    try {
      // Delete associated images from Storage
      await deleteStorageImages(userId, transactionId)
      console.log(`Cascade delete completed for transaction ${transactionId}`)
    } catch (error) {
      // Log error but don't throw - transaction is already deleted
      // Orphaned images can be cleaned up by a separate maintenance job
      console.error(`Cascade delete failed for transaction ${transactionId}:`, error)
    }
  })
