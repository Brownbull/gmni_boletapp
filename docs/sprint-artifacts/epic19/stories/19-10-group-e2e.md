# Story 19-10: Shared Groups End-to-End Integration and E2E Test

## Status: ready-for-dev

## Intent
**Epic Handle:** "Pin your receipts to the shared board"
**Story Handle:** "This story builds the shared board by running the first full house meeting -- create group, invite, post, view, manage"

## Story
As a user, I want the complete shared groups flow to work end-to-end, so that I can rely on it for household expense tracking.

## Acceptance Criteria

### Functional
- **AC-1:** Given the full flow (create group -> invite member -> post transaction -> view feed -> admin delete), when completed, then all operations work correctly
- **AC-2:** Given group analytics, when transactions are posted, then analytics update immediately
- **AC-3:** Given E2E test covers the happy path, when run on staging, then the test passes
- **AC-4:** Given E2E test data, when tests complete, then all test groups and transactions are cleaned up

### Architectural
- **AC-ARCH-PATTERN-1:** E2E follows `tests/e2e/E2E-TEST-CONVENTIONS.md`
- **AC-ARCH-PATTERN-2:** Uses 2 test users (admin + member) for multi-user scenarios
- **AC-ARCH-NO-1:** No `networkidle`, no `waitForTimeout` > 3000ms

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| E2E test | `tests/e2e/shared-groups.spec.ts` | Playwright | NEW |
| Test helpers | `tests/e2e/helpers/groupHelpers.ts` | E2E helpers | NEW |

## Tasks

### Task 1: Multi-User E2E Setup (2 subtasks)
- [ ] 1.1: Configure 2 staging test users (admin account + member account)
- [ ] 1.2: Create group test helper: createGroup, inviteMember, postTransaction, deleteGroup

### Task 2: E2E Happy Path (4 subtasks)
- [ ] 2.1: Test: admin creates group, generates invite link
- [ ] 2.2: Test: member redeems invite, joins group
- [ ] 2.3: Test: member posts personal transaction to group, appears in feed
- [ ] 2.4: Test: admin deletes a recent group transaction

### Task 3: Edge Cases (2 subtasks)
- [ ] 3.1: Test: 30-day immutability -- verify old transaction cannot be deleted (may need mock/fixture)
- [ ] 3.2: Test: non-member cannot see group data

### Task 4: Cleanup and Verification (1 subtask)
- [ ] 4.1: afterAll: delete test group and all test data

## Sizing
- **Points:** 3 (MEDIUM)
- **Tasks:** 4
- **Subtasks:** 9
- **Files:** ~2

## Dependencies
- **19-1 through 19-9** (all group features)
- Requires staging deployment (Epic 16, story 16-9)

## Risk Flags
- E2E_TESTING (multi-user E2E is complex)

## Dev Notes
- Multi-user E2E: Playwright can use multiple browser contexts with different auth states
- E2E tests run serially (shared staging data) -- this test may take 60-90s due to multi-user operations
- Test data naming: `E2E-Group-{timestamp}` for easy cleanup identification
- The 30-day immutability test may require creating a fixture transaction with a backdated postedAt -- or mocking the clock. Evaluate during implementation.
