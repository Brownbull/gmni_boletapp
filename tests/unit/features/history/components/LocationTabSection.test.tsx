/**
 * LocationTabSection Unit Tests
 *
 * Story TD-15b-25: Test coverage for extracted LocationTabSection component
 * Tests: empty state, country expansion, city toggle, country toggle, selection state display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../../setup/test-utils';
import { LocationTabSection } from '../../../../../src/features/history/components/LocationTabSection';
import type { LocationTabSectionProps } from '../../../../../src/features/history/components/LocationTabSection';
import type { AvailableFilters } from '../../../../../src/shared/utils/historyFilterUtils';

// =============================================================================
// Mocks
// =============================================================================

vi.mock('../../../../../src/features/history/components/CountryFlag', () => ({
  CountryFlag: ({ country }: { country: string }) => (
    <span data-testid={`flag-${country}`}>{country}</span>
  ),
}));

// =============================================================================
// Helpers
// =============================================================================

function makeAvailableFilters(overrides: Partial<AvailableFilters> = {}): AvailableFilters {
  return {
    categories: [],
    itemGroups: [],
    countries: ['CL', 'AR'],
    citiesByCountry: {
      CL: ['santiago', 'valparaiso'],
      AR: ['buenos-aires'],
    },
    ...overrides,
  } as AvailableFilters;
}

function makeProps(overrides: Partial<LocationTabSectionProps> = {}): LocationTabSectionProps {
  return {
    sortedCountries: ['AR', 'CL'],
    availableFilters: makeAvailableFilters(),
    expandedCountries: new Set(['CL', 'AR']),
    pendingLocations: new Set<string>(),
    getCountryName: (code: string) => ({ CL: 'Chile', AR: 'Argentina' }[code] ?? code),
    getCityName: (code: string) => ({
      santiago: 'Santiago',
      valparaiso: 'Valparaíso',
      'buenos-aires': 'Buenos Aires',
    }[code] ?? code),
    getCountrySelectionState: () => 'none',
    toggleCountryExpansion: vi.fn(),
    handleCountryToggle: vi.fn(),
    handleCityToggle: vi.fn(),
    t: (key: string) => key,
    lang: 'es',
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('LocationTabSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no countries available', () => {
    render(
      <LocationTabSection
        {...makeProps({ sortedCountries: [] })}
      />,
    );

    expect(screen.getByText('noLocationData')).toBeInTheDocument();
  });

  it('renders country list with correct labels', () => {
    render(<LocationTabSection {...makeProps()} />);

    expect(screen.getByText('Chile')).toBeInTheDocument();
    expect(screen.getByText('Argentina')).toBeInTheDocument();
  });

  it('renders cities for expanded countries', () => {
    render(<LocationTabSection {...makeProps()} />);

    expect(screen.getByText('Santiago')).toBeInTheDocument();
    expect(screen.getByText('Valparaíso')).toBeInTheDocument();
    expect(screen.getByText('Buenos Aires')).toBeInTheDocument();
  });

  it('hides cities for collapsed countries', () => {
    render(
      <LocationTabSection
        {...makeProps({ expandedCountries: new Set(['CL']) })}
      />,
    );

    // CL expanded — cities visible
    expect(screen.getByText('Santiago')).toBeInTheDocument();
    // AR collapsed — city hidden
    expect(screen.queryByText('Buenos Aires')).not.toBeInTheDocument();
  });

  it('calls toggleCountryExpansion when country row is clicked', () => {
    const toggleCountryExpansion = vi.fn();
    render(<LocationTabSection {...makeProps({ toggleCountryExpansion })} />);

    fireEvent.click(screen.getByText('Chile'));
    expect(toggleCountryExpansion).toHaveBeenCalledWith('CL');
  });

  it('calls handleCityToggle when a city is clicked', () => {
    const handleCityToggle = vi.fn();
    render(<LocationTabSection {...makeProps({ handleCityToggle })} />);

    fireEvent.click(screen.getByText('Santiago'));
    expect(handleCityToggle).toHaveBeenCalledWith('santiago');
  });

  it('calls handleCountryToggle when the country checkbox is clicked', () => {
    const handleCountryToggle = vi.fn();
    render(<LocationTabSection {...makeProps({ handleCountryToggle })} />);

    const chileToggle = screen.getByLabelText('Seleccionar todas las ciudades de Chile');
    fireEvent.click(chileToggle);
    expect(handleCountryToggle).toHaveBeenCalledWith('CL');
  });

  it('shows selected state for cities in pendingLocations', () => {
    const { container } = render(
      <LocationTabSection
        {...makeProps({ pendingLocations: new Set(['santiago']) })}
      />,
    );

    // The Santiago city button's checkbox span should render a check icon
    const cityButtons = container.querySelectorAll('button');
    const santiagoBtn = Array.from(cityButtons).find(
      btn => btn.textContent?.includes('Santiago'),
    );
    expect(santiagoBtn).toBeDefined();
    // Selected city should have a check SVG in the checkbox span
    const checkboxSpan = santiagoBtn?.querySelector('span:first-child');
    expect(checkboxSpan?.querySelector('svg')).not.toBeNull();
    // Selected city text should have fontWeight 500
    const cityText = santiagoBtn?.querySelector('span:last-child');
    expect(cityText?.style.fontWeight).toBe('500');
  });

  it('displays country selection state: all selected shows check icon', () => {
    render(
      <LocationTabSection
        {...makeProps({
          getCountrySelectionState: (country: string) =>
            country === 'CL' ? 'all' : 'none',
        })}
      />,
    );

    // Chile toggle should show check icon (all selected)
    const chileToggle = screen.getByLabelText('Seleccionar todas las ciudades de Chile');
    expect(chileToggle.querySelector('svg')).not.toBeNull();

    // Argentina toggle should NOT show check icon (none selected)
    const arToggle = screen.getByLabelText('Seleccionar todas las ciudades de Argentina');
    expect(arToggle.querySelector('svg')).toBeNull();
  });

  it('displays country selection state: some selected shows check icon', () => {
    render(
      <LocationTabSection
        {...makeProps({
          getCountrySelectionState: (country: string) =>
            country === 'CL' ? 'some' : 'none',
        })}
      />,
    );

    // Chile toggle should show check icon (some selected)
    const chileToggle = screen.getByLabelText('Seleccionar todas las ciudades de Chile');
    expect(chileToggle.querySelector('svg')).not.toBeNull();

    // Argentina toggle should NOT show check icon (none selected)
    const arToggle = screen.getByLabelText('Seleccionar todas las ciudades de Argentina');
    expect(arToggle.querySelector('svg')).toBeNull();
  });

  it('renders city count badge for countries with cities', () => {
    render(<LocationTabSection {...makeProps()} />);

    // Chile has 2 cities, Argentina has 1
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('handles country with zero cities (no badge, no expansion chevron)', () => {
    const filters = makeAvailableFilters({
      countries: ['CL', 'AR', 'PE'],
      citiesByCountry: { CL: ['santiago', 'valparaiso'], AR: ['buenos-aires'], PE: [] },
    });
    render(
      <LocationTabSection
        {...makeProps({
          sortedCountries: ['AR', 'CL', 'PE'],
          availableFilters: filters,
          expandedCountries: new Set(['CL', 'AR', 'PE']),
        })}
      />,
    );

    // PE renders but has no city count badge (cities.length === 0 → no badge)
    expect(screen.getByTestId('flag-PE')).toBeInTheDocument();
    // No "0" badge — only "2" (CL) and "1" (AR)
    expect(screen.queryAllByText('0')).toHaveLength(0);
  });

  it('renders country flags', () => {
    render(<LocationTabSection {...makeProps()} />);

    expect(screen.getByTestId('flag-CL')).toBeInTheDocument();
    expect(screen.getByTestId('flag-AR')).toBeInTheDocument();
  });
});
