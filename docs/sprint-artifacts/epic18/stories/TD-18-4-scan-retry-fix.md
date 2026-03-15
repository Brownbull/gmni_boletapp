# Tech Debt Story TD-18-4: Scan Retry — Auto-Retry + Working Retry Button

Status: done

> **Source:** Production bug (2026-03-13)
> **Priority:** HIGH | **Estimated Effort:** 5 points

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "If the scan hiccups, try again before giving up"
**Value:** V5 — "Easier than the receipt drawer" — a broken retry button and no auto-retry means users lose their scan on transient failures.

## Story
As a **user**, I want **scan failures to automatically retry once before showing me an error, and when I press Retry, it actually retries my scan** (instead of going back to the home screen), so that **transient failures don't waste my time and credits**.

## Background

### Bug 1: Retry button doesn't retry
`handleScanOverlayRetry()` in `useScanHandlers.ts:221-228` resets everything (including clearing images via `setScanImages([])`) and navigates to dashboard. It does NOT re-trigger the scan. The images are destroyed before retry can use them.

### Bug 2: No backend auto-retry
The Cloud Function `analyzeReceipt.ts` has a single try/catch around the Gemini API call. Transient errors (network timeout, 5xx, Gemini overload) immediately fail without retry.

### Credit handling concern
When a scan fails, the client immediately refunds 1 credit (`addUserCredits(1)` in processScan:450). For backend auto-retry: no credit change needed (same Cloud Function invocation, credit was reserved once). For client retry: credit was already refunded on first failure — must re-reserve before retrying. If user has 0 credits after refund, show "no credits" instead of retry button.

## Acceptance Criteria

### Backend Auto-Retry
- **AC-1:** Gemini API call wrapped in retry helper: 1 retry with 2s delay
- **AC-2:** Only retry on transient errors: network timeout, HTTP 5xx, Gemini overload/unavailable
- **AC-3:** NO retry on: validation errors (bad image), rate limit (429), client errors (4xx)
- **AC-4:** If retry succeeds, return normal response (caller doesn't know about the retry)
- **AC-5:** If retry fails, return the error as before

### Client Retry Button
- **AC-6:** Retry button preserves scan images before resetting state (stash in ref)
- **AC-7:** Retry button re-triggers `processScan` with the preserved images
- **AC-8:** Before retry: check user has >= 1 credit. If 0 credits, show "no credits" message instead of retrying
- **AC-9:** Credit re-reserved on retry (1 credit deducted before re-triggering scan)

### UX
- **AC-10:** During auto-retry, user sees processing overlay (no change — they don't know about the retry)
- **AC-11:** If all retries fail, error overlay shown with Retry button as before
- **AC-12:** Retry button label: "Reintentar" (keep existing)

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| Cloud Function | `functions/src/analyzeReceipt.ts` | EDIT |
| Retry helper | `functions/src/utils/retryHelper.ts` | NEW |
| Scan handlers | `src/features/scan/hooks/useScanHandlers.ts` | EDIT |
| Process scan | `src/features/scan/handlers/processScan/processScan.ts` | EDIT |
| Error overlay | `src/features/scan/components/ScanOverlay.tsx` | EDIT (if credit check needed) |
| Tests (backend) | `functions/test/` | NEW |
| Tests (client) | `tests/unit/features/scan/` | NEW/EDIT |
| E2E fixture | `tests/e2e/fixtures/unreadable-image.jpg` | NEW |

## Tasks

### Task 1: Backend retry helper (3 subtasks)
- [x] 1.1: Create `retryHelper.ts` with `withRetry(fn, opts)` — 1 retry, 2s delay, error classifier
- [x] 1.2: Classify errors: transient (network, 5xx, overload) vs permanent (4xx, validation, rate-limit)
- [x] 1.3: Wrap Gemini API call in `analyzeReceipt.ts` with `withRetry`

### Task 2: Client retry logic (4 subtasks)
- [x] 2.1: In `handleScanOverlayRetry`: stash current images from workflow store BEFORE resetting state
- [x] 2.2: After reset, check credit balance. If >= 1: re-trigger `processScan` with stashed images (processScan handles its own credit deduction)
- [x] 2.3: If 0 credits: show toast "No credits available" and navigate to dashboard
- [x] 2.4: Credit timing is correct — processScan already handles deduct→process→refund-on-error lifecycle. No separate credit timing changes needed.

### Task 3: Backend tests (2 subtasks)
- [x] 3.1: Unit test: mock Gemini to fail once (5xx) then succeed → verify retry works, single response returned
- [x] 3.2: Unit test: mock Gemini with 400 → verify NO retry, error returned immediately

### Task 4: Client tests (3 subtasks)
- [x] 4.1: Unit test: retry handler preserves images and calls processScan
- [x] 4.2: Unit test: retry with 0 credits → toast shown, no processScan call
- [ ] 4.3: E2E (staging): create unreadable-image.jpg fixture, upload → verify error shown → verify retry button visible (deferred — requires staging environment)

## Sizing
- **Points:** 5 (LARGE — touches Cloud Function + client + credits + E2E)
- **Tasks:** 4
- **Subtasks:** 12
- **Files:** ~7

## Dependencies
- None (standalone — but benefits from stable scan infrastructure)

## Risk Flags
- CREDIT_TIMING (refund/re-reserve sequence must be atomic-safe)
- CLOUD_FUNCTION_CHANGE (requires `cd functions && npm run build` before CI)
- COST_IMPACT (worst case 2x Gemini cost per transient failure — acceptable, these are rare)

## Review Findings (2026-03-15)

| # | Finding | Stage | Destination | Status |
|---|---------|-------|-------------|--------|
| 1 | Unawaited processScan — added .catch() | MVP | Fixed | DONE |
| 2 | Rate limit 2x amplification — added accepted-risk comment | PROD | Fixed | DONE |
| 3 | AC-9 credit deduction test gap on retry path | PROD | Backlog | deferred-findings.md |
| 4 | Truncate error.message in retry log | PROD | Fixed | DONE |
| 5 | `enotfound` substring false-positive risk | SCALE | Backlog | deferred-findings.md |
| 6 | UI guard only comment on credit check | — | Fixed | DONE |
| 7 | Unreachable lastError throw | — | Archived | — |
| 8 | Export constant accessible to client | — | Archived | — |
