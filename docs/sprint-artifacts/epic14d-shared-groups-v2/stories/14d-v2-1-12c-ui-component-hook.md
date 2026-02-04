# Story 14d-v2-1.12c: UI Component + Hook

Status: ready-for-dev

> **Split from Story 14d-v2-1.12** (2026-02-01)
> Original story exceeded sizing limits (8 tasks, 34 subtasks, 8 files)
> Split strategy: by_layer (Foundation → Service → UI → Integration)
> Part 3 of 4

## Story

As a **group member**,
I want **a toggle component to control my transaction sharing preference**,
so that **I can easily opt in or out of sharing my transaction details with the group**.

## Background

This story implements the UI layer for the user-level transaction sharing preference. It provides:
1. A custom React hook for accessing and updating user preferences
2. A toggle component with proper state feedback and cooldown handling

## Acceptance Criteria

### Toggle Component (from original AC1, AC2, AC5, AC6, AC8, AC9)

**AC1:** Given I am a member of a group with `transactionSharingEnabled: true`, When I view the toggle, Then I see:
- Current state (enabled/disabled)
- Helper text: "Your spending totals always appear in group statistics. This controls whether others see your individual transaction details."

**AC2:** Given `transactionSharingEnabled` is false for the group, When I view the toggle, Then:
- The toggle is disabled (greyed out)
- Helper text shows: "Transaction sharing is disabled for this group by the owner"

**AC3:** Given I try to toggle again within 5 minutes (cooldown active), When I tap the toggle, Then I see: "Please wait X minutes before changing this setting"

**AC4:** Given I have toggled 3 times today (daily limit), When I try to toggle again, Then I see: "Daily limit reached. Try again tomorrow."

**AC5:** Given I successfully toggle the setting, When the Firestore write completes, Then I see a success toast: "Sharing preference updated"

**AC6:** Given the Firestore write fails (network error), When the error is caught, Then:
- I see an error toast: "Failed to update preference. Please try again."
- The toggle state is reverted to previous value (optimistic rollback)

### Custom Hook (from original AC1, AC12)

**AC7:** Given I call `useUserGroupPreference(groupId)`, Then I receive:
- `preference`: Current preference state
- `isLoading`: Loading state
- `updatePreference`: Function to update preference
- `canToggle`: Result of cooldown check

**AC8:** Given the preference changes in Firestore, When the hook is subscribed, Then the UI updates in real-time (multi-device support)

### Architecture Compliance (Added 2026-02-03)

**AC-FSD:** Component is in `src/features/shared-groups/components/UserTransactionSharingToggle.tsx` and exported via feature barrel
**AC-Hook:** Hook is in `src/features/shared-groups/hooks/useUserGroupPreference.ts` (NOT src/hooks/)
**AC-Tests:** Tests are in `tests/unit/features/shared-groups/components/` and `tests/unit/features/shared-groups/hooks/`

## Tasks / Subtasks

### Task 1: User Sharing Toggle Component (AC: 1, 2, 3, 4, 5, 6, AC-FSD, AC-Tests)

- [ ] 1.1 Create `src/features/shared-groups/components/UserTransactionSharingToggle.tsx` component
- [ ] 1.2 Implement toggle with helper text based on current state
- [ ] 1.3 Implement disabled state when group sharing is off (AC2)
- [ ] 1.4 Implement cooldown UI (disabled state, "wait X minutes" message)
- [ ] 1.5 Implement daily limit UI ("Daily limit reached" message)
- [ ] 1.6 Add success/error toast notifications
- [ ] 1.7 Implement optimistic update with rollback on error
- [ ] 1.8 Write 12+ unit tests for component states:
  - Toggle enabled/disabled
  - Group sharing disabled
  - Cooldown active (various wait times)
  - Daily limit reached
  - Success toast
  - Error with rollback
  - Loading state

### Task 2: Custom Hook for Preference Access (AC: 7, 8, AC-Hook, AC-Tests)

- [ ] 2.1 Create `src/features/shared-groups/hooks/useUserGroupPreference.ts` hook
- [ ] 2.2 Implement Firestore subscription for real-time updates using service from 1.12b
- [ ] 2.3 Integrate cooldown check from `canToggleUserSharingPreference()` utility (from 1.12a)
- [ ] 2.4 Return `{ preference, isLoading, updatePreference, canToggle }` interface
- [ ] 2.5 Handle loading and error states
- [ ] 2.6 Write 6+ unit tests for hook:
  - Initial loading state
  - Preference loaded successfully
  - Real-time updates
  - Update triggers cooldown recalculation
  - Error handling

