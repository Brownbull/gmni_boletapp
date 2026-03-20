# Story 18-3: Async Statement Backend — Pipeline + Transformer + PDF Storage

## Status: drafted

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Build the assembly line on the backend — PDF goes in, app-ready transactions come out, all async and crash-proof"

## Story
As a developer, I want an async statement scanning pipeline (queueStatementScan + processStatementScan) with a backend transformer that converts AI output into app-ready transactions, PDF storage in Firebase Storage, and 1-super-credit-per-statement deduction, so that the UI story can listen for results via Firestore and display them without worrying about network drops.

## Architecture Reference
- **V5 Plan:** `docs/architecture/proposals/implemented/EPIC-18-CREDIT-CARD-STATEMENT-SCANNING.md`
- **Receipt async pattern (template):** 18-13a (queueReceiptScan + processReceiptScan)

## Acceptance Criteria

### Functional
- **AC-1:** `queueStatementScan` HTTPS Callable: validates auth, PDF Storage URL, optional password, deducts 1 super credit atomically, creates pending doc, returns {scanId, importId} in <1s
- **AC-2:** `processStatementScan` Firestore onCreate trigger: reads PDF from Storage, calls Gemini, runs transformer, writes result to pending doc
- **AC-3:** Transformer filters: only positive amounts imported (abonos/negatives skipped)
- **AC-4:** Transformer maps chargeType from statement type field (cargo→purchase, interes→interest, etc.)
- **AC-5:** Transformer parses installments: "3/6"→{current:3, total:6}, "1/1"→omit, null→omit
- **AC-6:** Transformer parses dates: DD/MM/YYYY → YYYY-MM-DD (Chilean statement format)
- **AC-7:** Transformer maps originalCurrency/originalAmount to Transaction currency field
- **AC-8:** Transformer extracts cardHolderType per transaction (titular/additional)
- **AC-9:** Transformer creates synthetic "Cargo sin detallar" item via existing reconcileItemsTotal()
- **AC-10:** PDF stored to Firebase Storage at `users/{uid}/statements/{sha256}.pdf` (client uploads before queueing)
- **AC-11:** Cloud Function password field NEVER logged (stripped from all error objects)
- **AC-12:** V2 accuracy guardrail: sum(positive amounts) ≈ totalDebit (5% tolerance), flag if off
- **AC-13:** On failure: refund super credit, set status='error' with error code/message
- **AC-14:** `onPendingStatementScanDeleted` trigger: refund credit if still deducted, keep PDF in Storage
- **AC-15:** `cleanupPendingStatementScans` scheduled (60min): auto-fail stale docs >5min, delete >24h old

### Architectural
- **AC-ARCH-1:** Cloud Functions mirror receipt async pattern (18-13a template)
- **AC-ARCH-2:** Transformer in `functions/src/statement/statementTransformer.ts` (backend, NOT client)
- **AC-ARCH-3:** Pending docs at `pending_statement_scans/{scanId}` (flat collection, Admin SDK only create/update)
- **AC-ARCH-4:** Storage rules allow `users/{uid}/statements/{filename}` with 7MB limit
- **AC-ARCH-5:** Firestore rules allow read+delete for pending_statement_scans by owner, create/update denied (Admin SDK)

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| Queue function | `functions/src/queueStatementScan.ts` | NEW |
| Process function | `functions/src/processStatementScan.ts` | NEW |
| Delete trigger | `functions/src/onPendingStatementScanDeleted.ts` | NEW |
| Cleanup scheduled | `functions/src/cleanupPendingStatementScans.ts` | NEW |
| Transformer | `functions/src/statement/statementTransformer.ts` | NEW |
| Transformer types | `functions/src/statement/types.ts` | NEW |
| Functions index | `functions/src/index.ts` | MODIFY (export 4 new functions) |
| Firestore rules | `firestore.rules` | MODIFY (pending_statement_scans rules) |
| Storage rules | `storage.rules` | MODIFY (statements path + 7MB limit) |
| Transformer tests | `functions/src/statement/__tests__/statementTransformer.test.ts` | NEW |
| Queue function tests | `functions/src/statement/__tests__/queueStatementScan.test.ts` | NEW |

