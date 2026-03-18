// Mock firebase-admin before importing the function
const mockTransaction = {
  get: jest.fn(),
  update: jest.fn(),
}
const mockRunTransaction = jest.fn(async (callback: (t: typeof mockTransaction) => Promise<void>) => {
  return callback(mockTransaction)
})
const mockFirestore = jest.fn(() => ({
  doc: jest.fn((path: string) => ({ path })),
  runTransaction: mockRunTransaction,
}))

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  firestore: Object.assign(mockFirestore, {
    FieldValue: { serverTimestamp: () => 'SERVER_TIMESTAMP' },
  }),
}))

jest.mock('../storageService', () => ({
  deletePendingScanImages: jest.fn().mockResolvedValue(undefined),
}))

import { onPendingScanDeleted } from '../onPendingScanDeleted'
import { deletePendingScanImages } from '../storageService'

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
    eventType: 'providers/cloud.firestore/eventTypes/document.delete',
    resource: { service: 'firestore.googleapis.com', name: `pending_scans/${scanId}` },
  }
}

// Extract raw handler
const handler = (onPendingScanDeleted as unknown as { run: (data: unknown, context: unknown) => Promise<void> }).run

describe('onPendingScanDeleted', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTransaction.get.mockResolvedValue({
      exists: true,
      data: () => ({ remaining: 5, used: 3 }),
    })
  })

  it('refunds credit when creditDeducted is true', async () => {
    const snap = makeFakeSnapshot({
      scanId: 'test-scan-id',
      userId: 'test-user-123',
      creditDeducted: true,
    })

    await handler(snap, makeEventContext())

    expect(mockRunTransaction).toHaveBeenCalled()
    expect(mockTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringContaining('credits') }),
      expect.objectContaining({ remaining: 6, used: 2 })
    )
  })

  it('skips refund when creditDeducted is false', async () => {
    const snap = makeFakeSnapshot({
      scanId: 'test-scan-id',
      userId: 'test-user-123',
      creditDeducted: false,
    })

    await handler(snap, makeEventContext())

    expect(mockRunTransaction).not.toHaveBeenCalled()
    expect(mockTransaction.update).not.toHaveBeenCalled()
  })

  it('deletes storage images regardless of creditDeducted', async () => {
    const snap = makeFakeSnapshot({
      scanId: 'test-scan-id',
      userId: 'test-user-123',
      creditDeducted: false,
    })

    await handler(snap, makeEventContext())

    expect(deletePendingScanImages).toHaveBeenCalledWith('test-user-123', 'test-scan-id')
  })
})
