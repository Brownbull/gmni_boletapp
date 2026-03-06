# Story 16-9: Staging Web Deployment

## Status: ready-for-dev

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
| Staging test users config | `src/config/staging-test-users.ts` or env-based | Config | VERIFIED |
| E2E config update | `playwright.config.ts` or E2E env | Playwright | MODIFIED |

## Tasks

### Task 1: Configure Firebase Hosting for Staging (3 subtasks)
- [ ] 1.1: Add staging site target to `firebase.json` — reuse existing staging Firebase project
- [ ] 1.2: Update `.firebaserc` with staging project alias
- [ ] 1.3: Create or update `.env.staging` with staging-specific Firebase config values

### Task 2: Staging Security — Registration Blocking (3 subtasks)
- [ ] 2.1: Create Firestore security rules for staging that check auth email against a whitelist collection
- [ ] 2.2: Create `staging-test-users` collection in staging Firestore with approved test emails
- [ ] 2.3: Client-side: show "Registration blocked" message for non-whitelisted users (staging-only UI gate)

### Task 3: Build and Deploy Pipeline (3 subtasks)
- [ ] 3.1: Create `scripts/deploy-staging.sh` — builds with staging env and deploys to staging hosting
- [ ] 3.2: Create `.github/workflows/deploy-staging.yml` — manual trigger workflow for staging deployments
- [ ] 3.3: Test manual deployment: run script locally, verify staging URL serves the app

### Task 4: E2E Configuration Update (2 subtasks)
- [ ] 4.1: Update E2E config to support targeting deployed staging URL (in addition to localhost:5174)
- [ ] 4.2: Verify `npm run test:e2e:staging` works against deployed staging URL

### Task 5: Hardening (3 subtasks)
- [ ] 5.1: **Env validation:** Add startup check that required staging env vars are set (fail fast, not fail at first use)
- [ ] 5.2: **Security test:** Write test verifying non-whitelisted email cannot access staging data
- [ ] 5.3: **Smoke test:** Create a simple smoke test script that verifies staging URL returns 200 and renders the app shell

### Task 6: Verification (2 subtasks)
- [ ] 6.1: Run `npm run test:quick` — all tests pass (staging config doesn't break dev)
- [ ] 6.2: Deploy to staging, verify app loads, verify test user can sign in, verify non-test user is blocked

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
