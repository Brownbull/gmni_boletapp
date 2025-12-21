import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Image as ImageIcon, AlertTriangle, Inbox } from 'lucide-react';
import { CategoryBadge } from '../components/CategoryBadge';
import { ImageViewer } from '../components/ImageViewer';
// Story 10a.1: Filter bar for consolidated home view (AC #2)
import { HistoryFilterBar } from '../components/history/HistoryFilterBar';
// Story 9.12: Category translations
import type { Language } from '../utils/translations';
// Story 10a.1: Filter and duplicate detection utilities (AC #2, #4)
import { useHistoryFilters } from '../hooks/useHistoryFilters';
import { getDuplicateIds } from '../services/duplicateDetectionService';
import {
    extractAvailableFilters,
    filterTransactionsByHistoryFilters,
} from '../utils/historyFilterUtils';
import type { Transaction as TransactionType } from '../types/transaction';

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
    // v2.6.0 fields for unified card display
    time?: string;
    city?: string;
    country?: string;
    currency?: string;
}

interface DashboardViewProps {
    /** Story 10a.1: Used as fallback when allTransactions is empty */
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
    /** Story 10a.1: Scan CTA removed - prop kept for backward compatibility but unused */
    onTriggerScan?: () => void;
    /** Story 10a.1: All transactions for display (now used for full paginated list) */
    allTransactions?: Transaction[];
    /** Story 9.12: Language for category translations */
    lang?: Language;
}

