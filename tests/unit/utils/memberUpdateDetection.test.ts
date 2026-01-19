/**
 * Member Update Detection Utility Tests
 *
 * Story 14c.12: Real-Time Sync - Complete the Circuit
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for detecting when other members have modified transactions
 * in shared groups, enabling cross-user cache invalidation.
 *
 * Coverage:
 * - AC3: Detect changes from OTHER members (not self)
 * - AC6: Multiple groups tracked independently
 * - Edge cases: Empty groups, no memberUpdates, initial state
 */

import { describe, it, expect } from 'vitest';
import {
    detectMemberUpdates,
    hasMemberTimestampChanged,
    getMemberSyncTimestamp,
    type MemberUpdatesMap,
} from '../../../src/utils/memberUpdateDetection';
import type { SharedGroup } from '../../../src/types/sharedGroup';

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockGroup = (
    id: string,
    memberUpdates?: Record<string, { lastSyncAt?: { seconds: number } }>
): SharedGroup => ({
    id,
    name: `Group ${id}`,
    ownerId: 'owner-123',
    members: ['owner-123', 'user-a', 'user-b'],
    appId: 'boletapp',
    color: '#10B981',
    createdAt: { seconds: 1700000000, nanoseconds: 0 } as any,
    updatedAt: { seconds: 1700000000, nanoseconds: 0 } as any,
    memberUpdates: memberUpdates as any,
});

// ============================================================================
// detectMemberUpdates Tests
// ============================================================================

