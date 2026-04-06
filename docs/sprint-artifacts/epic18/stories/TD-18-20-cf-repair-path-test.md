# Tech Debt Story TD-18-20: CF-Level Test for JSON Repair Path

Status: done

> **Source:** ECC Code Review (2026-04-05) on story TD-18-17
> **Priority:** HIGH | **Estimated Effort:** 2 points
> **Stage:** MVP

## Story
As a **developer**, I want **at least one Cloud Function test to exercise the JSON repair path (malformed input → repair → successful completion)**, so that **we verify the repair layer works end-to-end through the CF execution context, not just in unit isolation**.

## Background
TD-18-17 added `parseJsonWithRepair` and integrated it into 3 CFs. Unit tests for `repairJson` are comprehensive (28 tests, 100% coverage). However, no CF-level test feeds malformed JSON through the full processing pipeline. All existing CF tests either supply valid JSON or test irrecoverable failure. The adversarial fixture (`malformed-json.fixture.json`) exists but is never loaded in any CF test.

## Acceptance Criteria

### Task 1: processReceiptScan fixture test with malformed JSON
- [x] AC-1: Add test to `processReceiptScan.test.ts` fixture-mode describe block where `mockLoadFixture` returns the raw `rawGeminiResponse` from `malformed-json.fixture.json` (with markdown fence + unquoted keys + trailing commas + inline comments)
- [x] AC-2: Assert scan completes with `status: 'completed'` and coerced values match `expectedAfterCoercion`

### Task 2: analyzeReceipt test with malformed Gemini response
- [x] AC-3: Add test to `analyzeReceipt.test.ts` where `mockGenerateContent` returns malformed-but-repairable JSON response
- [x] AC-4: Assert CF returns valid parsed data (not an error)

## Dev Notes
- Source story: [TD-18-17](./TD-18-17-malformed-json-repair.md)
- Review findings: #8
- Files affected: `functions/src/__tests__/processReceiptScan.test.ts`, `functions/src/__tests__/analyzeReceipt.test.ts`, `functions/src/__tests__/testFixtures.ts` (new)
- The fixture `prompt-testing/test-cases/adversarial/malformed-json.fixture.json` has both the raw malformed response and expected coerced output — use it as the test data source

## Senior Developer Review (ECC)

- **Date:** 2026-04-05
- **Classification:** STANDARD
- **Agents:** code-reviewer (8/10), security-reviewer (7/10), tdd-guide (8/10)
- **Overall:** 8/10 — APPROVE
- **Quick fixes applied:** 4 (tightened assertions, shared fixture, try/finally, length check)
- **Deferred to backlog:** 2 PROD findings (sanitization assertion gap, unused fixture file)
<!-- CITED: L2-008 (SSoT), L2-009 (Integration Seam) -->

## Deferred Findings (Code Review 2026-04-05)

| # | Finding | Stage | Destination | Tracking |
|---|---------|-------|-------------|----------|
| 3 | Repair path tests missing sanitization assertions (XSS) | PROD | Backlog | deferred-findings.md |
| 6 | Adversarial fixture file unused by tests | PROD | Backlog | deferred-findings.md |
