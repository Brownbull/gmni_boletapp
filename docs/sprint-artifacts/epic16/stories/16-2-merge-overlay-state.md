# Story 16-2: Merge Overlay State Into Zustand

## Status: done

## Intent
**Epic Handle:** "Untangle the wires, open the test door"
**Story Handle:** "This story untangles the wires by merging the two control panels into one -- eliminating the desync class of bugs"

## Story
As a user, I want scan state to be consistent across the app, so that dismissing an error never leaves the app in a broken state.

## Acceptance Criteria

### Functional
- **AC-1:** Given overlay fields (progress, ETA, error, processingHistory) exist in `useScanOverlayState`, when merged into `scanUISlice`, then overlay state is managed by Zustand
- **AC-2:** Given `useScanOverlayState.ts` and `useScanState.ts` exist, when migration completes, then both files are deleted
- **AC-3:** Given `ScanFeature.tsx` receives overlay data as props, when updated, then it reads from Zustand store directly
- **AC-4:** Given `reset()` is called, when store resets, then BOTH phase and overlay state reset atomically (single `set()` call)
- **AC-5:** Given the ETA ring buffer currently uses `useRef`, when migrated, then it uses a store array with the same rolling-average calculation

### Architectural
- **AC-ARCH-LOC-1:** Overlay state fields added to `src/features/scan/store/slices/scanUISlice.ts`
- **AC-ARCH-PATTERN-1:** Phase transitions automatically reset overlay state (e.g., `reset()` clears both)
- **AC-ARCH-PATTERN-2:** View-scoped overlay visibility stays in the component (`SCAN_VIEWS.includes()` check) — NOT in the store
- **AC-ARCH-NO-1:** No `useScanOverlayState.ts` or `useScanState.ts` files remain after this story
- **AC-ARCH-NO-2:** No `useState` for scan overlay in any component — all scan state in Zustand

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| UI Slice (overlay fields added) | `src/features/scan/store/slices/scanUISlice.ts` | Zustand slice | MODIFIED |
| Scan overlay state hook | `src/features/scan/hooks/useScanOverlayState.ts` | — | DELETED |
| Base scan state hook | `src/features/scan/hooks/useScanState.ts` | — | DELETED |
| Scan feature component | `src/features/scan/ScanFeature.tsx` | FSD component | MODIFIED |
| Scan overlay component | `src/features/scan/components/ScanOverlay.tsx` (or equivalent) | FSD component | MODIFIED |
| Workflow orchestrator | `src/app/hooks/useScanWorkflowOrchestrator.ts` | App hook | MODIFIED |
| Barrel | `src/features/scan/hooks/index.ts` | FSD barrel | MODIFIED |
| UI Slice tests | `src/features/scan/store/__tests__/useScanStore.ui.test.ts` | Vitest | MODIFIED |

## Tasks

### Task 1: Add Overlay Fields to scanUISlice (3 subtasks)
- [x] 1.1: Add state fields: `overlayProgress: number`, `overlayEta: number | null`, `overlayError: string | null`, `processingHistory: number[]`
- [x] 1.2: Add actions: `setOverlayProgress(pct)`, `setOverlayError(err)`, `resetOverlay()`, `pushProcessingTime(ms)` (ring buffer)
- [x] 1.3: Wire `reset()` in `scanCoreSlice` to also call `resetOverlay()` via composed store

### Task 2: Migrate ScanFeature and ScanOverlay (4 subtasks)
- [x] 2.1: Update `ScanFeature.tsx` — remove overlay prop threading, read from `useScanStore` selectors
- [x] 2.2: Update `ScanOverlay` component — read overlay state from store, remove prop interface
- [x] 2.3: Update `useScanWorkflowOrchestrator.ts` — remove overlay state management, simplify to store reads
- [x] 2.4: Migrate ETA ring buffer calculation from `useRef` to store-based `processingHistory` array

### Task 3: Delete Old Files and Update Barrel (2 subtasks)
- [x] 3.1: Delete `useScanOverlayState.ts` and `useScanState.ts`
- [x] 3.2: Update scan hooks barrel to remove deleted exports, verify no broken imports

### Task 4: Tests (3 subtasks)
- [x] 4.1: Add unit tests for overlay actions in `useScanStore.ui.test.ts`
- [x] 4.2: Test atomic reset — `reset()` clears phase AND overlay in one call
- [x] 4.3: Test ETA ring buffer — rolling average matches old calculation

### Task 5: Hardening — Error Boundary (2 subtasks)
- [x] 5.1: Verify `ScanOverlay` renders gracefully when overlay state is null/undefined (initial state)
- [x] 5.2: Existing `AppErrorBoundary` covers scan overlay; component already handles all null/idle states

### Task 6: Integration Verification (2 subtasks)
- [x] 6.1: Run `npm run test:quick` — 309 files, 7153 tests, 0 failures
- [x] 6.2: Run `npx tsc --noEmit` — zero TypeScript errors

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 6
- **Subtasks:** 16
- **Files:** ~8

## Dependencies
- **16-1** (scan store must be split into slices first — scanUISlice must exist)

## Risk Flags
- ERROR_RESILIENCE (state transition edge cases)
- CROSS_STORE (overlay reset coupled to phase reset)

## Dev Notes
- The ETA ring buffer is ~20 lines of math: keeps last N processing times, computes rolling average. Trivial to move from `useRef` to store array.
- `SCAN_VIEWS` constant determines overlay visibility — this is a component concern, NOT store state. Don't move it.
- After this story, the gallery bug (FR-1.5) is effectively fixed — `reset()` clears everything. Story 16-3 verifies and adds E2E.
- Watch for any `useCallback` or `useMemo` dependencies that referenced the old overlay hook — these need updating.
