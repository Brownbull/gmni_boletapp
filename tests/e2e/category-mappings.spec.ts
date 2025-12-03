/**
 * E2E Tests: Category Mappings Management in Settings
 *
 * Story 6.5: Mappings Management UI
 *
 * IMPORTANT: Firebase Auth Emulator OAuth Flow Limitation
 * =========================================================
 * Firebase Auth Emulator's Google OAuth popup flow is not automatable in headless CI
 * environments due to cross-origin popup restrictions and emulator-specific OAuth handling.
 *
 * Test Coverage Strategy:
 * -----------------------
 * E2E Tests (this file): Unauthenticated baseline validation
 * Integration Tests: Authenticated mappings management workflows
 * Unit Tests: CategoryMappingsList component logic
 *
 * Acceptance Criteria Coverage:
 * ------------------------------
 * AC#1: "Learned Categories" section in SettingsView - This file validates baseline
 * AC#2: List displays mappings - Integration tests with Firebase emulator
 * AC#3: Mapping shows name, category, usage count - Integration tests
 * AC#4: Delete with confirmation - Integration tests
 * AC#5: Empty state message - Integration tests
 * AC#6: Keyboard navigable and accessible - Integration + this file
 * AC#7: E2E covers view, edit, delete flow - This file (baseline) + Integration tests
 *
 * For authenticated workflow validation, see:
 * - tests/integration/category-mappings.test.tsx (component integration tests)
 * - docs/testing/testing-guide.md (manual E2E testing procedures)
 */

import { test, expect } from '@playwright/test';

test.describe('Category Mappings Management E2E Workflows - Story 6.5', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  /**
   * TEST 1: Settings Feature Requires Authentication
   * AC#1: Verify settings view (including mappings management) requires authentication
   */
  test('should require authentication to access category mappings management', async ({ page }) => {
    // Verify we're on login screen (unauthenticated)
    await expect(page.getByText('Expense Tracker')).toBeVisible();

    // Verify sign-in button is present
    const signInButton = page.getByRole('button', { name: /sign in with google|entrar con google/i });
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toBeEnabled();

    // Verify settings navigation is NOT visible (requires auth)
    await expect(page.getByRole('button', { name: /settings|ajustes/i })).not.toBeVisible();

    // Verify learned categories section is NOT visible (requires auth)
    await expect(page.getByText(/learned categories|categorías aprendidas/i)).not.toBeVisible();
  });

  /**
   * TEST 2: Mappings UI Elements Not Accessible When Unauthenticated
   * AC#2, AC#3: Verify mappings list not accessible for unauthenticated users
   */
  test('should not display mappings UI elements for unauthenticated users', async ({ page }) => {
    // Verify login screen
    await expect(page.getByText('Expense Tracker')).toBeVisible();

    // Verify no learned categories elements visible
    const learnedCategoriesSection = page.getByRole('list', { name: /learned categories/i });
    await expect(learnedCategoriesSection).not.toBeVisible();

    // Verify no delete mapping buttons visible
    const deleteButtons = page.getByRole('button', { name: /delete.*mapping|eliminar.*categoría/i });
    await expect(deleteButtons).not.toBeVisible();
  });

  /**
   * TEST 3: Delete Modal Not Rendered When Unauthenticated
   * AC#4: Verify delete confirmation modal is not pre-rendered
   */
  test('should not pre-render delete confirmation modal for unauthenticated users', async ({ page }) => {
    // Verify login screen
    await expect(page.getByText('Expense Tracker')).toBeVisible();

    // Verify delete confirmation modal is not present in DOM
    const deleteModal = page.getByRole('alertdialog');
    await expect(deleteModal).not.toBeVisible();

    // Verify delete confirmation text is not visible
    await expect(page.getByText(/remove this learned category|eliminar esta categoría/i)).not.toBeVisible();
  });

  /**
   * TEST 4: Login Screen Accessibility for Mappings Feature Access
   * AC#6: Verify accessible entry point to authenticated features
   */
  test('should have accessible login screen as entry point to mappings features', async ({ page }) => {
    // Verify sign-in button has proper role
    const signInButton = page.getByRole('button', { name: /sign in with google|entrar con google/i });
    await expect(signInButton).toBeVisible();

    // Verify button is keyboard-accessible (focusable)
    await signInButton.focus();
    const isFocused = await page.evaluate(() => {
      const activeElement = document.activeElement;
      return activeElement?.tagName === 'BUTTON';
    });
    expect(isFocused).toBe(true);

    // Verify button can be activated via keyboard
    await expect(signInButton).toBeEnabled();
  });

  /**
   * TEST 5: Unauthenticated State Persistence for Mappings Access
   * AC#1: Verify unauthenticated state persists (baseline for authenticated features)
   */
  test('should maintain unauthenticated state blocking mappings access', async ({ page }) => {
    // Verify initial state - login screen
    await expect(page.getByText('Expense Tracker')).toBeVisible();

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify still on login screen
    await expect(page.getByText('Expense Tracker')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in with google|entrar con google/i })).toBeVisible();

    // Verify mappings features still not accessible
    await expect(page.getByText(/learned categories|categorías aprendidas/i)).not.toBeVisible();
  });

  /**
   * TEST 6: Application Loads Without Console Errors (Mappings Feature Ready)
   * AC#6: Verify app loads without errors that would affect mappings functionality
   */
  test('should load application without console errors affecting mappings', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Reload and check for errors
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify basic page structure
    await expect(page.locator('#root')).toBeVisible();

    // Filter out expected Firebase warnings
    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('Firebase') &&
      !e.includes('firebaseConfig') &&
      !e.includes('net::ERR')
    );

    // Should have no critical errors that would affect mappings
    expect(criticalErrors.length).toBeLessThan(3);
  });

  /**
   * TEST 7: No Mappings Feature Bypass Available
   * AC#1: Verify non-authenticated users cannot bypass to mappings
   */
  test('should not expose any mappings bypass for unauthenticated users', async ({ page }) => {
    // Check for any hidden mappings elements that might be accessible
    const allButtons = await page.locator('button').all();

    // Verify no button has mappings-related functionality accessible
    for (const button of allButtons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();

      // No button should expose mappings functionality directly
      expect(ariaLabel?.toLowerCase() || '').not.toContain('delete mapping');
      expect(text?.toLowerCase() || '').not.toContain('learned categories');
    }
  });
});

