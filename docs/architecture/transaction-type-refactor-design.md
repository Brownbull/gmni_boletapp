# Transaction Type Refactoring Design

> **Status:** DRAFT
> **Story:** 15b-4a
> **Date:** 2026-02-28
> **Author:** ECC Dev Story (Opus 4.6)

---

## Problem

`src/types/transaction.ts` (143 lines) has **120 consumer files** — the highest coupling in the codebase. This creates unnecessary dependency chains: ~15 files import only category types (`StoreCategory`, `ItemCategory`) but depend on the entire `transaction.ts` module as a side effect. Any change to `transaction.ts` triggers rebuild and test re-evaluation across 120 files.

The original Epic 15b stub proposed sub-typing (`TransactionBase`, `TransactionDisplay`, `TransactionMutation`). The actual data shows this is overkill.

---

## Analysis

### Consumer Census (120 files)

Methodology: `grep -rn "from.*types/transaction" src/` + `grep -rn "from './transaction'" src/types/` — deduplicated, test files excluded.

#### Import Classification

| Import Pattern | Count | Example |
|---|---|---|
| `{ Transaction }` only | 68 | `useTransactions.ts`, `gemini.ts` |
| `{ Transaction, TransactionItem }` | 9 | `TransactionCard.tsx`, `useScanHandlers.ts` |
| `{ Transaction, StoreCategory }` | 6 | `QuickSaveCard.tsx`, `historyFilterUtils.ts` |
| `{ Transaction, StoreCategory, ItemCategory }` | 3 | `sankeyAggregation.ts`, `useTransactionEditorData.ts` |
| `{ TransactionPeriods }` only | 1 | `date.ts` |
| `{ TransactionItem }` only | 1 | `transactionValidation.ts` |
| Re-export barrels | 3 | `entities/transaction/types.ts`, `types/index.ts` |
| **Category-only** (`StoreCategory`/`ItemCategory`) | **15** | See target list below |
| **CategorySource/MerchantSource only** | **2** | `CategoryBadge.tsx`, `editViewHelpers.ts` |
| Other mixed | 12 | Various combinations |

#### Category-Only Consumers (15 files — full redirect candidates)

These files import ONLY `StoreCategory` and/or `ItemCategory` from `transaction.ts`. They have zero dependency on `Transaction`, `TransactionItem`, or `TransactionPeriods`.

| # | File | Imports | Type/Runtime |
|---|---|---|---|
| 1 | `src/config/categoryColors.ts` | `StoreCategory, ItemCategory` | type |
| 2 | `src/hooks/useCategoryMappings.ts` | `StoreCategory` | runtime |
| 3 | `src/hooks/useItemNameMappings.ts` | `ItemCategory` | type |
| 4 | `src/hooks/useMerchantMappings.ts` | `StoreCategory` | type |
| 5 | `src/utils/categoryEmoji.ts` | `StoreCategory` | runtime |
| 6 | `src/components/dialogs/LearnMerchantDialog.tsx` | `ItemCategory` | type |
| 7 | `src/features/categories/state/useCategoriesState.ts` | `StoreCategory` | runtime |
| 8 | `src/features/items/views/ItemsView/itemsViewFilters.ts` | `StoreCategory` | type |
| 9 | `src/features/settings/views/SettingsView/useSettingsViewData.ts` | `StoreCategory` | type |
| 10 | `src/features/transaction-editor/views/EditView.tsx` | `StoreCategory` | runtime |
| 11 | `src/features/transaction-editor/views/useEditViewLearningFlow.ts` | `StoreCategory` | runtime |
| 12 | `src/types/categoryMapping.ts` | `StoreCategory` | runtime |
| 13 | `src/types/itemNameMapping.ts` | `ItemCategory` | type |
| 14 | `src/types/merchantMapping.ts` | `StoreCategory` | type |
| 15 | `src/types/report.ts` | `StoreCategory, ItemCategory` | type |

#### CategorySource/MerchantSource Consumers (2 files — conditionally redirectable)

These files import `CategorySource` and/or `MerchantSource`, which are defined in `transaction.ts` itself (not re-exported from `shared/schema/categories.ts`). They can be redirected IF these types are moved.

| # | File | Imports |
|---|---|---|
| 16 | `src/features/transaction-editor/components/CategoryBadge.tsx` | `CategorySource` |
| 17 | `src/features/transaction-editor/views/editViewHelpers.ts` | `ItemCategory, CategorySource, MerchantSource` |

### Type Structure Analysis

#### transaction.ts contents (143 lines)

| Type | Defined in | Re-exported by transaction.ts |
|---|---|---|
| `StoreCategory` | `shared/schema/categories.ts` | Yes (line 11) |
| `ItemCategory` | `shared/schema/categories.ts` | Yes (line 11) |
| `CategorySource` | `transaction.ts` (line 55) | N/A — native |
| `MerchantSource` | `transaction.ts` (line 63) | N/A — native |
| `TransactionPeriods` | `transaction.ts` (line 36) | N/A — native |
| `TransactionItem` | `transaction.ts` (line 65) | N/A — native |
| `Transaction` | `transaction.ts` (line 83) | N/A — native |
| `hasTransactionImages` | `transaction.ts` (line 133) | N/A — native |
| `hasTransactionThumbnail` | `transaction.ts` (line 140) | N/A — native |

#### Why Transaction is a flat type (no sub-type split)

