# Tech Debt Story TD-15b-36: analyzeReceipt Cloud Function Security Hardening

Status: ready-for-dev

> **Source:** ECC Code Review (2026-03-01) on story 15b-5a-scan-infrastructure-hardening
> **Priority:** HIGH | **Estimated Effort:** 3 points

## Story
As a **developer**, I want **to harden the analyzeReceipt Cloud Function against SSRF, response injection, and rate-limit bypass**, so that **the scan pipeline is resilient to abuse and misuse**.

## Acceptance Criteria

- [ ] **AC1:** `fetchImageFromUrl` validates URLs against a Firebase Storage origin allowlist before fetching
- [ ] **AC2:** `isUrl()` rejects `http://` URLs — only `https://` allowed for production fetches
- [ ] **AC3:** Gemini AI response is validated against a schema (zod or type guard) after JSON.parse
- [ ] **AC4:** Error messages in `fetchImageFromUrl` do not reflect upstream HTTP status text to callers
- [ ] **AC5:** In-memory rate limiter limitation documented as accepted risk OR migrated to Firestore counters

## Tasks / Subtasks

### Task 1: SSRF prevention — URL allowlist for fetchImageFromUrl
- [ ] 1.1 Define `ALLOWED_URL_ORIGINS` constant (firebasestorage.googleapis.com, storage.googleapis.com)
- [ ] 1.2 Add `validateImageUrl()` function: parse URL, check protocol === 'https:', check hostname against allowlist
- [ ] 1.3 Call `validateImageUrl()` before `fetch()` in `fetchImageFromUrl()`
- [ ] 1.4 Update `isUrl()` to reject `http://` — only `https://` prefix

### Task 2: Response schema validation
- [ ] 2.1 Add zod schema or type guard for `GeminiAnalysisResult` interface
- [ ] 2.2 Validate parsed JSON against schema after `JSON.parse` — throw `HttpsError` on validation failure
- [ ] 2.3 Sanitize error messages in `fetchImageFromUrl` — log upstream status server-side, return generic message to caller

### Task 3: Rate limiter documentation or migration
- [ ] 3.1 Document in code comments: in-memory Map resets on cold start, not shared across instances
- [ ] 3.2 Evaluate Firestore counter approach (cost vs benefit for current traffic levels)
- [ ] 3.3 Decision: document as accepted risk or migrate — update code accordingly

## Dev Notes
- Source story: [15b-5a-scan-infrastructure-hardening](./15b-5a-scan-infrastructure-hardening.md)
- Review findings: #4 (SSRF), #7 (rate limiter), #11 (schema), #12 (error messages), #13 (http://)
- Files affected: `functions/src/analyzeReceipt.ts`
- All findings are pre-existing — not introduced by story 15b-5a
