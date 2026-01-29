/**
 * TransactionEditorView Component
 *
 * Story 14.23: Unified Transaction Editor
 * Story 14d.4b: Added ScanContext integration for scan state
 * Epic 14: Core Implementation
 *
 * Unified transaction editor that combines ScanResultView and EditView functionality.
 * Handles both new transactions (with scan flow) and editing existing transactions.
 *
 * Features:
 * - Single view for both new and existing transactions (via mode prop)
 * - Scan button state machine: idle | pending | scanning | complete | error
 * - Full content blocking during scanning with ProcessingOverlay
 * - ScanCompleteModal for new transaction scan completion
 * - Learning prompts for category, subcategory, and merchant
 * - Item editing with category grouping
 * - Re-scan support for existing transactions
 * - Parent-managed state via onUpdateTransaction callback
 *
 * Story 14d.4b Migration:
 * - Uses useScanOptional() to read scan state from context
 * - Falls back to props if context not available (backward compatibility)
 * - Context provides: isProcessing, hasError, state.error
 *
 * @see /home/khujta/.claude/plans/fancy-doodling-island.md
 * @see docs/sprint-artifacts/epic14/stories/story-14.23-unified-transaction-editor.md
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Trash2,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Bookmark,
  BookMarked,
  BookmarkPlus,
  X,
  Camera,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Zap,
  Info,
  Pencil,
  Layers,
  Receipt,
} from 'lucide-react';
import { formatCreditsDisplay } from '../services/userCreditsService';
import { CategoryBadge } from '../components/CategoryBadge';
import { CategorySelectorOverlay } from '../components/CategorySelectorOverlay';
import { ImageViewer } from '../components/ImageViewer';
// Story 14e-5: Learning dialogs and ItemNameSuggestion now use Modal Manager
import type { LearnMerchantSelection, ItemNameChange } from '../components/dialogs/LearnMerchantDialog';
import { useModalActions } from '@managers/ModalManager';
import { ItemNameSuggestionIndicator } from '../components/ItemNameSuggestionIndicator';
import { normalizeMerchantName } from '../services/merchantMappingService';
import { normalizeItemName } from '../services/itemNameMappingService';
import type { ItemNameMapping } from '../types/itemNameMapping';
import { LocationSelect } from '../components/LocationSelect';
import { DateTimeTag } from '../components/DateTimeTag';
import { CurrencyTag } from '../components/CurrencyTag';
import { ProcessingOverlay } from '../components/scan/ProcessingOverlay';
import { ScanCompleteModal } from '@features/scan/components';
import { celebrateSuccess } from '../utils/confetti';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useStaggeredReveal } from '../hooks/useStaggeredReveal';
import { AnimatedItem } from '../components/AnimatedItem';
import {
  sanitizeMerchantName,
  sanitizeItemName,
  sanitizeLocation,
  sanitizeSubcategory,
} from '../utils/sanitize';
import {
  StoreCategory,
  ItemCategory,
  Transaction,
  TransactionItem,
} from '../types/transaction';
import type { UserCredits } from '../types/scan';
import type { Language } from '../utils/translations';
import { translateItemCategoryGroup, getItemCategoryGroupEmoji, translateStoreCategory } from '../utils/categoryTranslations';
import { getCategoryPillColors, getItemCategoryGroup, getItemGroupColors } from '../config/categoryColors';
import { getCategoryEmoji } from '../utils/categoryEmoji';
import { normalizeItemCategory } from '../utils/categoryNormalizer';
// Story 14e-11: Migrated from useScanOptional (ScanContext) to Zustand store
import { useIsProcessing as useScanIsProcessing, useScanActiveDialog } from '@features/scan/store';
import { DIALOG_TYPES } from '../types/scanStateMachine';
// Story 14e-25d: Direct hooks (ViewHandlersContext deleted)
import { useToast } from '@/shared/hooks';
// Note: useModalActions imported above from @managers/ModalManager
import { ItemViewToggle, type ItemViewMode } from '../components/items/ItemViewToggle';
import { TransactionGroupSelector, type GroupWithMeta } from '../components/SharedGroups';

/**
 * Scan button state machine
 * - idle: No photo selected, show camera icon with dashed border
 * - pending: Photo selected but not processed, show "Escanear" button
 * - scanning: Processing in progress, show shining animation
 * - complete: Scan successful, show checkmark badge
 * - error: Scan failed, show error state with retry
 */
export type ScanButtonState = 'idle' | 'pending' | 'scanning' | 'complete' | 'error';

/**
 * Props for TransactionEditorView component
 */
export interface TransactionEditorViewProps {
  // Core
  /** Transaction data (null for blank new transaction) */
  transaction: Transaction | null;
  /** Mode: 'new' for new transactions, 'existing' for editing */
  mode: 'new' | 'existing';
  /**
   * Story 14.24: Read-only mode for viewing transactions
   * When true:
   * - All fields are disabled/non-interactive
   * - Re-scan button is hidden
   * - Edit button appears at bottom instead of Save
   * - Clicking Edit triggers onRequestEdit callback with conflict check
   */
  readOnly?: boolean;
  /** Callback when user clicks Edit button in read-only mode */
  onRequestEdit?: () => void;

  /**
   * When true:
   * - Strict read-only mode (no Edit button shown at all)
   * - Owner info displayed in header
   * - Prevents any edit attempts
   */
  isOtherUserTransaction?: boolean;
  /** Owner profile info for display when isOtherUserTransaction is true */
  ownerProfile?: { displayName?: string; photoURL?: string | null } | null;
  /**
   * Owner's user ID for profile color in header ProfileIndicator
   * NOTE: Currently unused - prop is passed but not rendered.
   * "owner's profile icon appears in the top-left" but current implementation
   * shows text "Added by [Name]" instead. Keeping prop for future enhancement.
   */
  ownerId?: string;

  // Scan state
  /** Current state of the scan button */
  scanButtonState: ScanButtonState;
  /** Whether processing/analyzing is in progress */
  isProcessing: boolean;
  /** Estimated time remaining for processing in seconds */
  processingEta?: number | null;
  /** Error message from scan processing */
  scanError?: string | null;
  /** v9.7.0: Skip showing ScanCompleteModal (e.g., when coming from QuickSaveCard edit) */
  skipScanCompleteModal?: boolean;

  // Images
  /** Receipt image thumbnail URL (after successful scan or existing transaction) */
  thumbnailUrl?: string;
  /** Pending image URL (selected but not yet processed) */
  pendingImageUrl?: string;

  // Callbacks
  /** Callback when transaction data changes (parent-managed state) */
  onUpdateTransaction: (transaction: Transaction) => void;
  /** Callback when user saves the transaction */
  onSave: (transaction: Transaction) => Promise<void>;
  /** Callback when user clicks back/cancel */
  onCancel: () => void;
  /** Callback when user selects a photo */
  onPhotoSelect: (file: File) => void;
  /** Callback when user clicks process/scan button */
  onProcessScan: () => void;
  /** Callback to retry after error */
  onRetry: () => void;
  /** Callback for re-scan (existing transactions only) */
  onRescan?: () => Promise<void>;
  /** Whether re-scan is in progress */
  isRescanning?: boolean;
  /** Callback when user deletes transaction (existing only) */
  onDelete?: (id: string) => void;

  // Learning callbacks
  /** Save category mapping function */
  onSaveMapping?: (item: string, category: StoreCategory, source?: 'user' | 'ai') => Promise<string>;
  /** Save merchant mapping function - v9.6.1: Now accepts optional storeCategory */
  onSaveMerchantMapping?: (originalMerchant: string, targetMerchant: string, storeCategory?: StoreCategory) => Promise<string>;
  /** Save subcategory mapping function */
  onSaveSubcategoryMapping?: (item: string, subcategory: string, source?: 'user' | 'ai') => Promise<string>;
  /** v9.7.0: Save item name mapping function (per-store item name learning) */
  onSaveItemNameMapping?: (normalizedMerchant: string, originalItemName: string, targetItemName: string, targetCategory?: ItemCategory) => Promise<string>;
  /**
   * @deprecated Story 14e-25d: View uses showToast() from useToast() directly.
   * This prop is no longer needed.
   */
  onShowToast?: (text: string) => void;

  // UI
  /** Theme for styling */
  theme: 'light' | 'dark';
  /** Translation function */
  t: (key: string) => string;
  /** Currency format function */
  formatCurrency: (amount: number, currency: string) => string;
  /** Default currency code from settings */
  currency: string;
  /** Language for translations */
  lang: Language;
  /** User's credit balance */
  credits: UserCredits;
  /** Store categories for dropdown */
  storeCategories: string[];
  /** Distinct aliases for autocomplete */
  distinctAliases?: string[];

  // Context
  /** Batch context for editing from batch review queue */
  batchContext?: { index: number; total: number } | null;
  /** Callback to navigate to previous receipt in batch */
  onBatchPrevious?: () => void;
  /** Callback to navigate to next receipt in batch */
  onBatchNext?: () => void;
  /** Default city from settings */
  defaultCity?: string;
  /** Default country from settings */
  defaultCountry?: string;

  // Optional UI callbacks
  /**
   * @deprecated Story 14e-25d: View uses openModal() from useModalActions() directly.
   * This prop is no longer needed.
   */
  onCreditInfoClick?: () => void;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Animate items on initial load */
  animateItems?: boolean;
  /** Whether a credit was already used for this scan */
  creditUsed?: boolean;

  // Phase 4: Cross-Store Suggestions
  /** All item name mappings for cross-store suggestions */
  itemNameMappings?: ItemNameMapping[];

  // Batch mode
  /** Callback when user clicks batch scan button */
  onBatchModeClick?: () => void;

  /** Available shared groups for selection */
  availableGroups?: GroupWithMeta[];
  /** Whether groups are loading */
  groupsLoading?: boolean;
  /** Callback when sharedGroupIds changes */
  onGroupsChange?: (groupIds: string[]) => void;
}

// Note: Item categories are used via CategoryCombobox component which handles the full list internally

/**
 * TransactionEditorView - Unified transaction editor component
 */