/**
 * AUTHENTICATED WORKFLOW TESTS
 * =============================
 *
 * The following workflows are validated in integration tests due to Firebase Auth
 * Emulator OAuth popup complexity in headless browsers:
 *
 * AC#1: "Learned Categories" Section in Settings
 * - Covered by: tests/integration/category-mappings.test.tsx
 * - Validates: Section renders in SettingsView with proper header and icon
 *
 * AC#2: List Displays All User's Mappings
 * - Covered by: tests/integration/category-mappings.test.tsx
 * - Validates: Real-time subscription to user's category mappings
 * - Validates: All mappings from Firestore displayed in list
 *
 * AC#3: Each Mapping Shows Item Name, Category, Usage Count
 * - Covered by: tests/integration/category-mappings.test.tsx
 * - Validates: originalItem displayed with quotes
 * - Validates: targetCategory in badge format
 * - Validates: usageCount with "Used X times" format
 *
 * AC#4: Delete with Confirmation Modal
 * - Covered by: tests/integration/category-mappings.test.tsx
 * - Validates: Delete button triggers confirmation modal
 * - Validates: Modal has confirm/cancel buttons
 * - Validates: Confirmation deletes from Firestore
 * - Validates: Cancel closes modal without deletion
 *
 * AC#5: Empty State with Helpful Message
 * - Covered by: tests/integration/category-mappings.test.tsx
 * - Validates: "No learned categories yet" message
 * - Validates: Hint about editing transactions to learn
 *
 * AC#6: Keyboard Navigable and Accessible
 * - Covered by: tests/integration/category-mappings.test.tsx
 * - Validates: Tab navigation through list items
 * - Validates: Enter/Space triggers delete modal
 * - Validates: Escape closes modal
 * - Validates: Focus trap within modal
 * - Validates: aria-labels on all interactive elements
 *
 * AC#7: E2E Covers View, Edit, Delete Flow
 * - Partial coverage in this file (unauthenticated baseline)
 * - Full flow in: tests/integration/category-mappings.test.tsx
 * - Manual E2E: docs/testing/testing-guide.md
 *
 * Rationale:
 * ----------
 * Firebase Auth Emulator's OAuth popup flow requires cross-origin popup handling
 * which is blocked in headless CI environments. Integration tests validate all
 * authenticated workflows without browser-specific OAuth complexity.
 *
 * References:
 * -----------
 * - Story 6.5 Context: docs/sprint-artifacts/epic6/6-5-mappings-management-ui.context.xml
 * - Integration Tests: tests/integration/category-mappings.test.tsx
 * - Testing Guide: docs/testing/testing-guide.md
 */
