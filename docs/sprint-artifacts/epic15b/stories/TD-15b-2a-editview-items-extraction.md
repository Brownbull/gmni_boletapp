# Tech Debt Story TD-15b-2a: Extract EditView Items Section

**Status:** ready-for-dev

> **Source:** ECC Code Review (2026-02-23) on story 15b-2a
> **Priority:** LOW | **Estimated Effort:** 3 pts

## Story

As a **developer**, I want **the items section extracted from EditView.tsx into a dedicated sub-component**, so that **EditView.tsx is reduced below 800 lines and each sub-component has a single responsibility**.

## Background

Story 15b-2a extracted 5 sub-files and reduced EditView.tsx from 1,813 to 1,200 lines. The remaining ~370 lines of items section (item list, CRUD handlers, animation, item editing inline forms) are tightly coupled to animation state (`useStaggeredReveal`), editing state (`editingItemIndex`), and item CRUD handlers. AC1 (target <800L) was marked `[~]` partial.

## Acceptance Criteria

- [ ] **AC1:** EditView.tsx reduced to <800 lines after extraction
- [ ] **AC2:** New `EditViewItemsSection.tsx` component is <400 lines
- [ ] **AC3:** All existing tests pass (category-learning integration, unit tests)
- [ ] **AC4:** Pure decomposition — no behavior change
- [ ] **AC5:** No circular dependencies (`npx madge --circular src/features/transaction-editor/views/`)
- [ ] **AC6:** `npm run test:quick` passes

## Tasks / Subtasks

### Task 1: Analyze coupling
- [ ] 1.1 Document all state/refs used by the items section (`editingItemIndex`, `setEditingItemIndex`, animation refs, staggered reveal)
- [ ] 1.2 Define `EditViewItemsSectionProps` interface — estimate prop count

### Task 2: Extract items section
- [ ] 2.1 Create `src/features/transaction-editor/views/EditViewItemsSection.tsx`
- [ ] 2.2 Move item list JSX, item editing inline form, add-item button
- [ ] 2.3 Move `useStaggeredReveal` / `AnimatedItem` usage into sub-component
- [ ] 2.4 Update EditView.tsx to use `<EditViewItemsSection ... />`
- [ ] 2.5 Run `npx tsc --noEmit` — fix type errors

### Task 3: Verify and test
- [ ] 3.1 Verify EditView.tsx < 800 lines
- [ ] 3.2 Run `npm run test:quick` — all pass
- [ ] 3.3 Run category-learning integration test — passes

## Dev Notes

- Source story: [15b-2a-decompose-edit-view.md](./15b-2a-decompose-edit-view.md)
- Review findings: #2 (AC1 partial — 1,200L vs <800L target)
- Files affected: `EditView.tsx`, new `EditViewItemsSection.tsx`
- Key challenge: `editingItemIndex` state is used by both the items section AND potentially by the parent. Keep state in EditView.tsx and pass as prop.
- Ref ownership: `originalItemGroupsRef` must stay in EditView.tsx per 15b-2a dev notes.
