# Story 15b-3e: DAL: Migrate Remaining View/Component Firebase Imports

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

After DAL stories 15b-3a through 15b-3d migrate hooks, this story catches any remaining view/component files that still import Firebase SDK directly. Views and components should never import Firebase — they should use hooks or repositories.

## Acceptance Criteria

- [ ] **AC1:** 0 view files with direct Firebase SDK imports
- [ ] **AC2:** 0 component files with direct Firebase SDK imports
- [ ] **AC3:** Service-layer Firebase imports <8 files total
- [ ] **AC4:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Grep for Firebase SDK imports in `src/views/` and `src/components/` and `src/features/*/views/` and `src/features/*/components/`
- [ ] **Task 2:** For each found import, determine correct repository or hook to use instead
- [ ] **Task 3:** Migrate each file to use repository/hook instead of direct Firebase
- [ ] **Task 4:** Final count: grep all Firebase SDK imports by category
  - [ ] Type-only imports (~10) — acceptable
  - [ ] Repository implementations (~8) — acceptable (DAL boundary)
  - [ ] Infrastructure (~7) — acceptable (config, auth, migration)
  - [ ] **Service-layer must be <8**
- [ ] **Task 5:** Run `npm run test:quick`

## File Specification

| File | Action | Description |
|------|--------|-------------|
| View/component files with Firebase imports | MODIFY | Replace with repository/hook usage |

## Dev Notes

- This is the Phase 3 cleanup story — catches anything missed by 15b-3a through 15b-3d
- Firebase metric is "service-layer imports <8" — type-only and infrastructure imports are excluded
- If a view imports `Timestamp` only for type annotation, that's a type-only import and acceptable
