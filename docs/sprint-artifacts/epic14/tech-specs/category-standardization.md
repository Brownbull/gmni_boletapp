# Tech Spec: Category Standardization

**Story:** Derived from Story 14.14b debugging
**Author:** Claude Code
**Date:** 2026-01-06
**Status:** Draft

---

## Problem Statement

The application has **three different category type systems** that are out of sync, causing:
1. Filter navigation failures (Analytics → History shows 0 transactions)
2. Inconsistent data in Firestore
3. Translation/display issues

### Root Cause

When Gemini AI extracts categories from receipts, it uses the categories defined in `shared/prompts/types.ts`. But the application's filtering and display logic uses categories from `src/types/transaction.ts`. These don't match.

---

## Current State Analysis

### 1. Prompts (Gemini AI Input) - `shared/prompts/types.ts`

```typescript
// Store Categories (14 values)
'Supermarket' | 'Restaurant' | 'Bakery' | 'Butcher' | 'Bazaar' |
'Veterinary' | 'PetShop' | 'Medical' | 'Pharmacy' | 'Technology' |
'StreetVendor' | 'Transport' | 'Services' | 'Other'

// Item Categories (9 values) - SEVERELY LIMITED
'Fresh Food' | 'Pantry' | 'Drinks' | 'Household' | 'Personal Care' |
'Pets' | 'Electronics' | 'Apparel' | 'Other'
```

### 2. Transaction Types - `src/types/transaction.ts`

```typescript
// Store Categories (32 values)
'Supermarket' | 'Restaurant' | 'Bakery' | 'Butcher' | 'StreetVendor' |
'Pharmacy' | 'Medical' | 'Veterinary' | 'HealthBeauty' | 'Bazaar' |
'Clothing' | 'Electronics' | 'HomeGoods' | 'Furniture' | 'Hardware' |
'GardenCenter' | 'PetShop' | 'BooksMedia' | 'OfficeSupplies' |
'SportsOutdoors' | 'ToysGames' | 'Jewelry' | 'Optical' | 'Automotive' |
'GasStation' | 'Transport' | 'Services' | 'BankingFinance' | 'Education' |
'TravelAgency' | 'HotelLodging' | 'Entertainment' | 'CharityDonation' | 'Other'

// Item Categories (32 values)
'Produce' | 'Meat & Seafood' | 'Bakery' | 'Dairy & Eggs' | 'Pantry' |
'Frozen Foods' | 'Snacks' | 'Beverages' | 'Alcohol' | 'Health & Beauty' |
'Personal Care' | 'Pharmacy' | 'Supplements' | 'Baby Products' |
'Cleaning Supplies' | 'Household' | 'Pet Supplies' | 'Clothing' |
'Electronics' | 'Hardware' | 'Garden' | 'Automotive' | 'Sports & Outdoors' |
'Toys & Games' | 'Books & Media' | 'Office & Stationery' | 'Crafts & Hobbies' |
'Furniture' | 'Service' | 'Tax & Fees' | 'Tobacco' | 'Other'
```

### Category Mismatch Table

| Prompt Category | Transaction Type | Status |
|-----------------|------------------|--------|
| `Fresh Food` | `Produce`, `Meat & Seafood`, `Dairy & Eggs` | **MISMATCH** - 1:many |
| `Drinks` | `Beverages` | **MISMATCH** - different name |
| `Pets` | `Pet Supplies` | **MISMATCH** - different name |
| `Apparel` | `Clothing` | **MISMATCH** - different name |
| `Personal Care` | `Personal Care` | OK |
| `Household` | `Household`, `Cleaning Supplies` | **MISMATCH** - 1:many |
| `Pantry` | `Pantry` | OK |
| `Electronics` | `Electronics` | OK |
| `Other` | `Other` | OK |
| *(missing)* | `Frozen Foods`, `Snacks`, `Alcohol`, `Health & Beauty`, `Pharmacy`, `Supplements`, `Baby Products`, `Hardware`, `Garden`, `Automotive`, `Sports & Outdoors`, `Toys & Games`, `Books & Media`, `Office & Stationery`, `Crafts & Hobbies`, `Furniture`, `Service`, `Tax & Fees`, `Tobacco` | **19 MISSING** |

---

## Solution Design

### Principle: Single Source of Truth

**Database and code use English category values. Translation happens ONLY at UI layer.**

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SINGLE SOURCE OF TRUTH                        │
│              shared/prompts/types.ts (canonical)                 │
│                                                                  │
│  StoreCategory (32 values) ←────────────────────────────────────┐
│  ItemCategory (32 values)  ←───────────────────────────────────┐│
└─────────────────────────────────────────────────────────────────┘│
         │                                                         │
         │ import                                                   │
         ▼                                                         │
