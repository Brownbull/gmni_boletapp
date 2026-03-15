# Story 18-11: Statement Scanning E2E Tests

## Status: drafted

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Take it for a test drive — verify the full statement flow works end-to-end before shipping"

## Story
As a developer, I want E2E tests covering the statement scanning flow (upload, consent, password, review, matching), so that we have confidence the multi-step flow works correctly against the staging environment and catch regressions before they reach users.

## Acceptance Criteria

### Functional
- **AC-1:** On-demand test: upload PDF → consent → AI processing → review → save (calls Gemini, not CI)
- **AC-2:** Staging test: first-time consent modal appears, accept stores consent, subsequent uploads skip modal
- **AC-3:** Staging test: encrypted PDF triggers password prompt, correct password proceeds, wrong password shows error
- **AC-4:** Staging test: matching UI shows proposals, user can approve/reject/create for each match
- **AC-5:** Staging test: re-import same statement shows "already verified" banner
- **AC-6:** All tests follow E2E-TEST-CONVENTIONS.md patterns (selectors, screenshots, cleanup)

### Architectural
- **AC-ARCH-1:** On-demand test at `tests/e2e/on-demand/statement-scan-smoke.spec.ts` (not in CI)
- **AC-ARCH-2:** Staging tests at `tests/e2e/staging/statement-*.spec.ts`
- **AC-ARCH-3:** Shared helpers in `tests/e2e/helpers/staging-helpers.ts` (extend with statement helpers)
- **AC-ARCH-4:** Test PDFs from `prompt-testing/test-cases/CreditCard/` (existing test data)

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| Smoke test (on-demand) | `tests/e2e/on-demand/statement-scan-smoke.spec.ts` | NEW |
| Consent flow test | `tests/e2e/staging/statement-consent-flow.spec.ts` | NEW |
| Password prompt test | `tests/e2e/staging/statement-password-flow.spec.ts` | NEW |
| Matching UI test | `tests/e2e/staging/statement-matching-journey.spec.ts` | NEW |
| Re-import test | `tests/e2e/staging/statement-reimport-protection.spec.ts` | NEW |
| Staging helpers | `tests/e2e/helpers/staging-helpers.ts` | MODIFY (add statement helpers) |

## Tasks

### Task 1: Statement Smoke Test — On-Demand (2 subtasks)
- [ ] 1.1: Create statement-scan-smoke.spec.ts: upload test PDF → consent → process → review transactions
- [ ] 1.2: Verify extracted transactions populate review list (merchant, amount, date visible)

### Task 2: Consent Flow — Staging (2 subtasks)
- [ ] 2.1: Test first-time consent modal appears on statement upload attempt
- [ ] 2.2: Test consent persists: second upload attempt skips consent modal

### Task 3: Password Flow — Staging (2 subtasks)
- [ ] 3.1: Test encrypted PDF triggers password prompt (use Edwards test PDF + credentials.json)
- [ ] 3.2: Test wrong password shows error, correct password proceeds

### Task 4: Matching UI — Staging (3 subtasks)
- [ ] 4.1: Pre-seed test transactions, upload statement that should match some
- [ ] 4.2: Test approve match: verify transaction gets statementVerified=true
- [ ] 4.3: Test reject + create new: verify new transaction created, original unchanged

### Task 5: Re-import Protection — Staging (2 subtasks)
- [ ] 5.1: After successful import, re-upload same statement
- [ ] 5.2: Verify "already verified" banner shows, no duplicate creation

### Task 6: Helpers + Cleanup (2 subtasks)
- [ ] 6.1: Add statement helpers to staging-helpers.ts (navigateToStatements, uploadStatement, etc.)
- [ ] 6.2: Cleanup: delete test transactions in afterAll/finally blocks

## Sizing
- **Points:** 3 (SMALL-MEDIUM)
- **Tasks:** 6
- **Subtasks:** 13
- **Files:** ~6

## Dependencies
- 18-10b matching UI (full flow must be built before E2E can test it)

## Risk Flags
- AI_LATENCY (on-demand smoke test depends on Gemini processing, 30-90s)
- TEST_DATA (matching test needs pre-seeded transactions that align with test PDF content)
- STAGING_STATE (tests modify staging Firestore — cleanup must be robust)
