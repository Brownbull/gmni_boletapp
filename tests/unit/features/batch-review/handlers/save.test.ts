/**
 * Story 14e-14b: Batch Save Handlers Tests
 *
 * Tests for saveBatchTransaction and handleSaveComplete handlers.
 * Covers:
 * - AC3: Save handlers extract correctly
 * - AC4: Auth check, state reset, dialog display
 *
 * Source:
 * - handleBatchSaveTransaction: src/App.tsx:1945-2008
 * - handleBatchSaveComplete: src/App.tsx:1929-1942
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  saveBatchTransaction,
  handleSaveComplete,
} from '@features/batch-review/handlers';
import type {
  SaveContext,
  SaveCompleteContext,
  CategoryMappingResult,
  MerchantMatchResult,
  ItemNameMappingResult,
} from '@features/batch-review/handlers';
import type { Transaction, StoreCategory } from '@/types/transaction';
import type { User } from 'firebase/auth';
import type { Services } from '@/contexts/AuthContext';
import { DIALOG_TYPES } from '@/types/scanStateMachine';

// =============================================================================
// Mocks
// =============================================================================

// Mock Firestore service
vi.mock('@/services/firestore', () => ({
  addTransaction: vi.fn().mockResolvedValue('mock-transaction-id'),
}));

// Mock mapping services
vi.mock('@/services/categoryMappingService', () => ({
  incrementMappingUsage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/services/merchantMappingService', () => ({
  incrementMerchantMappingUsage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/services/itemNameMappingService', () => ({
  incrementItemNameMappingUsage: vi.fn().mockResolvedValue(undefined),
}));

// Mock shared group service
vi.mock('@/services/sharedGroupService', () => ({
  updateMemberTimestampsForTransaction: vi.fn().mockResolvedValue(undefined),
}));

// Import mocked functions for assertions
import { addTransaction } from '@/services/firestore';
import { incrementMappingUsage } from '@/services/categoryMappingService';
import { incrementMerchantMappingUsage } from '@/services/merchantMappingService';
import { incrementItemNameMappingUsage } from '@/services/itemNameMappingService';
import { updateMemberTimestampsForTransaction } from '@/services/sharedGroupService';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a mock transaction for testing.
 */
function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'test-tx-1',
    date: '2026-01-26',
    merchant: 'Test Merchant',
    category: 'Supermarket',
    total: 1000,
    items: [{ name: 'Test Item', price: 1000, qty: 1 }],
    currency: 'CLP',
    ...overrides,
  };
}

/**
 * Create mock services for testing.
 */
function createMockServices(): Services {
  return {
    auth: {} as Services['auth'],
    db: {} as Services['db'],
    appId: 'test-app-id',
  };
}

/**
 * Create a mock user for testing.
 */
function createMockUser(): User {
  return {
    uid: 'test-user-id',
    email: 'test@example.com',
  } as User;
}

/**
 * Create a mock save context with default implementations.
 */
function createMockSaveContext(
  overrides: Partial<SaveContext> = {}
): SaveContext {
  const defaultApplyCategoryMappings = (
    tx: Transaction,
    _mappings: unknown[]
  ): CategoryMappingResult => ({
    transaction: tx,
    appliedMappingIds: [],
  });

  const defaultFindMerchantMatch = (): MerchantMatchResult | null => null;

  const defaultApplyItemNameMappings = (
    tx: Transaction,
    _normalizedMerchant: string
  ): ItemNameMappingResult => ({
    transaction: tx,
    appliedIds: [],
  });

  return {
    services: createMockServices(),
    user: createMockUser(),
    mappings: [],
    applyCategoryMappings: defaultApplyCategoryMappings,
    findMerchantMatch: defaultFindMerchantMatch,
    applyItemNameMappings: defaultApplyItemNameMappings,
    ...overrides,
  };
}

/**
 * Create a mock save complete context with mocked functions.
 */
function createMockSaveCompleteContext(): {
  context: SaveCompleteContext;
  mocks: {
    setBatchImages: ReturnType<typeof vi.fn>;
    reset: ReturnType<typeof vi.fn>;
    resetScanContext: ReturnType<typeof vi.fn>;
    showScanDialog: ReturnType<typeof vi.fn>;
    setView: ReturnType<typeof vi.fn>;
  };
} {
  const mocks = {
    setBatchImages: vi.fn(),
    reset: vi.fn(),
    resetScanContext: vi.fn(),
    showScanDialog: vi.fn(),
    setView: vi.fn(),
  };

  return {
    context: {
      setBatchImages: mocks.setBatchImages,
      batchProcessing: { reset: mocks.reset },
      resetScanContext: mocks.resetScanContext,
      showScanDialog: mocks.showScanDialog,
      setView: mocks.setView,
    },
    mocks,
  };
}

