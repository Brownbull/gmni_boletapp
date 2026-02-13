# Story 15b-1j: Consolidate features/settings/

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 1
**Priority:** LOW
**Status:** drafted

## Description

Move SettingsView directory and remaining settings components into `features/settings/`. The feature already has 17 files (3,376 lines) — this consolidates the ~5 remaining scattered files.

## Acceptance Criteria

- [ ] **AC1:** SettingsView/ directory moved into `features/settings/views/`
- [ ] **AC2:** Remaining settings components moved into feature
- [ ] **AC3:** Test files migrated alongside source files
- [ ] **AC4:** All imports updated — 0 references to old paths
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Move SettingsView/ (~3 files) into `features/settings/views/`
- [ ] **Task 2:** Move remaining settings components from `src/components/`
- [ ] **Task 3:** Migrate test files to mirror structure
- [ ] **Task 4:** Update all consumer imports and barrel exports

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/views/SettingsView/` (~3 files) | MOVE | → `src/features/settings/views/` |
| Remaining settings components | MOVE | → `src/features/settings/components/` |
| Test mirrors | MOVE | → `tests/unit/features/settings/` |
| `src/features/settings/index.ts` | MODIFY | Add new exports |

## Dev Notes

- settings already has 10 subviews inside the feature — this adds the main SettingsView shell
- Small scope story — straightforward file moves