describe('detectMemberUpdates', () => {
    const currentUserId = 'user-a';

    describe('AC3: Detect changes from OTHER members (exclude self)', () => {
        it('should detect when another member updates their timestamp', () => {
            const groups = [
                createMockGroup('group-1', {
                    'user-a': { lastSyncAt: { seconds: 1000 } },
                    'user-b': { lastSyncAt: { seconds: 2000 } }, // user-b updated
                }),
            ];

            const previousMap = new Map<string, MemberUpdatesMap>();
            previousMap.set('group-1', {
                'user-a': { lastSyncAt: { seconds: 1000 } },
                'user-b': { lastSyncAt: { seconds: 1000 } }, // was 1000
            });

            const result = detectMemberUpdates(groups, previousMap, currentUserId);

            expect(result.shouldInvalidate).toBe(true);
            expect(result.groupsWithChanges).toContain('group-1');
            expect(result.changeDetails).toHaveLength(1);
            expect(result.changeDetails[0]).toEqual({
                groupId: 'group-1',
                memberId: 'user-b',
                previousTimestamp: 1000,
                currentTimestamp: 2000,
            });
        });

        it('should NOT detect when only self updates timestamp', () => {
            const groups = [
                createMockGroup('group-1', {
                    'user-a': { lastSyncAt: { seconds: 2000 } }, // self updated
                    'user-b': { lastSyncAt: { seconds: 1000 } },
                }),
            ];

            const previousMap = new Map<string, MemberUpdatesMap>();
            previousMap.set('group-1', {
                'user-a': { lastSyncAt: { seconds: 1000 } }, // was 1000
                'user-b': { lastSyncAt: { seconds: 1000 } },
            });

            const result = detectMemberUpdates(groups, previousMap, currentUserId);

            expect(result.shouldInvalidate).toBe(false);
            expect(result.groupsWithChanges).toHaveLength(0);
            expect(result.changeDetails).toHaveLength(0);
        });

        it('should NOT detect when timestamp stays the same', () => {
            const groups = [
                createMockGroup('group-1', {
                    'user-a': { lastSyncAt: { seconds: 1000 } },
                    'user-b': { lastSyncAt: { seconds: 1000 } },
                }),
            ];

            const previousMap = new Map<string, MemberUpdatesMap>();
            previousMap.set('group-1', {
                'user-a': { lastSyncAt: { seconds: 1000 } },
                'user-b': { lastSyncAt: { seconds: 1000 } },
            });

            const result = detectMemberUpdates(groups, previousMap, currentUserId);

            expect(result.shouldInvalidate).toBe(false);
            expect(result.groupsWithChanges).toHaveLength(0);
        });
    });

    describe('AC6: Multiple groups tracked independently', () => {
        it('should only invalidate groups with changes', () => {
            const groups = [
                createMockGroup('group-1', {
                    'user-a': { lastSyncAt: { seconds: 1000 } },
                    'user-b': { lastSyncAt: { seconds: 2000 } }, // changed
                }),
                createMockGroup('group-2', {
                    'user-a': { lastSyncAt: { seconds: 1000 } },
                    'user-b': { lastSyncAt: { seconds: 1000 } }, // no change
                }),
            ];

            const previousMap = new Map<string, MemberUpdatesMap>();
            previousMap.set('group-1', {
                'user-a': { lastSyncAt: { seconds: 1000 } },
                'user-b': { lastSyncAt: { seconds: 1000 } },
            });
            previousMap.set('group-2', {
                'user-a': { lastSyncAt: { seconds: 1000 } },
                'user-b': { lastSyncAt: { seconds: 1000 } },
            });

            const result = detectMemberUpdates(groups, previousMap, currentUserId);

            expect(result.shouldInvalidate).toBe(true);
            expect(result.groupsWithChanges).toEqual(['group-1']);
            expect(result.groupsWithChanges).not.toContain('group-2');
        });

        it('should detect changes in multiple groups independently', () => {
            const groups = [
                createMockGroup('group-1', {
                    'user-a': { lastSyncAt: { seconds: 1000 } },
                    'user-b': { lastSyncAt: { seconds: 2000 } },
                }),
                createMockGroup('group-2', {
                    'user-a': { lastSyncAt: { seconds: 1000 } },
                    'user-c': { lastSyncAt: { seconds: 3000 } },
                }),
            ];

            const previousMap = new Map<string, MemberUpdatesMap>();
            previousMap.set('group-1', {
                'user-a': { lastSyncAt: { seconds: 1000 } },
                'user-b': { lastSyncAt: { seconds: 1000 } },
            });
            previousMap.set('group-2', {
                'user-a': { lastSyncAt: { seconds: 1000 } },
                'user-c': { lastSyncAt: { seconds: 1000 } },
            });

            const result = detectMemberUpdates(groups, previousMap, currentUserId);

            expect(result.shouldInvalidate).toBe(true);
            expect(result.groupsWithChanges).toHaveLength(2);
            expect(result.groupsWithChanges).toContain('group-1');
            expect(result.groupsWithChanges).toContain('group-2');
        });
    });

    describe('Edge cases', () => {
        it('should handle empty groups array', () => {
            const result = detectMemberUpdates([], new Map(), currentUserId);

            expect(result.shouldInvalidate).toBe(false);
            expect(result.groupsWithChanges).toHaveLength(0);
            expect(result.updatedPreviousMap.size).toBe(0);
        });

        it('should handle groups without memberUpdates', () => {
            const groups = [createMockGroup('group-1', undefined)];

            const result = detectMemberUpdates(groups, new Map(), currentUserId);

            expect(result.shouldInvalidate).toBe(false);
            expect(result.groupsWithChanges).toHaveLength(0);
        });

        it('should handle initial state (no previous map entries)', () => {
            const groups = [
                createMockGroup('group-1', {
                    'user-a': { lastSyncAt: { seconds: 1000 } },
                    'user-b': { lastSyncAt: { seconds: 1000 } },
                }),
            ];

            // Empty previous map = first load
            const result = detectMemberUpdates(groups, new Map(), currentUserId);

            // First load should detect user-b's timestamp > 0 (previous was undefined = 0)
            expect(result.shouldInvalidate).toBe(true);
            expect(result.groupsWithChanges).toContain('group-1');
        });

        it('should handle new member joining group', () => {
            const groups = [
                createMockGroup('group-1', {
                    'user-a': { lastSyncAt: { seconds: 1000 } },
                    'user-b': { lastSyncAt: { seconds: 1000 } },
                    'user-c': { lastSyncAt: { seconds: 500 } }, // new member
                }),
            ];

            const previousMap = new Map<string, MemberUpdatesMap>();
            previousMap.set('group-1', {
                'user-a': { lastSyncAt: { seconds: 1000 } },
                'user-b': { lastSyncAt: { seconds: 1000 } },
                // user-c was not here before
            });

            const result = detectMemberUpdates(groups, previousMap, currentUserId);

            // user-c: 500 > 0 (undefined), so should trigger
            expect(result.shouldInvalidate).toBe(true);
            expect(result.changeDetails[0].memberId).toBe('user-c');
        });

        it('should handle memberUpdates with undefined lastSyncAt', () => {
            const groups = [
                createMockGroup('group-1', {
                    'user-a': { lastSyncAt: { seconds: 1000 } },
                    'user-b': { lastSyncAt: undefined },
                }),
            ];

            const previousMap = new Map<string, MemberUpdatesMap>();
            previousMap.set('group-1', {
                'user-a': { lastSyncAt: { seconds: 1000 } },
                'user-b': { lastSyncAt: undefined },
            });

            const result = detectMemberUpdates(groups, previousMap, currentUserId);

            // Both are 0 (undefined), no change
            expect(result.shouldInvalidate).toBe(false);
        });

        it('should update previousMap with all current entries', () => {
            const groups = [
                createMockGroup('group-1', {
                    'user-a': { lastSyncAt: { seconds: 1000 } },
                    'user-b': { lastSyncAt: { seconds: 2000 } },
                }),
            ];

            const result = detectMemberUpdates(groups, new Map(), currentUserId);

            expect(result.updatedPreviousMap.has('group-1')).toBe(true);
            const updated = result.updatedPreviousMap.get('group-1');
            expect(updated?.['user-a']?.lastSyncAt?.seconds).toBe(1000);
            expect(updated?.['user-b']?.lastSyncAt?.seconds).toBe(2000);
        });
    });
});

