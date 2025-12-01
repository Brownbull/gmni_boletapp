import sharp from 'sharp'

/**
 * Image processing configuration constants
 * Defined per tech-spec for consistent image normalization
 */
export const IMAGE_CONFIG = {
  fullSize: {
    maxWidth: 1200,
    maxHeight: 1600,
    quality: 80,
    format: 'jpeg' as const
  },
  thumbnail: {
    width: 120,
    height: 160,
    quality: 70,
    format: 'jpeg' as const
  }
}

/**
 * Supported input image formats
 */
export const SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'heic', 'heif'] as const

/**
 * Result of image processing operation
 */
export interface ProcessedImage {
  buffer: Buffer
  width: number
  height: number
  format: string
}

/**
 * Resize and compress an image to full-size specifications
 * - Resizes to max 1200x1600px (maintains aspect ratio, no upscaling)
 * - Converts to JPEG with 80% quality
 * - Strips EXIF metadata
 *
 * @param inputBuffer - Raw image buffer (any supported format)
 * @returns Processed image buffer and metadata
 */
export async function resizeAndCompress(inputBuffer: Buffer): Promise<ProcessedImage> {
  // Process: resize (maintaining aspect ratio, no upscaling), convert to JPEG, strip metadata
  const processed = await sharp(inputBuffer)
    .resize(IMAGE_CONFIG.fullSize.maxWidth, IMAGE_CONFIG.fullSize.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .rotate() // Auto-rotate based on EXIF, then strip
    .jpeg({
      quality: IMAGE_CONFIG.fullSize.quality,
      mozjpeg: true // Better compression
    })
    .toBuffer({ resolveWithObject: true })

  return {
    buffer: processed.data,
    width: processed.info.width,
    height: processed.info.height,
    format: processed.info.format
  }
}

/**
 * Generate a thumbnail from an image
 * - Resizes to 120x160px using cover fit (crops to fill)
 * - Converts to JPEG with 70% quality
 * - Strips EXIF metadata
 *
 * @param inputBuffer - Raw image buffer (any supported format)
 * @returns Thumbnail buffer and metadata
 */
export async function generateThumbnail(inputBuffer: Buffer): Promise<ProcessedImage> {
  const processed = await sharp(inputBuffer)
    .resize(IMAGE_CONFIG.thumbnail.width, IMAGE_CONFIG.thumbnail.height, {
      fit: 'cover',
      position: 'centre'
    })
    .rotate() // Auto-rotate based on EXIF, then strip
    .jpeg({
      quality: IMAGE_CONFIG.thumbnail.quality,
      mozjpeg: true
    })
    .toBuffer({ resolveWithObject: true })

  return {
    buffer: processed.data,
    width: processed.info.width,
    height: processed.info.height,
    format: processed.info.format
  }
}

/**
 * Extract raw image data from a base64 data URI
 *
 * @param base64DataUri - Base64 string with data URI prefix (e.g., "data:image/jpeg;base64,...")
 * @returns Raw image buffer
 */
export function base64ToBuffer(base64DataUri: string): Buffer {
  const match = base64DataUri.match(/^data:(.+);base64,(.+)$/)
  if (!match || !match[2]) {
    throw new Error('Invalid base64 data URI format')
  }
  return Buffer.from(match[2], 'base64')
}

/**
 * Process multiple receipt images for storage
 * - Processes each image to full-size specification
 * - Generates single thumbnail from first image
 *
 * @param base64Images - Array of base64 data URI strings
 * @returns Processed full-size buffers and thumbnail buffer
 */
export async function processReceiptImages(base64Images: string[]): Promise<{
  fullSizeBuffers: Buffer[]
  thumbnailBuffer: Buffer
}> {
  if (base64Images.length === 0) {
    throw new Error('At least one image is required')
  }

  // Process all images to full-size
  const fullSizeBuffers: Buffer[] = []
  for (const base64 of base64Images) {
    const inputBuffer = base64ToBuffer(base64)
    const processed = await resizeAndCompress(inputBuffer)
    fullSizeBuffers.push(processed.buffer)
  }

  // Generate thumbnail from first image only
  const firstImageBuffer = base64ToBuffer(base64Images[0])
  const thumbnail = await generateThumbnail(firstImageBuffer)

  return {
    fullSizeBuffers,
    thumbnailBuffer: thumbnail.buffer
  }
}
