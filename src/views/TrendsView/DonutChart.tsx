/** DonutChart — Story 15-5b: Extracted from TrendsView.tsx */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';
import {
    getCategoryColorsAuto,
    ALL_STORE_CATEGORY_GROUPS,
    ALL_ITEM_CATEGORY_GROUPS,
    STORE_CATEGORY_GROUPS,
    ITEM_CATEGORY_GROUPS,
    ITEM_CATEGORY_TO_KEY,
    getStoreGroupColors,
    getItemGroupColors,
    getCurrentTheme,
    getCurrentMode,
    expandStoreCategoryGroup,
    expandItemCategoryGroup,
    type StoreCategoryGroup,
    type ItemCategoryGroup,
} from '../../config/categoryColors';
import { formatCurrency } from '../../utils/currency';
import { buildProductKey } from '../../utils/categoryAggregation';
import { normalizeItemCategory } from '../../utils/categoryNormalizer';
import {
    translateCategory,
    translateStoreCategoryGroup,
    translateItemCategoryGroup,
    getStoreCategoryGroupEmoji,
    getItemCategoryGroupEmoji,
    getItemCategoryEmoji,
} from '../../utils/categoryTranslations';
import { getCategoryEmoji } from '../../utils/categoryEmoji';
import { useCountUp } from '../../hooks/useCountUp';
import type { Transaction } from '../../types/transaction';
import type { HistoryNavigationPayload, DrillDownPath } from '../../types/navigation';
import type { CategoryData, DonutViewMode, TimePeriod, CurrentPeriod } from './types';
import {
    computeTreemapCategories,
    computeItemCategoryData,
    computeSubcategoryData,
    computeItemGroupsForStore,
    computeItemCategoriesInGroup,
} from './helpers';
import { AnimatedAmountBar, AnimatedCountPill, AnimatedPercent } from './animationComponents';

/** Drill-down data for Level 2 (item groups within a category) */
interface DrillDownGroupData {
    name: string;
    value: number;
    count: number;
    color: string;
    fgColor: string;  // Story 14.21: Foreground color for text contrast
    percent: number;
}

