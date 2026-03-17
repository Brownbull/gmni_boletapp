const functionsTest = require('firebase-functions-test')

const test = functionsTest()

// Mock firebase-admin before importing the function
jest.mock('firebase-admin', () => {
  const mockTransaction = {
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
  }

  const mockRunTransaction = jest.fn(async (callback: (t: typeof mockTransaction) => Promise<void>) => {
    return callback(mockTransaction)
  })

  const mockFirestore = jest.fn(() => ({
    doc: jest.fn((path: string) => ({ path })),
    runTransaction: mockRunTransaction,
  }))

  // Attach statics to the function itself
  const firestoreObj = Object.assign(mockFirestore, {
    Timestamp: {
      fromMillis: (ms: number) => ({ _seconds: Math.floor(ms / 1000), toMillis: () => ms }),
    },
    FieldValue: {
      serverTimestamp: () => 'SERVER_TIMESTAMP',
    },
  })

  return {
    apps: [],
    initializeApp: jest.fn(),
    firestore: firestoreObj,
    __mockTransaction: mockTransaction,
    __mockRunTransaction: mockRunTransaction,
  }
})

// Access mock internals
const admin = require('firebase-admin')
const mockTransaction = admin.__mockTransaction
// Import after mocks
import { queueReceiptScan } from '../queueReceiptScan'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'
const VALID_URL = 'https://storage.googleapis.com/bucket/image.jpg'

function makeCallData(overrides = {}) {
  return {
    scanId: VALID_UUID,
    imageUrls: [VALID_URL],
    ...overrides,
  }
}

let testUserCounter = 0
function makeCallContext(overrides = {}) {
  return {
    auth: { uid: `test-user-${++testUserCounter}` },
    ...overrides,
  }
}

function mockCredits(remaining: number, used = 0) {
  mockTransaction.get.mockImplementation((ref: { path: string }) => {
    if (ref.path.includes('pending_scans')) {
      return { exists: false }
    }
    if (ref.path.includes('credits')) {
      return { exists: true, data: () => ({ remaining, used }) }
    }
    return { exists: false, data: () => null }
  })
}

function mockExistingPendingScan() {
  mockTransaction.get.mockImplementation((ref: { path: string }) => {
    if (ref.path.includes('pending_scans')) {
      return { exists: true, data: () => ({ scanId: VALID_UUID }) }
    }
    return { exists: false, data: () => null }
  })
}

describe('queueReceiptScan', () => {
  const wrappedFn = test.wrap(queueReceiptScan)

  beforeEach(() => {
    jest.clearAllMocks()
    mockCredits(5)
  })

  afterAll(() => {
    test.cleanup()
  })

  // --- Authentication ---

  it('rejects unauthenticated requests', async () => {
    await expect(wrappedFn(makeCallData(), makeCallContext({ auth: null })))
      .rejects.toMatchObject({ code: 'unauthenticated' })
  })

  it('accepts authenticated requests', async () => {
    const result = await wrappedFn(makeCallData(), makeCallContext())
    expect(result).toEqual({ scanId: VALID_UUID })
  })

  // --- Input Validation: scanId ---

  it('rejects missing scanId', async () => {
    await expect(wrappedFn(makeCallData({ scanId: '' }), makeCallContext()))
      .rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects non-UUID scanId', async () => {
    await expect(wrappedFn(makeCallData({ scanId: 'not-a-uuid' }), makeCallContext()))
      .rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects path-traversal scanId', async () => {
    await expect(wrappedFn(makeCallData({ scanId: '../other-user' }), makeCallContext()))
      .rejects.toMatchObject({ code: 'invalid-argument' })
  })

  // --- Input Validation: imageUrls ---

  it('rejects empty imageUrls', async () => {
    await expect(wrappedFn(makeCallData({ imageUrls: [] }), makeCallContext()))
      .rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects more than 5 imageUrls', async () => {
    const urls = Array(6).fill(VALID_URL)
    await expect(wrappedFn(makeCallData({ imageUrls: urls }), makeCallContext()))
      .rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects non-HTTPS URL', async () => {
    await expect(wrappedFn(makeCallData({ imageUrls: ['http://evil.com/img.jpg'] }), makeCallContext()))
      .rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects disallowed hostname', async () => {
    await expect(wrappedFn(makeCallData({ imageUrls: ['https://evil.com/img.jpg'] }), makeCallContext()))
      .rejects.toMatchObject({ code: 'invalid-argument' })
  })

  // --- Input Validation: receiptType ---

  it('rejects invalid receiptType', async () => {
    await expect(wrappedFn(makeCallData({ receiptType: 'invalid-type' }), makeCallContext()))
      .rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('accepts valid receiptType', async () => {
    const result = await wrappedFn(makeCallData({ receiptType: 'supermarket' }), makeCallContext())
    expect(result).toEqual({ scanId: VALID_UUID })
  })

  // --- Credit Deduction ---

  it('deducts 1 credit on new scan', async () => {
    await wrappedFn(makeCallData(), makeCallContext())

    expect(mockTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringContaining('credits') }),
      expect.objectContaining({ remaining: 4, used: 1 })
    )
  })

  it('rejects when credits are insufficient', async () => {
    mockCredits(0)
    await expect(wrappedFn(makeCallData(), makeCallContext()))
      .rejects.toMatchObject({ code: 'resource-exhausted' })
  })

  // --- Pending Doc Creation ---

  it('creates pending doc with correct fields', async () => {
    const ctx = makeCallContext()
    await wrappedFn(makeCallData(), ctx)

    expect(mockTransaction.set).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringContaining('pending_scans') }),
      expect.objectContaining({
        scanId: VALID_UUID,
        userId: ctx.auth.uid,
        status: 'processing',
        imageUrls: [VALID_URL],
        creditDeducted: true,
      })
    )
  })

  // --- Idempotency ---

  it('returns existing scanId without re-deducting credit', async () => {
    mockExistingPendingScan()

    const result = await wrappedFn(makeCallData(), makeCallContext())

    expect(result).toEqual({ scanId: VALID_UUID })
    expect(mockTransaction.update).not.toHaveBeenCalled()
    expect(mockTransaction.set).not.toHaveBeenCalled()
  })
})
