# Tech Debt Story TD-18-21: QuickSaveCard Slides to Bottom of Screen

Status: done

> **Source:** Production observation (2026-04-06)
> **Priority:** HIGH | **Estimated Effort:** 3 points

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "The scan result should meet me where I am, not make me scroll to find it"
**Value:** V5 — "Easier than the receipt drawer" — if the user has to scroll to find the save button after every scan, the quick-save flow is broken.

## Story
As a **user**, I want **the QuickSaveCard to appear centered on screen and stay there**, so that **I can immediately see the result and tap Save without scrolling**.

## Background

### Observed behavior (production, 2026-04-06)
1. After scan completes, the QuickSaveCard briefly appears centered (most of card visible, buttons accessible)
2. It then **slides DOWN** to the bottom of the screen, ending in a position where only the green checkmark and "Escaneo completo!" title are visible
3. User must scroll down to reach the "Guardar ahora" and "Editar primero" buttons
4. The nav bar remains visible BELOW the card, suggesting the card is not truly viewport-fixed

### Expected behavior
The QuickSaveCard should appear centered on screen (vertically and horizontally) and remain there. It uses `fixed inset-0 flex items-center justify-center` which should center it, but something breaks this.

### Screenshots
Two production screenshots provided (2026-04-06):
- **Screenshot 1** (initial position): Card mostly visible, checkmark at center, buttons at bottom — good position
- **Screenshot 2** (final position): Card at very bottom, only checkmark barely visible above nav bar — bad position

### Investigation notes
- `QuickSaveCard.tsx:287` uses `fixed inset-0 z-[100] flex items-center justify-center` — CSS looks correct
- `QuickSaveCard.tsx:309` has entry animation: `translateY(20px) → translateY(0)` — only 20px, not enough to cause the observed displacement
- `ScanFeature.tsx:174` renders inside `FeatureOrchestrator` which is OUTSIDE `AppLayout` — no parent `overflow-hidden` or `transform` should break `fixed`
- `AppLayout.tsx:61` has `max-w-md mx-auto overflow-hidden` but QuickSaveCard is not inside it
- The large displacement suggests a layout reflow when the phase changes (scanning → reviewing) causes the card to re-position, NOT the intentional 20px animation

### Hypotheses to investigate
1. **Containing block break:** A parent element with `transform`, `will-change`, or `filter` CSS creates a new containing block, making `fixed` behave like `absolute`
2. **Layout reflow:** Phase change from 'scanning' to 'reviewing' renders ReviewingState (tall content) alongside the overlays, causing a reflow that shifts the fixed card
3. **Mobile browser fixed positioning:** PWA viewport-fit=cover or virtual keyboard interactions break `fixed` on mobile
4. **ScanOverlay dismissal timing:** ScanOverlay hides while QuickSaveCard appears, causing a z-index or layout conflict

## Acceptance Criteria

### Task 1: Diagnose root cause
- [x] AC-1: Use browser devtools (mobile remote debug or Chrome responsive mode) to identify which CSS property breaks `fixed` positioning
- [x] AC-2: Check computed styles of all ancestors for `transform`, `will-change`, `filter`, `perspective` properties
- [x] AC-3: Identify if the issue is a containing block break, layout reflow, or timing conflict

### Task 2: Fix positioning
- [x] AC-4: QuickSaveCard appears centered on screen (vertically and horizontally) on all tested devices
- [x] AC-5: Card stays centered — no downward slide or position shift after initial render
- [x] AC-6: Entry animation (fade + subtle slide-up) works correctly
- [x] AC-7: Card buttons ("Guardar ahora", "Editar primero", "Cancelar") are always visible without scrolling

### Task 3: Verify edge cases
- [x] AC-8: Test on iPhone SE (smallest viewport) — card still fits without scrolling
- [x] AC-9: Test with 10+ items — items section scrolls internally, card doesn't overflow viewport
- [x] AC-10: Test with cancel confirmation expanded — card still fits

## Technical Notes
- The QuickSaveCard is 652 lines — below the 800-line hook but large. Consider if the fix requires restructuring.
- The `createPortal(document.body)` pattern (used by ImageViewer) could solve containing block issues if that's the root cause.
- The ImageViewer has the same `fixed` pattern but uses `createPortal` — QuickSaveCard does NOT use portal.
- Safe area insets (paddingTop/paddingBottom) on the overlay container might interact with flex centering on mobile.

## Dependencies
- None — self-contained positioning fix

## Files Likely Touched
1. `src/features/scan/components/QuickSaveCard.tsx` (edit — positioning fix)
2. `src/features/scan/ScanFeature.tsx` (edit — if portal rendering needed)

## Review Deferred Items (2026-04-06)

| # | Finding | Stage | Destination | Tracking |
|---|---------|-------|-------------|----------|
| 1 | Sibling dialogs (CurrencyMismatch, TotalMismatch) missing portal | MVP | TD-18-26 | In-epic |
| 2 | Test file ~575 lines exceeds 300-line limit | PROD | Backlog | deferred-findings.md |
| 5 | Pre-existing hardcoded rgba on cancel button | PROD | Backlog | deferred-findings.md |

## Senior Developer Review (ECC)

- **Date:** 2026-04-06
- **Classification:** TRIVIAL
- **Agents:** code-reviewer, ui-consistency
- **Outcome:** APPROVE 9/10
- **Quick fixes:** 1 applied (replaced brittle Tailwind class assertions with behavioral ARIA checks)
- **TD stories created:** 1 (TD-18-26: sibling dialog portal fix)
- **Backlog entries:** 2 (test file size, hardcoded rgba)

<!-- CITED: none -->
