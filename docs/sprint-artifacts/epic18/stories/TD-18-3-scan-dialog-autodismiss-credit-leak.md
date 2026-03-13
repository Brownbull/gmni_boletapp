# Tech Debt Story TD-18-3: Scan Dialog Auto-Dismiss Race + Credit Leak Safety Net

Status: done

> **Source:** Production bug investigation (2026-03-13)
> **Priority:** CRITICAL | **Estimated Effort:** 5 points

## Story
As a **user**, I want **scan dialogs (total mismatch, currency mismatch) to stay on screen until I respond, and never lose a scan credit without either a saved transaction or a refund**, so that **I can always act on scan results and never pay for nothing**.

## Intent
- **What the person receives:** Scan dialogs that wait for their response instead of vanishing after 500ms. And a structural guarantee that no scan workflow can end with a consumed credit and no saved transaction.
- **Analogy:** Like a parking meter that takes your coin and then immediately resets to 0:00 before you can park. The fix makes the meter hold your time. The safety net adds an inspector that catches any meter that ate a coin without giving time and refunds it.
- **Done-when:** TotalMismatchDialog stays on screen until user chooses; CurrencyMismatchDialog stays on screen until user chooses; `reset()` refunds unredeemed credits; no code path exists where `creditStatus` transitions from `reserved`/`confirmed` to `none` without either a saved transaction or a credit refund.

## Background

### Incident (2026-03-13)
User scanned a receipt (transaction `XLl_4rVXLN1bUjRQoKwl`). Gemini returned a total mismatch (~8,000 vs ~200). The TotalMismatchDialog appeared for approximately 500ms then vanished. User was navigated to dashboard. Transaction was NOT saved. Credit was NOT refunded.

### Root Cause: Two Bugs Compounding

**Bug 1 — Auto-dismiss race (introduced by interaction between two changes):**
1. Epic 14e (Jan 26, `8e04c067`): `validateScanResult` calls `scanOverlay.setReady()` on the dialog path. This was meant to transition the overlay from "processing" spinner to "ready" checkmark while the dialog was shown.
2. Story 16-3 (Mar 6, `3db91f55`): `handleScanOverlayDismiss` was strengthened to do full `useScanStore.getState().reset()` + `setView('dashboard')`. This was needed to fix gallery selection after error dismissal.
3. The combination: `setReady()` starts a 500ms auto-dismiss timer → timer fires `handleScanOverlayDismiss` → `reset()` nukes `activeDialog` (killing the TotalMismatchDialog) → `setView('dashboard')`.