// Story 9.11: Thumbnail component matching HistoryView style
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
    // Story 10a.1: Scan CTA removed - prop kept for backward compatibility (AC #1)
    onTriggerScan: _onTriggerScan,
    allTransactions = [],
    // Story 9.12: Language for translations
    lang = 'en',
}) => {
    // Story 7.12: Theme-aware styling using CSS variables (AC #1, #2, #8)
    const isDark = theme === 'dark';

    // Story 9.11: State for ImageViewer modal
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    // Story 10a.1: Pagination state (AC #3)
    const [historyPage, setHistoryPage] = useState(1);
    const pageSize = 10;

    // Story 10a.1: Access filter state from context (AC #2, #6)
    const { state: filterState, hasActiveFilters } = useHistoryFilters();

    // Story 10a.1: Use allTransactions for display (AC #3)
    const allTx = allTransactions.length > 0 ? allTransactions : transactions;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const totalSpent = allTx.reduce((a, b) => a + b.total, 0);
    const monthSpent = allTx
        .filter(tx => tx.date.startsWith(currentMonth))
        .reduce((a, b) => a + b.total, 0);

    // Story 10a.1: Extract available filters from transactions (AC #2)
    const availableFilters = useMemo(() => {
        return extractAvailableFilters(allTx as unknown as TransactionType[]);
    }, [allTx]);

    // Story 10a.1: Apply filters to transactions (AC #2)
    const filteredTransactions = useMemo(() => {
        return filterTransactionsByHistoryFilters(allTx as unknown as TransactionType[], filterState);
    }, [allTx, filterState]);

    // Story 10a.1: Paginate filtered results (AC #3)
    const totalPages = Math.ceil(filteredTransactions.length / pageSize);
    const paginatedTransactions = useMemo(() => {
        const startIndex = (historyPage - 1) * pageSize;
        return filteredTransactions.slice(startIndex, startIndex + pageSize);
    }, [filteredTransactions, historyPage, pageSize]);

    // Story 10a.1: Duplicate detection (AC #4)
    const duplicateIds = useMemo(() => {
        return getDuplicateIds(allTx as unknown as TransactionType[]);
    }, [allTx]);

    // Story 10a.1: Reset to page 1 when filters change
    useEffect(() => {
        setHistoryPage(1);
    }, [filterState]);

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

    // Story 9.11: Helper to format location string (City, Country format)
    const formatLocation = (city?: string, country?: string): string | null => {
        if (city && country) return `${city}, ${country}`;
        if (city) return city;
        if (country) return country;
        return null;
    };

    // Story 9.11: Thumbnail click handler
    const handleThumbnailClick = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
    };

    const handleCloseViewer = () => {
        setSelectedTransaction(null);
    };

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

            {/* Story 10a.1: Filter bar below summary cards (AC #2) */}
            <HistoryFilterBar
                availableFilters={availableFilters}
                theme={theme}
                locale={lang}
                t={t}
                totalCount={allTx.length}
                filteredCount={filteredTransactions.length}
            />

            {/* Story 10a.1: Transaction list with filters, pagination, and duplicate detection */}
            {filteredTransactions.length === 0 && hasActiveFilters ? (
                /* Story 10a.1: Empty state when filters match nothing */
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Inbox size={48} className="mb-4 opacity-50" style={{ color: 'var(--secondary)' }} />
                    <p className="text-lg font-medium mb-2" style={{ color: 'var(--primary)' }}>{t('noMatchingTransactions')}</p>
                    <p className="text-sm opacity-75" style={{ color: 'var(--secondary)' }}>{t('tryDifferentFilters')}</p>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {paginatedTransactions.map(tx => {
                            // Use transaction's currency if available, else fall back to app currency
                            const displayCurrency = tx.currency || currency;
                            const location = formatLocation(tx.city, tx.country);
                            // Story 10a.1: Check if transaction is a duplicate (AC #4)
                            const isDuplicate = tx.id ? duplicateIds.has(tx.id) : false;

                            return (
                                <div
                                    key={tx.id}
                                    onClick={() => onEditTransaction(tx as Transaction)}
                                    className={`p-4 rounded-xl border flex gap-3 cursor-pointer ${isDuplicate ? 'border-amber-400' : ''}`}
                                    style={isDuplicate ? { ...getTransactionCardStyle(), borderColor: '#fbbf24' } : getTransactionCardStyle()}
                                    onMouseEnter={(e) => { if (!isDuplicate) e.currentTarget.style.borderColor = 'var(--accent)'; }}
                                    onMouseLeave={(e) => { if (!isDuplicate) e.currentTarget.style.borderColor = isDark ? '#334155' : '#e2e8f0'; }}
                                    data-testid="transaction-card"
                                >
                                    {/* Thumbnail column - only if thumbnailUrl exists */}
                                    <TransactionThumbnail
                                        transaction={tx as Transaction}
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

                                        {/* ROW 3: Category + Location - Story 9.12: Translated category */}
                                        <div className="flex justify-between items-center gap-2 mt-1">
                                            <CategoryBadge category={tx.category} mini lang={lang} />
                                            {location && (
                                                <div className="text-xs whitespace-nowrap flex-shrink-0" style={{ color: 'var(--secondary)' }}>
                                                    {location}
                                                </div>
                                            )}
                                        </div>

                                        {/* Story 10a.1: Duplicate badge (AC #4) */}
                                        {isDuplicate && (
                                            <div className="flex items-center gap-1 text-xs mt-1.5 text-amber-600 dark:text-amber-400">
                                                <AlertTriangle size={12} className="flex-shrink-0" />
                                                <span className="font-medium">{t('potentialDuplicate')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Story 10a.1: Pagination controls (AC #3) */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-6">
                            <button
                                disabled={historyPage === 1}
                                onClick={() => setHistoryPage(p => p - 1)}
                                className="px-4 py-2 border rounded-lg disabled:opacity-50 min-h-11"
                                style={{
                                    borderColor: isDark ? '#334155' : '#e2e8f0',
                                    backgroundColor: 'var(--surface)',
                                    color: 'var(--primary)',
                                }}
                            >
                                {t('prev')}
                            </button>
                            <span style={{ color: 'var(--secondary)' }}>
                                {t('page')} {historyPage} / {totalPages}
                            </span>
                            <button
                                disabled={historyPage >= totalPages}
                                onClick={() => setHistoryPage(p => p + 1)}
                                className="px-4 py-2 border rounded-lg disabled:opacity-50 min-h-11"
                                style={{
                                    borderColor: isDark ? '#334155' : '#e2e8f0',
                                    backgroundColor: 'var(--surface)',
                                    color: 'var(--primary)',
                                }}
                            >
                                {t('next')}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Story 9.11: Image Viewer Modal */}
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
