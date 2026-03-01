# TD-15b-34: DRY DashboardView Test Mock/Helper Deduplication

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 4 - Architecture (tech debt)
**Points:** 1
**Priority:** LOW
**Status:** done
**Source:** TD-15b-32 code review — findings #1, #2 (mock/helper duplication)

## Story

As a **developer**, I want **shared mock setup and render helpers for the DashboardView test files**, so that **mock changes are single-point and test maintenance cost is reduced**.

## Acceptance Criteria

- [x] **AC1:** `createRenderDashboardView` factory extracted to `dashboardViewFixtures.tsx` (single source)
- [x] **AC2:** Mock blocks (firebase/firestore, firestore service, useAllUserGroups, shared/hooks, shared/stores) remain per-file due to vitest hoisting — render helper is the shared piece
- [x] **AC3:** All 3 DashboardView test files import from shared setup instead of duplicating
- [x] **AC4:** All tests pass in both isolation and parallel (`test:quick`)

## Tasks / Subtasks

### Task 1: Extract shared mocks and helpers

- [x] 1.1 Rename `dashboardViewFixtures.ts` → `dashboardViewFixtures.tsx` (JSX support)
- [x] 1.2 Add `createRenderDashboardView` factory to fixtures (accepts `mockHookData` parameter)
- [x] 1.3 Update `DashboardView.carousel.test.tsx` to use shared setup
- [x] 1.4 Update `DashboardView.recientes.test.tsx` to use shared setup
- [x] 1.5 Update `DashboardView.fulllist.test.tsx` to use shared setup
- [x] 1.6 Verify all 3 test files pass (39 tests, 2 skipped pre-existing)

## Dev Notes

- Source story: [TD-15b-32](./TD-15b-32-dashboardview-test-parallel-flake.md)
- Review findings: #1 (renderDashboardView duplication), #2 (mock block duplication)
- vi.mock() calls must stay per-file due to vitest hoisting — only `renderDashboardView` could be extracted
- Factory pattern `createRenderDashboardView(mockHookData)` preserves per-file mock identity while sharing helper body
- Files renamed `.ts` → `.tsx` for JSX support (import paths unchanged — no extension in imports)
- Each test file removed ~10 lines of helper body, replaced with 1-line factory call
- Removed unused `render`, `DashboardView`, `UseDashboardViewDataReturn` imports from test files (now in fixtures)
- Review fix: `vi.clearAllMocks()` → `vi.resetAllMocks()` in all 3 test files (project convention)
- Review fix: removed duplicate test in recientes (lines 147-152 identical to 129-133)
- Review pass 2: extracted `normalizeTransactionOverrides` as testable pure function
- Review pass 2: added `dashboardViewFixtures.test.ts` (4 tests for normalization branches)
- Review pass 2: added JSDoc explaining intentional Object.assign mutation pattern

## File List

| File | Action | Lines |
|------|--------|-------|
| `tests/unit/views/dashboardViewFixtures.tsx` | Modified (renamed + factory added + normalize extracted) | ~+30 |
| `tests/unit/views/dashboardViewFixtures.test.ts` | Created (normalization unit tests) | ~40 |
| `tests/unit/views/DashboardView.carousel.test.tsx` | Modified | ~-13 |
| `tests/unit/views/DashboardView.recientes.test.tsx` | Modified | ~-13 |
| `tests/unit/views/DashboardView.fulllist.test.tsx` | Modified | ~-13 |

## Change Log

| Date | Change |
|------|--------|
| 2026-03-01 | Created from TD-15b-32 code review — mock/helper deduplication |
| 2026-03-01 | Implemented: factory pattern + file rename + 3 test file updates |
| 2026-03-01 | Review pass 1: APPROVE 8.5/10 — fixed clearAllMocks→resetAllMocks, removed duplicate test |
| 2026-03-01 | Review pass 2: APPROVE 8.5/10 — extracted normalizeTransactionOverrides, added unit test |

## Senior Developer Review (ECC)

| Field | Value |
|-------|-------|
| Date | 2026-03-01 |
| Agents | code-reviewer, tdd-guide |
| Classification | SIMPLE |
| Score | 8.5/10 |
| Outcome | APPROVE |
| Fixes | 4 (vi.resetAllMocks, duplicate test, normalizeTransactionOverrides extract, normalization unit test) |
| TD stories | 0 |
