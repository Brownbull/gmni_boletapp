/**
 * IconCategoryFilter — Category/Item/Location Filter Dropdown for IconFilterBar
 *
 * Story 15-5e: Extracted from IconFilterBar.tsx
 * Story 14.15c: Hierarchical grouped display with multi-select
 * Story 14.36: Location filter with Country→City hierarchy
 *
 * 3-State Behavior (same pattern as time filter):
 * State 1: Original — no pending changes, shows committed state
 * State 2: Pending — user selected categories but hasn't applied (yellow)
 * State 3: Applied — user clicked tab name to apply filter (primary, menu closes)
 */

import React, { useState, useMemo } from 'react';
import { ChevronDown, Check, Package, Receipt, MapPin, FunnelX } from 'lucide-react';
import type { AvailableFilters } from '@shared/utils/historyFilterUtils';
import {
  getCategoryBackgroundAuto,
  getStoreGroupColors,
  getItemGroupColors,
  ALL_STORE_CATEGORY_GROUPS,
  ALL_ITEM_CATEGORY_GROUPS,
  expandStoreCategoryGroup,
  expandItemCategoryGroup,
  getCurrentTheme,
  getCurrentMode,
  type StoreCategoryGroup,
  type ItemCategoryGroup,
} from '@/config/categoryColors';
import { getCategoryEmoji } from '@/utils/categoryEmoji';
import {
  translateStoreCategory,
  translateItemGroup,
  translateStoreCategoryGroup,
  translateItemCategoryGroup,
  getStoreCategoryGroupEmoji,
  getItemCategoryGroupEmoji,
} from '@/utils/categoryTranslations';
import type { Language } from '@/utils/translations';
import { useLocationDisplay } from '@/hooks/useLocations';
import { CountryFlag } from '@/components/CountryFlag';

// ============================================================================
// Types
// ============================================================================

/** Story 14.14b Session 5: View mode for analytics synchronization */
type ViewMode = 'store-groups' | 'store-categories' | 'item-groups' | 'item-categories';

export interface CategoryFilterDropdownMenuProps {
  state: {
    level: string;
    category?: string;
    group?: string;
    selectedCategories?: string[];
    selectedItems?: string[];
    drillDownPath?: {
      storeGroup?: string;
      storeCategory?: string;
      itemGroup?: string;
      itemCategory?: string;
      subcategory?: string;
    };
  };
  locationState?: {
    country?: string;
    city?: string;
    selectedCities?: string;
  };
  dispatch: (action: any) => void;
  availableFilters: AvailableFilters;
  t: (key: string) => string;
  onClose: () => void;
  locale?: string;
  onViewModeChange?: (mode: ViewMode) => void;
  hasLocationFilter?: boolean;
}

// ============================================================================
// StoreGroupedCategoriesSection
// ============================================================================

interface StoreGroupedCategoriesSectionProps {
  selectedCategories: Set<string>;
  onCategoryToggle: (category: string) => void;
  onGroupToggle: (group: StoreCategoryGroup, categories: string[], isCurrentlySelected: boolean) => void;
  lang: Language;
  locale: string;
}

