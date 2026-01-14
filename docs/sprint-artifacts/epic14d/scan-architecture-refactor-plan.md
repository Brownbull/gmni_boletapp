# Epic 14d: Scan Architecture Refactor - Planning Document

> **Status:** READY FOR DEVELOPMENT
> **Created:** 2026-01-08
> **Last Updated:** 2026-01-08
> **Sessions:** Architecture review ✅, UX review ✅, Epic creation ✅, Mockups ✅

---

## Executive Summary

The scan button functionality has grown organically across multiple epics (11, 12, 14) resulting in **30+ interconnected state variables** in App.tsx. This creates fragile code where bug fixes cause regressions. A dedicated refactor epic is needed before adding future scan types (credit card statements).

---

## Current State Analysis

### State Variable Inventory (App.tsx)

| Category | Variables | Count |
|----------|-----------|-------|
| **Single Scan** | `scanImages`, `scanError`, `isRescanning`, `scanStoreType`, `scanCurrency`, `pendingScan`, `scanButtonState`, `skipScanCompleteModal`, `isAnalyzing` | 9 |
| **Batch Scan** | `batchImages`, `isBatchCaptureMode`, `isBatchProcessing`, `batchProgress`, `batchResults`, `batchReviewResults`, `batchEditingReceipt`, `pendingBatch`, `showBatchPreview`, `showBatchSummary`, `showBatchCompleteModal`, `batchCompletedTransactions`, `batchCreditsUsed`, `showBatchCancelConfirm`, `showBatchDiscardConfirm` | 15 |
| **Dialogs** | `showCurrencyMismatch`, `currencyMismatchData`, `showTotalMismatch`, `totalMismatchData`, `showQuickSaveCard`, `quickSaveTransaction`, `quickSaveConfidence` | 7+ |
| **TOTAL** | | ~31 |

### Known Issues (Discovered 2026-01-08)

| Issue | Symptom | Root Cause | Patch Applied |
|-------|---------|------------|---------------|
| Currency dialog dismissed by nav click | Dialog disappears, scan lost | z-index conflict + backdrop onClick | z-[100], removed backdrop dismiss |
| Quick Save modal showing twice | Redundant "Escaneo completo" after QuickSaveCard edit | scanButtonState transition detection | skipScanCompleteModal flag |
| Blank screen after file select | White screen instead of editor | Deprecated `scan-result` view referenced | Changed to `transaction-editor` |
| Thumbnail not showing during scan | "Adjuntar" instead of image | pendingImageUrl condition missing 'scanning' state | Added 'scanning' to condition |
| Batch nav icon in single mode | Layers icon showing incorrectly | batchEditingReceipt not cleared | Clear in handleNewTransaction |
| GBP transactions missing from carousel | Old receipts not in "Últimos Escaneados" | Query ordered by date, not createdAt | New useRecentScans hook |

**Pattern:** Each fix is a localized patch, not addressing architectural fragility.

### Code Complexity Metrics

- **App.tsx:** 3,800+ lines
- **processScan():** ~300 lines
- **handleBatchProcess():** ~200 lines
- **Scan-related useEffects:** 8+
- **Views involved:** 5 (dashboard, transaction-editor, batch-capture, batch-review, scan)

---

## Future Requirements

The scan button needs to support:

1. **Single Receipt Scan** (current)
2. **Batch Receipt Scan** (current)
3. **Credit Card Statement Scan** (planned)
4. **Credit Card Transaction Import** (planned)

Each mode has different:
- Input capture (single image, multiple images, document upload)
- Processing logic (receipt OCR, statement parsing)
- Output handling (single transaction, multiple transactions)
- Dialog requirements (currency mismatch, item review)

---

## Proposed Architecture

