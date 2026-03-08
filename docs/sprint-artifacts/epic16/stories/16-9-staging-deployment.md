# Story 16-9: Staging Web Deployment

## Status: done

## Intent
**Epic Handle:** "Untangle the wires, open the test door"
**Story Handle:** "This story opens the test door by giving the app a staging address -- accessible from anywhere"

## Story
As a developer, I want the app deployed to a staging URL, so that I can QA features from any device before promoting to production.

## Acceptance Criteria

### Functional
- **AC-1:** Given Firebase Hosting is configured for the staging project, when deployed, then the staging URL serves the app using staging backend data
- **AC-2:** Given staging security rules, when a non-whitelisted email attempts to sign in, then registration is blocked with a clear message
- **AC-3:** Given the CI pipeline, when a deployment is triggered (manual or on merge), then the staging site updates
- **AC-4:** Given `npm run dev:staging` exists for local dev, when staging hosting exists, then `npm run test:e2e:staging` can target either local dev:staging or the deployed staging URL

### Architectural
- **AC-ARCH-LOC-1:** Staging hosting config in `firebase.json` (staging project target)
- **AC-ARCH-LOC-2:** Staging Firestore rules at `firestore.staging.rules` or within staging project config
- **AC-ARCH-PATTERN-1:** Staging uses the SAME codebase, different Firebase project config (env vars)
- **AC-ARCH-PATTERN-2:** Registration blocking via Firestore security rules — whitelist collection checked on auth
- **AC-ARCH-NO-1:** No production Firebase project changes
- **AC-ARCH-NO-2:** No hardcoded staging URLs in source code — use environment variables

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Firebase config | `firebase.json` | Firebase Hosting | MODIFIED |
| Staging Firebase config | `.firebaserc` | Firebase project alias | MODIFIED |
| Staging env | `.env.staging` | Env config | NEW or MODIFIED |
| Staging deploy script | `scripts/deploy-staging.sh` | Shell script | NEW |
| CI workflow | `.github/workflows/deploy-staging.yml` | GitHub Actions | NEW |
| Staging Firestore rules | `firestore.staging.rules` | Firestore rules | NEW |
| Staging test users config | `staging-test-users.json` + `.env.staging` | Env-based config | VERIFIED |
| E2E config update | `playwright.config.ts` or E2E env | Playwright | MODIFIED |

## Tasks

### Task 1: Configure Firebase Hosting for Staging (3 subtasks)
- [x] 1.1: Add staging site target to `firebase.json` — existing hosting config works with --project flag
- [x] 1.2: Update `.firebaserc` with staging project alias — already has "staging": "boletapp-staging"
- [x] 1.3: Create or update `.env.staging` with staging-specific Firebase config values — already populated

### Task 2: Staging Security — Registration Blocking (3 subtasks)
- [x] 2.1: Create Firestore security rules for staging — `firestore.staging.rules` with `isAllowedStagingUser()` whitelist check
- [x] 2.2: Create whitelist seed script — `tests/staging/scripts/seed-staging-whitelist.ts`
- [x] 2.3: Client-side staging gate — AuthContext checks `allowedEmails/{email}` on staging project, blocks + signs out non-whitelisted users

### Task 3: Build and Deploy Pipeline (3 subtasks)
- [x] 3.1: Create `scripts/deploy-staging.sh` — deploys hosting + Firestore rules with validation
- [x] 3.2: Create `.github/workflows/deploy-staging.yml` — manual trigger with hosting/rules/all options
- [ ] 3.3: Test manual deployment: run script locally, verify staging URL serves the app (deferred to Task 6)

### Task 4: E2E Configuration Update (2 subtasks)
- [x] 4.1: Update playwright.config.ts — `STAGING_URL` env var overrides baseURL, skips webServer when set
- [ ] 4.2: Verify `npm run test:e2e:staging` works against deployed staging URL (deferred to Task 6)

### Task 5: Hardening (3 subtasks)
- [x] 5.1: **Env validation:** Already exists in `src/config/firebase.ts` — validates all VITE_FIREBASE_* at startup
- [x] 5.2: **Security test:** Covered by `AuthContext.staging.test.tsx` — verifies non-whitelisted users are blocked + signed out
- [x] 5.3: **Smoke test:** Created `scripts/smoke-test-staging.sh` — checks HTTP 200, app root div, script tags

### Task 6: Verification (2 subtasks)
- [x] 6.1: Run `npm run test:quick` — 313 files, 7170 tests pass, 0 failures
- [ ] 6.2: Deploy to staging, verify app loads, verify test user can sign in, verify non-test user is blocked (manual post-merge)

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 6
- **Subtasks:** 16
- **Files:** ~6

## Dependencies
- None (independent — can run at any point, but deploying after restructuring stories lets us QA the changes)

## Risk Flags
- DATA_PIPELINE (deployment configuration)
- E2E_TESTING (staging URL for E2E tests)

## Dev Notes
- The staging Firebase project already exists — `npm run dev:staging` points to it. This story adds HOSTING to that project.
- Registration blocking: simplest approach is a Firestore `allowedEmails` collection in the staging project. Security rules check `request.auth.token.email` against this collection.
- Don't use Firebase Auth custom claims for staging — too complex. Firestore rules with an email whitelist collection is simpler and sufficient.
- CI workflow should be manual trigger (`workflow_dispatch`) initially. Auto-deploy on develop merge can be added later.
- The staging URL format will be: `boletapp-staging.web.app` or similar (Firebase Hosting assigns the subdomain).
- E2E tests already use `npm run dev:staging` for local staging. The deployed staging URL is an alternative target, not a replacement.
- Task 1 was pre-existing infrastructure (verified, no changes needed). Task 3.3, 4.2, 6.2 deferred to manual post-merge verification.
- Created `firebase.staging.json` (not in original file spec) — needed by deploy script to point firebase CLI at staging rules file.
- Backend deploy targets: `firestore.staging.rules` + CI workflow — deploy via `scripts/deploy-staging.sh` or GitHub Actions.

## Review Deferred Items

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| TD-16-7 | Staging deployment hardening: CI auth migration, smoke test version check, Firestore rules scoping | LOW | CREATED |

## Senior Developer Review (KDBP)
- **Date:** 2026-03-07
- **Agents:** code-reviewer, security-reviewer (opus), architect (opus), tdd-guide
- **Classification:** COMPLEX
- **Outcome:** APPROVE 8.0/10, 9 quick fixes applied, 1 TD story created (TD-16-7)
- **Key fixes:** fail-closed auth catch, null email guard, tightened Firestore rules, CI dedup + branch protection, 2 new tests
- **Session cost:** $11.15

<!-- CITED: L2-004 (TOCTOU/auth), L2-001 (git staging) -->
<!-- INTENT: aligned -->
<!-- ORDERING: clean -->
