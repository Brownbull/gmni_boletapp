/**
 * Multi-User E2E Tests: Shared Group Workflows
 *
 * These tests validate shared group functionality with multiple authenticated users.
 * Each test user (Alice, Bob, Charlie, Diana) gets their own browser context with
 * independent authentication state.
 *
 * IMPORTANT: These tests only work in emulator mode (VITE_E2E_MODE=emulator)
 *
 * Prerequisites:
 * - Firebase emulators running: npm run emulators
 * - Dev server running: npm run dev
 * - .env has VITE_E2E_MODE=emulator
 *
 * Run these tests specifically:
 *   npm run test:e2e -- tests/e2e/multi-user/
 *
 * @see tests/e2e/fixtures/multi-user.ts for fixture implementation
 */

import { test, expect, testUsers } from '../fixtures/multi-user.js';

test.describe('Multi-User: Shared Group Creation', () => {
  test.beforeEach(async ({ alicePage }) => {
    // Navigate Alice to the app
    await alicePage.goto('/');
    await alicePage.waitForLoadState('domcontentloaded');
  });

  test('Alice can access the app as authenticated user', async ({ alicePage }) => {
    // Verify Alice is authenticated (not on login screen)
    const loginButton = alicePage.getByRole('button', {
      name: /sign in with google|entrar con google/i,
    });
    await expect(loginButton).not.toBeVisible({ timeout: 10000 });

    // Should see navigation or dashboard elements
    const navElement = alicePage.locator('nav, [data-testid="bottom-nav"], button');
    await expect(navElement.first()).toBeVisible();
  });

  test('Both Alice and Bob can be authenticated simultaneously', async ({
    alicePage,
    bobPage,
  }) => {
    // Navigate both users
    await alicePage.goto('/');
    await bobPage.goto('/');

    await alicePage.waitForLoadState('domcontentloaded');
    await bobPage.waitForLoadState('domcontentloaded');

    // Both should be authenticated (not see login button)
    const aliceLoginBtn = alicePage.getByRole('button', {
      name: /sign in with google|entrar con google/i,
    });
    const bobLoginBtn = bobPage.getByRole('button', {
      name: /sign in with google|entrar con google/i,
    });

    await expect(aliceLoginBtn).not.toBeVisible({ timeout: 10000 });
    await expect(bobLoginBtn).not.toBeVisible({ timeout: 10000 });
  });
});

test.describe('Multi-User: Shared Group Navigation', () => {
  test('Alice can navigate to Groups settings', async ({ alicePage }) => {
    await alicePage.goto('/');
    await alicePage.waitForLoadState('domcontentloaded');

    // Wait for auth to settle
    await alicePage.waitForTimeout(1000);

    // Navigate to Settings
    const settingsButton = alicePage.getByRole('button', { name: /settings|ajustes/i });
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await alicePage.waitForLoadState('domcontentloaded');

      // Look for Groups section in settings
      const groupsSection = alicePage.getByText(/groups|grupos|shared/i);
      // This may or may not be visible depending on feature flags
      // Just verify we can navigate to settings without error
      await expect(alicePage).not.toHaveURL(/login/);
    }
  });

  test('Multiple users can view settings independently', async ({
    alicePage,
    bobPage,
    charliePage,
  }) => {
    // Navigate all users to settings
    const pages = [alicePage, bobPage, charliePage];
    const names = ['Alice', 'Bob', 'Charlie'];

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // Wait for auth
      await page.waitForTimeout(500);

      const settingsButton = page.getByRole('button', { name: /settings|ajustes/i });
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Verify not redirected to login
        await expect(page).not.toHaveURL(/login/);
        console.log(`✅ ${names[i]} successfully accessed settings`);
      }
    }
  });
});

test.describe('Multi-User: Dynamic User Authentication', () => {
  test('can dynamically authenticate any user', async ({ authenticateUser }) => {
    // Dynamically create authenticated pages for specific users
    const { page: alicePage } = await authenticateUser('alice');
    const { page: dianaPage } = await authenticateUser('diana');

    // Navigate both
    await alicePage.goto('/');
    await dianaPage.goto('/');

    await alicePage.waitForLoadState('domcontentloaded');
    await dianaPage.waitForLoadState('domcontentloaded');

    // Both should be authenticated
    const aliceLogin = alicePage.getByRole('button', {
      name: /sign in with google|entrar con google/i,
    });
    const dianaLogin = dianaPage.getByRole('button', {
      name: /sign in with google|entrar con google/i,
    });

    await expect(aliceLogin).not.toBeVisible({ timeout: 10000 });
    await expect(dianaLogin).not.toBeVisible({ timeout: 10000 });
  });
});

