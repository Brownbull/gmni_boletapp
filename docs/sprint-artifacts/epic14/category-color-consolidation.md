# Category Color Consolidation - Technical Design Document

**Date:** 2026-01-04
**Epic:** 14 - Core Implementation
**Type:** Technical Debt / Design System Consolidation
**Status:** Planning

---

## Executive Summary

During Story 14.14 (Transaction List Redesign) implementation, we identified **inconsistent category color definitions** across the codebase. Transaction cards use hardcoded hex colors that don't respond to theme changes, while analytics components use CSS custom properties that are theme-aware.

This document outlines the plan to consolidate all category colors into a single source of truth with full theme support:
- **3 themes:** Normal (Ni No Kuni), Professional Blue, Mono
- **2 modes:** Light and Dark
- **64 categories:** 32 store + 32 item categories
- **Total color definitions:** 64 categories × 6 variations × 2 (fg/bg) = **768 color values**

---

## Current State Analysis

### Problem Statement

Two separate color systems exist that aren't aligned:

| System | Location | Theme-Aware? | Used By |
|--------|----------|--------------|---------|
| CSS Custom Properties | `index.html` + `colors.ts` | Yes | Analytics, CategoryBadge, legends |
| Hardcoded Hex Colors | `TransactionCard.tsx:98-156` | No | Transaction list badges |

### Files With Category Color Definitions

#### 1. `src/utils/colors.ts` (lines 79-106)
- Maps only **14 categories** to chart color indices 1-6
- Uses CSS custom properties (theme-aware)
- Falls back to deterministic hash for unknown categories

```typescript
const CATEGORY_COLOR_INDEX: Record<string, number> = {
  Supermarket: 1, Restaurant: 3, Bakery: 3, Butcher: 4,
  Bazaar: 5, Veterinary: 2, PetShop: 2, Medical: 5,
  Pharmacy: 5, Technology: 1, StreetVendor: 4, Transport: 2,
  Services: 1, Other: 6,
  'Fresh Food': 2, 'Pantry': 3, 'Drinks': 1, 'Household': 5,
  'Personal Care': 4, 'Pets': 2,
  Food: 1, Housing: 3, Entertainment: 4,
};
```

#### 2. `src/components/history/TransactionCard.tsx` (lines 98-156)
- `categoryBadgeBackgrounds` object with **45+ hardcoded hex colors**
- Light mode only (no dark mode support)
- No theme awareness (same colors in Normal/Professional/Mono)

```typescript
const categoryBadgeBackgrounds: Record<string, string> = {
  'Supermarket': '#dcfce7',  // green-100
  'Restaurant': '#fee2e2',   // red-100
  'Transport': '#dbeafe',    // blue-100
  // ... 42 more entries
};
```

#### 3. `index.html` (lines 16-178)
- Defines `--chart-1` through `--chart-6` for 3 themes × 2 modes
- No category-specific CSS variables

### Color Inconsistencies Found

| Category | colors.ts Index | TransactionCard Hex | Aligned? |
|----------|-----------------|---------------------|----------|
| Supermarket | 1 (blue-ish) | #dcfce7 (green) | ❌ No |
| Restaurant | 3 (amber) | #fee2e2 (red) | ❌ No |
| Transport | 2 (green) | #dbeafe (blue) | ❌ No |
| PetShop | 2 (green) | #fef3c7 (amber) | ❌ No |

---

## Category Inventories

### Store Categories (32 total) - from `src/types/transaction.ts`

| Group | Categories |
|-------|------------|
| Food & Dining | Supermarket, Restaurant, Bakery, Butcher, StreetVendor |
| Health & Wellness | Pharmacy, Medical, Veterinary, HealthBeauty |
| Retail - General | Bazaar, Clothing, Electronics, HomeGoods, Furniture, Hardware, GardenCenter |
| Retail - Specialty | PetShop, BooksMedia, OfficeSupplies, SportsOutdoors, ToysGames, Jewelry, Optical |
| Automotive | Automotive, GasStation, Transport |
| Services | Services, BankingFinance, Education, TravelAgency |
| Hospitality | HotelLodging, Entertainment |
| Other | CharityDonation, Other |

