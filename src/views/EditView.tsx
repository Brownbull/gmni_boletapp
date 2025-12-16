import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Trash2, Plus, Check, ChevronDown, ChevronUp, BookMarked, X, Camera, Loader2 } from 'lucide-react';
import { CategoryBadge } from '../components/CategoryBadge';
import { CategoryCombobox } from '../components/CategoryCombobox';
import { ImageViewer } from '../components/ImageViewer';
import { CategoryLearningPrompt } from '../components/CategoryLearningPrompt';
import { SubcategoryLearningPrompt } from '../components/SubcategoryLearningPrompt';
import { LearnMerchantDialog } from '../components/dialogs/LearnMerchantDialog';
import { LocationSelect } from '../components/LocationSelect';
import { StoreTypeSelector } from '../components/StoreTypeSelector';
import { AdvancedScanOptions } from '../components/AdvancedScanOptions';
import { celebrateSuccess } from '../utils/confetti';
import { StoreCategory, CategorySource, ItemCategory, MerchantSource } from '../types/transaction';
import { ReceiptType } from '../services/gemini';
import { SupportedCurrency } from '../services/userPreferencesService';
// Story 9.10: Pending scan types for visual indicator
import { PendingScan, UserCredits } from '../types/scan';
// Story 9.12: Category translations (AC #6)
import { translateStoreCategory } from '../utils/categoryTranslations';
import type { Language } from '../utils/translations';

/**
 * Local TransactionItem interface for EditView.
 * Story 9.2: Updated to use ItemCategory type for proper typing.
 */
interface TransactionItem {
    name: string;
    price: number;
    /** Story 9.2: Item category using ItemCategory type */
    category?: ItemCategory | string;
    subcategory?: string;
    categorySource?: CategorySource;
    /** Story 9.15: Source of subcategory assignment */
    subcategorySource?: CategorySource;
}

interface Transaction {
    id?: string;
    merchant: string;
    alias?: string;
    date: string;
    total: number;
    category: string;
    items: TransactionItem[];
    imageUrls?: string[];
    thumbnailUrl?: string;
    // Story 9.3: New v2.6.0 fields for display
    /** Purchase time in HH:mm format (e.g., "15:01") */
    time?: string;
    /** Country name from receipt */
    country?: string;
    /** City name from receipt */
    city?: string;
    /** ISO 4217 currency code (e.g., "GBP") */
    currency?: string;
    /** Document type: "receipt" | "invoice" | "ticket" */
    receiptType?: string;
    /** Version of prompt used for AI extraction */
    promptVersion?: string;
    /** Source of the merchant name (scan, learned, user) */
    merchantSource?: MerchantSource;
}

interface EditViewProps {
    currentTransaction: Transaction;
    editingItemIndex: number | null;
    distinctAliases: string[];
    theme: string;
    currency: string;
    /** Current language for translations (Story 9.15: category combobox) */
    language: Language;
    t: (key: string) => string;
    storeCategories: string[];
    formatCurrency: (amount: number, currency: string) => string;
    parseStrictNumber: (val: any) => number;
    onBack: () => void;
    onDelete: (id: string) => void;
    onSave: () => Promise<void>;
    onUpdateTransaction: (transaction: Transaction) => void;
    onSetEditingItemIndex: (index: number | null) => void;
    /** Optional: Save category mapping function from useCategoryMappings hook */
    onSaveMapping?: (item: string, category: StoreCategory, source?: 'user' | 'ai') => Promise<string>;
    /** Story 9.6: Optional save merchant mapping function from useMerchantMappings hook */
    onSaveMerchantMapping?: (originalMerchant: string, targetMerchant: string) => Promise<string>;
    /** Story 9.15: Optional save subcategory mapping function from useSubcategoryMappings hook */
    onSaveSubcategoryMapping?: (item: string, subcategory: string, source?: 'user' | 'ai') => Promise<string>;
    /** Optional: Show toast notification */
    onShowToast?: (text: string) => void;
    /** Story 9.9: Optional cancel handler for new transactions */
    onCancel?: () => void;
    /** Story 9.9: Scan-related props for unified transaction flow */
    scanImages?: string[];
    onAddPhoto?: () => void;
    onRemovePhoto?: (index: number) => void;
    onProcessScan?: () => Promise<void>;
    isAnalyzing?: boolean;
    scanError?: string | null;
    /** Story 9.8: Scan options - store type and currency */
    scanStoreType?: ReceiptType;
    onSetScanStoreType?: (type: ReceiptType) => void;
    scanCurrency?: SupportedCurrency;
    onSetScanCurrency?: (currency: SupportedCurrency) => void;
    /** Story 9.10: Pending scan for visual indicator (AC #5) */
    pendingScan?: PendingScan | null;
    /** Story 9.10: User credits for display and blocking (AC #6, #7) */
    userCredits?: UserCredits;
    /** Story 9.12: Language for category translations (AC #6) */
    lang?: Language;
}

