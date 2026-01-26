/**
 * Story 14e-14c: Batch Credit Check Handler Tests
 *
 * Tests for confirmWithCreditCheck handler.
 * Covers:
 * - AC3: Credit check handler extracted
 * - AC4: Unit tests for credit check using super credits
 *
 * Source: App.tsx lines 1561-1565 (handleBatchConfirmWithCreditCheck)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { confirmWithCreditCheck } from '@features/batch-review/handlers';
import type { CreditCheckContext } from '@features/batch-review/handlers';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create mock user credits for testing.
 */
function createMockUserCredits(
  superRemaining: number = 5,
  remaining: number = 100
): CreditCheckContext['userCredits'] {
  return {
    remaining,
    used: 0,
    superRemaining,
    superUsed: 0,
  };
}

/**
 * Create a mock credit check result.
 */
function createMockCreditCheckResult(
  sufficient: boolean,
  available: number
): ReturnType<CreditCheckContext['checkCreditSufficiency']> {
  return {
    sufficient,
    available,
    required: 1,
    remaining: sufficient ? available - 1 : 0,
    shortage: sufficient ? 0 : 1 - available,
    maxProcessable: sufficient ? 1 : available,
    creditType: 'super' as const,
  };
}

/**
 * Create a mock credit check context for testing.
 */
function createMockContext(
  userCredits: CreditCheckContext['userCredits'] = createMockUserCredits()
): {
  context: CreditCheckContext;
  mocks: {
    checkCreditSufficiency: ReturnType<typeof vi.fn>;
    setCreditCheckResult: ReturnType<typeof vi.fn>;
    setShowCreditWarning: ReturnType<typeof vi.fn>;
  };
} {
  const mocks = {
    checkCreditSufficiency: vi.fn().mockReturnValue(
      createMockCreditCheckResult(userCredits.superRemaining >= 1, userCredits.superRemaining)
    ),
    setCreditCheckResult: vi.fn(),
    setShowCreditWarning: vi.fn(),
  };

  return {
    context: {
      userCredits,
      checkCreditSufficiency: mocks.checkCreditSufficiency,
      setCreditCheckResult: mocks.setCreditCheckResult,
      setShowCreditWarning: mocks.setShowCreditWarning,
    },
    mocks,
  };
}

// =============================================================================
// Tests: confirmWithCreditCheck
// =============================================================================

