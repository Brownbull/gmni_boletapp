// Mock firebase-admin BEFORE any imports
const mockDocUpdate = jest.fn()
const mockDocGet = jest.fn().mockResolvedValue({
  data: () => ({ status: 'processing', creditDeducted: true }),
})
const mockTransaction = {
  get: jest.fn(),
  update: jest.fn(),
}
const mockRunTransaction = jest.fn(async (callback: (t: typeof mockTransaction) => Promise<void>) => {
  return callback(mockTransaction)
})
const mockBucketFile = {
  save: jest.fn().mockResolvedValue(undefined),
  getMetadata: jest.fn().mockResolvedValue([{ size: 1024 }]),
}
const mockBucket = {
  file: jest.fn(() => mockBucketFile),
  name: 'test-bucket',
}

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  firestore: Object.assign(
    jest.fn(() => ({
      doc: jest.fn(() => ({ update: mockDocUpdate, get: mockDocGet, path: 'pending_scans/test-scan' })),
      runTransaction: mockRunTransaction,
    })),
    {
      Timestamp: { fromMillis: (ms: number) => ({ _seconds: Math.floor(ms / 1000) }) },
      FieldValue: { serverTimestamp: () => 'SERVER_TIMESTAMP' },
    }
  ),
  storage: jest.fn(() => ({ bucket: jest.fn(() => mockBucket) })),
}))

// Mock Gemini AI
const mockGenerateContent = jest.fn()
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}))

// Mock image processing
jest.mock('../imageProcessing', () => ({
  resizeAndCompress: jest.fn().mockResolvedValue({ buffer: Buffer.from('processed') }),
  generateThumbnail: jest.fn().mockResolvedValue({ buffer: Buffer.from('thumb') }),
}))

// Mock prompts
jest.mock('../prompts', () => ({
  buildPrompt: jest.fn().mockReturnValue('test prompt'),
  getActivePrompt: jest.fn().mockReturnValue({ version: '4.1.0' }),
  RECEIPT_TYPES: ['supermarket', 'restaurant'],
}))

// Mock fixtureHelper
const mockIsFixtureMode = jest.fn().mockReturnValue(false)
const mockLoadFixture = jest.fn()
jest.mock('../fixtureHelper', () => ({
  isFixtureMode: () => mockIsFixtureMode(),
  loadFixture: (...args: unknown[]) => mockLoadFixture(...args),
}))

// Set env
process.env.GEMINI_API_KEY = 'test-key'

// Mock global fetch
const mockFetch = jest.fn()
;(global as unknown as { fetch: typeof mockFetch }).fetch = mockFetch

import { processReceiptScan } from '../processReceiptScan'

const VALID_URL = 'https://storage.googleapis.com/test-bucket/pending_scans/user1/scan1/image-0.jpg'

function makeSnapshotData(overrides = {}) {
  return {
    scanId: 'test-scan-id',
    userId: 'test-user-123',
    status: 'processing',
    imageUrls: [VALID_URL],
    creditDeducted: true,
    ...overrides,
  }
}

/** Manual document snapshot that satisfies the trigger handler interface */
function makeFakeSnapshot(data: Record<string, unknown>) {
  return {
    data: () => data,
    ref: { path: `pending_scans/${data.scanId}` },
    id: data.scanId,
    exists: true,
  }
}

function makeEventContext(scanId = 'test-scan-id') {
  return {
    params: { scanId },
    eventId: 'test-event',
    timestamp: new Date().toISOString(),
    eventType: 'providers/cloud.firestore/eventTypes/document.create',
    resource: { service: 'firestore.googleapis.com', name: `pending_scans/${scanId}` },
  }
}

function mockGeminiSuccess() {
  mockGenerateContent.mockResolvedValue({
    response: {
      text: () => JSON.stringify({
        merchant: 'Test Market',
        date: '2026-03-15',
        total: 15000,
        category: 'Supermarket',
        items: [{ name: 'Milk', totalPrice: 1500, category: 'Fresh Food' }],
      }),
    },
  })
}

function mockGeminiFailure() {
  mockGenerateContent.mockRejectedValue(new Error('Gemini API error'))
}

// Extract the raw handler from the CloudFunction
// firebase-functions wraps it; we call .run() with (data, context)
const handler = (processReceiptScan as unknown as { run: (data: unknown, context: unknown) => Promise<void> }).run

