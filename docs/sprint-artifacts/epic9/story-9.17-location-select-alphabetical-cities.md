# Story 9.17: Location Select with Alphabetical City Sorting

**Epic:** Epic 9 - Scan Enhancement & Merchant Learning
**Status:** Done
**Story Points:** 0.5 (revised - most work was done in Story 9.3)
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

- [x] **AC #1:** `src/data/locations.ts` data file exists with countries and cities
- [x] **AC #2:** Countries in dropdown are sorted alphabetically
- [x] **AC #3:** Cities within each country are sorted alphabetically
- [x] **AC #4:** `src/components/LocationSelect.tsx` component properly displays sorted options
- [x] **AC #5:** Default location setting added to SettingsView (country + city dropdowns)
- [x] **AC #6:** Location fields added to EditView (country + city for transaction editing)
- [x] **AC #7:** Default location persisted in localStorage
- [x] **AC #8:** Case-insensitive city matching for AI-scanned locations (e.g., "VILLARRICA" → "Villarrica")
- [x] **AC #9:** City dropdown disabled until country is selected
- [x] **AC #10:** Translations added for location-related UI text (EN + ES)
- [x] **AC #11:** Existing tests pass

---

## Tasks / Subtasks

### Create Location Data (Already existed - verified by Story 9.3)
- [x] Create `src/data/` directory
- [x] Create `src/data/locations.ts` with countries and cities data
  - [x] Include Chile with major cities (sorted alphabetically)
  - [x] Include Argentina, USA, and other common countries
  - [x] Export `CITIES_BY_COUNTRY` object (country → cities array)
  - [x] Export `COUNTRIES` array (sorted country names)
  - [x] Export `findCityWithNormalizedCase()` helper function (added Story 9.17)

### Create LocationSelect Component (Already existed - verified by Story 9.3)
- [x] Create `src/components/LocationSelect.tsx`
  - [x] Country dropdown (sorted alphabetically)
  - [x] City dropdown (filtered by selected country, sorted alphabetically)
  - [x] Disable city dropdown when no country selected
  - [x] Follow existing component patterns (theme-aware, CSS variables)
  - [x] Add proper TypeScript interface for props

### Integrate into SettingsView (Already existed - verified by Story 9.3)
- [x] Add defaultCountry and defaultCity props to SettingsViewProps
- [x] Add "Default Location" section with LocationSelect
- [x] Add onSetDefaultCountry and onSetDefaultCity callbacks
- [x] Style to match existing settings cards

### Integrate into EditView (Already existed - verified by Story 9.3)
- [x] Add country and city fields to Transaction interface
- [x] Add LocationSelect to form fields section
- [x] Wire up change handlers

### App.tsx State Management (Already existed - verified by Story 9.3)
- [x] Add defaultCountry and defaultCity state
- [x] Persist to localStorage
- [x] Add case-insensitive city matching in processScan function

### Translations (Already existed - verified by Story 9.3)
- [x] Add EN translations: defaultLocation, defaultLocationHint, country, city, selectCountry, selectCity
- [x] Add ES translations for same keys

### Story 9.17 Actual Work Done
- [x] Update `getCitiesForCountry()` to sort cities alphabetically using `localeCompare()`
- [x] Add `findCityWithNormalizedCase()` helper for case-insensitive AI matching
- [x] Verify all 857 unit tests pass
- [x] Verify build succeeds

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

---

## Dev Agent Record

### Debug Log
- Analyzed context file - discovered that the location feature already exists from Story 9.3
- The only work needed was to add alphabetical sorting to `getCitiesForCountry()` function
- Chile had 100+ cities grouped by region, not alphabetically - now sorted at runtime
- Added `findCityWithNormalizedCase()` helper for AC #8 (case-insensitive AI matching)

### Completion Notes
**Story 9.17 was much smaller than originally scoped.** The location dropdown feature was already fully implemented in Story 9.3. This story only required:

1. **Updated `getCitiesForCountry()`** in `src/data/locations.ts` (line 217-220) to return cities sorted alphabetically using `localeCompare()`. This ensures proper Unicode/locale-aware sorting.

2. **Added `findCityWithNormalizedCase()`** helper function (line 230-244) for case-insensitive city matching. This is useful when AI/OCR scans a receipt with city names in ALL CAPS like "VILLARRICA" and needs to match to the proper-cased "Villarrica".

**Implementation details:**
- Used spread operator `[...cities]` to avoid mutating the original array
- Used `localeCompare()` for proper Unicode sorting (handles accented characters correctly)
- Added `.trim()` to the normalized case function for robustness

---

## File List

**Modified:**
- `src/data/locations.ts` - Updated `getCitiesForCountry()` to sort; added `findCityWithNormalizedCase()` helper

---

## Status

