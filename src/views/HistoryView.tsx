import React, { useState } from 'react';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { CategoryBadge } from '../components/CategoryBadge';
import { ImageViewer } from '../components/ImageViewer';

interface Transaction {
    id: string;
    merchant: string;
    alias?: string;
    date: string;
    total: number;
    category: string;
    imageUrls?: string[];
    thumbnailUrl?: string;
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

interface ThumbnailProps {
    transaction: Transaction;
    onThumbnailClick: (transaction: Transaction) => void;
}

const TransactionThumbnail: React.FC<ThumbnailProps> = ({ transaction, onThumbnailClick }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    if (!transaction.thumbnailUrl) {
        return null;
    }

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (transaction.imageUrls && transaction.imageUrls.length > 0) {
            onThumbnailClick(transaction);
        }
    };

    const handleLoad = () => setIsLoading(false);
    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    return (
        <div
            className="relative w-10 h-[50px] flex-shrink-0 cursor-pointer"
            onClick={handleClick}
            role="button"
            aria-label={`View receipt image from ${transaction.alias || transaction.merchant}`}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    if (transaction.imageUrls && transaction.imageUrls.length > 0) {
                        onThumbnailClick(transaction);
                    }
                }
            }}
            data-testid="transaction-thumbnail"
        >
            {isLoading && !hasError && (
                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            )}
            {hasError ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">
                    <ImageIcon size={16} className="text-slate-400" />
                </div>
            ) : (
                <img
                    src={transaction.thumbnailUrl}
                    alt={`Receipt from ${transaction.alias || transaction.merchant}`}
                    className={`w-10 h-[50px] object-cover rounded border border-slate-200 dark:border-slate-700 ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity hover:border-blue-400`}
                    onLoad={handleLoad}
                    onError={handleError}
                />
            )}
        </div>
    );
};

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
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    // Story 7.12: Theme-aware styling using CSS variables (AC #8)
    const isDark = theme === 'dark';

    // Card styling using CSS variables
    const cardStyle: React.CSSProperties = {
        backgroundColor: 'var(--surface)',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        transition: 'border-color 0.15s ease',
    };

    // Pagination button styling
    const paginationButtonStyle: React.CSSProperties = {
        backgroundColor: 'var(--surface)',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        color: 'var(--primary)',
    };

    const handleThumbnailClick = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
    };

    const handleCloseViewer = () => {
        setSelectedTransaction(null);
    };

    return (
        <div className="pb-24">
            {/* Header with consistent styling (AC #8) */}
            <button
                onClick={onBack}
                className="mb-4 min-w-11 min-h-11 flex items-center justify-center"
                style={{ color: 'var(--primary)' }}
                aria-label={t('back')}
            >
                <ArrowLeft size={24} strokeWidth={2} />
            </button>
            <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--primary)' }}>{t('history')}</h1>

            {/* Transaction list with hover states */}
            <div className="space-y-3">
                {historyTrans.map(tx => (
                    <div
                        key={tx.id}
                        onClick={() => onEditTransaction(tx)}
                        className="p-4 rounded-xl border flex gap-3 cursor-pointer"
                        style={cardStyle}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = isDark ? '#334155' : '#e2e8f0'; }}
                    >
                        {/* Thumbnail column - only if thumbnailUrl exists */}
                        <TransactionThumbnail
                            transaction={tx}
                            onThumbnailClick={handleThumbnailClick}
                        />

                        {/* Transaction details */}
                        <div className="flex-1 flex justify-between">
                            <div>
                                <div className="font-medium" style={{ color: 'var(--primary)' }}>{tx.alias || tx.merchant}</div>
                                <div className="text-xs" style={{ color: 'var(--secondary)' }}>{tx.merchant}</div>
                                <CategoryBadge category={tx.category} mini />
                                <div className="text-xs mt-1" style={{ color: 'var(--secondary)' }}>
                                    {formatDate(tx.date, dateFormat)}
                                </div>
                            </div>
                            <div className="font-bold" style={{ color: 'var(--primary)' }}>{formatCurrency(tx.total, currency)}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination controls */}
            <div className="flex justify-center items-center gap-4 mt-6">
                <button
                    disabled={historyPage === 1}
                    onClick={() => onSetHistoryPage(p => p - 1)}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 font-medium"
                    style={paginationButtonStyle}
                >
                    {t('prev')}
                </button>
                <span className="py-2" style={{ color: 'var(--secondary)' }}>
                    {t('page')} {historyPage}
                </span>
                <button
                    disabled={historyPage >= totalHistoryPages}
                    onClick={() => onSetHistoryPage(p => p + 1)}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 font-medium"
                    style={paginationButtonStyle}
                >
                    {t('next')}
                </button>
            </div>

            {/* Image Viewer Modal */}
            {selectedTransaction && selectedTransaction.imageUrls && selectedTransaction.imageUrls.length > 0 && (
                <ImageViewer
                    images={selectedTransaction.imageUrls}
                    merchantName={selectedTransaction.alias || selectedTransaction.merchant}
                    onClose={handleCloseViewer}
                />
            )}
        </div>
    );
};
