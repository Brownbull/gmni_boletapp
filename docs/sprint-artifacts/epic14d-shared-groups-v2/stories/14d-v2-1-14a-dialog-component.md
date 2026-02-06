# Story 14d-v2-1.14a: Dialog Component Foundation

Status: ready-for-dev

> **Split from:** Story 14d-v2-1.14 (Join Flow Transaction Sharing Opt-In)
> **Part:** 1 of 4 (Dialog Component)
> **Related stories:** 14d-v2-1-14b, 14d-v2-1-14c, 14d-v2-1-14d

## Story

As a **user joining a group**,
I want **a clear opt-in dialog for transaction sharing**,
so that **I can make an informed choice about sharing my transaction details**.

## Background

This story creates the `TransactionSharingOptInDialog` component that will be integrated into the accept invitation flow (Story 14d-v2-1-14b). The component implements FR-25 (Join flow opt-in prompt) from the Layered Visibility Model.

**Key Principle:** Privacy-first approach (LV-6) - the default is `false` if the user dismisses or doesn't choose.

## Acceptance Criteria

### Component Requirements

**AC1:** Dialog displays with correct content:
- Title: "[Group Name] allows transaction sharing"
- Body: "Would you like to share your transaction details with group members? Your spending totals will always be visible in group statistics."
- Options: [Yes, share my transactions] [No, just statistics]

**AC2:** Default selection is "No, just statistics" (privacy-first per LV-6)

**AC3:** Dismiss behavior (backdrop tap, back button, swipe) triggers onCancel with `shareMyTransactions: false`

### Accessibility Requirements

**AC4:** Dialog is keyboard navigable (Tab between options, Enter to select)

**AC5:** Dialog is screen reader compatible with proper ARIA labels

### Testing Requirements

**AC6:** 12+ unit tests covering all component states and interactions

### Architecture Compliance (Added 2026-02-03)

**AC-FSD:** Component is in `src/features/shared-groups/components/TransactionSharingOptInDialog.tsx` and exported via feature barrel
**AC-Tests:** Tests are in `tests/unit/features/shared-groups/components/TransactionSharingOptInDialog.test.tsx`

## Tasks / Subtasks

### Task 1: Transaction Sharing Opt-In Dialog Component (AC: 1-6, AC-FSD, AC-Tests)

- [ ] 1.1 Create `src/features/shared-groups/components/TransactionSharingOptInDialog.tsx`
- [ ] 1.2 Implement dialog UI matching design spec:
  ```
  +----------------------------------------+
  |  [Group Name] allows transaction       |
  |  sharing                               |
  +----------------------------------------+
  |  Would you like to share your          |
  |  transaction details with group        |
  |  members?                              |
  |                                        |
  |  Your spending totals will always be   |
  |  visible in group statistics.          |
  |                                        |
  |  +----------------------------------+  |
  |  |  Yes, share my transactions      |  |
  |  +----------------------------------+  |
  |  +----------------------------------+  |
  |  |  No, just statistics (default)   |  |
  |  +----------------------------------+  |
  |                                        |
  |  You can change this later in          |
  |  group settings.                       |
  |                                        |
  |  [Cancel]              [Join Group]    |
  +----------------------------------------+
  ```
- [ ] 1.3 Props interface:
  ```typescript
  interface TransactionSharingOptInDialogProps {
    open: boolean;
    groupName: string;
    onConfirm: (shareMyTransactions: boolean) => void;
    onCancel: () => void;
  }
  ```
- [ ] 1.4 Default selection is "No, just statistics" (privacy-first)
- [ ] 1.5 Handle dismiss (backdrop tap) as Cancel with `shareMyTransactions: false`
- [ ] 1.6 Add keyboard navigation (Tab, Enter, Escape)
- [ ] 1.7 Add ARIA labels for screen readers
- [ ] 1.8 Apply theme colors (use existing theme context)
- [ ] 1.9 Write 12 unit tests covering all states

### Task 2: UI Standards Compliance (Reference: [14d-v2-ui-conventions.md](../14d-v2-ui-conventions.md))

