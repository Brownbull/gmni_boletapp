# Story 14.35b: Foreign Location Display with Country Flag

**Status:** completed
**Points:** 3
**Epic:** 14 - Core Implementation
**Dependencies:** 14.35 (Dynamic Location Data)

---

## Story

**As a** user who travels or has transactions from different countries,
**I want to** see a flag icon next to cities from foreign countries,
**So that** I can immediately identify which transactions are from abroad without reading the full location text.

---

## Context

Story 14.35 implemented localized country/city data. However, when viewing transaction history or lists, users may have transactions from multiple countries. Currently all cities display the same way regardless of country, making it hard to spot foreign transactions at a glance.

**User's configured country:** Stored in user preferences (e.g., "Chile")
**Foreign transaction:** Any transaction where `transaction.country !== userPreferences.country`

---

## Acceptance Criteria

### AC 1: Flag Icon Component
- [x] Create `CountryFlag` component that renders flag emoji for a country code
- [x] Support both English country names and ISO codes as input
- [x] Fallback to 🏳️ if country not recognized
- [x] Size prop for different contexts (small: 12px, medium: 16px, large: 20px)

### AC 2: Foreign Location Detection
- [x] Create `useIsForeignLocation(country: string)` hook
- [x] Compares against user's configured country from preferences
- [x] Returns `{ isForeign: boolean, flagEmoji: string }`
- [x] Handle case where user has no country configured (treat all as local)

### AC 3: Transaction Card Display
- [x] In `HistoryView` transaction cards, show flag before city when foreign
- [x] Format: "🇺🇸 New York" instead of just "New York"
- [x] Only show flag when country differs from user's country
- [x] Local transactions show city name only (no flag)

### AC 4: Transaction List Items
- [x] Apply same pattern to `ItemsView` transaction items
- [x] Apply to `RecentScansView` if location is displayed

### AC 5: QuickSave Card
- [x] If scanned receipt is from foreign country, show flag in location display
- [x] Helps user confirm country detection was correct

### AC 6: Edit View Location Display
- [x] Show flag next to location in read-only transaction detail view
- [x] In edit mode, flag appears but location can still be changed

---

## Technical Notes

### Flag Emoji Mapping
```typescript
// In src/utils/countryFlags.ts
export const COUNTRY_FLAGS: Record<string, string> = {
  'Chile': '🇨🇱',
  'United States': '🇺🇸',
  'Argentina': '🇦🇷',
  // ... etc
};

export function getCountryFlag(countryNameOrCode: string): string {
  // Try direct lookup
  // Try ISO code lookup
  // Fallback to 🏳️
}
```

### Integration Points
1. **HistoryView** - Transaction cards with location
2. **ItemsView** - Item list entries
3. **QuickSaveCard** - Scanned receipt preview
4. **TransactionEditorView** - Detail/edit view
5. **BatchSummaryCard** - Batch review cards

