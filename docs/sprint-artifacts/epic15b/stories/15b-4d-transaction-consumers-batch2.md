# Story 15b-4d: Fix Transaction Runtime Imports — Hooks & Feature Utilities

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 4 - Architecture
**Points:** 3
**Priority:** MEDIUM
**Status:** ready-for-dev

## Overview

Fix runtime imports of Transaction types in hooks and feature-internal utility files. This is the largest consumer category (~25 files). Apply the same `import → import type` pattern from 15b-4c to reduce tree-shaking overhead and bundle size. No architectural changes — purely mechanical import keyword fixes.

> **Phase 3 dependency:** All Phase 3 stories (15b-3a through 15b-3e) must be complete before starting this story. Phase 3 rewrites `useTransactions.ts`, `useRecentScans.ts`, `usePaginatedTransactions.ts`, `useTransactionHandlers.ts`, `useBatchReviewHandlers.ts`, and `useScanHandlers.ts` — all of which appear in this story's file specification. Audit the current file state after Phase 3 completes; do not rely on pre-Phase-3 import patterns.

> **Phase 2 dependency:** Story 15b-2l decomposes `useScanHandlers.ts` into sub-files. If 15b-2l is complete, Task 2.7 should audit the decomposed files (e.g. `useImageCapture.ts`, `useScanStateHandlers.ts`) rather than the original path.

## Functional Acceptance Criteria

- [ ] **AC1:** All hook files properly differentiate between runtime and type-only Transaction imports
- [ ] **AC2:** All feature-internal utils (`src/features/*/utils/`) use correct import style
- [ ] **AC3:** Feature-internal hooks follow the same pattern
- [ ] **AC4:** `npm run test:quick` passes with 0 failures

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] **AC-ARCH-LOC-1:** No file moves — only import keyword changes within existing files

### Pattern Requirements

- [ ] **AC-ARCH-PAT-1:** `import type { Transaction }` used where Transaction only appears in type annotations
- [ ] **AC-ARCH-PAT-2:** Full import retained where Transaction appears in runtime value positions

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] **AC-ARCH-NO-1:** Do NOT create sub-types — flat Transaction is correct (see 15b-4a)
- [ ] **AC-ARCH-NO-2:** Do NOT change category imports (handled in 15b-4b)
- [ ] **AC-ARCH-NO-3:** Do NOT batch-update without testing between each file

## File Specification

### Modified Files

| File | Exact Path | Change |
|------|------------|--------|
| useTransactions.ts | `src/hooks/useTransactions.ts` | Audit; likely `import type` |
| usePaginatedTransactions.ts | `src/hooks/usePaginatedTransactions.ts` | Likely `import type` |
| useRecentScans.ts | `src/hooks/useRecentScans.ts` | Likely `import type` |
| usePersonalRecords.ts | `src/hooks/usePersonalRecords.ts` | Likely `import type` |
| usePolygonMode.ts | `src/hooks/usePolygonMode.ts` | Likely `import type` |
| useDialogHandlers.ts | `src/hooks/app/useDialogHandlers.ts` | Likely `import type` |
| useTransactionHandlers.ts | `src/hooks/app/useTransactionHandlers.ts` | Likely `import type` |
| useBatchSession.ts (root) | `src/hooks/useBatchSession.ts` | May need runtime; audit |
| useAnalyticsTransactions.ts | `src/features/analytics/hooks/useAnalyticsTransactions.ts` | Likely `import type` |
| useCategoryStatistics.ts | `src/features/analytics/hooks/useCategoryStatistics.ts` | Likely `import type` |
| useBatchProcessing.ts | `src/features/batch-review/hooks/useBatchProcessing.ts` | May need runtime; audit |
| useBatchReview.ts | `src/features/batch-review/hooks/useBatchReview.ts` | Likely mixed; audit |

## Tasks / Subtasks

### Task 1: Audit flat hooks (src/hooks/)

- [ ] 1.1 `src/hooks/useTransactions.ts` — Classify: Transaction used in return type only → `import type`
- [ ] 1.2 `src/hooks/usePaginatedTransactions.ts` — Classify; has `QueryDocumentSnapshot<Transaction>` generics
- [ ] 1.3 `src/hooks/useRecentScans.ts` — Classify; likely type-only (returns array of transactions)
- [ ] 1.4 `src/hooks/usePersonalRecords.ts` — Classify; already reads from repository in 15b-3c
- [ ] 1.5 `src/hooks/usePolygonMode.ts` — Likely `import type` (uses Transaction as prop type)
- [ ] 1.6 `src/hooks/app/useDialogHandlers.ts` — Likely `import type`
- [ ] 1.7 `src/hooks/app/useTransactionHandlers.ts` — Likely `import type`
- [ ] 1.8 `src/hooks/useBatchSession.ts` — May need runtime; check session storage operations

