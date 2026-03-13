# Story 18-0: Scan Cancel Phase Reset Hotfix

## Status: done

## Intent
**Epic Handle:** "One statement in, many transactions out"
**Story Handle:** "Before wiring the new dock, seal the leak in the existing one -- cancel must fully reset the scan pipeline"

## Story
As a user, I want the scan Cancel button to fully reset the scan pipeline (identical to Dismiss and Retry), so that I can select from gallery or camera after cancelling a scan error without the app silently blocking me.

## Background

Story 16-3 fixed the gallery-after-error bug for `handleScanOverlayDismiss` but the error overlay UI has no Dismiss button -- only **Retry** and **Cancel**. The Cancel handler (`handleScanOverlayCancel`) was not patched, so the original bug persists through the only user-accessible cancel path.

### Root Cause
`handleScanOverlayCancel` resets the overlay state (`scanOverlay.reset()`) but does NOT reset the Zustand scan store (`useScanStore.getState().reset()`). After cancel, `useScanStore.phase` remains `'error'` instead of `'idle'`. Subsequent scan attempts hit `_guardPhase` checks that silently reject the action.

### Evidence
- E2E test `scan-gallery-after-error.spec.ts` times out at 120s (staging, 2026-03-10)
- Screenshot at timeout shows dashboard with FAB visible -- user appears to be back to normal, but store phase is corrupted
- The three overlay handlers differ only in whether they call `useScanStore.getState().reset()`:

| Handler | `scanOverlay.reset()` | `useScanStore.reset()` | User-accessible button |
|---|---|---|---|
| `handleScanOverlayCancel` (L207) | Yes | **No** | Cancel (error state) |
| `handleScanOverlayRetry` (L219) | Yes | Yes | Retry (error state) |
| `handleScanOverlayDismiss` (L232) | Yes | Yes | None (auto-dismiss on ready) |

## Acceptance Criteria

### Functional
- **AC-1:** Given a scan has failed and the user clicks Cancel on the error overlay, when the user taps scan FAB again, then a new scan starts normally (gallery or camera)
- **AC-2:** Given Cancel is clicked, when the store state is inspected, then `phase === 'idle'`, `overlayState === 'idle'`, `images === []`, and `error === null`
- **AC-3:** Given the fix is applied, when the existing E2E test `scan-gallery-after-error.spec.ts` runs on staging, then it passes within 60s (not 120s timeout)

### Audit
- **AC-AUDIT-1:** Given the full scan handler codebase, when all phase-resetting handlers are audited, then every handler that returns the user to dashboard also resets `useScanStore` to idle (no other handlers have this gap)
- **AC-AUDIT-2:** Given the `_guardPhase` mechanism, when all callers are reviewed, then no other phase transition can leave the store in a corrupted state after user-initiated cancellation
- **AC-AUDIT-3:** Given the ScanOverlay component, when all `onCancel`/`onDismiss`/`onRetry` prop wiring is traced from component to handler, then each prop maps to the correct handler (no swapped or missing bindings)

### Architectural
- **AC-ARCH-PATTERN-1:** All three overlay handlers (`cancel`, `retry`, `dismiss`) have identical reset logic -- no handler is a subset of another
- **AC-ARCH-NO-1:** No new state, no new components, no new dependencies
- **AC-ARCH-NO-2:** No `waitForTimeout` in tests -- use state assertions

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Scan handlers | `src/features/scan/hooks/useScanHandlers.ts` | Feature hook | MODIFY (1 line) |
| Scan core slice | `src/features/scan/store/slices/scanCoreSlice.ts` | Zustand slice | AUDIT-ONLY |
| Scan UI slice | `src/features/scan/store/slices/scanUISlice.ts` | Zustand slice | AUDIT-ONLY |
| Scan overlay component | `src/features/scan/components/ScanOverlay.tsx` | Component | AUDIT-ONLY |
| ScanFeature orchestrator | `src/features/scan/ScanFeature.tsx` | Component | AUDIT-ONLY |
| Workflow orchestrator | `src/app/hooks/useScanWorkflowOrchestrator.ts` | App hook | AUDIT-ONLY |
| App.tsx (prop wiring) | `src/App.tsx` | App root | AUDIT-ONLY |
| Unit tests (store) | `tests/unit/features/scan/store/` | Vitest | EXTEND |
| Unit tests (handlers) | `tests/unit/features/scan/hooks/useScanHandlers.*.test.ts` | Vitest | EXTEND |
| E2E test | `tests/e2e/staging/scan-gallery-after-error.spec.ts` | Playwright | VERIFY |

