# Story 9.17: Location Select with Alphabetical City Sorting - Context

Status: drafted

## Story

As a **user**,
I want **to have cities sorted alphabetically in the location dropdown**,
So that **I can easily find my city without scrolling through an unsorted list**.

## Acceptance Criteria (Updated for Current State)

**Note:** Most of Story 9.17 was already implemented in Story 9.3. This story only needs to:

1. **AC #1:** ✅ DONE - `src/data/locations.ts` data file exists with countries and cities
2. **AC #2:** ✅ DONE - Countries in dropdown are sorted alphabetically
3. **AC #3:** ⚠️ **NEEDS WORK** - Cities within each country should be sorted alphabetically (currently NOT sorted in Chile)
4. **AC #4:** ✅ DONE - `src/components/LocationSelect.tsx` component exists
5. **AC #5:** ✅ DONE - Default location setting in SettingsView (country + city dropdowns)
6. **AC #6:** ✅ DONE - Location fields in EditView (country + city for transaction editing)
7. **AC #7:** ✅ DONE - Default location persisted in user preferences
8. **AC #8:** ⚠️ **OPTIONAL** - Case-insensitive city matching for AI-scanned locations
9. **AC #9:** ✅ DONE - City dropdown disabled until country is selected
10. **AC #10:** ✅ DONE - Translations added for location-related UI text (EN + ES)
11. **AC #11:** Existing tests pass

## Tasks / Subtasks (Revised)

This story is much smaller than originally scoped. The main work is:

- [ ] Task 1: Sort cities alphabetically in `src/data/locations.ts` (AC: #3)
  - [ ] Sort Chile cities array alphabetically (currently grouped by region)
  - [ ] Verify all other countries have sorted cities
  - [ ] Consider adding `getCitiesForCountry()` helper that returns sorted array

- [ ] Task 2: (Optional) Add case-insensitive city matching (AC: #8)
  - [ ] Add `findCityWithNormalizedCase(country, cityInput)` helper
  - [ ] Useful for AI-scanned locations like "VILLARRICA" → "Villarrica"

- [ ] Task 3: Verify all tests pass (AC: #11)
  - [ ] Run `npm run test:unit`
  - [ ] Run `npm run build`
  - [ ] Verify no regressions

## Dev Notes

### IMPORTANT: Feature Already Exists!

**The location dropdown feature documented in Story 9.3 was fully implemented.** The following files EXIST:

- `src/data/locations.ts` - Contains `COUNTRIES` array (sorted) and `CITIES_BY_COUNTRY` object
- `src/components/LocationSelect.tsx` - Country/city dropdown component
- SettingsView has default location section with MapPin icon
- EditView has location fields with LocationSelect component

### Current State Analysis

**`src/data/locations.ts`:**
- `COUNTRIES` array is sorted alphabetically ✅
- `CITIES_BY_COUNTRY` object has cities for 60+ countries
- Chile has 100+ cities but they're **grouped by region, not alphabetically sorted** ❌
- Other countries appear to have cities in reasonable order (may need verification)

**`src/components/LocationSelect.tsx`:**
- Properly displays country dropdown (sorted)
- City dropdown filtered by selected country
- City dropdown disabled when no country selected ✅
- **Does NOT sort cities** - just displays them in array order

### Solution Options

**Option A (Simple):** Sort cities arrays in `locations.ts`
```typescript
// Sort Chile cities alphabetically
'Chile': [
  'Antofagasta', 'Arica', 'Calama', 'Calbuco', 'Castro', ...
].sort(),
```

**Option B (Runtime):** Sort in `getCitiesForCountry()` helper
```typescript
export function getCitiesForCountry(country: string): string[] {
  const cities = CITIES_BY_COUNTRY[country] || [];
  return [...cities].sort(); // Return sorted copy
}
```

**Option C (Both):** Sort in data file AND add helper for consistency

**Recommendation:** Option B - sort at runtime in `getCitiesForCountry()`. This is safer (doesn't require manually re-sorting all arrays) and ensures consistent alphabetical order.

### Key Code Locations

**`src/data/locations.ts` (line 216-218):**
```typescript
export function getCitiesForCountry(country: string): string[] {
    return CITIES_BY_COUNTRY[country] || [];
}
```
Change to:
```typescript
export function getCitiesForCountry(country: string): string[] {
    const cities = CITIES_BY_COUNTRY[country] || [];
    return [...cities].sort((a, b) => a.localeCompare(b));
}
```

**`src/components/LocationSelect.tsx` (line 33):**
```typescript
const cities = getCitiesForCountry(country);
```
No change needed - already using the helper function.

### Project Structure Notes

**Files to modify:**
- `src/data/locations.ts` - Update `getCitiesForCountry()` to sort

**No new files needed** - this is a small enhancement to existing code.

### Estimated Effort

**Original estimate:** 3 story points
**Revised estimate:** 0.5 story points (1-2 hours)

Most of the work was already done. Just need to add `.sort()` to the helper function.

### References

- [Story 9.17 Definition](./story-9.17-location-select-alphabetical-cities.md)
- [locations.ts](../../src/data/locations.ts) - Existing location data
- [LocationSelect.tsx](../../src/components/LocationSelect.tsx) - Existing component
- [SettingsView.tsx](../../src/views/SettingsView.tsx) - Has default location section
- [EditView.tsx](../../src/views/EditView.tsx) - Has location fields

### Learnings from Previous Stories

**From Story 9.3 (Edit View Field Display):**
- The location feature WAS implemented (context file was wrong)
- Always verify files exist before assuming a feature wasn't completed
- `LocationSelect` component follows existing patterns with theme-aware styling

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-16 | Context file created | Claude Opus 4.5 |
| 2025-12-16 | Updated - feature already exists, only sorting needed | Claude Opus 4.5 |
