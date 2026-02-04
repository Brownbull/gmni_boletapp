# Story 14d-v2-1.10c: Header Mode Indicator

Status: ready-for-dev

## Story

As a **user**,
I want **to see which view mode I'm in from the header**,
So that **I know whether I'm viewing personal or group transactions**.

## Context

This is the third of 4 sub-stories split from the original Story 14d-v2-1.10.

This story focuses on:
1. Header visual indicator showing current mode
2. Logo/icon tap to open the ViewModeSwitcher

## Acceptance Criteria

### Core Functionality

1. **Given** I am in Personal mode
   **When** I look at the header
   **Then** I see the default app logo/icon

2. **Given** I am in Group mode
   **When** I look at the header
   **Then** I see:
   - Group icon (Users) instead of default logo
   - Truncated group name next to icon
   - Visual indicator that this is a group view (e.g., subtle background)

3. **Given** I am on any view (Home, History, Analytics)
   **When** I tap the logo/icon area in the header
   **Then** the ViewModeSwitcher opens

4. **Given** the ViewModeSwitcher is open
   **When** I tap outside or press Escape
   **Then** the switcher closes

## Dependencies

### Upstream (Required First)
- **Story 14d-v2-1.10b:** ViewModeSwitcher UI complete
- **Story 14d-v2-0:** useViewModeStore available

### Downstream (Depends on This)
- **Story 14d-v2-1.10d:** Data filtering (user can now switch modes)

## Tasks / Subtasks

