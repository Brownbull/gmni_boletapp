# Scan Workflow Restructuring — Pre-Credit-Card-Scanning Proposal

> **Date:** 2026-03-03
> **Predecessor:** Epic 15b Codebase Refactoring (COMPLETED — ~100 stories across 5 phases)
> **Source Analysis:** `dependency-diagrams/ANALYSIS-REPORT.md` (610 modules, 1,980 edges)
> **Status:** DRAFT — Pending brainstorm review and epic definition

---

## 1. Context: Why Now

The next feature roadmap includes:
- **Credit card statement scanning** — new `ScanMode: 'statement'`
- **Batch review improvements** — enhanced editing and navigation
- **Scan error recovery fixes** — gallery selection broken after scan failure
- **Transaction editor enhancements** — supporting new scan result types

All four workstreams converge on the same three features: `scan`, `batch-review`, and `transaction-editor`. These three features form the **tightest coupling cluster** in the codebase — a feature-level cycle flagged in the Epic 15b dependency analysis.

This document proposes structural prep work to ensure these features are modular enough to build on safely.

---

## 2. Current State Assessment

### 2.1 The Feature-Level Cycle

```
scan ──writes──► transaction-editor store  (processScan sets transaction directly)
transaction-editor ──reads──► scan store   (images, phase, batchReceipts, dialogs)
transaction-editor ──writes──► batch-review store  (finishEditing on cancel)
batch-review ──reads/writes──► scan store  (images, actions, phase, batchReceipts)
batch-review ──writes──► transaction-editor  (via App.tsx callbacks)
```

From the dependency analysis (2026-03-03):
- **14 cross-feature pairs** (up from 4 at Phase 1)
- **31 cross-feature edges** (up from 8 at Phase 1)
- Feature-level cycle: `batch-review → scan → transaction-editor → batch-review`

The increase was an expected side effect of Epic 15b's feature consolidation — moving files into features made implicit dependencies explicit. But the cycle means these three features cannot evolve independently.

### 2.2 `useScanStore` as Shared Global State

The scan Zustand store (`useScanStore`) is **the shared nervous system** for all three features:

| Feature | How it uses `useScanStore` |
|---------|---------------------------|
| **scan** | Owns it. Phase guards, credit lifecycle, image storage, batch progress. |
| **batch-review** | Direct read/write: `useScanStore` for `images`, `batchReceipts`, `batchProgress`, dispatch actions (3 files, ~10 imports). |
| **transaction-editor** | Subscribes to 6+ selectors: `images`, `batchEditingIndex`, `batchReceipts`, `phase`, `mode`, `isProcessing`, `activeDialog`. Renders `ScanCompleteModal` from scan components. |
| **App layer** | `useScanWorkflowOrchestrator` wires overlay + store + view navigation. |

### 2.3 The Dual State Machine Problem

Two independent state machines track the same scan lifecycle:

**Machine 1 — `useScanStore` (Zustand, global):**
```
phase: 'idle' | 'capturing' | 'scanning' | 'reviewing' | 'saving' | 'error'
```

**Machine 2 — `useScanOverlayState` (React useState, local):**
```
state: 'idle' | 'uploading' | 'processing' | 'ready' | 'error'
```

These must be synchronized manually at every transition point. They are NOT always in sync:

| Event | Zustand store | Overlay state | Synced? |
|-------|--------------|---------------|---------|
| Scan starts | `idle → capturing → scanning` | `idle → uploading → processing` | Yes |
| Scan succeeds | `scanning → reviewing` | `processing → ready` | Yes |
| Scan fails | `scanning → error` | `processing → error` | Yes |
| User taps **Retry** | `error → idle` (explicit reset) | `error → idle` | Yes |
| User taps **Dismiss** | **stays in `error`** | `error → idle` | **NO** |

The desync on Dismiss is the root cause of the gallery selection bug (see Section 3).

#### Decision History