## Tasks

### Task 1: Audit -- Trace All Phase-Resetting Handlers (5 subtasks)
- [x] 1.1: Map every handler in `useScanHandlers.ts` that calls `setView('dashboard')` or otherwise exits the scan flow -- confirm each also calls `useScanStore.getState().reset()`
- [x] 1.2: Map every handler in `useScanWorkflowOrchestrator.ts` that resets scan state -- confirm parity with `useScanHandlers.ts`
- [x] 1.3: Trace ScanOverlay prop wiring: `onCancel` / `onRetry` / `onDismiss` from `ScanOverlay.tsx` through `ScanFeature.tsx` to `App.tsx` to handler -- document the full chain
- [x] 1.4: Audit `_guardPhase` callers in `scanCoreSlice.ts` -- list every action and its expected phase(s), flag any that could be blocked after cancel
- [x] 1.5: Check for any other components that call scan store actions (e.g., `useScanInitiation.ts`, batch handlers) that could hit a stale phase after cancel

### Task 2: Apply Fix (2 subtasks)
- [x] 2.1: Add `useScanStore.getState().reset()` to `handleScanOverlayCancel` in `useScanHandlers.ts` (1 line, matching retry/dismiss pattern)
- [x] 2.2: Verify the three handlers (`cancel`, `retry`, `dismiss`) are now identical in their reset logic -- helper extraction not justified (5 lines, semantic difference in line 1)

### Task 3: Unit Tests (4 subtasks)
- [x] 3.1: Add test: `scan fail -> cancel -> store reset called` (useScanStore.getState().reset() called once)
- [x] 3.2: Add test: `scan fail -> cancel -> overlay reset called` (scanOverlay.reset, not .retry)
- [x] 3.3: Add test: `scan fail -> cancel -> images cleared` (setScanImages called with [])
- [x] 3.4: Add test: `scan fail -> cancel -> full reset sequence` (all 5 actions fire, matching retry parity)

### Task 4: Integration & E2E Verification (3 subtasks)
- [x] 4.1: Run `npm run test:quick` -- all 7,414 tests pass
- [ ] 4.2: Run `npm run test:e2e:staging` -- `scan-gallery-after-error.spec.ts` passes (deferred to deploy)
- [ ] 4.3: Verify no regressions in other staging E2E tests (deferred to deploy)

## Sizing
- **Points:** 2 (SMALL -- 1 line fix + audit + tests)
- **Tasks:** 4
- **Subtasks:** 14
- **Files:** ~3 modified, ~7 audited

## Dependencies
- **16-2** (overlay state unified in Zustand) -- already done
- **16-3** (dismiss handler fix) -- already done, this completes the gap

## Risk Flags
- ERROR_RESILIENCE (completing the error resilience fix from 16-3)
- E2E_TESTING (existing E2E test validates the fix)
- SILENT_FAILURE (`_guardPhase` logs a warning but does not throw -- easy to miss in production)

### E2E Testing
- Action: VERIFY | File: `tests/e2e/staging/scan-gallery-after-error.spec.ts` | Expected: PASS
- Multi-User: SINGLE-USER

## Deferred Items (Code Review 2026-03-10)

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| TD-18-1 | Test file cleanup: extract shared createProps, add dismiss coverage, reduce redundancy, bring under 300L | LOW | CREATED |

## Dev Notes
- The 16-3 fix was correct but incomplete: it patched `handleScanOverlayDismiss` which is only called on `ready` state auto-dismiss, not the user-facing Cancel button in the error state.
- The backdrop click in error state (`onClick={state === 'error' ? onCancel : undefined}`) also routes to `onCancel`, so fixing cancel fixes backdrop-click-to-dismiss as well.
- `_guardPhase` silently rejects blocked actions (returns false, logs to console) -- this is by design to avoid crashes, but it makes this class of bug hard to detect without E2E tests.
- If audit (Task 1) reveals additional gaps, create follow-up stories rather than expanding this one.

## Senior Developer Review (ECC)
- **Date:** 2026-03-10
- **Agents:** code-reviewer (sonnet), tdd-guide (sonnet)
- **Classification:** SIMPLE
- **Outcome:** APPROVE (7.5/10)
- **Quick fixes applied:** 2 (comment wording, isolated test)
- **TD stories created:** 1 (TD-18-1)
- **Session cost:** $7.04

<!-- CITED: L2-004 (phase guard pattern), L2-008 (test parity) -->