export const EditView: React.FC<EditViewProps> = ({
    currentTransaction,
    editingItemIndex,
    distinctAliases,
    theme,
    currency,
    language,
    t,
    storeCategories,
    formatCurrency,
    parseStrictNumber,
    onBack,
    onDelete,
    onSave,
    onUpdateTransaction,
    onSetEditingItemIndex,
    onSaveMapping,
    onSaveMerchantMapping,
    onSaveSubcategoryMapping,
    onShowToast,
    onCancel,
    // Story 9.9: Scan-related props
    scanImages,
    onAddPhoto,
    onRemovePhoto,
    onProcessScan,
    isAnalyzing,
    scanError,
    // Story 9.8: Scan options
    scanStoreType,
    onSetScanStoreType,
    scanCurrency,
    onSetScanCurrency,
    // Story 9.10: Pending scan and credits
    pendingScan,
    userCredits,
    // Story 9.12: Language for translations
    lang = 'en',
}) => {
    const [showImageViewer, setShowImageViewer] = useState(false);
    // Story 9.3: Debug info section state (AC #5)
    const [showDebugInfo, setShowDebugInfo] = useState(false);
    // Story 9.9: Cancel confirmation dialog state
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    // Story 6.3: Category learning prompt state
    const [showLearningPrompt, setShowLearningPrompt] = useState(false);
    const [itemsToLearn, setItemsToLearn] = useState<Array<{ itemName: string; newGroup: string }>>([]);

    // Story 9.15: Subcategory learning prompt state
    const [showSubcategoryLearningPrompt, setShowSubcategoryLearningPrompt] = useState(false);
    const [subcategoriesToLearn, setSubcategoriesToLearn] = useState<Array<{ itemName: string; newSubcategory: string }>>([]);

    // Story 9.16: Loading state for learning prompts to prevent duplicate saves (AC #1, #2)
    const [savingMappings, setSavingMappings] = useState(false);

    // Story 9.6: Merchant learning prompt state
    const [showMerchantLearningPrompt, setShowMerchantLearningPrompt] = useState(false);
    // Track original alias on mount for detecting changes
    const originalAliasRef = useRef<string | null>(null);

    // Track original item groups and subcategories on mount for detecting changes
    // We learn: item name → item group (category field on item) AND item name → subcategory
    const originalItemGroupsRef = useRef<{
        items: Array<{ name: string; category: string; subcategory: string }>; // name, group, and subcategory for each item
        capturedForTransactionKey: string | null; // null = not captured yet
    }>({
        items: [],
        capturedForTransactionKey: null,
    });

    // Capture original item groups ONCE when transaction data first becomes available
    useEffect(() => {
        const hasData = currentTransaction.merchant || currentTransaction.items.length > 0;
        // Use transaction id, or for new transactions use 'new' as a key
        const transactionKey = currentTransaction.id || 'new';
        const alreadyCaptured = originalItemGroupsRef.current.capturedForTransactionKey === transactionKey;

        // Only capture ONCE per transaction (when key doesn't match)
        if (hasData && !alreadyCaptured) {
            originalItemGroupsRef.current = {
                items: currentTransaction.items.map(item => ({
                    name: item.name,
                    category: item.category || '',
                    subcategory: item.subcategory || ''
                })),
                capturedForTransactionKey: transactionKey,
            };
        }
    }, [currentTransaction.id, currentTransaction.items]);

    // Story 9.6: Capture original alias ONCE when transaction data first becomes available
    useEffect(() => {
        const hasData = currentTransaction.merchant || currentTransaction.alias;
        // Only capture ONCE when ref is null and we have data
        if (hasData && originalAliasRef.current === null) {
            originalAliasRef.current = currentTransaction.alias || '';
        }
    }, [currentTransaction.merchant, currentTransaction.alias]);

    // Story 9.9: Track initial transaction state for cancel confirmation
    const initialTransactionRef = useRef<Transaction | null>(null);
    useEffect(() => {
        // Capture initial state ONCE when component mounts or transaction ID changes
        const transactionKey = currentTransaction.id || 'new';
        if (!initialTransactionRef.current ||
            (initialTransactionRef.current.id || 'new') !== transactionKey) {
            initialTransactionRef.current = JSON.parse(JSON.stringify(currentTransaction));
        }
    }, [currentTransaction.id]);

    // Story 9.9: Check if transaction has changes from initial state
    const hasUnsavedChanges = useMemo(() => {
        if (!initialTransactionRef.current) return false;
        const initial = initialTransactionRef.current;
        const current = currentTransaction;

        // Compare key fields
        return (
            initial.merchant !== current.merchant ||
            initial.alias !== current.alias ||
            initial.total !== current.total ||
            initial.date !== current.date ||
            initial.time !== current.time ||
            initial.category !== current.category ||
            initial.country !== current.country ||
            initial.city !== current.city ||
            JSON.stringify(initial.items) !== JSON.stringify(current.items)
        );
    }, [currentTransaction]);

    // Story 9.9: Handle cancel button click
    // Story 9.10: Also show confirmation if a scan was processed (credit consumed)
    const handleCancelClick = () => {
        // Show confirmation if: has changes OR scan was processed (credit already used)
        const scanWasProcessed = pendingScan?.status === 'analyzed' || pendingScan?.status === 'error';
        if (hasUnsavedChanges || scanWasProcessed) {
            setShowCancelConfirm(true);
        } else {
            onCancel?.();
        }
    };

    // Story 9.9: Confirm cancel and discard changes
    const handleConfirmCancel = () => {
        setShowCancelConfirm(false);
        onCancel?.();
    };

    // Story 7.12: Theme-aware styling using CSS variables (AC #3, #8)
    const isDark = theme === 'dark';

    // Story 9.10 AC#5: Check if this is a returning pending scan with analyzed data
    const isReturningPendingScan = pendingScan?.status === 'analyzed' && pendingScan?.analyzedTransaction;
    // Story 9.10 AC#6, #7: Check if user has credits for scanning
    const hasCredits = (userCredits?.remaining ?? 0) > 0;

    // Card styling using CSS variables (AC #3)
    const cardStyle: React.CSSProperties = {
        backgroundColor: 'var(--surface)',
        borderColor: isDark ? '#334155' : '#e2e8f0',
    };

    // Input styling using CSS variables
    const inputStyle: React.CSSProperties = {
        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
        borderColor: isDark ? '#475569' : '#e2e8f0',
        color: 'var(--primary)',
    };

    const hasImages = currentTransaction.imageUrls && currentTransaction.imageUrls.length > 0;

    const handleAddItem = () => {
        onUpdateTransaction({
            ...currentTransaction,
            items: [...currentTransaction.items, { name: '', price: 0, category: 'Other', subcategory: '' }]
        });
        onSetEditingItemIndex(currentTransaction.items.length);
    };

    const handleUpdateItem = (index: number, field: string, value: any) => {
        const newItems = [...currentTransaction.items];
        newItems[index] = { ...newItems[index], [field]: field === 'price' ? parseStrictNumber(value) : value };
        onUpdateTransaction({ ...currentTransaction, items: newItems });
    };

    const handleDeleteItem = (index: number) => {
        const newItems = currentTransaction.items.filter((_, x) => x !== index);
        onUpdateTransaction({ ...currentTransaction, items: newItems });
        onSetEditingItemIndex(null);
    };

    // Story 6.3: Find ALL items whose group (category) has changed
    // Returns array of { itemName, newGroup } for all changed items
    const findAllChangedItemGroups = (): Array<{ itemName: string; newGroup: string }> => {
        const originalItems = originalItemGroupsRef.current.items;
        const currentItems = currentTransaction.items;
        const changedItems: Array<{ itemName: string; newGroup: string }> = [];

        // Check each item to see if its group changed
        for (let i = 0; i < currentItems.length; i++) {
            const currentItem = currentItems[i];
            const originalItem = originalItems[i];

            // Skip if no original item to compare (new item added)
            if (!originalItem) continue;

            // Skip if item has no name
            if (!currentItem.name) continue;

            // Check if group changed (and new group is not empty)
            const currentGroup = currentItem.category || '';
            const originalGroup = originalItem.category || '';

            if (currentGroup && currentGroup !== originalGroup) {
                changedItems.push({
                    itemName: currentItem.name,
                    newGroup: currentGroup
                });
            }
        }

        return changedItems;
    };

    // Story 9.15: Find ALL items whose subcategory has changed
    // Returns array of { itemName, newSubcategory } for all changed items
    const findAllChangedSubcategories = (): Array<{ itemName: string; newSubcategory: string }> => {
        const originalItems = originalItemGroupsRef.current.items;
        const currentItems = currentTransaction.items;
        const changedItems: Array<{ itemName: string; newSubcategory: string }> = [];

        // Check each item to see if its subcategory changed
        for (let i = 0; i < currentItems.length; i++) {
            const currentItem = currentItems[i];
            const originalItem = originalItems[i];

            // Skip if no original item to compare (new item added)
            if (!originalItem) continue;

            // Skip if item has no name
            if (!currentItem.name) continue;

            // Check if subcategory changed (and new subcategory is not empty)
            const currentSubcategory = currentItem.subcategory || '';
            const originalSubcategory = originalItem.subcategory || '';

            if (currentSubcategory && currentSubcategory !== originalSubcategory) {
                changedItems.push({
                    itemName: currentItem.name,
                    newSubcategory: currentSubcategory
                });
            }
        }

        return changedItems;
    };

    // Story 9.6: Check if merchant alias was changed
    const hasMerchantAliasChanged = (): boolean => {
        // We need a merchant name (from scan) and an alias change to trigger learning
        if (!currentTransaction.merchant) return false;
        const currentAlias = currentTransaction.alias || '';
        const originalAlias = originalAliasRef.current || '';
        // Only show prompt if alias changed AND is not empty
        return currentAlias !== originalAlias && currentAlias.length > 0;
    };

    // Story 9.6: Proceed to merchant learning check or save directly
    const proceedToMerchantLearningOrSave = async () => {
        // Check if merchant alias was changed
        if (hasMerchantAliasChanged() && onSaveMerchantMapping) {
            setShowMerchantLearningPrompt(true);
        } else {
            // No merchant changes, save directly
            await onSave();
        }
    };

    // Story 9.15: Proceed to subcategory learning check, then merchant learning, then save
    const proceedToSubcategoryLearningOrNext = async () => {
        const changedSubcategories = findAllChangedSubcategories();
        if (changedSubcategories.length > 0 && onSaveSubcategoryMapping) {
            setSubcategoriesToLearn(changedSubcategories);
            setShowSubcategoryLearningPrompt(true);
        } else {
            // No subcategory changes, proceed to merchant learning check
            await proceedToMerchantLearningOrSave();
        }
    };

    // Story 6.3 & 9.15: Handle save with category and subcategory learning prompts
    // Shows prompts BEFORE saving if changes detected, because onSave navigates away
    const handleSaveWithLearning = async () => {
        // Check if any item's group was changed
        const changedItems = findAllChangedItemGroups();

        // Only show category prompt if:
        // 1. At least one item's group was changed
        // 2. onSaveMapping function is available
        if (changedItems.length > 0 && onSaveMapping) {
            // Show category prompt first - subcategory prompt will follow after confirmation
            setItemsToLearn(changedItems);
            setShowLearningPrompt(true);
        } else {
            // No category changes, proceed to subcategory learning check
            await proceedToSubcategoryLearningOrNext();
        }
    };

    // Story 6.3: Handle learning prompt confirmation
    // Story 9.16: Added loading state to prevent duplicate saves (AC #1, #2)
    const handleLearnConfirm = async () => {
        if (onSaveMapping && itemsToLearn.length > 0) {
            setSavingMappings(true);
            try {
                // Save mappings for ALL changed items
                for (const item of itemsToLearn) {
                    await onSaveMapping(item.itemName, item.newGroup as StoreCategory, 'user');
                }
                // AC#5: Show success toast
                if (onShowToast) {
                    onShowToast(t('learnCategorySuccess'));
                }
            } catch (error) {
                console.error('Failed to save category mappings:', error);
            } finally {
                setSavingMappings(false);
            }
        }
        setShowLearningPrompt(false);
        setItemsToLearn([]);
        // After category learning, chain to subcategory learning check
        await proceedToSubcategoryLearningOrNext();
    };

    // Story 6.3: Handle learning prompt dismiss
    const handleLearnDismiss = async () => {
        setShowLearningPrompt(false);
        setItemsToLearn([]);
        // After category dialog dismissed, chain to subcategory learning check
        await proceedToSubcategoryLearningOrNext();
    };

    // Story 9.15: Handle subcategory learning prompt confirmation
    // Story 9.16: Added loading state to prevent duplicate saves (AC #1, #2)
    const handleSubcategoryLearnConfirm = async () => {
        if (onSaveSubcategoryMapping && subcategoriesToLearn.length > 0) {
            setSavingMappings(true);
            try {
                // Save subcategory mappings for ALL changed items
                for (const item of subcategoriesToLearn) {
                    await onSaveSubcategoryMapping(item.itemName, item.newSubcategory, 'user');
                }
                // Show success toast
                if (onShowToast) {
                    onShowToast(t('learnSubcategorySuccess'));
                }
            } catch (error) {
                console.error('Failed to save subcategory mappings:', error);
            } finally {
                setSavingMappings(false);
            }
        }
        setShowSubcategoryLearningPrompt(false);
        setSubcategoriesToLearn([]);
        // After subcategory learning, proceed to merchant learning check
        await proceedToMerchantLearningOrSave();
    };

    // Story 9.15: Handle subcategory learning prompt dismiss
    const handleSubcategoryLearnDismiss = async () => {
        setShowSubcategoryLearningPrompt(false);
        setSubcategoriesToLearn([]);
        // After subcategory dialog dismissed, proceed to merchant learning check
        await proceedToMerchantLearningOrSave();
    };

    // Story 9.6: Handle merchant learning prompt confirmation (AC#3)
    const handleLearnMerchantConfirm = async () => {
        if (onSaveMerchantMapping && currentTransaction.merchant) {
            try {
                // Save merchant mapping: original merchant → alias
                await onSaveMerchantMapping(
                    currentTransaction.merchant, // original merchant name from scan
                    currentTransaction.alias || '' // user's correction (alias)
                );
                // Celebrate with confetti! 🎉
                celebrateSuccess();
                // Show success toast
                if (onShowToast) {
                    onShowToast(t('learnMerchantSuccess'));
                }
            } catch (error) {
                console.error('Failed to save merchant mapping:', error);
            }
        }
        setShowMerchantLearningPrompt(false);
        // Now save the transaction
        await onSave();
    };

    // Story 9.6: Handle merchant learning prompt dismiss (AC#4)
    const handleLearnMerchantDismiss = async () => {
        setShowMerchantLearningPrompt(false);
        // Still save the transaction even if user skipped learning
        await onSave();
    };

    return (
        <div className="pb-24">
            {/* Header with consistent styling (AC #8) */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={onBack}
                    aria-label={t('back')}
                    className="min-w-11 min-h-11 flex items-center justify-center"
                    style={{ color: 'var(--primary)' }}
                >
                    <ArrowLeft size={24} strokeWidth={2} />
                </button>
                <h1 className="font-bold text-lg" style={{ color: 'var(--primary)' }}>
                    {currentTransaction.id ? t('editTrans') : t('newTrans')}
                </h1>
                {currentTransaction.id ? (
                    <button
                        onClick={() => onDelete(currentTransaction.id!)}
                        className="min-w-11 min-h-11 flex items-center justify-center"
                        style={{ color: 'var(--error)' }}
                        aria-label={t('delete')}
                    >
                        <Trash2 size={24} strokeWidth={2} />
                    </button>
                ) : onCancel ? (
                    // Story 9.9: Cancel button for new transactions
                    <button
                        onClick={handleCancelClick}
                        className="min-w-11 min-h-11 flex items-center justify-center"
                        style={{ color: 'var(--secondary)' }}
                        aria-label={t('cancel')}
                    >
                        <X size={24} strokeWidth={2} />
                    </button>
                ) : (
                    <div className="w-11" /> // Placeholder for alignment when no cancel handler
                )}
            </div>

            {/* Story 9.10 AC#5: Visual indicator for returning to pending scan */}
            {isReturningPendingScan && !currentTransaction.id && (
                <div
                    className="p-3 rounded-lg mb-4 flex items-center gap-2"
                    style={{
                        backgroundColor: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                        borderLeft: '4px solid var(--accent)',
                    }}
                >
                    <Camera size={18} style={{ color: 'var(--accent)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                        {t('returningToPendingScan')}
                    </span>
                </div>
            )}

            {/* Story 9.10 AC#6: Credit display for new transactions */}
            {!currentTransaction.id && userCredits && (
                <div
                    className="flex items-center justify-end gap-2 mb-2 text-xs"
                    style={{ color: hasCredits ? 'var(--secondary)' : 'var(--error)' }}
                >
                    <span>
                        {t('creditsRemaining')}: {userCredits.remaining}
                    </span>
                </div>
            )}

            {/* Story 9.9: Scan Section - Only for new transactions without photos */}
            {!currentTransaction.id && onAddPhoto && (
                <div className="mb-4">
                    {/* Show "Scan Receipt" button only when no photos exist */}
                    {!hasImages && (!scanImages || scanImages.length === 0) && (
                        <button
                            onClick={onAddPhoto}
                            className="w-full p-6 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors"
                            style={{
                                borderColor: 'var(--accent)',
                                backgroundColor: isDark ? 'rgba(96, 165, 250, 0.05)' : 'rgba(59, 130, 246, 0.05)',
                                color: 'var(--accent)',
                            }}
                            aria-label={t('scanReceipt')}
                        >
                            <Camera size={32} strokeWidth={1.5} />
                            <span className="font-bold">{t('scanReceipt')}</span>
                            <span className="text-sm opacity-70" style={{ color: 'var(--secondary)' }}>
                                {t('tapToScan')}
                            </span>
                        </button>
                    )}

                    {/* Show scan images grid when photos have been added */}
                    {scanImages && scanImages.length > 0 && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                {scanImages.map((img, i) => (
                                    <div key={i} className="relative">
                                        <img
                                            src={img}
                                            alt={`Scan ${i + 1}`}
                                            className="w-full h-24 object-cover rounded-lg"
                                        />
                                        {onRemovePhoto && (
                                            <button
                                                onClick={() => onRemovePhoto(i)}
                                                className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center bg-red-500 text-white"
                                                aria-label={`Remove photo ${i + 1}`}
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Add Photo button */}
                            <button
                                onClick={onAddPhoto}
                                className="w-full py-2 border-2 rounded-lg font-medium flex items-center justify-center gap-2"
                                style={{
                                    borderColor: 'var(--accent)',
                                    color: 'var(--accent)',
                                    backgroundColor: 'transparent',
                                }}
                            >
                                <Plus size={18} />
                                {t('addPhoto')}
                            </button>

                            {/* Story 9.8 AC#1: Store Type Quick-Select Labels */}
                            {onSetScanStoreType && (
                                <StoreTypeSelector
                                    selected={scanStoreType || 'auto'}
                                    onSelect={onSetScanStoreType}
                                    t={t}
                                    theme={theme as 'light' | 'dark'}
                                />
                            )}

                            {/* Story 9.8 AC#2: Advanced Options with Currency Dropdown */}
                            {onSetScanCurrency && scanCurrency && (
                                <AdvancedScanOptions
                                    currency={scanCurrency}
                                    onCurrencyChange={onSetScanCurrency}
                                    t={t}
                                    theme={theme as 'light' | 'dark'}
                                />
                            )}

                            {/* Process Scan button - Story 9.10 AC#7: Disabled when no credits */}
                            {onProcessScan && (
                                <button
                                    onClick={onProcessScan}
                                    disabled={isAnalyzing || !hasCredits}
                                    className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-opacity"
                                    style={{
                                        backgroundColor: hasCredits ? 'var(--accent)' : 'var(--secondary)',
                                        opacity: (isAnalyzing || !hasCredits) ? 0.7 : 1,
                                        cursor: hasCredits ? 'pointer' : 'not-allowed',
                                    }}
                                    title={!hasCredits ? t('noCreditsMessage') : undefined}
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            Processing...
                                        </>
                                    ) : !hasCredits ? (
                                        <>
                                            <Camera size={20} />
                                            {t('noCreditsButton')}
                                        </>
                                    ) : (
                                        <>
                                            <Camera size={20} />
                                            {t('processScan')}
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Scan error message */}
                            {scanError && (
                                <div className="text-center text-sm" style={{ color: 'var(--error)' }}>
                                    {scanError}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Total amount display with accent gradient (Story 9.3: AC #3 - currency prefix) */}
            <div
                className="p-6 rounded-xl mb-4 text-center text-white"
                style={{ background: 'linear-gradient(135deg, var(--accent), #6366f1)' }}
            >
                <div className="text-sm opacity-80">{t('total')}</div>
                <div className="flex items-center justify-center gap-2">
                    {/* Story 9.3 AC #3: Show currency code if available */}
                    {currentTransaction.currency && (
                        <span className="text-2xl font-bold opacity-90">{currentTransaction.currency}</span>
                    )}
                    <input
                        type="number"
                        value={currentTransaction.total}
                        onChange={e => onUpdateTransaction({
                            ...currentTransaction,
                            total: parseStrictNumber(e.target.value)
                        })}
                        className="bg-transparent text-3xl font-bold text-center outline-none text-white"
                        style={{ width: 'auto', minWidth: '80px', maxWidth: '200px' }}
                    />
                </div>
            </div>

            {/* Receipt Image Thumbnail */}
            {(currentTransaction.thumbnailUrl || hasImages) && (
                <div className="p-4 rounded-xl border mb-4" style={cardStyle}>
                    <button
                        onClick={() => setShowImageViewer(true)}
                        className="block mx-auto"
                        aria-label="View receipt image"
                    >
                        <img
                            src={currentTransaction.thumbnailUrl || currentTransaction.imageUrls?.[0]}
                            alt="Receipt thumbnail"
                            className="w-20 h-24 object-cover rounded-lg border-2 transition-colors cursor-pointer"
                            style={{ borderColor: isDark ? '#475569' : '#e2e8f0' }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = isDark ? '#475569' : '#e2e8f0'; }}
                        />
                    </button>
                </div>
            )}

            {/* ImageViewer Modal */}
            {showImageViewer && hasImages && (
                <ImageViewer
                    images={currentTransaction.imageUrls!}
                    merchantName={currentTransaction.merchant}
                    onClose={() => setShowImageViewer(false)}
                />
            )}

            {/* Form fields card (AC #3) */}
            <div className="p-4 rounded-xl border space-y-3 mb-4" style={cardStyle}>
                {/* Story 9.9: Merchant - Read-only field showing raw AI extraction with label */}
                <div>
                    <label
                        className="block text-xs font-medium mb-1"
                        style={{ color: 'var(--secondary)' }}
                    >
                        {t('merchantFromScan')}
                    </label>
                    <div
                        className="w-full p-2 border rounded-lg text-sm truncate"
                        style={{
                            backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                            borderColor: isDark ? '#334155' : '#e2e8f0',
                            color: 'var(--secondary)',
                        }}
                        title={currentTransaction.merchant}
                    >
                        {currentTransaction.merchant || '—'}
                    </div>
                </div>
                {/* Story 9.9: Alias - Editable field for user-friendly name with label */}
                <div>
                    <label
                        className="block text-xs font-medium mb-1"
                        style={{ color: 'var(--secondary)' }}
                    >
                        {t('displayName')}
                    </label>
                    <div className="relative">
                        <input
                            className="w-full p-2 border rounded-lg pr-20"
                            style={inputStyle}
                            placeholder={t('alias')}
                            list="alias-list"
                            value={currentTransaction.alias || ''}
                            onChange={e => onUpdateTransaction({ ...currentTransaction, alias: e.target.value })}
                        />
                        {currentTransaction.merchantSource === 'learned' && (
                            <span
                                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200 text-xs"
                                title={t('learnedMerchantTooltip')}
                                aria-label={t('learnedMerchantTooltip')}
                            >
                                <BookMarked size={12} />
                                {t('learnedMerchant')}
                            </span>
                        )}
                    </div>
                </div>
                <datalist id="alias-list">
                    {distinctAliases.map((a, i) => (
                        <option key={i} value={a} />
                    ))}
                </datalist>

                {/* Story 9.3 AC #1: Date and time - stacked on mobile for better fit */}
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        type="date"
                        className="flex-1 min-w-[140px] p-2 border rounded-lg"
                        style={inputStyle}
                        value={currentTransaction.date}
                        onChange={e => onUpdateTransaction({ ...currentTransaction, date: e.target.value })}
                    />
                    {/* Editable time input (AC #1) */}
                    <input
                        type="time"
                        className="w-[100px] p-2 border rounded-lg text-sm"
                        style={inputStyle}
                        value={currentTransaction.time || ''}
                        onChange={e => onUpdateTransaction({ ...currentTransaction, time: e.target.value })}
                    />
                    {/* Story 9.3 AC #4: Receipt type badge (only for non-receipt types) */}
                    {currentTransaction.receiptType && currentTransaction.receiptType !== 'receipt' && (
                        <span
                            className="text-xs px-2 py-1 rounded-md bg-amber-100 text-amber-700 border border-amber-200 uppercase font-medium flex-shrink-0"
                            aria-label={`Document type: ${currentTransaction.receiptType}`}
                        >
                            {currentTransaction.receiptType}
                        </span>
                    )}
                </div>

                {/* Story 9.3 AC #2: Location dropdowns (City, Country) */}
                <LocationSelect
                    country={currentTransaction.country || ''}
                    city={currentTransaction.city || ''}
                    onCountryChange={country => onUpdateTransaction({ ...currentTransaction, country })}
                    onCityChange={city => onUpdateTransaction({ ...currentTransaction, city })}
                    inputStyle={inputStyle}
                />

                {/* Story 9.12 AC #6: Translated category dropdown - shows translated, stores English */}
                <select
                    className="w-full p-2 border rounded-lg"
                    style={inputStyle}
                    value={currentTransaction.category}
                    onChange={e => onUpdateTransaction({ ...currentTransaction, category: e.target.value })}
                >
                    {storeCategories.map(c => (
                        <option key={c} value={c}>{translateStoreCategory(c, lang)}</option>
                    ))}
                </select>
            </div>

            {/* Items card with consistent styling (AC #3) */}
            <div className="p-4 rounded-xl border mb-4" style={cardStyle}>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold" style={{ color: 'var(--primary)' }}>{t('items')}</h3>
                    <button
                        onClick={handleAddItem}
                        className="min-w-11 min-h-11 px-3 py-2 rounded-lg flex items-center justify-center"
                        style={{
                            backgroundColor: isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                            color: 'var(--accent)',
                        }}
                        aria-label={t('addItem')}
                    >
                        <Plus size={20} strokeWidth={2} />
                    </button>
                </div>
                <div className="space-y-3">
                    {currentTransaction.items.map((item, i) => (
                        <div
                            key={i}
                            className="border-b pb-2 last:border-0"
                            style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}
                        >
                            {editingItemIndex === i ? (
                                <div className="space-y-2">
                                    <input
                                        className="w-full p-2 border rounded-lg text-sm"
                                        style={inputStyle}
                                        value={item.name}
                                        onChange={e => handleUpdateItem(i, 'name', e.target.value)}
                                        placeholder={t('itemName')}
                                    />
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded-lg text-sm"
                                        style={inputStyle}
                                        value={item.price}
                                        onChange={e => handleUpdateItem(i, 'price', e.target.value)}
                                        placeholder={t('price')}
                                    />
                                    {/* Story 9.15: Searchable category combobox (AC #2.1) */}
                                    <CategoryCombobox
                                        value={item.category || ''}
                                        onChange={(value) => handleUpdateItem(i, 'category', value)}
                                        language={language}
                                        theme={theme as 'light' | 'dark'}
                                        placeholder={t('itemCat')}
                                        ariaLabel={t('itemCat')}
                                    />
                                    {/* Story 9.15: Subcategory input field (AC #2) */}
                                    <input
                                        className="w-full p-2 border rounded-lg text-sm"
                                        style={inputStyle}
                                        value={item.subcategory || ''}
                                        onChange={e => handleUpdateItem(i, 'subcategory', e.target.value)}
                                        placeholder={t('itemSubcat')}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleDeleteItem(i)}
                                            className="min-w-11 min-h-11 p-2 rounded-lg flex items-center justify-center transition-colors"
                                            style={{
                                                color: 'var(--error)',
                                                backgroundColor: isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            }}
                                            aria-label={t('deleteItem')}
                                        >
                                            <Trash2 size={20} strokeWidth={2} />
                                        </button>
                                        <button
                                            onClick={() => onSetEditingItemIndex(null)}
                                            className="min-w-11 min-h-11 p-2 rounded-lg flex items-center justify-center transition-colors"
                                            style={{
                                                color: 'var(--accent)',
                                                backgroundColor: isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                            }}
                                            aria-label={t('confirmItem')}
                                        >
                                            <Check size={20} strokeWidth={2} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => onSetEditingItemIndex(i)}
                                    className="flex justify-between items-start cursor-pointer py-1"
                                >
                                    <div>
                                        <div className="font-medium text-sm" style={{ color: 'var(--primary)' }}>{item.name}</div>
                                        <CategoryBadge
                                            category={item.category || 'Other'}
                                            subcategory={item.subcategory}
                                            categorySource={item.categorySource}
                                            lang={lang}
                                        />
                                    </div>
                                    <div className="font-mono text-sm" style={{ color: 'var(--primary)' }}>
                                        {formatCurrency(item.price, currency)}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Story 9.3 AC #5: Collapsible Debug Info section */}
            {(currentTransaction.promptVersion || currentTransaction.id) && (
                <div className="p-4 rounded-xl border mb-4" style={cardStyle}>
                    <button
                        onClick={() => setShowDebugInfo(!showDebugInfo)}
                        className="w-full flex items-center justify-between text-sm"
                        style={{ color: 'var(--secondary)' }}
                        aria-expanded={showDebugInfo}
                        aria-controls="debug-info-content"
                    >
                        <span className="font-medium">{t('debugInfo')}</span>
                        {showDebugInfo ? (
                            <ChevronUp size={18} />
                        ) : (
                            <ChevronDown size={18} />
                        )}
                    </button>
                    {showDebugInfo && (
                        <div
                            id="debug-info-content"
                            className="mt-3 pt-3 border-t space-y-1 text-xs font-mono"
                            style={{
                                borderColor: isDark ? '#334155' : '#e2e8f0',
                                color: 'var(--secondary)',
                            }}
                        >
                            {currentTransaction.promptVersion && (
                                <div className="flex justify-between">
                                    <span>Prompt Version:</span>
                                    <span>{currentTransaction.promptVersion}</span>
                                </div>
                            )}
                            {currentTransaction.id && (
                                <div className="flex justify-between">
                                    <span>Transaction ID:</span>
                                    <span className="truncate max-w-[150px]" title={currentTransaction.id}>
                                        {currentTransaction.id}
                                    </span>
                                </div>
                            )}
                            {currentTransaction.merchantSource && (
                                <div className="flex justify-between">
                                    <span>Merchant Source:</span>
                                    <span>{currentTransaction.merchantSource}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Save button with accent color */}
            <button
                onClick={handleSaveWithLearning}
                className="w-full py-3 rounded-xl font-bold shadow-lg text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
                style={{ backgroundColor: 'var(--accent)' }}
            >
                {t('save')}
            </button>

            {/* Story 6.3: Category Learning Prompt Modal */}
            {/* Story 9.16: Added isLoading prop to prevent duplicate saves (AC #1, #2, #4) */}
            <CategoryLearningPrompt
                isOpen={showLearningPrompt}
                items={itemsToLearn}
                onConfirm={handleLearnConfirm}
                onClose={handleLearnDismiss}
                t={t}
                theme={theme as 'light' | 'dark'}
                isLoading={savingMappings}
            />

            {/* Story 9.15: Subcategory Learning Prompt Modal */}
            {/* Story 9.16: Added isLoading prop to prevent duplicate saves (AC #1, #2, #4) */}
            <SubcategoryLearningPrompt
                isOpen={showSubcategoryLearningPrompt}
                items={subcategoriesToLearn}
                onConfirm={handleSubcategoryLearnConfirm}
                onClose={handleSubcategoryLearnDismiss}
                t={t}
                theme={theme as 'light' | 'dark'}
                isLoading={savingMappings}
            />

            {/* Story 9.6: Merchant Learning Prompt Modal */}
            <LearnMerchantDialog
                isOpen={showMerchantLearningPrompt}
                originalMerchant={currentTransaction.merchant}
                correctedMerchant={currentTransaction.alias || ''}
                onConfirm={handleLearnMerchantConfirm}
                onClose={handleLearnMerchantDismiss}
                t={t}
                theme={theme as 'light' | 'dark'}
            />

            {/* Story 9.9: Cancel Confirmation Dialog */}
            {/* Story 9.10: Enhanced with credit warning when scan was processed */}
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
                        <h2
                            className="text-lg font-bold mb-2"
                            style={{ color: 'var(--primary)' }}
                        >
                            {t('discardChanges')}
                        </h2>
                        {/* Story 9.10: Credit warning when scan was processed */}
                        {(pendingScan?.status === 'analyzed' || pendingScan?.status === 'error') && (
                            <div
                                className="p-3 rounded-lg mb-4 flex items-start gap-2"
                                style={{
                                    backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.1)',
                                    border: '1px solid',
                                    borderColor: isDark ? 'rgba(251, 191, 36, 0.4)' : 'rgba(251, 191, 36, 0.5)',
                                }}
                            >
                                <span className="text-amber-500 text-lg">⚠️</span>
                                <span
                                    className="text-sm font-medium"
                                    style={{ color: isDark ? '#fbbf24' : '#d97706' }}
                                >
                                    {t('creditAlreadyUsed')}
                                </span>
                            </div>
                        )}
                        <p
                            className="text-sm mb-6"
                            style={{ color: 'var(--secondary)' }}
                        >
                            {t('discardChangesMessage')}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelConfirm(false)}
                                className="flex-1 py-2 px-4 rounded-lg border font-medium"
                                style={{
                                    borderColor: isDark ? '#475569' : '#e2e8f0',
                                    color: 'var(--primary)',
                                    backgroundColor: 'transparent',
                                }}
                            >
                                {t('back')}
                            </button>
                            <button
                                onClick={handleConfirmCancel}
                                className="flex-1 py-2 px-4 rounded-lg font-medium text-white"
                                style={{ backgroundColor: 'var(--error)' }}
                            >
                                {t('confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
