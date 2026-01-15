/**
 * Mock for virtual:pwa-register/react module
 *
 * Story 14.42: This module is provided by vite-plugin-pwa during Vite builds
 * but doesn't exist in the test environment. This mock provides the same
 * interface for testing PWA-related components.
 */

import { vi } from 'vitest';

// Mock state setters
const setNeedRefresh = vi.fn();
const setOfflineReady = vi.fn();

/**
 * Mock useRegisterSW hook matching vite-plugin-pwa interface
 *
 * Returns:
 * - needRefresh: [boolean, setter] - Whether a new SW is waiting
 * - offlineReady: [boolean, setter] - Whether app can work offline
 * - updateServiceWorker: function to activate waiting SW
 */
export const useRegisterSW = vi.fn(() => ({
  needRefresh: [false, setNeedRefresh] as [boolean, (value: boolean) => void],
  offlineReady: [false, setOfflineReady] as [boolean, (value: boolean) => void],
  updateServiceWorker: vi.fn((reloadPage?: boolean) => {
    // Simulate service worker update behavior
    if (reloadPage) {
      // In real usage, this would reload the page
      // For tests, we just mark it as called
    }
  }),
}));

// Export setters for tests that need to control the mock state
export const mockSetNeedRefresh = setNeedRefresh;
export const mockSetOfflineReady = setOfflineReady;
