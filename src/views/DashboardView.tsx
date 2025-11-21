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
    const card = theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100';

    const currentMonth = new Date().toISOString().slice(0, 7);
    const totalSpent = transactions.reduce((a, b) => a + b.total, 0);
    const monthSpent = transactions
        .filter(t => t.date.startsWith(currentMonth))
        .reduce((a, b) => a + b.total, 0);

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">{t('overview')}</h1>
                    <p className="text-sm opacity-60">{t('welcome')}</p>
                </div>
                <button
                    onClick={onCreateNew}
                    className="bg-blue-600 text-white p-2 rounded-full shadow"
                >
                    <Plus />
                </button>
            </header>

            <div className="grid grid-cols-2 gap-4">
                <div
                    onClick={() => onViewTrends(null)}
                    className="bg-blue-600 text-white p-5 rounded-2xl shadow cursor-pointer"
                >
                    <div className="text-sm opacity-80 mb-1">{t('totalSpent')}</div>
                    <div className="text-2xl font-bold">{formatCurrency(totalSpent, currency)}</div>
                </div>
                <div
                    onClick={() => onViewTrends(currentMonth)}
                    className={`p-5 rounded-2xl border shadow cursor-pointer ${card}`}
                >
                    <div className="text-sm opacity-60 mb-1">{t('thisMonth')}</div>
                    <div className="text-2xl font-bold">{formatCurrency(monthSpent, currency)}</div>
                </div>
            </div>

            <div className="bg-indigo-600 text-white p-6 rounded-2xl relative overflow-hidden">
                <h3 className="font-bold z-10 relative">{t('scanTitle')}</h3>
                <button
                    onClick={onTriggerScan}
                    className="mt-3 bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold flex items-center gap-2 z-10 relative"
                >
                    <Camera size={18} /> {t('scanBtn')}
                </button>
                <Receipt className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20 rotate-12" />
            </div>

            <div className="space-y-2">
                {transactions.slice(0, 5).map(t => (
                    <div
                        key={t.id}
                        onClick={() => onEditTransaction(t)}
                        className={`p-4 rounded-xl border flex justify-between items-center cursor-pointer ${card}`}
                    >
                        <div className="flex gap-3 items-center">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                <Store size={18} />
                            </div>
                            <div>
                                <div className="font-bold">{t.alias || t.merchant}</div>
                                <div className="text-xs opacity-60">{t.merchant}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <CategoryBadge category={t.category} mini />
                                    <span className="text-xs opacity-60">{formatDate(t.date, dateFormat)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="font-bold">{formatCurrency(t.total, currency)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
