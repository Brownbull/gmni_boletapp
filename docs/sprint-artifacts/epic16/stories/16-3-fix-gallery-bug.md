# Story 16-3: Fix Gallery Selection Bug

## Status: ready-for-dev

## Intent
**Epic Handle:** "Untangle the wires, open the test door"
**Story Handle:** "This story opens the test door by fixing the exact bug users hit -- gallery works after scan errors"

## Story
As a user, I want to select a photo from my gallery after dismissing a scan error, so that I'm not trapped with no way to scan.

## Acceptance Criteria

### Functional
- **AC-1:** Given a scan has failed and the user dismisses the error overlay, when the user taps to select from gallery, then the gallery opens and a selected image is processed normally
- **AC-2:** Given the unified state machine from 16-2, when `handleScanOverlayDismiss` fires, then the store is fully reset to idle (phase + overlay + images)
- **AC-3:** Given the camera FAB path already works after errors, when the gallery path is tested, then both paths behave identically after error dismissal
- **AC-4:** Given the fix is applied, when a unit test reproduces the original bug sequence (`scan fail -> dismiss -> gallery select`), then the test passes

### Architectural
- **AC-ARCH-PATTERN-1:** `handleScanOverlayDismiss` uses the same `reset()` action as `handleScanOverlayRetry` (pattern from Story 15b-5a)
- **AC-ARCH-NO-1:** No `waitForTimeout` in tests — use state assertions

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Scan handlers | `src/features/scan/hooks/useScanHandlers.ts` | Feature hook | MODIFIED |
| Workflow orchestrator | `src/app/hooks/useScanWorkflowOrchestrator.ts` | App hook | VERIFIED |
| Unit test | `src/features/scan/store/__tests__/useScanStore.core.test.ts` | Vitest | MODIFIED |

## Tasks

### Task 1: Verify and Harden Dismiss Handler (2 subtasks)
- [ ] 1.1: Verify `handleScanOverlayDismiss` in `useScanHandlers.ts` calls store `reset()` (should be automatic after 16-2's unified state — confirm)
- [ ] 1.2: If not already calling `reset()`, add the call (fallback — should not be needed if 16-2 is complete)

### Task 2: Hardening — Error State Tests (3 subtasks)
- [ ] 2.1: Add unit test: `scan fail -> dismiss -> store is idle` (phase, overlay, images all reset)
- [ ] 2.2: Add unit test: `scan fail -> dismiss -> gallery select -> image accepted` (setImages succeeds in idle phase)
- [ ] 2.3: Add unit test: `scan fail -> retry -> store is idle -> scan succeeds` (verify retry path still works)

### Task 3: Hardening — E2E Bug Reproduction (2 subtasks)
- [ ] 3.1: Write E2E test reproducing the original bug: scan → force error → dismiss → gallery select → verify image loads
- [ ] 3.2: Verify E2E test passes on staging (after 16-9 deploys)

### Task 4: Integration Verification (1 subtask)
- [ ] 4.1: Run `npm run test:quick` — all tests pass

## Sizing
- **Points:** 1 (SMALL)
- **Tasks:** 4
- **Subtasks:** 8
- **Files:** ~3

## Dependencies
- **16-2** (overlay state unified — the fix is automatic with unified reset)

## Risk Flags
- ERROR_RESILIENCE (this IS the error resilience fix)
- E2E_TESTING (E2E test for the specific bug)

## Dev Notes
- Root cause (documented in proposal Section 3.1): `handleScanOverlayDismiss` resets overlay but NOT Zustand store. After 16-2 merges overlay into store, `reset()` clears everything.
- The camera FAB path already works because `handleNewTransaction` calls `resetScanContext()`. The gallery path didn't have this.
- E2E test note: forcing a scan error in E2E requires either a mock or an invalid image. Consider using a tiny non-image file to trigger Gemini rejection.
- E2E test depends on staging (16-9) for execution, but can be written now and run locally with emulators.
