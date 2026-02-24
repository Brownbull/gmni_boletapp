# Story 15b-4c: Fix Transaction Runtime Imports — Services & Batch Handlers

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 4 - Architecture
**Points:** 3
**Priority:** MEDIUM
**Status:** drafted

## Overview

Fix runtime imports of Transaction types in service and batch handler files. Change `import { Transaction }` to `import type { Transaction }` where the type is only used in type annotations, not runtime values. This improves tree-shaking and bundle size without architectural changes. The sub-type split originally planned in this story is NOT the approach — the flat `Transaction` interface does not benefit from sub-typing (see 15b-4a design doc).

> **Phase 3 dependency:** All Phase 3 stories (15b-3a through 15b-3e) must be complete before starting this story. Phase 3 DAL migrations rewrite several of the same service and hook files targeted here — auditing before Phase 3 runs will produce stale results. After Phase 3 completes, re-audit each listed file rather than relying on pre-Phase-3 import counts.

## Functional Acceptance Criteria

- [ ] **AC1:** All service layer files properly differentiate between runtime and type-only Transaction imports
- [ ] **AC2:** All batch processing handler files use `import type` where appropriate
- [ ] **AC3:** `src/features/scan/handlers/processScan/types.ts` correctly categorizes its mixed imports
- [ ] **AC4:** `npm run test:quick` passes with 0 failures

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] **AC-ARCH-LOC-1:** No file moves — only import keyword changes within existing files

### Pattern Requirements

- [ ] **AC-ARCH-PAT-1:** `import type { Transaction }` used where Transaction only appears in type annotations (function parameters, return types, type aliases)
- [ ] **AC-ARCH-PAT-2:** Full `import { Transaction }` retained where Transaction is used in runtime values (object spreads, loops over transactions, `instanceof` checks)

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] **AC-ARCH-NO-1:** Do NOT create sub-types (TransactionBase, TransactionDisplay, etc.) — flat Transaction is correct
- [ ] **AC-ARCH-NO-2:** Do NOT change category-type imports (StoreCategory, ItemCategory) — those are handled in 15b-4b
- [ ] **AC-ARCH-NO-3:** Do NOT batch-update multiple files without testing between each — fix and test atomically

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

- [ ] 1.1 `src/repositories/transactionRepository.ts` — Check if Transaction used in return values or only type annotations
- [ ] 1.2 `src/services/duplicateDetectionService.ts` — Trace usage; likely type-only in function signatures
- [ ] 1.3 `src/services/firestore.ts` — Complex; may import types AND runtime values (batch operations)
- [ ] 1.4 `src/services/gemini.ts` — Likely runtime usage (returns/receives transactions)
- [ ] 1.5 `src/services/pendingScanStorage.ts` — Check storage interaction pattern
- [ ] 1.6 `src/features/insights/services/insightEngineService.ts` — Likely type-only
- [ ] 1.7 `src/features/insights/services/recordsService.ts` — Trace to determine type vs runtime usage

### Task 2: Fix processScan/types.ts (mixed imports)

- [ ] 2.1 Read `src/features/scan/handlers/processScan/types.ts` completely
- [ ] 2.2 Identify which of `Transaction`, `TransactionItem`, `StoreCategory` are used only in type annotations vs. runtime values
- [ ] 2.3 Apply `import type` for type-only, keep full import for runtime
- [ ] 2.4 Run `npx tsc --noEmit` — must compile clean

### Task 3: Update type-only service imports

- [ ] 3.1 For each service classified as type-only, update: `import { Transaction }` → `import type { Transaction }`
- [ ] 3.2 After each service, run `npx vitest run <service-test-path>` or `npm run test:quick` to verify
- [ ] 3.3 If service has no tests, run `npm run test:quick` to catch integration failures

### Task 4: Handle runtime-heavy services (leave unchanged or minimal fix)

- [ ] 4.1 `src/services/firestore.ts` — If clearly type-only use, add `type` keyword; if mixed, leave unchanged
- [ ] 4.2 `src/services/gemini.ts` — Likely needs full import; leave unchanged unless audited as type-only
- [ ] 4.3 `src/features/batch-review/services/batchProcessingService.ts` — Audit carefully; likely needs runtime

### Task 5: Verify and run tests

- [ ] 5.1 Run `npm run test:quick` — all tests must pass, 0 failures
- [ ] 5.2 Run `npx tsc --noEmit` — no type errors
- [ ] 5.3 Document which services were updated (type-only) vs. left unchanged (runtime)

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

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft (sub-typing approach — services import TransactionMutation) |
| 2026-02-23 | Full rewrite. Sub-typing abandoned — flat Transaction is correct. Refocused on `import → import type` mechanical fix for services + batch handlers. No new types needed. |
