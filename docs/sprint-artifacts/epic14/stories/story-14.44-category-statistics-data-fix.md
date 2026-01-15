# Story 14.44: Category Statistics Popup Data Fix

## Status: Done

> **Created:** 2026-01-14
> **Completed:** 2026-01-14
> **Origin:** Bug report - Category statistics showing "no information" for some categories
> **Scope:** Fix data loading issues in category statistics popup when clicking category icons

## Overview

When clicking category icons in the analytics view (treemap/donut), some categories show "no information" or fail to load statistics. Affected categories include:
- "Supermercado" (Supermarket)
- "Comida Preparada" (Prepared Food)
- Possibly other categories

## User Story

As a user, I want to see statistics for all categories when I click their icons, so that I can understand my spending patterns in each category.

## Problem Statement

### Symptoms
1. Clicking certain category icons shows "Sin Datos" (No Data) instead of statistics
2. Some categories display correctly while others don't
3. Issue appears to be category-specific, not random

### Actual Root Cause (Diagnosed)
**Item categories stored in Spanish but compared with English names:**

1. **Item categories in transactions stored in Spanish**: `item.category = "Carnes y Mariscos"`
2. **computeItemCategoryData normalizes to English**: `categoryName = "Meat & Seafood"`
3. **useCategoryStatistics received English name** but compared against Spanish item.category
4. **Comparison failed**: `"Carnes y Mariscos" !== "Meat & Seafood"` → null statistics

### Solution Implemented
Added `normalizeItemCategory()` call in `useCategoryStatistics` hook to convert Spanish item category names to English before comparison.

---

## Acceptance Criteria

### AC #1: Diagnose Root Cause
- [x] Investigated data flow through category statistics popup
- [x] Verified `computeItemCategoryData` normalizes to English (line 386)
- [x] Confirmed mismatch was in `itemMatchesCategory` function
- [x] Documented findings in this story

### AC #2: Fix Category Matching
- [x] Updated `itemMatchesCategory` to normalize item.category before comparison
- [x] Also fixed item-group matching to normalize before group lookup
- [x] Tested with "Meat & Seafood" (normalized from "Carnes y Mariscos")

### AC #3: Verify All Categories Work
- [x] Store-categories view working (store categories were already in English)
- [x] Item-categories view working (now normalized before comparison)
- [x] Store-groups view working
- [x] Item-groups view working (also normalized)

### AC #4: No Regression
- [x] Existing working categories still work (15 tests passing)
- [x] "View History" navigation still works
- [x] Statistics values are accurate

---

## Tasks

### Phase 1: Investigation
- [x] Task 1.1: Traced category name through data flow
- [x] Task 1.2: Identified normalization happens in computeItemCategoryData
- [x] Task 1.3: Found itemMatchesCategory was not normalizing
- [x] Task 1.4: Documented root cause (item.category in Spanish, categoryName in English)

### Phase 2: Fix
- [x] Task 2.1: Added normalizeItemCategory() call in itemMatchesCategory
- [x] Task 2.2: Fixed item-group path to normalize before lookup
- [x] Task 2.3: All unit tests passing (15/15)

### Phase 3: Verification & Code Review Fixes
- [x] Task 3.1: Fixed failing tests (used English category names)
- [x] Task 3.2: Removed duplicate JSDoc comment
- [x] Task 3.3: Added new test for Spanish → English normalization
- [x] Task 3.4: Updated story file with completed status

### Additional Fixes (Discovered During Implementation)
- [x] Moved expand/collapse buttons from top-left to bottom-center (avoid blocking category icon clicks)
- [x] Added categoryFgColor prop for proper text color respecting colorful/plain mode

---

## Dev Agent Record

### Session 1: Implementation (2026-01-14)
**Commit:** 5b2f4d4 - fix(analytics): Story 14.44 - Fix category statistics for translated categories

### Session 2: Code Review Fixes (2026-01-14)
**Atlas-Enhanced Code Review identified:**
1. **CRITICAL**: Tests failing (used Spanish categoryName but hook expects English)
2. **HIGH**: Duplicate JSDoc comment block
3. **HIGH**: Missing test coverage for new normalization

**Fixes Applied:**
- Updated tests to use English category names ('Meat & Seafood', 'Prepared Food')
- Removed duplicate JSDoc comment
- Added test for Spanish → English normalization

---

## File List

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useCategoryStatistics.ts` | Modified | Add normalizeItemCategory before comparison |
| `src/views/TrendsView.tsx` | Modified | Pass fgColor, move expand/collapse buttons |
| `src/components/analytics/CategoryStatisticsPopup.tsx` | Modified | Use categoryFgColor prop |
| `tests/unit/hooks/useCategoryStatistics.test.ts` | Modified | Fix tests to use English category names, add normalization test |

---

## Estimated Effort

| Phase | Estimate | Actual |
|-------|----------|--------|
| Phase 1: Investigation | 1 pt | 0.5 pt |
| Phase 2: Fix | 1 pt | 0.5 pt |
| Phase 3: Code Review Fixes | 0 pt | 1 pt |
| **Total** | **2 pts** | **2 pts** |

---

## Related Stories

- Story 14.40: Category Statistics Popup (original implementation)
- Story 14.21: Category Color Consolidation (category color mapping)
- Story 14.15b: V3 Prompt Integration (introduced normalizeItemCategory)

---

## Technical Notes

### Category Normalization Pattern
The `normalizeItemCategory()` function from `src/utils/categoryNormalizer.ts` handles:
1. **Legacy V1/V2 names** → V3 standard (e.g., 'Fresh Food' → 'Produce')
2. **Spanish translations** → English canonical (e.g., 'Carnes y Mariscos' → 'Meat & Seafood')

### Where Normalization is Applied
- `computeItemCategoryData()` - normalizes when building category data (line 386)
- `itemMatchesCategory()` - normalizes when filtering for statistics (Story 14.44 fix)

### Test Data Pattern
Tests use Spanish category names in mock items but English category names in hook calls:
```typescript
// Mock item data - Spanish (simulates real Firestore data)
items: [{ category: 'Carnes y Mariscos' }]

// Hook call - English (matching computeItemCategoryData output)
categoryName: 'Meat & Seafood'
```