/** Donut Chart component with header, interactive segments, and legend */
export const DonutChart: React.FC<{
    categoryData: CategoryData[];
    /** Story 14.14b Session 5: All store categories (before treemap processing) for accurate group aggregation */
    allCategoryData: CategoryData[];
    total: number;
    periodLabel: string;
    currency: string;
    locale: string;
    isDark: boolean;
    animationKey: number;
    onCategoryClick: (category: string) => void;
    canExpand: boolean;
    canCollapse: boolean;
    otroCount: number;
    /** Story 14.14b Session 7: Categories inside "Más" group for navigation expansion */
    otroCategories: CategoryData[];
    expandedCount: number;
    onExpand: () => void;
    onCollapse: () => void;
    /** Story 14.14b Session 4: Transactions for real item/subcategory aggregation */
    transactions: Transaction[];
    /** Story 14.14b Session 4: Navigation handler for transaction count pill */
    onNavigateToHistory?: (payload: HistoryNavigationPayload) => void;
    /** Story 14.14b Session 4: View mode controlled from parent */
    viewMode: DonutViewMode;
    /** Story 14.14b Session 4: Callback when view mode needs reset (drill-down changes) */
    onViewModeReset?: () => void;
    /** Story 14.22: Time period for navigation filter */
    timePeriod?: TimePeriod;
    /** Story 14.22: Current period for navigation filter */
    currentPeriod?: CurrentPeriod;
    /** Story 14.13 Session 7: Count mode for legend display (transactions vs items) */
    countMode?: 'transactions' | 'items';
    /** Story 14.40: Open statistics popup on icon click */
    onIconClick?: (categoryName: string, emoji: string, color: string) => void;
}> = ({
    categoryData,
    allCategoryData,
    total,
    periodLabel: _periodLabel,  // Story 14.14b: No longer used
    currency,
    locale,
    isDark,
    animationKey: _animationKey,
    onCategoryClick: _onCategoryClick,
    canExpand: parentCanExpand,
    canCollapse: parentCanCollapse,
    otroCount: parentOtroCount,
    otroCategories: parentOtroCategories,
    expandedCount: parentExpandedCount,
    onExpand: parentOnExpand,
    onCollapse: parentOnCollapse,
    transactions,
    onNavigateToHistory,
    viewMode,
    onViewModeReset: _onViewModeReset,
    timePeriod = 'month',
    currentPeriod,
    countMode = 'transactions',  // Story 14.13 Session 7: Default to transactions
    onIconClick,  // Story 14.40: Open statistics popup
}) => {
    // State for selected segment
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Story 14.13.3: Animation state for donut chart
    // Tracks animation key to trigger re-animation on drill-down
    const [donutAnimationKey, setDonutAnimationKey] = useState(0);
    // Tracks which segments have animated in (for clockwise reveal)
    const [visibleSegments, setVisibleSegments] = useState<Set<number>>(new Set());

    // Story 14.14b: Enhanced drill-down state to support all view modes
    // Drill-down path tracks: [storeGroup?, storeCategory?, itemCategory?]
    // Level 0: Show base view (based on viewMode)
    // Level 1: First drill-down (group->categories OR category->items)
    // Story 14.13 Session 7: Updated drill-down levels to support item groups as intermediate level
    // Level 0: Top level (groups or categories based on viewMode)
    // Level 1: First drill-down
    // Level 2: Second drill-down
    // Level 3: Third drill-down
    // Level 4: Fourth drill-down (only from store-groups: group -> store cat -> item group -> item cat -> subcat)
    const [drillDownLevel, setDrillDownLevel] = useState<0 | 1 | 2 | 3 | 4>(0);
    const [drillDownPath, setDrillDownPath] = useState<string[]>([]); // Stores names at each drill level

    // Internal expand state for drill-down levels
    const [drillDownExpandedCount, setDrillDownExpandedCount] = useState(0);

    // Story 14.14b Session 4: Reset drill-down when viewMode changes from parent
    useEffect(() => {
        setDrillDownLevel(0);
        setDrillDownPath([]);
        setSelectedCategory(null);
        setDrillDownExpandedCount(0);
        // Story 14.13.3: Reset animation when viewMode changes
        setDonutAnimationKey(prev => prev + 1);
        setVisibleSegments(new Set());
    }, [viewMode]);

    // Story 14.13.3: Effect to animate segments appearing clockwise
    useEffect(() => {
        // Get number of segments from displayData length
        // We'll animate each segment with staggered timing
        const segmentCount = 10; // Max segments we might have
        const delays: ReturnType<typeof setTimeout>[] = [];

        for (let i = 0; i < segmentCount; i++) {
            const timer = setTimeout(() => {
                setVisibleSegments(prev => new Set([...prev, i]));
            }, i * 80); // 80ms stagger between segments
            delays.push(timer);
        }

        return () => delays.forEach(clearTimeout);
    }, [donutAnimationKey]);

    // Story 14.14b Session 5: Aggregate allCategoryData (not treemap-processed categoryData) by store category groups
    // This ensures all store categories are included, not just those above the treemap threshold
    // Story 14.13 Session 5: Now also aggregates itemCount for count mode toggle
    const storeGroupsData = useMemo((): CategoryData[] => {
        const theme = getCurrentTheme();
        const mode = getCurrentMode();
        const groupTotals: Record<StoreCategoryGroup, { value: number; count: number; itemCount: number }> = {
            'food-dining': { value: 0, count: 0, itemCount: 0 },
            'health-wellness': { value: 0, count: 0, itemCount: 0 },
            'retail-general': { value: 0, count: 0, itemCount: 0 },
            'retail-specialty': { value: 0, count: 0, itemCount: 0 },
            'automotive': { value: 0, count: 0, itemCount: 0 },
            'services': { value: 0, count: 0, itemCount: 0 },
            'hospitality': { value: 0, count: 0, itemCount: 0 },
            'other': { value: 0, count: 0, itemCount: 0 },
        };

        // Aggregate allCategoryData into groups (use all categories, not treemap-filtered)
        for (const cat of allCategoryData) {
            // Map category name to its group
            const group = STORE_CATEGORY_GROUPS[cat.name as keyof typeof STORE_CATEGORY_GROUPS] || 'other';
            groupTotals[group].value += cat.value;
            groupTotals[group].count += cat.count;
            groupTotals[group].itemCount += cat.itemCount || 0;
        }

        const totalValue = Object.values(groupTotals).reduce((sum, g) => sum + g.value, 0);

        // Convert to CategoryData array
        return ALL_STORE_CATEGORY_GROUPS
            .map(groupKey => {
                const data = groupTotals[groupKey];
                const colors = getStoreGroupColors(groupKey, theme, mode);
                return {
                    name: groupKey,
                    value: data.value,
                    count: data.count,
                    itemCount: data.itemCount,
                    color: colors.bg,
                    fgColor: colors.fg,
                    percent: totalValue > 0 ? Math.round((data.value / totalValue) * 100) : 0,
                };
            })
            .filter(g => g.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [allCategoryData]);

    // Story 14.14b Session 4: Real item categories data from transaction line items
    const itemCategoriesData = useMemo((): CategoryData[] => {
        return computeItemCategoryData(transactions);
    }, [transactions]);

    // Story 14.14b: Aggregate item categories by item groups
    // Story 14.14b Session 6: Use transactionIds for accurate counting (prevents double-counting)
    // Story 14.13 Session 5: Now also aggregates itemCount for count mode toggle
    // Story 14.13 Session 7: Compute unique products directly from transactions to avoid double-counting
    const itemGroupsData = useMemo((): CategoryData[] => {
        const theme = getCurrentTheme();
        const mode = getCurrentMode();
        const groupTotals: Record<ItemCategoryGroup, { value: number; transactionIds: Set<string>; uniqueProducts: Set<string> }> = {
            'food-fresh': { value: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'food-packaged': { value: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'health-personal': { value: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'household': { value: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'nonfood-retail': { value: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'services-fees': { value: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'other-item': { value: 0, transactionIds: new Set(), uniqueProducts: new Set() },
        };

        // Story 14.13 Session 7: Compute directly from transactions to properly count unique products per group
        transactions.forEach((tx, index) => {
            (tx.items || []).forEach(item => {
                const cat = normalizeItemCategory(item.category || 'Other');
                const itemKey = ITEM_CATEGORY_TO_KEY[cat as keyof typeof ITEM_CATEGORY_TO_KEY];
                const group = itemKey ? ITEM_CATEGORY_GROUPS[itemKey as keyof typeof ITEM_CATEGORY_GROUPS] : 'other-item';

                groupTotals[group].value += item.price;
                groupTotals[group].transactionIds.add(tx.id ?? `tx-${index}`);

                // Track unique products by normalized name + merchant (Story 15-5a: use shared utility)
                groupTotals[group].uniqueProducts.add(buildProductKey(item.name || '', tx.merchant || ''));
            });
        });

        const totalValue = Object.values(groupTotals).reduce((sum, g) => sum + g.value, 0);

        return ALL_ITEM_CATEGORY_GROUPS
            .map(groupKey => {
                const data = groupTotals[groupKey];
                const colors = getItemGroupColors(groupKey, theme, mode);
                return {
                    name: groupKey,
                    value: data.value,
                    count: data.transactionIds.size,  // Unique transaction count
                    itemCount: data.uniqueProducts.size,  // Story 14.13 Session 7: Unique products count
                    transactionIds: data.transactionIds,  // Keep for further aggregation
                    color: colors.bg,
                    fgColor: colors.fg,
                    percent: totalValue > 0 ? Math.round((data.value / totalValue) * 100) : 0,
                };
            })
            .filter(g => g.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [transactions]);

    // Story 14.14b Session 4: Get real subcategories from transaction line items
    const getItemSubcategories = useCallback((itemCategoryName: string): DrillDownGroupData[] => {
        const subcategoryData = computeSubcategoryData(transactions, itemCategoryName);
        // If no subcategories found in real data, return empty array
        if (subcategoryData.length === 0) {
            return [];
        }
        return subcategoryData;
    }, [transactions]);

    // Story 14.14b Session 4: Check if an item category has subcategories in real data
    const hasSubcategories = useCallback((itemCategoryName: string): boolean => {
        const subcategoryData = computeSubcategoryData(transactions, itemCategoryName);
        return subcategoryData.length > 0;
    }, [transactions]);

    // Story 14.14b: Get store categories within a store group
    // Story 14.13 Session 6: Use allCategoryData (raw store categories) instead of categoryData
    // When in store-groups mode, categoryData contains groups (food-dining), not categories (Supermarket)
    const getStoreCategoriesInGroup = useCallback((groupKey: string): CategoryData[] => {
        // Filter allCategoryData to only include categories in this group
        return allCategoryData.filter(cat => {
            const catGroup = STORE_CATEGORY_GROUPS[cat.name as keyof typeof STORE_CATEGORY_GROUPS];
            return catGroup === groupKey;
        });
    }, [allCategoryData]);

    // Story 14.13 Session 7: Get item groups dynamically for a specific store category
    // Only returns item groups that have items in transactions of that store category
    const getItemGroupsForStore = useCallback((storeCategoryName: string): CategoryData[] => {
        return computeItemGroupsForStore(transactions, storeCategoryName);
    }, [transactions]);

    // Story 14.13 Session 7: Get item categories within an item group, filtered by store category
    // This is the DYNAMIC version that shows only item categories found in both the group AND store
    const getItemCategoriesInGroupForStore = useCallback((itemGroupKey: string, storeCategoryName?: string): CategoryData[] => {
        return computeItemCategoriesInGroup(transactions, itemGroupKey, storeCategoryName);
    }, [transactions]);

    // Story 14.14b: Get drill-down data based on viewMode and current path
    // Story 14.13 Session 7: Updated to use dynamic drill-down with item groups as intermediate level
    const rawDrillDownData = useMemo((): CategoryData[] => {
        if (drillDownLevel === 0) return [];

        const path = drillDownPath;

        // Store Groups: group -> store categories -> item groups -> item categories -> subcategories
        // Story 14.13 Session 7: Added item groups as level 2
        if (viewMode === 'store-groups') {
            if (drillDownLevel === 1 && path[0]) {
                // Level 1: Store categories in this store group (STATIC)
                return getStoreCategoriesInGroup(path[0]);
            } else if (drillDownLevel === 2 && path[1]) {
                // Level 2: Item groups found in this store category (DYNAMIC)
                return getItemGroupsForStore(path[1]);
            } else if (drillDownLevel === 3 && path[2] && path[1]) {
                // Level 3: Item categories in this item group, filtered by store category (DYNAMIC)
                return getItemCategoriesInGroupForStore(path[2], path[1]);
            } else if (drillDownLevel === 4 && path[3]) {
                // Level 4: Subcategories
                return getItemSubcategories(path[3]) as CategoryData[];
            }
        }

        // Store Categories: store category -> item groups -> item categories -> subcategories
        // Story 14.13 Session 7: Added item groups as level 1
        if (viewMode === 'store-categories') {
            if (drillDownLevel === 1 && path[0]) {
                // Level 1: Item groups found in this store category (DYNAMIC)
                return getItemGroupsForStore(path[0]);
            } else if (drillDownLevel === 2 && path[1] && path[0]) {
                // Level 2: Item categories in this item group, filtered by store category (DYNAMIC)
                return getItemCategoriesInGroupForStore(path[1], path[0]);
            } else if (drillDownLevel === 3 && path[2]) {
                // Level 3: Subcategories
                return getItemSubcategories(path[2]) as CategoryData[];
            }
        }

        // Item Groups: item group -> item categories -> subcategories
        // Story 14.13 Session 7: Uses dynamic function (no store filter since we're already in item-groups mode)
        if (viewMode === 'item-groups') {
            if (drillDownLevel === 1 && path[0]) {
                // Level 1: Item categories in this item group (DYNAMIC - from all transactions)
                return getItemCategoriesInGroupForStore(path[0]);
            } else if (drillDownLevel === 2 && path[1]) {
                // Level 2: Subcategories
                return getItemSubcategories(path[1]) as CategoryData[];
            }
        }

        // Item Categories: item category -> subcategories
        if (viewMode === 'item-categories') {
            if (drillDownLevel === 1 && path[0]) {
                return getItemSubcategories(path[0]) as CategoryData[];
            }
        }

        return [];
    }, [drillDownLevel, drillDownPath, viewMode, getStoreCategoriesInGroup, getItemGroupsForStore, getItemCategoriesInGroupForStore, getItemSubcategories]);

    // Story 14.14b: Get base data based on viewMode (must be defined before drillDownCategorized)
    const viewModeBaseData = useMemo((): CategoryData[] => {
        switch (viewMode) {
            case 'store-groups':
                return storeGroupsData;
            case 'store-categories':
                return categoryData;
            case 'item-groups':
                return itemGroupsData;
            case 'item-categories':
                return itemCategoriesData;
            default:
                return categoryData;
        }
    }, [viewMode, categoryData, storeGroupsData, itemGroupsData, itemCategoriesData]);

    // Apply the same categorization logic to drill-down data (≥10% + one below + Otro)
    // Story 14.13 Session 6: Recalculate percentages relative to drill-down total (100% chart)
    const drillDownCategorized = useMemo(() => {
        if (drillDownLevel === 0) {
            return { displayCategories: viewModeBaseData, otroCategories: [] as CategoryData[], canExpand: false, canCollapse: false };
        }
        // Recalculate percentages relative to drill-down total so donut shows 100%
        const drillDownTotal = rawDrillDownData.reduce((sum, d) => sum + d.value, 0);
        const recalculatedData = rawDrillDownData.map(cat => ({
            ...cat,
            percent: drillDownTotal > 0 ? Math.round((cat.value / drillDownTotal) * 100) : 0,
        }));
        return computeTreemapCategories(recalculatedData, drillDownExpandedCount);
    }, [drillDownLevel, rawDrillDownData, drillDownExpandedCount, viewModeBaseData]);

    // Current display data - use categoryData prop at level 0 (already processed through computeTreemapCategories),
    // categorized drill-down data otherwise
    // Story 14.14b Session 5: Use categoryData prop (not internal viewModeBaseData) to match treemap display
    const displayData = useMemo(() => {
        if (drillDownLevel === 0) {
            return categoryData;  // Use the prop, which is already treemap-processed
        }
        return drillDownCategorized.displayCategories;
    }, [drillDownLevel, categoryData, drillDownCategorized]);

    // Story 14.13 Session 20: Calculate max percentage for relative bar scaling
    // The category with highest percentage gets 100% bar width, others scale proportionally
    const maxPercent = useMemo(() => {
        if (displayData.length === 0) return 1;
        return Math.max(...displayData.map(d => d.percent));
    }, [displayData]);

    // Current total based on drill-down level
    const displayTotal = useMemo(() => {
        if (drillDownLevel === 0) {
            return total;
        }
        // For drill-down levels, sum up the raw data
        if (rawDrillDownData.length > 0) {
            return rawDrillDownData.reduce((sum, d) => sum + d.value, 0);
        }
        return total;
    }, [drillDownLevel, rawDrillDownData, total]);

    // Story 14.13.3: Animated total for count-up effect in center
    const animatedTotal = useCountUp(displayTotal, {
        duration: 800,
        startValue: 0,
        key: donutAnimationKey,
    });

    // Determine expand/collapse state based on drill-down level
    const canExpand = drillDownLevel === 0 ? parentCanExpand : drillDownCategorized.canExpand;
    const canCollapse = drillDownLevel === 0 ? parentCanCollapse : drillDownCategorized.canCollapse;
    const otroCount = drillDownLevel === 0 ? parentOtroCount : drillDownCategorized.otroCategories.length;
    const expandedCount = drillDownLevel === 0 ? parentExpandedCount : drillDownExpandedCount;

    const handleExpand = () => {
        if (drillDownLevel === 0) {
            parentOnExpand();
        } else {
            setDrillDownExpandedCount(prev => prev + 1);
        }
    };

    const handleCollapse = () => {
        if (drillDownLevel === 0) {
            parentOnCollapse();
        } else {
            setDrillDownExpandedCount(prev => Math.max(0, prev - 1));
        }
    };

    // Find selected category data
    const selectedData = selectedCategory
        ? displayData.find(c => c.name === selectedCategory)
        : null;

    // Note: centerValue calculation removed - was unused after animation removal
    // Note: contextLabel removed - replaced by viewMode dropdown in Story 14.14b

    // Handle segment click
    const handleSegmentClick = (categoryName: string) => {
        setSelectedCategory(prev => prev === categoryName ? null : categoryName);
    };

    // Story 14.14b: Get max drill-down level based on viewMode
    // Story 14.13 Session 7: Updated drill-down paths to include item groups as intermediate level
    const getMaxDrillDownLevel = useCallback((): number => {
        switch (viewMode) {
            case 'store-groups': return 4; // group -> store cat -> item group -> item cat -> subcategory
            case 'store-categories': return 3; // store cat -> item group -> item cat -> subcategory
            case 'item-groups': return 2; // item group -> item cat -> subcategory
            case 'item-categories': return 1; // item cat -> subcategory
            default: return 2;
        }
    }, [viewMode]);

    // Handle drill-down into a category/group
    // Story 14.13 Session 7: Updated to support level 4 for store-groups mode
    const handleDrillDown = (name: string) => {
        setSelectedCategory(null); // Clear selection
        setDrillDownExpandedCount(0); // Reset expanded count when drilling down

        const maxLevel = getMaxDrillDownLevel();
        if (drillDownLevel < maxLevel) {
            // Story 14.13.3: Trigger animation reset for new data
            setDonutAnimationKey(prev => prev + 1);
            setVisibleSegments(new Set());
            // Add name to path and increment level
            setDrillDownPath(prev => [...prev, name]);
            setDrillDownLevel(prev => Math.min(prev + 1, 4) as 0 | 1 | 2 | 3 | 4);
        }
    };

    // Handle back navigation
    const handleBack = () => {
        setSelectedCategory(null);
        setDrillDownExpandedCount(0); // Reset expanded count when going back

        if (drillDownLevel > 0) {
            // Story 14.13.3: Trigger animation reset when going back
            setDonutAnimationKey(prev => prev + 1);
            setVisibleSegments(new Set());
            // Remove last item from path and decrement level
            setDrillDownPath(prev => prev.slice(0, -1));
            setDrillDownLevel(prev => Math.max(prev - 1, 0) as 0 | 1 | 2 | 3 | 4);
        }
    };

    /**
     * Story 14.13a: Build semantic DrillDownPath from current state.
     * Converts the string array path and drill-down level into a structured object
     * with semantic meaning based on the current viewMode.
     *
     * @param currentCategoryName - The category being clicked (added to path)
     * @returns DrillDownPath with all accumulated filter dimensions
     */
    const buildSemanticDrillDownPath = useCallback((currentCategoryName?: string): DrillDownPath => {
        const path: DrillDownPath = {};

        // Map drillDownPath positions to semantic fields based on viewMode
        // The interpretation depends on which viewMode we're in
        switch (viewMode) {
            case 'store-groups':
                // Path order: storeGroup -> storeCategory -> itemGroup -> itemCategory -> subcategory
                if (drillDownPath[0]) path.storeGroup = drillDownPath[0];
                if (drillDownPath[1]) path.storeCategory = drillDownPath[1];
                if (drillDownPath[2]) path.itemGroup = drillDownPath[2];
                if (drillDownPath[3]) path.itemCategory = drillDownPath[3];
                // If we're clicking at level 4, add subcategory
                if (drillDownLevel === 4 && currentCategoryName) {
                    path.subcategory = currentCategoryName;
                } else if (drillDownLevel === 3 && currentCategoryName) {
                    path.itemCategory = currentCategoryName;
                } else if (drillDownLevel === 2 && currentCategoryName) {
                    path.itemGroup = currentCategoryName;
                } else if (drillDownLevel === 1 && currentCategoryName) {
                    path.storeCategory = currentCategoryName;
                } else if (drillDownLevel === 0 && currentCategoryName) {
                    path.storeGroup = currentCategoryName;
                }
                break;

            case 'store-categories':
                // Path order: storeCategory -> itemGroup -> itemCategory -> subcategory
                if (drillDownPath[0]) path.storeCategory = drillDownPath[0];
                if (drillDownPath[1]) path.itemGroup = drillDownPath[1];
                if (drillDownPath[2]) path.itemCategory = drillDownPath[2];
                // If we're clicking at level 3, add subcategory
                if (drillDownLevel === 3 && currentCategoryName) {
                    path.subcategory = currentCategoryName;
                } else if (drillDownLevel === 2 && currentCategoryName) {
                    path.itemCategory = currentCategoryName;
                } else if (drillDownLevel === 1 && currentCategoryName) {
                    path.itemGroup = currentCategoryName;
                } else if (drillDownLevel === 0 && currentCategoryName) {
                    path.storeCategory = currentCategoryName;
                }
                break;

            case 'item-groups':
                // Path order: itemGroup -> itemCategory -> subcategory
                if (drillDownPath[0]) path.itemGroup = drillDownPath[0];
                if (drillDownPath[1]) path.itemCategory = drillDownPath[1];
                // If we're clicking at level 2, add subcategory
                if (drillDownLevel === 2 && currentCategoryName) {
                    path.subcategory = currentCategoryName;
                } else if (drillDownLevel === 1 && currentCategoryName) {
                    path.itemCategory = currentCategoryName;
                } else if (drillDownLevel === 0 && currentCategoryName) {
                    path.itemGroup = currentCategoryName;
                }
                break;

            case 'item-categories':
                // Path order: itemCategory -> subcategory
                if (drillDownPath[0]) path.itemCategory = drillDownPath[0];
                // If we're clicking at level 1, add subcategory
                if (drillDownLevel === 1 && currentCategoryName) {
                    path.subcategory = currentCategoryName;
                } else if (drillDownLevel === 0 && currentCategoryName) {
                    path.itemCategory = currentCategoryName;
                }
                break;
        }

        return path;
    }, [viewMode, drillDownPath, drillDownLevel]);

    // Story 14.14b Session 4+5: Handle transaction count pill click - navigate to HistoryView with filters
    // Story 14.22: Full support for all view modes and drill-down levels
    // Story 14.14b Session 7: Handle "Más" aggregated group by expanding to constituent categories
    // Story 14.13 Session 7: Respect countMode for navigation target (items vs history)
    const handleTransactionCountClick = useCallback((categoryName: string) => {
        if (!onNavigateToHistory) return;

        // Build the navigation payload based on viewMode and drill-down state
        // Story 14.13 Session 7: Target view based on countMode toggle
        // Story 14.13 Session 7: Track source view for back navigation
        const payload: HistoryNavigationPayload = {
            targetView: countMode === 'items' ? 'items' : 'history',
            sourceDistributionView: 'donut',
        };

        // Check if this is the "Más" aggregated group - expand to constituent categories
        const isAggregatedGroup = categoryName === 'Más' || categoryName === 'More';
        // Use parent's otroCategories at level 0, otherwise use drill-down's otroCategories
        const currentOtroCategories = drillDownLevel === 0 ? parentOtroCategories : drillDownCategorized.otroCategories;

        // Set the appropriate filter based on view mode and drill-down level
        if (viewMode === 'store-categories') {
            if (drillDownLevel === 0) {
                if (isAggregatedGroup && currentOtroCategories.length > 0) {
                    // "Más" contains multiple store categories - join them with comma
                    payload.category = currentOtroCategories.map(c => c.name).join(',');
                } else {
                    // At store categories level - filter by store category
                    payload.category = categoryName;
                }
            } else {
                // Drilled down - filter by parent store category
                payload.category = drillDownPath[0] || categoryName;
            }
        } else if (viewMode === 'store-groups') {
            if (drillDownLevel === 0) {
                if (isAggregatedGroup && currentOtroCategories.length > 0) {
                    // "Más" contains multiple store groups - expand each group and combine
                    const allCategories = currentOtroCategories.flatMap(c =>
                        expandStoreCategoryGroup(c.name as StoreCategoryGroup)
                    );
                    payload.category = allCategories.join(',');
                } else {
                    // At store groups level - filter by store group
                    payload.storeGroup = categoryName;
                }
            } else if (drillDownLevel === 1) {
                if (isAggregatedGroup && currentOtroCategories.length > 0) {
                    // "Más" contains multiple store categories - join them with comma
                    payload.category = currentOtroCategories.map(c => c.name).join(',');
                } else {
                    // Viewing store categories within a group - filter by store category
                    payload.category = categoryName;
                }
            } else {
                // Deeper drill-down - filter by store category from path
                payload.category = drillDownPath[1] || categoryName;
            }
        } else if (viewMode === 'item-groups') {
            if (drillDownLevel === 0) {
                if (isAggregatedGroup && currentOtroCategories.length > 0) {
                    // "Más" contains multiple item groups - expand each group and combine
                    const allItemCategories = currentOtroCategories.flatMap(c =>
                        expandItemCategoryGroup(c.name as ItemCategoryGroup)
                    );
                    payload.itemCategory = allItemCategories.join(',');
                } else {
                    // At item groups level - filter by item group
                    payload.itemGroup = categoryName;
                }
            } else {
                if (isAggregatedGroup && currentOtroCategories.length > 0) {
                    // "Más" contains multiple item categories - join them with comma
                    payload.itemCategory = currentOtroCategories.map(c => c.name).join(',');
                } else {
                    // Drilled down - filter by item category
                    payload.itemCategory = categoryName;
                }
            }
        } else if (viewMode === 'item-categories') {
            if (isAggregatedGroup && currentOtroCategories.length > 0) {
                // "Más" contains multiple item categories - join them with comma
                payload.itemCategory = currentOtroCategories.map(c => c.name).join(',');
            } else {
                // At item categories level - filter by item category
                payload.itemCategory = categoryName;
            }
        }

        // Story 14.22: Build temporal filter based on current time period selection
        if (currentPeriod) {
            payload.temporal = {
                level: timePeriod,
                year: String(currentPeriod.year),
            };
            if (timePeriod === 'month' || timePeriod === 'week') {
                payload.temporal.month = `${currentPeriod.year}-${String(currentPeriod.month).padStart(2, '0')}`;
            }
            if (timePeriod === 'quarter') {
                payload.temporal.quarter = `Q${currentPeriod.quarter}`;
            }
        }

        // Story 14.13a: Include full drill-down path for multi-dimension filtering
        // This allows ItemsView/HistoryView to filter by multiple dimensions simultaneously
        // NOTE: Skip drillDownPath for aggregated "Más" categories - they are already expanded
        // into payload.category/itemCategory above and drillDownPath would add "Más" literally
        if (!isAggregatedGroup) {
            const semanticPath = buildSemanticDrillDownPath(categoryName);
            if (Object.keys(semanticPath).length > 0) {
                payload.drillDownPath = semanticPath;
            }
        }

        onNavigateToHistory(payload);
    }, [onNavigateToHistory, viewMode, drillDownLevel, drillDownPath, timePeriod, currentPeriod, parentOtroCategories, drillDownCategorized.otroCategories, countMode, buildSemanticDrillDownPath]);

    // Story 14.14b Session 4: View mode labels for title display
    const viewModeLabels: Record<DonutViewMode, { es: string; en: string }> = {
        'store-groups': { es: 'Grupos de Compras', en: 'Purchase Groups' },
        'store-categories': { es: 'Categorías de Compras', en: 'Purchase Categories' },
        'item-groups': { es: 'Grupos de Productos', en: 'Product Groups' },
        'item-categories': { es: 'Categorías de Productos', en: 'Product Categories' },
    };

    const currentViewModeLabel = viewModeLabels[viewMode] || viewModeLabels['store-categories'];

    return (
        <div
            className="flex flex-col h-full"
            data-testid="donut-view"
        >
            {/* Story 14.13 Session 19: Header with back button immediately after title - min-h-7 ensures button fits */}
            <div className="flex items-center justify-center min-h-7 mb-1 mt-1 gap-1">
                {/* Story 14.13 Session 18: Title shows drill-down path (translated) or base view mode */}
                <span
                    className={`text-xs font-semibold uppercase tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                    data-testid="donut-viewmode-title"
                >
                    {drillDownLevel > 0
                        ? translateCategory(drillDownPath[drillDownPath.length - 1], locale as 'en' | 'es')
                        : (locale === 'es' ? currentViewModeLabel.es : currentViewModeLabel.en)
                    }
                </span>
                {/* Story 14.13 Session 19: Back button - immediately after title text */}
                {drillDownLevel > 0 && (
                    <button
                        onClick={handleBack}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                        style={{
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                        }}
                        aria-label={locale === 'es' ? 'Volver' : 'Back'}
                        data-testid="donut-back-btn"
                    >
                        <ChevronLeft size={16} />
                    </button>
                )}
            </div>

            {/* Donut Chart with side buttons - Ring style matching mockup */}
            <div className="flex items-center justify-center gap-2 pb-2">
                {/* Menos button on left side of donut - always render for stable positioning */}
                <button
                    onClick={handleCollapse}
                    disabled={!canCollapse}
                    className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md"
                    style={{
                        backgroundColor: 'color-mix(in srgb, var(--primary) 70%, transparent)',
                        color: 'white',
                        opacity: canCollapse ? 1 : 0,
                        pointerEvents: canCollapse ? 'auto' : 'none',
                    }}
                    aria-label={locale === 'es' ? 'Mostrar menos categorías' : 'Show fewer categories'}
                    data-testid="donut-collapse-btn"
                >
                    <Minus size={18} strokeWidth={2.5} />
                    {/* Badge with count - bottom right, semi-transparent */}
                    <span
                        className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs font-bold backdrop-blur-md"
                        style={{
                            backgroundColor: 'color-mix(in srgb, var(--primary) 50%, transparent)',
                            color: 'white',
                        }}
                    >
                        {expandedCount}
                    </span>
                </button>

                {/* Donut chart */}
                <div className="relative" style={{ width: '180px', height: '180px' }}>
                    <svg viewBox="0 0 120 120" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
                        {(() => {
                            const circumference = 2 * Math.PI * 52; // ~326.73
                            const gapPercent = 0.5; // 0.5% gap between segments (reduced)
                            let currentOffset = 0;
                            let segmentIndex = 0;

                            return displayData.map((cat) => {
                                if (cat.percent <= 0) return null;

                                const currentSegmentIndex = segmentIndex++;
                                const isVisible = visibleSegments.has(currentSegmentIndex);
                                const isSelected = selectedCategory === cat.name;
                                // Apply gap by reducing segment size slightly
                                const segmentPercent = Math.max(0, cat.percent - gapPercent);
                                const dashLength = (segmentPercent / 100) * circumference;
                                // Story 14.13.3: Animate from 0 to full dashLength for clockwise reveal
                                const animatedDashLength = isVisible ? dashLength : 0;
                                const strokeDasharray = `${animatedDashLength} ${circumference - animatedDashLength}`;
                                const strokeDashoffset = -currentOffset;

                                currentOffset += (cat.percent / 100) * circumference;

                                return (
                                    <circle
                                        key={`${cat.name}-${donutAnimationKey}`}
                                        cx="60"
                                        cy="60"
                                        r="52"
                                        fill="none"
                                        stroke={cat.fgColor}
                                        strokeWidth={isSelected ? 16 : 14}
                                        strokeDasharray={strokeDasharray}
                                        strokeDashoffset={strokeDashoffset}
                                        className="cursor-pointer"
                                        style={{
                                            opacity: selectedCategory && !isSelected ? 0.4 : 1,
                                            transition: 'stroke-dasharray 400ms ease-out, stroke-width 200ms ease-out, opacity 200ms ease-out',
                                        }}
                                        onClick={() => handleSegmentClick(cat.name)}
                                        data-testid={`donut-segment-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                                    />
                                );
                            });
                        })()}
                    </svg>
                    {/* Center text - updates on segment selection (larger fonts) */}
                    {/* Story 14.13.3: Uses animated total for count-up effect */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {selectedData
                                ? formatCurrency(selectedData.value, currency)
                                : formatCurrency(animatedTotal, currency)
                            }
                        </span>
                        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {selectedData ? (() => {
                                // Story 14.14b: Translate based on current data type
                                // Story 14.13 Session 7: Updated for new drill-down structure with item groups
                                const isShowingStoreGroups = viewMode === 'store-groups' && drillDownLevel === 0;
                                const isShowingItemGroups =
                                    (viewMode === 'item-groups' && drillDownLevel === 0) ||
                                    (viewMode === 'store-categories' && drillDownLevel === 1) ||
                                    (viewMode === 'store-groups' && drillDownLevel === 2);
                                if (isShowingStoreGroups) {
                                    return translateStoreCategoryGroup(selectedData.name, locale as 'en' | 'es');
                                } else if (isShowingItemGroups) {
                                    return translateItemCategoryGroup(selectedData.name, locale as 'en' | 'es');
                                } else {
                                    return translateCategory(selectedData.name, locale as 'en' | 'es');
                                }
                            })() : 'Total'}
                        </span>
                    </div>
                </div>

                {/* Más button on right side of donut - always render for stable positioning */}
                <button
                    onClick={handleExpand}
                    disabled={!canExpand}
                    className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md"
                    style={{
                        backgroundColor: 'color-mix(in srgb, var(--primary) 70%, transparent)',
                        color: 'white',
                        opacity: canExpand ? 1 : 0,
                        pointerEvents: canExpand ? 'auto' : 'none',
                    }}
                    aria-label={locale === 'es' ? `Mostrar más (${otroCount} en Otro)` : `Show more (${otroCount} in Other)`}
                    data-testid="donut-expand-btn"
                >
                    <Plus size={18} strokeWidth={2.5} />
                    {/* Badge with count - bottom right, semi-transparent */}
                    <span
                        className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs font-bold backdrop-blur-md"
                        style={{
                            backgroundColor: 'color-mix(in srgb, var(--primary) 50%, transparent)',
                            color: 'white',
                        }}
                    >
                        {otroCount}
                    </span>
                </button>
            </div>

            {/* Rich Legend Items (Phase 4) - Scrollable within available space */}
            <div className="flex flex-col gap-1 px-1 flex-1 overflow-y-auto min-h-0">
                {displayData.map(cat => {
                    const isSelected = selectedCategory === cat.name;
                    // "Más" = aggregated small categories group (expandable), not the real "Otro" category
                    const isMasGroup = cat.name === 'Más' || cat.name === 'More';

                    // Story 14.14b: Get display name and emoji based on viewMode and drillDownLevel
                    let displayName: string;
                    let emoji: string;

                    // Determine what type of data we're showing based on viewMode and level
                    // Story 14.13 Session 7: Updated for new drill-down structure with item groups as intermediate level
                    const isShowingStoreGroups = viewMode === 'store-groups' && drillDownLevel === 0;
                    const isShowingStoreCategories =
                        (viewMode === 'store-categories' && drillDownLevel === 0) ||
                        (viewMode === 'store-groups' && drillDownLevel === 1);
                    // Story 14.13 Session 7: Item groups now appear at multiple levels:
                    // - item-groups mode at level 0
                    // - store-categories mode at level 1 (drilling into store category shows item groups)
                    // - store-groups mode at level 2 (drilling into store category shows item groups)
                    const isShowingItemGroups =
                        (viewMode === 'item-groups' && drillDownLevel === 0) ||
                        (viewMode === 'store-categories' && drillDownLevel === 1) ||
                        (viewMode === 'store-groups' && drillDownLevel === 2);
                    // Story 14.13 Session 7: Item categories now appear at adjusted levels:
                    // - item-categories mode at level 0
                    // - store-categories mode at level 2 (after item groups)
                    // - store-groups mode at level 3 (after item groups)
                    // - item-groups mode at level 1 (after drilling into item group)
                    const isShowingItemCategories =
                        (viewMode === 'item-categories' && drillDownLevel === 0) ||
                        (viewMode === 'store-categories' && drillDownLevel === 2) ||
                        (viewMode === 'store-groups' && drillDownLevel === 3) ||
                        (viewMode === 'item-groups' && drillDownLevel === 1);

                    // Story 14.14b: Can drill down if not "Más" group and not at max level
                    // For item categories, also check if subcategories exist
                    const maxLevel = getMaxDrillDownLevel();
                    let canDrillDownFurther = !isMasGroup && drillDownLevel < maxLevel;

                    // If showing item categories, only allow drill-down if subcategories exist
                    if (canDrillDownFurther && isShowingItemCategories) {
                        canDrillDownFurther = hasSubcategories(cat.name);
                    }

                    // Handle "Más" aggregated group specially
                    if (isMasGroup) {
                        displayName = locale === 'es' ? 'Más' : 'More';
                        emoji = '📁';
                    } else if (isShowingStoreGroups) {
                        displayName = translateStoreCategoryGroup(cat.name, locale as 'en' | 'es');
                        emoji = getStoreCategoryGroupEmoji(cat.name);
                    } else if (isShowingStoreCategories) {
                        displayName = translateCategory(cat.name, locale as 'en' | 'es');
                        emoji = getCategoryEmoji(cat.name);
                    } else if (isShowingItemGroups) {
                        displayName = translateItemCategoryGroup(cat.name, locale as 'en' | 'es');
                        emoji = getItemCategoryGroupEmoji(cat.name);
                    } else if (isShowingItemCategories) {
                        displayName = translateCategory(cat.name, locale as 'en' | 'es');
                        emoji = getItemCategoryEmoji(cat.name);
                    } else {
                        // Subcategories (deepest level) - use as-is
                        displayName = cat.name;
                        emoji = '📄';
                    }

                    // Story 14.13: Get text color respecting fontColorMode setting
                    const legendTextColor = getCategoryColorsAuto(cat.name).fg;

                    return (
                        <div
                            key={cat.name}
                            className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                                isSelected
                                    ? isDark ? 'bg-slate-600' : 'bg-slate-200'
                                    : isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                            }`}
                            data-testid={`legend-item-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                            {/* Story 14.40: Icon button opens statistics popup */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Don't show popup for "Más" aggregated group
                                    if (cat.name !== 'Más' && cat.name !== 'More') {
                                        onIconClick?.(cat.name, emoji, cat.fgColor);
                                    } else {
                                        handleSegmentClick(cat.name);
                                    }
                                }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 hover:scale-105 active:scale-95 transition-transform"
                                style={{ backgroundColor: cat.fgColor }}
                                aria-label={`${displayName} ${locale === 'es' ? 'estadísticas' : 'statistics'}`}
                            >
                                <span className="text-white drop-shadow-sm">
                                    {emoji}
                                </span>
                            </button>

                            {/* Name and amount info - two lines layout (spans full height) */}
                            <div
                                className="flex-1 flex flex-col items-start min-w-0"
                            >
                                {/* Line 1: Category name (clickable to select) */}
                                <button
                                    onClick={() => handleSegmentClick(cat.name)}
                                    className="text-sm font-medium truncate flex items-center gap-1 w-full text-left"
                                    style={{ color: legendTextColor }}
                                >
                                    {displayName}
                                    {/* Badge showing count of categories inside "Más" group */}
                                    {cat.categoryCount && (
                                        <span
                                            className="inline-flex items-center justify-center rounded-full text-xs"
                                            style={{
                                                backgroundColor: 'transparent',
                                                border: `1.5px solid ${legendTextColor}`,
                                                color: legendTextColor,
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                minWidth: '18px',
                                                height: '18px',
                                                padding: '0 4px',
                                            }}
                                        >
                                            {cat.categoryCount}
                                        </span>
                                    )}
                                </button>
                                {/* Line 2: Amount with percentage bar */}
                                <AnimatedAmountBar
                                    value={cat.value}
                                    percent={cat.percent}
                                    animationKey={donutAnimationKey}
                                    currency={currency}
                                    legendTextColor={legendTextColor}
                                    isDark={isDark}
                                    maxPercent={maxPercent}
                                    fgColor={cat.fgColor}
                                />
                            </div>

                            {/* Right side: Count pill, percentage, chevron - vertically centered */}
                            <AnimatedCountPill
                                count={cat.count}
                                itemCount={cat.itemCount ?? 0}
                                animationKey={donutAnimationKey}
                                countMode={countMode}
                                isDark={isDark}
                                locale={locale}
                                onCountClick={() => handleTransactionCountClick(cat.name)}
                                categoryName={cat.name}
                            />

                            <AnimatedPercent
                                percent={cat.percent}
                                animationKey={donutAnimationKey}
                                legendTextColor={legendTextColor}
                            />

                            {/* Drill-down chevron (can drill deeper) */}
                            {canDrillDownFurther && (
                                <button
                                    onClick={() => handleDrillDown(cat.name)}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                        isDark
                                            ? 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                                            : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                                    }`}
                                    aria-label={`Drill down into ${displayName}`}
                                    data-testid={`drill-down-${cat.name.toLowerCase()}`}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

        </div>
    );
};
