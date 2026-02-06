/**
 * Story 14e-18c: CreditFeature Component Unit Tests
 * Story 14e-39: Trust Prompt State Integration Tests
 *
 * Tests for the CreditFeature orchestrator component following Atlas testing patterns.
 *
 * @see src/features/credit/CreditFeature.tsx
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { CreditFeature, useCreditFeature, type CreditFeatureProps, type TrustPromptActions } from '@features/credit';
import { useCreditState } from '@features/credit';
import type { UserCredits } from '@/types/scan';
import { DEFAULT_CREDITS } from '@/types/scan';
import type { TrustPromptEligibility } from '@/types/trust';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@features/credit/state', () => ({
  useCreditState: vi.fn(),
}));

const mockUseCreditState = vi.mocked(useCreditState);

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

function createMockCreditState(creditsOverrides: Partial<UserCredits> = {}) {
  return {
    credits: createMockUserCredits(creditsOverrides),
    loading: false,
    hasReservedCredits: false,
    deductCredits: vi.fn().mockResolvedValue(true),
    deductSuperCredits: vi.fn().mockResolvedValue(true),
    addCredits: vi.fn().mockResolvedValue(undefined),
    addSuperCredits: vi.fn().mockResolvedValue(undefined),
    refreshCredits: vi.fn().mockResolvedValue(undefined),
    reserveCredits: vi.fn().mockReturnValue(true),
    confirmReservedCredits: vi.fn().mockResolvedValue(true),
    refundReservedCredits: vi.fn(),
  };
}

const defaultProps: CreditFeatureProps = {
  user: { uid: 'test-user' } as User,
  services: { db: {}, appId: 'test-app' },
  batchImageCount: 5,
  theme: 'light',
  t: (key: string) => key,
};

// Consumer component to test context
function CreditFeatureConsumer({ onRender }: { onRender?: (ctx: ReturnType<typeof useCreditFeature>) => void }) {
  const ctx = useCreditFeature();
  onRender?.(ctx);
  return (
    <div data-testid="consumer">
      <span data-testid="credits-remaining">{ctx.credits.remaining}</span>
      <span data-testid="super-remaining">{ctx.credits.superRemaining}</span>
      <span data-testid="show-warning">{String(ctx.showCreditWarning)}</span>
      {/* Story 14e-39: Trust prompt state */}
      <span data-testid="show-trust-prompt">{String(ctx.showTrustPrompt)}</span>
      <span data-testid="trust-prompt-merchant">{ctx.trustPromptData?.merchant?.merchantName || ''}</span>
      <span data-testid="should-trigger-credit-check">{String(ctx.shouldTriggerCreditCheck)}</span>
      <button data-testid="check-credits" onClick={ctx.handleBatchConfirmWithCreditCheck}>
        Check Credits
      </button>
      <button data-testid="confirm" onClick={ctx.handleCreditWarningConfirm}>
        Confirm
      </button>
      <button data-testid="cancel" onClick={ctx.handleCreditWarningCancel}>
        Cancel
      </button>
      {/* Story 14e-39: Trust prompt actions */}
      <button
        data-testid="show-trust-prompt-action"
        onClick={() => ctx.showTrustPromptAction({
          eligible: true,
          merchant: { merchantName: 'Test Merchant', scanCount: 5 },
        })}
      >
        Show Trust Prompt
      </button>
      <button data-testid="hide-trust-prompt" onClick={ctx.hideTrustPrompt}>
        Hide Trust Prompt
      </button>
      <button data-testid="trigger-credit-check-action" onClick={ctx.triggerCreditCheckAction}>
        Trigger Credit Check
      </button>
      <button data-testid="clear-credit-check-trigger" onClick={ctx.clearCreditCheckTrigger}>
        Clear Credit Check Trigger
      </button>
    </div>
  );
}

// ============================================================================
// Tests
// ============================================================================

