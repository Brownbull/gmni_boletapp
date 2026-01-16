/**
 * HistoryView - Transaction History with Filtering
 *
 * Story 9.19: History Transaction Filters
 * Story 14.14: Transaction List Redesign
 *
 * Features:
 * - Card-based transaction display with expandable items
 * - Date grouping with sticky headers
 * - Filter chips for active filters
 * - Swipe navigation for time periods
 * - PageTransition and staggered card animations
 * - Empty state with scan prompt
 *
 * @see docs/sprint-artifacts/epic9/story-9.19-history-transaction-filters.md
 * @see docs/sprint-artifacts/epic14/stories/story-14.14-transaction-list-redesign.md
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Inbox, FileText, ChevronLeft, ChevronRight, Camera, BarChart2, Loader2, Download, AlertTriangle } from 'lucide-react';
import { ProfileDropdown, ProfileAvatar, getInitials } from '../components/ProfileDropdown';
import { ImageViewer } from '../components/ImageViewer';
import { IconFilterBar } from '../components/history/IconFilterBar';
import { TemporalBreadcrumb } from '../components/history/TemporalBreadcrumb';
import { SearchBar } from '../components/history/SearchBar';
// Story 14.15b: Use consolidated TransactionCard from shared transactions folder
import { TransactionCard } from '../components/transactions';
import { DateGroupHeader, groupTransactionsByDate, formatDateGroupLabel, calculateGroupTotal } from '../components/history/DateGroupHeader';
import { FilterChips } from '../components/history/FilterChips';
// Story 14.31 Session 3: Sort control
import { SortControl } from '../components/history/SortControl';
import type { SortOption } from '../components/history/SortControl';
import { SelectionBar } from '../components/history/SelectionBar';
import { AssignGroupModal } from '../components/history/AssignGroupModal';
import { CreateGroupModal } from '../components/history/CreateGroupModal';
import { EditGroupModal } from '../components/history/EditGroupModal';
import { DeleteGroupModal } from '../components/history/DeleteGroupModal';
import { DeleteTransactionsModal } from '../components/history/DeleteTransactionsModal';
import type { TransactionPreview } from '../components/history/DeleteTransactionsModal';
import type { TransactionGroup } from '../types/transactionGroup';
import { PageTransition } from '../components/animation/PageTransition';
import { TransitionChild } from '../components/animation/TransitionChild';
// Story 14.13: Duplicate detection for transactions
import { getDuplicateIds, getDuplicateCount, filterToDuplicatesGrouped } from '../services/duplicateDetectionService';
import { normalizeTransaction } from '../utils/transactionNormalizer';
import {
    extractAvailableFilters,
    filterTransactionsByHistoryFilters,
} from '../utils/historyFilterUtils';
import { useHistoryFilters } from '../hooks/useHistoryFilters';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useSelectionMode } from '../hooks/useSelectionMode';
import { useGroups } from '../hooks/useGroups';
import { getFirestore } from 'firebase/firestore';
import { deleteTransactionsBatch } from '../services/firestore';
import { assignTransactionsToGroup, removeTransactionsFromGroup, updateGroup, deleteGroup, updateGroupOnTransactions, clearGroupFromTransactions } from '../services/groupService';
// Story 9.12: Category translations (AC #1, #2)
import type { Language } from '../utils/translations';
// Story 14.15c: CSV Export utilities
import { downloadMonthlyTransactions, downloadYearlyStatistics } from '../utils/csvExport';

// ============================================================================
// Constants
// ============================================================================

/**
 * Story 14.14: Page size options for transaction list pagination.
 * Default is 15 items per page, with options to switch to 30 or 60.
 */
const PAGE_SIZE_OPTIONS = [15, 30, 60] as const;
type PageSizeOption = typeof PAGE_SIZE_OPTIONS[number];
const DEFAULT_PAGE_SIZE: PageSizeOption = 15;

/**
 * Story 14.31 Session 3: Sort options for History view.
 * - Date (newest first) - default
 * - Scan date (when scanned/ingresado)
 * - Total (highest/lowest)
 * - Store name (A-Z)
 */
// Story 14.31: Removed 'scanDate' option - now has dedicated RecentScansView
type HistorySortKey = 'date' | 'total' | 'merchant';
const HISTORY_SORT_OPTIONS: SortOption[] = [
    { key: 'date', labelEn: 'Date', labelEs: 'Fecha' },
    { key: 'total', labelEn: 'Total', labelEs: 'Total' },
    { key: 'merchant', labelEn: 'Store', labelEs: 'Tienda' },
];
const DEFAULT_HISTORY_SORT_KEY: HistorySortKey = 'date';
const DEFAULT_HISTORY_SORT_DIRECTION: 'asc' | 'desc' = 'desc';

/**
 * Story 14.31 Session 3: Sort transactions within date groups.
 * When sorting by non-date criteria, items within each date group are sorted.
 * Note: scanDate sort was moved to dedicated RecentScansView.
 */
function sortTransactionsWithinGroups(
    txs: Transaction[],
    sortBy: HistorySortKey,
    direction: 'asc' | 'desc'
): Transaction[] {
    if (sortBy === 'date') {
        // For date sort, sort all transactions by date
        return [...txs].sort((a, b) => {
            const comparison = a.date.localeCompare(b.date);
            return direction === 'desc' ? -comparison : comparison;
        });
    }

    // For non-date sorts, group by date first, then sort within groups
    const grouped = new Map<string, Transaction[]>();
    for (const tx of txs) {
        const date = tx.date;
        if (!grouped.has(date)) {
            grouped.set(date, []);
        }
        grouped.get(date)!.push(tx);
    }

    // Sort each group by the selected criteria
    for (const [_date, groupTxs] of grouped) {
        groupTxs.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'total':
                    comparison = a.total - b.total;
                    break;
                case 'merchant':
                    comparison = (a.alias || a.merchant).localeCompare(b.alias || b.merchant);
                    break;
            }
            return direction === 'desc' ? -comparison : comparison;
        });
    }

    // Flatten back to array, maintaining date order (newest first by default)
    const sortedDates = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));
    const result: Transaction[] = [];
    for (const date of sortedDates) {
        result.push(...grouped.get(date)!);
    }
    return result;
}

// ============================================================================
// Types
// ============================================================================

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
    // Story 14.15b: Group display fields
    groupId?: string;
    groupName?: string;
    groupColor?: string;
    // Story 14.31: Scan date for sorting by when transaction was added
    createdAt?: any; // Firestore Timestamp or Date
}

