# Story 15b-3d: DAL: Migrate Credits Hooks to CreditsRepository

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Migrate credits-related hooks from direct Firebase/service imports to CreditsRepository.

**IMPORTANT:** Before implementation, run verified grep to confirm exact consumer count.

## Acceptance Criteria

- [ ] **AC1:** Credits hooks use CreditsRepository instead of direct service imports (~4 consumers)
- [ ] **AC2:** No direct Firebase imports in migrated hooks
- [ ] **AC3:** Each consumer migrated individually with tests passing
- [ ] **AC4:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Grep for direct credits service imports — confirm count
- [ ] **Task 2:** Migrate consumers one-by-one
- [ ] **Task 3:** Verify no remaining direct imports
- [ ] **Task 4:** Run `npm run test:quick`

## File Specification

| File | Action | Description |
|------|--------|-------------|
| Credits consumer hooks (~4 files) | MODIFY | Replace service imports with repository |
| `src/repositories/creditsRepository.ts` | VERIFY | Ensure methods exist |

## Dev Notes

- Credits service had TOCTOU fixes in Epic 15 (TD-1, TD-10, TD-13) with `runTransaction()` wrapping
- Ensure CreditsRepository wraps the transactional versions of credit operations
- `useUserCredits` was specifically called out in TD-10 for bypassing transaction safety — verify it uses the safe repository methods
