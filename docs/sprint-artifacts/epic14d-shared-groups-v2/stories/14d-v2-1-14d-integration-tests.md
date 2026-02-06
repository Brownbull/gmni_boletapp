# Story 14d-v2-1.14d: Integration Tests

Status: ready-for-dev

> **Split from:** Story 14d-v2-1.14 (Join Flow Transaction Sharing Opt-In)
> **Part:** 4 of 4 (Integration Tests)
> **Related stories:** 14d-v2-1-14a, 14d-v2-1-14b, 14d-v2-1-14c
> **Depends on:** 14d-v2-1-14c (all previous parts complete)

## Story

As a **developer**,
I want **comprehensive E2E tests for the join flow opt-in feature**,
so that **the complete user journey is verified and regressions are prevented**.

## Background

This story creates the integration/E2E tests that verify the complete join flow with transaction sharing opt-in. It tests the integration of all components from stories 14a, 14b, and 14c.

## Acceptance Criteria

### E2E Test Scenarios

**AC1:** E2E test: Join group with sharing enabled, user chooses "Yes"
- Verify dialog appears
- Verify "Yes" choice sets `shareMyTransactions: true`
- Verify confirmation toast

**AC2:** E2E test: Join group with sharing enabled, user chooses "No"
- Verify dialog appears
- Verify "No" choice sets `shareMyTransactions: false`
- Verify confirmation toast

**AC3:** E2E test: Join group with sharing enabled, user dismisses dialog
- Verify dialog appears
- Verify dismiss sets `shareMyTransactions: false` (LV-6)
- Verify confirmation toast

**AC4:** E2E test: Join group with sharing disabled (no dialog)
- Verify dialog does NOT appear
- Verify joins with `shareMyTransactions: false`

### Verification Tests

**AC5:** E2E test: Verify preference persists after join (reload, check Firestore)

**AC6:** E2E test: Verify group appears in View Mode Switcher after join

**AC7:** E2E test: Verify other members can/cannot see transactions based on choice (double-gate model)

## Tasks / Subtasks

### Task 1: Integration Tests (AC: all)

- [ ] 1.1 Create `tests/e2e/sharedGroups/joinFlow.spec.ts`
- [ ] 1.2 E2E: Join group with sharing enabled, choose "Yes"
- [ ] 1.3 E2E: Join group with sharing enabled, choose "No"
- [ ] 1.4 E2E: Join group with sharing enabled, dismiss dialog
- [ ] 1.5 E2E: Join group with sharing disabled (no dialog)
- [ ] 1.6 E2E: Verify preference persists after join
- [ ] 1.7 E2E: Verify group appears in View Mode Switcher
- [ ] 1.8 E2E: Verify other members can/cannot see transactions based on choice

## Dev Notes

### Test File Structure

```typescript
// tests/e2e/sharedGroups/joinFlow.spec.ts

describe('Join Flow with Transaction Sharing Opt-In', () => {
  describe('Group with transactionSharingEnabled: true', () => {
    it('shows opt-in dialog when accepting invitation', async () => {});
    it('sets shareMyTransactions: true when user chooses Yes', async () => {});
    it('sets shareMyTransactions: false when user chooses No', async () => {});
    it('sets shareMyTransactions: false when user dismisses (LV-6)', async () => {});
  });

  describe('Group with transactionSharingEnabled: false', () => {
    it('does NOT show opt-in dialog', async () => {});
    it('joins with shareMyTransactions: false', async () => {});
  });

  describe('Preference Persistence', () => {
    it('preference persists after page reload', async () => {});
    it('preference is readable via Firestore', async () => {});
  });

  describe('View Mode Integration', () => {
    it('new group appears in View Mode Switcher', async () => {});
  });

  describe('Double-Gate Visibility Model', () => {
    it('opted-in user transactions visible to other opted-in members', async () => {});
    it('opted-out user transactions NOT visible to other members', async () => {});
  });
});
```

### Files to Create

| File | Action | Description |
|------|--------|-------------|
| `tests/e2e/sharedGroups/joinFlow.spec.ts` | **NEW** | E2E tests for join flow |

