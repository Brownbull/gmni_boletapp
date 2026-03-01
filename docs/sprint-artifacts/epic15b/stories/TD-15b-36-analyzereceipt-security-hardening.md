# Tech Debt Story TD-15b-36: analyzeReceipt Cloud Function Security Hardening

Status: done

> **Source:** ECC Code Review (2026-03-01) on story 15b-5a-scan-infrastructure-hardening
> **Priority:** HIGH | **Estimated Effort:** 3 points

## Story
As a **developer**, I want **to harden the analyzeReceipt Cloud Function against SSRF, response injection, and rate-limit bypass**, so that **the scan pipeline is resilient to abuse and misuse**.

## Acceptance Criteria

- [x] **AC1:** `fetchImageFromUrl` validates URLs against a Firebase Storage origin allowlist before fetching
- [x] **AC2:** `isUrl()` rejects `http://` URLs — only `https://` allowed for production fetches
- [x] **AC3:** Gemini AI response is validated against a schema (zod or type guard) after JSON.parse
- [x] **AC4:** Error messages in `fetchImageFromUrl` do not reflect upstream HTTP status text to callers
- [x] **AC5:** In-memory rate limiter limitation documented as accepted risk OR migrated to Firestore counters

## Tasks / Subtasks

### Task 1: SSRF prevention — URL allowlist for fetchImageFromUrl
- [x] 1.1 Define `ALLOWED_URL_ORIGINS` constant (firebasestorage.googleapis.com, storage.googleapis.com)
- [x] 1.2 Add `validateImageUrl()` function: parse URL, check protocol === 'https:', check hostname against allowlist
- [x] 1.3 Call `validateImageUrl()` before `fetch()` in `fetchImageFromUrl()`
- [x] 1.4 Update `isUrl()` to reject `http://` — only `https://` prefix

### Task 2: Response schema validation
- [x] 2.1 Add type guard `isValidGeminiAnalysisResult()` for `GeminiAnalysisResult` interface (no zod — not in functions deps)
- [x] 2.2 Validate parsed JSON against type guard after `JSON.parse` — throw `HttpsError` on validation failure
- [x] 2.3 Sanitize error messages in `fetchImageFromUrl` — log upstream status server-side, return generic message to caller

### Task 3: Rate limiter documentation or migration
- [x] 3.1 Document in code comments: in-memory Map resets on cold start, not shared across instances
- [x] 3.2 Evaluate Firestore counter approach (cost vs benefit for current traffic levels)
- [x] 3.3 Decision: document as accepted risk — Firestore counters deferred (< 100 scans/day, revisit at 500+)

## Dev Notes
- Source story: [15b-5a-scan-infrastructure-hardening](./15b-5a-scan-infrastructure-hardening.md)
- Review findings: #4 (SSRF), #7 (rate limiter), #11 (schema), #12 (error messages), #13 (http://)
- Files affected: `functions/src/analyzeReceipt.ts`, `functions/src/__tests__/analyzeReceipt.security.test.ts` (new)
- All findings are pre-existing — not introduced by story 15b-5a
- Decision: Type guard instead of zod — zod not installed in functions/, no justification to add a dependency for one call site
- Decision: Rate limiter documented as accepted risk — Firestore counters cost > benefit at current traffic
- Pre-existing test failures: 10/20 tests in `analyzeReceipt.test.ts` fail (sharp dependency + stale currency validation test). Security tests 10/10 pass.

## Review Findings (2026-03-01)
- Review score: 8.5/10 (APPROVE) — code-reviewer 9/10, security-reviewer 8.5/10
- Quick fixes applied: #3 (NaN/Infinity guard in type guard), #4 (PII-safe validation log)

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| TD-15b-37 | isRescan mixed-array heuristic + receiptType runtime validation | LOW | CREATED |
