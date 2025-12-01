import * as admin from 'firebase-admin'

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp()
}

/**
 * Storage path pattern for receipt images:
 * users/{userId}/receipts/{transactionId}/image-{index}.jpg
 * users/{userId}/receipts/{transactionId}/thumbnail.jpg
 */

/**
 * Generate the storage path for a full-size image
 */
export function getImagePath(userId: string, transactionId: string, index: number): string {
  return `users/${userId}/receipts/${transactionId}/image-${index}.jpg`
}

/**
 * Generate the storage path for a thumbnail
 */
export function getThumbnailPath(userId: string, transactionId: string): string {
  return `users/${userId}/receipts/${transactionId}/thumbnail.jpg`
}

/**
 * Upload a full-size image to Firebase Storage
 *
 * @param userId - User's Firebase Auth UID
 * @param transactionId - Transaction document ID
 * @param buffer - Processed image buffer (JPEG)
 * @param index - Image index (0-based)
 * @returns Download URL for the uploaded image
 */
export async function uploadImage(
  userId: string,
  transactionId: string,
  buffer: Buffer,
  index: number
): Promise<string> {
  const bucket = admin.storage().bucket()
  const filePath = getImagePath(userId, transactionId, index)
  const file = bucket.file(filePath)

  await file.save(buffer, {
    contentType: 'image/jpeg',
    metadata: {
      cacheControl: 'public, max-age=31536000' // 1 year cache
    },
    public: true // Make file publicly accessible
  })

  // Return the public URL (no signing required)
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`
  return publicUrl
}

/**
 * Upload a thumbnail to Firebase Storage
 *
 * @param userId - User's Firebase Auth UID
 * @param transactionId - Transaction document ID
 * @param buffer - Processed thumbnail buffer (JPEG)
 * @returns Download URL for the uploaded thumbnail
 */
export async function uploadThumbnail(
  userId: string,
  transactionId: string,
  buffer: Buffer
): Promise<string> {
  const bucket = admin.storage().bucket()
  const filePath = getThumbnailPath(userId, transactionId)
  const file = bucket.file(filePath)

  await file.save(buffer, {
    contentType: 'image/jpeg',
    metadata: {
      cacheControl: 'public, max-age=31536000' // 1 year cache
    },
    public: true // Make file publicly accessible
  })

  // Return the public URL (no signing required)
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`
  return publicUrl
}

/**
 * Upload all processed receipt images and thumbnail to Firebase Storage
 *
 * @param userId - User's Firebase Auth UID
 * @param transactionId - Transaction document ID
 * @param fullSizeBuffers - Array of processed full-size image buffers
 * @param thumbnailBuffer - Processed thumbnail buffer
 * @returns Object with imageUrls array and thumbnailUrl
 */
export async function uploadReceiptImages(
  userId: string,
  transactionId: string,
  fullSizeBuffers: Buffer[],
  thumbnailBuffer: Buffer
): Promise<{ imageUrls: string[]; thumbnailUrl: string }> {
  // Upload all full-size images in parallel
  const imageUrlPromises = fullSizeBuffers.map((buffer, index) =>
    uploadImage(userId, transactionId, buffer, index)
  )

  // Upload thumbnail
  const thumbnailUrlPromise = uploadThumbnail(userId, transactionId, thumbnailBuffer)

  // Wait for all uploads
  const [imageUrls, thumbnailUrl] = await Promise.all([
    Promise.all(imageUrlPromises),
    thumbnailUrlPromise
  ])

  return { imageUrls, thumbnailUrl }
}

/**
 * Delete all images associated with a transaction
 * Used for cascade delete when transaction is deleted
 *
 * @param userId - User's Firebase Auth UID
 * @param transactionId - Transaction document ID
 */
export async function deleteTransactionImages(
  userId: string,
  transactionId: string
): Promise<void> {
  const bucket = admin.storage().bucket()
  const folderPath = `users/${userId}/receipts/${transactionId}/`

  try {
    // List all files in the transaction folder
    const [files] = await bucket.getFiles({ prefix: folderPath })

    if (files.length === 0) {
      console.log(`No images found for transaction ${transactionId}`)
      return
    }

    // Delete all files
    await Promise.all(files.map(file => file.delete()))

    console.log(`Deleted ${files.length} images for transaction ${transactionId}`)
  } catch (error) {
    // Log but don't throw - orphaned images are acceptable
    console.error(`Failed to delete images for transaction ${transactionId}:`, error)
  }
}
