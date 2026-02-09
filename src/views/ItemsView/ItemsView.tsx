/**
 * ItemsView - Items History with Filtering
 *
 * Story 14.31: Items History View
 * Story 14e-31: ItemsView Data Ownership (refactored to use useItemsViewData)
 * Epic 14: Core Implementation
 *
 * Features:
 * - Flat list of all purchased items across transactions
 * - Search by item name
 * - Filter by item category, date range (temporal breadcrumb)
 * - Date grouping with sticky headers
 * - Click to navigate to parent transaction
 * - CSV export
 *
 * Session 2: Added temporal breadcrumb navigation matching HistoryView:
 * - Ano | Trimestre | Mes | Semana | Dia pills
 * - Period navigator with arrows
 * - Filter items by parent transaction date
 * - IconFilterBar with Calendar, Tag icons
 * - FilterChips for active filters
 *
 * Story 14e-31: Refactored to own data via useItemsViewData hook.
 * Uses _testOverrides pattern for handler injection from App.tsx.
 *
 * @see docs/sprint-artifacts/epic14/stories/story-14.31-items-history-view.md
 * @see docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-31-itemsview-data-ownership.md
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Inbox, ChevronLeft, ChevronRight, Loader2, Download, FileText, Package, AlertTriangle } from 'lucide-react';
import { ProfileDropdown, ProfileAvatar, getInitials } from '@/components/ProfileDropdown';
import { ItemCard, AggregatedItemCard } from '@/components/items';
import { SearchBar } from '@features/history/components/SearchBar';
import { TemporalBreadcrumb } from '@features/history/components/TemporalBreadcrumb';
import { IconFilterBar } from '@features/history/components/IconFilterBar';
import { FilterChips } from '@features/history/components/FilterChips';
// Story 14.31 Session 3: Sort control
import { SortControl } from '@features/history/components/SortControl';
import type { SortOption } from '@features/history/components/SortControl';
import { PageTransition } from '@/components/animation/PageTransition';
import { TransitionChild } from '@/components/animation/TransitionChild';
import { useDerivedItems } from '@/hooks/useDerivedItems';
import { useHistoryFilters } from '@shared/hooks/useHistoryFilters';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Story 14.31 Session 2: Item aggregation (group same products together)
// Story 14.31 Session 3: Added sortAggregatedItems for sort control
import { aggregateItems, sortAggregatedItems, sortItemsByPrice, sortItemsByName, sortItemsByDate } from '@/hooks/useItems';
// Story 14.31 Session 2: Item duplicate detection
import { filterToDuplicatesGrouped, getItemDuplicateCount } from '@/services/itemDuplicateDetectionService';
import { extractAvailableFilters } from '@shared/utils/historyFilterUtils';
// Story 14.13b: Normalize item categories for filtering (handles Spanish/translated names)
import { normalizeItemCategory } from '@/utils/categoryNormalizer';
// Story 14.13a: Category group expansion functions for multi-dimension filtering
// Story 14.13 Session 15: Added getItemCategoryGroup and getStoreCategoryGroup for proper 'other' group filtering
import {
    expandStoreCategoryGroup,
    expandItemCategoryGroup,
    getItemCategoryGroup,
    getStoreCategoryGroup,
    type StoreCategoryGroup,
    type ItemCategoryGroup,
} from '@/config/categoryColors';
import type { StoreCategory } from '@/types/transaction';
import type { FlattenedItem, ItemFilters, AggregatedItem } from '@/types/item';
import { downloadAggregatedItemsCSV } from '@/utils/csvExport';
// Story 14e-25d: Direct navigation from store (ViewHandlersContext deleted)
import { useNavigationActions } from '@/shared/stores';
// Story 14c-refactor.27: View type for navigation
import type { View } from '@/components/App';
// Story 14e-31: Data ownership via internal hook
import { useItemsViewData, type UseItemsViewDataReturn } from './useItemsViewData';

// ============================================================================
// Constants
// ============================================================================

/**
 * Page size options matching HistoryView pattern.
 * Default is 15 items per page, with options to switch to 30 or 60.
 */
