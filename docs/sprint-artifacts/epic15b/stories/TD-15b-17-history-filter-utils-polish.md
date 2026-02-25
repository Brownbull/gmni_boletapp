# Tech Debt Story TD-15b-17: History Filter Utils Post-Decomposition Polish

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-25) on story 15b-2k
> **Priority:** LOW | **Estimated Effort:** 1 pt

## Story
As a **developer**, I want **the historyFilterUtils decomposition to have zero static analysis warnings and optimal code structure**, so that **madge reports no circular dependencies and helper functions are efficiently scoped**.

## Acceptance Criteria

- [ ] AC1: `npx madge --circular src/shared/utils/historyFilterUtils.ts src/shared/utils/temporalNavigation.ts src/shared/utils/temporalFilterBuilders.ts` reports 0 cycles
- [ ] AC2: `buildCascadingTemporalFilter` internal helpers hoisted to module scope in `temporalFilterBuilders.ts`
- [ ] AC3: All existing tests pass unchanged

## Tasks / Subtasks

### Task 1: Break circular dependency

- [ ] 1.1 Extract `formatTemporalRange` from `historyFilterUtils.ts` into a new `temporalFormatters.ts` (or similar)
- [ ] 1.2 Update `temporalNavigation.ts` to import from `temporalFormatters.ts` instead of `historyFilterUtils.ts`
- [ ] 1.3 Add `export * from './temporalFormatters'` to `historyFilterUtils.ts` (preserves all consumer imports)
- [ ] 1.4 Verify madge reports 0 cycles
- [ ] 1.5 Run `npm run test:quick` — all pass

### Task 2: Hoist inner helpers to module scope

- [ ] 2.1 Move `getFirstMonthOfQuarter`, `getQuarterFromMonthStr`, `getFirstWeek`, `getFirstDayOfWeek` from inside `buildCascadingTemporalFilter` to module-level private functions in `temporalFilterBuilders.ts`
- [ ] 2.2 Run `npm run test:quick` — all pass

## Dev Notes

- Source story: [15b-2k](./15b-2k-decompose-history-filter-utils.md)
- Review findings: #1 (circular dep), #2 (inner helpers)
- Files affected: `src/shared/utils/temporalNavigation.ts`, `src/shared/utils/temporalFilterBuilders.ts`, `src/shared/utils/historyFilterUtils.ts`
- The date.ts overlap (getQuarterFromMonth etc.) is a separate, larger effort requiring signature harmonization across 15+ consumers — not included here