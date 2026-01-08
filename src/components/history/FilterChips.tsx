/**
 * FilterChips Component
 *
 * Story 14.14: Transaction List Redesign (AC #3)
 * Epic 14: Core Implementation
 *
 * Displays active filters as chips below the header.
 * Each chip is tappable to remove the filter.
 * Includes "Clear All" option when multiple filters active.
 *
 * @see docs/uxui/mockups/01_views/transaction-list.html
 */

import React from 'react';
import { X, Calendar, Tag, MapPin } from 'lucide-react';
import { useHistoryFilters, getTemporalFilterLabel, getCategoryFilterLabel, getLocationFilterLabel } from '../../hooks/useHistoryFilters';
import type { Language } from '../../utils/translations';

// ============================================================================
// Types
// ============================================================================

export interface FilterChipsProps {
  /** Theme (light/dark) */
  theme?: string;
  /** Locale for formatting (en/es) */
  locale?: Language;
  /** Translation function */
  t: (key: string) => string;
}

// ============================================================================
// Component
// ============================================================================

export const FilterChips: React.FC<FilterChipsProps> = ({
  locale = 'en',
  t,
}) => {
  const {
    dispatch,
    temporal,
    category,
    location,
    hasTemporalFilter,
    hasCategoryFilter,
    hasLocationFilter,
    hasActiveFilters,
    activeFilterCount,
  } = useHistoryFilters();

  if (!hasActiveFilters) {
    return null;
  }

  const clearTemporal = () => {
    dispatch({ type: 'CLEAR_TEMPORAL' });
  };

  const clearCategory = () => {
    dispatch({ type: 'CLEAR_CATEGORY' });
  };

  const clearLocation = () => {
    dispatch({ type: 'CLEAR_LOCATION' });
  };

  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL_FILTERS' });
  };

  // Chip styles
  const chipBase = `
    inline-flex items-center gap-1.5 px-3 py-1.5
    rounded-full text-xs font-medium
    border transition-all duration-150
    cursor-pointer hover:opacity-80
    whitespace-nowrap flex-shrink-0
  `;

  // Style for truncating long labels
  const labelStyle: React.CSSProperties = {
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const activeChipStyle: React.CSSProperties = {
    backgroundColor: 'var(--primary-light)',
    borderColor: 'var(--primary)',
    color: 'var(--primary)',
  };

  const clearButtonStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-tertiary)',
    borderColor: 'transparent',
    color: 'var(--text-secondary)',
  };

  return (
    <div
      className="flex items-center gap-2 py-2 overflow-x-auto flex-nowrap scrollbar-hide"
      role="group"
      aria-label={t('activeFilters')}
    >
      {/* Temporal Filter Chip */}
      {hasTemporalFilter && (
        <button
          onClick={clearTemporal}
          className={chipBase}
          style={activeChipStyle}
          aria-label={`${t('remove')} ${getTemporalFilterLabel(temporal, locale)}`}
        >
          <Calendar size={14} />
          <span style={labelStyle}>{getTemporalFilterLabel(temporal, locale)}</span>
          <X size={12} className="ml-0.5" />
        </button>
      )}

      {/* Category Filter Chip - Story 14.15c: Pass locale for group detection */}
      {hasCategoryFilter && (
        <button
          onClick={clearCategory}
          className={chipBase}
          style={activeChipStyle}
          aria-label={`${t('remove')} ${getCategoryFilterLabel(category, t, locale)}`}
        >
          <Tag size={14} />
          <span style={labelStyle}>{getCategoryFilterLabel(category, t, locale)}</span>
          <X size={12} className="ml-0.5" />
        </button>
      )}

      {/* Location Filter Chip */}
      {hasLocationFilter && (
        <button
          onClick={clearLocation}
          className={chipBase}
          style={activeChipStyle}
          aria-label={`${t('remove')} ${getLocationFilterLabel(location, t)}`}
        >
          <MapPin size={14} />
          <span style={labelStyle}>{getLocationFilterLabel(location, t)}</span>
          <X size={12} className="ml-0.5" />
        </button>
      )}

      {/* Clear All Button - X icon in circle */}
      {activeFilterCount > 1 && (
        <button
          onClick={clearAll}
          className="flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-150 cursor-pointer hover:opacity-80 flex-shrink-0"
          style={clearButtonStyle}
          aria-label={t('clearAllFilters')}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default FilterChips;
