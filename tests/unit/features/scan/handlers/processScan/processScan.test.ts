/**
 * ProcessScan Main Handler Unit Tests
 *
 * Tests for the main processScan orchestration function.
 * Uses mocked dependencies to test each step of the workflow.
 *
 * Story 14e-8c: Main handler integration
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
    applyItemNameMappings: vi.fn().mockImplementation((tx) => ({
      transaction: tx,
      appliedIds: [],
    })),
    incrementMappingUsage: vi.fn(),
    incrementMerchantMappingUsage: vi.fn(),
    incrementItemNameMappingUsage: vi.fn(),
    ...overrides,
  };
}

/**
 * Create mock UI dependencies with all callbacks mocked.
 */
function createMockUIDeps(overrides: Partial<UIDependencies> = {}): UIDependencies {
  return {
    setScanError: vi.fn(),
    setCurrentTransaction: vi.fn(),
    setView: vi.fn(),
    showScanDialog: vi.fn(),
    dismissScanDialog: vi.fn(),
    dispatchProcessStart: vi.fn(),
    dispatchProcessSuccess: vi.fn(),
    dispatchProcessError: vi.fn(),
    setToastMessage: vi.fn(),
    setIsAnalyzing: vi.fn(),
    setScanImages: vi.fn(),
    setAnimateEditViewItems: vi.fn(),
    setSkipScanCompleteModal: vi.fn(),
    setCreditUsedInSession: vi.fn(),
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
      expect(params.ui.setScanError).toHaveBeenCalledWith(expect.any(String));
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
      expect(params.ui.setScanError).toHaveBeenCalled();
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

      expect(params.ui.setCreditUsedInSession).toHaveBeenCalledWith(true);
      expect(params.ui.dispatchProcessStart).toHaveBeenCalledWith('normal', 1);
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
      expect(params.ui.setAnimateEditViewItems).toHaveBeenCalledWith(true);
    });

    it('should set current transaction on success', async () => {
      const params = createMockParams();

      await processScan(params);

      expect(params.ui.setCurrentTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          merchant: 'Test Merchant',
          total: 10000,
        })
      );
    });

    it('should dispatch success with transaction', async () => {
      const params = createMockParams();

      await processScan(params);

      expect(params.ui.dispatchProcessSuccess).toHaveBeenCalledWith([
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
      expect(params.ui.setScanImages).toHaveBeenCalledWith([]);
      expect(params.ui.setView).toHaveBeenCalledWith('dashboard');
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
      expect(params.ui.showScanDialog).toHaveBeenCalledWith('quicksave', expect.any(Object));
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

      expect(params.ui.setCurrentTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        })
      );

      // Verify the date is current year, not future
      const call = (params.ui.setCurrentTransaction as ReturnType<typeof vi.fn>).mock.calls[0][0];
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
      expect(params.ui.setCurrentTransaction).toHaveBeenCalledWith(
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
      expect(params.ui.setCurrentTransaction).toHaveBeenCalledWith(
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
      expect(params.ui.dispatchProcessError).toHaveBeenCalledWith(expect.stringContaining('API Error'));
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