interface HistoryViewProps {
    historyTrans: Transaction[];
    historyPage: number;
    totalHistoryPages: number;
    theme: string;
    /** Story 14.21: Color theme for unified category colors */
    colorTheme?: 'normal' | 'professional' | 'mono';
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
    /** Story 9.12: Language for category translations (AC #1, #2) */
    lang?: Language;
    // Story 14.15: User and app IDs for group operations
    /** Authenticated user ID */
    userId?: string | null;
    /** App ID for Firestore path */
    appId?: string;
    /** Callback when transactions are deleted */
    onTransactionsDeleted?: (deletedIds: string[]) => void;
    // Story 14.15b: Profile dropdown props (same as ReportsView)
    /** User name for profile avatar */
    userName?: string;
    /** User email for profile dropdown */
    userEmail?: string;
    /** General navigation handler for profile dropdown menu items */
    onNavigateToView?: (view: string) => void;
    // Story 14.27: Pagination props for loading older transactions
    /** True if more pages are available beyond current transactions */
    hasMoreTransactions?: boolean;
    /** Callback to load more transactions from Firestore */
    onLoadMoreTransactions?: () => void;
    /** True while loading more transactions */
    loadingMoreTransactions?: boolean;
    /** True if at listener limit (100 transactions) - indicates pagination available */
    isAtListenerLimit?: boolean;
    /** Story 14.13: Font color mode for category text colors (colorful vs plain) */
    fontColorMode?: 'colorful' | 'plain';
    /** Story 14.35b: How to display foreign locations (code or flag) */
    foreignLocationFormat?: 'code' | 'flag';
}

// ============================================================================
// Component
// ============================================================================

/**
 * Inner component that uses the filter context.
 * Must be rendered inside HistoryFiltersProvider.
 */
