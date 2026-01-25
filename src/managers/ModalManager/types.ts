/**
 * Modal Manager Types
 *
 * Story 14e-2: Defines all modal types that can be opened via the Modal Manager.
 * Each modal type has a corresponding props interface for type safety.
 *
 * @module ModalManager/types
 */

import type { Transaction } from '../../types/transaction';
import type {
  ConflictingTransaction,
  ConflictReason,
} from '../../components/dialogs/TransactionConflictDialog';

// =============================================================================
// Modal Type Union
// =============================================================================

/**
 * Union type of all modal types supported by the Modal Manager.
 * Each type corresponds to a specific modal component.
 */
export type ModalType =
  // Scan-related modals (managed by ScanContext until Part 2)
  | 'currencyMismatch'
  | 'totalMismatch'
  | 'quickSave'
  | 'scanComplete'
  | 'batchComplete'
  | 'batchDiscard'
  | 'creditWarning'
  // Transaction management
  | 'transactionConflict'
  | 'deleteTransactions'
  | 'learnMerchant'
  | 'itemNameSuggestion'
  // General
  | 'creditInfo'
  | 'insightDetail'
  | 'upgradePrompt'
  | 'signOut'
  // Shared groups (stubbed - Epic 14c-refactor)
  | 'joinGroup'
  | 'leaveGroup'
  | 'deleteGroup'
  | 'transferOwnership'
  | 'removeMember'
  | 'ownerLeaveWarning';

// =============================================================================
// Props Interfaces for Each Modal
// =============================================================================

/** Props for currency mismatch dialog (scan detected different currency) */
export interface CurrencyMismatchProps {
  /** Currency detected by AI scan */
  detectedCurrency: string;
  /** User's configured currency */
  userCurrency: string;
  /** Callback when user confirms currency selection */
  onConfirm: (useCurrency: string) => void;
  /** Callback when user cancels */
  onCancel: () => void;
}

/** Props for total mismatch dialog (calculated vs receipt total) */
export interface TotalMismatchProps {
  /** Sum of item prices */
  calculatedTotal: number;
  /** Total shown on receipt */
  receiptTotal: number;
  /** Use the calculated total */
  onUseCalculated: () => void;
  /** Use the receipt total */
  onUseReceipt: () => void;
  /** Open editor to manually adjust */
  onEdit: () => void;
}

/** Props for quick save confirmation card */
export interface QuickSaveProps {
  /** Transaction to quick-save */
  transaction: Transaction;
  /** AI confidence score (0-100) */
  confidence: number;
  /** Save without editing */
  onSave: () => void;
  /** Open editor for changes */
  onEdit: () => void;
}

/** Props for scan complete modal */
export interface ScanCompleteProps {
  /** Scanned transaction */
  transaction: Transaction;
  /** Save the transaction */
  onSave: () => void;
  /** Edit before saving */
  onEdit: () => void;
}

/** Props for batch complete modal */
export interface BatchCompleteProps {
  /** Number of successfully processed receipts */
  successCount: number;
  /** Number of failed receipts */
  failedCount: number;
  /** All transactions from batch */
  transactions: Transaction[];
  /** Dismiss the modal */
  onDismiss: () => void;
}

/** Props for batch discard confirmation */
export interface BatchDiscardProps {
  /** Number of unsaved receipts */
  unsavedCount: number;
  /** Confirm discard */
  onConfirm: () => void;
  /** Cancel discard */
  onCancel: () => void;
}

/** Props for credit warning dialog */
export interface CreditWarningProps {
  /** Credits needed for operation */
  requiredCredits: number;
  /** User's available credits */
  availableCredits: number;
  /** Proceed anyway */
  onProceed: () => void;
  /** Cancel operation */
  onCancel: () => void;
}

/** Props for transaction conflict dialog */
export interface TransactionConflictProps {
  /** Details of the conflicting transaction */
  conflictingTransaction: ConflictingTransaction;
  /** Reason for the conflict */
  conflictReason: ConflictReason;
  /** Action user was trying to perform */
  pendingAction: 'save' | 'delete';
  /** Resolve the conflict */
  onResolve: (resolution: 'keep' | 'replace' | 'cancel') => void;
}

/** Props for delete transactions confirmation */
export interface DeleteTransactionsProps {
  /** Transactions to delete */
  transactions: Transaction[];
  /** Confirm deletion */
  onConfirm: () => void;
  /** Cancel deletion */
  onCancel: () => void;
}

/** Props for learn merchant dialog */
export interface LearnMerchantProps {
  /** Merchant name to learn */
  merchantName: string;
  /** Category to associate */
  category: string;
  /** Confirm learning */
  onConfirm: () => void;
  /** Skip learning */
  onSkip: () => void;
}

/** Props for item name suggestion dialog */
export interface ItemNameSuggestionProps {
  /** Original item name from scan */
  originalName: string;
  /** Suggested corrected name */
  suggestedName: string;
  /** Accept suggestion */
  onAccept: (name: string) => void;
  /** Reject suggestion */
  onReject: () => void;
}

