# E2E Test Conventions

Reference guide for creating consistent, screenshot-rich e2e tests in the BoletApp project.

## E2E Testing Policy

**E2E tests run ONLY against the staging environment** (boletapp-staging). There is no local/emulator-based E2E testing.

```bash
# Standard e2e testing (staging)
npm run test:e2e:staging

# Multi-user tests (staging)
npm run test:e2e:multi-user

# Single spec
npx playwright test tests/e2e/staging/your-test.spec.ts --project=staging

# Headed mode (see browser)
npx playwright test tests/e2e/staging/your-test.spec.ts --project=staging --headed
```

## File Structure

```
tests/e2e/
├── staging/                    # Standalone staging tests
│   ├── verify-staging-ui.spec.ts
│   ├── group-delete-journey.spec.ts
│   ├── view-mode-filtering-journey.spec.ts
│   ├── transaction-sharing-toggle.spec.ts
│   ├── user-sharing-preferences.spec.ts
│   ├── join-flow-opt-in.spec.ts
│   └── E2E-TEST-CONVENTIONS.md (this file)
├── multi-user/                 # Multi-user fixture-based tests
│   └── shared-groups.spec.ts
├── fixtures/                   # Test fixtures
│   └── multi-user.ts
├── helpers/                    # Auth and utility helpers
│   ├── firebase-auth.ts
│   └── staging-helpers.ts      # Shared helpers: login, navigate, create/delete groups
└── global-setup.ts             # Auth setup (skipped for staging/multi-user)
```

## Test Configuration

### Mobile Viewport (Required)

Always use mobile viewport for realistic testing:

```typescript
test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 360, height: 780 },
});
```

### Timeout

Set appropriate timeout for journey tests (60-120 seconds):

```typescript
test.setTimeout(90000); // 90 seconds
```

## Shared Helpers (Preferred)

New E2E specs should import shared helpers instead of duplicating auth/navigation/cleanup code:

```typescript
import { loginAsUser, navigateToGrupos, createGroup, deleteGroupAsOwner, cleanupOldE2EGroups } from '../helpers/staging-helpers';
```

Available helpers:
- `loginAsUser(page, 'alice')` - Login via TestUserMenu
- `navigateToGrupos(page)` - Navigate Settings -> Grupos (starts from home)
- `createGroup(page, name, sharingOn?)` - Create a group with optional sharing toggle
- `getShareCode(page, name)` - Get invite code (handles optimistic PENDING state)
- `enterShareCode(page, code)` - Enter share code to join a group
- `deleteGroupAsOwner(page, name)` - Delete group with type-to-confirm (robust)
- `leaveGroupAsMember(page, name)` - Leave group as non-owner (robust)
- `cleanupOldE2EGroups(page, maxToDelete?)` - Pre-test cleanup of residual E2E groups
- `bidirectionalCleanup(ownerPage, memberPage)` - Multi-user cleanup

See `tests/e2e/helpers/staging-helpers.ts` for full JSDoc and usage.

## Authentication Pattern

### Using Test Login Button

```typescript
const testLoginBtn = page.locator('[data-testid="test-login-button"]');
if (await testLoginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  await testLoginBtn.click();
  await page.waitForTimeout(500);

  const aliceBtn = page.locator('[data-testid="test-user-alice"]');
  await aliceBtn.waitFor({ state: 'visible', timeout: 5000 });
  await aliceBtn.click();
  await page.waitForTimeout(3000);
}
```

### Available Test Users

| User | TestId | Email |
|------|--------|-------|
| Alice | `test-user-alice` | alice@test.local |
| Bob | `test-user-bob` | bob@test.local |
| Charlie | `test-user-charlie` | charlie@test.local |
| Diana | `test-user-diana` | diana@test.local |

## Selector Priority

**ALWAYS use this priority order.** Bare text selectors are fragile in a bilingual (ES/EN) app.

| Priority | Method | When to Use |
|----------|--------|-------------|
| 1 (best) | `[data-testid="..."]` | Always preferred. Check component source for existing testIds. |
| 2 | `getByRole('menuitem', { name: '...' })` | When testId not available but role is clear. |
| 3 | Scoped locator (`.locator('[data-testid="parent"]').locator('button')`) | Within a known container. |
| 4 (avoid) | `text=...` or `has-text("...")` | Last resort only. Breaks on translations, strict mode, accent differences. |

**Known pitfalls:**
- `text=Ajustes` matches 2 elements (breadcrumb + menu item) -> strict mode failure
- `button:has(svg)` matches ANY button with an SVG icon -> ambiguous
- Spanish accents: `sincronizacion` !== `sincronización` -> text selectors fail silently

## Navigation Pattern

### Profile Avatar -> Settings -> Grupos

