# Story 16-1: Split useScanStore Into Zustand Slices

## Status: done

## Intent
**Epic Handle:** "Untangle the wires, open the test door"
**Story Handle:** "This story untangles the wires by splitting the monolithic scan controller into independent circuit boards"

## Story
As a developer, I want the scan store decomposed into focused Zustand slices, so that each concern is independently editable and the 800-line block is removed.

## Acceptance Criteria

### Functional
- **AC-1:** Given `useScanStore.ts` is 946 lines, when split into slices, then each slice file is < 300 lines
- **AC-2:** Given consumers import from `@features/scan/store`, when internal structure changes, then all existing imports work unchanged (barrel API preserved)
- **AC-3:** Given the store has a non-React accessor (`scanActions`), when slices compose, then `scanActions` continues to provide the same action interface
- **AC-4:** Given tests exist at 1,338 lines in one file, when split by slice concern, then each test file is < 300 lines and all tests pass
- **AC-5:** Given `selectors.ts` (408 lines) references store state, when slices are composed, then all selectors work against the composed store without modification

### Architectural
- **AC-ARCH-LOC-1:** Slice files located at `src/features/scan/store/slices/{sliceName}Slice.ts`
- **AC-ARCH-LOC-2:** Composed store at `src/features/scan/store/useScanStore.ts` (< 150 lines)
- **AC-ARCH-LOC-3:** Test files at `src/features/scan/store/__tests__/useScanStore.{slice}.test.ts`
- **AC-ARCH-PATTERN-1:** Each slice follows Zustand slice pattern with `StateCreator` type
- **AC-ARCH-PATTERN-2:** Barrel `index.ts` exports identical public API (selectors, actions, types)
- **AC-ARCH-NO-1:** No slice imports from another slice directly (compose through store)
- **AC-ARCH-NO-2:** No consumer file changes — zero diff outside `features/scan/store/`

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Core slice (phase, reset, error, images) | `src/features/scan/store/slices/scanCoreSlice.ts` | Zustand slice pattern | NEW |
| Batch slice (progress, receipts, editing) | `src/features/scan/store/slices/scanBatchSlice.ts` | Zustand slice pattern | NEW |
| Credit slice (status, type, count) | `src/features/scan/store/slices/scanCreditSlice.ts` | Zustand slice pattern | NEW |
| Dialog slice (active dialog state) | `src/features/scan/store/slices/scanDialogSlice.ts` | Zustand slice pattern | NEW |
| UI slice (overlay, ETA, skip modal, rescan) | `src/features/scan/store/slices/scanUISlice.ts` | Zustand slice pattern | NEW |
| Composed store | `src/features/scan/store/useScanStore.ts` | Zustand compose | MODIFIED |
| Selectors | `src/features/scan/store/selectors.ts` | Zustand selectors | VERIFIED (no changes expected) |
| Barrel | `src/features/scan/store/index.ts` | FSD barrel | MODIFIED |
| Core tests | `src/features/scan/store/__tests__/useScanStore.core.test.ts` | Vitest | NEW |
| Batch tests | `src/features/scan/store/__tests__/useScanStore.batch.test.ts` | Vitest | NEW |
| Credit tests | `src/features/scan/store/__tests__/useScanStore.credit.test.ts` | Vitest | NEW |
| Dialog tests | `src/features/scan/store/__tests__/useScanStore.dialog.test.ts` | Vitest | NEW |
| Old monolith test | `src/features/scan/store/__tests__/useScanStore.test.ts` | — | DELETED |

## Tasks

### Task 1: Analyze Store State Shape and Slice Boundaries (1 subtask)
- [x] 1.1: Read `useScanStore.ts` fully, document the state interface grouped by concern (core ~300L, batch ~200L, credit ~100L, dialog ~80L, UI ~100L), confirm slice boundaries

