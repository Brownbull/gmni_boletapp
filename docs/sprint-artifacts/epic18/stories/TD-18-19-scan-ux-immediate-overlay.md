# Tech Debt Story TD-18-19: Immediate Scan Overlay with Smooth Result Transition

Status: drafted

> **Source:** User feedback 2026-04-02 — scan feels disconnected (toast → wait → result)
> **Priority:** MEDIUM | **Estimated Effort:** 3 points

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "The scan screen should greet you, not ambush you"
**Value:** V5 — "Easier than the receipt drawer" — the 8-24s wait between pressing Escanear and seeing results feels like a void. Showing the result screen immediately (in loading state) makes the wait feel purposeful and the result feel like a natural transition, not a surprise popup.

## Story
As a **user**, I want **the scan result screen to appear immediately when I press Escanear (in loading state)**, so that **the transition from scanning to results feels smooth and I know what's coming**.

## Background

### Current Flow (what happens now)
1. Press Escanear → small toast "Scanning receipt..." at bottom
2. Button shows spinner → wait 8-24s
3. "Escaneo completo!" overlay pops up suddenly from the bottom
4. Overlay shows merchant, items, total

**Problem:** Steps 1-2 feel disconnected from step 3. The toast is easily missed, the wait has no visual progress, and the result overlay appears as a jarring interruption.

### Proposed Flow (what it should feel like)
1. Press Escanear → **immediately** show the result screen (same layout as "Escaneo completo!") but in a loading state:
   - Merchant: shimmer/skeleton placeholder
   - Items: 2-3 skeleton rows
   - Total: skeleton
   - Header: "Escaneando..." with a subtle spinner
2. As the async pipeline runs, the screen stays visible — user knows where the result will appear
3. When result arrives (~3-8s with TD-18-18 speed fix):
   - Skeleton placeholders **fade into real data** (smooth transition, ~300ms)
   - Header transitions: "Escaneando..." → "Escaneo completo!" with checkmark
4. User sees the same "Guardar ahora" / "Editar primero" buttons

**Key insight:** The result screen layout is ALREADY built. We just need to show it sooner (in skeleton state) and fill it when data arrives.

## Acceptance Criteria

### Task 1: Show scan result overlay immediately on Escanear press
- [ ] AC-1: When user presses Escanear, immediately transition to the result overlay screen (not the toast)
- [ ] AC-2: Result overlay shows in "loading" state: skeleton/shimmer placeholders for merchant, items, total
- [ ] AC-3: Header shows "Escaneando..." with a spinner icon
- [ ] AC-4: Remove the "Scanning receipt..." toast — the overlay replaces it

### Task 2: Smooth data fill transition
- [ ] AC-5: When async result arrives, skeleton placeholders fade to real data (CSS transition, ~300ms)
- [ ] AC-6: Header transitions to "Escaneo completo!" with checkmark animation
- [ ] AC-7: "Guardar ahora" / "Editar primero" buttons appear only after data fills in

### Task 3: Error state in the same overlay
- [ ] AC-8: If scan fails, the overlay transitions to error state (same screen, no separate error dialog)
- [ ] AC-9: Error state shows: error icon, error message, "Reintentar" button
- [ ] AC-10: Credit refund message shown inline if applicable

### Task 4: Handle edge cases
- [ ] AC-11: If user navigates away during scan, pending scan detection on return still works (existing behavior preserved)
- [ ] AC-12: If scan completes very fast (<1s, e.g., fixture mode), skip skeleton and show data directly — no flicker

## Technical Notes

### State Machine Changes
The current ScanStore has phases: `idle` → `scanning` → `reviewing`. The overlay is controlled by `overlayState` (idle/uploading/processing/completed/error). The change:
- On Escanear: set `overlayState = 'processing'` immediately (currently waits for upload to finish)
- The overlay component checks `overlayState` and renders skeleton when `processing`, data when `completed`

### Component Impact
- `TransactionEditorScanStatus.tsx` or equivalent overlay component — needs skeleton state
- `EditorScanThumbnail.tsx` — remove toast trigger, trigger overlay instead
- `useScanInitiation.ts` — adjust `queueScanFromImages` to show overlay before upload starts

### Skeleton Pattern
Use CSS shimmer animation on placeholder divs matching the exact layout of the completed state. This is a visual-only change — no data model changes needed.

## Dependencies
- **Benefits from TD-18-18** (scan speed) — with faster scans, the skeleton shows for less time, making the transition feel even smoother
- **Independent of TD-18-17** (JSON repair) — handles success/error states regardless

## Files Likely Touched
1. `src/features/scan/components/ScanOverlay.tsx` or equivalent (edit — add skeleton state)
2. `src/features/transaction-editor/views/TransactionEditorView/EditorScanThumbnail.tsx` (edit — trigger overlay instead of toast)
3. `src/features/scan/hooks/useScanInitiation.ts` (edit — show overlay before upload)
4. `src/features/scan/store/useScanStore.ts` or slices (edit — adjust phase transitions)
5. CSS/Tailwind for skeleton shimmer animation