The dual state machine was a deliberate design choice across three epics:

- **Epic 14, Story 14.3** — "Non-blocking navigation": the overlay must not trap the user; processing continues when they navigate away.
- **Epic 14d, Story 14d.3** — Formalized as hybrid navigation-blocking: "Dialogs only block navigation FROM the scan view. The scan state persists and FAB shows progress indicator."
- **Epic 14e, Story 14e-23a** — Archie architectural review explicitly flagged it as tech debt: *"Dual State Sources — acceptable for incremental migration. **Future story should unify into single Zustand scan store.**"*

The original rationale:
1. Business state (phase, credits, results) must persist across navigation → Zustand
2. UI overlay state (progress %, ETA countdown) is a local component concern → React useState
3. ETA uses a `useRef` ring buffer of wall-clock times that felt tied to React lifecycle

**Why the rationale no longer holds:**
- Zustand can hold the ETA/progress state — it's ~20 lines of math, not React-specific
- View-scoped overlay visibility is already handled by the component (`SCAN_VIEWS.includes(currentView)` check), not by the state machine
- The store is now the shared backbone for three features; an unsynchronized parallel machine creates cross-feature bugs

### 2.4 File Size Blockers

| File | Lines | Limit | Status |
|------|-------|-------|--------|
| `features/scan/store/useScanStore.ts` | 946 | 800 (BLOCK) | **Cannot be edited without splitting first** |
| `features/scan/store/__tests__/useScanStore.test.ts` | 1,338 | 300 (test limit) | Blocks test modifications |
| `features/batch-review/views/BatchCaptureView.tsx` | 798 | 800 (BLOCK) | 2 lines from limit — any addition triggers block |
| `features/batch-review/hooks/useBatchReviewHandlers.ts` | 769 | 800 (BLOCK) | 31 lines from limit — will hit on credit card work |
| `features/scan/ScanFeature.tsx` | 684 | 800 | Approaching; orchestrator role will grow |

### 2.5 Cross-Feature Import Inventory

#### scan → other features (outbound)
| File | Imports from | What |
|------|-------------|------|
| `handlers/processScan/processScan.ts` | `@features/transaction-editor/store` | `transactionEditorActions.setTransaction()`, `.setMode()` — **direct store write** |
| `hooks/useScanHandlers.ts` | `@features/insights` | `generateInsightForTransaction`, `isInsightsSilenced` |
| `hooks/useScanHandlers.ts` | `@features/categories` | `applyItemNameMappings` |
| `handlers/processScan/subhandlers.ts` | `@features/categories` | `applyItemNameMappings` |
| `handlers/processScan/types.ts` | `@features/categories` | `FindItemNameMatchFn` (type only) |
| `ScanFeature.tsx` | `@/components/scan` (legacy) | `QuickSaveCard`, `BatchCompleteModal`, `CurrencyMismatchDialog`, `TotalMismatchDialog` |

#### batch-review → other features (outbound)
| File | Imports from | What |
|------|-------------|------|
| `hooks/useBatchReviewHandlers.ts` | `@features/scan/store` | `useScanStore` — images, dispatch actions |
| `hooks/useAtomicBatchActions.ts` | `@features/scan/store` | `useScanStore` — dual-store atomic ops |
| `views/BatchCaptureView.tsx` | `@features/scan/store` | `useScanStore`, `useIsProcessing`, `useScanActions` |
| `views/BatchReviewView.tsx` | `@features/scan/store` | `useScanStore`, `useScanPhase`, `useScanMode`, `useBatchProgress`, `useScanActions` |
| `handlers/save.ts` | `@features/categories` | `applyItemNameMappings` |
| `hooks/useBatchReviewHandlers.ts` | `@features/categories` | `applyItemNameMappings`, `FindItemNameMatchFn` |

