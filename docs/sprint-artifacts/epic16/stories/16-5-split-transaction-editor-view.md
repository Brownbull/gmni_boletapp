# Story 16-5: Split TransactionEditorViewInternal.tsx

## Status: ready-for-dev

## Intent
**Epic Handle:** "Untangle the wires, open the test door"
**Story Handle:** "This story untangles the wires by splitting the editor's monolithic view so downstream rewiring can reach the right connectors"

## Story
As a developer, I want TransactionEditorViewInternal.tsx decomposed into focused sub-components, so that the 800-line block is removed and downstream stories can modify its imports.

## Acceptance Criteria

### Functional
- **AC-1:** Given `TransactionEditorViewInternal.tsx` is at 1,128 lines, when split, then each resulting file is < 400 lines
- **AC-2:** Given scan-related rendering (ScanCompleteModal, processing indicators) is embedded, when extracted, then scan-awareness lives in a dedicated child component
- **AC-3:** Given form rendering is embedded, when extracted, then the form is a separate component receiving props
- **AC-4:** Given all existing tests pass before the split, when the split completes, then no regressions in transaction editor behavior
- **AC-5:** Given the handlers file (582 lines) and data file (313 lines) are separate, when the view splits, then handler/data hooks are NOT duplicated — they are imported by the orchestrating parent

### Architectural
- **AC-ARCH-LOC-1:** Orchestrating parent at `src/features/transaction-editor/views/TransactionEditorView.tsx`
- **AC-ARCH-LOC-2:** Form component at `src/features/transaction-editor/views/TransactionEditorForm.tsx`
- **AC-ARCH-LOC-3:** Scan overlay/modal component at `src/features/transaction-editor/views/TransactionEditorScanStatus.tsx`
- **AC-ARCH-PATTERN-1:** Parent orchestrates, children are presentational (receive props, no direct store access where possible)
- **AC-ARCH-NO-1:** No duplication of handler logic — parent passes handlers to children
- **AC-ARCH-NO-2:** No behavioral changes — identical user experience before and after split

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Original monolith | `src/features/transaction-editor/views/TransactionEditorViewInternal.tsx` | — | DELETED or heavily reduced |
| Orchestrating parent | `src/features/transaction-editor/views/TransactionEditorView.tsx` | Container pattern | NEW or MODIFIED |
| Form component | `src/features/transaction-editor/views/TransactionEditorForm.tsx` | Presentational | NEW |
| Scan status component | `src/features/transaction-editor/views/TransactionEditorScanStatus.tsx` | Presentational | NEW |
| Feature barrel | `src/features/transaction-editor/index.ts` | FSD barrel | MODIFIED |
| Existing tests | `tests/` (transaction-editor related) | Vitest | VERIFIED |

## Tasks

### Task 1: Analyze Component Structure (2 subtasks)
- [ ] 1.1: Read `TransactionEditorViewInternal.tsx` fully — map the rendering sections (form fields, scan status, modals, action buttons)
- [ ] 1.2: Identify which sections depend on scan store imports vs. transaction editor store — these are the split boundaries

### Task 2: Extract TransactionEditorForm (4 subtasks)
- [ ] 2.1: Create `TransactionEditorForm.tsx` — receives transaction data and onChange handlers as props
- [ ] 2.2: Move form field rendering (merchant, date, total, category, items) into the form component
- [ ] 2.3: Define clear props interface (transaction data, field handlers, validation state)
- [ ] 2.4: Verify form renders identically via visual inspection

### Task 3: Extract TransactionEditorScanStatus (3 subtasks)
- [ ] 3.1: Create `TransactionEditorScanStatus.tsx` — owns scan-related UI (ScanCompleteModal, processing indicators)
- [ ] 3.2: Move scan store imports (`useIsProcessing`, `useScanActiveDialog`) into this component
- [ ] 3.3: Move `ScanCompleteModal` rendering and its associated handlers into this component

### Task 4: Reassemble Orchestrating Parent (3 subtasks)
- [ ] 4.1: Reduce `TransactionEditorViewInternal.tsx` to orchestrator that composes Form + ScanStatus + action buttons
- [ ] 4.2: Parent owns handler hooks (`useTransactionEditorHandlers`, `useTransactionEditorData`) and passes to children
- [ ] 4.3: Rename to `TransactionEditorView.tsx` if the "Internal" suffix is no longer meaningful

### Task 5: Hardening — Integration Tests (2 subtasks)
- [ ] 5.1: Run existing transaction editor tests — verify all pass without modification
- [ ] 5.2: If any tests reference internal structure, update selectors/queries to match new component tree

### Task 6: Verification (2 subtasks)
- [ ] 6.1: Run `npm run test:quick` — all tests pass
- [ ] 6.2: Run `npx tsc --noEmit` — zero TypeScript errors

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 6
- **Subtasks:** 16
- **Files:** ~6

## Dependencies
- None (independent — can run in parallel with 16-1/16-2/16-3 chain)

## Risk Flags
- PURE_COMPONENT (component decomposition — empty state, loading state)
- E2E_TESTING (if E2E tests reference internal structure)

## Dev Notes
- The key split boundary is **scan awareness**: everything that imports from `@features/scan` goes into `TransactionEditorScanStatus.tsx`. This makes Story 16-6 (shared store migration) clean — only one small file needs import changes, not the 1,128-line monolith.
- `useTransactionEditorHandlers.ts` (582 lines) and `useTransactionEditorData.ts` (313 lines) stay as-is — the hooks are the right abstraction. The view was the problem, not the hooks.
- The "Internal" suffix was added during Epic 14 when an outer wrapper existed. Evaluate whether to drop it.
- Consider: if the parent component is < 200 lines after split, it's a well-structured orchestrator.
