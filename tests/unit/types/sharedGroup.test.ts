/**
 * SharedGroup Types Tests
 *
 * Story 14d-v2-1-12a: User Transaction Sharing Preference - Foundation
 *
 * Tests for:
 * - AC1: toggleCountResetAt field on UserGroupPreference
 * - AC2: UserSharedGroupsPreferences interface (verify existing)
 * - AC3: createDefaultGroupPreference() factory function
 */

import { describe, it, expect } from 'vitest';
import type { UserGroupPreference, UserSharedGroupsPreferences } from '@/types/sharedGroup';
import {
    createDefaultGroupPreference,
    SHARED_GROUP_LIMITS,
    DEFAULT_GROUP_PREFERENCE,
} from '@/types/sharedGroup';
import { createMockTimestamp } from '../../helpers';

describe('UserGroupPreference Type (AC1)', () => {
    it('interface includes toggleCountResetAt field', () => {
        // TypeScript will fail compilation if toggleCountResetAt is missing
        const preference: UserGroupPreference = {
            shareMyTransactions: true,
            lastToggleAt: null,
            toggleCountToday: 0,
            toggleCountResetAt: null,
        };

        expect(preference.toggleCountResetAt).toBeNull();
    });

    it('toggleCountResetAt accepts Timestamp value', () => {
        const now = new Date();
        const preference: UserGroupPreference = {
            shareMyTransactions: true,
            lastToggleAt: null,
            toggleCountToday: 0,
            toggleCountResetAt: createMockTimestamp(now),
        };

        expect(preference.toggleCountResetAt).not.toBeNull();
        expect(preference.toggleCountResetAt?.toDate()).toEqual(now);
    });

    it('toggleCountResetAt accepts null value', () => {
        const preference: UserGroupPreference = {
            shareMyTransactions: false,
            lastToggleAt: createMockTimestamp(new Date()),
            toggleCountToday: 2,
            toggleCountResetAt: null,
        };

        expect(preference.toggleCountResetAt).toBeNull();
    });
});

describe('UserSharedGroupsPreferences Interface (AC2)', () => {
    it('interface exists and has groupPreferences field', () => {
        // This test verifies the interface exists at expected location
        const prefs: UserSharedGroupsPreferences = {
            groupPreferences: {},
        };

        expect(prefs.groupPreferences).toBeDefined();
        expect(typeof prefs.groupPreferences).toBe('object');
    });

    it('groupPreferences is Record<string, UserGroupPreference>', () => {
        const prefs: UserSharedGroupsPreferences = {
            groupPreferences: {
                'group-123': {
                    shareMyTransactions: true,
                    lastToggleAt: null,
                    toggleCountToday: 0,
                    toggleCountResetAt: null,
                },
                'group-456': {
                    shareMyTransactions: false,
                    lastToggleAt: createMockTimestamp(new Date()),
                    toggleCountToday: 2,
                    toggleCountResetAt: createMockTimestamp(new Date()),
                },
            },
        };

        expect(Object.keys(prefs.groupPreferences)).toHaveLength(2);
        expect(prefs.groupPreferences['group-123'].shareMyTransactions).toBe(true);
        expect(prefs.groupPreferences['group-456'].shareMyTransactions).toBe(false);
    });
});