#### transaction-editor → other features (outbound)
| File | Imports from | What |
|------|-------------|------|
| `views/.../useTransactionEditorHandlers.ts` | `@features/scan/store` | `useScanStore`, `useScanActions` (full state + actions) |
| `views/.../useTransactionEditorHandlers.ts` | `@features/batch-review` | `batchReviewActions.finishEditing()` |
| `views/.../useTransactionEditorData.ts` | `@features/scan/store` | `useScanStore`, `useScanPhase`, `useIsProcessing` |
| `views/TransactionEditorViewInternal.tsx` | `@features/scan/store` | `useIsProcessing`, `useScanActiveDialog` |
| `views/TransactionEditorViewInternal.tsx` | `@features/scan/components` | `ScanCompleteModal` |

---

## 3. Known Bugs Caused by Current Architecture

### 3.1 Gallery Selection Broken After Scan Failure

**Reproduction:** Scan fails → user dismisses error overlay (not Retry) → user tries to select photo from gallery → nothing happens.

**Root cause:** `handleScanOverlayDismiss` calls `scanOverlay.reset()` (overlay → idle) but does NOT call `useScanStore.getState().reset()` (store stays in `'error'`). When the user later selects a gallery photo, `setScanImages()` in `useScanWorkflowOrchestrator.ts` checks `scanState.phase === 'idle'` — it's `'error'`, so the image-setting path falls to the `else` branch which calls `setImages()`, which is **silently blocked** by the phase guard (`phase !== 'capturing'`).

**Why camera FAB still works:** The camera FAB path goes through `handleNewTransaction` which calls `setScanImages([])` first — the empty-array branch calls `resetScanContext()` (which IS `useScanStore.reset()`), resetting the store to `'idle'` before opening the file picker.

**Key files:**
- `src/app/hooks/useScanWorkflowOrchestrator.ts` lines 85–101: `setScanImages` phase branching
- `src/features/scan/hooks/useScanHandlers.ts` lines 219–233: retry (has reset) vs dismiss (missing reset)
- `src/features/scan/store/useScanStore.ts` lines 329–358: `setImages` phase guard

**Fix pattern already exists:** Story 15b-5a added `useScanStore.getState().reset()` to `handleScanOverlayRetry`. The same pattern needs to be applied to `handleScanOverlayDismiss`. With the unified state machine (proposed below), this class of bug is eliminated entirely.

---

## 4. Proposed Changes

### Tier 1: Must-Do Before New Features (blocks implementation)

#### 1A. Split `useScanStore.ts` Into Slices

**Problem:** 946 lines, above the 800-line BLOCK threshold. Cannot be edited.

**Approach:** Extract into composable Zustand slices:
- `scanCoreSlice.ts` — phase machine, request identity, error state, images (~300 lines)
- `scanBatchSlice.ts` — batch progress, batch receipts, batch editing (~200 lines)
- `scanCreditSlice.ts` — credit status, credit type, credits count (~100 lines)
- `scanDialogSlice.ts` — active dialog state (~80 lines)
- `scanUISlice.ts` — overlay progress, ETA, skip modal flag, isRescanning (~100 lines) ← **new, from Tier 1B**
- `useScanStore.ts` — compose slices, devtools wrapper (~150 lines)

**Risk:** Selectors and `scanActions` non-React accessor must be preserved. All three features import from `@features/scan/store` — barrel must maintain the same public API.

**Estimated files touched:** 3-5 new files in `features/scan/store/`, update `index.ts` barrel. Zero changes to consumers if barrel API is preserved.

#### 1B. Merge Overlay State Into Zustand (Unify Dual State Machine)

**Problem:** Two independent state machines (`useScanStore` phase vs `useScanOverlayState` state) must be manually synced. Desync causes the gallery bug.

**Decision history:** Documented tech debt since Epic 14e-23a. Original rationale (navigation persistence, ETA timing) no longer requires a separate React useState — Zustand handles both.

