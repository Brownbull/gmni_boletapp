# Story 14d-v2-1.10b: ViewModeSwitcher UI Implementation

Status: ready-for-dev

## Story

As a **user**,
I want **to see my groups in the view mode switcher**,
So that **I can select which group's transactions to view**.

## Context

This is the second of 4 sub-stories split from the original Story 14d-v2-1.10.

This story focuses on the UI changes to ViewModeSwitcher - removing the "Coming soon" placeholder and rendering actual groups.

## Acceptance Criteria

### Core Functionality

1. **Given** I open the view mode switcher
   **When** I have groups (from useUserSharedGroups)
   **Then** I see a list of my groups with:
   - Group icon (Users)
   - Group name
   - Member count badge
   - Checkmark on active group

2. **Given** I open the view mode switcher
   **When** I have no groups
   **Then** I see:
   - "Personal" option (always first)
   - "Create Group" call-to-action button
   - No "Coming soon" placeholder

3. **Given** I click on a group in the switcher
   **When** the selection is processed
   **Then** the switcher closes
   **And** the selected group shows a checkmark

4. **Given** accessibility requirements
   **When** the switcher is rendered
   **Then** all options have proper ARIA labels
   **And** keyboard navigation works (arrow keys, Enter, Escape)

## Dependencies

### Upstream (Required First)
- **Story 14d-v2-1.10a:** Store integration complete
- **Story 14d-v2-1.4:** Create Shared Group (groups can exist)
- **Story 14d-v2-1.6:** Accept/Decline Invitation (joined groups appear)

### Downstream (Depends on This)
- **Story 14d-v2-1.10c:** Header indicator (needs switcher to work)

## Tasks / Subtasks

