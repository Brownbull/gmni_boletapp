# Story 14.36: Location Filter Hierarchy in History Menu

**Status:** done
**Points:** 5
**Epic:** 14 - Core Implementation
**Dependencies:** Story 14.35 (Dynamic Location Data) - partial, can work with hardcoded data first

---

## Story

**As a** user filtering my transaction history,
**I want to** filter by location with a Country → City hierarchy,
**So that** I can easily find transactions from specific places or entire countries.

---

## Context

### Current State:
- Location filter infrastructure exists in HistoryFiltersContext (90% complete)
- `LocationFilterState` type defined: `{ country?: string; city?: string }`
- `SET_LOCATION_FILTER` and `CLEAR_LOCATION` actions implemented
- `matchesLocationFilter()` filtering logic ready
- `getLocationFilterLabel()` for chip display ready
- **Missing**: UI dropdown in IconFilterBar

### What Exists:
- `IconFilterBar` has 3 filter sections: Time (Calendar), Category (Tag), Groups (Bookmark)
- Need to add 4th section: Location (MapPin icon)
- Should follow the same patterns as existing filters

### Target UX:
The user wants a hierarchical filter similar to how Category filters work:
- **Section Title**: "Ubicación" / "Location"
- **Level 1 - Countries**: Collapsible list of all countries with transactions
- **Level 2 - Cities**: Expandable under each country, shows cities in that country
- **Selection Behavior**:
  - Click country name → Select all cities in that country
  - Expand country → See individual cities
  - Select individual cities → Multi-select within and across countries
  - Visual indicator when country is fully/partially selected

---

## Acceptance Criteria

### AC #1: Location Section in IconFilterBar
- [x] MapPin icon button added to IconFilterBar (after Bookmark)
- [x] Icon shows active indicator (primary background color) when location filter is set
- [x] Clicking icon opens location filter dropdown
- [x] Dropdown closes when clicking outside

### AC #2: Country List Display
- [x] Shows countries from user's transaction data (not all 200+ countries)
- [x] Countries displayed as expandable rows with chevron
- [x] Each country shows count of cities with transactions
- [x] Countries sorted alphabetically by localized name
- [x] Clear filter button at bottom when filter is active

### AC #3: City Selection Within Countries
- [x] Click chevron or country row → Shows cities list under country
- [x] Cities sorted alphabetically within each country
- [x] Each city is selectable (checkbox with tap to toggle)
- [x] Visual indicator for selected cities (primary color checkbox)

### AC #4: Country-Level Selection
- [x] Click country checkbox → Selects ALL cities in that country
- [x] When all cities selected, country shows "selected" state (primary checkbox)
- [x] When some cities selected, country shows "partial" state (warning/amber checkbox)
- [x] Can deselect country to deselect all its cities

### AC #5: Multi-Select Across Countries
- [x] Can select cities from multiple countries simultaneously
- [x] Filter applies as OR - any selected city matches
- [x] Example: Santiago OR Buenos Aires OR Lima
- [x] Selection count badge shown in header

### AC #6: Filter Chip Display
- [x] Active filter shows as chip below header
- [x] Single city shows city name
- [x] Multiple selections show abbreviated: "3 ciudades" / "3 cities"
- [x] Clicking chip X clears location filter

### AC #7: Integration with History/Items Views
- [x] Location filter works in HistoryView (Compras)
- [x] Location filter works in ItemsView (Productos) - uses same context
- [x] Filter persists when switching between views (context-based)
- [x] Combined with other filters (time, category, groups)

---

## Tasks

### Phase 1: Add MapPin Button to IconFilterBar
- [x] Task 1.1: Add location button with MapPin icon
- [x] Task 1.2: Add `location` to DropdownType union
- [x] Task 1.3: Wire up toggle and active state indicator

### Phase 2: Create LocationFilterDropdown Component
- [x] Task 2.1: Create component skeleton with country list
- [x] Task 2.2: Implement country expand/collapse behavior
- [x] Task 2.3: Add city list under expanded countries
- [x] Task 2.4: Implement selection state (none/partial/all)

### Phase 3: Selection Logic
- [x] Task 3.1: Implement country-level selection (select all cities)
- [x] Task 3.2: Implement city-level individual selection
- [x] Task 3.3: Handle multi-select state management
- [x] Task 3.4: Update HistoryFiltersContext with `selectedCities` field

### Phase 4: Filter Integration
- [x] Task 4.1: Update FilterChips to display location with locale support
- [x] Task 4.2: Update filtering logic for multi-select (historyFilterUtils.ts)
- [x] Task 4.3: Test with HistoryView - working via shared context
- [x] Task 4.4: Test with ItemsView - working via shared context

### Phase 5: Polish
- [x] Task 5.1: Add CSS transition for expand/collapse chevron
- [x] Task 5.2: Touch targets sized appropriately (p-2.5 padding)
- [x] Task 5.3: Checkbox and country rows keyboard accessible via buttons
- [x] Task 5.4: Aria labels added for screen readers

---

## Technical Notes

