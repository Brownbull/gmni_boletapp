# Story 14e.32: Location & Currency Selector Bug Fixes

Status: done

**Epic:** 14e - Feature-Based Architecture (Follow-up)
**Points:** 2
**Created:** 2026-01-28
**Author:** Claude (via 14e-28b UI verification)
**Depends:** None

---

## Story

As a **user**,
I want **country and currency selectors to work correctly**,
So that **scanned location data is properly pre-selected and dropdowns stay visible on screen**.

---

## Context

### Bug Discovery

Found during manual UI verification of story 14e-28b (TransactionEditorView migration).

### Bug 1: Country Not Pre-Selected

**Steps to reproduce:**
1. Scan a receipt from a foreign location (e.g., USA)
2. AI detects "Estados Unidos" as the country
3. Click the location tag to open dropdown
4. Country dropdown shows empty selection instead of "Estados Unidos"

**Root Cause:**
- AI returns country in Spanish: `"Estados Unidos"`
- `parseLocationResult()` in `utils.ts` passes this through as-is
- `LocationSelect` dropdown expects English name: `"United States"`
- No match found → dropdown shows empty

**Location:** `src/features/scan/handlers/processScan/utils.ts:59`

### Bug 2: Currency Dropdown Off-Screen

**Steps to reproduce:**
1. Open transaction editor
2. Position currency tag near right edge of screen
3. Click currency tag
4. Dropdown appears partially or fully outside viewport

**Root Cause:**
- Dropdown uses `right-0` CSS positioning
- When button is near right edge, dropdown extends past viewport
- No viewport boundary detection

**Location:** `src/components/CurrencyTag.tsx:88`

---

## Acceptance Criteria

### AC1: Country Name Normalization

**Given** a scan result with country in any language (Spanish/English)
**When** the transaction is created
**Then:**
- [x] Country is normalized to English name for storage
- [x] Dropdown correctly shows the country as selected
- [x] Both "Estados Unidos" and "United States" input work correctly

### AC2: Currency Dropdown Positioning

**Given** the currency tag is clicked
**When** the dropdown opens
**Then:**
- [x] Dropdown stays within viewport boundaries
- [x] If near right edge, dropdown aligns left instead of right
- [x] Dropdown is fully visible and usable

### AC3: Tests

**Given** the fixes are implemented
**When** tests run
**Then:**
- [x] Unit tests for `parseLocationResult` country normalization
- [x] Unit tests for CurrencyTag dropdown positioning logic
- [x] All existing tests pass

---

## Technical Notes

### Fix 1: Country Normalization

Use `findCountry()` from `locationService.ts` to normalize:

```typescript
// In parseLocationResult (utils.ts)
import { findCountry } from '@/services/locationService';

export function parseLocationResult(...) {
  let finalCountry = scanResult.country || '';

  // Normalize country to English name
  if (finalCountry) {
    const normalized = findCountry(finalCountry);
    if (normalized) {
      finalCountry = normalized.names.en;
    }
  }
  // ... rest of function
}
```

### Fix 2: Currency Dropdown Positioning

Add viewport boundary detection using **button ref** (not dropdown ref) to avoid render flash:

```typescript
// In CurrencyTag.tsx
const buttonRef = useRef<HTMLButtonElement>(null);

// Constants for clarity
const DROPDOWN_WIDTH = 200;  // matches min-w-[200px]
const DROPDOWN_MARGIN = 20;
const MIN_SPACE_REQUIRED = DROPDOWN_WIDTH + DROPDOWN_MARGIN;

// Calculate position from button (exists before dropdown opens)
const getDropdownPosition = (): 'left' | 'right' => {
  if (!buttonRef.current) return 'right';
  const rect = buttonRef.current.getBoundingClientRect();
  const spaceOnRight = window.innerWidth - rect.right;
  return spaceOnRight < MIN_SPACE_REQUIRED ? 'left' : 'right';
};

// Use directly in render - no useEffect/useState needed
const dropdownPosition = isOpen ? getDropdownPosition() : 'right';

// In button element:
<button ref={buttonRef} ...>

// In dropdown div:
className={`absolute top-full ${dropdownPosition === 'right' ? 'right-0' : 'left-0'} mt-2 ...`}
```