```typescript
async function navigateToGrupos(page: Page) {
  await page.goto(STAGING_URL);
  await page.waitForTimeout(2000);

  const profileAvatar = page.locator('[data-testid="profile-avatar"]');
  await profileAvatar.waitFor({ state: 'visible', timeout: 10000 });
  await profileAvatar.click();
  await page.waitForTimeout(500);

  // Use getByRole to avoid strict mode violation with bare text=Ajustes
  const ajustesMenuItem = page.getByRole('menuitem', { name: 'Ajustes' });
  await ajustesMenuItem.waitFor({ state: 'visible', timeout: 5000 });
  await ajustesMenuItem.click();
  await page.waitForTimeout(1000);

  const backButton = page.locator('[data-testid="settings-back-button"]');
  if (await backButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await backButton.click();
    await page.waitForTimeout(500);
  }

  const gruposMenuItem = page.locator('[data-testid="settings-menu-grupos"]');
  await gruposMenuItem.waitFor({ state: 'visible', timeout: 10000 });
  await gruposMenuItem.click();
  await page.waitForTimeout(1000);

  await page.waitForSelector('[data-testid="grupos-view"]', { timeout: 10000 });
}
```

**IMPORTANT:** Always start navigation from `page.goto(STAGING_URL)`. This app is a SPA -- after `page.reload()`, the URL resets to home. Never assume the current view persists after reload.

## Waiting Strategies

### Observable State (preferred)

Use element state changes for async operations:

```typescript
// Wait for dialog to close after action completes
await dialog.waitFor({ state: 'hidden', timeout: 15000 });

// Wait for element to appear
await page.waitForSelector('[data-testid="group-card-123"]', { timeout: 10000 });

// Wait for text to change
await expect(locator).not.toHaveText('PENDING...', { timeout: 10000 });
```

### Fixed Timeout (settling only)

Use ONLY for UI settling after clicks/transitions. Keep under 1000ms:

```typescript
await page.waitForTimeout(500);  // OK: settling after click
await page.waitForTimeout(1000); // OK: settling after navigation

// BAD: Never use for async operations
// await page.waitForTimeout(3000); // Use element.waitFor() instead
// await page.waitForTimeout(5000); // Use element.waitFor() instead
```

### NEVER use `networkidle`

Firebase maintains a persistent WebSocket connection. `waitForLoadState('networkidle')` will NEVER resolve:

```typescript
// BAD - hangs forever with Firebase
await page.waitForLoadState('networkidle');

// GOOD - wait for specific element
await page.waitForSelector('[data-testid="grupos-view"]', { timeout: 10000 });
```

## Optimistic Update Handling

React Query optimistic updates create temporary DOM states. Always account for them:

```typescript
// Example: shareCode starts as 'PENDING...' before Firestore resolves
async function getShareCode(page: Page): Promise<string> {
  const MAX_ATTEMPTS = 10;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const text = await page.locator('[data-testid="share-code-display"]').textContent();
    const code = text?.trim() || '';
    // Real share codes are 6 alphanumeric chars
    if (code.length === 6 && /^[A-Z0-9]+$/.test(code)) return code;
    // Still in optimistic/pending state - wait and retry
    await page.waitForTimeout(1000);
  }
  // Fallback: reload to force fresh read from Firestore
  await page.reload();
  await page.waitForTimeout(2000);
  const text = await page.locator('[data-testid="share-code-display"]').textContent();
  return text?.trim() || '';
}
```

**Pre-flight check:** Before writing E2E tests, read the hook code (e.g., `useGroups.ts`) and search for `PENDING`, `temp-`, `loading`, `optimistic` to identify temporary states.

## Multi-User Test Patterns

Use `browser.newContext()` for true multi-user isolation:

```typescript
test('Multi-user join flow', async ({ browser }) => {
  // Create independent contexts with separate auth
  const aliceCtx = await browser.newContext({
    viewport: { width: 360, height: 780 },
    storageState: { cookies: [], origins: [] },
  });
  const bobCtx = await browser.newContext({
    viewport: { width: 360, height: 780 },
    storageState: { cookies: [], origins: [] },
  });

  const ap = await aliceCtx.newPage(); // Alice's page
  const bp = await bobCtx.newPage();   // Bob's page

  try {
    // Login each user independently
    await loginAsUser(ap, 'alice');
    await loginAsUser(bp, 'bob');

    // ... test interactions ...
  } finally {
    // ALWAYS cleanup in finally block - bidirectional for multi-user
    await leaveGroupAsMember(bp, groupName);  // Bob leaves first
    await deleteGroupAsOwner(ap, groupName);  // Then Alice deletes
    await aliceCtx.close();
    await bobCtx.close();
  }
});
```

## Cleanup Pattern

### ALWAYS use try/finally

```typescript
test('Feature journey', async ({ page }) => {
  let groupName = '';

  try {
    groupName = `E2E Test ${Date.now()}`;
    // ... test code that creates data ...
  } finally {
    // Cleanup runs even if test fails
    if (groupName) {
      await deleteTestGroup(page, groupName);
    }
  }
});
```

### Pre-Test Cleanup

Clean up residual data from previous failed runs BEFORE creating new data:

