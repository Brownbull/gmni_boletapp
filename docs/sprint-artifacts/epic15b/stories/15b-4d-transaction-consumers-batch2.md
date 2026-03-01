# Story 15b-4d: Fix Transaction Runtime Imports — Hooks & Feature Utilities

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 4 - Architecture
**Points:** 3
**Priority:** MEDIUM
**Status:** done

## Overview

Fix runtime imports of Transaction types in hooks and feature-internal utility files. This is the largest consumer category (~25 files). Apply the same `import → import type` pattern from 15b-4c to reduce tree-shaking overhead and bundle size. No architectural changes — purely mechanical import keyword fixes.

> **Phase 3 dependency:** All Phase 3 stories (15b-3a through 15b-3e) must be complete before starting this story. Phase 3 rewrites `useTransactions.ts`, `useRecentScans.ts`, `usePaginatedTransactions.ts`, `useTransactionHandlers.ts`, `useBatchReviewHandlers.ts`, and `useScanHandlers.ts` — all of which appear in this story's file specification. Audit the current file state after Phase 3 completes; do not rely on pre-Phase-3 import patterns.

> **Phase 2 dependency:** Story 15b-2l decomposes `useScanHandlers.ts` into sub-files. If 15b-2l is complete, Task 2.7 should audit the decomposed files (e.g. `useImageCapture.ts`, `useScanStateHandlers.ts`) rather than the original path.

## Functional Acceptance Criteria

- [x] **AC1:** All hook files properly differentiate between runtime and type-only Transaction imports
- [x] **AC2:** All feature-internal utils (`src/features/*/utils/`) use correct import style
- [x] **AC3:** Feature-internal hooks follow the same pattern
- [x] **AC4:** `npm run test:quick` passes (7153 passed, 17 pre-existing DashboardView failures unrelated to this story)

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [x] **AC-ARCH-LOC-1:** No file moves — only import keyword changes within existing files

### Pattern Requirements

- [x] **AC-ARCH-PAT-1:** `import type { Transaction }` used where Transaction only appears in type annotations
- [x] **AC-ARCH-PAT-2:** Full import retained where Transaction appears in runtime value positions (insightGenerators.ts skipped per story scope)

### Anti-Pattern Requirements (Must NOT Happen)

- [x] **AC-ARCH-NO-1:** No sub-types created
- [x] **AC-ARCH-NO-2:** No category imports changed
- [x] **AC-ARCH-NO-3:** Tests run after each file change

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

- [x] 1.1 `src/hooks/useTransactions.ts` — TYPE-ONLY: generic params, return type → changed to `import type`
- [x] 1.2 `src/hooks/usePaginatedTransactions.ts` — TYPE-ONLY: interface fields, generic params → changed to `import type`
- [x] 1.3 `src/hooks/useRecentScans.ts` — TYPE-ONLY: generic params, return type → changed to `import type`
- [x] 1.4 `src/hooks/usePersonalRecords.ts` — ALREADY `import type` (fixed in Phase 3)
- [x] 1.5 `src/hooks/usePolygonMode.ts` — ALREADY `import type` (fixed in Phase 3)
- [x] 1.6 `src/hooks/app/useDialogHandlers.ts` — ALREADY `import type` (fixed in Phase 3)
- [x] 1.7 `src/hooks/app/useTransactionHandlers.ts` — ALREADY `import type` (fixed in Phase 3)
- [x] 1.8 `src/hooks/useBatchSession.ts` — Re-export shim only (no Transaction import)

### Task 2: Audit feature-internal hooks

- [x] 2.1 `src/features/analytics/hooks/useAnalyticsTransactions.ts` — ALREADY `import type`
- [x] 2.2 `src/features/analytics/hooks/useCategoryStatistics.ts` — ALREADY `import type`
- [x] 2.3 `src/features/batch-review/hooks/useBatchProcessing.ts` — TYPE-ONLY: interface fields, callback types → changed to `import type`
- [x] 2.4 `src/features/batch-review/hooks/useBatchReview.ts` — TYPE-ONLY: interface fields, callback params → changed to `import type`
- [x] 2.5 `src/features/batch-review/hooks/useBatchReviewHandlers.ts` — ALREADY `import type`
- [x] 2.6 `src/features/batch-review/hooks/useBatchSession.ts` — TYPE-ONLY: interface fields, param types → changed to `import type`
- [x] 2.7 `src/features/scan/hooks/useScanHandlers.ts` — ALREADY `import type`
- [x] 2.8 `src/features/scan/hooks/useScanInitiation.ts` — ALREADY `import type`

