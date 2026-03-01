# Tech Debt Story TD-15b-37: analyzeReceipt Input Validation Gaps

Status: done

> **Source:** ECC Code Review (2026-03-01) on story TD-15b-36-analyzereceipt-security-hardening
> **Priority:** LOW | **Estimated Effort:** 2 points

## Story
As a **developer**, I want **to close pre-existing input validation gaps in the analyzeReceipt Cloud Function (mixed-array re-scan heuristic and unvalidated receiptType)**, so that **the function handles edge cases predictably and prevents potential prompt injection via unvalidated enum fields**.

## Acceptance Criteria

- [x] **AC1:** `isRescan` detection handles mixed arrays (base64 + URL) predictably — either reject or validate each image individually regardless of position
- [x] **AC2:** `data.receiptType` is validated at runtime against the `ReceiptType` union before being passed to `buildPrompt()` — reject invalid values with `HttpsError('invalid-argument')`

## Tasks / Subtasks

### Task 1: Fix isRescan mixed-array detection
- [x] 1.1 Audit current heuristic at line 331: `data.isRescan || isUrl(data.images[0])`
- [x] 1.2 Choose strategy: validate all images individually (classify each as URL or base64) OR reject mixed arrays explicitly
- [x] 1.3 Implement chosen strategy with tests
- [x] 1.4 Verify existing security tests still pass

### Task 2: Runtime validation for receiptType
- [x] 2.1 Add runtime check: validate `data.receiptType` against `ReceiptType` values before passing to `buildPrompt()`
- [x] 2.2 Confirm in `prompts.ts` whether `receiptType` is interpolated into prompt string (prompt injection risk)
- [x] 2.3 Add test for invalid receiptType value

## Dev Notes
- Source story: [TD-15b-36](./TD-15b-36-analyzereceipt-security-hardening.md)
- Review findings: #1 (isRescan heuristic), #2 (receiptType validation)
- Files affected: `functions/src/analyzeReceipt.ts`, `functions/src/__tests__/analyzeReceipt.security.test.ts`
- Both findings are pre-existing — not introduced by story TD-15b-36
- AC1 strategy: `classifyImages()` helper rejects mixed arrays; explicit `isRescan: true` bypasses classification (trusts flag, validates URLs individually in `fetchImageFromUrl`)
- AC2 finding: `getReceiptTypeDescription()` already falls back to `auto` for unknown keys — no actual injection risk. Validation added as defense-in-depth
- prompts.ts NOT modified — only analyzeReceipt.ts needed changes
- 7 new tests added to security test file, all 17 pass (9 pre-existing + 8 new)

## Senior Developer Review (ECC)
- **Date:** 2026-03-01
- **Classification:** STANDARD
- **Agents:** code-reviewer (8.5/10), security-reviewer (8/10)
- **Overall:** APPROVE 8.25/10
- **Quick fixes applied (6):**
  1. Moved receiptType validation to input block (before image processing)
  2. Added precondition comment to classifyImages
  3. Added design-decision comment to isUrl re: http:// handling
  4. Replaced hardcoded RECEIPT_TYPES mock with jest.requireActual
  5. Documented isRescan=true mixed-array fallback behavior
  6. Added test for isRescan=false with URL images
- **Deferred items:** 0
- **Tests:** 17/17 pass, no regressions
