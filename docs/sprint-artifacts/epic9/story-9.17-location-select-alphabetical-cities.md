# Story 9.17: Location Select with Alphabetical City Sorting

**Epic:** Epic 9 - Scan Enhancement & Merchant Learning
**Status:** Drafted
**Story Points:** 3
**Dependencies:** None

---

## User Story

As a **user**,
I want **to select a default location (country and city) in settings, and have cities sorted alphabetically**,
So that **I can easily find my city and have it automatically applied to scanned receipts**.

---

## Problem Description

The location dropdown feature documented in Story 9.3 was **not actually implemented**. The `LocationSelect.tsx` component and `locations.ts` data file do not exist in the codebase. Users currently have no way to:
1. Set a default location in Settings
2. See/edit location for individual transactions in EditView
3. Have AI-detected locations matched case-insensitively

This story creates the location selection feature from scratch with alphabetically sorted cities.

---

## Acceptance Criteria

- [ ] **AC #1:** `src/data/locations.ts` data file exists with countries and cities
- [ ] **AC #2:** Countries in dropdown are sorted alphabetically
- [ ] **AC #3:** Cities within each country are sorted alphabetically
- [ ] **AC #4:** `src/components/LocationSelect.tsx` component properly displays sorted options
- [ ] **AC #5:** Default location setting added to SettingsView (country + city dropdowns)
- [ ] **AC #6:** Location fields added to EditView (country + city for transaction editing)
- [ ] **AC #7:** Default location persisted in localStorage
- [ ] **AC #8:** Case-insensitive city matching for AI-scanned locations (e.g., "VILLARRICA" → "Villarrica")
- [ ] **AC #9:** City dropdown disabled until country is selected
- [ ] **AC #10:** Translations added for location-related UI text (EN + ES)
- [ ] **AC #11:** Existing tests pass

---

## Tasks / Subtasks

### Create Location Data
- [ ] Create `src/data/` directory
- [ ] Create `src/data/locations.ts` with countries and cities data
  - [ ] Include Chile with major cities (sorted alphabetically)
  - [ ] Include Argentina, USA, and other common countries
  - [ ] Export `LOCATIONS` object (country → cities array)
  - [ ] Export `COUNTRIES` array (sorted country names)
  - [ ] Export `findCityWithNormalizedCase()` helper function

### Create LocationSelect Component
- [ ] Create `src/components/LocationSelect.tsx`
  - [ ] Country dropdown (sorted alphabetically)
  - [ ] City dropdown (filtered by selected country, sorted alphabetically)
  - [ ] Disable city dropdown when no country selected
  - [ ] Follow existing component patterns (theme-aware, CSS variables)
  - [ ] Add proper TypeScript interface for props

### Integrate into SettingsView
- [ ] Add defaultCountry and defaultCity props to SettingsViewProps
- [ ] Add "Default Location" section with LocationSelect
- [ ] Add onSetDefaultCountry and onSetDefaultCity callbacks
- [ ] Style to match existing settings cards

### Integrate into EditView
- [ ] Add country and city fields to Transaction interface
- [ ] Add LocationSelect to form fields section
- [ ] Wire up change handlers

### App.tsx State Management
- [ ] Add defaultCountry and defaultCity state
- [ ] Persist to localStorage
- [ ] Add case-insensitive city matching in processScan function

### Translations
- [ ] Add EN translations: defaultLocation, defaultLocationHint, country, city, selectCountry, selectCity
- [ ] Add ES translations for same keys

---

## Technical Summary

**Files to create:**
1. `src/data/locations.ts` - Countries and cities data structure
2. `src/components/LocationSelect.tsx` - Reusable dropdown component

**Files to modify:**
1. `src/views/SettingsView.tsx` - Add default location section
2. `src/views/EditView.tsx` - Add location fields to form
3. `src/App.tsx` - State management and localStorage persistence
4. `src/utils/translations.ts` - Add location-related translations

**Data Structure:**
```typescript
// src/data/locations.ts
export const LOCATIONS: Record<string, string[]> = {
  'Argentina': ['Buenos Aires', 'Córdoba', 'Mendoza', 'Rosario'].sort(),
  'Chile': ['Antofagasta', 'Concepción', 'Santiago', 'Temuco', 'Valparaíso', 'Villarrica'].sort(),
  'United States': ['Chicago', 'Los Angeles', 'Miami', 'New York', 'San Francisco'].sort(),
  // ... more countries
};

// Ensure countries are also sorted
export const COUNTRIES = Object.keys(LOCATIONS).sort();

// Case-insensitive city lookup
export function findCityWithNormalizedCase(country: string, cityInput: string): string | null {
  const cities = LOCATIONS[country];
  if (!cities) return null;
  const normalized = cityInput.toLowerCase();
  return cities.find(c => c.toLowerCase() === normalized) || null;
}
```

**Component Pattern:**
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

---

## Key Code References

**Pattern Reference:** Follow the same toggle/select patterns used in SettingsView for language/currency selection.

**Existing SettingsView structure:** [src/views/SettingsView.tsx](src/views/SettingsView.tsx)
**Existing EditView structure:** [src/views/EditView.tsx](src/views/EditView.tsx)

---

## Context References

**Tech-Spec:** [tech-spec-epic-9.md](./tech-spec-epic-9.md)
**Related Stories:** Story 9.3 (Edit View Field Display - documented but LocationSelect not implemented)

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted - Fix city alphabetical sorting in location dropdown |
| 2025-12-16 | 2.0 | Story updated - LocationSelect feature needs to be CREATED (doesn't exist) |
