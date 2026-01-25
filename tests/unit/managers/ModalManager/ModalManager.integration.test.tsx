/**
 * ModalManager Integration Tests
 *
 * Story 14e-3: Integration tests for ModalManager with the registry and store.
 * Tests the full flow from opening a modal to rendering and closing.
 *
 * Note: Actual modal components have additional props (t, theme, etc.) not in
 * the ModalPropsMap types. These will be addressed in Stories 14e-4/5 during
 * the actual migration. These tests verify the ModalManager infrastructure works.
 *
 * @module tests/managers/ModalManager/ModalManager.integration.test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Import the full stack
import { ModalManager } from '../../../../src/managers/ModalManager/ModalManager';
import { MODAL_REGISTRY } from '../../../../src/managers/ModalManager/registry';
import {
  useModalStore,
  useModalActions,
  openModalDirect,
  closeModalDirect,
} from '../../../../src/managers/ModalManager/useModalStore';
import type {
  SignOutProps,
  CreditInfoProps,
  DeleteTransactionsProps,
  ModalType,
} from '../../../../src/managers/ModalManager/types';

// =============================================================================
// Test Setup
// =============================================================================

/**
 * Reset store to initial state
 */
function resetStore() {
  act(() => {
    useModalStore.setState({ activeModal: null, modalProps: {} });
  });
}

// =============================================================================
// Integration Tests
// =============================================================================

