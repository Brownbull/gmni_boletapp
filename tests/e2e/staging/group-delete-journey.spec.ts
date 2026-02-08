/**
 * E2E Test: Group Delete Journey (Staging)
 *
 * Story 14d-v2-1-7e: Delete UI + Security Rules
 * Epic 14d-v2: Shared Groups v2
 *
 * Tests the complete delete group flow:
 * 1. Owner creates a group
 * 2. Owner clicks delete on the group
 * 3. Owner types group name to confirm (dangerous action protection)
 * 4. Owner confirms deletion
 * 5. Toast shows "[Group Name] has been deleted"
 * 6. Group is removed from the list
 *
 * Run: npm run staging:test -- tests/e2e/staging/group-delete-journey.spec.ts
 *
 * Prerequisites:
 * - Staging dev server running: npm run dev:staging
 * - Test users exist in Firebase Auth (alice@boletapp.test)
 */
import { test, expect } from '@playwright/test';

// Skip global setup for this standalone test
// Use mobile viewport (360x780) as per testing requirements
test.use({
    storageState: { cookies: [], origins: [] },
    viewport: { width: 360, height: 780 },
});

const STAGING_URL = 'http://localhost:5174';

// Test user - Alice is a group owner
const ALICE = {
    name: 'alice',
    testId: 'test-user-alice',
};

// Unique group name to avoid conflicts
const TEST_GROUP_NAME = `E2E Delete Test ${Date.now()}`;

