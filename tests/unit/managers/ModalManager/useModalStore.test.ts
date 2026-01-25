/**
 * Modal Manager Store Tests
 *
 * Story 14e-2: Unit tests for useModalStore Zustand store.
 * Tests all store actions, selectors, and direct access functions.
 *
 * @module tests/managers/ModalManager/useModalStore.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  useModalStore,
  useActiveModal,
  useModalProps,
  useIsModalOpen,
  useModalActions,
  getModalState,
  openModalDirect,
  closeModalDirect,
} from '../../../../src/managers/ModalManager';
import type {
  CreditInfoProps,
  SignOutProps,
  TransactionConflictProps,
  DeleteTransactionsProps,
  ModalType,
} from '../../../../src/managers/ModalManager';

// =============================================================================
// Test Fixtures
// =============================================================================

const mockCreditInfoProps: CreditInfoProps = {
  normalCredits: 5,
  superCredits: 2,
  onClose: vi.fn(),
  onPurchase: vi.fn(),
};

const mockSignOutProps: SignOutProps = {
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

const mockTransactionConflictProps: TransactionConflictProps = {
  conflictingTransaction: {
    merchant: 'Test Store',
    total: 100,
    currency: 'USD',
    creditUsed: false,
    hasChanges: true,
    isScanning: false,
    source: 'editing_existing',
  },
  conflictReason: 'has_unsaved_changes',
  pendingAction: 'save',
  onResolve: vi.fn(),
};

const mockDeleteTransactionsProps: DeleteTransactionsProps = {
  transactions: [
    {
      id: 'tx-1',
      date: '2026-01-24',
      merchant: 'Test Store',
      category: 'Supermercado',
      total: 50,
      items: [],
    },
  ],
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

// =============================================================================
// Store Reset Helper
// =============================================================================

function resetStore() {
  act(() => {
    useModalStore.setState({ activeModal: null, modalProps: {} });
  });
}

// =============================================================================
// Tests
// =============================================================================

describe('useModalStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have null activeModal initially', () => {
      const state = getModalState();
      expect(state.activeModal).toBeNull();
    });

    it('should have empty modalProps initially', () => {
      const state = getModalState();
      expect(state.modalProps).toEqual({});
    });
  });

  describe('openModal', () => {
    it('should set activeModal and modalProps', () => {
      act(() => {
        useModalStore.getState().openModal('creditInfo', mockCreditInfoProps);
      });

      const state = getModalState();
      expect(state.activeModal).toBe('creditInfo');
      expect(state.modalProps).toEqual(mockCreditInfoProps);
    });

    it('should replace existing modal when opening new one', () => {
      // Open first modal
      act(() => {
        useModalStore.getState().openModal('creditInfo', mockCreditInfoProps);
      });
      expect(getModalState().activeModal).toBe('creditInfo');

      // Open second modal - should replace
      act(() => {
        useModalStore.getState().openModal('signOut', mockSignOutProps);
      });
      expect(getModalState().activeModal).toBe('signOut');
      expect(getModalState().modalProps).toEqual(mockSignOutProps);
    });

    it('should handle all 21 modal types', () => {
      const modalTypes: ModalType[] = [
        'currencyMismatch',
        'totalMismatch',
        'quickSave',
        'scanComplete',
        'batchComplete',
        'batchDiscard',
        'creditWarning',
        'transactionConflict',
        'deleteTransactions',
        'learnMerchant',
        'itemNameSuggestion',
        'creditInfo',
        'insightDetail',
        'upgradePrompt',
        'signOut',
        'joinGroup',
        'leaveGroup',
        'deleteGroup',
        'transferOwnership',
        'removeMember',
        'ownerLeaveWarning',
      ];

      expect(modalTypes).toHaveLength(21);

      // Verify we can set each type (with minimal props for type checking)
      modalTypes.forEach((type) => {
        act(() => {
          useModalStore.setState({ activeModal: type, modalProps: {} });
        });
        expect(getModalState().activeModal).toBe(type);
      });
    });

    it('should work with complex props (TransactionConflictProps)', () => {
      act(() => {
        useModalStore
          .getState()
          .openModal('transactionConflict', mockTransactionConflictProps);
      });

      const state = getModalState();
      expect(state.activeModal).toBe('transactionConflict');
      expect(state.modalProps).toEqual(mockTransactionConflictProps);
    });

    it('should work with array props (DeleteTransactionsProps)', () => {
      act(() => {
        useModalStore
          .getState()
          .openModal('deleteTransactions', mockDeleteTransactionsProps);
      });

      const state = getModalState();
      expect(state.activeModal).toBe('deleteTransactions');
      expect(
        (state.modalProps as DeleteTransactionsProps).transactions
      ).toHaveLength(1);
    });
  });

  describe('closeModal', () => {
    it('should reset state to initial values', () => {
      // Open a modal first
      act(() => {
        useModalStore.getState().openModal('creditInfo', mockCreditInfoProps);
      });
      expect(getModalState().activeModal).toBe('creditInfo');

      // Close it
      act(() => {
        useModalStore.getState().closeModal();
      });

      const state = getModalState();
      expect(state.activeModal).toBeNull();
      expect(state.modalProps).toEqual({});
    });

    it('should be safe to call when no modal is open', () => {
      expect(() => {
        act(() => {
          useModalStore.getState().closeModal();
        });
      }).not.toThrow();

      expect(getModalState().activeModal).toBeNull();
    });

    it('should be safe to call multiple times', () => {
      act(() => {
        useModalStore.getState().openModal('signOut', mockSignOutProps);
      });

      expect(() => {
        act(() => {
          useModalStore.getState().closeModal();
          useModalStore.getState().closeModal();
          useModalStore.getState().closeModal();
        });
      }).not.toThrow();

      expect(getModalState().activeModal).toBeNull();
    });
  });

  describe('selector hooks', () => {
    describe('useActiveModal', () => {
      it('should return null when no modal is open', () => {
        const { result } = renderHook(() => useActiveModal());
        expect(result.current).toBeNull();
      });

      it('should return active modal type when open', () => {
        act(() => {
          useModalStore.getState().openModal('creditInfo', mockCreditInfoProps);
        });

        const { result } = renderHook(() => useActiveModal());
        expect(result.current).toBe('creditInfo');
      });

      it('should update when modal changes', () => {
        const { result, rerender } = renderHook(() => useActiveModal());
        expect(result.current).toBeNull();

        act(() => {
          useModalStore.getState().openModal('signOut', mockSignOutProps);
        });
        rerender();

        expect(result.current).toBe('signOut');
      });
    });

    describe('useModalProps', () => {
      it('should return modal props', () => {
        act(() => {
          useModalStore.getState().openModal('creditInfo', mockCreditInfoProps);
        });

        const { result } = renderHook(() => useModalProps<'creditInfo'>());
        expect(result.current).toEqual(mockCreditInfoProps);
      });
    });

    describe('useIsModalOpen', () => {
      it('should return false when modal is not open', () => {
        const { result } = renderHook(() => useIsModalOpen('creditInfo'));
        expect(result.current).toBe(false);
      });

      it('should return true when specific modal is open', () => {
        act(() => {
          useModalStore.getState().openModal('creditInfo', mockCreditInfoProps);
        });

        const { result } = renderHook(() => useIsModalOpen('creditInfo'));
        expect(result.current).toBe(true);
      });

      it('should return false for different modal type', () => {
        act(() => {
          useModalStore.getState().openModal('creditInfo', mockCreditInfoProps);
        });

        const { result } = renderHook(() => useIsModalOpen('signOut'));
        expect(result.current).toBe(false);
      });
    });

    describe('useModalActions', () => {
      it('should return openModal and closeModal functions', () => {
        const { result } = renderHook(() => useModalActions());

        expect(result.current.openModal).toBeInstanceOf(Function);
        expect(result.current.closeModal).toBeInstanceOf(Function);
      });

      it('should work correctly when called from hook result', () => {
        const { result } = renderHook(() => useModalActions());

        act(() => {
          result.current.openModal('signOut', mockSignOutProps);
        });

        expect(getModalState().activeModal).toBe('signOut');

        act(() => {
          result.current.closeModal();
        });

        expect(getModalState().activeModal).toBeNull();
      });
    });
  });

  describe('direct access functions', () => {
    describe('getModalState', () => {
      it('should return current state', () => {
        const state = getModalState();
        expect(state).toHaveProperty('activeModal');
        expect(state).toHaveProperty('modalProps');
        expect(state).toHaveProperty('openModal');
        expect(state).toHaveProperty('closeModal');
      });

      it('should reflect state changes', () => {
        expect(getModalState().activeModal).toBeNull();

        act(() => {
          useModalStore.getState().openModal('creditInfo', mockCreditInfoProps);
        });

        expect(getModalState().activeModal).toBe('creditInfo');
      });
    });

    describe('openModalDirect', () => {
      it('should open modal from outside React', () => {
        act(() => {
          openModalDirect('signOut', mockSignOutProps);
        });

        expect(getModalState().activeModal).toBe('signOut');
        expect(getModalState().modalProps).toEqual(mockSignOutProps);
      });
    });

    describe('closeModalDirect', () => {
      it('should close modal from outside React', () => {
        act(() => {
          openModalDirect('signOut', mockSignOutProps);
        });
        expect(getModalState().activeModal).toBe('signOut');

        act(() => {
          closeModalDirect();
        });
        expect(getModalState().activeModal).toBeNull();
      });
    });
  });

  describe('type safety (compile-time checks)', () => {
    // These tests verify type safety at compile time
    // If types are wrong, TypeScript will error during compilation

    it('should accept correct props for creditInfo', () => {
      act(() => {
        useModalStore.getState().openModal('creditInfo', {
          normalCredits: 10,
          superCredits: 5,
          onClose: vi.fn(),
        });
      });

      expect(getModalState().activeModal).toBe('creditInfo');
    });

    it('should accept correct props for transactionConflict', () => {
      act(() => {
        useModalStore.getState().openModal('transactionConflict', {
          conflictingTransaction: {
            creditUsed: true,
            hasChanges: false,
            isScanning: true,
            source: 'new_scan',
          },
          conflictReason: 'scan_in_progress',
          pendingAction: 'delete',
          onResolve: vi.fn(),
        });
      });

      expect(getModalState().activeModal).toBe('transactionConflict');
    });

    it('should accept optional props (onPurchase in creditInfo)', () => {
      // onPurchase is optional in CreditInfoProps
      act(() => {
        useModalStore.getState().openModal('creditInfo', {
          normalCredits: 10,
          superCredits: 5,
          onClose: vi.fn(),
          // onPurchase intentionally omitted
        });
      });

      expect(getModalState().activeModal).toBe('creditInfo');
    });
  });

  describe('devtools integration', () => {
    it('should not break functionality with devtools enabled', () => {
      // The store uses devtools middleware - verify it doesn't affect behavior
      act(() => {
        useModalStore.getState().openModal('creditInfo', mockCreditInfoProps);
      });
      expect(getModalState().activeModal).toBe('creditInfo');

      act(() => {
        useModalStore.getState().closeModal();
      });
      expect(getModalState().activeModal).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid open/close cycles', () => {
      for (let i = 0; i < 100; i++) {
        act(() => {
          useModalStore.getState().openModal('signOut', mockSignOutProps);
          useModalStore.getState().closeModal();
        });
      }

      expect(getModalState().activeModal).toBeNull();
    });

    it('should handle opening same modal type multiple times', () => {
      const props1: CreditInfoProps = {
        normalCredits: 1,
        superCredits: 0,
        onClose: vi.fn(),
      };
      const props2: CreditInfoProps = {
        normalCredits: 10,
        superCredits: 5,
        onClose: vi.fn(),
      };

      act(() => {
        useModalStore.getState().openModal('creditInfo', props1);
      });
      expect((getModalState().modalProps as CreditInfoProps).normalCredits).toBe(1);

      act(() => {
        useModalStore.getState().openModal('creditInfo', props2);
      });
      expect((getModalState().modalProps as CreditInfoProps).normalCredits).toBe(10);
    });
  });
});
