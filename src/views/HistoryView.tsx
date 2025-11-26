import React from 'react';
import { ArrowLeft } from 'lucide-react';
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

interface HistoryViewProps {
    historyTrans: Transaction[];
    historyPage: number;
    totalHistoryPages: number;
    theme: string;
    currency: string;
    dateFormat: string;
    t: (key: string) => string;
    formatCurrency: (amount: number, currency: string) => string;
    formatDate: (date: string, format: string) => string;
    onBack: () => void;
    onSetHistoryPage: (page: number | ((prev: number) => number)) => void;
    onEditTransaction: (transaction: Transaction) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
    historyTrans,
    historyPage,
    totalHistoryPages,
    theme,
    currency,
    dateFormat,
    t,
    formatCurrency,
    formatDate,
    onBack,
    onSetHistoryPage,
    onEditTransaction,
}) => {
    const card = theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100';

    return (
        <div className="pb-24">
            <button onClick={onBack} className="mb-4" aria-label={t('back')}>
                <ArrowLeft />
            </button>
            <h1 className="text-2xl font-bold mb-4">{t('history')}</h1>
            <div className="space-y-3">
                {historyTrans.map(t => (
                    <div
                        key={t.id}
                        onClick={() => onEditTransaction(t)}
                        className={`p-4 rounded-xl border flex justify-between cursor-pointer ${card}`}
                    >
                        <div>
                            <div className="font-bold">{t.alias || t.merchant}</div>
                            <div className="text-xs opacity-60">{t.merchant}</div>
                            <CategoryBadge category={t.category} mini />
                            <div className="text-xs opacity-60 mt-1">
                                {formatDate(t.date, dateFormat)}
                            </div>
                        </div>
                        <div className="font-bold">{formatCurrency(t.total, currency)}</div>
                    </div>
                ))}
            </div>
            <div className="flex justify-center gap-4 mt-6">
                <button
                    disabled={historyPage === 1}
                    onClick={() => onSetHistoryPage(p => p - 1)}
                    className={`px-4 py-2 border rounded disabled:opacity-50 ${card}`}
                >
                    {t('prev')}
                </button>
                <span className="py-2">
                    {t('page')} {historyPage}
                </span>
                <button
                    disabled={historyPage >= totalHistoryPages}
                    onClick={() => onSetHistoryPage(p => p + 1)}
                    className={`px-4 py-2 border rounded disabled:opacity-50 ${card}`}
                >
                    {t('next')}
                </button>
            </div>
        </div>
    );
};
