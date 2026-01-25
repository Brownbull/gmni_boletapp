/**
 * ModalManager Component Tests
 *
 * Story 14e-3: Unit tests for the ModalManager component.
 * Tests rendering, props passing, close handling, and lazy loading.
 *
 * @module tests/managers/ModalManager/ModalManager.test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Import the component and store
import { ModalManager } from '../../../../src/managers/ModalManager/ModalManager';
import { useModalStore } from '../../../../src/managers/ModalManager/useModalStore';
import type {
  SignOutProps,
  CreditInfoProps,
} from '../../../../src/managers/ModalManager/types';

// =============================================================================
// Mock Modal Components
// =============================================================================

/**
 * Mock SignOut modal for testing.
 */
const MockSignOutModal: React.FC<SignOutProps & { onClose: () => void; isOpen?: boolean }> = ({
  onConfirm,
  onCancel,
  onClose,
}) => (
  <div data-testid="mock-signout-modal" role="dialog" aria-modal="true">
    <h2>Sign Out?</h2>
    <p>Are you sure you want to sign out?</p>
    <button data-testid="confirm-btn" onClick={onConfirm}>
      Confirm
    </button>
    <button data-testid="cancel-btn" onClick={onCancel}>
      Cancel
    </button>
    <button data-testid="close-btn" onClick={onClose}>
      Close
    </button>
  </div>
);

/**
 * Mock CreditInfo modal for testing.
 */
const MockCreditInfoModal: React.FC<CreditInfoProps & { onClose: () => void; isOpen?: boolean }> = ({
  normalCredits,
  superCredits,
  onClose,
  onPurchase,
}) => (
  <div data-testid="mock-creditinfo-modal" role="dialog" aria-modal="true">
    <h2>Credit Information</h2>
    <p data-testid="normal-credits">Normal Credits: {normalCredits}</p>
    <p data-testid="super-credits">Super Credits: {superCredits}</p>
    <button data-testid="close-btn" onClick={onClose}>
      Close
    </button>
    {onPurchase && (
      <button data-testid="purchase-btn" onClick={onPurchase}>
        Purchase More
      </button>
    )}
  </div>
);

// =============================================================================
// Mock Registry
// =============================================================================

// Mock the registry to avoid loading real components
vi.mock('../../../../src/managers/ModalManager/registry', () => ({
  MODAL_REGISTRY: {
    signOut: React.lazy(() =>
      Promise.resolve({
        default: MockSignOutModal,
      })
    ),
    creditInfo: React.lazy(() =>
      Promise.resolve({
        default: MockCreditInfoModal,
      })
    ),
    // Add stub for unknown modal test
    currencyMismatch: React.lazy(() =>
      Promise.resolve({
        default: ({ onClose }: { onClose: () => void }) => (
          <div data-testid="mock-stub-modal">
            <button onClick={onClose}>Close Stub</button>
          </div>
        ),
      })
    ),
  },
}));

// =============================================================================
// Test Fixtures
// =============================================================================

