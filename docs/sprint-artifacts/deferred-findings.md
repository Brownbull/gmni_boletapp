# Deferred Findings Backlog

> Items identified during code review but deferred beyond the current epic.
> Grouped by product stage. Review during epic planning for future epics.

---

## PROD Backlog

### [PROD] Cloud Function Rate Limiter Hardening

- **Source:** 18-1-statement-scan-spike review (2026-03-12)
- **Finding:** In-memory rate limiting in Cloud Functions has three weaknesses:
  1. Not durable across cold starts — each instance has its own Map
  2. No upper bound on Map size — memory leak under sustained diverse-user load
  3. `analyzeStatement` and `analyzeReceipt` have independent Maps — user can bypass per-function limits by alternating callables
- **Files:** `functions/src/analyzeStatement.ts`, `functions/src/analyzeReceipt.ts`
- **Stage:** PROD — Required for production readiness under real user load, not for feature function
- **Estimated effort:** 3-5 points (evaluate Firestore-based rate limiting, shared limiter module, or Firebase Extensions)

### [PROD] Optional Gemini Field Validation (quantity, confidence)

- **Source:** TD-18-2-gemini-response-coercion review (2026-03-12)
- **Finding:** `quantity` and `confidence` fields in receipt responses are coerced by `parseGeminiNumber` but NOT validated by `validateGeminiResult`. If Gemini returns these as non-numeric strings (e.g., `"N/A"`), they pass through as `NaN` and are written to Firestore. No crash risk (fields are optional in the UI), but data quality issue.
- **Files:** `functions/src/analyzeReceipt.ts`
- **Stage:** PROD — Data quality hardening, not required for feature function
- **Estimated effort:** 1-2 points (add isFinite checks for optional numeric fields in validator)

### [PROD] String "null" Coercion for Nullable Fields

- **Source:** TD-18-2-gemini-response-coercion review (2026-03-12)
- **Finding:** Gemini may return the string `"null"` instead of JSON `null` for nullable fields (`currency`, `country`, `city` in receipt; `originalCurrency`, `originalAmount` in statement). These pass type checks (they're valid strings/non-null) and are written to Firestore as literal string "null". No crash risk, but downstream code comparing `=== null` won't match.
- **Files:** `functions/src/analyzeReceipt.ts`, `functions/src/analyzeStatement.ts`
- **Stage:** PROD — Data quality hardening, not required for feature function
- **Estimated effort:** 1 point (add string "null" → null coercion for known nullable fields)
