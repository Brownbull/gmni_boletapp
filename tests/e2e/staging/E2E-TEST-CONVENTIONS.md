# E2E Test Conventions

Reference guide for creating consistent, screenshot-rich e2e tests in the BoletApp project.

## Overview

E2E tests in this project follow a "journey" pattern with explicit screenshots at each step. This provides:
- Visual documentation of test flows
- Easy debugging when tests fail
- Consistent mobile-first testing

## File Structure

```
tests/e2e/
├── staging/                    # Standalone staging tests
│   ├── group-delete-journey.spec.ts
│   └── E2E-TEST-CONVENTIONS.md (this file)
├── multi-user/                 # Multi-user fixture-based tests
│   └── shared-groups.spec.ts
├── fixtures/                   # Test fixtures
│   └── multi-user.ts
└── helpers/                    # Auth and utility helpers
    └── firebase-auth.ts
```

## Test Configuration

### Mobile Viewport (Required)

Always use mobile viewport for realistic testing:

```typescript
test.use({
  viewport: { width: 360, height: 780 },
});
```

### Timeout

Set appropriate timeout for journey tests (60-120 seconds):

```typescript
test.setTimeout(90000); // 90 seconds
```

### Storage State (Standalone Tests)

For standalone tests that handle their own auth:

```typescript
test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 360, height: 780 },
});
```

## Authentication Pattern

### Using Test Login Button

```typescript
// Check if we need to login
const testLoginBtn = page.locator('[data-testid="test-login-button"]');
if (await testLoginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  console.log('  → Clicking Test Login button...');
  await testLoginBtn.click();
  await page.waitForTimeout(500);

  // Click on specific user (alice, bob, charlie, diana)
  const aliceBtn = page.locator('[data-testid="test-user-alice"]');
  await aliceBtn.waitFor({ state: 'visible', timeout: 5000 });
  await aliceBtn.click();
  await page.waitForTimeout(3000);
  console.log('  → Authenticated as Alice');
}
```

### Available Test Users

| User | TestId | Email |
|------|--------|-------|
| Alice | `test-user-alice` | alice@test.local |
| Bob | `test-user-bob` | bob@test.local |
| Charlie | `test-user-charlie` | charlie@test.local |
| Diana | `test-user-diana` | diana@test.local |

## Navigation Pattern

### Profile Avatar → Settings → Grupos

```typescript
// Step 1: Click Profile Avatar
const profileAvatar = page.locator('[data-testid="profile-avatar"]');
await profileAvatar.waitFor({ state: 'visible', timeout: 10000 });
await profileAvatar.click();
await page.waitForTimeout(500);

// Step 2: Click "Ajustes" in dropdown
const ajustesMenuItem = page.locator('text=Ajustes');
await ajustesMenuItem.waitFor({ state: 'visible', timeout: 5000 });
await ajustesMenuItem.click();
await page.waitForTimeout(1000);

// Step 3: Handle subview back button if needed
const backButton = page.locator('[data-testid="settings-back-button"]');
if (await backButton.isVisible({ timeout: 2000 }).catch(() => false)) {
  await backButton.click();
  await page.waitForTimeout(500);
}

// Step 4: Click Grupos menu item
const gruposMenuItem = page.locator('[data-testid="settings-menu-grupos"]');
await gruposMenuItem.waitFor({ state: 'visible', timeout: 10000 });
await gruposMenuItem.click();
await page.waitForTimeout(1000);

// Step 5: Wait for GruposView
await page.waitForSelector('[data-testid="grupos-view"]', { timeout: 10000 });
```

## Screenshot Convention

### Naming Pattern

```
test-results/{story-id}-{step-number}-{description}.png
```

Examples:
- `14d-v2-1-7g-01-app-loaded.png`
- `14d-v2-1-7g-09-edit-dialog-open.png`
- `staging-delete-03-owner-warning.png`

### Taking Screenshots

Always use `fullPage: true` for complete viewport capture:

```typescript
await page.screenshot({
  path: 'test-results/14d-v2-1-7g-01-app-loaded.png',
  fullPage: true,
});
```

### When to Screenshot

Take screenshots at these points:
1. After page/app loads
2. After navigation changes
3. Before and after dialog opens
4. On validation errors
5. Before and after form submission
6. Final state

## Step-by-Step Journey Template

