# Story 15b-4b: Redirect Category-Only Consumers to Unified Schema

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 4 - Architecture
**Points:** 3
**Priority:** HIGH
**Status:** done

## Overview

Implement the refactoring strategy from 15b-4a: redirect ~10-15 files that import only category types from `@/types/transaction` to `shared/schema/categories.ts` directly (using correct relative paths). Also verify whether `CategorySource` and `MerchantSource` need to move to `shared/schema/categories.ts` to complete the consolidation. Reduces `transaction.ts` dependents from 101 to ~88 and consolidates all category-type ownership to a single canonical source.

## Functional Acceptance Criteria

- [x] **AC1:** All category-only consumer files now import category types from `shared/schema/categories.ts` instead of `@/types/transaction`
- [x] **AC2:** `CategorySource` and `MerchantSource` are available from `shared/schema/categories.ts` (add or verify already present)
- [x] **AC3:** `transaction.ts` no longer defines `CategorySource`/`MerchantSource` locally — imports + re-exports from categories.ts
- [x] **AC4:** `npx tsc --noEmit` compiles clean
- [x] **AC5:** `npm run test:quick` — 301/302 passed (1 pre-existing DashboardView failure, unrelated to imports)

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [x] **AC-ARCH-LOC-1:** All category type definitions (`StoreCategory`, `ItemCategory`, `CategorySource`, `MerchantSource`) live in `shared/schema/categories.ts`
- [x] **AC-ARCH-LOC-2:** `src/types/transaction.ts` imports category types FROM `shared/schema/categories.ts`, not the reverse

### Pattern Requirements

- [x] **AC-ARCH-PAT-1:** Relative import paths used for `shared/schema/categories` (no tsconfig alias exists for root `shared/` — `@shared/*` maps to `src/shared/*`, not root `shared/`)
- [x] **AC-ARCH-PAT-2:** No circular imports between `transaction.ts` and `categories.ts`

### Anti-Pattern Requirements (Must NOT Happen)

- [x] **AC-ARCH-NO-1:** Do NOT modify the `Transaction` interface shape — it remains flat with 15 fields
- [x] **AC-ARCH-NO-2:** Do NOT redirect files that import `Transaction` along with category types — only pure category-type consumers are in scope
- [x] **AC-ARCH-NO-3:** Do NOT use `@shared/schema/categories` as an import path — there is no tsconfig alias for root `shared/`; use correct relative paths

## File Specification

### Modified Files

| File | Exact Path | Change |
|------|------------|--------|
| Unified Category Schema | `shared/schema/categories.ts` | Add `CategorySource` and `MerchantSource` if not already present |
| Transaction Types | `src/types/transaction.ts` | Remove definitions of `CategorySource`/`MerchantSource` if moved; update imports from categories.ts |
| Category Colors | `src/config/categoryColors.ts` | `from '../types/transaction'` → relative path to `shared/schema/categories` |
| Category Emoji | `src/utils/categoryEmoji.ts` | `from '../types/transaction'` → relative path to `shared/schema/categories` |
| Category Mappings Hook | `src/hooks/useCategoryMappings.ts` | `from '../types/transaction'` → relative path to `shared/schema/categories` |
| Item Name Mappings Hook | `src/hooks/useItemNameMappings.ts` | `from '../types/transaction'` → relative path to `shared/schema/categories` |
| Merchant Mappings Hook | `src/hooks/useMerchantMappings.ts` | `from '../types/transaction'` → relative path to `shared/schema/categories` |
| Learn Merchant Dialog | `src/components/dialogs/LearnMerchantDialog.tsx` | `from '../../types/transaction'` → relative path to `shared/schema/categories` |
| Category Badge | `src/features/transaction-editor/components/CategoryBadge.tsx` | `from '@/types/transaction'` → relative path to `shared/schema/categories` |
| Category Mapping Types | `src/types/categoryMapping.ts` | `from './transaction'` → relative path to `shared/schema/categories` |
| Item Name Mapping Types | `src/types/itemNameMapping.ts` | Update import |
| Merchant Mapping Types | `src/types/merchantMapping.ts` | Update import |

## Tasks / Subtasks

### Task 1: Verify and update shared/schema/categories.ts

- [x] 1.1 Read `shared/schema/categories.ts` — check which types are already exported
- [x] 1.2 If `CategorySource` and `MerchantSource` are missing, add them with same definitions from `transaction.ts`
- [x] 1.3 Verify no circular imports: `shared/schema/categories.ts` must NOT import from `src/`

### Task 2: Update src/types/transaction.ts

- [x] 2.1 If `CategorySource`/`MerchantSource` were moved to categories.ts, update `transaction.ts` to import them FROM categories.ts
- [x] 2.2 Verify `transaction.ts` still uses them correctly in `TransactionItem` and `Transaction` interfaces
- [x] 2.3 Run `npx tsc --noEmit` — fix any type errors

### Task 3: Redirect config + utils files

- [x] 3.1 `src/config/categoryColors.ts`: change `from '../types/transaction'` to `from '../../shared/schema/categories'`
- [x] 3.2 `src/utils/categoryEmoji.ts`: change `from '../types/transaction'` to `from '../../shared/schema/categories'`
- [x] 3.3 Run `npx tsc --noEmit` — fix any type errors after each change

### Task 4: Redirect hooks files

- [x] 4.1 `src/hooks/useCategoryMappings.ts`: update import
- [x] 4.2 `src/hooks/useItemNameMappings.ts`: update import
- [x] 4.3 `src/hooks/useMerchantMappings.ts`: update import
- [x] 4.4 Run `npx tsc --noEmit` — fix any type errors