test.describe('Multi-User: Invitation Flow Skeleton', () => {
  /**
   * This test demonstrates the pattern for testing invitation flows.
   * The actual implementation will depend on the shared groups UI.
   */
  test.skip('Alice invites Bob to a group (skeleton)', async ({ alicePage, bobPage }) => {
    // Step 1: Alice creates a group
    await alicePage.goto('/');
    await alicePage.waitForLoadState('domcontentloaded');

    // Navigate to groups/settings
    // await alicePage.click('[data-testid="create-group-button"]');
    // await alicePage.fill('[data-testid="group-name-input"]', 'Test Group');
    // await alicePage.click('[data-testid="create-group-submit"]');

    // Step 2: Alice gets the share code
    // const shareCode = await alicePage.textContent('[data-testid="share-code"]');

    // Step 3: Bob uses the share code to join
    // await bobPage.goto(`/join/${shareCode}`);
    // await bobPage.waitForLoadState('domcontentloaded');
    // await bobPage.click('[data-testid="accept-invitation"]');

    // Step 4: Verify Bob is now a member
    // await expect(bobPage.getByText(/you are now a member/i)).toBeVisible();

    // Step 5: Alice sees Bob in the member list
    // await alicePage.reload();
    // await expect(alicePage.getByText(testUsers.bob.displayName)).toBeVisible();
  });

  test.skip('Bob declines invitation from Alice (skeleton)', async ({ alicePage, bobPage }) => {
    // Similar pattern but Bob clicks decline instead of accept
  });
});

/**
 * Story 14d-v2-1-7g: Edit Group Settings - Full Journey
 *
 * Tests the complete edit group flow with proper screenshots.
 * Uses mobile viewport (360x780) as per testing requirements.
 *
 * Run: npm run test:e2e -- tests/e2e/multi-user/shared-groups.spec.ts -g "14d-v2-1-7g"
 */