### Item Categories (32 total) - from `src/types/transaction.ts`

| Group | Categories |
|-------|------------|
| Food - Fresh | Produce, Meat & Seafood, Bakery, Dairy & Eggs |
| Food - Packaged | Pantry, Frozen Foods, Snacks, Beverages, Alcohol |
| Health & Personal | Health & Beauty, Personal Care, Pharmacy, Supplements, Baby Products |
| Household | Cleaning Supplies, Household, Pet Supplies |
| Non-Food Retail | Clothing, Electronics, Hardware, Garden, Automotive, Sports & Outdoors, Toys & Games, Books & Media, Office & Stationery, Crafts & Hobbies, Furniture |
| Services & Fees | Service, Tax & Fees, Tobacco |
| Other | Other |

---

## Proposed Solution

### Architecture

Create a unified color configuration system:

```
src/config/categoryColors.ts (NEW)
├── Types
│   ├── ThemeName = 'normal' | 'professional' | 'mono'
│   ├── ModeName = 'light' | 'dark'
│   ├── CategoryColorSet = { fg: string; bg: string }
│   └── CategoryColors = Record<ThemeName, Record<ModeName, CategoryColorSet>>
├── Constants
│   ├── STORE_CATEGORY_COLORS: Record<StoreCategory, CategoryColors>
│   └── ITEM_CATEGORY_COLORS: Record<ItemCategory, CategoryColors>
└── Functions
    ├── getCategoryColor(category, theme, mode) → string (foreground)
    ├── getCategoryBackground(category, theme, mode) → string (background)
    └── getCategoryColorSet(category, theme, mode) → CategoryColorSet
```

### Color Definition Structure

```typescript
type ThemeName = 'normal' | 'professional' | 'mono';
type ModeName = 'light' | 'dark';

interface CategoryColorSet {
  fg: string;  // Foreground color (icons, text on light bg)
  bg: string;  // Background color (badges, pills)
}

type CategoryColors = Record<ThemeName, Record<ModeName, CategoryColorSet>>;

// Example for Supermarket:
const SUPERMARKET_COLORS: CategoryColors = {
  normal: {
    light: { fg: '#15803d', bg: '#dcfce7' },  // green-700, green-100
    dark:  { fg: '#86efac', bg: '#14532d' },  // green-300, green-900
  },
  professional: {
    light: { fg: '#16a34a', bg: '#dcfce7' },  // green-600, green-100
    dark:  { fg: '#4ade80', bg: '#166534' },  // green-400, green-800
  },
  mono: {
    light: { fg: '#18181b', bg: '#e4e4e7' },  // zinc-900, zinc-200
    dark:  { fg: '#e4e4e7', bg: '#3f3f46' },  // zinc-200, zinc-700
  },
};
```

### Color Palette Strategy

Each category is assigned to a **semantic color group** based on its meaning:

| Color Group | Hue Range | Store Categories | Item Categories |
|-------------|-----------|------------------|-----------------|
| **Green** | 120-160 | Supermarket, Veterinary, GardenCenter, CharityDonation, SportsOutdoors | Produce, Dairy & Eggs, Pet Supplies, Garden, Sports & Outdoors |
| **Blue** | 200-240 | Technology, Services, BankingFinance, Education, Transport, BooksMedia, OfficeSupplies, Optical | Electronics, Books & Media, Office & Stationery |
| **Amber/Orange** | 30-50 | Restaurant, Bakery, StreetVendor, GasStation | Pantry, Snacks, Beverages, Frozen Foods |
| **Red/Rose** | 0-20, 340-360 | Butcher, Pharmacy, Medical, HealthBeauty, Clothing | Meat & Seafood, Health & Beauty, Personal Care, Pharmacy, Baby Products, Clothing |
| **Purple/Violet** | 260-300 | Bazaar, Jewelry, Entertainment, ToysGames | Alcohol, Crafts & Hobbies, Toys & Games |
| **Teal/Cyan** | 170-190 | HomeGoods, Furniture, Hardware, HotelLodging | Cleaning Supplies, Household, Furniture, Hardware |
| **Slate/Gray** | N/A | Other, Automotive, TravelAgency | Other, Tax & Fees, Service, Tobacco, Automotive |
| **Pink** | 320-340 | PetShop, Supplements | Supplements |

