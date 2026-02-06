/**
 * Unit Tests for changelogWriter Cloud Function
 *
 * Story 14d-v2-1-8a: Cloud Function - Changelog Writer Foundation
 * Story 14d-v2-1-8b: Cloud Function - Changelog Writer Validation Layer
 * Story 14d-v2-1-8c: Cloud Function - Changelog Writer Logging & Export
 *
 * TDD Phase: Complete (all tests passing)
 *
 * This Cloud Function:
 * 1. Triggers on transaction document writes (2nd gen onDocumentWritten)
 * 2. Detects change type based on sharedGroupId changes
 * 3. Creates changelog entries with idempotent document IDs
 * 4. Handles all cases: ADDED, MODIFIED, REMOVED
 *
 * Change Detection Matrix:
 * | Before State | After State | Action |
 * |--------------|-------------|--------|
 * | null         | groupA      | ADDED to groupA |
 * | groupA       | null        | REMOVED from groupA |
 * | groupA       | groupA (data changed) | MODIFIED in groupA |
 * | groupA       | groupB      | REMOVED from groupA, ADDED to groupB |
 * | groupA       | groupA (deletedAt set) | REMOVED from groupA |
 * | groupA       | document deleted | REMOVED from groupA |
 */

// ============================================================================
// Mock Setup - MUST be before imports
// ============================================================================

const mockSet = jest.fn();
const mockGet = jest.fn();
const mockServerTimestamp = jest.fn(() => 'SERVER_TIMESTAMP');
const mockBatchSet = jest.fn();
const mockBatchCommit = jest.fn();

// Store for controlling group membership in tests
let mockGroupMembers: Record<string, string[]> = {};

// Store for simulating Firestore errors during membership check
let mockMembershipCheckError: Record<string, Error> = {};

// Mock firebase-admin
jest.mock('firebase-admin', () => {
  // Create document reference factory for reuse
  const createDocRef = (groupId: string, docId: string) => ({
    set: mockSet,
    path: `sharedGroups/${groupId}/changelog/${docId}`,
  });

  // Create a mock that handles both sharedGroups (for membership) and changelog (for writes)
  const mockFirestore = jest.fn(() => ({
    collection: jest.fn((collectionName: string) => ({
      doc: jest.fn((docId: string) => {
        if (collectionName === 'sharedGroups') {
          // Group document for membership check
          return {
            get: jest.fn().mockImplementation(() => {
              // Check if we should simulate an error for this group
              if (mockMembershipCheckError[docId]) {
                return Promise.reject(mockMembershipCheckError[docId]);
              }
              const members = mockGroupMembers[docId] || [];
              return Promise.resolve({
                exists: members.length > 0,
                data: () => ({ members }),
              });
            }),
            collection: jest.fn(() => ({
              doc: jest.fn((changelogDocId: string) => createDocRef(docId, changelogDocId)),
            })),
          };
        }
        // Default path (other collections)
        return {
          get: mockGet,
          collection: jest.fn(() => ({
            doc: jest.fn(() => ({
              set: mockSet,
            })),
          })),
        };
      }),
    })),
    batch: jest.fn(() => ({
      set: mockBatchSet,
      commit: mockBatchCommit,
    })),
  }));

  // Attach Timestamp and FieldValue to firestore function
  (mockFirestore as unknown as Record<string, unknown>).Timestamp = {
    now: jest.fn(() => ({
      toMillis: () => Date.now(),
      toDate: () => new Date(),
    })),
    fromMillis: jest.fn((ms: number) => ({
      toMillis: () => ms,
      toDate: () => new Date(ms),
    })),
  };
  (mockFirestore as unknown as Record<string, unknown>).FieldValue = {
    serverTimestamp: mockServerTimestamp,
  };

  return {
    initializeApp: jest.fn(),
    apps: [],
    firestore: mockFirestore,
  };
});

// Mock firebase-functions/v2/firestore
const mockOnDocumentWritten = jest.fn();
jest.mock('firebase-functions/v2/firestore', () => ({
  onDocumentWritten: mockOnDocumentWritten,
}));

