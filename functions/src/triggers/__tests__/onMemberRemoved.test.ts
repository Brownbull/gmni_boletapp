/**
 * Unit Tests for onMemberRemoved Cloud Function
 *
 * Story 14d-v2-1-7c: Cloud Function - Member Leave Handler
 *
 * TDD Phase: RED -> GREEN - Tests + Implementation
 *
 * This Cloud Function:
 * 1. Detects when members are removed from a shared group's members array
 * 2. Queries all transactions owned by the leaving member with matching sharedGroupId
 * 3. Creates TRANSACTION_REMOVED changelog entries for each transaction
 * 4. Implements idempotency (no duplicate entries on retry)
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

// Mock firebase-admin BEFORE importing anything else
const mockGet = vi.fn();
const mockSet = vi.fn();
const mockCreate = vi.fn();
const mockCollection = vi.fn();
const mockDoc = vi.fn();

// Mock firebase-functions for logger
const mockLoggerWarn = vi.fn();
const mockLoggerInfo = vi.fn();
const mockLoggerDebug = vi.fn();
const mockLoggerError = vi.fn();

vi.mock('firebase-functions', async () => {
  const actual = await vi.importActual('firebase-functions');
  return {
    ...actual,
    logger: {
      info: mockLoggerInfo,
      warn: mockLoggerWarn,
      debug: mockLoggerDebug,
      error: mockLoggerError,
    },
  };
});

vi.mock('firebase-admin', () => {
  const mockTimestamp = {
    now: vi.fn(() => ({
      toMillis: () => Date.now(),
      toDate: () => new Date(),
    })),
    fromMillis: vi.fn((ms: number) => ({
      toMillis: () => ms,
      toDate: () => new Date(ms),
    })),
  };

  const firestoreFn = vi.fn(() => ({
    collection: mockCollection,
    doc: mockDoc,
  }));

  // Attach static properties
  (firestoreFn as any).Timestamp = mockTimestamp;
  (firestoreFn as any).FieldValue = {
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  };

  return {
    initializeApp: vi.fn(),
    apps: [],
    firestore: firestoreFn,
    credential: {
      applicationDefault: vi.fn(),
    },
  };
});

// Constants
const APP_ID = 'boletapp-d609f';

// Helper to create mock Firestore Change object
interface MockDocumentData {
  members: string[];
  ownerId: string;
  name?: string;
  [key: string]: unknown;
}

function createMockChange(
  beforeData: MockDocumentData | undefined,
  afterData: MockDocumentData | undefined
) {
  return {
    before: {
      exists: !!beforeData,
      data: () => beforeData,
      id: 'group-123',
      ref: {
        path: 'sharedGroups/group-123',
      },
    },
    after: {
      exists: !!afterData,
      data: () => afterData,
      id: 'group-123',
      ref: {
        path: 'sharedGroups/group-123',
      },
    },
  };
}

// Helper to create mock context
function createMockContext(groupId: string = 'group-123') {
  return {
    params: {
      groupId,
    },
    eventId: `event-${Date.now()}`,
    timestamp: new Date().toISOString(),
    eventType: 'google.firestore.document.update',
    resource: {
      name: `projects/test/databases/(default)/documents/sharedGroups/${groupId}`,
      service: 'firestore.googleapis.com',
    },
  };
}

// Helper to create mock transaction documents
interface MockTransaction {
  id: string;
  sharedGroupId: string | null;
  total: number;
  currency?: string;
  merchant: string;
  category: string;
  items: Array<{ name: string; price: number }>;
  date: string;
}

function createMockTransactionDoc(tx: MockTransaction) {
  return {
    id: tx.id,
    exists: true,
    data: () => tx,
    ref: {
      path: `artifacts/${APP_ID}/users/user-123/transactions/${tx.id}`,
    },
  };
}

/**
 * Sets up mocks for the standard test scenario:
 * - Transaction collection query returns provided transactions
 * - Changelog doc check returns provided existence state
 * - Changelog set succeeds
 */