const mockSignOutProps: SignOutProps = {
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

const mockCreditInfoProps: CreditInfoProps = {
  normalCredits: 10,
  superCredits: 5,
  onClose: vi.fn(),
  onPurchase: vi.fn(),
};

// =============================================================================
// Helper Functions
// =============================================================================

function resetStore() {
  act(() => {
    useModalStore.setState({ activeModal: null, modalProps: {} });
  });
}

// =============================================================================
// Tests
// =============================================================================

describe('ModalManager', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('when no modal is active', () => {
    it('renders null', () => {
      const { container } = render(<ModalManager />);
      expect(container.firstChild).toBeNull();
    });

    it('does not render any dialog elements', () => {
      render(<ModalManager />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('when modal is active', () => {
    it('renders the correct modal component', async () => {
      act(() => {
        useModalStore.getState().openModal('signOut', mockSignOutProps);
      });

      render(<ModalManager />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-signout-modal')).toBeInTheDocument();
      });
    });

    it('renders modal with role="dialog"', async () => {
      act(() => {
        useModalStore.getState().openModal('signOut', mockSignOutProps);
      });

      render(<ModalManager />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('passes props correctly to modal', async () => {
      act(() => {
        useModalStore.getState().openModal('creditInfo', mockCreditInfoProps);
      });

      render(<ModalManager />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-creditinfo-modal')).toBeInTheDocument();
      });

      // Verify props were passed
      expect(screen.getByTestId('normal-credits')).toHaveTextContent('Normal Credits: 10');
      expect(screen.getByTestId('super-credits')).toHaveTextContent('Super Credits: 5');
    });

    it('renders purchase button when onPurchase prop is provided', async () => {
      act(() => {
        useModalStore.getState().openModal('creditInfo', mockCreditInfoProps);
      });

      render(<ModalManager />);

      await waitFor(() => {
        expect(screen.getByTestId('purchase-btn')).toBeInTheDocument();
      });
    });
  });

  describe('close handling', () => {
    it('calls closeModal when onClose triggered', async () => {
      const user = userEvent.setup();

      act(() => {
        useModalStore.getState().openModal('signOut', mockSignOutProps);
      });

      render(<ModalManager />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-signout-modal')).toBeInTheDocument();
      });

      // Click close button
      await user.click(screen.getByTestId('close-btn'));

      // Modal should be closed
      expect(useModalStore.getState().activeModal).toBeNull();
    });

    it('calls both store.closeModal and props.onClose', async () => {
      const user = userEvent.setup();
      const propsOnClose = vi.fn();

      act(() => {
        useModalStore.getState().openModal('creditInfo', {
          ...mockCreditInfoProps,
          onClose: propsOnClose,
        });
      });

      render(<ModalManager />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-creditinfo-modal')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('close-btn'));

      // Both should be called
      expect(useModalStore.getState().activeModal).toBeNull();
      expect(propsOnClose).toHaveBeenCalledTimes(1);
    });

    it('resets modalProps to empty after close', async () => {
      const user = userEvent.setup();

      act(() => {
        useModalStore.getState().openModal('creditInfo', mockCreditInfoProps);
      });

      render(<ModalManager />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-creditinfo-modal')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('close-btn'));

      expect(useModalStore.getState().modalProps).toEqual({});
    });

    it('modal unmounts after close', async () => {
      const user = userEvent.setup();

      act(() => {
        useModalStore.getState().openModal('signOut', mockSignOutProps);
      });

      render(<ModalManager />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-signout-modal')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('close-btn'));

      // Modal should no longer be in document
      await waitFor(() => {
        expect(screen.queryByTestId('mock-signout-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('modal actions from modal component', () => {
    it('calls onConfirm when confirm button clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();

      act(() => {
        useModalStore.getState().openModal('signOut', {
          onConfirm,
          onCancel: vi.fn(),
        });
      });

      render(<ModalManager />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-signout-modal')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('confirm-btn'));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();

      act(() => {
        useModalStore.getState().openModal('signOut', {
          onConfirm: vi.fn(),
          onCancel,
        });
      });

      render(<ModalManager />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-signout-modal')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('cancel-btn'));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('suspense fallback', () => {
    it('renders without error during lazy load', async () => {
      act(() => {
        useModalStore.getState().openModal('signOut', mockSignOutProps);
      });

      const { container } = render(<ModalManager />);

      // Initially renders something (either fallback or loaded modal)
      expect(container).toBeTruthy();

      // Eventually renders the modal
      await waitFor(() => {
        expect(screen.getByTestId('mock-signout-modal')).toBeInTheDocument();
      });
    });

    it('accepts custom loading fallback', async () => {
      act(() => {
        useModalStore.getState().openModal('signOut', mockSignOutProps);
      });

      render(
        <ModalManager
          loadingFallback={<div data-testid="custom-loader">Loading...</div>}
        />
      );

      // Eventually renders the modal (custom fallback may flash briefly)
      await waitFor(() => {
        expect(screen.getByTestId('mock-signout-modal')).toBeInTheDocument();
      });
    });
  });

  describe('modal switching', () => {
    it('replaces modal when opening different type', async () => {
      act(() => {
        useModalStore.getState().openModal('signOut', mockSignOutProps);
      });

      render(<ModalManager />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-signout-modal')).toBeInTheDocument();
      });

      // Open different modal
      act(() => {
        useModalStore.getState().openModal('creditInfo', mockCreditInfoProps);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('mock-signout-modal')).not.toBeInTheDocument();
        expect(screen.getByTestId('mock-creditinfo-modal')).toBeInTheDocument();
      });
    });

    it('updates props when reopening same modal type', async () => {
      act(() => {
        useModalStore.getState().openModal('creditInfo', {
          normalCredits: 5,
          superCredits: 1,
          onClose: vi.fn(),
        });
      });

      render(<ModalManager />);

      await waitFor(() => {
        expect(screen.getByTestId('normal-credits')).toHaveTextContent('Normal Credits: 5');
      });

      // Open same modal with different props
      act(() => {
        useModalStore.getState().openModal('creditInfo', {
          normalCredits: 20,
          superCredits: 10,
          onClose: vi.fn(),
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('normal-credits')).toHaveTextContent('Normal Credits: 20');
        expect(screen.getByTestId('super-credits')).toHaveTextContent('Super Credits: 10');
      });
    });
  });

  describe('stub modals', () => {
    it('renders stub modal for unimplemented types', async () => {
      act(() => {
        useModalStore.getState().openModal('currencyMismatch', {
          detectedCurrency: 'EUR',
          userCurrency: 'USD',
          onConfirm: vi.fn(),
          onCancel: vi.fn(),
        });
      });

      render(<ModalManager />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-stub-modal')).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('handles rapid open/close without errors', async () => {
      render(<ModalManager />);

      for (let i = 0; i < 10; i++) {
        act(() => {
          useModalStore.getState().openModal('signOut', mockSignOutProps);
        });
        act(() => {
          useModalStore.getState().closeModal();
        });
      }

      // Should end with no modal
      expect(useModalStore.getState().activeModal).toBeNull();
    });

    it('handles missing onClose in props gracefully', async () => {
      const user = userEvent.setup();

      // Props without onClose (using type assertion for test)
      act(() => {
        useModalStore.getState().openModal('signOut', {
          onConfirm: vi.fn(),
          onCancel: vi.fn(),
        } as SignOutProps);
      });

      render(<ModalManager />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-signout-modal')).toBeInTheDocument();
      });

      // Should not throw when clicking close
      await user.click(screen.getByTestId('close-btn'));

      expect(useModalStore.getState().activeModal).toBeNull();
    });
  });
});