### Theme Variations

#### Normal Theme (Ni No Kuni/Studio Ghibli)
- **Feel:** Warm, muted, hand-painted, earthy
- **Saturation:** Lower (60-75%)
- **Light mode FG:** Darker shades (600-800)
- **Light mode BG:** Very light pastels (50-100)
- **Dark mode FG:** Lighter, slightly desaturated (300-400)
- **Dark mode BG:** Deep, muted (800-950)

#### Professional Theme (Slate Blue)
- **Feel:** Clean, high-contrast, corporate
- **Saturation:** Higher (80-100%)
- **Light mode FG:** Pure color (500-600)
- **Light mode BG:** Light tints (100-200)
- **Dark mode FG:** Bright but not neon (400-500)
- **Dark mode BG:** Rich dark (700-800)

#### Mono Theme (Grayscale)
- **Feel:** Minimal, elegant, neutral
- **Saturation:** 0% (pure grayscale)
- **Light mode FG:** Zinc 900-600 (darker)
- **Light mode BG:** Zinc 200-300 (light)
- **Dark mode FG:** Zinc 200-400 (light)
- **Dark mode BG:** Zinc 700-800 (dark)
- **Differentiation:** By lightness only

---

## Implementation Plan

### Phase 1: Create Configuration File

**Create `src/config/categoryColors.ts`**

1. Define TypeScript types (`ThemeName`, `ModeName`, `CategoryColorSet`, etc.)
2. Create `STORE_CATEGORY_COLORS` constant with all 32 store categories
3. Create `ITEM_CATEGORY_COLORS` constant with all 32 item categories
4. Implement `getCategoryColor(category, theme, mode)` function
5. Implement `getCategoryBackground(category, theme, mode)` function
6. Implement `getCategoryColorSet(category, theme, mode)` function
7. Add backward-compatible export for `colors.ts` usage

**Estimated effort:** 2-3 hours
**Lines:** ~600

### Phase 2: Migrate TransactionCard

**Modify `src/components/history/TransactionCard.tsx`**

1. Remove `categoryBadgeBackgrounds` object (60 lines deleted)
2. Import `getCategoryBackground` from new config
3. Get theme and mode from props or context
4. Update `CategoryBadge` to use `getCategoryBackground(category, theme, mode)`
5. Update any inline color references

**Estimated effort:** 30 minutes

### Phase 3: Migrate colors.ts

**Modify `src/utils/colors.ts`**

1. Import category colors from new config
2. Update `getColor()` to use new config
3. Deprecate `CATEGORY_COLOR_INDEX` (or redirect)
4. Keep `getChartColor()` for chart-specific needs (unchanged)

**Estimated effort:** 30 minutes

### Phase 4: Verify Other Components

**Check and update if needed:**
- `src/components/history/IconFilterBar.tsx`
- `src/components/CategoryBadge.tsx`
- `src/components/analytics/CategoryLegend.tsx`
- `src/components/analytics/DrillDownCard.tsx`

**Estimated effort:** 1 hour

### Phase 5: Testing

1. Create unit tests for `categoryColors.ts`
   - Test all getter functions
   - Test fallback behavior for unknown categories
   - Test all 6 theme/mode combinations
2. Visual regression testing
   - Screenshot comparison across themes
   - Verify same category = same color everywhere
