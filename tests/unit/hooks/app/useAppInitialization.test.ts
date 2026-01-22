/**
 * Unit tests for useAppInitialization hook
 *
 * Story 14c-refactor.10: App Decomposition - Extract app-level hooks
 *
 * Tests the app initialization coordination hook:
 * - Initialization state derivation from AuthContext
 * - isReady computed state
 * - Pass-through of auth actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useAppInitialization } from '../../../../src/hooks/app/useAppInitialization';

// Mock AuthContext
const mockAuthContext = {
    user: null as any,
    services: null as any,
    initError: null as string | null,
    signIn: vi.fn(),
    signInWithTestCredentials: vi.fn(),
    signOut: vi.fn(),
};

vi.mock('../../../../src/contexts/AuthContext', () => ({
    useAuthContext: () => mockAuthContext,
}));

describe('useAppInitialization', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock state
        mockAuthContext.user = null;
        mockAuthContext.services = null;
        mockAuthContext.initError = null;
    });

    describe('isInitialized', () => {
        it('should be false when services and initError are both null', () => {
            const { result } = renderHook(() => useAppInitialization());

            expect(result.current.isInitialized).toBe(false);
        });

        it('should be true when services are available', () => {
            mockAuthContext.services = { auth: {}, db: {}, appId: 'test-app' };

            const { result } = renderHook(() => useAppInitialization());

            expect(result.current.isInitialized).toBe(true);
        });

        it('should be true when initError is set', () => {
            mockAuthContext.initError = 'Firebase Config Missing';

            const { result } = renderHook(() => useAppInitialization());

            expect(result.current.isInitialized).toBe(true);
        });
    });

    describe('isReady', () => {
        it('should be false when services are null', () => {
            mockAuthContext.user = { uid: 'user-123' };

            const { result } = renderHook(() => useAppInitialization());

            expect(result.current.isReady).toBe(false);
        });

        it('should be false when user is null', () => {
            mockAuthContext.services = { auth: {}, db: {}, appId: 'test-app' };

            const { result } = renderHook(() => useAppInitialization());

            expect(result.current.isReady).toBe(false);
        });

        it('should be true when both services and user are available', () => {
            mockAuthContext.services = { auth: {}, db: {}, appId: 'test-app' };
            mockAuthContext.user = { uid: 'user-123' };

            const { result } = renderHook(() => useAppInitialization());

            expect(result.current.isReady).toBe(true);
        });
    });

    describe('pass-through values', () => {
        it('should pass through initError from auth context', () => {
            mockAuthContext.initError = 'Test Error';

            const { result } = renderHook(() => useAppInitialization());

            expect(result.current.initError).toBe('Test Error');
        });

        it('should pass through services from auth context', () => {
            const mockServices = { auth: {}, db: {}, appId: 'test-app' };
            mockAuthContext.services = mockServices;

            const { result } = renderHook(() => useAppInitialization());

            expect(result.current.services).toBe(mockServices);
        });

        it('should pass through user from auth context', () => {
            const mockUser = { uid: 'user-123', displayName: 'Test User' };
            mockAuthContext.user = mockUser;

            const { result } = renderHook(() => useAppInitialization());

            expect(result.current.user).toBe(mockUser);
        });
    });

    describe('pass-through actions', () => {
        it('should pass through signIn action', () => {
            const { result } = renderHook(() => useAppInitialization());

            expect(result.current.signIn).toBe(mockAuthContext.signIn);
        });

        it('should pass through signInWithTestCredentials action', () => {
            const { result } = renderHook(() => useAppInitialization());

            expect(result.current.signInWithTestCredentials).toBe(
                mockAuthContext.signInWithTestCredentials
            );
        });

        it('should pass through signOut action', () => {
            const { result } = renderHook(() => useAppInitialization());

            expect(result.current.signOut).toBe(mockAuthContext.signOut);
        });
    });

    describe('state transitions', () => {
        it('should update isInitialized when services become available', () => {
            const { result, rerender } = renderHook(() => useAppInitialization());

            expect(result.current.isInitialized).toBe(false);

            // Simulate services becoming available
            mockAuthContext.services = { auth: {}, db: {}, appId: 'test-app' };
            rerender();

            expect(result.current.isInitialized).toBe(true);
        });

        it('should update isReady when user signs in', () => {
            mockAuthContext.services = { auth: {}, db: {}, appId: 'test-app' };

            const { result, rerender } = renderHook(() => useAppInitialization());

            expect(result.current.isReady).toBe(false);

            // Simulate user signing in
            mockAuthContext.user = { uid: 'user-123' };
            rerender();

            expect(result.current.isReady).toBe(true);
        });

        it('should update isReady when user signs out', () => {
            mockAuthContext.services = { auth: {}, db: {}, appId: 'test-app' };
            mockAuthContext.user = { uid: 'user-123' };

            const { result, rerender } = renderHook(() => useAppInitialization());

            expect(result.current.isReady).toBe(true);

            // Simulate user signing out
            mockAuthContext.user = null;
            rerender();

            expect(result.current.isReady).toBe(false);
        });
    });
});
