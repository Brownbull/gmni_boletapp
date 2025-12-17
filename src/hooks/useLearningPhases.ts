/**
 * useLearningPhases Hook
 *
 * Story 10.0: Foundation Sprint - Learning prompt orchestration
 * @see docs/sprint-artifacts/epic10/story-10.0-foundation-sprint.md
 *
 * This hook encapsulates the multi-phase learning flow that occurs when
 * saving a transaction. The phases are:
 * 1. Category learning (item group changes)
 * 2. Subcategory learning (item subcategory changes)
 * 3. Merchant learning (alias changes)
 * 4. Final save
 *
 * Each phase shows a prompt if there are changes to learn, or skips to the next phase.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ItemChange {
  itemName: string;
  newValue: string;
}

export interface LearningPhasesState {
  /** Whether category learning prompt should be shown */
  showCategoryPrompt: boolean;
  /** Whether subcategory learning prompt should be shown */
  showSubcategoryPrompt: boolean;
  /** Whether merchant learning prompt should be shown */
  showMerchantPrompt: boolean;
  /** Items with category (group) changes to learn */
  categoryChanges: ItemChange[];
  /** Items with subcategory changes to learn */
  subcategoryChanges: ItemChange[];
  /** Whether a mapping save operation is in progress */
  isSaving: boolean;
}

export interface LearningPhasesActions {
  /** Start the learning flow (call this instead of save) */
  startLearningFlow: () => Promise<void>;
  /** Confirm category learning and proceed */
  confirmCategoryLearning: () => Promise<void>;
  /** Skip category learning and proceed */
  skipCategoryLearning: () => Promise<void>;
  /** Confirm subcategory learning and proceed */
  confirmSubcategoryLearning: () => Promise<void>;
  /** Skip subcategory learning and proceed */
  skipSubcategoryLearning: () => Promise<void>;
  /** Confirm merchant learning and proceed */
  confirmMerchantLearning: () => Promise<void>;
  /** Skip merchant learning and proceed */
  skipMerchantLearning: () => Promise<void>;
  /** Reset all learning state */
  reset: () => void;
}

export interface ItemState {
  name: string;
  category: string;
  subcategory: string;
}

export interface LearningPhasesConfig {
  /** Unique key for the transaction (e.g., id or 'new') */
  transactionKey: string;
  /** Current merchant name */
  merchant: string;
  /** Current merchant alias */
  alias: string;
  /** Current items */
  items: ItemState[];
  /** Callback to save category mappings */
  onSaveCategoryMapping?: (itemName: string, category: string) => Promise<void>;
  /** Callback to save subcategory mappings */
  onSaveSubcategoryMapping?: (itemName: string, subcategory: string) => Promise<void>;
  /** Callback to save merchant mapping */
  onSaveMerchantMapping?: (originalMerchant: string, alias: string) => Promise<void>;
  /** Callback to perform the final save */
  onSave: () => Promise<void>;
  /** Callback to show success toast */
  onShowToast?: (message: string) => void;
  /** Callback for celebration effect (confetti) */
  onCelebrate?: () => void;
}