**Approach:**
- Add overlay fields to `scanUISlice.ts` (from 1A): `overlayProgress: number`, `overlayEta: number | null`, `overlayError: string | null`, `processingHistory: number[]` (ETA ring buffer)
- Add actions: `setOverlayProgress(pct)`, `setOverlayError(err)`, `resetOverlay()`
- Make phase transitions automatically reset overlay state (e.g., `reset()` clears both phase and overlay)
- Delete `useScanOverlayState.ts` and `useScanState.ts` hooks
- Update `ScanFeature.tsx` and `ScanOverlay` to read from Zustand instead of hook props
- View-scoped visibility stays in the component (`SCAN_VIEWS.includes(currentView)` — unchanged)

**Gain:** Zero sync bugs. The gallery bug fix becomes automatic — `reset()` clears everything. Adding `'statement'` mode overlay states requires updating one store, not two machines.

**Risk:** The ETA ring buffer currently uses `useRef` — migrating to a store array is trivial but needs test coverage. ScanOverlay component props interface changes (reads from store instead of receiving `scanOverlay` prop).

**Estimated files touched:** ~8-10 (store slices, ScanFeature, ScanOverlay, useScanWorkflowOrchestrator, delete 2 hook files)

#### 1C. Fix Gallery Selection Bug

**Problem:** Dismissing scan error overlay leaves store in `'error'` phase; subsequent gallery selection silently fails.

**With 1B completed:** This is automatic — unified reset clears everything.

**Without 1B (fallback):** Add `useScanStore.getState().reset()` to `handleScanOverlayDismiss` and add `'error'` phase handling to `setScanImages` in `useScanWorkflowOrchestrator.ts`.

**Estimated files touched:** 1-2 files if 1B is done; 2-3 files as standalone fix.

#### 1D. Split `useScanStore.test.ts`

**Problem:** 1,338 lines, above the 300-line unit test limit. Cannot be modified.

**Approach:** Split by action group into 4-5 test files:
- `useScanStore.core.test.ts` — phase transitions, reset, cancel
- `useScanStore.batch.test.ts` — batch actions, batch receipts
- `useScanStore.credit.test.ts` — credit lifecycle
- `useScanStore.dialog.test.ts` — dialog state
- `useScanStore.ui.test.ts` — overlay state (new, from 1B)

**Estimated files touched:** 1 deleted, 4-5 created.

### Tier 2: Break the Feature-Level Cycle (enables clean credit card scanning)

#### 2A. Extract Shared Scan Workflow State

**Problem:** `useScanStore` is the scan feature's internal store, but `batch-review` and `transaction-editor` read/write it directly. It's a shared global disguised as a feature-local store.

**Approach:** Extract workflow state that's genuinely shared into `shared/stores/useScanWorkflowStore.ts`:
- `images: string[]` — the captured image data (used by all three features)
- `batchReceipts: BatchReceipt[]` — review items (used by batch-review and transaction-editor)
- `batchProgress: BatchProgress` — processing progress (used by batch-review)
- `batchEditingIndex: number | null` — which receipt is being edited (used by transaction-editor)

**What stays in `features/scan/store`:** phase machine, credit lifecycle, dialog state, request identity, overlay state — things only the scan feature needs.

**Gain:** `batch-review` and `transaction-editor` import from `@shared/stores` instead of reaching into `@features/scan/store`. The scan feature's internal phase machine becomes truly internal. Adding `'statement'` mode means adding statement-specific state to the shared workflow store without touching scan internals.

**Risk:** Medium. Requires updating import paths across 8-10 files. `useAtomicBatchActions` (dual-store atomic ops) needs redesign if the stores split.

**Estimated files touched:** ~12-15 (new shared store, update imports in batch-review, transaction-editor, app layer, delete/reduce scan store)

#### 2B. Replace Direct Cross-Feature Store Writes with Event Pattern

**Problem:** `processScan.ts` (in scan) directly calls `transactionEditorActions.setTransaction()`. `useTransactionEditorHandlers.ts` (in transaction-editor) directly calls `batchReviewActions.finishEditing()`. These are cross-feature store writes that create tight coupling.

