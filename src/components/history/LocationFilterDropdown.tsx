/**
 * LocationFilterDropdown Component
 *
 * Two-level dropdown for filtering transactions by location.
 * Levels: All Locations → Country → City
 *
 * Story 9.19: History Transaction Filters (AC #4)
 * @see docs/sprint-artifacts/epic9/story-9.19-history-transaction-filters.md
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, ChevronLeft } from 'lucide-react';
import { useHistoryFilters } from '../../hooks/useHistoryFilters';
import type { LocationFilterState } from '../../contexts/HistoryFiltersContext';
import type { AvailableFilters } from '../../utils/historyFilterUtils';

// ============================================================================
// Types
// ============================================================================

type NavigationLevel = 'root' | 'country';

interface LocationFilterDropdownProps {
  /** Available filters extracted from transactions */
  availableFilters: AvailableFilters;
  /** Theme for styling (light/dark) */
  theme?: string;
  /** Translation function */
  t: (key: string) => string;
}

// ============================================================================
// Component
// ============================================================================

export function LocationFilterDropdown({
  availableFilters,
  theme = 'light',
  t,
}: LocationFilterDropdownProps): React.ReactElement {
  const { location, dispatch } = useHistoryFilters();
  const [isOpen, setIsOpen] = useState(false);
  const [navLevel, setNavLevel] = useState<NavigationLevel>('root');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isDark = theme === 'dark';

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        resetNavigation();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        resetNavigation();
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const resetNavigation = useCallback(() => {
    setNavLevel('root');
    setSelectedCountry(null);
  }, []);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => {
      if (prev) {
        resetNavigation();
      }
      return !prev;
    });
  }, [resetNavigation]);

  // Apply filter and close
  const applyFilter = useCallback((filter: LocationFilterState) => {
    dispatch({ type: 'SET_LOCATION_FILTER', payload: filter });
    setIsOpen(false);
    resetNavigation();
    buttonRef.current?.focus();
  }, [dispatch, resetNavigation]);

  // Handle "All Locations" selection
  const handleAllLocations = useCallback(() => {
    applyFilter({});
  }, [applyFilter]);

  // Handle country selection (drill down)
  const handleCountrySelect = useCallback((country: string) => {
    setSelectedCountry(country);
    setNavLevel('country');
  }, []);

  // Apply country filter (select just country)
  const handleApplyCountry = useCallback(() => {
    if (!selectedCountry) return;
    applyFilter({ country: selectedCountry });
  }, [selectedCountry, applyFilter]);

  // Apply city filter
  const handleCitySelect = useCallback((city: string) => {
    if (!selectedCountry) return;
    applyFilter({ country: selectedCountry, city });
  }, [selectedCountry, applyFilter]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    setNavLevel('root');
    setSelectedCountry(null);
  }, []);

  // Get current filter label for button
  const getButtonLabel = (): string => {
    if (!location.country) return t('allLocations');
    if (location.city) return location.city;
    return location.country;
  };

  // ============================================================================
  // Styling
  // ============================================================================

  const buttonClasses = [
    'flex items-center gap-2 px-3 py-2 rounded-lg',
    'min-h-11', // 44px touch target (AC #6)
    'transition-all duration-200',
    isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-100',
    isDark ? 'border-slate-700' : 'border-slate-200',
    'border',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    isDark ? 'focus:ring-offset-slate-900' : 'focus:ring-offset-white',
  ].join(' ');

  const dropdownClasses = [
    'absolute left-0 top-full mt-2 z-50',
    'min-w-[200px] max-w-[280px] max-h-[300px] overflow-y-auto p-2 rounded-xl',
    'shadow-lg',
    isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200',
  ].join(' ');

  const optionClasses = (isActive: boolean = false) => [
    'w-full text-left px-4 py-2.5 rounded-lg',
    'min-h-11', // 44px touch target (AC #6)
    'transition-all duration-150',
    'flex items-center justify-between',
    isActive
      ? 'text-white font-semibold'
      : isDark
        ? 'text-slate-300 hover:bg-slate-700'
        : 'text-slate-600 hover:bg-slate-100',
    'focus:outline-none',
  ].join(' ');

  const optionStyle = (isActive: boolean = false): React.CSSProperties => {
    if (isActive) {
      return { backgroundColor: 'var(--accent)' };
    }
    return {};
  };

  const backButtonClasses = [
    'flex items-center gap-1 px-2 py-1.5 rounded-lg mb-2',
    'text-sm',
    isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100',
  ].join(' ');

  // ============================================================================
  // Render
  // ============================================================================

  // AC #4: Show helpful message if no location data exists
  const hasLocationData = availableFilters.countries.length > 0;

  const renderContent = () => {
    if (!hasLocationData) {
      return (
        <div className="px-4 py-3 text-sm" style={{ color: 'var(--secondary)' }}>
          {t('noLocationData')}
        </div>
      );
    }

    switch (navLevel) {
      case 'root':
        return (
          <>
            {/* All Locations option */}
            <button
              onClick={handleAllLocations}
              className={optionClasses(!location.country)}
              style={optionStyle(!location.country)}
            >
              {t('allLocations')}
            </button>
            {/* Countries */}
            {availableFilters.countries.map(country => (
              <button
                key={country}
                onClick={() => handleCountrySelect(country)}
                className={optionClasses(
                  location.country === country && !location.city
                )}
                style={optionStyle(
                  location.country === country && !location.city
                )}
              >
                <span>{country}</span>
                {availableFilters.citiesByCountry[country]?.length > 0 && (
                  <span className="text-xs opacity-60">{'>'}</span>
                )}
              </button>
            ))}
          </>
        );

      case 'country':
        if (!selectedCountry) return null;
        const cities = availableFilters.citiesByCountry[selectedCountry] || [];
        return (
          <>
            <button onClick={handleBack} className={backButtonClasses}>
              <ChevronLeft size={16} />
              {t('back')}
            </button>
            {/* Select this country option */}
            <button
              onClick={handleApplyCountry}
              className={optionClasses()}
              style={{ color: 'var(--accent)' }}
            >
              {t('selectCountry')}: {selectedCountry}
            </button>
            {cities.length > 0 && (
              <>
                <div className="border-t my-1" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }} />
                {/* Cities */}
                {cities.map(city => (
                  <button
                    key={city}
                    onClick={() => handleCitySelect(city)}
                    className={optionClasses(
                      location.country === selectedCountry && location.city === city
                    )}
                    style={optionStyle(
                      location.country === selectedCountry && location.city === city
                    )}
                  >
                    {city}
                  </button>
                ))}
              </>
            )}
          </>
        );
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`${t('filterByLocation')}: ${getButtonLabel()}`}
        className={buttonClasses}
        style={{ color: 'var(--primary)' }}
      >
        <MapPin size={18} style={{ color: 'var(--accent)' }} aria-hidden="true" />
        <span className="text-sm truncate max-w-[100px]">{getButtonLabel()}</span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={t('filterByLocation')}
          className={dropdownClasses}
        >
          {renderContent()}
        </div>
      )}
    </div>
  );
}

export default LocationFilterDropdown;