1. **Transaction** has ~20 fields — a coherent domain object representing a receipt/purchase
2. **68 of 120 consumers** import only `{ Transaction }` — they use the full type as a prop/return type
3. No natural "display only" vs "mutation only" field split exists — most fields are needed in both contexts
4. Sub-typing would require migrating 120 files across multiple stories — high blast radius, negligible benefit
5. The 15-field `TransactionItem` has strong cohesion with `Transaction` (items[] array)

### Path Alias Analysis

| Alias | Resolves to | Notes |
|---|---|---|
| `@/*` | `src/*` | `@/types/transaction` works |
| `@shared/*` | `src/shared/*` | Does NOT cover `shared/schema/categories.ts` (repo root) |

**Problem:** `shared/schema/categories.ts` is at the repo root, not inside `src/`. No existing alias covers it. Consumers cannot use `@shared/schema/categories` — it would resolve to `src/shared/schema/categories.ts` which doesn't exist.

**Current approach:** `transaction.ts` imports via relative path: `../../shared/schema/categories`.

---

## Solution

### Recommended: Category Re-export Barrel + Consumer Redirect

**Step 1 (15b-4b):** Create `src/types/categories.ts` as a re-export barrel:

```typescript
// src/types/categories.ts
// Re-exports category types from unified schema for convenient @/types/categories imports.
// Eliminates unnecessary transaction.ts dependency for category-only consumers.

export type { StoreCategory, ItemCategory } from '../../shared/schema/categories';
export { STORE_CATEGORIES, ITEM_CATEGORIES } from '../../shared/schema/categories';

// Source tracking types — re-exported from transaction.ts (not a circular dep,
// type-only re-export is erased at compile time). Implementer: verify with tsc.
export type { CategorySource, MerchantSource } from './transaction';
```

**Step 2 (15b-4b):** Redirect 15 category-only consumers to `@/types/categories`:

```typescript
// Before
import type { StoreCategory } from '@/types/transaction';

// After
import type { StoreCategory } from '@/types/categories';
```

**Step 3 (15b-4b):** Optionally redirect 2 CategorySource/MerchantSource consumers if those types are co-located in the new barrel (no file move needed — just re-export).

**Step 4 (15b-4c/4d/4e):** Convert `import` to `import type` where possible across remaining consumers. This improves tree-shaking but does not reduce the dependent count.

### Why NOT sub-typing

| Approach | Files Changed | Complexity | Coupling Reduction |
|---|---|---|---|
| **Category redirect (recommended)** | 15-17 | Low | 120 → 103-105 |
| Sub-type split (TransactionBase/Display/Mutation) | 120+ | Very high | Minimal (types still co-located) |
| Move Transaction to entities/transaction/ | 120+ | High | No reduction (just moves the hub) |

Sub-typing adds structural complexity without meaningful decoupling. The flat `Transaction` type is correct — 68 consumers use the full interface and would not benefit from sub-types.

---

## Rationale

1. **Minimal blast radius:** Only 15-17 files change imports. No structural refactoring.
2. **Path alias compatible:** `@/types/categories` works with existing `@/*` alias.
3. **No breaking changes:** `transaction.ts` keeps its re-exports for backward compatibility. Consumers can migrate incrementally.
4. **Measurable outcome:** Dependent count drops from 120 to ~103-105 (verifiable via grep).
5. **Correct abstraction boundary:** Category types are a distinct domain concept that should not require importing the Transaction module.

---

## Impact

### Metrics (Before/After)

| Metric | Before | After (15b-4b) | Target |
|---|---|---|---|
| `transaction.ts` dependents | 120 | ~103-105 | ≤105 |
| Category-only consumers on transaction.ts | 15-17 | 0 | 0 |
| New files | 0 | 1 (`src/types/categories.ts`) | N/A |
| Modified files | 0 | 15-17 (import redirects) | N/A |

### Revised Target

The original Epic 15b target of `<50` transaction.ts dependents is **unreachable** without complex sub-typing that adds more harm than benefit. The revised target is **≤105** — achievable via the category redirect strategy alone.

For further reduction beyond 105, future work could:
- Move `TransactionPeriods` to its own type file (saves 1 dependent: `date.ts`)
- Create `@entities/transaction` barrel as the primary import path (would require larger migration)
- These are NOT recommended for Epic 15b.

### Files for 15b-4b Implementation

**New file:**
- `src/types/categories.ts` (re-export barrel, ~10 lines)

**Modified files (import redirect):**
1. `src/config/categoryColors.ts`
2. `src/hooks/useCategoryMappings.ts`
3. `src/hooks/useItemNameMappings.ts`
4. `src/hooks/useMerchantMappings.ts`
5. `src/utils/categoryEmoji.ts`
6. `src/components/dialogs/LearnMerchantDialog.tsx`
7. `src/features/categories/state/useCategoriesState.ts`
8. `src/features/items/views/ItemsView/itemsViewFilters.ts`
9. `src/features/settings/views/SettingsView/useSettingsViewData.ts`
10. `src/features/transaction-editor/views/EditView.tsx`
11. `src/features/transaction-editor/views/useEditViewLearningFlow.ts`
12. `src/types/categoryMapping.ts`
13. `src/types/itemNameMapping.ts`
14. `src/types/merchantMapping.ts`
15. `src/types/report.ts`
16. `src/features/transaction-editor/components/CategoryBadge.tsx` (if CategorySource re-exported)
17. `src/features/transaction-editor/views/editViewHelpers.ts` (if CategorySource/MerchantSource re-exported)

---

*Generated by ECC Dev Story workflow, Story 15b-4a, 2026-02-28*
