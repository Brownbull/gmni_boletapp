# Tech Debt Story TD-15b-16: Sankey Builder DRY & Test Coverage Polish

**Status:** done
**Priority:** LOW | **Points:** 2

> **Source:** ECC Code Review (2026-02-25) on story TD-15b-15
> All items are pre-existing patterns from before decomposition — not regressions.

## Story

As a **developer**, I want **the Sankey builder to extract shared helpers and have complete mode coverage in tests**, so that **the codebase is easier to maintain and future refactors are safer**.

## Acceptance Criteria

- [x] AC1: `addLink` helper extracted to a module-level function shared across all 4 builders
- [x] AC2: `splitFlowKey()` helper centralises the `key.split('→')` pattern with a defensive assertion
- [x] AC3: `3-level-groups` and `3-level-categories` modes have at least one direct test each in sankeyDataBuilder.test.ts

## Tasks / Subtasks

### Task 1: Extract shared helpers
- [x] 1.1 Create module-level `addLink(linkMap, source, target, value)` function
- [x] 1.2 Replace 4 inline closures with calls to the shared function
- [x] 1.3 Create `splitFlowKey(key: string): [string, string]` with assertion guard
- [x] 1.4 Replace all `key.split('→')` calls with `splitFlowKey()`

### Task 2: Add 3-level mode tests
- [x] 2.1 Add test for `3-level-groups` mode (nodes at 3 levels, links between adjacent levels)
- [x] 2.2 Add test for `3-level-categories` mode (nodes at 3 levels, links between adjacent levels)

## Dev Notes

- Source story: [TD-15b-15](./TD-15b-15-sankey-builder-quality.md)
- Review findings: #4 (addLink duplication), #6 (split guard), #7 (3-level tests)
- Files affected: `src/features/analytics/utils/sankeyDataBuilder.ts`, `tests/unit/utils/sankeyDataBuilder.test.ts`
- Out of scope: larger builder structural deduplication (node creation patterns) — separate story

## Review Fixes (2026-02-25)

- Exported `splitFlowKey` and added 3 tests (happy path, no-separator throw, multi-separator throw)
- Added link-transition assertions (L1→L2, L2→L3) to both 3-level mode test suites

## Deferred Items (pre-existing, LOW priority)

| # | Item | Priority | Status |
|---|------|----------|--------|
| 3 | Test file `sankeyDataBuilder.test.ts` at 610+ lines (300-line limit) | LOW | PRE-EXISTING — natural candidate for split during future test maintenance |
| 4 | Node-creation pattern repetition across 4 builders | LOW | PRE-EXISTING — explicitly out-of-scope, tracked as backlog item |