┌─────────────────────┐     ┌─────────────────────┐                │
│ src/types/          │     │ functions/src/      │                │
│ transaction.ts      │     │ prompts/            │                │
│                     │     │                     │                │
│ re-exports types    │     │ imports for         │                │
│ from shared/        │     │ Gemini prompt       │                │
└─────────────────────┘     └─────────────────────┘                │
         │                           │                             │
         ▼                           ▼                             │
┌─────────────────────┐     ┌─────────────────────┐                │
│ src/config/         │     │ functions/src/      │                │
│ categoryColors.ts   │     │ analyzeReceipt.ts   │                │
│                     │     │                     │                │
│ imports types,      │     │ Gemini returns      │────────────────┘
│ defines colors      │     │ English categories  │
└─────────────────────┘     └─────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                         UI LAYER                                 │
│                                                                  │
│  categoryTranslations.ts - translateCategory(name, locale)       │
│  - 'Produce' → 'Frutas y Verduras' (es)                         │
│  - 'Meat & Seafood' → 'Carnes y Mariscos' (es)                  │
│                                                                  │
│  Display components call translateCategory() before rendering    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Update Prompt Types (BREAKING - requires prompt version bump)

**File: `shared/prompts/types.ts`**

```typescript
/**
 * Store categories - CANONICAL SOURCE
 * All other files should import from here
 */
export type StoreCategory =
  // Food & Dining
  | 'Supermarket' | 'Restaurant' | 'Bakery' | 'Butcher' | 'StreetVendor'
  // Health & Wellness
  | 'Pharmacy' | 'Medical' | 'Veterinary' | 'HealthBeauty'
  // Retail - General
  | 'Bazaar' | 'Clothing' | 'Electronics' | 'HomeGoods' | 'Furniture'
  | 'Hardware' | 'GardenCenter'
  // Retail - Specialty
  | 'PetShop' | 'BooksMedia' | 'OfficeSupplies' | 'SportsOutdoors'
  | 'ToysGames' | 'Jewelry' | 'Optical'
  // Automotive & Transport
  | 'Automotive' | 'GasStation' | 'Transport'
  // Services & Finance
  | 'Services' | 'BankingFinance' | 'Education' | 'TravelAgency'
  // Hospitality & Entertainment
  | 'HotelLodging' | 'Entertainment'
  // Other
  | 'CharityDonation' | 'Other';

/**
 * Item categories - CANONICAL SOURCE
 * All other files should import from here
 */
export type ItemCategory =
  // Food - Fresh
  | 'Produce' | 'Meat & Seafood' | 'Bakery' | 'Dairy & Eggs'
  // Food - Packaged
  | 'Pantry' | 'Frozen Foods' | 'Snacks' | 'Beverages' | 'Alcohol'
  // Health & Personal
  | 'Health & Beauty' | 'Personal Care' | 'Pharmacy' | 'Supplements' | 'Baby Products'
  // Household
  | 'Cleaning Supplies' | 'Household' | 'Pet Supplies'
  // Non-Food Retail
  | 'Clothing' | 'Electronics' | 'Hardware' | 'Garden' | 'Automotive'
  | 'Sports & Outdoors' | 'Toys & Games' | 'Books & Media' | 'Office & Stationery'
  | 'Crafts & Hobbies' | 'Furniture'
  // Services & Fees
  | 'Service' | 'Tax & Fees' | 'Tobacco'
  // Catch-all
  | 'Other';

export const STORE_CATEGORIES: StoreCategory[] = [
  'Supermarket', 'Restaurant', 'Bakery', 'Butcher', 'StreetVendor',
  'Pharmacy', 'Medical', 'Veterinary', 'HealthBeauty',
  'Bazaar', 'Clothing', 'Electronics', 'HomeGoods', 'Furniture', 'Hardware', 'GardenCenter',
  'PetShop', 'BooksMedia', 'OfficeSupplies', 'SportsOutdoors', 'ToysGames', 'Jewelry', 'Optical',
  'Automotive', 'GasStation', 'Transport',
  'Services', 'BankingFinance', 'Education', 'TravelAgency',
  'HotelLodging', 'Entertainment',
  'CharityDonation', 'Other',
];

export const ITEM_CATEGORIES: ItemCategory[] = [
  'Produce', 'Meat & Seafood', 'Bakery', 'Dairy & Eggs',
  'Pantry', 'Frozen Foods', 'Snacks', 'Beverages', 'Alcohol',
  'Health & Beauty', 'Personal Care', 'Pharmacy', 'Supplements', 'Baby Products',
  'Cleaning Supplies', 'Household', 'Pet Supplies',
  'Clothing', 'Electronics', 'Hardware', 'Garden', 'Automotive',
  'Sports & Outdoors', 'Toys & Games', 'Books & Media', 'Office & Stationery',
  'Crafts & Hobbies', 'Furniture',
  'Service', 'Tax & Fees', 'Tobacco',
  'Other',
];
```