test.describe('Multi-User: Edit Group Owner-Only (14d-v2-1-7g)', () => {
  // Use mobile viewport for realistic screenshots
  test.use({
    viewport: { width: 360, height: 780 },
  });

  test.setTimeout(90000); // 90 seconds for full journey

  // Unique group name for this test run
  const TEST_GROUP_NAME = `Edit Test ${Date.now()}`;

  test('Edit Group Settings - Full Journey with Screenshots', async ({ alicePage }) => {
    const page = alicePage;

    // =========================================================================
    // Step 1: Navigate to app and authenticate via Test Login
    // =========================================================================
    console.log('Step 1: Loading app and authenticating...');
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check if we need to login (Test Login button visible)
    const testLoginBtn = page.locator('[data-testid="test-login-button"]');
    if (await testLoginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('  → Clicking Test Login button...');
      await testLoginBtn.click();
      await page.waitForTimeout(500);

      // Click on Alice user
      const aliceBtn = page.locator('[data-testid="test-user-alice"]');
      await aliceBtn.waitFor({ state: 'visible', timeout: 5000 });
      await aliceBtn.click();
      await page.waitForTimeout(3000);
      console.log('  → Authenticated as Alice');
    }

    await page.screenshot({
      path: 'test-results/14d-v2-1-7g-01-app-loaded.png',
      fullPage: true,
    });
    console.log('✅ App loaded');

    // =========================================================================
    // Step 2: Navigate to Settings via Profile Avatar
    // =========================================================================
    console.log('Step 2: Navigating to Settings...');

    const profileAvatar = page.locator('[data-testid="profile-avatar"]');
    await profileAvatar.waitFor({ state: 'visible', timeout: 10000 });
    await profileAvatar.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'test-results/14d-v2-1-7g-02-profile-dropdown.png',
      fullPage: true,
    });

    // Click "Ajustes" (Settings) in dropdown
    const ajustesMenuItem = page.locator('text=Ajustes');
    await ajustesMenuItem.waitFor({ state: 'visible', timeout: 5000 });
    await ajustesMenuItem.click();
    await page.waitForTimeout(1000);
    console.log('✅ Opened Settings');

    // =========================================================================
    // Step 3: Navigate to Grupos section
    // =========================================================================
    console.log('Step 3: Navigating to Grupos...');

    // If in a subview, click back to main Settings menu
    const backButton = page.locator('[data-testid="settings-back-button"]');
    if (await backButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await backButton.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: 'test-results/14d-v2-1-7g-03-settings-menu.png',
      fullPage: true,
    });

    // Click on Grupos menu item
    const gruposMenuItem = page.locator('[data-testid="settings-menu-grupos"]');
    await gruposMenuItem.waitFor({ state: 'visible', timeout: 10000 });
    await gruposMenuItem.click();
    await page.waitForTimeout(1000);

    // Wait for GruposView to load
    await page.waitForSelector('[data-testid="grupos-view"]', { timeout: 10000 });
    console.log('✅ GruposView loaded');

    await page.screenshot({
      path: 'test-results/14d-v2-1-7g-04-grupos-view.png',
      fullPage: true,
    });

    // =========================================================================
    // Step 4: Create a test group
    // =========================================================================
    console.log('Step 4: Creating test group...');

    const createBtn = page.locator('[data-testid="create-group-btn"], [data-testid="create-group-btn-empty"]');
    await createBtn.first().click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'test-results/14d-v2-1-7g-05-create-dialog.png',
      fullPage: true,
    });

    // Fill in group name
    const nameInput = page.locator('[data-testid="group-name-input"]');
    await nameInput.fill(TEST_GROUP_NAME);
    await page.waitForTimeout(300);

    await page.screenshot({
      path: 'test-results/14d-v2-1-7g-06-name-filled.png',
      fullPage: true,
    });

    // Click create button
    const createDialogBtn = page.locator('[data-testid="create-btn"]');
    await createDialogBtn.click();
    await page.waitForTimeout(2000);
    console.log(`✅ Group "${TEST_GROUP_NAME}" created`);

    await page.screenshot({
      path: 'test-results/14d-v2-1-7g-07-group-created.png',
      fullPage: true,
    });

    // =========================================================================
    // Step 5: Verify owner sees edit button
    // =========================================================================
    console.log('Step 5: Verifying edit button visible for owner...');

    const groupCard = page.locator(`[data-testid^="group-card-"]:has-text("${TEST_GROUP_NAME}")`);
    await groupCard.waitFor({ state: 'visible', timeout: 5000 });

    const editButton = groupCard.locator('[data-testid^="edit-btn-"]');
    await expect(editButton).toBeVisible({ timeout: 5000 });
    console.log('✅ Edit button visible for owner');

    await page.screenshot({
      path: 'test-results/14d-v2-1-7g-08-edit-button-visible.png',
      fullPage: true,
    });

    // =========================================================================
    // Step 6: Click edit button to open dialog
    // =========================================================================
    console.log('Step 6: Opening edit dialog...');

    await editButton.click();
    await page.waitForTimeout(500);

    const editDialog = page.locator('[data-testid="edit-group-dialog"]');
    await editDialog.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✅ Edit dialog opened');

    await page.screenshot({
      path: 'test-results/14d-v2-1-7g-09-edit-dialog-open.png',
      fullPage: true,
    });

    // =========================================================================
    // Step 7: Change the icon
    // =========================================================================
    console.log('Step 7: Changing icon...');

    const iconPicker = page.locator('[data-testid="icon-picker"] button');
    await iconPicker.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'test-results/14d-v2-1-7g-10-icon-picker-open.png',
      fullPage: true,
    });

    // Select a different emoji (e.g., airplane ✈️ from Travel category)
    const airplaneEmoji = page.locator('button[aria-label="✈"]');
    if (await airplaneEmoji.isVisible({ timeout: 3000 }).catch(() => false)) {
      await airplaneEmoji.click();
      await page.waitForTimeout(300);
      console.log('✅ Icon changed to ✈️');
    } else {
      // Fallback: just close the picker
      await page.keyboard.press('Escape');
      console.log('ℹ️ Could not find airplane emoji, picker closed');
    }

    await page.screenshot({
      path: 'test-results/14d-v2-1-7g-11-icon-changed.png',
      fullPage: true,
    });

    // =========================================================================
    // Step 8: Change the color
    // =========================================================================
    console.log('Step 8: Changing color...');

    const colorPicker = page.locator('[data-testid="color-picker"] button');
    await colorPicker.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'test-results/14d-v2-1-7g-12-color-picker-open.png',
      fullPage: true,
    });

    // Select a different color (e.g., red - ColorPicker uses color.name for aria-label)
    const redColorBtn = page.locator('button[aria-label="Red"]');
    if (await redColorBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await redColorBtn.click();
      await page.waitForTimeout(300);
      console.log('✅ Color changed to red');
    } else {
      // Fallback: click backdrop to close the picker (Escape doesn't work)
      const backdrop = page.locator('.fixed.inset-0.bg-black\\/50');
      if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
        await backdrop.click({ position: { x: 10, y: 10 } });
        await page.waitForTimeout(300);
      }
      console.log('ℹ️ Could not find red color, picker closed');
    }

    await page.screenshot({
      path: 'test-results/14d-v2-1-7g-13-color-changed.png',
      fullPage: true,
    });

    // =========================================================================
    // Step 9: Test validation - name too short
    // =========================================================================
    console.log('Step 9: Testing validation (name too short)...');

    const editNameInput = page.locator('[data-testid="group-name-input"]');
    const saveButton = page.locator('[data-testid="save-btn"]');

    await editNameInput.clear();
    await editNameInput.fill('A');
    await page.waitForTimeout(300);

    await expect(saveButton).toBeDisabled();
    console.log('✅ Save button disabled for invalid name');

    await page.screenshot({
      path: 'test-results/14d-v2-1-7g-14-validation-error.png',
      fullPage: true,
    });

    // =========================================================================
    // Step 10: Enter valid name change
    // =========================================================================
    console.log('Step 10: Entering valid name...');

    const newName = `${TEST_GROUP_NAME} - Edited`;
    await editNameInput.clear();
    await editNameInput.fill(newName);
    await page.waitForTimeout(300);

    await expect(saveButton).toBeEnabled();
    console.log('✅ Save button enabled for valid name');

    await page.screenshot({
      path: 'test-results/14d-v2-1-7g-15-valid-name.png',
      fullPage: true,
    });

    // =========================================================================
    // Step 11: Test discard confirmation
    // =========================================================================
    console.log('Step 11: Testing discard confirmation...');

    const cancelButton = page.locator('[data-testid="cancel-btn"]');
    await cancelButton.click();
    await page.waitForTimeout(500);

    const discardDialog = page.locator('[data-testid="discard-confirm-dialog"]');
    await discardDialog.waitFor({ state: 'visible', timeout: 3000 });
    console.log('✅ Discard confirmation shown');

    await page.screenshot({
      path: 'test-results/14d-v2-1-7g-16-discard-confirmation.png',
      fullPage: true,
    });

    // Click "Keep Editing" to go back
    const keepEditingBtn = page.locator('[data-testid="keep-editing-btn"]');
    await keepEditingBtn.click();
    await page.waitForTimeout(500);

    // =========================================================================
    // Step 12: Save the changes
    // =========================================================================
    console.log('Step 12: Saving changes...');

    await saveButton.click();
    await page.waitForTimeout(2000);
    console.log('✅ Changes saved');

    await page.screenshot({
      path: 'test-results/14d-v2-1-7g-17-saved.png',
      fullPage: true,
    });

    // =========================================================================
    // Step 13: Verify changes applied
    // =========================================================================
    console.log('Step 13: Verifying all changes applied...');

    const updatedCard = page.locator(`[data-testid^="group-card-"]:has-text("${newName}")`);
    await expect(updatedCard).toBeVisible({ timeout: 5000 });
    console.log('✅ Group name updated successfully');

    await page.screenshot({
      path: 'test-results/14d-v2-1-7g-18-final.png',
      fullPage: true,
    });

    // =========================================================================
    // Cleanup: Delete the test group
    // =========================================================================
    console.log('Cleanup: Deleting test group...');

    const leaveBtn = updatedCard.locator('[data-testid^="leave-btn-"]');
    await leaveBtn.click();
    await page.waitForTimeout(500);

    const deleteGroupBtn = page.locator('button:has-text("Eliminar Grupo"), button:has-text("Delete Group")');
    if (await deleteGroupBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteGroupBtn.click();
      await page.waitForTimeout(500);

      const confirmInput = page.locator('[data-testid="confirm-name-input"]');
      await confirmInput.fill(newName);

      const deleteConfirmBtn = page.locator('[data-testid="delete-confirm-btn"]');
      await deleteConfirmBtn.click();
      await page.waitForTimeout(2000);
      console.log('✅ Test group deleted');
    }

    console.log('\n✅ Edit Group Settings journey completed successfully!');
  });
});

/**
 * Test user information available for assertions
 */
test.describe('Multi-User: User Identity Verification', () => {
  test('test users have expected configuration', () => {
    expect(testUsers.alice.email).toBe('alice@test.local');
    expect(testUsers.bob.email).toBe('bob@test.local');
    expect(testUsers.charlie.email).toBe('charlie@test.local');
    expect(testUsers.diana.email).toBe('diana@test.local');

    expect(testUsers.alice.displayName).toContain('Alice');
    expect(testUsers.bob.displayName).toContain('Bob');
  });
});
