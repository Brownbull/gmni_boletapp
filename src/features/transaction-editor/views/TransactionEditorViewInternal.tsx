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
  Check,
  ChevronDown,
  ChevronUp,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Layers,
  Receipt,
} from 'lucide-react';
// Story 15-5d: Plus, RefreshCw moved to EditorItemsSection + EditorScanThumbnail
// Story 15b-2o: formatCreditsDisplay moved to EditorHeaderBar
import { CategoryBadge } from '@features/transaction-editor/components/CategoryBadge';
import { CategorySelectorOverlay } from '@features/transaction-editor/components/CategorySelectorOverlay';
import { ImageViewer } from '@/components/ImageViewer';
// Story 14e-5: Learning dialogs use Modal Manager (types moved to useEditorLearningPrompts hook)
import { useModalActions } from '@managers/ModalManager';
// Story 15-5d: ItemNameSuggestionIndicator moved to EditorItemsSection
// Story 15-5d: normalizeMerchantName, normalizeItemName moved to useCrossStoreSuggestions hook
import { LocationSelect } from '@/components/LocationSelect';
import { DateTimeTag } from '@features/transaction-editor/components/DateTimeTag';
import { CurrencyTag } from '@features/transaction-editor/components/CurrencyTag';
import { DEFAULT_CURRENCY } from '@/utils/currency';
import { ProcessingOverlay } from '@/components/scan/ProcessingOverlay';
import { ScanCompleteModal } from '@features/scan/components';
// Story 15-5d: celebrateSuccess moved to useEditorLearningPrompts hook
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useStaggeredReveal } from '@/hooks/useStaggeredReveal';
// Story 15-5d: AnimatedItem moved to EditorItemsSection
import {
  sanitizeMerchantName,
  sanitizeItemName,
  sanitizeLocation,
  sanitizeSubcategory,
} from '@/utils/sanitize';
import type { Transaction, TransactionItem } from '@/types/transaction';
import type { StoreCategory, ItemCategory } from '../../../../shared/schema/categories';
// Story 15-5d: translateItemCategoryGroup, getItemCategoryGroupEmoji moved to EditorItemsSection
// Story 15-5d: translateStoreCategory moved to useEditorLearningPrompts hook
import { getItemCategoryGroup } from '@/config/categoryColors';
// Story 15-5d: getCategoryPillColors, getItemGroupColors, getCategoryEmoji moved to extracted components
import { normalizeItemCategory } from '@/utils/categoryNormalizer';
// Story 14e-11: Migrated from useScanOptional (ScanContext) to Zustand store
import { useIsProcessing as useScanIsProcessing, useScanActiveDialog } from '@features/scan/store';
import { DIALOG_TYPES } from '@shared/types/scanWorkflow';
// Story 14e-25d: Direct hooks (ViewHandlersContext deleted)
import { useToast } from '@/shared/hooks';
import { hasItemWithPrice } from '@/utils/transactionValidation';
// Note: useModalActions imported above from @managers/ModalManager
import type { ItemViewMode } from '@/components/items/ItemViewToggle';
// Story 15-5d: ItemViewToggle moved to EditorItemsSection
import { EditorConfirmationDialogs } from './TransactionEditorView/EditorConfirmationDialogs';
import { EditorItemsSection } from './TransactionEditorView/EditorItemsSection';
import { EditorScanThumbnail } from './TransactionEditorView/EditorScanThumbnail';
import { useCrossStoreSuggestions } from './TransactionEditorView/useCrossStoreSuggestions';
import { useEditorLearningPrompts } from './TransactionEditorView/useEditorLearningPrompts';
import { useEditorSwipeGestures } from './TransactionEditorView/useEditorSwipeGestures';
import { EditorHeaderBar } from './TransactionEditorView/EditorHeaderBar';

