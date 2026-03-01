/**
 * Unit tests for useUserContextOrchestrator
 *
 * Story TD-15b-35: Orchestrator Cleanup
 *
 * Verifies return shape and hook composition.
 * After getFirestore() migration, db is sourced from services?.db.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUserContextOrchestrator } from '../../../../src/app/hooks/useUserContextOrchestrator';

// Mock all composed hooks
vi.mock('../../../../src/hooks/useAuth', () => ({
    useAuth: vi.fn(() => ({
        user: { uid: 'test-uid' },
        services: { db: { type: 'firestore' }, appId: 'test-app' },
        initError: null,
        signIn: vi.fn(),
        signInWithTestCredentials: vi.fn(),
        signOut: vi.fn(),
    })),
}));

vi.mock('../../../../src/hooks/useUserPreferences', () => ({
    useUserPreferences: vi.fn(() => ({
        preferences: { fontFamily: 'outfit', defaultCurrency: 'CLP' },
    })),
}));

vi.mock('../../../../src/hooks/useUserCredits', () => ({
    useUserCredits: vi.fn(() => ({
        credits: { available: 10 },
        deductCredits: vi.fn(),
        deductSuperCredits: vi.fn(),
        addCredits: vi.fn(),
        addSuperCredits: vi.fn(),
    })),
}));

vi.mock('../../../../src/hooks/usePersonalRecords', () => ({
    usePersonalRecords: vi.fn(() => ({
        recordToCelebrate: null,
        showRecordBanner: false,
        checkForRecords: vi.fn(),
        dismissRecord: vi.fn(),
    })),
}));

vi.mock('../../../../src/hooks/useInAppNotifications', () => ({
    useInAppNotifications: vi.fn(() => ({
        notifications: [],
        unreadCount: 0,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        deleteNotification: vi.fn(),
        deleteAllNotifications: vi.fn(),
    })),
}));

vi.mock('../../../../src/hooks/useReducedMotion', () => ({
    useReducedMotion: vi.fn(() => false),
}));

vi.mock('../../../../src/utils/migrateCreatedAt', () => ({
    migrateCreatedAt: vi.fn(),
}));

describe('useUserContextOrchestrator', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('returns all expected keys', () => {
        const { result } = renderHook(() => useUserContextOrchestrator());

        const expectedKeys = [
            'user', 'services', 'initError', 'signIn', 'signInWithTestCredentials', 'signOut',
            'db', 'userPreferences', 'userCredits',
            'deductUserCredits', 'deductUserSuperCredits', 'addUserCredits', 'addUserSuperCredits',
            'recordToCelebrate', 'showRecordBanner', 'checkForRecords', 'dismissRecord',
            'inAppNotifications', 'inAppNotificationsUnreadCount',
            'markNotificationAsRead', 'markAllNotificationsAsRead',
            'deleteInAppNotification', 'deleteAllInAppNotifications',
            'prefersReducedMotion',
        ];

        for (const key of expectedKeys) {
            expect(result.current).toHaveProperty(key);
        }
    });

    it('does not return wiping or exporting (dead state removed)', () => {
        const { result } = renderHook(() => useUserContextOrchestrator());

        expect(result.current).not.toHaveProperty('wiping');
        expect(result.current).not.toHaveProperty('exporting');
    });

    it('sources db from services.db instead of getFirestore()', () => {
        const { result } = renderHook(() => useUserContextOrchestrator());

        // db should be the mock services.db object
        expect(result.current.db).toEqual({ type: 'firestore' });
    });

    it('passes services.db to useInAppNotifications', async () => {
        const { useInAppNotifications } = vi.mocked(
            await import('../../../../src/hooks/useInAppNotifications')
        );

        renderHook(() => useUserContextOrchestrator());

        expect(useInAppNotifications).toHaveBeenCalledWith(
            { type: 'firestore' }, // services.db
            'test-uid',
            'test-app',
        );
    });

    it('returns null db when services is null', async () => {
        const { useAuth } = vi.mocked(await import('../../../../src/hooks/useAuth'));
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
            user: null,
            services: null,
            initError: null,
            signIn: vi.fn(),
            signInWithTestCredentials: vi.fn(),
            signOut: vi.fn(),
        });

        const { result } = renderHook(() => useUserContextOrchestrator());

        expect(result.current.db).toBeNull();
    });
});
