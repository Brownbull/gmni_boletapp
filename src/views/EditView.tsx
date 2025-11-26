import React from 'react';
import { ArrowLeft, Trash2, Plus, Check } from 'lucide-react';
import { CategoryBadge } from '../components/CategoryBadge';

interface TransactionItem {
    name: string;
    price: number;
    category?: string;
    subcategory?: string;
}

interface Transaction {
    id?: string;
    merchant: string;
    alias?: string;
    date: string;
    total: number;
    category: string;
    items: TransactionItem[];
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
}) => {
    const card = theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100';
    const input = theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200';

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

    return (
        <div className="pb-24">
            <div className="flex justify-between mb-6">
                <button onClick={onBack} aria-label={t('back')}>
                    <ArrowLeft />
                </button>
                <h1 className="font-bold">
                    {currentTransaction.id ? t('editTrans') : t('newTrans')}
                </h1>
                {currentTransaction.id && (
                    <button onClick={() => onDelete(currentTransaction.id!)} className="text-red-500" aria-label={t('delete')}>
                        <Trash2 />
                    </button>
                )}
            </div>

            <div className="p-6 rounded-2xl mb-4 text-center bg-slate-800 text-white">
                <div className="text-sm opacity-60">{t('total')}</div>
                <input
                    type="number"
                    value={currentTransaction.total}
                    onChange={e => onUpdateTransaction({
                        ...currentTransaction,
                        total: parseStrictNumber(e.target.value)
                    })}
                    className="bg-transparent text-3xl font-bold text-center w-full outline-none"
                />
            </div>

            <div className={`p-4 rounded-xl border space-y-3 mb-4 ${card}`}>
                <input
                    className={`w-full p-2 border rounded ${input}`}
                    value={currentTransaction.merchant}
                    onChange={e => onUpdateTransaction({ ...currentTransaction, merchant: e.target.value })}
                    placeholder={t('merchant')}
                />
                <input
                    className={`w-full p-2 border rounded ${input}`}
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
                    className={`w-full p-2 border rounded ${input}`}
                    value={currentTransaction.date}
                    onChange={e => onUpdateTransaction({ ...currentTransaction, date: e.target.value })}
                />
                <select
                    className={`w-full p-2 border rounded ${input}`}
                    value={currentTransaction.category}
                    onChange={e => onUpdateTransaction({ ...currentTransaction, category: e.target.value })}
                >
                    {storeCategories.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            <div className={`p-4 rounded-xl border mb-4 ${card}`}>
                <div className="flex justify-between mb-2">
                    <h3 className="font-bold">{t('items')}</h3>
                    <button
                        onClick={handleAddItem}
                        className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded"
                        aria-label={t('addItem')}
                    >
                        <Plus size={12} />
                    </button>
                </div>
                <div className="space-y-3">
                    {currentTransaction.items.map((item, i) => (
                        <div key={i} className="border-b pb-2 last:border-0">
                            {editingItemIndex === i ? (
                                <div className="space-y-2">
                                    <input
                                        className={`w-full p-1 border rounded text-sm ${input}`}
                                        value={item.name}
                                        onChange={e => handleUpdateItem(i, 'name', e.target.value)}
                                        placeholder={t('itemName')}
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            className={`w-20 p-1 border rounded text-sm ${input}`}
                                            value={item.price}
                                            onChange={e => handleUpdateItem(i, 'price', e.target.value)}
                                        />
                                        <input
                                            className={`flex-1 p-1 border rounded text-sm ${input}`}
                                            value={item.category || ''}
                                            onChange={e => handleUpdateItem(i, 'category', e.target.value)}
                                            placeholder={t('itemCat')}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleDeleteItem(i)}
                                            className="text-red-500"
                                            aria-label={t('deleteItem')}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => onSetEditingItemIndex(null)}
                                            className="text-blue-600"
                                            aria-label={t('confirmItem')}
                                        >
                                            <Check size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => onSetEditingItemIndex(i)}
                                    className="flex justify-between items-start"
                                >
                                    <div>
                                        <div className="font-medium text-sm">{item.name}</div>
                                        <CategoryBadge
                                            category={item.category || 'Other'}
                                            subcategory={item.subcategory}
                                        />
                                    </div>
                                    <div className="font-mono text-sm">
                                        {formatCurrency(item.price, currency)}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={async () => { await onSave(); }}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg"
            >
                {t('save')}
            </button>
        </div>
    );
};
