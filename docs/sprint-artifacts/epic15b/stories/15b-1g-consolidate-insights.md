# Story 15b-1g: Consolidate features/insights/

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Move InsightsView and remaining insight hooks/components into `features/insights/`. The feature already has 30 files (7,485 lines) — this consolidates the ~3 remaining scattered files.

## Acceptance Criteria

- [ ] **AC1:** InsightsView.tsx moved into `features/insights/views/`
- [ ] **AC2:** Remaining insight hooks/components moved into feature
- [ ] **AC3:** Test files migrated alongside source files
- [ ] **AC4:** All imports updated — 0 references to old paths
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Move InsightsView.tsx into `features/insights/views/`
- [ ] **Task 2:** Move remaining insight hooks from `src/hooks/`
- [ ] **Task 3:** Move remaining insight components from `src/components/`
- [ ] **Task 4:** Migrate test files to mirror structure
- [ ] **Task 5:** Update all consumer imports and barrel exports

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/views/InsightsView.tsx` | MOVE | → `src/features/insights/views/` |
| Remaining insight hooks | MOVE | → `src/features/insights/hooks/` |
| Test mirrors | MOVE | → `tests/unit/features/insights/` |
| `src/features/insights/index.ts` | MODIFY | Add new exports |

## Dev Notes

- InsightsView (755 lines) is in the warning zone but below 800 — no decomposition needed
- insights already has 30 files — verify there aren't duplicate hooks between feature and flat dirs
- Small scope — may be combined with 15b-1h in sprint planning if capacity allows
