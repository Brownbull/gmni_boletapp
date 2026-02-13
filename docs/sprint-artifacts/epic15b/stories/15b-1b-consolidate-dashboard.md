# Story 15b-1b: Consolidate features/dashboard/

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Move DashboardView directory (13 files), dashboard-related hooks, and components into `features/dashboard/`. The dashboard feature currently has only 1 file (11 lines) — an empty placeholder from Epic 15 Phase 4e. This story fills it with the actual dashboard implementation files.

## Acceptance Criteria

- [ ] **AC1:** DashboardView/ directory and all sub-files moved into `features/dashboard/views/`
- [ ] **AC2:** Dashboard-related hooks moved into `features/dashboard/hooks/`
- [ ] **AC3:** Test files migrated alongside source files
- [ ] **AC4:** All imports updated — 0 references to old paths
- [ ] **AC5:** `npm run test:quick` passes
- [ ] **AC6:** Feature barrel `index.ts` updated

## Tasks

- [ ] **Task 1:** Move DashboardView/ directory into `features/dashboard/views/`
  - [ ] Move all ~13 files
  - [ ] Update internal imports
- [ ] **Task 2:** Move dashboard hooks from `src/hooks/` to `features/dashboard/hooks/`
- [ ] **Task 3:** Migrate test files to mirror structure
  - [ ] Update mock paths in moved tests
- [ ] **Task 4:** Update all consumer imports across codebase
  - [ ] Add re-export shims at old locations if >5 consumers
- [ ] **Task 5:** Update `features/dashboard/index.ts` barrel exports
- [ ] **Task 6:** Run `npm run test:quick` after each major move

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/views/DashboardView/` (~13 files) | MOVE | → `src/features/dashboard/views/DashboardView/` |
| `src/hooks/useDashboard*.ts` | MOVE | → `src/features/dashboard/hooks/` |
| `tests/unit/views/DashboardView/` | MOVE | → `tests/unit/features/dashboard/views/` |
| `src/features/dashboard/index.ts` | MODIFY | Replace placeholder with real exports |
| Consumer files | MODIFY | Update import paths |

## Dev Notes

- DashboardView was decomposed in Epic 15 Phase 5c (3,412→1,485 + 10 sub-files) — all move together
- The existing `features/dashboard/` placeholder (1 file, 11 lines) gets replaced with actual content
- Run `npx tsc --noEmit` after each batch of moves