describe('processReceiptScan', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGeminiSuccess()
    mockFetch.mockResolvedValue({
      ok: true,
      headers: { get: () => '100' },
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
    })
    mockBucketFile.getMetadata.mockResolvedValue([{ size: 1024 }])
    mockTransaction.get.mockResolvedValue({
      exists: true,
      data: () => ({ remaining: 5, used: 3, creditDeducted: true, status: 'processing' }),
    })
  })

  it('processes scan successfully and updates doc with completed status', async () => {
    const snap = makeFakeSnapshot(makeSnapshotData())
    await handler(snap, makeEventContext())

    expect(mockDocUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        result: expect.objectContaining({
          merchant: 'Test Market',
          total: 15000,
          merchantSource: 'scan',
          promptVersion: '4.1.0',
        }),
      })
    )
  })

  it('rejects disallowed URL origin (SSRF prevention)', async () => {
    const snap = makeFakeSnapshot(
      makeSnapshotData({ imageUrls: ['https://evil.com/image.jpg'] })
    )
    await handler(snap, makeEventContext())

    // Should have called runTransaction for failure path
    expect(mockRunTransaction).toHaveBeenCalled()
    expect(mockTransaction.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: 'failed',
        creditDeducted: false,
      })
    )
  })

  it('refunds credit on Gemini failure', async () => {
    mockGeminiFailure()
    const snap = makeFakeSnapshot(makeSnapshotData())
    await handler(snap, makeEventContext())

    // Credit refund: remaining +1, used -1
    expect(mockTransaction.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ remaining: 6, used: 2 })
    )

    // Status + creditDeducted in single write
    expect(mockTransaction.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: 'failed',
        creditDeducted: false,
        error: expect.any(String),
      })
    )
  })

  it('writes status=failed and creditDeducted=false atomically', async () => {
    mockGeminiFailure()
    const snap = makeFakeSnapshot(makeSnapshotData())
    await handler(snap, makeEventContext())

    // Both fields in the SAME update call
    const failureCall = mockTransaction.update.mock.calls.find(
      (call: unknown[]) => (call[1] as Record<string, unknown>).status === 'failed'
    )
    expect(failureCall).toBeDefined()
    expect(failureCall![1]).toMatchObject({
      status: 'failed',
      creditDeducted: false,
    })
  })

  it('calls Gemini with retry and processes response', async () => {
    const snap = makeFakeSnapshot(makeSnapshotData())
    await handler(snap, makeEventContext())
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ text: 'test prompt' }),
      ])
    )
  })

  it('fails when image exceeds size limit', async () => {
    mockBucketFile.getMetadata.mockResolvedValueOnce([{ size: 20 * 1024 * 1024 }])
    const snap = makeFakeSnapshot(makeSnapshotData())
    await handler(snap, makeEventContext())

    expect(mockTransaction.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'failed', creditDeducted: false })
    )
  })

  it('fails when Gemini returns malformed JSON', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'not valid json {{{' },
    })
    const snap = makeFakeSnapshot(makeSnapshotData())
    await handler(snap, makeEventContext())

    expect(mockRunTransaction).toHaveBeenCalled()
    expect(mockTransaction.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'failed', creditDeducted: false })
    )
  })

  it('fails when fetch returns non-OK response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: { get: () => null },
    })
    const snap = makeFakeSnapshot(makeSnapshotData())
    await handler(snap, makeEventContext())

    expect(mockRunTransaction).toHaveBeenCalled()
    expect(mockTransaction.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'failed', creditDeducted: false })
    )
  })

  it('skips processing when scan status is not processing (idempotency)', async () => {
    mockDocGet.mockResolvedValueOnce({
      data: () => ({ status: 'completed', creditDeducted: false }),
    })
    const snap = makeFakeSnapshot(makeSnapshotData())
    await handler(snap, makeEventContext())

    // Should not call Gemini or update doc
    expect(mockGenerateContent).not.toHaveBeenCalled()
    expect(mockDocUpdate).not.toHaveBeenCalled()
  })

  describe('fixture mode (Plan B)', () => {
    const RAW_FIXTURE = JSON.stringify({
      merchant: 'Fixture Market',
      date: '2026-03-15',
      total: 15000,
      category: 'Supermarket',
      items: [{ name: 'Milk', totalPrice: 1500, category: 'Fresh Food' }],
    })

    beforeEach(() => {
      mockIsFixtureMode.mockReturnValue(true)
      mockLoadFixture.mockResolvedValue(RAW_FIXTURE)
    })

    afterEach(() => {
      mockIsFixtureMode.mockReturnValue(false)
    })

    it('uses fixture instead of Gemini when fixture mode enabled', async () => {
      const snap = makeFakeSnapshot(makeSnapshotData())
      await handler(snap, makeEventContext())

      expect(mockLoadFixture).toHaveBeenCalledWith(expect.arrayContaining([expect.any(Buffer)]))
      expect(mockGenerateContent).not.toHaveBeenCalled()
      expect(mockDocUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          result: expect.objectContaining({
            merchant: 'Fixture Market',
            total: 15000,
          }),
        })
      )
    })

    it('runs coercion chain on raw fixture text (M4)', async () => {
      // Fixture with string numbers and price→totalPrice remap
      const rawWithCoercion = JSON.stringify({
        merchant: 'Test',
        date: '2026-01-15',
        total: '12.400',
        category: 'Other',
        items: [{ name: 'Item', price: '6.200', quantity: 1 }],
      })
      mockLoadFixture.mockResolvedValue(rawWithCoercion)

      const snap = makeFakeSnapshot(makeSnapshotData())
      await handler(snap, makeEventContext())

      expect(mockDocUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          result: expect.objectContaining({
            total: 12400,
            items: expect.arrayContaining([
              expect.objectContaining({ totalPrice: 6200 }),
            ]),
          }),
        })
      )
    })

    it('refunds credit on fixture load failure', async () => {
      mockLoadFixture.mockRejectedValue(new Error('No fixture found for image hash abc123'))

      const snap = makeFakeSnapshot(makeSnapshotData())
      await handler(snap, makeEventContext())

      expect(mockRunTransaction).toHaveBeenCalled()
      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: 'failed', creditDeducted: false })
      )
    })
  })
})
