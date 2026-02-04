import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth'
import {
    getFirestore,
    Firestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
} from 'firebase/firestore'
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage'

// Validate required environment variables
const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
] as const;

const missingVars = requiredEnvVars.filter(
    (key) => !import.meta.env[key]
);

if (missingVars.length > 0) {
    throw new Error(
        `Missing required Firebase environment variables: ${missingVars.join(', ')}. ` +
        'Please check your .env file and ensure all VITE_FIREBASE_* variables are set.'
    );
}

export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase app (singleton pattern)
export const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)

// Check if we should use emulator mode (for long polling config)
const shouldUseEmulators = (): boolean => {
    const e2eMode = import.meta.env.VITE_E2E_MODE || 'emulator'
    if (e2eMode === 'production') return false
    const isDev = import.meta.env.DEV ||
        (typeof window !== 'undefined' && window.location.hostname === 'localhost')
    return isDev
}

// Initialize Firebase services
export const auth: Auth = getAuth(app)

// Initialize Firestore - with special handling for emulator mode
// Firebase SDK v12+ has issues where connectFirestoreEmulator overrides experimentalForceLongPolling
// So we need to configure the emulator connection INSIDE initializeFirestore settings
function getFirestoreInstance(): Firestore {
    const useEmulators = shouldUseEmulators()

    if (!useEmulators) {
        // Production mode: Enable offline persistence with multi-tab support
        // Story 14d-v2-1-9: Firestore TTL & Offline Persistence
        try {
            const firestoreInstance = initializeFirestore(app, {
                localCache: persistentLocalCache({
                    tabManager: persistentMultipleTabManager(),
                }),
            });
            if (import.meta.env.DEV) {
                console.log('[Firebase] Production mode - Firestore with offline persistence enabled');
            }
            return firestoreInstance;
        } catch (e) {
            // Graceful fallback for unsupported browsers or HMR
            const error = e as Error;

            // Check for specific error types
            if (error.message?.includes('failed-precondition')) {
                // Multiple tabs error - fall back to existing instance
                if (import.meta.env.DEV) {
                    console.warn('[Firebase] Multiple tabs detected, using shared instance');
                }
                return getFirestore(app);
            }

            if (error.message?.includes('unimplemented')) {
                // Browser doesn't support IndexedDB persistence
                if (import.meta.env.DEV) {
                    console.warn('[Firebase] IndexedDB not supported, falling back to memory-only cache');
                }
                return getFirestore(app);
            }

            // Generic fallback for any other initialization error
            if (import.meta.env.DEV) {
                console.warn('[Firebase] Firestore initialization issue, using default instance:', error);
            }
            return getFirestore(app);
        }
    }

    // In emulator mode, configure both long polling AND emulator host in one call
    // This ensures the settings aren't overridden by connectFirestoreEmulator
    try {
        const firestoreInstance = initializeFirestore(app, {
            // CORS fix: Use long polling instead of WebChannel
            experimentalForceLongPolling: true,
            experimentalAutoDetectLongPolling: false,
            // Configure emulator host directly in settings
            // This avoids needing to call connectFirestoreEmulator separately
            host: 'localhost:8080',
            ssl: false,
        })
        if (import.meta.env.DEV) {
            console.log('[Firebase] Initialized Firestore with LONG POLLING + emulator (localhost:8080)')
        }
        return firestoreInstance
    } catch (e) {
        // If Firestore is already initialized (e.g., during HMR), use existing instance
        if (import.meta.env.DEV) {
            console.warn('[Firebase] Firestore already initialized, falling back to existing instance', e)
        }
        return getFirestore(app)
    }
}

export const db: Firestore = getFirestoreInstance()

export const storage: FirebaseStorage = getStorage(app)

// Track emulator connection state to prevent double-connection errors
let emulatorsConnected = false

/**
 * Connect to Firebase emulators in development mode.
 * Called automatically on module load in dev mode.
 * Safe to call multiple times - uses flag to prevent double-connection.
 *
 * NOTE: Firestore emulator is now configured directly in initializeFirestore
 * to preserve the experimentalForceLongPolling setting (CORS fix).
 *
 * E2E Mode Configuration (VITE_E2E_MODE):
 * - 'emulator' (default): Uses Firebase emulators for local testing
 * - 'production': Connects to production Firebase (for smoke tests)
 */
function connectToEmulators(): void {
    if (emulatorsConnected) return

    // Check E2E mode - 'production' skips emulators, anything else uses them
    const e2eMode = import.meta.env.VITE_E2E_MODE || 'emulator'
    if (e2eMode === 'production') {
        if (import.meta.env.DEV) {
            console.log('[Firebase] Production E2E mode - skipping emulators')
        }
        return
    }

    const isDev = import.meta.env.DEV ||
        (typeof window !== 'undefined' && window.location.hostname === 'localhost')

    if (!isDev) return

    try {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
        // NOTE: Firestore emulator is configured in initializeFirestore (with long polling)
        // Do NOT call connectFirestoreEmulator here as it would override the settings
        connectStorageEmulator(storage, 'localhost', 9199)
        emulatorsConnected = true

        if (import.meta.env.DEV) {
            console.log('[Firebase] Connected to emulators (Auth:9099, Storage:9199) - Firestore configured separately')
        }
    } catch (error) {
        // Emulator connection can fail if already connected or emulators not running
        if (import.meta.env.DEV) {
            console.warn('[Firebase] Emulator connection issue:', error)
        }
    }
}

// Auto-connect to emulators in development mode
connectToEmulators()
