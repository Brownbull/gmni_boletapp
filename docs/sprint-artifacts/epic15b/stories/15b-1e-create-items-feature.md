# Story 15b-1e: Create & Consolidate features/items/

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Create a new `features/items/` module and consolidate ItemsView, item components, and the `useItems` hook. This is the only completely new feature module in Epic 15b.

## Acceptance Criteria

- [ ] **AC1:** `features/items/` created with proper FSD structure (views/, hooks/, components/, index.ts)
- [ ] **AC2:** ItemsView/ directory moved into `features/items/views/`
- [ ] **AC3:** `components/items/` moved into `features/items/components/`
- [ ] **AC4:** `useItems` hook moved into `features/items/hooks/`
- [ ] **AC5:** Test files migrated alongside source files
- [ ] **AC6:** All imports updated — 0 references to old paths
- [ ] **AC7:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Create `features/items/` directory structure
  - [ ] `views/`, `hooks/`, `components/`, `types/`, `index.ts`
- [ ] **Task 2:** Move ItemsView/ (~3 files) into `features/items/views/`
- [ ] **Task 3:** Move `components/items/` (~5 files) into `features/items/components/`
- [ ] **Task 4:** Move `hooks/useItems.ts` into `features/items/hooks/`
- [ ] **Task 5:** Migrate test files to mirror structure
- [ ] **Task 6:** Update all consumer imports and create barrel exports

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/items/` | CREATE | New feature module directory |
| `src/features/items/index.ts` | CREATE | Feature barrel exports |
| `src/views/ItemsView/` (~3 files) | MOVE | → `src/features/items/views/` |
| `src/components/items/` (~5 files) | MOVE | → `src/features/items/components/` |
| `src/hooks/useItems.ts` | MOVE | → `src/features/items/hooks/` |
| Test mirrors | MOVE | → `tests/unit/features/items/` |

## Dev Notes

- ItemsView (1,003 lines) is a never-scoped view — decomposed in 15b-2d after this move
- `useItems` (573 lines) is in the warning zone — may need decomposition in a future story
- Follow existing feature module patterns from `features/analytics/` or `features/scan/`