// =============================================================================
// Tests: saveBatchTransaction
// =============================================================================

describe('saveBatchTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication check', () => {
    it('should throw error when services is null', async () => {
      const transaction = createMockTransaction();
      const context = createMockSaveContext({ services: null });

      await expect(saveBatchTransaction(transaction, context)).rejects.toThrow(
        'Not authenticated'
      );
    });

    it('should throw error when user is null', async () => {
      const transaction = createMockTransaction();
      const context = createMockSaveContext({ user: null });

      await expect(saveBatchTransaction(transaction, context)).rejects.toThrow(
        'Not authenticated'
      );
    });

    it('should throw error when both services and user are null', async () => {
      const transaction = createMockTransaction();
      const context = createMockSaveContext({ services: null, user: null });

      await expect(saveBatchTransaction(transaction, context)).rejects.toThrow(
        'Not authenticated'
      );
    });
  });

  describe('category mapping application', () => {
    it('should apply category mappings to transaction', async () => {
      const transaction = createMockTransaction();
      const appliedMappingIds = ['mapping-1', 'mapping-2'];
      const applyCategoryMappings = vi.fn().mockReturnValue({
        transaction,
        appliedMappingIds,
      });

      const context = createMockSaveContext({ applyCategoryMappings });

      await saveBatchTransaction(transaction, context);

      expect(applyCategoryMappings).toHaveBeenCalledWith(transaction, []);
    });

    it('should increment mapping usage for applied mappings', async () => {
      const transaction = createMockTransaction();
      const appliedMappingIds = ['mapping-1', 'mapping-2'];

      const context = createMockSaveContext({
        applyCategoryMappings: () => ({
          transaction,
          appliedMappingIds,
        }),
      });

      await saveBatchTransaction(transaction, context);

      // Wait for async operations
      await vi.waitFor(() => {
        expect(incrementMappingUsage).toHaveBeenCalledTimes(2);
      });
    });

    it('should not increment mapping usage when no mappings applied', async () => {
      const transaction = createMockTransaction();

      const context = createMockSaveContext({
        applyCategoryMappings: () => ({
          transaction,
          appliedMappingIds: [],
        }),
      });

      await saveBatchTransaction(transaction, context);

      expect(incrementMappingUsage).not.toHaveBeenCalled();
    });
  });

  describe('merchant mapping application', () => {
    it('should apply merchant mapping when confidence > 0.7', async () => {
      const transaction = createMockTransaction({ merchant: 'Walmart' });
      const merchantMatch: MerchantMatchResult = {
        mapping: {
          id: 'merchant-mapping-1',
          targetMerchant: 'Walmart Superstore',
          normalizedMerchant: 'walmart',
          storeCategory: 'Supermarket',
        },
        confidence: 0.9,
      };

      const context = createMockSaveContext({
        findMerchantMatch: () => merchantMatch,
        applyCategoryMappings: (tx) => ({
          transaction: tx,
          appliedMappingIds: [],
        }),
        applyItemNameMappings: (tx) => ({
          transaction: tx,
          appliedIds: [],
        }),
      });

      await saveBatchTransaction(transaction, context);

      expect(addTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          alias: 'Walmart Superstore',
          category: 'Supermarket',
          merchantSource: 'learned',
        })
      );
    });

    it('should not apply merchant mapping when confidence <= 0.7', async () => {
      const transaction = createMockTransaction({ merchant: 'Unknown Store' });
      const merchantMatch: MerchantMatchResult = {
        mapping: {
          id: 'merchant-mapping-1',
          targetMerchant: 'Matched Store',
          normalizedMerchant: 'matched',
        },
        confidence: 0.5, // Below threshold
      };

      const context = createMockSaveContext({
        findMerchantMatch: () => merchantMatch,
        applyCategoryMappings: (tx) => ({
          transaction: tx,
          appliedMappingIds: [],
        }),
      });

      await saveBatchTransaction(transaction, context);

      expect(addTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.not.objectContaining({
          alias: 'Matched Store',
        })
      );
    });

    it('should increment merchant mapping usage when applied', async () => {
      const transaction = createMockTransaction();
      const merchantMatch: MerchantMatchResult = {
        mapping: {
          id: 'merchant-mapping-123',
          targetMerchant: 'Target Store',
          normalizedMerchant: 'target',
        },
        confidence: 0.85,
      };

      const context = createMockSaveContext({
        findMerchantMatch: () => merchantMatch,
        applyCategoryMappings: (tx) => ({
          transaction: tx,
          appliedMappingIds: [],
        }),
        applyItemNameMappings: (tx) => ({
          transaction: tx,
          appliedIds: [],
        }),
      });

      await saveBatchTransaction(transaction, context);

      await vi.waitFor(() => {
        expect(incrementMerchantMappingUsage).toHaveBeenCalledWith(
          expect.anything(),
          'test-user-id',
          'test-app-id',
          'merchant-mapping-123'
        );
      });
    });

    it('should handle merchant match without mapping id', async () => {
      const transaction = createMockTransaction();
      const merchantMatch: MerchantMatchResult = {
        mapping: {
          // No id
          targetMerchant: 'Target Store',
          normalizedMerchant: 'target',
        },
        confidence: 0.85,
      };

      const context = createMockSaveContext({
        findMerchantMatch: () => merchantMatch,
        applyCategoryMappings: (tx) => ({
          transaction: tx,
          appliedMappingIds: [],
        }),
        applyItemNameMappings: (tx) => ({
          transaction: tx,
          appliedIds: [],
        }),
      });

      await saveBatchTransaction(transaction, context);

      expect(incrementMerchantMappingUsage).not.toHaveBeenCalled();
    });
  });

  describe('item name mapping application', () => {
    it('should apply item name mappings when merchant matches', async () => {
      const transaction = createMockTransaction({
        items: [{ name: 'MILK 1L', price: 500, qty: 1 }],
      });
      const merchantMatch: MerchantMatchResult = {
        mapping: {
          id: 'merchant-1',
          targetMerchant: 'Store',
          normalizedMerchant: 'store',
        },
        confidence: 0.9,
      };
      const applyItemNameMappings = vi.fn().mockReturnValue({
        transaction: {
          ...transaction,
          items: [{ name: 'Milk 1 Liter', price: 500, qty: 1 }],
        },
        appliedIds: ['item-mapping-1'],
      });

      const context = createMockSaveContext({
        findMerchantMatch: () => merchantMatch,
        applyCategoryMappings: (tx) => ({
          transaction: tx,
          appliedMappingIds: [],
        }),
        applyItemNameMappings,
      });

      await saveBatchTransaction(transaction, context);

      expect(applyItemNameMappings).toHaveBeenCalledWith(
        expect.anything(),
        'store' // normalizedMerchant
      );
    });

    it('should increment item name mapping usage when applied', async () => {
      const transaction = createMockTransaction();
      const merchantMatch: MerchantMatchResult = {
        mapping: {
          id: 'merchant-1',
          targetMerchant: 'Store',
          normalizedMerchant: 'store',
        },
        confidence: 0.9,
      };

      const context = createMockSaveContext({
        findMerchantMatch: () => merchantMatch,
        applyCategoryMappings: (tx) => ({
          transaction: tx,
          appliedMappingIds: [],
        }),
        applyItemNameMappings: (tx) => ({
          transaction: tx,
          appliedIds: ['item-1', 'item-2'],
        }),
      });

      await saveBatchTransaction(transaction, context);

      await vi.waitFor(() => {
        expect(incrementItemNameMappingUsage).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Firestore save', () => {
    it('should save transaction to Firestore', async () => {
      const transaction = createMockTransaction({ id: 'tx-to-save' });
      const context = createMockSaveContext();

      await saveBatchTransaction(transaction, context);

      expect(addTransaction).toHaveBeenCalledWith(
        expect.anything(), // db
        'test-user-id',
        'test-app-id',
        expect.objectContaining({ id: 'tx-to-save' })
      );
    });

    it('should return the transaction ID', async () => {
      const transaction = createMockTransaction();
      const context = createMockSaveContext();

      const result = await saveBatchTransaction(transaction, context);

      expect(result).toBe('mock-transaction-id');
    });
  });

  describe('shared group handling', () => {
    it('should update member timestamps for shared groups', async () => {
      const transaction = createMockTransaction({
        sharedGroupIds: ['group-1', 'group-2'],
      });
      const context = createMockSaveContext();

      await saveBatchTransaction(transaction, context);

      await vi.waitFor(() => {
        expect(updateMemberTimestampsForTransaction).toHaveBeenCalledWith(
          expect.anything(),
          'test-user-id',
          ['group-1', 'group-2'],
          [] // No previous groups for new transactions
        );
      });
    });

    it('should not update member timestamps when no shared groups', async () => {
      const transaction = createMockTransaction({
        sharedGroupIds: undefined,
      });
      const context = createMockSaveContext();

      await saveBatchTransaction(transaction, context);

      expect(updateMemberTimestampsForTransaction).not.toHaveBeenCalled();
    });

    it('should not update member timestamps when shared groups is empty', async () => {
      const transaction = createMockTransaction({
        sharedGroupIds: [],
      });
      const context = createMockSaveContext();

      await saveBatchTransaction(transaction, context);

      expect(updateMemberTimestampsForTransaction).not.toHaveBeenCalled();
    });
  });
});

// =============================================================================
// Tests: handleSaveComplete
// =============================================================================

describe('handleSaveComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('state reset', () => {
    it('should clear batch images', () => {
      const { context, mocks } = createMockSaveCompleteContext();

      handleSaveComplete([], context);

      expect(mocks.setBatchImages).toHaveBeenCalledWith([]);
    });

    it('should reset batch processing', () => {
      const { context, mocks } = createMockSaveCompleteContext();

      handleSaveComplete([], context);

      expect(mocks.reset).toHaveBeenCalled();
    });

    it('should reset scan context', () => {
      const { context, mocks } = createMockSaveCompleteContext();

      handleSaveComplete([], context);

      expect(mocks.resetScanContext).toHaveBeenCalled();
    });

    it('should navigate to dashboard', () => {
      const { context, mocks } = createMockSaveCompleteContext();

      handleSaveComplete([], context);

      expect(mocks.setView).toHaveBeenCalledWith('dashboard');
    });

    it('should reset state even with empty transactions', () => {
      const { context, mocks } = createMockSaveCompleteContext();

      handleSaveComplete([], context);

      expect(mocks.setBatchImages).toHaveBeenCalled();
      expect(mocks.reset).toHaveBeenCalled();
      expect(mocks.resetScanContext).toHaveBeenCalled();
    });
  });

  describe('batch complete dialog', () => {
    it('should show batch complete dialog when transactions were saved', () => {
      const { context, mocks } = createMockSaveCompleteContext();
      const transactions = [
        createMockTransaction({ id: 'tx-1' }),
        createMockTransaction({ id: 'tx-2' }),
      ];

      handleSaveComplete(transactions, context);

      expect(mocks.showScanDialog).toHaveBeenCalledWith(
        DIALOG_TYPES.BATCH_COMPLETE,
        expect.objectContaining({
          transactions,
          creditsUsed: 1,
        })
      );
    });

    it('should not show dialog when no transactions were saved', () => {
      const { context, mocks } = createMockSaveCompleteContext();

      handleSaveComplete([], context);

      expect(mocks.showScanDialog).not.toHaveBeenCalled();
    });

    it('should include correct credits used (always 1 for batch)', () => {
      const { context, mocks } = createMockSaveCompleteContext();
      const transactions = [
        createMockTransaction({ id: 'tx-1' }),
        createMockTransaction({ id: 'tx-2' }),
        createMockTransaction({ id: 'tx-3' }),
      ];

      handleSaveComplete(transactions, context);

      expect(mocks.showScanDialog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          creditsUsed: 1, // 1 super credit regardless of count
        })
      );
    });
  });

  describe('function call order', () => {
    it('should call functions in correct order', () => {
      const { context, mocks } = createMockSaveCompleteContext();
      const callOrder: string[] = [];

      mocks.setBatchImages.mockImplementation(() => callOrder.push('setBatchImages'));
      mocks.reset.mockImplementation(() => callOrder.push('reset'));
      mocks.resetScanContext.mockImplementation(() => callOrder.push('resetScanContext'));
      mocks.showScanDialog.mockImplementation(() => callOrder.push('showScanDialog'));
      mocks.setView.mockImplementation(() => callOrder.push('setView'));

      const transactions = [createMockTransaction()];
      handleSaveComplete(transactions, context);

      expect(callOrder).toEqual([
        'setBatchImages',
        'reset',
        'resetScanContext',
        'showScanDialog',
        'setView',
      ]);
    });
  });

  describe('single transaction', () => {
    it('should show dialog for single saved transaction', () => {
      const { context, mocks } = createMockSaveCompleteContext();
      const transactions = [createMockTransaction({ id: 'single-tx' })];

      handleSaveComplete(transactions, context);

      expect(mocks.showScanDialog).toHaveBeenCalledWith(
        DIALOG_TYPES.BATCH_COMPLETE,
        expect.objectContaining({
          transactions: [expect.objectContaining({ id: 'single-tx' })],
        })
      );
    });
  });
});