**File: `shared/prompts/base.ts`**

Update to import from types.ts instead of defining inline.

### Phase 2: Update Transaction Types

**File: `src/types/transaction.ts`**

```typescript
// Re-export from canonical source
export type { StoreCategory, ItemCategory } from '../../shared/prompts/types';

// Or keep local but with comment:
// IMPORTANT: Must match shared/prompts/types.ts exactly
```

### Phase 3: Create New Prompt Version

**File: `shared/prompts/v3-category-standardization.ts`**

Create a new prompt version that uses the expanded category list. Include mapping hints for Gemini.

### Phase 4: Migration Script

**File: `scripts/admin/migrate-categories.ts`**

```typescript
const LEGACY_TO_STANDARD: Record<string, string> = {
  // Item categories
  'Fresh Food': 'Produce',  // Most common mapping
  'Drinks': 'Beverages',
  'Pets': 'Pet Supplies',
  'Apparel': 'Clothing',

  // Store categories
  'Technology': 'Electronics',
};

async function migrateTransactionCategories(userId: string) {
  // 1. Fetch all transactions
  // 2. For each transaction:
  //    - Map tx.category if in LEGACY_TO_STANDARD
  //    - Map each item.category if in LEGACY_TO_STANDARD
  // 3. Batch update
}
```

### Phase 5: Validate Existing Functions

Ensure these files use the canonical types:
- `src/config/categoryColors.ts` - imports from transaction.ts
- `src/utils/categoryMatcher.ts` - uses StoreCategory/ItemCategory
- `src/views/ScanResultView.tsx` - category dropdowns
- `src/views/EditView.tsx` - category editing

---

## Migration Strategy

### For Existing Users

1. **Non-breaking approach**: Add mapping layer that normalizes legacy categories at read time
2. **Background migration**: Gradually update Firestore documents
3. **New scans**: Use new prompt with correct categories

### Legacy Category Normalization

```typescript
// src/utils/categoryNormalizer.ts
export function normalizeItemCategory(category: string): ItemCategory {
  const LEGACY_MAP: Record<string, ItemCategory> = {
    'Fresh Food': 'Produce',
    'Drinks': 'Beverages',
    'Pets': 'Pet Supplies',
    'Apparel': 'Clothing',
  };
  return LEGACY_MAP[category] || (category as ItemCategory);
}
```

Apply in:
- `computeItemCategoryData()` in TrendsView.tsx
- `matchesCategoryFilter()` in historyFilterUtils.ts
- Any place reading `item.category` from Firestore

---

## Testing Plan

1. **Unit tests**: Verify type compatibility between all category definitions
2. **Integration tests**: Scan → Save → Filter → Display flow
3. **Migration tests**: Legacy data properly normalized
4. **UI tests**: Translations display correctly for all 32 categories

---

## Files to Modify

| File | Change |
|------|--------|
| `shared/prompts/types.ts` | Expand to 32+32 categories |
| `shared/prompts/base.ts` | Import from types.ts |
| `src/types/transaction.ts` | Re-export or sync with shared |
| `src/utils/categoryNormalizer.ts` | NEW - normalize legacy values |
| `src/views/TrendsView.tsx` | Apply normalizer in computeItemCategoryData |
| `src/utils/historyFilterUtils.ts` | Apply normalizer in filter matching |
| `functions/src/prompts/*` | Sync with shared prompts |

---

## Rollout Plan

1. **Phase 1**: Create normalizer, apply at read time (no data change)
2. **Phase 2**: Update prompts, deploy new Cloud Function
3. **Phase 3**: Run background migration for existing data
4. **Phase 4**: Remove normalizer after migration complete

---

## Success Criteria

- [ ] Clicking transaction count in Analytics navigates to History with correct filtered results
- [ ] All 32 item categories display correctly in Analytics views
- [ ] New scans use standardized English categories
- [ ] Legacy data displays correctly through normalizer
- [ ] No TypeScript errors from category type mismatches