### Task 3: UI Standards Compliance (Reference: [14d-v2-ui-conventions.md](../14d-v2-ui-conventions.md))

- [ ] 3.1 All colors use CSS custom properties (no hardcoded colors except #ef4444)
  - Toggle track enabled: `var(--primary)`
  - Toggle track disabled: `var(--border-light)`
  - Helper text: `var(--text-secondary)`
  - Cooldown/limit warning: `#ef4444`
  - Disabled state (group sharing off): `var(--text-tertiary)`
- [ ] 3.2 All user-facing text added to `src/utils/translations.ts` (en + es):
  - `shareMyTransactions` / `Compartir mis transacciones`
  - `shareMyTransactionsDescription` / `Tus totales de gastos siempre aparecen en las estadísticas del grupo. Esto controla si otros ven tus transacciones individuales.`
  - `sharingPreferenceUpdated` / `Preferencia de compartir actualizada`
  - `failedToUpdatePreference` / `Error al actualizar preferencia. Intenta de nuevo.`
  - `waitXMinutes` / `Por favor espera {minutes} minutos antes de cambiar esta configuración`
  - `dailyLimitReached` / `Límite diario alcanzado. Intenta mañana.`
  - `sharingDisabledByOwner` / `El compartir transacciones está deshabilitado para este grupo por el dueño`
- [ ] 3.3 Component tested with all 3 themes (mono, normal, professional)
- [ ] 3.4 Component tested in dark mode
- [ ] 3.5 All interactive elements have data-testid attributes:
  - `user-sharing-preference-toggle`
  - `user-sharing-helper-text`
  - `user-sharing-cooldown-message`
  - `user-sharing-disabled-notice`
- [ ] 3.6 Accessibility: role="switch", aria-checked on toggle
- [ ] 3.7 Icons from lucide-react only: `Info`, `AlertTriangle`
- [ ] 3.8 Use Toggle Switch template from conventions doc
- [ ] 3.9 Follows existing component patterns (see CreateGroupDialog.tsx)

## Dev Notes

### Architecture Patterns

- **Optimistic Updates:** Update UI immediately, rollback on error
- **Real-time Subscription:** Firestore onSnapshot for multi-device sync
- **Cooldown Integration:** Uses utility from Story 1.12a

### Source Tree Components

| Component | Path | Change Type |
|-----------|------|-------------|
| Toggle component | `src/features/shared-groups/components/UserTransactionSharingToggle.tsx` | New (FSD) |
| Custom hook | `src/features/shared-groups/hooks/useUserGroupPreference.ts` | New (FSD) |
| Component barrel | `src/features/shared-groups/components/index.ts` | Modify |
| Hooks barrel | `src/features/shared-groups/hooks/index.ts` | Modify |
| Feature barrel | `src/features/shared-groups/index.ts` | Modify |
| Component tests | `tests/unit/features/shared-groups/components/UserTransactionSharingToggle.test.tsx` | New (FSD) |
| Hook tests | `tests/unit/features/shared-groups/hooks/useUserGroupPreference.test.ts` | New (FSD) |

### UI Patterns

- Follow BoletApp's existing toggle component conventions (see Epic 14.22 Settings patterns)
- Toast notifications use existing toast system
- Loading states use skeleton patterns

### Testing Standards

- Minimum 80% coverage
- Test all toggle states (enabled, disabled, cooldown, daily limit)
- Test optimistic update with rollback
- Mock Firestore for hook tests

### Dependencies

- **Story 1.12a:** Types and cooldown utility (DEPENDS)
- **Story 1.12b:** Service functions (DEPENDS)

### Downstream Stories

- **Story 1.12d:** Integrates this component into Settings UI

### References

- [Source: docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-12-user-transaction-sharing-preference.md - Original story]
- [Source: docs/architecture/epic-14d-requirements-and-concerns.md - FR-24 (Clear UX communication)]
- [Source: docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-11-transaction-sharing-toggle-group.md - Toggle pattern reference]

---

## E2E Testing Instructions (Staging)

### Staging Environment Setup

**Prerequisites:**
1. Staging dev server running: `npm run dev:staging`
2. Test users exist in Firebase Auth:
   - `alice@boletapp.test` (group owner, sharing enabled)
   - `bob@boletapp.test` (group member)
3. Seed data populated: `npm run staging:seed`
4. Group with `transactionSharingEnabled: true` must exist

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
tests/e2e/staging/user-sharing-preference.spec.ts
```

### Staging E2E Scenarios

#### Toggle with Helper Text (AC: 1)
```typescript
test('member sees user sharing preference toggle with helper text', async ({ page }) => {
    // 1. Login as Bob (member)
    await page.goto(STAGING_URL);
    await page.click('[data-testid="test-login-button"]');
    await page.click('[data-testid="test-user-bob"]');
    await page.waitForTimeout(3000);

    // 2. Navigate to group settings (Settings → Grupos → Click group)
    await page.click('[data-testid="profile-avatar"]');
    await page.click('text=Ajustes');
    await page.click('[data-testid="settings-menu-grupos"]');
    await page.click('[data-testid^="group-card-"]');

    // 3. Verify toggle is visible with helper text
    await expect(page.locator('[data-testid="user-sharing-preference-toggle"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-sharing-helper-text"]')).toContainText(
        /spending totals|totales de gastos/i
    );

    // 4. Screenshot
    await page.screenshot({
        path: 'test-results/staging-user-sharing-01-toggle.png',
        fullPage: true,
    });
});
```

#### Disabled When Group Sharing Off (AC: 2)
```typescript
test('toggle disabled when group sharing is off', async ({ page }) => {
    // 1. Login as Bob (member of group with sharing disabled)
    await page.goto(STAGING_URL);
    await page.click('[data-testid="test-login-button"]');
    await page.click('[data-testid="test-user-bob"]');
    await page.waitForTimeout(3000);

    // 2. Navigate to group with transactionSharingEnabled: false
    // 3. Verify toggle is disabled with "disabled by owner" message
    const toggle = page.locator('[data-testid="user-sharing-preference-toggle"]');
    await expect(toggle).toBeDisabled();
    await expect(page.locator('[data-testid="user-sharing-disabled-notice"]')).toContainText(
        /disabled.*owner|deshabilitado.*dueño/i
    );
});
```

#### Success Toast on Toggle (AC: 5)
```typescript
test('toggling shows success toast', async ({ page }) => {
    // 1. Login as Bob
    // 2. Navigate to group settings (group with sharing enabled)
    // 3. Toggle the user sharing preference
    await page.click('[data-testid="user-sharing-preference-toggle"]');

    // 4. Verify success toast
    await expect(page.getByText(/preference updated|preferencia actualizada/i)).toBeVisible({ timeout: 5000 });
});
```

#### Cooldown State (AC: 3, 4)
```typescript
test('cooldown state shows wait message after toggle', async ({ page }) => {
    // 1. Login as Bob
    // 2. Navigate to group settings
    // 3. Toggle once (to trigger cooldown)
    await page.click('[data-testid="user-sharing-preference-toggle"]');
    await page.waitForTimeout(1000);

    // 4. Verify cooldown message appears
    await expect(page.locator('[data-testid="user-sharing-cooldown-message"]')).toContainText(
        /wait|espera/i
    );

    // 5. Verify toggle is disabled during cooldown
    await expect(page.locator('[data-testid="user-sharing-preference-toggle"]')).toBeDisabled();
});
```

#### Error with Rollback (AC: 6)
```typescript
test('error shows toast and reverts toggle state', async ({ page }) => {
    // This test requires simulating network error
    // Consider using page.route() to intercept Firestore calls

    // 1. Login and navigate to group settings
    // 2. Intercept Firestore update to fail
    await page.route('**/firestore.googleapis.com/**', route => {
        route.abort();
    });

    // 3. Toggle and verify error toast
    await page.click('[data-testid="user-sharing-preference-toggle"]');
    await expect(page.getByText(/failed|error/i)).toBeVisible({ timeout: 5000 });

    // 4. Verify toggle reverted to original state
});
```

### Running Staging E2E Tests

```bash
# Run user sharing preference tests
npm run staging:test -- tests/e2e/staging/user-sharing-preference.spec.ts

# Run all staging E2E tests
npm run staging:test
```

### Test Data Testids Reference

| Element | data-testid |
|---------|-------------|
| User sharing toggle | `user-sharing-preference-toggle` |
| Helper text | `user-sharing-helper-text` |
| Cooldown message | `user-sharing-cooldown-message` |
| Disabled notice | `user-sharing-disabled-notice` |
| Group card | `group-card-{groupId}` |

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
