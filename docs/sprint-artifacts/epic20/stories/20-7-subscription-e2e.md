# Story 20-7: Subscription & Monetization E2E Test

## Status: ready-for-dev

## Intent
**Epic Handle:** "Tickets at the door, wristbands inside"
**Story Handle:** "This story walks a test customer through the full journey -- from invite to wristband to VIP room"

## Story
As a developer, I want E2E tests covering the subscription and invite-link flows, so that payment integration and registration gating are verified end-to-end.

## Acceptance Criteria

### Functional
- **AC-1:** Given E2E test for invite flow, when a new user visits an invite link and registers, then they are logged in with free tier
- **AC-2:** Given E2E test for feature gating, when a free-tier user accesses a premium feature, then the upgrade prompt is shown
- **AC-3:** Given E2E test for subscription settings, when a subscribed user views settings, then current tier and expiry are displayed
- **AC-4:** Given E2E test for invite exhaustion, when an invite link is maxed out, then registration is blocked

### Architectural
- **AC-ARCH-LOC-1:** E2E test at `tests/e2e/subscription.spec.ts`
- **AC-ARCH-PATTERN-1:** Uses staging environment with Mercado Pago sandbox
- **AC-ARCH-PATTERN-2:** Tests run serially (shared staging data)
- **AC-ARCH-NO-1:** No actual Mercado Pago payment in E2E (sandbox redirect is sufficient)

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Subscription E2E | `tests/e2e/subscription.spec.ts` | Playwright | NEW |
| E2E test data helpers | `tests/e2e/helpers/subscriptionHelpers.ts` | Test utility | NEW |

## Tasks

### Task 1: Test Data Setup (2 subtasks)
- [ ] 1.1: Create test helper to generate invite links via Cloud Function (staging)
- [ ] 1.2: Create test helper to set subscription tier directly in Firestore (for gating tests)

### Task 2: Invite Flow E2E (2 subtasks)
- [ ] 2.1: Test: navigate to invite link → Google OAuth → logged in with free tier
- [ ] 2.2: Test: navigate to expired/maxed invite link → registration blocked message

### Task 3: Feature Gating E2E (2 subtasks)
- [ ] 3.1: Test: free-tier user taps premium feature → UpgradePrompt shown with plan options
- [ ] 3.2: Test: pro-tier user (set via helper) taps same feature → feature works normally

### Task 4: Subscription Settings E2E (1 subtask)
- [ ] 4.1: Test: subscribed user navigates to settings → sees tier name, expiry date

### Task 5: Hardening (2 subtasks)
- [ ] 5.1: **HARDENING (E2E_TESTING):** Add data-testid to all subscription/invite components (retroactive from 20-2, 20-4, 20-5)
- [ ] 5.2: Clean up test data in afterAll (delete test invites, reset test user subscriptions)

## Sizing
- **Points:** 3 (SMALL-MEDIUM)
- **Tasks:** 5
- **Subtasks:** 9
- **Files:** ~2

## Dependencies
- **20-2** (subscription store, gating hook)
- **20-4** (plan selection UI)
- **20-5** (invite link registration)
- **20-6** (server-side verification)

## Risk Flags
- E2E_TESTING (shared staging data, serial execution)

## Dev Notes
- E2E tests run on staging only (`npm run test:e2e:staging`), serially, never parallel.
- Mercado Pago sandbox: we can test the redirect TO checkout but not the full payment flow (requires manual interaction). The webhook test relies on unit tests in 20-3.
- Invite link E2E may need a test admin user who can create invites. Use a staging-only admin UID.
- Clean up is critical: test invites and subscription docs must be deleted in afterAll to prevent staging data pollution.
- Follow E2E conventions in `tests/e2e/E2E-TEST-CONVENTIONS.md`: data-testid selectors, no networkidle, no waitForTimeout > 3000ms.