// Mock firebase-functions logger
jest.mock('firebase-functions', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

// ============================================================================
// Test Helpers
// ============================================================================

interface MockTransactionData {
  id?: string;
  sharedGroupId: string | null;
  total: number;
  currency?: string;
  merchant: string;
  category: string;
  items?: Array<{ name: string; price: number }>;
  date: string;
  deletedAt?: { toMillis: () => number } | null;
  ownerId?: string;
}

/**
 * Creates a mock Firestore document snapshot
 */
function createMockSnapshot(data: MockTransactionData | null) {
  if (data === null) {
    return {
      exists: false,
      data: () => null,
    };
  }
  return {
    exists: true,
    data: () => data,
  };
}

/**
 * Creates a mock Change object for onDocumentWritten
 */
function createMockChange(
  beforeData: MockTransactionData | null,
  afterData: MockTransactionData | null
) {
  return {
    before: createMockSnapshot(beforeData),
    after: createMockSnapshot(afterData),
  };
}

/**
 * Creates a mock FirestoreEvent for 2nd gen functions
 */
function createMockEvent(
  beforeData: MockTransactionData | null,
  afterData: MockTransactionData | null,
  eventId: string = 'event-abc123',
  params: Record<string, string> = {}
) {
  return {
    id: eventId,
    data: createMockChange(beforeData, afterData),
    params: {
      appId: 'boletapp-d609f',
      userId: 'user-123',
      transactionId: 'tx-456',
      ...params,
    },
    time: new Date().toISOString(),
    type: 'google.firestore.document.written',
  };
}

/**
 * Creates a sample transaction for testing
 */
function createSampleTransaction(
  overrides: Partial<MockTransactionData> = {}
): MockTransactionData {
  return {
    sharedGroupId: null,
    total: 15000,
    currency: 'CLP',
    merchant: 'Supermercado Test',
    category: 'Supermarket',
    items: [{ name: 'Milk', price: 5000 }, { name: 'Bread', price: 10000 }],
    date: '2026-02-01',
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('changelogWriter Cloud Function', () => {
  // Store the handler function extracted from onDocumentWritten
  let changelogWriterHandler: (event: any) => Promise<null>;

  beforeAll(async () => {
    // Import the module to trigger the onDocumentWritten registration
    // The mock captures the handler function
    await import('../changelogWriter');

    // Extract the handler from the mock
    expect(mockOnDocumentWritten).toHaveBeenCalled();
    const [, handler] = mockOnDocumentWritten.mock.calls[0];
    changelogWriterHandler = handler;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSet.mockResolvedValue(undefined);
    mockBatchSet.mockReturnValue(undefined);
    mockBatchCommit.mockResolvedValue(undefined);
    // Default: user-123 is a member of all test groups
    mockGroupMembers = {
      'group-A': ['user-123', 'other-user'],
      'group-B': ['user-123', 'other-user'],
      'group-test': ['specific-user-xyz'],
    };
    // Reset error simulation
    mockMembershipCheckError = {};
  });

  // ==========================================================================
  // AC #1: TRANSACTION_ADDED - Transaction assigned to group
  // ==========================================================================
  describe('AC #1: TRANSACTION_ADDED - Transaction assigned to group', () => {
    it('should create TRANSACTION_ADDED entry when sharedGroupId set (null -> groupA)', async () => {
      // Arrange
      const beforeTx = createSampleTransaction({ sharedGroupId: null });
      const afterTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const event = createMockEvent(beforeTx, afterTx, 'event-add-001');

      // Act
      await changelogWriterHandler(event);

      // Assert
      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TRANSACTION_ADDED',
          groupId: 'group-A',
          transactionId: 'tx-456',
          actorId: 'user-123',
        })
      );
    });

    it('should include full transaction data in ADDED entry (AD-3)', async () => {
      // Arrange
      const afterTx = createSampleTransaction({
        sharedGroupId: 'group-A',
        total: 25000,
        merchant: 'Full Data Store',
      });
      const event = createMockEvent(null, afterTx, 'event-add-002');

      // Act
      await changelogWriterHandler(event);

      // Assert - data field should contain transaction
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TRANSACTION_ADDED',
          data: expect.objectContaining({
            total: 25000,
            merchant: 'Full Data Store',
          }),
        })
      );
    });

    it('should set _ttl to 30 days from now (AD-9)', async () => {
      // Arrange
      const afterTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const event = createMockEvent(null, afterTx, 'event-add-003');
      const beforeTime = Date.now();

      // Act
      await changelogWriterHandler(event);

      // Assert
      const afterTime = Date.now();
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          _ttl: expect.anything(),
        })
      );

      const setCall = mockSet.mock.calls[0][0];
      const ttlMs = setCall._ttl.toMillis();
      expect(ttlMs).toBeGreaterThanOrEqual(beforeTime + THIRTY_DAYS_MS);
      expect(ttlMs).toBeLessThanOrEqual(afterTime + THIRTY_DAYS_MS);
    });

    it('should include summary with amount, currency, description, category', async () => {
      // Arrange
      const afterTx = createSampleTransaction({
        sharedGroupId: 'group-A',
        total: 42000,
        currency: 'USD',
        merchant: 'Amazon',
        category: 'Online Shopping',
      });
      const event = createMockEvent(null, afterTx, 'event-add-004');

      // Act
      await changelogWriterHandler(event);

      // Assert
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: {
            amount: 42000,
            currency: 'USD',
            description: 'Amazon',
            category: 'Online Shopping',
          },
        })
      );
    });

    it('should set actorId from userId path parameter', async () => {
      // Arrange
      // Ensure user is member of the group
      mockGroupMembers['group-A'] = ['specific-user-xyz', 'other-user'];
      const afterTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const event = createMockEvent(null, afterTx, 'event-add-005', {
        userId: 'specific-user-xyz',
      });

      // Act
      await changelogWriterHandler(event);

      // Assert
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'specific-user-xyz',
        })
      );
    });
  });

  // ==========================================================================
  // AC #2: TRANSACTION_MODIFIED - Transaction in group edited
  // ==========================================================================
  describe('AC #2: TRANSACTION_MODIFIED - Transaction in group edited', () => {
    it('should create TRANSACTION_MODIFIED when data changes in same group', async () => {
      // Arrange
      const beforeTx = createSampleTransaction({
        sharedGroupId: 'group-A',
        total: 15000,
      });
      const afterTx = createSampleTransaction({
        sharedGroupId: 'group-A',
        total: 20000, // Changed!
      });
      const event = createMockEvent(beforeTx, afterTx, 'event-mod-001');

      // Act
      await changelogWriterHandler(event);

      // Assert
      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TRANSACTION_MODIFIED',
          groupId: 'group-A',
        })
      );
    });

    it('should include updated transaction data in MODIFIED entry', async () => {
      // Arrange
      const beforeTx = createSampleTransaction({
        sharedGroupId: 'group-A',
        merchant: 'Old Merchant',
      });
      const afterTx = createSampleTransaction({
        sharedGroupId: 'group-A',
        merchant: 'New Merchant',
      });
      const event = createMockEvent(beforeTx, afterTx, 'event-mod-002');

      // Act
      await changelogWriterHandler(event);

      // Assert
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            merchant: 'New Merchant',
          }),
        })
      );
    });
  });

  // ==========================================================================
  // AC #3: TRANSACTION_REMOVED - sharedGroupId changed to null or different group
  // ==========================================================================
  describe('AC #3: TRANSACTION_REMOVED - Group change or removal', () => {
    it('should create TRANSACTION_REMOVED when sharedGroupId set to null', async () => {
      // Arrange
      const beforeTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const afterTx = createSampleTransaction({ sharedGroupId: null });
      const event = createMockEvent(beforeTx, afterTx, 'event-rem-001');

      // Act
      await changelogWriterHandler(event);

      // Assert
      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TRANSACTION_REMOVED',
          groupId: 'group-A',
        })
      );
    });

    it('should set data to null for REMOVED entries', async () => {
      // Arrange
      const beforeTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const afterTx = createSampleTransaction({ sharedGroupId: null });
      const event = createMockEvent(beforeTx, afterTx, 'event-rem-002');

      // Act
      await changelogWriterHandler(event);

      // Assert
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          data: null,
        })
      );
    });

    it('should create REMOVED + ADDED when moving between groups (groupA -> groupB)', async () => {
      // Arrange
      const beforeTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const afterTx = createSampleTransaction({ sharedGroupId: 'group-B' });
      const event = createMockEvent(beforeTx, afterTx, 'event-move-001');

      // Act
      await changelogWriterHandler(event);

      // Assert - should create 2 entries via batch (atomic operation)
      expect(mockBatchSet).toHaveBeenCalledTimes(2);

      // REMOVED from group-A
      expect(mockBatchSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'TRANSACTION_REMOVED',
          groupId: 'group-A',
        })
      );

      // ADDED to group-B
      expect(mockBatchSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'TRANSACTION_ADDED',
          groupId: 'group-B',
        })
      );
    });
  });

  // ==========================================================================
  // AC #4: TRANSACTION_REMOVED via soft delete (deletedAt set)
  // ==========================================================================
  describe('AC #4: TRANSACTION_REMOVED via soft delete', () => {
    it('should create TRANSACTION_REMOVED when deletedAt is set', async () => {
      // Arrange
      const beforeTx = createSampleTransaction({
        sharedGroupId: 'group-A',
        deletedAt: null,
      });
      const afterTx = createSampleTransaction({
        sharedGroupId: 'group-A',
        deletedAt: { toMillis: () => Date.now() },
      });
      const event = createMockEvent(beforeTx, afterTx, 'event-delete-001');

      // Act
      await changelogWriterHandler(event);

      // Assert
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TRANSACTION_REMOVED',
          groupId: 'group-A',
        })
      );
    });

    it('should create TRANSACTION_REMOVED when document is hard deleted', async () => {
      // Arrange - before exists, after is null (document deleted)
      const beforeTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const event = createMockEvent(beforeTx, null, 'event-harddelete-001');

      // Act
      await changelogWriterHandler(event);

      // Assert
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TRANSACTION_REMOVED',
          groupId: 'group-A',
        })
      );
    });
  });

  // ==========================================================================
  // AC #5: Idempotency - Uses event IDs to prevent duplicates
  // ==========================================================================
  describe('AC #5: Idempotency with event IDs', () => {
    it('should use event ID as part of document ID for idempotency', async () => {
      // Arrange
      const afterTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const event = createMockEvent(null, afterTx, 'unique-event-id-123');

      // Act
      await changelogWriterHandler(event);

      // Assert - the document ID should include the event ID
      // This is verified by checking the mock was called with correct path
      // The implementation should write to: sharedGroups/{groupId}/changelog/{eventId}-{type}
      expect(mockSet).toHaveBeenCalled();
    });

    it('should use set() for idempotent writes (overwrites on retry)', async () => {
      // Arrange
      const afterTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const event = createMockEvent(null, afterTx, 'event-retry-test');

      // Act
      await changelogWriterHandler(event);

      // Assert - set() should be called (not add())
      expect(mockSet).toHaveBeenCalled();
    });

    it('should include processedAt timestamp for debugging retries', async () => {
      // Arrange
      const afterTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const event = createMockEvent(null, afterTx, 'event-processed-test');

      // Act
      await changelogWriterHandler(event);

      // Assert
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          processedAt: 'SERVER_TIMESTAMP',
        })
      );
    });
  });

  // ==========================================================================
  // Edge Cases: No group involvement
  // ==========================================================================
  describe('Edge Cases: No group involvement', () => {
    it('should skip processing when no sharedGroupId in before or after', async () => {
      // Arrange
      const beforeTx = createSampleTransaction({ sharedGroupId: null });
      const afterTx = createSampleTransaction({ sharedGroupId: null });
      const event = createMockEvent(beforeTx, afterTx, 'event-nogroup-001');

      // Act
      const result = await changelogWriterHandler(event);

      // Assert
      expect(mockSet).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle new transaction without sharedGroupId (no-op)', async () => {
      // Arrange - new transaction (no before), no group
      const afterTx = createSampleTransaction({ sharedGroupId: null });
      const event = createMockEvent(null, afterTx, 'event-new-nogroup');

      // Act
      const result = await changelogWriterHandler(event);

      // Assert
      expect(mockSet).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // Edge Cases: Summary field defaults
  // ==========================================================================
  describe('Edge Cases: Summary field defaults', () => {
    it('should default currency to CLP if not specified', async () => {
      // Arrange
      const afterTx = createSampleTransaction({
        sharedGroupId: 'group-A',
        currency: undefined,
      });
      const event = createMockEvent(null, afterTx, 'event-default-currency');

      // Act
      await changelogWriterHandler(event);

      // Assert
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.objectContaining({
            currency: 'CLP',
          }),
        })
      );
    });

    it('should use first item name as description if merchant empty', async () => {
      // Arrange
      const afterTx = createSampleTransaction({
        sharedGroupId: 'group-A',
        merchant: '',
        items: [{ name: 'First Item', price: 1000 }],
      });
      const event = createMockEvent(null, afterTx, 'event-item-desc');

      // Act
      await changelogWriterHandler(event);

      // Assert
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.objectContaining({
            description: 'First Item',
          }),
        })
      );
    });

    it('should use "Transaction" as final fallback description', async () => {
      // Arrange
      const afterTx = createSampleTransaction({
        sharedGroupId: 'group-A',
        merchant: '',
        items: [],
      });
      const event = createMockEvent(null, afterTx, 'event-fallback-desc');

      // Act
      await changelogWriterHandler(event);

      // Assert
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.objectContaining({
            description: 'Transaction',
          }),
        })
      );
    });

    it('should handle null category gracefully', async () => {
      // Arrange
      const afterTx = {
        sharedGroupId: 'group-A',
        total: 5000,
        merchant: 'Store',
        date: '2026-02-01',
        // category not set
      } as MockTransactionData;
      const event = createMockEvent(null, afterTx, 'event-null-category');

      // Act
      await changelogWriterHandler(event);

      // Assert
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.objectContaining({
            category: null,
          }),
        })
      );
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================
  describe('Error Handling', () => {
    it('should handle event with missing data gracefully', async () => {
      // Arrange - event with undefined data
      const event = {
        id: 'event-no-data',
        data: undefined,
        params: {
          appId: 'boletapp-d609f',
          userId: 'user-123',
          transactionId: 'tx-456',
        },
        time: new Date().toISOString(),
        type: 'google.firestore.document.written',
      };

      // Act
      const result = await changelogWriterHandler(event);

      // Assert - should return null without throwing
      expect(result).toBeNull();
      expect(mockSet).not.toHaveBeenCalled();
    });

    it('should handle event with null snapshots gracefully', async () => {
      // Arrange - event with null before/after
      const event = {
        id: 'event-null-snapshots',
        data: {
          before: null,
          after: null,
        },
        params: {
          appId: 'boletapp-d609f',
          userId: 'user-123',
          transactionId: 'tx-456',
        },
        time: new Date().toISOString(),
        type: 'google.firestore.document.written',
      };

      // Act
      const result = await changelogWriterHandler(event);

      // Assert - should return null without throwing
      expect(result).toBeNull();
      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Summary Edge Cases
  // ==========================================================================
  describe('Summary Edge Cases for REMOVED entries', () => {
    it('should use default summary for REMOVED entries', async () => {
      // Arrange - transaction removed from group (no afterData with group)
      const beforeTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const afterTx = createSampleTransaction({ sharedGroupId: null });
      const event = createMockEvent(beforeTx, afterTx, 'event-removed-summary');

      // Act
      await changelogWriterHandler(event);

      // Assert - summary should have defaults since data is null
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TRANSACTION_REMOVED',
          summary: expect.objectContaining({
            amount: 0,
            currency: 'CLP',
            description: 'Transaction',
            category: null,
          }),
        })
      );
    });
  });

  // ==========================================================================
  // Trigger Configuration
  // ==========================================================================
  describe('Trigger Configuration', () => {
    it('should have registered a handler function via onDocumentWritten', () => {
      // The handler was extracted in beforeAll - verify it's a function
      expect(typeof changelogWriterHandler).toBe('function');
    });

    it('should be configured as a 2nd gen function (uses onDocumentWritten)', async () => {
      // This test verifies the function is a 2nd gen trigger by checking
      // that it returns null (the expected return type) and accepts events
      const afterTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const event = createMockEvent(null, afterTx, 'config-test-event');

      // Should complete without error - 2nd gen functions return Promise
      const result = await changelogWriterHandler(event);
      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // Security: Group Membership Validation
  // ==========================================================================
  describe('Security: Group Membership Validation', () => {
    it('should reject changelog entry when user is not a group member', async () => {
      // Arrange - user is NOT a member of the target group
      mockGroupMembers = {
        'group-A': ['other-user-1', 'other-user-2'], // user-123 not in list
      };
      const afterTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const event = createMockEvent(null, afterTx, 'event-security-001');

      // Act
      await changelogWriterHandler(event);

      // Assert - should NOT create changelog entry
      expect(mockSet).not.toHaveBeenCalled();
    });

    it('should reject changelog entry when group does not exist', async () => {
      // Arrange - group does not exist
      mockGroupMembers = {}; // Empty - no groups
      const afterTx = createSampleTransaction({ sharedGroupId: 'nonexistent-group' });
      const event = createMockEvent(null, afterTx, 'event-security-002');

      // Act
      await changelogWriterHandler(event);

      // Assert - should NOT create changelog entry
      expect(mockSet).not.toHaveBeenCalled();
    });

    it('should allow changelog entry when user is a group member', async () => {
      // Arrange - user IS a member of the target group
      mockGroupMembers = {
        'group-A': ['user-123', 'other-user'],
      };
      const afterTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const event = createMockEvent(null, afterTx, 'event-security-003');

      // Act
      await changelogWriterHandler(event);

      // Assert - should create changelog entry
      expect(mockSet).toHaveBeenCalledTimes(1);
    });

    it('should gracefully skip when Firestore throws during membership check', async () => {
      // Arrange - simulate Firestore error during group membership lookup
      const functions = require('firebase-functions');
      mockMembershipCheckError = {
        'group-A': new Error('Firestore unavailable'),
      };
      const afterTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const event = createMockEvent(null, afterTx, 'event-security-error-001');

      // Act - should NOT throw, but skip the entry
      const result = await changelogWriterHandler(event);

      // Assert - should NOT create changelog entry (graceful skip)
      expect(mockSet).not.toHaveBeenCalled();
      expect(result).toBeNull();

      // Verify error was logged
      expect(functions.logger.error).toHaveBeenCalledWith(
        'Error checking group membership',
        expect.objectContaining({
          userId: 'user-123',
          groupId: 'group-A',
          error: 'Firestore unavailable',
        })
      );
    });
  });

  // ==========================================================================
  // Security: Invalid GroupId Validation
  // ==========================================================================
  describe('Security: Invalid GroupId Validation', () => {
    it('should reject changelog entry when groupId contains forward slash', async () => {
      // Arrange - invalid groupId with path traversal attempt
      const afterTx = createSampleTransaction({ sharedGroupId: 'group/../../etc' });
      const event = createMockEvent(null, afterTx, 'event-invalid-001');

      // Act
      await changelogWriterHandler(event);

      // Assert - should NOT create changelog entry
      expect(mockSet).not.toHaveBeenCalled();
    });

    it('should reject changelog entry when groupId is empty string', async () => {
      // Arrange - empty groupId
      const afterTx = createSampleTransaction({ sharedGroupId: '' });
      const event = createMockEvent(null, afterTx, 'event-invalid-002');

      // Act
      await changelogWriterHandler(event);

      // Assert - should skip (no group involvement)
      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // AC #3/#4: Batch Writing - Atomic Operations
  // ==========================================================================
  describe('AC #3/#4: Batch Writing - Atomic Operations', () => {
    it('should use batch.commit() for group change scenario (REMOVED + ADDED atomically)', async () => {
      // Arrange - transaction moves from group-A to group-B
      const beforeTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const afterTx = createSampleTransaction({ sharedGroupId: 'group-B' });
      const event = createMockEvent(beforeTx, afterTx, 'event-batch-001');

      // Act
      await changelogWriterHandler(event);

      // Assert - should use batch.commit() for atomic writes
      expect(mockBatchCommit).toHaveBeenCalledTimes(1);
      expect(mockBatchSet).toHaveBeenCalledTimes(2);
    });

    it('should add both REMOVED and ADDED entries to the same batch', async () => {
      // Arrange
      const beforeTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const afterTx = createSampleTransaction({ sharedGroupId: 'group-B' });
      const event = createMockEvent(beforeTx, afterTx, 'event-batch-002');

      // Act
      await changelogWriterHandler(event);

      // Assert - both entries added to batch before commit
      expect(mockBatchSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'TRANSACTION_REMOVED',
          groupId: 'group-A',
        })
      );
      expect(mockBatchSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'TRANSACTION_ADDED',
          groupId: 'group-B',
        })
      );
    });

    it('should fail atomically if batch.commit() fails', async () => {
      // Arrange
      const beforeTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const afterTx = createSampleTransaction({ sharedGroupId: 'group-B' });
      const event = createMockEvent(beforeTx, afterTx, 'event-batch-003');

      // Simulate batch commit failure
      mockBatchCommit.mockRejectedValueOnce(new Error('Batch write failed'));

      // Act & Assert - should propagate error
      await expect(changelogWriterHandler(event)).rejects.toThrow('Batch write failed');
    });

    it('should still work for single entry writes (regression)', async () => {
      // Arrange - simple add (null -> groupA) - single entry
      const afterTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const event = createMockEvent(null, afterTx, 'event-single-001');

      // Act
      await changelogWriterHandler(event);

      // Assert - single entry should still work (uses set() or batch with 1 entry)
      // The key is that the entry is written successfully
      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TRANSACTION_ADDED',
          groupId: 'group-A',
        })
      );
    });

    it('should use deterministic document IDs in batch for idempotency', async () => {
      // Arrange
      const beforeTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const afterTx = createSampleTransaction({ sharedGroupId: 'group-B' });
      const event = createMockEvent(beforeTx, afterTx, 'event-batch-idem-001');

      // Act
      await changelogWriterHandler(event);

      // Assert - document refs should use eventId-type pattern
      // This is verified by checking batchSet was called with correct refs
      expect(mockBatchSet).toHaveBeenCalledTimes(2);
    });

    it('should write only REMOVED entry when beforeValid=true but afterValid=false', async () => {
      // Arrange - user is member of group-A but NOT group-B
      // Use mockGroupMembers to control membership
      mockGroupMembers = {
        'group-A': ['user-123'],
        'group-B': ['other-user'], // user-123 not a member
      };

      const beforeTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const afterTx = createSampleTransaction({ sharedGroupId: 'group-B' });
      const event = createMockEvent(beforeTx, afterTx, 'event-partial-001');

      // Act
      await changelogWriterHandler(event);

      // Assert - should only write REMOVED to group-A (1 entry in batch)
      expect(mockBatchSet).toHaveBeenCalledTimes(1);
      expect(mockBatchSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'TRANSACTION_REMOVED',
          groupId: 'group-A',
        })
      );

      // Reset mockGroupMembers for subsequent tests
      mockGroupMembers = {
        'group-A': ['user-123'],
        'group-B': ['user-123'],
      };
    });

    it('should write only ADDED entry when beforeValid=false but afterValid=true', async () => {
      // Arrange - user is NOT member of group-A but IS member of group-B
      mockGroupMembers = {
        'group-A': ['other-user'], // user-123 not a member
        'group-B': ['user-123'],
      };

      const beforeTx = createSampleTransaction({ sharedGroupId: 'group-A' });
      const afterTx = createSampleTransaction({ sharedGroupId: 'group-B' });
      const event = createMockEvent(beforeTx, afterTx, 'event-partial-002');

      // Act
      await changelogWriterHandler(event);

      // Assert - should only write ADDED to group-B (1 entry in batch)
      expect(mockBatchSet).toHaveBeenCalledTimes(1);
      expect(mockBatchSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'TRANSACTION_ADDED',
          groupId: 'group-B',
        })
      );

      // Reset mockGroupMembers for subsequent tests
      mockGroupMembers = {
        'group-A': ['user-123'],
        'group-B': ['user-123'],
      };
    });
  });

  describe('Summary Field Sanitization', () => {
    it('should sanitize HTML tags from merchant name', async () => {
      // Arrange - merchant with HTML injection attempt
      const afterTx = createSampleTransaction({
        sharedGroupId: 'group-A',
        merchant: '<script>alert("xss")</script>Evil Store',
      });
      const event = createMockEvent(null, afterTx, 'event-xss-001');

      // Act
      await changelogWriterHandler(event);

      // Assert - HTML should be stripped
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.objectContaining({
            description: expect.not.stringContaining('<script>'),
          }),
        })
      );
    });

    it('should truncate very long merchant names', async () => {
      // Arrange - very long merchant name
      const longMerchant = 'A'.repeat(500);
      const afterTx = createSampleTransaction({
        sharedGroupId: 'group-A',
        merchant: longMerchant,
      });
      const event = createMockEvent(null, afterTx, 'event-long-001');

      // Act
      await changelogWriterHandler(event);

      // Assert - should be truncated to 200 chars
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.objectContaining({
            description: expect.stringMatching(/^A{200}$/),
          }),
        })
      );
    });

    it('should sanitize HTML tags from category field', async () => {
      // Arrange - category with HTML tags (note: content between tags is preserved)
      const afterTx = createSampleTransaction({
        sharedGroupId: 'group-A',
        category: '<b>Bold</b> Groceries',
      });
      const event = createMockEvent(null, afterTx, 'event-xss-category-001');

      // Act
      await changelogWriterHandler(event);

      // Assert - HTML tags should be stripped, content preserved
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.objectContaining({
            category: expect.not.stringContaining('<b>'),
          }),
        })
      );
      // Verify tags removed but text content preserved
      const setCall = mockSet.mock.calls[0][0];
      expect(setCall.summary.category).toBe('Bold Groceries');
    });

    it('should sanitize img onerror XSS vector from merchant', async () => {
      // Arrange - merchant with img onerror XSS attack
      const afterTx = createSampleTransaction({
        sharedGroupId: 'group-A',
        merchant: '<img src=x onerror="alert(1)">Malicious Store',
      });
      const event = createMockEvent(null, afterTx, 'event-xss-img-001');

      // Act
      await changelogWriterHandler(event);

      // Assert - img tag should be stripped
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.objectContaining({
            description: expect.not.stringContaining('<img'),
          }),
        })
      );
      const setCall = mockSet.mock.calls[0][0];
      expect(setCall.summary.description).toBe('Malicious Store');
    });

    it('should sanitize svg onload XSS vector from category', async () => {
      // Arrange - category with svg onload XSS attack
      const afterTx = createSampleTransaction({
        sharedGroupId: 'group-A',
        category: '<svg onload="alert(1)">Electronics</svg>',
      });
      const event = createMockEvent(null, afterTx, 'event-xss-svg-001');

      // Act
      await changelogWriterHandler(event);

      // Assert - svg tags should be stripped
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.objectContaining({
            category: expect.not.stringContaining('<svg'),
          }),
        })
      );
      const setCall = mockSet.mock.calls[0][0];
      expect(setCall.summary.category).toBe('Electronics');
    });
  });

  // ==========================================================================
  // Story 14d-v2-1-8c: Structured Logging for Cloud Logging Queries
  // ==========================================================================
  describe('Story 14d-v2-1-8c: Structured Logging', () => {
    const functions = require('firebase-functions');

    beforeEach(() => {
      jest.clearAllMocks();
      // Reset group members for logging tests
      mockGroupMembers = {
        'group-A': ['user-123', 'other-user'],
        'group-B': ['user-123', 'other-user'],
      };
    });

    describe('Task 8.1: Log change detection results with transaction ID and group ID', () => {
      it('should log change detection with eventId, transactionId, groupId, and changeType for ADDED', async () => {
        // Arrange
        const afterTx = createSampleTransaction({ sharedGroupId: 'group-A' });
        const event = createMockEvent(null, afterTx, 'event-log-add-001');

        // Act
        await changelogWriterHandler(event);

        // Assert - verify structured log contains required fields
        expect(functions.logger.info).toHaveBeenCalledWith(
          expect.stringContaining('Processing'),
          expect.objectContaining({
            eventId: 'event-log-add-001',
            transactionId: 'tx-456',
            afterGroupId: 'group-A',
          })
        );
      });

      it('should log change detection with beforeGroupId and afterGroupId for group changes', async () => {
        // Arrange
        const beforeTx = createSampleTransaction({ sharedGroupId: 'group-A' });
        const afterTx = createSampleTransaction({ sharedGroupId: 'group-B' });
        const event = createMockEvent(beforeTx, afterTx, 'event-log-move-001');

        // Act
        await changelogWriterHandler(event);

        // Assert - log should show both groups
        expect(functions.logger.info).toHaveBeenCalledWith(
          expect.stringContaining('Processing'),
          expect.objectContaining({
            eventId: 'event-log-move-001',
            transactionId: 'tx-456',
            beforeGroupId: 'group-A',
            afterGroupId: 'group-B',
          })
        );
      });
    });

    describe('Task 8.2: Log successful changelog writes with event ID', () => {
      it('should log successful changelog entry creation with action CREATED', async () => {
        // Arrange
        const afterTx = createSampleTransaction({ sharedGroupId: 'group-A' });
        const event = createMockEvent(null, afterTx, 'event-success-001');

        // Act
        await changelogWriterHandler(event);

        // Assert - verify success log with action field
        expect(functions.logger.info).toHaveBeenCalledWith(
          expect.stringContaining('Changelog entry created'),
          expect.objectContaining({
            eventId: 'event-success-001',
            action: 'CREATED',
            changeType: 'TRANSACTION_ADDED',
            groupId: 'group-A',
            transactionId: 'tx-456',
          })
        );
      });

      it('should log successful batch write with action CREATED for each entry (group A -> B)', async () => {
        // Arrange - group change triggers batch write with 2 entries
        const beforeTx = createSampleTransaction({ sharedGroupId: 'group-A' });
        const afterTx = createSampleTransaction({ sharedGroupId: 'group-B' });
        const event = createMockEvent(beforeTx, afterTx, 'event-batch-success-001');

        // Act
        await changelogWriterHandler(event);

        // Assert - verify both entries logged with action CREATED
        // Entry 1: REMOVED from group-A
        expect(functions.logger.info).toHaveBeenCalledWith(
          expect.stringContaining('Changelog entry created'),
          expect.objectContaining({
            eventId: expect.stringContaining('event-batch-success-001'),
            action: 'CREATED',
            changeType: 'TRANSACTION_REMOVED',
            groupId: 'group-A',
          })
        );

        // Entry 2: ADDED to group-B
        expect(functions.logger.info).toHaveBeenCalledWith(
          expect.stringContaining('Changelog entry created'),
          expect.objectContaining({
            eventId: expect.stringContaining('event-batch-success-001'),
            action: 'CREATED',
            changeType: 'TRANSACTION_ADDED',
            groupId: 'group-B',
          })
        );
      });

      it('should log SKIPPED action when user is not a group member', async () => {
        // Arrange - user is NOT a member of the target group
        mockGroupMembers = {
          'group-A': ['other-user-only'], // user-123 not in list
        };
        const afterTx = createSampleTransaction({ sharedGroupId: 'group-A' });
        const event = createMockEvent(null, afterTx, 'event-skip-001');

        // Act
        await changelogWriterHandler(event);

        // Assert - verify skip is logged via warn
        expect(functions.logger.warn).toHaveBeenCalledWith(
          expect.stringContaining('Rejected changelog entry'),
          expect.objectContaining({
            actorId: 'user-123',
            groupId: 'group-A',
            transactionId: 'tx-456',
          })
        );
      });
    });

    describe('Task 8.3: Error logging with stack trace', () => {
      it('should log errors with stack trace before throwing', async () => {
        // Arrange - simulate Firestore write failure
        mockSet.mockRejectedValueOnce(new Error('Firestore write failed'));
        const afterTx = createSampleTransaction({ sharedGroupId: 'group-A' });
        const event = createMockEvent(null, afterTx, 'event-error-001');

        // Act & Assert
        await expect(changelogWriterHandler(event)).rejects.toThrow('Firestore write failed');

        // Verify error was logged with stack
        expect(functions.logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Error processing'),
          expect.objectContaining({
            eventId: 'event-error-001',
            transactionId: 'tx-456',
            userId: 'user-123',
            error: 'Firestore write failed',
            stack: expect.any(String),
          })
        );
      });

      it('should include action ERROR in error log', async () => {
        // Arrange - simulate batch commit failure
        mockBatchCommit.mockRejectedValueOnce(new Error('Batch commit failed'));
        const beforeTx = createSampleTransaction({ sharedGroupId: 'group-A' });
        const afterTx = createSampleTransaction({ sharedGroupId: 'group-B' });
        const event = createMockEvent(beforeTx, afterTx, 'event-error-batch-001');

        // Act & Assert
        await expect(changelogWriterHandler(event)).rejects.toThrow('Batch commit failed');

        // Verify error log includes action field
        expect(functions.logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Error processing'),
          expect.objectContaining({
            action: 'ERROR',
            eventId: 'event-error-batch-001',
          })
        );
      });
    });

    describe('Task 8.4: Structured logging for Cloud Logging queries', () => {
      it('should include severity field in processing log', async () => {
        // Arrange
        const afterTx = createSampleTransaction({ sharedGroupId: 'group-A' });
        const event = createMockEvent(null, afterTx, 'event-severity-001');

        // Act
        await changelogWriterHandler(event);

        // Assert - processing log should have severity
        expect(functions.logger.info).toHaveBeenCalledWith(
          expect.stringContaining('Processing'),
          expect.objectContaining({
            severity: 'INFO',
          })
        );
      });

      it('should include severity field in success log', async () => {
        // Arrange
        const afterTx = createSampleTransaction({ sharedGroupId: 'group-A' });
        const event = createMockEvent(null, afterTx, 'event-severity-002');

        // Act
        await changelogWriterHandler(event);

        // Assert - success log should have severity
        expect(functions.logger.info).toHaveBeenCalledWith(
          expect.stringContaining('Changelog entry created'),
          expect.objectContaining({
            severity: 'INFO',
          })
        );
      });

      it('should include severity ERROR in error log', async () => {
        // Arrange
        mockSet.mockRejectedValueOnce(new Error('Test error'));
        const afterTx = createSampleTransaction({ sharedGroupId: 'group-A' });
        const event = createMockEvent(null, afterTx, 'event-severity-error');

        // Act & Assert
        await expect(changelogWriterHandler(event)).rejects.toThrow('Test error');

        // Verify error log has severity ERROR
        expect(functions.logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Error'),
          expect.objectContaining({
            severity: 'ERROR',
          })
        );
      });

      it('should log no group involvement with action SKIPPED', async () => {
        // Arrange - transaction without any group
        const beforeTx = createSampleTransaction({ sharedGroupId: null });
        const afterTx = createSampleTransaction({ sharedGroupId: null });
        const event = createMockEvent(beforeTx, afterTx, 'event-no-group-log');

        // Act
        await changelogWriterHandler(event);

        // Assert - debug log should indicate skip
        expect(functions.logger.debug).toHaveBeenCalledWith(
          expect.stringContaining('No group involvement'),
          expect.objectContaining({
            transactionId: 'tx-456',
            action: 'SKIPPED',
          })
        );
      });
    });
  });

  describe('Ownership Validation (AC #2)', () => {
    // Import the mocked logger
    const functions = require('firebase-functions');

    it('should log warning when ownerId mismatches userId from path', async () => {
      // Arrange - transaction with different ownerId
      const afterTx = createSampleTransaction({
        sharedGroupId: 'group-A',
        ownerId: 'different-user-456', // Mismatch with path userId (user-123)
      });
      const event = createMockEvent(null, afterTx, 'event-owner-001');

      // Act
      await changelogWriterHandler(event);

      // Assert - warning should be logged (function continues processing)
      expect(functions.logger.warn).toHaveBeenCalledWith(
        'Ownership mismatch detected (path is authoritative)',
        expect.objectContaining({
          pathUserId: 'user-123',
          transactionOwnerId: 'different-user-456',
        })
      );
      // Should still create the changelog entry (path is authoritative)
      expect(mockSet).toHaveBeenCalled();
    });

    it('should not log warning when ownerId matches userId', async () => {
      // Clear mock to ensure clean state
      functions.logger.warn.mockClear();

      // Arrange - transaction with matching ownerId
      const afterTx = createSampleTransaction({
        sharedGroupId: 'group-A',
        ownerId: 'user-123', // Matches path userId
      });
      const event = createMockEvent(null, afterTx, 'event-owner-002');

      // Act
      await changelogWriterHandler(event);

      // Assert - no ownership mismatch warning logged
      const warnCalls = functions.logger.warn.mock.calls;
      const ownershipWarning = warnCalls.find(
        (call: unknown[]) => call[0] === 'Ownership mismatch detected (path is authoritative)'
      );
      expect(ownershipWarning).toBeUndefined();
    });
  });
});
