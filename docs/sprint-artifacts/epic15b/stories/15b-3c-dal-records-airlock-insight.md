# Story 15b-3c: DAL: Migrate Records + Airlock + Insight Profile Hooks

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 3
**Priority:** MEDIUM
**Status:** drafted

## Description

Migrate records, airlock, and insight profile hooks from direct Firebase/service imports to their respective repositories. Combined because all three are small consumer groups.

**IMPORTANT:** Before implementation, run verified grep to confirm exact consumer counts.

## Acceptance Criteria

- [ ] **AC1:** Records hooks use RecordsRepository (~3 consumers)
- [ ] **AC2:** Airlock hooks use AirlockRepository (~3 consumers)
- [ ] **AC3:** Insight profile hooks use InsightProfileRepository (~2 consumers)
- [ ] **AC4:** No direct Firebase imports in migrated hooks
- [ ] **AC5:** Each consumer migrated individually with tests passing
- [ ] **AC6:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Grep for direct records/airlock/insight service imports — confirm counts
- [ ] **Task 2:** Migrate records consumers one-by-one
- [ ] **Task 3:** Migrate airlock consumers one-by-one
- [ ] **Task 4:** Migrate insight profile consumers one-by-one
- [ ] **Task 5:** Run `npm run test:quick`

## File Specification

| File | Action | Description |
|------|--------|-------------|
| Records consumer hooks (~3 files) | MODIFY | Replace service imports with repository |
| Airlock consumer hooks (~3 files) | MODIFY | Replace service imports with repository |
| Insight profile consumer hooks (~2 files) | MODIFY | Replace service imports with repository |
| `src/repositories/recordsRepository.ts` | VERIFY | Ensure methods exist |
| `src/repositories/airlockRepository.ts` | VERIFY | Ensure methods exist |
| `src/repositories/insightProfileRepository.ts` | VERIFY | Ensure methods exist |

## Dev Notes

- Total ~8 consumers across 3 repositories — within the 4-5 per story guideline when grouped
- If any repository is missing methods, add them before migrating consumers
- insightProfileService had TOCTOU fixes in Epic 15 (TD-20, TD-24) — ensure repository wraps the fixed versions