// Story 15b-2o: Types extracted to editorViewTypes.ts
import type { TransactionEditorViewProps, ScanButtonState } from './TransactionEditorView/editorViewTypes';
export type { TransactionEditorViewProps, ScanButtonState } from './TransactionEditorView/editorViewTypes';

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
  ownerId: _ownerId,
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
  // Story 14d-v2-1.1: Group selector state disabled (Epic 14c cleanup)
  const [_showGroupSelector, _setShowGroupSelector] = useState(false);

  // ScanCompleteModal state (for new transactions only)
  const [showScanCompleteModal, setShowScanCompleteModal] = useState(false);

  // Story 15b-2o: Swipe gesture state extracted to useEditorSwipeGestures hook
  const {
    swipeOffset,
    swipeTouchStart,
    fadeInKey,
    handleSwipeTouchStart,
    handleSwipeTouchMove,
    handleSwipeTouchEnd,
  } = useEditorSwipeGestures({
    batchContext,
    onBatchPrevious,
    onBatchNext,
    transactionId: transaction?.id,
  });

  // Story 15-5d: Learning prompt states moved to useEditorLearningPrompts hook
  // Story 15-5d: Handler refs moved to useEditorLearningPrompts + useCrossStoreSuggestions hooks

  // Story 15-5d: Cross-store suggestion state moved to useCrossStoreSuggestions hook

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

  // Story 15-5d: Cross-store suggestions extracted to useCrossStoreSuggestions hook
  const {
    itemSuggestions,
    handleShowSuggestion,
  } = useCrossStoreSuggestions({
    transaction,
    itemNameMappings,
    onUpdateTransaction,
    onSaveItemNameMapping,
    showToast,
    openModal,
    closeModal,
    t,
    theme,
  });

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

  // Story 15-5d: handleFinalSave — sanitizes and calls onSave (terminal step of learning chain)
  const handleFinalSave = async () => {
    if (!transaction) return;

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
  const hasImages = !!displayImageUrl || !!(transaction?.imageUrls && transaction.imageUrls.length > 0);

  // Input styling
  const inputStyle: React.CSSProperties = {
    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
    borderColor: isDark ? '#475569' : '#e2e8f0',
    color: 'var(--primary)',
  };

  // Validation
  const hasValidTotal = calculatedTotal > 0;
  const canSave = hasValidTotal && hasItemWithPrice(transaction?.items);

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

  // Story 15-5d: Learning prompts extracted to useEditorLearningPrompts hook
  const { handleSaveWithLearning } = useEditorLearningPrompts({
    transaction,
    originalItemGroupsRef,
    originalAliasRef,
    originalStoreCategoryRef,
    getDisplayTransaction: () => ({
      merchant: displayTransaction.merchant,
      alias: displayTransaction.alias,
      category: displayTransaction.category,
    }),
    lang,
    t,
    theme,
    onSaveMapping,
    onSaveMerchantMapping,
    onSaveSubcategoryMapping,
    onSaveItemNameMapping,
    onFinalSave: handleFinalSave,
    showToast,
    openModal,
    closeModal,
  });

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

      {/* Story 15b-2o: Header extracted to EditorHeaderBar */}
      <EditorHeaderBar
        mode={mode}
        transactionId={transaction?.id}
        credits={credits}
        onCancelClick={handleCancelClick}
        onDeleteClick={() => setShowDeleteConfirm(true)}
        onCreditInfoClick={openCreditInfoModal}
        t={t}
      />

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
                  currency={displayTransaction.currency || DEFAULT_CURRENCY}
                  onCurrencyChange={currency => transaction && onUpdateTransaction({ ...transaction, currency })}
                  t={t}
                  disabled={readOnly}
                />
              </div>
            </div>

            {/* Right: Thumbnail area with scan button state machine */}
            {/* Story 15-5d: Extracted to EditorScanThumbnail */}
            <EditorScanThumbnail
              scanButtonState={scanButtonState}
              effectiveIsProcessing={effectiveIsProcessing}
              hasCredits={hasCredits}
              prefersReducedMotion={prefersReducedMotion}
              displayImageUrl={displayImageUrl}
              pendingImageUrl={pendingImageUrl}
              mode={mode}
              transactionThumbnailUrl={transaction?.thumbnailUrl}
              transactionId={transaction?.id}
              displayCategory={displayTransaction.category || 'Other'}
              hasImages={hasImages}
              isOtherUserTransaction={isOtherUserTransaction}
              isRescanning={isRescanning}
              readOnly={readOnly}
              onShowImageViewer={() => setShowImageViewer(true)}
              onRetry={onRetry}
              onProcessScan={onProcessScan}
              onOpenFilePicker={handleOpenFilePicker}
              onRescanClick={handleRescanClick}
              onRequestEdit={onRequestEdit}
              onRescan={onRescan}
              t={t}
            />
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

          {/* Items section - Story 15-5d: Extracted to EditorItemsSection */}
          <EditorItemsSection
            itemViewMode={itemViewMode}
            onItemViewModeChange={setItemViewMode}
            itemsByGroup={itemsByGroup}
            transaction={transaction}
            shouldAnimate={shouldAnimate}
            animatedItems={animatedItems}
            animationPlayedRef={animationPlayedRef}
            editingItemIndex={editingItemIndex}
            onEditingItemIndexChange={setEditingItemIndex}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onAddItem={handleAddItem}
            onShowItemCategoryOverlay={setShowItemCategoryOverlay}
            itemSuggestions={itemSuggestions}
            onShowSuggestion={handleShowSuggestion}
            readOnly={readOnly}
            effectiveIsProcessing={effectiveIsProcessing}
            isDark={isDark}
            inputStyle={inputStyle}
            displayCurrency={displayCurrency}
            formatCurrency={formatCurrency}
            lang={lang}
            t={t}
            theme={theme}
            collapsedGroups={collapsedGroups}
            onToggleGroupCollapse={toggleGroupCollapse}
          />

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

      {/* Story 15-5d: Confirmation dialogs extracted to EditorConfirmationDialogs */}
      <EditorConfirmationDialogs
        showCancelConfirm={showCancelConfirm}
        onDismissCancelConfirm={() => setShowCancelConfirm(false)}
        onConfirmCancel={() => {
          setShowCancelConfirm(false);
          onCancel();
        }}
        creditUsed={creditUsed}
        showRescanConfirm={showRescanConfirm}
        onDismissRescanConfirm={() => setShowRescanConfirm(false)}
        onConfirmRescan={handleConfirmRescan}
        showDeleteConfirm={showDeleteConfirm}
        hasTransactionId={!!transaction?.id}
        onDismissDeleteConfirm={() => setShowDeleteConfirm(false)}
        onConfirmDelete={() => {
          setShowDeleteConfirm(false);
          onDelete?.(transaction!.id!);
        }}
        isDark={isDark}
        t={t}
      />

    </div>
  );
};

export default TransactionEditorView;
