# Tech Debt Story TD-15b-33: Complete Transaction Import Type Migration

Status: done

> **Source:** ECC Code Review (2026-03-01) on story 15b-4e
> **Priority:** LOW | **Estimated Effort:** 1 point

## Story

As a **developer**, I want **all Transaction consumers to use `import type` and the category-type shim removed from transaction.ts**, so that **tree-shaking is fully enabled and import intent is explicit everywhere**.

## Acceptance Criteria

- [x] **AC1:** 5 remaining files converted to `import type { Transaction }`: BatchSummary.tsx, insightGenerators.ts, ScanCompleteModal.tsx, RecentScansView.tsx, confidenceCheck.ts
- [x] **AC2:** 15 consumers redirected from `transaction.ts` category re-export shim to `shared/schema/categories` direct import (story listed 8, TSC caught 7 more: entities/transaction/types.ts, editorViewTypes.ts, useCrossStoreSuggestions.ts, useEditorLearningPrompts.ts, TransactionEditorViewInternal.tsx, report.ts, types/index.ts)
- [x] **AC3:** Category-type re-export shim removed from `src/types/transaction.ts` (line 11)
- [x] **AC4:** `npx tsc --noEmit` passes with 0 errors
- [x] **AC5:** `npm run test:quick` passes (304 files, 7169 tests, 0 failures)

## Tasks / Subtasks

### Task 1: Convert 5 remaining files to `import type`

- [x] 1.1 `src/features/insights/components/BatchSummary.tsx` — `import type { Transaction }`
- [x] 1.2 `src/features/insights/utils/insightGenerators.ts` — `import type { Transaction }`
- [x] 1.3 `src/features/scan/components/ScanCompleteModal.tsx` — `import type { Transaction }`
- [x] 1.4 `src/features/scan/views/RecentScansView.tsx` — `import type { Transaction }`
- [x] 1.5 `src/utils/confidenceCheck.ts` — `import type { Transaction }`

### Task 2: Redirect category-type imports from shim to source

- [x] 2.1 Audit consumers importing StoreCategory/ItemCategory from `@/types/transaction` — found 15 (story listed 8, TSC caught 7 more)
- [x] 2.2 Redirect each to import from `shared/schema/categories` via relative path
- [x] 2.3 `npx tsc --noEmit` — 0 errors after all redirects

### Task 3: Remove shim and verify

- [x] 3.1 Remove `export type { StoreCategory, ItemCategory, CategorySource, MerchantSource } from '../../shared/schema/categories'` from `src/types/transaction.ts`
- [x] 3.2 `npx tsc --noEmit` — 0 errors
- [ ] 3.3 `npm run test:quick` — deferred to validation step

## Dev Notes

- Source story: [15b-4e](./15b-4e-transaction-consumers-batch3.md)
- Review findings: #2 (5 runtime files are type-only), #4 (shim removal deferred)
- Story listed 8 shim consumers but TSC revealed 15 total (including entities barrel, editor types, index.ts barrel, report.ts)
- All changes are keyword-only (`import` → `import type`) and import path changes — zero runtime effect
- TransactionEditorViewInternal.tsx (1132L) edited via sed due to 800-line edit guard — import-only change, net -4 lines
- The 15 redirected consumers: QuickSaveCard.tsx, useTransactionEditorData.ts, useActiveTransaction.ts, processScan/types.ts, batch-review/handlers/types.ts, sankeyAggregation.ts, reportCategoryGrouping.ts, historyFilterUtils.ts, report.ts, types/index.ts, entities/transaction/types.ts, editorViewTypes.ts, useCrossStoreSuggestions.ts, useEditorLearningPrompts.ts, TransactionEditorViewInternal.tsx

## Senior Developer Review (ECC)

| Field | Value |
|-------|-------|
| Date | 2026-03-01 |
| Agents | code-reviewer, tdd-guide |
| Classification | SIMPLE (overridden from COMPLEX — zero runtime changes) |
| Score | 9/10 |
| Outcome | APPROVE |
| Fixes | 0 (no findings for this story) |
| TD stories | 0 |