### Current LocationFilterState
```typescript
// src/contexts/HistoryFiltersContext.tsx
export interface LocationFilterState {
  country?: string;   // Single country - needs extension for multi-select
  city?: string;      // Single city - needs extension for multi-select
}
```

### Extended State for Multi-Select
```typescript
// Option A: Comma-separated (like groups)
interface LocationFilterState {
  countries?: string;  // "Chile,Argentina" (comma-separated)
  cities?: string;     // "Santiago,Villarrica,Buenos Aires"
}

// Option B: Array-based (cleaner but more changes)
interface LocationFilterState {
  selections: Array<{
    country: string;
    cities?: string[];  // undefined = all cities in country
  }>;
}

// Recommendation: Option A for consistency with existing patterns
```

### Filtering Logic Update
```typescript
// Current (single selection)
export function matchesLocationFilter(
  transaction: Transaction,
  filter: LocationFilterState
): boolean {
  if (filter.country && transaction.country !== filter.country) return false;
  if (filter.city && transaction.city !== filter.city) return false;
  return true;
}

// Updated (multi-select)
export function matchesLocationFilter(
  transaction: Transaction,
  filter: LocationFilterState
): boolean {
  if (!filter.countries && !filter.cities) return true;

  const countries = filter.countries?.split(',') || [];
  const cities = filter.cities?.split(',') || [];

  // If specific cities selected, check city match
  if (cities.length > 0) {
    return cities.includes(transaction.city || '');
  }

  // If only countries selected, check country match
  if (countries.length > 0) {
    return countries.includes(transaction.country || '');
  }

  return true;
}
```

### UI Component Structure
```typescript
// LocationFilterDropdown structure
<div className="dropdown-container">
  {/* Header */}
  <div className="header">
    <span>Ubicación</span>
    <button onClick={clearAll}>Limpiar</button>
  </div>

  {/* All Locations option */}
  <div className="all-option" onClick={clearAll}>
    <CheckCircle />
    <span>Todas las ubicaciones</span>
  </div>

  {/* Country list */}
  {countries.map(country => (
    <div key={country.name}>
      {/* Country row */}
      <div className="country-row">
        <button onClick={() => toggleExpand(country)}>
          <ChevronRight rotated={expanded} />
        </button>
        <Checkbox
          state={getCountryState(country)} // 'none' | 'partial' | 'all'
          onClick={() => selectCountry(country)}
        />
        <span>{country.name}</span>
        <span className="count">{country.cityCount}</span>
      </div>

      {/* Cities (when expanded) */}
      {expanded && (
        <div className="cities-list">
          {country.cities.map(city => (
            <div className="city-row" key={city}>
              <Checkbox
                checked={isCitySelected(city)}
                onClick={() => toggleCity(city)}
              />
              <span>{city}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  ))}
</div>
```

### Available Filters Extraction
```typescript
// Already exists in historyFilterUtils.ts
export interface AvailableFilters {
  // ... existing fields
  countries: string[];
  citiesByCountry: Record<string, string[]>;
}

// extractAvailableFilters already populates this from transactions
```

---

## UI Mockup

```
┌─────────────────────────────────────┐
│  Ubicación                  Limpiar │
├─────────────────────────────────────┤
│  ✓ Todas las ubicaciones            │
├─────────────────────────────────────┤
│  ▶ ☐ Argentina              (3)     │
│  ▼ ■ Chile                  (12)    │
│     ├ ☑ Las Condes                  │
│     ├ ☑ Santiago                    │
│     ├ ☐ Villarrica                  │
│     └ ☑ Viña del Mar                │
│  ▶ ☐ United States          (2)     │
└─────────────────────────────────────┘

Legend:
☐ = unchecked
☑ = checked
■ = indeterminate (some children selected)
✓ = all selected
▶ = collapsed
▼ = expanded
(3) = city count
```

---

## File List

**New Files:**
- `src/components/history/LocationFilterDropdown.tsx` - Main dropdown component

**Modified Files:**
- `src/components/history/IconFilterBar.tsx` - Add MapPin button and dropdown
- `src/components/history/index.ts` - Export new component
- `src/contexts/HistoryFiltersContext.tsx` - Extend LocationFilterState if needed
- `src/utils/historyFilterUtils.ts` - Update matchesLocationFilter for multi-select
- `src/hooks/useHistoryFilters.ts` - Update label getter for multi-select

---

## Dependencies

- **Story 14.35 (Optional)**: If implemented first, can use localized country/city names
- **Works without 14.35**: Can use existing hardcoded English names from `src/data/locations.ts`

---

## Test Scenarios

1. **Single Country Selection**
   - Select "Chile" → All Chilean transactions shown
   - Filter chip shows "Chile"

2. **Single City Selection**
   - Expand Chile → Select "Santiago"
   - Only Santiago transactions shown
   - Filter chip shows "Chile > Santiago"

3. **Multiple Cities Same Country**
   - Select Santiago + Villarrica
   - Chile shows indeterminate state
   - Filter chip shows "2 ubicaciones"

4. **Multiple Countries**
   - Select Chile (all cities) + Argentina > Buenos Aires
   - Shows all Chile + Buenos Aires only
   - Filter chip shows "4 ubicaciones"

