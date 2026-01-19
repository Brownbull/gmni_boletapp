/**
 * IconFilterBar Component
 *
 * Story 14.14: Transaction List Redesign
 * Story 14.15b: Transaction Selection Mode & Groups
 * Icon-only filter buttons matching the mockup design.
 *
 * Features:
 * - Calendar icon for temporal filter
 * - Tag icon for category filter
 * - Bookmark icon for custom groups
 * - Dropdown menus on click
 * - Active state highlighting
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, Filter, Bookmark, ChevronLeft, ChevronRight, ChevronDown, X, Check, Package, Receipt, MapPin, FunnelX, FunnelPlus, Users } from 'lucide-react';
import { useHistoryFilters } from '../../hooks/useHistoryFilters';
import type { AvailableFilters } from '../../utils/historyFilterUtils';
import {
  buildYearFilter,
  buildQuarterFilter,
  buildMonthFilter,
  buildWeekFilter,
  buildDayFilter,
} from '../../utils/historyFilterUtils';
// Story 14.21: Use unified category colors
// Story 14.15c: Add category group helpers
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
} from '../../config/categoryColors';
import { getCategoryEmoji } from '../../utils/categoryEmoji';
import {
  translateStoreCategory,
  translateItemGroup,
  translateStoreCategoryGroup,
  translateItemCategoryGroup,
  getStoreCategoryGroupEmoji,
  getItemCategoryGroupEmoji,
} from '../../utils/categoryTranslations';
import type { Language } from '../../utils/translations';
// Story 14.36: Location filter with multi-select
import { useLocationDisplay } from '../../hooks/useLocations';
import { CountryFlag } from '../CountryFlag';
// Story 14c.8: Consolidated group type (shared groups only)
import type { GroupWithMeta } from '../../hooks/useAllUserGroups';

// ============================================================================
// Types
// ============================================================================

/** Story 14.14b Session 5: View mode for analytics synchronization */
type ViewMode = 'store-groups' | 'store-categories' | 'item-groups' | 'item-categories';

interface IconFilterBarProps {
  /** Available filters extracted from transactions */
  availableFilters: AvailableFilters;
  /** Translation function */
  t: (key: string) => string;
  /** Locale for date formatting */
  locale?: string;
  /** Story 14c.8: User's groups for filtering (shared groups via useAllUserGroups) */
  groups?: GroupWithMeta[];
  /** Story 14c.8: Whether groups are loading */
  groupsLoading?: boolean;
  /** Story 14.14b Session 5: Current view mode from TrendsView for sync */
  viewMode?: ViewMode;
  /** Story 14.14b Session 5: Callback when view mode should change */
  onViewModeChange?: (mode: ViewMode) => void;
}

type DropdownType = 'time' | 'category' | 'custom' | null;

// ============================================================================
// Component
// ============================================================================

export function IconFilterBar({
  availableFilters,
  t,
  locale = 'es',
  groups = [],
  groupsLoading = false,
  viewMode: _viewMode, // Story 14.14b Session 5: Reserved for future bidirectional sync
  onViewModeChange,
}: IconFilterBarProps): React.ReactElement {
  const { state, dispatch, hasGroupFilter, hasLocationFilter } = useHistoryFilters();
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDropdown]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdown(null);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const toggleDropdown = (type: DropdownType) => {
    setOpenDropdown(prev => prev === type ? null : type);
  };

  // Check if filters are active
  const hasTemporalFilter = state.temporal.level !== 'all';
  // Story 14.13a: Also check drillDownPath for category filter active state
  const hasCategoryFilter = state.category.level !== 'all' || Boolean(state.category.drillDownPath);
  // Story 14.36 Enhancement: Combined filter state for Funnel icon (category OR location)
  const hasCategoryOrLocationFilter = hasCategoryFilter || hasLocationFilter;

  return (
    <div ref={containerRef} className="flex items-center gap-2 relative">
      {/* Time Filter Button */}
      <button
        onClick={() => toggleDropdown('time')}
        className={`
          w-9 h-9 rounded-full flex items-center justify-center
          transition-all duration-150
          ${hasTemporalFilter
            ? 'bg-[var(--primary-light)]'
            : 'bg-[var(--bg-secondary)]'
          }
        `}
        style={{
          border: 'none',
        }}
        aria-label={t('temporalFilter')}
        aria-expanded={openDropdown === 'time'}
      >
        <Calendar
          size={20}
          strokeWidth={1.8}
          style={{
            color: hasTemporalFilter
              ? 'var(--primary)'
              : 'var(--text-secondary)'
          }}
        />
      </button>

      {/* Category/Location Filter Button - Story 14.36: FunnelPlus when filter active */}
      <button
        onClick={() => toggleDropdown('category')}
        className={`
          w-9 h-9 rounded-full flex items-center justify-center
          transition-all duration-150
          ${hasCategoryOrLocationFilter
            ? 'bg-[var(--primary-light)]'
            : 'bg-[var(--bg-secondary)]'
          }
        `}
        style={{
          border: 'none',
        }}
        aria-label={t('categoryFilter')}
        aria-expanded={openDropdown === 'category'}
      >
        {hasCategoryOrLocationFilter ? (
          <FunnelPlus
            size={20}
            strokeWidth={1.8}
            style={{ color: 'var(--primary)' }}
          />
        ) : (
          <Filter
            size={20}
            strokeWidth={1.8}
            style={{ color: 'var(--text-secondary)' }}
          />
        )}
      </button>

      {/* Custom Groups Button (Story 14.15b) */}
      <button
        onClick={() => toggleDropdown('custom')}
        className={`
          w-9 h-9 rounded-full flex items-center justify-center
          transition-all duration-150
          ${hasGroupFilter
            ? 'bg-[var(--primary-light)]'
            : 'bg-[var(--bg-secondary)]'
          }
        `}
        style={{
          border: 'none',
        }}
        aria-label={t('customGroups')}
        aria-expanded={openDropdown === 'custom'}
      >
        <Bookmark
          size={20}
          strokeWidth={1.8}
          style={{
            color: hasGroupFilter
              ? 'var(--primary)'
              : 'var(--text-secondary)'
          }}
        />
      </button>

      {/* Time Dropdown */}
      {openDropdown === 'time' && (
        <TimeFilterDropdown
          state={state.temporal}
          dispatch={dispatch}
          availableFilters={availableFilters}
          locale={locale}
          onClose={() => setOpenDropdown(null)}
        />
      )}

      {/* Category Dropdown - Story 14.36 Enhancement: Now includes Lugar tab */}
      {openDropdown === 'category' && (
        <CategoryFilterDropdownMenu
          state={state.category}
          locationState={state.location}
          dispatch={dispatch}
          availableFilters={availableFilters}
          t={t}
          locale={locale}
          onClose={() => setOpenDropdown(null)}
          onViewModeChange={onViewModeChange}
          hasLocationFilter={hasLocationFilter}
        />
      )}

      {/* Story 14c.8: Custom Groups Dropdown (shared groups only) */}
      {openDropdown === 'custom' && (
        <GroupFilterDropdown
          currentGroupIds={state.group.groupIds}
          groups={groups}
          loading={groupsLoading}
          dispatch={dispatch}
          t={t}
          onClose={() => setOpenDropdown(null)}
          lang={locale}
        />
      )}

    </div>
  );
}