### State Machine Approach

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ScanContext Provider                             │
│                                                                      │
│  useScanStateMachine hook (useReducer pattern)                      │
│  ├── state: ScanState                                               │
│  │   ├── phase: 'idle' | 'capturing' | 'processing' | 'reviewing'  │
│  │   │          | 'dialog' | 'saving' | 'error'                    │
│  │   ├── mode: 'single' | 'batch' | 'statement' (future)           │
│  │   ├── images: string[]                                           │
│  │   ├── results: Transaction[]                                     │
│  │   ├── activeDialog: null | 'currency' | 'total' | 'quicksave'   │
│  │   └── error: string | null                                       │
│  │                                                                  │
│  ├── dispatch(action)                                               │
│  │   ├── { type: 'START_SINGLE_SCAN' }                             │
│  │   ├── { type: 'START_BATCH_SCAN' }                              │
│  │   ├── { type: 'ADD_IMAGE', payload: base64 }                    │
│  │   ├── { type: 'PROCESS' }                                       │
│  │   ├── { type: 'SHOW_DIALOG', payload: dialogType }              │
│  │   ├── { type: 'RESOLVE_DIALOG', payload: choice }               │
│  │   ├── { type: 'SAVE' }                                          │
│  │   ├── { type: 'CANCEL' }                                        │
│  │   └── { type: 'RESET' }                                         │
│  │                                                                  │
│  └── Computed values                                                │
│      ├── isBlocking: phase !== 'idle' && activeDialog !== null     │
│      ├── canNavigate: !isBlocking                                  │
│      └── currentView: derived from phase + mode                     │
└─────────────────────────────────────────────────────────────────────┘
```

### State Transition Diagram

```
                              ┌─────────────────────────────────────────┐
                              │                                          │
                              ▼                                          │
                        ┌──────────┐                                    │
                        │   IDLE   │◄───────────────────────────────────┤
                        └────┬─────┘                                    │
                             │                                          │
             ┌───────────────┼───────────────┐                         │
             │               │               │                         │
             ▼               ▼               ▼                         │
      ┌────────────┐  ┌────────────┐  ┌────────────┐                  │
      │ CAPTURING  │  │ CAPTURING  │  │ CAPTURING  │                  │
      │  (single)  │  │  (batch)   │  │(statement) │                  │
      └─────┬──────┘  └─────┬──────┘  └─────┬──────┘                  │
            │               │               │                          │
            └───────────────┼───────────────┘                          │
                            │                                          │
                            ▼                                          │
                    ┌──────────────┐                                   │
                    │  PROCESSING  │  (cannot navigate away)           │
                    └──────┬───────┘                                   │
                           │                                           │
            ┌──────────────┼──────────────┬─────────────┐              │
            │              │              │             │              │
            ▼              ▼              ▼             ▼              │
     ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐        │
     │ DIALOG:   │  │ DIALOG:   │  │ DIALOG:   │  │REVIEWING│        │
     │ currency  │  │  total    │  │quicksave  │  │(editor) │        │
     │ (blocks)  │  │ (blocks)  │  │ (blocks)  │  │         │        │
     └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └────┬────┘        │
           │              │              │             │              │
           └──────────────┴──────────────┴─────────────┤              │
                                                       │              │
                                                       ▼              │
                                               ┌──────────────┐       │
                                               │    SAVING    │       │
                                               └──────┬───────┘       │
                                                      │               │
                                                      ▼               │
                                                  [SUCCESS]───────────┘
```

### Architecture Decisions (CONFIRMED 2026-01-08)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **State Machine** | ✅ Extends ADR-020 | useReducer pattern with explicit states |
| **Context Scope** | ✅ App-wide | Navigation guards need global awareness; scan connects to Analytics, Learning, Insights |
| **Navigation Blocking** | ✅ Hybrid | Custom for Nav.tsx + React Router for browser back button |
| **Persistence** | Keep existing | pendingScanStorage + pendingBatchStorage already work |

#### Navigation Blocking Implementation

```typescript
// In ScanContext
const { canNavigate, blockedReason, scanPhase } = useScanStateMachine();

// In Nav.tsx - custom guard for app navigation
const handleNavigation = (view: ViewType) => {
  if (!canNavigate && currentView === 'transaction-editor') {
    // Only block if IN the scan view with active dialog
    showBlockedDialog(blockedReason);
    return;
  }
  setCurrentView(view);
};