export const TransactionEditorView: React.FC<TransactionEditorViewProps> = ({
  transaction,
  mode,
  // Story 14.24: Read-only mode for viewing transactions from History
  readOnly = false,
  onRequestEdit,
  isOtherUserTransaction = false,
  ownerProfile,
  ownerId: _ownerId, // Reserved for future ProfileIndicator in header
  scanButtonState,
  isProcessing,
  processingEta,
  scanError: _scanError, // Used for error state detection in thumbnail area
  skipScanCompleteModal = false, // v9.7.0: Skip modal when coming from QuickSaveCard
  thumbnailUrl,
  pendingImageUrl,
  onUpdateTransaction,
  onSave,
  onCancel,
  onPhotoSelect,
  onProcessScan,
  onRetry,
  onRescan,
  isRescanning = false,
  onDelete,
  onSaveMapping,
  onSaveMerchantMapping,
  onSaveSubcategoryMapping,
  onSaveItemNameMapping,
  // Story 14e-25d: onShowToast now unused - view uses showToast() directly
  onShowToast: _deprecatedOnShowToast,
  theme,
  t,
  formatCurrency,
  currency,
  lang,
  credits,
  storeCategories,
  distinctAliases = [],
  batchContext = null,
  onBatchPrevious,
  onBatchNext,
  defaultCity = '',
  defaultCountry = '',
  // Story 14e-25d: onCreditInfoClick now unused - view uses openModal() directly
  onCreditInfoClick: _deprecatedOnCreditInfoClick,
  isSaving = false,
  animateItems = false,
  creditUsed = false,
  // Phase 4: Cross-Store Suggestions
  itemNameMappings = [],
  // Batch mode
  onBatchModeClick,
  availableGroups = [],
  groupsLoading = false,
  onGroupsChange,
}) => {
  const isDark = theme === 'dark';
  const prefersReducedMotion = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Story 14e-11: Use Zustand selector (always available, no provider boundary)
  const scanStoreIsProcessing = useScanIsProcessing();

  // Story 14e-25d: Direct hooks (ViewHandlersContext deleted)
  const { showToast } = useToast();
  // Story 14e-5/14e-25d: Modal Manager for learning dialogs, item name suggestion, and credit info
  const { openModal, closeModal } = useModalActions();
  const openCreditInfoModal = () => openModal('creditInfo', {
    normalCredits: credits.remaining,
    superCredits: credits.superRemaining ?? 0,
    onClose: closeModal,
  });

  // Story 14d.4b: Derive scan state from store or fall back to props
  // Zustand store takes precedence when scan is active - this allows gradual migration
  // Note: These "effective" variables merge store state with props for backward compatibility
  const effectiveIsProcessing = scanStoreIsProcessing || isProcessing;
  // Story 14d.4c: effectiveScanError removed - error display uses scanButtonState derived from phase

  // Use transaction's currency if available, otherwise fall back to user's default currency
  // This ensures GBP receipts display in £ even if user's default is CLP
  const displayCurrency = transaction?.currency || currency;

  // UI state
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showRescanConfirm, setShowRescanConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  // Story 14.24: Track which item's category overlay is open (null = none, number = item index)
  const [showItemCategoryOverlay, setShowItemCategoryOverlay] = useState<number | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  // Story 14.38: Item view mode toggle (grouped vs original order)
  const [itemViewMode, setItemViewMode] = useState<ItemViewMode>('grouped');
  const [showGroupSelector, setShowGroupSelector] = useState(false);

  // ScanCompleteModal state (for new transactions only)
  const [showScanCompleteModal, setShowScanCompleteModal] = useState(false);

  // Story 14.13 Session 6: Swipe gesture state for multi-transaction navigation
  const [swipeTouchStart, setSwipeTouchStart] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  // Track transaction ID to detect changes and trigger fade-in animation
  const [fadeInKey, setFadeInKey] = useState(0);
  const prevTransactionIdRef = useRef<string | undefined>(transaction?.id);

  // Learning prompt states
  const [showLearningPrompt, setShowLearningPrompt] = useState(false);
  const [itemsToLearn, setItemsToLearn] = useState<Array<{ itemName: string; newGroup: string }>>([]);
  const [showSubcategoryLearningPrompt, setShowSubcategoryLearningPrompt] = useState(false);
  const [subcategoriesToLearn, setSubcategoriesToLearn] = useState<Array<{ itemName: string; newSubcategory: string }>>([]);
  const [showMerchantLearningPrompt, setShowMerchantLearningPrompt] = useState(false);
  // Story 14e-5: savingMappings state kept for internal tracking; value not read since
  // modals now close immediately (Modal Manager pattern) instead of showing loading state
  const [_savingMappings, setSavingMappings] = useState(false);

  // Story 14e-5: Refs to track previous state for modal open detection
  const prevShowLearningPromptRef = useRef(false);
  const prevShowSubcategoryPromptRef = useRef(false);
  const prevShowMerchantPromptRef = useRef(false);
  const prevActiveSuggestionRef = useRef<typeof activeSuggestion>(null);

  // Story 14e-5: Handler refs to always use latest handlers in useEffect callbacks
  const handleLearnConfirmRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const handleLearnDismissRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const handleSubcategoryConfirmRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const handleSubcategoryDismissRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const handleMerchantConfirmRef = useRef<(selection: LearnMerchantSelection) => Promise<void>>(() => Promise.resolve());
  const handleMerchantDismissRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const handleApplySuggestionRef = useRef<() => void>(() => {});
  const handleDismissSuggestionRef = useRef<() => void>(() => {});

  // Phase 4: Cross-Store Suggestions state
  // Track which items have cross-store suggestions (item index -> suggestion data)
  const [itemSuggestions, setItemSuggestions] = useState<Map<number, {
    suggestedName: string;
    fromMerchant: string;
    fromNormalizedMerchant: string;
  }>>(new Map());
  // State for showing suggestion dialog
  const [activeSuggestion, setActiveSuggestion] = useState<{
    itemIndex: number;
    originalName: string;
    suggestedName: string;
    fromMerchant: string;
    fromNormalizedMerchant: string;
  } | null>(null);

  // Item edit modal state (inline editing uses editingItemIndex, modal editing uses editingItem)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  // Future: Modal-based item editing (currently using inline editing)
  const [_editingItem, _setEditingItem] = useState<{ index: number; item: TransactionItem } | null>(null);
  const [_newItemName, _setNewItemName] = useState('');
  const [_newItemPrice, _setNewItemPrice] = useState('');
  const [_newItemCategory, _setNewItemCategory] = useState<ItemCategory>('Other');
  const [_newItemSubcategory, _setNewItemSubcategory] = useState('');

  // Track original values for learning prompts
  const originalAliasRef = useRef<string | null>(null);
  // v9.6.1: Track original store category for learning
  const originalStoreCategoryRef = useRef<StoreCategory | null>(null);
  const originalItemGroupsRef = useRef<{
    items: Array<{ name: string; category: string; subcategory: string }>;
    capturedForTransactionKey: string | null;
  }>({
    items: [],
    capturedForTransactionKey: null,
  });
  const initialTransactionRef = useRef<Transaction | null>(null);

  // Determine credit availability
  const hasCredits = (credits?.remaining ?? 0) > 0 || (credits?.superRemaining ?? 0) > 0;

  // Story 14e-11: Check if QUICKSAVE dialog is active (should use QuickSaveCard, not ScanCompleteModal)
  const scanActiveDialog = useScanActiveDialog();
  const isQuickSaveDialogActive = scanActiveDialog?.type === DIALOG_TYPES.QUICKSAVE;

  // Track previous scanButtonState to only show modal on TRANSITION to 'complete'
  // Story 14.24: Prevent ScanCompleteModal from showing when entering editor with
  // scanButtonState already at 'complete' (e.g., from QuickSaveCard edit)
  const prevScanButtonStateRef = useRef<ScanButtonState>(scanButtonState);

  // Show ScanCompleteModal when scan TRANSITIONS to complete for NEW transactions
  // Only trigger when state changes FROM non-complete TO complete, not on mount
  useEffect(() => {
    const prevState = prevScanButtonStateRef.current;
    prevScanButtonStateRef.current = scanButtonState;

    // Only show modal if we transitioned from a non-complete state to complete
    // This prevents the modal from appearing when mounting with state already at 'complete'
    // (e.g., when navigating from QuickSaveCard's "Edit" button)
    // v9.7.0: Also skip if skipScanCompleteModal is true (coming from QuickSaveCard edit)
    // Story 14e-11: Skip if QUICKSAVE dialog is active (QuickSaveCard will show instead)
    if (
      mode === 'new' &&
      scanButtonState === 'complete' &&
      prevState !== 'complete' &&
      transaction &&
      !isQuickSaveDialogActive &&
      !skipScanCompleteModal
    ) {
      setShowScanCompleteModal(true);
    }
  }, [mode, scanButtonState, transaction, skipScanCompleteModal, isQuickSaveDialogActive]);

  // Capture original item groups on mount
  useEffect(() => {
    if (!transaction) return;
    const hasData = transaction.merchant || transaction.items.length > 0;
    const transactionKey = transaction.id || 'new';
    const alreadyCaptured = originalItemGroupsRef.current.capturedForTransactionKey === transactionKey;

    if (hasData && !alreadyCaptured) {
      originalItemGroupsRef.current = {
        items: transaction.items.map(item => ({
          name: item.name,
          category: item.category || '',
          subcategory: item.subcategory || ''
        })),
        capturedForTransactionKey: transactionKey,
      };
    }
  }, [transaction?.id, transaction?.items]);

  // Capture original alias on mount
  useEffect(() => {
    if (!transaction) return;
    const hasData = transaction.merchant || transaction.alias;
    if (hasData && originalAliasRef.current === null) {
      originalAliasRef.current = transaction.alias || '';
    }
  }, [transaction?.merchant, transaction?.alias]);

  // v9.6.1: Capture original store category on mount
  useEffect(() => {
    if (!transaction) return;
    const hasData = transaction.merchant || transaction.category;
    if (hasData && originalStoreCategoryRef.current === null) {
      originalStoreCategoryRef.current = (transaction.category as StoreCategory) || null;
    }
  }, [transaction?.merchant, transaction?.category]);

  // Capture initial transaction state for cancel confirmation
  useEffect(() => {
    if (!transaction) return;
    const transactionKey = transaction.id || 'new';
    if (!initialTransactionRef.current ||
        (initialTransactionRef.current.id || 'new') !== transactionKey) {
      initialTransactionRef.current = JSON.parse(JSON.stringify(transaction));
    }
  }, [transaction?.id]);

  // Story 14.13 Session 6: Detect transaction change and trigger fade-in animation
  useEffect(() => {
    if (transaction?.id !== prevTransactionIdRef.current) {
      prevTransactionIdRef.current = transaction?.id;
      // Increment key to trigger CSS animation
      setFadeInKey(prev => prev + 1);
    }
  }, [transaction?.id]);

  // Check for unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!initialTransactionRef.current || !transaction) return false;
    const initial = initialTransactionRef.current;
    return (
      initial.merchant !== transaction.merchant ||
      initial.alias !== transaction.alias ||
      initial.total !== transaction.total ||
      initial.date !== transaction.date ||
      initial.time !== transaction.time ||
      initial.category !== transaction.category ||
      initial.country !== transaction.country ||
      initial.city !== transaction.city ||
      JSON.stringify(initial.items) !== JSON.stringify(transaction.items)
    );
  }, [transaction]);

  // Calculate total from items
  // Story 14.24: price is the total for the line item, NOT unit price
  // qty is informational only (e.g., "6kg of tomatoes for $9000")
  const calculatedTotal = useMemo(() => {
    if (!transaction?.items) return 0;
    return transaction.items.reduce((sum, item) => sum + item.price, 0);
  }, [transaction?.items]);

  // Group items by category
  const itemsByGroup = useMemo(() => {
    if (!transaction?.items) return [];

    const groups: Record<string, Array<{ item: TransactionItem; originalIndex: number }>> = {};

    transaction.items.forEach((item, index) => {
      const normalizedCategory = normalizeItemCategory(item.category || 'Other');
      const groupKey = getItemCategoryGroup(normalizedCategory);

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push({ item, originalIndex: index });
    });

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([groupKey, items]) => ({
        groupKey,
        items: items.sort((a, b) => b.item.price - a.item.price),
        total: items.reduce((sum, { item }) => sum + item.price, 0),
      }));
  }, [transaction?.items]);

  /**
   * Phase 4: Cross-Store Suggestion Detection
   *
   * For each item in the transaction, check if there's a learned name at another store.
   * Only show suggestions if:
   * 1. The item doesn't already have a learned name at the current merchant
   * 2. Another merchant has a mapping with the same normalized item name
   */
  const findCrossStoreSuggestion = useCallback((
    itemName: string,
    currentNormalizedMerchant: string
  ): { suggestedName: string; fromMerchant: string; fromNormalizedMerchant: string } | null => {
    if (!itemName || !currentNormalizedMerchant || itemNameMappings.length === 0) {
      return null;
    }

    const normalizedItem = normalizeItemName(itemName);

    // Skip very short item names to avoid false matches
    if (normalizedItem.length < 3) {
      return null;
    }

    // First, check if current merchant already has a mapping for this item
    const hasCurrentMerchantMapping = itemNameMappings.some(
      m => m.normalizedMerchant === currentNormalizedMerchant &&
           m.normalizedItemName === normalizedItem
    );

    // If current merchant already has a mapping, no suggestion needed
    if (hasCurrentMerchantMapping) {
      return null;
    }

    // Find mappings from OTHER merchants that match this item name
    // Prioritize by usage count (most used mapping first)
    const crossStoreMappings = itemNameMappings
      .filter(m =>
        m.normalizedMerchant !== currentNormalizedMerchant &&
        m.normalizedItemName === normalizedItem
      )
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

    if (crossStoreMappings.length === 0) {
      return null;
    }

    const bestMatch = crossStoreMappings[0];
    return {
      suggestedName: bestMatch.targetItemName,
      fromMerchant: bestMatch.normalizedMerchant, // Display the merchant alias/name
      fromNormalizedMerchant: bestMatch.normalizedMerchant,
    };
  }, [itemNameMappings]);

  // Compute cross-store suggestions for all items when transaction or mappings change
  useEffect(() => {
    if (!transaction?.merchant || !transaction?.items || itemNameMappings.length === 0) {
      // Clear suggestions if no transaction or mappings
      if (itemSuggestions.size > 0) {
        setItemSuggestions(new Map());
      }
      return;
    }

    const currentNormalizedMerchant = normalizeMerchantName(transaction.merchant);
    const newSuggestions = new Map<number, {
      suggestedName: string;
      fromMerchant: string;
      fromNormalizedMerchant: string;
    }>();

    transaction.items.forEach((item, index) => {
      if (!item.name) return;

      const suggestion = findCrossStoreSuggestion(item.name, currentNormalizedMerchant);
      if (suggestion) {
        newSuggestions.set(index, suggestion);
      }
    });

    // Only update state if suggestions actually changed
    const currentKeys = Array.from(itemSuggestions.keys()).sort().join(',');
    const newKeys = Array.from(newSuggestions.keys()).sort().join(',');
    if (currentKeys !== newKeys) {
      setItemSuggestions(newSuggestions);
    }
  }, [transaction?.merchant, transaction?.items, itemNameMappings, findCrossStoreSuggestion, itemSuggestions]);

  // Handle applying a cross-store suggestion
  // Story 14e-5: Now uses Modal Manager
  const handleApplySuggestion = useCallback(() => {
    closeModal(); // Story 14e-5: Close modal via Modal Manager
    if (!activeSuggestion || !transaction) return;

    const { itemIndex, suggestedName } = activeSuggestion;

    // Update the item name in the transaction
    const newItems = [...transaction.items];
    if (newItems[itemIndex]) {
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        name: suggestedName,
      };
      onUpdateTransaction({ ...transaction, items: newItems });
    }

    // Remove suggestion for this item (since name is now updated)
    setItemSuggestions(prev => {
      const next = new Map(prev);
      next.delete(itemIndex);
      return next;
    });

    // Optionally save a new mapping for the current merchant
    // This makes the suggestion permanent at this store too
    if (onSaveItemNameMapping && transaction.merchant) {
      const currentNormalizedMerchant = normalizeMerchantName(transaction.merchant);
      const originalItemName = activeSuggestion.originalName;
      const targetCategory = newItems[itemIndex]?.category as ItemCategory | undefined;

      // Fire-and-forget: save mapping in background
      onSaveItemNameMapping(
        currentNormalizedMerchant,
        originalItemName,
        suggestedName,
        targetCategory
      ).catch(err => console.error('Failed to save cross-store suggestion mapping:', err));
    }

    // Close the dialog (state tracking)
    setActiveSuggestion(null);

    // Show toast feedback
    // Story 14e-25d: Now uses useToast() directly (ViewHandlersContext deleted)
    showToast(t('suggestionApplied') || 'Name updated from suggestion', 'success');
  }, [closeModal, activeSuggestion, transaction, onUpdateTransaction, onSaveItemNameMapping, showToast, t]);

  // Handle clicking the suggestion indicator
  const handleShowSuggestion = useCallback((itemIndex: number, item: TransactionItem) => {
    const suggestion = itemSuggestions.get(itemIndex);
    if (!suggestion) return;

    setActiveSuggestion({
      itemIndex,
      originalName: item.name,
      suggestedName: suggestion.suggestedName,
      fromMerchant: suggestion.fromMerchant,
      fromNormalizedMerchant: suggestion.fromNormalizedMerchant,
    });
  }, [itemSuggestions]);

  // Animation handling
  const animationPlayedRef = useRef(false);
  const shouldAnimate = animateItems && !animationPlayedRef.current;
  const { visibleItems: animatedItems, isComplete: animationComplete } = useStaggeredReveal(
    shouldAnimate && transaction?.items ? transaction.items : [],
    { staggerMs: 100, initialDelayMs: 300, maxDurationMs: 2500 }
  );

  useEffect(() => {
    if (animationComplete && shouldAnimate) {
      animationPlayedRef.current = true;
    }
  }, [animationComplete, shouldAnimate]);

  // Determine if we should warn on cancel
  // Story 14.24: Only warn if there are actual unsaved changes
  // - creditUsed: A credit was used in this session (re-scan)
  // - hasUnsavedChanges: User made changes to transaction fields
  // - thumbnailUrl for new transactions: Photo selected but not saved
  // Note: For existing transactions, thumbnailUrl is already saved so it doesn't indicate unsaved work
  // Story 14.13 Session 6: Never warn in read-only mode (just viewing, no edits possible)
  const hasNewThumbnail = mode === 'new' && !!thumbnailUrl;
  const shouldWarnOnCancel = !readOnly && (creditUsed || hasUnsavedChanges || hasNewThumbnail);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoSelect(file);
    }
    e.target.value = '';
  };

  // Open file picker
  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Handle cancel click
  const handleCancelClick = useCallback(() => {
    if (shouldWarnOnCancel) {
      setShowCancelConfirm(true);
    } else {
      onCancel();
    }
  }, [shouldWarnOnCancel, onCancel]);

  // Story 14.13 Session 6: Swipe gesture handlers for multi-transaction navigation
  // Only enable when batchContext is present (navigating through multiple transactions)
  const canSwipePrevious = batchContext && batchContext.index > 1 && onBatchPrevious;
  const canSwipeNext = batchContext && batchContext.index < batchContext.total && onBatchNext;
  const canSwipe = canSwipePrevious || canSwipeNext;
  const minSwipeDistance = 50;

  const handleSwipeTouchStart = useCallback((e: React.TouchEvent) => {
    if (!canSwipe) return;
    setSwipeTouchStart(e.targetTouches[0].clientX);
    setSwipeOffset(0);
  }, [canSwipe]);

  const handleSwipeTouchMove = useCallback((e: React.TouchEvent) => {
    if (!canSwipe || swipeTouchStart === null) return;
    const currentX = e.targetTouches[0].clientX;
    let offset = currentX - swipeTouchStart;

    // Apply resistance at boundaries (20% movement when can't swipe that direction)
    if (offset > 0 && !canSwipePrevious) {
      offset = offset * 0.2;
    } else if (offset < 0 && !canSwipeNext) {
      offset = offset * 0.2;
    }

    setSwipeOffset(offset);
  }, [canSwipe, swipeTouchStart, canSwipePrevious, canSwipeNext]);

  const handleSwipeTouchEnd = useCallback(() => {
    if (!canSwipe || swipeTouchStart === null) {
      setSwipeTouchStart(null);
      setSwipeOffset(0);
      return;
    }

    const distance = -swipeOffset; // Negative offset = left swipe = next

    if (distance > minSwipeDistance && canSwipeNext && onBatchNext) {
      onBatchNext();
    } else if (distance < -minSwipeDistance && canSwipePrevious && onBatchPrevious) {
      onBatchPrevious();
    }

    // Reset touch state
    setSwipeTouchStart(null);
    setSwipeOffset(0);
  }, [canSwipe, swipeTouchStart, swipeOffset, canSwipeNext, canSwipePrevious, onBatchNext, onBatchPrevious]);

  // Toggle group collapse
  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  // Item operations
  const handleAddItem = () => {
    if (!transaction) return;
    const newItem: TransactionItem = { name: '', price: 0, category: 'Other', subcategory: '' };
    onUpdateTransaction({
      ...transaction,
      items: [...transaction.items, newItem]
    });
    setEditingItemIndex(transaction.items.length);
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    if (!transaction) return;
    const newItems = [...transaction.items];
    newItems[index] = { ...newItems[index], [field]: value };
    onUpdateTransaction({ ...transaction, items: newItems });
  };

  const handleDeleteItem = (index: number) => {
    if (!transaction) return;
    const newItems = transaction.items.filter((_, x) => x !== index);
    onUpdateTransaction({ ...transaction, items: newItems });
    setEditingItemIndex(null);
  };

  // Note: Modal-based item editing functions (handleEditItem, handleSaveItem) were removed
  // since we now use inline editing directly in the item list. The unused state variables
  // (_editingItem, _newItemName, etc.) are kept for future modal implementation if needed.

  // Learning prompt helpers
  const findAllChangedItemGroups = (): Array<{ itemName: string; newGroup: string }> => {
    if (!transaction) return [];
    const originalItems = originalItemGroupsRef.current.items;
    const changedItems: Array<{ itemName: string; newGroup: string }> = [];

    for (let i = 0; i < transaction.items.length; i++) {
      const currentItem = transaction.items[i];
      const originalItem = originalItems[i];
      if (!originalItem || !currentItem.name) continue;

      const currentGroup = currentItem.category || '';
      const originalGroup = originalItem.category || '';

      if (currentGroup && currentGroup !== originalGroup) {
        changedItems.push({ itemName: currentItem.name, newGroup: currentGroup });
      }
    }
    return changedItems;
  };

  const findAllChangedSubcategories = (): Array<{ itemName: string; newSubcategory: string }> => {
    if (!transaction) return [];
    const originalItems = originalItemGroupsRef.current.items;
    const changedItems: Array<{ itemName: string; newSubcategory: string }> = [];

    for (let i = 0; i < transaction.items.length; i++) {
      const currentItem = transaction.items[i];
      const originalItem = originalItems[i];
      if (!originalItem || !currentItem.name) continue;

      const currentSubcategory = currentItem.subcategory || '';
      const originalSubcategory = originalItem.subcategory || '';

      if (currentSubcategory && currentSubcategory !== originalSubcategory) {
        changedItems.push({ itemName: currentItem.name, newSubcategory: currentSubcategory });
      }
    }
    return changedItems;
  };

  const hasMerchantAliasChanged = (): boolean => {
    if (!transaction?.merchant) return false;
    const currentAlias = transaction.alias || '';
    const originalAlias = originalAliasRef.current || '';
    return currentAlias !== originalAlias && currentAlias.length > 0;
  };

  // v9.6.1: Check if store category changed
  const hasStoreCategoryChanged = (): boolean => {
    if (!transaction?.merchant) return false;
    const currentCategory = transaction.category as StoreCategory;
    const originalCategory = originalStoreCategoryRef.current;
    return currentCategory !== originalCategory && !!currentCategory;
  };

  // v9.7.0: Find all item name changes (comparing original names to current names)
  const findAllChangedItemNames = (): ItemNameChange[] => {
    if (!transaction) return [];
    const originalItems = originalItemGroupsRef.current.items;
    const changedItems: ItemNameChange[] = [];

    for (let i = 0; i < transaction.items.length; i++) {
      const currentItem = transaction.items[i];
      const originalItem = originalItems[i];
      // Skip if no original item or current item name is empty
      if (!originalItem || !currentItem.name) continue;

      const currentName = currentItem.name.trim();
      const originalName = originalItem.name.trim();

      // Check if name actually changed and both are non-empty
      if (currentName && originalName && currentName !== originalName) {
        changedItems.push({
          originalName,
          newName: currentName,
          category: currentItem.category as ItemCategory | undefined,
        });
      }
    }
    return changedItems;
  };

  // v9.7.0: Check if any item names have changed
  const hasItemNameChanges = (): boolean => {
    return findAllChangedItemNames().length > 0;
  };

  // v9.6.1: Check if any merchant-level learning should happen (alias OR category OR item names)
  const hasMerchantLearningChanges = (): boolean => {
    return hasMerchantAliasChanged() || hasStoreCategoryChanged() || hasItemNameChanges();
  };

  // Learning prompt chain
  // v9.6.1: Updated to check for both alias and category changes
  const proceedToMerchantLearningOrSave = async () => {
    if (hasMerchantLearningChanges() && onSaveMerchantMapping) {
      setShowMerchantLearningPrompt(true);
    } else {
      await handleFinalSave();
    }
  };

  const proceedToSubcategoryLearningOrNext = async () => {
    const changedSubcategories = findAllChangedSubcategories();
    if (changedSubcategories.length > 0 && onSaveSubcategoryMapping) {
      setSubcategoriesToLearn(changedSubcategories);
      setShowSubcategoryLearningPrompt(true);
    } else {
      await proceedToMerchantLearningOrSave();
    }
  };

  const handleSaveWithLearning = async () => {
    const changedItems = findAllChangedItemGroups();

    if (changedItems.length > 0 && onSaveMapping) {
      setItemsToLearn(changedItems);
      setShowLearningPrompt(true);
    } else {
      await proceedToSubcategoryLearningOrNext();
    }
  };

  const handleFinalSave = async () => {
    if (!transaction) return;

    // Sanitize inputs before saving
    const sanitizedTransaction: Transaction = {
      ...transaction,
      merchant: sanitizeMerchantName(transaction.merchant) || t('unknown') || 'Desconocido',
      alias: sanitizeMerchantName(transaction.alias || ''),
      city: sanitizeLocation(transaction.city || ''),
      country: sanitizeLocation(transaction.country || ''),
      total: calculatedTotal,
      items: transaction.items.map(item => ({
        ...item,
        name: sanitizeItemName(item.name),
        subcategory: item.subcategory ? sanitizeSubcategory(item.subcategory) : undefined,
      })),
    };

    await onSave(sanitizedTransaction);
  };

  // Learning prompt handlers
  // Story 14e-5: Now uses Modal Manager - closeModal() closes the modal, state update is for tracking
  const handleLearnConfirm = async () => {
    closeModal(); // Story 14e-5: Close modal via Modal Manager
    if (onSaveMapping && itemsToLearn.length > 0) {
      setSavingMappings(true);
      try {
        for (const item of itemsToLearn) {
          await onSaveMapping(item.itemName, item.newGroup as StoreCategory, 'user');
        }
        // Story 14e-25d: Now uses useToast() directly (ViewHandlersContext deleted)
        showToast(t('learnCategorySuccess'), 'success');
      } catch (error) {
        console.error('Failed to save category mappings:', error);
      } finally {
        setSavingMappings(false);
      }
    }
    setShowLearningPrompt(false);
    setItemsToLearn([]);
    await proceedToSubcategoryLearningOrNext();
  };

  const handleLearnDismiss = async () => {
    closeModal(); // Story 14e-5: Close modal via Modal Manager
    setShowLearningPrompt(false);
    setItemsToLearn([]);
    await proceedToSubcategoryLearningOrNext();
  };

  // Story 14e-5: Now uses Modal Manager - closeModal() closes the modal, state update is for tracking
  const handleSubcategoryLearnConfirm = async () => {
    closeModal(); // Story 14e-5: Close modal via Modal Manager
    if (onSaveSubcategoryMapping && subcategoriesToLearn.length > 0) {
      setSavingMappings(true);
      try {
        for (const item of subcategoriesToLearn) {
          await onSaveSubcategoryMapping(item.itemName, item.newSubcategory, 'user');
        }
        // Story 14e-25d: Now uses useToast() directly (ViewHandlersContext deleted)
        showToast(t('learnSubcategorySuccess'), 'success');
      } catch (error) {
        console.error('Failed to save subcategory mappings:', error);
      } finally {
        setSavingMappings(false);
      }
    }
    setShowSubcategoryLearningPrompt(false);
    setSubcategoriesToLearn([]);
    await proceedToMerchantLearningOrSave();
  };

  const handleSubcategoryLearnDismiss = async () => {
    closeModal(); // Story 14e-5: Close modal via Modal Manager
    setShowSubcategoryLearningPrompt(false);
    setSubcategoriesToLearn([]);
    await proceedToMerchantLearningOrSave();
  };

  // v9.6.1: Updated to accept selection - user can choose which items to learn
  // v9.7.0: Now also handles item name mappings
  // Story 14e-5: Now uses Modal Manager - closeModal() closes the modal, state update is for tracking
  const handleLearnMerchantConfirm = async (selection: LearnMerchantSelection) => {
    closeModal(); // Story 14e-5: Close modal via Modal Manager
    if (transaction?.merchant) {
      // Only save if user selected at least one item to learn
      const shouldLearnAlias = selection.learnAlias && hasMerchantAliasChanged();
      const shouldLearnCategory = selection.learnCategory && hasStoreCategoryChanged();
      const hasItemsToLearn = selection.itemNamesToLearn && selection.itemNamesToLearn.length > 0;

      // Save merchant mapping (alias and/or category)
      if (onSaveMerchantMapping && (shouldLearnAlias || shouldLearnCategory)) {
        try {
          // Pass alias only if learning it, otherwise use empty string (won't overwrite existing)
          const aliasToSave = shouldLearnAlias ? (transaction.alias || '') : '';
          // Pass category only if learning it
          const categoryToSave = shouldLearnCategory
            ? (transaction.category as StoreCategory)
            : undefined;

          await onSaveMerchantMapping(transaction.merchant, aliasToSave, categoryToSave);
        } catch (error) {
          console.error('Failed to save merchant mapping:', error);
        }
      }

      // v9.7.0: Save item name mappings
      if (onSaveItemNameMapping && hasItemsToLearn) {
        const normalizedMerchant = normalizeMerchantName(transaction.merchant);
        try {
          for (const itemChange of selection.itemNamesToLearn) {
            await onSaveItemNameMapping(
              normalizedMerchant,
              itemChange.originalName,
              itemChange.newName,
              itemChange.category
            );
          }
        } catch (error) {
          console.error('Failed to save item name mappings:', error);
        }
      }

      // Show success feedback if anything was saved
      if (shouldLearnAlias || shouldLearnCategory || hasItemsToLearn) {
        celebrateSuccess();
        // Story 14e-25d: Now uses useToast() directly (ViewHandlersContext deleted)
        showToast(t('learnMerchantSuccess'), 'success');
      }
    }
    setShowMerchantLearningPrompt(false);
    await handleFinalSave();
  };

  const handleLearnMerchantDismiss = async () => {
    closeModal(); // Story 14e-5: Close modal via Modal Manager
    setShowMerchantLearningPrompt(false);
    await handleFinalSave();
  };

  // Story 14e-5: Dismiss handler for ItemNameSuggestion
  const handleDismissSuggestion = useCallback(() => {
    closeModal();
    setActiveSuggestion(null);
  }, [closeModal]);

  // Story 14e-5: Update handler refs so useEffect always calls latest version
  handleLearnConfirmRef.current = handleLearnConfirm;
  handleLearnDismissRef.current = handleLearnDismiss;
  handleSubcategoryConfirmRef.current = handleSubcategoryLearnConfirm;
  handleSubcategoryDismissRef.current = handleSubcategoryLearnDismiss;
  handleMerchantConfirmRef.current = handleLearnMerchantConfirm;
  handleMerchantDismissRef.current = handleLearnMerchantDismiss;
  handleApplySuggestionRef.current = handleApplySuggestion;
  handleDismissSuggestionRef.current = handleDismissSuggestion;

  // Story 14e-5: Open CategoryLearning modal when showLearningPrompt becomes true
  useEffect(() => {
    const wasOpen = prevShowLearningPromptRef.current;
    prevShowLearningPromptRef.current = showLearningPrompt;

    // Only open on transition from false to true
    if (!wasOpen && showLearningPrompt && itemsToLearn.length > 0) {
      openModal('categoryLearning', {
        items: itemsToLearn,
        onConfirm: () => handleLearnConfirmRef.current(),
        onClose: () => handleLearnDismissRef.current(),
        t,
        theme,
      });
    }
  }, [showLearningPrompt, itemsToLearn, openModal, t, theme]);

  // Story 14e-5: Open SubcategoryLearning modal when showSubcategoryLearningPrompt becomes true
  useEffect(() => {
    const wasOpen = prevShowSubcategoryPromptRef.current;
    prevShowSubcategoryPromptRef.current = showSubcategoryLearningPrompt;

    // Only open on transition from false to true
    if (!wasOpen && showSubcategoryLearningPrompt && subcategoriesToLearn.length > 0) {
      openModal('subcategoryLearning', {
        items: subcategoriesToLearn,
        onConfirm: () => handleSubcategoryConfirmRef.current(),
        onClose: () => handleSubcategoryDismissRef.current(),
        t,
        theme,
      });
    }
  }, [showSubcategoryLearningPrompt, subcategoriesToLearn, openModal, t, theme]);

  // Story 14e-5: LearnMerchant useEffect is placed after displayTransaction declaration below

  // Story 14e-5: Open ItemNameSuggestion modal when activeSuggestion becomes non-null
  useEffect(() => {
    const wasOpen = prevActiveSuggestionRef.current !== null;
    prevActiveSuggestionRef.current = activeSuggestion;

    // Only open on transition from null to non-null
    if (!wasOpen && activeSuggestion !== null) {
      openModal('itemNameSuggestion', {
        originalItemName: activeSuggestion.originalName,
        suggestedItemName: activeSuggestion.suggestedName,
        fromMerchant: activeSuggestion.fromMerchant,
        onApply: () => handleApplySuggestionRef.current(),
        onDismiss: () => handleDismissSuggestionRef.current(),
        t,
        theme,
      });
    }
  }, [activeSuggestion, openModal, t, theme]);

  // Re-scan handlers
  const handleRescanClick = () => {
    if (!hasCredits) {
      // Story 14e-25d: Now uses useToast() directly (ViewHandlersContext deleted)
      showToast(t('noCreditsMessage'), 'info');
      return;
    }
    setShowRescanConfirm(true);
  };

  const handleConfirmRescan = async () => {
    setShowRescanConfirm(false);
    await onRescan?.();
  };

  // ScanCompleteModal handlers
  const handleScanCompleteSave = async () => {
    setShowScanCompleteModal(false);
    await handleSaveWithLearning();
  };

  const handleScanCompleteEdit = () => {
    setShowScanCompleteModal(false);
    // User wants to edit - just close modal, form is already populated
  };

  // Determine what image to show in thumbnail area
  const displayImageUrl = thumbnailUrl || pendingImageUrl;
  const hasImages = !!displayImageUrl || (transaction?.imageUrls && transaction.imageUrls.length > 0);

  // Input styling
  const inputStyle: React.CSSProperties = {
    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
    borderColor: isDark ? '#475569' : '#e2e8f0',
    color: 'var(--primary)',
  };

  // Validation
  const hasValidTotal = calculatedTotal > 0;
  const hasValidItem = transaction?.items?.some(item => item.price > 0) ?? false;
  const canSave = hasValidTotal && hasValidItem;

  // Create default transaction for rendering if none provided
  const displayTransaction = transaction || {
    id: undefined,
    merchant: '',
    alias: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    total: 0,
    category: 'Other' as StoreCategory,
    items: [] as TransactionItem[],
    country: defaultCountry,
    city: defaultCity,
    currency: currency,
  };

  // Story 14e-5: Open LearnMerchant modal when showMerchantLearningPrompt becomes true
  // NOTE: This useEffect must be after displayTransaction is declared
  useEffect(() => {
    const wasOpen = prevShowMerchantPromptRef.current;
    prevShowMerchantPromptRef.current = showMerchantLearningPrompt;

    // Only open on transition from false to true
    if (!wasOpen && showMerchantLearningPrompt) {
      openModal('learnMerchant', {
        originalMerchant: displayTransaction.merchant,
        correctedMerchant: displayTransaction.alias || '',
        aliasChanged: hasMerchantAliasChanged(),
        categoryChanged: hasStoreCategoryChanged(),
        originalCategory: originalStoreCategoryRef.current
          ? translateStoreCategory(originalStoreCategoryRef.current, lang)
          : undefined,
        newCategory: displayTransaction.category
          ? translateStoreCategory(displayTransaction.category, lang)
          : undefined,
        itemNameChanges: findAllChangedItemNames(),
        onConfirm: (selection) => handleMerchantConfirmRef.current(selection),
        onClose: () => handleMerchantDismissRef.current(),
        t,
        theme,
      });
    }
  }, [
    showMerchantLearningPrompt,
    openModal,
    displayTransaction.merchant,
    displayTransaction.alias,
    displayTransaction.category,
    hasMerchantAliasChanged,
    hasStoreCategoryChanged,
    findAllChangedItemNames,
    lang,
    t,
    theme,
  ]);

  return (
    <div
      className="relative"
      style={{
        paddingBottom: 'calc(6rem + var(--safe-bottom, 0px))',
      }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* CSS Animations */}
      <style>
        {`
          @keyframes scan-breathe {
            0%, 100% { transform: scale(1); opacity: 0.9; }
            50% { transform: scale(1.03); opacity: 1; }
          }
          @keyframes scan-pulse-border {
            0%, 100% { border-color: var(--primary); opacity: 0.6; }
            50% { border-color: var(--primary); opacity: 1; }
          }
          @keyframes process-pulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
            50% { transform: scale(1.02); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
          }
          @keyframes processing-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes scan-icon-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes scan-shine-sweep {
            0% { left: -100%; opacity: 0.4; }
            50% { opacity: 0.8; }
            100% { left: 100%; opacity: 0.4; }
          }
          @keyframes transaction-fade-in {
            0% { opacity: 0; transform: translateX(0); }
            100% { opacity: 1; transform: translateX(0); }
          }
        `}
      </style>

      {/* Header */}
      <div
        className="sticky px-4"
        style={{
          top: 0,
          zIndex: 50,
          backgroundColor: 'var(--bg)',
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            height: '72px',
            paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
          }}
        >
          {/* Left side: Back button + Title */}
          <div className="flex items-center gap-0">
            <button
              onClick={handleCancelClick}
              className="min-w-10 min-h-10 flex items-center justify-center -ml-1"
              aria-label={t('back')}
              style={{ color: 'var(--text-primary)' }}
            >
              <ChevronLeft size={28} strokeWidth={2.5} />
            </button>
            <h1
              className="font-semibold"
              style={{
                fontFamily: 'var(--font-family)',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '20px',
              }}
            >
              {mode === 'new' ? (t('scanViewTitle') || 'Escanea') : t('myPurchase')}
            </h1>
          </div>

          {/* Right side: Credit badges + Close/Delete button */}
          <div className="flex items-center gap-2">
            {/* Credit badges */}
            {/* Story 14e-25d: Now uses useModalActions() directly (ViewHandlersContext deleted) */}
            {credits && (
              <button
                onClick={openCreditInfoModal}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full transition-all active:scale-95"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                }}
                aria-label={t('creditInfo')}
              >
                <div
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
                >
                  <Zap size={10} strokeWidth={2.5} />
                  <span>{formatCreditsDisplay(credits.superRemaining)}</span>
                </div>
                <div
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}
                >
                  <Camera size={10} strokeWidth={2.5} />
                  <span>{formatCreditsDisplay(credits.remaining)}</span>
                </div>
                <Info size={12} style={{ color: 'var(--text-tertiary)' }} />
              </button>
            )}
            {/* Close/Delete button */}
            <button
              onClick={
                mode === 'existing' && transaction?.id
                  ? () => setShowDeleteConfirm(true)
                  : handleCancelClick
              }
              className="min-w-10 min-h-10 flex items-center justify-center"
              aria-label={mode === 'existing' && transaction?.id ? t('delete') : t('cancel')}
              style={{
                color: mode === 'existing' && transaction?.id ? 'var(--negative-primary)' : 'var(--text-primary)',
              }}
            >
              {mode === 'existing' && transaction?.id ? (
                <Trash2 size={22} strokeWidth={2} />
              ) : (
                <X size={24} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Batch counter pill with navigation - shown between header and main content when editing from batch */}
      {batchContext && (
        <div className="px-4 pb-2 flex justify-center items-center gap-2">
          {/* Previous button */}
          <button
            onClick={onBatchPrevious}
            disabled={!onBatchPrevious || batchContext.index <= 1}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-secondary)',
            }}
            aria-label={t('previous')}
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>

          {/* Counter pill */}
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-light)',
            }}
          >
            <Receipt size={14} strokeWidth={2} />
            {batchContext.index} {t('batchOfMax')} {batchContext.total}
          </span>

          {/* Next button */}
          <button
            onClick={onBatchNext}
            disabled={!onBatchNext || batchContext.index >= batchContext.total}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-secondary)',
            }}
            aria-label={t('next')}
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Main content */}
      {/* Story 14.13 Session 6: Swipe gesture support for multi-transaction navigation */}
      {/* Crossfade effect: opacity decreases as swipe distance increases, fade-in on transaction change */}
      <div
        key={`transaction-content-${fadeInKey}`}
        className="px-3 pb-4 relative"
        onTouchStart={handleSwipeTouchStart}
        onTouchMove={handleSwipeTouchMove}
        onTouchEnd={handleSwipeTouchEnd}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          // Fade out as user swipes: full opacity at 0, fades to 0.3 at ±150px
          opacity: Math.max(0.3, 1 - Math.abs(swipeOffset) / 150),
          transition: swipeTouchStart === null ? 'transform 0.2s ease-out, opacity 0.2s ease-out' : 'none',
          // Fade-in animation when transaction changes (via key change)
          animation: batchContext && fadeInKey > 0 ? 'transaction-fade-in 0.25s ease-out' : undefined,
        }}
      >
        {/* ProcessingOverlay */}
        <ProcessingOverlay
          visible={effectiveIsProcessing}
          theme={theme}
          t={t}
          eta={processingEta}
        />

        {/* Main card */}
        <div
          className="rounded-2xl p-4"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--border-light)',
          }}
        >
          {/* Header: Metadata + Thumbnail */}
          <div
            className="flex justify-between items-start gap-4 mb-4 pb-4"
            style={{ borderBottom: '1px solid var(--border-light)' }}
          >
            {/* Left: Metadata */}
            <div className="flex-1 min-w-0">
              {/* Merchant name - editable */}
              {/* Story 14.24: Hide editing UI and pencil icon in read-only mode */}
              {isEditingTitle && !readOnly ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={displayTransaction.alias || ''}
                  onChange={e => transaction && onUpdateTransaction({ ...transaction, alias: e.target.value })}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={e => e.key === 'Enter' && setIsEditingTitle(false)}
                  placeholder={displayTransaction.merchant || t('merchantPlaceholder')}
                  className="text-xl font-bold w-full bg-transparent border-none outline-none mb-2"
                  style={{ color: 'var(--text-primary)' }}
                  autoFocus
                  disabled={effectiveIsProcessing}
                />
              ) : readOnly ? (
                // Read-only mode: Just display the name, no edit button
                <div className="mb-2">
                  <span
                    className="text-xl font-bold truncate"
                    style={{ color: 'var(--text-primary)' }}
                    title={displayTransaction.alias || displayTransaction.merchant || t('newTransaction')}
                  >
                    {displayTransaction.alias || displayTransaction.merchant || t('merchantPlaceholder')}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (!effectiveIsProcessing) {
                      setIsEditingTitle(true);
                      setTimeout(() => titleInputRef.current?.focus(), 0);
                    }
                  }}
                  className="flex items-center gap-2 mb-2 text-left w-full group"
                  disabled={effectiveIsProcessing}
                >
                  <span
                    className="text-xl font-bold truncate"
                    style={{ color: 'var(--text-primary)' }}
                    title={displayTransaction.alias || displayTransaction.merchant || t('newTransaction')}
                  >
                    {displayTransaction.alias || displayTransaction.merchant || t('merchantPlaceholder')}
                  </span>
                  <Pencil size={14} style={{ color: 'var(--text-tertiary)', opacity: 0.6 }} />
                </button>
              )}

              {/* Category badge - Story 14.24: disabled in read-only mode */}
              <div className="flex flex-wrap items-center gap-2 mb-2 relative">
                {readOnly ? (
                  // Read-only: just show badge without button wrapper
                  <CategoryBadge
                    category={displayTransaction.category || 'Other'}
                    lang={lang}
                    showIcon
                    maxWidth="120px"
                  />
                ) : (
                  <button
                    onClick={() => !effectiveIsProcessing && setShowCategoryDropdown(!showCategoryDropdown)}
                    className="cursor-pointer"
                    disabled={effectiveIsProcessing}
                  >
                    <CategoryBadge
                      category={displayTransaction.category || 'Other'}
                      lang={lang}
                      showIcon
                      maxWidth="120px"
                    />
                  </button>
                )}
                {/* Story 14.24: Full-screen category selector overlay */}
                {showCategoryDropdown && (
                  <CategorySelectorOverlay
                    type="store"
                    value={displayTransaction.category || 'Other'}
                    onSelect={(cat) => {
                      if (transaction) {
                        onUpdateTransaction({ ...transaction, category: cat as StoreCategory });
                      }
                    }}
                    onClose={() => setShowCategoryDropdown(false)}
                    categories={storeCategories}
                    language={lang}
                    theme={theme}
                    title={t('category')}
                  />
                )}
                {displayTransaction.merchantSource === 'learned' && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                    style={{
                      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#dbeafe',
                      color: isDark ? '#93c5fd' : '#1d4ed8',
                      border: '1px solid',
                      borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#93c5fd',
                    }}
                  >
                    <BookMarked size={10} />
                    {t('learnedMerchant')}
                  </span>
                )}
              </div>

              {/* Location - Story 14.35b: Pass userDefaultCountry for foreign flag display */}
              {/* Story 14.41: Disabled in read-only mode */}
              <LocationSelect
                country={displayTransaction.country || ''}
                city={displayTransaction.city || ''}
                onCountryChange={country => transaction && onUpdateTransaction({ ...transaction, country })}
                onCityChange={city => transaction && onUpdateTransaction({ ...transaction, city })}
                inputStyle={inputStyle}
                theme={theme}
                t={t}
                lang={lang}
                userDefaultCountry={defaultCountry}
                disabled={readOnly}
              />

              {/* Date, Time, Currency */}
              {/* Story 14.41: Disabled in read-only mode */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <DateTimeTag
                  date={displayTransaction.date}
                  time={displayTransaction.time || ''}
                  onDateChange={date => transaction && onUpdateTransaction({ ...transaction, date })}
                  onTimeChange={time => transaction && onUpdateTransaction({ ...transaction, time })}
                  t={t}
                  disabled={readOnly}
                />
                <CurrencyTag
                  currency={displayTransaction.currency || 'CLP'}
                  onCurrencyChange={currency => transaction && onUpdateTransaction({ ...transaction, currency })}
                  t={t}
                  disabled={readOnly}
                />
              </div>
            </div>

            {/* Right: Thumbnail area with scan button state machine */}
            <div
              className="flex flex-col items-center flex-shrink-0 gap-1.5"
              style={{ width: '88px' }}
            >
              {/* Thumbnail container */}
              <div
                className="relative w-full"
                style={{ height: '90px' }}
              >
              {scanButtonState === 'complete' && displayImageUrl ? (
                /* SUCCESS STATE - Show thumbnail with checkmark */
                <button
                  onClick={() => setShowImageViewer(true)}
                  className="w-full h-full rounded-xl overflow-hidden relative"
                  style={{
                    border: '2px solid var(--success)',
                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.2)',
                  }}
                >
                  <img
                    src={displayImageUrl}
                    alt={t('receiptThumbnail')}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute bottom-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--success)' }}
                  >
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </div>
                </button>
              ) : scanButtonState === 'error' && pendingImageUrl ? (
                /* ERROR STATE - Show retry button */
                <button
                  onClick={onRetry}
                  className="w-full h-full rounded-xl overflow-hidden relative"
                  style={{ border: '2px solid var(--error)' }}
                  aria-label={t('retry')}
                >
                  <img
                    src={pendingImageUrl}
                    alt={t('receiptThumbnail')}
                    className="w-full h-full object-cover opacity-50"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--error)' }}
                    >
                      <X size={18} className="text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-bold uppercase text-white">
                      {t('retry')}
                    </span>
                  </div>
                </button>
              ) : scanButtonState === 'scanning' && pendingImageUrl ? (
                /* SCANNING STATE - Show processing animation */
                <div
                  className="w-full h-full rounded-xl overflow-hidden relative"
                  style={{ border: '2px solid var(--success)' }}
                >
                  <img
                    src={pendingImageUrl}
                    alt={t('receiptThumbnail')}
                    className="w-full h-full object-cover opacity-40"
                  />
                  {/* Shining sweep animation */}
                  {!prefersReducedMotion && (
                    <div
                      className="absolute top-0 w-full h-full pointer-events-none overflow-hidden"
                    >
                      <div
                        className="absolute top-0 w-1/2 h-full"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                          animation: 'scan-shine-sweep 2s ease-in-out infinite',
                        }}
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white border-t-transparent"
                      style={{
                        animation: !prefersReducedMotion ? 'processing-spin 1s linear infinite' : 'none',
                      }}
                    />
                    <span className="text-xs font-semibold uppercase text-white">
                      {t('processing')}
                    </span>
                  </div>
                </div>
              ) : scanButtonState === 'pending' && pendingImageUrl ? (
                // PENDING STATE - Photo selected, ready to scan
                // Story 14d.5: Added effectiveIsProcessing to prevent double-click during state transition
                <button
                  onClick={hasCredits && !effectiveIsProcessing ? onProcessScan : undefined}
                  disabled={!hasCredits || effectiveIsProcessing}
                  className="w-full h-full rounded-xl overflow-hidden relative cursor-pointer"
                  style={{
                    border: '2px solid var(--success)',
                    animation: !prefersReducedMotion ? 'process-pulse 1.5s ease-in-out infinite' : 'none',
                  }}
                  aria-label={t('scan')}
                >
                  <img
                    src={pendingImageUrl}
                    alt={t('receiptThumbnail')}
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg overflow-hidden relative"
                      style={{
                        backgroundColor: hasCredits ? 'var(--success)' : 'var(--text-tertiary)',
                        animation: !prefersReducedMotion && hasCredits ? 'scan-icon-pulse 1.5s ease-in-out infinite' : 'none',
                      }}
                    >
                      <Camera size={24} className="text-white relative z-10" strokeWidth={2} />
                      {!prefersReducedMotion && hasCredits && (
                        <div
                          className="absolute top-0 w-full h-full pointer-events-none"
                          style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                            animation: 'scan-shine-sweep 2s ease-in-out infinite',
                          }}
                        />
                      )}
                    </div>
                    <div
                      className="px-3 py-1 rounded-full shadow-md overflow-hidden relative"
                      style={{
                        backgroundColor: hasCredits ? 'var(--success)' : 'var(--text-tertiary)',
                        marginTop: '-2px',
                      }}
                    >
                      <span className="text-xs font-semibold text-white relative z-10">
                        {hasCredits ? t('scan') : t('noCredits')}
                      </span>
                    </div>
                  </div>
                </button>
              ) : mode === 'existing' && transaction?.thumbnailUrl ? (
                /* EXISTING TRANSACTION - Show thumbnail with optional re-scan */
                <button
                  onClick={() => setShowImageViewer(true)}
                  className="w-full h-full rounded-xl overflow-hidden relative"
                  style={{
                    border: '2px solid var(--success)',
                  }}
                >
                  <img
                    src={transaction.thumbnailUrl}
                    alt={t('receiptThumbnail')}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-base shadow-sm"
                    style={{
                      backgroundColor: getCategoryPillColors(displayTransaction.category || 'Other').bg,
                    }}
                  >
                    {getCategoryEmoji(displayTransaction.category || 'Other')}
                  </div>
                </button>
              ) : (
                /* IDLE STATE - Empty, show add photo button */
                <button
                  onClick={handleOpenFilePicker}
                  disabled={effectiveIsProcessing}
                  className="w-full h-full rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '2px dashed var(--primary)',
                    animation: !prefersReducedMotion && !effectiveIsProcessing ? 'scan-pulse-border 2s ease-in-out infinite' : 'none',
                  }}
                  aria-label={t('attach')}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--primary-light)',
                      animation: !prefersReducedMotion && !effectiveIsProcessing ? 'scan-breathe 2s ease-in-out infinite' : 'none',
                    }}
                  >
                    <Camera size={20} style={{ color: 'var(--primary)' }} strokeWidth={2} />
                  </div>
                  <span
                    className="text-xs font-semibold tracking-wide"
                    style={{ color: 'var(--primary)' }}
                  >
                    {t('attach')}
                  </span>
                </button>
              )}
              </div>

              {/* Story 14.41: Edit button (view mode only) - same position as re-scan button */}
              {/* Uses accent color to match bottom "Editar transacción" button */}
              {mode === 'existing' && readOnly && onRequestEdit && !isOtherUserTransaction && (
                <button
                  onClick={onRequestEdit}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                  }}
                  aria-label={t('edit')}
                  title={t('edit')}
                >
                  <Pencil size={16} strokeWidth={2} />
                </button>
              )}

              {/* Re-scan button (existing transactions in edit mode only, icon only) */}
              {mode === 'existing' && transaction?.id && onRescan && hasImages && !readOnly && (
                <button
                  onClick={handleRescanClick}
                  disabled={isRescanning || !hasCredits}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: isRescanning || !hasCredits ? 'var(--bg-tertiary)' : 'var(--primary-light)',
                    color: isRescanning || !hasCredits ? 'var(--text-tertiary)' : 'var(--primary)',
                    opacity: isRescanning ? 0.7 : 1,
                    cursor: isRescanning || !hasCredits ? 'not-allowed' : 'pointer',
                  }}
                  aria-label={isRescanning ? t('rescanning') : t('rescan')}
                  title={isRescanning ? t('rescanning') : t('rescan')}
                >
                  <RefreshCw size={16} strokeWidth={2} className={isRescanning ? 'animate-spin' : ''} />
                </button>
              )}

              {/* View mode (readOnly): Only show if transaction HAS groups - displays group indicator */}
              {/* Edit mode: Show button to add/modify groups */}
              {(() => {
                const hasAssignedGroups = (displayTransaction.sharedGroupIds || []).length > 0;
                const shouldShow = readOnly ? hasAssignedGroups : (availableGroups.length > 0 || hasAssignedGroups);

                if (!shouldShow) return null;

                return (
                  <button
                    onClick={() => setShowGroupSelector(true)}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
                    style={{
                      backgroundColor: hasAssignedGroups
                        ? (availableGroups.find(g => g.id === displayTransaction.sharedGroupIds?.[0])?.color || 'var(--primary)')
                        : 'var(--bg-tertiary)',
                      cursor: 'pointer',
                    }}
                    aria-label={t('selectGroups')}
                    title={hasAssignedGroups
                      ? (displayTransaction.sharedGroupIds || []).map(id => availableGroups.find(g => g.id === id)?.name).filter(Boolean).join(', ')
                      : t('selectGroups')
                    }
                  >
                    {hasAssignedGroups ? (
                      /* Show group icon/emoji or bookmark icon with count badge */
                      <div className="relative flex items-center justify-center">
                        {(() => {
                          const firstGroup = availableGroups.find(g => g.id === displayTransaction.sharedGroupIds?.[0]);
                          const groupCount = (displayTransaction.sharedGroupIds || []).length;
                          return (
                            <>
                              {firstGroup?.icon ? (
                                <span
                                  style={{
                                    fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
                                    fontSize: '1.125rem',
                                    lineHeight: 1,
                                  }}
                                >
                                  {firstGroup.icon}
                                </span>
                              ) : (
                                <Bookmark size={18} strokeWidth={2} className="text-white" fill="white" />
                              )}
                              {groupCount > 1 && (
                                <div
                                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                                  style={{
                                    backgroundColor: 'var(--bg)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-light)',
                                  }}
                                >
                                  {groupCount}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      /* Empty state: BookmarkPlus icon (edit mode only) */
                      <BookmarkPlus size={16} style={{ color: 'var(--text-tertiary)' }} />
                    )}
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Batch Scan button - shown in new mode when idle or after successful scan */}
          {mode === 'new' && onBatchModeClick && !readOnly && !effectiveIsProcessing &&
           (scanButtonState === 'idle' || scanButtonState === 'complete') && (
            <button
              onClick={onBatchModeClick}
              className="w-full p-2.5 rounded-lg border mb-4 flex items-center justify-center gap-2 transition-all hover:bg-amber-50 dark:hover:bg-amber-900/10"
              style={{
                borderColor: '#f59e0b', // amber-500
                color: '#d97706', // amber-600
                backgroundColor: 'transparent',
              }}
            >
              <Layers size={16} strokeWidth={2} />
              <span className="text-sm font-medium">
                {t('batchScan') || 'Escanear Lote'}
              </span>
            </button>
          )}

          {/* Items section - Story 14.38: Toggle between grouped and original order */}
          <div className="mb-4">
            {/* Story 14.38: Full-width item view toggle (replaces "ÍTEMS" subtitle) */}
            {transaction?.items && transaction.items.length > 0 && (
              <div className="mb-3">
                <ItemViewToggle
                  activeView={itemViewMode}
                  onViewChange={setItemViewMode}
                  t={t}
                />
              </div>
            )}

            <div className="space-y-3">
              {/* Grouped view - items organized by category */}
              {itemViewMode === 'grouped' && itemsByGroup.map(({ groupKey, items: groupItems, total: groupTotal }) => {
                const isCollapsed = collapsedGroups.has(groupKey);
                const groupColors = getItemGroupColors(groupKey as any, 'normal', isDark ? 'dark' : 'light');
                const groupEmoji = getItemCategoryGroupEmoji(groupKey);
                const translatedGroup = translateItemCategoryGroup(groupKey, lang);

                return (
                  <div
                    key={groupKey}
                    className="rounded-xl overflow-hidden"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    {/* Group header */}
                    <button
                      onClick={() => toggleGroupCollapse(groupKey)}
                      className="w-full flex items-center justify-between px-3 py-2.5 transition-colors"
                      style={{ backgroundColor: groupColors.bg }}
                      aria-expanded={!isCollapsed}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{groupEmoji}</span>
                        <span className="text-sm font-semibold" style={{ color: groupColors.fg }}>
                          {translatedGroup}
                        </span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: 'rgba(0,0,0,0.1)', color: groupColors.fg }}
                        >
                          {groupItems.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: groupColors.fg }}>
                          {formatCurrency(groupTotal, displayCurrency)}
                        </span>
                        {isCollapsed ? (
                          <ChevronDown size={16} style={{ color: groupColors.fg }} />
                        ) : (
                          <ChevronUp size={16} style={{ color: groupColors.fg }} />
                        )}
                      </div>
                    </button>

                    {/* Items in group */}
                    {!isCollapsed && (
                      <div className="p-2 space-y-1.5">
                        {groupItems.map(({ item, originalIndex: i }) => {
                          const isVisible = !shouldAnimate || i < animatedItems.length;
                          const animationDelay = shouldAnimate ? i * 100 : 0;
                          const ItemContainer = shouldAnimate && !animationPlayedRef.current ? AnimatedItem : React.Fragment;
                          const containerProps = shouldAnimate && !animationPlayedRef.current
                            ? { delay: animationDelay, index: i, testId: `edit-view-item-${i}` }
                            : {};

                          if (!isVisible) return null;

                          return (
                            <ItemContainer key={i} {...containerProps}>
                              {editingItemIndex === i ? (
                                /* Editing state - Story 14.24: Compact layout with smaller fonts */
                                <div
                                  className="p-2.5 rounded-lg space-y-1.5"
                                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                                >
                                  {/* Item name */}
                                  <input
                                    className="w-full px-2 py-1.5 border rounded-lg text-xs"
                                    style={inputStyle}
                                    value={item.name}
                                    onChange={e => handleUpdateItem(i, 'name', e.target.value)}
                                    placeholder={t('itemName')}
                                    autoFocus
                                  />
                                  {/* Price - Story 14.24: Select all on focus for easy replacement */}
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    className="w-full px-2 py-1.5 border rounded-lg text-xs"
                                    style={inputStyle}
                                    defaultValue={item.price || ''}
                                    key={`price-${i}-${editingItemIndex}`}
                                    onFocus={e => {
                                      // Select all text on focus so user can type a new value
                                      e.target.select();
                                    }}
                                    onChange={e => {
                                      // Allow digits and one decimal point
                                      const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                                      // Ensure only one decimal point
                                      const parts = cleaned.split('.');
                                      const sanitized = parts.length > 2
                                        ? parts[0] + '.' + parts.slice(1).join('')
                                        : cleaned;
                                      if (sanitized !== e.target.value) {
                                        e.target.value = sanitized;
                                      }
                                    }}
                                    onBlur={e => {
                                      const val = parseFloat(e.target.value);
                                      if (!isNaN(val) && val >= 0) {
                                        handleUpdateItem(i, 'price', val);
                                        // Format without unnecessary decimals
                                        e.target.value = val % 1 === 0 ? String(val) : String(val);
                                      } else {
                                        // Invalid or empty - reset to 0
                                        handleUpdateItem(i, 'price', 0);
                                        e.target.value = '0';
                                      }
                                    }}
                                    onKeyDown={e => {
                                      // Submit on Enter
                                      if (e.key === 'Enter') {
                                        e.currentTarget.blur();
                                      }
                                    }}
                                    placeholder={t('price')}
                                  />
                                  {/* Story 14.24: Category pill and quantity in same row */}
                                  <div className="flex items-center gap-2">
                                    {/* Category pill button - opens full-screen overlay */}
                                    <button
                                      type="button"
                                      onClick={() => setShowItemCategoryOverlay(i)}
                                      className="flex-1 min-w-0"
                                    >
                                      <CategoryBadge
                                        category={item.category || 'Other'}
                                        lang={lang}
                                        showIcon
                                        mini
                                        type="item"
                                      />
                                    </button>
                                    {/* Integer-only quantity field - Story 14.24: Clear on focus, validate on blur */}
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      className="w-14 px-2 py-1.5 border rounded-lg text-xs text-center"
                                      style={inputStyle}
                                      defaultValue={item.qty ?? 1}
                                      key={`qty-${i}-${editingItemIndex}`}
                                      onFocus={e => {
                                        // Select all text on focus so user can type a new value
                                        e.target.select();
                                      }}
                                      onChange={e => {
                                        // Only allow digits
                                        const cleaned = e.target.value.replace(/[^0-9]/g, '');
                                        if (cleaned !== e.target.value) {
                                          e.target.value = cleaned;
                                        }
                                      }}
                                      onBlur={e => {
                                        const val = parseInt(e.target.value, 10);
                                        if (!isNaN(val) && val >= 1) {
                                          handleUpdateItem(i, 'qty', val);
                                          e.target.value = String(val);
                                        } else {
                                          // Invalid or empty - reset to 1
                                          handleUpdateItem(i, 'qty', 1);
                                          e.target.value = '1';
                                        }
                                      }}
                                      onKeyDown={e => {
                                        // Prevent decimal, scientific notation, negative
                                        if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                                          e.preventDefault();
                                        }
                                        // Submit on Enter
                                        if (e.key === 'Enter') {
                                          e.currentTarget.blur();
                                        }
                                      }}
                                      placeholder={lang === 'es' ? 'Cant.' : 'Qty'}
                                    />
                                  </div>
                                  {/* Subcategory */}
                                  <input
                                    className="w-full px-2 py-1.5 border rounded-lg text-xs"
                                    style={inputStyle}
                                    value={item.subcategory || ''}
                                    onChange={e => handleUpdateItem(i, 'subcategory', e.target.value)}
                                    placeholder={t('itemSubcat')}
                                  />
                                  {/* Action buttons */}
                                  <div className="flex justify-end gap-2 pt-0.5">
                                    <button
                                      onClick={() => handleDeleteItem(i)}
                                      className="min-w-9 min-h-9 p-1.5 rounded-lg flex items-center justify-center"
                                      style={{
                                        color: 'var(--error)',
                                        backgroundColor: isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                      }}
                                    >
                                      <Trash2 size={16} strokeWidth={2} />
                                    </button>
                                    <button
                                      onClick={() => setEditingItemIndex(null)}
                                      className="min-w-9 min-h-9 p-1.5 rounded-lg flex items-center justify-center"
                                      style={{
                                        color: 'var(--success)',
                                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                      }}
                                    >
                                      <Check size={16} strokeWidth={2} />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* Display state - Story 14.24: disable clicking in read-only mode */
                                <div
                                  onClick={() => !effectiveIsProcessing && !readOnly && setEditingItemIndex(i)}
                                  className={`px-2.5 py-2 rounded-lg transition-colors ${readOnly ? '' : 'cursor-pointer'}`}
                                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                                >
                                  <div className="flex justify-between items-start gap-2 mb-1">
                                    <div className="flex items-center gap-1 flex-1 min-w-0">
                                      <span
                                        className="text-xs font-medium truncate"
                                        style={{ color: 'var(--text-primary)' }}
                                      >
                                        {item.name}
                                      </span>
                                      {/* Phase 4: Cross-store suggestion indicator */}
                                      {!readOnly && itemSuggestions.has(i) && (
                                        <ItemNameSuggestionIndicator
                                          suggestedName={itemSuggestions.get(i)!.suggestedName}
                                          fromStore={itemSuggestions.get(i)!.fromMerchant}
                                          onClick={() => handleShowSuggestion(i, item)}
                                          theme={theme}
                                        />
                                      )}
                                      {/* Story 14.24: Hide pencil icon in read-only mode */}
                                      {!readOnly && <Pencil size={10} style={{ color: 'var(--text-tertiary)', opacity: 0.6, flexShrink: 0 }} />}
                                    </div>
                                    <span
                                      className="text-xs font-semibold flex-shrink-0"
                                      style={{ color: 'var(--text-primary)' }}
                                    >
                                      {formatCurrency(item.price, displayCurrency)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div className="flex flex-wrap items-center gap-1">
                                      <CategoryBadge category={item.category || 'Other'} lang={lang} mini type="item" />
                                      {item.subcategory && (
                                        <span
                                          className="text-xs px-1.5 py-0.5 rounded-full"
                                          style={{
                                            backgroundColor: 'var(--bg-secondary)',
                                            color: 'var(--text-tertiary)',
                                          }}
                                        >
                                          {item.subcategory}
                                        </span>
                                      )}
                                    </div>
                                    {(item.qty ?? 1) > 1 && (
                                      <span
                                        className="text-xs font-medium flex-shrink-0"
                                        style={{ color: 'var(--text-tertiary)' }}
                                      >
                                        x{Number.isInteger(item.qty) ? item.qty : item.qty?.toFixed(1)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </ItemContainer>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Original order view - Story 14.38: items in array index order */}
              {itemViewMode === 'original' && transaction?.items && (
                <div
                  className="rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                    {transaction.items.map((item, i) => {
                      const isVisible = !shouldAnimate || i < animatedItems.length;
                      const animationDelay = shouldAnimate ? i * 100 : 0;
                      const ItemContainer = shouldAnimate && !animationPlayedRef.current ? AnimatedItem : React.Fragment;
                      const containerProps = shouldAnimate && !animationPlayedRef.current
                        ? { delay: animationDelay, index: i, testId: `edit-view-item-original-${i}` }
                        : {};

                      if (!isVisible) return null;

                      return (
                        <ItemContainer key={i} {...containerProps}>
                          <div
                            className="px-3 py-2.5 transition-colors"
                            style={{
                              backgroundColor: i % 2 === 1 ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                            }}
                          >
                            {editingItemIndex === i ? (
                              /* Editing state in original view */
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="text-xs font-medium w-5 text-center flex-shrink-0"
                                    style={{ color: 'var(--text-tertiary)' }}
                                  >
                                    {i + 1}.
                                  </span>
                                  <input
                                    className="flex-1 px-2 py-1.5 border rounded-lg text-xs"
                                    style={inputStyle}
                                    value={item.name}
                                    onChange={e => handleUpdateItem(i, 'name', e.target.value)}
                                    placeholder={t('itemName')}
                                    autoFocus
                                  />
                                </div>
                                <div className="flex items-center gap-2 pl-7">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    className="w-24 px-2 py-1.5 border rounded-lg text-xs"
                                    style={inputStyle}
                                    defaultValue={item.price || ''}
                                    key={`price-original-${i}-${editingItemIndex}`}
                                    onFocus={e => e.target.select()}
                                    onChange={e => {
                                      const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                                      const parts = cleaned.split('.');
                                      const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
                                      if (sanitized !== e.target.value) e.target.value = sanitized;
                                    }}
                                    onBlur={e => {
                                      const val = parseFloat(e.target.value);
                                      if (!isNaN(val) && val >= 0) handleUpdateItem(i, 'price', val);
                                    }}
                                    placeholder={t('itemPrice')}
                                  />
                                  <button
                                    onClick={() => {
                                      setShowItemCategoryOverlay(i);
                                      setEditingItemIndex(null);
                                    }}
                                    className="px-2 py-1 rounded-lg text-xs"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                                  >
                                    <CategoryBadge category={item.category || 'Other'} lang={lang} mini type="item" />
                                  </button>
                                  <div className="flex-1" />
                                  <button
                                    onClick={() => handleDeleteItem(i)}
                                    className="min-w-8 min-h-8 p-1 rounded-lg flex items-center justify-center"
                                    style={{ color: 'var(--error)', backgroundColor: isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}
                                  >
                                    <Trash2 size={14} strokeWidth={2} />
                                  </button>
                                  <button
                                    onClick={() => setEditingItemIndex(null)}
                                    className="min-w-8 min-h-8 p-1 rounded-lg flex items-center justify-center"
                                    style={{ color: 'var(--success)', backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                                  >
                                    <Check size={14} strokeWidth={2} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Display state in original view */
                              <div
                                onClick={() => !effectiveIsProcessing && !readOnly && setEditingItemIndex(i)}
                                className={`flex items-center gap-2 ${readOnly ? '' : 'cursor-pointer'}`}
                              >
                                <span
                                  className="text-xs font-medium w-5 text-center flex-shrink-0"
                                  style={{ color: 'var(--text-tertiary)' }}
                                >
                                  {i + 1}.
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1 min-w-0 flex-1">
                                      <span
                                        className="text-xs font-medium truncate"
                                        style={{ color: 'var(--text-primary)' }}
                                      >
                                        {item.name}
                                      </span>
                                      {!readOnly && itemSuggestions.has(i) && (
                                        <ItemNameSuggestionIndicator
                                          suggestedName={itemSuggestions.get(i)!.suggestedName}
                                          fromStore={itemSuggestions.get(i)!.fromMerchant}
                                          onClick={() => handleShowSuggestion(i, item)}
                                          theme={theme}
                                        />
                                      )}
                                      {!readOnly && <Pencil size={10} style={{ color: 'var(--text-tertiary)', opacity: 0.6, flexShrink: 0 }} />}
                                    </div>
                                    <span
                                      className="text-xs font-semibold flex-shrink-0"
                                      style={{ color: 'var(--text-primary)' }}
                                    >
                                      {formatCurrency(item.price, displayCurrency)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <CategoryBadge category={item.category || 'Other'} lang={lang} mini type="item" />
                                    {item.subcategory && (
                                      <span
                                        className="text-xs px-1.5 py-0.5 rounded-full"
                                        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-tertiary)' }}
                                      >
                                        {item.subcategory}
                                      </span>
                                    )}
                                    {(item.qty ?? 1) > 1 && (
                                      <span
                                        className="text-xs font-medium"
                                        style={{ color: 'var(--text-tertiary)' }}
                                      >
                                        x{Number.isInteger(item.qty) ? item.qty : item.qty?.toFixed(1)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </ItemContainer>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Add Item button - Story 14.24: hidden in read-only mode */}
            {!readOnly && (
              <button
                onClick={handleAddItem}
                disabled={effectiveIsProcessing}
                className="w-full p-2.5 mt-3 rounded-lg border-2 border-dashed flex items-center justify-center gap-1.5 transition-colors"
                style={{
                  borderColor: 'var(--border-light)',
                  color: 'var(--primary)',
                  backgroundColor: 'transparent',
                }}
              >
                <Plus size={14} strokeWidth={2.5} />
                <span className="text-sm font-medium">{t('addItem')}</span>
              </button>
            )}
          </div>

          {/* Total row */}
          <div
            className="flex justify-between items-center p-3 rounded-lg mb-4"
            style={{ backgroundColor: 'var(--primary-light)' }}
          >
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {t('total')} ({displayTransaction.items.length} {displayTransaction.items.length === 1 ? 'item' : 'items'})
            </span>
            <span className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
              {formatCurrency(calculatedTotal, displayCurrency)}
            </span>
          </div>

          {/* Story 14.24: Show Edit button in read-only mode, Save button otherwise */}
          {readOnly && isOtherUserTransaction ? (
            <div
              className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
              }}
            >
              {t('addedBy') || 'Added by'}{' '}
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {ownerProfile?.displayName || t('unknownUser') || 'Unknown'}
              </span>
            </div>
          ) : readOnly ? (
            <button
              onClick={onRequestEdit}
              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99]"
              style={{
                backgroundColor: 'var(--accent)',
              }}
            >
              <Pencil size={18} strokeWidth={2.5} />
              {t('editTransaction') || 'Editar Transacción'}
            </button>
          ) : (
            <button
              onClick={handleSaveWithLearning}
              disabled={isSaving || effectiveIsProcessing || !canSave}
              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99]"
              style={{
                backgroundColor: (isSaving || effectiveIsProcessing || !canSave) ? 'var(--success-muted, #86efac)' : 'var(--success)',
                opacity: (isSaving || effectiveIsProcessing || !canSave) ? 0.5 : 1,
                cursor: !canSave ? 'not-allowed' : 'pointer',
              }}
            >
              <Check size={18} strokeWidth={2.5} />
              {isSaving ? (t('saving') || 'Guardando...') : (t('saveTransaction') || 'Guardar Transacción')}
            </button>
          )}
        </div>

        {/* Debug info section */}
        {(displayTransaction.promptVersion || transaction?.id || displayTransaction.merchant) && (
          <div
            className="rounded-2xl p-4 mt-4"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)',
            }}
          >
            <button
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="w-full flex items-center justify-between text-xs"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <span className="font-medium">{t('debugInfo')}</span>
              {showDebugInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showDebugInfo && (
              <div className="mt-3 space-y-2 text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                {displayTransaction.merchant && (
                  <div className="flex justify-between">
                    <span>{t('merchantFromScan')}:</span>
                    <span className="truncate max-w-[180px] text-right">{displayTransaction.merchant}</span>
                  </div>
                )}
                {displayTransaction.promptVersion && (
                  <div className="flex justify-between">
                    <span>Prompt:</span>
                    <span>{displayTransaction.promptVersion}</span>
                  </div>
                )}
                {transaction?.id && (
                  <div className="flex justify-between">
                    <span>ID:</span>
                    <span className="truncate max-w-[150px]">{transaction.id}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Datalist for alias autocomplete */}
      <datalist id="alias-list">
        {distinctAliases.map((a, i) => (
          <option key={i} value={a} />
        ))}
      </datalist>

      {/* Modals and Dialogs */}

      {/* ScanCompleteModal - NEW transactions only */}
      <ScanCompleteModal
        visible={showScanCompleteModal}
        transaction={transaction}
        onSave={handleScanCompleteSave}
        onEdit={handleScanCompleteEdit}
        onDismiss={handleScanCompleteEdit}
        theme={theme}
        t={t}
        formatCurrency={formatCurrency}
        currency={currency}
        lang={lang}
        isSaving={isSaving}
      />

      {/* ImageViewer Modal */}
      {showImageViewer && (transaction?.imageUrls?.length ?? 0) > 0 && (
        <ImageViewer
          images={transaction!.imageUrls!}
          merchantName={displayTransaction.merchant}
          onClose={() => setShowImageViewer(false)}
        />
      )}

      {/* Story 14.24: Item Category Selector Overlay */}
      {showItemCategoryOverlay !== null && (
        <CategorySelectorOverlay
          type="item"
          value={transaction?.items[showItemCategoryOverlay]?.category || ''}
          onSelect={(cat) => {
            handleUpdateItem(showItemCategoryOverlay, 'category', cat);
          }}
          onClose={() => setShowItemCategoryOverlay(null)}
          language={lang}
          theme={theme}
          title={t('itemCat')}
        />
      )}

      {/* Story 14e-5: Learning dialogs (CategoryLearning, SubcategoryLearning, LearnMerchant,
          ItemNameSuggestion) are now rendered via Modal Manager. The useEffect hooks above
          open these modals when their respective state flags become true. */}

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowCancelConfirm(false)}
        >
          <div
            className="mx-4 p-6 rounded-xl shadow-xl max-w-sm w-full"
            style={{ backgroundColor: 'var(--surface)' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--primary)' }}>
              {t('discardChanges')}
            </h2>
            {creditUsed && (
              <div
                className="p-3 rounded-lg mb-4 flex items-start gap-2"
                style={{
                  backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(251, 191, 36, 0.4)' : 'rgba(251, 191, 36, 0.5)',
                }}
              >
                <span className="text-amber-500 text-lg">⚠️</span>
                <span className="text-sm font-medium" style={{ color: isDark ? '#fbbf24' : '#d97706' }}>
                  {t('creditAlreadyUsed')}
                </span>
              </div>
            )}
            <p className="text-sm mb-6" style={{ color: 'var(--secondary)' }}>
              {t('discardChangesMessage')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2 px-4 rounded-lg border font-medium flex items-center justify-center gap-2"
                style={{
                  borderColor: isDark ? '#475569' : '#e2e8f0',
                  color: 'var(--primary)',
                  backgroundColor: 'transparent',
                }}
              >
                <ChevronLeft size={16} strokeWidth={2} />
                {t('back')}
              </button>
              <button
                onClick={() => {
                  setShowCancelConfirm(false);
                  onCancel();
                }}
                className="flex-1 py-2 px-4 rounded-lg font-medium text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--error)' }}
              >
                <Trash2 size={16} strokeWidth={2} />
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Re-scan Confirmation Dialog */}
      {showRescanConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowRescanConfirm(false)}
        >
          <div
            className="mx-4 p-6 rounded-xl shadow-xl max-w-sm w-full"
            style={{ backgroundColor: 'var(--surface)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(59, 130, 246, 0.1)' }}
              >
                <RefreshCw size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
                {t('rescanConfirmTitle')}
              </h2>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--secondary)' }}>
              {t('rescanConfirmMessage')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRescanConfirm(false)}
                className="flex-1 py-2 px-4 rounded-lg border font-medium"
                style={{
                  borderColor: isDark ? '#475569' : '#e2e8f0',
                  color: 'var(--primary)',
                  backgroundColor: 'transparent',
                }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleConfirmRescan}
                className="flex-1 py-2 px-4 rounded-lg font-medium text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <RefreshCw size={16} strokeWidth={2} />
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && transaction?.id && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="mx-4 p-6 rounded-xl shadow-xl max-w-sm w-full"
            style={{ backgroundColor: 'var(--surface)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' }}
              >
                <Trash2 size={20} style={{ color: 'var(--error)' }} />
              </div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {t('deleteConfirmTitle')}
              </h2>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              {t('deleteConfirmMessage')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 px-4 rounded-lg border font-medium flex items-center justify-center gap-2"
                style={{
                  borderColor: isDark ? '#475569' : '#e2e8f0',
                  color: 'var(--text-primary)',
                  backgroundColor: 'transparent',
                }}
              >
                <ChevronLeft size={16} strokeWidth={2} />
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete?.(transaction.id!);
                }}
                className="flex-1 py-2 px-4 rounded-lg font-medium text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--error)' }}
              >
                <Trash2 size={16} strokeWidth={2} />
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGroupSelector && (
        <TransactionGroupSelector
          groups={availableGroups}
          selectedIds={displayTransaction.sharedGroupIds || []}
          onSelect={(groupIds) => {
            if (transaction && onGroupsChange) {
              // Deduplicate group IDs to prevent duplicates in array
              const uniqueGroupIds = [...new Set(groupIds)];
              onGroupsChange(uniqueGroupIds);
              onUpdateTransaction({ ...transaction, sharedGroupIds: uniqueGroupIds });
            }
          }}
          onClose={() => setShowGroupSelector(false)}
          t={t}
          theme={theme}
          isLoading={groupsLoading}
          readOnly={readOnly}
        />
      )}
    </div>
  );
};

export default TransactionEditorView;
