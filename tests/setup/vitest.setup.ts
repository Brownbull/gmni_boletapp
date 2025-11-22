/**
 * Vitest Global Setup
 *
 * This file runs before all tests and configures:
 * - Testing Library matchers (from @testing-library/jest-dom)
 * - Firebase emulator connection
 * - Global test environment settings
 */

import '@testing-library/jest-dom';

// Configure environment variables for Firebase emulator
// These point to the local emulator instead of production Firebase
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

// Note: Individual test files should call setupFirebaseEmulator() from
// firebase-emulator.ts in their beforeAll() hooks if they need Firebase
