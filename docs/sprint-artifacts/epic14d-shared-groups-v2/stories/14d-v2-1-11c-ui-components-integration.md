# Story 14d-v2-1.11c: Transaction Sharing Toggle - UI Components & Integration

Status: ready-for-dev

> **Split from Story 14d-v2-1.11:** 2026-02-01 via Atlas Story Sizing workflow
> Original story exceeded all sizing limits (6 tasks, 28 subtasks, 12 files).
> Split strategy: by_layer (foundation → service → UI)
> **DEPENDS ON:** 14d-v2-1-11a (types/cooldown), 14d-v2-1-11b (service)
> Related stories: 14d-v2-1-11a (foundation), 14d-v2-1-11b (service)

## Story

As a **group owner**,
I want **a toggle UI in Group Settings to enable or disable transaction sharing**,
so that **I can control whether members can see each other's transaction details**.

## Background

This story implements the **UI components and integration** for the transaction sharing toggle.
It depends on Story 1.11a (types/cooldown) and Story 1.11b (service function).

The toggle implements:
- Toggle with helper text in Group Settings
- Cooldown feedback (wait X minutes, daily limit reached)
- Read-only mode for non-owners
- Success/error toasts
- "Sharing disabled" notice in group transaction views

## Acceptance Criteria

### Toggle UI Component (from original AC: 1, 3, 4, 6, 7, 11)

**AC1:** Toggle shows current state (enabled/disabled) with helper text
**AC2:** Helper text: "When enabled, members can choose to share their transaction details with the group."
**AC3:** Cooldown state shows disabled toggle with "Please wait X minutes before changing this setting"
**AC4:** Daily limit state shows disabled toggle with "Daily limit reached. Try again tomorrow."
**AC5:** Non-owner sees read-only toggle with "Only the group owner can change this setting"
**AC6:** Success toast: "Transaction sharing [enabled/disabled]" on successful Firestore write
**AC7:** Error toast: "Failed to update setting. Please try again." on network error
**AC8:** Toggle state reverts on error (optimistic rollback)
**AC9:** Component has 10+ unit tests

### Architecture Compliance (Added 2026-02-03)

**AC-FSD:** Component is in `src/features/shared-groups/components/TransactionSharingToggle.tsx` and exported via feature barrel
**AC-Tests:** Tests are in `tests/unit/features/shared-groups/components/TransactionSharingToggle.test.tsx`

### Integration into Group Settings (from original AC: 1, 9, 10)

**AC10:** TransactionSharingToggle integrated into existing Group Settings UI (Story 14.22 pattern)
**AC11:** "Sharing disabled" notice shown in group transaction views when `transactionSharingEnabled: false`
**AC12:** Info tooltip explains the double-gate model
**AC13:** Integration tests cover full flow

## Tasks / Subtasks

### Task 1: Toggle UI Component (AC: 1-9, AC-FSD, AC-Tests)

- [ ] 1.1 Create `TransactionSharingToggle.tsx` component in `src/features/shared-groups/components/`
- [ ] 1.2 Implement toggle with helper text and current state display
- [ ] 1.3 Implement cooldown UI (disabled state, "wait X minutes" message using cooldown utility)
- [ ] 1.4 Implement daily limit UI ("Daily limit reached" message using cooldown utility)
- [ ] 1.5 Implement read-only mode for non-owners (check `ownerId === currentUserId`)
- [ ] 1.6 Add success toast notification on successful toggle
- [ ] 1.7 Add error toast notification with optimistic rollback on failure
- [ ] 1.8 Write 10+ unit tests for component states:
  - Owner with toggle enabled
  - Owner with toggle disabled
  - Owner in cooldown state
  - Owner at daily limit
  - Non-owner sees read-only
  - Toggle triggers service call
  - Success toast shown
  - Error toast + rollback
  - Missing fields (migration)
  - Helper text display

### Task 2: Integration into Group Settings View (AC: 10-13)

- [ ] 2.1 Add TransactionSharingToggle to existing Group Settings UI (follow Story 14.22 patterns)
- [ ] 2.2 Add "Sharing disabled" notice to group transaction views when `transactionSharingEnabled: false`
- [ ] 2.3 Add info tooltip explaining the double-gate model (group toggle + user opt-in)
- [ ] 2.4 Write integration tests for full flow:
  - Load settings → toggle → verify Firestore update
  - Load settings with cooldown → verify disabled state
  - Non-owner load → verify read-only

### Task 3: UI Standards Compliance (Reference: [14d-v2-ui-conventions.md](../14d-v2-ui-conventions.md))