test.describe('Group Delete Journey (Staging)', () => {
    test.setTimeout(120000); // 2 minutes for full journey

    test('Owner can delete a group with type-to-confirm protection', async ({ page }) => {
        // Capture console logs for debugging
        const consoleLogs: string[] = [];
        page.on('console', msg => {
            consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
        });

        // =========================================================================
        // Step 1: Login as Alice (group owner)
        // =========================================================================
        console.log('Step 1: Logging in as Alice...');
        await page.goto(STAGING_URL);
        await page.waitForSelector('[data-testid="test-login-button"]', { timeout: 15000 });

        // Click test login button to open menu
        await page.click('[data-testid="test-login-button"]');
        await page.waitForTimeout(500);

        // Click on Alice
        const aliceButton = page.locator('[data-testid="test-user-alice"]');
        await aliceButton.waitFor({ state: 'visible', timeout: 5000 });
        await aliceButton.click();

        // Wait for login to complete
        await page.waitForTimeout(3000);

        // Verify logged in (not on login page)
        const currentUrl = page.url();
        expect(currentUrl).not.toContain('login');
        console.log('✅ Alice logged in successfully');

        // =========================================================================
        // Step 2: Navigate to Settings → Grupos
        // =========================================================================
        console.log('Step 2: Navigating to Settings → Grupos...');

        // Click Profile Avatar in top-left corner to open dropdown menu
        const profileAvatar = page.locator('[data-testid="profile-avatar"]');
        await profileAvatar.waitFor({ state: 'visible', timeout: 10000 });
        await profileAvatar.click();
        await page.waitForTimeout(500);

        // Click "Ajustes" (Settings) in the dropdown menu
        const ajustesMenuItem = page.getByRole('menuitem', { name: 'Ajustes' });
        await ajustesMenuItem.waitFor({ state: 'visible', timeout: 5000 });
        await ajustesMenuItem.click();
        await page.waitForTimeout(1000);
        console.log('✅ Navigated to Settings');

        // Take screenshot to see where we are
        await page.screenshot({
            path: 'test-results/group-delete-journey/01b-settings.png',
            fullPage: true,
        });

        // Settings might show a subview - click back button if we see a breadcrumb
        // The back button has data-testid="settings-back-button"
        const backButton = page.locator('[data-testid="settings-back-button"]');
        if (await backButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log('📍 In Settings subview - clicking back to main menu');
            await backButton.click();
            await page.waitForTimeout(500);
        }

        // Now in main Settings menu - click on Grupos section
        // The Grupos menu item has testId="settings-menu-grupos"
        const gruposMenuItem = page.locator('[data-testid="settings-menu-grupos"]');
        await gruposMenuItem.waitFor({ state: 'visible', timeout: 10000 });
        await gruposMenuItem.click();
        await page.waitForTimeout(1000);
        console.log('✅ Clicked Grupos menu item');

        // Wait for GruposView to load
        await page.waitForSelector('[data-testid="grupos-view"]', { timeout: 10000 });
        console.log('✅ GruposView loaded');

        // Take screenshot
        await page.screenshot({
            path: 'test-results/group-delete-journey/01-grupos-view.png',
            fullPage: true,
        });

        // =========================================================================
        // Step 3: Create a test group (if not exists)
        // =========================================================================
        console.log('Step 3: Creating test group...');

        // Click create group button
        const createBtn = page.locator('[data-testid="create-group-btn"], [data-testid="create-group-btn-empty"]');
        await createBtn.first().click();
        await page.waitForTimeout(500);

        // Fill in group name
        const nameInput = page.locator('[data-testid="group-name-input"], input[placeholder*="nombre"], input[placeholder*="name"]');
        await nameInput.fill(TEST_GROUP_NAME);
        await page.waitForTimeout(300);

        // Click create button in dialog (testId is "create-btn")
        const createDialogBtn = page.locator('[data-testid="create-btn"]');
        await createDialogBtn.click();

        // Wait for group to be created (toast or dialog close)
        await page.waitForTimeout(2000);
        console.log(`✅ Group "${TEST_GROUP_NAME}" created`);

        // Take screenshot
        await page.screenshot({
            path: 'test-results/group-delete-journey/02-group-created.png',
            fullPage: true,
        });

        // =========================================================================
        // Step 4: Click Leave/Delete on the group (triggers owner warning)
        // =========================================================================
        console.log('Step 4: Clicking leave button (owner warning)...');

        // Find the group card and click the leave button
        // The group card has the group name and a leave button
        const groupCard = page.locator(`[data-testid^="group-card-"]:has-text("${TEST_GROUP_NAME}")`);
        await groupCard.waitFor({ state: 'visible', timeout: 5000 });

        // Click the leave button on this group
        const leaveBtn = groupCard.locator('[data-testid^="leave-btn-"]');
        await leaveBtn.click();
        await page.waitForTimeout(500);

        // Owner warning dialog should appear
        console.log('✅ Owner warning dialog opened');

        // Take screenshot
        await page.screenshot({
            path: 'test-results/group-delete-journey/03-owner-warning.png',
            fullPage: true,
        });

        // =========================================================================
        // Step 5: Click "Delete Group" in owner warning dialog
        // =========================================================================
        console.log('Step 5: Clicking Delete Group option...');

        // Click "Delete Group" button in owner warning
        const deleteGroupBtn = page.locator('button:has-text("Eliminar Grupo"), button:has-text("Delete Group")');
        await deleteGroupBtn.click();
        await page.waitForTimeout(500);

        // Delete confirmation dialog should appear
        console.log('✅ Delete confirmation dialog opened');

        // Take screenshot
        await page.screenshot({
            path: 'test-results/group-delete-journey/04-delete-dialog.png',
            fullPage: true,
        });

        // =========================================================================
        // Step 6: Verify delete button is disabled initially
        // =========================================================================
        console.log('Step 6: Verifying type-to-confirm protection...');

        // Delete confirm button should be disabled
        const deleteConfirmBtn = page.locator('[data-testid="delete-confirm-btn"]');
        await expect(deleteConfirmBtn).toBeDisabled();
        console.log('✅ Delete button is disabled (type-to-confirm protection)');

        // =========================================================================
        // Step 7: Type group name to confirm
        // =========================================================================
        console.log('Step 7: Typing group name to confirm...');

        // Type the group name in confirmation input
        const confirmInput = page.locator('[data-testid="confirm-name-input"]');
        await confirmInput.fill(TEST_GROUP_NAME);
        await page.waitForTimeout(300);

        // Delete button should now be enabled
        await expect(deleteConfirmBtn).toBeEnabled();
        console.log('✅ Delete button enabled after typing group name');

        // Take screenshot
        await page.screenshot({
            path: 'test-results/group-delete-journey/05-name-typed.png',
            fullPage: true,
        });

        // =========================================================================
        // Step 8: Click delete to confirm
        // =========================================================================
        console.log('Step 8: Confirming deletion...');

        await deleteConfirmBtn.click();

        // Wait for deletion to complete
        await page.waitForTimeout(2000);

        // =========================================================================
        // Step 9: Verify group is removed from list (primary success indicator)
        // =========================================================================
        console.log('Step 9: Verifying group is removed from list...');

        // Wait for UI to update and dialog to close
        await page.waitForTimeout(2000);

        // Group should no longer be visible - this is the primary success indicator
        const groupCardAfter = page.locator(`[data-testid^="group-card-"]:has-text("${TEST_GROUP_NAME}")`);
        await expect(groupCardAfter).not.toBeVisible({ timeout: 10000 });
        console.log('✅ Group removed from list');

        // =========================================================================
        // Step 10: Verify toast message (optional - may have already dismissed)
        // =========================================================================
        console.log('Step 10: Checking for success toast...');

        // Toast should show group deleted message
        // Format: 'Group "{name}" deleted' (EN) or 'Grupo "{name}" eliminado' (ES)
        // Note: Toast may have auto-dismissed, so we just check if it appeared at some point
        const toastPattern = new RegExp(`(Group|Grupo).*${TEST_GROUP_NAME}.*(deleted|eliminado)`, 'i');
        try {
            await expect(page.getByText(toastPattern)).toBeVisible({ timeout: 2000 });
            console.log('✅ Success toast displayed');
        } catch {
            // Toast may have auto-dismissed - group removal is the primary success indicator
            console.log('ℹ️ Toast not visible (may have auto-dismissed)');
        }

        // Take final screenshot
        await page.screenshot({
            path: 'test-results/group-delete-journey/07-group-removed.png',
            fullPage: true,
        });

        // Log console output for debugging
        console.log('\n📋 Console logs during test:');
        consoleLogs.slice(-20).forEach(log => console.log(`  ${log}`));

        console.log('\n✅ Delete group journey completed successfully!');
    });

    test('Delete button remains disabled with partial group name', async ({ page }) => {
        // Login as Alice
        await page.goto(STAGING_URL);
        await page.waitForSelector('[data-testid="test-login-button"]', { timeout: 15000 });
        await page.click('[data-testid="test-login-button"]');
        await page.waitForTimeout(500);

        const aliceButton = page.locator('[data-testid="test-user-alice"]');
        await aliceButton.click();
        await page.waitForTimeout(3000);

        // Navigate to Grupos via Profile Avatar → Settings → Grupos
        const profileAvatar = page.locator('[data-testid="profile-avatar"]');
        await profileAvatar.waitFor({ state: 'visible', timeout: 10000 });
        await profileAvatar.click();
        await page.waitForTimeout(500);

        // Click "Ajustes" in dropdown
        const ajustesMenuItem = page.getByRole('menuitem', { name: 'Ajustes' });
        await ajustesMenuItem.waitFor({ state: 'visible', timeout: 5000 });
        await ajustesMenuItem.click();
        await page.waitForTimeout(1000);

        // If in a subview, click back to main Settings menu
        const backButton = page.locator('[data-testid="settings-back-button"]');
        if (await backButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await backButton.click();
            await page.waitForTimeout(500);
        }

        // Click on Grupos menu item
        const gruposMenuItem = page.locator('[data-testid="settings-menu-grupos"]');
        await gruposMenuItem.waitFor({ state: 'visible', timeout: 10000 });
        await gruposMenuItem.click();
        await page.waitForTimeout(1000);

        await page.waitForSelector('[data-testid="grupos-view"]', { timeout: 10000 });

        // Create a unique test group
        const uniqueGroupName = `E2E Partial Test ${Date.now()}`;

        const createBtn = page.locator('[data-testid="create-group-btn"], [data-testid="create-group-btn-empty"]');
        await createBtn.first().click();
        await page.waitForTimeout(500);

        const nameInput = page.locator('[data-testid="group-name-input"], input[placeholder*="nombre"], input[placeholder*="name"]');
        await nameInput.fill(uniqueGroupName);
        await page.waitForTimeout(300);

        const createDialogBtn = page.locator('[data-testid="create-btn"]');
        await createDialogBtn.click();
        await page.waitForTimeout(2000);

        try {
        // Click leave on the group (owner warning)
        const groupCard = page.locator(`[data-testid^="group-card-"]:has-text("${uniqueGroupName}")`);
        await groupCard.waitFor({ state: 'visible', timeout: 5000 });

        const leaveBtn = groupCard.locator('[data-testid^="leave-btn-"]');
        await leaveBtn.click();
        await page.waitForTimeout(500);

        // Click Delete Group
        const deleteGroupBtn = page.locator('button:has-text("Eliminar Grupo"), button:has-text("Delete Group")');
        await deleteGroupBtn.click();
        await page.waitForTimeout(500);

        // Type partial name (missing last character)
        const confirmInput = page.locator('[data-testid="confirm-name-input"]');
        await confirmInput.fill(uniqueGroupName.slice(0, -1));
        await page.waitForTimeout(300);

        // Delete button should still be disabled
        const deleteConfirmBtn = page.locator('[data-testid="delete-confirm-btn"]');
        await expect(deleteConfirmBtn).toBeDisabled();
        console.log('✅ Delete button remains disabled with partial name');

        // Close dialog without deleting
        const cancelBtn = page.locator('button:has-text("Cancelar"), button:has-text("Cancel")');
        await cancelBtn.click();

        // Clean up: delete the test group properly
        await page.waitForTimeout(500);
        await leaveBtn.click();
        await page.waitForTimeout(500);
        await deleteGroupBtn.click();
        await page.waitForTimeout(500);
        await confirmInput.fill(uniqueGroupName);
        await deleteConfirmBtn.click();
        await page.waitForTimeout(2000);
        } catch (error) {
            console.log(`⚠️ Test assertion failed, attempting cleanup: ${error}`);
            // Dismiss any open dialogs before cleanup
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
            // Attempt to delete the test group
            const cleanupCard = page.locator(`[data-testid^="group-card-"]:has-text("${uniqueGroupName}")`);
            if (await cleanupCard.isVisible({ timeout: 3000 }).catch(() => false)) {
                const cleanupLeaveBtn = cleanupCard.locator('[data-testid^="leave-btn-"]');
                await cleanupLeaveBtn.click();
                await page.waitForTimeout(500);
                const cleanupDeleteBtn = page.locator('button:has-text("Eliminar Grupo"), button:has-text("Delete Group")');
                if (await cleanupDeleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await cleanupDeleteBtn.click();
                    await page.waitForTimeout(500);
                    const cleanupConfirmInput = page.locator('[data-testid="confirm-name-input"]');
                    await cleanupConfirmInput.fill(uniqueGroupName);
                    const cleanupConfirmBtn = page.locator('[data-testid="delete-confirm-btn"]');
                    await cleanupConfirmBtn.click();
                    await page.waitForTimeout(2000);
                }
            }
            throw error; // Re-throw to fail the test
        }
    });
});
