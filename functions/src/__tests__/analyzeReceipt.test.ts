const functionsTest = require('firebase-functions-test')

// Initialize Firebase Functions test environment
const test = functionsTest()

// Mock GoogleGenerativeAI before importing the function
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

// Set required environment variable for tests
process.env.GEMINI_API_KEY = 'test-api-key'

// Import the function after mocks are set up
import { analyzeReceipt } from '../analyzeReceipt'

describe('analyzeReceipt Cloud Function', () => {
  let wrapped: any

  beforeAll(() => {
    // Wrap the function for testing
    wrapped = test.wrap(analyzeReceipt)
  })

  afterAll(() => {
    // Clean up test environment
    test.cleanup()
  })

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      const data = {
        images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg=='],
        currency: 'CLP'
      }

      // Call without auth context
      await expect(wrapped(data, {})).rejects.toThrow('Must be logged in to analyze receipts')
    })

    it('should accept authenticated requests', async () => {
      const data = {
        images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg=='],
        currency: 'CLP'
      }

      const context = {
        auth: {
          uid: 'test-user-123',
          token: {}
        }
      }

      const result = await wrapped(data, context)

      expect(result).toBeDefined()
      expect(result.merchant).toBe('Test Market')
    })
  })

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const data = {
        images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg=='],
        currency: 'CLP'
      }

      const context = {
        auth: {
          uid: 'rate-limit-user-1',
          token: {}
        }
      }

      // Make 5 requests (within limit of 10)
      for (let i = 0; i < 5; i++) {
        const result = await wrapped(data, context)
        expect(result).toBeDefined()
      }
    })

    it('should reject requests exceeding rate limit', async () => {
      const data = {
        images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg=='],
        currency: 'CLP'
      }

      const context = {
        auth: {
          uid: 'rate-limit-user-2',
          token: {}
        }
      }

      // Make 11 requests (exceeds limit of 10)
      const requests = []
      for (let i = 0; i < 11; i++) {
        requests.push(wrapped(data, context).catch((e: any) => e))
      }

      const results = await Promise.all(requests)

      // At least one should be rate limited
      const rateLimited = results.some(
        (r) => r && r.message && r.message.includes('Rate limit exceeded')
      )
      expect(rateLimited).toBe(true)
    })
  })

  describe('Input Validation', () => {
    it('should reject missing images array', async () => {
      const data = {
        currency: 'CLP'
      } as any

      const context = {
        auth: {
          uid: 'test-user-456',
          token: {}
        }
      }

      await expect(wrapped(data, context)).rejects.toThrow('images array is required')
    })

    it('should reject empty images array', async () => {
      const data = {
        images: [],
        currency: 'CLP'
      }

      const context = {
        auth: {
          uid: 'test-user-789',
          token: {}
        }
      }

      await expect(wrapped(data, context)).rejects.toThrow('images array is required')
    })

    it('should reject missing currency', async () => {
      const data = {
        images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg==']
      } as any

      const context = {
        auth: {
          uid: 'test-user-101',
          token: {}
        }
      }

      await expect(wrapped(data, context)).rejects.toThrow('currency string is required')
    })

    it('should reject invalid currency type', async () => {
      const data = {
        images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg=='],
        currency: 123
      } as any

      const context = {
        auth: {
          uid: 'test-user-102',
          token: {}
        }
      }

      await expect(wrapped(data, context)).rejects.toThrow('currency string is required')
    })
  })

  describe('Image Size and Count Validation', () => {
    it('should reject more than 5 images', async () => {
      const data = {
        images: [
          'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
          'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
          'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
          'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
          'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
          'data:image/jpeg;base64,/9j/4AAQSkZJRg==' // 6th image
        ],
        currency: 'CLP'
      }

      const context = {
        auth: {
          uid: 'test-user-103',
          token: {}
        }
      }

      await expect(wrapped(data, context)).rejects.toThrow('Maximum 5 images allowed')
    })

    it('should reject images larger than 10MB', async () => {
      // Create a base64 string that represents > 10MB
      // Base64 is ~33% larger, so we need ~13.3MB of base64 to represent 10MB
      const largeBase64 = 'A'.repeat(14 * 1024 * 1024) // 14MB of base64

      const data = {
        images: [`data:image/jpeg;base64,${largeBase64}`],
        currency: 'CLP'
      }

      const context = {
        auth: {
          uid: 'test-user-104',
          token: {}
        }
      }

      await expect(wrapped(data, context)).rejects.toThrow('too large')
    })

    it('should accept images within size limit', async () => {
      const data = {
        images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg=='],
        currency: 'CLP'
      }

      const context = {
        auth: {
          uid: 'test-user-105',
          token: {}
        }
      }

      const result = await wrapped(data, context)
      expect(result).toBeDefined()
    })
  })

  describe('MIME Type Validation', () => {
    it('should accept valid JPEG images', async () => {
      const data = {
        images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg=='],
        currency: 'CLP'
      }

      const context = {
        auth: {
          uid: 'test-user-106',
          token: {}
        }
      }

      const result = await wrapped(data, context)
      expect(result).toBeDefined()
    })

    it('should accept valid PNG images', async () => {
      const data = {
        images: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA'],
        currency: 'CLP'
      }

      const context = {
        auth: {
          uid: 'test-user-107',
          token: {}
        }
      }

      const result = await wrapped(data, context)
      expect(result).toBeDefined()
    })

    it('should accept valid WebP images', async () => {
      const data = {
        images: ['data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAw'],
        currency: 'CLP'
      }

      const context = {
        auth: {
          uid: 'test-user-108',
          token: {}
        }
      }

      const result = await wrapped(data, context)
      expect(result).toBeDefined()
    })

    it('should reject images without MIME type', async () => {
      const data = {
        images: ['/9j/4AAQSkZJRg=='], // Missing data URI prefix
        currency: 'CLP'
      }

      const context = {
        auth: {
          uid: 'test-user-109',
          token: {}
        }
      }

      await expect(wrapped(data, context)).rejects.toThrow('Invalid image format')
    })

    it('should reject unsupported MIME types', async () => {
      const data = {
        images: ['data:image/bmp;base64,Qk0='], // BMP not supported
        currency: 'CLP'
      }

      const context = {
        auth: {
          uid: 'test-user-110',
          token: {}
        }
      }

      await expect(wrapped(data, context)).rejects.toThrow('Unsupported image format')
    })
  })

  describe('Error Handling', () => {
    it('should handle Gemini API errors gracefully', async () => {
      // Override the mock to simulate an error
      const { GoogleGenerativeAI } = require('@google/generative-ai')
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: () => ({
          generateContent: jest.fn().mockRejectedValue(new Error('Gemini API error'))
        })
      }))

      const data = {
        images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg=='],
        currency: 'CLP'
      }

      const context = {
        auth: {
          uid: 'test-user-111',
          token: {}
        }
      }

      await expect(wrapped(data, context)).rejects.toThrow('Failed to analyze receipt')
    })

    it('should handle JSON parsing errors', async () => {
      // Override the mock to return invalid JSON
      const { GoogleGenerativeAI } = require('@google/generative-ai')
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: () => ({
          generateContent: jest.fn().mockResolvedValue({
            response: {
              text: () => 'Invalid JSON response'
            }
          })
        })
      }))

      const data = {
        images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg=='],
        currency: 'CLP'
      }

      const context = {
        auth: {
          uid: 'test-user-112',
          token: {}
        }
      }

      await expect(wrapped(data, context)).rejects.toThrow('Failed to analyze receipt')
    })
  })

  describe('Successful Analysis', () => {
    it('should return parsed receipt data', async () => {
      const data = {
        images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg=='],
        currency: 'CLP'
      }

      const context = {
        auth: {
          uid: 'test-user-113',
          token: {}
        }
      }

      const result = await wrapped(data, context)

      expect(result).toMatchObject({
        merchant: expect.any(String),
        date: expect.any(String),
        total: expect.any(Number),
        category: expect.any(String),
        items: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            price: expect.any(Number)
          })
        ])
      })
    })

    it('should log successful analysis', async () => {
      const consoleSpy = jest.spyOn(console, 'log')

      const data = {
        images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg=='],
        currency: 'CLP'
      }

      const context = {
        auth: {
          uid: 'test-user-114',
          token: {}
        }
      }

      await wrapped(data, context)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Receipt analyzed for user test-user-114')
      )

      consoleSpy.mockRestore()
    })
  })
})
