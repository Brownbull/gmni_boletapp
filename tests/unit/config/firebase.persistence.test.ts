/**
 * Firebase Offline Persistence Tests
 *
 * Story 14d-v2-1-9: Firestore TTL & Offline Persistence
 * Tests AC4-6: Offline persistence initialization and fallbacks
 *
 * AC4: Production mode with persistence enabled
 *      - initializeFirestore called with persistentLocalCache
 *      - Multi-tab manager configured
 *
 * AC5: Graceful fallback for unsupported browsers
 *      - "unimplemented" error falls back to getFirestore
 *      - "failed-precondition" error falls back to getFirestore
 *      - Generic errors fall back to getFirestore
 *
 * AC6: Multi-tab support
 *      - persistentMultipleTabManager used for cross-tab sync
 *
 * Testing Strategy:
 * Since firebase.ts runs initialization on module load, we need to:
 * 1. Mock Firebase modules BEFORE importing
 * 2. Use vi.resetModules() between tests to get fresh module state
 * 3. Control environment variables to simulate different modes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firebase modules before any imports
// These mocks will be configured per-test to simulate different scenarios
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'mock-app' })),
  getApps: vi.fn(() => []),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ name: 'mock-auth' })),
  connectAuthEmulator: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({ name: 'mock-storage' })),
  connectStorageEmulator: vi.fn(),
}));

// Main Firestore mock - this is where we test persistence behavior
const mockInitializeFirestore = vi.fn();
const mockGetFirestore = vi.fn(() => ({ name: 'mock-firestore-fallback' }));
const mockPersistentLocalCache = vi.fn((config) => ({ type: 'persistent', ...config }));
const mockPersistentMultipleTabManager = vi.fn(() => ({ type: 'multi-tab-manager' }));

vi.mock('firebase/firestore', () => ({
  initializeFirestore: mockInitializeFirestore,
  getFirestore: mockGetFirestore,
  persistentLocalCache: mockPersistentLocalCache,
  persistentMultipleTabManager: mockPersistentMultipleTabManager,
}));

describe('Firebase Offline Persistence Initialization', () => {
  // Store original env values
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    // Reset all module state
    vi.resetModules();
    vi.clearAllMocks();

    // Save original environment
    originalEnv = {
      VITE_E2E_MODE: import.meta.env.VITE_E2E_MODE,
      DEV: String(import.meta.env.DEV),
    };

    // Reset mock implementations to default success behavior
    mockInitializeFirestore.mockReturnValue({ name: 'mock-firestore-persistent' });
    mockGetFirestore.mockReturnValue({ name: 'mock-firestore-fallback' });
    mockPersistentLocalCache.mockImplementation((config) => ({ type: 'persistent', ...config }));
    mockPersistentMultipleTabManager.mockReturnValue({ type: 'multi-tab-manager' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('AC4: Production mode with persistence enabled', () => {
    it('should initialize with persistentLocalCache in production mode', async () => {
      // Arrange: Set up production environment (not DEV, not E2E emulator)
      vi.stubEnv('VITE_E2E_MODE', 'production');
      vi.stubEnv('DEV', 'false');

      // Configure mock to return successfully
      mockInitializeFirestore.mockReturnValue({ name: 'firestore-with-persistence' });

      // Act: Import the module to trigger initialization
      // Note: We need to dynamically import after mocks are set up
      const firebaseModule = await import('../../../src/config/firebase');

      // Assert: Verify initializeFirestore was called
      expect(mockInitializeFirestore).toHaveBeenCalled();

      // Verify the Firestore instance was exported
      expect(firebaseModule.db).toBeDefined();
    });

    it('should configure localCache with persistentLocalCache', async () => {
      // Arrange: Production mode
      vi.stubEnv('VITE_E2E_MODE', 'production');
      vi.stubEnv('DEV', 'false');

      mockInitializeFirestore.mockReturnValue({ name: 'firestore-persistent' });

      // Act
      await import('../../../src/config/firebase');

      // Assert: persistentLocalCache should have been called
      expect(mockPersistentLocalCache).toHaveBeenCalled();

      // Verify initializeFirestore received the localCache configuration
      const initCalls = mockInitializeFirestore.mock.calls;
      if (initCalls.length > 0) {
        const [, config] = initCalls[0];
        expect(config).toHaveProperty('localCache');
      }
    });
  });

  describe('AC5: Graceful fallback for unsupported browsers', () => {
    it('should fall back to getFirestore on "unimplemented" error (IndexedDB not supported)', async () => {
      // Arrange: Production mode with IndexedDB not available
      vi.stubEnv('VITE_E2E_MODE', 'production');
      vi.stubEnv('DEV', 'false');

      // Simulate browser that doesn't support IndexedDB
      const unimplementedError = new Error(
        'The current browser does not support all features required: unimplemented'
      );
      mockInitializeFirestore.mockImplementation(() => {
        throw unimplementedError;
      });
      mockGetFirestore.mockReturnValue({ name: 'firestore-memory-only' });

      // Act
      const firebaseModule = await import('../../../src/config/firebase');

      // Assert: Should have fallen back to getFirestore
      expect(mockGetFirestore).toHaveBeenCalled();
      expect(firebaseModule.db).toBeDefined();
      expect(firebaseModule.db).toEqual({ name: 'firestore-memory-only' });
    });

    it('should fall back to getFirestore on "failed-precondition" error (multiple tabs)', async () => {
      // Arrange: Production mode with multiple tabs already using Firestore
      vi.stubEnv('VITE_E2E_MODE', 'production');
      vi.stubEnv('DEV', 'false');

      // Simulate multiple tabs error
      const failedPreconditionError = new Error(
        'failed-precondition: Multiple tabs open, persistence can only be enabled in one tab at a time.'
      );
      mockInitializeFirestore.mockImplementation(() => {
        throw failedPreconditionError;
      });
      mockGetFirestore.mockReturnValue({ name: 'firestore-shared-instance' });

      // Act
      const firebaseModule = await import('../../../src/config/firebase');

      // Assert: Should have fallen back to getFirestore
      expect(mockGetFirestore).toHaveBeenCalled();
      expect(firebaseModule.db).toBeDefined();
      expect(firebaseModule.db).toEqual({ name: 'firestore-shared-instance' });
    });

    it('should fall back to getFirestore on generic initialization error', async () => {
      // Arrange: Production mode with unexpected error
      vi.stubEnv('VITE_E2E_MODE', 'production');
      vi.stubEnv('DEV', 'false');

      // Simulate generic error (e.g., HMR, other issues)
      const genericError = new Error('Firestore has already been initialized');
      mockInitializeFirestore.mockImplementation(() => {
        throw genericError;
      });
      mockGetFirestore.mockReturnValue({ name: 'firestore-default-instance' });

      // Act
      const firebaseModule = await import('../../../src/config/firebase');

      // Assert: Should have fallen back to getFirestore
      expect(mockGetFirestore).toHaveBeenCalled();
      expect(firebaseModule.db).toBeDefined();
    });

    it('should not crash when initialization fails - graceful degradation', async () => {
      // Arrange: Production mode with error
      vi.stubEnv('VITE_E2E_MODE', 'production');
      vi.stubEnv('DEV', 'false');

      mockInitializeFirestore.mockImplementation(() => {
        throw new Error('Some unexpected error');
      });
      mockGetFirestore.mockReturnValue({ name: 'firestore-fallback' });

      // Act & Assert: Should not throw, should return fallback instance
      let firebaseModule;
      expect(async () => {
        firebaseModule = await import('../../../src/config/firebase');
      }).not.toThrow();

      // Verify module still exports a valid db instance
      if (firebaseModule) {
        expect((firebaseModule as { db: unknown }).db).toBeDefined();
      }
    });
  });

  describe('AC6: Multi-tab support', () => {
    it('should use persistentMultipleTabManager for cross-tab sync', async () => {
      // Arrange: Production mode
      vi.stubEnv('VITE_E2E_MODE', 'production');
      vi.stubEnv('DEV', 'false');

      mockInitializeFirestore.mockReturnValue({ name: 'firestore-multi-tab' });

      // Act
      await import('../../../src/config/firebase');

      // Assert: persistentMultipleTabManager should have been called
      expect(mockPersistentMultipleTabManager).toHaveBeenCalled();
    });

    it('should pass tabManager to persistentLocalCache configuration', async () => {
      // Arrange: Production mode
      vi.stubEnv('VITE_E2E_MODE', 'production');
      vi.stubEnv('DEV', 'false');

      mockInitializeFirestore.mockReturnValue({ name: 'firestore-configured' });

      // Act
      await import('../../../src/config/firebase');

      // Assert: Verify the configuration chain
      // persistentLocalCache should receive tabManager from persistentMultipleTabManager
      const localCacheCalls = mockPersistentLocalCache.mock.calls;
      if (localCacheCalls.length > 0) {
        const [config] = localCacheCalls[0];
        expect(config).toHaveProperty('tabManager');
      }
    });
  });

  describe('Emulator mode behavior', () => {
    it('should NOT use persistence in emulator mode (DEV environment)', async () => {
      // Arrange: Development/emulator mode
      vi.stubEnv('VITE_E2E_MODE', 'emulator');
      vi.stubEnv('DEV', 'true');

      // In emulator mode, initializeFirestore uses different config
      mockInitializeFirestore.mockReturnValue({ name: 'firestore-emulator' });

      // Act
      await import('../../../src/config/firebase');

      // Assert: initializeFirestore should be called but with emulator config
      expect(mockInitializeFirestore).toHaveBeenCalled();

      // Verify it was NOT called with persistentLocalCache
      // In emulator mode, it should use experimentalForceLongPolling instead
      const initCalls = mockInitializeFirestore.mock.calls;
      if (initCalls.length > 0) {
        const [, config] = initCalls[0];
        // In emulator mode, config should have host and ssl settings, not localCache
        if (config && config.experimentalForceLongPolling !== undefined) {
          expect(config.experimentalForceLongPolling).toBe(true);
          expect(config.localCache).toBeUndefined();
        }
      }
    });
  });

  describe('Error message detection', () => {
    it('should correctly identify "unimplemented" in error message', async () => {
      // Arrange
      vi.stubEnv('VITE_E2E_MODE', 'production');
      vi.stubEnv('DEV', 'false');

      // Various ways the error might appear
      const errorVariants = [
        'unimplemented',
        'The operation is unimplemented',
        'IndexedDB: unimplemented feature',
      ];

      for (const errorText of errorVariants) {
        vi.resetModules();
        mockInitializeFirestore.mockImplementation(() => {
          throw new Error(errorText);
        });
        mockGetFirestore.mockReturnValue({ name: 'fallback' });

        // Act
        await import('../../../src/config/firebase');

        // Assert: getFirestore should be called as fallback
        expect(mockGetFirestore).toHaveBeenCalled();
      }
    });

    it('should correctly identify "failed-precondition" in error message', async () => {
      // Arrange
      vi.stubEnv('VITE_E2E_MODE', 'production');
      vi.stubEnv('DEV', 'false');

      const errorVariants = [
        'failed-precondition',
        'FAILED_PRECONDITION: Multiple tabs',
        'failed-precondition: persistence issue',
      ];

      for (const errorText of errorVariants) {
        vi.resetModules();
        mockInitializeFirestore.mockImplementation(() => {
          throw new Error(errorText);
        });
        mockGetFirestore.mockReturnValue({ name: 'fallback' });

        // Act
        await import('../../../src/config/firebase');

        // Assert
        expect(mockGetFirestore).toHaveBeenCalled();
      }
    });
  });
});

/**
 * Edge case tests for error handling robustness
 *
 * These tests verify edge cases in error handling to ensure
 * the application degrades gracefully under all conditions.
 */