**Approach:** Introduce a lightweight scan result dispatcher in `shared/`:
```
// shared/events/scanWorkflowEvents.ts
scanResultReady(transaction, mode)    → transaction-editor subscribes
batchEditingFinished(receiptId)       → batch-review subscribes
scanCompleted(results, mode)          → batch-review + transaction-editor subscribe
```

Implementation options:
- **Option A (simplest):** Zustand `subscribe` listeners — each feature subscribes to shared workflow store changes and reacts locally. No new infrastructure.
- **Option B:** Custom event emitter (mitt or similar). More explicit but adds a dependency.

**Gain:** `processScan` publishes "here's the result" without knowing who consumes it. Adding credit card statement scanning = adding a new subscriber, not modifying `processScan`.

**Risk:** Event-based patterns can make control flow harder to trace. Keep it simple — Zustand subscriptions, not a full event bus.

**Estimated files touched:** ~6-8 (shared events/subscriptions, processScan.ts, useTransactionEditorHandlers.ts, feature barrels)

#### 2C. Move Legacy `@/components/scan/` Into Feature

**Problem:** `ScanFeature.tsx` imports 4 dialog components (`QuickSaveCard`, `BatchCompleteModal`, `CurrencyMismatchDialog`, `TotalMismatchDialog`) from `@/components/scan/` — a legacy non-FSD directory with 17 files. Some scan components live in `features/scan/components/`, some in `components/scan/`. This split causes confusion and 50 `features → components` layer violations across the codebase.

**Approach:** Move the remaining `@/components/scan/` files into `features/scan/components/` and delete the legacy directory. Update all import paths.

**Gain:** Scan UI is fully co-located. Eliminates the most common layer violation pattern (50 edges).

**Estimated files touched:** ~17 files moved, ~10-15 import path updates.

#### 2D. Move `scanStateMachine.ts` Into Scan Feature

**Problem:** `src/types/scanStateMachine.ts` (528 lines) defines the scan feature's core types but lives outside the feature directory in the legacy `src/types/` folder.

**Approach:** Move to `features/scan/types/scanStateMachine.ts`. Extract any types that are genuinely shared by other features (e.g., `ScanPhase`, `ScanMode`, `BatchReceipt`) into `shared/types/scanWorkflow.ts`.

**Estimated files touched:** ~5-8 (move file, update imports, create shared type re-exports)

### Tier 3: Nice-to-Have (defer unless natural opportunity)

| Issue | Lines | Notes |
|-------|-------|-------|
| `useBatchReviewHandlers.ts` | 769 | 31 lines from 800-line block. Will likely need splitting when adding credit card batch handling. Address when it happens. |
| `BatchCaptureView.tsx` | 798 | 2 lines from block. Will trigger on any addition. Split capture UI vs capture logic when adding statement capture. |
| `CreditWarningDialog` in batch-review | 318 | Imported by `credit` feature (inverted dependency). Move to `shared/components/` if credit card scanning adds more credit dialog variants. |
| `ScanFeature.tsx` | 684 | Orchestrator role will grow with statement mode. Monitor; split if it crosses 750. |
| `processScan/types.ts` | 603 | Large type file. Not blocking but monitor. |

---

## 5. Dependency Impact Projection

### Before (Current State)

```
Cross-feature edges involving scan/batch-review/transaction-editor:
  scan → transaction-editor:        1 edge (processScan writes to store)
  scan → categories:                3 edges
  scan → insights:                  1 edge
  transaction-editor → scan:        5 edges (store reads + ScanCompleteModal)
  transaction-editor → batch-review: 1 edge (finishEditing)
  batch-review → scan:              4 edges (store reads/writes)
  batch-review → categories:        3 edges
  credit → batch-review:            1 edge (CreditWarningDialog)
  TOTAL:                           19 edges in the cluster
```

