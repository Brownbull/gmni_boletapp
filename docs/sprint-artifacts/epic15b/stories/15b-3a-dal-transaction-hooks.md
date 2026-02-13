# Story 15b-3a: DAL: Migrate Transaction Hooks to TransactionRepository

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** HIGH
**Status:** drafted

## Description

Migrate transaction-related hooks from direct Firebase/service imports to the TransactionRepository pattern established in Epic 15 Phase 6. This is the largest DAL consumer group with ~8 hooks/views importing transaction services directly.

**IMPORTANT:** Before implementation, run verified grep to confirm exact consumer count and adjust scope.

## Acceptance Criteria

- [ ] **AC1:** All transaction hooks use TransactionRepository instead of direct service imports
- [ ] **AC2:** No direct Firebase imports in migrated hooks (only repository imports)
- [ ] **AC3:** Repository method signatures match existing service function signatures
- [ ] **AC4:** Each consumer migrated individually with tests passing between migrations
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Grep for all direct transaction service/Firebase imports in hooks
  - [ ] Confirm exact consumer count (estimated ~8)
  - [ ] List each consumer file
- [ ] **Task 2:** Migrate consumers one-by-one
  - [ ] Replace service imports with repository hook imports
  - [ ] Run tests after each migration
- [ ] **Task 3:** Verify no remaining direct imports
- [ ] **Task 4:** Run `npm run test:quick`

## File Specification

| File | Action | Description |
|------|--------|-------------|
| Transaction hooks (~8 files) | MODIFY | Replace service imports with repository |
| `src/repositories/transactionRepository.ts` | VERIFY | Ensure all needed methods exist |

## Dev Notes

- Repository wraps existing service — ZERO behavior change expected
- If repository is missing a method the consumer needs, add it to the repository first
- Consumer-by-consumer migration isolates regressions
- `transaction.ts` type imports are OK — only runtime Firebase SDK imports should be replaced
