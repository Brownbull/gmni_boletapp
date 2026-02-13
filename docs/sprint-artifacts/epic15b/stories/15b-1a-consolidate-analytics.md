# Story 15b-1a: Consolidate features/analytics/

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 3
**Priority:** MEDIUM
**Status:** drafted

## Description

Move TrendsView directory (17 files), analytics-related hooks, and remaining utils into `features/analytics/`. Migrate corresponding test files alongside source files. This is the largest consolidation story due to TrendsView's extensive sub-file structure.

## Acceptance Criteria

- [ ] **AC1:** TrendsView/ directory and all sub-files moved into `features/analytics/views/`
- [ ] **AC2:** Analytics-related hooks moved into `features/analytics/hooks/`
- [ ] **AC3:** Test files migrated alongside source files (mirror structure in `tests/unit/features/analytics/`)
- [ ] **AC4:** All imports updated — grep confirms 0 references to old paths
- [ ] **AC5:** Re-export shims added at old locations if >5 consumers
- [ ] **AC6:** `npm run test:quick` passes
- [ ] **AC7:** Feature barrel `index.ts` updated with new exports

## Tasks

- [ ] **Task 1:** Move TrendsView/ directory into `features/analytics/views/`
  - [ ] Move all 17 files
  - [ ] Update internal imports within moved files
- [ ] **Task 2:** Move analytics hooks from `src/hooks/` to `features/analytics/hooks/`
  - [ ] Identify analytics-specific hooks via import analysis
  - [ ] Move and update imports
- [ ] **Task 3:** Move remaining analytics utils from `src/utils/` to `features/analytics/utils/`
- [ ] **Task 4:** Migrate test files to mirror new source structure
  - [ ] Move test files from `tests/unit/views/TrendsView/` to `tests/unit/features/analytics/views/`
  - [ ] Update mock paths in moved tests
- [ ] **Task 5:** Update all consumer imports across codebase
  - [ ] Use ast-grep or grep to find all old-path references
  - [ ] Add re-export shims at old locations if >5 consumers
- [ ] **Task 6:** Update `features/analytics/index.ts` barrel exports
  - [ ] Run `npm run test:quick` after each major move

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/views/TrendsView/` (17 files) | MOVE | → `src/features/analytics/views/TrendsView/` |
| `src/hooks/useTrends*.ts` | MOVE | → `src/features/analytics/hooks/` |
| `tests/unit/views/TrendsView/` | MOVE | → `tests/unit/features/analytics/views/TrendsView/` |
| `src/features/analytics/index.ts` | MODIFY | Add new exports |
| Consumer files | MODIFY | Update import paths |

## Dev Notes

- TrendsView has 17 sub-files from Epic 15 Phase 5b decomposition — all move together
- Max 20 source+test files per consolidation story — this story may approach that limit
- Run `npx tsc --noEmit` after each batch of file moves to catch import errors early
- Check for path aliases (`@/*`) — these may need updating in tsconfig paths or import rewrites
- Depcruise after completion to ensure no new cycles introduced