### After (Post-Tier 1 + Tier 2)

```
Projected cross-feature edges:
  scan → shared/stores:             2 edges (write images, write results)
  scan → shared/events:             1 edge (publish scanResultReady)
  transaction-editor → shared/stores: 3 edges (read images, receipts, workflow)
  transaction-editor → shared/events: 1 edge (subscribe scanResultReady)
  batch-review → shared/stores:     3 edges (read/write images, receipts, progress)
  batch-review → shared/events:     1 edge (subscribe scanCompleted)
  batch-review → categories:        3 edges (unchanged)
  scan → categories:                3 edges (unchanged)
  scan → insights:                  1 edge (unchanged)
  TOTAL:                           18 edges, but 0 direct feature-to-feature edges
                                   (all go through shared/)
```

**Key gain:** The feature-level cycle `batch-review → scan → transaction-editor → batch-review` is **broken**. All three features point to `shared/` — a hub-and-spoke topology instead of a cycle. Adding credit card statement scanning means adding a new spoke, not threading through the cycle.

---

## 6. Sizing Estimate

| Tier | Stories (est.) | Points (est.) | Risk |
|------|---------------|---------------|------|
| Tier 1: Split store + unify state + fix gallery bug + split tests | 3-4 | ~8-10 | Low — internal to scan feature, no API changes |
| Tier 2: Shared workflow store + event pattern + move components + move types | 4-5 | ~12-16 | Medium — changes import paths across 3 features |
| Tier 3: Deferred splits (on natural opportunity) | 2-3 | ~4-6 | Low — addressed when files hit limit |
| **Total prep work** | **7-9** | **~20-26** | |

This does not include the feature work itself (credit card scanning, batch review improvements, etc.). The prep work should be a short focused epic or a Phase 0 within the feature epic.

---

## 7. Recommended Sequencing

```
Phase 0: Structural prep (Tier 1 + Tier 2)
  1A. Split useScanStore.ts into slices
  1D. Split useScanStore.test.ts
  1B. Merge overlay state into Zustand (depends on 1A)
  1C. Fix gallery bug (free after 1B)
  2D. Move scanStateMachine.ts into feature
  2A. Extract shared scan workflow store (depends on 1A)
  2C. Move legacy @/components/scan/ into feature
  2B. Replace direct cross-store writes with event pattern (depends on 2A)

Phase 1: Feature implementation
  Credit card statement scanning (builds on clean scan architecture)
  Batch review improvements
  Scan error recovery hardening
  Transaction editor enhancements
```

---

## 8. Open Questions for Brainstorm Review

1. **Shared store granularity:** Should `shared/stores/useScanWorkflowStore.ts` be one store or split further (e.g., `useImageCaptureStore` + `useBatchWorkflowStore`)? One store is simpler; two stores allow finer subscriptions.

2. **Event pattern scope:** Zustand `subscribe` (zero dependencies, simple) vs. custom event emitter (more explicit, debuggable)? The Zustand approach is more aligned with the existing stack.

3. **Statement scan architecture:** Does credit card statement scanning share the batch processing pipeline (multiple pages = multiple images processed in parallel) or need its own processing service? This affects whether 2A's shared store includes statement-specific state.

4. **Tier 3 timing:** Should we proactively split `useBatchReviewHandlers.ts` (769 lines) and `BatchCaptureView.tsx` (798 lines) now, or wait until credit card work pushes them over the limit? Proactive = more churn now; reactive = may block mid-feature.

5. **Epic structure:** Prep work as Phase 0 of the feature epic, or a separate mini-epic? Phase 0 is simpler to manage; separate epic gives clearer cost visibility.

