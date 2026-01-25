/**
 * Modal Registry
 *
 * Story 14e-3: Maps ModalType to lazy-loaded modal components.
 * Uses React.lazy() to avoid circular dependencies and enable code splitting.
 *
 * IMPLEMENTATION STATUS:
 * All modals are currently STUBBED. The actual component integration will happen
 * in Stories 14e-4/5 when each modal is migrated. The stubs provide a working
 * infrastructure while allowing incremental migration.
 *
 * Components are ready at these paths (migration pending):
 * - TransactionConflictDialog: src/components/dialogs/TransactionConflictDialog.tsx
 * - DeleteTransactionsModal: src/components/history/DeleteTransactionsModal.tsx
 * - LearnMerchantDialog: src/components/dialogs/LearnMerchantDialog.tsx
 * - ItemNameSuggestionDialog: src/components/dialogs/ItemNameSuggestionDialog.tsx
 * - InsightDetailModal: src/components/insights/InsightDetailModal.tsx
 * - UpgradePromptModal: src/components/UpgradePromptModal.tsx
 * - SignOutDialog: src/components/settings/SignOutDialog.tsx
 * - SharedGroups/*: src/components/SharedGroups/*.tsx
 *
 * @module ModalManager/registry
 */

import React from 'react';
import type { ModalType } from './types';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Simplified modal component type for the registry.
 * Uses relaxed typing to allow for stub components.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ModalComponent = React.ComponentType<any>;

/**
 * Lazy-loaded modal component.
 */
export type LazyModalComponent = React.LazyExoticComponent<ModalComponent>;

// =============================================================================
// Stub Component for Unimplemented Modals
// =============================================================================

/**
 * Placeholder component for modals not yet migrated to ModalManager.
 * Shows a message and close button.
 */
const ModalStub: React.FC<{ modalType: string; onClose: () => void }> = ({
  modalType,
  onClose,
}) => (
  <div
    role="dialog"
    aria-modal="true"
    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
  >
    <div
      className="absolute inset-0 bg-black/50"
      onClick={onClose}
      data-testid="modal-stub-backdrop"
    />
    <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-xl">
      <h2 className="text-lg font-semibold mb-2">Coming Soon</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Modal &quot;{modalType}&quot; is not yet integrated with ModalManager.
      </p>
      <button
        onClick={onClose}
        className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        data-testid="modal-stub-close"
      >
        Close
      </button>
    </div>
  </div>
);

/**
 * Factory to create a lazy-loaded stub component for a modal type.
 */
const createLazyStub = (modalType: string): LazyModalComponent =>
  React.lazy(() =>
    Promise.resolve({
      default: (props: { onClose: () => void }) => (
        <ModalStub modalType={modalType} onClose={props.onClose} />
      ),
    })
  );

// =============================================================================
// Modal Registry
// =============================================================================

/**
 * Registry mapping ModalType to lazy-loaded components.
 *
 * All modals are currently stubbed. Integration happens in Stories 14e-4/5.
 *
 * STATUS KEY:
 * - STUBBED: Placeholder until migration
 * - READY: Component exists, needs prop adapter (migrated in 14e-4/5)
 *
 * @example
 * ```typescript
 * const SignOutModal = MODAL_REGISTRY['signOut'];
 * // SignOutModal is a lazy-loaded component
 * ```
 */
export const MODAL_REGISTRY: Record<ModalType, LazyModalComponent> = {
  // ---------------------------------------------------------------------------
  // Scan-related modals (STUBBED - integrated in Part 2: Scan Feature)
  // These modals currently use ScanContext internally.
  // ---------------------------------------------------------------------------
  currencyMismatch: createLazyStub('currencyMismatch'),
  totalMismatch: createLazyStub('totalMismatch'),
  quickSave: createLazyStub('quickSave'),
  scanComplete: createLazyStub('scanComplete'),
  batchComplete: createLazyStub('batchComplete'),
  batchDiscard: createLazyStub('batchDiscard'),
  creditWarning: createLazyStub('creditWarning'),

  // ---------------------------------------------------------------------------
  // Transaction management modals (READY - migrated in Story 14e-4/5)
  // Components exist at src/components/dialogs/ and src/components/history/
  // ---------------------------------------------------------------------------
  transactionConflict: createLazyStub('transactionConflict'), // READY
  deleteTransactions: createLazyStub('deleteTransactions'), // READY
  learnMerchant: createLazyStub('learnMerchant'), // READY
  itemNameSuggestion: createLazyStub('itemNameSuggestion'), // READY

  // ---------------------------------------------------------------------------
  // General modals (Story 14e-4: CreditInfo and SignOut migrated)
  // ---------------------------------------------------------------------------
  creditInfo: React.lazy(() => import('@/components/modals/CreditInfoModal')),
  insightDetail: createLazyStub('insightDetail'), // READY
  upgradePrompt: createLazyStub('upgradePrompt'), // READY
  signOut: React.lazy(() => import('@/components/settings/SignOutDialog')),

  // ---------------------------------------------------------------------------
  // Shared group modals (READY - Epic 14c-refactor components)
  // Components exist at src/components/SharedGroups/
  // ---------------------------------------------------------------------------
  joinGroup: createLazyStub('joinGroup'), // READY
  leaveGroup: createLazyStub('leaveGroup'), // READY
  deleteGroup: createLazyStub('deleteGroup'), // READY
  transferOwnership: createLazyStub('transferOwnership'), // READY
  removeMember: createLazyStub('removeMember'), // READY
  ownerLeaveWarning: createLazyStub('ownerLeaveWarning'), // READY
};
