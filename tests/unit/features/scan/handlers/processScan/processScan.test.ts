/**
 * ProcessScan Main Handler Unit Tests
 *
 * Tests for the main processScan orchestration function.
 * Uses mocked dependencies to test each step of the workflow.
 *
 * Story 14e-8c: Main handler integration
 * Story 14e-43: Updated to mock Zustand stores instead of UI callbacks
 *
 * @module tests/unit/features/scan/handlers/processScan/processScan.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processScan } from '../../../../../../src/features/scan/handlers/processScan/processScan';
import type {
  ProcessScanParams,
  ScanDependencies,
  UserDependencies,
  MappingDependencies,
  UIDependencies,
  ServiceDependencies,
  ScanOverlayController,
  TrustedAutoSaveDependencies,
  ScanResult,
  Transaction,
} from '../../../../../../src/features/scan/handlers/processScan/types';

// =============================================================================
// Story 14e-43: Mock Zustand Stores
// =============================================================================
// processScan now uses store actions directly instead of UI callbacks.
// We mock the store modules so tests can verify the correct actions are called.
// Using vi.hoisted() to ensure mocks are available when vi.mock factories run.

const { mockScanActions, mockTransactionEditorActions, mockNavigationActions, mockInsightActions } =
  vi.hoisted(() => ({
    mockScanActions: {
      processError: vi.fn(),
      processStart: vi.fn(),
      processSuccess: vi.fn(),
      showDialog: vi.fn(),
      setImages: vi.fn(),
      setSkipScanCompleteModal: vi.fn(),
    },
    mockTransactionEditorActions: {
      setTransaction: vi.fn(),
      setCreditUsed: vi.fn(),
      setAnimateItems: vi.fn(),
    },
    mockNavigationActions: {
      setView: vi.fn(),
    },
    mockInsightActions: {
      showInsight: vi.fn(),
      showBatchSummaryOverlay: vi.fn(),
    },
  }));

vi.mock('@features/scan/store', () => ({
  scanActions: mockScanActions,
}));

vi.mock('@features/transaction-editor/store', () => ({
  transactionEditorActions: mockTransactionEditorActions,
}));

vi.mock('@shared/stores', () => ({
  navigationActions: mockNavigationActions,
  insightActions: mockInsightActions,
}));

// =============================================================================
// Mock Factories
// =============================================================================

/**
 * Create mock scan dependencies with default values.
 */
function createMockScanDeps(overrides: Partial<ScanDependencies> = {}): ScanDependencies {
  return {
    images: ['base64-image-data'],
    currency: 'CLP',
    storeType: 'auto',
    defaultCountry: 'Chile',
    defaultCity: 'Santiago',
    ...overrides,
  };
}

/**
 * Create mock user dependencies with default values.
 */
function createMockUserDeps(overrides: Partial<UserDependencies> = {}): UserDependencies {
  return {
    userId: 'test-user-123',
    creditsRemaining: 10,
    defaultCurrency: 'CLP',
    transactions: [],
    ...overrides,
  };
}

/**
 * Create mock mapping dependencies with all functions mocked.
 */
function createMockMappingDeps(overrides: Partial<MappingDependencies> = {}): MappingDependencies {
  return {
    mappings: [],
    applyCategoryMappings: vi.fn().mockImplementation((tx) => ({
      transaction: tx,
      appliedMappingIds: [],
    })),
    findMerchantMatch: vi.fn().mockReturnValue(null),
    // Story 14e-42: Now uses findItemNameMatch for DI to pure utility
    findItemNameMatch: vi.fn().mockReturnValue(null),
    incrementMappingUsage: vi.fn(),
    incrementMerchantMappingUsage: vi.fn(),
    incrementItemNameMappingUsage: vi.fn(),
    ...overrides,
  };
}

/**
 * Create mock UI dependencies with only required callbacks.
 * Story 14e-43: Most UI callbacks are now handled via Zustand stores.
 * Only setToastMessage is still injected from App.tsx.
 */
function createMockUIDeps(overrides: Partial<UIDependencies> = {}): UIDependencies {
  return {
    // Story 14e-43: Only setToastMessage is required - other callbacks are deprecated
    setToastMessage: vi.fn(),
    ...overrides,
  };
}

/**
 * Create mock scan overlay controller.
 */
