/**
 * Security hardening tests for analyzeReceipt Cloud Function
 * TD-15b-36: SSRF prevention (AC1/AC2), response schema validation (AC3),
 *            error message sanitization (AC4), rate limiter docs (AC5 — no test needed)
 * TD-15b-37: Mixed-array isRescan detection (AC1), receiptType runtime validation (AC2)
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
                { name: 'Milk', totalPrice: 1500, category: 'Fresh Food' },
                { name: 'Bread', totalPrice: 2000, category: 'Pantry' }
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

// Mock prompts — use real RECEIPT_TYPES to stay in sync with source of truth
jest.mock('../prompts', () => ({
  ...jest.requireActual('../prompts'),
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
    it('should coerce missing required fields to safe defaults', async () => {
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

      const result = await wrapped(data, authContext)
      expect(result.merchant).toBe('Test Market')
      expect(result.date).toBe(new Date().toISOString().split('T')[0])
      expect(result.category).toBe('Other')
      expect(result.total).toBe(0)
      expect(result.items).toEqual([])
    })

    it('should coerce wrong field types to safe defaults', async () => {
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

      const result = await wrapped(data, authContext)
      expect(result.total).toBe(0)
      expect(result.merchant).toBe('Test Market')
    })

    it('should filter out items missing totalPrice instead of rejecting', async () => {
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
                items: [{ name: 'Milk' }] // missing totalPrice
              })
            }
          })
        })
      }))

      const data = {
        images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg=='],
        currency: 'CLP'
      }

      const result = await wrapped(data, authContext)
      expect(result.total).toBe(15000)
      expect(result.items).toEqual([])
    })

    it('should still reject non-object Gemini responses', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai')
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: () => ({
          generateContent: jest.fn().mockResolvedValue({
            response: {
              text: () => '"just a string"'
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

describe('analyzeReceipt Input Validation Gaps (TD-15b-37)', () => {
  let wrapped: any
  // Use unique user IDs per test to avoid rate limit collisions
  let testCounter = 0
  const getAuthContext = () => ({
    auth: { uid: `td37-user-${++testCounter}`, token: {} }
  })

  beforeAll(() => {
    wrapped = test.wrap(analyzeReceipt)
  })

  afterAll(() => {
    test.cleanup()
  })

  describe('AC1: Mixed-array isRescan detection', () => {
    it('should reject mixed image array (base64 + URL)', async () => {
      const data = {
        images: [
          'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
          'https://firebasestorage.googleapis.com/v0/b/bucket/o/image.jpg'
        ]
      }

      await expect(wrapped(data, getAuthContext())).rejects.toThrow(
        'Mixed image types are not supported'
      )
    })

    it('should reject mixed image array (URL + base64)', async () => {
      const data = {
        images: [
          'https://firebasestorage.googleapis.com/v0/b/bucket/o/image.jpg',
          'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
        ]
      }

      await expect(wrapped(data, getAuthContext())).rejects.toThrow(
        'Mixed image types are not supported'
      )
    })

    it('should reject isRescan=true with base64 images via URL validation', async () => {
      // When isRescan=true, code enters URL fetch path.
      // data: URIs are valid URL format but fail HTTPS protocol check.
      const data = {
        images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg=='],
        isRescan: true
      }

      await expect(wrapped(data, getAuthContext())).rejects.toThrow(
        'Image URL must use HTTPS'
      )
    })

    it('should treat all-URL array as re-scan without explicit flag', async () => {
      const originalFetch = global.fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      }) as unknown as typeof global.fetch

      try {
        const data = {
          images: ['https://firebasestorage.googleapis.com/v0/b/bucket/o/image.jpg']
        }

        const result = await wrapped(data, getAuthContext())
        // Re-scan path: images returned as-is (no storage upload)
        expect(result.imageUrls).toEqual(data.images)
      } finally {
        global.fetch = originalFetch
      }
    })

    it('should auto-detect URLs as re-scan even with isRescan=false', async () => {
      const originalFetch = global.fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      }) as unknown as typeof global.fetch

      try {
        const data = {
          images: ['https://firebasestorage.googleapis.com/v0/b/bucket/o/image.jpg'],
          isRescan: false
        }

        // isRescan=false is not === true, so classifyImages runs and detects URLs
        const result = await wrapped(data, getAuthContext())
        expect(result.imageUrls).toEqual(data.images)
      } finally {
        global.fetch = originalFetch
      }
    })
  })

  describe('AC2: receiptType runtime validation', () => {
    it('should reject invalid receiptType value', async () => {
      const data = {
        images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg=='],
        receiptType: 'sql_injection_attempt'
      }

      await expect(wrapped(data, getAuthContext())).rejects.toThrow(
        'Invalid receipt type'
      )
    })

    it('should accept valid receiptType value', async () => {
      const data = {
        images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg=='],
        receiptType: 'supermarket'
      }

      const result = await wrapped(data, getAuthContext())
      expect(result).toBeDefined()
      expect(result.merchant).toBe('Test Market')
    })

    it('should accept omitted receiptType (defaults to auto)', async () => {
      const data = {
        images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg==']
      }

      const result = await wrapped(data, getAuthContext())
      expect(result).toBeDefined()
    })
  })
})