// In App.tsx - React Router guard for browser back
useBlocker(
  ({ currentLocation, nextLocation }) =>
    !canNavigate &&
    currentLocation.pathname !== nextLocation.pathname &&
    currentView === 'transaction-editor'
);
```

**Key Behavior:** Dialogs only block navigation FROM the scan view. User can freely navigate to other views; the scan state persists and FAB shows progress indicator.

---

## UX Decisions (CONFIRMED 2026-01-08)

### 1. Mode Selection Pattern

```
┌──────────────────────────────────────────────────────────────┐
│                     NEW BEHAVIOR                              │
│                                                               │
│  Camera FAB:                                                  │
│  ├── Single tap → Opens file picker → Single scan            │
│  └── Long press → Shows mode selector popup above nav bar    │
│                                                               │
│  Mode Selector Popup:                                         │
│  ┌─────────────────────────────────────┐                     │
│  │  📷 Escaneo único                   │ ← Single receipt    │
│  │  📚 Escaneo múltiple                │ ← Batch mode        │
│  │  💳 Estado de cuenta                │ ← Credit statement  │
│  └─────────────────────────────────────┘                     │
│                   ▲                                           │
│              [Camera FAB]                                     │
└──────────────────────────────────────────────────────────────┘
```

### 2. Visual Feedback (FAB States)

| Mode | State | Background Color | Icon | Effect |
|------|-------|------------------|------|--------|
| **Single** | Idle | Default (current) | 📷 Camera | None |
| **Single** | Processing | Default | 📷 Camera | Shine left→right |
| **Batch** | Active | Distinct color A | 📚 Layers | None |
| **Batch** | Processing | Distinct color A | 📚 Layers | Shine left→right |
| **Statement** | Active | Distinct color B | 💳 Card | None |
| **Statement** | Processing | Distinct color B | 💳 Card | Shine left→right |

**Key:** Color + icon change indicates mode. Shine effect indicates processing in progress.

### 3. Blocking Dialogs Behavior

| Dialog | Blocks Scan View | Blocks Other Nav | User Can... |
|--------|------------------|------------------|-------------|
| CurrencyMismatchDialog | ✅ YES | ❌ NO | Navigate away, FAB shows state |
| TotalMismatchDialog | ✅ YES | ❌ NO | Navigate away, FAB shows state |
| QuickSaveCard | ✅ YES | ❌ NO | Navigate away, FAB shows state |
| ScanCompleteModal | ✅ YES | ❌ NO | Navigate away, FAB shows state |

**Behavior:** User clicks nav while dialog showing → dialog persists, view changes. Clicking FAB returns to scan view with dialog still visible.

### 4. Credit Card Statement Mode (Future)

```
Long press FAB → Select "Estado de cuenta" →
  → FAB changes to color B + 💳 icon
  → View changes to StatementScanView (placeholder)
  → Placeholder content: "Próximamente" + back button
  → Back button returns to dashboard, resets FAB to idle
