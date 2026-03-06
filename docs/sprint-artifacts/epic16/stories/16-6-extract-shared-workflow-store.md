# Story 16-6: Extract Shared Scan Workflow Store

## Status: ready-for-dev

## Intent
**Epic Handle:** "Untangle the wires, open the test door"
**Story Handle:** "This story untangles the wires by creating a shared signal bus -- features connect to the hub, not to each other"

## Story
As a developer, I want shared scan workflow state (images, batch receipts, progress) in a shared store, so that batch-review and transaction-editor don't reach into the scan feature's internals.

## Acceptance Criteria

### Functional
- **AC-1:** Given `useScanWorkflowStore.ts` is created in `shared/stores/`, when batch-review reads images/receipts, then it imports from `@shared/stores` not `@features/scan`
- **AC-2:** Given transaction-editor reads `batchEditingIndex`, when it imports, then it imports from `@shared/stores`
- **AC-3:** Given the migration completes, when dependency analysis runs, then 0 direct feature-to-feature store imports remain between scan/batch-review/transaction-editor
- **AC-4:** Given `useAtomicBatchActions.ts` does dual-store atomic ops, when redesigned, then it operates on shared workflow store + batch-review store (no scan store dependency)

### Architectural
- **AC-ARCH-LOC-1:** Shared store at `src/shared/stores/useScanWorkflowStore.ts`
- **AC-ARCH-PATTERN-1:** Shared store owns: images, batchReceipts, batchProgress, batchEditingIndex, mode (read-only for consumers)
- **AC-ARCH-PATTERN-2:** Scan feature store retains: phase machine, credit lifecycle, dialog state, overlay state (internal concerns)
- **AC-ARCH-NO-1:** No batch-review file imports from `@features/scan/store`
- **AC-ARCH-NO-2:** No transaction-editor file imports from `@features/scan/store` (after 16-5 split)

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Shared workflow store | `src/shared/stores/useScanWorkflowStore.ts` | Zustand store | NEW |
| Shared stores barrel | `src/shared/stores/index.ts` | Shared barrel | MODIFIED |
| Scan batch slice | `src/features/scan/store/slices/scanBatchSlice.ts` | Zustand slice | MODIFIED (reduce — shared state extracted) |
| Scan core slice | `src/features/scan/store/slices/scanCoreSlice.ts` | Zustand slice | MODIFIED (images extracted) |
| Batch review handlers | `src/features/batch-review/hooks/useBatchReviewHandlers.ts` | Feature hook | MODIFIED (imports) |
| Atomic batch actions | `src/features/batch-review/hooks/useAtomicBatchActions.ts` | Feature hook | MODIFIED (redesigned) |
| Batch capture view | `src/features/batch-review/views/BatchCaptureView.tsx` | Feature view | MODIFIED (imports) |
| Batch review view | `src/features/batch-review/views/BatchReviewView.tsx` | Feature view | MODIFIED (imports) |
| Editor scan status | `src/features/transaction-editor/views/TransactionEditorScanStatus.tsx` | Feature view | MODIFIED (imports) |
| Editor handlers | `src/features/transaction-editor/views/.../useTransactionEditorHandlers.ts` | Feature hook | MODIFIED (imports) |
| Editor data | `src/features/transaction-editor/views/.../useTransactionEditorData.ts` | Feature hook | MODIFIED (imports) |
| Integration tests | `tests/integration/` | Vitest | NEW or MODIFIED |

## Tasks

### Task 1: Design Shared Store API (2 subtasks)
- [ ] 1.1: Define shared workflow store interface: images, batchReceipts, batchProgress, batchEditingIndex, mode (read-only mirror from scan)
- [ ] 1.2: Define actions: setImages, addBatchReceipt, updateBatchReceipt, setBatchEditingIndex, setBatchProgress, setMode

### Task 2: Create Shared Store (3 subtasks)
- [ ] 2.1: Create `src/shared/stores/useScanWorkflowStore.ts` with defined interface and actions
- [ ] 2.2: Create selectors: `useWorkflowImages`, `useWorkflowBatchReceipts`, `useWorkflowBatchProgress`, `useWorkflowBatchEditingIndex`
- [ ] 2.3: Update `src/shared/stores/index.ts` barrel to export new store and selectors

### Task 3: Migrate Scan Feature (3 subtasks)
- [ ] 3.1: Remove images, batch state from scan feature slices (scanCoreSlice, scanBatchSlice)
- [ ] 3.2: Scan feature actions that set images/batch state now write to shared workflow store
- [ ] 3.3: Update scan feature barrel to stop exporting migrated selectors (they now come from shared)

### Task 4: Migrate Batch-Review Feature (4 subtasks)
- [ ] 4.1: Update `useBatchReviewHandlers.ts` — replace `@features/scan/store` imports with `@shared/stores`
- [ ] 4.2: Update `useAtomicBatchActions.ts` — redesign to use shared workflow store + batch-review store
- [ ] 4.3: Update `BatchCaptureView.tsx` — replace scan store imports with shared store selectors
- [ ] 4.4: Update `BatchReviewView.tsx` — replace scan store imports with shared store selectors

### Task 5: Migrate Transaction-Editor Feature (2 subtasks)
- [ ] 5.1: Update `TransactionEditorScanStatus.tsx` — replace `@features/scan/store` imports with `@shared/stores`
- [ ] 5.2: Update `useTransactionEditorData.ts` — replace scan store selectors with shared store selectors

### Task 6: Hardening (3 subtasks)
- [ ] 6.1: **Coupling documentation:** Add code comment at top of shared store explaining which features depend on it and why
- [ ] 6.2: **Near-limit file verification:** Confirm `BatchCaptureView.tsx` (798L) and `useBatchReviewHandlers.ts` (769L) do not exceed 800 lines after import changes (net-zero expected)
- [ ] 6.3: **Integration tests:** Write integration test verifying scan -> shared store -> batch-review data flow works end-to-end

### Task 7: Verification (3 subtasks)
- [ ] 7.1: Run `npm run test:quick` — all tests pass
- [ ] 7.2: Run `npx tsc --noEmit` — zero TypeScript errors
- [ ] 7.3: Verify zero imports from `@features/scan/store` in batch-review and transaction-editor (grep check)

## Sizing
- **Points:** 8 (LARGE)
- **Tasks:** 7
- **Subtasks:** 20
- **Files:** ~12

## Dependencies
- **16-4** (shared types must exist in `shared/types/scanWorkflow.ts`)
- **16-5** (TransactionEditorViewInternal must be split so scan-related imports are in small, editable files)

## Risk Flags
- CROSS_STORE (major cross-store refactoring — phase guards must be preserved)
- DATA_PIPELINE (batch receipt data flow changes path)

## Dev Notes
- The scan feature still OWNS the phase machine and credit lifecycle. The shared store owns the DATA that other features need (images, receipts, progress). Think of it as: scan feature is the brain (decisions), shared store is the nervous system (data transport).
- `useAtomicBatchActions.ts` (186 lines) currently does dual-store atomic operations. With the shared store, these may simplify — the "two stores" become "shared workflow + batch review" instead of "scan + batch review".
- Mode state: The scan feature sets mode via `startScan(mode)`. The shared store mirrors `mode` as read-only for consumers (FAB icon, conditional rendering). The scan feature is the single writer.
- Phase guards: The scan feature's phase guards (e.g., `setImages` only works in `capturing` phase) now guard writes to the shared store. The shared store itself does NOT have phase guards — the scan feature mediates access.