describe('createDefaultGroupPreference Factory (AC3)', () => {
    it('returns UserGroupPreference with shareMyTransactions: false (privacy-first LV-6)', () => {
        const preference = createDefaultGroupPreference();

        expect(preference.shareMyTransactions).toBe(false);
    });

    it('returns lastToggleAt: null by default', () => {
        const preference = createDefaultGroupPreference();

        expect(preference.lastToggleAt).toBeNull();
    });

    it('returns toggleCountToday: 0 by default', () => {
        const preference = createDefaultGroupPreference();

        expect(preference.toggleCountToday).toBe(0);
    });

    it('returns toggleCountResetAt: null by default', () => {
        const preference = createDefaultGroupPreference();

        expect(preference.toggleCountResetAt).toBeNull();
    });

    it('allows overriding shareMyTransactions', () => {
        const preference = createDefaultGroupPreference({
            shareMyTransactions: true,
        });

        expect(preference.shareMyTransactions).toBe(true);
        // Other defaults remain
        expect(preference.lastToggleAt).toBeNull();
        expect(preference.toggleCountToday).toBe(0);
        expect(preference.toggleCountResetAt).toBeNull();
    });

    it('allows overriding lastToggleAt', () => {
        const timestamp = createMockTimestamp(new Date());
        const preference = createDefaultGroupPreference({
            lastToggleAt: timestamp,
        });

        expect(preference.lastToggleAt).toBe(timestamp);
        // Other defaults remain
        expect(preference.shareMyTransactions).toBe(false);
        expect(preference.toggleCountToday).toBe(0);
    });

    it('allows overriding toggleCountToday', () => {
        const preference = createDefaultGroupPreference({
            toggleCountToday: 2,
        });

        expect(preference.toggleCountToday).toBe(2);
        // Other defaults remain
        expect(preference.shareMyTransactions).toBe(false);
        expect(preference.lastToggleAt).toBeNull();
    });

    it('allows overriding toggleCountResetAt', () => {
        const timestamp = createMockTimestamp(new Date());
        const preference = createDefaultGroupPreference({
            toggleCountResetAt: timestamp,
        });

        expect(preference.toggleCountResetAt).toBe(timestamp);
        // Other defaults remain
        expect(preference.shareMyTransactions).toBe(false);
    });

    it('allows overriding multiple fields at once', () => {
        const timestamp = createMockTimestamp(new Date());
        const preference = createDefaultGroupPreference({
            shareMyTransactions: true,
            toggleCountToday: 1,
            lastToggleAt: timestamp,
        });

        expect(preference.shareMyTransactions).toBe(true);
        expect(preference.toggleCountToday).toBe(1);
        expect(preference.lastToggleAt).toBe(timestamp);
        expect(preference.toggleCountResetAt).toBeNull(); // Still default
    });

    it('returns a new object each time (not shared reference)', () => {
        const pref1 = createDefaultGroupPreference();
        const pref2 = createDefaultGroupPreference();

        expect(pref1).not.toBe(pref2);
        expect(pref1).toEqual(pref2);
    });
});

describe('SHARED_GROUP_LIMITS User-Level Constants', () => {
    it('has USER_SHARING_COOLDOWN_MINUTES constant set to 5', () => {
        expect(SHARED_GROUP_LIMITS.USER_SHARING_COOLDOWN_MINUTES).toBe(5);
    });

    it('has USER_SHARING_DAILY_LIMIT constant set to 3', () => {
        expect(SHARED_GROUP_LIMITS.USER_SHARING_DAILY_LIMIT).toBe(3);
    });

    it('USER_SHARING_COOLDOWN_MINUTES differs from group-level cooldown', () => {
        // User-level is 5 minutes, group-level is 15 minutes
        expect(SHARED_GROUP_LIMITS.USER_SHARING_COOLDOWN_MINUTES).toBe(5);
        expect(SHARED_GROUP_LIMITS.TRANSACTION_SHARING_COOLDOWN_MINUTES).toBe(15);
        expect(SHARED_GROUP_LIMITS.USER_SHARING_COOLDOWN_MINUTES).not.toBe(
            SHARED_GROUP_LIMITS.TRANSACTION_SHARING_COOLDOWN_MINUTES
        );
    });

    it('USER_SHARING_DAILY_LIMIT equals group-level daily limit', () => {
        // Both have same 3x daily limit
        expect(SHARED_GROUP_LIMITS.USER_SHARING_DAILY_LIMIT).toBe(3);
        expect(SHARED_GROUP_LIMITS.TRANSACTION_SHARING_DAILY_LIMIT).toBe(3);
    });
});

describe('DEFAULT_GROUP_PREFERENCE Constant', () => {
    it('exists and has expected structure', () => {
        expect(DEFAULT_GROUP_PREFERENCE).toBeDefined();
        expect(DEFAULT_GROUP_PREFERENCE.lastToggleAt).toBeNull();
        expect(DEFAULT_GROUP_PREFERENCE.toggleCountToday).toBe(0);
    });

    it('does not include shareMyTransactions (by design)', () => {
        // DEFAULT_GROUP_PREFERENCE is Omit<UserGroupPreference, 'shareMyTransactions'>
        // This is intentional - shareMyTransactions must be explicitly set
        expect('shareMyTransactions' in DEFAULT_GROUP_PREFERENCE).toBe(false);
    });
});
