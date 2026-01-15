# Story 14.44: Category Statistics Popup Data Fix

## Status: Ready for Dev

> **Created:** 2026-01-14
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

### Suspected Root Cause
Category name mismatch between display data and filtering logic:

1. **Transactions store categories in English**: `tx.category = "Supermarket"`
2. **Display uses translated names**: TreemapCell shows "Supermercado"
3. **Statistics hook receives category name**: `useCategoryStatistics({ categoryName: "???" })`
4. **Filtering compares directly**: `tx.category === categoryName`

If `categoryName` is passed as the translated (Spanish) name but `tx.category` stores English, the filter returns no matches → null statistics → "Sin Datos"

### Key Code Paths

**Click handler flow:**
```
TreemapCell → onIconClick(data.name, emoji, color) → handleOpenStatsPopup()
                    ↓
           useCategoryStatistics({ categoryName: data.name })
                    ↓
           tx.category === categoryName  // Must match!
```

**Files to investigate:**
- `src/views/TrendsView.tsx` - `handleOpenStatsPopup`, `computeAllCategoryData`
- `src/hooks/useCategoryStatistics.ts` - `transactionMatchesCategory`
- `src/utils/categoryTranslations.ts` - Translation utilities

---

## Acceptance Criteria

### AC #1: Diagnose Root Cause
- [ ] Add console logging to trace category names through the flow
- [ ] Verify what format `data.name` is in when passed to `handleOpenStatsPopup`
- [ ] Confirm whether mismatch is Spanish→English or something else
- [ ] Document findings

### AC #2: Fix Category Matching
- [ ] Ensure `useCategoryStatistics` receives the correct (English) category name
- [ ] OR update filtering logic to handle both English and Spanish names
- [ ] Test with "Supermercado", "Comida Preparada", and other affected categories

### AC #3: Verify All Categories Work
- [ ] Test store-categories view (all 32 store categories)
- [ ] Test item-categories view (all 39 item categories)
- [ ] Test store-groups view (8 groups)
- [ ] Test item-groups view (7 groups)
- [ ] Verify statistics display correctly for each

### AC #4: No Regression
- [ ] Existing working categories still work
- [ ] "View History" navigation still works
- [ ] Statistics values are accurate

---

## Technical Investigation

### Data Flow Analysis

```
Transaction Data:
  tx.category = "Supermarket"  // English (schema enforced)

computeAllCategoryData():
  categoryMap["Supermarket"] = { value: ..., count: ... }

categoryData[].name:
  "Supermarket"  // Should be English

TreemapCell receives:
  data.name = "Supermarket"  // Check this!

onIconClick calls:
  handleOpenStatsPopup("Supermarket", emoji, color)  // Check this!

useCategoryStatistics filters:
  tx.category === "Supermarket"  // This should match
```

### Potential Fix Locations

1. **If `data.name` is translated somewhere**: Fix the translation point
2. **If passed correctly but filtered wrong**: Fix `transactionMatchesCategory`
3. **If edge case with special characters**: Normalize category names

### Debug Steps

```typescript
// In handleOpenStatsPopup (TrendsView.tsx ~line 4493)
console.log('Stats popup - received categoryName:', categoryName);

// In useCategoryStatistics (before filtering)
console.log('Stats hook - categoryName:', categoryName);
console.log('Stats hook - first tx.category:', transactions[0]?.category);
```

---

## Tasks

### Phase 1: Investigation
- [ ] Task 1.1: Add debug logging to trace category name through flow
- [ ] Task 1.2: Click "Supermercado" and capture logs
- [ ] Task 1.3: Click a working category and compare logs
- [ ] Task 1.4: Document the mismatch (if any)

### Phase 2: Fix
- [ ] Task 2.1: Implement fix based on investigation findings
- [ ] Task 2.2: Test all affected categories
- [ ] Task 2.3: Verify statistics values are correct

### Phase 3: Verification
- [ ] Task 3.1: Test all 32 store categories
- [ ] Task 3.2: Test item-level categories
- [ ] Task 3.3: Test group-level views
- [ ] Task 3.4: Remove debug logging

---

## File List

| File | Action | Purpose |
|------|--------|---------|
| `src/views/TrendsView.tsx` | Modify | Fix category name handling in handleOpenStatsPopup |
| `src/hooks/useCategoryStatistics.ts` | Possibly modify | Potentially add normalization |
| `tests/unit/hooks/useCategoryStatistics.test.ts` | Modify | Add test for translated category names |

---

## Estimated Effort

| Phase | Estimate |
|-------|----------|
| Phase 1: Investigation | 1 pt |
| Phase 2: Fix | 1 pt |
| Phase 3: Verification | 1 pt |
| **Total** | **3 pts** |

---

## Related Stories

- Story 14.40: Category Statistics Popup (original implementation)
- Story 14.21: Category Color Consolidation (category color mapping)

---

## Notes

### Category Name Formats

**English (stored in Firestore):**
- `Supermarket`, `Restaurant`, `Pharmacy`

**Spanish (displayed to user):**
- `Supermercado`, `Restaurante`, `Farmacia`

### Translation Utilities

- `translateCategory(englishName, locale)` → Spanish display name
- `getCategoryEmoji(englishName)` → Emoji for category
- Categories should always be stored/filtered in English

### Edge Cases to Consider

1. **"Otro"/"Other"** - Special aggregated category
2. **"Más"/"More"** - Aggregated small categories
3. **Item categories with spaces**: "Meat & Seafood", "Prepared Food"
4. **Group keys**: "food-dining", "health-personal" (kebab-case)