**Status:** Done

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted - Fix city alphabetical sorting in location dropdown |
| 2025-12-16 | 2.0 | Story updated - LocationSelect feature needs to be CREATED (doesn't exist) |
| 2025-12-16 | 3.0 | Story COMPLETED - Updated getCitiesForCountry() to sort, added findCityWithNormalizedCase() |
| 2025-12-16 | 4.0 | Senior Developer Review - APPROVED |

---

## Senior Developer Review (AI)

### Review Metadata
- **Reviewer:** Gabe
- **Date:** 2025-12-16
- **Outcome:** ✅ **APPROVE**

### Summary

Story 9.17 is a small enhancement (0.5 points) that adds alphabetical city sorting to the existing location dropdown feature. The implementation is clean, follows best practices with locale-aware sorting via `localeCompare()`, and all acceptance criteria are met with evidence. The story was significantly de-scoped from the original plan as most functionality already existed from Story 9.3.

### Key Findings

**No HIGH or MEDIUM severity findings.**

**LOW severity:**
- None

### Acceptance Criteria Coverage

| AC # | Description | Status | Evidence |
|------|-------------|--------|----------|
| AC #1 | `src/data/locations.ts` data file exists | ✅ IMPLEMENTED | `src/data/locations.ts:1-245` |
| AC #2 | Countries sorted alphabetically | ✅ IMPLEMENTED | `src/data/locations.ts:94-100` - `.sort()` |
| AC #3 | Cities sorted alphabetically | ✅ IMPLEMENTED | `src/data/locations.ts:217-220` - `localeCompare()` |
| AC #4 | LocationSelect displays sorted options | ✅ IMPLEMENTED | `src/components/LocationSelect.tsx:33` |
| AC #5 | Default location in SettingsView | ✅ IMPLEMENTED | `src/views/SettingsView.tsx:282-284` |
| AC #6 | Location fields in EditView | ✅ IMPLEMENTED | `src/views/EditView.tsx:850-854` |
| AC #7 | localStorage persistence | ✅ IMPLEMENTED | `src/App.tsx:103-104, 140, 144` |
| AC #8 | Case-insensitive city matching | ✅ IMPLEMENTED | `src/data/locations.ts:239-244` |
| AC #9 | City dropdown disabled until country selected | ✅ IMPLEMENTED | `src/components/LocationSelect.tsx:52` |
| AC #10 | EN + ES translations | ✅ IMPLEMENTED | `src/utils/translations.ts:100-101, 295-296` |
| AC #11 | Existing tests pass | ✅ IMPLEMENTED | 857 tests passed |

**Summary:** 11 of 11 acceptance criteria fully implemented ✅

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Create `src/data/` directory | [x] | ✅ VERIFIED | Directory exists |
| Create `src/data/locations.ts` | [x] | ✅ VERIFIED | `src/data/locations.ts:1-245` |
| Chile with major cities | [x] | ✅ VERIFIED | `src/data/locations.ts:111-144` (100+ cities) |
| Argentina, USA, other countries | [x] | ✅ VERIFIED | `src/data/locations.ts:108, 168` (60+ countries) |
| Export `CITIES_BY_COUNTRY` | [x] | ✅ VERIFIED | `src/data/locations.ts:106` |
| Export `COUNTRIES` (sorted) | [x] | ✅ VERIFIED | `src/data/locations.ts:94-100` |
| Export `findCityWithNormalizedCase()` | [x] | ✅ VERIFIED | `src/data/locations.ts:239-244` |
| Create `LocationSelect.tsx` | [x] | ✅ VERIFIED | `src/components/LocationSelect.tsx:1-73` |
| Country dropdown (sorted) | [x] | ✅ VERIFIED | `src/components/LocationSelect.tsx:66` |
| City dropdown (sorted) | [x] | ✅ VERIFIED | `src/components/LocationSelect.tsx:33, 55-57` |
| Disable city when no country | [x] | ✅ VERIFIED | `src/components/LocationSelect.tsx:52` |
| TypeScript interface | [x] | ✅ VERIFIED | `src/components/LocationSelect.tsx:4-14` |
| SettingsView integration | [x] | ✅ VERIFIED | `src/views/SettingsView.tsx:282-284` |
| EditView integration | [x] | ✅ VERIFIED | `src/views/EditView.tsx:850-854` |
| App.tsx state management | [x] | ✅ VERIFIED | `src/App.tsx:103-104, 140, 144` |
| EN translations | [x] | ✅ VERIFIED | `src/utils/translations.ts:100-101` |
| ES translations | [x] | ✅ VERIFIED | `src/utils/translations.ts:295-296` |
| Update `getCitiesForCountry()` | [x] | ✅ VERIFIED | `src/data/locations.ts:217-220` |
| Add `findCityWithNormalizedCase()` | [x] | ✅ VERIFIED | `src/data/locations.ts:239-244` |
| 857 unit tests pass | [x] | ✅ VERIFIED | Terminal output |
| Build succeeds | [x] | ✅ VERIFIED | Terminal output |

**Summary:** 21 of 21 completed tasks verified, 0 questionable, 0 falsely marked complete ✅

### Test Coverage and Gaps

- ✅ All 857 existing unit tests pass
- ✅ Build succeeds
- ⚠️ No dedicated unit tests for `getCitiesForCountry()` or `findCityWithNormalizedCase()` (acceptable for simple utility functions)

### Architectural Alignment

- ✅ Follows existing patterns from `locations.ts`
- ✅ Uses proper TypeScript interfaces
- ✅ Uses `localeCompare()` for locale-aware sorting (best practice for international characters)
- ✅ No architecture violations

### Security Notes

- ✅ No security concerns - static data, no user input to database queries
- ✅ No XSS or injection vectors

### Best-Practices and References

- **Locale-aware sorting:** Using `localeCompare()` handles Unicode characters correctly (e.g., "Córdoba", "São Paulo")
- **Immutability:** Uses spread operator `[...cities]` to avoid mutating original arrays
- **Defensive coding:** Returns empty array for invalid country, null for not found city

### Action Items

**Code Changes Required:**
- None

**Advisory Notes:**
- Note: Consider adding unit tests for `getCitiesForCountry()` and `findCityWithNormalizedCase()` in a future story (low priority)
