/**
 * Story TD-15b-2a: Items section sub-component extracted from EditView.tsx.
 * Renders the item list (grouped and original-order views), inline editing forms,
 * staggered animation, and the Add Item button.
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Trash2, Plus, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { CategoryBadge } from '@features/transaction-editor/components/CategoryBadge';
import { CategoryCombobox } from '@features/transaction-editor/components/CategoryCombobox';
import { ItemViewToggle, type ItemViewMode } from '@/components/items/ItemViewToggle';
import { useStaggeredReveal } from '@/hooks/useStaggeredReveal';
import { AnimatedItem } from '@/components/AnimatedItem';
import { TransactionItem, Transaction } from './editViewHelpers';
import type { Language } from '@/utils/translations';
import { translateItemCategoryGroup, getItemCategoryGroupEmoji } from '@/utils/categoryTranslations';
import { getItemCategoryGroup, getItemGroupColors } from '@/config/categoryColors';
import { normalizeItemCategory } from '@/utils/categoryNormalizer';
import { sanitizeInput, sanitizeNumericInput } from '@/utils/sanitize';

type ItemEditableField = 'name' | 'price' | 'category' | 'subcategory';

function getItemContainerConfig(
    i: number, shouldAnimate: boolean, played: boolean, testIdPrefix: string
): { ItemContainer: typeof AnimatedItem | typeof React.Fragment; containerProps: Record<string, unknown> } {
    const animate = shouldAnimate && !played;
    return {
        ItemContainer: animate ? AnimatedItem : React.Fragment,
        containerProps: animate
            ? { delay: i * 100, index: i, testId: `${testIdPrefix}-${i}` }
            : {},
    };
}

interface EditViewItemsSectionProps {
    currentTransaction: Transaction;
    editingItemIndex: number | null;
    onSetEditingItemIndex: (index: number | null) => void;
    onUpdateTransaction: (transaction: Transaction) => void;
    language: Language;
    theme: string;
    t: (key: string) => string;
    formatCurrency: (amount: number, currency: string) => string;
    parseStrictNumber: (val: unknown) => number;
    displayCurrency: string;
    isDark: boolean;
    inputStyle: React.CSSProperties;
    /** Story 11.3: Animate items on initial load */
    animateItems?: boolean;
}