### Test Data Requirements

- Test group with `transactionSharingEnabled: true`
- Test group with `transactionSharingEnabled: false`
- Multiple test users to verify visibility

### Dependency Graph

```
UPSTREAM (must be complete):
+-- Story 14d-v2-1-14a: Dialog component
+-- Story 14d-v2-1-14b: Service integration
+-- Story 14d-v2-1-14c: Polish & edge cases
+-- Story 2.2: View Group Transactions (for visibility tests)

DOWNSTREAM (depends on this):
- None (final verification story)
```

### References

- [Source: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md - Story 1.14]
- [Source: docs/architecture/epic-14d-requirements-and-concerns.md - Double-gate visibility model]
- [Source: Story 14d-v2-1-14 (parent story)]

---

## E2E Testing Instructions (Staging)

### Staging Environment Setup

**Prerequisites:**
1. Staging dev server running: `npm run dev:staging`
2. Test users exist in Firebase Auth:
   - `alice@boletapp.test` (group owner)
   - `bob@boletapp.test` (existing member)
   - `charlie@boletapp.test` (invitee for join tests)
3. Seed data populated: `npm run staging:seed`
4. Multiple groups needed:
   - Group with `transactionSharingEnabled: true`
   - Group with `transactionSharingEnabled: false`

**CRITICAL: Viewport Constraints**
```typescript
// All staging E2E tests MUST use mobile viewport (360x780)
test.use({
    storageState: { cookies: [], origins: [] },
    viewport: { width: 360, height: 780 },
});

const STAGING_URL = 'http://localhost:5174';
```

### E2E Test File Location

```
tests/e2e/staging/join-flow-integration.spec.ts
```

### Staging E2E Scenarios

#### Join Group with Sharing Enabled - Choose Yes (AC: 1)
```typescript
test.describe('Join Flow with Transaction Sharing Opt-In', () => {
    test('join group with sharing enabled, user chooses Yes', async ({ page }) => {
        // 1. Setup: Alice creates invitation for Charlie
        // 2. Login as Charlie
        await page.goto(STAGING_URL);
        await page.click('[data-testid="test-login-button"]');
        await page.click('[data-testid="test-user-charlie"]');
        await page.waitForTimeout(3000);

        // 3. Navigate to pending invitations
        await page.click('[data-testid="profile-avatar"]');
        await page.click('text=Ajustes');
        await page.click('[data-testid="settings-menu-grupos"]');

        // 4. Click accept on invitation
        await page.click('[data-testid^="accept-invitation-"]');

        // 5. Opt-in dialog should appear
        await expect(page.locator('[data-testid="opt-in-dialog"]')).toBeVisible();

        // 6. Choose "Yes, share my transactions"
        await page.click('[data-testid="opt-in-yes-option"]');
        await page.click('[data-testid="opt-in-confirm-btn"]');

        // 7. Verify: Toast shows success
        await expect(page.getByText(/joined|uniste/i)).toBeVisible({ timeout: 5000 });

        // 8. Verify: Group appears in list
        await expect(page.locator('[data-testid^="group-card-"]')).toBeVisible();

        // Screenshot
        await page.screenshot({
            path: 'test-results/staging-join-01-yes-choice.png',
            fullPage: true,
        });
    });

    test('join group with sharing enabled, user chooses No', async ({ page }) => {
        // Similar flow but select "No, just statistics"
        // ...
        await page.click('[data-testid="opt-in-no-option"]');
        await page.click('[data-testid="opt-in-confirm-btn"]');

        await expect(page.getByText(/joined|uniste/i)).toBeVisible({ timeout: 5000 });
    });

    test('join group with sharing enabled, user dismisses dialog', async ({ page }) => {
        // Test dismiss behavior (backdrop click)
        // Verify: shareMyTransactions defaults to false (LV-6)
        // ...
        await page.click('[data-testid="opt-in-dialog-backdrop"]');
        // User should still be able to complete join with default=false
    });
});
```