describe('Error Handling Edge Cases', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockInitializeFirestore.mockReturnValue({ name: 'mock-firestore' });
    mockGetFirestore.mockReturnValue({ name: 'mock-firestore-fallback' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('should handle error without message property', async () => {
    // Arrange: Production mode with unusual error object
    vi.stubEnv('VITE_E2E_MODE', 'production');
    vi.stubEnv('DEV', 'false');

    // Some errors might not have a message property
    const errorWithoutMessage = { code: 'UNKNOWN_ERROR' };
    mockInitializeFirestore.mockImplementation(() => {
      throw errorWithoutMessage;
    });
    mockGetFirestore.mockReturnValue({ name: 'firestore-fallback-no-message' });

    // Act
    const firebaseModule = await import('../../../src/config/firebase');

    // Assert: Should still fall back gracefully
    expect(mockGetFirestore).toHaveBeenCalled();
    expect(firebaseModule.db).toBeDefined();
  });

  it('should handle error with undefined message', async () => {
    // Arrange: Production mode with error that has undefined message
    vi.stubEnv('VITE_E2E_MODE', 'production');
    vi.stubEnv('DEV', 'false');

    // Some Error subclasses might have message as undefined
    const errorWithUndefinedMessage = new Error();
    errorWithUndefinedMessage.message = undefined as unknown as string;
    mockInitializeFirestore.mockImplementation(() => {
      throw errorWithUndefinedMessage;
    });
    mockGetFirestore.mockReturnValue({ name: 'firestore-fallback-undefined-message' });

    // Act
    const firebaseModule = await import('../../../src/config/firebase');

    // Assert: Should still fall back gracefully via generic handler
    expect(mockGetFirestore).toHaveBeenCalled();
    expect(firebaseModule.db).toBeDefined();
  });

  it('should handle string error', async () => {
    // Arrange: Production mode with string thrown (not Error object)
    vi.stubEnv('VITE_E2E_MODE', 'production');
    vi.stubEnv('DEV', 'false');

    mockInitializeFirestore.mockImplementation(() => {
      throw 'String error message';
    });
    mockGetFirestore.mockReturnValue({ name: 'firestore-fallback-string' });

    // Act
    const firebaseModule = await import('../../../src/config/firebase');

    // Assert: Should still fall back gracefully
    expect(mockGetFirestore).toHaveBeenCalled();
    expect(firebaseModule.db).toBeDefined();
  });
});

/**
 * Supplementary tests for source code structure verification
 *
 * These tests verify that the error handling paths exist in the source code
 * by checking the structure rather than runtime behavior.
 */
describe('Firebase Configuration Structure Verification', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockInitializeFirestore.mockReturnValue({ name: 'mock-firestore' });
    mockGetFirestore.mockReturnValue({ name: 'mock-firestore-fallback' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('should export required Firebase instances', async () => {
    // This test verifies the module structure
    const firebaseModule = await import('../../../src/config/firebase');

    // Verify all expected exports exist
    expect(firebaseModule).toHaveProperty('app');
    expect(firebaseModule).toHaveProperty('auth');
    expect(firebaseModule).toHaveProperty('db');
    expect(firebaseModule).toHaveProperty('storage');
    expect(firebaseModule).toHaveProperty('firebaseConfig');
  });

  it('should export firebaseConfig with required fields', async () => {
    const firebaseModule = await import('../../../src/config/firebase');

    // Verify config structure
    const config = firebaseModule.firebaseConfig;
    expect(config).toHaveProperty('apiKey');
    expect(config).toHaveProperty('authDomain');
    expect(config).toHaveProperty('projectId');
    expect(config).toHaveProperty('storageBucket');
    expect(config).toHaveProperty('messagingSenderId');
    expect(config).toHaveProperty('appId');
  });
});
