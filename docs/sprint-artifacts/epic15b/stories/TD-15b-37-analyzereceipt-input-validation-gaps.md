# Tech Debt Story TD-15b-37: analyzeReceipt Input Validation Gaps

Status: ready-for-dev

> **Source:** ECC Code Review (2026-03-01) on story TD-15b-36-analyzereceipt-security-hardening
> **Priority:** LOW | **Estimated Effort:** 2 points

## Story
As a **developer**, I want **to close pre-existing input validation gaps in the analyzeReceipt Cloud Function (mixed-array re-scan heuristic and unvalidated receiptType)**, so that **the function handles edge cases predictably and prevents potential prompt injection via unvalidated enum fields**.

## Acceptance Criteria

- [ ] **AC1:** `isRescan` detection handles mixed arrays (base64 + URL) predictably — either reject or validate each image individually regardless of position
- [ ] **AC2:** `data.receiptType` is validated at runtime against the `ReceiptType` union before being passed to `buildPrompt()` — reject invalid values with `HttpsError('invalid-argument')`

## Tasks / Subtasks

### Task 1: Fix isRescan mixed-array detection
- [ ] 1.1 Audit current heuristic at line 331: `data.isRescan || isUrl(data.images[0])`
- [ ] 1.2 Choose strategy: validate all images individually (classify each as URL or base64) OR reject mixed arrays explicitly
- [ ] 1.3 Implement chosen strategy with tests
- [ ] 1.4 Verify existing security tests still pass

### Task 2: Runtime validation for receiptType
- [ ] 2.1 Add runtime check: validate `data.receiptType` against `ReceiptType` values before passing to `buildPrompt()`
- [ ] 2.2 Confirm in `prompts.ts` whether `receiptType` is interpolated into prompt string (prompt injection risk)
- [ ] 2.3 Add test for invalid receiptType value

## Dev Notes
- Source story: [TD-15b-36](./TD-15b-36-analyzereceipt-security-hardening.md)
- Review findings: #1 (isRescan heuristic), #2 (receiptType validation)
- Files affected: `functions/src/analyzeReceipt.ts`, `functions/src/prompts.ts`, security tests
- Both findings are pre-existing — not introduced by story TD-15b-36
- isRescan heuristic is MEDIUM complexity (multi-path logic change), receiptType is QUICK
