# Tech Debt Story TD-15b-33: Complete Transaction Import Type Migration

Status: ready-for-dev

> **Source:** ECC Code Review (2026-03-01) on story 15b-4e
> **Priority:** LOW | **Estimated Effort:** 1 point

## Story

As a **developer**, I want **all Transaction consumers to use `import type` and the category-type shim removed from transaction.ts**, so that **tree-shaking is fully enabled and import intent is explicit everywhere**.

## Acceptance Criteria

- [ ] **AC1:** 5 remaining files converted to `import type { Transaction }`: BatchSummary.tsx, insightGenerators.ts, ScanCompleteModal.tsx, RecentScansView.tsx, confidenceCheck.ts
- [ ] **AC2:** 8 consumers redirected from `transaction.ts` category re-export shim to `shared/schema/categories` direct import
- [ ] **AC3:** Category-type re-export shim removed from `src/types/transaction.ts` (line 11)
- [ ] **AC4:** `npx tsc --noEmit` passes with 0 errors
- [ ] **AC5:** `npm run test:quick` passes

## Tasks / Subtasks

### Task 1: Convert 5 remaining files to `import type`

- [ ] 1.1 `src/features/insights/components/BatchSummary.tsx` — `import type { Transaction }`
- [ ] 1.2 `src/features/insights/utils/insightGenerators.ts` — `import type { Transaction }`
- [ ] 1.3 `src/features/scan/components/ScanCompleteModal.tsx` — `import type { Transaction }`
- [ ] 1.4 `src/features/scan/views/RecentScansView.tsx` — `import type { Transaction }`
- [ ] 1.5 `src/utils/confidenceCheck.ts` — `import type { Transaction }`

### Task 2: Redirect category-type imports from shim to source

- [ ] 2.1 Audit 8 consumers importing StoreCategory/ItemCategory from `@/types/transaction`
- [ ] 2.2 Redirect each to import from `shared/schema/categories` or `@shared/schema/categories`
- [ ] 2.3 Run `npx tsc --noEmit` after each file

### Task 3: Remove shim and verify

- [ ] 3.1 Remove `export type { StoreCategory, ItemCategory, CategorySource, MerchantSource } from '../../shared/schema/categories'` from `src/types/transaction.ts`
- [ ] 3.2 `npx tsc --noEmit` — 0 errors
- [ ] 3.3 `npm run test:quick` — all pass

## Dev Notes

- Source story: [15b-4e](./15b-4e-transaction-consumers-batch3.md)
- Review findings: #2 (5 runtime files are type-only), #4 (shim removal deferred)
- Files affected: 5 source files + 8 consumer redirects + 1 shim removal = ~14 files
- All changes are keyword-only (`import` → `import type`) and import path changes — zero runtime effect
- The 8 shim consumers: QuickSaveCard.tsx, useTransactionEditorData.ts, useActiveTransaction.ts, processScan/types.ts, batch-review/handlers/types.ts, sankeyAggregation.ts, reportCategoryGrouping.ts, historyFilterUtils.ts
