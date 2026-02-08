/// <reference types="vitest/globals" />
/**
 * DRY integration test lifecycle helper.
 *
 * TD-CONSOLIDATED-8: Eliminates repetitive beforeAll/afterAll/beforeEach
 * boilerplate across 13+ integration test files.
 *
 * Usage:
 *   describe('My Integration Test', () => {
 *       useFirebaseEmulatorLifecycle();
 *       // ... tests
 *   });
 */

import {
    setupFirebaseEmulator,
    teardownFirebaseEmulator,
    clearFirestoreData,
} from '../setup/firebase-emulator';

/**
 * Sets up the standard Firebase emulator lifecycle for integration tests.
 * Call at the top of a describe block to register beforeAll, afterAll, and beforeEach hooks.
 */
export function useFirebaseEmulatorLifecycle(): void {
    beforeAll(async () => {
        await setupFirebaseEmulator();
    });

    afterAll(async () => {
        await teardownFirebaseEmulator();
    });

    beforeEach(async () => {
        await clearFirestoreData();
    });
}
