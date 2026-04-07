# Tech Debt Story TD-18-26: Portal Fix for Scan Feature Sibling Dialogs

Status: review

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
