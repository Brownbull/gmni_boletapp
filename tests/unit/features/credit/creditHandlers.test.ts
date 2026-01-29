/**
 * Story 14e-18b: Credit Handlers Unit Tests
 *
 * Tests for credit warning dialog handlers following Atlas testing patterns.
 *
 * @see src/features/credit/handlers/creditHandlers.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createBatchConfirmWithCreditCheck,
  createCreditWarningConfirm,
  createCreditWarningCancel,
  type CreditHandlerContext,
} from '@features/credit/handlers/creditHandlers';
import type { UserCredits } from '@/types/scan';
import type { CreditCheckResult } from '@/services/creditService';

// ============================================================================
// Test Fixtures
// ============================================================================

function createMockUserCredits(overrides: Partial<UserCredits> = {}): UserCredits {
  return {
    remaining: 10,
    used: 5,
    superRemaining: 5,
    superUsed: 2,
    ...overrides,
  };
}

function createMockContext(overrides: Partial<CreditHandlerContext> = {}): CreditHandlerContext {
  return {
    credits: createMockUserCredits(),
    setShowCreditWarning: vi.fn(),
    setCreditCheckResult: vi.fn(),
    onBatchConfirmed: vi.fn(),
    ...overrides,
  };
}

// ============================================================================
// createBatchConfirmWithCreditCheck Tests
// ============================================================================

describe('createBatchConfirmWithCreditCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a function', () => {
    const ctx = createMockContext();
    const handler = createBatchConfirmWithCreditCheck(ctx);

    expect(typeof handler).toBe('function');
  });

  it('should call checkCreditSufficiency with batch=true and 1 credit', () => {
    const ctx = createMockContext();
    const handler = createBatchConfirmWithCreditCheck(ctx);

    handler();

    // Should set credit check result (verifies checkCreditSufficiency was called)
    expect(ctx.setCreditCheckResult).toHaveBeenCalledTimes(1);
    const result = (ctx.setCreditCheckResult as ReturnType<typeof vi.fn>).mock.calls[0][0] as CreditCheckResult;
    expect(result.creditType).toBe('super');
    expect(result.required).toBe(1);
  });

  it('should show credit warning dialog', () => {
    const ctx = createMockContext();
    const handler = createBatchConfirmWithCreditCheck(ctx);

    handler();

    expect(ctx.setShowCreditWarning).toHaveBeenCalledWith(true);
  });

  it('should set credit check result before showing dialog', () => {
    const ctx = createMockContext();
    const callOrder: string[] = [];
    (ctx.setCreditCheckResult as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('setCreditCheckResult');
    });
    (ctx.setShowCreditWarning as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('setShowCreditWarning');
    });

    const handler = createBatchConfirmWithCreditCheck(ctx);
    handler();

    expect(callOrder).toEqual(['setCreditCheckResult', 'setShowCreditWarning']);
  });

  describe('with sufficient credits', () => {
    it('should report sufficient=true when user has super credits', () => {
      const ctx = createMockContext({
        credits: createMockUserCredits({ superRemaining: 5 }),
      });
      const handler = createBatchConfirmWithCreditCheck(ctx);

      handler();

      const result = (ctx.setCreditCheckResult as ReturnType<typeof vi.fn>).mock.calls[0][0] as CreditCheckResult;
      expect(result.sufficient).toBe(true);
      expect(result.available).toBe(5);
      expect(result.remaining).toBe(4); // 5 - 1
      expect(result.shortage).toBe(0);
    });

    it('should report sufficient=true even with exactly 1 super credit', () => {
      const ctx = createMockContext({
        credits: createMockUserCredits({ superRemaining: 1 }),
      });
      const handler = createBatchConfirmWithCreditCheck(ctx);

      handler();

      const result = (ctx.setCreditCheckResult as ReturnType<typeof vi.fn>).mock.calls[0][0] as CreditCheckResult;
      expect(result.sufficient).toBe(true);
      expect(result.remaining).toBe(0);
    });
  });

  describe('with insufficient credits', () => {
    it('should report sufficient=false when user has 0 super credits', () => {
      const ctx = createMockContext({
        credits: createMockUserCredits({ superRemaining: 0 }),
      });
      const handler = createBatchConfirmWithCreditCheck(ctx);

      handler();

      const result = (ctx.setCreditCheckResult as ReturnType<typeof vi.fn>).mock.calls[0][0] as CreditCheckResult;
      expect(result.sufficient).toBe(false);
      expect(result.shortage).toBe(1);
      expect(result.remaining).toBe(0);
    });

    it('should still show warning dialog for insufficient credits', () => {
      const ctx = createMockContext({
        credits: createMockUserCredits({ superRemaining: 0 }),
      });
      const handler = createBatchConfirmWithCreditCheck(ctx);

      handler();

      expect(ctx.setShowCreditWarning).toHaveBeenCalledWith(true);
    });
  });
});

// ============================================================================
// createCreditWarningConfirm Tests
// ============================================================================

describe('createCreditWarningConfirm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a function', () => {
    const ctx = createMockContext();
    const handler = createCreditWarningConfirm(ctx);

    expect(typeof handler).toBe('function');
  });

  it('should hide credit warning dialog', async () => {
    const ctx = createMockContext();
    const handler = createCreditWarningConfirm(ctx);

    await handler();

    expect(ctx.setShowCreditWarning).toHaveBeenCalledWith(false);
  });

  it('should clear credit check result', async () => {
    const ctx = createMockContext();
    const handler = createCreditWarningConfirm(ctx);

    await handler();

    expect(ctx.setCreditCheckResult).toHaveBeenCalledWith(null);
  });

  it('should call onBatchConfirmed callback', async () => {
    const ctx = createMockContext();
    const handler = createCreditWarningConfirm(ctx);

    await handler();

    expect(ctx.onBatchConfirmed).toHaveBeenCalledTimes(1);
  });

  it('should clear dialog state before calling onBatchConfirmed', async () => {
    const ctx = createMockContext();
    const callOrder: string[] = [];
    (ctx.setShowCreditWarning as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('setShowCreditWarning');
    });
    (ctx.setCreditCheckResult as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('setCreditCheckResult');
    });
    (ctx.onBatchConfirmed as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('onBatchConfirmed');
    });

    const handler = createCreditWarningConfirm(ctx);
    await handler();

    expect(callOrder).toEqual(['setShowCreditWarning', 'setCreditCheckResult', 'onBatchConfirmed']);
  });

  it('should handle missing onBatchConfirmed gracefully', async () => {
    const ctx = createMockContext();
    delete ctx.onBatchConfirmed;

    const handler = createCreditWarningConfirm(ctx);

    // Should not throw
    await expect(handler()).resolves.toBeUndefined();
    expect(ctx.setShowCreditWarning).toHaveBeenCalledWith(false);
    expect(ctx.setCreditCheckResult).toHaveBeenCalledWith(null);
  });

  it('should await async onBatchConfirmed callback', async () => {
    let resolved = false;
    const asyncCallback = vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      resolved = true;
    });

    const ctx = createMockContext({
      onBatchConfirmed: asyncCallback,
    });
    const handler = createCreditWarningConfirm(ctx);

    const promise = handler();
    expect(resolved).toBe(false);

    await promise;
    expect(resolved).toBe(true);
    expect(asyncCallback).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// createCreditWarningCancel Tests
// ============================================================================

describe('createCreditWarningCancel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a function', () => {
    const ctx = createMockContext();
    const handler = createCreditWarningCancel(ctx);

    expect(typeof handler).toBe('function');
  });

  it('should hide credit warning dialog', () => {
    const ctx = createMockContext();
    const handler = createCreditWarningCancel(ctx);

    handler();

    expect(ctx.setShowCreditWarning).toHaveBeenCalledWith(false);
  });

  it('should clear credit check result', () => {
    const ctx = createMockContext();
    const handler = createCreditWarningCancel(ctx);

    handler();

    expect(ctx.setCreditCheckResult).toHaveBeenCalledWith(null);
  });

  it('should NOT call onBatchConfirmed callback', () => {
    const ctx = createMockContext();
    const handler = createCreditWarningCancel(ctx);

    handler();

    expect(ctx.onBatchConfirmed).not.toHaveBeenCalled();
  });

  it('should clear state in correct order (warning before result)', () => {
    const ctx = createMockContext();
    const callOrder: string[] = [];
    (ctx.setShowCreditWarning as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('setShowCreditWarning');
    });
    (ctx.setCreditCheckResult as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('setCreditCheckResult');
    });

    const handler = createCreditWarningCancel(ctx);
    handler();

    expect(callOrder).toEqual(['setShowCreditWarning', 'setCreditCheckResult']);
  });
});

// ============================================================================
// Integration Tests (Handler interaction patterns)
// ============================================================================

describe('Credit handler integration patterns', () => {
  it('should support creating all handlers from same context', () => {
    const ctx = createMockContext();

    const confirmCheck = createBatchConfirmWithCreditCheck(ctx);
    const confirm = createCreditWarningConfirm(ctx);
    const cancel = createCreditWarningCancel(ctx);

    expect(typeof confirmCheck).toBe('function');
    expect(typeof confirm).toBe('function');
    expect(typeof cancel).toBe('function');
  });

  it('should support typical flow: check -> confirm', async () => {
    const ctx = createMockContext();

    // Step 1: Check credits (shows warning)
    const confirmCheck = createBatchConfirmWithCreditCheck(ctx);
    confirmCheck();

    expect(ctx.setShowCreditWarning).toHaveBeenCalledWith(true);
    expect(ctx.setCreditCheckResult).toHaveBeenCalledTimes(1);

    // Step 2: User confirms
    const confirm = createCreditWarningConfirm(ctx);
    await confirm();

    expect(ctx.setShowCreditWarning).toHaveBeenLastCalledWith(false);
    expect(ctx.setCreditCheckResult).toHaveBeenLastCalledWith(null);
    expect(ctx.onBatchConfirmed).toHaveBeenCalledTimes(1);
  });

  it('should support typical flow: check -> cancel', () => {
    const ctx = createMockContext();

    // Step 1: Check credits (shows warning)
    const confirmCheck = createBatchConfirmWithCreditCheck(ctx);
    confirmCheck();

    // Step 2: User cancels
    const cancel = createCreditWarningCancel(ctx);
    cancel();

    expect(ctx.setShowCreditWarning).toHaveBeenLastCalledWith(false);
    expect(ctx.setCreditCheckResult).toHaveBeenLastCalledWith(null);
    expect(ctx.onBatchConfirmed).not.toHaveBeenCalled();
  });
});
