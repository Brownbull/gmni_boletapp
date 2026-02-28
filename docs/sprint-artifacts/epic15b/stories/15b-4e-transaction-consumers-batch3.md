# Story 15b-4e: Fix Transaction Runtime Imports — Views, Components & Final Cleanup

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 4 - Architecture
**Points:** 3
**Priority:** MEDIUM
**Status:** ready-for-dev

## Overview

Fix runtime imports of Transaction types in view and component files, completing the mechanical `import → import type` cleanup across the codebase. Remove the category-type backward-compat shim (if created in 15b-4b). Verify final state: all transaction.ts consumers properly classified, tree-shaking enabled, no dangling re-exports.

## Functional Acceptance Criteria

- [ ] **AC1:** All view files use correct import style for Transaction types
- [ ] **AC2:** All component files use correct import style for Transaction types
- [ ] **AC3:** Category-type backward-compat shim removed from `transaction.ts` (if created in 15b-4b)
- [ ] **AC4:** `npm run test:quick` passes with 0 failures
- [ ] **AC5:** `npm run test:story` passes (integration coverage before marking done)

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] **AC-ARCH-LOC-1:** No file moves — only import keyword changes and shim removal

### Pattern Requirements

- [ ] **AC-ARCH-PAT-1:** `import type { Transaction }` used where Transaction only appears in type annotations
- [ ] **AC-ARCH-PAT-2:** 5 confirmed runtime-usage files left unchanged (see Dev Notes)

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] **AC-ARCH-NO-1:** Do NOT change the 5 confirmed runtime-usage files (BatchSummary, insightGenerators, ScanCompleteModal, RecentScansView, confidenceCheck)
- [ ] **AC-ARCH-NO-2:** Do NOT create sub-types — flat Transaction is correct (see 15b-4a)
- [ ] **AC-ARCH-NO-3:** Do NOT batch-update without testing between each file

## File Specification

### Modified Files

| File | Exact Path | Change |
|------|------------|--------|
| App.tsx | `src/App.tsx` | Audit; likely type-only for component prop types |
| DrillDownGrid.tsx | `src/features/analytics/components/DrillDownGrid.tsx` | Likely `import type` |
| SankeyChart.tsx | `src/features/analytics/components/SankeyChart.tsx` | Likely `import type` (890 lines; display-only) |
| TrendsView.tsx | `src/features/analytics/views/TrendsView/TrendsView.tsx` | Likely `import type` |
| useTrendsViewData.ts | `src/features/analytics/views/TrendsView/useTrendsViewData.ts` | Likely `import type` |
| DonutChart.tsx | `src/features/analytics/views/TrendsView/DonutChart.tsx` | Likely `import type` |
| TrendsView helpers | `src/features/analytics/views/TrendsView/aggregationHelpers.ts` + 4 others | Likely `import type` |
| BatchReviewView.tsx | `src/features/batch-review/views/BatchReviewView.tsx` | Audit; may need runtime |
| BatchReviewFeature.tsx | `src/features/batch-review/BatchReviewFeature.tsx` | Likely mixed |
| HistoryView.tsx | `src/features/history/views/HistoryView.tsx` | Likely `import type` |
| useHistoryViewData.ts | `src/features/history/views/useHistoryViewData.ts` | Likely `import type` |
| useDashboardViewData.ts | `src/features/dashboard/views/DashboardView/useDashboardViewData.ts` | Likely `import type` |
| TransactionCard.tsx | `src/components/transactions/TransactionCard.tsx` | Likely `import type` |

## Tasks / Subtasks

### Task 1: Audit large view files (>1,000 lines)

- [ ] 1.1 `src/features/analytics/views/TrendsView/TrendsView.tsx` (1,981 lines) — Classify Transaction import; likely type-only for chart data props
- [ ] 1.2 `src/features/history/views/HistoryView.tsx` (1,168 lines) — Classify; likely type-only (was already being migrated in 15b-3e)
- [ ] 1.3 `src/features/dashboard/views/DashboardView/DashboardView.tsx` (1,485 lines) — Classify; likely type-only
- [ ] 1.4 `src/features/items/views/ItemsView/ItemsView.tsx` (1,003 lines) — Classify
- [ ] 1.5 `src/App.tsx` — **Gate:** If 15b-4f is already complete, App.tsx's import count will have dropped from 82 lines to ~15. Run `grep -n "Transaction" src/App.tsx` first. If no `import { Transaction }` is found (the orchestrators own those imports now), mark this subtask done without modification. If 15b-4f has NOT run yet, audit App.tsx as a normal large file — likely type-only for component prop types.

### Task 2: Audit component files