- [ ] Task 1: Add switcher state to header container (AC: #3, #4)
  - [ ] Add state: `const [isViewModeSwitcherOpen, setIsViewModeSwitcherOpen] = useState(false)`
  - [ ] Identify correct component (AppLayout, Header, or App.tsx)
  - [ ] Pass `isOpen` and `onClose` to ViewModeSwitcher

- [ ] Task 2: Wire up header tap to open switcher (AC: #3)
  - [ ] Wrap logo/icon area in clickable element
  - [ ] onClick: `setIsViewModeSwitcherOpen(true)`
  - [ ] Add appropriate cursor styling

- [ ] Task 3: Implement personal mode indicator (AC: #1)
  - [ ] Show default logo/icon when `mode === 'personal'`
  - [ ] No changes needed if already showing logo

- [ ] Task 4: Implement group mode indicator (AC: #2)
  - [ ] When `mode === 'group'`:
    - Replace logo with Users icon
    - Show truncated group name (max 15 chars)
    - Add subtle visual differentiation (border, background tint)
  - [ ] Read group name from `useViewModeStore((state) => state.group)`

- [ ] Task 5: Implement close behavior (AC: #4)
  - [ ] Escape key closes switcher
  - [ ] Clicking overlay/outside closes switcher
  - [ ] Add appropriate event listeners

- [ ] Task 6: Fetch groups for switcher (AC: #3)
  - [ ] Use `useUserSharedGroups` hook to get user's groups
  - [ ] Pass groups to ViewModeSwitcher component
  - [ ] Handle loading state in switcher

- [ ] Task 7: Add tests (AC: #1-4)
  - [ ] Test personal mode shows default logo
  - [ ] Test group mode shows group icon + name
  - [ ] Test logo click opens switcher
  - [ ] Test escape closes switcher
  - [ ] Test overlay click closes switcher

- [ ] **Task 8: UI Standards Compliance** (Reference: [14d-v2-ui-conventions.md](../14d-v2-ui-conventions.md))
  - [ ] All colors use CSS custom properties (no hardcoded colors except #ef4444)
    - Indicator background: `var(--bg-secondary)` or `var(--surface)`
    - Group name: `var(--text-primary)`
    - Group icon: `var(--primary)`
    - Chevron: `var(--text-secondary)`
  - [ ] All user-facing text added to `src/utils/translations.ts` (en + es):
    - `viewingPersonal` / `Vista personal`
    - `viewingGroup` / `Vista de grupo`
    - `switchToPersonal` / `Cambiar a personal`
    - `switchToGroup` / `Cambiar a grupo`
  - [ ] Component tested with all 3 themes (mono, normal, professional)
  - [ ] Component tested in dark mode
  - [ ] All interactive elements have data-testid attributes:
    - `header-mode-indicator`
    - `header-mode-indicator-name`
    - `header-mode-indicator-chevron`
  - [ ] Accessibility: aria-label on button, aria-expanded for dropdown state
  - [ ] Icons from lucide-react only: `Users`, `ChevronDown`
  - [ ] Follows existing component patterns (see CreateGroupDialog.tsx)

## Dev Notes

### Header Mode Indicator Implementation

```tsx
// In Header or AppLayout component
function HeaderModeIndicator() {
  const mode = useViewModeStore((state) => state.mode);
  const group = useViewModeStore((state) => state.group);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="header-mode-indicator"
        onClick={() => setIsOpen(true)}
        data-testid="header-mode-indicator"
      >
        {mode === 'personal' ? (
          <AppLogo size={32} />
        ) : (
          <>
            <Users size={24} className="text-primary" />
            <span className="header-group-name">
              {truncate(group?.name ?? '', 15)}
            </span>
          </>
        )}
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <ViewModeSwitcher
          groups={groups}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
```

### useUserSharedGroups Hook

This hook should already exist from Story 14d-v2-1.4/1.6. If not, create a placeholder:

```typescript
// src/features/shared-groups/hooks/useUserSharedGroups.ts
export function useUserSharedGroups() {
  return useQuery({
    queryKey: ['userSharedGroups'],
    queryFn: () => fetchUserGroups(),
    // Stale time: groups don't change often
    staleTime: 5 * 60 * 1000,
  });
}
```

### File Locations

| File | Purpose |
|------|---------|
| `src/components/App/Header.tsx` or `src/app/AppLayout.tsx` | Header component |
| `src/features/shared-groups/components/HeaderModeIndicator.tsx` | New component (FSD compliant) |
| `src/features/shared-groups/components/index.ts` | Export component |
| `src/features/shared-groups/index.ts` | Re-export component |
| `tests/unit/features/shared-groups/components/HeaderModeIndicator.test.tsx` | Component tests (FSD compliant) |

> **Architecture Compliance:** Per 14d-v2-ui-conventions.md Section 0, all NEW shared-groups components MUST be placed in `src/features/shared-groups/components/`.

### Estimate

~2 story points

## References

- [Story 14d-v2-1.10b: ViewModeSwitcher UI](./14d-v2-1-10b-viewmodeswitcher-ui.md)
- [Original Story 14d-v2-1.10](./14d-v2-1-10-view-mode-switcher.md)
- [Architecture Alignment Plan](../14d-v2-architecture-alignment-plan.md)

---

## E2E Testing Instructions (Staging)

### Staging Environment Setup

**Prerequisites:**
1. Staging dev server running: `npm run dev:staging`
2. Test users exist in Firebase Auth:
   - `alice@boletapp.test` (has groups)
3. Seed data populated: `npm run staging:seed`
4. Alice must be a member of at least one group

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
tests/e2e/staging/header-mode-indicator.spec.ts
```

### Staging E2E Scenarios

#### Personal Mode Shows Default Logo (AC: #1)
```typescript
test('personal mode shows default app logo in header', async ({ page }) => {
    // 1. Login as Alice
    await page.goto(STAGING_URL);
    await page.click('[data-testid="test-login-button"]');
    await page.click('[data-testid="test-user-alice"]');
    await page.waitForTimeout(3000);

    // 2. Verify header shows default logo (Personal mode by default)
    const modeIndicator = page.locator('[data-testid="header-mode-indicator"]');
    await expect(modeIndicator).toBeVisible();

    // 3. Verify no group name is shown
    await expect(page.locator('[data-testid="header-mode-indicator-name"]')).not.toBeVisible();

    // 4. Screenshot for visual verification
    await page.screenshot({
        path: 'test-results/staging-header-01-personal-mode.png',
        fullPage: true,
    });
});
```

#### Group Mode Shows Group Icon + Name (AC: #2)
```typescript
test('group mode shows group icon and truncated name', async ({ page }) => {
    // 1. Login as Alice
    await page.goto(STAGING_URL);
    await page.click('[data-testid="test-login-button"]');
    await page.click('[data-testid="test-user-alice"]');
    await page.waitForTimeout(3000);

    // 2. Open view mode switcher and select a group
    await page.click('[data-testid="header-mode-indicator"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid^="view-mode-option-group-"]');
    await page.waitForTimeout(500);

    // 3. Verify header shows:
    //    - Group icon (Users) instead of default logo
    //    - Group name (truncated if > 15 chars)
    const modeIndicator = page.locator('[data-testid="header-mode-indicator"]');
    await expect(modeIndicator).toBeVisible();

    const groupName = page.locator('[data-testid="header-mode-indicator-name"]');
    await expect(groupName).toBeVisible();

    // 4. Screenshot for visual verification
    await page.screenshot({
        path: 'test-results/staging-header-02-group-mode.png',
        fullPage: true,
    });
});
```

#### Tap Header Opens ViewModeSwitcher (AC: #3)
```typescript
test('tapping header mode indicator opens view mode switcher', async ({ page }) => {
    // 1. Login as Alice
    await page.goto(STAGING_URL);
    await page.click('[data-testid="test-login-button"]');
    await page.click('[data-testid="test-user-alice"]');
    await page.waitForTimeout(3000);

    // 2. Tap the header mode indicator
    await page.click('[data-testid="header-mode-indicator"]');
    await page.waitForTimeout(500);

    // 3. Verify ViewModeSwitcher is visible
    await expect(page.locator('[data-testid="view-mode-switcher"]')).toBeVisible();

    // 4. Verify Personal option and group options are shown
    await expect(page.locator('[data-testid="view-mode-option-personal"]')).toBeVisible();
});
```

#### Close Behavior (AC: #4)
```typescript
test('escape key closes view mode switcher', async ({ page }) => {
    // 1. Login and open view mode switcher
    await page.goto(STAGING_URL);
    await page.click('[data-testid="test-login-button"]');
    await page.click('[data-testid="test-user-alice"]');
    await page.waitForTimeout(3000);
    await page.click('[data-testid="header-mode-indicator"]');
    await page.waitForTimeout(500);

    // 2. Press Escape
    await page.keyboard.press('Escape');

    // 3. Verify switcher closes
    await expect(page.locator('[data-testid="view-mode-switcher"]')).not.toBeVisible({ timeout: 2000 });
});

test('clicking outside closes view mode switcher', async ({ page }) => {
    // 1. Login and open view mode switcher
    // ... (same setup)

    // 2. Click outside the switcher (on backdrop/overlay)
    await page.click('[data-testid="view-mode-switcher-backdrop"]');

    // 3. Verify switcher closes
    await expect(page.locator('[data-testid="view-mode-switcher"]')).not.toBeVisible({ timeout: 2000 });
});
```

### Running Staging E2E Tests

```bash
# Run header mode indicator tests
npm run staging:test -- tests/e2e/staging/header-mode-indicator.spec.ts

# Run all staging E2E tests
npm run staging:test
```

### Test Data Testids Reference

| Element | data-testid |
|---------|-------------|
| Header mode indicator | `header-mode-indicator` |
| Header group name | `header-mode-indicator-name` |
| Header chevron | `header-mode-indicator-chevron` |
| View mode switcher | `view-mode-switcher` |
| View mode switcher backdrop | `view-mode-switcher-backdrop` |
| Personal option | `view-mode-option-personal` |
| Group option | `view-mode-option-group-{groupId}` |

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

