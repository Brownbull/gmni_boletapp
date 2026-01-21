# Epic 14d: Scan Architecture Refactor

**Status:** Ready for Development
**Points:** ~34 (11 stories)
**Origin:** Architecture Review Session 2026-01-08
**Dependency:** Epic 14 (Core Implementation) in progress
**Planning Document:** [scan-architecture-refactor-plan.md](./scan-architecture-refactor-plan.md)

## Vision

Refactor the scan button functionality from 30+ scattered state variables into a unified state machine architecture. This enables reliable multi-mode scanning (single, batch, credit statements) with clear visual feedback and proper navigation handling.

## Problem Statement

The scan functionality has grown organically across Epics 11, 12, and 14, resulting in:
- **31 state variables** scattered in App.tsx
- **Fragile interdependencies** where bug fixes cause regressions
- **No clear state transitions** making debugging difficult
- **No extension path** for future scan types (credit card statements)

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Pattern** | State Machine (extends ADR-020) | Explicit states, predictable transitions |
| **Context Scope** | App-wide ScanContext | Navigation guards need global awareness |
| **Navigation Blocking** | Hybrid (Custom + Router) | Custom for Nav.tsx, Router for browser back |
| **Persistence** | Keep existing services | pendingScanStorage + pendingBatchStorage work |

## UX Decisions

| Decision | Choice |
|----------|--------|
| **Mode Selection** | Single tap = single scan, Long press = popup with 3 options |
| **FAB States** | Color + icon change per mode, shine effect during processing |
| **Dialog Blocking** | Only blocks scan view, other navigation remains free |
| **Credit Card Mode** | Long-press menu entry → placeholder view for now |

---

## Phase 1: State Machine Foundation

### Story 14d.1: Create useScanStateMachine Hook (5 pts)

**Description:** Build the core state machine hook using useReducer pattern.

**Deliverables:**
- `src/hooks/useScanStateMachine.ts`
- `src/types/scanStateMachine.ts`

**Acceptance Criteria:**
- [ ] ScanPhase type: `'idle' | 'capturing' | 'processing' | 'reviewing' | 'dialog' | 'saving' | 'error'`
- [ ] ScanMode type: `'single' | 'batch' | 'statement'`
- [ ] Full action set: START_SINGLE, START_BATCH, START_STATEMENT, ADD_IMAGE, PROCESS, SHOW_DIALOG, RESOLVE_DIALOG, SAVE, CANCEL, RESET
- [ ] Computed values: `isBlocking`, `canNavigate`, `currentView`
- [ ] Unit tests for all state transitions

---

### Story 14d.2: Create ScanContext Provider (3 pts)

**Description:** Wrap app with ScanContext provider exposing state machine.

**Deliverables:**
- `src/contexts/ScanContext.tsx`
- Update `src/App.tsx` to include provider

**Acceptance Criteria:**
- [ ] ScanContext with state machine values
- [ ] `useScan()` hook for consuming context
- [ ] Provider wraps entire app (app-wide scope)
- [ ] TypeScript types exported for consumers
- [ ] Unit tests for context behavior

---

### Story 14d.3: Implement Hybrid Navigation Blocking (3 pts)

**Description:** Add navigation guards that block only from scan view when dialogs are active.

**Deliverables:**
- Update `src/components/Nav.tsx`
- Update `src/App.tsx` with React Router useBlocker

**Acceptance Criteria:**
- [ ] Custom guard in Nav.tsx checks `canNavigate` + `currentView`
- [ ] React Router useBlocker for browser back button
- [ ] Dialogs only block when IN scan view
- [ ] Navigation to other views works while scan in progress
- [ ] FAB shows scan state when navigated away
- [ ] Integration tests for blocking behavior

---

## Phase 2: Migrate Existing Flows

### Story 14d.4: Refactor Single Scan Flow (8 pts)

**Description:** Migrate single scan from App.tsx state variables to state machine.

**Deliverables:**
- Update `src/App.tsx` (remove single scan state)
- Update `src/views/TransactionEditorView.tsx`
- Update scan-related components

**Acceptance Criteria:**
- [ ] Remove from App.tsx: `scanImages`, `scanError`, `isRescanning`, `scanStoreType`, `scanCurrency`, `pendingScan`, `scanButtonState`, `skipScanCompleteModal`, `isAnalyzing`
- [ ] Single scan uses state machine actions
- [ ] processScan() dispatches state machine actions
- [ ] All single scan functionality preserved
- [ ] Existing tests pass
- [ ] No regression in scan flow

---

### Story 14d.5: Refactor Batch Scan Flow (8 pts)

**Description:** Migrate batch scan from App.tsx state variables to state machine.

**Deliverables:**
- Update `src/App.tsx` (remove batch scan state)
- Update `src/views/BatchCaptureView.tsx`
- Update `src/views/BatchReviewView.tsx`

