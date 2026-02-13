# Story 15b-4e: Update Transaction Type Consumers — Batch 3 (Views + Components + Cleanup)

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Update view and component files to import from specific transaction sub-types, then remove the backward-compatibility re-export shim from the original `transaction.ts`. Final consumer migration batch.

## Acceptance Criteria

- [ ] **AC1:** All view files import from specific sub-types where possible
- [ ] **AC2:** All component files import from specific sub-types
- [ ] **AC3:** Re-export shim removed from `types/transaction.ts`
- [ ] **AC4:** `transaction.ts` dependents reduced from 109 to <50
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** List all view/component files that import from `types/transaction`
- [ ] **Task 2:** Update imports one-by-one, test between each
- [ ] **Task 3:** Verify all consumers now import from sub-type files
- [ ] **Task 4:** Remove re-export shim from `types/transaction.ts`
  - [ ] Original file can be deleted or kept as barrel
- [ ] **Task 5:** Count remaining `transaction/index.ts` dependents — must be <50
- [ ] **Task 6:** Run `npm run test:quick`

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/views/*.tsx` (transaction-related) | MODIFY | Import sub-types |
| `src/components/*.tsx` (transaction-related) | MODIFY | Import sub-types |
| `src/features/*/views/*.tsx` (transaction-related) | MODIFY | Import sub-types |
| `src/types/transaction.ts` | MODIFY/DELETE | Remove re-export shim |

## Dev Notes

- Views typically need `TransactionDisplay` for rendering
- Components that render transaction cards/lists need display types
- After removing the shim, any remaining consumers importing from `types/transaction` must be updated
- Target: <50 dependents on the main transaction barrel (down from 109)