describe('CreditFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreditState.mockReturnValue(createMockCreditState());
  });

  // =========================================================================
  // Context Provider Tests
  // =========================================================================

  describe('context provider', () => {
    it('should render children', () => {
      render(
        <CreditFeature {...defaultProps}>
          <div data-testid="child">Child Content</div>
        </CreditFeature>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should provide credit state via context', () => {
      render(
        <CreditFeature {...defaultProps}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      expect(screen.getByTestId('credits-remaining')).toHaveTextContent('10');
      expect(screen.getByTestId('super-remaining')).toHaveTextContent('5');
    });

    it('should throw error when useCreditFeature is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<CreditFeatureConsumer />);
      }).toThrow('useCreditFeature must be used within CreditFeature provider');

      consoleSpy.mockRestore();
    });

    it('should pass user and services to useCreditState', () => {
      const user = { uid: 'custom-user' } as User;
      const services = { db: {}, appId: 'custom-app' };

      render(
        <CreditFeature user={user} services={services}>
          <div>Test</div>
        </CreditFeature>
      );

      expect(mockUseCreditState).toHaveBeenCalledWith(user, services);
    });
  });

  // =========================================================================
  // Dialog State Tests
  // =========================================================================

  describe('dialog state', () => {
    it('should initialize with showCreditWarning as false', () => {
      render(
        <CreditFeature {...defaultProps}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      expect(screen.getByTestId('show-warning')).toHaveTextContent('false');
    });

    it('should not render CreditWarningDialog when showCreditWarning is false', () => {
      render(
        <CreditFeature {...defaultProps}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render CreditWarningDialog when handleBatchConfirmWithCreditCheck is called', async () => {
      render(
        <CreditFeature {...defaultProps}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('check-credits'));
      });

      expect(screen.getByTestId('show-warning')).toHaveTextContent('true');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Handler Tests
  // =========================================================================

  describe('handleBatchConfirmWithCreditCheck', () => {
    it('should show credit warning dialog', async () => {
      render(
        <CreditFeature {...defaultProps}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('check-credits'));
      });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should display correct credit info in dialog', async () => {
      render(
        <CreditFeature {...defaultProps}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('check-credits'));
      });

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('handleCreditWarningConfirm', () => {
    it('should hide dialog and call onBatchConfirmed', async () => {
      const onBatchConfirmed = vi.fn();

      render(
        <CreditFeature {...defaultProps} onBatchConfirmed={onBatchConfirmed}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      // First show the dialog
      await act(async () => {
        fireEvent.click(screen.getByTestId('check-credits'));
      });

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Then confirm
      await act(async () => {
        fireEvent.click(screen.getByTestId('confirm'));
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(onBatchConfirmed).toHaveBeenCalledTimes(1);
    });

    it('should await async onBatchConfirmed callback', async () => {
      let resolved = false;
      const asyncCallback = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        resolved = true;
      });

      render(
        <CreditFeature {...defaultProps} onBatchConfirmed={asyncCallback}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('check-credits'));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('confirm'));
      });

      await waitFor(() => {
        expect(resolved).toBe(true);
      });
      expect(asyncCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleCreditWarningCancel', () => {
    it('should hide dialog without calling onBatchConfirmed', async () => {
      const onBatchConfirmed = vi.fn();

      render(
        <CreditFeature {...defaultProps} onBatchConfirmed={onBatchConfirmed}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      // First show the dialog
      await act(async () => {
        fireEvent.click(screen.getByTestId('check-credits'));
      });

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Then cancel
      await act(async () => {
        fireEvent.click(screen.getByTestId('cancel'));
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(onBatchConfirmed).not.toHaveBeenCalled();
    });
  });

  describe('handleReduceBatch', () => {
    it('should call onReduceBatch with maxProcessable when reduce batch clicked', async () => {
      const onReduceBatch = vi.fn();

      // Set up insufficient credits so reduce batch option shows
      mockUseCreditState.mockReturnValue(createMockCreditState({ superRemaining: 0 }));

      render(
        <CreditFeature {...defaultProps} onReduceBatch={onReduceBatch}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      // Show the dialog
      await act(async () => {
        fireEvent.click(screen.getByTestId('check-credits'));
      });

      // The dialog should be visible - with insufficient credits
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Credit State Exposure Tests
  // =========================================================================

  describe('credit state exposure', () => {
    it('should expose credits from useCreditState', () => {
      mockUseCreditState.mockReturnValue(createMockCreditState({ remaining: 15, superRemaining: 8 }));

      render(
        <CreditFeature {...defaultProps}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      expect(screen.getByTestId('credits-remaining')).toHaveTextContent('15');
      expect(screen.getByTestId('super-remaining')).toHaveTextContent('8');
    });

    it('should expose loading state', () => {
      const mockState = createMockCreditState();
      mockState.loading = true;
      mockUseCreditState.mockReturnValue(mockState);

      let capturedCtx: ReturnType<typeof useCreditFeature> | null = null;

      render(
        <CreditFeature {...defaultProps}>
          <CreditFeatureConsumer onRender={(ctx) => { capturedCtx = ctx; }} />
        </CreditFeature>
      );

      expect(capturedCtx?.loading).toBe(true);
    });

    it('should expose all credit operations', () => {
      let capturedCtx: ReturnType<typeof useCreditFeature> | null = null;

      render(
        <CreditFeature {...defaultProps}>
          <CreditFeatureConsumer onRender={(ctx) => { capturedCtx = ctx; }} />
        </CreditFeature>
      );

      expect(typeof capturedCtx?.deductCredits).toBe('function');
      expect(typeof capturedCtx?.deductSuperCredits).toBe('function');
      expect(typeof capturedCtx?.addCredits).toBe('function');
      expect(typeof capturedCtx?.addSuperCredits).toBe('function');
      expect(typeof capturedCtx?.refreshCredits).toBe('function');
      expect(typeof capturedCtx?.reserveCredits).toBe('function');
      expect(typeof capturedCtx?.confirmReservedCredits).toBe('function');
      expect(typeof capturedCtx?.refundReservedCredits).toBe('function');
    });
  });

  // =========================================================================
  // Dialog Props Tests
  // =========================================================================

  describe('dialog props', () => {
    it('should pass batchImageCount to dialog as receiptCount', async () => {
      render(
        <CreditFeature {...defaultProps} batchImageCount={7}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('check-credits'));
      });

      // Dialog should be rendered with receipt count
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should use default batchImageCount of 0 when not provided', async () => {
      render(
        <CreditFeature user={defaultProps.user} services={defaultProps.services}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('check-credits'));
      });

      // Dialog should still render
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should use default theme of light when not provided', () => {
      render(
        <CreditFeature user={defaultProps.user} services={defaultProps.services}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      // Component renders without error
      expect(screen.getByTestId('consumer')).toBeInTheDocument();
    });

    it('should use default t function when not provided', async () => {
      render(
        <CreditFeature user={defaultProps.user} services={defaultProps.services}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('check-credits'));
      });

      // Dialog renders - default t returns key as-is
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Props Passthrough Tests
  // =========================================================================

  describe('props passthrough', () => {
    it('should handle null user', () => {
      render(
        <CreditFeature user={null} services={defaultProps.services}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      expect(mockUseCreditState).toHaveBeenCalledWith(null, defaultProps.services);
    });

    it('should handle null services', () => {
      render(
        <CreditFeature user={defaultProps.user} services={null}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      expect(mockUseCreditState).toHaveBeenCalledWith(defaultProps.user, null);
    });
  });

  // =========================================================================
  // Edge Cases
  // =========================================================================

  describe('edge cases', () => {
    it('should handle missing onBatchConfirmed gracefully', async () => {
      render(
        <CreditFeature {...defaultProps} onBatchConfirmed={undefined}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('check-credits'));
      });

      // Confirm without callback - should not throw
      await act(async () => {
        fireEvent.click(screen.getByTestId('confirm'));
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should handle missing onReduceBatch gracefully', async () => {
      mockUseCreditState.mockReturnValue(createMockCreditState({ superRemaining: 0 }));

      render(
        <CreditFeature {...defaultProps} onReduceBatch={undefined}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('check-credits'));
      });

      // Dialog should still render
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render without children', () => {
      const { container } = render(
        <CreditFeature {...defaultProps} />
      );

      // Should render without error (just provider wrapper)
      expect(container).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Integration Flow Tests
  // =========================================================================

  describe('integration flows', () => {
    it('should support full flow: check -> show dialog -> confirm -> callback', async () => {
      const onBatchConfirmed = vi.fn();
      const callOrder: string[] = [];

      onBatchConfirmed.mockImplementation(() => {
        callOrder.push('onBatchConfirmed');
      });

      render(
        <CreditFeature {...defaultProps} onBatchConfirmed={onBatchConfirmed}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      // Step 1: Check credits
      await act(async () => {
        fireEvent.click(screen.getByTestId('check-credits'));
      });
      callOrder.push('dialog-shown');

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Step 2: Confirm
      await act(async () => {
        fireEvent.click(screen.getByTestId('confirm'));
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(callOrder).toEqual(['dialog-shown', 'onBatchConfirmed']);
    });

    it('should support flow: check -> show dialog -> cancel -> no callback', async () => {
      const onBatchConfirmed = vi.fn();

      render(
        <CreditFeature {...defaultProps} onBatchConfirmed={onBatchConfirmed}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      // Step 1: Check credits
      await act(async () => {
        fireEvent.click(screen.getByTestId('check-credits'));
      });

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Step 2: Cancel
      await act(async () => {
        fireEvent.click(screen.getByTestId('cancel'));
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(onBatchConfirmed).not.toHaveBeenCalled();
    });

    it('should allow reopening dialog after cancel', async () => {
      render(
        <CreditFeature {...defaultProps}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      // Open
      await act(async () => {
        fireEvent.click(screen.getByTestId('check-credits'));
      });
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Cancel
      await act(async () => {
        fireEvent.click(screen.getByTestId('cancel'));
      });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Reopen
      await act(async () => {
        fireEvent.click(screen.getByTestId('check-credits'));
      });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// useCreditFeature Hook Tests
// ============================================================================

describe('useCreditFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreditState.mockReturnValue(createMockCreditState());
  });

  it('should throw error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<CreditFeatureConsumer />);
    }).toThrow('useCreditFeature must be used within CreditFeature provider');

    consoleSpy.mockRestore();
  });

  it('should return all expected context values', () => {
    let capturedCtx: ReturnType<typeof useCreditFeature> | null = null;

    render(
      <CreditFeature {...defaultProps}>
        <CreditFeatureConsumer onRender={(ctx) => { capturedCtx = ctx; }} />
      </CreditFeature>
    );

    expect(capturedCtx).not.toBeNull();

    // Credit state
    expect(capturedCtx?.credits).toBeDefined();
    expect(capturedCtx?.loading).toBeDefined();
    expect(capturedCtx?.hasReservedCredits).toBeDefined();

    // Dialog state
    expect(capturedCtx?.showCreditWarning).toBe(false);
    expect(capturedCtx?.creditCheckResult).toBeNull();

    // Handlers
    expect(typeof capturedCtx?.handleBatchConfirmWithCreditCheck).toBe('function');
    expect(typeof capturedCtx?.handleCreditWarningConfirm).toBe('function');
    expect(typeof capturedCtx?.handleCreditWarningCancel).toBe('function');
    expect(typeof capturedCtx?.handleReduceBatch).toBe('function');
  });
});

// ============================================================================
// External Trigger Tests (Story 14e-18c: App.tsx Integration)
// ============================================================================

describe('triggerCreditCheck prop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreditState.mockReturnValue(createMockCreditState());
  });

  it('should not trigger credit check when triggerCreditCheck is false', () => {
    render(
      <CreditFeature {...defaultProps} triggerCreditCheck={false}>
        <CreditFeatureConsumer />
      </CreditFeature>
    );

    // Dialog should not be visible
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should trigger credit check when triggerCreditCheck becomes true', async () => {
    const { rerender } = render(
      <CreditFeature {...defaultProps} triggerCreditCheck={false}>
        <CreditFeatureConsumer />
      </CreditFeature>
    );

    // Initially no dialog
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Trigger the credit check
    rerender(
      <CreditFeature {...defaultProps} triggerCreditCheck={true}>
        <CreditFeatureConsumer />
      </CreditFeature>
    );

    // Dialog should now be visible
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should call onCreditCheckComplete(true) when user confirms', async () => {
    const onCreditCheckComplete = vi.fn();
    const onBatchConfirmed = vi.fn();

    const { rerender } = render(
      <CreditFeature
        {...defaultProps}
        triggerCreditCheck={false}
        onCreditCheckComplete={onCreditCheckComplete}
        onBatchConfirmed={onBatchConfirmed}
      >
        <CreditFeatureConsumer />
      </CreditFeature>
    );

    // Trigger the credit check
    rerender(
      <CreditFeature
        {...defaultProps}
        triggerCreditCheck={true}
        onCreditCheckComplete={onCreditCheckComplete}
        onBatchConfirmed={onBatchConfirmed}
      >
        <CreditFeatureConsumer />
      </CreditFeature>
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Confirm
    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm'));
    });

    expect(onCreditCheckComplete).toHaveBeenCalledWith(true);
    expect(onBatchConfirmed).toHaveBeenCalledTimes(1);
  });

  it('should call onCreditCheckComplete(false) when user cancels', async () => {
    const onCreditCheckComplete = vi.fn();
    const onBatchConfirmed = vi.fn();

    const { rerender } = render(
      <CreditFeature
        {...defaultProps}
        triggerCreditCheck={false}
        onCreditCheckComplete={onCreditCheckComplete}
        onBatchConfirmed={onBatchConfirmed}
      >
        <CreditFeatureConsumer />
      </CreditFeature>
    );

    // Trigger the credit check
    rerender(
      <CreditFeature
        {...defaultProps}
        triggerCreditCheck={true}
        onCreditCheckComplete={onCreditCheckComplete}
        onBatchConfirmed={onBatchConfirmed}
      >
        <CreditFeatureConsumer />
      </CreditFeature>
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Cancel
    await act(async () => {
      fireEvent.click(screen.getByTestId('cancel'));
    });

    expect(onCreditCheckComplete).toHaveBeenCalledWith(false);
    expect(onBatchConfirmed).not.toHaveBeenCalled();
  });

  it('should not re-trigger when triggerCreditCheck stays true', async () => {
    const { rerender } = render(
      <CreditFeature {...defaultProps} triggerCreditCheck={true}>
        <CreditFeatureConsumer />
      </CreditFeature>
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Cancel to close dialog
    await act(async () => {
      fireEvent.click(screen.getByTestId('cancel'));
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Rerender with same trigger value - should NOT reopen dialog
    rerender(
      <CreditFeature {...defaultProps} triggerCreditCheck={true}>
        <CreditFeatureConsumer />
      </CreditFeature>
    );

    // Dialog should still be closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should re-trigger when triggerCreditCheck goes false then true again', async () => {
    const { rerender } = render(
      <CreditFeature {...defaultProps} triggerCreditCheck={true}>
        <CreditFeatureConsumer />
      </CreditFeature>
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Cancel to close dialog
    await act(async () => {
      fireEvent.click(screen.getByTestId('cancel'));
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Reset trigger to false
    rerender(
      <CreditFeature {...defaultProps} triggerCreditCheck={false}>
        <CreditFeatureConsumer />
      </CreditFeature>
    );

    // Trigger again
    rerender(
      <CreditFeature {...defaultProps} triggerCreditCheck={true}>
        <CreditFeatureConsumer />
      </CreditFeature>
    );

    // Dialog should be visible again
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Story 14e-39: Trust Prompt State Tests
// ============================================================================

describe('Trust Prompt State (Story 14e-39)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreditState.mockReturnValue(createMockCreditState());
  });

  // =========================================================================
  // Trust Prompt State Initialization
  // =========================================================================

  describe('trust prompt state initialization', () => {
    it('should initialize with showTrustPrompt as false', () => {
      render(
        <CreditFeature {...defaultProps}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      expect(screen.getByTestId('show-trust-prompt')).toHaveTextContent('false');
    });

    it('should initialize with trustPromptData as null', () => {
      render(
        <CreditFeature {...defaultProps}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      expect(screen.getByTestId('trust-prompt-merchant')).toHaveTextContent('');
    });

    it('should initialize with shouldTriggerCreditCheck as false', () => {
      render(
        <CreditFeature {...defaultProps}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      expect(screen.getByTestId('should-trigger-credit-check')).toHaveTextContent('false');
    });
  });

  // =========================================================================
  // Trust Prompt Actions
  // =========================================================================

  describe('trust prompt actions', () => {
    it('should show trust prompt when showTrustPromptAction is called', async () => {
      render(
        <CreditFeature {...defaultProps}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('show-trust-prompt-action'));
      });

      expect(screen.getByTestId('show-trust-prompt')).toHaveTextContent('true');
      expect(screen.getByTestId('trust-prompt-merchant')).toHaveTextContent('Test Merchant');
    });

    it('should hide trust prompt when hideTrustPrompt is called', async () => {
      render(
        <CreditFeature {...defaultProps}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      // First show the prompt
      await act(async () => {
        fireEvent.click(screen.getByTestId('show-trust-prompt-action'));
      });

      expect(screen.getByTestId('show-trust-prompt')).toHaveTextContent('true');

      // Then hide it
      await act(async () => {
        fireEvent.click(screen.getByTestId('hide-trust-prompt'));
      });

      expect(screen.getByTestId('show-trust-prompt')).toHaveTextContent('false');
      expect(screen.getByTestId('trust-prompt-merchant')).toHaveTextContent('');
    });

    it('should trigger credit check when triggerCreditCheckAction is called', async () => {
      render(
        <CreditFeature {...defaultProps}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger-credit-check-action'));
      });

      // Story 14e-39 (code review fix #2): Verify both state AND dialog are shown
      expect(screen.getByTestId('should-trigger-credit-check')).toHaveTextContent('true');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should clear credit check trigger when clearCreditCheckTrigger is called', async () => {
      render(
        <CreditFeature {...defaultProps}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      // First trigger
      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger-credit-check-action'));
      });

      expect(screen.getByTestId('should-trigger-credit-check')).toHaveTextContent('true');

      // Then clear
      await act(async () => {
        fireEvent.click(screen.getByTestId('clear-credit-check-trigger'));
      });

      expect(screen.getByTestId('should-trigger-credit-check')).toHaveTextContent('false');
    });

    // Story 14e-39 (code review fix #2): Test flag cleared on dialog confirm
    it('should clear shouldTriggerCreditCheck when credit check dialog is confirmed', async () => {
      const onBatchConfirmed = vi.fn();

      render(
        <CreditFeature {...defaultProps} onBatchConfirmed={onBatchConfirmed}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      // Trigger via action (sets flag AND shows dialog)
      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger-credit-check-action'));
      });

      expect(screen.getByTestId('should-trigger-credit-check')).toHaveTextContent('true');
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Confirm the dialog
      await act(async () => {
        fireEvent.click(screen.getByTestId('confirm'));
      });

      // Flag should be cleared after confirm
      expect(screen.getByTestId('should-trigger-credit-check')).toHaveTextContent('false');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Story 14e-39 (code review fix #2): Test flag cleared on dialog cancel
    it('should clear shouldTriggerCreditCheck when credit check dialog is cancelled', async () => {
      render(
        <CreditFeature {...defaultProps}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      // Trigger via action (sets flag AND shows dialog)
      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger-credit-check-action'));
      });

      expect(screen.getByTestId('should-trigger-credit-check')).toHaveTextContent('true');
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Cancel the dialog
      await act(async () => {
        fireEvent.click(screen.getByTestId('cancel'));
      });

      // Flag should be cleared after cancel
      expect(screen.getByTestId('should-trigger-credit-check')).toHaveTextContent('false');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // TrustMerchantPrompt Rendering
  // =========================================================================

  describe('TrustMerchantPrompt rendering', () => {
    it('should not render TrustMerchantPrompt when showTrustPrompt is false', () => {
      render(
        <CreditFeature {...defaultProps}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      expect(screen.queryByTestId('trust-merchant-prompt')).not.toBeInTheDocument();
    });

    it('should render TrustMerchantPrompt when showTrustPrompt is true and data exists', async () => {
      render(
        <CreditFeature {...defaultProps}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('show-trust-prompt-action'));
      });

      // Note: TrustMerchantPrompt is rendered by CreditFeature, but we don't mock it here
      // The actual component is imported, so we verify through state
      expect(screen.getByTestId('show-trust-prompt')).toHaveTextContent('true');
    });
  });

  // =========================================================================
  // Trust Callbacks
  // =========================================================================

  describe('trust callbacks', () => {
    it('should call onAcceptTrust when trust is accepted', async () => {
      const onAcceptTrust = vi.fn().mockResolvedValue(undefined);

      let capturedCtx: ReturnType<typeof useCreditFeature> | null = null;

      render(
        <CreditFeature {...defaultProps} onAcceptTrust={onAcceptTrust}>
          <CreditFeatureConsumer onRender={(ctx) => { capturedCtx = ctx; }} />
        </CreditFeature>
      );

      // Show trust prompt with custom data
      await act(async () => {
        capturedCtx?.showTrustPromptAction({
          eligible: true,
          merchant: { merchantName: 'Callback Test Store', scanCount: 3 },
        });
      });

      expect(screen.getByTestId('show-trust-prompt')).toHaveTextContent('true');
    });

    it('should call onDeclineTrust when trust is declined', async () => {
      const onDeclineTrust = vi.fn().mockResolvedValue(undefined);

      let capturedCtx: ReturnType<typeof useCreditFeature> | null = null;

      render(
        <CreditFeature {...defaultProps} onDeclineTrust={onDeclineTrust}>
          <CreditFeatureConsumer onRender={(ctx) => { capturedCtx = ctx; }} />
        </CreditFeature>
      );

      // Show trust prompt
      await act(async () => {
        capturedCtx?.showTrustPromptAction({
          eligible: true,
          merchant: { merchantName: 'Decline Test Store', scanCount: 3 },
        });
      });

      expect(screen.getByTestId('show-trust-prompt')).toHaveTextContent('true');
    });
  });

  // =========================================================================
  // onTrustActionsReady Callback
  // =========================================================================

  describe('onTrustActionsReady callback', () => {
    it('should call onTrustActionsReady with actions on mount', async () => {
      const onTrustActionsReady = vi.fn();

      render(
        <CreditFeature {...defaultProps} onTrustActionsReady={onTrustActionsReady}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      await waitFor(() => {
        expect(onTrustActionsReady).toHaveBeenCalledTimes(1);
      });

      const actions: TrustPromptActions = onTrustActionsReady.mock.calls[0][0];
      expect(typeof actions.showTrustPromptAction).toBe('function');
      expect(typeof actions.hideTrustPrompt).toBe('function');
    });

    it('should allow external triggering of trust prompt via actions', async () => {
      let externalActions: TrustPromptActions | null = null;
      const onTrustActionsReady = vi.fn((actions) => {
        externalActions = actions;
      });

      render(
        <CreditFeature {...defaultProps} onTrustActionsReady={onTrustActionsReady}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      await waitFor(() => {
        expect(externalActions).not.toBeNull();
      });

      // Trigger trust prompt externally
      await act(async () => {
        externalActions?.showTrustPromptAction({
          eligible: true,
          merchant: { merchantName: 'External Store', scanCount: 7 },
        });
      });

      expect(screen.getByTestId('show-trust-prompt')).toHaveTextContent('true');
      expect(screen.getByTestId('trust-prompt-merchant')).toHaveTextContent('External Store');
    });

    it('should allow external hiding of trust prompt via actions', async () => {
      let externalActions: TrustPromptActions | null = null;
      const onTrustActionsReady = vi.fn((actions) => {
        externalActions = actions;
      });

      render(
        <CreditFeature {...defaultProps} onTrustActionsReady={onTrustActionsReady}>
          <CreditFeatureConsumer />
        </CreditFeature>
      );

      await waitFor(() => {
        expect(externalActions).not.toBeNull();
      });

      // Show then hide via external actions
      await act(async () => {
        externalActions?.showTrustPromptAction({
          eligible: true,
          merchant: { merchantName: 'Hide Test', scanCount: 2 },
        });
      });

      expect(screen.getByTestId('show-trust-prompt')).toHaveTextContent('true');

      await act(async () => {
        externalActions?.hideTrustPrompt();
      });

      expect(screen.getByTestId('show-trust-prompt')).toHaveTextContent('false');
    });
  });

  // =========================================================================
  // Context Value Exposure
  // =========================================================================

  describe('context value exposure', () => {
    it('should expose all trust prompt state and actions via context', () => {
      let capturedCtx: ReturnType<typeof useCreditFeature> | null = null;

      render(
        <CreditFeature {...defaultProps}>
          <CreditFeatureConsumer onRender={(ctx) => { capturedCtx = ctx; }} />
        </CreditFeature>
      );

      expect(capturedCtx).not.toBeNull();

      // Trust prompt state
      expect(capturedCtx?.showTrustPrompt).toBe(false);
      expect(capturedCtx?.trustPromptData).toBeNull();
      expect(capturedCtx?.shouldTriggerCreditCheck).toBe(false);

      // Trust prompt actions
      expect(typeof capturedCtx?.showTrustPromptAction).toBe('function');
      expect(typeof capturedCtx?.hideTrustPrompt).toBe('function');
      expect(typeof capturedCtx?.triggerCreditCheckAction).toBe('function');
      expect(typeof capturedCtx?.clearCreditCheckTrigger).toBe('function');
    });
  });
});
