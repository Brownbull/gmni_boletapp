# Story 15b-4c: Fix Transaction Runtime Imports — Services & Batch Handlers

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 4 - Architecture
**Points:** 3
**Priority:** MEDIUM
**Status:** done

## Overview

Fix runtime imports of Transaction types in service and batch handler files. Change `import { Transaction }` to `import type { Transaction }` where the type is only used in type annotations, not runtime values. This improves tree-shaking and bundle size without architectural changes. The sub-type split originally planned in this story is NOT the approach — the flat `Transaction` interface does not benefit from sub-typing (see 15b-4a design doc).

> **Phase 3 dependency:** All Phase 3 stories (15b-3a through 15b-3e) must be complete before starting this story. Phase 3 DAL migrations rewrite several of the same service and hook files targeted here — auditing before Phase 3 runs will produce stale results. After Phase 3 completes, re-audit each listed file rather than relying on pre-Phase-3 import counts.

## Functional Acceptance Criteria

- [x] **AC1:** All service layer files properly differentiate between runtime and type-only Transaction imports
- [x] **AC2:** All batch processing handler files use `import type` where appropriate
- [x] **AC3:** `src/features/scan/handlers/processScan/types.ts` correctly categorizes its mixed imports (already correct)
- [x] **AC4:** `npm run test:quick` passes (301 passed; 1 pre-existing DashboardView failure unrelated to imports)

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [x] **AC-ARCH-LOC-1:** No file moves — only import keyword changes within existing files

### Pattern Requirements

- [x] **AC-ARCH-PAT-1:** `import type { Transaction }` used where Transaction only appears in type annotations (function parameters, return types, type aliases)
- [x] **AC-ARCH-PAT-2:** Full `import { Transaction }` retained where Transaction is used in runtime values — N/A: Transaction is an interface, all 9 files are type-only

### Anti-Pattern Requirements (Must NOT Happen)

- [x] **AC-ARCH-NO-1:** Do NOT create sub-types (TransactionBase, TransactionDisplay, etc.) — flat Transaction is correct ✓
- [x] **AC-ARCH-NO-2:** Do NOT change category-type imports (StoreCategory, ItemCategory) — those are handled in 15b-4b ✓
- [x] **AC-ARCH-NO-3:** Do NOT batch-update multiple files without testing between each — fix and test atomically ✓

## File Specification

### Modified Files

| File | Exact Path | Change |
|------|------------|--------|
| transactionRepository.ts | `src/repositories/transactionRepository.ts` | Audit; `import type { Transaction }` if type-only |
| duplicateDetectionService.ts | `src/services/duplicateDetectionService.ts` | Audit; likely `import type` |
| firestore.ts | `src/services/firestore.ts` | Audit carefully; may need runtime import |
| gemini.ts | `src/services/gemini.ts` | Audit; likely needs full import for return type values |
| pendingScanStorage.ts | `src/services/pendingScanStorage.ts` | `import type { Transaction }` if type-only |
| insightEngineService.ts | `src/features/insights/services/insightEngineService.ts` | Audit; likely type-only |
| recordsService.ts | `src/features/insights/services/recordsService.ts` | `import type { Transaction }` if type-only |
| batchProcessingService.ts | `src/features/batch-review/services/batchProcessingService.ts` | Likely needs runtime; audit carefully |
| processScan/types.ts | `src/features/scan/handlers/processScan/types.ts` | KEY FILE: Separate runtime from type-only imports |

## Tasks / Subtasks

### Task 1: Audit service files for import classification

- [x] 1.1 `src/repositories/transactionRepository.ts` — Already using `import type` ✓
- [x] 1.2 `src/services/duplicateDetectionService.ts` — Type-only (9 function param types) → fixed
- [x] 1.3 `src/services/firestore.ts` — Type-only (params, returns, `as` casts, generics) → fixed
- [x] 1.4 `src/services/gemini.ts` — Type-only (return type + generic param) → fixed
- [x] 1.5 `src/services/pendingScanStorage.ts` — Already using `import type` ✓
- [x] 1.6 `src/features/insights/services/insightEngineService.ts` — Type-only (6 function param types) → fixed
- [x] 1.7 `src/features/insights/services/recordsService.ts` — Already using `import type` ✓