5. **Combined with Other Filters**
   - Time: January 2026
   - Category: Supermercado
   - Location: Chile > Santiago
   - All three filters apply together

---

## Implementation Notes (2026-01-12)

### Architecture Decision
- Used **Option A (comma-separated strings)** for multi-select state, consistent with existing patterns:
  - `selectedCities?: string` - comma-separated city codes (e.g., "santiago,buenos_aires,lima")
  - Takes priority over legacy `country` and `city` fields for filtering
  - `country` field retained for display purposes (primary country for chip label)

### Files Modified
1. **`src/components/history/IconFilterBar.tsx`**
   - Added `MapPin` and `ChevronDown` imports from lucide-react
   - Added `location` to `DropdownType` union
   - Added MapPin button after Bookmark (custom groups) button
   - Created `LocationFilterDropdownMenu` component (~350 lines)
   - Uses `useLocationDisplay` hook for localized country/city names

2. **`src/contexts/HistoryFiltersContext.tsx`**
   - Extended `LocationFilterState` with `selectedCities?: string` field
   - Added JSDoc documentation for multi-select behavior

3. **`src/utils/historyFilterUtils.ts`**
   - Updated `matchesLocationFilter()` to handle `selectedCities` multi-select
   - `selectedCities` takes priority over legacy `country`/`city` fields
   - Case-insensitive city matching

4. **`src/hooks/useHistoryFilters.ts`**
   - Updated `hasLocationFilter` selector to check `selectedCities || country`
   - Updated `getLocationFilterLabel()` to support multi-select display:
     - 1 city: shows city name
     - N cities: shows "N cities" / "N ciudades"

5. **`src/components/history/FilterChips.tsx`**
   - Updated to pass `locale` to `getLocationFilterLabel()`
   - Added `data-testid="location-filter-chip"` for testing

### New Test File
- **`tests/unit/utils/historyFilterUtils.location.test.ts`** (14 tests)
  - Multi-select city filtering
  - Case-insensitive matching
  - Legacy single-selection backward compatibility
  - Combined filter scenarios

### UI Features
- Country rows with expand/collapse chevron
- City count badges per country
- Three-state checkboxes: empty, partial (amber), full (primary)
- Selection count badge in header
- Localized country/city names via `useLocationDisplay` hook
- Clear filter button when filter is active

---

## Session Log

### Session 1 (2026-01-12)
- **Duration**: ~45 minutes
- **Outcome**: Full implementation completed
- **Tests**: 14 new tests + all existing tests pass
- **Build**: TypeScript and production build pass

### Session 2 - Enhancement (2026-01-13)
- **Request**: Integrate location filter into CategoryFilterDropdownMenu as 3rd tab
- **Outcome**: Complete UI integration

**Changes Made:**
1. **Removed separate MapPin button** - Location filter now accessed via category dropdown
2. **Added "Ubicación" tab** to CategoryFilterDropdownMenu alongside "Compras" and "Productos"
3. **Removed toggle switch** from dropdown header - replaced with the new 3rd tab
4. **Same 3-state behavior** as other tabs:
   - Select locations → tab title glows amber (pending)
   - Click glowing tab → applies filter and closes menu
5. **Updated `CategoryFilterDropdownMenuProps`** to include:
   - `locationState?: { country?: string; city?: string; selectedCities?: string; }`
   - `hasLocationFilter?: boolean`
6. **Tab content for Location tab** shows same hierarchical Country→City UI that was in separate dropdown

**User Flow:**
1. Click Tag icon to open category filter dropdown
2. Click "Ubicación" tab to switch to location selection
3. Expand countries and select cities
4. "Ubicación" title glows to indicate pending changes
5. Click "Ubicación" again to apply filter

**Technical Details:**
- Location state (`pendingLocations`, `committedLocations`) follows same pattern as transactions/items
- Uses `useLocationDisplay` hook for localized names
- Dispatches `SET_LOCATION_FILTER` and `CLEAR_LOCATION` actions
- Clear filter button clears all three filter types (category, item, location)

### Session 2 Part 2 - UI Polish (2026-01-13)
- **Request**: Expand dropdown width, remove separate location button, change icon to Filter/ListFilter

**Changes Made:**
1. **Expanded dropdown width** - Changed from `w-72` to `w-[calc(100vw-2rem)] max-w-sm` for full screen width
2. **Removed separate MapPin location button** - Location filter now exclusively accessed via the category dropdown
3. **Changed icon from Tag to Filter/ListFilter**:
   - No filter active: `Filter` icon (empty funnel)
   - Filter active (category OR location): `ListFilter` icon (funnel with lines)
4. **Removed `LocationFilterDropdownMenu` component** - No longer needed since location UI is integrated into CategoryFilterDropdownMenu
5. **Updated DropdownType** - Removed `'location'` from union type

**Icon Behavior:**
- `Filter` (lucide-react) shown when no category/location filter active
- `ListFilter` (lucide-react) shown when any category OR location filter is active
- Background highlights to primary-light when filter is active

**Note:** Original request was for `Funnel`/`FunnelPlus` icons but these are not available in the current lucide-react version. Used `Filter`/`ListFilter` as equivalent alternatives.