### User Preferences Access
- Use existing `useUserPreferences()` hook
- Access `preferences.country` for comparison
- If not set, assume no foreign locations (don't show any flags)

---

## Out of Scope
- Country flag in analytics/charts (would clutter visualization)
- Flag in CSV exports (text-based format)
- Custom flag images (emoji is sufficient for MVP)

---

## File List

**New Files:**
- `src/utils/countryFlags.ts` - Flag emoji lookup utility
- `src/hooks/useIsForeignLocation.ts` - Hook to detect foreign locations
- `src/components/CountryFlag.tsx` - Flag display component
- `tests/unit/utils/countryFlags.test.ts` - Unit tests (43 tests)
- `tests/unit/hooks/useIsForeignLocation.test.ts` - Hook unit tests (24 tests)
- `tests/unit/components/CountryFlag.test.tsx` - Component tests (20 tests)

**Modified Files:**
- `src/views/HistoryView.tsx` - Pass `lang` prop to TransactionCard for localized city names
- `src/views/ItemsView.tsx` - Pass `lang` prop to ItemCard for localized city names
- `src/components/scan/QuickSaveCard.tsx` - Add flag + localized city/country names
- `src/components/LocationSelect.tsx` - Add flag to location pill button (used by TransactionEditorView)
- `src/components/transactions/TransactionCard.tsx` - Add `lang` prop, use `getCityName()` for localized display
- `src/components/items/ItemCard.tsx` - Add `lang` prop, use `getCityName()` for localized display
- `src/App.tsx` - Pass `defaultCountry` to views

---

## Dev Agent Record

### Implementation Plan
1. Create `countryFlags.ts` utility with flag emoji map
2. Create `useIsForeignLocation` hook
3. Create `CountryFlag` component
4. Update HistoryView transaction cards
5. Update other views (ItemsView, QuickSaveCard, TransactionEditorView)
6. Write unit tests

---

## Session Log

### Session 1 - 2026-01-12
**Status:** COMPLETED
**Duration:** ~45 min

**Implementation Summary:**

1. **Created `src/utils/countryFlags.ts`:**
   - `COUNTRY_TO_ISO` map with 60+ countries (South America, North America, Europe, Asia, Oceania)
   - `ISO_TO_COUNTRY` reverse mapping
   - `isoCodeToFlag()` - converts ISO 3166-1 alpha-2 codes to flag emoji using regional indicator symbols
   - `getCountryFlag()` - accepts country name or ISO code, returns flag emoji (🏳️ fallback)
   - `isKnownCountry()` - checks if country is in mapping

2. **Created `src/hooks/useIsForeignLocation.ts`:**
   - `useIsForeignLocation(transactionCountry, userDefaultCountry)` hook
   - Returns `{ isForeign: boolean, flagEmoji: string }`
   - Treats all as local when user has no configured country (AC 2)
   - Case-insensitive comparison with whitespace trimming

3. **Created `src/components/CountryFlag.tsx`:**
   - Renders flag emoji with configurable size (small/medium/large)
   - Accessibility support with role="img" and aria-label
   - className prop for additional styling

4. **Updated Components:**
   - `src/components/transactions/TransactionCard.tsx` - Added foreign flag to city MetaPill
   - `src/components/history/TransactionCard.tsx` - Same pattern
   - `src/components/items/ItemCard.tsx` - Added flag to city pill
   - `src/components/scan/QuickSaveCard.tsx` - Added flag to location display
   - `src/components/LocationSelect.tsx` - Added flag to location pill button (used by TransactionEditorView)
   - `src/views/HistoryView.tsx` - Pass `userDefaultCountry` to TransactionCard
   - `src/views/ItemsView.tsx` - Pass `userDefaultCountry` to ItemCard
   - `src/App.tsx` - Pass `defaultCountry` to ItemsView and QuickSaveCard

5. **Unit Tests (82 tests):**
   - `tests/unit/utils/countryFlags.test.ts` (43 tests) - Comprehensive coverage of flag utilities
   - `tests/unit/hooks/useIsForeignLocation.test.ts` (19 tests) - Foreign detection scenarios
   - `tests/unit/components/CountryFlag.test.tsx` (20 tests) - Component rendering and accessibility

**Test Results:** All 82 new tests pass, TypeScript compilation successful

---

### Session 2 - 2026-01-12 (Code Review Enhancement)
**Status:** COMPLETED
**Duration:** ~20 min

**Code Review Findings & Fixes:**

1. **Localized City/Country Names:**
   - Added `useLocationDisplay(lang)` hook usage to all flag display locations
   - `TransactionCard.tsx` - Now uses `getCityName(city)` for localized display
   - `ItemCard.tsx` - Now uses `getCityName(item.city)` for localized display
   - `QuickSaveCard.tsx` - Now uses `getLocationString()`, `getCityName()`, `getCountryName()` for localized location text
   - `HistoryView.tsx` - Now passes `lang` prop to TransactionCard
   - `ItemsView.tsx` - Now passes `lang` prop to ItemCard

2. **Missing Test Coverage:**
   - Added 5 new tests for `countryCode` return value in `useIsForeignLocation.test.ts`
   - Total tests now: 87 (43 + 24 + 20)

3. **Documentation Updates:**
   - Updated File List to include all modified files
   - Added test file counts
   - Documented localization pattern

**Pattern Established:**
When displaying foreign location flags, ALWAYS also use localized names via `useLocationDisplay(lang)`:
```typescript
const { getCityName, getCountryName, getLocationString } = useLocationDisplay(lang);
// Use getCityName(englishCityName) to display in user's language
```
