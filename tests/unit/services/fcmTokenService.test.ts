/**
 * FCM Token Service Tests
 *
 * Story 14c.13: FCM Push Notifications for Shared Groups
 * Epic 14c: Household Sharing
 *
 * Tests for FCM token storage and management functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    FCM_TOKEN_CONSTANTS,
    isNotificationsEnabledLocal,
    getStoredFCMToken,
} from '../../../src/services/fcmTokenService';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

describe('fcmTokenService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('FCM_TOKEN_CONSTANTS', () => {
        it('should have correct localStorage key for enabled state', () => {
            expect(FCM_TOKEN_CONSTANTS.LOCAL_STORAGE_KEY).toBe('fcm_notifications_enabled');
        });

        it('should have correct localStorage key for token', () => {
            expect(FCM_TOKEN_CONSTANTS.LOCAL_STORAGE_TOKEN_KEY).toBe('fcm_current_token');
        });

        it('should have 60 day stale token threshold', () => {
            expect(FCM_TOKEN_CONSTANTS.STALE_TOKEN_DAYS).toBe(60);
        });

        it('should have 1 minute rate limit', () => {
            expect(FCM_TOKEN_CONSTANTS.RATE_LIMIT_MS).toBe(60 * 1000);
        });
    });

    describe('isNotificationsEnabledLocal', () => {
        it('should return false when localStorage is empty', () => {
            expect(isNotificationsEnabledLocal()).toBe(false);
        });

        it('should return true when localStorage has enabled flag', () => {
            localStorageMock.setItem(FCM_TOKEN_CONSTANTS.LOCAL_STORAGE_KEY, 'true');
            expect(isNotificationsEnabledLocal()).toBe(true);
        });

        it('should return false when localStorage has other value', () => {
            localStorageMock.setItem(FCM_TOKEN_CONSTANTS.LOCAL_STORAGE_KEY, 'false');
            expect(isNotificationsEnabledLocal()).toBe(false);
        });
    });

    describe('getStoredFCMToken', () => {
        it('should return null when no token stored', () => {
            expect(getStoredFCMToken()).toBe(null);
        });

        it('should return stored token', () => {
            const testToken = 'test-fcm-token-12345';
            localStorageMock.setItem(FCM_TOKEN_CONSTANTS.LOCAL_STORAGE_TOKEN_KEY, testToken);
            expect(getStoredFCMToken()).toBe(testToken);
        });
    });
});