export const EditViewItemsSection: React.FC<EditViewItemsSectionProps> = ({
    currentTransaction,
    editingItemIndex,
    onSetEditingItemIndex,
    onUpdateTransaction,
    language,
    theme,
    t,
    formatCurrency,
    parseStrictNumber,
    displayCurrency,
    isDark,
    inputStyle,
    animateItems = false,
}) => {
    // Story 14.38: Item view mode toggle (grouped vs original order)
    const [itemViewMode, setItemViewMode] = useState<ItemViewMode>('grouped');
    // Story 14.22: Collapsed item groups state (all expanded by default)
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    // Story 11.3: Staggered reveal for items (AC #1, #2, #5)
    const animationPlayedRef = useRef(false);
    const shouldAnimate = animateItems && !animationPlayedRef.current;
    const { visibleItems: animatedItems, isComplete: animationComplete } = useStaggeredReveal(
        shouldAnimate ? currentTransaction.items : [],
        { staggerMs: 100, initialDelayMs: 300, maxDurationMs: 2500 }
    );
    useEffect(() => {
        if (animationComplete && shouldAnimate) {
            animationPlayedRef.current = true;
        }
    }, [animationComplete, shouldAnimate]);

    // Story 14.22: Group items by item category GROUP
    const itemsByGroup = useMemo(() => {
        const groups: Record<string, Array<{ item: TransactionItem; originalIndex: number }>> = {};
        currentTransaction.items.forEach((item, index) => {
            const normalizedCategory = normalizeItemCategory((item.category as string) || 'Other');
            const groupKey = getItemCategoryGroup(normalizedCategory);
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push({ item, originalIndex: index });
        });
        return Object.entries(groups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([groupKey, items]) => ({
                groupKey,
                items: items.sort((a, b) => b.item.price - a.item.price),
                total: items.reduce((sum, { item }) => sum + item.price, 0),
            }));
    }, [currentTransaction.items]);

    const toggleGroupCollapse = (groupKey: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupKey)) next.delete(groupKey);
            else next.add(groupKey);
            return next;
        });
    };

    const handleAddItem = () => {
        onUpdateTransaction({
            ...currentTransaction,
            items: [...currentTransaction.items, { name: '', price: 0, category: 'Other', subcategory: '' }],
        });
        onSetEditingItemIndex(currentTransaction.items.length);
    };

    const handleUpdateItem = (index: number, field: ItemEditableField, value: string | number) => {
        const newItems = [...currentTransaction.items];
        newItems[index] = { ...newItems[index], [field]: field === 'price' ? parseStrictNumber(value) : value };
        onUpdateTransaction({ ...currentTransaction, items: newItems });
    };

    const handleDeleteItem = (index: number) => {
        const newItems = currentTransaction.items.filter((_, x) => x !== index);
        onUpdateTransaction({ ...currentTransaction, items: newItems });
        onSetEditingItemIndex(null);
    };

    return (
        <div className="mb-4">
            {/* Story 14.38: Full-width item view toggle */}
            {currentTransaction.items && currentTransaction.items.length > 0 && (
                <div className="mb-3">
                    <ItemViewToggle activeView={itemViewMode} onViewChange={setItemViewMode} t={t} />
                </div>
            )}

            <div className="space-y-3">
                {/* Grouped view */}
                {itemViewMode === 'grouped' && itemsByGroup.map(({ groupKey, items: groupItems, total: groupTotal }) => {
                    const isCollapsed = collapsedGroups.has(groupKey);
                    const groupColors = getItemGroupColors(groupKey as Parameters<typeof getItemGroupColors>[0], 'normal', isDark ? 'dark' : 'light');
                    const groupEmoji = getItemCategoryGroupEmoji(groupKey);
                    const translatedGroup = translateItemCategoryGroup(groupKey, language);

                    return (
                        <div key={groupKey} className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                            {/* Group header - clickable to toggle */}
                            <button
                                onClick={() => toggleGroupCollapse(groupKey)}
                                className="w-full flex items-center justify-between px-3 py-2.5 transition-colors"
                                style={{ backgroundColor: groupColors.bg }}
                                aria-expanded={!isCollapsed}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{groupEmoji}</span>
                                    <span className="text-sm font-semibold" style={{ color: groupColors.fg }}>{translatedGroup}</span>
                                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(0,0,0,0.1)', color: groupColors.fg }}>{groupItems.length}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold" style={{ color: groupColors.fg }}>{formatCurrency(groupTotal, displayCurrency)}</span>
                                    {isCollapsed ? <ChevronDown size={16} style={{ color: groupColors.fg }} /> : <ChevronUp size={16} style={{ color: groupColors.fg }} />}
                                </div>
                            </button>

                            {/* Items in this category */}
                            {!isCollapsed && (
                                <div className="p-2 space-y-1.5">
                                    {groupItems.map(({ item, originalIndex: i }) => {
                                        const isVisible = !shouldAnimate || i < animatedItems.length;
                                        const { ItemContainer, containerProps } = getItemContainerConfig(i, shouldAnimate, animationPlayedRef.current, 'edit-view-item');
                                        if (!isVisible) return null;

                                        return (
                                            <ItemContainer key={i} {...containerProps}>
                                                {editingItemIndex === i ? (
                                                    <div className="p-3 rounded-lg space-y-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                                        <input className="w-full p-2 border rounded-lg text-sm" style={inputStyle} value={item.name} onChange={e => handleUpdateItem(i, 'name', sanitizeInput(e.target.value, { maxLength: 100 }))} placeholder={t('itemName')} autoFocus />
                                                        <input type="number" className="w-full p-2 border rounded-lg text-sm" style={inputStyle} value={item.price} onChange={e => handleUpdateItem(i, 'price', sanitizeNumericInput(e.target.value))} placeholder={t('price')} />
                                                        <CategoryCombobox value={(item.category as string) || ''} onChange={(value) => handleUpdateItem(i, 'category', value)} language={language} theme={theme as 'light' | 'dark'} placeholder={t('itemCat')} ariaLabel={t('itemCat')} />
                                                        <input className="w-full p-2 border rounded-lg text-sm" style={inputStyle} value={item.subcategory || ''} onChange={e => handleUpdateItem(i, 'subcategory', sanitizeInput(e.target.value, { maxLength: 50 }))} placeholder={t('itemSubcat')} />
                                                        <div className="flex justify-end gap-2 pt-1">
                                                            <button onClick={() => handleDeleteItem(i)} className="min-w-10 min-h-10 p-2 rounded-lg flex items-center justify-center" style={{ color: 'var(--error)', backgroundColor: isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.1)' }} aria-label={t('deleteItem')}><Trash2 size={18} strokeWidth={2} /></button>
                                                            <button onClick={() => onSetEditingItemIndex(null)} className="min-w-10 min-h-10 p-2 rounded-lg flex items-center justify-center" style={{ color: 'var(--success)', backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)' }} aria-label={t('confirmItem')}><Check size={18} strokeWidth={2} /></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div onClick={() => onSetEditingItemIndex(i)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSetEditingItemIndex(i); } }} className="px-2.5 py-2 rounded-lg cursor-pointer transition-colors" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                                        <div className="flex justify-between items-start gap-2 mb-1">
                                                            <div className="flex items-center gap-1 flex-1 min-w-0">
                                                                <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }} title={item.name}>{item.name}</span>
                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" style={{ opacity: 0.6, flexShrink: 0 }}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                                                            </div>
                                                            <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.price, displayCurrency)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex flex-wrap items-center gap-1">
                                                                <CategoryBadge category={(item.category as string) || 'Other'} lang={language} mini />
                                                                {item.subcategory && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>{item.subcategory}</span>}
                                                            </div>
                                                            {(item.qty ?? 1) > 1 && <span className="text-xs font-medium flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>x{Number.isInteger(item.qty) ? item.qty : item.qty?.toFixed(1)}</span>}
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

                {/* Original order view - Story 14.38 */}
                {itemViewMode === 'original' && currentTransaction.items && (
                    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                        <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                            {currentTransaction.items.map((item, i) => {
                                const isVisible = !shouldAnimate || i < animatedItems.length;
                                const { ItemContainer, containerProps } = getItemContainerConfig(i, shouldAnimate, animationPlayedRef.current, 'edit-view-item-original');
                                if (!isVisible) return null;

                                return (
                                    <ItemContainer key={i} {...containerProps}>
                                        <div className="px-3 py-2.5 transition-colors" style={{ backgroundColor: i % 2 === 1 ? 'var(--bg-tertiary)' : 'var(--bg-secondary)' }}>
                                            {editingItemIndex === i ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium w-5 text-center flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{i + 1}.</span>
                                                        <input className="flex-1 p-2 border rounded-lg text-sm" style={inputStyle} value={item.name} onChange={e => handleUpdateItem(i, 'name', sanitizeInput(e.target.value, { maxLength: 100 }))} placeholder={t('itemName')} autoFocus />
                                                    </div>
                                                    <div className="flex items-center gap-2 pl-7">
                                                        <input type="number" step="0.01" className="w-24 p-2 border rounded-lg text-sm" style={inputStyle} value={item.price} onChange={e => handleUpdateItem(i, 'price', sanitizeNumericInput(e.target.value))} placeholder={t('price')} />
                                                        <CategoryBadge category={(item.category as string) || 'Other'} lang={language} mini />
                                                        <div className="flex-1" />
                                                        <button onClick={() => handleDeleteItem(i)} className="min-w-8 min-h-8 p-1 rounded-lg flex items-center justify-center" style={{ color: 'var(--error)', backgroundColor: isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.1)' }} aria-label={t('deleteItem')}><Trash2 size={14} strokeWidth={2} /></button>
                                                        <button onClick={() => onSetEditingItemIndex(null)} className="min-w-8 min-h-8 p-1 rounded-lg flex items-center justify-center" style={{ color: 'var(--success)', backgroundColor: 'rgba(34, 197, 94, 0.1)' }} aria-label={t('confirmItem')}><Check size={14} strokeWidth={2} /></button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div onClick={() => onSetEditingItemIndex(i)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSetEditingItemIndex(i); } }} className="flex items-center gap-2 cursor-pointer">
                                                    <span className="text-xs font-medium w-5 text-center flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{i + 1}.</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-1 min-w-0 flex-1">
                                                                <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }} title={item.name}>{item.name}</span>
                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" style={{ opacity: 0.6, flexShrink: 0 }}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                                                            </div>
                                                            <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.price, displayCurrency)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <CategoryBadge category={(item.category as string) || 'Other'} lang={language} mini />
                                                            {item.subcategory && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-tertiary)' }}>{item.subcategory}</span>}
                                                            {(item.qty ?? 1) > 1 && <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>x{Number.isInteger(item.qty) ? item.qty : item.qty?.toFixed(1)}</span>}
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
                style={{ borderColor: 'var(--border-light)', color: 'var(--primary)', backgroundColor: 'transparent' }}
                aria-label={t('addItem')}
            >
                <Plus size={14} strokeWidth={2.5} />
                <span className="text-sm font-medium">{t('addItem')}</span>
            </button>
        </div>
    );
};
