# Story 18-11: Statement Scanning E2E Tests

## Status: drafted

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Take it for a test drive — verify the full async statement flow works end-to-end before shipping"

## Architecture Reference
- **V5 Plan:** `docs/architecture/proposals/implemented/EPIC-18-CREDIT-CARD-STATEMENT-SCANNING.md`
- **E2E Conventions:** `tests/e2e/E2E-TEST-CONVENTIONS.md`
- **Async pattern:** Mirrors receipt scan E2E (on-demand/scan-smoke.spec.ts) but with Firestore listener for async results

## Story
As a developer, I want E2E tests covering the full statement scanning flow (long-press entry, upload, consent, async processing via Firestore listener, review, matching, hard lock, re-import), so that we have confidence the multi-step async flow works correctly against staging and catch regressions before they reach users.

## Acceptance Criteria

### Functional
- **AC-1:** On-demand smoke: long-press scan → "Credit Card Statement" → upload CMR PDF → consent → async processing via Firestore listener → review list populated with extracted transactions
- **AC-2:** Staging: first-time consent modal appears on statement upload attempt, accept stores consent, subsequent uploads skip modal
- **AC-3:** Staging: encrypted PDF (Edwards) triggers password prompt after processStatementScan returns encryption error, correct password proceeds, wrong password shows error
- **AC-4:** Staging: matching UI shows proposals with confidence badges, user can approve match (verify statementVerified=true), reject + create new (verify new transaction, original unchanged)
- **AC-5:** Staging: re-import same PDF triggers "Already imported" prompt (Storage hash check), user can cancel (no credit deducted) or proceed
- **AC-6:** Staging: async resilience — start upload, navigate away, return to app, pending statement scan detected and resumed
- **AC-7:** Staging: hard lock — after matching approval, open transaction in editor, verify all fields disabled + lock banner visible, verify "Unlock" button works
- **AC-8:** Staging: credit verification — 1 super credit deducted on statement upload, no deduction if re-import cancelled
- **AC-9:** All tests follow E2E-TEST-CONVENTIONS.md patterns (data-testid selectors, screenshots, try/finally cleanup)

### Architectural
- **AC-ARCH-1:** On-demand test at `tests/e2e/on-demand/statement-scan-smoke.spec.ts` (not in CI — calls Gemini)
- **AC-ARCH-2:** Staging tests at `tests/e2e/staging/statement-*.spec.ts`
- **AC-ARCH-3:** Shared helpers in `tests/e2e/helpers/staging-helpers.ts` (extend with statement helpers)
- **AC-ARCH-4:** Test PDFs from `prompt-testing/test-cases/CreditCard/` (existing test data)
- **AC-ARCH-5:** Existing data-testids: `scan-mode-selector`, `scan-mode-statement` (from ScanModeSelector.tsx)

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| Smoke test (on-demand) | `tests/e2e/on-demand/statement-scan-smoke.spec.ts` | NEW |
| Consent flow test | `tests/e2e/staging/statement-consent-flow.spec.ts` | NEW |
| Password prompt test | `tests/e2e/staging/statement-password-flow.spec.ts` | NEW |
| Matching + lock test | `tests/e2e/staging/statement-matching-journey.spec.ts` | NEW |
| Re-import + credit test | `tests/e2e/staging/statement-reimport-credit.spec.ts` | NEW |
| Async resilience test | `tests/e2e/staging/statement-async-resilience.spec.ts` | NEW |
| Staging helpers | `tests/e2e/helpers/staging-helpers.ts` | MODIFY (add statement helpers) |

## Tasks

### Task 1: Statement Helpers (3 subtasks)
- [ ] 1.1: Add `longPressStatementScan(page)`: long-press scan FAB → wait for mode selector → click `scan-mode-statement`
- [ ] 1.2: Add `uploadStatementPDF(page, pdfPath)`: find file input → setInputFiles → wait for consent or processing
- [ ] 1.3: Add `waitForStatementResult(page, timeoutMs)`: wait for Firestore listener to populate review list (async — use element.waitFor, NOT fixed timeout)

### Task 2: Statement Smoke Test — On-Demand (2 subtasks)
- [ ] 2.1: Create statement-scan-smoke.spec.ts: CI guard (`test.skip(isCI)`), 180s timeout (Gemini cold-start + async)
- [ ] 2.2: Flow: login as alice → long-press scan → statement → upload CMR PDF → consent accept → wait for processing → verify review list shows transactions (merchant, amount, date, chargeType badge visible)

### Task 3: Consent Flow — Staging (2 subtasks)
- [ ] 3.1: Test first-time consent modal appears on statement upload attempt, verify disclosure text mentions "Google AI"
- [ ] 3.2: Test consent persists: accept → second upload attempt skips consent modal entirely

### Task 4: Password Flow — Staging (2 subtasks)
- [ ] 4.1: Upload Edwards encrypted PDF → processStatementScan returns encryption error → password dialog appears → enter correct password (from credentials.json) → processing resumes
- [ ] 4.2: Test wrong password shows error message, user can re-enter correct password

### Task 5: Matching + Hard Lock — Staging (4 subtasks)
- [ ] 5.1: Pre-seed 3 test transactions (known merchant + amount + date matching CMR statement entries)
- [ ] 5.2: Upload CMR statement → review → proceed to matching → verify proposals shown with confidence badges
- [ ] 5.3: Approve one match: verify transaction gets statementVerified=true in Firestore, reject another + create new: verify new transaction created with source='statement_scan', original unchanged
- [ ] 5.4: Open approved (verified) transaction in editor → verify ALL fields disabled + lock banner visible → click "Unlock" → verify fields re-enabled + statementVerified=false

### Task 6: Re-import + Credit Verification — Staging (3 subtasks)
- [ ] 6.1: Note super credit count before upload → upload statement → verify 1 super credit deducted
- [ ] 6.2: Re-upload same PDF → "Already imported" prompt appears → cancel → verify no additional credit deducted
- [ ] 6.3: Re-upload same PDF → proceed → matching shows all already-verified → nothing new to match

### Task 7: Async Resilience — Staging (2 subtasks)
- [ ] 7.1: Upload statement → during processing phase, navigate away (click profile avatar) → navigate back → verify pending scan detected and processing continues
- [ ] 7.2: Upload statement → during processing, reload page → verify pending scan detection on app load resumes the flow

### Task 8: Cleanup (2 subtasks)
- [ ] 8.1: All tests use try/finally: delete test transactions, clean up consent records, delete pending scan docs
- [ ] 8.2: Pre-test cleanup: delete any residual E2E statement imports from previous failed runs

## Sizing
- **Points:** 5 (MEDIUM — grew from 3 due to async resilience, lock, and credit tests)
- **Tasks:** 8
- **Subtasks:** 20
- **Files:** ~7

## Dependencies
- 18-10b matching UI (full flow must be built before E2E can test matching)
- 18-6 editor new fields + lock (lock mode must exist before E2E can test it)

## Risk Flags
- AI_LATENCY (on-demand smoke test depends on Gemini processing, 30-90s + async overhead)
- TEST_DATA (matching test needs pre-seeded transactions aligned with CMR PDF content)
- STAGING_STATE (tests modify staging Firestore — cleanup must be robust)
- ASYNC_TIMING (Firestore listener tests need element.waitFor patterns, NOT fixed timeouts)