## Tasks

### Task 1: Scaffold Statement Module in Functions (1 subtask)
- [ ] 1.1: Create `functions/src/statement/` directory with types.ts (PendingStatementScan, TransformerInput, TransformerOutput)

### Task 2: Build Statement Transformer (6 subtasks)
- [ ] 2.1: Create transformStatementResult(geminiOutput, statementInfo) → Transaction[]
- [ ] 2.2: Implement spending filter: `amount > 0` (skip negatives)
- [ ] 2.3: Implement chargeType mapping from CHARGE_TYPE_FROM_STATEMENT
- [ ] 2.4: Implement installment parsing: "3/6"→split, "1/1"→omit, null→omit
- [ ] 2.5: Implement date parsing: DD/MM/YYYY → YYYY-MM-DD
- [ ] 2.6: Implement cardHolderType extraction + currency mapping (originalCurrency → currency field)

### Task 3: V2 Accuracy Guardrail (2 subtasks)
- [ ] 3.1: After transform, verify sum(positive amounts) ≈ statementInfo.totalDebit (5% tolerance)
- [ ] 3.2: Return accuracy metadata: { totalVerified: boolean, deviation: number, confidence: number }

### Task 4: queueStatementScan Cloud Function (4 subtasks)
- [ ] 4.1: Validate auth, PDF Storage URL exists, file size ≤ 7MB
- [ ] 4.2: Deduct 1 super credit atomically (runTransaction pattern from queueReceiptScan)
- [ ] 4.3: Generate importId (UUID), create pending_statement_scans/{scanId} doc
- [ ] 4.4: Idempotent: if scanId doc exists, return existing {scanId, importId}

### Task 5: processStatementScan Cloud Function (4 subtasks)
- [ ] 5.1: Read PDF from Storage URL, call Gemini with statement prompt
- [ ] 5.2: If password provided, pass to Gemini (strip from all logs/errors)
- [ ] 5.3: Run transformer on Gemini output, write transformed result to pending doc
- [ ] 5.4: On failure: refund super credit (creditDeducted→false), set status='error'

### Task 6: Lifecycle Functions (2 subtasks)
- [ ] 6.1: onPendingStatementScanDeleted: refund credit if creditDeducted=true, keep PDF in Storage
- [ ] 6.2: cleanupPendingStatementScans (scheduled 60min): auto-fail stale >5min, delete >24h

### Task 7: Firestore + Storage Rules (2 subtasks)
- [ ] 7.1: Add pending_statement_scans rules (read+delete owner, create/update denied)
- [ ] 7.2: Add Storage rules for users/{uid}/statements/ with 7MB limit

### Task 8: Tests (3 subtasks)
- [ ] 8.1: Transformer unit tests: spending filter, chargeType, installments, dates, currency, edge cases
- [ ] 8.2: Queue function tests: credit deduction, idempotency, validation errors
- [ ] 8.3: Accuracy guardrail tests: within tolerance, outside tolerance, missing totalDebit

## Sizing
- **Points:** 8 (LARGE — grew from 5 due to async pipeline)
- **Tasks:** 8
- **Subtasks:** 24
- **Files:** ~11

## Dependencies
- 18-5 prompt V2 (DONE before this — transformer uses V2 prompt output format)
- 18-2 type extensions (chargeType, installments, source fields must exist)
- 18-13a receipt async pipeline (template — reuse patterns, NOT code duplication)

## Risk Flags
- ASYNC_COMPLEXITY (4 Cloud Functions — queue, process, delete trigger, cleanup)
- CREDIT_ATOMICITY (super credit deduction must be transactional — reuse receipt pattern)
- PASSWORD_SECURITY (never log password — strip from all error/log paths)