Before 16-3, the dismiss handler only did `scanOverlay.reset()` (lightweight — didn't touch the dialog or navigate). After 16-3, it became destructive. The `setReady()` call in the dialog path was always wrong, but it was harmless until the dismiss handler became nuclear.

The fix in `879b0ecf` (Mar 13) added a `visible` guard to the auto-dismiss, but it doesn't help here because when `validateScanResult` returns `shouldContinue: false`, `processSuccess` never runs, so phase stays `'scanning'` → overlay remains `visible=true` → auto-dismiss fires.

**Bug 2 — No credit safety net:**
The `reset()` action in `scanCoreSlice` sets state to `initialScanState` (which includes `creditStatus: 'none'`) without checking if there's an outstanding credit (`reserved` or `confirmed`). This means ANY code path that calls `reset()` while a credit is in flight silently loses that credit.

The same bug exists in:
- `cancel()` action (line 251)
- Any external `useScanStore.getState().reset()` call

### Affected Code Paths
The auto-dismiss race affects these two dialog paths:
- **Total mismatch** (`subhandlers.ts:124-126`): `showScanDialog('total_mismatch')` → `scanOverlay.setReady()`
- **Currency mismatch** (`subhandlers.ts:363-365`): `showScanDialog('currency_mismatch')` → `scanOverlay.setReady()`

### Timeline
| Date | Commit | What Changed | Effect |
|------|--------|-------------|--------|
| Jan 3 | `54bd55f2` | ScanOverlay auto-dismiss created | Timer fires `onDismiss` after 500ms |
| Jan 26 | `8e04c067` | `scanOverlay.setReady()` added in dialog paths | Timer starts even during dialogs (harmless at this point) |
| Mar 6 | `3db91f55` | Story 16-3: dismiss handler does full reset + navigate | **Bug introduced**: dialogs get nuked, navigation to dashboard |
| Mar 13 | `879b0ecf` | Added `visible` guard to auto-dismiss | Doesn't fix dialog case (phase stays `scanning`) |

### Impact
- Credit consumed, no transaction saved, no refund — user pays for nothing
- Affects any scan with >40% total discrepancy OR currency mismatch
- In production since Mar 6 (7 days). Frequency unknown but likely low (requires specific Gemini response conditions).

## Acceptance Criteria

### Layer 1: Fix the Immediate Bug
- **AC-1:** Given a scan triggers TotalMismatchDialog, when the dialog appears, then it remains on screen until the user clicks "Use items sum" or "Keep original" or "Cancel"
- **AC-2:** Given a scan triggers CurrencyMismatchDialog, when the dialog appears, then it remains on screen until the user clicks "Use detected" or "Use default" or "Cancel"
- **AC-3:** The ScanOverlay auto-dismiss effect MUST NOT fire when `activeDialog` is non-null

### Layer 2: Credit Safety Net
- **AC-4:** Given `creditStatus` is `reserved` or `confirmed` when `reset()` is called, then the credit MUST be refunded (call `addUserCredits(1)`) before resetting `creditStatus` to `none`
- **AC-5:** Given `creditStatus` is `reserved` or `confirmed` when `cancel()` is called, then the credit MUST be refunded before resetting
- **AC-6:** Add a `logGuardViolation` warning when `reset()` or `cancel()` encounters an unredeemed credit — this is a "should never happen" path that indicates a bug elsewhere

### Layer 3: Regression Protection — Dialog Fix
- **AC-7:** Unit test: TotalMismatchDialog render → wait 1000ms → dialog still visible, overlay dismissed
- **AC-8:** Unit test: CurrencyMismatchDialog render → wait 1000ms → dialog still visible

### Layer 4: Regression Protection — Story 16-3 Error Recovery (must not break)
The Story 16-3 fix (`3db91f55`) made `handleScanOverlayDismiss` do full reset + navigate to dashboard so the gallery works after error dismissal. Three existing tests verify this (`useScanStore.core.test.ts:341-395`). Our fix MUST NOT regress these flows.

The key distinction:
- **Error dismiss** (16-3): overlay is in `error` state, no dialog active → reset + navigate is CORRECT
- **Dialog paths** (TD-18-3): overlay is in `ready` state, dialog IS active → reset + navigate is WRONG

- **AC-12:** Existing test preserved: scan fail → reset → store is idle (phase, overlay, images all reset)
- **AC-13:** Existing test preserved: scan fail → reset → gallery select → image accepted
- **AC-14:** Existing test preserved: scan fail → reset → retry scan succeeds
- **AC-15:** New test: scan fail → error dismiss → credit refunded (via safety net) → store is idle → gallery select works
- **AC-16:** New test: scan success with total mismatch dialog → error dismiss does NOT fire (auto-dismiss blocked by active dialog) → dialog stays → user resolves dialog → flow continues normally

### Layer 5: Credit Safety Net Tests
- **AC-17:** Unit test: `reset()` with `creditStatus: 'reserved'` → verify refund called + guard violation logged
- **AC-18:** Unit test: `reset()` with `creditStatus: 'none'` → verify no refund called (normal path)
- **AC-19:** Unit test: `cancel()` with `creditStatus: 'confirmed'` → verify refund called
- **AC-20:** Unit test: full flow — processStart (credit reserved) → processError → reset → credit refunded (not double-refunded since processError already sets 'refunded')
- **AC-21:** Unit test: full flow — processStart (credit reserved) → dialog shown (no processSuccess) → reset → credit refunded (this is the exact TD-18-3 scenario)

## Tasks

### Task 1: Fix auto-dismiss race (AC-1, AC-2, AC-3)
**Option A (preferred):** Remove `scanOverlay.setReady()` from both dialog paths in `subhandlers.ts`. The overlay should stay in "processing" state while a dialog is open — the dialog IS the user's next action, not the overlay.
**Option B:** Add `activeDialog` check to the ScanOverlay auto-dismiss useEffect — skip timer if dialog is active.
**Recommendation:** Do BOTH — Option A fixes the root cause, Option B adds a belt-and-suspenders guard so any future `setReady()` call with an active dialog is harmless.

Files: `src/features/scan/handlers/processScan/subhandlers.ts`, `src/features/scan/components/ScanOverlay.tsx`

### Task 2: Add credit safety net to reset/cancel (AC-4, AC-5, AC-6)
Add credit reconciliation check at the top of `reset()` and `cancel()` in `scanCoreSlice.ts`. If `creditStatus` is `reserved` or `confirmed`, call the credit refund service and log a guard violation.

Note: The refund service (`addUserCredits`) is async and lives outside the store. Options:
- Accept fire-and-forget refund (log violation, best-effort refund)
- Or pass refund callback into the store via dependency injection at creation time

Files: `src/features/scan/store/slices/scanCoreSlice.ts`, `src/features/scan/store/slices/scanCreditSlice.ts`

### Task 3: Write regression tests (AC-7, AC-8, AC-12 through AC-21)
- Dialog persistence tests (mock timers, verify dialog survives past READY_DISPLAY_MS)
- Story 16-3 error recovery tests (verify existing tests still pass + new credit-aware variants)
- Credit safety net tests (verify refund on unclean reset, no double-refund on clean reset)
- Integration-style flow tests for the exact TD-18-3 scenario (reserved credit → dialog → reset → refund)

Files: `tests/unit/features/scan/`, `src/features/scan/store/__tests__/useScanStore.core.test.ts`

### Task 4: Verify Story 16-3 E2E still passes
The on-demand E2E test at `tests/e2e/staging/scan-gallery-after-error.spec.ts` (previously `tests/e2e/on-demand/`) must still pass after the fix. Run it against staging to confirm.

Files: `tests/e2e/staging/scan-gallery-after-error.spec.ts` (read-only verification)

## Technical Notes
- `READY_DISPLAY_MS` is 500ms (defined in `src/features/scan/store/index.ts:21`)
- `handleScanOverlayDismiss` is in `src/features/scan/hooks/useScanHandlers.ts:234`
- `initialScanState.creditStatus` is `'none'` (defined in `src/features/scan/store/slices/initialState.ts:45`)
- The credit deduction happens in `processScan.ts:147` (`services.deductUserCredits(1)`), and the only existing refund path is the catch block at line 454 (`services.addUserCredits(1)`)
- The dialog paths return `{ success: false }` without entering the catch block — they're "expected interruptions," not errors, so no refund occurs
- Existing Story 16-3 error recovery tests: `src/features/scan/store/__tests__/useScanStore.core.test.ts:341-395` (3 tests in "Error recovery flows" describe block)
- Existing Story 16-3 E2E test: `tests/e2e/staging/scan-gallery-after-error.spec.ts`
- ScanOverlay auto-dismiss effect: `src/features/scan/components/ScanOverlay.tsx:109-116`
- Overlay visibility logic: `src/features/scan/ScanFeature.tsx:439-449` (phase must be `scanning` or `error`)
- `processSuccess` sets phase to `reviewing` AND `creditStatus` to `confirmed`: `src/features/scan/store/slices/scanCoreSlice.ts:175-183`
- `processError` sets phase to `error` AND `creditStatus` to `refunded`: `src/features/scan/store/slices/scanCoreSlice.ts:186-190`
- Dialog paths do NOT call `processSuccess` or `processError` — phase stays `scanning`, `creditStatus` stays `reserved`

## Key File Map
| File | Role |
|------|------|
| `src/features/scan/handlers/processScan/subhandlers.ts:124-126, 363-365` | Bug site: `setReady()` in dialog paths |
| `src/features/scan/components/ScanOverlay.tsx:109-116` | Auto-dismiss timer |
| `src/features/scan/hooks/useScanHandlers.ts:234-241` | Destructive dismiss handler |
| `src/features/scan/store/slices/scanCoreSlice.ts:241-258` | `cancel()` and `reset()` — need credit guard |
| `src/features/scan/store/slices/scanCreditSlice.ts` | Credit state slice |
| `src/features/scan/store/slices/initialState.ts:45` | `creditStatus: 'none'` |
| `src/features/scan/store/__tests__/useScanStore.core.test.ts:341-395` | Existing 16-3 tests (must not regress) |
| `tests/e2e/staging/scan-gallery-after-error.spec.ts` | E2E for 16-3 (verify still passes) |

## Out of Scope
- Gemini returning wrong values (that's a separate prompt quality issue, covered partially by 18-8)
- Batch scan credit handling (different flow, separate audit if needed)
- UI for showing "credit refunded" toast when safety net fires (nice-to-have, backlog)

## Senior Developer Review (KDBP)

- **Date:** 2026-03-13
- **Classification:** STANDARD
- **Agents:** code-reviewer (7.5/10), security-reviewer (8/10), ui-consistency (10/10)
- **Overall:** APPROVE WITH CHANGES — 8.5/10
- **Quick fixes applied (6):** orphaned scanOverlay interfaces/call-sites, useEffect unmount cleanup, refund .catch() logging, null type contract, saveSuccess comment, single get() snapshot
- **Deferred to backlog (4):** hardcoded refund amount, unguarded callback registration, missing rejection test, guard logs in production

### Deferred Findings Tracking

| # | Finding | Stage | Destination |
|---|---------|-------|-------------|
| 4 | Hardcoded refund amount `1` | PROD | Backlog |
| 5 | Unguarded callback registration | PROD | Backlog |
| 9 | Missing rejection branch test | PROD | Backlog |
| 10 | Guard violation logs in production | SCALE | Backlog |

<!-- CITED: L2-004 (orphaned references), L2-008 (lifecycle management) -->