const PAGE_SIZE_OPTIONS = [15, 30, 60] as const;
type PageSizeOption = typeof PAGE_SIZE_OPTIONS[number];
const DEFAULT_PAGE_SIZE: PageSizeOption = 15;

/**
 * Story 14.31 Session 3: Sort options for Items view.
 * - Date (newest first) - default
 * - Price (highest/lowest)
 * - Name (A-Z)
 */
type ItemSortKey = 'lastPurchaseDate' | 'totalAmount' | 'name';
const ITEM_SORT_OPTIONS: SortOption[] = [
    { key: 'lastPurchaseDate', labelEn: 'Date', labelEs: 'Fecha' },
    { key: 'totalAmount', labelEn: 'Price', labelEs: 'Precio' },
    { key: 'name', labelEn: 'Name', labelEs: 'Nombre' },
];
const DEFAULT_SORT_KEY: ItemSortKey = 'lastPurchaseDate';
const DEFAULT_SORT_DIRECTION: 'asc' | 'desc' = 'desc';

// ============================================================================
// Types
// ============================================================================

/**
 * Story 14e-31: Minimal props interface for ItemsView.
 *
 * View now owns its data via useItemsViewData hook.
 * Uses _testOverrides pattern for handler injection from App.tsx.
 */
export interface ItemsViewProps {
    /**
     * Override hook values from parent (App.tsx).
     * Used to inject handlers that require App.tsx state coordination.
     * Example: onEditTransaction needs setCurrentTransaction from App.tsx.
     */
    _testOverrides?: Partial<UseItemsViewDataReturn>;
    /** Initial category filter (for navigation from analytics) */
    initialCategory?: string;
    /** Initial search term (for navigation from analytics) */
    initialSearchTerm?: string;
}

// ============================================================================
// Empty State Component
// ============================================================================

interface EmptyStateProps {
    hasFilters: boolean;
    lang: 'en' | 'es';
}

const EmptyState: React.FC<EmptyStateProps> = ({ hasFilters, lang }) => {
    return (
        <div
            className="flex flex-col items-center justify-center py-16 px-4"
            role="status"
            aria-label={hasFilters
                ? (lang === 'es' ? 'No se encontraron productos' : 'No items found')
                : (lang === 'es' ? 'No hay productos' : 'No items')
            }
        >
            <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
                {hasFilters ? (
                    <Inbox size={32} style={{ color: 'var(--text-tertiary)' }} />
                ) : (
                    <Package size={32} style={{ color: 'var(--text-tertiary)' }} />
                )}
            </div>
            <h3
                className="text-lg font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
            >
                {hasFilters
                    ? (lang === 'es' ? 'No se encontraron productos' : 'No items found')
                    : (lang === 'es' ? 'Sin productos' : 'No items yet')
                }
            </h3>
            <p
                className="text-center text-sm max-w-xs"
                style={{ color: 'var(--text-secondary)' }}
            >
                {hasFilters
                    ? (lang === 'es'
                        ? 'Intenta ajustar tus filtros o busca algo diferente.'
                        : 'Try adjusting your filters or search for something different.')
                    : (lang === 'es'
                        ? 'Escanea un recibo para comenzar a registrar tus compras.'
                        : 'Scan a receipt to start tracking your purchases.')
                }
            </p>
        </div>
    );
};

// ============================================================================
// Main Component
// ============================================================================