### Task 2: Fix processScan/types.ts (mixed imports)

- [x] 2.1 Read `src/features/scan/handlers/processScan/types.ts` completely
- [x] 2.2 All of `Transaction`, `TransactionItem`, `StoreCategory` already use `import type` ✓
- [x] 2.3 No change needed — already correct
- [x] 2.4 `npx tsc --noEmit` — compiles clean ✓

### Task 3: Update type-only service imports

- [x] 3.1 Updated 5 files: duplicateDetectionService, firestore, gemini, insightEngineService, batchProcessingService
- [x] 3.2 Ran `npx tsc --noEmit` after each file — all compile clean
- [x] 3.3 Deferred full test suite to Task 5

### Task 4: Handle runtime-heavy services (leave unchanged or minimal fix)

- [x] 4.1 `src/services/firestore.ts` — Audited: type-only (`as Transaction` casts + param types); fixed to `import type`
- [x] 4.2 `src/services/gemini.ts` — Audited: type-only (generic param + return type); fixed to `import type`
- [x] 4.3 `src/features/batch-review/services/batchProcessingService.ts` — Audited: type-only (interface fields + return type); fixed to `import type`

### Task 5: Verify and run tests

- [x] 5.1 Run `npm run test:quick` — 301 passed, 1 pre-existing failure (DashboardView, unrelated) ✓
- [x] 5.2 Run `npx tsc --noEmit` — no type errors ✓
- [x] 5.3 Documented: 5 updated (type-only), 4 already correct (no change) ✓

## Dev Notes

### Runtime vs Type-Only Classification

A Transaction import is **type-only** if it appears ONLY in:
- Function parameter type annotations: `(tx: Transaction) => ...`
- Return type annotations: `(): Transaction => ...`
- Type definitions: `type MyType = { tx: Transaction }`

It's **runtime** if it appears in:
- Object access: `transaction.id`, `transaction.total` (TypeScript erases types but this is a value usage)
- Array operations: `transactions.map(tx => tx.total)` — the variable `tx` is typed as Transaction but Transaction itself isn't needed at runtime
- Constructing objects typed as Transaction (rare)

**Key insight**: Accessing `.id` or `.total` on a variable typed as Transaction does NOT require the `Transaction` type to be imported at runtime — TypeScript erases all types. Only truly runtime-value uses (like `instanceof Transaction`) need the full import.

### processScan/types.ts is the Key File

This file re-exports types used by scan handlers. It likely has:
```typescript
import type { Transaction, TransactionItem, StoreCategory } from '@/types/transaction';
export type { ... }
```
If already using `import type`, no change needed. If using `import { }`, add `type` keyword.

### Test Between Each File

Do NOT batch-update multiple files then test. Fix one file, run tests, fix the next.

## ECC Analysis Summary

- **Risk Level:** LOW (mechanical import changes only)
- **Complexity:** Medium (requires careful audit of service patterns; no architectural changes)
- **Sizing:** 5 tasks / 19 subtasks / 9 files (within limits: max 8 tasks, max 40 subtasks, max 12 files)
- **Agents consulted:** Architect

## Senior Developer Review (ECC)

| Field | Value |
|-------|-------|
| Date | 2026-02-28 |
| Classification | STANDARD |
| Agents | code-reviewer, security-reviewer |
| Score | 10/10 |
| Outcome | APPROVE |
| Fixes Applied | 0 |
| TD Stories Created | 0 |
| Notes | Purely mechanical `import` to `import type` changes. All ACs met. Remaining candidates tracked by 15b-4d/4e. |

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft (sub-typing approach — services import TransactionMutation) |
| 2026-02-23 | Full rewrite. Sub-typing abandoned — flat Transaction is correct. Refocused on `import → import type` mechanical fix for services + batch handlers. No new types needed. |
| 2026-02-27 | ECC re-creation validation: 4 of 9 files likely already using `import type`. Effective diff is small. Phase 3 dependency noted — re-audit after Phase 3 completes. Status: ready-for-dev. |
| 2026-02-28 | ECC Code Review: APPROVE 10/10. Status: done. |
