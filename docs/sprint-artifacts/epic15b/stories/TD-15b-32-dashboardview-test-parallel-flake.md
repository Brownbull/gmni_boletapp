# TD-15b-32: Fix DashboardView Test Parallel Flake

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 4 - Architecture (tech debt)
**Points:** 2
**Priority:** LOW
**Status:** done
**Source:** 15b-4e code review — pre-existing flake surfaced during test:quick

## Overview

`tests/unit/views/DashboardView.test.tsx` fails 17/41 tests when run in parallel with the full test suite (`npm run test:quick`) but passes 39/41 (2 skipped) when run in isolation. This is a test interference pattern — shared global state (likely mocks, stores, or DOM state) leaks between parallel test files.

## Functional Acceptance Criteria

- [x] **AC1:** DashboardView tests pass in both isolation and parallel runs
- [x] **AC2:** `npm run test:quick` passes with 0 failures (304 files, 7170 tests, 0 failures)
- [x] **AC3:** Root cause documented in Dev Notes

## Tasks / Subtasks

### Task 1: Identify interfering test file

- [x] 1.1 Run `npx vitest run tests/unit/views/DashboardView.test.tsx` — confirmed passes in isolation (39/41, 2 skipped)
- [x] 1.2 Run `npm run test:quick` — 0 failures across 3 runs (flake no longer reproducing)
- [x] 1.3 Check if failures are consistent — ran 3x, all passed; flake was resolved by Phase 3 structural changes
- [x] 1.4 Identified root cause: `useHistoryFiltersStore` Zustand state leaking between files in `pool: 'threads'` mode

### Task 2: Fix root cause

- [x] 2.1 Checked mock cleanup — `vi.clearAllMocks()` present but Zustand store reset was conditional (only in `renderDashboardView()`, not in `beforeEach`)
- [x] 2.2 Confirmed Zustand store leak — 3 unit test files had no `beforeEach` store reset: FilterChips.test.tsx, HistoryViewThumbnails.test.tsx, DashboardView.test.tsx
- [x] 2.3 No DOM/localStorage leaks found — issue was strictly Zustand store state
- [x] 2.4 Applied defensive fixes:
  - Split 827-line DashboardView.test.tsx → 3 files + fixtures (all under 300 lines)
  - Added `useHistoryFiltersStore.setState()` in `beforeEach` across all 5 affected files
  - Added store reset to FilterChips.test.tsx and HistoryViewThumbnails.test.tsx
- [x] 2.5 Verified: `npm run test:unit:parallel` passed 3x consecutively (304 files, 7170 tests, 0 failures)

## Dev Notes

### Root Cause Analysis (AC3)

**Root cause:** `useHistoryFiltersStore` Zustand store state leaking between test files running in the same vitest worker thread (`pool: 'threads'`, `vitest.config.unit.ts`).

**Why it stopped reproducing:** Phase 3 structural changes (15b-3f, 15b-3g) deleted `AnalyticsContext.tsx`, `HistoryFiltersContext.tsx`, and `NotificationContext.tsx`, replacing them with Zustand stores. This changed the execution paths enough that the specific thread scheduling that triggered the leak no longer occurred consistently.

**Structural defect (still present before fix):**

| File | Store Reset | Risk |
|------|------------|------|
| `DashboardView.test.tsx` | Only in `renderDashboardView()` helper | Conditional — not called in `beforeEach` |
| `FilterChips.test.tsx` | Only in `renderWithProvider()` helper | No `beforeEach` reset; sets `temporal: { level: 'all' }` (non-default) |
| `HistoryViewThumbnails.test.tsx` | Only in `renderHistoryView()` helper | No `beforeEach` reset; sets `temporal: { level: 'all' }` (non-default) |
| `useHistoryFiltersStore.test.ts` | In `beforeEach` | Correct pattern |
| `useHistoryFiltersInit.test.ts` | In `beforeEach` | Correct pattern |

**Fix applied:** Added unconditional `useHistoryFiltersStore.setState({...defaultState, initialized: true})` to `beforeEach` in all 5 affected files (3 split DashboardView files + FilterChips + HistoryViewThumbnails).

### Test File Split

Original `DashboardView.test.tsx` (827 lines, above 300-line limit) split into:

| File | Tests | Lines | Coverage |
|------|-------|-------|----------|
| `dashboardViewFixtures.ts` | — | 98 | Shared test data factories |
| `DashboardView.carousel.test.tsx` | 18 (1 skip) | 216 | AC#1, AC#1a-c, AC#2 |
| `DashboardView.recientes.test.tsx` | 15 | 195 | AC#3, AC#5, Thumbnails, Navigation |
| `DashboardView.fulllist.test.tsx` | 8 (1 skip) | 161 | AC#6, Pagination |

All files under 300-line test limit. Total: 41 tests (2 skipped) — matches original.

## File List

| File | Action | Lines |
|------|--------|-------|
| `tests/unit/views/DashboardView.test.tsx` | Deleted | 827 |
| `tests/unit/views/dashboardViewFixtures.ts` | Created | 98 |
| `tests/unit/views/DashboardView.carousel.test.tsx` | Created | 216 |
| `tests/unit/views/DashboardView.recientes.test.tsx` | Created | 195 |
| `tests/unit/views/DashboardView.fulllist.test.tsx` | Created | 161 |
| `tests/unit/components/history/FilterChips.test.tsx` | Modified | +4 |
| `tests/unit/components/HistoryViewThumbnails.test.tsx` | Modified | +2 |

## Deferred Items

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| TD-15b-34 | DRY mock blocks + renderDashboardView helper across 3 split files | LOW | CREATED |

## Change Log

| Date | Change |
|------|--------|
| 2026-03-01 | Created from 15b-4e review — pre-existing parallel flake |
| 2026-03-01 | Implemented: root cause analysis, defensive store resets, 827→3 file split |
| 2026-03-01 | Code review: APPROVE 9.0/10, quick type fixes applied, TD-15b-34 created |
