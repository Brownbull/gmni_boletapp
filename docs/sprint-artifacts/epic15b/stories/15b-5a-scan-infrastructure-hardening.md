# Story 15b-5a: Scan Infrastructure Hardening

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 5 - Infrastructure Hardening
**Points:** 5
**Priority:** HIGH
**Status:** done

## Overview

Three-pronged hardening of the scan pipeline: fix the broken error recovery UX (camera-only lock after failure), migrate off deprecated Firebase infrastructure before the March 2026 shutdown, and create an on-demand E2E smoke test for the full scan flow against staging.

> **Incident context:** On 2026-02-28, production scans stopped working due to an invalid Gemini API key in `functions/.env`. The error recovery UX trapped users in camera-only mode with no gallery option. This story prevents recurrence and hardens the flow.

## Functional Acceptance Criteria

- [x] **AC1:** After a scan failure (API error, timeout, network), the user can retry with camera OR gallery — not locked into camera-only
- [x] **AC2:** `functions.config()` calls removed from `analyzeReceipt.ts`; all config via `process.env` (`.env` for deploy, Secret Manager for future)
- [x] **AC3:** Gemini model upgraded from `gemini-2.0-flash` to latest stable (e.g., `gemini-2.5-flash`) with `v1` API version (not `v1beta`)
- [x] **AC4:** `firebase-functions` upgraded from `^4.5.0` to `^5.1.1` (latest compatible with Node 20 and v1 onCall API)
- [x] **AC5:** `@google/generative-ai` upgraded to `^0.24.1`
- [x] **AC6:** On-demand E2E test exercises full scan flow (upload image → AI analysis → transaction created) against staging with a staging test user
- [x] **AC7:** E2E test is excluded from all CI suites (`test:e2e:staging`, `test:sprint`) — runs only via explicit command

## Architectural Acceptance Criteria (MANDATORY)

### File Location Requirements

- [x] **AC-ARCH-LOC-1:** E2E test file placed in `tests/e2e/on-demand/` (new directory for manual-only tests)
- [x] **AC-ARCH-LOC-2:** Cloud Functions changes stay within `functions/src/` — no client-side scan logic changes except error recovery

### Pattern Requirements

- [x] **AC-ARCH-PAT-1:** E2E test uses `test.skip(isCI, 'On-demand only')` pattern per E2E conventions
- [x] **AC-ARCH-PAT-2:** E2E test authenticates via staging test user from `staging-test-users.json`
- [x] **AC-ARCH-PAT-3:** Test receipt image loaded from `prompt-testing/test-cases/smb/charcuteria.jpg`

### Anti-Pattern Requirements (Must NOT Happen)

- [x] **AC-ARCH-NO-1:** No secrets committed to git (`.env` stays gitignored)
- [x] **AC-ARCH-NO-2:** No scan state machine rewrite — minimal fix to error recovery transitions
- [x] **AC-ARCH-NO-3:** E2E test must NOT appear in any `*.config.ts` test suite or CI pipeline

## File Specification

### Modified Files

| File | Exact Path | Change |
|------|------------|--------|
| analyzeReceipt.ts | `functions/src/analyzeReceipt.ts` | Remove `functions.config()` fallback, upgrade model to latest, update apiVersion |
| package.json | `functions/package.json` | Upgrade `firebase-functions`, `@google/generative-ai`, potentially `node` engine |
| useScanStore.ts | `src/features/scan/store/useScanStore.ts` | Fix `processError()` to properly reset capture mode for retry |
| .env | `functions/.env` | Add `GEMINI_MODEL` env var for model version flexibility (gitignored) |

### New Files

| File | Exact Path | Purpose |
|------|------------|---------|
| scan-smoke.spec.ts | `tests/e2e/on-demand/scan-smoke.spec.ts` | On-demand E2E: upload receipt → verify transaction created |

## Tasks / Subtasks

### Task 1: Fix scan error recovery UX

