# Tech Debt Story 15-TD-16: Mega-View Decomposition Phase 5c

Status: ready-for-dev

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

- [ ] **AC1:** `TrendsView.tsx` reduced to under 2,000 lines by extracting at least 2 cohesive sub-components
- [ ] **AC2:** `DashboardView.tsx` reduced to under 1,500 lines by extracting at least 2 more section components (e.g., category-mode rendering blocks)
- [ ] **AC3:** Hardcoded Spanish strings in DashboardBumpSlide.tsx ("Toca un punto para ver detalles", "en {month}") replaced with i18n translations
- [ ] **AC4:** Hardcoded `es-CL` locale in DashboardBumpSlide.tsx replaced with `lang` prop usage
- [ ] **AC5:** Hardcoded `$` currency symbol in DashboardRadarSlide.tsx replaced with `formatCurrency` or `currency` prop
- [ ] **AC6:** All imports updated, barrel re-exports maintained, all tests pass

## Tasks

- [ ] **Task 1:** Decompose TrendsView.tsx
  - [ ] Identify 2-3 cohesive sections (e.g., period selector, treemap section, chart controls)
  - [ ] Extract as co-located components in `TrendsView/`
  - [ ] Target: ~1,200 line reduction minimum
- [ ] **Task 2:** Decompose DashboardView.tsx further
  - [ ] Extract category-mode rendering blocks (store groups, item groups) — these are repetitive
  - [ ] Target: ~1,000 line reduction minimum
- [ ] **Task 3:** Fix i18n/locale issues in extracted slide components
  - [ ] DashboardBumpSlide: replace hardcoded Spanish strings with `t()` calls
  - [ ] DashboardBumpSlide: use `lang` prop for locale-dependent formatting
  - [ ] DashboardRadarSlide: use `formatCurrency` or `currency` prop for amount display

## Dev Notes

- Source story: [15-TD-5](./15-TD-5-mega-view-decomposition-5b.md)
- Review findings: #1, #2 (HIGH — mega-view sizes), #5-#8 (MEDIUM — pre-existing i18n/currency)
- Files affected: `src/views/TrendsView/TrendsView.tsx`, `src/views/DashboardView/DashboardView.tsx`, `src/views/DashboardView/DashboardBumpSlide.tsx`, `src/views/DashboardView/DashboardRadarSlide.tsx`
- DashboardView dev note from TD-5: "focus on the 4 category-mode rendering blocks (store groups, item groups per mode) which are highly repetitive"
- TrendsView has multiple slide-rendering functions that could become standalone components
- **Added from 15-TD-6 code review (2026-02-11):** DashboardView.tsx has pre-existing `as any` casts at lines 1614, 1636 (`category as any`, `transaction as any`) and `as Transaction[]` casts at lines 1314, 1319, 1325 — investigate and fix during Task 2 decomposition
