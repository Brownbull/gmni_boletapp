# Tech Debt Story TD-18-2: Gemini Response Number Coercion + Diagnostic Logging

Status: done

> **Source:** Production error investigation (2026-03-12)
> **Priority:** HIGH | **Estimated Effort:** 3 points

## Story
As a **developer**, I want **the analyzeReceipt Cloud Function to coerce Gemini's string-number responses to actual numbers before validation, and log which specific field fails when validation does fail**, so that **stochastic Gemini formatting variations don't cause scan failures that require manual retry**.

## Intent
- **What the person receives:** Scans that succeed on the first attempt instead of failing randomly due to Gemini returning numbers as strings — eliminates a retry-and-hope friction point.
- **Analogy:** Like a mail sorter that currently rejects a package because the weight label says "5 kg" (a string) instead of 5 (a number). The fix adds a clerk who reads the label, converts it to a number, then sends it through the same sorting machine unchanged.
- **Done-when:** A Gemini response with `total: "15990"` passes validation and produces a saved transaction with `total: 15990`; the validation-failure log shows which specific field failed (not just field names).

## Background

### Incident (2026-03-12)
Two scan attempts observed in production logs:

| Time (UTC) | Event | Result |
|------------|-------|--------|
| 19:05:28 | Scan attempt 1, auth valid | **500 — schema validation failed** |
| 19:05:57 | Scan attempt 2 (manual retry), auth valid | 200 — transaction `_sMu3nSxVqUyjSM6E053` created |

### Root Cause
The `isValidGeminiAnalysisResult()` type guard at `functions/src/analyzeReceipt.ts:271-286` performs strict `typeof` checks:
```typescript
if (typeof v['total'] !== 'number' || !Number.isFinite(v['total'])) return false
// ... same for each item's price
```

Gemini returned all expected fields (`merchant, date, time, total, currency, category, country, city, items, metadata`) but one or more numeric fields were returned as **strings** (e.g., `"15990"` instead of `15990`). This is a known LLM behavior — JSON number formatting is stochastic.

The same receipt succeeded on the second attempt because Gemini happened to format numbers correctly that time.

### Diagnostics Gap
The current error log (line 476) only outputs `Object.keys(rawParsed)` — field names but not types or values. When validation fails, there's no way to determine which specific check failed without reproducing the exact Gemini response.

### Impact
- User sees "Receipt analysis returned unexpected format. Please try again." error
- Credit is correctly refunded on the client side (optimistic deduction + refund on error)
- No data corruption — user just needs to retry
- Estimated frequency: unknown (this is the first observed instance, but the log only shows field names, so prior occurrences may have gone undiagnosed)

## Acceptance Criteria

### Functional
- **AC-1:** Given Gemini returns `total` as a numeric string (e.g., `"15990"`), when the response is processed, then the string is coerced to a number and validation succeeds
- **AC-2:** Given Gemini returns an item `price` as a numeric string, when the response is processed, then the string is coerced to a number and validation succeeds
- **AC-3:** Given Gemini returns `total` as a non-numeric string (e.g., `"N/A"`), when coercion is attempted, then coercion returns `NaN` and validation correctly rejects the response
- **AC-4:** Given any validation failure, when the error is logged, then the log includes: which field failed, expected type, actual type, and actual value (for the failed field ONLY — do not log the full response object to avoid exposing merchant names)
- **AC-5:** Given Gemini returns a price with thousands separators (e.g., `"15.990"` or `"15,990"`), when coercion is applied, then dots and commas are stripped before parsing (all values are documented as integers per the prompt), producing `15990`
- **AC-6:** Given Gemini returns an empty string `""` for a numeric field, when coercion is applied, then it is treated as non-numeric (`NaN`), NOT coerced to `0`
- **AC-7:** The same coercion + diagnostic pattern is applied to `analyzeStatement.ts` (identical vulnerability in `isValidStatementResult` at lines ~93-121)