// ============================================================================
// Time Filter Dropdown - 3-State Behavior
// State 1 (Original): No changes, normal appearance
// State 2 (Pending): User changed values with arrows, shows bounce/glow animation
// State 3 (Active): User clicked label to apply filter
// ============================================================================

interface TimeFilterDropdownProps {
  state: { level: string; year?: string; quarter?: string; month?: string; week?: number; day?: string };
  dispatch: (action: any) => void;
  availableFilters: AvailableFilters;
  t: (key: string) => string;
  locale: string;
  onClose: () => void;
}

// Pending state type - values that have been changed but not yet applied
interface PendingTemporalState {
  year: string;
  quarter: string;
  month: string; // Just the 2-digit month number (e.g., "01")
  week: number | null;
  day: number | null;
}

function TimeFilterDropdown({
  state,
  dispatch,
  availableFilters,
  locale,
  onClose
}: Omit<TimeFilterDropdownProps, 't'>) {
  const years = availableFilters.years || [];
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const quartersDisplay = locale === 'es' ? ['T1', 'T2', 'T3', 'T4'] : ['Q1', 'Q2', 'Q3', 'Q4'];
  const months = locale === 'es'
    ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Extract initial values from committed state
  const committedYear = state.year || (years[0] || new Date().getFullYear().toString());
  const committedQuarter = state.quarter || 'Q4';
  const committedMonthFull = state.month || `${committedYear}-12`;
  const committedMonthNum = committedMonthFull.includes('-')
    ? committedMonthFull.split('-')[1]
    : committedMonthFull;
  const committedWeek = state.week || null;
  const committedDayNum = state.day ? parseInt(state.day.split('-')[2]) : null;

  // Local pending state - values that user has navigated to but NOT yet applied
  const [pending, setPending] = React.useState<PendingTemporalState>({
    year: committedYear,
    quarter: committedQuarter,
    month: committedMonthNum,
    week: committedWeek,
    day: committedDayNum,
  });

  // Sync pending state when committed state changes (e.g., from breadcrumb selections)
  // This ensures bidirectional sync between breadcrumbs and IconFilterBar
  React.useEffect(() => {
    setPending({
      year: committedYear,
      quarter: committedQuarter,
      month: committedMonthNum,
      week: committedWeek,
      day: committedDayNum,
    });
  }, [committedYear, committedQuarter, committedMonthNum, committedWeek, committedDayNum]);

  // Track which rows have pending changes (for animation)
  const isPendingYear = pending.year !== committedYear;
  const isPendingQuarter = pending.quarter !== committedQuarter;
  const isPendingMonth = pending.month !== committedMonthNum;
  const isPendingWeek = pending.week !== committedWeek;
  const isPendingDay = pending.day !== committedDayNum;

  // Calculate weeks available for pending month
  const getWeeksInMonth = (year: number, month: number): number => {
    const daysInMonth = new Date(year, month, 0).getDate();
    return Math.ceil(daysInMonth / 7);
  };
  const totalWeeks = getWeeksInMonth(parseInt(pending.year), parseInt(pending.month));

  // Calculate days available for pending week
  const getDaysInWeek = (year: number, month: number, week: number): number[] => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDay = (week - 1) * 7 + 1;
    const endDay = Math.min(week * 7, daysInMonth);
    const days: number[] = [];
    for (let d = startDay; d <= endDay; d++) {
      days.push(d);
    }
    return days;
  };

  const availableDays = pending.week
    ? getDaysInWeek(parseInt(pending.year), parseInt(pending.month), pending.week)
    : [];

  // Arrow handlers - only update LOCAL pending state, don't dispatch
  const handleYearChange = (delta: number) => {
    const currentIndex = years.indexOf(pending.year);
    const newIndex = Math.max(0, Math.min(years.length - 1, currentIndex - delta));
    const newYear = years[newIndex];
    if (newYear) {
      setPending(prev => ({ ...prev, year: newYear }));
    }
  };

  const handleQuarterChange = (delta: number) => {
    const qIndex = quarters.indexOf(pending.quarter);
    const newIndex = (qIndex + delta + 4) % 4;
    setPending(prev => ({ ...prev, quarter: quarters[newIndex] }));
  };

  const handleMonthChange = (delta: number) => {
    const mIndex = parseInt(pending.month) - 1;
    const newIndex = (mIndex + delta + 12) % 12;
    setPending(prev => ({ ...prev, month: String(newIndex + 1).padStart(2, '0') }));
  };

  const handleWeekChange = (delta: number) => {
    const week = pending.week || 1;
    let newWeek = week + delta;
    if (newWeek < 1) newWeek = totalWeeks;
    if (newWeek > totalWeeks) newWeek = 1;
    setPending(prev => ({ ...prev, week: newWeek }));
  };

  const handleDayChange = (delta: number) => {
    if (!pending.week || availableDays.length === 0) return;

    const currentDayIndex = pending.day ? availableDays.indexOf(pending.day) : 0;
    let newIndex = currentDayIndex + delta;

    if (newIndex < 0) newIndex = availableDays.length - 1;
    if (newIndex >= availableDays.length) newIndex = 0;

    setPending(prev => ({ ...prev, day: availableDays[newIndex] }));
  };

  // Apply handlers - dispatch to context, then close menu
  // Uses cascading utilities to ensure state is synchronized with TemporalBreadcrumb
  const applyYearFilter = () => {
    dispatch({ type: 'SET_TEMPORAL_FILTER', payload: buildYearFilter(pending.year) });
    onClose(); // Close menu after applying
  };

  const applyQuarterFilter = () => {
    dispatch({ type: 'SET_TEMPORAL_FILTER', payload: buildQuarterFilter(pending.year, pending.quarter) });
    onClose();
  };

  const applyMonthFilter = () => {
    const monthFull = `${pending.year}-${pending.month}`;
    dispatch({ type: 'SET_TEMPORAL_FILTER', payload: buildMonthFilter(pending.year, monthFull) });
    onClose();
  };

  const applyWeekFilter = () => {
    const monthFull = `${pending.year}-${pending.month}`;
    const week = pending.week || 1;
    dispatch({ type: 'SET_TEMPORAL_FILTER', payload: buildWeekFilter(pending.year, monthFull, week) });
    onClose();
  };

  const applyDayFilter = () => {
    const monthFull = `${pending.year}-${pending.month}`;
    const week = pending.week || 1;
    const day = pending.day || availableDays[0] || 1;
    const dayStr = `${pending.year}-${pending.month}-${String(day).padStart(2, '0')}`;
    dispatch({ type: 'SET_TEMPORAL_FILTER', payload: buildDayFilter(pending.year, monthFull, week, dayStr) });
    onClose();
  };

  const clearFilter = () => {
    dispatch({ type: 'CLEAR_TEMPORAL' });
    onClose();
  };

  // Display values (from pending state)
  const quarterDisplayValue = quartersDisplay[quarters.indexOf(pending.quarter)] || pending.quarter;
  const weekDisplayValue = pending.week
    ? (locale === 'es' ? `Sem ${pending.week}` : `W${pending.week}`)
    : (locale === 'es' ? 'Sem 1' : 'W1');
  const dayDisplayValue = pending.day ? String(pending.day) : (availableDays[0] ? String(availableDays[0]) : '1');

  return (
    <div
      className="absolute top-full right-0 mt-2 min-w-[240px] rounded-xl overflow-hidden"
      style={{
        zIndex: 70,
        backgroundColor: 'var(--bg-secondary)',
        boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1))',
        border: '1px solid var(--border-light)',
      }}
    >
      {/* Year Row */}
      <TimeSliderRow
        label={locale === 'es' ? 'Año' : 'Year'}
        value={pending.year}
        isActive={state.level === 'year'}
        isPending={isPendingYear}
        onLabelClick={applyYearFilter}
        onPrev={() => handleYearChange(-1)}
        onNext={() => handleYearChange(1)}
        canPrev={years.indexOf(pending.year) < years.length - 1}
        canNext={years.indexOf(pending.year) > 0}
      />

      {/* Quarter Row */}
      <TimeSliderRow
        label={locale === 'es' ? 'Trimestre' : 'Quarter'}
        value={quarterDisplayValue}
        isActive={state.level === 'quarter'}
        isPending={isPendingQuarter}
        onLabelClick={applyQuarterFilter}
        onPrev={() => handleQuarterChange(-1)}
        onNext={() => handleQuarterChange(1)}
        isOdd
      />

      {/* Month Row */}
      <TimeSliderRow
        label={locale === 'es' ? 'Mes' : 'Month'}
        value={months[parseInt(pending.month) - 1] || months[11]}
        isActive={state.level === 'month'}
        isPending={isPendingMonth}
        onLabelClick={applyMonthFilter}
        onPrev={() => handleMonthChange(-1)}
        onNext={() => handleMonthChange(1)}
      />

      {/* Week Row */}
      <TimeSliderRow
        label={locale === 'es' ? 'Semana' : 'Week'}
        value={weekDisplayValue}
        isActive={state.level === 'week'}
        isPending={isPendingWeek}
        onLabelClick={applyWeekFilter}
        onPrev={() => handleWeekChange(-1)}
        onNext={() => handleWeekChange(1)}
        isOdd
      />

      {/* Day Row */}
      <TimeSliderRow
        label={locale === 'es' ? 'Día' : 'Day'}
        value={dayDisplayValue}
        isActive={state.level === 'day'}
        isPending={isPendingDay}
        onLabelClick={applyDayFilter}
        onPrev={() => handleDayChange(-1)}
        onNext={() => handleDayChange(1)}
        canPrev={pending.week !== null}
        canNext={pending.week !== null}
      />

      {/* Clear Button */}
      {state.level !== 'all' && (
        <div className="p-2 border-t" style={{ borderColor: 'var(--border-light)' }}>
          <button
            onClick={clearFilter}
            className="w-full py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
            }}
          >
            <X size={14} />
            {locale === 'es' ? 'Limpiar filtro' : 'Clear filter'}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Time Slider Row - 3-State Visual Feedback