function setupMocks(options: {
  transactions?: MockTransaction[];
  existingChangelogIds?: string[];
}) {
  const { transactions = [], existingChangelogIds = [] } = options;

  // Create transaction docs
  const transactionDocs = transactions.map((tx) => createMockTransactionDoc(tx));

  // Setup chainable mock for transactions query
  const transactionQueryMock = {
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({
      docs: transactionDocs,
      empty: transactionDocs.length === 0,
    }),
  };

  // Setup changelog doc mock that uses create() for atomic idempotency
  const changelogDocMock = (path: string) => {
    // Check if this changelog entry should exist (based on transaction ID in path)
    const exists = existingChangelogIds.some((id) => path.includes(id));
    return {
      get: vi.fn().mockResolvedValue({ exists }),
      set: mockSet.mockResolvedValue(undefined),
      // create() throws error code 6 if doc exists (atomic idempotency)
      create: exists
        ? vi.fn().mockRejectedValue({ code: 6 })
        : mockCreate.mockResolvedValue(undefined),
    };
  };

  // Main collection mock
  mockCollection.mockImplementation((path: string) => {
    if (path.includes('transactions')) {
      return transactionQueryMock;
    }
    // For sharedGroups collection (changelog path)
    return {
      doc: vi.fn().mockImplementation((docId: string) => ({
        collection: vi.fn().mockImplementation(() => ({
          doc: vi.fn().mockImplementation((entryId: string) => {
            return changelogDocMock(entryId);
          }),
        })),
      })),
    };
  });

  // Also setup mockDoc for direct doc access
  mockDoc.mockImplementation((path: string) => {
    return {
      collection: vi.fn().mockImplementation(() => ({
        doc: vi.fn().mockImplementation((entryId: string) => {
          return changelogDocMock(entryId);
        }),
      })),
    };
  });

  return { transactionQueryMock };
}

