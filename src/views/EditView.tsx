import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Trash2, Plus, Check } from 'lucide-react';
import { CategoryBadge } from '../components/CategoryBadge';
import { ImageViewer } from '../components/ImageViewer';
import { CategoryLearningPrompt } from '../components/CategoryLearningPrompt';
import { StoreCategory, CategorySource } from '../types/transaction';

interface TransactionItem {
    name: string;
    price: number;
    category?: string;
    subcategory?: string;
    categorySource?: CategorySource;
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
}

interface EditViewProps {
    currentTransaction: Transaction;
    editingItemIndex: number | null;
    distinctAliases: string[];
    theme: string;
    currency: string;
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
    /** Optional: Show toast notification */
    onShowToast?: (text: string) => void;
}

export const EditView: React.FC<EditViewProps> = ({
    currentTransaction,
    editingItemIndex,
    distinctAliases,
    theme,
    currency,
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
    onShowToast,
}) => {
    const [showImageViewer, setShowImageViewer] = useState(false);

    // Story 6.3: Category learning prompt state
    const [showLearningPrompt, setShowLearningPrompt] = useState(false);
    const [itemsToLearn, setItemsToLearn] = useState<Array<{ itemName: string; newGroup: string }>>([]);

    // Track original item groups on mount for detecting changes
    // We learn: item name → item group (category field on item)
    const originalItemGroupsRef = useRef<{
        items: Array<{ name: string; category: string }>; // name and group for each item
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
                    category: item.category || ''
                })),
                capturedForTransactionKey: transactionKey,
            };
        }
    }, [currentTransaction.id, currentTransaction.items]);

    // Story 7.12: Theme-aware styling using CSS variables (AC #3, #8)
    const isDark = theme === 'dark';

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

    // Story 6.3: Handle save with category learning prompt
    // Shows prompt BEFORE saving if item groups changed, because onSave navigates away
    const handleSaveWithLearning = async () => {
        // Check if any item's group was changed
        const changedItems = findAllChangedItemGroups();

        // Only show prompt if:
        // 1. At least one item's group was changed
        // 2. onSaveMapping function is available
        if (changedItems.length > 0 && onSaveMapping) {
            // Show prompt first - onSave will be called after user responds
            setItemsToLearn(changedItems);
            setShowLearningPrompt(true);
        } else {
            // No changes to learn, just save directly
            await onSave();
        }
    };

    // Story 6.3: Handle learning prompt confirmation
    const handleLearnConfirm = async () => {
        if (onSaveMapping && itemsToLearn.length > 0) {
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
            }
        }
        setShowLearningPrompt(false);
        setItemsToLearn([]);
        // Now save the transaction after user confirmed learning
        await onSave();
    };

    // Story 6.3: Handle learning prompt dismiss
    const handleLearnDismiss = async () => {
        setShowLearningPrompt(false);
        setItemsToLearn([]);
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
                ) : (
                    <div className="w-11" /> // Placeholder for alignment
                )}
            </div>

            {/* Total amount display with accent gradient */}
            <div
                className="p-6 rounded-xl mb-4 text-center text-white"
                style={{ background: 'linear-gradient(135deg, var(--accent), #6366f1)' }}
            >
                <div className="text-sm opacity-80">{t('total')}</div>
                <input
                    type="number"
                    value={currentTransaction.total}
                    onChange={e => onUpdateTransaction({
                        ...currentTransaction,
                        total: parseStrictNumber(e.target.value)
                    })}
                    className="bg-transparent text-3xl font-bold text-center w-full outline-none text-white"
                />
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
                <input
                    className="w-full p-2 border rounded-lg"
                    style={inputStyle}
                    value={currentTransaction.merchant}
                    onChange={e => onUpdateTransaction({ ...currentTransaction, merchant: e.target.value })}
                    placeholder={t('merchant')}
                />
                <input
                    className="w-full p-2 border rounded-lg"
                    style={inputStyle}
                    placeholder={t('alias')}
                    list="alias-list"
                    value={currentTransaction.alias || ''}
                    onChange={e => onUpdateTransaction({ ...currentTransaction, alias: e.target.value })}
                />
                <datalist id="alias-list">
                    {distinctAliases.map((a, i) => (
                        <option key={i} value={a} />
                    ))}
                </datalist>
                <input
                    type="date"
                    className="w-full p-2 border rounded-lg"
                    style={inputStyle}
                    value={currentTransaction.date}
                    onChange={e => onUpdateTransaction({ ...currentTransaction, date: e.target.value })}
                />
                <select
                    className="w-full p-2 border rounded-lg"
                    style={inputStyle}
                    value={currentTransaction.category}
                    onChange={e => onUpdateTransaction({ ...currentTransaction, category: e.target.value })}
                >
                    {storeCategories.map(c => (
                        <option key={c} value={c}>{c}</option>
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
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            className="w-24 p-2 border rounded-lg text-sm"
                                            style={inputStyle}
                                            value={item.price}
                                            onChange={e => handleUpdateItem(i, 'price', e.target.value)}
                                        />
                                        <input
                                            className="flex-1 p-2 border rounded-lg text-sm"
                                            style={inputStyle}
                                            value={item.category || ''}
                                            onChange={e => handleUpdateItem(i, 'category', e.target.value)}
                                            placeholder={t('itemCat')}
                                        />
                                    </div>
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

            {/* Save button with accent color */}
            <button
                onClick={handleSaveWithLearning}
                className="w-full py-3 rounded-xl font-bold shadow-lg text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
                style={{ backgroundColor: 'var(--accent)' }}
            >
                {t('save')}
            </button>

            {/* Story 6.3: Category Learning Prompt Modal */}
            <CategoryLearningPrompt
                isOpen={showLearningPrompt}
                items={itemsToLearn}
                onConfirm={handleLearnConfirm}
                onClose={handleLearnDismiss}
                t={t}
                theme={theme as 'light' | 'dark'}
            />
        </div>
    );
};