export const ItemsView: React.FC<ItemsViewProps> = ({
    _testOverrides,
    initialCategory,
    initialSearchTerm,
}) => {
    // Story 14e-31: Data ownership via internal hook
    const hookData = useItemsViewData();

    // Merge hook data with test overrides (for handler injection from App.tsx)
    const {
        transactions,
        userName,
        userEmail,
        userId: _userId,
        theme,
        colorTheme,
        lang,
        currency,
        dateFormat,
        defaultCountry,
        t,
        formatCurrency,
        formatDate: formatDateHook,
        onEditTransaction,
    } = { ...hookData, ..._testOverrides };

    // Widen the formatDate type to match component expectations (string format)
    const formatDate = formatDateHook as (date: string, format: string) => string;

    // Story 14e-25d: Direct navigation from store (ViewHandlersContext deleted)
    const { navigateBack, setView } = useNavigationActions();
    const onBack = navigateBack;
    const onNavigateToView = setView;

    // Profile dropdown state
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileButtonRef = useRef<HTMLButtonElement>(null);

    // Header collapse state
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastScrollY = useRef(0);
    const scrollThreshold = 80;

    // Export state
    const [isExporting, setIsExporting] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE);

    // Story 14.31 Session 2: Duplicate filter state
    const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);

    // Story 14.31 Session 3: Sort state
    const [sortBy, setSortBy] = useState<ItemSortKey>(DEFAULT_SORT_KEY);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(DEFAULT_SORT_DIRECTION);

    // Animation preference
    const prefersReducedMotion = useReducedMotion();

    // Story 14.31 Session 2: Use HistoryFiltersContext for temporal navigation
    const {
        state: filterState,
        dispatch: filterDispatch,
        hasActiveFilters: hasTemporalOrCategoryFilters,
    } = useHistoryFilters();

    // Items hook - uses React Query caching for derived items
    const {
        filteredItems: baseFilteredItems,
        filters,
        setFilters,
        searchTerm,
        setSearchTerm,
        clearFilters: clearItemFilters,
    } = useDerivedItems(transactions, false);

    // Extract available temporal filters from transactions (for breadcrumb)
    const availableFilters = useMemo(() => {
        return extractAvailableFilters(transactions as any);
    }, [transactions]);

    // Story 14.31 Session 2: Apply temporal filter from HistoryFiltersContext
    // Convert temporal filter to dateRange for item filtering
    // Story 14.13b: Also apply category filters even when no temporal filter
    const filteredItems = useMemo(() => {
        // Start with base items
        let result = baseFilteredItems;

        // Build date range from temporal filter (only if temporal filter is active)
        let startDate: string | undefined;
        let endDate: string | undefined;

        const temporal = filterState.temporal;

        // Handle explicit date range (from Reports navigation)
        if (temporal.dateRange) {
            startDate = temporal.dateRange.start;
            endDate = temporal.dateRange.end;
        }
        // Year filter
        else if (temporal.level === 'year' && temporal.year) {
            startDate = `${temporal.year}-01-01`;
            endDate = `${temporal.year}-12-31`;
        }
        // Quarter filter
        else if (temporal.level === 'quarter' && temporal.year && temporal.quarter) {
            const qNum = parseInt(temporal.quarter.replace('Q', ''), 10);
            const startMonth = (qNum - 1) * 3 + 1;
            const endMonth = qNum * 3;
            startDate = `${temporal.year}-${String(startMonth).padStart(2, '0')}-01`;
            // Get last day of end month
            const lastDay = new Date(parseInt(temporal.year, 10), endMonth, 0).getDate();
            endDate = `${temporal.year}-${String(endMonth).padStart(2, '0')}-${lastDay}`;
        }
        // Month filter
        else if (temporal.level === 'month' && temporal.month) {
            const [year, month] = temporal.month.split('-');
            startDate = `${temporal.month}-01`;
            // Get last day of month
            const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
            endDate = `${temporal.month}-${String(lastDay).padStart(2, '0')}`;
        }
        // Week filter
        else if (temporal.level === 'week' && temporal.month && temporal.week !== undefined) {
            const [year, month] = temporal.month.split('-');
            const daysInMonth = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
            const weekStartDay = (temporal.week - 1) * 7 + 1;
            const weekEndDay = Math.min(temporal.week * 7, daysInMonth);
            startDate = `${temporal.month}-${String(weekStartDay).padStart(2, '0')}`;
            endDate = `${temporal.month}-${String(weekEndDay).padStart(2, '0')}`;
        }
        // Day filter
        else if (temporal.level === 'day' && temporal.day) {
            startDate = temporal.day;
            endDate = temporal.day;
        }

        // Date range filter (only if temporal filter is active)
        if (startDate && endDate) {
            result = result.filter(item => {
                const itemDate = item.transactionDate;
                return itemDate >= startDate! && itemDate <= endDate!;
            });
        }

        // Story 14.13a: Multi-dimension filtering using drillDownPath
        // When drillDownPath is present, it contains the full drill-down context from TrendsView
        // This enables filtering by multiple dimensions simultaneously (e.g., items in Supermercado + Alimentos Frescos)
        const drillDownPath = filterState.category.drillDownPath;

        if (drillDownPath) {
            // Apply store category filter from drillDownPath (supports multi-select via comma-separated)
            if (drillDownPath.storeCategory) {
                const selectedStoreCategories = drillDownPath.storeCategory.includes(',')
                    ? drillDownPath.storeCategory.split(',').map(c => c.trim().toLowerCase())
                    : [drillDownPath.storeCategory.toLowerCase()];
                result = result.filter(item => {
                    const itemCategoryLower = item.merchantCategory?.toLowerCase();
                    return selectedStoreCategories.some(cat => cat === itemCategoryLower);
                });
            }

            // Apply store group filter from drillDownPath (expand to all categories in group)
            // Only if storeCategory is not set (storeCategory is more specific)
            // Story 14.13 Session 15: Special handling for 'other' group to match Dashboard counting
            if (drillDownPath.storeGroup && !drillDownPath.storeCategory) {
                const targetGroup = drillDownPath.storeGroup as StoreCategoryGroup;

                if (targetGroup === 'other') {
                    // For 'other' group, include items whose store category doesn't map to any known group
                    // This matches how Dashboard counts transactions in the 'other' group
                    result = result.filter(item => {
                        const storeGroup = getStoreCategoryGroup(item.merchantCategory as StoreCategory);
                        return storeGroup === 'other';
                    });
                } else {
                    // For other groups, use the standard expansion approach
                    const groupCategories = expandStoreCategoryGroup(targetGroup);
                    result = result.filter(item =>
                        groupCategories.some(cat =>
                            item.merchantCategory === cat ||
                            item.merchantCategory?.toLowerCase() === cat.toLowerCase()
                        )
                    );
                }
            }

            // Apply item group filter from drillDownPath (expand to all item categories in group)
            // Only if itemCategory is not set (itemCategory is more specific)
            // Story 14.13b: Use normalizeItemCategory to handle translated category names
            // Story 14.13 Session 15: Special handling for 'other-item' group to match Dashboard counting
            if (drillDownPath.itemGroup && !drillDownPath.itemCategory) {
                const targetGroup = drillDownPath.itemGroup as ItemCategoryGroup;

                if (targetGroup === 'other-item') {
                    // For 'other-item' group, include items whose category doesn't map to any known group
                    // This matches how Dashboard counts items in the 'other-item' group
                    result = result.filter(item => {
                        const normalizedCategory = normalizeItemCategory(item.category || 'Other');
                        const itemGroup = getItemCategoryGroup(normalizedCategory);
                        return itemGroup === 'other-item';
                    });
                } else {
                    // For other groups, use the standard expansion approach
                    const itemCategories = expandItemCategoryGroup(targetGroup);
                    result = result.filter(item => {
                        const normalizedCategory = normalizeItemCategory(item.category || 'Other').toLowerCase();
                        return itemCategories.some(cat => cat.toLowerCase() === normalizedCategory);
                    });
                }
            }

            // Apply item category filter from drillDownPath (supports multi-select via comma-separated)
            // Story 14.13b: Use normalizeItemCategory to handle translated category names
            if (drillDownPath.itemCategory) {
                const selectedItemCategories = drillDownPath.itemCategory.includes(',')
                    ? drillDownPath.itemCategory.split(',').map(c => c.trim().toLowerCase())
                    : [drillDownPath.itemCategory.toLowerCase()];
                result = result.filter(item => {
                    const normalizedCategory = normalizeItemCategory(item.category || 'Other').toLowerCase();
                    return selectedItemCategories.some(cat => cat === normalizedCategory);
                });
            }

            // Apply subcategory filter from drillDownPath
            if (drillDownPath.subcategory) {
                result = result.filter(item =>
                    item.subcategory === drillDownPath.subcategory ||
                    item.subcategory?.toLowerCase() === drillDownPath.subcategory?.toLowerCase()
                );
            }
        } else {
            // Fallback to legacy single-dimension filtering when drillDownPath not present

            // Item category filter from context (group = item categories like "Carnes", "Lacteos")
            // Story 14.13b: Use normalizeItemCategory to handle translated category names
            if (filterState.category.level === 'group' && filterState.category.group) {
                const selectedGroups = filterState.category.group.split(',').map(g => g.trim().toLowerCase());
                result = result.filter(item => {
                    const normalizedCategory = normalizeItemCategory(item.category || 'Other').toLowerCase();
                    // Match against item's normalized category or subcategory
                    return selectedGroups.some(group =>
                        normalizedCategory === group ||
                        item.subcategory?.toLowerCase() === group ||
                        normalizedCategory.includes(group)
                    );
                });
            }

            // Story 14.13 Session 5: Store category filter (filter items by parent transaction's store category)
            // When navigating from analytics with countMode='items' and store view modes
            if (filterState.category.level === 'category' && filterState.category.category) {
                const selectedStoreCategories = filterState.category.category.split(',').map(c => c.trim());
                result = result.filter(item => {
                    // Match against merchantCategory (store category from parent transaction)
                    return selectedStoreCategories.some(storeCategory =>
                        item.merchantCategory === storeCategory ||
                        item.merchantCategory?.toLowerCase().includes(storeCategory.toLowerCase())
                    );
                });
            }
        }

        return result;
    }, [baseFilteredItems, filterState.temporal, filterState.category]);

    // Story 14.31 Session 2: Detect potential duplicates in filtered items
    const duplicateCount = useMemo(() => {
        return getItemDuplicateCount(filteredItems);
    }, [filteredItems]);

    const hasAnyDuplicates = duplicateCount > 0;

    // Story 14.31 Session 2: Aggregate items by product name + merchant
    // Shows one card per unique product with transaction count
    // Story 14.31 Session 3: Apply sorting after aggregation
    const aggregatedItems = useMemo((): AggregatedItem[] => {
        const aggregated = aggregateItems(filteredItems);
        return sortAggregatedItems(aggregated, sortBy, sortDirection);
    }, [filteredItems, sortBy, sortDirection]);

    // Story 14.31 Session 2: Flat items for duplicate view
    // Story 14.31 Session 3: Apply sorting to duplicate items
    const duplicateItems = useMemo((): FlattenedItem[] => {
        if (showDuplicatesOnly) {
            const dupes = filterToDuplicatesGrouped(filteredItems);
            // Apply sort based on selected criteria
            switch (sortBy) {
                case 'totalAmount':
                    return sortItemsByPrice(dupes, sortDirection);
                case 'name':
                    return sortItemsByName(dupes, sortDirection);
                case 'lastPurchaseDate':
                default:
                    return sortItemsByDate(dupes, sortDirection);
            }
        }
        return [];
    }, [filteredItems, showDuplicatesOnly, sortBy, sortDirection]);

    // Initialize filters from props
    useEffect(() => {
        if (initialCategory || initialSearchTerm) {
            const newFilters: ItemFilters = { ...filters };
            if (initialCategory) {
                newFilters.category = initialCategory;
            }
            setFilters(newFilters);
            if (initialSearchTerm) {
                setSearchTerm(initialSearchTerm);
            }
        }
        // Only run on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Calculate total pages (uses aggregatedItems or duplicateItems based on mode)
    const totalPages = useMemo(() => {
        const itemCount = showDuplicatesOnly ? duplicateItems.length : aggregatedItems.length;
        return Math.max(1, Math.ceil(itemCount / pageSize));
    }, [aggregatedItems.length, duplicateItems.length, showDuplicatesOnly, pageSize]);

    // Paginate aggregated items (normal view)
    const paginatedAggregatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return aggregatedItems.slice(startIndex, startIndex + pageSize);
    }, [aggregatedItems, currentPage, pageSize]);

    // Paginate duplicate items (duplicate filter view)
    const paginatedDuplicateItems = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return duplicateItems.slice(startIndex, startIndex + pageSize);
    }, [duplicateItems, currentPage, pageSize]);

    // Check if any filters are active (including temporal and duplicates)
    const hasActiveFilters = !!(
        filters.category ||
        filters.dateRange ||
        filters.merchantName ||
        filters.city ||
        searchTerm.trim() ||
        hasTemporalOrCategoryFilters ||
        showDuplicatesOnly
    );

    // Handle profile navigation
    const handleProfileNavigate = useCallback((view: string) => {
        setIsProfileOpen(false);
        // Story 14c-refactor.27: Cast string to View type for navigation
        onNavigateToView(view as View);
    }, [onNavigateToView]);

    // Handle item click - navigate to parent transaction
    const handleItemClick = useCallback((item: FlattenedItem) => {
        onEditTransaction(item.transactionId);
    }, [onEditTransaction]);

    // Handle transaction count click - navigate to transaction detail with multi-transaction navigation
    // Story 14.31 Session 2: Navigate to transactions for a specific product
    // Story 14.13 Session 6: Now supports navigating through ALL related transactions
    const handleTransactionCountClick = useCallback((transactionIds: string[]) => {
        // Navigate to transaction detail view with ability to browse all related transactions
        if (transactionIds.length > 0) {
            onEditTransaction(transactionIds[0], transactionIds);
        }
    }, [onEditTransaction]);

    // Handle page navigation with scroll to top
    const goToPage = useCallback((page: number) => {
        const validPage = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(validPage);
        // Scroll to top of container
        if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [totalPages]);

    // Handle export - exports aggregated items for the selected month
    const handleExport = useCallback(async () => {
        if (aggregatedItems.length === 0) return;

        setIsExporting(true);
        try {
            // Get month label from temporal filter state
            const monthLabel = filterState.temporal.month || undefined;
            downloadAggregatedItemsCSV(aggregatedItems, lang, monthLabel);
        } catch (error) {
            console.error('[ItemsView] Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    }, [aggregatedItems, lang, filterState.temporal.month]);

    // Handle search change with reset
    const handleSearchChange = useCallback((term: string) => {
        setSearchTerm(term);
        goToPage(1); // Reset to first page when search changes
    }, [setSearchTerm, goToPage]);

    // Handle clear all filters (both item and temporal)
    const handleClearFilters = useCallback(() => {
        clearItemFilters();
        filterDispatch({ type: 'CLEAR_ALL_FILTERS' });
        setShowDuplicatesOnly(false); // Also clear duplicate filter
        goToPage(1);
    }, [clearItemFilters, filterDispatch, goToPage]);

    // Handle page size change
    const handlePageSizeChange = useCallback((size: PageSizeOption) => {
        setPageSize(size);
        goToPage(1); // Reset to first page and scroll to top
    }, [goToPage]);

    // Story 14.31 Session 3: Handle sort change
    const handleSortChange = useCallback((key: string, direction: 'asc' | 'desc') => {
        setSortBy(key as ItemSortKey);
        setSortDirection(direction);
        goToPage(1); // Reset to first page when sort changes
    }, [goToPage]);

    // Scroll handler for header collapse
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = containerRef.current?.scrollTop ?? window.scrollY;
            const delta = scrollY - lastScrollY.current;

            if (scrollY > scrollThreshold && delta > 15) {
                setIsHeaderCollapsed(true);
            } else if (scrollY < scrollThreshold || delta < -15) {
                setIsHeaderCollapsed(false);
            }

            lastScrollY.current = scrollY;
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, []);

    // Reset page when temporal filters change
    const prevTemporalRef = useRef<string | null>(null);
    useEffect(() => {
        const currentKey = JSON.stringify(filterState.temporal);
        if (prevTemporalRef.current !== null && prevTemporalRef.current !== currentKey) {
            goToPage(1);
        }
        prevTemporalRef.current = currentKey;
    }, [filterState.temporal, goToPage]);

    return (
        <PageTransition viewKey="items" direction="forward">
            <div
                ref={containerRef}
                className="relative h-full overflow-y-auto"
                style={{
                    paddingBottom: 'calc(6rem + var(--safe-bottom, 0px))',
                }}
            >
                {/* Sticky Header - matches HistoryView exactly */}
                <div
                    className="sticky px-4"
                    style={{
                        top: 0,
                        zIndex: 50,
                        backgroundColor: 'var(--bg)',
                        boxShadow: isHeaderCollapsed ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    }}
                >
                    {/* Header Row - 72px height matching HistoryView */}
                    <div
                        className="flex items-center justify-between"
                        style={{
                            height: '72px',
                            paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
                        }}
                    >
                        {/* Left side: Back button + Title */}
                        <div className="flex items-center gap-0">
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
                                {lang === 'es' ? 'Productos' : 'Items'}
                            </h1>
                            {/* Story 14.13b: Clear all filters button moved to FilterChips component */}
                        </div>
                        {/* Right side: Filters + Profile */}
                        <div className="flex items-center gap-3 relative">
                            {/* Story 14.31 Session 2: IconFilterBar matching HistoryView (Calendar, Tag, Layers) */}
                            <IconFilterBar
                                availableFilters={availableFilters}
                                t={t}
                                locale={lang}

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

                    {/* Collapsible Section - matches HistoryView */}
                    {/* Story 14.31 Session 3: overflow visible when expanded to allow sort dropdown */}
                    <div
                        className="transition-all duration-200 ease-out"
                        style={{
                            maxHeight: isHeaderCollapsed ? '0px' : '300px',
                            opacity: isHeaderCollapsed ? 0 : 1,
                            overflow: isHeaderCollapsed ? 'hidden' : 'visible',
                            pointerEvents: isHeaderCollapsed ? 'none' : 'auto',
                        }}
                    >
                        {/* Search bar */}
                        <div className="mb-3">
                            <SearchBar
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder={lang === 'es' ? 'Buscar productos...' : 'Search items...'}
                            />
                        </div>

                        {/* Story 14.31 Session 2: Temporal breadcrumb navigation */}
                        <div className="relative" style={{ zIndex: 40 }}>
                            <TemporalBreadcrumb locale={lang} availableFilters={availableFilters} />
                        </div>

                        {/* Item count with duplicate warning, sort control, and download button */}
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-2">
                                {/* Story 14.31 Session 2: Duplicate warning icon */}
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
                                                ? (lang === 'es' ? 'Mostrar todos los productos' : 'Show all items')
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
                                {/* Item count - shows aggregated count or duplicate count */}
                                <span
                                    className="text-sm"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    {showDuplicatesOnly ? duplicateItems.length : aggregatedItems.length} {lang === 'es' ? 'productos' : 'items'}
                                </span>
                                {/* Story 14.31 Session 3: Sort control */}
                                <SortControl
                                    options={ITEM_SORT_OPTIONS}
                                    currentSort={sortBy}
                                    sortDirection={sortDirection}
                                    onSortChange={handleSortChange}
                                    lang={lang}
                                />
                            </div>
                            {/* Download button - only visible in Products view (not duplicates) and only for Month timeframe */}
                            {aggregatedItems.length > 0 && !showDuplicatesOnly && filterState.temporal.level === 'month' && (
                                <button
                                    onClick={handleExport}
                                    disabled={isExporting}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
                                    style={{
                                        color: 'var(--text-tertiary)',
                                        backgroundColor: 'var(--bg-secondary)',
                                    }}
                                    aria-label={lang === 'es' ? 'Descargar productos' : 'Download products'}
                                    title={lang === 'es' ? 'Descargar productos (CSV)' : 'Download products (CSV)'}
                                >
                                    <FileText size={16} />
                                    {isExporting ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Download size={16} />
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Story 14.31 Session 2: Filter chips (shared with HistoryView) */}
                        <FilterChips locale={lang} t={t} />

                        {/* Search term and duplicate filter chips */}
                        {(searchTerm.trim() || showDuplicatesOnly) && (
                            <div className="flex flex-wrap gap-1.5 pb-2">
                                {/* Duplicate filter chip */}
                                {showDuplicatesOnly && (
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
                                )}
                                {/* Search term chip */}
                                {searchTerm.trim() && (
                                    <button
                                        onClick={() => handleSearchChange('')}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                                        style={{
                                            backgroundColor: 'var(--primary)',
                                            color: 'white',
                                        }}
                                    >
                                        "{searchTerm}"
                                        <span className="text-xs">&times;</span>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Clear all button */}
                        {hasActiveFilters && (
                            <div className="pb-2">
                                <button
                                    onClick={handleClearFilters}
                                    className="text-xs underline"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    {lang === 'es' ? 'Limpiar todo' : 'Clear all'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="px-3">
                    {(showDuplicatesOnly ? duplicateItems.length : aggregatedItems.length) === 0 ? (
                        <EmptyState
                            hasFilters={hasActiveFilters}
                            lang={lang}
                        />
                    ) : showDuplicatesOnly ? (
                        /* Duplicate view: Show flat items with ItemCard */
                        <div className="space-y-2">
                            {paginatedDuplicateItems.map((item: FlattenedItem, index: number) => (
                                <TransitionChild
                                    key={item.id}
                                    index={index}
                                    enabled={!prefersReducedMotion}
                                >
                                    <ItemCard
                                        item={item}
                                        formatters={{
                                            formatCurrency,
                                            formatDate,
                                            t,
                                        }}
                                        theme={{
                                            mode: theme as 'light' | 'dark',
                                            colorTheme,
                                            dateFormat,
                                        }}
                                        defaultCurrency={currency}
                                        userDefaultCountry={defaultCountry}
                                        lang={lang}
                                        onClick={() => handleItemClick(item)}
                                    />
                                </TransitionChild>
                            ))}
                        </div>
                    ) : (
                        /* Normal view: Show aggregated items with AggregatedItemCard */
                        <div className="space-y-2">
                            {paginatedAggregatedItems.map((item: AggregatedItem, index: number) => (
                                <TransitionChild
                                    key={item.id}
                                    index={index}
                                    enabled={!prefersReducedMotion}
                                >
                                    <AggregatedItemCard
                                        item={item}
                                        formatters={{
                                            formatCurrency,
                                            formatDate,
                                            t,
                                        }}
                                        theme={{
                                            mode: theme as 'light' | 'dark',
                                            colorTheme,
                                            dateFormat,
                                        }}
                                        defaultCurrency={currency}
                                        lang={lang}
                                        onTransactionCountClick={handleTransactionCountClick}
                                    />
                                </TransitionChild>
                            ))}
                        </div>
                    )}

                    {/* Pagination Controls - shared by both views */}
                    {(showDuplicatesOnly ? duplicateItems.length : aggregatedItems.length) > 0 && (
                        <div className="flex flex-col items-center gap-4 py-6">
                            {/* Page Navigation */}
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={currentPage <= 1}
                                    onClick={() => goToPage(currentPage - 1)}
                                    className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-40 transition-colors"
                                    style={{
                                        backgroundColor: 'var(--surface)',
                                        border: '1px solid var(--border-light)',
                                    }}
                                    aria-label={lang === 'es' ? 'Pagina anterior' : 'Previous page'}
                                >
                                    <ChevronLeft size={20} style={{ color: 'var(--text-primary)' }} />
                                </button>
                                <span
                                    className="py-2 text-sm min-w-[50px] text-center"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    disabled={currentPage >= totalPages}
                                    onClick={() => goToPage(currentPage + 1)}
                                    className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-40 transition-colors"
                                    style={{
                                        backgroundColor: 'var(--surface)',
                                        border: '1px solid var(--border-light)',
                                    }}
                                    aria-label={lang === 'es' ? 'Pagina siguiente' : 'Next page'}
                                >
                                    <ChevronRight size={20} style={{ color: 'var(--text-primary)' }} />
                                </button>
                            </div>

                            {/* Page Size Selector */}
                            <div className="flex items-center gap-2" data-testid="page-size-selector">
                                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    {lang === 'es' ? 'Por pagina:' : 'Per page:'}
                                </span>
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => handlePageSizeChange(size)}
                                        className={`px-2 py-1 text-xs rounded-md transition-colors ${
                                            pageSize === size ? 'font-semibold' : ''
                                        }`}
                                        style={{
                                            backgroundColor: pageSize === size ? 'var(--primary)' : 'transparent',
                                            color: pageSize === size ? 'white' : 'var(--text-secondary)',
                                        }}
                                        aria-label={`${lang === 'es' ? 'Mostrar' : 'Show'} ${size} ${lang === 'es' ? 'por pagina' : 'per page'}`}
                                        aria-pressed={pageSize === size}
                                        data-testid={`page-size-${size}`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PageTransition>
    );
};

export default ItemsView;