3. Accessibility testing
   - WCAG AA contrast ratio (4.5:1) for text
   - Colorblind simulation

**Estimated effort:** 1-2 hours

---

## File Changes Summary

| File | Action | Lines |
|------|--------|-------|
| `src/config/categoryColors.ts` | CREATE | +600 |
| `src/components/history/TransactionCard.tsx` | MODIFY | -60, +10 |
| `src/utils/colors.ts` | MODIFY | ~30 lines updated |
| `src/components/history/IconFilterBar.tsx` | VERIFY | Maybe minor updates |
| `src/components/CategoryBadge.tsx` | VERIFY | Maybe minor updates |
| `tests/unit/config/categoryColors.test.ts` | CREATE | +150 |

**Total estimated lines:** +750 new, -60 removed

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Visual regression | Medium | Screenshot comparison, manual QA before deploy |
| Color contrast issues | High | WCAG checker tool, test with contrast analyzer |
| Breaking analytics colors | Medium | Keep `getChartColor()` unchanged, gradual migration |
| Increased bundle size | Low | Tree-shakeable exports, only load used colors |
| Inconsistent theme detection | Medium | Add `useTheme()` hook if not already available |

---

## Success Criteria

1. ✅ All category colors defined in single file (`src/config/categoryColors.ts`)
2. ✅ Same category shows same color across ALL screens
3. ✅ Colors change correctly when theme changes (Normal → Professional → Mono)
4. ✅ Colors change correctly when mode changes (Light ↔ Dark)
5. ✅ All existing tests pass
6. ✅ No visual regressions
7. ✅ WCAG AA contrast ratio met (4.5:1)

---

## Appendix A: Complete Store Category Color Assignments

### Normal Theme (Ni No Kuni)

| Category | Light FG | Light BG | Dark FG | Dark BG |
|----------|----------|----------|---------|---------|
| Supermarket | #15803d | #dcfce7 | #86efac | #14532d |
| Restaurant | #c2410c | #ffedd5 | #fdba74 | #7c2d12 |
| Bakery | #b45309 | #fef3c7 | #fcd34d | #78350f |
| Butcher | #b91c1c | #fee2e2 | #fca5a5 | #7f1d1d |
| StreetVendor | #c2410c | #fff7ed | #fb923c | #7c2d12 |
| Pharmacy | #be185d | #fce7f3 | #f9a8d4 | #831843 |
| Medical | #9f1239 | #ffe4e6 | #fda4af | #881337 |
| Veterinary | #166534 | #dcfce7 | #86efac | #14532d |
| HealthBeauty | #a21caf | #fae8ff | #e879f9 | #701a75 |
| Bazaar | #6d28d9 | #ede9fe | #c4b5fd | #4c1d95 |
| Clothing | #be185d | #fdf2f8 | #f9a8d4 | #831843 |
| Electronics | #1e40af | #dbeafe | #93c5fd | #1e3a8a |
| HomeGoods | #0f766e | #ccfbf1 | #5eead4 | #134e4a |
| Furniture | #115e59 | #ccfbf1 | #5eead4 | #134e4a |
| Hardware | #374151 | #f3f4f6 | #d1d5db | #1f2937 |
| GardenCenter | #166534 | #dcfce7 | #86efac | #14532d |
| PetShop | #a21caf | #fdf4ff | #f0abfc | #701a75 |
| BooksMedia | #1d4ed8 | #dbeafe | #93c5fd | #1e3a8a |
| OfficeSupplies | #475569 | #f1f5f9 | #cbd5e1 | #334155 |
| SportsOutdoors | #047857 | #d1fae5 | #6ee7b7 | #064e3b |
| ToysGames | #7c3aed | #ede9fe | #c4b5fd | #5b21b6 |
| Jewelry | #6d28d9 | #f5f3ff | #c4b5fd | #4c1d95 |
| Optical | #0369a1 | #e0f2fe | #7dd3fc | #0c4a6e |
| Automotive | #374151 | #f3f4f6 | #d1d5db | #1f2937 |
| GasStation | #92400e | #fef3c7 | #fcd34d | #78350f |
| Transport | #1e40af | #dbeafe | #93c5fd | #1e3a8a |
| Services | #1e40af | #dbeafe | #93c5fd | #1e3a8a |
| BankingFinance | #1e3a8a | #dbeafe | #93c5fd | #1e3a8a |
| Education | #2563eb | #dbeafe | #93c5fd | #1e40af |
| TravelAgency | #0284c7 | #e0f2fe | #7dd3fc | #075985 |
| HotelLodging | #44403c | #f5f5f4 | #d6d3d1 | #292524 |
| Entertainment | #7c3aed | #f5f3ff | #c4b5fd | #5b21b6 |
| CharityDonation | #047857 | #d1fae5 | #6ee7b7 | #064e3b |
| Other | #64748b | #f1f5f9 | #cbd5e1 | #334155 |

