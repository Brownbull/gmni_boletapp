import React from 'react';
import { Plus, Store, Camera, Receipt } from 'lucide-react';
import { CategoryBadge } from '../components/CategoryBadge';

interface Transaction {
    id: string;
    merchant: string;
    alias?: string;
    date: string;
    total: number;
    category: string;
    items?: Array<{
        name: string;
        price: number;
        category?: string;
        subcategory?: string;
    }>;
}

interface DashboardViewProps {
    transactions: Transaction[];
    t: (key: string) => string;
    currency: string;
    dateFormat: string;
    theme: string;
    formatCurrency: (amount: number, currency: string) => string;
    formatDate: (date: string, format: string) => string;
    getSafeDate: (val: any) => string;
    onCreateNew: () => void;
    onViewTrends: (month: string | null) => void;
    onEditTransaction: (transaction: Transaction) => void;
    onTriggerScan: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
    transactions,
    t,
    currency,
    dateFormat,
    theme,
    formatCurrency,
    formatDate,
    onCreateNew,
    onViewTrends,
    onEditTransaction,
    onTriggerScan,
}) => {
    // Story 7.12: Theme-aware styling using CSS variables (AC #1, #2, #8)
    const isDark = theme === 'dark';

    const currentMonth = new Date().toISOString().slice(0, 7);
    const totalSpent = transactions.reduce((a, b) => a + b.total, 0);
    const monthSpent = transactions
        .filter(t => t.date.startsWith(currentMonth))
        .reduce((a, b) => a + b.total, 0);

    // Card styling using CSS variables (AC #1)
    const cardStyle: React.CSSProperties = {
        backgroundColor: 'var(--surface)',
        borderColor: isDark ? '#334155' : '#e2e8f0',
    };

    // Transaction card with hover state (AC #2)
    const getTransactionCardStyle = (): React.CSSProperties => ({
        backgroundColor: 'var(--surface)',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        transition: 'border-color 0.15s ease',
    });

    return (
        <div className="space-y-6">
            {/* Header with consistent typography (AC #8) */}
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{t('overview')}</h1>
                    <p className="text-sm" style={{ color: 'var(--secondary)' }}>{t('welcome')}</p>
                </div>
                <button
                    onClick={onCreateNew}
                    className="min-w-11 min-h-11 p-2 rounded-full shadow-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: 'var(--accent)' }}
                    aria-label={t('newTrans')}
                >
                    <Plus size={24} strokeWidth={2} />
                </button>
            </header>

            {/* Summary cards with consistent styling (AC #1) */}
            <div className="grid grid-cols-2 gap-4">
                <div
                    onClick={() => onViewTrends(null)}
                    className="p-5 rounded-xl shadow-md cursor-pointer text-white hover:scale-[1.02] transition-transform"
                    style={{ backgroundColor: 'var(--accent)' }}
                >
                    <div className="text-sm opacity-90 mb-1">{t('totalSpent')}</div>
                    <div className="text-2xl font-bold">{formatCurrency(totalSpent, currency)}</div>
                </div>
                <div
                    onClick={() => onViewTrends(currentMonth)}
                    className="p-5 rounded-xl border cursor-pointer hover:scale-[1.02] transition-transform"
                    style={cardStyle}
                >
                    <div className="text-sm mb-1" style={{ color: 'var(--secondary)' }}>{t('thisMonth')}</div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{formatCurrency(monthSpent, currency)}</div>
                </div>
            </div>

            {/* Scan CTA with gradient accent */}
            <div
                className="p-6 rounded-xl relative overflow-hidden text-white"
                style={{ background: `linear-gradient(135deg, var(--accent), #6366f1)` }}
            >
                <h3 className="font-bold z-10 relative">{t('scanTitle')}</h3>
                <button
                    onClick={onTriggerScan}
                    className="mt-3 min-h-11 px-4 py-2 rounded-lg font-bold flex items-center gap-2 z-10 relative"
                    style={{
                        backgroundColor: 'var(--surface)',
                        color: 'var(--accent)',
                    }}
                >
                    <Camera size={20} strokeWidth={2} /> {t('scanBtn')}
                </button>
                <Receipt className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20 rotate-12" />
            </div>

            {/* Transaction list with hover states (AC #2) */}
            <div className="space-y-2">
                {transactions.slice(0, 5).map(tx => (
                    <div
                        key={tx.id}
                        onClick={() => onEditTransaction(tx)}
                        className="p-4 rounded-xl border flex justify-between items-center cursor-pointer"
                        style={getTransactionCardStyle()}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = isDark ? '#334155' : '#e2e8f0'; }}
                    >
                        <div className="flex gap-3 items-center">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{
                                    backgroundColor: isDark ? '#334155' : '#f1f5f9',
                                    color: 'var(--secondary)',
                                }}
                            >
                                <Store size={20} strokeWidth={2} />
                            </div>
                            <div>
                                <div className="font-medium" style={{ color: 'var(--primary)' }}>{tx.alias || tx.merchant}</div>
                                <div className="text-xs" style={{ color: 'var(--secondary)' }}>{tx.merchant}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <CategoryBadge category={tx.category} mini />
                                    <span className="text-xs" style={{ color: 'var(--secondary)' }}>{formatDate(tx.date, dateFormat)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="font-bold" style={{ color: 'var(--primary)' }}>{formatCurrency(tx.total, currency)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