**Acceptance Criteria:**
- [ ] Remove from App.tsx: `batchImages`, `isBatchCaptureMode`, `isBatchProcessing`, `batchProgress`, `batchResults`, `batchReviewResults`, `batchEditingReceipt`, `pendingBatch`, `showBatchPreview`, `showBatchSummary`, `showBatchCompleteModal`, `batchCompletedTransactions`, `batchCreditsUsed`, `showBatchCancelConfirm`, `showBatchDiscardConfirm`
- [ ] Batch scan uses state machine actions
- [ ] handleBatchProcess() dispatches state machine actions
- [ ] All batch scan functionality preserved
- [ ] Existing tests pass

---

### Story 14d.6: Unify Dialog Handling (5 pts)

**Description:** Consolidate currency, total, and quicksave dialogs into state machine.

**Deliverables:**
- Update dialog components to use state machine
- Remove dialog state from App.tsx

**Acceptance Criteria:**
- [ ] Remove from App.tsx: `showCurrencyMismatch`, `currencyMismatchData`, `showTotalMismatch`, `totalMismatchData`, `showQuickSaveCard`, `quickSaveTransaction`, `quickSaveConfidence`
- [ ] Dialogs triggered via SHOW_DIALOG action
- [ ] Dialogs resolved via RESOLVE_DIALOG action
- [ ] Dialog state in state machine: `activeDialog: null | 'currency' | 'total' | 'quicksave'`
- [ ] All dialog functionality preserved

---

## Phase 3: FAB & Mode Selection UX

### Story 14d.7: Implement Mode Selector Popup (5 pts)

**Description:** Add long-press popup for scan mode selection.

**Deliverables:**
- `src/components/scan/ScanModeSelector.tsx`
- Update FAB component for long-press detection

**Acceptance Criteria:**
- [ ] Long press (500ms) on FAB shows popup
- [ ] Popup appears above nav bar
- [ ] Three options: "Escaneo único", "Escaneo múltiple", "Estado de cuenta"
- [ ] Icons: 📷, 📚, 💳
- [ ] Single tap still triggers single scan (backward compatible)
- [ ] Popup dismisses on selection or tap outside
- [ ] Accessibility: proper focus management

---

### Story 14d.8: FAB Visual States (5 pts)

**Description:** Implement color, icon, and shine effect per scan mode.

**Deliverables:**
- Update FAB component with mode-aware styling
- Add shine animation CSS

**Acceptance Criteria:**
- [ ] Single mode: default color, 📷 icon
- [ ] Batch mode: distinct color A, 📚 icon
- [ ] Statement mode: distinct color B, 💳 icon
- [ ] Processing state: shine effect (left→right) on any mode
- [ ] Colors defined in design system
- [ ] Shine animation respects prefers-reduced-motion

---

### Story 14d.9: Statement Scan Placeholder View (2 pts)

**Description:** Create placeholder view for credit card statement scanning.

**Deliverables:**
- `src/views/StatementScanView.tsx`

**Acceptance Criteria:**
- [ ] View shows "Próximamente" message
- [ ] Back button returns to dashboard
- [ ] Back button resets FAB to idle state
- [ ] View registered in routing
- [ ] Placeholder styling matches app theme

---

## Phase 4: Polish & Extension

### Story 14d.10: State Machine Persistence (3 pts)

**Description:** Persist state machine to localStorage for crash recovery.

**Deliverables:**
- Update `useScanStateMachine.ts` with persistence
- Integration with existing pendingScanStorage

**Acceptance Criteria:**
- [ ] State machine persists on state change
- [ ] State restored on app reload
- [ ] Stale state cleared after timeout (e.g., 24h)
- [ ] Integration with existing persistence services
- [ ] Tests for persistence/restore cycle

---

### Story 14d.11: App.tsx Cleanup (5 pts)

**Description:** Remove all migrated state variables and handlers from App.tsx.

**Deliverables:**
- Clean App.tsx of scan-related code
- Update any remaining references

**Acceptance Criteria:**
- [ ] App.tsx reduced by ~500+ lines
- [ ] All 31 scan state variables removed
- [ ] processScan() moved to ScanContext
- [ ] handleBatchProcess() moved to ScanContext
- [ ] Scan-related useEffects removed
- [ ] All tests pass
- [ ] No TypeScript errors

---

## Story Summary

| Phase | Stories | Points |
|-------|---------|--------|
| Phase 1: Foundation | 14d.1-14d.3 | 11 |
| Phase 2: Migration | 14d.4-14d.6 | 21 |
| Phase 3: UX | 14d.7-14d.9 | 12 |
| Phase 4: Polish | 14d.10-14d.11 | 8 |
| **TOTAL** | **11 stories** | **~52 pts** |

## Dependencies

- **Blocks:** Epic 14e (Credit Card Statement Scanning) - needs architecture in place
- **Blocked by:** None (can start immediately)

## Success Metrics

- App.tsx reduced from 3,800+ lines to ~3,000 lines
- Scan-related state variables: 31 → 0 in App.tsx
- All existing scan tests pass
- No regressions in scan functionality
- Clear extension path for statement scanning

## Reference Files

See [scan-architecture-refactor-plan.md](./scan-architecture-refactor-plan.md) for:
- Full state variable inventory
- Known issues and hotfixes
- State transition diagrams
- UX mockup requirements

---

*Epic created by Atlas - Project Intelligence Guardian*
