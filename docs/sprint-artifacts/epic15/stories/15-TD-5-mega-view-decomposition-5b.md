# Story 15-TD-5: Mega-View Decomposition Phase 5b

**Epic:** 15 - Codebase Refactoring
**Points:** 5
**Priority:** MEDIUM
**Status:** done

## Description

Continue mega-view decomposition to bring parent view files closer to the 800-line limit. Phase 5 extracted types, helpers, and sub-components but left parent files at 2,965 (TrendsView), 2,752 (DashboardView), and 1,087 (DonutChart) lines. Also fixes the file/directory naming collision.

## Background

Phase 5 reduced TrendsView from 5,901 to 2,965 and TransactionEditorView from 2,722 to 1,316, but the 800-line limit is still exceeded by 2-4x. The architecture review flagged that `TrendsView.tsx` and `TrendsView/` coexist as file + directory at the same level, deviating from the established pattern (SettingsView, ItemsView place main component inside the directory).

## Source Tech Debt Items

- **TD-2:** DashboardView still 2,968 lines (only 13% reduction) — further decomposition possible
- **TD-4:** `TrendsView/helpers.ts` at 510 lines — could split by concern (period, aggregation, treemap)
- **TD-14:** DonutChart.tsx at 1,086 lines — extract drill-down hook, legend component
- **TD-24:** `TrendsView.tsx`/`DashboardView.tsx` naming collision with same-name directories — move into dirs

## Acceptance Criteria

- [ ] **AC1:** `TrendsView.tsx` moved into `TrendsView/TrendsView.tsx`, barrel updated to `./TrendsView`
- [ ] **AC2:** `DashboardView.tsx` moved into `DashboardView/DashboardView.tsx`, barrel updated
- [ ] **AC3:** DonutChart.tsx reduced by extracting `useDonutDrillDown` hook (~200 lines) and `DonutLegend` component
- [ ] **AC4:** `TrendsView/helpers.ts` split into `periodHelpers.ts`, `aggregationHelpers.ts`, `treemapHelpers.ts`
- [ ] **AC5:** DashboardView reduced by extracting at least 2 section components (e.g., `DashboardCategorySection`, `DashboardTotalsCard`)
- [ ] **AC6:** All imports across codebase updated (barrel re-exports maintain backward compat)
- [ ] **AC7:** All tests pass after moves

## Tasks

- [ ] **Task 1:** Move parent view files into directories
  - [ ] Move `src/views/TrendsView.tsx` → `src/views/TrendsView/TrendsView.tsx`
  - [ ] Update `src/views/TrendsView/index.ts` barrel: `export { TrendsView } from './TrendsView'`
  - [ ] Move `src/views/DashboardView.tsx` → `src/views/DashboardView/DashboardView.tsx`
  - [ ] Update `src/views/DashboardView/index.ts` barrel
  - [ ] Verify all imports resolve correctly
- [ ] **Task 2:** Decompose DonutChart.tsx
  - [ ] Extract `useDonutDrillDown` hook (drill-down state, navigation, path building)
  - [ ] Extract `DonutLegend` component (legend rendering, expand/collapse)
  - [ ] Remove unused underscore-prefix props from interface
  - [ ] Target: DonutChart.tsx under 600 lines
- [ ] **Task 3:** Split `TrendsView/helpers.ts`
  - [ ] `periodHelpers.ts` — `getPeriodLabel`, `filterByPeriod`, period-related utilities
  - [ ] `aggregationHelpers.ts` — `computeAllCategoryData`, `computeTrendCategories`
  - [ ] `treemapHelpers.ts` — `computeTreemapCategories`, treemap layout helpers
  - [ ] Each file under 200 lines
- [ ] **Task 4:** Extract DashboardView sections
  - [ ] Identify 2-3 cohesive sections (category breakdown, totals, sparklines)
  - [ ] Extract as co-located components in `DashboardView/`
  - [ ] Target: DashboardView.tsx reduced by at least 500 lines

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/views/TrendsView/TrendsView.tsx` | CREATE (move) | Main TrendsView component moved into directory |
| `src/views/TrendsView/index.ts` | MODIFY | Update barrel to `./TrendsView` |
| `src/views/DashboardView/DashboardView.tsx` | CREATE (move) | Main DashboardView moved into directory |
| `src/views/DashboardView/index.ts` | MODIFY | Update barrel |
| `src/views/TrendsView/useDonutDrillDown.ts` | CREATE | Drill-down hook extracted from DonutChart |
| `src/views/TrendsView/DonutLegend.tsx` | CREATE | Legend component extracted from DonutChart |
| `src/views/TrendsView/DonutChart.tsx` | MODIFY | Reduced via hook + component extraction |
| `src/views/TrendsView/periodHelpers.ts` | CREATE | Period-related helpers |
| `src/views/TrendsView/aggregationHelpers.ts` | CREATE | Category aggregation helpers |
| `src/views/TrendsView/treemapHelpers.ts` | CREATE | Treemap layout helpers |
| `src/views/DashboardView/DashboardCategorySection.tsx` | CREATE | Category breakdown section |

## Dev Notes

- Moving TrendsView.tsx → TrendsView/TrendsView.tsx is the highest-risk task (many importers). Use barrel re-exports for backward compat.
- DonutChart drill-down logic (handleDrillDown, handleBack, buildSemanticDrillDownPath) is ~200 lines — clean hook extraction
- helpers.ts split: `computeTrendCategories` duplicates logic from `categoryAggregation.ts` — consider sharing during split
- DashboardView decomposition: focus on the 4 category-mode rendering blocks (store groups, item groups per mode) which are highly repetitive
- Run `npx vitest run` on all affected test files after each move step — don't batch

### Tech Debt Stories Created / Updated

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| [15-TD-16](./15-TD-16-mega-view-decomposition-5c.md) | Further TrendsView (3,199→2,000) + DashboardView (2,482→1,500) decomposition + i18n fixes in extracted slides | MEDIUM | CREATED |

## Senior Developer Review (ECC)

- **Review date:** 2026-02-11
- **Classification:** STANDARD (13 files, 4 tasks)
- **ECC agents used:** code-reviewer, security-reviewer
- **Outcome:** APPROVE — all ACs met, 5 quick fixes applied, 1 TD story created
- **Quick fixes applied:** Stale test props removed, dead mocks cleaned, useCallback added to drill-down handlers
- **TD stories created:** 15-TD-16 (further mega-view decomposition + i18n fixes)
- **Security:** Clean — no vulnerabilities, no secrets, no new attack surface