### Task 2: Audit feature-internal hooks

- [ ] 2.1 `src/features/analytics/hooks/useAnalyticsTransactions.ts` — Classify
- [ ] 2.2 `src/features/analytics/hooks/useCategoryStatistics.ts` — Classify; mixed TransactionItem + Transaction
- [ ] 2.3 `src/features/batch-review/hooks/useBatchProcessing.ts` — Likely needs runtime; audit
- [ ] 2.4 `src/features/batch-review/hooks/useBatchReview.ts` — Audit; may be mixed
- [ ] 2.5 `src/features/batch-review/hooks/useBatchReviewHandlers.ts` — Likely `import type`
- [ ] 2.6 `src/features/batch-review/hooks/useBatchSession.ts` — Likely `import type`
- [ ] 2.7 `src/features/scan/hooks/useScanHandlers.ts` — Likely mixed; audit
- [ ] 2.8 `src/features/scan/hooks/useScanInitiation.ts` — Likely `import type`

### Task 3: Audit feature-internal utilities

- [ ] 3.1 `src/features/analytics/utils/chartDataComputation.ts` — Likely `import type`
- [ ] 3.2 `src/features/analytics/utils/sankeyDataBuilder.ts` — **Note:** Story 15b-2f decomposes this file into sub-files (nodeBuilder, linkBuilder, colorMapper). If 15b-2f is complete, this original path may not exist. Audit the decomposed sub-files instead, checking each for `Transaction` import type classification separately.
- [ ] 3.3 `src/features/batch-review/handlers/types.ts` — Mixed; separate runtime from type
- [ ] 3.4 `src/features/batch-review/handlers/utils.ts` — Classify
- [ ] 3.5 `src/features/categories/utils/itemNameMappings.ts` — Likely `import type { Transaction, TransactionItem }`
- [ ] 3.6 Scan utils: `src/features/scan/utils/totalValidation.ts` — May need runtime (validates transaction fields)
- [ ] 3.7 Insights utils: `src/features/insights/utils/insightGenerators.ts` — **RUNTIME USAGE confirmed** — do NOT change

### Task 4: Apply fixes (mechanical)

- [ ] 4.1 For each "type-only" classified file, update: `import { Transaction }` → `import type { Transaction }`
- [ ] 4.2 For mixed files, split into: `import type { Transaction }` + keep remaining runtime imports
- [ ] 4.3 Run `npx vitest run <affected-test-path>` after each file; fall back to `npm run test:quick`

### Task 5: Verification

- [ ] 5.1 Run `npm run test:quick` — all tests must pass
- [ ] 5.2 Run `npx tsc --noEmit` — no type errors
- [ ] 5.3 Count updated files (target: ~15-20 hook and utility files updated)
- [ ] 5.4 Note any deferred files for 15b-4e (view-facing hook files)

## Dev Notes

### Confirmed Runtime Usage — Do NOT Change

- `src/features/insights/utils/insightGenerators.ts` — verified runtime usage (generators iterate transaction values)
- `src/features/scan/utils/totalValidation.ts` — likely runtime (validates transaction.total, transaction.items)

### Hooks are the Largest Consumer Category

Expect significant line-by-line review. Most hooks use Transaction in:
- Function parameter types: `(transaction: Transaction): void`
- Generic parameters: `useState<Transaction | null>(null)`
- Return type annotations: `(): Transaction[]`

These are ALL type-only uses. The `Transaction` type itself is never instantiated or used as a runtime value in hooks.

### sankeyDataBuilder.ts Note

This is 1,037 lines. It imports both `Transaction` and category types. Since it was decomposed in 15b-2f, there may be new sub-files. Check each import separately. The data pipeline likely only uses Transaction in type positions.

### Test Strategy

Hooks have good test coverage. For each hook file:
1. Check test exists at `tests/unit/hooks/<hookname>.test.ts` or `tests/unit/features/<feature>/hooks/`
2. Run: `npx vitest run <test-file>` after each change
3. If no test exists: run full `npm run test:quick`

## ECC Analysis Summary

- **Risk Level:** LOW (same mechanical pattern as 15b-4c)
- **Complexity:** Medium (larger file count; systematic review required)
- **Sizing:** 5 tasks / 24 subtasks / 12 files (within limits: max 8 tasks, max 40 subtasks, max 12 files)
- **Agents consulted:** Architect

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft (hooks import TransactionDisplay sub-type) |
| 2026-02-23 | Full rewrite. Sub-typing abandoned. Refocused on `import → import type` for hooks + feature utils. Identified confirmed runtime-usage exceptions. |
| 2026-02-27 | ECC re-creation validation: `useBatchSession.ts` and `useBatchReview.ts` flagged as likely runtime (audit carefully). Phase 2+3 dependency noted — re-audit after both phases complete. Status: ready-for-dev. |