```typescript
test.describe('Feature: {Feature Name} ({Story ID})', () => {
  test.use({
    viewport: { width: 360, height: 780 },
  });

  test.setTimeout(90000);

  test('{Feature} - Full Journey with Screenshots', async ({ page }) => {
    // =========================================================================
    // Step 1: Setup / Authentication
    // =========================================================================
    console.log('Step 1: Loading app...');
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // ... authentication if needed ...

    await page.screenshot({
      path: 'test-results/{story-id}-01-app-loaded.png',
      fullPage: true,
    });
    console.log('✅ App loaded');

    // =========================================================================
    // Step 2: Navigate to Feature
    // =========================================================================
    console.log('Step 2: Navigating to {feature}...');

    // ... navigation code ...

    await page.screenshot({
      path: 'test-results/{story-id}-02-feature-view.png',
      fullPage: true,
    });
    console.log('✅ {Feature} loaded');

    // =========================================================================
    // Step N: Action
    // =========================================================================
    console.log('Step N: {Action description}...');

    // ... action code ...

    await page.screenshot({
      path: 'test-results/{story-id}-0N-action-result.png',
      fullPage: true,
    });
    console.log('✅ {Action} completed');

    // =========================================================================
    // Cleanup (if needed)
    // =========================================================================
    console.log('Cleanup: Removing test data...');
    // ... cleanup code ...

    console.log('\n✅ {Feature} journey completed successfully!');
  });
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
- `edit-btn-{id}` - Edit button on group card
- `leave-btn-{id}` - Leave button on group card

### Dialogs
- `group-name-input` - Group name input field
- `create-btn` - Create button in dialog
- `save-btn` - Save button in edit dialog
- `cancel-btn` - Cancel button
- `edit-group-dialog` - Edit group dialog container
- `discard-confirm-dialog` - Discard confirmation dialog
- `keep-editing-btn` - Keep editing button
- `discard-btn` - Discard button
- `delete-confirm-btn` - Delete confirmation button
- `confirm-name-input` - Name confirmation input (delete)

## Console Logging

Use consistent emoji prefixes:
- `✅` - Success
- `ℹ️` - Info/Skip
- `⚠️` - Warning
- `  →` - Sub-step (indented)

```typescript
console.log('Step 1: Loading app...');
console.log('  → Clicking Test Login button...');
console.log('✅ App loaded');
console.log('ℹ️ No groups found - skipping test');
```

## Running Tests

### Staging Tests (Standalone)

```bash
# Run specific test
npm run test:e2e -- tests/e2e/staging/group-delete-journey.spec.ts

# Run with headed browser (see the browser)
npm run test:e2e -- tests/e2e/staging/group-delete-journey.spec.ts --headed
```

### Multi-User Tests

```bash
# Prerequisites: emulators + dev server running
npm run emulators  # Terminal 1
npm run dev        # Terminal 2

# Run multi-user tests
npm run test:e2e -- tests/e2e/multi-user/

# Run specific test by grep
npm run test:e2e -- tests/e2e/multi-user/shared-groups.spec.ts -g "14d-v2-1-7g"
```

### View Results

```bash
# Open HTML report
npx playwright show-report

# View screenshots
xdg-open test-results/
```

## Cleanup Pattern

Always clean up test data at the end:

```typescript
// Cleanup: Delete the test group
console.log('Cleanup: Deleting test group...');

const leaveBtn = groupCard.locator('[data-testid^="leave-btn-"]');
await leaveBtn.click();
await page.waitForTimeout(500);

const deleteGroupBtn = page.locator('button:has-text("Eliminar Grupo"), button:has-text("Delete Group")');
if (await deleteGroupBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  await deleteGroupBtn.click();
  await page.waitForTimeout(500);

  const confirmInput = page.locator('[data-testid="confirm-name-input"]');
  await confirmInput.fill(groupName);

  const deleteConfirmBtn = page.locator('[data-testid="delete-confirm-btn"]');
  await deleteConfirmBtn.click();
  await page.waitForTimeout(2000);
  console.log('✅ Test group deleted');
}
```

## Example: Complete Test

See these files for complete examples:
- `tests/e2e/staging/group-delete-journey.spec.ts` - Delete group journey
- `tests/e2e/multi-user/shared-groups.spec.ts` - Edit group journey (14d-v2-1-7g)

---

*Last updated: 2026-02-03 | Story 14d-v2-1-7g*