const HistoryViewInner: React.FC<HistoryViewProps> = ({
    historyTrans,
    // Story 14.14: historyPage and onSetHistoryPage now managed internally
    historyPage: _historyPage,
    totalHistoryPages: _totalHistoryPages,
    theme,
    // Story 14.21: Color theme for unified category colors
    colorTheme = 'normal',
    currency,
    dateFormat,
    t,
    formatCurrency,
    formatDate,
    onBack,
    onSetHistoryPage: _onSetHistoryPage,
    onEditTransaction,
    // Story 9.11: New props for duplicate detection and normalization
    allTransactions = [],
    defaultCity = '',
    defaultCountry = '',
    // Story 9.12: Language for translations
    lang = 'en',
    // Story 14.15: User and app IDs for group operations
    userId = null,
    appId = 'boletapp',
    onTransactionsDeleted,
    // Story 14.15b: Profile dropdown props
    userName = '',
    userEmail = '',
    onNavigateToView,
    // Story 14.27: Pagination props for loading older transactions
    hasMoreTransactions = false,
    onLoadMoreTransactions,
    loadingMoreTransactions = false,
    isAtListenerLimit = false,
    // Story 14.13: Font color mode - receiving this prop triggers re-render when setting changes
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fontColorMode: _fontColorMode,
    // Story 14.35b: Foreign location display format
    foreignLocationFormat = 'code',
}) => {
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    // Story 14.14: Search functionality
    const [searchQuery, setSearchQuery] = useState('');
    // Story 14.14: Page size state (15, 30, or 60 items per page)
    const [pageSize, setPageSize] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE);
    // Story 14.14: Internal page state - ignore historyPage prop, manage internally
    const [currentPage, setCurrentPage] = useState(1);
    // Story 14.14: Collapsible header state
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
    // Story 14.15: Selection mode for batch operations
    const {
        isSelectionMode,
        selectedIds,
        selectedCount,
        enterSelectionMode: _enterSelectionMode,
        exitSelectionMode,
        toggleSelection,
        isSelected,
        handleLongPressStart,
        handleLongPressEnd,
        handleLongPressMove,
    } = useSelectionMode();
    // Story 14.15: Modal states for group assignment and delete confirmation
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showEditGroupModal, setShowEditGroupModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState<TransactionGroup | null>(null);
    const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
    const [deletingGroup, setDeletingGroup] = useState<TransactionGroup | null>(null);
    const [isDeletingGroup, setIsDeletingGroup] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    // Story 14.15c: Export state
    const [isExporting, setIsExporting] = useState(false);
    // Story 14.31 Session 3: Sort state
    const [sortBy, setSortBy] = useState<HistorySortKey>(DEFAULT_HISTORY_SORT_KEY);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(DEFAULT_HISTORY_SORT_DIRECTION);
    // Story 14.13: Duplicate filter state
    const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
    // Story 14.15b: Profile dropdown state
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileButtonRef = useRef<HTMLButtonElement>(null);

    // Story 14.15b: Handle profile navigation
    const handleProfileNavigate = useCallback((view: string) => {
        setIsProfileOpen(false);
        if (onNavigateToView) {
            onNavigateToView(view);
        }
    }, [onNavigateToView]);

    // Story 14.15: Groups hook for group assignment
    const { groups, loading: groupsLoading, addGroup, recalculateCounts } = useGroups(userId, appId);

    // Story 14.15b: Recalculate group counts on initial load to fix any corrupted counts
    const hasRecalculated = useRef(false);
    useEffect(() => {
        if (!groupsLoading && groups.length > 0 && allTransactions.length > 0 && !hasRecalculated.current) {
            hasRecalculated.current = true;
            // Recalculate in background without blocking UI
            recalculateCounts(allTransactions).catch((err) => {
                console.warn('[HistoryView] Failed to recalculate group counts:', err);
            });
        }
    }, [groupsLoading, groups.length, allTransactions.length, recalculateCounts]);
    const lastScrollY = useRef(0);
    const scrollThreshold = 80; // Pixels to scroll before collapsing (increased for stability)
    const scrollDeltaThreshold = 15; // Minimum scroll delta to trigger state change
    const lastCollapseTime = useRef(0); // Debounce timer
    const {
        state: filterState,
        dispatch: filterDispatch,
        hasActiveFilters,
        goNextPeriod,
        goPrevPeriod,
        canGoNext,
        canGoPrev,
        hasTemporalFilter,
    } = useHistoryFilters();

    // Story 14.14: Animation and swipe hooks
    const prefersReducedMotion = useReducedMotion();
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLElement | null>(null);
    // Story 14.27: Track when "load more" completes to scroll to top
    const wasLoadingMore = useRef(false);

    // Story 14.14: Find scroll parent and set up scroll detection for collapsible header
    useEffect(() => {
        // Find the scrolling parent element (main element with overflow-y-auto)
        const findScrollParent = (element: HTMLElement | null): HTMLElement | null => {
            if (!element) return null;
            let parent = element.parentElement;
            while (parent) {
                const style = getComputedStyle(parent);
                if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                    return parent;
                }
                parent = parent.parentElement;
            }
            return null;
        };

        if (containerRef.current) {
            scrollContainerRef.current = findScrollParent(containerRef.current);
        }

        const handleScroll = () => {
            const scrollContainer = scrollContainerRef.current;
            const currentScrollY = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
            const now = Date.now();

            // At top of page - always expand (no debounce)
            if (currentScrollY <= 10) {
                setIsHeaderCollapsed(false);
                lastScrollY.current = currentScrollY;
                lastCollapseTime.current = now;
                return;
            }

            const scrollDelta = currentScrollY - lastScrollY.current;
            const timeSinceLastChange = now - lastCollapseTime.current;

            // Debounce: wait at least 150ms between state changes to prevent flickering
            if (timeSinceLastChange < 150) {
                lastScrollY.current = currentScrollY;
                return;
            }

            // Scrolling down past threshold - collapse (require larger delta)
            if (scrollDelta > scrollDeltaThreshold && currentScrollY > scrollThreshold) {
                setIsHeaderCollapsed(true);
                lastCollapseTime.current = now;
            }
            // Scrolling up significantly - expand
            else if (scrollDelta < -scrollDeltaThreshold) {
                setIsHeaderCollapsed(false);
                lastCollapseTime.current = now;
            }

            lastScrollY.current = currentScrollY;
        };

        // Attach to scroll parent if found, otherwise use window
        const scrollTarget = scrollContainerRef.current || window;
        scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
        return () => scrollTarget.removeEventListener('scroll', handleScroll);
    }, []);

    // Story 14.14 AC #4: Swipe navigation for time periods
    const {
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        isSwiping,
        swipeDirection,
        swipeProgress,
    } = useSwipeNavigation({
        onSwipeLeft: goNextPeriod,
        onSwipeRight: goPrevPeriod,
        enabled: hasTemporalFilter,
        hapticEnabled: !prefersReducedMotion,
    });

    // Use all transactions for filtering (not just current page)
    const transactionsToFilter = allTransactions.length > 0 ? allTransactions : historyTrans;

    // Story 9.19: Extract available filters from ALL transactions (AC #7 - memoized)
    const availableFilters = useMemo(() => {
        return extractAvailableFilters(transactionsToFilter as any);
    }, [transactionsToFilter]);

    // Story 9.19: Apply filters to transactions (AC #7 - memoized for performance)
    // Story 14.14: Also apply search query filter
    const filteredTransactions = useMemo(() => {
        let result = filterTransactionsByHistoryFilters(transactionsToFilter as any, filterState);

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter((tx: any) => {
                const merchantMatch = tx.merchant?.toLowerCase().includes(query);
                const aliasMatch = tx.alias?.toLowerCase().includes(query);
                const itemsMatch = tx.items?.some((item: any) =>
                    item.name?.toLowerCase().includes(query)
                );
                return merchantMatch || aliasMatch || itemsMatch;
            });
        }

        return result;
    }, [transactionsToFilter, filterState, searchQuery]);

    // Story 14.13: Detect potential duplicate transactions in filtered results
    const duplicateCount = useMemo(() => {
        return getDuplicateCount(filteredTransactions as any);
    }, [filteredTransactions]);

    const hasAnyDuplicates = duplicateCount > 0;

    // Story 14.13: Get duplicate transactions grouped together when filter is active
    const duplicateTransactions = useMemo(() => {
        if (showDuplicatesOnly) {
            return filterToDuplicatesGrouped(filteredTransactions as any);
        }
        return [];
    }, [filteredTransactions, showDuplicatesOnly]);

    // Story 9.19 AC #5: Reset pagination when filters change
    // Use a ref to track if this is the first render or an actual filter change
    const prevFilterStateRef = useRef<string | null>(null);
    useEffect(() => {
        const currentFilterKey = JSON.stringify(filterState);
        // Only reset if filters actually changed (not on initial render or page navigation)
        if (prevFilterStateRef.current !== null && prevFilterStateRef.current !== currentFilterKey) {
            setCurrentPage(1);
        }
        prevFilterStateRef.current = currentFilterKey;
    }, [filterState]);

    // Story 14.27: Scroll to top when "load more" completes (like turning to next page in a book)
    useEffect(() => {
        // Detect transition from loading -> not loading
        if (wasLoadingMore.current && !loadingMoreTransactions) {
            // Loading just finished - scroll to top
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
        wasLoadingMore.current = loadingMoreTransactions;
    }, [loadingMoreTransactions]);

    // Story 14.27: Helper to scroll to top (used for page navigation)
    const scrollToTop = useCallback(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, []);

    // Story 14.27: Navigate to page and scroll to top (like turning pages in a book)
    const goToPage = useCallback((page: number) => {
        setCurrentPage(page);
        scrollToTop();
    }, [scrollToTop]);

    // Paginate filtered results - Story 14.14: Variable page size (15/30/60)
    // Story 14.31 Session 3: Apply sorting before pagination
    // Story 14.13: Use duplicate transactions when filter is active
    const transactionsToDisplay = showDuplicatesOnly ? duplicateTransactions : filteredTransactions;
    const totalFilteredPages = Math.max(1, Math.ceil(transactionsToDisplay.length / pageSize));
    const paginatedTransactions = useMemo(() => {
        // Apply sorting first
        const sorted = sortTransactionsWithinGroups(transactionsToDisplay as Transaction[], sortBy, sortDirection);
        const startIndex = (currentPage - 1) * pageSize;
        return sorted.slice(startIndex, startIndex + pageSize);
    }, [transactionsToDisplay, currentPage, pageSize, sortBy, sortDirection]);

    // Story 14.14 AC #2: Group transactions by date
    const groupedTransactions = useMemo(() => {
        return groupTransactionsByDate(paginatedTransactions);
    }, [paginatedTransactions]);

    // Story 9.11 AC #4, #6, #7: Calculate duplicate IDs for visual warning
    const duplicateIds = useMemo(() => {
        return getDuplicateIds(transactionsToFilter as any);
    }, [transactionsToFilter]);

    // Story 9.11 AC #1, #2: Normalize transactions with defaults
    const userDefaults = useMemo(() => ({
        city: defaultCity,
        country: defaultCountry,
    }), [defaultCity, defaultCountry]);

    const handleThumbnailClick = useCallback((transaction: Transaction) => {
        setSelectedTransaction(transaction);
    }, []);

    const handleCloseViewer = useCallback(() => {
        setSelectedTransaction(null);
    }, []);

    // Story 14.15c: Determine export type based on temporal filter level
    // Month/Week/Day = detailed export with items (FileText icon)
    // Year/Quarter = statistics export without items (BarChart2 icon)
    const isStatisticsExport = useMemo(() => {
        const level = filterState.temporal.level;
        return level === 'year' || level === 'quarter' || level === 'all';
    }, [filterState.temporal.level]);

    // Story 14.15c: Handle export based on temporal filter level
    const handleExport = useCallback(async () => {
        if (isExporting || filteredTransactions.length === 0) return;

        setIsExporting(true);
        try {
            const level = filterState.temporal.level;
            const year = filterState.temporal.year || new Date().getFullYear().toString();
            const month = filterState.temporal.month?.split('-')[1] || '01';

            if (level === 'year' || level === 'quarter' || level === 'all') {
                // Statistics export - year/quarter view, no items detail
                downloadYearlyStatistics(filteredTransactions as any, year);
            } else {
                // Detailed export - month/week/day view, with items detail
                downloadMonthlyTransactions(filteredTransactions as any, year, month);
            }
        } catch (err) {
            console.error('[HistoryView] Export failed:', err);
        } finally {
            setIsExporting(false);
        }
    }, [isExporting, filteredTransactions, filterState.temporal]);

    // Story 14.31 Session 3: Handle sort change
    const handleSortChange = useCallback((key: string, direction: 'asc' | 'desc') => {
        setSortBy(key as HistorySortKey);
        setSortDirection(direction);
        goToPage(1); // Reset to first page when sort changes
    }, [goToPage]);

    // Calculate total item count for stagger animation
    const totalItems = useMemo(() => {
        let count = 0;
        groupedTransactions.forEach((txs) => {
            count += 1; // Header
            count += txs.length; // Cards
        });
        return count;
    }, [groupedTransactions]);

    // Touch event handlers for swipe
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        onTouchStart(e.nativeEvent);
    }, [onTouchStart]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        onTouchMove(e.nativeEvent);
    }, [onTouchMove]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        onTouchEnd(e.nativeEvent);
    }, [onTouchEnd]);

    // Story 14.15: Get selected transactions for modals
    const getSelectedTransactions = useCallback((): Transaction[] => {
        const allTx = allTransactions.length > 0 ? allTransactions : historyTrans;
        return allTx.filter((tx) => selectedIds.has(tx.id));
    }, [allTransactions, historyTrans, selectedIds]);

    // Story 14.15: Get transaction previews for delete modal
    const getTransactionPreviews = useCallback((): TransactionPreview[] => {
        return getSelectedTransactions().map((tx) => ({
            id: tx.id,
            displayName: tx.alias || tx.merchant,
            total: tx.total,
            currency: tx.currency || currency,
        }));
    }, [getSelectedTransactions, currency]);

    // Story 14.15: Handle group assignment
    const handleAssignGroup = useCallback(async (groupId: string, groupName: string) => {
        if (!userId) {
            console.error('[HistoryView] Cannot assign group: User not authenticated');
            return;
        }

        const selectedTxs = getSelectedTransactions();
        // Note: transactionIds computed but not used directly - kept for debugging/future use
        const _transactionIds = selectedTxs.map((tx) => tx.id);
        void _transactionIds; // Suppress unused warning
        const transactionTotals = new Map<string, number>();
        selectedTxs.forEach((tx) => transactionTotals.set(tx.id, tx.total));

        try {
            const db = getFirestore();

            // Story 14.15b: First, remove transactions from their previous groups (if any)
            // Group transactions by their current groupId to batch the removals
            const txsByPreviousGroup = new Map<string, { ids: string[]; totals: Map<string, number> }>();
            for (const tx of selectedTxs) {
                if (tx.groupId && tx.groupId !== groupId) {
                    if (!txsByPreviousGroup.has(tx.groupId)) {
                        txsByPreviousGroup.set(tx.groupId, { ids: [], totals: new Map() });
                    }
                    const groupData = txsByPreviousGroup.get(tx.groupId)!;
                    groupData.ids.push(tx.id);
                    groupData.totals.set(tx.id, tx.total);
                }
            }

            // Remove from previous groups
            for (const [prevGroupId, { ids, totals }] of txsByPreviousGroup) {
                await removeTransactionsFromGroup(db, userId, appId, ids, prevGroupId, totals);
            }

            // Story 14.15b: Filter out transactions already in the target group
            // Only assign transactions that are NOT already in this group to avoid double-counting
            const txsToAssign = selectedTxs.filter((tx) => tx.groupId !== groupId);
            if (txsToAssign.length > 0) {
                const idsToAssign = txsToAssign.map((tx) => tx.id);
                const totalsToAssign = new Map<string, number>();
                txsToAssign.forEach((tx) => totalsToAssign.set(tx.id, tx.total));

                // Find group color from groups list
                const group = groups.find((g) => g.id === groupId);
                const groupColor = group?.color || '#10b981';
                await assignTransactionsToGroup(
                    db,
                    userId,
                    appId,
                    idsToAssign,
                    groupId,
                    groupName,
                    groupColor,
                    totalsToAssign
                );
            }
            setShowGroupModal(false);
            exitSelectionMode();
        } catch (err) {
            console.error('[HistoryView] Failed to assign group:', err);
        }
    }, [userId, appId, getSelectedTransactions, exitSelectionMode, groups]);

    // Story 14.15: Handle create new group
    const handleCreateGroup = useCallback(async (name: string, color: string) => {
        if (!userId) {
            throw new Error('User not authenticated');
        }

        try {
            const groupId = await addGroup({ name, color });
            // Get the selected transactions for assignment
            const selectedTxs = getSelectedTransactions();
            const transactionIds = selectedTxs.map((tx) => tx.id);
            const transactionTotals = new Map<string, number>();
            selectedTxs.forEach((tx) => transactionTotals.set(tx.id, tx.total));

            const db = getFirestore();

            // Story 14.15b: First, remove transactions from their previous groups (if any)
            // Group transactions by their current groupId to batch the removals
            const txsByPreviousGroup = new Map<string, { ids: string[]; totals: Map<string, number> }>();
            for (const tx of selectedTxs) {
                if (tx.groupId) {
                    if (!txsByPreviousGroup.has(tx.groupId)) {
                        txsByPreviousGroup.set(tx.groupId, { ids: [], totals: new Map() });
                    }
                    const groupData = txsByPreviousGroup.get(tx.groupId)!;
                    groupData.ids.push(tx.id);
                    groupData.totals.set(tx.id, tx.total);
                }
            }

            // Remove from previous groups
            for (const [prevGroupId, { ids, totals }] of txsByPreviousGroup) {
                await removeTransactionsFromGroup(db, userId, appId, ids, prevGroupId, totals);
            }

            await assignTransactionsToGroup(
                db,
                userId,
                appId,
                transactionIds,
                groupId,
                name,
                color,
                transactionTotals
            );
            setShowCreateGroupModal(false);
            setShowGroupModal(false);
            exitSelectionMode();
        } catch (err) {
            console.error('[HistoryView] Failed to create group:', err);
            throw err; // Re-throw so modal can show error
        }
    }, [userId, appId, addGroup, getSelectedTransactions, exitSelectionMode]);

    // Story 14c.4: Handle removing group from selected transactions
    const handleRemoveFromGroup = useCallback(async () => {
        if (!userId) {
            console.error('[HistoryView] Cannot remove from group: User not authenticated');
            return;
        }

        const selectedTxs = getSelectedTransactions();
        const transactionIds = selectedTxs.map((tx) => tx.id);

        try {
            const db = getFirestore();

            // First, decrement counts on the previous groups
            const txsByPreviousGroup = new Map<string, { ids: string[]; totals: Map<string, number> }>();
            for (const tx of selectedTxs) {
                if (tx.groupId) {
                    if (!txsByPreviousGroup.has(tx.groupId)) {
                        txsByPreviousGroup.set(tx.groupId, { ids: [], totals: new Map() });
                    }
                    const groupData = txsByPreviousGroup.get(tx.groupId)!;
                    groupData.ids.push(tx.id);
                    groupData.totals.set(tx.id, tx.total);
                }
            }

            // Remove from previous groups (decrements counts)
            for (const [prevGroupId, { ids, totals }] of txsByPreviousGroup) {
                await removeTransactionsFromGroup(db, userId, appId, ids, prevGroupId, totals);
            }

            // Clear group fields from transactions
            await clearGroupFromTransactions(db, userId, appId, transactionIds);

            setShowGroupModal(false);
            exitSelectionMode();
        } catch (err) {
            console.error('[HistoryView] Failed to remove from group:', err);
        }
    }, [userId, appId, getSelectedTransactions, exitSelectionMode]);

    // Story 14.15: Handle batch delete
    const handleDeleteTransactions = useCallback(async () => {
        if (!userId) {
            throw new Error('User not authenticated');
        }

        const transactionIds = Array.from(selectedIds);

        try {
            const db = getFirestore();
            await deleteTransactionsBatch(db, userId, appId, transactionIds);
            setShowDeleteModal(false);
            exitSelectionMode();
            onTransactionsDeleted?.(transactionIds);
        } catch (err) {
            console.error('[HistoryView] Failed to delete transactions:', err);
            throw err; // Re-throw so modal can show error
        }
    }, [userId, appId, selectedIds, exitSelectionMode, onTransactionsDeleted]);

    // Story 14.15b: Handle edit group - open edit modal
    const handleEditGroup = useCallback((group: TransactionGroup) => {
        setEditingGroup(group);
        setShowEditGroupModal(true);
    }, []);

    // Story 14.15b: Handle save group changes
    const handleSaveGroup = useCallback(async (groupId: string, name: string, color: string) => {
        if (!userId) {
            throw new Error('User not authenticated');
        }

        try {
            const db = getFirestore();
            // Update the group document
            await updateGroup(db, userId, appId, groupId, { name, color });

            // Find transactions that belong to this group and update their denormalized fields
            const transactionsInGroup = allTransactions?.filter(tx => tx.groupId === groupId) || [];
            if (transactionsInGroup.length > 0) {
                const transactionIds = transactionsInGroup.map(tx => tx.id);
                await updateGroupOnTransactions(db, userId, appId, groupId, name, color, transactionIds);
            }

            setShowEditGroupModal(false);
            setEditingGroup(null);
        } catch (err) {
            console.error('[HistoryView] Failed to save group:', err);
            throw err;
        }
    }, [userId, appId, allTransactions]);

    // Story 14.15b: Handle delete group - open confirmation modal
    // Close any open modals first, then show the delete confirmation
    const handleDeleteGroup = useCallback((group: TransactionGroup) => {
        // Close ALL other modals to prevent any confusion
        setShowGroupModal(false);
        setShowCreateGroupModal(false);
        setShowEditGroupModal(false);
        setShowDeleteModal(false); // Important: ensure transaction delete modal is closed
        setDeletingGroup(group);
        setShowDeleteGroupModal(true);
    }, []);

    // Story 14.15b: Confirm group deletion - only removes group, not transactions
    const handleConfirmDeleteGroup = useCallback(async () => {
        if (!userId || !deletingGroup?.id) {
            return;
        }

        setIsDeletingGroup(true);

        try {
            const db = getFirestore();

            // Find transactions that belong to this group and clear their group references
            const transactionsInGroup = allTransactions?.filter(tx => tx.groupId === deletingGroup.id) || [];
            if (transactionsInGroup.length > 0) {
                const transactionIds = transactionsInGroup.map(tx => tx.id);
                await clearGroupFromTransactions(db, userId, appId, transactionIds);
            }

            // Delete the group document
            await deleteGroup(db, userId, appId, deletingGroup.id);

            // Story 14.15b: Clear group filter if the deleted group was being filtered
            // This resets the view to show all transactions
            if (filterState.group.groupIds?.includes(deletingGroup.id)) {
                filterDispatch({ type: 'CLEAR_GROUP' });
            }

            // Exit selection mode if active (user was selecting transactions)
            exitSelectionMode();

            setShowDeleteGroupModal(false);
            setDeletingGroup(null);
        } catch (err) {
            console.error('[HistoryView] Failed to delete group:', err);
        } finally {
            setIsDeletingGroup(false);
        }
    }, [userId, appId, allTransactions, deletingGroup, filterState.group.groupIds, filterDispatch, exitSelectionMode]);

    return (
        <PageTransition viewKey="history" direction="forward">
            <div
                ref={containerRef}
                className="relative"
                style={{
                    paddingBottom: 'calc(6rem + var(--safe-bottom, 0px))',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Story 14.14: Sticky header section with solid background and collapsible elements */}
                {/* Story 14.15b: Header height and padding aligned with ReportsView (72px height) */}
                {/* z-50 ensures header stays above all content when scrolling */}
                <div
                    className="sticky px-4"
                    style={{
                        top: 0,
                        zIndex: 50,
                        backgroundColor: 'var(--bg)',
                        // Ensure solid background covers scrolling content
                        boxShadow: isHeaderCollapsed ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    }}
                >
                    {/* Fixed height header row - matches ReportsView exactly */}
                    <div
                        className="flex items-center justify-between"
                        style={{
                            height: '72px',
                            paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
                        }}
                    >
                        {/* Left side: Back button + Title */}
                        <div className="flex items-center gap-0">
                            {/* Back button - ChevronLeft style */}
                            <button
                                onClick={onBack}
                                className="min-w-10 min-h-10 flex items-center justify-center -ml-1"
                                aria-label={lang === 'es' ? 'Volver' : 'Back'}
                                data-testid="back-button"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                <ChevronLeft size={28} strokeWidth={2.5} />
                            </button>
                            <h1
                                className="font-semibold"
                                style={{
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-primary)',
                                    fontWeight: 700,
                                    fontSize: '20px',
                                }}
                            >
                                {t('purchases')}
                            </h1>
                            {/* Story 14.13b: Clear all filters button moved to FilterChips component */}
                        </div>
                        {/* Right side: Filters + Profile */}
                        <div className="flex items-center gap-3 relative">
                            <IconFilterBar
                                availableFilters={availableFilters}
                                t={t}
                                locale={lang}
                                groups={groups}
                                groupsLoading={groupsLoading}
                                onDeleteGroup={handleDeleteGroup}
                            />
                            {/* Profile Avatar with Dropdown */}
                            <ProfileAvatar
                                ref={profileButtonRef}
                                initials={getInitials(userName)}
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                            />
                            <ProfileDropdown
                                isOpen={isProfileOpen}
                                onClose={() => setIsProfileOpen(false)}
                                userName={userName}
                                userEmail={userEmail}
                                onNavigate={handleProfileNavigate}
                                theme={theme}
                                t={t}
                                triggerRef={profileButtonRef}
                            />
                        </div>
                    </div>

                    {/* Collapsible section: Search bar, Breadcrumbs, Transaction count, Filter chips */}
                    {/* Everything except title bar collapses when scrolling down */}
                    {/* Story 14.31 Session 3: overflow visible when expanded to allow sort dropdown */}
                    <div
                        className="transition-all duration-200 ease-out"
                        style={{
                            maxHeight: isHeaderCollapsed ? '0px' : '300px',
                            opacity: isHeaderCollapsed ? 0 : 1,
                            overflow: isHeaderCollapsed ? 'hidden' : 'visible',
                            // Use pointer-events to prevent interaction when collapsed
                            pointerEvents: isHeaderCollapsed ? 'none' : 'auto',
                        }}
                    >
                        {/* Search bar */}
                        <div className="mb-3">
                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder={lang === 'es' ? 'Buscar transacciones...' : 'Search transactions...'}
                            />
                        </div>

                        {/* Temporal breadcrumb navigation - 5 dropdown buttons */}
                        {/* z-index 40 - lower than IconFilterBar dropdown (z-index 70) */}
                        <div className="relative" style={{ zIndex: 40 }}>
                            <TemporalBreadcrumb locale={lang} availableFilters={availableFilters} />
                        </div>

                        {/* Filter count with duplicate warning, sort control and download button */}
                        <div
                            className="flex items-center justify-between py-2"
                        >
                            <div className="flex items-center gap-2">
                                {/* Story 14.13: Duplicate warning icon */}
                                {hasAnyDuplicates && (
                                    <button
                                        onClick={() => {
                                            setShowDuplicatesOnly(!showDuplicatesOnly);
                                            setCurrentPage(1); // Reset to page 1 when toggling
                                        }}
                                        className={`flex items-center justify-center w-6 h-6 rounded-full transition-all ${
                                            showDuplicatesOnly ? 'ring-2 ring-offset-1 ring-amber-500' : ''
                                        }`}
                                        style={{
                                            backgroundColor: 'var(--warning-bg, #fef3c7)',
                                            color: 'var(--warning-text, #d97706)',
                                        }}
                                        aria-label={
                                            showDuplicatesOnly
                                                ? (lang === 'es' ? 'Mostrar todas las compras' : 'Show all purchases')
                                                : (lang === 'es' ? `${duplicateCount} posibles duplicados - click para filtrar` : `${duplicateCount} potential duplicates - click to filter`)
                                        }
                                        title={
                                            showDuplicatesOnly
                                                ? (lang === 'es' ? 'Mostrar todos' : 'Show all')
                                                : (lang === 'es' ? `${duplicateCount} posibles duplicados` : `${duplicateCount} potential duplicates`)
                                        }
                                    >
                                        <AlertTriangle size={14} />
                                    </button>
                                )}
                                {/* Transaction count - shows filtered or duplicate count */}
                                <span
                                    className="text-sm"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    {showDuplicatesOnly ? duplicateTransactions.length : filteredTransactions.length} {lang === 'es' ? 'compras' : 'purchases'}
                                </span>
                                {/* Story 14.31 Session 3: Sort control */}
                                <SortControl
                                    options={HISTORY_SORT_OPTIONS}
                                    currentSort={sortBy}
                                    sortDirection={sortDirection}
                                    onSortChange={handleSortChange}
                                    lang={lang}
                                />
                            </div>
                            {/* Story 14.15c: Download pill - two icons showing type + download action */}
                            {filteredTransactions.length > 0 && (
                                <button
                                    onClick={handleExport}
                                    disabled={isExporting}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
                                    style={{
                                        color: 'var(--text-tertiary)',
                                        backgroundColor: 'var(--bg-secondary)',
                                    }}
                                    aria-label={isStatisticsExport
                                        ? (lang === 'es' ? 'Descargar estadísticas' : 'Download statistics')
                                        : (lang === 'es' ? 'Descargar transacciones' : 'Download transactions')
                                    }
                                    title={isStatisticsExport
                                        ? (lang === 'es' ? 'Descargar estadísticas (CSV)' : 'Download statistics (CSV)')
                                        : (lang === 'es' ? 'Descargar con detalle de productos (CSV)' : 'Download with product details (CSV)')
                                    }
                                >
                                    {/* Type icon: BarChart2 for stats, FileText for detailed */}
                                    {isStatisticsExport ? (
                                        <BarChart2 size={16} />
                                    ) : (
                                        <FileText size={16} />
                                    )}
                                    {/* Download icon or spinner */}
                                    {isExporting ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Download size={16} />
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Story 14.14 AC #3: Filter chips for active filters */}
                        <FilterChips locale={lang} t={t} />

                        {/* Story 14.13: Duplicate filter chip */}
                        {showDuplicatesOnly && (
                            <div className="flex flex-wrap gap-1.5 pb-2">
                                <button
                                    onClick={() => {
                                        setShowDuplicatesOnly(false);
                                        setCurrentPage(1);
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                                    style={{
                                        backgroundColor: 'var(--warning-text, #d97706)',
                                        color: 'white',
                                    }}
                                >
                                    <AlertTriangle size={10} />
                                    {lang === 'es' ? 'Duplicados' : 'Duplicates'}
                                    <span className="text-xs">&times;</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content area with horizontal padding - matches header padding */}
                <div className="px-3">
                    {/* Story 14.15: Selection Bar (shown when selection mode is active) */}
                    {isSelectionMode && (
                        <div className="mb-3">
                            <SelectionBar
                            selectedCount={selectedCount}
                            onClose={exitSelectionMode}
                            onGroup={() => setShowGroupModal(true)}
                            onDelete={() => setShowDeleteModal(true)}
                            t={t}
                            theme={theme as 'light' | 'dark'}
                            lang={lang as 'en' | 'es'}
                        />
                    </div>
                )}

                {/* Swipe indicator (AC #4) */}
                {isSwiping && hasTemporalFilter && !prefersReducedMotion && (
                    <div
                        className="fixed top-1/2 left-0 right-0 flex justify-center items-center pointer-events-none z-50"
                        style={{ opacity: Math.min(swipeProgress * 1.5, 1) }}
                    >
                        <div
                            className="flex items-center gap-2 px-4 py-2 rounded-full"
                            style={{
                                backgroundColor: 'var(--surface)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }}
                        >
                            {swipeDirection === 'right' && canGoPrev && (
                                <>
                                    <ChevronLeft size={20} style={{ color: 'var(--primary)' }} />
                                    <span style={{ color: 'var(--text-primary)' }}>{t('previousPeriod')}</span>
                                </>
                            )}
                            {swipeDirection === 'left' && canGoNext && (
                                <>
                                    <span style={{ color: 'var(--text-primary)' }}>{t('nextPeriod')}</span>
                                    <ChevronRight size={20} style={{ color: 'var(--primary)' }} />
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Empty state: No transactions at all */}
                {transactionsToDisplay.length === 0 && !hasActiveFilters && !showDuplicatesOnly && (
                    <TransitionChild index={0} totalItems={1}>
                        <div
                            className="flex flex-col items-center justify-center py-16 text-center"
                            data-testid="empty-state"
                        >
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                            >
                                <FileText size={40} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)' }} />
                            </div>
                            <h2
                                className="text-lg font-bold mb-2"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {t('noTransactions')}
                            </h2>
                            <p
                                className="text-sm mb-5 max-w-[240px]"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {t('scanFirstReceipt')}
                            </p>
                            <button
                                className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-white"
                                style={{ backgroundColor: 'var(--primary)' }}
                                aria-label={t('scanReceipt')}
                            >
                                <Camera size={18} />
                                {t('scanReceipt')}
                            </button>
                        </div>
                    </TransitionChild>
                )}

                {/* Empty state: No matching filters or no duplicates */}
                {transactionsToDisplay.length === 0 && (hasActiveFilters || showDuplicatesOnly) && (
                    <TransitionChild index={0} totalItems={1}>
                        <div
                            className="flex flex-col items-center justify-center py-16 text-center"
                            data-testid="empty-filter-state"
                        >
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                            >
                                <Inbox size={40} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)' }} />
                            </div>
                            <h2
                                className="text-lg font-bold mb-2"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {t('noMatchingTransactions')}
                            </h2>
                            <p
                                className="text-sm max-w-[240px]"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {t('tryDifferentFilters')}
                            </p>
                        </div>
                    </TransitionChild>
                )}

                {/* Transaction list with date grouping (Story 14.14 AC #2) */}
                {filteredTransactions.length > 0 && (
                    <div className="space-y-2">
                        {(() => {
                            let itemIndex = 0;
                            const elements: React.ReactNode[] = [];

                            groupedTransactions.forEach((transactions, dateKey) => {
                                // Date group header
                                const headerIndex = itemIndex++;
                                elements.push(
                                    <TransitionChild
                                        key={`header-${dateKey}-${currentPage}`}
                                        index={headerIndex}
                                        totalItems={totalItems}
                                        // Story 14.14: All items animate simultaneously (no stagger)
                                        initialDelayMs={0}
                                        staggerMs={0}
                                    >
                                        <DateGroupHeader
                                            label={formatDateGroupLabel(dateKey, lang, t)}
                                            total={calculateGroupTotal(transactions)}
                                            currency={currency}
                                            theme={theme}
                                            formatCurrency={formatCurrency}
                                        />
                                    </TransitionChild>
                                );

                                // Transaction cards for this date
                                transactions.forEach((tx) => {
                                    const cardIndex = itemIndex++;
                                    const normalizedTx = normalizeTransaction(tx as any, userDefaults);
                                    const isDuplicate = tx.id ? duplicateIds.has(tx.id) : false;
                                    const displayCurrency = tx.currency || currency;

                                    elements.push(
                                        <TransitionChild
                                            key={`${tx.id}-${currentPage}`}
                                            index={cardIndex}
                                            totalItems={totalItems}
                                            // Story 14.14: All items animate simultaneously (no stagger)
                                            initialDelayMs={0}
                                            staggerMs={0}
                                        >
                                            <div
                                                onTouchStart={() => handleLongPressStart(tx.id)}
                                                onTouchEnd={handleLongPressEnd}
                                                onTouchMove={handleLongPressMove}
                                                onMouseDown={() => handleLongPressStart(tx.id)}
                                                onMouseUp={handleLongPressEnd}
                                                onMouseLeave={handleLongPressEnd}
                                            >
                                                <TransactionCard
                                                    transaction={{
                                                        id: tx.id,
                                                        merchant: tx.merchant,
                                                        alias: tx.alias,
                                                        date: tx.date,
                                                        time: tx.time,
                                                        total: tx.total,
                                                        category: tx.category as any,
                                                        city: normalizedTx.city,
                                                        country: tx.country,
                                                        currency: displayCurrency,
                                                        thumbnailUrl: tx.thumbnailUrl,
                                                        imageUrls: tx.imageUrls,
                                                        items: tx.items || [],
                                                        groupName: tx.groupName,
                                                        groupColor: tx.groupColor,
                                                    }}
                                                    formatters={{
                                                        formatCurrency,
                                                        formatDate,
                                                        t,
                                                    }}
                                                    theme={{
                                                        mode: theme === 'dark' ? 'dark' : 'light',
                                                        colorTheme,
                                                        dateFormat,
                                                    }}
                                                    defaultCurrency={currency}
                                                    userDefaultCountry={defaultCountry}
                                                    foreignLocationFormat={foreignLocationFormat}
                                                    lang={lang}
                                                    isDuplicate={isDuplicate}
                                                    onClick={() => onEditTransaction(tx)}
                                                    onThumbnailClick={() => handleThumbnailClick(tx)}
                                                    selection={{
                                                        isSelectionMode,
                                                        isSelected: isSelected(tx.id),
                                                        onToggleSelect: () => toggleSelection(tx.id),
                                                    }}
                                                />
                                            </div>
                                        </TransitionChild>
                                    );
                                });
                            });

                            return elements;
                        })()}
                    </div>
                )}

                {/* Pagination controls - Updated for filtered results */}
                {filteredTransactions.length > 0 && (
                    <div className="flex flex-col items-center gap-3 mt-6">
                        {/* Page navigation - Story 14.14: Circular buttons with arrows */}
                        {/* Story 14.27: Scrolls to top on page change (like turning pages in a book) */}
                        <div className="flex items-center gap-4">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => goToPage(currentPage - 1)}
                                className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-40 transition-colors"
                                style={{
                                    backgroundColor: 'var(--surface)',
                                    border: '1px solid var(--border-light)',
                                }}
                                aria-label={t('previousPage')}
                            >
                                <ChevronLeft size={20} style={{ color: 'var(--text-primary)' }} />
                            </button>
                            <span className="py-2 text-sm min-w-[50px] text-center" style={{ color: 'var(--text-secondary)' }}>
                                {currentPage} / {totalFilteredPages}
                            </span>
                            <button
                                disabled={currentPage >= totalFilteredPages}
                                onClick={() => goToPage(currentPage + 1)}
                                className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-40 transition-colors"
                                style={{
                                    backgroundColor: 'var(--surface)',
                                    border: '1px solid var(--border-light)',
                                }}
                                aria-label={t('nextPage')}
                            >
                                <ChevronRight size={20} style={{ color: 'var(--text-primary)' }} />
                            </button>
                        </div>
                        {/* Story 14.14: Page size selector */}
                        <div className="flex items-center gap-2" data-testid="page-size-selector">
                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                {lang === 'es' ? 'Por página:' : 'Per page:'}
                            </span>
                            {PAGE_SIZE_OPTIONS.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => {
                                        setPageSize(size);
                                        goToPage(1); // Reset to first page and scroll to top
                                    }}
                                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                                        pageSize === size ? 'font-semibold' : ''
                                    }`}
                                    style={{
                                        backgroundColor: pageSize === size ? 'var(--primary)' : 'transparent',
                                        color: pageSize === size ? 'white' : 'var(--text-secondary)',
                                    }}
                                    aria-label={`${lang === 'es' ? 'Mostrar' : 'Show'} ${size} ${lang === 'es' ? 'por página' : 'per page'}`}
                                    aria-pressed={pageSize === size}
                                    data-testid={`page-size-${size}`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>

                        {/* Story 14.27: Load more button for pagination */}
                        {/* Show when at listener limit and on last page of client-side pagination */}
                        {/* Scrolls to top after loading completes (useEffect watches loadingMoreTransactions) */}
                        {isAtListenerLimit && hasMoreTransactions && currentPage >= totalFilteredPages && (
                            <button
                                onClick={onLoadMoreTransactions}
                                disabled={loadingMoreTransactions}
                                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                                style={{
                                    backgroundColor: 'var(--surface)',
                                    border: '1px solid var(--border-light)',
                                    color: 'var(--text-primary)',
                                }}
                                data-testid="load-more-transactions"
                            >
                                {loadingMoreTransactions ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>{lang === 'es' ? 'Cargando...' : 'Loading...'}</span>
                                    </>
                                ) : (
                                    <span>{lang === 'es' ? 'Cargar más transacciones' : 'Load more transactions'}</span>
                                )}
                            </button>
                        )}

                        {/* Story 14.27: End of history indicator */}
                        {isAtListenerLimit && !hasMoreTransactions && currentPage >= totalFilteredPages && (
                            <span
                                className="text-xs py-2"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                {lang === 'es' ? 'Fin del historial' : 'End of history'}
                            </span>
                        )}
                    </div>
                )}
                </div>

                {/* Image Viewer Modal */}
                {selectedTransaction && selectedTransaction.imageUrls && selectedTransaction.imageUrls.length > 0 && (
                    <ImageViewer
                        images={selectedTransaction.imageUrls}
                        merchantName={selectedTransaction.alias || selectedTransaction.merchant}
                        onClose={handleCloseViewer}
                    />
                )}

                {/* Story 14.15: Assign Group Modal */}
                <AssignGroupModal
                    isOpen={showGroupModal}
                    selectedCount={selectedCount}
                    groups={groups}
                    groupsLoading={groupsLoading}
                    onClose={() => setShowGroupModal(false)}
                    onAssign={handleAssignGroup}
                    onCreateNew={() => {
                        setShowGroupModal(false);
                        setShowCreateGroupModal(true);
                    }}
                    onEditGroup={handleEditGroup}
                    onDeleteGroup={handleDeleteGroup}
                    onRemoveFromGroup={handleRemoveFromGroup}
                    t={t}
                    lang={lang as 'en' | 'es'}
                />

                {/* Story 14.15: Create Group Modal */}
                <CreateGroupModal
                    isOpen={showCreateGroupModal}
                    selectedCount={selectedCount}
                    onClose={() => setShowCreateGroupModal(false)}
                    onCreate={handleCreateGroup}
                    onBack={() => {
                        setShowCreateGroupModal(false);
                        setShowGroupModal(true);
                    }}
                    t={t}
                    lang={lang as 'en' | 'es'}
                />

                {/* Story 14.15b: Edit Group Modal */}
                <EditGroupModal
                    isOpen={showEditGroupModal}
                    group={editingGroup}
                    onClose={() => {
                        setShowEditGroupModal(false);
                        setEditingGroup(null);
                    }}
                    onSave={handleSaveGroup}
                    t={t}
                    lang={lang as 'en' | 'es'}
                />

                {/* Story 14.15b: Delete Group Modal */}
                <DeleteGroupModal
                    isOpen={showDeleteGroupModal}
                    group={deletingGroup}
                    isDeleting={isDeletingGroup}
                    onClose={() => {
                        setShowDeleteGroupModal(false);
                        setDeletingGroup(null);
                    }}
                    onConfirm={handleConfirmDeleteGroup}
                    t={t}
                    lang={lang as 'en' | 'es'}
                />

                {/* Story 14.15: Delete Transactions Modal */}
                <DeleteTransactionsModal
                    isOpen={showDeleteModal}
                    transactions={getTransactionPreviews()}
                    onClose={() => setShowDeleteModal(false)}
                    onDelete={handleDeleteTransactions}
                    formatCurrency={formatCurrency}
                    t={t}
                    lang={lang as 'en' | 'es'}
                    currency={currency}
                />
            </div>
        </PageTransition>
    );
};

/**
 * HistoryView - Main export
 *
 * This component expects to be wrapped in a HistoryFiltersProvider.
 * The provider should be added in App.tsx or the parent component.
 */
export const HistoryView: React.FC<HistoryViewProps> = (props) => {
    return <HistoryViewInner {...props} />;
};
