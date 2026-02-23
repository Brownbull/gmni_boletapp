import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Trash2, Plus, Check, ChevronDown, ChevronUp, BookMarked, Camera, RefreshCw } from 'lucide-react';
// Profile components removed - header simplified to match mockup
import { CategoryBadge } from '@features/transaction-editor/components/CategoryBadge';
import { CategoryCombobox } from '@features/transaction-editor/components/CategoryCombobox';
import { ImageViewer } from '@/components/ImageViewer';
import { CategoryLearningPrompt } from '@/components/CategoryLearningPrompt';
import { SubcategoryLearningPrompt } from '@/components/SubcategoryLearningPrompt';
import { LearnMerchantDialog } from '@/components/dialogs/LearnMerchantDialog';
import { LocationSelect } from '@/components/LocationSelect';
import { DateTimeTag } from '@features/transaction-editor/components/DateTimeTag';
import { CurrencyTag } from '@features/transaction-editor/components/CurrencyTag';
import { DEFAULT_CURRENCY } from '@/utils/currency';
import { StoreCategory } from '@/types/transaction';
import { ReceiptType } from '@/services/gemini';
import { SupportedCurrency } from '@/services/userPreferencesService';
// Story 9.10: Pending scan types for visual indicator
import { PendingScan, UserCredits } from '@/types/scan';
// Story 9.12: Language type for translations
import type { Language } from '@/utils/translations';
// Story 14.22: Category translations for item groups
import { translateItemCategoryGroup, getItemCategoryGroupEmoji } from '@/utils/categoryTranslations';
// Story 14.22: Category colors and emoji for thumbnail badge
import { getCategoryPillColors, getItemCategoryGroup, getItemGroupColors } from '@/config/categoryColors';
import { getCategoryEmoji } from '@/utils/categoryEmoji';
// Story 14.22: Normalize item categories for consistent group mapping
import { normalizeItemCategory } from '@/utils/categoryNormalizer';
// Story 14.38: Item view toggle
import { ItemViewToggle, type ItemViewMode } from '@/components/items/ItemViewToggle';
// Story 11.3: Animated item reveal
import { useStaggeredReveal } from '@/hooks/useStaggeredReveal';
import { AnimatedItem } from '@/components/AnimatedItem';
// Story 14.15: ScanStatusIndicator removed - replaced by ScanOverlay in App.tsx
// Story 15b-2a: Types and pure helpers extracted to editViewHelpers.ts
import { TransactionItem, Transaction } from './editViewHelpers';
// Story 15b-2a: Learning flow hook
import { useEditViewLearningFlow } from './useEditViewLearningFlow';
// Story 15b-2a: Sub-components
import { EditViewHeader } from './EditViewHeader';
import { EditViewScanSection } from './EditViewScanSection';
import { EditViewDialogs } from './EditViewDialogs';

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
    parseStrictNumber: (val: unknown) => number;
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
    /** Story 11.3: Animate items on initial load */
    animateItems?: boolean;
    /** Story 12.3: Batch context for editing from batch review queue */
    batchContext?: { index: number; total: number } | null;
    /** Story 14.15b: Re-scan callback for existing transactions with images */
    onRescan?: () => Promise<void>;
    /** Story 14.15b: Re-scan loading state */
    isRescanning?: boolean;
    /** Story 14.15b: User name for profile avatar */
    userName?: string;
    /** Story 14.15b: User email for profile dropdown */
    userEmail?: string;
    /** Story 14.15b: Navigation handler for profile menu */
    onNavigateToView?: (view: string) => void;
    /** Story 14.15b: Handler when settings is clicked */
    onMenuClick?: () => void;
    /** Story 14.15b: Handler when credit badges are clicked */
    onCreditInfoClick?: () => void;
    /** Story 14.15b: Super credits for display */
    superCredits?: number;
    /** Story 14.15b: Normal scan credits for display */
    scanCredits?: number;
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
    scanError: _scanError, // Story 14.15: Error display moved to ScanOverlay in App.tsx
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
    // Story 11.3: Animate items on initial load
    animateItems = false,
    // Story 12.3: Batch context for editing from batch review
    batchContext = null,
    // Story 14.15b: Re-scan feature
    onRescan,
    isRescanning = false,
    // Story 14.15b: Credits display in header
    // userName, userEmail, onNavigateToView, onMenuClick removed - no longer used in simplified header
    onCreditInfoClick,
    superCredits,
    scanCredits,
}) => {
    // Use transaction's currency if available, otherwise fall back to user's default currency
    // This ensures GBP receipts display in £ even if user's default is CLP
    const displayCurrency = currentTransaction?.currency || currency;

    const [showImageViewer, setShowImageViewer] = useState(false);
    // Story 9.3: Debug info section state (AC #5)
    const [showDebugInfo, setShowDebugInfo] = useState(false);
    // Story 14.15b: Profile dropdown removed - header simplified to match mockup
    // Story 9.9: Cancel confirmation dialog state
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    // Story 14.15b: Re-scan confirmation dialog state
    const [showRescanConfirm, setShowRescanConfirm] = useState(false);
    // Story 14.22: Delete confirmation dialog state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    // Story 14.22: Editable title state
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    // Story 14.22: Category dropdown state
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    // Story 14.22: Collapsed item groups state (all expanded by default)
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    // Story 14.38: Item view mode toggle (grouped vs original order)
    const [itemViewMode, setItemViewMode] = useState<ItemViewMode>('grouped');

    // Story 14.15: Scan state management moved to App.tsx with ScanOverlay
    // The old ScanStatusIndicator and useScanState hook in EditView have been removed.
    // Scan progress, errors, and completion are now handled by the ScanOverlay component.

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

    // Story 15b-2a: Learning flow hook encapsulates the 3-stage learning chain
    const {
        showLearningPrompt, itemsToLearn, handleLearnConfirm, handleLearnDismiss,
        showSubcategoryLearningPrompt, subcategoriesToLearn, handleSubcategoryLearnConfirm, handleSubcategoryLearnDismiss,
        showMerchantLearningPrompt, handleLearnMerchantConfirm, handleLearnMerchantDismiss,
        savingMappings, handleSaveWithLearning,
    } = useEditViewLearningFlow({
        onSave, onSaveMapping, onSaveMerchantMapping, onSaveSubcategoryMapping,
        onShowToast, t, currentTransaction, originalItemGroupsRef, originalAliasRef,
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
                    category: (item.category as string) || '',
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

    // Story 11.3: Staggered reveal for items (AC #1, #2, #5)
    // Track if animation has already played to prevent re-animation on edits
    const animationPlayedRef = useRef(false);
    const shouldAnimate = animateItems && !animationPlayedRef.current;
    const { visibleItems: animatedItems, isComplete: animationComplete } = useStaggeredReveal(
        shouldAnimate ? currentTransaction.items : [],
        {
            staggerMs: 100,      // AC #2: 100ms stagger between items
            initialDelayMs: 300, // AC #4: Header appears first
            maxDurationMs: 2500, // AC #5: Complete within ~2.5 seconds
        }
    );

    // Mark animation as played once complete
    useEffect(() => {
        if (animationComplete && shouldAnimate) {
            animationPlayedRef.current = true;
        }
    }, [animationComplete, shouldAnimate]);

    // Story 14.22: Group items by item category GROUP (not individual category)
    // Maps item.category -> normalized English -> item group (e.g., "Frutas y Verduras" -> "Produce" -> "food-fresh")
    const itemsByGroup = useMemo(() => {
        const groups: Record<string, Array<{ item: TransactionItem; originalIndex: number }>> = {};

        currentTransaction.items.forEach((item, index) => {
            // Normalize the item category to English, then get its group
            const normalizedCategory = normalizeItemCategory((item.category as string) || 'Other');
            const groupKey = getItemCategoryGroup(normalizedCategory);

            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push({ item, originalIndex: index });
        });

        // Sort groups alphabetically, and sort items within each group by price descending
        return Object.entries(groups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([groupKey, items]) => ({
                groupKey, // e.g., "food-fresh", "food-packaged", "other-item"
                items: items.sort((a, b) => b.item.price - a.item.price), // Sort by price descending
                total: items.reduce((sum, { item }) => sum + item.price, 0),
            }));
    }, [currentTransaction.items]);

    // Story 14.22: Toggle group collapse state
    const toggleGroupCollapse = (category: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
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

    const handleUpdateItem = (index: number, field: string, value: string | number) => {
        const newItems = [...currentTransaction.items];
        newItems[index] = { ...newItems[index], [field]: field === 'price' ? parseStrictNumber(value) : value };
        onUpdateTransaction({ ...currentTransaction, items: newItems });
    };

    const handleDeleteItem = (index: number) => {
        const newItems = currentTransaction.items.filter((_, x) => x !== index);
        onUpdateTransaction({ ...currentTransaction, items: newItems });
        onSetEditingItemIndex(null);
    };

    // Story 14.15b: Handle re-scan button click - show confirmation first
    const handleRescanClick = () => {
        if (!hasCredits) {
            onShowToast?.(t('noCreditsMessage'));
            return;
        }
        setShowRescanConfirm(true);
    };

    // Story 14.15b: Confirm and execute re-scan
    const handleConfirmRescan = async () => {
        setShowRescanConfirm(false);
        await onRescan?.();
    };

    // Story 14.15b: Profile navigation removed - header simplified to match mockup

    return (
        <div
            className="relative"
            style={{
                paddingBottom: 'calc(6rem + var(--safe-bottom, 0px))',
            }}
        >
            {/* Story 15b-2a: Header extracted to EditViewHeader */}
            <EditViewHeader
                onBack={onBack}
                t={t}
                batchContext={batchContext}
                superCredits={superCredits}
                scanCredits={scanCredits}
                onCreditInfoClick={onCreditInfoClick}
                currentTransaction={currentTransaction}
                handleCancelClick={handleCancelClick}
                onCancel={onCancel}
                setShowDeleteConfirm={setShowDeleteConfirm}
            />

            {/* Main content with edge spacing - reduced padding for more width */}
            <div className="px-2 pb-4">

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

            {/* Story 9.9: Scan Section - Only for new transactions without photos */}
            {/* Story 15b-2a: Scan section extracted to EditViewScanSection */}
            {!currentTransaction.id && onAddPhoto && (
                <EditViewScanSection
                    currentTransaction={currentTransaction}
                    onAddPhoto={onAddPhoto}
                    scanImages={scanImages}
                    onRemovePhoto={onRemovePhoto}
                    scanStoreType={scanStoreType}
                    onSetScanStoreType={onSetScanStoreType}
                    scanCurrency={scanCurrency}
                    onSetScanCurrency={onSetScanCurrency}
                    onProcessScan={onProcessScan}
                    isAnalyzing={isAnalyzing}
                    hasCredits={hasCredits}
                    isDark={isDark}
                    t={t}
                    theme={theme}
                />
            )}

            {/* ImageViewer Modal */}
            {showImageViewer && hasImages && (
                <ImageViewer
                    images={currentTransaction.imageUrls!}
                    merchantName={currentTransaction.merchant}
                    onClose={() => setShowImageViewer(false)}
                />
            )}

            {/* Story 14.22: Main card container matching mockup layout - reduced padding */}
            <div
                className="rounded-2xl p-3 mb-4"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    border: '1px solid var(--border-light)',
                }}
            >
                {/* Header: Merchant name + Category + Location + Thumbnail */}
                <div className="flex justify-between items-start gap-4 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
                    {/* Left: Metadata */}
                    <div className="flex-1 min-w-0">
                        {/* Merchant/Alias name as editable title */}
                        {isEditingTitle ? (
                            <input
                                ref={titleInputRef}
                                type="text"
                                value={currentTransaction.alias || ''}
                                onChange={e => onUpdateTransaction({ ...currentTransaction, alias: e.target.value })}
                                onBlur={() => setIsEditingTitle(false)}
                                onKeyDown={e => e.key === 'Enter' && setIsEditingTitle(false)}
                                placeholder={currentTransaction.merchant || t('merchantPlaceholder')}
                                className="text-xl font-bold w-full bg-transparent border-none outline-none mb-2"
                                style={{ color: 'var(--text-primary)' }}
                                autoFocus
                            />
                        ) : (
                            <button
                                onClick={() => {
                                    setIsEditingTitle(true);
                                    setTimeout(() => titleInputRef.current?.focus(), 0);
                                }}
                                className="flex items-center gap-2 mb-2 text-left w-full group"
                            >
                                <span
                                    className="text-xl font-bold truncate"
                                    style={{ color: 'var(--text-primary)' }}
                                    title={currentTransaction.alias || currentTransaction.merchant || t('newTransaction')}
                                >
                                    {currentTransaction.alias || currentTransaction.merchant || t('newTransaction')}
                                </span>
                                {/* Pencil icon */}
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="var(--text-tertiary)"
                                    strokeWidth="2"
                                    className="flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                                >
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                                </svg>
                            </button>
                        )}

                        {/* Category badge (clickable) + Learned badge */}
                        <div className="flex flex-wrap items-center gap-2 mb-2 relative">
                            {/* Store category badge - clickable to show dropdown */}
                            <button
                                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                className="cursor-pointer"
                            >
                                <CategoryBadge
                                    category={currentTransaction.category || 'Other'}
                                    lang={lang}
                                    showIcon
                                    maxWidth="120px"
                                />
                            </button>
                            {/* Category dropdown */}
                            {showCategoryDropdown && (
                                <div
                                    className="fixed left-3 right-3 mt-1 rounded-xl shadow-lg z-50 overflow-hidden max-h-80 overflow-y-auto"
                                    style={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-light)',
                                        top: 'auto',
                                    }}
                                >
                                    <div className="flex flex-wrap gap-2 p-3">
                                        {storeCategories.map((cat) => (
                                            <button
                                                key={cat}
                                                className="rounded-full transition-colors"
                                                style={{
                                                    outline: currentTransaction.category === cat ? '2px solid var(--primary)' : 'none',
                                                    outlineOffset: '1px',
                                                }}
                                                onClick={() => {
                                                    onUpdateTransaction({ ...currentTransaction, category: cat });
                                                    setShowCategoryDropdown(false);
                                                }}
                                            >
                                                <CategoryBadge category={cat} lang={lang} showIcon />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Learned merchant badge */}
                            {currentTransaction.merchantSource === 'learned' && (
                                <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                                    style={{
                                        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#dbeafe',
                                        color: isDark ? '#93c5fd' : '#1d4ed8',
                                        border: '1px solid',
                                        borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#93c5fd',
                                    }}
                                    title={t('learnedMerchantTooltip')}
                                >
                                    <BookMarked size={10} />
                                    {t('learnedMerchant')}
                                </span>
                            )}
                        </div>

                        {/* Location tag */}
                        <LocationSelect
                            country={currentTransaction.country || ''}
                            city={currentTransaction.city || ''}
                            onCountryChange={country => onUpdateTransaction({ ...currentTransaction, country })}
                            onCityChange={city => onUpdateTransaction({ ...currentTransaction, city })}
                            inputStyle={inputStyle}
                            theme={theme as 'light' | 'dark'}
                            t={t}
                        />

                        {/* Date, Time, Currency tags */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <DateTimeTag
                                date={currentTransaction.date}
                                time={currentTransaction.time || ''}
                                onDateChange={date => onUpdateTransaction({ ...currentTransaction, date })}
                                onTimeChange={time => onUpdateTransaction({ ...currentTransaction, time })}
                                t={t}
                            />
                            <CurrencyTag
                                currency={currentTransaction.currency || DEFAULT_CURRENCY}
                                onCurrencyChange={currency => onUpdateTransaction({ ...currentTransaction, currency })}
                                t={t}
                            />
                        </div>
                    </div>

                    {/* Right: Thumbnail or Add Photo button */}
                    <div className="flex-shrink-0">
                        {(currentTransaction.thumbnailUrl || hasImages) ? (
                            <button
                                onClick={() => setShowImageViewer(true)}
                                className="relative"
                                aria-label="View receipt image"
                            >
                                <img
                                    src={currentTransaction.thumbnailUrl || currentTransaction.imageUrls?.[0]}
                                    alt="Receipt"
                                    className="w-[72px] h-[90px] object-cover rounded-lg"
                                    style={{
                                        border: '2px solid var(--success)',
                                    }}
                                />
                                {/* Category icon badge - positioned to overlap bottom-right corner of thumbnail */}
                                <div
                                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-base shadow-sm"
                                    style={{
                                        backgroundColor: getCategoryPillColors(currentTransaction.category || 'Other').bg,
                                    }}
                                >
                                    {getCategoryEmoji(currentTransaction.category || 'Other')}
                                </div>
                            </button>
                        ) : (
                            <button
                                onClick={onAddPhoto}
                                className="w-[72px] h-[90px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1"
                                style={{
                                    borderColor: 'var(--primary)',
                                    backgroundColor: isDark ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--primary-light)',
                                    color: 'var(--primary)',
                                }}
                                aria-label={t('addPhoto')}
                            >
                                <Camera size={24} strokeWidth={1.5} />
                                <span className="text-xs font-medium">{t('attach')}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Re-scan button (if applicable) */}
                {currentTransaction.id && onRescan && hasImages && (
                    <button
                        onClick={handleRescanClick}
                        disabled={isRescanning || !hasCredits}
                        className="w-full p-2.5 rounded-lg border mb-4 flex items-center justify-center gap-2 transition-all"
                        style={{
                            borderColor: isRescanning || !hasCredits ? 'var(--border-light)' : 'var(--primary)',
                            color: isRescanning || !hasCredits ? 'var(--text-tertiary)' : 'var(--primary)',
                            backgroundColor: 'transparent',
                            opacity: isRescanning ? 0.7 : 1,
                            cursor: isRescanning || !hasCredits ? 'not-allowed' : 'pointer',
                        }}
                        aria-label={t('rescan')}
                    >
                        <RefreshCw size={16} strokeWidth={2} className={isRescanning ? 'animate-spin' : ''} />
                        <span className="text-sm font-medium">
                            {isRescanning ? t('rescanning') : t('rescan')}
                        </span>
                    </button>
                )}

                {/* ITEMS section - Story 14.38: Toggle between grouped and original order */}
                <div className="mb-4">
                    {/* Story 14.38: Full-width item view toggle (replaces "ITEMS" subtitle) */}
                    {currentTransaction.items && currentTransaction.items.length > 0 && (
                        <div className="mb-3">
                            <ItemViewToggle
                                activeView={itemViewMode}
                                onViewChange={setItemViewMode}
                                t={t}
                            />
                        </div>
                    )}

                    {/* Items grouped by item category GROUP (e.g., "food-fresh", "food-packaged") */}
                    <div className="space-y-3">
                        {/* Grouped view */}
                        {itemViewMode === 'grouped' && itemsByGroup.map(({ groupKey, items: groupItems, total: groupTotal }) => {
                            const isCollapsed = collapsedGroups.has(groupKey);
                            // Use item group colors (not individual category colors)
                            const groupColors = getItemGroupColors(groupKey as Parameters<typeof getItemGroupColors>[0], 'normal', isDark ? 'dark' : 'light');
                            const groupEmoji = getItemCategoryGroupEmoji(groupKey);
                            // Translate group name to current language (e.g., "food-fresh" -> "Alimentos Frescos")
                            const translatedGroup = translateItemCategoryGroup(groupKey, language);

                            return (
                                <div
                                    key={groupKey}
                                    className="rounded-xl overflow-hidden"
                                    style={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-light)',
                                    }}
                                >
                                    {/* Group header - clickable to toggle */}
                                    <button
                                        onClick={() => toggleGroupCollapse(groupKey)}
                                        className="w-full flex items-center justify-between px-3 py-2.5 transition-colors"
                                        style={{ backgroundColor: groupColors.bg }}
                                        aria-expanded={!isCollapsed}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{groupEmoji}</span>
                                            <span
                                                className="text-sm font-semibold"
                                                style={{ color: groupColors.fg }}
                                            >
                                                {translatedGroup}
                                            </span>
                                            <span
                                                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                                style={{
                                                    backgroundColor: 'rgba(0,0,0,0.1)',
                                                    color: groupColors.fg,
                                                }}
                                            >
                                                {groupItems.length}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="text-sm font-bold"
                                                style={{ color: groupColors.fg }}
                                            >
                                                {formatCurrency(groupTotal, displayCurrency)}
                                            </span>
                                            {isCollapsed ? (
                                                <ChevronDown size={16} style={{ color: groupColors.fg }} />
                                            ) : (
                                                <ChevronUp size={16} style={{ color: groupColors.fg }} />
                                            )}
                                        </div>
                                    </button>

                                    {/* Items in this category */}
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
                                                            /* Editing state */
                                                            <div
                                                                className="p-3 rounded-lg space-y-2"
                                                                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                                                            >
                                                                <input
                                                                    className="w-full p-2 border rounded-lg text-sm"
                                                                    style={inputStyle}
                                                                    value={item.name}
                                                                    onChange={e => handleUpdateItem(i, 'name', e.target.value)}
                                                                    placeholder={t('itemName')}
                                                                    autoFocus
                                                                />
                                                                <input
                                                                    type="number"
                                                                    className="w-full p-2 border rounded-lg text-sm"
                                                                    style={inputStyle}
                                                                    value={item.price}
                                                                    onChange={e => handleUpdateItem(i, 'price', e.target.value)}
                                                                    placeholder={t('price')}
                                                                />
                                                                <CategoryCombobox
                                                                    value={(item.category as string) || ''}
                                                                    onChange={(value) => handleUpdateItem(i, 'category', value)}
                                                                    language={language}
                                                                    theme={theme as 'light' | 'dark'}
                                                                    placeholder={t('itemCat')}
                                                                    ariaLabel={t('itemCat')}
                                                                />
                                                                <input
                                                                    className="w-full p-2 border rounded-lg text-sm"
                                                                    style={inputStyle}
                                                                    value={item.subcategory || ''}
                                                                    onChange={e => handleUpdateItem(i, 'subcategory', e.target.value)}
                                                                    placeholder={t('itemSubcat')}
                                                                />
                                                                <div className="flex justify-end gap-2 pt-1">
                                                                    <button
                                                                        onClick={() => handleDeleteItem(i)}
                                                                        className="min-w-10 min-h-10 p-2 rounded-lg flex items-center justify-center"
                                                                        style={{ color: 'var(--error)', backgroundColor: isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}
                                                                        aria-label={t('deleteItem')}
                                                                    >
                                                                        <Trash2 size={18} strokeWidth={2} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => onSetEditingItemIndex(null)}
                                                                        className="min-w-10 min-h-10 p-2 rounded-lg flex items-center justify-center"
                                                                        style={{ color: 'var(--success)', backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)' }}
                                                                        aria-label={t('confirmItem')}
                                                                    >
                                                                        <Check size={18} strokeWidth={2} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* Display state - smaller font than group headers */
                                                            <div
                                                                onClick={() => onSetEditingItemIndex(i)}
                                                                className="px-2.5 py-2 rounded-lg cursor-pointer transition-colors"
                                                                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                                                            >
                                                                {/* Row 1: Name and Price */}
                                                                <div className="flex justify-between items-start gap-2 mb-1">
                                                                    <div className="flex items-center gap-1 flex-1 min-w-0">
                                                                        <span
                                                                            className="text-xs font-medium truncate"
                                                                            style={{ color: 'var(--text-primary)' }}
                                                                            title={item.name}
                                                                        >
                                                                            {item.name}
                                                                        </span>
                                                                        {/* Edit pencil icon */}
                                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" style={{ opacity: 0.6, flexShrink: 0 }}>
                                                                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                                                                        </svg>
                                                                    </div>
                                                                    <span
                                                                        className="text-xs font-semibold flex-shrink-0"
                                                                        style={{ color: 'var(--text-primary)' }}
                                                                    >
                                                                        {formatCurrency(item.price, displayCurrency)}
                                                                    </span>
                                                                </div>
                                                                {/* Row 2: Category/Subcategory on left, Quantity on right */}
                                                                <div className="flex justify-between items-center">
                                                                    {/* Left: Category and Subcategory badges */}
                                                                    <div className="flex flex-wrap items-center gap-1">
                                                                        <CategoryBadge
                                                                            category={(item.category as string) || 'Other'}
                                                                            lang={language}
                                                                            mini
                                                                        />
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
                                                                    {/* Right: Quantity - only show if > 1 */}
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
                        {itemViewMode === 'original' && currentTransaction.items && (
                            <div
                                className="rounded-xl overflow-hidden"
                                style={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-light)',
                                }}
                            >
                                <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                                    {currentTransaction.items.map((item, i) => {
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
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className="text-xs font-medium w-5 text-center flex-shrink-0"
                                                                    style={{ color: 'var(--text-tertiary)' }}
                                                                >
                                                                    {i + 1}.
                                                                </span>
                                                                <input
                                                                    className="flex-1 p-2 border rounded-lg text-sm"
                                                                    style={inputStyle}
                                                                    value={item.name}
                                                                    onChange={e => handleUpdateItem(i, 'name', e.target.value)}
                                                                    placeholder={t('itemName')}
                                                                    autoFocus
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2 pl-7">
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    className="w-24 p-2 border rounded-lg text-sm"
                                                                    style={inputStyle}
                                                                    value={item.price || ''}
                                                                    onChange={e => handleUpdateItem(i, 'price', parseFloat(e.target.value) || 0)}
                                                                    placeholder={t('itemPrice')}
                                                                />
                                                                <CategoryBadge category={(item.category as string) || 'Other'} lang={language} mini />
                                                                <div className="flex-1" />
                                                                <button
                                                                    onClick={() => handleDeleteItem(i)}
                                                                    className="min-w-8 min-h-8 p-1 rounded-lg flex items-center justify-center"
                                                                    style={{ color: 'var(--error)', backgroundColor: isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}
                                                                    aria-label={t('deleteItem')}
                                                                >
                                                                    <Trash2 size={14} strokeWidth={2} />
                                                                </button>
                                                                <button
                                                                    onClick={() => onSetEditingItemIndex(null)}
                                                                    className="min-w-8 min-h-8 p-1 rounded-lg flex items-center justify-center"
                                                                    style={{ color: 'var(--success)', backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                                                                    aria-label={t('confirmItem')}
                                                                >
                                                                    <Check size={14} strokeWidth={2} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        /* Display state in original view */
                                                        <div
                                                            onClick={() => onSetEditingItemIndex(i)}
                                                            className="flex items-center gap-2 cursor-pointer"
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
                                                                            title={item.name}
                                                                        >
                                                                            {item.name}
                                                                        </span>
                                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" style={{ opacity: 0.6, flexShrink: 0 }}>
                                                                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                                                                        </svg>
                                                                    </div>
                                                                    <span
                                                                        className="text-xs font-semibold flex-shrink-0"
                                                                        style={{ color: 'var(--text-primary)' }}
                                                                    >
                                                                        {formatCurrency(item.price, displayCurrency)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1 mt-0.5">
                                                                    <CategoryBadge category={(item.category as string) || 'Other'} lang={language} mini />
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

                    {/* Add Item button - dashed border style */}
                    <button
                        onClick={handleAddItem}
                        className="w-full p-2.5 mt-3 rounded-lg border-2 border-dashed flex items-center justify-center gap-1.5 transition-colors"
                        style={{
                            borderColor: 'var(--border-light)',
                            color: 'var(--primary)',
                            backgroundColor: 'transparent',
                        }}
                        aria-label={t('addItem')}
                    >
                        <Plus size={14} strokeWidth={2.5} />
                        <span className="text-sm font-medium">{t('addItem')}</span>
                    </button>
                </div>

                {/* Total row */}
                <div
                    className="flex justify-between items-center p-3 rounded-lg mb-4"
                    style={{ backgroundColor: 'var(--primary-light)' }}
                >
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {t('total')} ({currentTransaction.items.length} {currentTransaction.items.length === 1 ? 'item' : 'items'})
                    </span>
                    <span className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
                        {formatCurrency(currentTransaction.total, displayCurrency)}
                    </span>
                </div>

                {/* Save Transaction button - green with checkmark */}
                <button
                    onClick={handleSaveWithLearning}
                    className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                    style={{ backgroundColor: 'var(--success)' }}
                >
                    <Check size={18} strokeWidth={2.5} />
                    {t('saveTransaction')}
                </button>
            </div>

            {/* Debug info section - collapsible */}
            {(currentTransaction.promptVersion || currentTransaction.id || currentTransaction.merchant) && (
                <div
                    className="rounded-2xl p-4 mb-4"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                    }}
                >
                    <button
                        onClick={() => setShowDebugInfo(!showDebugInfo)}
                        className="w-full flex items-center justify-between text-xs"
                        style={{ color: 'var(--text-tertiary)' }}
                        aria-expanded={showDebugInfo}
                    >
                        <span className="font-medium">{t('debugInfo')}</span>
                        {showDebugInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {showDebugInfo && (
                        <div className="mt-3 space-y-2 text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                            {/* Merchant from scan (read-only) - moved here */}
                            {currentTransaction.merchant && (
                                <div className="flex justify-between">
                                    <span>{t('merchantFromScan')}:</span>
                                    <span className="truncate max-w-[180px] text-right" title={currentTransaction.merchant}>
                                        {currentTransaction.merchant}
                                    </span>
                                </div>
                            )}
                            {currentTransaction.promptVersion && (
                                <div className="flex justify-between">
                                    <span>Prompt:</span>
                                    <span>{currentTransaction.promptVersion}</span>
                                </div>
                            )}
                            {currentTransaction.id && (
                                <div className="flex justify-between">
                                    <span>ID:</span>
                                    <span className="truncate max-w-[150px]" title={currentTransaction.id}>
                                        {currentTransaction.id}
                                    </span>
                                </div>
                            )}
                            {currentTransaction.merchantSource && (
                                <div className="flex justify-between">
                                    <span>Source:</span>
                                    <span>{currentTransaction.merchantSource}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Datalist for alias autocomplete - hidden helper */}
            <datalist id="alias-list">
                {distinctAliases.map((a, i) => (
                    <option key={i} value={a} />
                ))}
            </datalist>

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

            {/* Story 15b-2a: Confirmation dialogs extracted to EditViewDialogs */}
            <EditViewDialogs
                showCancelConfirm={showCancelConfirm}
                setShowCancelConfirm={setShowCancelConfirm}
                handleConfirmCancel={handleConfirmCancel}
                pendingScan={pendingScan}
                isDark={isDark}
                t={t}
                showRescanConfirm={showRescanConfirm}
                setShowRescanConfirm={setShowRescanConfirm}
                handleConfirmRescan={handleConfirmRescan}
                showDeleteConfirm={showDeleteConfirm}
                setShowDeleteConfirm={setShowDeleteConfirm}
                currentTransaction={currentTransaction}
                onDelete={onDelete}
            />
            </div>
        </div>
    );
};
