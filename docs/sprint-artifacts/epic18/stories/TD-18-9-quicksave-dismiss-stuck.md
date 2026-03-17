# Tech Debt Story TD-18-9: QuickSaveCard Dismiss Bug — Stuck After Save

Status: done

> **Source:** Production UX bug (2026-03-17)
> **Priority:** HIGH | **Estimated Effort:** 1 point

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Save and move on, don't get stuck"
**Value:** V5 — "Easier than the receipt drawer" — if the app freezes after saving a scan, users must force-close and re-open, and the same scan reappears. That's harder than the receipt drawer.

## Story
As a **user**, I want **the quick save confirmation screen to dismiss after I save a scanned transaction**, so that **I can continue using the app without force-closing and re-opening**.

## Background

### Symptom
After scanning a receipt from a known merchant and pressing "Guardar" on the QuickSaveCard:
1. Transaction saves to Firestore successfully
2. Green checkmark and "saved" text appear (success animation)
3. Screen is stuck — no button to dismiss, no auto-navigation
4. User must force-close and reopen the app
5. On reopen, the same scan reappears (save-or-cancel prompt)

### Root Cause
In `src/features/scan/hooks/useScanHandlers.ts`:

**`handleQuickSave` (line 294-389):** The error path calls `dismissScanDialog()` (line 386) but the success path does NOT. After a successful save, `activeDialog` remains set to `DIALOG_TYPES.QUICKSAVE` in the scan store.

**`handleQuickSaveComplete` (line 285-288):** Called after the success animation. Only clears `scanImages` and navigates to `dashboard` — does NOT call `dismissScanDialog()`.

**`handleQuickSaveCancel` (line 435-438):** Same issue — clears state but never calls `dismissScanDialog()`.

```typescript
// BEFORE (broken):
const handleQuickSaveComplete = useCallback(() => {
    setScanImages([]);          // clears images
    setView('dashboard');       // navigates away
    // MISSING: dismissScanDialog() — dialog state persists
}, [setScanImages, setView]);
```

Because `dismissScanDialog()` is never called on the success path:
- The QuickSaveCard's success overlay (z-[100]) blocks all interaction
- The scan store retains `activeDialog.type = QUICKSAVE` and `phase = reviewing`
- On app reopen, the stale Zustand state causes QuickSaveCard to re-render with the old transaction

### Contrast with error path
The error handler at line 386 correctly calls `dismissScanDialog()` — so failed saves dismiss properly. Only successful saves get stuck.

## Acceptance Criteria

### Functional
- **AC-1:** After pressing "Guardar" and seeing the success animation, the app navigates to the dashboard without getting stuck
- **AC-2:** On app reopen after a successful quick save, no stale scan dialog appears
- **AC-3:** Cancelling a quick save also properly clears the dialog state

### Technical
- **AC-4:** `handleQuickSaveComplete` calls `dismissScanDialog()` before clearing images and navigating
- **AC-5:** `handleQuickSaveCancel` calls `dismissScanDialog()` before clearing state

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| Scan handlers | `src/features/scan/hooks/useScanHandlers.ts` | EDIT |

## Tasks

### Task 1: Fix missing dialog dismiss (2 subtasks)
- [x] 1.1: Add `dismissScanDialog()` call to `handleQuickSaveComplete` — before `setScanImages([])` and `setView('dashboard')`. Add `dismissScanDialog` to dependency array.
- [x] 1.2: Add `dismissScanDialog()` call to `handleQuickSaveCancel` — before `setCurrentTransaction(null)`. Add `dismissScanDialog` to dependency array.

## Fix Applied

```typescript
// AFTER (fixed):
const handleQuickSaveComplete = useCallback(() => {
    dismissScanDialog();        // ← ADDED: clear dialog state
    setScanImages([]);
    setView('dashboard');
}, [dismissScanDialog, setScanImages, setView]);

const handleQuickSaveCancel = useCallback((_dialogData?: QuickSaveDialogData) => {
    dismissScanDialog();        // ← ADDED: clear dialog state
    setCurrentTransaction(null);
    setScanImages([]);
    setView('dashboard');
}, [dismissScanDialog, setCurrentTransaction, setScanImages, setView]);
```

Two lines added, zero lines changed. `dismissScanDialog` was already imported and in scope (used by the error path at line 386 and 8 other handlers in the same file).

## Sizing
- **Points:** 1 (TRIVIAL)
- **Tasks:** 1
- **Subtasks:** 2
- **Files:** 1

## Dependencies
- None (standalone fix)

## Risk Flags
- None — surgical fix matching existing error-path pattern. 155 scan tests pass.

## Verification
- TypeScript: `npx tsc --noEmit` — clean
- Tests: `npx vitest run src/features/scan/` — 155 pass, 0 fail

## Senior Developer Review (ECC)

- **Date:** 2026-03-17
- **Classification:** TRIVIAL
- **Agents:** [code-reviewer]
- **Outcome:** APPROVE 9.5/10
- **Action items:** 0 fixed, 2 deferred to backlog, 1 archived (intentional)

### Deferred Findings

| # | Finding | Stage | Destination |
|---|---------|-------|-------------|
| 1 | Missing dismissScanDialog test assertions (blocked by 1278-line test file) | PROD | Backlog |
| 2 | Pre-existing console.warn in catch blocks (L359, L365, L379) | PROD | Backlog |
| 3 | handleQuickSaveComplete doesn't null currentTransaction (intentional) | — | Archived |

<!-- CITED: none -->
