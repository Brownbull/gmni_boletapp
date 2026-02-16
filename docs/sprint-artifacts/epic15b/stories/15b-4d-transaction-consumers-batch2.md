# Story 15b-4d: Update Transaction Type Consumers — Batch 2 (Hooks + Features)

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Update hook and feature files to import from specific transaction sub-types. Second of 3 consumer migration batches.

## Acceptance Criteria

- [ ] **AC1:** All hook files import from specific sub-types where possible
- [ ] **AC2:** All feature-internal files import from specific sub-types
- [ ] **AC3:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** List all hook files that import from `types/transaction`
- [ ] **Task 2:** For each hook, determine the appropriate sub-type
- [ ] **Task 3:** Update imports one-by-one, test between each
- [ ] **Task 4:** Same for feature-internal files (inside `features/*/`)
- [ ] **Task 5:** Run `npm run test:quick`

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/*transaction*.ts` | MODIFY | Import sub-types |
| `src/features/*/hooks/*.ts` (transaction-related) | MODIFY | Import sub-types |
| `src/features/*/utils/*.ts` (transaction-related) | MODIFY | Import sub-types |

## Dev Notes

- Hooks are the largest consumer category — expect 20-30 files
- Feature-internal hooks often only need display fields
- If a file needs to be touched again in 15b-4e, defer to that story instead
