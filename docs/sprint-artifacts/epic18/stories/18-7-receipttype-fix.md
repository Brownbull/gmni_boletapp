# Story 18-7: Remove Dead receiptType Parameter

## Status: backlog

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Cut the dead wire — receiptType is stored everywhere but read nowhere"

## Story
As a developer, I want to remove the dead `receiptType` parameter from the scan pipeline and transaction type, so that we stop storing unused data and eliminate confusion between `receiptType` (dead) and `source` (the V5 replacement for transaction provenance tracking).

## Context
- `receiptType` is set in 4 Cloud Functions and prompt output but **never read** by any UI component, filter, display, or export
- The `source` field (added in 18-2) replaces its purpose: `'receipt_scan' | 'statement_scan' | 'manual'`
- 37 occurrences across 13 files — all writes, zero reads
- Existing Firestore documents retain their `receiptType` values (no migration needed — field simply stops being written)

## Acceptance Criteria

### Functional
- **AC-1:** `receiptType` removed from prompt output schema (receipt prompt V4)
- **AC-2:** `receiptType` removed from Cloud Function request/response handling (analyzeReceipt, queueReceiptScan, processReceiptScan)
- **AC-3:** `receiptType` field removed from Transaction interface (src/types/transaction.ts)
- **AC-4:** `receiptType` removed from scan initiation flow (useScanInitiation or equivalent)
- **AC-5:** TypeScript compiles clean (tsc --noEmit) — all references resolved
- **AC-6:** Existing Firestore documents with receiptType are NOT migrated (field ignored on read)

### Architectural
- **AC-ARCH-1:** No backward compatibility shim — field is simply deleted (zero consumers)
- **AC-ARCH-2:** Tests updated to remove receiptType from mock data and assertions

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| Transaction type | `src/types/transaction.ts` | MODIFY (remove receiptType field) |
| Receipt prompt V4 | `prompt-testing/prompts/receipt/v4-*.ts` | MODIFY (remove receiptType from output schema) |
| Prompt types | `prompt-testing/prompts/receipt/types.ts` | MODIFY (remove receiptType from ReceiptResult) |
| analyzeReceipt CF | `functions/src/analyzeReceipt.ts` | MODIFY (remove receiptType handling) |
| queueReceiptScan CF | `functions/src/queueReceiptScan.ts` | MODIFY (remove receiptType from request) |
| processReceiptScan CF | `functions/src/processReceiptScan.ts` | MODIFY (remove receiptType from processing) |
| Scan initiation | `src/features/scan/hooks/useScanInitiation.ts` | MODIFY (remove receiptType) |
| Test files | Various test files | MODIFY (remove from mocks/assertions) |

## Tasks

### Task 1: Remove from Type + Prompt (2 subtasks)
- [ ] 1.1: Remove `receiptType?: string` from Transaction interface in transaction.ts
- [ ] 1.2: Remove receiptType from receipt prompt V4 output schema and prompt types

### Task 2: Remove from Cloud Functions (2 subtasks)
- [ ] 2.1: Remove receiptType handling from analyzeReceipt.ts
- [ ] 2.2: Remove receiptType from queueReceiptScan.ts and processReceiptScan.ts request/processing

### Task 3: Remove from Client Code (1 subtask)
- [ ] 3.1: Remove receiptType from useScanInitiation and any other client-side references (grep for all occurrences)

### Task 4: Update Tests + Verify (2 subtasks)
- [ ] 4.1: Remove receiptType from all test mock data and assertions
- [ ] 4.2: Run tsc --noEmit + test:quick to verify clean compile and passing tests

## Sizing
- **Points:** 2 (SMALL)
- **Tasks:** 4
- **Subtasks:** 7
- **Files:** ~8

## Dependencies
- 18-2 type extensions (source field must exist as replacement before removing receiptType)

## Risk Flags
- WIDE_SURFACE (37 occurrences across 13 files — but all straightforward deletions)
- NO_MIGRATION (existing Firestore docs keep receiptType — acceptable, field is never read)