### Task 2: Extract scanCoreSlice (5 subtasks)
- [x] 2.1: Create `scanCoreSlice.ts` with phase machine state (phase, mode, requestId, error)
- [x] 2.2: Move phase transition actions (startScan, cancelScan, finishScan, reset, setPhase)
- [x] 2.3: Move image state and actions (images, setImages, clearImages)
- [x] 2.4: Ensure phase guards are preserved in actions
- [x] 2.5: Export slice type (`ScanCoreSlice`) and creator

### Task 3: Extract scanBatchSlice (4 subtasks)
- [x] 3.1: Create `scanBatchSlice.ts` with batch state (batchReceipts, batchProgress, batchEditingIndex)
- [x] 3.2: Move batch actions (addBatchReceipt, updateBatchReceipt, setBatchEditingIndex, etc.)
- [x] 3.3: Handle cross-slice references (batch actions that check core phase — use `get()` on composed store)
- [x] 3.4: Export slice type and creator

### Task 4: Extract scanCreditSlice, scanDialogSlice, scanUISlice (4 subtasks)
- [x] 4.1: Create `scanCreditSlice.ts` with credit state and actions
- [x] 4.2: Create `scanDialogSlice.ts` with dialog state and actions
- [x] 4.3: Create `scanUISlice.ts` with UI state (overlay progress, ETA, skip modal, isRescanning)
- [x] 4.4: Export slice types and creators for all three

### Task 5: Compose Store and Verify API (4 subtasks)
- [x] 5.1: Rewrite `useScanStore.ts` as slice composer (< 150 lines)
- [x] 5.2: Verify `scanActions` non-React accessor works with composed store
- [x] 5.3: Verify `selectors.ts` works against composed store (no selector changes)
- [x] 5.4: Update barrel `index.ts` — identical public API
- [x] 5.5: **HARDENING:** Run full store API comparison — every exported function/selector from old API must exist in new API with same signature

### Task 6: Split Test File (5 subtasks)
- [x] 6.1: Create `useScanStore.core.test.ts` — phase transitions, reset, cancel
- [x] 6.2: Create `useScanStore.batch.test.ts` — batch actions, receipts
- [x] 6.3: Create `useScanStore.credit.test.ts` — credit lifecycle
- [x] 6.4: Create `useScanStore.dialog.test.ts` — dialog state
- [x] 6.5: Delete old monolith test file, verify all tests pass with `npx vitest run features/scan/store`

### Task 7: Integration Verification (3 subtasks)
- [x] 7.1: Run `npm run test:quick` — all tests pass
- [x] 7.2: Run `npx tsc --noEmit` — zero TypeScript errors
- [x] 7.3: Verify no consumer files changed (git diff should show zero changes outside `features/scan/store/`)

## Senior Developer Review (ECC)
- **Date:** 2026-03-06
- **Classification:** COMPLEX
- **Agents:** code-reviewer (8/10), security-reviewer (9/10), architect (9/10), tdd-guide (8/10)
- **Overall:** 8.5/10 APPROVE
- **Quick fixes applied:** 4 (test helper extraction, cross-slice comments, type assertion, images guard test)
- **TD stories created:** 1 (TD-16-1-scan-store-quality, 3 pts)

## Deferred Items (Code Review 2026-03-06)

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| TD-16-1 | Production guard logging, hide _guardPhase, restoreState validation, cross-slice tests, selectors split | LOW | CREATED |

## Sizing
- **Points:** 8 (LARGE)
- **Tasks:** 7
- **Subtasks:** 27
- **Files:** ~13

## Dependencies
- None (first story in epic)

## Risk Flags
- DATA_PIPELINE (schema consolidation — single store API preserved)
- CROSS_STORE (batch actions reference core phase — must use `get()` on composed store)

## Dev Notes
- The Zustand slice pattern uses `StateCreator<FullStore, [], [], SliceType>` — reference Zustand docs for typed slices
- `scanActions` (non-React accessor) is used by processScan and other non-component code — critical to preserve
- The `immer` middleware is currently used — each slice must be compatible with immer
- Phase guards in actions (e.g., `setImages` checks `phase !== 'capturing'`) are a security boundary — never weaken
- Test split should preserve describe/it structure — each test file tests one slice's actions