### Architectural
- **AC-ARCH-1:** Coercion is applied in a separate `coerceGeminiNumericFields()` function BEFORE the existing `isValidGeminiAnalysisResult()` — validation logic itself is NOT relaxed
- **AC-ARCH-2:** Coercion targets known numeric fields: `total`, `items[].price`, `items[].quantity`, `metadata.confidence` (receipt) AND `amount`, `totalTransactions`, `totalDebit`, `totalCredit`, `originalAmount`, `confidence`, `pageCount` (statement)
- **AC-ARCH-3:** No changes to the prompt, client-side code, or response interface
- **AC-ARCH-NO-1:** Do NOT add automatic retry — the client already has retry UX; server-side retry adds latency and cost
- **AC-ARCH-NO-2:** Do NOT use Gemini structured output mode (responseSchema) — that's a larger change with its own risks, evaluate separately if coercion proves insufficient

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| analyzeReceipt Cloud Function | `functions/src/analyzeReceipt.ts` | EDIT |
| analyzeStatement Cloud Function | `functions/src/analyzeStatement.ts` | EDIT |
| analyzeReceipt tests | `functions/src/__tests__/analyzeReceipt.test.ts` | EDIT |
| analyzeStatement tests | `functions/src/__tests__/analyzeStatement.test.ts` | EDIT (if exists, else NEW) |

## Tasks

### Task 1: Add coercion function (4 subtasks)
- [x] 1.1: Create `parseGeminiNumber(value: unknown): unknown` — strip dots/commas from strings (all values are integers per prompt), parse with `Number()`, reject empty strings as `NaN`
- [x] 1.2: Create `coerceGeminiNumericFields(raw: Record<string, unknown>): Record<string, unknown>` that applies `parseGeminiNumber` to known fields: `total`, `items[].price`, `items[].quantity`, `metadata.confidence`
- [x] 1.3: Apply coercion at line ~549 in `analyzeReceipt.ts`, between `JSON.parse` and `validateGeminiResult` call
- [x] 1.4: Integration tests for coercion: string-numbers coerced, Chilean separators stripped, empty string rejected, diagnostic logging verified

### Task 2: Improve validation diagnostics (2 subtasks)
- [x] 2.1: Add `validateGeminiResult()` function with `ValidationDiagnostic` return type — replaces `isValidGeminiAnalysisResult` with diagnostic output, logs ONLY failed field value (privacy)
- [x] 2.2: Updated parse flow to use `validateGeminiResult` with field-level diagnostic logging (field name, expected type, actual type, actual value)

### Task 3: Apply same pattern to analyzeStatement (2 subtasks)
- [x] 3.1: Created `coerceStatementNumericFields()` targeting `amount`, `totalTransactions`, `totalDebit`, `totalCredit`, `originalAmount` (null pass-through), `confidence`, `pageCount`
- [x] 3.2: Applied coercion before `validateStatementResult()` + diagnostic logging on validation failure

### Task 4: Integration tests + build (3 subtasks)
- [x] 4.1: Added integration tests: receipt coercion (string-numbers, Chilean separators, empty string, diagnostics) + statement coercion (string amounts, separators, null pass-through, non-numeric rejection, diagnostics)
- [x] 4.2: Verified existing security test ("should reject Gemini response with wrong field types") still passes — `"not-a-number"` correctly rejected after coercion (NaN caught by Number.isFinite)
- [x] 4.3: `cd functions && npm run build` succeeds, all TD-18-2 tests pass (17 security + 4 receipt coercion + 6 statement = 27 tests)

## Sizing
- **Points:** 3 (MEDIUM — expanded to cover analyzeStatement + edge cases)
- **Tasks:** 4
- **Subtasks:** 11
- **Files:** 4

## Dependencies
- None — independent fix, can be done immediately

## Review Findings (Serial Review 2026-03-12)

The following gaps were identified by serial review and incorporated into ACs/tasks above:

