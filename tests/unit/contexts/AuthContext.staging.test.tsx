/**
 * Story 16-9: Staging whitelist check in AuthContext
 *
 * When project is boletapp-staging, AuthProvider checks allowedEmails collection.
 * Non-whitelisted users are signed out with a clear message.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import {
    AuthProvider,
    useAuthContext,
} from '../../../src/contexts/AuthContext';

// =============================================================================
// Mocks
// =============================================================================

let mockOnAuthStateChanged: ReturnType<typeof vi.fn>;
const mockFirebaseSignOut = vi.fn().mockResolvedValue(undefined);
const mockGetDoc = vi.fn();

vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => ({})),
    getApps: vi.fn(() => []),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({})),
    onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
    GoogleAuthProvider: vi.fn(() => ({
        setCustomParameters: vi.fn(),
    })),
    signInWithPopup: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    connectAuthEmulator: vi.fn(),
    signOut: (...args: unknown[]) => mockFirebaseSignOut(...args),
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    connectFirestoreEmulator: vi.fn(),
    terminate: vi.fn().mockResolvedValue(undefined),
    clearIndexedDbPersistence: vi.fn().mockResolvedValue(undefined),
    doc: vi.fn((_db: unknown, collection: string, docId: string) => ({
        path: `${collection}/${docId}`,
    })),
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));

vi.mock('../../../src/services/webPushService', () => ({
    disableWebPushNotifications: vi.fn(),
    WEB_PUSH_CONSTANTS: { LOCAL_STORAGE_KEY: 'test-push-key' },
}));

// Configure as staging project
vi.mock('../../../src/config/firebase', () => ({
    firebaseConfig: {
        projectId: 'boletapp-staging',
        apiKey: 'test-key',
        authDomain: 'boletapp-staging.firebaseapp.com',
    },
    db: { type: 'firestore' },
    auth: { type: 'auth' },
}));

// =============================================================================
// Tests
// =============================================================================

describe('AuthContext — Staging Whitelist (Story 16-9)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
    );

    beforeEach(() => {
        vi.clearAllMocks();
        mockOnAuthStateChanged = vi.fn((_auth, callback) => {
            callback(null);
            return () => {};
        });
    });

    it('should allow whitelisted users on staging', async () => {
        const whitelistedUser = { uid: 'u1', email: 'alice@boletapp.test' };

        mockGetDoc.mockResolvedValue({ exists: () => true });
        mockOnAuthStateChanged = vi.fn((_auth, callback) => {
            callback(whitelistedUser);
            return () => {};
        });

        const { result } = renderHook(() => useAuthContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.user).toEqual(whitelistedUser);
        });

        expect(mockFirebaseSignOut).not.toHaveBeenCalled();
        expect(result.current.initError).toBeNull();
    });

    it('should block non-whitelisted users on staging with clear message', async () => {
        const blockedUser = { uid: 'u2', email: 'stranger@gmail.com' };

        mockGetDoc.mockResolvedValue({ exists: () => false });
        mockOnAuthStateChanged = vi.fn((_auth, callback) => {
            callback(blockedUser);
            return () => {};
        });

        const { result } = renderHook(() => useAuthContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.initError).toBeTruthy();
        });

        expect(result.current.initError).toContain('not authorized');
        expect(mockFirebaseSignOut).toHaveBeenCalledTimes(1);
        expect(result.current.user).toBeNull();
    });

    it('should block access when whitelist check errors (fail closed)', async () => {
        const user = { uid: 'u3', email: 'error-case@test.com' };

        mockGetDoc.mockRejectedValue(new Error('Firestore unavailable'));
        mockOnAuthStateChanged = vi.fn((_auth, callback) => {
            callback(user);
            return () => {};
        });

        const { result } = renderHook(() => useAuthContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.initError).toBeTruthy();
        });

        expect(result.current.initError).toContain('Unable to verify');
        expect(mockFirebaseSignOut).toHaveBeenCalledTimes(1);
        expect(result.current.user).toBeNull();
    });

    it('should block users with null email on staging', async () => {
        const noEmailUser = { uid: 'u5', email: null };

        mockOnAuthStateChanged = vi.fn((_auth, callback) => {
            callback(noEmailUser);
            return () => {};
        });

        const { result } = renderHook(() => useAuthContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.initError).toBeTruthy();
        });

        expect(result.current.initError).toContain('Email-based authentication required');
        expect(mockFirebaseSignOut).toHaveBeenCalledTimes(1);
        expect(mockGetDoc).not.toHaveBeenCalled();
    });

    it('should not check whitelist when user signs out (null user)', async () => {
        mockOnAuthStateChanged = vi.fn((_auth, callback) => {
            callback(null);
            return () => {};
        });

        const { result } = renderHook(() => useAuthContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.user).toBeNull();
        });

        expect(mockGetDoc).not.toHaveBeenCalled();
    });

    it('should check allowedEmails collection with user email as doc ID', async () => {
        const user = { uid: 'u4', email: 'alice@boletapp.test' };

        mockGetDoc.mockResolvedValue({ exists: () => true });
        mockOnAuthStateChanged = vi.fn((_auth, callback) => {
            callback(user);
            return () => {};
        });

        renderHook(() => useAuthContext(), { wrapper });

        await waitFor(() => {
            expect(mockGetDoc).toHaveBeenCalled();
        });

        const docRef = mockGetDoc.mock.calls[0][0];
        expect(docRef.path).toBe('allowedEmails/alice@boletapp.test');
    });
});
