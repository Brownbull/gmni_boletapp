/**
 * Tests for analyzeStatement Cloud Function
 * TD-18-2: Number coercion + diagnostic logging for statement responses
 */
const functionsTest = require('firebase-functions-test')

const test = functionsTest()

// Valid statement response for Gemini mock
const VALID_STATEMENT_RESPONSE = {
  statementInfo: {
    bank: 'CMR Falabella',
    cardType: 'Visa',
    cardLastFour: '1234',
    period: '2026-02',
    closingDate: '2026-02-28',
    dueDate: '2026-03-15',
    totalDebit: 150000,
    totalCredit: null,
    currency: 'CLP',
  },
  transactions: [
    { date: '2026-02-01', description: 'COMPRA SUPERMERCADO', amount: 25000, type: 'cargo', installment: null, category: 'Supermercado', originalCurrency: null, originalAmount: null },
    { date: '2026-02-05', description: 'PAGO SERVICIOS', amount: 15000, type: 'cargo', installment: null, category: 'Servicios', originalCurrency: null, originalAmount: null },
  ],
  metadata: { totalTransactions: 2, confidence: 0.95, pageCount: 3, warnings: [] },
}

// Mock Gemini AI — default returns valid statement response
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify(VALID_STATEMENT_RESPONSE)
          }
        })
      })
    }))
  }
})

// Mock statement prompts
jest.mock('../prompts/statement', () => ({
  buildStatementPrompt: jest.fn().mockReturnValue('Analyze this statement'),
  getActiveStatementPrompt: jest.fn().mockReturnValue({ version: '1.0.0' })
}))

// Set required environment variable
process.env.GEMINI_API_KEY = 'test-api-key'

import { analyzeStatement } from '../analyzeStatement'

// Minimal PDF with valid %PDF- magic bytes for input validation
const FAKE_PDF_BASE64 = Buffer.from('%PDF-1.4 fake content for testing purposes here').toString('base64')
const pdfInput = `data:application/pdf;base64,${FAKE_PDF_BASE64}`

describe('analyzeStatement Cloud Function (TD-18-2)', () => {
  let wrapped: ReturnType<typeof test.wrap>
  let testCounter = 0
  const getAuthContext = () => ({
    auth: { uid: `stmt-test-${++testCounter}`, token: {} }
  })

  beforeAll(() => {
    wrapped = test.wrap(analyzeStatement)
  })

  afterAll(() => {
    test.cleanup()
  })

  describe('Number Coercion', () => {
    it('should coerce string amounts to numbers', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai')
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: () => ({
          generateContent: jest.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify({
                ...VALID_STATEMENT_RESPONSE,
                transactions: [
                  { date: '2026-02-01', description: 'COMPRA', amount: '25000', type: 'cargo', installment: null, category: 'Otros', originalCurrency: null, originalAmount: null },
                ],
                metadata: { totalTransactions: '1', confidence: '0.95', pageCount: '3', warnings: [] },
              })
            }
          })
        })
      }))

      const result = await wrapped({ pdf: pdfInput }, getAuthContext())
      expect(result.transactions[0].amount).toBe(25000)
      expect(typeof result.transactions[0].amount).toBe('number')
      expect(result.metadata.totalTransactions).toBe(1)
      expect(typeof result.metadata.totalTransactions).toBe('number')
    })

    it('should strip Chilean thousands separators in statement amounts', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai')
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: () => ({
          generateContent: jest.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify({
                ...VALID_STATEMENT_RESPONSE,
                statementInfo: {
                  ...VALID_STATEMENT_RESPONSE.statementInfo,
                  totalDebit: '150.000',
                },
                transactions: [
                  { date: '2026-02-01', description: 'COMPRA', amount: '25.000', type: 'cargo', installment: null, category: 'Otros', originalCurrency: null, originalAmount: null },
                ],
              })
            }
          })
        })
      }))

      const result = await wrapped({ pdf: pdfInput }, getAuthContext())
      expect(result.transactions[0].amount).toBe(25000)
      expect(result.statementInfo.totalDebit).toBe(150000)
    })

    it('should pass null originalAmount through unchanged', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai')
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: () => ({
          generateContent: jest.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify({
                ...VALID_STATEMENT_RESPONSE,
                transactions: [
                  { date: '2026-02-01', description: 'COMPRA', amount: 25000, type: 'cargo', installment: null, category: 'Otros', originalCurrency: null, originalAmount: null },
                ],
              })
            }
          })
        })
      }))

      const result = await wrapped({ pdf: pdfInput }, getAuthContext())
      expect(result.transactions[0].originalAmount).toBeNull()
    })

    it('should reject non-numeric string amounts', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai')
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: () => ({
          generateContent: jest.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify({
                ...VALID_STATEMENT_RESPONSE,
                transactions: [
                  { date: '2026-02-01', description: 'COMPRA', amount: 'N/A', type: 'cargo', installment: null, category: 'Otros', originalCurrency: null, originalAmount: null },
                ],
              })
            }
          })
        })
      }))

      await expect(wrapped({ pdf: pdfInput }, getAuthContext())).rejects.toThrow(
        'Statement analysis returned unexpected format'
      )
    })
  })

  describe('Diagnostic Logging', () => {
    it('should log field-level diagnostics on validation failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const { GoogleGenerativeAI } = require('@google/generative-ai')
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: () => ({
          generateContent: jest.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify({
                statementInfo: { bank: 123 }, // wrong type
                transactions: [],
                metadata: { totalTransactions: 0 },
              })
            }
          })
        })
      }))

      await expect(wrapped({ pdf: pdfInput }, getAuthContext())).rejects.toThrow(
        'Statement analysis returned unexpected format'
      )

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('field="statementInfo.bank"')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('expected="string"')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Valid Response', () => {
    it('should return parsed statement with all fields', async () => {
      const result = await wrapped({ pdf: pdfInput }, getAuthContext())

      expect(result.statementInfo.bank).toBe('CMR Falabella')
      expect(result.transactions).toHaveLength(2)
      expect(result.transactions[0].amount).toBe(25000)
      expect(result.metadata.totalTransactions).toBe(2)
      expect(result.promptVersion).toBe('1.0.0')
      expect(typeof result.latencyMs).toBe('number')
    })
  })
})