| Priority | Finding | Resolution |
|----------|---------|------------|
| CRITICAL | Chilean thousands separator `"15.990"` → `Number()` = `15.99` (1000x corruption) | AC-5: strip dots/commas before parsing (all values are integers per prompt) |
| CRITICAL | `analyzeStatement.ts` has identical `typeof !== 'number'` vulnerability | AC-7 + Task 3: apply same coercion to statement function |
| WARNING | `Number("")` = `0` (silent corruption for empty strings) | AC-6: treat empty strings as non-numeric |
| WARNING | No integration test for full pipeline with string-number mock | Task 4.1: added integration test |
| WARNING | Diagnostic logging could expose merchant names | AC-4: constrain to failed field only |
| LOW | `quantity`/`confidence` not validated → silent string corruption to Firestore | Note: coercion fixes this; optional field validation deferred (separate concern) |
| LOW | String `"null"` for nullable fields (currency, country, city) | Out of scope — no crash risk, data quality issue only. Defer. |

## Dev Notes

### Architecture Guidance
- **Coercion function (`parseGeminiNumber`)**: Strip all `.` `,` from string values, then `Number()` (rejects partial parses like `"100abc"` that `parseFloat` would silently accept). Safe for CLP integer amounts. Code comment documents CLP-only assumption — if multi-currency decimals added (Epic 18.5), this is the single place to update.
- **Null pass-through**: `originalAmount` in `StatementTransaction` is `number | null`. Coercion must skip `null` values (only coerce if `typeof === 'string'`; if null or already a number, pass through unchanged).
- **Security test compatibility**: Existing security test uses `total: 'not-a-number'` — this STILL rejects after coercion because `parseFloat('notanumber')` = `NaN`, and `!Number.isFinite(NaN)` = true → validation fails. No behavioral change needed.
- **Cloud Functions are standalone**: Both `analyzeReceipt.ts` and `analyzeStatement.ts` are independent entry points. Copy `parseGeminiNumber()` into both files rather than creating a shared import — avoids coupling standalone functions.

### Implementation Phases
1. **Receipt coercion** (Tasks 1-2): `parseGeminiNumber()` + `coerceGeminiNumericFields()` + diagnostic helper → wire into parse flow
2. **Statement coercion** (Task 3): Mirror pattern for statement numeric fields
3. **Tests** (Task 4): Update security test + create statement test file + integration test

### Testing Strategy
- Unit: edge cases for `parseGeminiNumber()` — `"15990"`→15990, `"15.990"`→15990, `"N/A"`→NaN, `""`→NaN, `"0"`→0, null→unchanged, boolean→unchanged
- Integration: mock Gemini returning string-numbers → verify full pipeline succeeds
- Security: `"not-a-number"` still rejects (unchanged contract)
- Diagnostic: spy `console.error` → assert message contains field path, NOT full response

## Risk Flags
- LOW: coercion could mask a genuine Gemini API regression (mitigated by AC-4 diagnostic logging — we'll see coercion events in logs)
- LOW: dot/comma stripping assumes all values are integers — correct for CLP but needs revisiting if USD/EUR decimal handling changes (currently prompt says "multiply by 100" for decimal currencies, so values are still integers)

## Senior Developer Review (ECC)

- **Date:** 2026-03-12
- **Agents:** code-reviewer (sonnet), security-reviewer (sonnet)
- **Classification:** STANDARD (4 files, functions/** security pattern)
- **Score:** 7.75/10 → APPROVE (after fixes)
- **Outcome:** 4 quick fixes applied, 2 findings skipped (false positives), 2 items deferred to backlog (PROD stage)
- **Quick fixes applied:**
  1. `totalTransactions` missing `Number.isFinite()` guard (analyzeStatement.ts:214)
  2. Stronger CLP-only warning comment on `parseGeminiNumber` (both files)
  3. `parseGeminiNumber` now returns NaN for non-finite results (defense-in-depth)
  4. Story dev notes corrected: `parseFloat()` → `Number()` with rationale
- **Backlog items:** 2 PROD-stage entries added to deferred-findings.md
  - Optional field validation (quantity/confidence not validated)
  - String "null" coercion for nullable fields

<!-- CITED: L2-004, L2-008 -->

## ECC Analysis Summary
- **Risk Level:** LOW
- **Complexity:** Simple
- **Classification:** SIMPLE
- **Agents consulted:** planner (sonnet)
- **Story creation date:** 2026-03-12
