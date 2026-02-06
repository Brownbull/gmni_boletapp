/**
 * Shared E2E Helper Functions for Staging Tests
 *
 * Extracted from join-flow-opt-in.spec.ts patterns.
 * New E2E specs should import these instead of duplicating navigation/auth/cleanup code.
 *
 * Usage:
 *   import { loginAsUser, navigateToGrupos, createGroup } from '../helpers/staging-helpers';
 *
 * See tests/e2e/E2E-TEST-CONVENTIONS.md for full patterns guide.
 */
import { expect, type Page } from '@playwright/test';

export const STAGING_URL = 'http://localhost:5174';

/**
 * Login as a test user via TestUserMenu.
 * Uses data-testid selectors (no password needed - staging auth via TestUserMenu).
 */
export async function loginAsUser(page: Page, userName: string): Promise<void> {
  await page.goto(STAGING_URL);
  await page.waitForSelector('[data-testid="test-login-button"]', { timeout: 15000 });
  await page.click('[data-testid="test-login-button"]');
  await page.waitForTimeout(500);
  const btn = page.locator(`[data-testid="test-user-${userName}"]`);
  await btn.waitFor({ state: 'visible', timeout: 5000 });
  await btn.click();
  await page.waitForTimeout(3000);
  expect(page.url()).not.toContain('login');
}

/**
 * Navigate to Settings -> Grupos view.
 * Always starts from home (page.goto) for reliability.
 * Uses getByRole for 'Ajustes' to avoid strict mode violation.
 */
export async function navigateToGrupos(page: Page): Promise<void> {
  await page.goto(STAGING_URL);
  await page.waitForTimeout(2000);
  const avatar = page.locator('[data-testid="profile-avatar"]');
  await avatar.waitFor({ state: 'visible', timeout: 10000 });
  await avatar.click();
  await page.waitForTimeout(500);
  const ajustes = page.getByRole('menuitem', { name: 'Ajustes' });
  await ajustes.waitFor({ state: 'visible', timeout: 5000 });
  await ajustes.click();
  await page.waitForTimeout(1000);
  const back = page.locator('[data-testid="settings-back-button"]');
  if (await back.isVisible({ timeout: 2000 }).catch(() => false)) {
    await back.click();
    await page.waitForTimeout(500);
  }
  await page.locator('[data-testid="settings-menu-grupos"]').click();
  await page.waitForTimeout(1000);
  await page.waitForSelector('[data-testid="grupos-view"]', { timeout: 10000 });
}

/**
 * Create a new group from the Grupos view.
 * Assumes already on Grupos view (call navigateToGrupos first).
 * @param sharingOn - Whether to enable transaction sharing (default true)
 */
export async function createGroup(page: Page, name: string, sharingOn = true): Promise<void> {
  const createBtn = page.locator('[data-testid="create-group-btn"], [data-testid="create-group-btn-empty"]');
  await createBtn.first().click();
  await page.waitForTimeout(500);
  await page.locator('[data-testid="group-name-input"]').fill(name);
  await page.waitForTimeout(300);
  if (!sharingOn) {
    await page.locator('[data-testid="transaction-sharing-toggle"]').click();
    await page.waitForTimeout(300);
  }
  await page.locator('[data-testid="create-btn"]').click();
  await page.waitForTimeout(2000);
  await page.locator(`[data-testid^="group-card-"]:has-text("${name}")`).waitFor({ state: 'visible', timeout: 5000 });
}

/**
 * Get the share/invite code for a group (handles optimistic PENDING state).
 * Assumes already on Grupos view.
 * Polls up to 10 times for the code to resolve from optimistic state.
 */
export async function getShareCode(page: Page, name: string): Promise<string> {
  const card = page.locator(`[data-testid^="group-card-"]:has-text("${name}")`);
  const cardId = await card.getAttribute('data-testid');
  const groupId = cardId?.replace('group-card-', '') || '';
  await page.locator(`[data-testid="invite-btn-${groupId}"]`).click();
  await page.waitForTimeout(500);
  await page.waitForSelector('[data-testid="invite-members-dialog"]', { timeout: 5000 });
  const codeEl = page.locator('[data-testid="invite-code-display"]');
  await codeEl.waitFor({ state: 'visible', timeout: 5000 });
  // Poll until optimistic "PENDING..." resolves to real share code
  for (let attempt = 0; attempt < 10; attempt++) {
    const text = ((await codeEl.textContent()) || '').trim();
    if (text && !text.includes('PENDING')) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      return text;
    }
    await page.waitForTimeout(1000);
  }
  // Fallback: reload to force Firestore cache refresh, then reopen dialog
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await page.reload();
  await page.waitForTimeout(3000);
  await navigateToGrupos(page);
  const card2 = page.locator(`[data-testid^="group-card-"]:has-text("${name}")`);
  const gid2 = (await card2.getAttribute('data-testid'))?.replace('group-card-', '') || '';
  await page.locator(`[data-testid="invite-btn-${gid2}"]`).click();
  await page.waitForTimeout(1000);
  await page.waitForSelector('[data-testid="invite-members-dialog"]', { timeout: 5000 });
  const code = ((await page.locator('[data-testid="invite-code-display"]').textContent()) || '').trim();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  return code;
}

/**
 * Enter a share code to join a group.
 * Assumes already on Grupos view.
 */