// ============================================================================

interface TimeSliderRowProps {
  label: string;
  value: string;
  isActive: boolean;
  isPending?: boolean; // True when value changed but not yet applied
  onLabelClick: () => void;
  onPrev: () => void;
  onNext: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  isOdd?: boolean;
}

function TimeSliderRow({
  label,
  value,
  isActive,
  isPending = false,
  onLabelClick,
  onPrev,
  onNext,
  canPrev = true,
  canNext = true,
  isOdd = false,
}: TimeSliderRowProps) {
  // Determine visual state:
  // - isActive: filter is applied at this level (solid primary background)
  // - isPending: value changed but not applied (pulsing border animation)
  // - default: no changes (neutral appearance)

  return (
    <div
      className="flex items-center justify-between px-3 py-2 gap-2"
      style={{
        backgroundColor: isOdd ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
      }}
    >
      {/* Label - clicking applies the filter */}
      <button
        onClick={onLabelClick}
        className={`
          text-xs font-medium px-2 py-1 rounded-md transition-all min-w-[70px] text-left
          ${isPending ? 'pending-pulse' : ''}
        `}
        style={{
          backgroundColor: isActive
            ? 'var(--primary-light)'
            : isPending
              ? 'var(--warning-light, rgba(245, 158, 11, 0.15))'
              : 'transparent',
          color: isActive
            ? 'var(--primary)'
            : isPending
              ? 'var(--warning, #f59e0b)'
              : 'var(--text-tertiary)',
          border: isPending ? '1px solid var(--warning, #f59e0b)' : '1px solid transparent',
        }}
        title={isPending ? (label.includes('Año') || label.includes('Year') ? 'Click to apply' : 'Clic para aplicar') : undefined}
      >
        {label}
      </button>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          disabled={!canPrev}
          className="w-6 h-6 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <ChevronLeft size={14} />
        </button>

        {/* Value display - shows pending animation when changed */}
        <span
          className={`
            min-w-[80px] text-center text-sm font-semibold px-2 py-1 rounded-md
            transition-all duration-200
            ${isPending ? 'pending-value-pulse' : ''}
          `}
          style={{
            backgroundColor: isActive
              ? 'var(--primary-light)'
              : isPending
                ? 'var(--warning-light, rgba(245, 158, 11, 0.15))'
                : 'var(--bg-tertiary)',
            color: isActive
              ? 'var(--primary)'
              : isPending
                ? 'var(--warning, #f59e0b)'
                : 'var(--text-primary)',
            boxShadow: isPending
              ? '0 0 0 2px var(--warning, #f59e0b)'
              : 'none',
          }}
        >
          {value}
        </span>

        <button
          onClick={onNext}
          disabled={!canNext}
          className="w-6 h-6 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Keyframe animations for pending state (inline style) */}
      {isPending && (
        <style>{`
          @keyframes pendingPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.02); }
          }
          .pending-pulse {
            animation: pendingPulse 1.5s ease-in-out infinite;
          }
          .pending-value-pulse {
            animation: pendingPulse 1.5s ease-in-out infinite;
          }
        `}</style>
      )}
    </div>
  );
}