- [ ] 3.1 All colors use CSS custom properties (no hardcoded colors except #ef4444)
  - Toggle track enabled: `var(--primary)`
  - Toggle track disabled: `var(--border-light)`
  - Helper text: `var(--text-secondary)`
  - Cooldown/limit warning: `#ef4444`
  - Info tooltip: `var(--bg-tertiary)`, `var(--text-secondary)`
- [ ] 3.2 All user-facing text added to `src/utils/translations.ts` (en + es):
  - `transactionSharingEnabled` / `Compartir transacciones habilitado`
  - `transactionSharingDisabled` / `Compartir transacciones deshabilitado`
  - `transactionSharingHelperText` / `Cuando está habilitado, los miembros pueden elegir compartir sus detalles de transacciones con el grupo.`
  - `cooldownActive` / `Por favor espera {minutes} minutos antes de cambiar esta configuración`
  - `dailyLimitReached` / `Límite diario alcanzado. Intenta mañana.`
  - `ownerOnlyCanChange` / `Solo el dueño del grupo puede cambiar esta configuración`
  - `sharingDisabledNotice` / `El compartir transacciones está deshabilitado para este grupo`
- [ ] 3.3 Component tested with all 3 themes (mono, normal, professional)
- [ ] 3.4 Component tested in dark mode
- [ ] 3.5 All interactive elements have data-testid attributes:
  - `transaction-sharing-toggle`
  - `transaction-sharing-helper-text`
  - `transaction-sharing-cooldown-message`
  - `sharing-disabled-notice`
- [ ] 3.6 Accessibility: role="switch", aria-checked on toggle
- [ ] 3.7 Icons from lucide-react only: `Info`, `AlertTriangle`
- [ ] 3.8 Use Toggle Switch template from conventions doc
- [ ] 3.9 Follows existing component patterns (see CreateGroupDialog.tsx)

## Dev Notes

### Architecture Patterns

- **Layered Visibility Model (LV-1):** Statistics ALWAYS include all members' contributions regardless of this toggle
- **Double-Gate (LV-3):** Transaction visibility requires BOTH `transactionSharingEnabled` (group) AND `shareMyTransactions` (user)
- **Eventual Consistency (LV-5):** When toggle changes to false, other members' cache clears on next sync (no purge signal)
- **Story 14.22 Pattern:** Follow existing Settings redesign patterns for UI integration

### Source Tree Components

| Component | Path | Change Type |
|-----------|------|-------------|
| Toggle component | `src/features/shared-groups/components/TransactionSharingToggle.tsx` | New (FSD) |
| Component barrel | `src/features/shared-groups/components/index.ts` | Modify |
| Feature barrel | `src/features/shared-groups/index.ts` | Modify |
| Toggle tests | `tests/unit/features/shared-groups/components/TransactionSharingToggle.test.tsx` | New (FSD) |
| Group Settings UI | `src/views/SettingsView.tsx` (or extracted view) | Integrate |
| Integration tests | `tests/integration/transactionSharingToggle.test.tsx` | New |

### Testing Standards

- Minimum 80% coverage for new code
- Test all component states (enabled, disabled, cooldown, limit, read-only)
- Test toast notifications
- Test optimistic rollback
- Integration tests for full flow

### Constraints from Architecture

- **FR-19:** Group owner controls transaction sharing toggle
- **FR-24:** Clear UX communication on setting changes
- **AD-6:** Group-level timezone (IANA format) used for midnight reset display

### Dependencies

- **14d-v2-1-11a:** Types and cooldown utility
- **14d-v2-1-11b:** Service function for Firestore persistence

### Member Experience (from original AC: 9, 10)

When `transactionSharingEnabled` is false:
- Members see ONLY their own transactions tagged with this group
- Members see a notice: "Transaction sharing is disabled for this group"
- Members can still view group statistics (byCategory, byMember breakdowns)

### Downstream Effects

| Story | Effect |
|-------|--------|
| **2.2 (View Group Transactions)** | Uses `transactionSharingEnabled` to filter visible transactions |
| **2.11 (Cloud Function Visibility Filtering)** | Reads this flag for server-side double-gate enforcement |
| **2.12 (Sharing Disabled Empty State)** | Shows UX when this toggle is false |
| **1.12 (User Transaction Sharing Preference)** | User-level toggle is gated by this group-level toggle |

### References

- [Source: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md - Story 1.11]
- [Source: docs/architecture/epic-14d-requirements-and-concerns.md - Layered Visibility Model]
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/04-architecture.md - Shared Group patterns]

---

## E2E Testing Instructions (Staging)

### Staging Environment Setup

**Prerequisites:**
1. Staging dev server running: `npm run dev:staging`
2. Test users exist in Firebase Auth:
   - `alice@boletapp.test` (group owner)
   - `bob@boletapp.test` (group member, non-owner)