6. **API layer trigger point:** The Architecture Strategy Assessment (`docs/architecture/proposals/implemented/ARCHITECTURE-STRATEGY-ASSESSMENT.md`) identified "Card statement scanning (Epic F3)" as a trigger for adding a Cloud Run API layer for server-side document processing. Does credit card statement scanning require server-side PDF parsing / multi-page processing that the current Gemini Cloud Function pipeline can't handle? If so, this restructuring epic should include the API layer groundwork (Option D from that assessment). If Gemini can handle statement images directly (photo of statement, not PDF upload), the current Cloud Function pipeline may suffice and the API layer can remain deferred.

---

## Appendix A: Key Files Reference

| File | Lines | Role |
|------|-------|------|
| `src/features/scan/store/useScanStore.ts` | 946 | Scan state machine (OVER LIMIT) |
| `src/features/scan/store/selectors.ts` | 408 | Scan store selectors |
| `src/features/scan/hooks/useScanOverlayState.ts` | 240 | Overlay state (DELETE target — merge into store) |
| `src/features/scan/hooks/useScanState.ts` | 188 | Base overlay state (DELETE target) |
| `src/features/scan/hooks/useScanHandlers.ts` | 558 | Dialog + flow handler hub |
| `src/features/scan/hooks/useScanInitiation.ts` | 536 | Start-scan handlers |
| `src/features/scan/hooks/useScanFlowRouter.ts` | 293 | Post-scan routing (clean DI design) |
| `src/features/scan/handlers/processScan/processScan.ts` | 464 | Core scan processing (has cross-feature write) |
| `src/features/scan/ScanFeature.tsx` | 684 | Scan orchestrator component |
| `src/features/scan/store/__tests__/useScanStore.test.ts` | 1,338 | Store tests (OVER LIMIT) |
| `src/features/batch-review/hooks/useBatchReviewHandlers.ts` | 769 | Batch handler hub (near limit) |
| `src/features/batch-review/views/BatchCaptureView.tsx` | 798 | Batch capture UI (at limit) |
| `src/features/batch-review/hooks/useAtomicBatchActions.ts` | 186 | Dual-store atomic operations |
| `src/features/batch-review/store/useBatchReviewStore.ts` | 383 | Batch review state machine |
| `src/features/transaction-editor/views/TransactionEditorViewInternal.tsx` | 1,128 | Editor leaf component (OVER LIMIT) |
| `src/features/transaction-editor/views/.../useTransactionEditorHandlers.ts` | 582 | Editor handlers (has cross-feature writes) |
| `src/features/transaction-editor/views/.../useTransactionEditorData.ts` | 313 | Editor data derivation (reads scan store) |
| `src/features/transaction-editor/store/useTransactionEditorStore.ts` | 125 | Editor state (clean, small) |
| `src/app/hooks/useScanWorkflowOrchestrator.ts` | — | Wires overlay + store + navigation (gallery bug location) |
| `src/types/scanStateMachine.ts` | 528 | Scan type definitions (outside feature — move target) |
| `src/components/scan/` | ~17 files | Legacy scan components (move target) |

## Appendix B: Decision History Trail

| Decision | Epic | Story | Document |
|----------|------|-------|----------|
| Non-blocking scan overlay | 14 | 14.3 | `docs/sprint-artifacts/epic14/stories/story-14.3-scan-overlay-flow.md` |
| Hybrid navigation blocking | 14d | 14d.3 | `docs/sprint-artifacts/epic14d-refactor-scan/stories/story-14d.3-hybrid-navigation-blocking.md` |
| Scan architecture refactor plan | 14d | — | `docs/sprint-artifacts/epic14d-refactor-scan/scan-architecture-refactor-plan.md` |
| Dual state = tech debt, future unify | 14e | 14e-23a | `docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-23a-scan-overlay-migration.md` |
| Feature-level cycle flagged | 15b | 15b-4g | `dependency-diagrams/ANALYSIS-REPORT.md` |
| Gallery bug identified | — | — | This document (Section 3.1) |
| API layer trigger: card statement scanning | — | — | `docs/architecture/proposals/implemented/ARCHITECTURE-STRATEGY-ASSESSMENT.md` (Option D triggers) |
