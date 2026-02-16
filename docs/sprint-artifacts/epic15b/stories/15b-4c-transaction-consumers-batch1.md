# Story 15b-4c: Update Transaction Type Consumers — Batch 1 (Services + Repos)

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Update service and repository files to import from specific transaction sub-types instead of the full Transaction type. This is the first of 3 consumer migration batches.

## Acceptance Criteria

- [ ] **AC1:** All service files import from specific sub-types (e.g., `TransactionMutation` for write services)
- [ ] **AC2:** All repository files import from specific sub-types
- [ ] **AC3:** No service/repo imports the full `Transaction` type when a sub-type suffices
- [ ] **AC4:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** List all service files that import from `types/transaction`
- [ ] **Task 2:** For each service, determine the appropriate sub-type
  - [ ] Write services → `TransactionMutation`
  - [ ] Read/display services → `TransactionDisplay` or `TransactionBase`
  - [ ] Services that need both → keep full `Transaction`
- [ ] **Task 3:** Update imports one-by-one, test between each
- [ ] **Task 4:** Same for repository files
- [ ] **Task 5:** Run `npm run test:quick`

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/services/*Service.ts` (transaction-related) | MODIFY | Import sub-types |
| `src/repositories/*Repository.ts` (transaction-related) | MODIFY | Import sub-types |

## Dev Notes

- Services and repos are the DAL boundary — most natural place to use specific sub-types
- If a function parameter only needs `id` and `amount`, use `TransactionBase` not full `Transaction`
- Keep the full type where genuinely needed — don't force narrow types where they don't fit