*Professional and Mono theme colors to be defined similarly during implementation*

---

## Appendix B: Implementation Example

```typescript
// src/config/categoryColors.ts

import { StoreCategory, ItemCategory } from '../types/transaction';

export type ThemeName = 'normal' | 'professional' | 'mono';
export type ModeName = 'light' | 'dark';

export interface CategoryColorSet {
  fg: string;
  bg: string;
}

export type CategoryColors = Record<ThemeName, Record<ModeName, CategoryColorSet>>;

// Store category colors
export const STORE_CATEGORY_COLORS: Record<StoreCategory, CategoryColors> = {
  Supermarket: {
    normal: {
      light: { fg: '#15803d', bg: '#dcfce7' },
      dark: { fg: '#86efac', bg: '#14532d' },
    },
    professional: {
      light: { fg: '#16a34a', bg: '#dcfce7' },
      dark: { fg: '#4ade80', bg: '#166534' },
    },
    mono: {
      light: { fg: '#18181b', bg: '#e4e4e7' },
      dark: { fg: '#e4e4e7', bg: '#3f3f46' },
    },
  },
  // ... 31 more store categories
};

// Item category colors
export const ITEM_CATEGORY_COLORS: Record<ItemCategory, CategoryColors> = {
  'Produce': {
    normal: {
      light: { fg: '#15803d', bg: '#dcfce7' },
      dark: { fg: '#86efac', bg: '#14532d' },
    },
    // ...
  },
  // ... 31 more item categories
};

// Get foreground color for a category
export function getCategoryColor(
  category: string,
  theme: ThemeName = 'normal',
  mode: ModeName = 'light'
): string {
  const storeColors = STORE_CATEGORY_COLORS[category as StoreCategory];
  if (storeColors) {
    return storeColors[theme][mode].fg;
  }

  const itemColors = ITEM_CATEGORY_COLORS[category as ItemCategory];
  if (itemColors) {
    return itemColors[theme][mode].fg;
  }

  // Fallback: deterministic color from string
  return stringToColor(category);
}

// Get background color for a category
export function getCategoryBackground(
  category: string,
  theme: ThemeName = 'normal',
  mode: ModeName = 'light'
): string {
  const storeColors = STORE_CATEGORY_COLORS[category as StoreCategory];
  if (storeColors) {
    return storeColors[theme][mode].bg;
  }

  const itemColors = ITEM_CATEGORY_COLORS[category as ItemCategory];
  if (itemColors) {
    return itemColors[theme][mode].bg;
  }

  // Fallback: light gray
  return mode === 'light' ? '#f1f5f9' : '#334155';
}
```

---

## Next Steps

1. **Review and approve this plan** ← Current step
2. Create `src/config/categoryColors.ts` with all color definitions
3. Migrate `TransactionCard.tsx` to use new config
4. Migrate `colors.ts` to use new config
5. Verify other components
6. Write tests
7. Deploy and verify