// ============================================================================
// hasMemberTimestampChanged Tests
// ============================================================================

describe('hasMemberTimestampChanged', () => {
    it('should return true when timestamp increased', () => {
        const current: MemberUpdatesMap = {
            'user-b': { lastSyncAt: { seconds: 2000 } },
        };
        const previous: MemberUpdatesMap = {
            'user-b': { lastSyncAt: { seconds: 1000 } },
        };

        expect(hasMemberTimestampChanged(current, previous, 'user-b')).toBe(true);
    });

    it('should return false when timestamp unchanged', () => {
        const current: MemberUpdatesMap = {
            'user-b': { lastSyncAt: { seconds: 1000 } },
        };
        const previous: MemberUpdatesMap = {
            'user-b': { lastSyncAt: { seconds: 1000 } },
        };

        expect(hasMemberTimestampChanged(current, previous, 'user-b')).toBe(false);
    });

    it('should return false when checking excluded user', () => {
        const current: MemberUpdatesMap = {
            'user-a': { lastSyncAt: { seconds: 2000 } },
        };
        const previous: MemberUpdatesMap = {
            'user-a': { lastSyncAt: { seconds: 1000 } },
        };

        // Exclude user-a (self)
        expect(hasMemberTimestampChanged(current, previous, 'user-a', 'user-a')).toBe(false);
    });

    it('should handle undefined previous map', () => {
        const current: MemberUpdatesMap = {
            'user-b': { lastSyncAt: { seconds: 1000 } },
        };

        expect(hasMemberTimestampChanged(current, undefined, 'user-b')).toBe(true);
    });

    it('should handle undefined current map', () => {
        const previous: MemberUpdatesMap = {
            'user-b': { lastSyncAt: { seconds: 1000 } },
        };

        expect(hasMemberTimestampChanged(undefined, previous, 'user-b')).toBe(false);
    });
});

// ============================================================================
// getMemberSyncTimestamp Tests
// ============================================================================

describe('getMemberSyncTimestamp', () => {
    it('should return timestamp seconds when available', () => {
        const memberUpdates: MemberUpdatesMap = {
            'user-a': { lastSyncAt: { seconds: 1234567890 } },
        };

        expect(getMemberSyncTimestamp(memberUpdates, 'user-a')).toBe(1234567890);
    });

    it('should return 0 for unknown member', () => {
        const memberUpdates: MemberUpdatesMap = {
            'user-a': { lastSyncAt: { seconds: 1234567890 } },
        };

        expect(getMemberSyncTimestamp(memberUpdates, 'user-unknown')).toBe(0);
    });

    it('should return 0 for undefined memberUpdates', () => {
        expect(getMemberSyncTimestamp(undefined, 'user-a')).toBe(0);
    });

    it('should return 0 for undefined lastSyncAt', () => {
        const memberUpdates: MemberUpdatesMap = {
            'user-a': { lastSyncAt: undefined },
        };

        expect(getMemberSyncTimestamp(memberUpdates, 'user-a')).toBe(0);
    });
});