function createMockScanOverlay(
  overrides: Partial<ScanOverlayController> = {}
): ScanOverlayController {
  return {
    startUpload: vi.fn(),
    setProgress: vi.fn(),
    startProcessing: vi.fn(),
    setReady: vi.fn(),
    setError: vi.fn(),
    ...overrides,
  };
}

/**
 * Create mock service dependencies.
 */
function createMockServiceDeps(overrides: Partial<ServiceDependencies> = {}): ServiceDependencies {
  const defaultScanResult: ScanResult = {
    merchant: 'Test Merchant',
    date: '2025-01-20',
    total: 10000,
    category: 'Supermercado',
    items: [
      { name: 'Item 1', price: 5000, qty: 1 },
      { name: 'Item 2', price: 5000, qty: 1 },
    ],
    currency: 'CLP',
    country: 'Chile',
    city: 'Santiago',
  };

  return {
    analyzeReceipt: vi.fn().mockResolvedValue(defaultScanResult),
    deductUserCredits: vi.fn().mockResolvedValue(true),
    addUserCredits: vi.fn().mockResolvedValue(undefined),
    getCitiesForCountry: vi.fn().mockReturnValue(['Santiago', 'Valparaíso']),
    ...overrides,
  };
}

/**
 * Create mock trusted auto-save dependencies.
 */
function createMockTrustedAutoSaveDeps(
  overrides: Partial<TrustedAutoSaveDependencies> = {}
): TrustedAutoSaveDependencies {
  return {
    checkTrusted: vi.fn().mockResolvedValue(false),
    saveTransaction: vi.fn().mockResolvedValue('tx-123'),
    generateInsight: vi.fn().mockResolvedValue(null),
    addToBatch: vi.fn(),
    recordMerchantScan: vi.fn().mockResolvedValue(undefined),
    insightProfile: null,
    insightCache: {},
    isInsightsSilenced: vi.fn().mockReturnValue(false),
    batchSession: null,
    onShowInsight: vi.fn(),
    onShowBatchSummary: vi.fn(),
    ...overrides,
  };
}

/**
 * Create full ProcessScanParams with all mocks.
 */
