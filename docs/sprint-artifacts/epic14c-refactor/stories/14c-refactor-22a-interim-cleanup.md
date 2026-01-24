# Story 14c-refactor.22a: App.tsx Interim Cleanup - Handler Hook Integration

Status: done

## Story

As a **developer**,
I want **useScanHandlers and useDialogHandlers integrated into App.tsx**,
So that **handler logic is encapsulated in testable hooks rather than inline in App.tsx**.

## Background

This story was split from the original 14c-refactor.22a after development revealed the full scope exceeded a single context window. The original story attempted to:
1. Integrate handler hooks (Tasks 1-2) ← **THIS STORY**
2. Add TypeScript safety to viewRenderers (Task 3.2) → **Story 22b**
3. Create renderViewSwitch function (Tasks 3.3-3.7) → **Story 22c**
4. Extract AppOverlays component (Task 4) → **Story 22d**
5. Final verification (Task 5) → **Story 22e**

**Completion State (2026-01-22):**
- App.tsx: 4,408 lines (reduced 412 lines from hook integration)
- useScanHandlers: ✅ INTEGRATED (App.tsx:959-1015, 65 tests passing)
- useDialogHandlers: ✅ INTEGRATED (App.tsx:927-934, 26 tests passing)
- Duplicate inline handlers: ✅ REMOVED
- Total tests: 91 passing

**Remaining Work (Deferred to Stories 22b-22e):**
- View switch JSX extraction → Story 22c
- AppOverlays extraction → Story 22d
- TypeScript safety → Story 22b
- Final verification → Story 22e

## Acceptance Criteria

### Core Functionality (This Story - Tasks 1-2 Only)

1. **Given** useScanHandlers exists but is commented out ✅ MET
   **When** this story is completed
   **Then:**
   - useScanHandlers integrated in App.tsx (lines 959-1015)
   - handleScanOverlayCancel, handleQuickSave, etc. come from useScanHandlers
   - No duplicate scan handler definitions in App.tsx
   - 65 unit tests passing

2. **Given** useDialogHandlers exists but is commented out ✅ MET
   **When** this story is completed
   **Then:**
   - useDialogHandlers integrated in App.tsx (lines 927-934)
   - toastMessage, showConflictDialog, etc. come from useDialogHandlers
   - No duplicate dialog handler definitions in App.tsx
   - 26 unit tests passing

### Deferred Acceptance Criteria (See Stories 22b-22e)

3. **View switch extraction** → Story 14c-refactor-22c
4. **AppOverlays extraction** → Story 14c-refactor-22d
5. **Line count target (~2,000)** → Story 14c-refactor-22e
6. **Workflow verification** → Story 14c-refactor-22e

## Tasks / Subtasks

### Task 1: Integrate useScanHandlers (AC: #3) - COMPLETE

- [x] 1.1 Verify existing tests in `tests/unit/hooks/app/useScanHandlers.test.ts` cover handlers (65 tests passing)
- [x] 1.2 Uncomment useScanHandlers import in App.tsx (line 73)
- [x] 1.3 Call useScanHandlers with required props (lines 959-1015)
- [x] 1.4 Replace inline handlers with hook returns:
  - handleScanOverlayCancel
  - handleScanOverlayRetry
  - handleQuickSave
  - handleQuickSaveEdit
  - handleQuickSaveCancel
  - handleCurrencyUseDetected
  - handleCurrencyKeepOriginal
  - handleTotalMismatchAccept
  - handleTotalMismatchEdit
- [x] 1.5 Remove duplicate inline useCallback definitions
- [x] 1.6 Verify scan flow works end-to-end

### Task 2: Integrate useDialogHandlers (AC: #3) - COMPLETE

- [x] 2.1 Verify existing tests in `tests/unit/hooks/app/useDialogHandlers.test.ts` cover handlers (26 tests passing)
- [x] 2.2 Uncomment useDialogHandlers import in App.tsx (line 75)
- [x] 2.3 Call useDialogHandlers with required props (lines 927-934)
- [x] 2.4 Replace inline state with hook returns:
  - toastMessage / setToastMessage / showToast
  - showCreditInfoModal / openCreditInfoModal / closeCreditInfoModal
  - showConflictDialog / conflictDialogData / handleConflictClose
- [x] 2.5 Remove duplicate useState declarations for dialog state
- [x] 2.6 Verify toast and dialogs work correctly

### Task 3: Extend viewRenderers.tsx → DEFERRED to Stories 22b, 22c

> **Story 22b:** Task 3.2 (TypeScript safety)
> **Story 22c:** Tasks 3.1, 3.3-3.7 (renderViewSwitch function)

### Task 4: Create AppOverlays Component → DEFERRED to Story 22d

> **Story 22d:** Full Task 4 (AppOverlays extraction)

### Task 5: Final Cleanup & Verification → DEFERRED to Story 22e

> **Story 22e:** Full Task 5 (verification and smoke test)