/** Props for credit info modal */
export interface CreditInfoProps {
  /** Normal scan credits available */
  normalCredits: number;
  /** Super/premium credits available */
  superCredits: number;
  /** Close the modal */
  onClose: () => void;
  /** Open purchase flow (optional) */
  onPurchase?: () => void;
  /** Translation function (optional - Spanish fallbacks used if not provided) */
  t?: (key: string) => string;
  /** Language for fallback text */
  lang?: 'en' | 'es';
}

/** Props for insight detail modal */
export interface InsightDetailProps {
  /** ID of the insight to display */
  insightId: string;
  /** Close the modal */
  onClose: () => void;
}

/** Props for upgrade prompt modal */
export interface UpgradePromptProps {
  /** Feature requiring upgrade */
  feature: string;
  /** Proceed to upgrade */
  onUpgrade: () => void;
  /** Dismiss prompt */
  onDismiss: () => void;
}

/** Props for sign out confirmation */
export interface SignOutProps {
  /** Confirm sign out */
  onConfirm: () => void;
  /** Cancel sign out */
  onCancel: () => void;
  /** Translation function (optional - fallbacks used if not provided) */
  t?: (key: string) => string;
  /** Language for fallback text (default: 'es') */
  lang?: 'en' | 'es';
}

// =============================================================================
// Shared Groups Props (Stubbed - Epic 14c-refactor)
// =============================================================================

/** Props for join group dialog */
export interface JoinGroupProps {
  /** Share code from invite link (optional) */
  shareCode?: string;
  /** Join the group */
  onJoin: () => void;
  /** Cancel join */
  onCancel: () => void;
}

/** Props for leave group dialog */
export interface LeaveGroupProps {
  /** Name of group to leave */
  groupName: string;
  /** Confirm leave */
  onConfirm: () => void;
  /** Cancel leave */
  onCancel: () => void;
}

/** Props for delete group dialog */
export interface DeleteGroupProps {
  /** Name of group to delete */
  groupName: string;
  /** Number of members in group */
  memberCount: number;
  /** Confirm deletion */
  onConfirm: () => void;
  /** Cancel deletion */
  onCancel: () => void;
}

/** Props for transfer ownership dialog */
export interface TransferOwnershipProps {
  /** Name of the group */
  groupName: string;
  /** Available members to transfer to */
  members: { id: string; email: string }[];
  /** Transfer ownership to selected member */
  onTransfer: (newOwnerId: string) => void;
  /** Cancel transfer */
  onCancel: () => void;
}

/** Props for remove member dialog */
export interface RemoveMemberProps {
  /** Email of member to remove */
  memberEmail: string;
  /** Name of the group */
  groupName: string;
  /** Confirm removal */
  onConfirm: () => void;
  /** Cancel removal */
  onCancel: () => void;
}

/** Props for owner leave warning dialog */
export interface OwnerLeaveWarningProps {
  /** Name of the group */
  groupName: string;
  /** Transfer ownership first */
  onTransferFirst: () => void;
  /** Delete the group instead */
  onDeleteGroup: () => void;
  /** Cancel leaving */
  onCancel: () => void;
}

// =============================================================================
// Props Map (Type-Safe Modal Opening)
// =============================================================================

/**
 * Maps each ModalType to its corresponding props interface.
 * Enables type-safe modal opening with correct props.
 *
 * @example
 * ```typescript
 * // TypeScript will enforce correct props for each modal type
 * openModal('creditInfo', { normalCredits: 5, superCredits: 2, onClose: () => {} });
 *
 * // TypeScript ERROR: missing onClose
 * openModal('creditInfo', { normalCredits: 5, superCredits: 2 });
 *
 * // TypeScript ERROR: wrong props for modal type
 * openModal('creditInfo', { groupName: 'test' });
 * ```
 */
export interface ModalPropsMap {
  currencyMismatch: CurrencyMismatchProps;
  totalMismatch: TotalMismatchProps;
  quickSave: QuickSaveProps;
  scanComplete: ScanCompleteProps;
  batchComplete: BatchCompleteProps;
  batchDiscard: BatchDiscardProps;
  creditWarning: CreditWarningProps;
  transactionConflict: TransactionConflictProps;
  deleteTransactions: DeleteTransactionsProps;
  learnMerchant: LearnMerchantProps;
  itemNameSuggestion: ItemNameSuggestionProps;
  creditInfo: CreditInfoProps;
  insightDetail: InsightDetailProps;
  upgradePrompt: UpgradePromptProps;
  signOut: SignOutProps;
  joinGroup: JoinGroupProps;
  leaveGroup: LeaveGroupProps;
  deleteGroup: DeleteGroupProps;
  transferOwnership: TransferOwnershipProps;
  removeMember: RemoveMemberProps;
  ownerLeaveWarning: OwnerLeaveWarningProps;
}
