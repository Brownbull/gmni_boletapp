# Story 15b-3b: DAL: Migrate Trust + Preferences Hooks to Repositories

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Migrate trust and preferences hooks from direct Firebase/service imports to TrustRepository and PreferencesRepository. Combined because both are smaller consumer groups.

**IMPORTANT:** Before implementation, run verified grep to confirm exact consumer counts.

## Acceptance Criteria

- [ ] **AC1:** Trust hooks use TrustRepository instead of direct service imports (~2 consumers)
- [ ] **AC2:** Preferences hooks use PreferencesRepository (~11 consumers, verify count)
- [ ] **AC3:** No direct Firebase imports in migrated hooks
- [ ] **AC4:** Each consumer migrated individually with tests passing
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Grep for direct trust service imports — confirm count
- [ ] **Task 2:** Grep for direct preferences service imports — confirm count
- [ ] **Task 3:** Migrate trust consumers one-by-one
- [ ] **Task 4:** Migrate preferences consumers one-by-one (max 4-5 per story — split if >5)
- [ ] **Task 5:** Run `npm run test:quick`

## File Specification

| File | Action | Description |
|------|--------|-------------|
| Trust consumer hooks (~2 files) | MODIFY | Replace service imports with repository |
| Preferences consumer hooks (verify count) | MODIFY | Replace service imports with repository |
| `src/repositories/trustRepository.ts` | VERIFY | Ensure methods exist |
| `src/repositories/preferencesRepository.ts` | VERIFY | Ensure methods exist |

## Dev Notes

- Preferences has the highest estimated consumer count (~11) — if actual count exceeds 5, split into two stories
- Trust was partially migrated in Epic 15 Phase 6c (2 of ~4 consumers done)
- DAL migration limit: max 4-5 consumers per story
