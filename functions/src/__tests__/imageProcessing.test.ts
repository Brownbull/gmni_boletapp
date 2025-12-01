import sharp from 'sharp'
import {
  IMAGE_CONFIG,
  resizeAndCompress,
  generateThumbnail,
  base64ToBuffer,
  processReceiptImages
} from '../imageProcessing'

// Helper to create a test image buffer of specific dimensions
async function createTestImage(width: number, height: number, format: 'jpeg' | 'png' | 'webp' = 'jpeg'): Promise<Buffer> {
  const image = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 128, b: 64 }
    }
  })

  if (format === 'jpeg') {
    return image.jpeg().toBuffer()
  } else if (format === 'png') {
    return image.png().toBuffer()
  } else {
    return image.webp().toBuffer()
  }
}

// Helper to create a base64 data URI from a buffer
function bufferToDataUri(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

describe('imageProcessing', () => {
  describe('IMAGE_CONFIG', () => {
    it('should have correct full-size dimensions', () => {
      expect(IMAGE_CONFIG.fullSize.maxWidth).toBe(1200)
      expect(IMAGE_CONFIG.fullSize.maxHeight).toBe(1600)
      expect(IMAGE_CONFIG.fullSize.quality).toBe(80)
      expect(IMAGE_CONFIG.fullSize.format).toBe('jpeg')
    })

    it('should have correct thumbnail dimensions', () => {
      expect(IMAGE_CONFIG.thumbnail.width).toBe(120)
      expect(IMAGE_CONFIG.thumbnail.height).toBe(160)
      expect(IMAGE_CONFIG.thumbnail.quality).toBe(70)
      expect(IMAGE_CONFIG.thumbnail.format).toBe('jpeg')
    })
  })

  describe('base64ToBuffer', () => {
    it('should convert valid base64 data URI to buffer', async () => {
      const testBuffer = await createTestImage(100, 100)
      const dataUri = bufferToDataUri(testBuffer, 'image/jpeg')

      const result = base64ToBuffer(dataUri)

      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should throw error for invalid data URI format', () => {
      expect(() => base64ToBuffer('not-a-valid-uri')).toThrow('Invalid base64 data URI format')
    })

    it('should throw error for missing base64 data', () => {
      expect(() => base64ToBuffer('data:image/jpeg;base64,')).toThrow('Invalid base64 data URI format')
    })

    it('should handle different MIME types', async () => {
      const testBuffer = await createTestImage(100, 100, 'png')
      const dataUri = bufferToDataUri(testBuffer, 'image/png')

      const result = base64ToBuffer(dataUri)
      expect(result).toBeInstanceOf(Buffer)
    })
  })

  describe('resizeAndCompress', () => {
    it('should maintain aspect ratio for landscape images', async () => {
      // Create a 2000x1000 landscape image
      const inputBuffer = await createTestImage(2000, 1000)

      const result = await resizeAndCompress(inputBuffer)

      // Should resize to max 1200 width, height proportionally scaled
      expect(result.width).toBe(1200)
      expect(result.height).toBe(600)
      expect(result.format).toBe('jpeg')
    })

    it('should maintain aspect ratio for portrait images', async () => {
      // Create a 1000x2000 portrait image
      const inputBuffer = await createTestImage(1000, 2000)

      const result = await resizeAndCompress(inputBuffer)

      // Should resize to max 1600 height, width proportionally scaled
      expect(result.width).toBe(800)
      expect(result.height).toBe(1600)
      expect(result.format).toBe('jpeg')
    })

    it('should not upscale small images', async () => {
      // Create a 500x400 small image
      const inputBuffer = await createTestImage(500, 400)

      const result = await resizeAndCompress(inputBuffer)

      // Should remain at original size (no upscaling)
      expect(result.width).toBe(500)
      expect(result.height).toBe(400)
    })

    it('should resize large images to within max dimensions', async () => {
      // Create a 3000x4000 large image
      const inputBuffer = await createTestImage(3000, 4000)

      const result = await resizeAndCompress(inputBuffer)

      // Should fit within 1200x1600
      expect(result.width).toBeLessThanOrEqual(IMAGE_CONFIG.fullSize.maxWidth)
      expect(result.height).toBeLessThanOrEqual(IMAGE_CONFIG.fullSize.maxHeight)
    })

    it('should convert PNG to JPEG', async () => {
      const inputBuffer = await createTestImage(500, 500, 'png')

      const result = await resizeAndCompress(inputBuffer)

      expect(result.format).toBe('jpeg')
    })

    it('should convert WebP to JPEG', async () => {
      const inputBuffer = await createTestImage(500, 500, 'webp')

      const result = await resizeAndCompress(inputBuffer)

      expect(result.format).toBe('jpeg')
    })

    it('should produce compressed output', async () => {
      const inputBuffer = await createTestImage(1200, 1600)
      const inputSize = inputBuffer.length

      const result = await resizeAndCompress(inputBuffer)

      // Compressed JPEG should be smaller than uncompressed
      expect(result.buffer.length).toBeLessThan(inputSize * 1.5)
    })

    it('should return valid ProcessedImage object', async () => {
      const inputBuffer = await createTestImage(800, 600)

      const result = await resizeAndCompress(inputBuffer)

      expect(result).toHaveProperty('buffer')
      expect(result).toHaveProperty('width')
      expect(result).toHaveProperty('height')
      expect(result).toHaveProperty('format')
      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(typeof result.width).toBe('number')
      expect(typeof result.height).toBe('number')
    })
  })

  describe('generateThumbnail', () => {
    it('should generate thumbnail with correct dimensions', async () => {
      const inputBuffer = await createTestImage(1200, 1600)

      const result = await generateThumbnail(inputBuffer)

      expect(result.width).toBe(120)
      expect(result.height).toBe(160)
      expect(result.format).toBe('jpeg')
    })

    it('should generate thumbnail from small images', async () => {
      const inputBuffer = await createTestImage(50, 50)

      const result = await generateThumbnail(inputBuffer)

      // Should upscale to thumbnail size with cover fit
      expect(result.width).toBe(120)
      expect(result.height).toBe(160)
    })

    it('should generate thumbnail from landscape images', async () => {
      const inputBuffer = await createTestImage(2000, 500)

      const result = await generateThumbnail(inputBuffer)

      // Cover fit should crop to fill 120x160
      expect(result.width).toBe(120)
      expect(result.height).toBe(160)
    })

    it('should produce small file size', async () => {
      const inputBuffer = await createTestImage(2000, 2000)

      const result = await generateThumbnail(inputBuffer)

      // Thumbnail should be small (under 20KB typically)
      expect(result.buffer.length).toBeLessThan(20 * 1024)
    })

    it('should convert non-JPEG to JPEG', async () => {
      const inputBuffer = await createTestImage(500, 500, 'png')

      const result = await generateThumbnail(inputBuffer)

      expect(result.format).toBe('jpeg')
    })
  })

  describe('processReceiptImages', () => {
    it('should throw error for empty images array', async () => {
      await expect(processReceiptImages([])).rejects.toThrow('At least one image is required')
    })

    it('should process single image and generate thumbnail', async () => {
      const inputBuffer = await createTestImage(1500, 2000)
      const dataUri = bufferToDataUri(inputBuffer, 'image/jpeg')

      const result = await processReceiptImages([dataUri])

      expect(result.fullSizeBuffers).toHaveLength(1)
      expect(result.thumbnailBuffer).toBeInstanceOf(Buffer)
    })

    it('should process multiple images', async () => {
      const images = await Promise.all([
        createTestImage(1500, 2000),
        createTestImage(1200, 1600),
        createTestImage(800, 1000)
      ])
      const dataUris = images.map(img => bufferToDataUri(img, 'image/jpeg'))

      const result = await processReceiptImages(dataUris)

      expect(result.fullSizeBuffers).toHaveLength(3)
      expect(result.thumbnailBuffer).toBeInstanceOf(Buffer)
    })

    it('should generate thumbnail from first image only', async () => {
      // First image is small, second is large
      const smallImage = await createTestImage(100, 100)
      const largeImage = await createTestImage(2000, 3000)

      const dataUris = [
        bufferToDataUri(smallImage, 'image/jpeg'),
        bufferToDataUri(largeImage, 'image/jpeg')
      ]

      const result = await processReceiptImages(dataUris)

      // Thumbnail should be 120x160 regardless of source
      const thumbnailMeta = await sharp(result.thumbnailBuffer).metadata()
      expect(thumbnailMeta.width).toBe(120)
      expect(thumbnailMeta.height).toBe(160)
    })

    it('should process mixed format images', async () => {
      const jpegImage = await createTestImage(800, 600, 'jpeg')
      const pngImage = await createTestImage(900, 700, 'png')
      const webpImage = await createTestImage(1000, 800, 'webp')

      const dataUris = [
        bufferToDataUri(jpegImage, 'image/jpeg'),
        bufferToDataUri(pngImage, 'image/png'),
        bufferToDataUri(webpImage, 'image/webp')
      ]

      const result = await processReceiptImages(dataUris)

      expect(result.fullSizeBuffers).toHaveLength(3)

      // Verify all outputs are JPEG
      for (const buffer of result.fullSizeBuffers) {
        const meta = await sharp(buffer).metadata()
        expect(meta.format).toBe('jpeg')
      }
    })

    it('should resize oversized images during processing', async () => {
      const oversizedImage = await createTestImage(3000, 4000)
      const dataUri = bufferToDataUri(oversizedImage, 'image/jpeg')

      const result = await processReceiptImages([dataUri])

      const outputMeta = await sharp(result.fullSizeBuffers[0]).metadata()
      expect(outputMeta.width).toBeLessThanOrEqual(1200)
      expect(outputMeta.height).toBeLessThanOrEqual(1600)
    })
  })

  describe('Edge Cases', () => {
    it('should handle square images', async () => {
      const inputBuffer = await createTestImage(1500, 1500)

      const result = await resizeAndCompress(inputBuffer)

      // Square 1500x1500 should resize to 1200x1200 (limited by width)
      expect(result.width).toBe(1200)
      expect(result.height).toBe(1200)
    })

    it('should handle very small images', async () => {
      const inputBuffer = await createTestImage(10, 10)

      const result = await resizeAndCompress(inputBuffer)

      // Should not upscale
      expect(result.width).toBe(10)
      expect(result.height).toBe(10)
    })

    it('should handle images exactly at max dimensions', async () => {
      const inputBuffer = await createTestImage(1200, 1600)

      const result = await resizeAndCompress(inputBuffer)

      // Should remain unchanged
      expect(result.width).toBe(1200)
      expect(result.height).toBe(1600)
    })

    it('should handle tall narrow images', async () => {
      const inputBuffer = await createTestImage(200, 3000)

      const result = await resizeAndCompress(inputBuffer)

      // Height is limiting factor
      expect(result.height).toBe(1600)
      expect(result.width).toBeLessThan(200)
    })

    it('should handle wide short images', async () => {
      const inputBuffer = await createTestImage(3000, 200)

      const result = await resizeAndCompress(inputBuffer)

      // Width is limiting factor
      expect(result.width).toBe(1200)
      expect(result.height).toBeLessThan(200)
    })
  })
})