describe('ModalManager Integration', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Registry Structure', () => {
    it('should have all 21 modal types in registry', () => {
      const expectedTypes: ModalType[] = [
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

      expectedTypes.forEach((type) => {
        expect(MODAL_REGISTRY).toHaveProperty(type);
        expect(MODAL_REGISTRY[type]).toBeDefined();
      });

      expect(Object.keys(MODAL_REGISTRY)).toHaveLength(21);
    });

    it('should have lazy-loaded components (Symbol.for react.lazy)', () => {
      // Verify at least one entry is a lazy component
      const signOutEntry = MODAL_REGISTRY['signOut'];
      expect(signOutEntry).toBeDefined();
      // React.lazy components have $$typeof === Symbol.for('react.lazy')
      expect((signOutEntry as { $$typeof?: symbol }).$$typeof).toBe(Symbol.for('react.lazy'));
    });
  });

  describe('Store to Component Flow', () => {
    it('should open modal via store and close via store', async () => {
      // Initially no modal
      expect(useModalStore.getState().activeModal).toBeNull();

      // Open modal via store
      act(() => {
        useModalStore.getState().openModal('signOut', {
          onConfirm: vi.fn(),
          onCancel: vi.fn(),
        });
      });

      expect(useModalStore.getState().activeModal).toBe('signOut');

      // Close via store
      act(() => {
        useModalStore.getState().closeModal();
      });

      expect(useModalStore.getState().activeModal).toBeNull();
    });

    it('should work with direct access functions', () => {
      expect(useModalStore.getState().activeModal).toBeNull();

      // Open with direct function
      act(() => {
        openModalDirect('creditInfo', {
          normalCredits: 10,
          superCredits: 5,
          onClose: vi.fn(),
        });
      });

      expect(useModalStore.getState().activeModal).toBe('creditInfo');

      // Close with direct function
      act(() => {
        closeModalDirect();
      });

      expect(useModalStore.getState().activeModal).toBeNull();
    });
  });

  describe('Props Flow Through System', () => {
    it('should preserve props from openModal to store', () => {
      const props: CreditInfoProps = {
        normalCredits: 42,
        superCredits: 7,
        onClose: vi.fn(),
        onPurchase: vi.fn(),
      };

      act(() => {
        useModalStore.getState().openModal('creditInfo', props);
      });

      const storedProps = useModalStore.getState().modalProps as CreditInfoProps;
      expect(storedProps.normalCredits).toBe(42);
      expect(storedProps.superCredits).toBe(7);
      expect(storedProps.onClose).toBe(props.onClose);
      expect(storedProps.onPurchase).toBe(props.onPurchase);
    });

    it('should preserve complex props (arrays, nested objects)', () => {
      const props: DeleteTransactionsProps = {
        transactions: [
          {
            id: 'tx-1',
            date: '2026-01-24',
            merchant: 'Test Store',
            category: 'Supermercado',
            total: 50.00,
            items: [
              { name: 'Item 1', price: 25.00 },
              { name: 'Item 2', price: 25.00 },
            ],
          },
          {
            id: 'tx-2',
            date: '2026-01-23',
            merchant: 'Another Store',
            category: 'Restaurante',
            total: 30.00,
            items: [],
          },
        ],
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      act(() => {
        useModalStore.getState().openModal('deleteTransactions', props);
      });

      const storedProps = useModalStore.getState().modalProps as DeleteTransactionsProps;
      expect(storedProps.transactions).toHaveLength(2);
      expect(storedProps.transactions[0].id).toBe('tx-1');
      expect(storedProps.transactions[0].items).toHaveLength(2);
      expect(storedProps.transactions[1].total).toBe(30.00);
    });
  });

  describe('Type Safety at Runtime', () => {
    it('should allow opening any of the 21 modal types', () => {
      // Test a sampling of different modal types with minimal props
      const testCases: Array<{ type: ModalType; props: Record<string, unknown> }> = [
        { type: 'signOut', props: { onConfirm: vi.fn(), onCancel: vi.fn() } },
        {
          type: 'creditInfo',
          props: { normalCredits: 1, superCredits: 0, onClose: vi.fn() },
        },
        {
          type: 'currencyMismatch',
          props: {
            detectedCurrency: 'EUR',
            userCurrency: 'USD',
            onConfirm: vi.fn(),
            onCancel: vi.fn(),
          },
        },
        {
          type: 'totalMismatch',
          props: {
            calculatedTotal: 100,
            receiptTotal: 95,
            onUseCalculated: vi.fn(),
            onUseReceipt: vi.fn(),
            onEdit: vi.fn(),
          },
        },
      ];

      testCases.forEach(({ type, props }) => {
        act(() => {
          useModalStore.setState({
            activeModal: type,
            modalProps: props,
          });
        });

        expect(useModalStore.getState().activeModal).toBe(type);
        resetStore();
      });
    });
  });

  describe('Module Exports', () => {
    it('should export ModalManager component', async () => {
      // Verify import works
      const { ModalManager: ImportedModalManager } = await import(
        '../../../../src/managers/ModalManager'
      );
      expect(ImportedModalManager).toBeDefined();
      expect(typeof ImportedModalManager).toBe('function');
    });

    it('should export MODAL_REGISTRY', async () => {
      const { MODAL_REGISTRY: ImportedRegistry } = await import(
        '../../../../src/managers/ModalManager'
      );
      expect(ImportedRegistry).toBeDefined();
      expect(Object.keys(ImportedRegistry)).toHaveLength(21);
    });

    it('should export store and hooks', async () => {
      const exports = await import('../../../../src/managers/ModalManager');

      expect(exports.useModalStore).toBeDefined();
      expect(exports.useActiveModal).toBeDefined();
      expect(exports.useModalProps).toBeDefined();
      expect(exports.useIsModalOpen).toBeDefined();
      expect(exports.useModalActions).toBeDefined();
      expect(exports.getModalState).toBeDefined();
      expect(exports.openModalDirect).toBeDefined();
      expect(exports.closeModalDirect).toBeDefined();
    });

    it('should export types', async () => {
      // TypeScript types are erased at runtime, but we can verify
      // the module compiles correctly by importing and using them
      const exports = await import('../../../../src/managers/ModalManager');

      // These should be undefined at runtime (type-only exports)
      // but the import should succeed without errors
      expect(exports).toBeDefined();
    });
  });

  describe('Real Component Integration (Stub)', () => {
    /**
     * Note: Testing with real modal components requires additional setup
     * (translation context, theme context, etc.). For now, we test that
     * the stub modals work correctly, which validates the infrastructure.
     *
     * Full integration with real modals will be tested in Stories 14e-4/5
     * after proper adapter/wrapper patterns are implemented.
     */

    it('should render stub modal for stubbed types', async () => {
      act(() => {
        useModalStore.getState().openModal('currencyMismatch', {
          detectedCurrency: 'EUR',
          userCurrency: 'USD',
          onConfirm: vi.fn(),
          onCancel: vi.fn(),
        });
      });

      render(<ModalManager />);

      // Wait for lazy component to load
      await waitFor(
        () => {
          // Stub shows "Coming Soon" message with modal type
          expect(screen.getByText(/currencyMismatch/)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should close stub modal when close button clicked', async () => {
      const user = userEvent.setup();

      // Story 14e-4: creditInfo is now a real component, use learnMerchant stub instead
      act(() => {
        useModalStore.getState().openModal('learnMerchant', {
          merchantName: 'Test Merchant',
          category: 'Supermercado',
          onConfirm: vi.fn(),
          onSkip: vi.fn(),
        });
      });

      render(<ModalManager />);

      // Wait for modal to load
      await waitFor(
        () => {
          expect(screen.getByText(/learnMerchant/)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Click close button
      const closeButton = screen.getByTestId('modal-stub-close');
      await user.click(closeButton);

      // Modal should be closed
      expect(useModalStore.getState().activeModal).toBeNull();
    });

    it('should close stub modal when backdrop clicked', async () => {
      const user = userEvent.setup();

      act(() => {
        useModalStore.getState().openModal('quickSave', {
          transaction: {
            id: 'tx-1',
            date: '2026-01-24',
            merchant: 'Test',
            category: 'Supermercado',
            total: 100,
            items: [],
          },
          confidence: 95,
          onSave: vi.fn(),
          onEdit: vi.fn(),
        });
      });

      render(<ModalManager />);

      await waitFor(
        () => {
          expect(screen.getByText(/quickSave/)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Click backdrop
      const backdrop = screen.getByTestId('modal-stub-backdrop');
      await user.click(backdrop);

      // Modal should be closed
      expect(useModalStore.getState().activeModal).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid modal switches', async () => {
      const types: ModalType[] = [
        'signOut',
        'creditInfo',
        'currencyMismatch',
        'deleteTransactions',
      ];

      render(<ModalManager />);

      for (const type of types) {
        // Use async act() to properly handle Suspense resolution
        await act(async () => {
          useModalStore.setState({
            activeModal: type,
            modalProps: {},
          });
          // Allow microtask queue to flush for lazy component resolution
          await Promise.resolve();
        });
        expect(useModalStore.getState().activeModal).toBe(type);
      }

      // End with close
      await act(async () => {
        useModalStore.getState().closeModal();
      });

      expect(useModalStore.getState().activeModal).toBeNull();
    });

    it('should handle props updates for same modal type', () => {
      const props1: CreditInfoProps = {
        normalCredits: 1,
        superCredits: 0,
        onClose: vi.fn(),
      };

      const props2: CreditInfoProps = {
        normalCredits: 100,
        superCredits: 50,
        onClose: vi.fn(),
      };

      act(() => {
        useModalStore.getState().openModal('creditInfo', props1);
      });
      expect((useModalStore.getState().modalProps as CreditInfoProps).normalCredits).toBe(1);

      act(() => {
        useModalStore.getState().openModal('creditInfo', props2);
      });
      expect((useModalStore.getState().modalProps as CreditInfoProps).normalCredits).toBe(100);
    });
  });
});
