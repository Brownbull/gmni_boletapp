# Tech Debt Story TD-18-26: Portal Fix for Scan Feature Sibling Dialogs

Status: done

> **Source:** ECC Code Review (2026-04-06) on story TD-18-21
> **Priority:** HIGH | **Estimated Effort:** 2 points
> **Stage:** MVP

## Story
As a **user**, I want **CurrencyMismatchDialog and TotalMismatchDialog to render via portal**, so that **they don't suffer the same mobile containing-block positioning bug fixed in TD-18-21**.

## Background

TD-18-21 fixed QuickSaveCard sliding to the bottom of the screen on mobile by wrapping the return in `createPortal(…, document.body)`. The root cause was an ancestor element with `transform`/`will-change`/`filter` creating a new containing block, making `position: fixed` behave like `position: absolute`.

Two sibling dialogs in the same scan feature use the identical `fixed inset-0 z-[100]` pattern without portals:
- `CurrencyMismatchDialog.tsx` (line ~204)
- `TotalMismatchDialog.tsx` (line ~193)

Both render inside the same `FeatureOrchestrator` ancestor and are vulnerable to the same issue.

## Acceptance Criteria

### Task 1: Add portal wrapping
- [x] AC-1: `CurrencyMismatchDialog` renders via `createPortal(…, document.body)`
- [x] AC-2: `TotalMismatchDialog` renders via `createPortal(…, document.body)`
- [x] AC-3: Both dialogs appear centered on screen on mobile (no downward slide)

### Task 2: Test coverage
- [x] AC-4: Unit tests verify both dialogs render as direct children of `document.body`
- [x] AC-5: Existing tests still pass after portal wrapping

## Dev Notes
- Source story: [TD-18-21](./TD-18-21-quicksave-card-positioning.md)
- Review findings: #1
- Files affected: `src/features/scan/components/CurrencyMismatchDialog.tsx`, `src/features/scan/components/TotalMismatchDialog.tsx`
- Pattern reference: See TD-18-21 implementation — identical `createPortal` wrapping

## Senior Developer Review (ECC)
- **Date:** 2026-04-07
- **Classification:** SIMPLE
- **Agents:** code-reviewer (9/10), tdd-guide (7/10), ui-consistency (8/10)
- **Overall:** APPROVE 8.0/10
- **Quick fixes:** 5 (Escape key test, backdrop assertion, resetAllMocks, touch targets, translation mocks)
- **Backlog:** 3 PROD items (scroll lock race, CSS variables, animation constants)
<!-- CITED: L2-004 -->

## Review Deferred Items (2026-04-07)

| # | Finding | Stage | Destination | Tracking |
|---|---------|-------|-------------|----------|
| 1 | Scroll lock race (body.style.overflow) | PROD | Backlog | deferred-findings.md |
| 2 | Tailwind colors instead of CSS variables | PROD | Backlog | deferred-findings.md |
| 3 | Inline @keyframes instead of animation constants | PROD | Backlog | deferred-findings.md |
