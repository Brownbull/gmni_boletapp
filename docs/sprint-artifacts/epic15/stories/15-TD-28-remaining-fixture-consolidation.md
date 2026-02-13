# Tech Debt Story TD-28: Consolidate Remaining Inline Test Fixtures

Status: done

> **Source:** ECC Code Review (2026-02-13) on story 15-TD-25
> **Priority:** LOW
> **Estimated Effort:** 1 pt

## Story

As a **developer**,
I want **remaining inline `makeTx`/`makeCategoryData` definitions in helpers.test.ts and DonutChart.test.tsx consolidated to use shared fixtures**,
So that **all view-level test files use the same factory functions from `__fixtures__/` without duplication**.

## Background

15-TD-25 extracted shared fixtures for the 6 TD-21 helper test files. Two other test files in the same directory still have inline definitions:
- `helpers.test.ts` — has `makeTx` (identical signature) and `makeCategoryData` (identical signature)
- `DonutChart.test.tsx` — has `makeCategoryData` with a `Partial<CategoryData>` override pattern (slightly different API)

## Acceptance Criteria

- [x] **AC1:** `helpers.test.ts` imports `makeTx` and `makeCategoryData` from `../__fixtures__/` instead of inline definitions
- [x] **AC2:** `DonutChart.test.tsx` imports `makeCategoryData` from `../__fixtures__/` (via `makeCategoryDataPartial` alias — signature differs, extended shared factory)
- [x] **AC3:** All existing tests continue to pass with `npx vitest run tests/unit/views/` (558 tests, 19 files)

## Tasks

- [x] **Task 1:** Update `helpers.test.ts` to import shared fixtures
  - [x] Remove inline `makeTx` definition (~10 lines)
  - [x] Remove inline `makeCategoryData` definition (~10 lines)
  - [x] Add imports from `../__fixtures__/transactionFactory` and `../__fixtures__/categoryDataFactory`
  - [x] Run tests to verify (67 tests pass)
- [x] **Task 2:** Update `DonutChart.test.tsx` to import shared fixture
  - [x] Compare inline `makeCategoryData` signature with shared version
  - [x] Signature differs (overrides-only vs positional) — extended shared factory with `makeCategoryDataPartial`
  - [x] Run tests to verify (10 tests pass)

## File List

| File | Action | Lines |
|------|--------|-------|
| `tests/unit/views/TrendsView/helpers.test.ts` | MODIFY | -26 (removed inline makeTx + makeCategoryData) |
| `tests/unit/views/TrendsView/DonutChart.test.tsx` | MODIFY | -11 (removed inline makeCategoryData) |
| `tests/unit/views/__fixtures__/categoryDataFactory.ts` | MODIFY | +18 (added makeCategoryDataPartial) |

## Dev Notes

- Source story: [15-TD-25](./15-TD-25-shared-test-fixtures.md)
- Review findings: #1, #2
- `makeTx` in helpers.test.ts: identical to shared version — direct swap
- `makeCategoryData` in helpers.test.ts: different signature (has opts param, different color defaults) but opts never used in calls and no tests assert on colors — safe direct swap
- `makeCategoryData` in DonutChart.test.tsx: fundamentally different API (overrides-only vs positional). Added `makeCategoryDataPartial` to shared factory, imported with alias
- Net change: -19 lines (removed 37 inline, added 18 shared)

## Senior Developer Review (ECC)

- **Date:** 2026-02-13
- **Agents:** code-reviewer (TRIVIAL classification)
- **Outcome:** APPROVE 10/10
- **Findings:** 0 (clean fixture consolidation, all 558 tests pass)
- **Action Items:** None