3. Seed data populated: `npm run staging:seed`
4. Alice must own at least one group with Bob as member

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
tests/e2e/staging/transaction-sharing-toggle.spec.ts
```

### Staging E2E Scenarios

#### Owner Sees Toggle with Helper Text (AC: 1, 2)
```typescript
test('owner sees transaction sharing toggle with helper text', async ({ page }) => {
    // 1. Login as Alice (owner)
    await page.goto(STAGING_URL);
    await page.click('[data-testid="test-login-button"]');
    await page.click('[data-testid="test-user-alice"]');
    await page.waitForTimeout(3000);

    // 2. Navigate to Settings → Grupos
    await page.click('[data-testid="profile-avatar"]');
    await page.click('text=Ajustes');
    await page.click('[data-testid="settings-menu-grupos"]');
    await page.waitForTimeout(1000);

    // 3. Click on owned group to open settings
    await page.click('[data-testid^="group-card-"]:has-text("Test Group")');

    // 4. Verify toggle is visible with helper text
    await expect(page.locator('[data-testid="transaction-sharing-toggle"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-sharing-helper-text"]')).toContainText(
        /members can choose|miembros pueden elegir/i
    );

    // 5. Screenshot for visual verification
    await page.screenshot({
        path: 'test-results/staging-sharing-toggle-01-owner-view.png',
        fullPage: true,
    });
});
```

#### Non-Owner Sees Read-Only Toggle (AC: 5)
```typescript
test('non-owner sees read-only toggle', async ({ page }) => {
    // 1. Login as Bob (member, not owner)
    await page.goto(STAGING_URL);
    await page.click('[data-testid="test-login-button"]');
    await page.click('[data-testid="test-user-bob"]');
    await page.waitForTimeout(3000);

    // 2. Navigate to group settings
    await page.click('[data-testid="profile-avatar"]');
    await page.click('text=Ajustes');
    await page.click('[data-testid="settings-menu-grupos"]');
    await page.click('[data-testid^="group-card-"]');

    // 3. Verify toggle is disabled with "only owner" message
    const toggle = page.locator('[data-testid="transaction-sharing-toggle"]');
    await expect(toggle).toBeDisabled();
    await expect(page.getByText(/only.*owner|solo.*dueño/i)).toBeVisible();
});
```

#### Toggle Shows Success Toast (AC: 6)
```typescript
test('toggling shows success toast', async ({ page }) => {
    // 1. Login as Alice (owner)
    // 2. Navigate to group settings
    // 3. Toggle the transaction sharing setting
    await page.click('[data-testid="transaction-sharing-toggle"]');

    // 4. Verify success toast
    await expect(page.getByText(/enabled|habilitado|disabled|deshabilitado/i)).toBeVisible({ timeout: 5000 });

    // 5. Screenshot
    await page.screenshot({
        path: 'test-results/staging-sharing-toggle-02-toast.png',
        fullPage: true,
    });
});
```

#### Cooldown State (AC: 3, 4)
```typescript
test('cooldown state shows wait message after toggle', async ({ page }) => {
    // 1. Login as Alice (owner)
    // 2. Navigate to group settings
    // 3. Toggle once (to trigger cooldown)
    await page.click('[data-testid="transaction-sharing-toggle"]');
    await page.waitForTimeout(1000);

    // 4. Try to toggle again immediately
    // 5. Verify cooldown message appears
    await expect(page.locator('[data-testid="transaction-sharing-cooldown-message"]')).toContainText(
        /wait|espera/i
    );

    // 6. Verify toggle is disabled during cooldown
    await expect(page.locator('[data-testid="transaction-sharing-toggle"]')).toBeDisabled();
});
```

### Running Staging E2E Tests

```bash
# Run transaction sharing toggle tests
npm run staging:test -- tests/e2e/staging/transaction-sharing-toggle.spec.ts

# Run all staging E2E tests
npm run staging:test
```

### Test Data Testids Reference

| Element | data-testid |
|---------|-------------|
| Transaction sharing toggle | `transaction-sharing-toggle` |
| Helper text | `transaction-sharing-helper-text` |
| Cooldown message | `transaction-sharing-cooldown-message` |
| Sharing disabled notice | `sharing-disabled-notice` |
| Group card | `group-card-{groupId}` |

---

## Atlas Workflow Analysis

> Inherited from original Story 14d-v2-1.11

### Workflow Chain Visualization

```
[Story 1.4: Create Group] → [1.11a: Types/Cooldown] → [1.11b: Service] → [THIS STORY: UI]
                                                                              ↓
                                                                   [Story 1.12: User Preference]
                                                                              ↓
                                                                   [Story 2.2: View Transactions]
                                                                              ↓
                                                                   [Story 2.11: Visibility Filtering]
```

---

## Dev Agent Record

### Agent Model Used

(To be filled during development)

### Debug Log References

(To be filled during development)

### Completion Notes List

(To be filled during development)

### File List

(To be filled during development)