- [ ] Task 1: Remove "Coming soon" placeholder (AC: #2)
  - [ ] Delete the `data-testid="view-mode-coming-soon"` section
  - [ ] Remove associated styles/comments

- [ ] Task 2: Implement group list rendering (AC: #1)
  - [ ] Map `groups` prop to `ViewModeOption` components
  - [ ] Show group icon (Users from lucide-react)
  - [ ] Show group name (truncate if needed)
  - [ ] Show member count: `${group.members.length} members`
  - [ ] Show checkmark when `mode === 'group' && groupId === group.id`

- [ ] Task 3: Implement empty state (AC: #2)
  - [ ] Show "Create Group" button when `groups.length === 0`
  - [ ] Button navigates to Settings > Groups section
  - [ ] Add translation key: `createGroup`

- [ ] Task 4: Implement selection behavior (AC: #3)
  - [ ] onClick calls `handleSelectGroup(group)`
  - [ ] After selection, call `onClose()`
  - [ ] Checkmark appears on newly selected group

- [ ] Task 5: Implement accessibility (AC: #4)
  - [ ] Add `role="listbox"` to container
  - [ ] Add `role="option"` to each option
  - [ ] Add `aria-selected` to active option
  - [ ] Implement keyboard navigation:
    - Arrow Up/Down: Move focus
    - Enter: Select focused option
    - Escape: Close switcher

- [ ] Task 6: Update tests (AC: #1-4)
  - [ ] Test group list renders correctly
  - [ ] Test empty state shows "Create Group"
  - [ ] Test selection callback called with group data
  - [ ] Test accessibility attributes present
  - [ ] Test keyboard navigation

- [ ] **Task 7: UI Standards Compliance** (Reference: [14d-v2-ui-conventions.md](../14d-v2-ui-conventions.md))
  - [ ] All colors use CSS custom properties (no hardcoded colors except #ef4444)
    - Group option background: `var(--bg-secondary)`
    - Group name: `var(--text-primary)`
    - Member count: `var(--text-secondary)`
    - Active checkmark: `var(--primary)`
    - Create Group button: `var(--primary)`
  - [ ] All user-facing text added to `src/utils/translations.ts` (en + es):
    - `members` / `miembros`
    - `createGroup` / `Crear grupo`
    - `noGroupsYet` / `Aún no tienes grupos`
    - `viewingPersonal` / `Vista personal`
    - `viewingGroup` / `Vista de grupo`
  - [ ] Component tested with all 3 themes (mono, normal, professional)
  - [ ] Component tested in dark mode
  - [ ] All interactive elements have data-testid attributes:
    - `view-mode-option-group-{groupId}`
    - `view-mode-create-group`
    - `view-mode-option-personal`
  - [ ] Accessibility: role="listbox" on container, role="option" on items, aria-selected on active
  - [ ] Keyboard nav: Arrow Up/Down, Enter, Escape
  - [ ] Icons from lucide-react only: `Users`, `Plus`, `Check`
  - [ ] Follows existing component patterns (see CreateGroupDialog.tsx)

## Dev Notes

### UI Implementation

```tsx
// ViewModeSwitcher.tsx - Group list section
{/* Group options */}
{groups.map((group) => (
  <ViewModeOption
    key={group.id}
    testId={`view-mode-option-group-${group.id}`}
    isActive={mode === 'group' && groupId === group.id}
    icon={<Users size={24} />}
    name={group.name}
    description={`${group.members.length} ${t('members')}`}
    onClick={() => handleSelectGroup(group)}
  />
))}

{/* Empty state - Create Group CTA */}
{groups.length === 0 && (
  <button
    className="view-mode-create-group"
    onClick={() => navigateToSettings('groups')}
    data-testid="view-mode-create-group"
  >
    <Plus size={20} />
    {t('createGroup')}
  </button>
)}
```

### Translation Keys Required

```json
{
  "members": "miembros",
  "createGroup": "Crear grupo",
  "noGroupsYet": "Aún no tienes grupos"
}
```

### File Locations

| File | Purpose |
|------|---------|
| `src/components/SharedGroups/ViewModeSwitcher.tsx` | Main component (existing) |
| `src/components/SharedGroups/ViewModeOption.tsx` | Option subcomponent (existing) |
| `tests/unit/components/SharedGroups/ViewModeSwitcher.test.tsx` | Tests (existing) |

> **Architecture Note:** These files are in the legacy location (`src/components/SharedGroups/`). Per 14d-v2-ui-conventions.md, they should be in `src/features/shared-groups/components/`. This migration is tracked in tech debt story [TD-14d-2-fsd-component-location](./TD-14d-2-fsd-component-location.md). For now, continue modifying files in their current location until TD-14d-2 is complete.

### Estimate

~3 story points

## References

- [Story 14d-v2-1.10a: Store Integration](./14d-v2-1-10a-viewmode-store-integration.md)
- [Original Story 14d-v2-1.10](./14d-v2-1-10-view-mode-switcher.md)
- [ViewModeSwitcher Component](../../../../src/components/SharedGroups/ViewModeSwitcher.tsx)

---

## E2E Testing Instructions (Staging)

### Staging Environment Setup

**Prerequisites:**
1. Staging dev server running: `npm run dev:staging`
2. Test users exist in Firebase Auth:
   - `alice@boletapp.test` (has groups)
   - `diana@boletapp.test` (no groups - for empty state test)
3. Seed data populated: `npm run staging:seed`

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
tests/e2e/staging/view-mode-switcher.spec.ts
```

### Staging E2E Scenarios

#### Group List Renders Correctly (AC: #1)
```typescript
test('user with groups sees group list in view mode switcher', async ({ page }) => {
    // 1. Login as Alice (has groups)
    await page.goto(STAGING_URL);
    await page.click('[data-testid="test-login-button"]');
    await page.click('[data-testid="test-user-alice"]');
    await page.waitForTimeout(3000);

    // 2. Click header mode indicator to open switcher
    await page.click('[data-testid="header-mode-indicator"]');
    await page.waitForTimeout(500);

    // 3. Verify Personal option is always first
    await expect(page.locator('[data-testid="view-mode-option-personal"]')).toBeVisible();

    // 4. Verify groups are listed with:
    //    - Group name
    //    - Member count badge
    const groupOption = page.locator('[data-testid^="view-mode-option-group-"]').first();
    await expect(groupOption).toBeVisible();
    await expect(groupOption).toContainText(/\d+ (members|miembros)/i);

    // 5. Screenshot for visual verification
    await page.screenshot({
        path: 'test-results/staging-viewmode-01-group-list.png',
        fullPage: true,
    });
});
```

#### Empty State Shows Create Group CTA (AC: #2)
```typescript
test('user with no groups sees Create Group button', async ({ page }) => {
    // 1. Login as Diana (no groups)
    await page.goto(STAGING_URL);
    await page.click('[data-testid="test-login-button"]');
    await page.click('[data-testid="test-user-diana"]');
    await page.waitForTimeout(3000);

    // 2. Open view mode switcher
    await page.click('[data-testid="header-mode-indicator"]');
    await page.waitForTimeout(500);

    // 3. Verify Create Group CTA is visible
    await expect(page.locator('[data-testid="view-mode-create-group"]')).toBeVisible();

    // 4. Click Create Group → navigates to Settings > Groups
    await page.click('[data-testid="view-mode-create-group"]');
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="grupos-view"]')).toBeVisible();
});
```

#### Selection Behavior (AC: #3)
```typescript
test('selecting a group closes switcher and shows checkmark', async ({ page }) => {
    // 1. Login as Alice
    // 2. Open view mode switcher
    // 3. Click on a group option
    const groupOption = page.locator('[data-testid^="view-mode-option-group-"]').first();
    await groupOption.click();

    // 4. Verify: Switcher closes
    await expect(page.locator('[data-testid="view-mode-switcher"]')).not.toBeVisible({ timeout: 2000 });

    // 5. Re-open switcher, verify checkmark on selected group
    await page.click('[data-testid="header-mode-indicator"]');
    await expect(groupOption.locator('[data-testid="view-mode-checkmark"]')).toBeVisible();
});
```

#### Keyboard Navigation (AC: #4)
```typescript
test('keyboard navigation works in view mode switcher', async ({ page }) => {
    // 1. Login as Alice
    // 2. Open view mode switcher
    await page.click('[data-testid="header-mode-indicator"]');

    // 3. Test Escape closes switcher
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="view-mode-switcher"]')).not.toBeVisible();

    // 4. Re-open and test Tab navigation
    await page.click('[data-testid="header-mode-indicator"]');
    await page.keyboard.press('Tab');
    // Verify focus moves to first option

    // 5. Test Enter to select
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="view-mode-switcher"]')).not.toBeVisible();
});
```

### Running Staging E2E Tests

```bash
# Run view mode switcher tests
npm run staging:test -- tests/e2e/staging/view-mode-switcher.spec.ts

# Run all staging E2E tests
npm run staging:test
```

### Test Data Testids Reference

| Element | data-testid |
|---------|-------------|
| Header mode indicator | `header-mode-indicator` |
| View mode switcher container | `view-mode-switcher` |
| Personal option | `view-mode-option-personal` |
| Group option | `view-mode-option-group-{groupId}` |
| Create group CTA | `view-mode-create-group` |
| Selection checkmark | `view-mode-checkmark` |

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

