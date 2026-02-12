# Tech Debt Story 15-TD-16: Mega-View Decomposition Phase 5c

Status: done

> **Source:** ECC Code Review (2026-02-11) on story 15-TD-5
> **Priority:** MEDIUM
> **Estimated Effort:** 5 pts

## Story

As a **developer**,
I want **TrendsView.tsx and DashboardView.tsx further decomposed toward the 800-line target**,
So that **the codebase is maintainable and no single view file exceeds 3x the project maximum**.

## Background

15-TD-5 moved view files into directories and extracted DonutLegend, useDonutDrillDown, helper splits, DashboardBumpSlide, and DashboardRadarSlide. After those extractions:
- `TrendsView.tsx`: 3,199 lines (4x over 800-line max) — only moved, not decomposed
- `DashboardView.tsx`: 2,482 lines (3x over 800-line max) — ~486 lines extracted

The extracted slide components also carry pre-existing i18n/hardcoded-locale issues from the original DashboardView.

## Acceptance Criteria

- [x] **AC1:** `TrendsView.tsx` reduced to under 2,000 lines by extracting at least 2 cohesive sub-components — 3,199 → 1,981 lines (6 extractions + helper additions)
- [x] **AC2:** `DashboardView.tsx` reduced to under 1,500 lines by extracting at least 2 more section components — 2,483 → 1,479 lines (4 extractions)
- [x] **AC3:** Hardcoded Spanish strings in DashboardBumpSlide.tsx replaced with i18n translations (`tapPointForDetails`, `bumpInMonth`)
- [x] **AC4:** Hardcoded `es-CL` locale in DashboardBumpSlide.tsx replaced with `lang` prop usage
- [x] **AC5:** Hardcoded `$` currency symbol in DashboardRadarSlide.tsx replaced with `formatCompactAmount` prop
- [x] **AC6:** All imports updated, barrel re-exports maintained, all 6,568 tests pass

## Tasks

- [x] **Task 1:** Decompose TrendsView.tsx
  - [x] Extracted TrendsCardHeader.tsx (318 lines) — card header with view controls
  - [x] Extracted ExpandCollapseButtons.tsx (101 lines) — shared floating +/- buttons
  - [x] Extracted periodComparisonHelpers.ts (273 lines) — period-over-period comparison
  - [x] Extracted navigationHelpers.ts (310 lines) — treemap/trend navigation payload builders
  - [x] Extracted drillDownHelpers.ts (86 lines) — common drill-down resolution
  - [x] Extracted periodNavigationHelpers.ts (146 lines) — period state navigation
  - [x] Extended aggregationHelpers.ts (+95 lines) — store/item group computations
  - [x] Result: 3,199 → 1,981 lines (1,218 line reduction)
- [x] **Task 2:** Decompose DashboardView.tsx further
  - [x] Extracted categoryDataHelpers.ts (292 lines) — 4 category aggregation functions
  - [x] Extracted chartDataHelpers.ts (462 lines) — radar + bump chart computation
  - [x] Extracted DashboardFullListView.tsx (205 lines) — full paginated list view
  - [x] Extracted DashboardRecientesSection.tsx (283 lines) — recientes carousel section
  - [x] Removed pre-existing `as any` and `as Transaction[]` casts
  - [x] Result: 2,483 → 1,479 lines (1,004 line reduction)
- [x] **Task 3:** Fix i18n/locale issues in extracted slide components
  - [x] DashboardBumpSlide: replaced hardcoded Spanish strings with `t()` calls
  - [x] DashboardBumpSlide: replaced `es-CL` with `lang`-based locale selection
  - [x] DashboardBumpSlide: replaced hardcoded `$` amount with `formatCompactAmount` prop
  - [x] DashboardRadarSlide: replaced hardcoded `$` with `formatCompactAmount` prop

## Dev Notes

- Source story: [15-TD-5](./15-TD-5-mega-view-decomposition-5b.md)
- Review findings: #1, #2 (HIGH — mega-view sizes), #5-#8 (MEDIUM — pre-existing i18n/currency)
- Files affected: `src/views/TrendsView/TrendsView.tsx`, `src/views/DashboardView/DashboardView.tsx`, `src/views/DashboardView/DashboardBumpSlide.tsx`, `src/views/DashboardView/DashboardRadarSlide.tsx`
- DashboardView dev note from TD-5: "focus on the 4 category-mode rendering blocks (store groups, item groups per mode) which are highly repetitive"
- TrendsView has multiple slide-rendering functions that could become standalone components
- **Added from 15-TD-6 code review (2026-02-11):** DashboardView.tsx pre-existing `as any` and `as Transaction[]` casts — FIXED during Task 2
- **Code review quick fixes applied:** BumpSlide `formatCompactAmount` prop, removed unused `_previousTxs` parameter from `computeDailySparkline`
- **Code review quick fixes (2026-02-12):** DashboardRecientesSection 9 hardcoded Spanish strings → t() calls, formatCompactAmount inline lambda → useCallback, aggregationHelpers buildProductKey consistency, DashboardView test updated for i18n keys

### Tech Debt Stories Created / Updated

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| [15-TD-21](./15-TD-21-mega-view-helper-tests.md) | Test coverage for 6 extracted pure helper modules (1,568 lines) | HIGH | CREATED |

### Pre-Existing Issues (not introduced by this story)

- periodComparisonHelpers.ts:135-136,155-156 — `String.includes()` substring check where array membership intended (works by accident)
- TrendsCardHeader / ExpandCollapseButtons — 14 `locale === 'es'` ternaries for aria-labels (bypass t() system)
- periodComparisonHelpers.ts — 5 `as string` casts on item.category
- chartDataHelpers.ts at 462 lines (approaching 500-line warning)
- DashboardRecientesSection (22 props) / DashboardFullListView (21 props) — prop drilling from extraction
- computeStoreGroupsData / computeItemGroupsData name collision between TrendsView and DashboardView (different signatures)

## Senior Developer Review (ECC)

- **Review date:** 2026-02-12
- **Classification:** STANDARD (2 agents)
- **ECC agents used:** code-reviewer, security-reviewer
- **Overall score:** 8/10
- **Outcome:** APPROVED (after quick fixes)
- **Quick fixes applied:** 3 (i18n RecientesSection, formatCompactAmount useCallback, buildProductKey consistency)
- **TD stories created:** 1 (15-TD-21 — helper test coverage)
- **Tests:** 6,568 pass, TypeScript clean