- [ ] 1.1 Read `src/features/scan/store/useScanStore.ts` — trace `processError()` and `reset()` transitions
- [ ] 1.2 Identify why camera/gallery selection is locked after error (likely the error phase doesn't expose retry-with-options)
- [ ] 1.3 Fix error recovery: ensure user can choose camera OR gallery when retrying after failure
- [ ] 1.4 Verify fix with unit test — mock error state → assert both camera and gallery options available

### Task 2: Migrate off deprecated `functions.config()`

- [ ] 2.1 In `functions/src/analyzeReceipt.ts`: remove `functions.config()` fallback — rely solely on `process.env.GEMINI_API_KEY`
- [ ] 2.2 Add `GEMINI_MODEL` env var support: `process.env.GEMINI_MODEL || 'gemini-2.5-flash'`
- [ ] 2.3 Update error message to reference `.env` file only (not `functions:config:set`)
- [ ] 2.4 Search all `functions/src/` for other `functions.config()` calls and migrate them
- [ ] 2.5 Run `cd functions && npm run build` — verify no type errors

### Task 3: Upgrade Gemini model + dependencies

- [ ] 3.1 Research latest stable Gemini model (check Google AI Studio for current recommendations)
- [ ] 3.2 Update model string from `'gemini-2.0-flash'` to latest stable
- [ ] 3.3 Update `apiVersion` from `'v1beta'` to `'v1'` (or latest stable)
- [ ] 3.4 Upgrade `@google/generative-ai` to latest in `functions/package.json`
- [ ] 3.5 Upgrade `firebase-functions` to latest compatible version
- [ ] 3.6 Check Node.js 20 deprecation timeline (April 2026) — note in dev notes if upgrade needed
- [ ] 3.7 `cd functions && npm install && npm run build` — verify build succeeds
- [ ] 3.8 Deploy to staging: `firebase use boletapp-staging && firebase deploy --only functions:analyzeReceipt`
- [ ] 3.9 Test scan on staging manually before deploying to prod

### Task 4: Create on-demand E2E scan smoke test

- [ ] 4.1 Create `tests/e2e/on-demand/` directory
- [ ] 4.2 Create `scan-smoke.spec.ts` with `test.skip(isCI, 'On-demand only — run manually')` guard
- [ ] 4.3 Authenticate as staging test user (e.g., `alice@boletapp.test` from `staging-test-users.json`)
- [ ] 4.4 Test flow: navigate to scan → upload `prompt-testing/test-cases/smb/charcuteria.jpg` via file input → wait for AI analysis → verify transaction fields populated (merchant, total ~17,928 CLP, items)
- [ ] 4.5 Clean up: delete test transaction in `afterAll` block
- [ ] 4.6 Verify test is NOT picked up by `npm run test:e2e:staging` (check playwright config excludes `on-demand/`)
- [ ] 4.7 Document run command: `npx playwright test tests/e2e/on-demand/scan-smoke.spec.ts --project=staging`

### Task 5: Deploy + verify

- [ ] 5.1 Deploy to staging, run E2E smoke test
- [ ] 5.2 Deploy to production: `firebase use boletapp-d609f && firebase deploy --only functions:analyzeReceipt`
- [ ] 5.3 Verify scan works in production (manual test)
- [ ] 5.4 Run `npm run test:quick` — all existing tests pass

## Dev Notes

### Incident Timeline (2026-02-28)

- `functions/.env` had placeholder `GEMINI_API_KEY=your-gemini-api-key-here`
- This was deployed to production, overriding the valid key in `functions.config()`
- All scans returned 500 with `API_KEY_INVALID`
- Error recovery UX trapped users in camera-only mode (pre-existing bug, surfaced by incident)
- Fixed by updating `.env` with valid key + redeploying

### Deprecation Deadlines

| What | Deadline | Action |
|------|----------|--------|
| `functions.config()` API | March 2026 | Migrate to `.env` / Secret Manager (Task 2) |
| Node.js 20 runtime | April 2026 (deprecated), Oct 2026 (decommissioned) | Note for future story |
| `firebase-functions@4.x` | Ongoing | Upgrade to latest (Task 3) |
| `gemini-2.0-flash` | Check deprecation schedule | Upgrade model (Task 3) |

### Staging Test User

- Users defined in `staging-test-users.json`: alice, bob, charlie, diana
- All share password `test-password-123!`
- Auth via `tests/e2e/helpers/firebase-auth.ts` → `ensureTestUserAuthenticated()`

### Test Receipt: charcuteria.jpg

Expected AI extraction for `prompt-testing/test-cases/smb/charcuteria.jpg`:
- **Merchant:** Fabrica de Cecinas y Charcuteria Francisco Peña
- **Date:** 2025-12-05
- **Items:** Chicharrones de Cerdo ($5,338), Manteca ($3,600), Mix Parrillero Premium ($8,990)
- **Total:** $17,928 CLP

### Run Command (On-Demand E2E)

```bash
# Requires dev:staging running
npm run dev:staging
# In another terminal:
npx playwright test tests/e2e/on-demand/scan-smoke.spec.ts --project=staging --headed
```

## ECC Analysis Summary

- **Risk Level:** MEDIUM (Cloud Functions deploy + model upgrade + E2E infra)
- **Complexity:** Medium-High (multi-system: CF backend + scan store + E2E tests)
- **Sizing:** 5 tasks / 24 subtasks / 5 files (within limits)
- **Dependencies:** None — all Phase 3/4 stories complete

## Senior Developer Review (ECC)

| Field | Value |
|-------|-------|
| Date | 2026-03-01 |
| Classification | STANDARD |
| Agents | code-reviewer, security-reviewer |
| Score | 6.75/10 → 8.5/10 (post-fix, round 2) |
| Outcome | APPROVE (9 quick fixes applied round 2, 4 pre-existing deferred to TD-15b-36) |
| TD Stories | TD-15b-36 (analyzeReceipt security hardening) |

## Deferred Items (Code Review 2026-03-01)

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| TD-15b-36 | SSRF prevention, response schema validation, rate limiter docs, error message sanitization | HIGH | CREATED |

## Change Log

| Date | Change |
|------|--------|
| 2026-03-01 | Code review round 2: 9 quick fixes (crypto ID, regex, PII log, error detail, model allowlist, rate-limit cleanup, E2E assertions) |
| 2026-03-01 | Code review round 1: 9 quick fixes applied, 5 pre-existing items deferred to TD-15b-36 |
| 2026-02-28 | Story created from scan incident investigation + deprecation audit |