---

## Story Split Summary (2026-01-22)

Original story 22a was too large for a single development cycle. Split into:

| Story | Focus | Status |
|-------|-------|--------|
| **22a** (this) | Hook integration (Tasks 1-2) | ✅ DONE |
| **22b** | TypeScript safety (Task 3.2) | ready-for-dev |
| **22c** | renderViewSwitch (Tasks 3.3-3.7) | ready-for-dev (depends on 22b) |
| **22d** | AppOverlays extraction (Task 4) | ready-for-dev |
| **22e** | Final verification (Task 5) | ready-for-dev (depends on 22b, 22c, 22d) |

**Dependency Graph:**
```
22a (DONE) ──┬── 22b (Types) ──► 22c (renderViewSwitch) ──┐
             │                                             │
             └── 22d (AppOverlays) ────────────────────────┼──► 22e (Verify)
```

---

## Dev Notes

### Estimation

- **Points:** 1 pt (reduced scope - Tasks 1-2 only)
- **Risk:** LOW - Hook integration is mechanical, well-tested

### Dependencies

- **Requires:** None (handler hooks already exist)
- **Blocks:** Stories 22b, 22c, 22d, 22e (continuation stories)

### TypeScript Safety (CRITICAL)

The existing `viewRenderers.tsx` uses `any` types extensively. This hides bugs that should be caught at compile time.

**DO NOT use `any` for props.** Instead:

```typescript
// ❌ BAD - Fire waiting to spread
export function renderDashboardView(props: {
    transactions: any;
    currency: any;
})

// ✅ GOOD - TypeScript catches mismatches
import type { Transaction } from '../../types/transaction';
import type { Currency } from '../../types/preferences';

export function renderDashboardView(props: {
    transactions: Transaction[];
    currency: Currency;
})
```

If a view's prop types aren't exported, extract them or use `ComponentProps<typeof ViewComponent>`.

### View Switch Cases (15 total)

```
dashboard, trends, history, items, insights, alerts,
scan-result, transaction-editor, batch-capture, batch-review,
settings, reports, recent-scans, statement-scan, notifications
```

### Overlay Z-Index Reference

| Overlay | Z-Index | Condition |
|---------|---------|-----------|
| ScanOverlay | 50 | `scanState.isProcessing` |
| QuickSaveCard | 40 | `showQuickSave && quickSaveData` |
| BatchCompleteModal | 40 | `scanState.dialogType === 'batch-complete'` |
| CreditWarningDialog | 50 | `showCreditWarning` |
| TransactionConflictDialog | 50 | `showConflictDialog` |
| InsightCard | 30 | `showInsight && currentInsight` |
| NavigationBlocker | 60 | Always (handles browser back) |
| PWAUpdatePrompt | 60 | `showUpdatePrompt` |

### File Structure After This Story

```
src/
├── App.tsx                          # ~2,000 lines (down from 4,820)
├── components/App/
│   ├── index.ts                     # Exports all App components
│   ├── AppLayout.tsx                # (existing)
│   ├── AppOverlays.tsx              # NEW: ~300 lines
│   ├── AppProviders.tsx             # (existing, not yet integrated)
│   ├── AppRoutes.tsx                # (existing)
│   ├── viewRenderers.tsx            # EXTENDED: ~400 lines
│   └── types.ts                     # (existing)
└── hooks/app/
    ├── useTransactionHandlers.ts    # (existing, integrated)
    ├── useNavigationHandlers.ts     # (existing, integrated)
    ├── useScanHandlers.ts           # (existing, NOW integrated)
    └── useDialogHandlers.ts         # (existing, NOW integrated)
```

## References

- [Source: Story 14c-refactor.22](14c-refactor-22-app-jsx-extraction-final-cleanup.md) - Original blocked story
- [Source: src/App.tsx:927-934] - useDialogHandlers integration
- [Source: src/App.tsx:959-1015] - useScanHandlers integration
- [Source: src/hooks/app/useScanHandlers.ts] - Scan handlers hook (65 tests)
- [Source: src/hooks/app/useDialogHandlers.ts] - Dialog handlers hook (26 tests)
- [Continuation: Story 22b](14c-refactor-22b-viewrenderers-typescript.md) - TypeScript safety
- [Continuation: Story 22c](14c-refactor-22c-renderviewswitch.md) - View switch function
- [Continuation: Story 22d](14c-refactor-22d-appoverlays.md) - Overlay extraction
- [Continuation: Story 22e](14c-refactor-22e-verification.md) - Final verification

## File List

**Modified (This Story):**
- `src/App.tsx` - ✅ Hooks integrated (lines 927-934, 959-1015)
- `src/hooks/app/index.ts` - ✅ Exports useScanHandlers, useDialogHandlers

**Deferred to Continuation Stories:**
- `src/components/App/viewRenderers.tsx` → Story 22b, 22c
- `src/components/App/AppOverlays.tsx` → Story 22d