#### Join Group with Sharing Disabled - No Dialog (AC: 4)
```typescript
test('join group with sharing disabled shows no opt-in dialog', async ({ page }) => {
    // 1. Setup: Group with transactionSharingEnabled: false
    // 2. Login as Charlie
    // 3. Accept invitation

    // 4. Verify: NO opt-in dialog appears
    await expect(page.locator('[data-testid="opt-in-dialog"]')).not.toBeVisible({ timeout: 2000 });

    // 5. Verify: Joins directly with shareMyTransactions: false
    await expect(page.getByText(/joined|uniste/i)).toBeVisible({ timeout: 5000 });
});
```

#### Preference Persistence (AC: 5)
```typescript
test('preference persists after page reload', async ({ page }) => {
    // 1. Charlie joins with "Yes" choice
    // 2. Reload page
    await page.reload();
    await page.waitForTimeout(3000);

    // 3. Navigate to group settings
    // 4. Verify: User sharing toggle is ON
    await expect(page.locator('[data-testid="user-sharing-preference-toggle"]')).toHaveAttribute('aria-checked', 'true');
});
```

#### View Mode Integration (AC: 6)
```typescript
test('new group appears in View Mode Switcher after join', async ({ page }) => {
    // 1. Charlie joins a group
    // 2. Click header mode indicator to open switcher
    await page.click('[data-testid="header-mode-indicator"]');

    // 3. Verify: New group appears in list
    await expect(page.locator('[data-testid^="view-mode-option-group-"]')).toBeVisible();
});
```

#### Double-Gate Visibility (AC: 7)
```typescript
test('opted-in user transactions visible to other opted-in members', async ({ page }) => {
    // Multi-user test:
    // 1. Alice and Bob both opted-in
    // 2. Alice creates a transaction
    // 3. Login as Bob, select group view mode
    // 4. Verify: Alice's transaction is visible

    await page.click('[data-testid="header-mode-indicator"]');
    await page.click('[data-testid^="view-mode-option-group-"]');
    await page.waitForTimeout(2000);

    // Navigate to History
    // Look for Alice's transaction
    await expect(page.getByText(/Alice|alice/i)).toBeVisible();
});

test('opted-out user transactions NOT visible to other members', async ({ page }) => {
    // 1. Charlie opted-out (shareMyTransactions: false)
    // 2. Charlie creates a transaction
    // 3. Login as Bob, select group view mode
    // 4. Verify: Charlie's transaction NOT visible (only statistics show)
});
```

### Running Staging E2E Tests

```bash
# Run join flow integration tests
npm run staging:test -- tests/e2e/staging/join-flow-integration.spec.ts

# Run all staging E2E tests
npm run staging:test
```

### Multi-User Test Setup

For double-gate visibility tests, you may need:

```typescript
// Helper to setup multi-user scenarios
async function setupMultiUserScenario(browser: Browser) {
    // Create contexts for different users
    const aliceContext = await browser.newContext({
        viewport: { width: 360, height: 780 },
    });
    const bobContext = await browser.newContext({
        viewport: { width: 360, height: 780 },
    });

    const alicePage = await aliceContext.newPage();
    const bobPage = await bobContext.newPage();

    // Login each user...
    return { alicePage, bobPage };
}
```

### Test Data Testids Reference

| Element | data-testid |
|---------|-------------|
| Test login button | `test-login-button` |
| Test user (alice/bob/charlie) | `test-user-{name}` |
| Profile avatar | `profile-avatar` |
| Settings menu Grupos | `settings-menu-grupos` |
| Opt-in dialog | `opt-in-dialog` |
| Opt-in dialog backdrop | `opt-in-dialog-backdrop` |
| Yes option | `opt-in-yes-option` |
| No option | `opt-in-no-option` |
| Confirm button | `opt-in-confirm-btn` |
| Header mode indicator | `header-mode-indicator` |
| View mode option group | `view-mode-option-group-{groupId}` |
| Accept invitation | `accept-invitation-{invitationId}` |
| User sharing toggle | `user-sharing-preference-toggle` |
| Group card | `group-card-{groupId}` |

---

## Dev Agent Record

### Agent Model Used

_To be filled during implementation_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled during implementation_

### File List

_To be filled during implementation_