### Task 3: Audit feature-internal utilities

- [x] 3.1 `src/features/analytics/utils/chartDataComputation.ts` — ALREADY `import type`
- [x] 3.2 `src/features/analytics/utils/sankeyDataBuilder.ts` — ALREADY `import type` (decomposed in 15b-2f)
- [x] 3.3 `src/features/batch-review/handlers/types.ts` — ALREADY `import type`
- [x] 3.4 `src/features/batch-review/handlers/utils.ts` — ALREADY `import type`
- [x] 3.5 `src/features/categories/utils/itemNameMappings.ts` — ALREADY `import type`
- [x] 3.6 `src/features/scan/utils/totalValidation.ts` — TYPE-ONLY (Transaction is interface) → changed to `import type`
- [x] 3.7 `src/features/insights/utils/insightGenerators.ts` — Skipped per story scope (deferred to 15b-4e)

### Task 4: Apply fixes (mechanical)

- [x] 4.1 For each "type-only" classified file, update: `import { Transaction }` → `import type { Transaction }`
- [x] 4.2 No mixed files found — all were pure type-only
- [x] 4.3 Ran `npx vitest run <affected-test-path>` after each file — all passed

### Task 5: Verification

- [x] 5.1 Run `npm run test:quick` — 7153 passed, 17 pre-existing DashboardView failures (unrelated)
- [x] 5.2 Run `npx tsc --noEmit` — 0 type errors
- [x] 5.3 7 files changed to `import type`; 14 were already correct from Phase 2/3. 76 total files now use `import type` for Transaction.
- [x] 5.4 Deferred to 15b-4e: `insightGenerators.ts`, `useActiveTransaction.ts`, `transactionNormalizer.ts`, `confidenceCheck.ts`, `insight.ts`, `scan.ts` (types/views/components scope)

## Dev Notes

### Implementation Findings (2026-02-28)

- **14 of 24 files already had `import type`** from Phase 2/3 work — scope reduced to 7 actual changes
- **totalValidation.ts reclassified as TYPE-ONLY:** Transaction is an `interface` (src/types/transaction.ts:69), making it impossible to use as a runtime value. Changed despite story flagging as "likely runtime".
- **useBatchSession.ts (root) is a re-export shim** — no Transaction import at all
- **Deferred to 15b-4e:** insightGenerators.ts, useActiveTransaction.ts, transactionNormalizer.ts, confidenceCheck.ts, insight.ts (types), scan.ts (types)

### Confirmed Runtime Usage — Do NOT Change (per story scope)

- `src/features/insights/utils/insightGenerators.ts` — deferred to 15b-4e (Transaction is interface, so technically type-only, but out of scope)

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
| 2026-02-28 | Implementation: 7 files changed (14 already correct from Phase 2/3). All type-only — Transaction is interface. totalValidation.ts reclassified. tsc + tests pass. Status: review. |
| 2026-02-28 | ECC Code Review: APPROVE 10/10 (STANDARD, code-reviewer + security-reviewer). 0 fixes, 1 TD story (TD-15b-31). Status: done. |

## Senior Developer Review (ECC)

| Field | Value |
|-------|-------|
| Date | 2026-02-28 |
| Classification | STANDARD |
| Agents | code-reviewer, security-reviewer |
| Outcome | APPROVE 10/10 |
| Quick Fixes | 0 |
| TD Stories Created | 1 (TD-15b-31: batch review error logging) |

### Deferred Items Tracking

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| TD-15b-31 | Sanitize console.error in useBatchReview.ts | LOW | CREATED |
| 15b-4e | insightGenerators.ts + remaining type/view/component scope | MEDIUM | ALREADY_TRACKED |