// ============================================================================
// Category Filter Dropdown - Two sections with multi-select
// Story 14.15c: Now uses hierarchical grouped display
// ============================================================================

interface CategoryFilterDropdownMenuProps {
  state: {
    level: string;
    category?: string;
    group?: string;
    selectedCategories?: string[];
    selectedItems?: string[];
    /** Story 14.13 Session 15: Include drillDownPath for navigation filter sync */
    drillDownPath?: {
      storeGroup?: string;
      storeCategory?: string;
      itemGroup?: string;
      itemCategory?: string;
      subcategory?: string;
    };
  };
  /** Story 14.36 Enhancement: Location filter state for integrated "Lugar" tab */
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
  /** Story 14.14b Session 5: Callback when view mode should change */
  onViewModeChange?: (mode: ViewMode) => void;
  /** Story 14.36 Enhancement: Whether location filter is currently active */
  hasLocationFilter?: boolean;
}

function CategoryFilterDropdownMenu({
  state,
  locationState,
  dispatch,
  availableFilters, // Now used for location data as well
  t,
  onClose,
  locale = 'es',
  onViewModeChange,
  hasLocationFilter = false,
}: CategoryFilterDropdownMenuProps) {
  // Language for translations
  const lang: Language = locale === 'es' ? 'es' : 'en';

  // Story 14.36 Enhancement: Location display hook for localized names
  const { getCountryName, getCityName } = useLocationDisplay(lang);

  // Story 14.36 Enhancement: Tab state: 0 = Compras, 1 = Productos, 2 = Lugar
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);

  // ============================================================================
  // 3-State Behavior (like time filter)
  // State 1: Original - no pending changes, shows committed state
  // State 2: Pending - user selected categories but hasn't applied (yellow)
  // State 3: Applied - user clicked tab name to apply filter (primary, menu closes)
  // ============================================================================

  // Committed state from context (what's actually applied)
  // Story 14.13a: Also check drillDownPath for multi-dimension filtering
  // Story 14.13 Session 15: Extract drillDownPath fields as explicit dependencies for proper useMemo tracking
  const drillDownPath = state.drillDownPath;
  const drillStoreCategory = drillDownPath?.storeCategory;
  const drillStoreGroup = drillDownPath?.storeGroup;
  const drillItemCategory = drillDownPath?.itemCategory;
  const drillItemGroup = drillDownPath?.itemGroup;

  const committedTransactions = useMemo(() => {
    // First check drillDownPath for store category
    if (drillStoreCategory) {
      return new Set([drillStoreCategory]);
    }
    // Check drillDownPath for store group - expand to all categories in the group
    if (drillStoreGroup) {
      const expandedCategories = expandStoreCategoryGroup(drillStoreGroup as StoreCategoryGroup);
      return new Set(expandedCategories);
    }
    // Fallback to legacy category field
    if (state.level === 'category' && state.category) {
      return new Set(state.category.split(',').map(c => c.trim()));
    }
    return new Set<string>();
  }, [state.level, state.category, drillStoreCategory, drillStoreGroup]);

  const committedItems = useMemo(() => {
    // Story 14.13a: itemCategory takes priority over itemGroup (more specific)
    // When user drills from group to specific category, both may be set
    if (drillItemCategory) {
      return new Set([drillItemCategory]);
    }
    if (drillItemGroup) {
      // Expand the group to its constituent item categories
      // This ensures the UI shows all categories in the group as selected
      const expandedCategories = expandItemCategoryGroup(drillItemGroup as ItemCategoryGroup);
      return new Set(expandedCategories);
    }
    // Fallback to legacy group field
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

  // Story 14.13a: Sync pending state when committed state changes
  // This handles the case when filters change from navigation (e.g., drill-down)
  // Convert Set to sorted string for stable comparison in dependency array
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
  // Story 14.36 Enhancement: Location state management (same pattern as above)
  // ============================================================================

  // Get country for a city (reverse lookup)
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

  // Committed location state (what's actually applied)
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

  // Pending location state
  const [pendingLocations, setPendingLocations] = useState<Set<string>>(
    () => new Set(committedLocations)
  );

  // Track expanded countries for location tab
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(() => {
    return new Set(
      availableFilters.countries.filter(
        country => (availableFilters.citiesByCountry[country]?.length || 0) > 0
      )
    );
  });

  // Sync pending locations when committed state changes
  const committedLocationsKey = useMemo(
    () => Array.from(committedLocations).sort().join(','),
    [committedLocations]
  );

  React.useEffect(() => {
    setPendingLocations(new Set(committedLocations));
  }, [committedLocationsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if there are pending changes (different from committed)
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

  // Story 14.36 Enhancement: Check pending location changes
  const hasPendingLocationChanges = useMemo(() => {
    if (pendingLocations.size !== committedLocations.size) return true;
    for (const loc of pendingLocations) {
      if (!committedLocations.has(loc)) return true;
    }
    return false;
  }, [pendingLocations, committedLocations]);

  // Toggle transaction category selection (pending state only - no dispatch yet)
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

  // Toggle item category selection (pending state only - no dispatch yet)
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

  // Story 14.36 Enhancement: Toggle city selection (pending state only)
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

  // Story 14.36 Enhancement: Toggle all cities in a country
  const handleCountryToggle = (country: string) => {
    const countryCities = availableFilters.citiesByCountry[country] || [];
    setPendingLocations(prev => {
      const newSet = new Set(prev);
      const allSelected = countryCities.every(city => newSet.has(city));
      if (allSelected) {
        // Deselect all cities in this country
        countryCities.forEach(city => newSet.delete(city));
      } else {
        // Select all cities in this country
        countryCities.forEach(city => newSet.add(city));
      }
      return newSet;
    });
  };

  // Story 14.36 Enhancement: Get country selection state
  const getCountrySelectionState = (country: string): 'all' | 'some' | 'none' => {
    const countryCities = availableFilters.citiesByCountry[country] || [];
    if (countryCities.length === 0) return 'none';
    const selectedInCountry = countryCities.filter(city => pendingLocations.has(city));
    if (selectedInCountry.length === 0) return 'none';
    if (selectedInCountry.length === countryCities.length) return 'all';
    return 'some';
  };

  // Story 14.36 Enhancement: Toggle country expansion
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

  // Apply transaction filter - called when clicking "Transacciones" tab name
  // Story 14.14b Session 5: Sync view mode when applying transaction filter
  // Story 14.13b: Preserve item filters when applying transaction filter (AC #4)
  // Story 14.13b-fix: Also include PENDING item selections, not just committed ones
  const applyTransactionFilter = () => {
    // Get item filter to preserve - check PENDING items first (for manual multi-tab selection),
    // then fall back to committed state (from drill-down or previous application)
    const pendingItemCategory = pendingItems.size > 0
      ? (pendingItems.size === 1
          ? Array.from(pendingItems)[0]
          : Array.from(pendingItems).join(','))
      : null;
    const existingItemGroup = pendingItemCategory ||
      drillDownPath?.itemGroup || drillDownPath?.itemCategory ||
      (state.level === 'group' ? state.group : undefined);

    if (pendingTransactions.size === 0 && !existingItemGroup) {
      // No transaction filter AND no item filter → clear all
      dispatch({ type: 'CLEAR_CATEGORY' });
      onViewModeChange?.('store-categories');
    } else if (pendingTransactions.size === 0 && existingItemGroup) {
      // Clearing transaction filter but keeping item filter
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
      // Setting transaction filter - preserve any existing item filter
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

  // Apply item filter - called when clicking "Ítems" tab name
  // Story 14.14b Session 5: Sync view mode when applying item filter
  // Story 14.13b: Preserve transaction filters when applying item filter (AC #4)
  // Story 14.13b-fix: Also include PENDING transaction selections, not just committed ones
  const applyItemFilter = () => {
    // Get store filter to preserve - check PENDING transactions first (for manual multi-tab selection),
    // then fall back to committed state (from drill-down or previous application)
    const pendingStoreCategory = pendingTransactions.size > 0
      ? (pendingTransactions.size === 1
          ? Array.from(pendingTransactions)[0]
          : Array.from(pendingTransactions).join(','))
      : null;
    const existingStoreCategory = pendingStoreCategory ||
      drillDownPath?.storeCategory ||
      (state.level === 'category' ? state.category : undefined);

    if (pendingItems.size === 0 && !existingStoreCategory) {
      // No item filter AND no store filter → clear all
      dispatch({ type: 'CLEAR_CATEGORY' });
      onViewModeChange?.('item-categories');
    } else if (pendingItems.size === 0 && existingStoreCategory) {
      // Clearing item filter but keeping store filter
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
      // Setting item filter - preserve any existing store filter
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

  // Story 14.36 Enhancement: Apply location filter - called when clicking "Lugar" tab name
  const applyLocationFilter = () => {
    if (pendingLocations.size === 0) {
      dispatch({ type: 'CLEAR_LOCATION' });
    } else {
      // Determine primary country for display
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

  // Check if any filter is active (for showing clear button)
  const hasFilter = committedTransactions.size > 0 || committedItems.size > 0 || committedLocations.size > 0;

  // Determine visual states for tabs
  // Story 14.13a: Also check drillDownPath for active state
  // Story 14.13 Session 15: Use extracted drillDownPath variables for consistency
  const isTransactionsActive = (state.level === 'category' && committedTransactions.size > 0) ||
    Boolean(drillStoreCategory || drillStoreGroup);
  const isItemsActive = (state.level === 'group' && committedItems.size > 0) ||
    Boolean(drillItemGroup || drillItemCategory);
  // Story 14.36 Enhancement: Location tab active state
  const isLocationActive = hasLocationFilter || committedLocations.size > 0;
  const isTransactionsPending = hasPendingTransactionChanges && activeTab === 0;
  const isItemsPending = hasPendingItemChanges && activeTab === 1;
  const isLocationsPending = hasPendingLocationChanges && activeTab === 2;

  // Story 14.36 Enhancement: Sort countries for display
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
        // Fixed positioning with margins from viewport edges
        top: '7rem', // Below header
        left: '1rem',
        right: '1rem',
        maxWidth: '20rem', // Max width for larger screens
        marginLeft: 'auto', // Push to right on larger screens
      }}
    >
      {/* Header with tabs - Story 14.36: Full-width tab buttons for easy tapping */}
      {/* Icon sizes: 22px default (small font), scales with data-font-size="normal" */}
      <div
        className="flex items-stretch"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      >
        {/* Transactions Tab (Receipt icon) - full height touch target */}
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

        {/* Products Tab (Package icon) - full height touch target */}
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

        {/* Location Tab (MapPin icon) - full height touch target */}
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

        {/* Clear filter button (FunnelX) - only shows when any filter is active */}
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

      {/* Icon size styles - responsive to font size setting */}
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
          /* Story 14.15c: Hierarchical Store Categories by Group */
          <StoreGroupedCategoriesSection
            selectedCategories={pendingTransactions}
            onCategoryToggle={handleTransactionToggle}
            onGroupToggle={(_group, categories, isCurrentlySelected) => {
              // Multi-select toggle: if group is fully selected, remove all its categories
              // Otherwise, add all its categories to the current selection
              setPendingTransactions(prev => {
                const newSet = new Set(prev);
                if (isCurrentlySelected) {
                  // Deselect: remove all categories in this group
                  categories.forEach(cat => newSet.delete(cat));
                } else {
                  // Select: add all categories in this group
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
          /* Story 14.15c: Hierarchical Item Categories by Group */
          <ItemGroupedCategoriesSection
            selectedCategories={pendingItems}
            onCategoryToggle={handleItemToggle}
            onGroupToggle={(_group, categories, isCurrentlySelected) => {
              // Multi-select toggle: if group is fully selected, remove all its categories
              // Otherwise, add all its categories to the current selection
              setPendingItems(prev => {
                const newSet = new Set(prev);
                if (isCurrentlySelected) {
                  // Deselect: remove all categories in this group
                  categories.forEach(cat => newSet.delete(cat));
                } else {
                  // Select: add all categories in this group
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
          /* Story 14.36 Enhancement: Location selection with Country→City hierarchy */
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
                      {/* Expand/Collapse chevron (only if has cities) */}
                      {hasCities ? (
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                          style={{ color: 'var(--text-tertiary)' }}
                        />
                      ) : (
                        <span className="w-4" />
                      )}

                      {/* Country flag and name */}
                      <span
                        className="flex-1 text-sm font-medium flex items-center gap-1.5"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <CountryFlag country={country} size="small" />
                        {getCountryName(country)}
                      </span>

                      {/* City count badge */}
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

                      {/* Country checkbox - full/partial/empty */}
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
                                {/* City checkbox */}
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

                                {/* City name */}
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

      {/* Pending animation styles - shine sweep effect */}
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

// ============================================================================
// Story 14.15c: Hierarchical Store Categories by Group
// Matches category-colors.html mockup design with colored group headers
// ============================================================================

interface StoreGroupedCategoriesSectionProps {
  selectedCategories: Set<string>;
  onCategoryToggle: (category: string) => void;
  /** Called when user clicks group checkbox - toggles all categories in group */
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
  // Track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(ALL_STORE_CATEGORY_GROUPS) // All expanded by default
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

  // Helper to convert to sentence case (first letter uppercase, rest lowercase)
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

        // Check how many categories in this group are selected
        const selectedInGroup = groupCategories.filter(cat => selectedCategories.has(cat));
        const allSelected = selectedInGroup.length === groupCategories.length;
        const someSelected = selectedInGroup.length > 0 && !allSelected;

        return (
          <div
            key={group}
            className="rounded-lg overflow-hidden"
            style={{ backgroundColor: groupColors.bg }}
          >
            {/* Group Header - Single line, sentence case title */}
            <div
              className="flex items-center gap-3 p-3 cursor-pointer"
              style={{ borderLeft: `4px solid ${groupColors.border || groupColors.fg}` }}
              onClick={() => toggleGroupExpansion(group)}
            >
              {/* Group Icon */}
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
              >
                {getStoreCategoryGroupEmoji(group)}
              </span>

              {/* Group Name - Single line, sentence case */}
              <span
                className="text-sm font-semibold flex-1"
                style={{ color: groupColors.fg }}
              >
                {toSentenceCase(translateStoreCategoryGroup(group, lang))}
              </span>

              {/* Circular checkbox on right - toggles group selection */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Toggle: if all selected, deselect all; otherwise select all
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

            {/* Category Items - Inside group background */}
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
// Story 14.15c: Hierarchical Item Categories by Group
// Same pattern as Store Categories
// ============================================================================

interface ItemGroupedCategoriesSectionProps {
  selectedCategories: Set<string>;
  onCategoryToggle: (category: string) => void;
  /** Called when user clicks group checkbox - toggles all categories in group */
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
  // Track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(ALL_ITEM_CATEGORY_GROUPS) // All expanded by default
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

  // Helper to convert to sentence case (first letter uppercase, rest lowercase)
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

        // Check how many categories in this group are selected
        const selectedInGroup = groupCategories.filter(cat => selectedCategories.has(cat));
        const allSelected = selectedInGroup.length === groupCategories.length;
        const someSelected = selectedInGroup.length > 0 && !allSelected;

        return (
          <div
            key={group}
            className="rounded-lg overflow-hidden"
            style={{ backgroundColor: groupColors.bg }}
          >
            {/* Group Header - Single line, sentence case title */}
            <div
              className="flex items-center gap-3 p-3 cursor-pointer"
              style={{ borderLeft: `4px solid ${groupColors.border || groupColors.fg}` }}
              onClick={() => toggleGroupExpansion(group)}
            >
              {/* Group Icon */}
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
              >
                {getItemCategoryGroupEmoji(group)}
              </span>

              {/* Group Name - Single line, sentence case */}
              <span
                className="text-sm font-semibold flex-1"
                style={{ color: groupColors.fg }}
              >
                {toSentenceCase(translateItemCategoryGroup(group, lang))}
              </span>

              {/* Circular checkbox on right - toggles group selection */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Toggle: if all selected, deselect all; otherwise select all
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

            {/* Category Items - Inside group background */}
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
// Group Filter Dropdown (Story 14.15b)
// Multi-select dropdown for filtering by custom transaction groups
// ============================================================================

interface GroupFilterDropdownProps {
  currentGroupIds?: string;
  groups: GroupWithMeta[];
  loading: boolean;
  dispatch: (action: any) => void;
  t: (key: string) => string;
  onClose: () => void;
  lang?: string;
}

function GroupFilterDropdown({
  currentGroupIds,
  groups,
  loading,
  dispatch,
  t,
  lang = 'es',
}: GroupFilterDropdownProps): React.ReactElement {
  // Parse current selections into a Set for multi-select
  const selectedIds = useMemo(() => {
    if (!currentGroupIds) return new Set<string>();
    return new Set(currentGroupIds.split(',').map(id => id.trim()).filter(Boolean));
  }, [currentGroupIds]);

  const handleToggleGroup = (groupId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
    } else {
      newSelected.add(groupId);
    }

    if (newSelected.size === 0) {
      dispatch({ type: 'CLEAR_GROUP' });
    } else {
      dispatch({ type: 'SET_GROUP_FILTER', payload: { groupIds: Array.from(newSelected).join(',') } });
    }
  };

  const handleClearAll = () => {
    dispatch({ type: 'CLEAR_GROUP' });
  };

  return (
    <div
      className="absolute top-full mt-2 right-0 z-50 min-w-[200px] max-w-[280px] rounded-xl shadow-lg border overflow-hidden"
      style={{
        backgroundColor: 'var(--bg)',
        borderColor: 'var(--border-light)',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header - using theme background */}
      <div
        className="px-4 py-2.5 border-b"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-light)',
        }}
      >
        <div
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: 'var(--text-secondary)' }}
        >
          {lang === 'es' ? 'Mis Grupos' : 'My Groups'}
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[280px] overflow-y-auto">
        {loading ? (
          <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {t('loading')}...
          </div>
        ) : groups.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {lang === 'es' ? 'Sin grupos creados' : 'No groups created'}
          </div>
        ) : (
          <div className="py-1">
            {/* Clear all option when something is selected */}
            {selectedIds.size > 0 && (
              <button
                onClick={handleClearAll}
                className="w-full px-4 py-2 flex items-center gap-3 text-left transition-colors hover:bg-[var(--bg-tertiary)]"
              >
                <span
                  className="w-5 h-5 rounded border-2 flex items-center justify-center"
                  style={{ borderColor: 'var(--border-medium)' }}
                />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {lang === 'es' ? 'Mostrar todas' : 'Show all'}
                </span>
              </button>
            )}

            {/* Group options - multi-select checkboxes */}
            {groups.map(group => {
              const isSelected = selectedIds.has(group.id);
              // Extract emoji from name (e.g., "🏠 Family" → "🏠")
              const emoji = group.icon || (() => {
                const firstChar = group.name?.codePointAt(0);
                if (firstChar && firstChar > 0x1F300) {
                  const match = group.name.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
                  return match ? match[0] : null;
                }
                return null;
              })();
              // Extract label from name (e.g., "🏠 Family" → "Family")
              const label = emoji && typeof emoji === 'string' && group.name.startsWith(emoji)
                ? group.name.slice(emoji.length).trim()
                : group.name;

              return (
                <div
                  key={group.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleToggleGroup(group.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggleGroup(group.id);
                    }
                  }}
                  className="w-full px-4 py-2 flex items-center gap-3 text-left transition-colors hover:bg-[var(--bg-tertiary)] cursor-pointer"
                >
                  {/* Checkbox */}
                  <span
                    className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                    style={{
                      borderColor: isSelected ? 'var(--primary)' : 'var(--border-medium)',
                      backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                    }}
                  >
                    {isSelected && (
                      <Check size={12} strokeWidth={3} style={{ color: 'white' }} />
                    )}
                  </span>
                  {/* Group color circle with emoji icon inside */}
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: group.color }}
                  >
                    <span
                      style={{
                        fontSize: '1rem',
                        lineHeight: 1,
                        fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
                      }}
                    >
                      {emoji || '📁'}
                    </span>
                  </span>
                  {/* Group label (without duplicate emoji) */}
                  <span
                    className="text-sm flex-1"
                    style={{ color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}
                  >
                    <span className={isSelected ? 'font-medium' : ''}>{label}</span>
                  </span>
                  {/* Member count for shared groups */}
                  {group.isShared && group.memberCount !== undefined && group.memberCount > 1 && (
                    <span
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      <Users size={10} strokeWidth={2} style={{ color: 'var(--text-tertiary)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                        {group.memberCount}
                      </span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default IconFilterBar;