> **Archie Note:** Using button ref avoids a race condition where measuring the dropdown
> after render would cause a layout flash. The button exists before the dropdown opens,
> so we can calculate positioning synchronously.

---

## Architectural Review (Archie)

**Reviewed:** 2026-01-28 | **Verdict:** ✅ GO - APPROVED WITH NOTES

### FSD Compliance

| Check | Status | Notes |
|-------|--------|-------|
| Layer imports | ⚠️ | `features/scan` → `services/` is legacy path, acceptable during migration |
| State management | ✅ | Local useState for ephemeral UI - no Zustand needed |
| Storage format | ✅ | Country normalized to English for Firestore consistency |

### Findings

| Severity | Issue | Resolution |
|----------|-------|------------|
| 🟡 MEDIUM | Original dropdown positioning used dropdown ref (race condition) | Updated to use button ref |
| 🟢 LOW | Magic number 220px | Added named constants |

### Notes

- `findCountry()` at `locationService.ts:673` handles Spanish/English/code matching - correct function to use
- Both fixes are localized, no new patterns introduced
- Test coverage requirements are appropriate

---

## Tasks

### Bug 1: Country Normalization
1. [x] Add `findCountry` import to `utils.ts`
2. [x] Update `parseLocationResult` to normalize country names to English
3. [x] Add unit tests for country normalization (Spanish input, English output)

### Bug 2: Currency Dropdown Positioning
4. [x] Add `buttonRef` to CurrencyTag button element
5. [x] Add positioning constants (`DROPDOWN_WIDTH`, `MIN_SPACE_REQUIRED`)
6. [x] Implement `getDropdownPosition()` using button ref
7. [x] Apply dynamic positioning class to dropdown
8. [x] Add unit tests for dropdown positioning logic

### Verification
9. [x] Run full test suite
10. [x] Manual verification: scan receipt with foreign country → verify dropdown selection
11. [x] Manual verification: position currency tag near right edge → verify dropdown stays visible

---

## Dev Agent Record

### Implementation Notes

**Bug 1 Fix: Country Normalization**
- Added import for `findCountry` from `@/services/locationService`
- Added normalization step at start of `parseLocationResult` that converts Spanish/English/code to English name
- `findCountry()` handles case-insensitive matching for all supported formats
- Added 5 unit tests covering Spanish→English normalization, English passthrough, code normalization, unknown country handling

**Bug 2 Fix: Currency Dropdown Positioning**
- Added `buttonRef` to track button position (avoids render flash vs dropdown ref)
- Added positioning constants: `DROPDOWN_WIDTH=200`, `DROPDOWN_MARGIN=20`, `MIN_SPACE_REQUIRED=220`
- Implemented `getDropdownPosition()` that returns 'left' or 'right' based on available space
- Updated dropdown className to use dynamic positioning: `${dropdownPosition === 'right' ? 'right-0' : 'left-0'}`
- Added 4 unit tests for positioning logic (right positioning, left positioning, threshold edge cases)

### File List

**Modified:**
- src/features/scan/handlers/processScan/utils.ts (country normalization)
- src/components/CurrencyTag.tsx (dropdown positioning)
- tests/unit/features/scan/handlers/processScan/utils.test.ts (5 new tests)
- tests/unit/components/CurrencyTag.test.tsx (4 new tests)

### Change Log

| Timestamp | Action | Files |
|-----------|--------|-------|
| 2026-01-28 20:30 | Story created | From 14e-28b UI verification |
| 2026-01-28 21:15 | Bug 1 fixed | utils.ts - country normalization via findCountry() |
| 2026-01-28 21:15 | Bug 2 fixed | CurrencyTag.tsx - dynamic dropdown positioning |
| 2026-01-28 21:15 | Tests added | 9 new tests (5 country + 4 positioning) |
| 2026-01-28 21:15 | Full suite verified | 6770 tests passing |