describe('onMemberRemoved Cloud Function', () => {
  // Import after mocks are set up
  let onMemberRemoved: any;

  beforeAll(async () => {
    // Dynamic import after mocks
    const module = await import('../onMemberRemoved');
    onMemberRemoved = module.onMemberRemoved;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockGet.mockReset();
    mockSet.mockReset();
    mockCreate.mockReset();
    mockCollection.mockReset();
    mockDoc.mockReset();
    // Reset logger mocks
    mockLoggerWarn.mockReset();
    mockLoggerInfo.mockReset();
    mockLoggerDebug.mockReset();
    mockLoggerError.mockReset();
  });

  // ============================================================================
  // 1. Member Detection Tests (5 tests)
  // ============================================================================
  describe('Member Detection', () => {
    it('should detect single member removal', async () => {
      // Arrange
      const beforeData: MockDocumentData = {
        members: ['owner-123', 'member-456', 'member-789'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const afterData: MockDocumentData = {
        members: ['owner-123', 'member-789'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, afterData);
      const context = createMockContext();

      // Setup: no transactions for removed member
      setupMocks({ transactions: [] });

      // Act
      const handler = onMemberRemoved.run;
      await handler(change, context);

      // Assert - should have queried for member-456's transactions
      expect(mockCollection).toHaveBeenCalledWith(
        expect.stringContaining('transactions')
      );
    });

    it('should detect multiple members removed at once', async () => {
      // Arrange
      const beforeData: MockDocumentData = {
        members: ['owner-123', 'member-456', 'member-789', 'member-999'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const afterData: MockDocumentData = {
        members: ['owner-123'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, afterData);
      const context = createMockContext();

      // Setup: no transactions for any removed member
      setupMocks({ transactions: [] });

      // Act
      const handler = onMemberRemoved.run;
      await handler(change, context);

      // Assert - should process each removed member
      // member-456, member-789, and member-999 were removed
      expect(mockCollection).toHaveBeenCalledTimes(3);
    });

    it('should ignore member additions (only process removals)', async () => {
      // Arrange
      const beforeData: MockDocumentData = {
        members: ['owner-123'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const afterData: MockDocumentData = {
        members: ['owner-123', 'new-member-456'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, afterData);
      const context = createMockContext();

      // Act
      const handler = onMemberRemoved.run;
      const result = await handler(change, context);

      // Assert - should not query for any transactions (no removals)
      expect(mockCollection).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle empty members arrays gracefully', async () => {
      // Arrange
      const beforeData: MockDocumentData = {
        members: [],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const afterData: MockDocumentData = {
        members: [],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, afterData);
      const context = createMockContext();

      // Act
      const handler = onMemberRemoved.run;
      const result = await handler(change, context);

      // Assert - should return early, no processing
      expect(mockCollection).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should do nothing when no members were removed', async () => {
      // Arrange - same members, different order (no actual removal)
      const beforeData: MockDocumentData = {
        members: ['owner-123', 'member-456'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const afterData: MockDocumentData = {
        members: ['member-456', 'owner-123'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, afterData);
      const context = createMockContext();

      // Act
      const handler = onMemberRemoved.run;
      const result = await handler(change, context);

      // Assert - should return early, no processing needed
      expect(mockCollection).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // 2. Transaction Query Tests (4 tests)
  // ============================================================================
  describe('Transaction Query', () => {
    it('should query with correct sharedGroupId filter', async () => {
      // Arrange
      const beforeData: MockDocumentData = {
        members: ['owner-123', 'member-456'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const afterData: MockDocumentData = {
        members: ['owner-123'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, afterData);
      const context = createMockContext('group-xyz');

      // Setup mocks
      const { transactionQueryMock } = setupMocks({ transactions: [] });

      // Act
      const handler = onMemberRemoved.run;
      await handler(change, context);

      // Assert - should query for sharedGroupId
      expect(transactionQueryMock.where).toHaveBeenCalledWith('sharedGroupId', '==', 'group-xyz');
    });

    it('should handle no transactions (no-op)', async () => {
      // Arrange
      const beforeData: MockDocumentData = {
        members: ['owner-123', 'member-456'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const afterData: MockDocumentData = {
        members: ['owner-123'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, afterData);
      const context = createMockContext();

      // Setup: empty query result
      setupMocks({ transactions: [] });

      // Act
      const handler = onMemberRemoved.run;
      await handler(change, context);

      // Assert - should complete without creating changelog entries
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should handle single transaction', async () => {
      // Arrange
      const beforeData: MockDocumentData = {
        members: ['owner-123', 'member-456'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const afterData: MockDocumentData = {
        members: ['owner-123'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, afterData);
      const context = createMockContext();

      // Setup: single transaction
      const mockTx: MockTransaction = {
        id: 'tx-001',
        sharedGroupId: 'group-123',
        total: 15000,
        currency: 'CLP',
        merchant: 'Supermercado Test',
        category: 'Supermarket',
        items: [{ name: 'Item 1', price: 15000 }],
        date: '2026-02-01',
      };

      setupMocks({ transactions: [mockTx] });

      // Act
      const handler = onMemberRemoved.run;
      await handler(change, context);

      // Assert - should create one changelog entry
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should handle many transactions efficiently', async () => {
      // Arrange
      const beforeData: MockDocumentData = {
        members: ['owner-123', 'member-456'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const afterData: MockDocumentData = {
        members: ['owner-123'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, afterData);
      const context = createMockContext();

      // Setup: 10 transactions
      const mockTransactions: MockTransaction[] = Array.from({ length: 10 }, (_, i) => ({
        id: `tx-${i.toString().padStart(3, '0')}`,
        sharedGroupId: 'group-123',
        total: 1000 * (i + 1),
        currency: 'CLP',
        merchant: `Merchant ${i + 1}`,
        category: 'Supermarket',
        items: [{ name: `Item ${i + 1}`, price: 1000 * (i + 1) }],
        date: '2026-02-01',
      }));

      setupMocks({ transactions: mockTransactions });

      // Act
      const handler = onMemberRemoved.run;
      await handler(change, context);

      // Assert - should create 10 changelog entries
      expect(mockCreate).toHaveBeenCalledTimes(10);
    });

    it('should log warning when 500+ transactions hit limit', async () => {
      // Arrange
      const beforeData: MockDocumentData = {
        members: ['owner-123', 'member-456'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const afterData: MockDocumentData = {
        members: ['owner-123'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, afterData);
      const context = createMockContext();

      // Setup: exactly 500 transactions (the limit)
      const mockTransactions: MockTransaction[] = Array.from({ length: 500 }, (_, i) => ({
        id: `tx-${i.toString().padStart(4, '0')}`,
        sharedGroupId: 'group-123',
        total: 1000 * ((i % 100) + 1),
        currency: 'CLP',
        merchant: `Merchant ${i + 1}`,
        category: 'Supermarket',
        items: [{ name: `Item ${i + 1}`, price: 1000 }],
        date: '2026-02-01',
      }));

      setupMocks({ transactions: mockTransactions });

      // Act
      const handler = onMemberRemoved.run;
      await handler(change, context);

      // Assert - should log warning about hitting the limit
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'Transaction limit hit - some may not be processed',
        expect.objectContaining({
          limit: 500,
        })
      );
    });
  });

  // ============================================================================
  // 3. Changelog Entry Tests (4 tests)
  // ============================================================================
  describe('Changelog Entry Creation', () => {
    it('should create entry with correct structure', async () => {
      // Arrange
      const beforeData: MockDocumentData = {
        members: ['owner-123', 'member-456'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const afterData: MockDocumentData = {
        members: ['owner-123'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, afterData);
      const context = createMockContext('group-abc');

      const mockTx: MockTransaction = {
        id: 'tx-structure-test',
        sharedGroupId: 'group-abc',
        total: 25000,
        currency: 'CLP',
        merchant: 'Test Store',
        category: 'Pharmacy',
        items: [{ name: 'Medicine', price: 25000 }],
        date: '2026-02-01',
      };

      setupMocks({ transactions: [mockTx] });

      // Act
      const handler = onMemberRemoved.run;
      await handler(change, context);

      // Assert - verify changelog entry structure
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TRANSACTION_REMOVED',
          transactionId: 'tx-structure-test',
          actorId: 'member-456',
          groupId: 'group-abc',
        })
      );
    });

    it('should set data field to null for removals', async () => {
      // Arrange
      const beforeData: MockDocumentData = {
        members: ['owner-123', 'member-456'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const afterData: MockDocumentData = {
        members: ['owner-123'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, afterData);
      const context = createMockContext();

      const mockTx: MockTransaction = {
        id: 'tx-null-data',
        sharedGroupId: 'group-123',
        total: 5000,
        currency: 'CLP',
        merchant: 'Null Test Store',
        category: 'Other',
        items: [],
        date: '2026-02-01',
      };

      setupMocks({ transactions: [mockTx] });

      // Act
      const handler = onMemberRemoved.run;
      await handler(change, context);

      // Assert - data should be null for TRANSACTION_REMOVED
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: null,
        })
      );
    });

    it('should include proper summary fields', async () => {
      // Arrange
      const beforeData: MockDocumentData = {
        members: ['owner-123', 'member-456'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const afterData: MockDocumentData = {
        members: ['owner-123'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, afterData);
      const context = createMockContext();

      const mockTx: MockTransaction = {
        id: 'tx-summary-test',
        sharedGroupId: 'group-123',
        total: 42500,
        currency: 'USD',
        merchant: 'Amazon',
        category: 'Online Shopping',
        items: [{ name: 'Book', price: 42500 }],
        date: '2026-02-01',
      };

      setupMocks({ transactions: [mockTx] });

      // Act
      const handler = onMemberRemoved.run;
      await handler(change, context);

      // Assert - summary should have required fields
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.objectContaining({
            amount: 42500,
            currency: 'USD',
            description: 'Amazon',
            category: 'Online Shopping',
          }),
        })
      );
    });

    it('should set correct TTL (30 days from now)', async () => {
      // Arrange
      const beforeData: MockDocumentData = {
        members: ['owner-123', 'member-456'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const afterData: MockDocumentData = {
        members: ['owner-123'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, afterData);
      const context = createMockContext();

      const mockTx: MockTransaction = {
        id: 'tx-ttl-test',
        sharedGroupId: 'group-123',
        total: 1000,
        currency: 'CLP',
        merchant: 'TTL Store',
        category: 'Other',
        items: [],
        date: '2026-02-01',
      };

      setupMocks({ transactions: [mockTx] });

      // Capture time before execution
      const beforeTime = Date.now();

      // Act
      const handler = onMemberRemoved.run;
      await handler(change, context);

      // Capture time after execution
      const afterTime = Date.now();

      // Assert - _ttl should be set to approximately 30 days from now
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          _ttl: expect.anything(),
        })
      );

      // Verify TTL is exactly 30 days (2,592,000,000 ms)
      const createCall = mockCreate.mock.calls[0][0];
      expect(createCall._ttl).toBeDefined();

      // TTL should be between 30 days from beforeTime and afterTime
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      const ttlMs = createCall._ttl.toMillis();
      expect(ttlMs).toBeGreaterThanOrEqual(beforeTime + THIRTY_DAYS_MS);
      expect(ttlMs).toBeLessThanOrEqual(afterTime + THIRTY_DAYS_MS);
    });
  });

  // ============================================================================
  // 4. Idempotency Tests (3 tests)
  // ============================================================================
  describe('Idempotency', () => {
    it('should skip if changelog entry already exists', async () => {
      // Arrange
      const beforeData: MockDocumentData = {
        members: ['owner-123', 'member-456'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const afterData: MockDocumentData = {
        members: ['owner-123'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, afterData);
      const context = createMockContext();

      const mockTx: MockTransaction = {
        id: 'tx-idempotent',
        sharedGroupId: 'group-123',
        total: 5000,
        currency: 'CLP',
        merchant: 'Idempotent Store',
        category: 'Other',
        items: [],
        date: '2026-02-01',
      };

      // Setup with existing changelog entry
      setupMocks({
        transactions: [mockTx],
        existingChangelogIds: ['tx-idempotent'],
      });

      // Act
      const handler = onMemberRemoved.run;
      await handler(change, context);

      // Assert - should NOT call set (entry exists)
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should create entry if no existing entry found', async () => {
      // Arrange
      const beforeData: MockDocumentData = {
        members: ['owner-123', 'member-456'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const afterData: MockDocumentData = {
        members: ['owner-123'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, afterData);
      const context = createMockContext();

      const mockTx: MockTransaction = {
        id: 'tx-new-entry',
        sharedGroupId: 'group-123',
        total: 7500,
        currency: 'CLP',
        merchant: 'New Entry Store',
        category: 'Restaurant',
        items: [],
        date: '2026-02-01',
      };

      // Setup with NO existing changelog entry
      setupMocks({
        transactions: [mockTx],
        existingChangelogIds: [],
      });

      // Act
      const handler = onMemberRemoved.run;
      await handler(change, context);

      // Assert - should call set (create new entry)
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should handle partial failure correctly (some entries exist, some do not)', async () => {
      // Arrange
      const beforeData: MockDocumentData = {
        members: ['owner-123', 'member-456'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const afterData: MockDocumentData = {
        members: ['owner-123'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, afterData);
      const context = createMockContext();

      // 3 transactions: 2 new, 1 already has changelog entry
      const mockTransactions: MockTransaction[] = [
        {
          id: 'tx-new-1',
          sharedGroupId: 'group-123',
          total: 1000,
          currency: 'CLP',
          merchant: 'Store 1',
          category: 'Other',
          items: [],
          date: '2026-02-01',
        },
        {
          id: 'tx-existing',
          sharedGroupId: 'group-123',
          total: 2000,
          currency: 'CLP',
          merchant: 'Store 2',
          category: 'Other',
          items: [],
          date: '2026-02-01',
        },
        {
          id: 'tx-new-2',
          sharedGroupId: 'group-123',
          total: 3000,
          currency: 'CLP',
          merchant: 'Store 3',
          category: 'Other',
          items: [],
          date: '2026-02-01',
        },
      ];

      // Setup with tx-existing already having changelog
      setupMocks({
        transactions: mockTransactions,
        existingChangelogIds: ['tx-existing'],
      });

      // Act
      const handler = onMemberRemoved.run;
      await handler(change, context);

      // Assert - should create only 2 entries (skip tx-existing)
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================================
  // 5. Error Handling Tests (3 additional tests for robustness)
  // ============================================================================
  describe('Error Handling', () => {
    it('should throw on query error to trigger Cloud Functions retry', async () => {
      // Arrange
      const beforeData: MockDocumentData = {
        members: ['owner-123', 'member-456'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const afterData: MockDocumentData = {
        members: ['owner-123'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, afterData);
      const context = createMockContext();

      // Setup: query throws error
      mockCollection.mockImplementation(() => ({
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockRejectedValue(new Error('Firestore query failed')),
      }));

      // Act & Assert - should throw to trigger retry
      const handler = onMemberRemoved.run;
      await expect(handler(change, context)).rejects.toThrow('Firestore query failed');

      // Should log error using functions.logger
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Error processing member removal',
        expect.objectContaining({
          groupId: 'group-123',
          error: 'Firestore query failed',
        })
      );
    });

    it('should handle missing before data gracefully', async () => {
      // Arrange - document was created (no before data)
      const afterData: MockDocumentData = {
        members: ['owner-123'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(undefined, afterData);
      const context = createMockContext();

      // Act
      const handler = onMemberRemoved.run;
      const result = await handler(change, context);

      // Assert - should return early
      expect(result).toBeNull();
      expect(mockCollection).not.toHaveBeenCalled();
    });

    it('should handle missing after data gracefully (document deleted)', async () => {
      // Arrange - document was deleted (no after data)
      const beforeData: MockDocumentData = {
        members: ['owner-123', 'member-456'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, undefined);
      const context = createMockContext();

      // Act
      const handler = onMemberRemoved.run;
      const result = await handler(change, context);

      // Assert - should return early (let onDelete handler deal with this)
      expect(result).toBeNull();
      expect(mockCollection).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // 6. Edge Case Tests (3 additional tests)
  // ============================================================================
  describe('Edge Cases', () => {
    it('should use transaction items[0].name as description fallback', async () => {
      // Arrange
      const beforeData: MockDocumentData = {
        members: ['owner-123', 'member-456'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const afterData: MockDocumentData = {
        members: ['owner-123'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, afterData);
      const context = createMockContext();

      // Transaction with empty merchant but has items
      const mockTx: MockTransaction = {
        id: 'tx-fallback',
        sharedGroupId: 'group-123',
        total: 5000,
        currency: 'CLP',
        merchant: '', // Empty merchant
        category: 'Other',
        items: [{ name: 'First Item', price: 5000 }],
        date: '2026-02-01',
      };

      setupMocks({ transactions: [mockTx] });

      // Act
      const handler = onMemberRemoved.run;
      await handler(change, context);

      // Assert - description should fallback to first item name
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.objectContaining({
            description: 'First Item',
          }),
        })
      );
    });

    it('should use "Transaction" as final fallback description', async () => {
      // Arrange
      const beforeData: MockDocumentData = {
        members: ['owner-123', 'member-456'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const afterData: MockDocumentData = {
        members: ['owner-123'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, afterData);
      const context = createMockContext();

      // Transaction with no merchant and no items
      const mockTx: MockTransaction = {
        id: 'tx-no-desc',
        sharedGroupId: 'group-123',
        total: 5000,
        currency: 'CLP',
        merchant: '', // Empty merchant
        category: 'Other',
        items: [], // No items
        date: '2026-02-01',
      };

      setupMocks({ transactions: [mockTx] });

      // Act
      const handler = onMemberRemoved.run;
      await handler(change, context);

      // Assert - description should fallback to "Transaction"
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.objectContaining({
            description: 'Transaction',
          }),
        })
      );
    });

    it('should default currency to CLP if not specified', async () => {
      // Arrange
      const beforeData: MockDocumentData = {
        members: ['owner-123', 'member-456'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const afterData: MockDocumentData = {
        members: ['owner-123'],
        ownerId: 'owner-123',
        name: 'Test Group',
      };
      const change = createMockChange(beforeData, afterData);
      const context = createMockContext();

      // Transaction without currency field
      const mockTx = {
        id: 'tx-no-currency',
        sharedGroupId: 'group-123',
        total: 5000,
        // currency not set
        merchant: 'Store',
        category: 'Other',
        items: [],
        date: '2026-02-01',
      } as MockTransaction;

      setupMocks({ transactions: [mockTx] });

      // Act
      const handler = onMemberRemoved.run;
      await handler(change, context);

      // Assert - currency should default to CLP
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.objectContaining({
            currency: 'CLP',
          }),
        })
      );
    });
  });
});