### Task 5: Redirect component + types files

- [x] 5.1 `src/components/dialogs/LearnMerchantDialog.tsx`: update import
- [x] 5.2 `src/features/transaction-editor/components/CategoryBadge.tsx`: update import (CategorySource)
- [x] 5.3 `src/types/categoryMapping.ts`: update import
- [x] 5.4 `src/types/itemNameMapping.ts`: update import
- [x] 5.5 `src/types/merchantMapping.ts`: update import
- [x] 5.6 Run `npx tsc --noEmit` — fix any type errors

### Task 6: Verify and run tests

- [x] 6.1 `grep -rn "from.*types/transaction" src/ --include="*.ts" --include="*.tsx" | grep -v "Transaction\|TransactionItem\|TransactionPeriods"` — 0 category-only consumers in src/ (3 entity barrel lines are comments/re-exports)
- [x] 6.2 `grep -rn "from.*types/transaction" src/ --include="*.ts" --include="*.tsx" | wc -l` — 98 actual imports (≤100 target met; baseline shifted from Phase 3 work)
- [x] 6.3 Run `npm run test:quick` — 301 passed, 1 pre-existing failure (DashboardView.test.tsx: missing `see-more-card` testId, unrelated to imports)

## Dev Notes

### CRITICAL: Path Alias Mismatch

The tsconfig `@shared/*` alias maps to `src/shared/*` (inside src/), NOT to the root `shared/` directory. The `shared/schema/categories.ts` file is at the **repo root** (`/boletapp/shared/schema/categories.ts`), not inside `src/`.

This means all imports must use **relative paths**, not the `@shared/` alias:

| Source file | Import path to use |
|------------|-------------------|
| `src/types/transaction.ts` | `../../shared/schema/categories` (already correct) |
| `src/config/categoryColors.ts` | `../../shared/schema/categories` |
| `src/utils/categoryEmoji.ts` | `../../shared/schema/categories` |
| `src/hooks/*.ts` | `../../shared/schema/categories` |
| `src/components/dialogs/*.tsx` | `../../../shared/schema/categories` |
| `src/features/*/components/*.tsx` | Varies — count directory depth |
| `src/types/*.ts` | `../../shared/schema/categories` |

**Verify each path with `npx tsc --noEmit` after each file change.**

### Runtime vs Type-Only Imports

- `src/utils/categoryEmoji.ts` imports `{ StoreCategory }` — this is a **type alias** (not a class/enum), so even without `type` keyword it's erased at build time. Safe to redirect.
- `src/hooks/useCategoryMappings.ts` imports `{ StoreCategory }` — same: type alias, safe to redirect.

### Test File Updates

After redirecting consumer files, run:
```bash
grep -rn "from.*types/transaction" tests/ --include="*.ts" --include="*.tsx" | grep -E "StoreCategory|ItemCategory|CategorySource|MerchantSource"
```
Any test files that import only category types from `transaction.ts` must also be redirected.

### Pitfall: Mixed Imports

Some files import BOTH Transaction AND category types. Do NOT redirect these — keep the full `@/types/transaction` import. Example:
```typescript
// src/features/analytics/utils/sankeyDataBuilder.ts
import type { Transaction } from '@/types/transaction';         // KEEP
import type { StoreCategory, ItemCategory } from '@/types/transaction';  // SPLIT into separate import from categories
```
For mixed-import files, the cleaner approach is to keep a single import of everything from transaction.ts (no split), unless explicitly listed in 15b-4a's target file list.

## ECC Analysis Summary

- **Risk Level:** MEDIUM (import path changes across ~12 files; relative path calculation errors could cause type failures)
- **Complexity:** Low-medium — mechanical import redirects, but path depth calculation requires care
- **Sizing:** 6 tasks / 21 subtasks / 12 files modified
- **Agents consulted:** Architect
- **Dependencies:** Hard dependency on 15b-4a design doc confirming the target file list

## Senior Developer Review (ECC)

| Field | Value |
|-------|-------|
| Date | 2026-02-28 |
| Classification | COMPLEX (file count driven) |
| Agents | code-reviewer, security-reviewer, architect, tdd-guide |
| Overall Score | 9.75/10 |
| Outcome | APPROVE |
| Quick Fixes | 0 |
| TD Stories Created | 0 |
| Architectural ACs | 7/7 PASS |

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial stub (proposed complex sub-type split) |
| 2026-02-23 | Full rewrite. Design radically simplified: redirect category-only consumers instead of sub-type split. CRITICAL fix: `@shared/*` alias maps to `src/shared/`, NOT root `shared/` — relative paths required. Target: reduce from 101 to ≤88 dependents. |
| 2026-02-27 | ECC re-creation validation: Actual category-only consumers ~12 (not 48 from initial exploration). `editViewHelpers.ts` added to file spec. Target revised ≤88→≤100 consistent with 15b-4a. Status: ready-for-dev. |
| 2026-02-28 | Implementation complete. 18 files modified total: 12 from spec + 6 additional pure category-only consumers discovered during verification (editViewHelpers, EditView, useEditViewLearningFlow, itemsViewFilters, useSettingsViewData, useCategoriesState) + 1 mixed-import merge (historyFilterUtils). Final: 98 import lines (≤100 target). Pre-existing DashboardView.test.tsx failure (17 tests, missing see-more-card testId) — unrelated to import changes. |
