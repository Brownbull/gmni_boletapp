# Story 18-3: Statement Transformer + PDF Storage + Password Support

## Status: drafted

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Build the assembly line — raw AI output goes in, app-ready transactions come out"

## Story
As a developer, I want a transformer that converts StatementTransaction[] into Transaction[] (filtering spending, mapping chargeType, parsing installments), plus PDF storage in Firebase Storage and password support in the Cloud Function, so that the UI story can receive clean transaction candidates.

## Acceptance Criteria

### Functional
- **AC-1:** Transformer filters: only positive amounts imported (abonos/negatives skipped)
- **AC-2:** Transformer maps chargeType from statement type field (cargo→purchase, interes→interest, etc.)
- **AC-3:** Transformer parses installments: "3/6"→{current:3, total:6}, "1/1"→omit, null→omit
- **AC-4:** Transformer applies learned mappings (merchant_mappings + category_mappings) before output
- **AC-5:** Transformer creates synthetic "Cargo sin detallar" item via existing reconcileItemsTotal()
- **AC-6:** PDF stored to Firebase Storage at `users/{uid}/statements/{hash}.pdf`, sourceDocumentUrl set
- **AC-7:** Cloud Function accepts optional `password` field, never logs it
- **AC-8:** V2 accuracy guardrail: sum(positive amounts) ≈ totalDebit (5% tolerance), flag if off

### Architectural
- **AC-ARCH-1:** Transformer in `src/features/statement-scan/utils/statementTransformer.ts`
- **AC-ARCH-2:** PDF storage service in `src/features/statement-scan/services/pdfStorageService.ts`
- **AC-ARCH-3:** Feature module follows FSD: `src/features/statement-scan/` with barrel index.ts

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| Transformer | `src/features/statement-scan/utils/statementTransformer.ts` | NEW |
| PDF storage service | `src/features/statement-scan/services/pdfStorageService.ts` | NEW |
| Feature barrel | `src/features/statement-scan/index.ts` | NEW |
| Cloud Function | `functions/src/analyzeStatement.ts` | MODIFY (password field) |
| Transformer tests | `tests/unit/features/statement-scan/statementTransformer.test.ts` | NEW |
| PDF service tests | `tests/unit/features/statement-scan/pdfStorageService.test.ts` | NEW |
| Firebase Storage rules | `storage.rules` | MODIFY (add statements path) |

## Tasks

### Task 1: Create Statement Feature Module (1 subtask)
- [ ] 1.1: Scaffold `src/features/statement-scan/` with barrel index.ts, utils/, services/ directories

### Task 2: Build Statement Transformer (5 subtasks)
- [ ] 2.1: Create transformStatementTransactions(statements[], statementInfo) → Transaction[]
- [ ] 2.2: Implement spending filter: `amount > 0` (skip negatives)
- [ ] 2.3: Implement chargeType mapping from CHARGE_TYPE_FROM_STATEMENT
- [ ] 2.4: Implement installment parsing: "3/6"→split, "1/1"→omit, null→omit
- [ ] 2.5: Integrate with existing reconcileItemsTotal() for synthetic items

### Task 3: Apply Learned Mappings (2 subtasks)
- [ ] 3.1: Query user's merchant_mappings and category_mappings from Firestore
- [ ] 3.2: Apply mappings to transformer output before returning candidates

### Task 4: PDF Storage (3 subtasks)
- [ ] 4.1: Create pdfStorageService: uploadStatementPdf(userId, pdfBase64) → storageUrl
- [ ] 4.2: Hash PDF content (SHA-256) for dedup filename + sourceDocumentUrl
- [ ] 4.3: Update storage.rules to allow `users/{uid}/statements/{hash}.pdf`

### Task 5: Cloud Function Password Support (2 subtasks)
- [ ] 5.1: Add optional `password?: string` to AnalyzeStatementRequest
- [ ] 5.2: Strip password from all error objects and logs (SECURITY: never log passwords)

### Task 6: V2 Accuracy Guardrail (2 subtasks)
- [ ] 6.1: After transform, verify sum(positive amounts) ≈ statementInfo.totalDebit (5% tolerance)
- [ ] 6.2: Return accuracy metadata: { totalVerified: boolean, deviation: number, confidence: number }

### Task 7: Tests (3 subtasks)
- [ ] 7.1: Transformer unit tests: spending filter, chargeType mapping, installment parsing, edge cases
- [ ] 7.2: PDF storage service tests (mock Firebase Storage)
- [ ] 7.3: Accuracy guardrail tests: within tolerance, outside tolerance, missing totalDebit

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 7
- **Subtasks:** 18
- **Files:** ~7

## Dependencies
- 18-1 spike (DONE), 18-2 type extensions (chargeType, installments, source fields)

## Risk Flags
- LEARNED_MAPPINGS (integrating with existing merchant/category mapping pipeline)
- STORAGE_RULES (Firebase Storage rules must be deployed correctly)