function createMockParams(
  overrides: Partial<{
    scan: Partial<ScanDependencies>;
    user: Partial<UserDependencies>;
    mapping: Partial<MappingDependencies>;
    ui: Partial<UIDependencies>;
    scanOverlay: Partial<ScanOverlayController>;
    services: Partial<ServiceDependencies>;
    trustedAutoSave: Partial<TrustedAutoSaveDependencies> | null;
  }> = {}
): ProcessScanParams {
  return {
    scan: createMockScanDeps(overrides.scan),
    user: createMockUserDeps(overrides.user),
    mapping: createMockMappingDeps(overrides.mapping),
    ui: createMockUIDeps(overrides.ui),
    scanOverlay: createMockScanOverlay(overrides.scanOverlay),
    services: createMockServiceDeps(overrides.services),
    t: vi.fn().mockImplementation((key: string) => key),
    lang: 'es',
    viewMode: 'personal',
    trustedAutoSave:
      overrides.trustedAutoSave === null
        ? undefined
        : createMockTrustedAutoSaveDeps(overrides.trustedAutoSave),
    prefersReducedMotion: true, // Disable haptics in tests
    processingTimeoutMs: 5000, // Short timeout for tests
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('processScan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Story 14e-43: Also reset all store action mocks
    Object.values(mockScanActions).forEach((fn) => fn.mockClear());
    Object.values(mockTransactionEditorActions).forEach((fn) => fn.mockClear());
    Object.values(mockNavigationActions).forEach((fn) => fn.mockClear());
    Object.values(mockInsightActions).forEach((fn) => fn.mockClear());
  });

  // ===========================================================================
  // Input Validation Tests
  // ===========================================================================

  describe('input validation', () => {
    it('should reject when no images provided', async () => {
      const params = createMockParams({
        scan: { images: [] },
      });

      const result = await processScan(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No images to scan');
      // Story 14e-43: Now uses store action instead of ui callback
      expect(mockScanActions.processError).toHaveBeenCalledWith(expect.any(String));
      expect(params.services.analyzeReceipt).not.toHaveBeenCalled();
    });

    it('should reject when images is undefined', async () => {
      const params = createMockParams({
        scan: { images: undefined as unknown as string[] },
      });

      const result = await processScan(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No images to scan');
    });
  });

  // ===========================================================================
  // Credit Handling Tests
  // ===========================================================================

  describe('credit handling', () => {
    it('should reject when no credits remaining', async () => {
      const params = createMockParams({
        user: { creditsRemaining: 0 },
      });

      const result = await processScan(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No credits');
      // Story 14e-43: Now uses store action instead of ui callback
      expect(mockScanActions.processError).toHaveBeenCalled();
      expect(params.ui.setToastMessage).toHaveBeenCalledWith({
        text: 'noCreditsMessage',
        type: 'info',
      });
      expect(params.services.deductUserCredits).not.toHaveBeenCalled();
    });

    it('should reject when credit deduction fails', async () => {
      const params = createMockParams({
        services: {
          deductUserCredits: vi.fn().mockResolvedValue(false),
        },
      });

      const result = await processScan(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Credit deduction failed');
      expect(params.services.deductUserCredits).toHaveBeenCalledWith(1);
    });

    it('should refund credit on API error', async () => {
      const params = createMockParams({
        services: {
          analyzeReceipt: vi.fn().mockRejectedValue(new Error('Network error')),
          deductUserCredits: vi.fn().mockResolvedValue(true),
          addUserCredits: vi.fn().mockResolvedValue(undefined),
          getCitiesForCountry: vi.fn().mockReturnValue([]),
        },
      });

      const result = await processScan(params);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(params.services.addUserCredits).toHaveBeenCalledWith(1);
      expect(params.ui.setToastMessage).toHaveBeenCalledWith({
        text: 'scanFailedCreditRefunded',
        type: 'info',
      });
    });

    it('should refund credit on timeout', async () => {
      const params = createMockParams({
        services: {
          analyzeReceipt: vi
            .fn()
            .mockImplementation(
              () => new Promise((resolve) => setTimeout(resolve, 10000))
            ),
          deductUserCredits: vi.fn().mockResolvedValue(true),
          addUserCredits: vi.fn().mockResolvedValue(undefined),
          getCitiesForCountry: vi.fn().mockReturnValue([]),
        },
      });

      // Use short timeout
      params.processingTimeoutMs = 100;

      const result = await processScan(params);

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
      expect(params.services.addUserCredits).toHaveBeenCalledWith(1);
      expect(params.scanOverlay.setError).toHaveBeenCalledWith('timeout', expect.any(String));
    });
  });

  // ===========================================================================
  // Processing Flow Tests
  // ===========================================================================

  describe('processing flow', () => {
    it('should start processing sequence on valid input', async () => {
      const params = createMockParams();

      await processScan(params);

      // Story 14e-43: Now uses store actions instead of ui callbacks
      expect(mockTransactionEditorActions.setCreditUsed).toHaveBeenCalledWith(true);
      expect(mockScanActions.processStart).toHaveBeenCalledWith('normal', 1);
      expect(params.scanOverlay.startUpload).toHaveBeenCalled();
      expect(params.scanOverlay.setProgress).toHaveBeenCalledWith(100);
      expect(params.scanOverlay.startProcessing).toHaveBeenCalled();
    });

    it('should call analyzeReceipt with correct parameters', async () => {
      const params = createMockParams({
        scan: {
          images: ['image1', 'image2'],
          currency: 'USD',
          storeType: 'Supermercado',
        },
      });

      await processScan(params);

      expect(params.services.analyzeReceipt).toHaveBeenCalledWith(
        ['image1', 'image2'],
        'USD',
        'Supermercado'
      );
    });

    it('should pass undefined for auto store type', async () => {
      const params = createMockParams({
        scan: { storeType: 'auto' },
      });

      await processScan(params);

      expect(params.services.analyzeReceipt).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(String),
        undefined
      );
    });
  });

  // ===========================================================================
  // Success Routing Tests
  // ===========================================================================

  describe('success routing', () => {
    it('should route to edit-view when no trusted auto-save deps', async () => {
      const params = createMockParams({
        trustedAutoSave: null,
      });

      const result = await processScan(params);

      expect(result.success).toBe(true);
      expect(result.route).toBe('edit-view');
      // Story 14e-43: Now uses store action instead of ui callback
      expect(mockTransactionEditorActions.setAnimateItems).toHaveBeenCalledWith(true);
    });

    it('should set current transaction on success', async () => {
      const params = createMockParams();

      await processScan(params);

      // Story 14e-43: Now uses store action instead of ui callback
      expect(mockTransactionEditorActions.setTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          merchant: 'Test Merchant',
          total: 10000,
        })
      );
    });

    it('should dispatch success with transaction', async () => {
      const params = createMockParams();

      await processScan(params);

      // Story 14e-43: Now uses store action instead of ui callback
      expect(mockScanActions.processSuccess).toHaveBeenCalledWith([
        expect.objectContaining({
          merchant: 'Test Merchant',
        }),
      ]);
      expect(params.scanOverlay.setReady).toHaveBeenCalled();
    });

    it('should route to trusted-autosave for trusted merchants', async () => {
      const params = createMockParams({
        trustedAutoSave: {
          checkTrusted: vi.fn().mockResolvedValue(true),
          saveTransaction: vi.fn().mockResolvedValue('saved-tx-id'),
        },
      });

      const result = await processScan(params);

      expect(result.success).toBe(true);
      expect(result.route).toBe('trusted-autosave');
      expect(result.isTrusted).toBe(true);
    });

    it('should save transaction and generate insight for trusted auto-save', async () => {
      const mockSaveTransaction = vi.fn().mockResolvedValue('saved-tx-id');
      const mockGenerateInsight = vi.fn().mockResolvedValue({ id: 'insight-1', text: 'Test insight' });
      const mockAddToBatch = vi.fn();

      const params = createMockParams({
        trustedAutoSave: {
          checkTrusted: vi.fn().mockResolvedValue(true),
          saveTransaction: mockSaveTransaction,
          generateInsight: mockGenerateInsight,
          addToBatch: mockAddToBatch,
        },
      });

      const result = await processScan(params);

      expect(result.success).toBe(true);
      expect(mockSaveTransaction).toHaveBeenCalled();
      expect(mockGenerateInsight).toHaveBeenCalled();
      expect(mockAddToBatch).toHaveBeenCalled();
      // Story 14e-43: Now uses store actions instead of ui callbacks
      expect(mockScanActions.setImages).toHaveBeenCalledWith([]);
      expect(mockNavigationActions.setView).toHaveBeenCalledWith('dashboard');
    });

    it('should fall back to quicksave if trusted auto-save fails', async () => {
      const params = createMockParams({
        trustedAutoSave: {
          checkTrusted: vi.fn().mockResolvedValue(true),
          saveTransaction: vi.fn().mockRejectedValue(new Error('Save failed')),
        },
      });

      const result = await processScan(params);

      expect(result.success).toBe(true);
      expect(result.route).toBe('quicksave');
      expect(result.isTrusted).toBe(true); // Was trusted, but save failed
      // Story 14e-43: Now uses store action instead of ui callback
      expect(mockScanActions.showDialog).toHaveBeenCalledWith({
        type: 'quicksave',
        data: expect.any(Object),
      });
    });
  });

  // ===========================================================================
  // Date Validation Tests
  // ===========================================================================

  describe('date validation', () => {
    it('should fix future year dates', async () => {
      const futureYear = new Date().getFullYear() + 1;
      const params = createMockParams({
        services: {
          analyzeReceipt: vi.fn().mockResolvedValue({
            merchant: 'Test',
            date: `${futureYear}-01-20`,
            total: 1000,
            // Provide items that sum to total to pass validation
            items: [{ name: 'Item', price: 1000, qty: 1 }],
            currency: 'CLP',
          }),
          deductUserCredits: vi.fn().mockResolvedValue(true),
          addUserCredits: vi.fn().mockResolvedValue(undefined),
          getCitiesForCountry: vi.fn().mockReturnValue([]),
        },
        trustedAutoSave: null, // No trusted check needed
      });

      await processScan(params);

      // Story 14e-43: Now uses store action instead of ui callback
      expect(mockTransactionEditorActions.setTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        })
      );

      // Verify the date is current year, not future
      const call = mockTransactionEditorActions.setTransaction.mock.calls[0][0];
      const year = new Date(call.date).getFullYear();
      expect(year).toBe(new Date().getFullYear());
    });
  });

  // ===========================================================================
  // Mapping Application Tests
  // ===========================================================================

  describe('mapping application', () => {
    it('should apply category mappings', async () => {
      const mockApplyCategoryMappings = vi.fn().mockImplementation((tx) => ({
        transaction: { ...tx, category: 'Mapped Category' },
        appliedMappingIds: ['mapping-1'],
      }));

      const params = createMockParams({
        mapping: {
          applyCategoryMappings: mockApplyCategoryMappings,
          mappings: [{ id: 'mapping-1' }],
        },
      });

      await processScan(params);

      expect(mockApplyCategoryMappings).toHaveBeenCalled();
    });

    it('should apply merchant mapping when confidence is high', async () => {
      const mockFindMerchantMatch = vi.fn().mockReturnValue({
        mapping: {
          id: 'merchant-mapping-1',
          targetMerchant: 'Normalized Merchant',
          normalizedMerchant: 'normalized_merchant',
          storeCategory: 'Supermercado',
        },
        confidence: 0.9,
      });

      const params = createMockParams({
        mapping: {
          findMerchantMatch: mockFindMerchantMatch,
        },
      });

      await processScan(params);

      expect(mockFindMerchantMatch).toHaveBeenCalled();
      // Story 14e-43: Now uses store action instead of ui callback
      expect(mockTransactionEditorActions.setTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          alias: 'Normalized Merchant',
          merchantSource: 'learned',
        })
      );
    });

    it('should NOT apply merchant mapping when confidence is low', async () => {
      const mockFindMerchantMatch = vi.fn().mockReturnValue({
        mapping: {
          id: 'merchant-mapping-1',
          targetMerchant: 'Normalized Merchant',
          normalizedMerchant: 'normalized_merchant',
        },
        confidence: 0.5, // Below threshold of 0.7
      });

      const params = createMockParams({
        mapping: {
          findMerchantMatch: mockFindMerchantMatch,
        },
      });

      await processScan(params);

      // Should not have alias from mapping
      // Story 14e-43: Now uses store action instead of ui callback
      expect(mockTransactionEditorActions.setTransaction).toHaveBeenCalledWith(
        expect.not.objectContaining({
          alias: 'Normalized Merchant',
        })
      );
    });
  });

  // ===========================================================================
  // Error State Tests
  // ===========================================================================

  describe('error handling', () => {
    it('should dispatch error on API failure', async () => {
      const params = createMockParams({
        services: {
          analyzeReceipt: vi.fn().mockRejectedValue(new Error('API Error')),
          deductUserCredits: vi.fn().mockResolvedValue(true),
          addUserCredits: vi.fn().mockResolvedValue(undefined),
          getCitiesForCountry: vi.fn().mockReturnValue([]),
        },
      });

      const result = await processScan(params);

      expect(result.success).toBe(false);
      // Story 14e-43: Now uses store action instead of ui callback
      expect(mockScanActions.processError).toHaveBeenCalledWith(expect.stringContaining('API Error'));
      expect(params.scanOverlay.setError).toHaveBeenCalledWith('api', expect.any(String));
    });

    it('should handle unknown error types', async () => {
      const params = createMockParams({
        services: {
          analyzeReceipt: vi.fn().mockRejectedValue('string error'),
          deductUserCredits: vi.fn().mockResolvedValue(true),
          addUserCredits: vi.fn().mockResolvedValue(undefined),
          getCitiesForCountry: vi.fn().mockReturnValue([]),
        },
      });

      const result = await processScan(params);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown error');
    });
  });

  // ===========================================================================
  // Return Value Tests
  // ===========================================================================

  describe('return values', () => {
    it('should return complete result on success', async () => {
      const params = createMockParams({
        trustedAutoSave: null,
      });

      const result = await processScan(params);

      expect(result).toMatchObject({
        success: true,
        route: 'edit-view',
        hasDiscrepancy: false,
        isTrusted: false,
      });
      expect(result.transaction).toBeDefined();
      expect(result.confidence).toBeDefined();
    });

    it('should include hasDiscrepancy flag when items dont match total', async () => {
      const params = createMockParams({
        services: {
          analyzeReceipt: vi.fn().mockResolvedValue({
            merchant: 'Test',
            date: '2025-01-20',
            total: 15000, // Total doesn't match items sum (10000)
            items: [
              { name: 'Item 1', price: 5000, qty: 1 },
              { name: 'Item 2', price: 5000, qty: 1 },
            ],
            currency: 'CLP',
          }),
          deductUserCredits: vi.fn().mockResolvedValue(true),
          addUserCredits: vi.fn().mockResolvedValue(undefined),
          getCitiesForCountry: vi.fn().mockReturnValue([]),
        },
        trustedAutoSave: null,
      });

      const result = await processScan(params);

      expect(result.success).toBe(true);
      expect(result.hasDiscrepancy).toBe(true);
      expect(params.ui.setToastMessage).toHaveBeenCalledWith({
        text: 'discrepancyWarning',
        type: 'info',
      });
    });
  });
});
