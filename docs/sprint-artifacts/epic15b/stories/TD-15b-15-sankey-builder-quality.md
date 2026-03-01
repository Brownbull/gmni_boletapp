# Tech Debt Story TD-15b-15: Sankey Builder Code Quality Improvements

**Status:** done
**Priority:** LOW | **Points:** 2

> **Source:** ECC Code Review (2026-02-25) on story 15b-2f
> All items are pre-existing patterns from before decomposition — not regressions.

## Story

As a **developer**, I want **the Sankey builder internals to use immutable patterns, efficient lookups, and explicit guards**, so that **the code is safer against subtle mutation bugs and performs better with large datasets**.

## Acceptance Criteria

- [x] AC1: `applyThreshold` returns new objects instead of mutating caller's `CategoryAggregate.percent` in-place
- [x] AC2: Builder link dedup uses `Map<string, SankeyLink>` instead of `links.find()` (O(1) vs O(n))
- [x] AC3: `item.price` guard uses explicit `typeof` check instead of falsy coercion
- [x] AC4: All existing tests pass after changes

## Tasks / Subtasks

### Task 1: Fix applyThreshold mutation
- [x] 1.1 Replace `sorted.forEach(cat => { cat.percent = ... })` with `map()` returning new objects
- [x] 1.2 Update tests to verify original objects are not mutated

### Task 2: Optimize link dedup in builders
- [x] 2.1 Replace `links.find()` with `Map<string, SankeyLink>` keyed by `${source}→${target}`
- [x] 2.2 Apply to all 4 builder functions (build2Level, build3LevelGroups, build3LevelCategories, build4Level)
- [x] 2.3 Convert Map values back to array at return

### Task 3: Explicit price guard
- [x] 3.1 Replace `item.price || 0` with explicit `typeof item.price === 'number' && item.price > 0` guard

## Dev Notes

- Source story: [15b-2f](./15b-2f-decompose-sankey-data-builder.md)
- Review findings: #1 (mutation), #2 (O(n*m) dedup), #6 (falsy guard)
- Files affected: `src/features/analytics/utils/sankeyThreshold.ts`, `src/features/analytics/utils/sankeyAggregation.ts`, `src/features/analytics/utils/sankeyDataBuilder.ts`
- Out of scope: builder duplication (#3) — needs separate refactoring story; arrow separator (#7) — no current exploitability; builder test coverage (#5) — separate story
- Implementation: 2026-02-25 | 3 tasks, 6 subtasks, 3 source files + 1 test file

## Review Deferred Items (2026-02-25)

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| TD-15b-16 | Extract addLink/splitFlowKey helpers + 3-level mode test coverage | LOW | CREATED |

**Review fixes applied:** NaN-passthrough bug in price guard (`item.price <= 0` → `!(item.price > 0)`), dedup merge tests, typeof guard tests, `@internal` annotation, isMasNode branch test.

## Senior Developer Review (ECC)

- **Date:** 2026-02-25
- **Classification:** SIMPLE
- **Agents:** code-reviewer (8/10 APPROVE), tdd-guide (7/10 CHANGES REQUESTED)
- **Overall:** 7.5/10 → APPROVE (after quick fixes)
- **Triage:** 5 quick fixes applied, 3 deferred → TD-15b-16
- **Bonus finding:** NaN-passthrough bug in price guard discovered and fixed during review
