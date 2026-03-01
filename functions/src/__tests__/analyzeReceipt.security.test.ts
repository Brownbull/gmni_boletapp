/**
 * TD-15b-36: Security hardening tests for analyzeReceipt Cloud Function
 * Tests: SSRF prevention (AC1/AC2), response schema validation (AC3),
 *        error message sanitization (AC4), rate limiter docs (AC5 — no test needed)
 */
const functionsTest = require('firebase-functions-test')

const test = functionsTest()

// Mock Gemini AI — default returns valid response
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({
              merchant: 'Test Market',
              date: '2025-11-27',
              total: 15000,
              category: 'Supermarket',
              items: [
                { name: 'Milk', price: 1500, category: 'Fresh Food' },
                { name: 'Bread', price: 2000, category: 'Pantry' }
              ]
            })
          }
        })
      })
    }))
  }
})

// Mock image processing — isolate security tests from sharp dependency
jest.mock('../imageProcessing', () => ({
  base64ToBuffer: jest.fn().mockReturnValue(Buffer.from('fake-image')),
  resizeAndCompress: jest.fn().mockResolvedValue({ buffer: Buffer.from('fake-compressed') }),
  generateThumbnail: jest.fn().mockResolvedValue({ buffer: Buffer.from('fake-thumbnail') })
}))

// Mock storage service
jest.mock('../storageService', () => ({
  uploadReceiptImages: jest.fn().mockResolvedValue({
    imageUrls: ['https://storage.googleapis.com/bucket/image.jpg'],
    thumbnailUrl: 'https://storage.googleapis.com/bucket/thumb.jpg'
  })
}))

// Mock prompts
jest.mock('../prompts', () => ({
  buildPrompt: jest.fn().mockReturnValue('Analyze this receipt'),
  getActivePrompt: jest.fn().mockReturnValue({ version: '3.0.0' })
}))

// Set required environment variable
process.env.GEMINI_API_KEY = 'test-api-key'

import { analyzeReceipt } from '../analyzeReceipt'

// Shared auth context for all tests
const authContext = {
  auth: { uid: 'security-test-user', token: {} }
}

describe('analyzeReceipt Security Hardening (TD-15b-36)', () => {
  let wrapped: any

  beforeAll(() => {
    wrapped = test.wrap(analyzeReceipt)
  })

  afterAll(() => {
    test.cleanup()
  })

  describe('AC1: SSRF Prevention — URL Allowlist', () => {
    it('should reject re-scan with disallowed hostname', async () => {
      const data = {
        images: ['https://evil.example.com/malicious-image.jpg'],
        isRescan: true
      }

      await expect(wrapped(data, authContext)).rejects.toThrow(
        'Image URL origin is not permitted'
      )
    })

    it('should reject re-scan with internal network URL', async () => {
      const data = {
        images: ['https://169.254.169.254/latest/meta-data/'],
        isRescan: true
      }

      await expect(wrapped(data, authContext)).rejects.toThrow(
        'Image URL origin is not permitted'
      )
    })

    it('should reject re-scan with malformed URL', async () => {
      const data = {
        images: ['not-a-url-at-all'],
        isRescan: true
      }

      await expect(wrapped(data, authContext)).rejects.toThrow(
        'Invalid image URL format'
      )
    })
  })

  describe('AC2: HTTPS-Only URLs', () => {
    it('should reject http:// URL in re-scan', async () => {
      const data = {
        images: ['http://firebasestorage.googleapis.com/v0/b/bucket/o/image.jpg'],
        isRescan: true
      }

      await expect(wrapped(data, authContext)).rejects.toThrow(
        'Image URL must use HTTPS'
      )
    })

    it('should not detect http:// URL as re-scan trigger', async () => {
      // Without isRescan: true, http:// URL won't trigger re-scan path
      // because isUrl() now only accepts https://. Falls to base64 path.
      const data = {
        images: ['http://firebasestorage.googleapis.com/v0/b/bucket/o/image.jpg']
      }

      await expect(wrapped(data, authContext)).rejects.toThrow(
        'Invalid image format'
      )
    })
  })

  describe('AC3: Response Schema Validation', () => {
    it('should reject Gemini response missing required fields', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai')
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: () => ({
          generateContent: jest.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify({
                merchant: 'Test Market'
                // missing: date, total, category, items
              })
            }
          })
        })
      }))

      const data = {
        images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg=='],
        currency: 'CLP'
      }

      await expect(wrapped(data, authContext)).rejects.toThrow(
        'Receipt analysis returned unexpected format'
      )
    })

    it('should reject Gemini response with wrong field types', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai')
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: () => ({
          generateContent: jest.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify({
                merchant: 'Test Market',
                date: '2025-11-27',
                total: 'not-a-number',
                category: 'Supermarket',
                items: []
              })
            }
          })
        })
      }))

      const data = {
        images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg=='],
        currency: 'CLP'
      }

      await expect(wrapped(data, authContext)).rejects.toThrow(
        'Receipt analysis returned unexpected format'
      )
    })

    it('should reject Gemini response with invalid items', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai')
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: () => ({
          generateContent: jest.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify({
                merchant: 'Test Market',
                date: '2025-11-27',
                total: 15000,
                category: 'Supermarket',
                items: [{ name: 'Milk' }] // missing price
              })
            }
          })
        })
      }))

      const data = {
        images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg=='],
        currency: 'CLP'
      }

      await expect(wrapped(data, authContext)).rejects.toThrow(
        'Receipt analysis returned unexpected format'
      )
    })
  })

  describe('AC4: Error Message Sanitization', () => {
    it('should not expose upstream HTTP status in fetch errors', async () => {
      const originalFetch = global.fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden - bucket policy violation details'
      }) as unknown as typeof global.fetch

      const data = {
        images: ['https://firebasestorage.googleapis.com/v0/b/bucket/o/image.jpg'],
        isRescan: true
      }

      let caughtError: Error | undefined
      try {
        await wrapped(data, authContext)
      } catch (error: unknown) {
        caughtError = error as Error
      } finally {
        global.fetch = originalFetch
      }

      expect(caughtError).toBeDefined()
      expect(caughtError!.message).toContain('Failed to fetch image. Please try re-scanning.')
      expect(caughtError!.message).not.toContain('403')
      expect(caughtError!.message).not.toContain('Forbidden')
      expect(caughtError!.message).not.toContain('bucket policy')
    })
  })
})
