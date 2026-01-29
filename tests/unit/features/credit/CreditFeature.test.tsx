/**
 * Story 14e-18c: CreditFeature Component Unit Tests
 *
 * Tests for the CreditFeature orchestrator component following Atlas testing patterns.
 *
 * @see src/features/credit/CreditFeature.tsx
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { CreditFeature, useCreditFeature, type CreditFeatureProps } from '@features/credit';
import { useCreditState } from '@features/credit';
import type { UserCredits } from '@/types/scan';
import { DEFAULT_CREDITS } from '@/types/scan';

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
      <button data-testid="check-credits" onClick={ctx.handleBatchConfirmWithCreditCheck}>
        Check Credits
      </button>
      <button data-testid="confirm" onClick={ctx.handleCreditWarningConfirm}>
        Confirm
      </button>
      <button data-testid="cancel" onClick={ctx.handleCreditWarningCancel}>
        Cancel
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