```typescript
test.beforeEach(async ({ page }) => {
  await navigateToGrupos(page);
  await cleanupOldE2EGroups(page);
});

async function cleanupOldE2EGroups(page: Page) {
  const groupCards = page.locator('[data-testid^="group-card-"]');
  const count = await groupCards.count();
  for (let i = count - 1; i >= 0; i--) {
    const card = groupCards.nth(i);
    const name = await card.locator('[data-testid^="group-name-"]').textContent();
    if (name?.includes('E2E')) {
      await deleteGroup(page, card);
    }
  }
}
```

### Multi-User Cleanup (Bidirectional)

For groups with multiple members, cleanup must be bidirectional:

1. Non-owner leaves the group first (removes membership)
2. Owner deletes the group (removes the group itself)

```typescript
// In finally block:
await leaveGroupAsMember(bobPage, groupName);   // Bob leaves
await deleteGroupAsOwner(alicePage, groupName);  // Alice deletes
```

### Test Data Naming

Always use identifiable names for cleanup targeting:

```typescript
const groupName = `E2E Test ${Date.now()}`; // Unique, identifiable, cleanable
```

## Screenshot Convention

### Naming Pattern

```
test-results/{story-id}-{step-number}-{description}.png
```

### When to Screenshot

1. After page/app loads
2. After navigation changes
3. Before and after dialog opens
4. On validation errors
5. Before and after form submission
6. Final state

```typescript
await page.screenshot({
  path: 'test-results/14d-v2-1-14-01-app-loaded.png',
  fullPage: true,
});
```

## Common TestIds

### Navigation
- `profile-avatar` - Profile avatar in header
- `settings-back-button` - Back button in settings
- `settings-menu-grupos` - Grupos menu item

### Grupos View
- `grupos-view` - Main grupos view container
- `create-group-btn` - Create group button
- `create-group-btn-empty` - Create button in empty state
- `group-card-{id}` - Group card container
- `group-name-{id}` - Group name text
- `edit-btn-{id}` - Edit button on group card
- `leave-btn-{id}` - Leave button on group card

### Dialogs
- `group-name-input` - Group name input field
- `create-btn` - Create button in dialog
- `save-btn` - Save button in edit dialog
- `cancel-btn` - Cancel button
- `edit-group-dialog` - Edit group dialog container
- `delete-confirm-btn` - Delete confirmation button
- `confirm-name-input` - Name confirmation input (delete)
- `leave-group-confirm-btn` - Leave group confirmation button
- `opt-in-dialog` - Transaction sharing opt-in dialog
- `opt-in-yes-option` - Opt-in yes option
- `opt-in-no-option` - Opt-in no option
- `opt-in-confirm-btn` - Opt-in confirm button

### ViewModeSwitcher
- `app-logo-button` - Clickable button to open ViewModeSwitcher
- `view-mode-switcher` - Dropdown container
- `view-mode-option-personal` - Personal mode option
- `view-mode-option-group-{id}` - Group option (dynamic)
- `group-mode-icon` - Header icon when in group mode

## Common Issues and Solutions

### BC-1 Group Limit (10 groups max)

Alice in staging can hit the BC-1 limit of 10 groups. Pre-test cleanup prevents this:

```typescript
// Always run cleanup BEFORE creating test data
await cleanupOldE2EGroups(page);

// Check if create button is still disabled after cleanup
const createBtn = page.locator('[data-testid="create-btn"]');
if (await createBtn.isDisabled().catch(() => false)) {
  test.skip(true, 'BC-1 limit reached even after cleanup');
}
```

### Dialog Backdrop Blocking Clicks

After closing a dialog, wait for the dialog element to be hidden:

```typescript
await deleteConfirmBtn.click();
// Wait for dialog to fully close (observable state, not fixed timeout)
await dialog.waitFor({ state: 'hidden', timeout: 10000 });
```

### SPA Navigation After Reload

This app resets to the home view on reload. Always re-navigate:

```typescript
await page.reload();
await page.waitForTimeout(2000);
// Must re-navigate - don't assume current view persists
await navigateToGrupos(page);
```

### Locator Strict Mode Violations

When a locator matches multiple elements, Playwright throws in strict mode:

```typescript
// BAD - text=Ajustes matches breadcrumb + menu item
const ajustes = page.locator('text=Ajustes');

// GOOD - role-based, unambiguous
const ajustes = page.getByRole('menuitem', { name: 'Ajustes' });
```

## Staging Project Configuration

Staging tests use their own Playwright project that skips global setup:

```typescript
// In playwright.config.ts
{
  name: 'staging',
  use: {
    storageState: { cookies: [], origins: [] },
  },
  testMatch: ['**/staging/**/*.spec.ts'],
}
```

## Example References

See these files for battle-tested patterns:
- `tests/e2e/staging/join-flow-opt-in.spec.ts` - Multi-user join flow with optimistic update handling, bidirectional cleanup, try/finally
- `tests/e2e/staging/group-delete-journey.spec.ts` - Delete group journey
- `tests/e2e/staging/view-mode-filtering-journey.spec.ts` - View mode with data filtering

---

*Last updated: 2026-02-05 | E2E Lessons Learned retrospective*
