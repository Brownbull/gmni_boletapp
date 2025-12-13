import React, { useState, useMemo } from 'react';
import { ArrowLeft, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { CategoryBadge } from '../components/CategoryBadge';
import { ImageViewer } from '../components/ImageViewer';
import { getDuplicateIds } from '../services/duplicateDetectionService';
import { normalizeTransaction } from '../utils/transactionNormalizer';

// Story 9.11: Extended transaction interface with v2.6.0 fields for unified display
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
    // v2.6.0 fields for unified card display (Story 9.11 AC #3)
    time?: string;
    city?: string;
    country?: string;
    currency?: string;
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
    // Story 9.11: Additional props for duplicate detection and normalization
    /** All transactions for duplicate detection across pages (AC #4, #6, #7) */
    allTransactions?: Transaction[];
    /** User's default city for legacy transactions (AC #2) */
    defaultCity?: string;
    /** User's default country for legacy transactions (AC #2) */
    defaultCountry?: string;
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
    // Story 9.11: New props for duplicate detection and normalization
    allTransactions = [],
    defaultCity = '',
    defaultCountry = '',
}) => {
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    // Story 7.12: Theme-aware styling using CSS variables (AC #8)
    const isDark = theme === 'dark';

    // Story 9.11 AC #4, #6, #7: Calculate duplicate IDs for visual warning
    // Detects duplicates in real-time across ALL transactions (not just current page)
    const duplicateIds = useMemo(() => {
        // Use allTransactions if provided, otherwise fall back to current page
        const transactionsToCheck = allTransactions.length > 0 ? allTransactions : historyTrans;
        return getDuplicateIds(transactionsToCheck as any);
    }, [allTransactions, historyTrans]);

    // Story 9.11 AC #1, #2: Normalize transactions with defaults
    const userDefaults = useMemo(() => ({
        city: defaultCity,
        country: defaultCountry,
    }), [defaultCity, defaultCountry]);

    // Helper to format location string (AC #3: City, Country format)
    const formatLocation = (city?: string, country?: string): string | null => {
        if (city && country) return `${city}, ${country}`;
        if (city) return city;
        if (country) return country;
        return null;
    };

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

            {/* Transaction list with unified card display (Story 9.11 AC #3) */}
            <div className="space-y-3">
                {historyTrans.map(tx => {
                    // Normalize transaction with defaults (AC #1, #2)
                    const normalizedTx = normalizeTransaction(tx as any, userDefaults);
                    // Check if this transaction is a duplicate (AC #4, #5)
                    const isDuplicate = duplicateIds.has(tx.id);
                    // Format additional display data (AC #3)
                    const location = formatLocation(normalizedTx.city, normalizedTx.country);
                    // Use transaction's currency if available, else fall back to app currency
                    const displayCurrency = tx.currency || currency;

                    return (
                        <div
                            key={tx.id}
                            onClick={() => onEditTransaction(tx)}
                            className={`p-4 rounded-xl border flex gap-3 cursor-pointer ${isDuplicate ? 'border-amber-400' : ''}`}
                            style={{
                                ...cardStyle,
                                borderColor: isDuplicate ? (isDark ? '#fbbf24' : '#f59e0b') : cardStyle.borderColor,
                            }}
                            onMouseEnter={(e) => {
                                if (!isDuplicate) e.currentTarget.style.borderColor = 'var(--accent)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = isDuplicate
                                    ? (isDark ? '#fbbf24' : '#f59e0b')
                                    : (isDark ? '#334155' : '#e2e8f0');
                            }}
                            data-testid="transaction-card"
                            aria-label={`${tx.alias || tx.merchant}, ${formatCurrency(tx.total, displayCurrency)}${isDuplicate ? ', potential duplicate' : ''}`}
                        >
                            {/* Thumbnail column - only if thumbnailUrl exists */}
                            <TransactionThumbnail
                                transaction={tx}
                                onThumbnailClick={handleThumbnailClick}
                            />

                            {/* Transaction details - Row-aligned layout */}
                            <div className="flex-1 min-w-0">
                                {/* ROW 1: Alias + Currency/Amount */}
                                <div className="flex justify-between items-start gap-2">
                                    <div className="font-semibold truncate" style={{ color: 'var(--primary)' }}>
                                        {tx.alias || tx.merchant}
                                    </div>
                                    <div className="font-bold whitespace-nowrap flex-shrink-0" style={{ color: 'var(--primary)' }}>
                                        {displayCurrency} {formatCurrency(tx.total, displayCurrency).replace(/^[A-Z$€£¥]+\s?/, '')}
                                    </div>
                                </div>

                                {/* ROW 2: Merchant + Date */}
                                <div className="flex justify-between items-start gap-2">
                                    <div className="text-xs" style={{ color: 'var(--secondary)' }}>
                                        {tx.merchant.length > 20 ? `${tx.merchant.substring(0, 20)}...` : tx.merchant}
                                    </div>
                                    <div className="text-xs whitespace-nowrap flex-shrink-0" style={{ color: 'var(--secondary)' }}>
                                        {formatDate(tx.date, dateFormat)}
                                    </div>
                                </div>

                                {/* ROW 3: Category + Location */}
                                <div className="flex justify-between items-center gap-2 mt-1">
                                    <CategoryBadge category={tx.category} mini />
                                    {location && (
                                        <div className="text-xs whitespace-nowrap flex-shrink-0" style={{ color: 'var(--secondary)' }}>
                                            {location}
                                        </div>
                                    )}
                                </div>

                                {/* Duplicate warning indicator (AC #5) - separate row */}
                                {isDuplicate && (
                                    <div
                                        className="flex items-center gap-1 text-xs mt-1.5 text-amber-600 dark:text-amber-400"
                                        role="alert"
                                        aria-label={t('potentialDuplicate')}
                                    >
                                        <AlertTriangle size={12} className="flex-shrink-0" />
                                        <span className="font-medium">{t('potentialDuplicate')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
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