- [ ] 2.1 `src/features/analytics/components/SankeyChart.tsx` (890 lines) — Likely `import type` (display-only chart)
- [ ] 2.2 `src/features/analytics/components/DrillDownGrid.tsx` (808 lines) — Likely `import type`
- [ ] 2.3 `src/components/transactions/TransactionCard.tsx` — Likely `import type`
- [ ] 2.4 `src/components/polygon/PolygonWithModeToggle.tsx` — Likely `import type`
- [ ] 2.5 TrendsView helper files: `aggregationHelpers.ts`, `drillDownHelpers.ts`, `periodComparisonHelpers.ts`, `periodHelpers.ts` — all likely `import type`

### Task 3: Identify confirmed runtime-usage files (DO NOT CHANGE)

- [ ] 3.1 **Flag**: `src/features/insights/components/BatchSummary.tsx` — runtime usage (renders transaction data)
- [ ] 3.2 **Flag**: `src/features/insights/utils/insightGenerators.ts` — runtime usage (generators iterate transactions)
- [ ] 3.3 **Flag**: `src/features/scan/components/ScanCompleteModal.tsx` — runtime usage (modal renders transaction data)
- [ ] 3.4 **Flag**: `src/features/scan/views/RecentScansView.tsx` — runtime usage (lists transactions)
- [ ] 3.5 **Flag**: `src/utils/confidenceCheck.ts` — runtime usage (processes transaction object values)
- [ ] 3.6 Verify these 5 files with direct read; confirm runtime usage before skipping

### Task 4: Apply `import type` fixes (mechanical)

- [ ] 4.1 For each type-only file from Tasks 1-2, update: `import { Transaction }` → `import type { Transaction }`
- [ ] 4.2 For mixed files, split: keep Transaction import as type-only; keep other runtime imports unchanged
- [ ] 4.3 Run `npx vitest run <affected-test-path>` or `npm run test:quick` after each file

### Task 5: Cleanup — remove backward-compat shim

- [ ] 5.1 Check if 15b-4b created a category backward-compat shim in `src/types/transaction.ts`
- [ ] 5.2 If shim exists: verify all category consumers have migrated to `shared/schema/categories` (15b-4b must be done)
- [ ] 5.3 Remove shim from `transaction.ts` once confirmed all consumers migrated
- [ ] 5.4 Run `npm run test:quick` after shim removal — verify no type resolution failures

### Task 6: Final verification and metrics

- [ ] 6.1 Run `npm run test:quick` — all tests must pass
- [ ] 6.2 Run `npm run test:story` — integration tests must pass
- [ ] 6.3 Run `npx tsc --noEmit` — no type errors
- [ ] 6.4 `grep -rn "import { Transaction" src/ --include="*.ts" --include="*.tsx" | wc -l` — should be ~5-10 (only runtime cases)
- [ ] 6.5 `grep -rn "from.*types/transaction" src/ --include="*.ts" --include="*.tsx" | wc -l` — verify reduction to ≤88

## Dev Notes

### 5 Confirmed Runtime-Usage Files — Do NOT Change

These files use `Transaction` as a runtime value (object access on actual transaction data):

1. `src/features/insights/components/BatchSummary.tsx` — renders transaction fields
2. `src/features/insights/utils/insightGenerators.ts` — iterates through transaction items
3. `src/features/scan/components/ScanCompleteModal.tsx` — renders scan result transaction
4. `src/features/scan/views/RecentScansView.tsx` — lists transaction items
5. `src/utils/confidenceCheck.ts` — validates transaction.total, transaction.items

Verify each before skipping by reading the file directly.

### App.tsx Special Case

After 15b-4f (App.tsx fan-out reduction), App.tsx's import count will have dropped significantly. The `import { Transaction }` in App.tsx may already be `import type` after 15b-4f refactoring, or may have been removed entirely. Check current state before modifying.

### DashboardView Types File

`src/features/dashboard/views/DashboardView/types.ts` re-exports `Transaction` from `@/types/transaction`. This is a barrel re-export — it should use `export type { Transaction }` if it's only used as a type. Check this file as well.

### Test Strategy

Large view files (>1,000 lines) have good integration test coverage. Use:
```bash
npx vitest run tests/unit/features/analytics/
npx vitest run tests/unit/features/history/
npx vitest run tests/unit/features/dashboard/
```

## ECC Analysis Summary

- **Risk Level:** LOW-MEDIUM (views are safer than services, but large file count)
- **Complexity:** Medium (5 confirmed exceptions + systematic review of large files)
- **Sizing:** 6 tasks / 24 subtasks / 13 files (within limits: max 8 tasks, max 40 subtasks, max 12 files — note: 13 source files reviewed, only ~8-10 modified)
- **Agents consulted:** Architect

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft (views import TransactionDisplay sub-type) |
| 2026-02-23 | Full rewrite. Sub-typing abandoned. Refocused on `import → import type` for views + components. Identified 5 confirmed runtime-usage files to preserve. Added cleanup task for 15b-4b shim removal. |
| 2026-02-27 | ECC re-creation validation: ~9 of 13 files likely already using `import type`. Effective diff is small. Status: ready-for-dev. |