export async function enterShareCode(page: Page, code: string): Promise<void> {
  await page.locator('[data-testid="share-code-input"]').fill(code);
  await page.waitForTimeout(300);
  await page.locator('[data-testid="join-by-code-btn"]').click();
  await page.waitForTimeout(2000);
}

/**
 * Delete a group as the owner with type-to-confirm protection.
 * Handles all dialogs robustly. Returns false if deletion couldn't complete.
 * Assumes already on Grupos view.
 */
export async function deleteGroupAsOwner(page: Page, name: string): Promise<boolean> {
  const card = page.locator(`[data-testid^="group-card-"]:has-text("${name}")`);
  if (!(await card.isVisible({ timeout: 3000 }).catch(() => false))) return false;
  await card.locator('[data-testid^="leave-btn-"]').click();
  const ownerWarning = page.locator('[data-testid="owner-leave-warning-dialog"]');
  if (!(await ownerWarning.isVisible({ timeout: 3000 }).catch(() => false))) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    return false;
  }
  const delBtn = ownerWarning.locator('button:has-text("Eliminar"), button:has-text("Delete")');
  if (!(await delBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    return false;
  }
  await delBtn.click();
  await page.locator('[data-testid="delete-group-dialog"]').waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('[data-testid="confirm-name-input"]').fill(name);
  await page.locator('[data-testid="delete-confirm-btn"]').click();
  const backdrop = page.locator('[data-testid="delete-group-dialog-backdrop"]');
  const closed = await backdrop.waitFor({ state: 'hidden', timeout: 8000 })
    .then(() => true).catch(() => false);
  if (!closed) {
    await page.keyboard.press('Escape');
    await backdrop.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    return false;
  }
  await page.waitForTimeout(1000);
  return true;
}

/**
 * Leave a group as a non-owner member.
 * Returns false if the leave couldn't complete.
 * Assumes already on Grupos view.
 */
export async function leaveGroupAsMember(page: Page, name: string): Promise<boolean> {
  const card = page.locator(`[data-testid^="group-card-"]:has-text("${name}")`);
  if (!(await card.isVisible({ timeout: 2000 }).catch(() => false))) return false;
  await card.locator('[data-testid^="leave-btn-"]').click();
  const leaveDialog = page.locator('[data-testid="leave-group-dialog"]');
  if (!(await leaveDialog.isVisible({ timeout: 3000 }).catch(() => false))) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    return false;
  }
  await leaveDialog.locator('[data-testid="leave-group-confirm-btn"]').click();
  await page.locator('[data-testid="leave-group-dialog-backdrop"]')
    .waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1000);
  return true;
}

/**
 * Clean up old E2E test groups from the Grupos view.
 * Finds groups matching /E2E|Test|Partial/i and deletes them.
 * Assumes already on Grupos view.
 * @param maxToDelete - Max number of groups to delete (default 5)
 */
export async function cleanupOldE2EGroups(page: Page, maxToDelete = 5): Promise<number> {
  let deleted = 0;
  for (let i = 0; i < maxToDelete; i++) {
    const oldTestGroups = page.locator('[data-testid^="group-card-"]').filter({
      hasText: /E2E|Test|Partial/i,
    });
    if (!(await oldTestGroups.first().isVisible({ timeout: 2000 }).catch(() => false))) break;

    const groupNameEl = oldTestGroups.first().locator('[data-testid^="group-name-"]').first();
    const groupName = ((await groupNameEl.textContent()) || '').trim();
    if (!groupName) break;

    const success = await deleteGroupAsOwner(page, groupName);
    if (success) {
      deleted++;
    } else {
      // Not owner - try leaving instead
      await leaveGroupAsMember(page, groupName);
      deleted++;
    }
    await page.waitForTimeout(500);
  }
  return deleted;
}

/**
 * Bidirectional cleanup for multi-user tests.
 * Non-owner leaves all E2E groups first, then owner deletes remaining ones.
 * Both pages must already be on Grupos view.
 */
export async function bidirectionalCleanup(ownerPage: Page, memberPage: Page): Promise<void> {
  // Member leaves all E2E groups
  const memberCards = memberPage.locator('[data-testid^="group-card-"]').filter({ hasText: /E2E / });
  for (let i = 0; i < 10; i++) {
    if (!(await memberCards.first().isVisible({ timeout: 2000 }).catch(() => false))) break;
    const name = ((await memberCards.first().locator('p').first().textContent()) || '').trim();
    if (!name) break;
    await leaveGroupAsMember(memberPage, name);
    await memberPage.waitForTimeout(500);
  }
  // Owner deletes all E2E groups
  await ownerPage.reload();
  await ownerPage.waitForTimeout(2000);
  await navigateToGrupos(ownerPage);
  const tried = new Set<string>();
  for (let i = 0; i < 15; i++) {
    const cards = ownerPage.locator('[data-testid^="group-card-"]').filter({ hasText: /E2E / });
    const count = await cards.count();
    let found = false;
    for (let j = 0; j < count; j++) {
      const name = ((await cards.nth(j).locator('p').first().textContent()) || '').trim();
      if (!name || tried.has(name)) continue;
      tried.add(name);
      found = true;
      await deleteGroupAsOwner(ownerPage, name);
      await ownerPage.waitForTimeout(500);
      break;
    }
    if (!found) break;
  }
}