export interface LearningPhasesResult {
  state: LearningPhasesState;
  actions: LearningPhasesActions;
  /** Check if any learning is needed before save */
  hasLearningOpportunities: boolean;
  /** Check if merchant alias has changed */
  hasMerchantChange: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for orchestrating multi-phase learning prompts during transaction save.
 *
 * @example
 * ```tsx
 * const { state, actions, hasLearningOpportunities } = useLearningPhases({
 *   transactionKey: transaction.id || 'new',
 *   merchant: transaction.merchant,
 *   alias: transaction.alias,
 *   items: transaction.items,
 *   onSaveCategoryMapping: async (name, cat) => { ... },
 *   onSaveSubcategoryMapping: async (name, subcat) => { ... },
 *   onSaveMerchantMapping: async (merchant, alias) => { ... },
 *   onSave: async () => { ... },
 *   onShowToast: (msg) => showToast(msg),
 *   onCelebrate: () => celebrateSuccess(),
 * });
 *
 * // In save handler:
 * const handleSave = () => {
 *   actions.startLearningFlow();
 * };
 *
 * // Render prompts:
 * {state.showCategoryPrompt && <CategoryLearningPrompt ... />}
 * ```
 */
export function useLearningPhases(config: LearningPhasesConfig): LearningPhasesResult {
  const {
    transactionKey,
    merchant,
    alias,
    items,
    onSaveCategoryMapping,
    onSaveSubcategoryMapping,
    onSaveMerchantMapping,
    onSave,
    onShowToast,
    onCelebrate,
  } = config;

  // =========================================================================
  // State
  // =========================================================================

  const [showCategoryPrompt, setShowCategoryPrompt] = useState(false);
  const [showSubcategoryPrompt, setShowSubcategoryPrompt] = useState(false);
  const [showMerchantPrompt, setShowMerchantPrompt] = useState(false);
  const [categoryChanges, setCategoryChanges] = useState<ItemChange[]>([]);
  const [subcategoryChanges, setSubcategoryChanges] = useState<ItemChange[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Track original values to detect changes
  const originalItemsRef = useRef<ItemState[]>([]);
  const originalAliasRef = useRef<string | null>(null);
  const capturedKeyRef = useRef<string | null>(null);

  // =========================================================================
  // Capture Original State
  // =========================================================================

  // Capture original items when transactionKey changes
  useEffect(() => {
    const hasData = merchant || items.length > 0;

    if (hasData && capturedKeyRef.current !== transactionKey) {
      originalItemsRef.current = items.map(item => ({
        name: item.name,
        category: item.category || '',
        subcategory: item.subcategory || '',
      }));
      originalAliasRef.current = alias || '';
      capturedKeyRef.current = transactionKey;
    }
  }, [transactionKey, merchant, items, alias]);

  // =========================================================================
  // Change Detection
  // =========================================================================

  /**
   * Find all items whose category (group) has changed.
   */
  const findCategoryChanges = useCallback((): ItemChange[] => {
    const changes: ItemChange[] = [];
    const originalItems = originalItemsRef.current;

    for (let i = 0; i < items.length; i++) {
      const currentItem = items[i];
      const originalItem = originalItems[i];

      // Skip if no original item (new item) or no name
      if (!originalItem || !currentItem.name) continue;

      const currentCategory = currentItem.category || '';
      const originalCategory = originalItem.category || '';

      if (currentCategory && currentCategory !== originalCategory) {
        changes.push({
          itemName: currentItem.name,
          newValue: currentCategory,
        });
      }
    }

    return changes;
  }, [items]);

  /**
   * Find all items whose subcategory has changed.
   */
  const findSubcategoryChanges = useCallback((): ItemChange[] => {
    const changes: ItemChange[] = [];
    const originalItems = originalItemsRef.current;

    for (let i = 0; i < items.length; i++) {
      const currentItem = items[i];
      const originalItem = originalItems[i];

      // Skip if no original item (new item) or no name
      if (!originalItem || !currentItem.name) continue;

      const currentSubcategory = currentItem.subcategory || '';
      const originalSubcategory = originalItem.subcategory || '';

      if (currentSubcategory && currentSubcategory !== originalSubcategory) {
        changes.push({
          itemName: currentItem.name,
          newValue: currentSubcategory,
        });
      }
    }

    return changes;
  }, [items]);

  /**
   * Check if merchant alias has changed.
   */
  const hasMerchantChange = useMemo(() => {
    if (!merchant) return false;
    const currentAlias = alias || '';
    const originalAlias = originalAliasRef.current || '';
    return currentAlias !== originalAlias && currentAlias.length > 0;
  }, [merchant, alias]);

  /**
   * Check if there are any learning opportunities.
   */
  const hasLearningOpportunities = useMemo((): boolean => {
    const hasCategoryChanges = !!onSaveCategoryMapping && findCategoryChanges().length > 0;
    const hasSubcategoryChanges = !!onSaveSubcategoryMapping && findSubcategoryChanges().length > 0;
    const hasMerchantChanges = !!onSaveMerchantMapping && hasMerchantChange;
    return hasCategoryChanges || hasSubcategoryChanges || hasMerchantChanges;
  }, [
    onSaveCategoryMapping,
    onSaveSubcategoryMapping,
    onSaveMerchantMapping,
    findCategoryChanges,
    findSubcategoryChanges,
    hasMerchantChange,
  ]);

  // =========================================================================
  // Phase Navigation
  // =========================================================================

  /**
   * Proceed to merchant learning or save directly.
   */
  const proceedToMerchantOrSave = useCallback(async () => {
    if (hasMerchantChange && onSaveMerchantMapping) {
      setShowMerchantPrompt(true);
    } else {
      await onSave();
    }
  }, [hasMerchantChange, onSaveMerchantMapping, onSave]);

  /**
   * Proceed to subcategory learning or next phase.
   */
  const proceedToSubcategoryOrNext = useCallback(async () => {
    const changes = findSubcategoryChanges();
    if (changes.length > 0 && onSaveSubcategoryMapping) {
      setSubcategoryChanges(changes);
      setShowSubcategoryPrompt(true);
    } else {
      await proceedToMerchantOrSave();
    }
  }, [findSubcategoryChanges, onSaveSubcategoryMapping, proceedToMerchantOrSave]);

  // =========================================================================
  // Actions
  // =========================================================================

  /**
   * Start the learning flow.
   */
  const startLearningFlow = useCallback(async () => {
    const changes = findCategoryChanges();
    if (changes.length > 0 && onSaveCategoryMapping) {
      setCategoryChanges(changes);
      setShowCategoryPrompt(true);
    } else {
      await proceedToSubcategoryOrNext();
    }
  }, [findCategoryChanges, onSaveCategoryMapping, proceedToSubcategoryOrNext]);

  /**
   * Confirm category learning.
   */
  const confirmCategoryLearning = useCallback(async () => {
    if (onSaveCategoryMapping && categoryChanges.length > 0) {
      setIsSaving(true);
      try {
        for (const change of categoryChanges) {
          await onSaveCategoryMapping(change.itemName, change.newValue);
        }
        onShowToast?.('Category mappings saved');
      } catch (error) {
        console.error('Failed to save category mappings:', error);
      } finally {
        setIsSaving(false);
      }
    }
    setShowCategoryPrompt(false);
    setCategoryChanges([]);
    await proceedToSubcategoryOrNext();
  }, [categoryChanges, onSaveCategoryMapping, onShowToast, proceedToSubcategoryOrNext]);

  /**
   * Skip category learning.
   */
  const skipCategoryLearning = useCallback(async () => {
    setShowCategoryPrompt(false);
    setCategoryChanges([]);
    await proceedToSubcategoryOrNext();
  }, [proceedToSubcategoryOrNext]);

  /**
   * Confirm subcategory learning.
   */
  const confirmSubcategoryLearning = useCallback(async () => {
    if (onSaveSubcategoryMapping && subcategoryChanges.length > 0) {
      setIsSaving(true);
      try {
        for (const change of subcategoryChanges) {
          await onSaveSubcategoryMapping(change.itemName, change.newValue);
        }
        onShowToast?.('Subcategory mappings saved');
      } catch (error) {
        console.error('Failed to save subcategory mappings:', error);
      } finally {
        setIsSaving(false);
      }
    }
    setShowSubcategoryPrompt(false);
    setSubcategoryChanges([]);
    await proceedToMerchantOrSave();
  }, [subcategoryChanges, onSaveSubcategoryMapping, onShowToast, proceedToMerchantOrSave]);

  /**
   * Skip subcategory learning.
   */
  const skipSubcategoryLearning = useCallback(async () => {
    setShowSubcategoryPrompt(false);
    setSubcategoryChanges([]);
    await proceedToMerchantOrSave();
  }, [proceedToMerchantOrSave]);

  /**
   * Confirm merchant learning.
   */
  const confirmMerchantLearning = useCallback(async () => {
    if (onSaveMerchantMapping && merchant) {
      try {
        await onSaveMerchantMapping(merchant, alias || '');
        onCelebrate?.();
        onShowToast?.('Merchant mapping saved');
      } catch (error) {
        console.error('Failed to save merchant mapping:', error);
      }
    }
    setShowMerchantPrompt(false);
    await onSave();
  }, [merchant, alias, onSaveMerchantMapping, onCelebrate, onShowToast, onSave]);

  /**
   * Skip merchant learning.
   */
  const skipMerchantLearning = useCallback(async () => {
    setShowMerchantPrompt(false);
    await onSave();
  }, [onSave]);

  /**
   * Reset all learning state.
   */
  const reset = useCallback(() => {
    setShowCategoryPrompt(false);
    setShowSubcategoryPrompt(false);
    setShowMerchantPrompt(false);
    setCategoryChanges([]);
    setSubcategoryChanges([]);
    setIsSaving(false);
  }, []);

  // =========================================================================
  // Return
  // =========================================================================

  return {
    state: {
      showCategoryPrompt,
      showSubcategoryPrompt,
      showMerchantPrompt,
      categoryChanges,
      subcategoryChanges,
      isSaving,
    },
    actions: {
      startLearningFlow,
      confirmCategoryLearning,
      skipCategoryLearning,
      confirmSubcategoryLearning,
      skipSubcategoryLearning,
      confirmMerchantLearning,
      skipMerchantLearning,
      reset,
    },
    hasLearningOpportunities,
    hasMerchantChange,
  };
}

// ============================================================================
// Simplified Variant
// ============================================================================

/**
 * Check if a transaction has any learning opportunities.
 * Useful for showing indicators before entering edit mode.
 */
export function shouldShowLearningPrompt(
  currentItems: ItemState[],
  originalItems: ItemState[],
  currentAlias: string,
  originalAlias: string,
  merchant: string
): { category: boolean; subcategory: boolean; merchant: boolean } {
  // Check category changes
  const categoryChanges = currentItems.some((item, i) => {
    const original = originalItems[i];
    if (!original || !item.name) return false;
    return item.category && item.category !== original.category;
  });

  // Check subcategory changes
  const subcategoryChanges = currentItems.some((item, i) => {
    const original = originalItems[i];
    if (!original || !item.name) return false;
    return item.subcategory && item.subcategory !== original.subcategory;
  });

  // Check merchant alias change
  const merchantChange =
    !!merchant && currentAlias !== originalAlias && currentAlias.length > 0;

  return {
    category: categoryChanges,
    subcategory: subcategoryChanges,
    merchant: merchantChange,
  };
}