function StoreGroupedCategoriesSection({
  selectedCategories,
  onCategoryToggle,
  onGroupToggle,
  lang,
}: StoreGroupedCategoriesSectionProps): React.ReactElement {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(ALL_STORE_CATEGORY_GROUPS)
  );

  const toggleGroupExpansion = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const toSentenceCase = (str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <div className="space-y-2">
      {ALL_STORE_CATEGORY_GROUPS.map((group) => {
        const groupCategories = expandStoreCategoryGroup(group);
        const groupColors = getStoreGroupColors(group, getCurrentTheme(), getCurrentMode());
        const isExpanded = expandedGroups.has(group);

        const selectedInGroup = groupCategories.filter(cat => selectedCategories.has(cat));
        const allSelected = selectedInGroup.length === groupCategories.length;
        const someSelected = selectedInGroup.length > 0 && !allSelected;

        return (
          <div
            key={group}
            className="rounded-lg overflow-hidden"
            style={{ backgroundColor: groupColors.bg }}
          >
            {/* Group Header */}
            <div
              className="flex items-center gap-3 p-3 cursor-pointer"
              style={{ borderLeft: `4px solid ${groupColors.border || groupColors.fg}` }}
              onClick={() => toggleGroupExpansion(group)}
            >
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
              >
                {getStoreCategoryGroupEmoji(group)}
              </span>
              <span
                className="text-sm font-semibold flex-1"
                style={{ color: groupColors.fg }}
              >
                {toSentenceCase(translateStoreCategoryGroup(group, lang))}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onGroupToggle(group, groupCategories, allSelected);
                }}
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                style={{
                  backgroundColor: allSelected
                    ? 'var(--primary)'
                    : someSelected
                      ? 'var(--warning, #f59e0b)'
                      : 'white',
                  border: allSelected || someSelected ? 'none' : '2px solid var(--border-medium)',
                }}
              >
                {(allSelected || someSelected) && (
                  <Check size={14} strokeWidth={3} color="white" />
                )}
              </button>
            </div>

            {/* Category Items */}
            {isExpanded && (
              <div className="grid grid-cols-2 gap-1.5 px-3 pb-3">
                {groupCategories.map((category) => {
                  const isSelected = selectedCategories.has(category);
                  const categoryColor = getCategoryBackgroundAuto(category);

                  return (
                    <button
                      key={category}
                      onClick={() => onCategoryToggle(category)}
                      className="flex items-center gap-2 p-2 rounded-lg transition-colors text-left"
                      style={{
                        backgroundColor: isSelected ? categoryColor : 'rgba(255,255,255,0.5)',
                        border: isSelected ? `2px solid ${groupColors.fg}` : '2px solid transparent',
                      }}
                    >
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center text-sm flex-shrink-0"
                        style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.5)' : categoryColor }}
                      >
                        {getCategoryEmoji(category)}
                      </span>
                      <span
                        className="text-xs font-medium truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {translateStoreCategory(category, lang)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// ItemGroupedCategoriesSection
// ============================================================================

interface ItemGroupedCategoriesSectionProps {
  selectedCategories: Set<string>;
  onCategoryToggle: (category: string) => void;
  onGroupToggle: (group: ItemCategoryGroup, categories: string[], isCurrentlySelected: boolean) => void;
  lang: Language;
  locale: string;
}

function ItemGroupedCategoriesSection({
  selectedCategories,
  onCategoryToggle,
  onGroupToggle,
  lang,
}: ItemGroupedCategoriesSectionProps): React.ReactElement {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(ALL_ITEM_CATEGORY_GROUPS)
  );

  const toggleGroupExpansion = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const toSentenceCase = (str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <div className="space-y-2">
      {ALL_ITEM_CATEGORY_GROUPS.map((group) => {
        const groupCategories = expandItemCategoryGroup(group);
        const groupColors = getItemGroupColors(group, getCurrentTheme(), getCurrentMode());
        const isExpanded = expandedGroups.has(group);

        const selectedInGroup = groupCategories.filter(cat => selectedCategories.has(cat));
        const allSelected = selectedInGroup.length === groupCategories.length;
        const someSelected = selectedInGroup.length > 0 && !allSelected;

        return (
          <div
            key={group}
            className="rounded-lg overflow-hidden"
            style={{ backgroundColor: groupColors.bg }}
          >
            {/* Group Header */}
            <div
              className="flex items-center gap-3 p-3 cursor-pointer"
              style={{ borderLeft: `4px solid ${groupColors.border || groupColors.fg}` }}
              onClick={() => toggleGroupExpansion(group)}
            >
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
              >
                {getItemCategoryGroupEmoji(group)}
              </span>
              <span
                className="text-sm font-semibold flex-1"
                style={{ color: groupColors.fg }}
              >
                {toSentenceCase(translateItemCategoryGroup(group, lang))}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onGroupToggle(group, groupCategories, allSelected);
                }}
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                style={{
                  backgroundColor: allSelected
                    ? 'var(--primary)'
                    : someSelected
                      ? 'var(--warning, #f59e0b)'
                      : 'white',
                  border: allSelected || someSelected ? 'none' : '2px solid var(--border-medium)',
                }}
              >
                {(allSelected || someSelected) && (
                  <Check size={14} strokeWidth={3} color="white" />
                )}
              </button>
            </div>

            {/* Category Items */}
            {isExpanded && (
              <div className="grid grid-cols-2 gap-1.5 px-3 pb-3">
                {groupCategories.map((category) => {
                  const isSelected = selectedCategories.has(category);
                  const categoryColor = getCategoryBackgroundAuto(category);

                  return (
                    <button
                      key={category}
                      onClick={() => onCategoryToggle(category)}
                      className="flex items-center gap-2 p-2 rounded-lg transition-colors text-left"
                      style={{
                        backgroundColor: isSelected ? categoryColor : 'rgba(255,255,255,0.5)',
                        border: isSelected ? `2px solid ${groupColors.fg}` : '2px solid transparent',
                      }}
                    >
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center text-sm flex-shrink-0"
                        style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.5)' : categoryColor }}
                      >
                        {getCategoryEmoji(category)}
                      </span>
                      <span
                        className="text-xs font-medium truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {translateItemGroup(category, lang)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// CategoryFilterDropdownMenu
// ============================================================================

export function CategoryFilterDropdownMenu({
  state,
  locationState,
  dispatch,
  availableFilters,
  t,
  onClose,
  locale = 'es',
  onViewModeChange,
  hasLocationFilter = false,
}: CategoryFilterDropdownMenuProps) {
  const lang: Language = locale === 'es' ? 'es' : 'en';
  const { getCountryName, getCityName } = useLocationDisplay(lang);
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);

  // Committed state from context
  const drillDownPath = state.drillDownPath;
  const drillStoreCategory = drillDownPath?.storeCategory;
  const drillStoreGroup = drillDownPath?.storeGroup;
  const drillItemCategory = drillDownPath?.itemCategory;
  const drillItemGroup = drillDownPath?.itemGroup;

  const committedTransactions = useMemo(() => {
    if (drillStoreCategory) {
      return new Set(drillStoreCategory.split(',').map(c => c.trim()));
    }
    if (drillStoreGroup) {
      const expandedCategories = expandStoreCategoryGroup(drillStoreGroup as StoreCategoryGroup);
      return new Set(expandedCategories);
    }
    if (state.level === 'category' && state.category) {
      return new Set(state.category.split(',').map(c => c.trim()));
    }
    return new Set<string>();
  }, [state.level, state.category, drillStoreCategory, drillStoreGroup]);

  const committedItems = useMemo(() => {
    if (drillItemCategory) {
      return new Set(drillItemCategory.split(',').map(c => c.trim()));
    }
    if (drillItemGroup) {
      const expandedCategories = expandItemCategoryGroup(drillItemGroup as ItemCategoryGroup);
      return new Set(expandedCategories);
    }
    if (state.level === 'group' && state.group) {
      return new Set(state.group.split(',').map(g => g.trim()));
    }
    return new Set<string>();
  }, [state.level, state.group, drillItemCategory, drillItemGroup]);

  // Pending state - local selections not yet applied
  const [pendingTransactions, setPendingTransactions] = useState<Set<string>>(
    () => new Set(committedTransactions)
  );
  const [pendingItems, setPendingItems] = useState<Set<string>>(
    () => new Set(committedItems)
  );

  // Sync pending state when committed state changes
  const committedTransactionsKey = useMemo(
    () => Array.from(committedTransactions).sort().join(','),
    [committedTransactions]
  );
  const committedItemsKey = useMemo(
    () => Array.from(committedItems).sort().join(','),
    [committedItems]
  );

  React.useEffect(() => {
    setPendingTransactions(new Set(committedTransactions));
  }, [committedTransactionsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    setPendingItems(new Set(committedItems));
  }, [committedItemsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================================
  // Location state management
  // ============================================================================

  const cityToCountry = useMemo(() => {
    const map = new Map<string, string>();
    for (const country of availableFilters.countries) {
      const cities = availableFilters.citiesByCountry[country] || [];
      for (const city of cities) {
        map.set(city, country);
      }
    }
    return map;
  }, [availableFilters.countries, availableFilters.citiesByCountry]);

  const committedLocations = useMemo(() => {
    if (locationState?.selectedCities) {
      return new Set(locationState.selectedCities.split(',').map(c => c.trim()).filter(Boolean));
    }
    if (locationState?.city) {
      return new Set([locationState.city]);
    }
    if (locationState?.country && !locationState.city) {
      const countryCities = availableFilters.citiesByCountry[locationState.country] || [];
      return new Set(countryCities);
    }
    return new Set<string>();
  }, [locationState?.selectedCities, locationState?.city, locationState?.country, availableFilters.citiesByCountry]);

  const [pendingLocations, setPendingLocations] = useState<Set<string>>(
    () => new Set(committedLocations)
  );

  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(() => {
    return new Set(
      availableFilters.countries.filter(
        country => (availableFilters.citiesByCountry[country]?.length || 0) > 0
      )
    );
  });

  const committedLocationsKey = useMemo(
    () => Array.from(committedLocations).sort().join(','),
    [committedLocations]
  );

  React.useEffect(() => {
    setPendingLocations(new Set(committedLocations));
  }, [committedLocationsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check pending changes
  const hasPendingTransactionChanges = useMemo(() => {
    if (pendingTransactions.size !== committedTransactions.size) return true;
    for (const cat of pendingTransactions) {
      if (!committedTransactions.has(cat)) return true;
    }
    return false;
  }, [pendingTransactions, committedTransactions]);

  const hasPendingItemChanges = useMemo(() => {
    if (pendingItems.size !== committedItems.size) return true;
    for (const item of pendingItems) {
      if (!committedItems.has(item)) return true;
    }
    return false;
  }, [pendingItems, committedItems]);

  const hasPendingLocationChanges = useMemo(() => {
    if (pendingLocations.size !== committedLocations.size) return true;
    for (const loc of pendingLocations) {
      if (!committedLocations.has(loc)) return true;
    }
    return false;
  }, [pendingLocations, committedLocations]);

  // Toggle handlers
  const handleTransactionToggle = (category: string) => {
    setPendingTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleItemToggle = (item: string) => {
    setPendingItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(item)) {
        newSet.delete(item);
      } else {
        newSet.add(item);
      }
      return newSet;
    });
  };

  const handleCityToggle = (city: string) => {
    setPendingLocations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(city)) {
        newSet.delete(city);
      } else {
        newSet.add(city);
      }
      return newSet;
    });
  };

  const handleCountryToggle = (country: string) => {
    const countryCities = availableFilters.citiesByCountry[country] || [];
    setPendingLocations(prev => {
      const newSet = new Set(prev);
      const allSelected = countryCities.every(city => newSet.has(city));
      if (allSelected) {
        countryCities.forEach(city => newSet.delete(city));
      } else {
        countryCities.forEach(city => newSet.add(city));
      }
      return newSet;
    });
  };

  const getCountrySelectionState = (country: string): 'all' | 'some' | 'none' => {
    const countryCities = availableFilters.citiesByCountry[country] || [];
    if (countryCities.length === 0) return 'none';
    const selectedInCountry = countryCities.filter(city => pendingLocations.has(city));
    if (selectedInCountry.length === 0) return 'none';
    if (selectedInCountry.length === countryCities.length) return 'all';
    return 'some';
  };

  const toggleCountryExpansion = (country: string) => {
    setExpandedCountries(prev => {
      const next = new Set(prev);
      if (next.has(country)) {
        next.delete(country);
      } else {
        next.add(country);
      }
      return next;
    });
  };

  // Apply handlers
  const applyTransactionFilter = () => {
    const pendingItemCategory = pendingItems.size > 0
      ? (pendingItems.size === 1
          ? Array.from(pendingItems)[0]
          : Array.from(pendingItems).join(','))
      : null;
    const existingItemGroup = pendingItemCategory ||
      drillDownPath?.itemGroup || drillDownPath?.itemCategory ||
      (state.level === 'group' ? state.group : undefined);

    if (pendingTransactions.size === 0 && !existingItemGroup) {
      dispatch({ type: 'CLEAR_CATEGORY' });
      onViewModeChange?.('store-categories');
    } else if (pendingTransactions.size === 0 && existingItemGroup) {
      dispatch({
        type: 'SET_CATEGORY_FILTER',
        payload: {
          level: 'group',
          group: existingItemGroup,
          drillDownPath: { itemCategory: existingItemGroup }
        }
      });
      onViewModeChange?.('store-categories');
    } else {
      const storeCategory = pendingTransactions.size === 1
        ? Array.from(pendingTransactions)[0]
        : Array.from(pendingTransactions).join(',');

      const newDrillDownPath: Record<string, string> = { storeCategory };
      if (existingItemGroup) {
        newDrillDownPath.itemCategory = existingItemGroup;
      }

      dispatch({
        type: 'SET_CATEGORY_FILTER',
        payload: {
          level: 'category',
          category: storeCategory,
          drillDownPath: Object.keys(newDrillDownPath).length > 0 ? newDrillDownPath : undefined
        }
      });
      onViewModeChange?.('store-categories');
    }
    onClose();
  };

  const applyItemFilter = () => {
    const pendingStoreCategory = pendingTransactions.size > 0
      ? (pendingTransactions.size === 1
          ? Array.from(pendingTransactions)[0]
          : Array.from(pendingTransactions).join(','))
      : null;
    const existingStoreCategory = pendingStoreCategory ||
      drillDownPath?.storeCategory ||
      (state.level === 'category' ? state.category : undefined);

    if (pendingItems.size === 0 && !existingStoreCategory) {
      dispatch({ type: 'CLEAR_CATEGORY' });
      onViewModeChange?.('item-categories');
    } else if (pendingItems.size === 0 && existingStoreCategory) {
      dispatch({
        type: 'SET_CATEGORY_FILTER',
        payload: {
          level: 'category',
          category: existingStoreCategory,
          drillDownPath: { storeCategory: existingStoreCategory }
        }
      });
      onViewModeChange?.('item-categories');
    } else {
      const itemCategory = pendingItems.size === 1
        ? Array.from(pendingItems)[0]
        : Array.from(pendingItems).join(',');

      const newDrillDownPath: Record<string, string> = { itemCategory };
      if (existingStoreCategory) {
        newDrillDownPath.storeCategory = existingStoreCategory;
      }

      dispatch({
        type: 'SET_CATEGORY_FILTER',
        payload: {
          level: 'group',
          group: itemCategory,
          drillDownPath: Object.keys(newDrillDownPath).length > 0 ? newDrillDownPath : undefined
        }
      });
      onViewModeChange?.('item-categories');
    }
    onClose();
  };

  const applyLocationFilter = () => {
    if (pendingLocations.size === 0) {
      dispatch({ type: 'CLEAR_LOCATION' });
    } else {
      const cityArray = Array.from(pendingLocations);
      const countries = new Set(cityArray.map(c => cityToCountry.get(c)).filter(Boolean));
      const primaryCountry = countries.size === 1
        ? Array.from(countries)[0]
        : (cityArray.length > 0 ? cityToCountry.get(cityArray[0]) : undefined);

      dispatch({
        type: 'SET_LOCATION_FILTER',
        payload: {
          country: primaryCountry,
          selectedCities: cityArray.join(','),
        }
      });
    }
    onClose();
  };

  const clearFilter = () => {
    setPendingTransactions(new Set());
    setPendingItems(new Set());
    setPendingLocations(new Set());
    dispatch({ type: 'CLEAR_CATEGORY' });
    dispatch({ type: 'CLEAR_LOCATION' });
    onClose();
  };

  // Visual state
  const hasFilter = committedTransactions.size > 0 || committedItems.size > 0 || committedLocations.size > 0;

  const isTransactionsActive = (state.level === 'category' && committedTransactions.size > 0) ||
    Boolean(drillStoreCategory || drillStoreGroup);
  const isItemsActive = (state.level === 'group' && committedItems.size > 0) ||
    Boolean(drillItemGroup || drillItemCategory);
  const isLocationActive = hasLocationFilter || committedLocations.size > 0;
  const isTransactionsPending = hasPendingTransactionChanges && activeTab === 0;
  const isItemsPending = hasPendingItemChanges && activeTab === 1;
  const isLocationsPending = hasPendingLocationChanges && activeTab === 2;

  const sortedCountries = useMemo(() => {
    return [...availableFilters.countries].sort((a, b) =>
      getCountryName(a).localeCompare(getCountryName(b), lang)
    );
  }, [availableFilters.countries, getCountryName, lang]);

  return (
    <div
      className="fixed mt-2 rounded-xl overflow-hidden"
      style={{
        zIndex: 70,
        backgroundColor: 'var(--bg-secondary)',
        boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1))',
        border: '1px solid var(--border-light)',
        top: '7rem',
        left: '1rem',
        right: '1rem',
        maxWidth: '20rem',
        marginLeft: 'auto',
      }}
    >
      {/* Header with tabs */}
      <div
        className="flex items-stretch"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      >
        {/* Transactions Tab */}
        <button
          onClick={() => {
            if (activeTab === 0 && (isTransactionsPending || pendingTransactions.size > 0)) {
              applyTransactionFilter();
            } else {
              setActiveTab(0);
            }
          }}
          className={`flex-1 py-2.5 flex items-center justify-center transition-all ${isTransactionsPending ? 'pending-pulse' : ''}`}
          style={{
            backgroundColor: isTransactionsPending
              ? 'var(--warning-light, rgba(245, 158, 11, 0.15))'
              : isTransactionsActive
                ? 'var(--primary-light)'
                : activeTab === 0
                  ? 'var(--bg-secondary)'
                  : 'transparent',
            borderBottom: activeTab === 0
              ? '3px solid var(--primary)'
              : '3px solid transparent',
          }}
          title={isTransactionsPending
            ? (locale === 'es' ? 'Clic para aplicar filtro' : 'Click to apply filter')
            : (locale === 'es' ? 'Compras' : 'Purchases')
          }
          aria-label={locale === 'es' ? 'Filtrar por compras' : 'Filter by purchases'}
        >
          <Receipt
            className="filter-tab-icon"
            strokeWidth={1.8}
            style={{
              color: isTransactionsPending
                ? 'var(--warning, #f59e0b)'
                : isTransactionsActive || activeTab === 0
                  ? 'var(--primary)'
                  : 'var(--text-secondary)',
            }}
          />
        </button>

        {/* Products Tab */}
        <button
          onClick={() => {
            if (activeTab === 1 && (isItemsPending || pendingItems.size > 0)) {
              applyItemFilter();
            } else {
              setActiveTab(1);
            }
          }}
          className={`flex-1 py-2.5 flex items-center justify-center transition-all ${isItemsPending ? 'pending-pulse' : ''}`}
          style={{
            backgroundColor: isItemsPending
              ? 'var(--warning-light, rgba(245, 158, 11, 0.15))'
              : isItemsActive
                ? 'var(--primary-light)'
                : activeTab === 1
                  ? 'var(--bg-secondary)'
                  : 'transparent',
            borderBottom: activeTab === 1
              ? '3px solid var(--primary)'
              : '3px solid transparent',
          }}
          title={isItemsPending
            ? (locale === 'es' ? 'Clic para aplicar filtro' : 'Click to apply filter')
            : (locale === 'es' ? 'Productos' : 'Products')
          }
          aria-label={locale === 'es' ? 'Filtrar por productos' : 'Filter by products'}
        >
          <Package
            className="filter-tab-icon"
            strokeWidth={1.8}
            style={{
              color: isItemsPending
                ? 'var(--warning, #f59e0b)'
                : isItemsActive || activeTab === 1
                  ? 'var(--primary)'
                  : 'var(--text-secondary)',
            }}
          />
        </button>

        {/* Location Tab */}
        <button
          onClick={() => {
            if (activeTab === 2 && (isLocationsPending || pendingLocations.size > 0)) {
              applyLocationFilter();
            } else {
              setActiveTab(2);
            }
          }}
          className={`flex-1 py-2.5 flex items-center justify-center transition-all ${isLocationsPending ? 'pending-pulse' : ''}`}
          style={{
            backgroundColor: isLocationsPending
              ? 'var(--warning-light, rgba(245, 158, 11, 0.15))'
              : isLocationActive
                ? 'var(--primary-light)'
                : activeTab === 2
                  ? 'var(--bg-secondary)'
                  : 'transparent',
            borderBottom: activeTab === 2
              ? '3px solid var(--primary)'
              : '3px solid transparent',
          }}
          title={isLocationsPending
            ? (locale === 'es' ? 'Clic para aplicar filtro' : 'Click to apply filter')
            : (locale === 'es' ? 'Ubicación' : 'Location')
          }
          aria-label={locale === 'es' ? 'Filtrar por ubicación' : 'Filter by location'}
        >
          <MapPin
            className="filter-tab-icon"
            strokeWidth={1.8}
            style={{
              color: isLocationsPending
                ? 'var(--warning, #f59e0b)'
                : isLocationActive || activeTab === 2
                  ? 'var(--primary)'
                  : 'var(--text-secondary)',
            }}
          />
        </button>

        {/* Clear filter button */}
        {hasFilter && (
          <button
            onClick={clearFilter}
            className="px-3 py-2.5 flex items-center justify-center transition-all"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderLeft: '1px solid var(--border-light)',
            }}
            title={locale === 'es' ? 'Limpiar filtros' : 'Clear filters'}
            aria-label={locale === 'es' ? 'Limpiar todos los filtros' : 'Clear all filters'}
          >
            <FunnelX
              className="filter-tab-icon-clear"
              strokeWidth={1.8}
              style={{ color: 'var(--text-secondary)' }}
            />
          </button>
        )}
      </div>

      {/* Icon size styles */}
      <style>{`
        .filter-tab-icon {
          width: 22px;
          height: 22px;
        }
        .filter-tab-icon-clear {
          width: 20px;
          height: 20px;
        }
        [data-font-size="normal"] .filter-tab-icon {
          width: 26px;
          height: 26px;
        }
        [data-font-size="normal"] .filter-tab-icon-clear {
          width: 24px;
          height: 24px;
        }
      `}</style>

      {/* Category/Item/Location List */}
      <div className="max-h-80 overflow-y-auto p-2 space-y-2">
        {activeTab === 0 && (
          <StoreGroupedCategoriesSection
            selectedCategories={pendingTransactions}
            onCategoryToggle={handleTransactionToggle}
            onGroupToggle={(_group, categories, isCurrentlySelected) => {
              setPendingTransactions(prev => {
                const newSet = new Set(prev);
                if (isCurrentlySelected) {
                  categories.forEach(cat => newSet.delete(cat));
                } else {
                  categories.forEach(cat => newSet.add(cat));
                }
                return newSet;
              });
            }}
            lang={lang}
            locale={locale}
          />
        )}
        {activeTab === 1 && (
          <ItemGroupedCategoriesSection
            selectedCategories={pendingItems}
            onCategoryToggle={handleItemToggle}
            onGroupToggle={(_group, categories, isCurrentlySelected) => {
              setPendingItems(prev => {
                const newSet = new Set(prev);
                if (isCurrentlySelected) {
                  categories.forEach(cat => newSet.delete(cat));
                } else {
                  categories.forEach(cat => newSet.add(cat));
                }
                return newSet;
              });
            }}
            lang={lang}
            locale={locale}
          />
        )}
        {activeTab === 2 && (
          <div className="space-y-1">
            {sortedCountries.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {t('noLocationData') || (lang === 'es' ? 'Sin datos de ubicación' : 'No location data')}
              </div>
            ) : (
              sortedCountries.map(country => {
                const cities = availableFilters.citiesByCountry[country] || [];
                const isExpanded = expandedCountries.has(country);
                const selectionState = getCountrySelectionState(country);
                const hasCities = cities.length > 0;

                return (
                  <div key={country} className="rounded-lg overflow-hidden">
                    {/* Country Row */}
                    <div
                      className="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors hover:bg-[var(--bg-tertiary)]"
                      onClick={() => hasCities ? toggleCountryExpansion(country) : handleCountryToggle(country)}
                    >
                      {hasCities ? (
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                          style={{ color: 'var(--text-tertiary)' }}
                        />
                      ) : (
                        <span className="w-4" />
                      )}

                      <span
                        className="flex-1 text-sm font-medium flex items-center gap-1.5"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <CountryFlag country={country} size="small" />
                        {getCountryName(country)}
                      </span>

                      {hasCities && (
                        <span
                          className="px-1.5 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          {cities.length}
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCountryToggle(country);
                        }}
                        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{
                          backgroundColor: selectionState === 'all'
                            ? 'var(--primary)'
                            : selectionState === 'some'
                              ? 'var(--warning, #f59e0b)'
                              : 'transparent',
                          border: selectionState !== 'none'
                            ? 'none'
                            : '2px solid var(--border-medium)',
                        }}
                        aria-label={lang === 'es'
                          ? `Seleccionar todas las ciudades de ${getCountryName(country)}`
                          : `Select all cities in ${getCountryName(country)}`
                        }
                      >
                        {selectionState !== 'none' && (
                          <Check size={12} strokeWidth={3} color="white" />
                        )}
                      </button>
                    </div>

                    {/* Cities (expanded) */}
                    {isExpanded && hasCities && (
                      <div className="ml-6 pl-2 border-l space-y-0.5" style={{ borderColor: 'var(--border-light)' }}>
                        {cities
                          .sort((a, b) => getCityName(a).localeCompare(getCityName(b), lang))
                          .map(city => {
                            const isSelected = pendingLocations.has(city);
                            return (
                              <button
                                key={city}
                                onClick={() => handleCityToggle(city)}
                                className="w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors hover:bg-[var(--bg-tertiary)]"
                              >
                                <span
                                  className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors"
                                  style={{
                                    backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                                    border: isSelected ? 'none' : '2px solid var(--border-medium)',
                                  }}
                                >
                                  {isSelected && (
                                    <Check size={10} strokeWidth={3} color="white" />
                                  )}
                                </span>

                                <span
                                  className="text-sm"
                                  style={{
                                    color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                                    fontWeight: isSelected ? 500 : 400,
                                  }}
                                >
                                  {getCityName(city)}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Pending animation styles */}
      {(isTransactionsPending || isItemsPending || isLocationsPending) && (
        <style>{`
          @keyframes pendingShine {
            0% {
              background-position: -100% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
          .pending-pulse {
            position: relative;
            overflow: hidden;
          }
          .pending-pulse::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.4) 25%,
              rgba(255, 255, 255, 0.6) 50%,
              rgba(255, 255, 255, 0.4) 75%,
              transparent 100%
            );
            background-size: 200% 100%;
            animation: pendingShine 2.5s ease-in-out infinite;
            pointer-events: none;
            border-radius: inherit;
          }
        `}</style>
      )}
    </div>
  );
}