- [ ] 2.1 All colors use CSS custom properties (no hardcoded colors except #ef4444)
  - Dialog surface: `var(--surface)`
  - Title: `var(--text-primary)`
  - Body text: `var(--text-secondary)`
  - Option card background: `var(--bg-secondary)`
  - Selected option border: `var(--primary)`
  - Cancel button: `var(--border-light)`, `var(--text-primary)`
  - Join button: `var(--primary)`, white text
- [ ] 2.2 All user-facing text added to `src/utils/translations.ts` (en + es):
  - `allowsTransactionSharing` / `permite compartir transacciones`
  - `shareTransactionsQuestion` / `¿Te gustaría compartir los detalles de tus transacciones con los miembros del grupo?`
  - `spendingTotalsAlwaysVisible` / `Tus totales de gastos siempre serán visibles en las estadísticas del grupo.`
  - `yesShareTransactions` / `Sí, compartir mis transacciones`
  - `othersMembersSeeExpenses` / `Otros miembros pueden ver tus gastos individuales`
  - `noJustStatistics` / `No, solo estadísticas`
  - `onlyTotalsVisible` / `Solo tus totales de gastos son visibles`
  - `canChangeInSettings` / `Puedes cambiar esto en cualquier momento en la configuración del grupo.`
  - `joinGroup` / `Unirse al grupo`
- [ ] 2.3 Component tested with all 3 themes (mono, normal, professional)
- [ ] 2.4 Component tested in dark mode
- [ ] 2.5 All interactive elements have data-testid attributes:
  - `opt-in-dialog`
  - `opt-in-dialog-backdrop`
  - `opt-in-yes-option`
  - `opt-in-no-option`
  - `opt-in-cancel-btn`
  - `opt-in-confirm-btn`
- [ ] 2.6 Accessibility: role="dialog", aria-modal="true", aria-labelledby, keyboard nav (Tab, Enter, Escape)
- [ ] 2.7 Icons from lucide-react only: `X`, `Check`
- [ ] 2.8 Use Dialog/Modal template from conventions doc
- [ ] 2.9 Follows existing component patterns (see CreateGroupDialog.tsx)

## Dev Notes

### Architecture Decisions

| Decision | Value | Source |
|----------|-------|--------|
| **FR-25** | Join flow opt-in prompt | [epics.md line 84] |
| **LV-6** | Default `shareMyTransactions: false` | [architecture.md Section 5.1] |

### UI Mockup Reference

```
+------------------------------------------------------------+
|                                                            |
|    "Household" allows transaction sharing                  |
|                                                            |
+------------------------------------------------------------+
|                                                            |
|   Would you like to share your transaction details with    |
|   group members?                                           |
|                                                            |
|   Your spending totals will always be visible in group     |
|   statistics.                                              |
|                                                            |
|   +------------------------------------------------------+ |
|   |   Yes, share my transactions                         | |
|   |   Other members can see your individual expenses     | |
|   +------------------------------------------------------+ |
|                                                            |
|   +------------------------------------------------------+ |
|   |   No, just statistics  (selected by default)         | |
|   |   Only your spending totals are visible              | |
|   +------------------------------------------------------+ |
|                                                            |
|   You can change this anytime in group settings            |
|                                                            |
|   +--------------+                    +------------------+ |
|   |   Cancel     |                    |   Join Group     | |
|   +--------------+                    +------------------+ |
|                                                            |
+------------------------------------------------------------+
```

### Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/features/shared-groups/components/TransactionSharingOptInDialog.tsx` | **NEW** | Opt-in dialog component (FSD) |
| `src/features/shared-groups/components/index.ts` | Modify | Export component |
| `src/features/shared-groups/index.ts` | Modify | Re-export component |
| `tests/unit/features/shared-groups/components/TransactionSharingOptInDialog.test.tsx` | **NEW** | Component tests (FSD) |

### Testing Standards

- **Unit tests:** 12+ tests covering component states
- **Coverage target:** 80%+ for new code
- **Accessibility tests:** Dialog tested with Tab/Enter/Escape navigation

### Project Structure Notes

- Components: `src/features/shared-groups/components/` directory (FSD compliant per 04-architecture.md)
- Use existing MUI Dialog patterns from codebase
- Follow theme integration patterns from other dialogs

### Dependency Graph

```
UPSTREAM (must be complete):
- None - standalone component

DOWNSTREAM (depends on this):
- Story 14d-v2-1-14b: Integrates this dialog into accept flow
```

### References

- [Source: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md - Story 1.14]
- [Source: docs/architecture/epic-14d-requirements-and-concerns.md - Section 5.1 Layered Visibility Model]
- [Source: docs/architecture/epic-14d-requirements-and-concerns.md - FR-25, LV-6]
- [Source: Story 14d-v2-1-14 (parent story)]

---

## E2E Testing Instructions (Staging)

### Staging Environment Setup

**Prerequisites:**
1. Staging dev server running: `npm run dev:staging`
2. Test users exist in Firebase Auth:
   - `alice@boletapp.test` (group owner)
   - `charlie@boletapp.test` (invitee - will receive invitation)
3. Seed data populated: `npm run staging:seed`
4. Alice must create a group with `transactionSharingEnabled: true`

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
tests/e2e/staging/opt-in-dialog.spec.ts
```

### Staging E2E Scenarios

#### Dialog Content Display (AC: 1, 2)
```typescript
test('opt-in dialog displays correct content', async ({ page }) => {
    // 1. Setup: Alice invites Charlie to a group with sharing enabled
    // 2. Login as Charlie
    await page.goto(STAGING_URL);
    await page.click('[data-testid="test-login-button"]');
    await page.click('[data-testid="test-user-charlie"]');
    await page.waitForTimeout(3000);

    // 3. Navigate to pending invitations and accept
    // 4. Verify opt-in dialog appears with:
    //    - Title: "[Group Name] allows transaction sharing"
    //    - Body explaining the choice
    //    - Two options: Yes/No
    await expect(page.locator('[data-testid="opt-in-dialog"]')).toBeVisible();
    await expect(page.getByText(/allows transaction sharing|permite compartir/i)).toBeVisible();
    await expect(page.locator('[data-testid="opt-in-yes-option"]')).toBeVisible();
    await expect(page.locator('[data-testid="opt-in-no-option"]')).toBeVisible();

    // 5. Verify "No, just statistics" is selected by default (LV-6)
    await expect(page.locator('[data-testid="opt-in-no-option"]')).toHaveAttribute('aria-checked', 'true');

    // 6. Screenshot
    await page.screenshot({
        path: 'test-results/staging-opt-in-01-dialog.png',
        fullPage: true,
    });
});
```

#### Select Yes Option (AC: 1)
```typescript
test('selecting Yes option shares transactions', async ({ page }) => {
    // 1. Setup: Charlie has pending invitation
    // 2. Open opt-in dialog
    // 3. Click "Yes, share my transactions"
    await page.click('[data-testid="opt-in-yes-option"]');

    // 4. Click "Join Group"
    await page.click('[data-testid="opt-in-confirm-btn"]');

    // 5. Verify toast and successful join
    await expect(page.getByText(/joined|uniste/i)).toBeVisible({ timeout: 5000 });
});
```

#### Select No Option (AC: 2)
```typescript
test('selecting No option joins without sharing', async ({ page }) => {
    // 1. Setup: Charlie has pending invitation
    // 2. Open opt-in dialog (No is already selected by default)
    // 3. Click "Join Group"
    await page.click('[data-testid="opt-in-confirm-btn"]');

    // 4. Verify toast and successful join
    await expect(page.getByText(/joined|uniste/i)).toBeVisible({ timeout: 5000 });
});
```

#### Dismiss Behavior (AC: 3)
```typescript
test('dismissing dialog sets shareMyTransactions to false', async ({ page }) => {
    // 1. Setup: Charlie has pending invitation
    // 2. Open opt-in dialog
    // 3. Click backdrop to dismiss
    await page.click('[data-testid="opt-in-dialog-backdrop"]');

    // 4. Verify dialog closes and user can still complete join
    await expect(page.locator('[data-testid="opt-in-dialog"]')).not.toBeVisible();
});

test('escape key dismisses dialog', async ({ page }) => {
    // 1. Setup: Charlie has pending invitation
    // 2. Open opt-in dialog
    // 3. Press Escape
    await page.keyboard.press('Escape');

    // 4. Verify dialog closes
    await expect(page.locator('[data-testid="opt-in-dialog"]')).not.toBeVisible();
});
```

#### Keyboard Navigation (AC: 4)
```typescript
test('keyboard navigation works in opt-in dialog', async ({ page }) => {
    // 1. Open opt-in dialog
    // 2. Tab through options
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // 3. Enter to select
    await page.keyboard.press('Enter');

    // 4. Verify selection changed
});
```

### Running Staging E2E Tests

```bash
# Run opt-in dialog tests
npm run staging:test -- tests/e2e/staging/opt-in-dialog.spec.ts

# Run all staging E2E tests
npm run staging:test
```

### Test Data Testids Reference

| Element | data-testid |
|---------|-------------|
| Opt-in dialog | `opt-in-dialog` |
| Dialog backdrop | `opt-in-dialog-backdrop` |
| Yes option | `opt-in-yes-option` |
| No option | `opt-in-no-option` |
| Cancel button | `opt-in-cancel-btn` |
| Confirm/Join button | `opt-in-confirm-btn` |

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