```

### Mockup Requirements

- [x] Mode selector popup (decided: 3-option box above FAB)
- [x] FAB states (decided: color + icon + shine effect)
- [x] **CREATED**: Mockup at `docs/uxui/mockups/00_components/scan-mode-selector.html`
- [x] **CREATED**: Color palette (single=#4a7c59, batch=#d97706, statement=#7c3aed, error=#dc2626)
- [x] **CREATED**: Shine animation reference (CSS @keyframes in mockup)
- [ ] StatementScanView placeholder (simple - implement from story spec)

---

## Proposed Story Breakdown

### Epic 14d: Scan Architecture Refactor

#### Phase 1: State Machine Foundation

| Story | Title | Priority | Effort | Dependencies |
|-------|-------|----------|--------|--------------|
| 14d.1 | Create `useScanStateMachine` hook with reducer pattern | HIGH | M | - |
| 14d.2 | Create `ScanContext` provider (app-wide) | HIGH | M | 14d.1 |
| 14d.3 | Implement hybrid navigation blocking | HIGH | S | 14d.2 |

#### Phase 2: Migrate Existing Flows

| Story | Title | Priority | Effort | Dependencies |
|-------|-------|----------|--------|--------------|
| 14d.4 | Refactor single scan flow to use state machine | HIGH | L | 14d.3 |
| 14d.5 | Refactor batch scan flow to use state machine | HIGH | L | 14d.4 |
| 14d.6 | Unify dialog handling (currency, total, quicksave) | MEDIUM | M | 14d.4 |

#### Phase 3: FAB & Mode Selection UX

| Story | Title | Priority | Effort | Dependencies |
|-------|-------|----------|--------|--------------|
| 14d.7 | Implement mode selector popup (long-press FAB) | HIGH | M | 14d.5 |
| 14d.8 | FAB visual states (color, icon, shine effect per mode) | HIGH | M | 14d.7 |
| 14d.9 | Statement scan placeholder view | LOW | S | 14d.7 |

#### Phase 4: Polish & Extension

| Story | Title | Priority | Effort | Dependencies |
|-------|-------|----------|--------|--------------|
| 14d.10 | Persist state machine to localStorage (crash recovery) | MEDIUM | S | 14d.5 |
| 14d.11 | Clean up App.tsx (remove migrated state variables) | HIGH | M | 14d.5, 14d.6 |

### Story Summary

| Phase | Stories | Effort |
|-------|---------|--------|
| Phase 1: Foundation | 14d.1-14d.3 | M + M + S |
| Phase 2: Migration | 14d.4-14d.6 | L + L + M |
| Phase 3: UX | 14d.7-14d.9 | M + M + S |
| Phase 4: Polish | 14d.10-14d.11 | S + M |

**Estimated Total:** 2-3 sprints

---

## Session Progress

### Session 1: Initial Analysis ✅
- [x] State variable inventory (31 variables identified)
- [x] Known issues documented
- [x] Future requirements mapped
- [x] Initial state machine design

### Session 2: Architecture Review ✅ (2026-01-08)
- [x] State machine approach confirmed (extends ADR-020)
- [x] Context scope decided: **App-wide**
- [x] Navigation blocking decided: **Hybrid (Custom + Router)**
- [x] Finalized action/state types

### Session 3: UX Planning ✅ (2026-01-08)
- [x] Mode selection decided: **Single tap = single, Long press = popup**
- [x] FAB states decided: **Color + icon + shine effect per mode**
- [x] Blocking behavior decided: **Only blocks scan view, not other nav**
- [x] Credit card mode decided: **Placeholder via long-press menu**

### Session 4: Epic & Story Creation ✅ (2026-01-08)
- [x] Created `docs/sprint-artifacts/epic14d/epic-14d-scan-architecture-refactor.md`
- [x] Written 11 detailed story files (14d.1-14d.11)
- [x] Defined acceptance criteria for each story
- [ ] Create mockups for mode selector and FAB states (PENDING - designer task)
- [ ] Add to sprint backlog (PENDING - SM task)

---

## Reference Files

### Current Implementation
- `src/App.tsx` - Main state management (lines 295-370 for scan state)
- `src/hooks/useBatchProcessing.ts` - Batch processing logic
- `src/hooks/useBatchCapture.ts` - Batch capture logic
- `src/hooks/useBatchReview.ts` - Batch review logic
- `src/services/pendingScanStorage.ts` - Single scan persistence
- `src/services/pendingBatchStorage.ts` - Batch persistence
- `src/types/scan.ts` - Scan type definitions

### Components
- `src/views/TransactionEditorView.tsx` - Unified editor
- `src/views/BatchCaptureView.tsx` - Batch capture UI
- `src/views/BatchReviewView.tsx` - Batch review UI
- `src/components/scan/CurrencyMismatchDialog.tsx` - Currency dialog
- `src/components/scan/TotalMismatchDialog.tsx` - Total mismatch dialog
- `src/components/scan/QuickSaveCard.tsx` - Quick save modal
- `src/components/scan/ScanCompleteModal.tsx` - Scan complete modal

### Atlas Knowledge
- `_bmad/agents/atlas/atlas-sidecar/knowledge/04-architecture.md` - Architecture patterns
- `_bmad/agents/atlas/atlas-sidecar/knowledge/08-workflow-chains.md` - Workflow dependencies

---

## Appendix: v9.7.0 Hotfixes Applied (2026-01-08)

These patches were applied during the session and should be preserved:

1. **CurrencyMismatchDialog.tsx** - z-[100], removed backdrop onClick
2. **TotalMismatchDialog.tsx** - z-[100], removed backdrop onClick
3. **QuickSaveCard.tsx** - z-[100]
4. **ScanCompleteModal.tsx** - z-[100], removed backdrop onClick
5. **App.tsx** - skipScanCompleteModal state and prop
6. **App.tsx** - handleQuickSaveEdit uses skipScanCompleteModal
7. **App.tsx** - handleFileSelect navigates to transaction-editor
8. **App.tsx** - pendingImageUrl includes 'scanning' state
9. **App.tsx** - handleNewTransaction clears batchEditingReceipt
10. **App.tsx** - Currency dialog handlers continue with QuickSave flow
11. **TransactionEditorView.tsx** - skipScanCompleteModal prop
12. **firestore.ts** - subscribeToRecentScans function
13. **useRecentScans.ts** - New hook for recent scans
14. **queryKeys.ts** - recentScans key
15. **DashboardView.tsx** - Uses recentScans prop

---

*Document created by Atlas - Project Intelligence Guardian*
