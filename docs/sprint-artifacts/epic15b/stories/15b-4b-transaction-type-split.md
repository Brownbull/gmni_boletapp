# Story 15b-4b: Split transaction.ts into Domain Sub-Types

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** HIGH
**Status:** drafted

## Description

Implement the sub-type schema designed in 15b-4a. Split `types/transaction.ts` into domain-specific sub-type files while maintaining backward compatibility through a re-export shim in the original file.

## Acceptance Criteria

- [ ] **AC1:** Sub-type files created per design from 15b-4a
- [ ] **AC2:** Original `transaction.ts` re-exports all types for backward compatibility
- [ ] **AC3:** Full `Transaction` type still available (intersection of sub-types)
- [ ] **AC4:** No consumer changes needed yet (re-export shim handles it)
- [ ] **AC5:** `npm run test:quick` passes (zero consumer breakage)

## Tasks

- [ ] **Task 1:** Create sub-type files per design
  - [ ] `types/transaction/base.ts`
  - [ ] `types/transaction/display.ts`
  - [ ] `types/transaction/mutation.ts`
  - [ ] `types/transaction/index.ts` (barrel with full type)
- [ ] **Task 2:** Move type definitions from `transaction.ts` into sub-type files
- [ ] **Task 3:** Create re-export shim in original `transaction.ts`
  - [ ] `export * from './transaction/'` or equivalent
- [ ] **Task 4:** Verify all 109 consumers still compile
- [ ] **Task 5:** Run `npm run test:quick`

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/types/transaction.ts` | MODIFY | Becomes re-export shim |
| `src/types/transaction/base.ts` | CREATE | Base/shared fields |
| `src/types/transaction/display.ts` | CREATE | Display fields |
| `src/types/transaction/mutation.ts` | CREATE | Mutation fields |
| `src/types/transaction/index.ts` | CREATE | Barrel with full Transaction type |

## Dev Notes

- The re-export shim ensures ZERO consumer changes in this story
- Consumer migration happens in 15b-4c through 15b-4e
- TypeScript should handle this transparently — `import { Transaction } from '@/types/transaction'` still works
- Run `npx tsc --noEmit` frequently during this story to catch type errors