describe('confirmWithCreditCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('credit check call', () => {
    it('should call checkCreditSufficiency with user credits', () => {
      const userCredits = createMockUserCredits(10, 50);
      const { context, mocks } = createMockContext(userCredits);

      confirmWithCreditCheck(context);

      expect(mocks.checkCreditSufficiency).toHaveBeenCalledWith(
        userCredits,
        expect.any(Number),
        expect.any(Boolean)
      );
    });

    it('should request 1 credit (batch flat rate)', () => {
      const { context, mocks } = createMockContext();

      confirmWithCreditCheck(context);

      expect(mocks.checkCreditSufficiency).toHaveBeenCalledWith(
        expect.anything(),
        1, // Required credits = 1 for batch
        expect.any(Boolean)
      );
    });

    it('should use super credits (isSuper = true)', () => {
      const { context, mocks } = createMockContext();

      confirmWithCreditCheck(context);

      expect(mocks.checkCreditSufficiency).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number),
        true // isSuper = true for batch
      );
    });
  });

  describe('result handling', () => {
    it('should set the credit check result', () => {
      const userCredits = createMockUserCredits(5);
      const { context, mocks } = createMockContext(userCredits);
      const expectedResult = createMockCreditCheckResult(true, 5);
      mocks.checkCreditSufficiency.mockReturnValue(expectedResult);

      confirmWithCreditCheck(context);

      expect(mocks.setCreditCheckResult).toHaveBeenCalledWith(expectedResult);
    });

    it('should show the credit warning dialog', () => {
      const { context, mocks } = createMockContext();

      confirmWithCreditCheck(context);

      expect(mocks.setShowCreditWarning).toHaveBeenCalledWith(true);
    });
  });

  describe('execution order', () => {
    it('should call functions in correct order', () => {
      const { context, mocks } = createMockContext();
      const callOrder: string[] = [];

      mocks.checkCreditSufficiency.mockImplementation(() => {
        callOrder.push('checkCreditSufficiency');
        return createMockCreditCheckResult(true, 5);
      });
      mocks.setCreditCheckResult.mockImplementation(() => callOrder.push('setCreditCheckResult'));
      mocks.setShowCreditWarning.mockImplementation(() => callOrder.push('setShowCreditWarning'));

      confirmWithCreditCheck(context);

      expect(callOrder).toEqual([
        'checkCreditSufficiency',
        'setCreditCheckResult',
        'setShowCreditWarning',
      ]);
    });
  });

  describe('sufficient credits scenario', () => {
    it('should work when user has enough super credits', () => {
      const userCredits = createMockUserCredits(10); // 10 super credits
      const { context, mocks } = createMockContext(userCredits);
      const sufficientResult = createMockCreditCheckResult(true, 10);
      mocks.checkCreditSufficiency.mockReturnValue(sufficientResult);

      confirmWithCreditCheck(context);

      expect(mocks.setCreditCheckResult).toHaveBeenCalledWith(
        expect.objectContaining({
          sufficient: true,
          available: 10,
          remaining: 9,
          shortage: 0,
        })
      );
      expect(mocks.setShowCreditWarning).toHaveBeenCalledWith(true);
    });

    it('should work when user has exactly 1 super credit', () => {
      const userCredits = createMockUserCredits(1); // Exactly 1 super credit
      const { context, mocks } = createMockContext(userCredits);
      const sufficientResult = createMockCreditCheckResult(true, 1);
      mocks.checkCreditSufficiency.mockReturnValue(sufficientResult);

      confirmWithCreditCheck(context);

      expect(mocks.setCreditCheckResult).toHaveBeenCalledWith(
        expect.objectContaining({
          sufficient: true,
          available: 1,
          remaining: 0,
        })
      );
    });
  });

  describe('insufficient credits scenario', () => {
    it('should work when user has no super credits', () => {
      const userCredits = createMockUserCredits(0); // No super credits
      const { context, mocks } = createMockContext(userCredits);
      const insufficientResult = createMockCreditCheckResult(false, 0);
      mocks.checkCreditSufficiency.mockReturnValue(insufficientResult);

      confirmWithCreditCheck(context);

      expect(mocks.setCreditCheckResult).toHaveBeenCalledWith(
        expect.objectContaining({
          sufficient: false,
          available: 0,
          shortage: 1,
        })
      );
      // Still shows warning dialog (to display insufficient credits message)
      expect(mocks.setShowCreditWarning).toHaveBeenCalledWith(true);
    });
  });

  describe('batch pricing model', () => {
    it('should use flat rate of 1 super credit regardless of context', () => {
      // Even with different credit amounts, the required should always be 1
      const scenarios = [
        createMockUserCredits(100, 1000),
        createMockUserCredits(1, 0),
        createMockUserCredits(0, 500),
      ];

      for (const userCredits of scenarios) {
        const { context, mocks } = createMockContext(userCredits);

        confirmWithCreditCheck(context);

        expect(mocks.checkCreditSufficiency).toHaveBeenCalledWith(
          userCredits,
          1, // Always 1 for batch
          true // Always super for batch
        );
      }
    });
  });
});

// =============================================================================
// Tests: Integration scenarios
// =============================================================================

describe('Credit check integration scenarios', () => {
  it('should complete full credit check flow with sufficient credits', () => {
    const userCredits = createMockUserCredits(5);
    const { context, mocks } = createMockContext(userCredits);
    const result = createMockCreditCheckResult(true, 5);
    mocks.checkCreditSufficiency.mockReturnValue(result);

    confirmWithCreditCheck(context);

    // All three steps should complete
    expect(mocks.checkCreditSufficiency).toHaveBeenCalledTimes(1);
    expect(mocks.setCreditCheckResult).toHaveBeenCalledTimes(1);
    expect(mocks.setShowCreditWarning).toHaveBeenCalledTimes(1);
  });

  it('should pass through credit check result without modification', () => {
    const userCredits = createMockUserCredits(3);
    const { context, mocks } = createMockContext(userCredits);
    const customResult = {
      sufficient: true,
      available: 3,
      required: 1,
      remaining: 2,
      shortage: 0,
      maxProcessable: 1,
      creditType: 'super' as const,
    };
    mocks.checkCreditSufficiency.mockReturnValue(customResult);

    confirmWithCreditCheck(context);

    // The exact result from checkCreditSufficiency should be passed to setCreditCheckResult
    expect(mocks.setCreditCheckResult).toHaveBeenCalledWith(customResult);
  });
});
