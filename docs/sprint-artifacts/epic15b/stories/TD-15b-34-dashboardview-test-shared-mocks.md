# TD-15b-34: DRY DashboardView Test Mock/Helper Deduplication

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 4 - Architecture (tech debt)
**Points:** 1
**Priority:** LOW
**Status:** ready-for-dev
**Source:** TD-15b-32 code review — findings #1, #2 (mock/helper duplication)

## Story

As a **developer**, I want **shared mock setup and render helpers for the DashboardView test files**, so that **mock changes are single-point and test maintenance cost is reduced**.

## Acceptance Criteria

- [ ] **AC1:** `renderDashboardView` helper extracted to `dashboardViewFixtures.ts` (single source)
- [ ] **AC2:** Mock blocks (firebase/firestore, firestore service, useAllUserGroups, shared/hooks, shared/stores) extracted to shared mock setup
- [ ] **AC3:** All 3 DashboardView test files import from shared setup instead of duplicating
- [ ] **AC4:** All tests pass in both isolation and parallel (`test:quick`)

## Tasks / Subtasks

### Task 1: Extract shared mocks and helpers

- [ ] 1.1 Move `renderDashboardView` helper to `dashboardViewFixtures.ts`
- [ ] 1.2 Create shared mock setup (vitest `vi.mock` calls) in fixtures or a separate `dashboardViewMocks.ts`
- [ ] 1.3 Update `DashboardView.carousel.test.tsx` to use shared setup
- [ ] 1.4 Update `DashboardView.recientes.test.tsx` to use shared setup
- [ ] 1.5 Update `DashboardView.fulllist.test.tsx` to use shared setup (handle `navigationDisabled` variant)
- [ ] 1.6 Verify `test:quick` passes (304 files, 0 failures)

## Dev Notes

- Source story: [TD-15b-32](./TD-15b-32-dashboardview-test-parallel-flake.md)
- Review findings: #1 (renderDashboardView duplication), #2 (mock block duplication)
- Files affected: `tests/unit/views/dashboardViewFixtures.ts`, `tests/unit/views/DashboardView.*.test.tsx`
- Estimated savings: ~90 lines of duplicated code across 3 files
- Note: vitest `vi.mock()` hoisting may require keeping mock calls in test files — investigate if shared module pattern works with vitest hoisting

## File List

| File | Action | Lines |
|------|--------|-------|
| `tests/unit/views/dashboardViewFixtures.ts` | Modified | ~+30 |
| `tests/unit/views/DashboardView.carousel.test.tsx` | Modified | ~-30 |
| `tests/unit/views/DashboardView.recientes.test.tsx` | Modified | ~-30 |
| `tests/unit/views/DashboardView.fulllist.test.tsx` | Modified | ~-30 |

## Change Log

| Date | Change |
|------|--------|
| 2026-03-01 | Created from TD-15b-32 code review — mock/helper deduplication |
