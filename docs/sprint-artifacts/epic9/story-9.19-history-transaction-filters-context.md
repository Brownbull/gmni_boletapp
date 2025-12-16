<story-context id="epic9/story-9.19" v="1.0">
  <metadata>
    <epicId>9</epicId>
    <storyId>9.19</storyId>
    <title>History Transaction Filters</title>
    <status>drafted</status>
    <generatedAt>2025-12-16</generatedAt>
    <generator>Manual Creation</generator>
    <sourceStoryPath>docs/sprint-artifacts/epic9/story-9.19-history-transaction-filters.md</sourceStoryPath>
  </metadata>

  <story>
    <asA>user reviewing my transaction history</asA>
    <iWant>to filter transactions by time period, category, and location</iWant>
    <soThat>I can quickly find specific transactions without scrolling through pages</soThat>
    <tasks>
      - Create HistoryFiltersContext for filter state management
      - Create useHistoryFilters hook with memoized selectors
      - Create filterTransactionsByHistoryFilters utility function
      - Create TemporalFilterDropdown component (Year/Month/Week/Day)
      - Create CategoryFilterDropdown component (Category/Group/Subcategory)
      - Create LocationFilterDropdown component (Country/City)
      - Create HistoryFilterBar container component
      - Update HistoryView to include filter bar and apply filters
      - Add filter-related translation keys (EN/ES)
      - Test filter combinations and performance
    </tasks>
  </story>

  <acceptanceCriteria>
    <ac id="1" title="Filter Header UI">
      - Filter bar appears below the History title
      - Filter bar has compact collapsed state (icon-only buttons)
      - Filter bar shows active filter count badge when filters applied
      - "Clear all filters" button appears when any filter is active
      - Filter bar follows existing theme CSS variables
    </ac>
    <ac id="2" title="Temporal Filtering">
      - Temporal filter dropdown with hierarchical options: Year → Month → Week → Day
      - Default shows "All time" (no temporal filter)
      - Selecting a year shows months within that year
      - Selecting a month shows weeks (W1-W5) within that month
      - Selecting a week shows days within that week
      - Selected temporal range displayed as breadcrumb trail
      - Click any breadcrumb segment to go back to that level
    </ac>
    <ac id="3" title="Category Filtering">
      - Category filter dropdown with hierarchical options
      - Default shows "All categories"
      - Selecting store category filters to those transactions
      - Selecting item group filters to items in that group
      - Selecting subcategory filters to items in that subcategory
      - Categories translated per user language (Story 9.12 pattern)
    </ac>
    <ac id="4" title="Location Filtering">
      - Location filter dropdown with Country → City hierarchy
      - Default shows "All locations"
      - Country dropdown shows unique countries from data
      - City dropdown shows cities within selected country
      - Gracefully handles transactions without location data
    </ac>
    <ac id="5" title="Filter Persistence & Behavior">
      - Filters apply independently (changing one doesn't reset others)
      - Filtered results update transaction list immediately
      - Pagination resets to page 1 when filters change
      - Total count shows filtered results
      - Empty state shows helpful message when no matches
    </ac>
    <ac id="6" title="Mobile Responsiveness">
      - Filter bar works on mobile (collapsible/expandable)
      - Touch-friendly targets (minimum 44px)
      - Dropdowns don't overflow screen on mobile
      - Keyboard navigation supported
    </ac>
    <ac id="7" title="Performance">
      - Filters applied client-side (no additional API calls)
      - Filter computation memoized to avoid re-renders
      - Large transaction lists (1000+) filter without lag
    </ac>
  </acceptanceCriteria>

  <artifacts>
    <docs>
      <doc path="src/contexts/AnalyticsContext.tsx">Reference for context/reducer pattern</doc>
      <doc path="src/hooks/useAnalyticsNavigation.ts">Reference for memoized selectors</doc>
      <doc path="src/views/TrendsView.tsx">Reference for filterTransactionsByNavState()</doc>
    </docs>
    <code>
      <file path="src/views/HistoryView.tsx" purpose="Add filter bar, apply filters to list">
        Main view to modify - add HistoryFilterBar, wrap with provider, filter before pagination
      </file>
      <file path="src/components/analytics/TemporalBreadcrumb.tsx" purpose="Reference UI pattern">
        Collapsible dropdown with hierarchical navigation - copy pattern
      </file>
      <file path="src/components/analytics/CategoryBreadcrumb.tsx" purpose="Reference UI pattern">
        Category hierarchy dropdown - copy pattern
      </file>
      <file path="src/utils/translations.ts" purpose="Add filter translation keys">
        Add: allTime, allCategories, allLocations, clearFilters, showingResults, noMatchingTransactions
      </file>
    </code>
    <newFiles>
      <file path="src/contexts/HistoryFiltersContext.tsx">Filter state management context</file>
      <file path="src/hooks/useHistoryFilters.ts">Consumer hook with selectors</file>
      <file path="src/components/history/HistoryFilterBar.tsx">Filter bar container</file>
      <file path="src/components/history/TemporalFilterDropdown.tsx">Time period selector</file>
      <file path="src/components/history/CategoryFilterDropdown.tsx">Category hierarchy selector</file>
      <file path="src/components/history/LocationFilterDropdown.tsx">Country/city selector</file>
      <file path="src/utils/historyFilterUtils.ts">Filtering logic utilities</file>
    </newFiles>
  </artifacts>

  <constraints>
    <constraint type="performance">Client-side filtering only - no API calls</constraint>
    <constraint type="ux">Filters independent - changing one doesn't reset others</constraint>
    <constraint type="compatibility">Must work with transactions missing location data</constraint>
    <constraint type="accessibility">44px touch targets, keyboard navigation</constraint>
    <constraint type="theme">Use CSS variables (--surface, --accent, --primary, --secondary)</constraint>
  </constraints>

  <interfaces>
    <interface name="HistoryFilterState">
      <structure>
        {
          temporal: {
            level: 'all' | 'year' | 'month' | 'week' | 'day';
            year?: string;      // "2024"
            month?: string;     // "2024-12"
            week?: number;      // 1-5
            day?: string;       // "2024-12-15"
          };
          category: {
            level: 'all' | 'category' | 'group' | 'subcategory';
            category?: string;  // "Supermarket"
            group?: string;     // "Produce"
            subcategory?: string; // "Fruits"
          };
          location: {
            country?: string;   // "Chile"
            city?: string;      // "Santiago"
          };
        }
      </structure>
    </interface>
    <interface name="FilterActions">
      <actions>
        SET_TEMPORAL_FILTER - Set temporal level and values
        SET_CATEGORY_FILTER - Set category level and values
        SET_LOCATION_FILTER - Set country and/or city
        CLEAR_ALL_FILTERS - Reset all filters to defaults
        CLEAR_TEMPORAL - Reset temporal filter only
        CLEAR_CATEGORY - Reset category filter only
        CLEAR_LOCATION - Reset location filter only
      </actions>
    </interface>
  </interfaces>

  <tests>
    <standards>
      - Unit tests for filterTransactionsByHistoryFilters()
      - Unit tests for filter state reducer
      - Component tests for each dropdown
      - Integration test for full filter flow
    </standards>
    <locations>
      - tests/unit/utils/historyFilterUtils.test.ts
      - tests/unit/contexts/HistoryFiltersContext.test.ts
      - tests/integration/history-filters.test.tsx
    </locations>
    <ideas>
      - Test: Temporal filter at each level (year, month, week, day)
      - Test: Category filter at each level with item matching
      - Test: Location filter with missing country/city data
      - Test: Combined filters (temporal + category + location)
      - Test: Clear individual filters vs clear all
      - Test: Performance with 1000+ transactions
    </ideas>
  </tests>

  <existingPatterns>
    <pattern name="Context/Reducer Pattern" source="AnalyticsContext.tsx">
      Use useReducer for complex state with multiple actions.
      Export Provider component and useContext hook separately.
    </pattern>
    <pattern name="Memoized Selectors" source="useAnalyticsNavigation.ts">
      Create useMemo selectors for derived state (hasActiveFilters, activeFilterCount).
      Prevents unnecessary re-renders.
    </pattern>
    <pattern name="Collapsible Dropdown" source="TemporalBreadcrumb.tsx">
      Icon-only button that expands to full dropdown.
      Click outside or Escape to close.
      Keyboard navigation with arrow keys.
    </pattern>
    <pattern name="Transaction Filtering" source="TrendsView.tsx:91-146">
      filterTransactionsByNavState() shows temporal + category filtering logic.
      Week calculation: days 1-7 = W1, 8-14 = W2, etc.
    </pattern>
    <pattern name="Theme Styling" source="HistoryView.tsx">
      Use CSS variables: --surface, --primary, --secondary, --accent
      Dark mode check: const isDark = theme === 'dark'
    </pattern>
  </existingPatterns>

  <translationKeys>
    <key name="allTime">All time / Todo el tiempo</key>
    <key name="allCategories">All categories / Todas las categorías</key>
    <key name="allLocations">All locations / Todas las ubicaciones</key>
    <key name="clearFilters">Clear filters / Limpiar filtros</key>
    <key name="showingResults">Showing {count} of {total} / Mostrando {count} de {total}</key>
    <key name="noMatchingTransactions">No transactions match your filters / No hay transacciones que coincidan</key>
    <key name="filterByTime">Filter by time / Filtrar por tiempo</key>
    <key name="filterByCategory">Filter by category / Filtrar por categoría</key>
    <key name="filterByLocation">Filter by location / Filtrar por ubicación</key>
    <key name="activeFilters">{count} active / {count} activos</key>
  </translationKeys>
</story-context>
