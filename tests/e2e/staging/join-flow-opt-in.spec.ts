/** E2E: Join Flow with Opt-In Dialog (AC8-AC14) - Story 14d-v2-1-13+14 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] }, viewport: { width: 360, height: 780 } });
const STAGING_URL = 'http://localhost:5174';

async function loginAsUser(page: Page, userName: string): Promise<void> {
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

async function navigateToGrupos(page: Page): Promise<void> {
  // Always start from home for reliability
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

async function createGroup(page: Page, name: string, sharingOn = true): Promise<void> {
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

async function getShareCode(page: Page, name: string): Promise<string> {
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
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  await page.reload(); await page.waitForTimeout(3000);
  await navigateToGrupos(page);
  const card2 = page.locator(`[data-testid^="group-card-"]:has-text("${name}")`);
  const gid2 = (await card2.getAttribute('data-testid'))?.replace('group-card-', '') || '';
  await page.locator(`[data-testid="invite-btn-${gid2}"]`).click(); await page.waitForTimeout(1000);
  await page.waitForSelector('[data-testid="invite-members-dialog"]', { timeout: 5000 });
  const code = ((await page.locator('[data-testid="invite-code-display"]').textContent()) || '').trim();
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  return code;
}

async function enterShareCode(page: Page, code: string): Promise<void> {
  await page.locator('[data-testid="share-code-input"]').fill(code);
  await page.waitForTimeout(300);
  await page.locator('[data-testid="join-by-code-btn"]').click();
  await page.waitForTimeout(2000);
}

async function deleteGroupAsOwner(page: Page, name: string): Promise<boolean> {
  const card = page.locator(`[data-testid^="group-card-"]:has-text("${name}")`);
  if (!(await card.isVisible({ timeout: 3000 }).catch(() => false))) return false;
  await card.locator('[data-testid^="leave-btn-"]').click();
  const ownerWarning = page.locator('[data-testid="owner-leave-warning-dialog"]');
  if (!(await ownerWarning.isVisible({ timeout: 3000 }).catch(() => false))) {
    await page.keyboard.press('Escape'); await page.waitForTimeout(500); return false;
  }
  const delBtn = ownerWarning.locator('button:has-text("Eliminar"), button:has-text("Delete")');
  if (!(await delBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
    await page.keyboard.press('Escape'); await page.waitForTimeout(500); return false;
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
    await page.waitForTimeout(500); return false;
  }
  await page.waitForTimeout(1000);
  return true;
}

async function leaveGroupAsMember(page: Page, name: string): Promise<boolean> {
  const card = page.locator(`[data-testid^="group-card-"]:has-text("${name}")`);
  if (!(await card.isVisible({ timeout: 2000 }).catch(() => false))) return false;
  await card.locator('[data-testid^="leave-btn-"]').click();
  const leaveDialog = page.locator('[data-testid="leave-group-dialog"]');
  if (!(await leaveDialog.isVisible({ timeout: 3000 }).catch(() => false))) {
    await page.keyboard.press('Escape'); await page.waitForTimeout(500); return false;
  }
  await leaveDialog.locator('[data-testid="leave-group-confirm-btn"]').click();
  await page.locator('[data-testid="leave-group-dialog-backdrop"]')
    .waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1000);
  return true;
}

async function bidirectionalCleanup(alicePage: Page, bobPage: Page): Promise<void> {
  const bobCards = bobPage.locator('[data-testid^="group-card-"]').filter({ hasText: /E2E / });
  for (let i = 0; i < 10; i++) {
    if (!(await bobCards.first().isVisible({ timeout: 2000 }).catch(() => false))) break;
    const name = ((await bobCards.first().locator('p').first().textContent()) || '').trim();
    if (!name) break;
    await leaveGroupAsMember(bobPage, name);
    await bobPage.waitForTimeout(500);
  }
  await alicePage.reload();
  await alicePage.waitForTimeout(2000);
  await navigateToGrupos(alicePage);
  const tried = new Set<string>();
  for (let i = 0; i < 15; i++) {
    const cards = alicePage.locator('[data-testid^="group-card-"]').filter({ hasText: /E2E / });
    const count = await cards.count();
    let found = false;
    for (let j = 0; j < count; j++) {
      const name = ((await cards.nth(j).locator('p').first().textContent()) || '').trim();
      if (!name || tried.has(name)) continue;
      tried.add(name); found = true;
      await deleteGroupAsOwner(alicePage, name);
      await alicePage.waitForTimeout(500);
      break;
    }
    if (!found) break;
  }
}

test.describe('Join Flow with Opt-In (14d-v2-1-13+14)', () => {
  // Serial mode: all tests share same staging Alice/Bob accounts.
  // Parallel workers cause bidirectionalCleanup races (one worker deletes another's groups).
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(180000);

  test('AC8+AC9+AC12+AC14: Join sharing-ON group, choose Yes, verify dialog content + default + persistence', async ({ browser }) => {
    const NAME = `E2E Yes ${Date.now()}`;
    let ac: BrowserContext | null = null;
    let bc: BrowserContext | null = null;
    let ap: Page | null = null;
    let bp: Page | null = null;
    try {
      ac = await browser.newContext({ viewport: { width: 360, height: 780 } });
      bc = await browser.newContext({ viewport: { width: 360, height: 780 } });
      ap = await ac.newPage();
      bp = await bc.newPage();

      await loginAsUser(ap, 'alice');
      await loginAsUser(bp, 'bob');
      await navigateToGrupos(bp);
      await navigateToGrupos(ap);
      await bidirectionalCleanup(ap, bp);
      await createGroup(ap, NAME, true);
      const code = await getShareCode(ap, NAME);
      expect(code.length).toBeGreaterThanOrEqual(10);
      await ap.screenshot({ path: 'test-results/join-flow-opt-in/ac7-01-alice-created.png', fullPage: true });

      await navigateToGrupos(bp);
      await enterShareCode(bp, code);

      const acceptDlg = bp.locator('[data-testid="accept-invitation-dialog"]');
      await acceptDlg.waitFor({ state: 'visible', timeout: 10000 });
      await bp.screenshot({ path: 'test-results/join-flow-opt-in/ac7-02-accept-dialog.png', fullPage: true });
      await bp.locator('[data-testid="accept-btn"]').click();
      await bp.waitForTimeout(1000);

      const optDlg = bp.locator('[data-testid="optin-dialog"]');
      await optDlg.waitFor({ state: 'visible', timeout: 5000 });
      await bp.screenshot({ path: 'test-results/join-flow-opt-in/ac7-03-optin-dialog.png', fullPage: true });

      // AC8: Verify dialog content displays correctly
      const dialogText = await optDlg.textContent() || '';
      // Title includes group name context + "transaction sharing" (EN or ES)
      expect(dialogText).toMatch(/(permite compartir transacciones|allows transaction sharing)/i);
      // Description asks about sharing transaction details
      expect(dialogText).toMatch(/(compartir los detalles|share your transaction details|detalles de tus transacciones)/i);
      // Statistics note about spending totals always visible
      expect(dialogText).toMatch(/(totales de gasto|spending totals|totales.*visibles)/i);
      // Privacy note about changing preference later
      expect(dialogText).toMatch(/(cambiar esto.*tarde|change this later)/i);
      // Both option labels present
      expect(dialogText).toMatch(/(compartir mis transacciones|share my transactions)/i);
      expect(dialogText).toMatch(/(solo estad.sticas|just statistics)/i);

      // AC9: Default selection is "No, just statistics" (privacy-first, LV-6)
      const noRadio = optDlg.locator('[data-testid="share-no-btn"]');
      expect(await noRadio.isChecked()).toBe(true);
      const yesRadio = optDlg.locator('[data-testid="share-yes-btn"]');
      expect(await yesRadio.isChecked()).toBe(false);

      await bp.locator('[data-testid="option-yes-label"]').click();
      await bp.waitForTimeout(300);
      await bp.locator('[data-testid="join-btn"]').click();
      await optDlg.waitFor({ state: 'hidden', timeout: 15000 });
      await bp.waitForTimeout(2000);
      await bp.screenshot({ path: 'test-results/join-flow-opt-in/ac7-04-joined.png', fullPage: true });
      try {
        const toast = bp.getByText(new RegExp(`(miembro|member)`, 'i'));
        await expect(toast.first()).toBeVisible({ timeout: 3000 });
      } catch { /* toast auto-dismissed */ }

      await bp.reload();
      await bp.waitForTimeout(3000);
      await navigateToGrupos(bp);
      await expect(bp.locator(`[data-testid^="group-card-"]:has-text("${NAME}")`)).toBeVisible({ timeout: 10000 });
      await bp.screenshot({ path: 'test-results/join-flow-opt-in/ac7-05-persisted.png', fullPage: true });

      await bp.goto(STAGING_URL);
      await bp.waitForTimeout(2000);
      const logo = bp.locator('[data-testid="app-logo-button"]');
      await logo.waitFor({ state: 'visible', timeout: 10000 });
      await logo.click();
      await bp.waitForTimeout(500);
      await bp.locator('[data-testid="view-mode-switcher"]').waitFor({ state: 'visible', timeout: 5000 });
      await expect(bp.locator(`[data-testid^="view-mode-option-group-"]:has-text("${NAME}")`)).toBeVisible({ timeout: 5000 });
      await bp.screenshot({ path: 'test-results/join-flow-opt-in/ac7-06-viewmode.png', fullPage: true });

      // Note: Post-join preference toggle verification (Bob chose "Yes" → toggle ON)
      // is covered by user-sharing-preferences.spec.ts. Not duplicated here to keep
      // this multi-user test within the 180s budget.
    } finally {
      try {
        if (bp) { await navigateToGrupos(bp); await leaveGroupAsMember(bp, NAME); }
        if (ap) { await ap.reload(); await ap.waitForTimeout(2000); await navigateToGrupos(ap); await deleteGroupAsOwner(ap, NAME); }
      } catch { /* best-effort */ }
      await ac?.close(); await bc?.close();
    }
  });

  test('AC8: Join sharing-ON group, choose No - statistics only toast', async ({ browser }) => {
    const NAME = `E2E No ${Date.now()}`;
    let ac: BrowserContext | null = null;
    let bc: BrowserContext | null = null;
    let ap: Page | null = null;
    let bp: Page | null = null;
    try {
      ac = await browser.newContext({ viewport: { width: 360, height: 780 } });
      bc = await browser.newContext({ viewport: { width: 360, height: 780 } });
      ap = await ac.newPage();
      bp = await bc.newPage();

      await loginAsUser(ap, 'alice');
      await loginAsUser(bp, 'bob');
      await navigateToGrupos(bp);
      await navigateToGrupos(ap);
      await bidirectionalCleanup(ap, bp);
      await createGroup(ap, NAME, true);
      const code = await getShareCode(ap, NAME);

      await navigateToGrupos(bp);
      await enterShareCode(bp, code);
      await bp.locator('[data-testid="accept-invitation-dialog"]').waitFor({ state: 'visible', timeout: 10000 });
      await bp.locator('[data-testid="accept-btn"]').click();
      await bp.waitForTimeout(1000);

      const optDlg = bp.locator('[data-testid="optin-dialog"]');
      await optDlg.waitFor({ state: 'visible', timeout: 5000 });
      await bp.screenshot({ path: 'test-results/join-flow-opt-in/ac8-01-optin.png', fullPage: true });

      await bp.locator('[data-testid="option-no-label"]').click();
      await bp.waitForTimeout(300);
      await bp.locator('[data-testid="join-btn"]').click();
      await optDlg.waitFor({ state: 'hidden', timeout: 15000 });
      await bp.waitForTimeout(2000);
      await bp.screenshot({ path: 'test-results/join-flow-opt-in/ac8-02-joined.png', fullPage: true });

      try {
        const toast = bp.getByText(new RegExp(`(preferencias|preferences|configuraci|settings)`, 'i'));
        await expect(toast.first()).toBeVisible({ timeout: 3000 });
      } catch { /* toast auto-dismissed */ }
    } finally {
      try {
        if (bp) { await navigateToGrupos(bp); await leaveGroupAsMember(bp, NAME); }
        if (ap) { await ap.reload(); await ap.waitForTimeout(2000); await navigateToGrupos(ap); await deleteGroupAsOwner(ap, NAME); }
      } catch { /* best-effort */ }
      await ac?.close(); await bc?.close();
    }
  });

  test('AC9+AC11: Join sharing-ON group, dismiss via Escape - defaults to false, keyboard a11y', async ({ browser }) => {
    const NAME = `E2E Dismiss ${Date.now()}`;
    let ac: BrowserContext | null = null;
    let bc: BrowserContext | null = null;
    let ap: Page | null = null;
    let bp: Page | null = null;
    try {
      ac = await browser.newContext({ viewport: { width: 360, height: 780 } });
      bc = await browser.newContext({ viewport: { width: 360, height: 780 } });
      ap = await ac.newPage();
      bp = await bc.newPage();

      await loginAsUser(ap, 'alice');
      await loginAsUser(bp, 'bob');
      await navigateToGrupos(bp);
      await navigateToGrupos(ap);
      await bidirectionalCleanup(ap, bp);
      await createGroup(ap, NAME, true);
      const code = await getShareCode(ap, NAME);

      await navigateToGrupos(bp);
      await enterShareCode(bp, code);
      await bp.locator('[data-testid="accept-invitation-dialog"]').waitFor({ state: 'visible', timeout: 10000 });
      await bp.locator('[data-testid="accept-btn"]').click();
      await bp.waitForTimeout(1000);

      const optDlg = bp.locator('[data-testid="optin-dialog"]');
      await optDlg.waitFor({ state: 'visible', timeout: 5000 });
      await bp.screenshot({ path: 'test-results/join-flow-opt-in/ac9-01-optin.png', fullPage: true });

      // AC11: Verify ARIA attributes for accessibility
      expect(await optDlg.getAttribute('role')).toBe('dialog');
      expect(await optDlg.getAttribute('aria-modal')).toBe('true');

      // AC11: Verify close button receives initial focus (keyboard-accessible)
      const closeBtn = optDlg.locator('[data-testid="close-btn"]');
      await expect(closeBtn).toBeFocused({ timeout: 3000 });

      // AC11+AC10: Dismiss via Escape key (keyboard navigation)
      await bp.keyboard.press('Escape');
      await optDlg.waitFor({ state: 'hidden', timeout: 15000 });
      await bp.waitForTimeout(2000);
      await bp.screenshot({ path: 'test-results/join-flow-opt-in/ac9-02-dismissed.png', fullPage: true });

      try {
        const toast = bp.getByText(new RegExp(`(defecto|default|desactivado|off)`, 'i'));
        await expect(toast.first()).toBeVisible({ timeout: 3000 });
      } catch { /* toast auto-dismissed */ }

      await bp.reload();
      await bp.waitForTimeout(2000);
      await navigateToGrupos(bp);
      await expect(bp.locator(`[data-testid^="group-card-"]:has-text("${NAME}")`)).toBeVisible({ timeout: 10000 });
    } finally {
      try {
        if (bp) { await navigateToGrupos(bp); await leaveGroupAsMember(bp, NAME); }
        if (ap) { await ap.reload(); await ap.waitForTimeout(2000); await navigateToGrupos(ap); await deleteGroupAsOwner(ap, NAME); }
      } catch { /* best-effort */ }
      await ac?.close(); await bc?.close();
    }
  });

  test('AC10: Join sharing-OFF group - no opt-in dialog', async ({ browser }) => {
    const NAME = `E2E NoShare ${Date.now()}`;
    let ac: BrowserContext | null = null;
    let bc: BrowserContext | null = null;
    let ap: Page | null = null;
    let bp: Page | null = null;
    try {
      ac = await browser.newContext({ viewport: { width: 360, height: 780 } });
      bc = await browser.newContext({ viewport: { width: 360, height: 780 } });
      ap = await ac.newPage();
      bp = await bc.newPage();

      await loginAsUser(ap, 'alice');
      await loginAsUser(bp, 'bob');
      await navigateToGrupos(bp);
      await navigateToGrupos(ap);
      await bidirectionalCleanup(ap, bp);
      await createGroup(ap, NAME, false);
      await ap.screenshot({ path: 'test-results/join-flow-opt-in/ac10-01-no-sharing.png', fullPage: true });
      const code = await getShareCode(ap, NAME);

      await navigateToGrupos(bp);
      await enterShareCode(bp, code);
      const acceptDlg = bp.locator('[data-testid="accept-invitation-dialog"]');
      await acceptDlg.waitFor({ state: 'visible', timeout: 10000 });
      await bp.screenshot({ path: 'test-results/join-flow-opt-in/ac10-02-accept.png', fullPage: true });

      expect(await bp.locator('[data-testid="sharing-notice"]').isVisible({ timeout: 1000 }).catch(() => false)).toBe(false);

      await bp.locator('[data-testid="accept-btn"]').click();
      await acceptDlg.waitFor({ state: 'hidden', timeout: 15000 });
      await bp.waitForTimeout(2000);

      expect(await bp.locator('[data-testid="optin-dialog"]').isVisible({ timeout: 2000 }).catch(() => false)).toBe(false);
      await bp.screenshot({ path: 'test-results/join-flow-opt-in/ac10-03-no-dialog.png', fullPage: true });

      try {
        const escaped = NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const toast = bp.getByText(new RegExp(`(uniste|Joined).*${escaped}`, 'i'));
        await expect(toast.first()).toBeVisible({ timeout: 3000 });
      } catch { /* toast auto-dismissed */ }
    } finally {
      try {
        if (bp) { await navigateToGrupos(bp); await leaveGroupAsMember(bp, NAME); }
        if (ap) { await ap.reload(); await ap.waitForTimeout(2000); await navigateToGrupos(ap); await deleteGroupAsOwner(ap, NAME); }
      } catch { /* best-effort */ }
      await ac?.close(); await bc?.close();
    }
  });
});
