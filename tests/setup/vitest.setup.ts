/**
 * Vitest Global Setup
 *
 * This file runs before all tests and configures:
 * - Testing Library matchers (from @testing-library/jest-dom)
 * - Firebase emulator connection
 * - Global test environment settings
 * - Virtual module mocks (e.g., vite-plugin-pwa)
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Configure environment variables for Firebase emulator
// These point to the local emulator instead of production Firebase
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

// Story 14.42: Mock virtual:pwa-register/react module for PWA tests
// This virtual module is provided by vite-plugin-pwa and doesn't exist in test environment
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(() => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  })),
}));

// Story 14c.5: Mock react-i18next for internationalized components
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'en' },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// Group consolidation: Mock useAllUserGroups hook for tests
// This hook is used by DashboardView and HistoryView after migration from useGroups
vi.mock('../src/hooks/useAllUserGroups', () => ({
  useAllUserGroups: vi.fn(() => ({
    groups: [],
    isLoading: false,
    error: undefined,
    hasGroups: false,
    personalGroupCount: 0,
  })),
}));

// Note: Individual test files should call setupFirebaseEmulator() from
// firebase-emulator.ts in their beforeAll() hooks if they need Firebase
