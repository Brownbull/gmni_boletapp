# Story 19-10: Shared Groups End-to-End Integration and E2E Test

## Status: ready-for-dev

## Intent
**Epic Handle:** "Pin your receipts to the shared board"
**Story Handle:** "Run the first full house meeting — create group, invite, auto-copy, view, manage, analytics"

## Story
As a user, I want the complete shared groups flow to work end-to-end, so that I can rely on it for household expense tracking.

## Acceptance Criteria

### Functional
- **AC-1:** Given the full flow (create group → generate invite → member redeems invite → enable auto-copy → save transaction → view group feed → admin delete → view analytics), when completed, then all operations work correctly
- **AC-2:** Given group analytics, when transactions are posted, then analytics show correct totals by category, member, and monthly trend
- **AC-3:** Given E2E test covers the happy path, when run on staging, then the test passes
- **AC-4:** Given E2E test data, when tests complete, then all test groups, invites, and transactions are cleaned up

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
- [ ] 1.2: Create group test helper: createGroup, generateInvite, redeemInvite, enableAutoCopy, saveTransaction, deleteGroupTransaction, deleteGroup

### Task 2: E2E Happy Path (6 subtasks)
- [ ] 2.1: Test: admin opens group switcher dropdown, creates group (name, icon, color)
- [ ] 2.2: Test: admin generates invite link from admin panel
- [ ] 2.3: Test: member redeems invite code, joins group, group appears in member's switcher dropdown
- [ ] 2.4: Test: member enables auto-copy toggle for group in dropdown, saves a personal transaction, transaction appears in group feed when switching to group view
- [ ] 2.5: Test: admin switches to group view, sees posted transaction in feed with member's name
- [ ] 2.6: Test: navigate to Analytics in group view — verify totals show correct values by category and member contribution

### Task 3: Edge Cases (3 subtasks)
- [ ] 3.1: Test: batch select transactions on Home screen and "Add to Group" — verify transactions appear in group feed
- [ ] 3.2: Test: admin deletes a recent (< 60-day) group transaction — verify removal from feed
- [ ] 3.3: Test: non-member cannot see group in their switcher dropdown

### Task 4: Cleanup and Verification (1 subtask)
- [ ] 4.1: afterAll: delete test group (which cascades all transactions) and clean up all test data

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 4
- **Subtasks:** 12
- **Files:** ~2

## Dependencies
- **19-1 through 19-9** (all group features)
- Requires staging deployment (Epic 16, story 16-9)

## Risk Flags
- E2E_TESTING (multi-user E2E is complex)

## Dev Notes
- Multi-user E2E: Playwright can use multiple browser contexts with different auth states
- E2E tests run serially (shared staging data) — this test may take 90-120s due to multi-user operations and context switching
- Test data naming: `E2E-Group-{timestamp}` for easy cleanup identification
- The 60-day immutability test would require backdated fixtures — defer to manual QA rather than E2E automation
- Group context switcher is the primary navigation mechanism — E2E must test dropdown open/close, group view switching, and return to personal view
- Auto-copy E2E flow: enable toggle → save transaction → switch to group view → verify transaction appears. This tests the full integration path.
