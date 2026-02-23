# Tech Debt Story TD-15b-2a: Extract EditView Items Section

**Status:** done

> **Source:** ECC Code Review (2026-02-23) on story 15b-2a
> **Priority:** LOW | **Estimated Effort:** 3 pts

## Story

As a **developer**, I want **the items section extracted from EditView.tsx into a dedicated sub-component**, so that **EditView.tsx is reduced below 800 lines and each sub-component has a single responsibility**.

## Background

Story 15b-2a extracted 5 sub-files and reduced EditView.tsx from 1,813 to 1,200 lines. The remaining ~370 lines of items section (item list, CRUD handlers, animation, item editing inline forms) are tightly coupled to animation state (`useStaggeredReveal`), editing state (`editingItemIndex`), and item CRUD handlers. AC1 (target <800L) was marked `[~]` partial.

## Acceptance Criteria

- [x] **AC1:** EditView.tsx reduced to <800 lines after extraction (754 lines ✓)
- [x] **AC2:** New `EditViewItemsSection.tsx` component is <400 lines (275 lines ✓)
- [x] **AC3:** All existing tests pass (category-learning integration, unit tests)
- [x] **AC4:** Pure decomposition — no behavior change (TypeScript clean, no API changes)
- [x] **AC5:** No circular dependencies (`npx madge --circular src/features/transaction-editor/views/`)
- [x] **AC6:** `npm run test:quick` passes (276 files, 6810 tests ✓)

## Tasks / Subtasks

### Task 1: Analyze coupling
- [x] 1.1 Document all state/refs used by the items section (`editingItemIndex`, `setEditingItemIndex`, animation refs, staggered reveal)
- [x] 1.2 Define `EditViewItemsSectionProps` interface — estimate prop count (13 props)

### Task 2: Extract items section
- [x] 2.1 Create `src/features/transaction-editor/views/EditViewItemsSection.tsx`
- [x] 2.2 Move item list JSX, item editing inline form, add-item button
- [x] 2.3 Move `useStaggeredReveal` / `AnimatedItem` usage into sub-component
- [x] 2.4 Update EditView.tsx to use `<EditViewItemsSection ... />`
- [x] 2.5 Run `npx tsc --noEmit` — fix type errors (clean ✓)

### Task 3: Verify and test
- [x] 3.1 Verify EditView.tsx < 800 lines (754 ✓)
- [x] 3.2 Run `npm run test:quick` — all pass (276 files, 6810 tests ✓)
- [x] 3.3 Run category-learning integration test — passes (42/42 ✓)

## Senior Developer Review (ECC)

- **Date:** 2026-02-23
- **Agents:** code-reviewer + tdd-guide (SIMPLE classification)
- **Outcome:** APPROVED — 7.5/10
- **Findings:** 6 total (0 fixed, 6 deferred) — all pre-existing or minor patterns
- **TD Stories Created:** TD-15b-4 (unit tests), TD-15b-5 (code quality polish)
- **Test Health:** ✅ All 6810 unit tests green

## Tech Debt Tracking

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| [TD-15b-4](./TD-15b-4-editviewitems-unit-tests.md) | Unit tests for EditViewItemsSection | MEDIUM | CREATED |
| [TD-15b-5](./TD-15b-5-editviewitems-code-quality.md) | Type safety + a11y + DRY polish | LOW | CREATED |

## Dev Notes

- Source story: [15b-2a-decompose-edit-view.md](./15b-2a-decompose-edit-view.md)
- Review findings: #2 (AC1 partial — 1,200L vs <800L target)
- Files affected: `EditView.tsx`, new `EditViewItemsSection.tsx`
- Key challenge: `editingItemIndex` state is used by both the items section AND potentially by the parent. Keep state in EditView.tsx and pass as prop.
- Ref ownership: `originalItemGroupsRef` must stay in EditView.tsx per 15b-2a dev notes.
