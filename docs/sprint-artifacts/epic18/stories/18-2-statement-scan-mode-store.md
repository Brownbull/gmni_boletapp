# Story 18-2: Statement Scan Mode -- Store and Workflow Integration

## Status: ready-for-dev

## Intent
**Epic Handle:** "One statement in, many transactions out"
**Story Handle:** "This story builds the loading dock by adding a third intake lane to the shared workflow system"

## Story
As a user, I want a "Statement" scan mode available from the scan FAB, so that the app recognizes I'm scanning a statement (not a receipt) and handles it differently.

## Acceptance Criteria

### Functional
- **AC-1:** Given `ScanMode` type, when `'statement'` is added, then the workflow store accepts it as a valid mode
- **AC-2:** Given the scan FAB, when user selects Statement mode, then `startScan('statement')` succeeds and mutual exclusion prevents other scans
- **AC-3:** Given statement mode is active, when the user captures/selects images (up to 5) or a PDF, then images are stored in the shared workflow store
- **AC-4:** Given statement mode is active, when processing completes, then multiple transactions are produced (not one)

### Architectural
- **AC-ARCH-LOC-1:** Statement scan store at `src/features/scan/stores/useStatementScanStore.ts`
- **AC-ARCH-PATTERN-1:** Follows same pattern as existing mode stores (useNormalScanStore, useBatchScanStore from Epic 16)
- **AC-ARCH-PATTERN-2:** Shared workflow store (from 16-6) handles images and mode; statement store handles statement-specific logic
- **AC-ARCH-NO-1:** No modification to normal or batch scan mode behavior

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Statement scan store | `src/features/scan/stores/useStatementScanStore.ts` | Zustand store | NEW |
| Scan workflow types | `src/shared/types/scanWorkflow.ts` | Shared types | MODIFIED (add 'statement') |
| Shared workflow store | `src/shared/stores/useScanWorkflowStore.ts` | Zustand store | MODIFIED (statement support) |
| Event types | `src/shared/events/eventTypes.ts` | Events | MODIFIED (statement events) |
| Statement store tests | `tests/unit/features/scan/useStatementScanStore.test.ts` | Vitest | NEW |

## Tasks

### Task 1: Extend Type System (2 subtasks)
- [ ] 1.1: Add `'statement'` to `ScanMode` type in `shared/types/scanWorkflow.ts`
- [ ] 1.2: Add statement-specific event types to `AppEvents`: `'statement:extracted': { transactionIds: string[] }`

### Task 2: Create Statement Scan Store (3 subtasks)
- [ ] 2.1: Create `useStatementScanStore.ts` -- state: `statementPages`, `extractedTransactions`, `processingStatus`
- [ ] 2.2: Add actions: `addPage`, `setExtractedTransactions`, `reset`
- [ ] 2.3: Support up to 5 images OR 1 PDF per statement scan

### Task 3: Integrate with Shared Workflow (2 subtasks)
- [ ] 3.1: Verify `startScan('statement')` works with shared workflow store mutual exclusion
- [ ] 3.2: Statement mode uses same image storage path in shared workflow store (images field)

### Task 4: Tests (2 subtasks)
- [ ] 4.1: Unit tests: statement store actions, page management, transaction extraction
- [ ] 4.2: Integration test: startScan('statement') -> add pages -> verify shared workflow state

### Task 5: Verification (1 subtask)
- [ ] 5.1: Run `npm run test:quick` -- all tests pass

## Sizing
- **Points:** 3 (MEDIUM)
- **Tasks:** 5
- **Subtasks:** 10
- **Files:** ~5

## Dependencies
- **18-1** (spike must confirm Gemini PDF direct approach)
- Requires Epic 16 completed (shared workflow store, event bus)

## Risk Flags
- CROSS_STORE (new mode integrating with shared workflow)

## Dev Notes
- Architecture doc specifies: `useStatementScanStore` in `src/features/scan/stores/`
- Statement scanning differs from receipt: 1 source document -> many transactions (vs 1 receipt -> 1 transaction)
- PDF handling: browser FileReader API for PDF, or camera capture for statement photos
- Max 5 images matches the architecture doc specification
