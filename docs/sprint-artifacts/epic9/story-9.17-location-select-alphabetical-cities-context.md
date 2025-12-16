# Story 9.17: Location Select with Alphabetical City Sorting - Context

Status: drafted

## Story

As a **user**,
I want **to select a default location (country and city) in settings, and have cities sorted alphabetically**,
So that **I can easily find my city and have it automatically applied to scanned receipts**.

## Acceptance Criteria

1. **AC #1:** `src/data/locations.ts` data file exists with countries and cities
2. **AC #2:** Countries in dropdown are sorted alphabetically
3. **AC #3:** Cities within each country are sorted alphabetically
4. **AC #4:** `src/components/LocationSelect.tsx` component properly displays sorted options
5. **AC #5:** Default location setting added to SettingsView (country + city dropdowns)
6. **AC #6:** Location fields added to EditView (country + city for transaction editing)
7. **AC #7:** Default location persisted in localStorage
8. **AC #8:** Case-insensitive city matching for AI-scanned locations (e.g., "VILLARRICA" → "Villarrica")
9. **AC #9:** City dropdown disabled until country is selected
10. **AC #10:** Translations added for location-related UI text (EN + ES)
11. **AC #11:** Existing tests pass

## Tasks / Subtasks

- [ ] Task 1: Create location data file (AC: #1, #2, #3)
  - [ ] Create `src/data/` directory
  - [ ] Create `src/data/locations.ts`
  - [ ] Add `LOCATIONS` object with country → cities mapping
  - [ ] Ensure all cities are sorted alphabetically within each country
  - [ ] Export `COUNTRIES` array (sorted country names)
  - [ ] Export `findCityWithNormalizedCase()` helper function

- [ ] Task 2: Create LocationSelect component (AC: #4, #9)
  - [ ] Create `src/components/LocationSelect.tsx`
  - [ ] Add TypeScript interface for props
  - [ ] Implement country dropdown (sorted)
  - [ ] Implement city dropdown (filtered by country, sorted)
  - [ ] Disable city dropdown when no country selected
  - [ ] Apply theme-aware styling using CSS variables

- [ ] Task 3: Add default location to SettingsView (AC: #5)
  - [ ] Add `defaultCountry` and `defaultCity` props to SettingsViewProps
  - [ ] Add `onSetDefaultCountry` and `onSetDefaultCity` callbacks
  - [ ] Add "Default Location" section with MapPin icon
  - [ ] Include LocationSelect component
  - [ ] Add hint text explaining feature purpose

- [ ] Task 4: Add location fields to EditView (AC: #6)
  - [ ] Add `country` and `city` fields to Transaction interface in EditView
  - [ ] Add LocationSelect component to form fields section
  - [ ] Wire up change handlers to update transaction state

- [ ] Task 5: App state management (AC: #7, #8)
  - [ ] Add `defaultCountry` and `defaultCity` state in App.tsx
  - [ ] Persist to localStorage on change
  - [ ] Load from localStorage on app init
  - [ ] Add case-insensitive city matching in processScan function
  - [ ] Apply default location when scan doesn't detect location

- [ ] Task 6: Add translations (AC: #10)
  - [ ] Add EN translations: defaultLocation, defaultLocationHint, country, city, selectCountry, selectCity
  - [ ] Add ES translations for same keys

- [ ] Task 7: Verify all tests pass (AC: #11)
  - [ ] Run `npm run test:unit`
  - [ ] Run `npm run build`
  - [ ] Verify no regressions

## Dev Notes

### Important Discovery

**The location dropdown feature documented in Story 9.3 was never actually implemented.** The dev agent record claims `LocationSelect.tsx` and `locations.ts` were created, but these files do not exist in the codebase. Neither SettingsView nor EditView has any location/country/city functionality.

This story creates the feature from scratch.

### Data Structure

```typescript
// src/data/locations.ts
export const LOCATIONS: Record<string, string[]> = {
  'Argentina': [
    'Buenos Aires',
    'Córdoba',
    'Mendoza',
    'Rosario',
    'Salta',
    // More cities...
  ].sort(),
  'Chile': [
    'Antofagasta',
    'Arica',
    'Concepción',
    'Iquique',
    'La Serena',
    'Punta Arenas',
    'Santiago',
    'Temuco',
    'Valdivia',
    'Valparaíso',
    'Villarrica',
    // More cities...
  ].sort(),
  'United States': [
    'Atlanta',
    'Boston',
    'Chicago',
    'Dallas',
    'Denver',
    'Houston',
    'Los Angeles',
    'Miami',
    'New York',
    'Phoenix',
    'San Francisco',
    'Seattle',
    // More cities...
  ].sort(),
  // Additional countries...
};

// Sorted list of country names
export const COUNTRIES = Object.keys(LOCATIONS).sort();

// Case-insensitive city matching
export function findCityWithNormalizedCase(
  country: string,
  cityInput: string
): string | null {
  const cities = LOCATIONS[country];
  if (!cities) return null;
  const normalized = cityInput.toLowerCase();
  return cities.find(c => c.toLowerCase() === normalized) || null;
}
```

### Component Interface

```tsx
// src/components/LocationSelect.tsx
interface LocationSelectProps {
  country: string;
  city: string;
  onCountryChange: (country: string) => void;
  onCityChange: (city: string) => void;
  t: (key: string) => string;
  theme: 'light' | 'dark';
}
```

### Key Code Locations

**SettingsView.tsx** - Add location section after theme selector:
- Follow existing card pattern with icon (use `MapPin` from lucide-react)
- Use toggle container style for consistency

**EditView.tsx** - Add location fields to form:
- Add after the date input
- Use two dropdowns (country, then city)

**App.tsx** - State management:
- Add state: `const [defaultCountry, setDefaultCountry] = useState('')`
- Add state: `const [defaultCity, setDefaultCity] = useState('')`
- Persist to localStorage keys: `defaultCountry`, `defaultCity`

### Styling Pattern

Follow existing SettingsView patterns:

```tsx
// Card container
<div className="p-4 rounded-xl border flex justify-between items-center" style={cardStyle}>
  <div className="flex gap-2 items-center" style={{ color: 'var(--primary)' }}>
    <MapPin size={24} strokeWidth={2} />
    {t('defaultLocation')}
  </div>
  <LocationSelect ... />
</div>
```

### Project Structure Notes

**Files to create:**
- `src/data/locations.ts` - Country/city data
- `src/components/LocationSelect.tsx` - Reusable dropdown component

**Files to modify:**
- `src/views/SettingsView.tsx` - Add default location section
- `src/views/EditView.tsx` - Add location fields
- `src/App.tsx` - State management and localStorage
- `src/utils/translations.ts` - Add translations

### References

- [Story 9.17 Definition](./story-9.17-location-select-alphabetical-cities.md)
- [SettingsView.tsx](../../src/views/SettingsView.tsx) - Existing patterns
- [EditView.tsx](../../src/views/EditView.tsx) - Form field patterns

### Learnings from Previous Stories

**From Story 9.3 (Edit View Field Display):**
- The story documentation claimed LocationSelect was implemented but it wasn't
- Always verify files exist before assuming a feature was completed

**From Story 7.12 (Theme Consistency):**
- Use CSS variables for theme-aware styling
- Follow card pattern with `cardStyle` and `inputStyle`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-16 | Context file created | Claude Opus 4.5 |
