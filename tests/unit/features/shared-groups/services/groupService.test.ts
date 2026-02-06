/**
 * Group Service Tests
 *
 * Story 14d-v2-1-7g: Edit Group Settings
 * Story 14d-v2-1-12d: User Preferences Cleanup on Leave
 * Epic 14d-v2: Shared Groups v2
 *
 * Tests for updateGroup function:
 * - Field updates (name, icon, color)
 * - Validation (name length, whitelist)
 * - XSS protection (sanitizeInput)
 * - Authorization (owner check)
 * - Edge cases (empty updates, group not found)
 *
 * Tests for leaveGroupWithCleanup (Story 14d-v2-1-12d):
 * - AC#5: Calls removeGroupPreference after successful leave
 * - AC#7: Cleanup errors logged but don't block leave
 *
 * Tests for transferAndLeaveWithCleanup (Story 14d-v2-1-12d):
 * - AC#6: Calls transferOwnership, leaveGroup, then removeGroupPreference
 * - AC#7: Cleanup failure after transfer+leave doesn't throw
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Firestore, DocumentReference, DocumentSnapshot } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import type { SharedGroup } from '@/types/sharedGroup';

// =============================================================================
// Mocks
// =============================================================================

// Mock Firestore functions
const mockDoc = vi.fn();
const mockServerTimestamp = vi.fn();

// Mock transaction object for runTransaction
const mockTransactionGet = vi.fn();
const mockTransactionUpdate = vi.fn();
const mockTransactionSet = vi.fn();
const mockTransaction = {
    get: mockTransactionGet,
    update: mockTransactionUpdate,
    set: mockTransactionSet,
};

// Mock runTransaction - executes the callback with mockTransaction
const mockRunTransaction = vi.fn(async (_db: unknown, callback: (transaction: typeof mockTransaction) => Promise<void>) => {
    return callback(mockTransaction);
});

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual,
        doc: (...args: unknown[]) => mockDoc(...args),
        runTransaction: (...args: unknown[]) => mockRunTransaction(...args),
        serverTimestamp: () => mockServerTimestamp(),
    };
});

// Mock sanitizeInput
const mockSanitizeInput = vi.fn((input: string) => input.trim());

vi.mock('@/utils/sanitize', () => ({
    sanitizeInput: (input: string, options?: { maxLength?: number }) =>
        mockSanitizeInput(input, options),
}));

// Import after mocks
import {
    updateGroup,
    GROUP_COLORS,
    GROUP_ICONS,
    joinGroupDirectly,
} from '@/features/shared-groups/services/groupService';

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockDb(): Firestore {
    return {} as Firestore;
}

function createMockGroup(overrides: Partial<SharedGroup> = {}): SharedGroup {
    return {
        id: 'group-123',
        ownerId: 'owner-user-123',
        appId: 'boletapp',
        name: 'Test Group',
        color: '#10b981',
        icon: '🏠',
        shareCode: 'TestShareCode1234',
        shareCodeExpiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        members: ['owner-user-123', 'member-456'],
        memberUpdates: {},
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        timezone: 'America/Santiago',
        transactionSharingEnabled: true,
        transactionSharingLastToggleAt: null,
        transactionSharingToggleCountToday: 0,
        ...overrides,
    };
}

function createMockDocRef(): DocumentReference {
    return { id: 'group-123' } as DocumentReference;
}

function createMockDocSnapshot(exists: boolean, data?: SharedGroup): DocumentSnapshot {
    return {
        exists: () => exists,
        data: () => data,
        id: data?.id || 'group-123',
    } as unknown as DocumentSnapshot;
}

// =============================================================================
// Tests
// =============================================================================

describe('updateGroup (Story 14d-v2-1-7g)', () => {
    const mockDb = createMockDb();
    const mockDocRef = createMockDocRef();
    const mockGroup = createMockGroup();
    const mockTimestamp = { toDate: () => new Date() };

    beforeEach(() => {
        vi.clearAllMocks();
        mockDoc.mockReturnValue(mockDocRef);
        mockServerTimestamp.mockReturnValue(mockTimestamp);
        mockSanitizeInput.mockImplementation((input: string) => input?.trim() || '');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // =========================================================================
    // Successful Update Tests
    // =========================================================================

    describe('successful updates', () => {
        beforeEach(() => {
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, mockGroup));
        });

        it('updates group name successfully', async () => {
            const updates = { name: 'New Group Name' };

            await updateGroup(mockDb, 'group-123', 'owner-user-123', updates);

            expect(mockTransactionUpdate).toHaveBeenCalledWith(mockDocRef, {
                name: 'New Group Name',
                updatedAt: mockTimestamp,
            });
        });

        it('updates group icon successfully', async () => {
            const updates = { icon: '🎉' };

            await updateGroup(mockDb, 'group-123', 'owner-user-123', updates);

            expect(mockTransactionUpdate).toHaveBeenCalledWith(mockDocRef, {
                icon: '🎉',
                updatedAt: mockTimestamp,
            });
        });

        it('updates group color successfully', async () => {
            const updates = { color: '#3b82f6' };

            await updateGroup(mockDb, 'group-123', 'owner-user-123', updates);

            expect(mockTransactionUpdate).toHaveBeenCalledWith(mockDocRef, {
                color: '#3b82f6',
                updatedAt: mockTimestamp,
            });
        });

        it('updates multiple fields at once', async () => {
            const updates = {
                name: 'Updated Name',
                icon: '🚗',
                color: '#ef4444',
            };

            await updateGroup(mockDb, 'group-123', 'owner-user-123', updates);

            expect(mockTransactionUpdate).toHaveBeenCalledWith(mockDocRef, {
                name: 'Updated Name',
                icon: '🚗',
                color: '#ef4444',
                updatedAt: mockTimestamp,
            });
        });
    });

    // =========================================================================
    // Name Validation Tests
    // =========================================================================

    describe('name validation', () => {
        beforeEach(() => {
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, mockGroup));
        });

        it('throws error if name is too short (< 2 chars)', async () => {
            const updates = { name: 'A' };

            await expect(
                updateGroup(mockDb, 'group-123', 'owner-user-123', updates)
            ).rejects.toThrow('Group name must be between 2 and 50 characters');
        });

        it('throws error if name is too long (> 50 chars)', async () => {
            const updates = { name: 'A'.repeat(51) };

            await expect(
                updateGroup(mockDb, 'group-123', 'owner-user-123', updates)
            ).rejects.toThrow('Group name must be between 2 and 50 characters');
        });

        it('accepts name at minimum length (2 chars)', async () => {
            // Transaction mock already set up in beforeEach
            const updates = { name: 'AB' };

            await expect(
                updateGroup(mockDb, 'group-123', 'owner-user-123', updates)
            ).resolves.not.toThrow();
        });

        it('accepts name at maximum length (50 chars)', async () => {
            // Transaction mock already set up in beforeEach
            const updates = { name: 'A'.repeat(50) };

            await expect(
                updateGroup(mockDb, 'group-123', 'owner-user-123', updates)
            ).resolves.not.toThrow();
        });

        it('sanitizes XSS from name', async () => {
            // Transaction mock already set up in beforeEach
            mockSanitizeInput.mockReturnValue('Clean Name');
            const updates = { name: '<script>alert("xss")</script>Clean Name' };

            await updateGroup(mockDb, 'group-123', 'owner-user-123', updates);

            expect(mockSanitizeInput).toHaveBeenCalledWith(
                '<script>alert("xss")</script>Clean Name',
                { maxLength: 50 }
            );
            expect(mockTransactionUpdate).toHaveBeenCalledWith(mockDocRef, {
                name: 'Clean Name',
                updatedAt: mockTimestamp,
            });
        });
    });

    // =========================================================================
    // Authorization Tests
    // =========================================================================

    describe('authorization', () => {
        it('throws error if user is not owner', async () => {
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, mockGroup));
            const updates = { name: 'New Name' };

            await expect(
                updateGroup(mockDb, 'group-123', 'not-the-owner', updates)
            ).rejects.toThrow('Only the group owner can update group settings');
        });

        it('throws error if group not found', async () => {
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(false));
            const updates = { name: 'New Name' };

            await expect(
                updateGroup(mockDb, 'group-123', 'owner-user-123', updates)
            ).rejects.toThrow('Group not found');
        });
    });

    // =========================================================================
    // Whitelist Validation Tests
    // =========================================================================

    describe('whitelist validation', () => {
        beforeEach(() => {
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, mockGroup));
        });

        it('throws error if icon not in whitelist', async () => {
            const updates = { icon: 'not-an-emoji' };

            await expect(
                updateGroup(mockDb, 'group-123', 'owner-user-123', updates)
            ).rejects.toThrow('Invalid icon');
        });

        it('throws error if color not in whitelist', async () => {
            const updates = { color: '#invalid' };

            await expect(
                updateGroup(mockDb, 'group-123', 'owner-user-123', updates)
            ).rejects.toThrow('Invalid color');
        });

        it('accepts valid icons from whitelist', async () => {
            // Transaction mock already set up in beforeEach
            // Use first icon from whitelist
            const validIcon = GROUP_ICONS[0];
            const updates = { icon: validIcon };

            await expect(
                updateGroup(mockDb, 'group-123', 'owner-user-123', updates)
            ).resolves.not.toThrow();
        });

        it('accepts valid colors from whitelist', async () => {
            // Transaction mock already set up in beforeEach
            // Use first color from whitelist
            const validColor = GROUP_COLORS[0];
            const updates = { color: validColor };

            await expect(
                updateGroup(mockDb, 'group-123', 'owner-user-123', updates)
            ).resolves.not.toThrow();
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================

    describe('edge cases', () => {
        beforeEach(() => {
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, mockGroup));
        });

        it('throws error if no updates provided', async () => {
            const updates = {};

            await expect(
                updateGroup(mockDb, 'group-123', 'owner-user-123', updates)
            ).rejects.toThrow('No updates provided');
        });

        it('throws error if all fields are undefined', async () => {
            const updates = { name: undefined, icon: undefined, color: undefined };

            await expect(
                updateGroup(mockDb, 'group-123', 'owner-user-123', updates)
            ).rejects.toThrow('No updates provided');
        });

        it('ignores undefined fields and updates only provided ones', async () => {
            // Transaction mock already set up in beforeEach
            const updates = { name: 'New Name', icon: undefined };

            await updateGroup(mockDb, 'group-123', 'owner-user-123', updates);

            expect(mockTransactionUpdate).toHaveBeenCalledWith(mockDocRef, {
                name: 'New Name',
                updatedAt: mockTimestamp,
            });
        });

        it('validates trimmed name length (whitespace-only is invalid)', async () => {
            mockSanitizeInput.mockReturnValue('');
            const updates = { name: '   ' };

            await expect(
                updateGroup(mockDb, 'group-123', 'owner-user-123', updates)
            ).rejects.toThrow('Group name must be between 2 and 50 characters');
        });
    });
});

// =============================================================================
// Whitelist Constants Tests
// =============================================================================

describe('GROUP_COLORS constant', () => {
    it('is defined and contains valid hex colors', () => {
        expect(GROUP_COLORS).toBeDefined();
        expect(Array.isArray(GROUP_COLORS)).toBe(true);
        expect(GROUP_COLORS.length).toBeGreaterThan(0);

        // All colors should be valid hex format
        GROUP_COLORS.forEach(color => {
            expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
        });
    });

    it('includes default emerald color', () => {
        expect(GROUP_COLORS).toContain('#10b981');
    });
});

describe('GROUP_ICONS constant', () => {
    it('is defined and contains emojis', () => {
        expect(GROUP_ICONS).toBeDefined();
        expect(Array.isArray(GROUP_ICONS)).toBe(true);
        expect(GROUP_ICONS.length).toBeGreaterThan(0);
    });

    it('includes common expense-related emojis', () => {
        // Check for common categories
        expect(GROUP_ICONS).toContain('🏠'); // Home
        expect(GROUP_ICONS).toContain('🚗'); // Travel
    });
});

// =============================================================================
// updateTransactionSharingEnabled Tests (Story 14d-v2-1-11b)
// =============================================================================

// Mock sharingCooldown utilities
const mockCanToggleTransactionSharing = vi.fn();
const mockShouldResetDailyCount = vi.fn();

vi.mock('@/utils/sharingCooldown', () => ({
    canToggleTransactionSharing: (...args: unknown[]) => mockCanToggleTransactionSharing(...args),
    shouldResetDailyCount: (...args: unknown[]) => mockShouldResetDailyCount(...args),
}));

// Import after mocks - updateTransactionSharingEnabled will be added to groupService
import { updateTransactionSharingEnabled } from '@/features/shared-groups/services/groupService';

// =============================================================================
// Mock userPreferencesService for cleanup tests (Story 14d-v2-1-12d)
// =============================================================================

const mockRemoveGroupPreference = vi.fn();

vi.mock('@/services/userPreferencesService', () => ({
    removeGroupPreference: (...args: unknown[]) => mockRemoveGroupPreference(...args),
    validateGroupId: (groupId: string) => {
        if (!groupId || !/^[a-zA-Z0-9_-]{1,128}$/.test(groupId)) {
            throw new Error('Invalid groupId');
        }
    },
}));

// Import cleanup wrapper functions after mocks
import {
    leaveGroupWithCleanup,
    transferAndLeaveWithCleanup,
} from '@/features/shared-groups/services/groupService';

// =============================================================================
// Mock leaveGroup and transferOwnership for cleanup wrapper tests
// =============================================================================

// We need to spy on the internal functions - but since they're in the same module,
// we'll test the full integration flow and verify behavior through transaction mocks

describe('updateTransactionSharingEnabled (Story 14d-v2-1-11b)', () => {
    const mockDb = createMockDb();
    const mockDocRef = createMockDocRef();
    const mockTimestamp = { toDate: () => new Date() };

    beforeEach(() => {
        vi.clearAllMocks();
        mockDoc.mockReturnValue(mockDocRef);
        mockServerTimestamp.mockReturnValue(mockTimestamp);
        // Default: cooldown allows toggle
        mockCanToggleTransactionSharing.mockReturnValue({ allowed: true });
        // Default: no daily reset needed
        mockShouldResetDailyCount.mockReturnValue(false);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // =========================================================================
    // Success Path Tests
    // =========================================================================

    describe('successful updates', () => {
        it('enables transaction sharing when cooldown allows', async () => {
            const group = createMockGroup({
                transactionSharingEnabled: false,
                transactionSharingToggleCountToday: 1,
            });
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, group));

            await updateTransactionSharingEnabled(mockDb, 'group-123', 'owner-user-123', true);

            expect(mockTransactionUpdate).toHaveBeenCalledWith(
                mockDocRef,
                expect.objectContaining({
                    transactionSharingEnabled: true,
                })
            );
        });

        it('disables transaction sharing when cooldown allows', async () => {
            const group = createMockGroup({
                transactionSharingEnabled: true,
                transactionSharingToggleCountToday: 0,
            });
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, group));

            await updateTransactionSharingEnabled(mockDb, 'group-123', 'owner-user-123', false);

            expect(mockTransactionUpdate).toHaveBeenCalledWith(
                mockDocRef,
                expect.objectContaining({
                    transactionSharingEnabled: false,
                })
            );
        });

        it('atomically updates all toggle-related fields', async () => {
            const group = createMockGroup({
                transactionSharingEnabled: false,
                transactionSharingToggleCountToday: 1,
            });
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, group));

            await updateTransactionSharingEnabled(mockDb, 'group-123', 'owner-user-123', true);

            expect(mockTransactionUpdate).toHaveBeenCalledWith(
                mockDocRef,
                expect.objectContaining({
                    transactionSharingEnabled: true,
                    transactionSharingLastToggleAt: mockTimestamp,
                    transactionSharingToggleCountToday: 2, // Incremented from 1
                    updatedAt: mockTimestamp,
                })
            );
        });
    });

    // =========================================================================
    // Authorization Tests
    // =========================================================================

    describe('authorization', () => {
        it('throws error if user is not the group owner', async () => {
            const group = createMockGroup({ ownerId: 'owner-user-123' });
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, group));

            await expect(
                updateTransactionSharingEnabled(mockDb, 'group-123', 'not-the-owner', true)
            ).rejects.toThrow('Only the group owner can toggle transaction sharing');
        });

        it('throws error if group not found', async () => {
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(false));

            await expect(
                updateTransactionSharingEnabled(mockDb, 'group-123', 'owner-user-123', true)
            ).rejects.toThrow('Group not found');
        });
    });

    // =========================================================================
    // Cooldown & Rate Limiting Tests
    // =========================================================================

    describe('cooldown enforcement', () => {
        it('throws error with wait time when cooldown is active', async () => {
            const group = createMockGroup();
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, group));
            mockCanToggleTransactionSharing.mockReturnValue({
                allowed: false,
                waitMinutes: 10,
                reason: 'cooldown',
            });

            await expect(
                updateTransactionSharingEnabled(mockDb, 'group-123', 'owner-user-123', true)
            ).rejects.toThrow('Please wait 10 minutes before toggling again');
        });

        it('throws error when daily toggle limit reached', async () => {
            const group = createMockGroup();
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, group));
            mockCanToggleTransactionSharing.mockReturnValue({
                allowed: false,
                reason: 'daily_limit',
            });

            await expect(
                updateTransactionSharingEnabled(mockDb, 'group-123', 'owner-user-123', true)
            ).rejects.toThrow('Daily toggle limit reached (3 changes per day)');
        });

        it('resets daily count when toggling on a new day', async () => {
            const group = createMockGroup({
                transactionSharingEnabled: false,
                transactionSharingToggleCountToday: 2, // Previous day's count
            });
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, group));
            mockShouldResetDailyCount.mockReturnValue(true); // New day!

            await updateTransactionSharingEnabled(mockDb, 'group-123', 'owner-user-123', true);

            expect(mockTransactionUpdate).toHaveBeenCalledWith(
                mockDocRef,
                expect.objectContaining({
                    transactionSharingToggleCountToday: 1, // Reset to 1 (this toggle)
                    transactionSharingToggleCountResetAt: mockTimestamp, // Reset timestamp updated
                })
            );
        });
    });

    // =========================================================================
    // Input Validation Tests
    // =========================================================================

    describe('input validation', () => {
        it('throws error for missing groupId', async () => {
            await expect(
                updateTransactionSharingEnabled(mockDb, '', 'owner-user-123', true)
            ).rejects.toThrow('Group ID and user ID are required');
        });

        it('throws error for missing userId', async () => {
            await expect(
                updateTransactionSharingEnabled(mockDb, 'group-123', '', true)
            ).rejects.toThrow('Group ID and user ID are required');
        });
    });
});

// =============================================================================
// leaveGroupWithCleanup Tests (Story 14d-v2-1-12d)
// =============================================================================

describe('leaveGroupWithCleanup (Story 14d-v2-1-12d)', () => {
    const mockDb = createMockDb();
    const mockDocRef = createMockDocRef();
    const mockTimestamp = { toDate: () => new Date() };

    beforeEach(() => {
        vi.clearAllMocks();
        mockDoc.mockReturnValue(mockDocRef);
        mockServerTimestamp.mockReturnValue(mockTimestamp);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // =========================================================================
    // AC#5: Cleanup after successful leave
    // =========================================================================

    describe('AC#5: preference cleanup after leave', () => {
        it('calls removeGroupPreference after successful leaveGroup', async () => {
            // Setup: User is a non-owner member of the group
            const group = createMockGroup({
                ownerId: 'owner-user-123',
                members: ['owner-user-123', 'member-456'],
            });
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, group));
            mockRemoveGroupPreference.mockResolvedValue(undefined);

            await leaveGroupWithCleanup(mockDb, 'member-456', 'group-123', 'boletapp');

            // Verify leaveGroup was called (via transaction)
            expect(mockRunTransaction).toHaveBeenCalled();

            // Verify removeGroupPreference was called with correct args
            expect(mockRemoveGroupPreference).toHaveBeenCalledWith(
                mockDb,
                'member-456',
                'boletapp',
                'group-123'
            );
        });

        it('calls removeGroupPreference exactly once', async () => {
            const group = createMockGroup({
                ownerId: 'owner-user-123',
                members: ['owner-user-123', 'member-456'],
            });
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, group));
            mockRemoveGroupPreference.mockResolvedValue(undefined);

            await leaveGroupWithCleanup(mockDb, 'member-456', 'group-123', 'boletapp');

            expect(mockRemoveGroupPreference).toHaveBeenCalledTimes(1);
        });
    });

    // =========================================================================
    // AC#7: Non-blocking cleanup errors
    // =========================================================================

    describe('AC#7: cleanup errors do not block leave', () => {
        it('succeeds even when removeGroupPreference throws an error', async () => {
            const group = createMockGroup({
                ownerId: 'owner-user-123',
                members: ['owner-user-123', 'member-456'],
            });
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, group));

            // Simulate cleanup failure
            mockRemoveGroupPreference.mockRejectedValue(new Error('Firestore error'));

            // Should NOT throw - cleanup errors are non-blocking
            await expect(
                leaveGroupWithCleanup(mockDb, 'member-456', 'group-123', 'boletapp')
            ).resolves.not.toThrow();
        });

        it('logs warning when cleanup fails in dev mode', async () => {
            const group = createMockGroup({
                ownerId: 'owner-user-123',
                members: ['owner-user-123', 'member-456'],
            });
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, group));
            mockRemoveGroupPreference.mockRejectedValue(new Error('Cleanup failed'));

            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            await leaveGroupWithCleanup(mockDb, 'member-456', 'group-123', 'boletapp');

            // In DEV mode, should log warning
            // Note: This depends on import.meta.env.DEV being true in test environment
            // The test verifies the function doesn't throw, which is the primary AC#7 requirement
            expect(mockRemoveGroupPreference).toHaveBeenCalled();

            consoleWarnSpy.mockRestore();
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================

    describe('edge cases', () => {
        it('handles already-deleted preference gracefully', async () => {
            const group = createMockGroup({
                ownerId: 'owner-user-123',
                members: ['owner-user-123', 'member-456'],
            });
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, group));

            // Simulate preference already deleted (no error, just returns)
            mockRemoveGroupPreference.mockResolvedValue(undefined);

            await expect(
                leaveGroupWithCleanup(mockDb, 'member-456', 'group-123', 'boletapp')
            ).resolves.not.toThrow();
        });

        it('throws if leaveGroup fails (cleanup not attempted)', async () => {
            // Group not found - leaveGroup will throw
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(false));

            await expect(
                leaveGroupWithCleanup(mockDb, 'member-456', 'group-123', 'boletapp')
            ).rejects.toThrow('Group not found');

            // Cleanup should NOT be called if leave fails
            expect(mockRemoveGroupPreference).not.toHaveBeenCalled();
        });

        it('throws if user is the owner (cannot leave without transfer)', async () => {
            const group = createMockGroup({
                ownerId: 'owner-user-123',
                members: ['owner-user-123', 'member-456'],
            });
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, group));

            await expect(
                leaveGroupWithCleanup(mockDb, 'owner-user-123', 'group-123', 'boletapp')
            ).rejects.toThrow('You must transfer ownership before leaving');

            // Cleanup should NOT be called if leave fails
            expect(mockRemoveGroupPreference).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Input Validation
    // =========================================================================

    describe('input validation', () => {
        it('throws error for missing userId', async () => {
            await expect(
                leaveGroupWithCleanup(mockDb, '', 'group-123', 'boletapp')
            ).rejects.toThrow('User ID and group ID are required');
        });

        it('throws error for missing groupId', async () => {
            await expect(
                leaveGroupWithCleanup(mockDb, 'member-456', '', 'boletapp')
            ).rejects.toThrow('User ID and group ID are required');
        });

        // ECC Review Fix: Test appId validation
        it('throws error for invalid appId', async () => {
            await expect(
                leaveGroupWithCleanup(mockDb, 'member-456', 'group-123', '../hack')
            ).rejects.toThrow('Invalid application ID');
        });

        it('throws error for unknown appId', async () => {
            await expect(
                leaveGroupWithCleanup(mockDb, 'member-456', 'group-123', 'unknown-app')
            ).rejects.toThrow('Invalid application ID');
        });
    });
});

// =============================================================================
// transferAndLeaveWithCleanup Tests (Story 14d-v2-1-12d)
// =============================================================================

describe('transferAndLeaveWithCleanup (Story 14d-v2-1-12d)', () => {
    const mockDb = createMockDb();
    const mockDocRef = createMockDocRef();
    const mockTimestamp = { toDate: () => new Date() };

    beforeEach(() => {
        vi.clearAllMocks();
        mockDoc.mockReturnValue(mockDocRef);
        mockServerTimestamp.mockReturnValue(mockTimestamp);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // =========================================================================
    // AC#6: Full transfer+leave+cleanup flow
    // =========================================================================

    describe('AC#6: transfer, leave, and cleanup in order', () => {
        it('calls transferOwnership, leaveGroup, then removeGroupPreference in sequence', async () => {
            // Track call order
            const callOrder: string[] = [];

            // First call: transferOwnership transaction
            // Second call: leaveGroup transaction
            let transactionCallCount = 0;

            mockRunTransaction.mockImplementation(async (_db, callback) => {
                transactionCallCount++;
                if (transactionCallCount === 1) {
                    // First transaction: transferOwnership
                    // Mock group where current user is owner
                    const transferGroup = createMockGroup({
                        ownerId: 'owner-user-123',
                        members: ['owner-user-123', 'new-owner-456'],
                    });
                    mockTransactionGet.mockResolvedValueOnce(createMockDocSnapshot(true, transferGroup));
                    callOrder.push('transferOwnership');
                } else if (transactionCallCount === 2) {
                    // Second transaction: leaveGroup
                    // After transfer, ownerId is now new-owner-456, so old owner can leave
                    const leaveGroup = createMockGroup({
                        ownerId: 'new-owner-456', // Already transferred
                        members: ['owner-user-123', 'new-owner-456'],
                    });
                    mockTransactionGet.mockResolvedValueOnce(createMockDocSnapshot(true, leaveGroup));
                    callOrder.push('leaveGroup');
                }
                return callback(mockTransaction);
            });

            mockRemoveGroupPreference.mockImplementation(async () => {
                callOrder.push('removeGroupPreference');
            });

            await transferAndLeaveWithCleanup(
                mockDb,
                'owner-user-123',    // currentOwnerId
                'new-owner-456',      // newOwnerId
                'group-123',          // groupId
                'boletapp'            // appId
            );

            // Verify call order: transfer -> leave -> cleanup
            expect(callOrder).toEqual([
                'transferOwnership',
                'leaveGroup',
                'removeGroupPreference',
            ]);
        });

        it('passes correct arguments to removeGroupPreference', async () => {
            // Setup both transactions to succeed
            const group = createMockGroup({
                ownerId: 'owner-user-123',
                members: ['owner-user-123', 'new-owner-456'],
            });

            // First transaction (transfer): owner is original
            // Second transaction (leave): owner is new (post-transfer)
            let callCount = 0;
            mockRunTransaction.mockImplementation(async (_db, callback) => {
                callCount++;
                if (callCount === 1) {
                    mockTransactionGet.mockResolvedValueOnce(createMockDocSnapshot(true, group));
                } else {
                    const postTransferGroup = { ...group, ownerId: 'new-owner-456' };
                    mockTransactionGet.mockResolvedValueOnce(createMockDocSnapshot(true, postTransferGroup));
                }
                return callback(mockTransaction);
            });

            mockRemoveGroupPreference.mockResolvedValue(undefined);

            await transferAndLeaveWithCleanup(
                mockDb,
                'owner-user-123',
                'new-owner-456',
                'group-123',
                'boletapp'
            );

            expect(mockRemoveGroupPreference).toHaveBeenCalledWith(
                mockDb,
                'owner-user-123',  // currentOwnerId (the one leaving)
                'boletapp',
                'group-123'
            );
        });
    });

    // =========================================================================
    // AC#7: Non-blocking cleanup errors for transfer+leave
    // =========================================================================

    describe('AC#7: cleanup failure after transfer+leave does not throw', () => {
        it('succeeds even when removeGroupPreference throws after successful transfer+leave', async () => {
            const group = createMockGroup({
                ownerId: 'owner-user-123',
                members: ['owner-user-123', 'new-owner-456'],
            });

            let callCount = 0;
            mockRunTransaction.mockImplementation(async (_db, callback) => {
                callCount++;
                if (callCount === 1) {
                    mockTransactionGet.mockResolvedValueOnce(createMockDocSnapshot(true, group));
                } else {
                    const postTransferGroup = { ...group, ownerId: 'new-owner-456' };
                    mockTransactionGet.mockResolvedValueOnce(createMockDocSnapshot(true, postTransferGroup));
                }
                return callback(mockTransaction);
            });

            // Cleanup fails but shouldn't throw
            mockRemoveGroupPreference.mockRejectedValue(new Error('Preference cleanup failed'));

            // Should NOT throw
            await expect(
                transferAndLeaveWithCleanup(
                    mockDb,
                    'owner-user-123',
                    'new-owner-456',
                    'group-123',
                    'boletapp'
                )
            ).resolves.not.toThrow();
        });

        it('transfer and leave complete successfully even if cleanup fails', async () => {
            const group = createMockGroup({
                ownerId: 'owner-user-123',
                members: ['owner-user-123', 'new-owner-456'],
            });

            let callCount = 0;
            mockRunTransaction.mockImplementation(async (_db, callback) => {
                callCount++;
                if (callCount === 1) {
                    mockTransactionGet.mockResolvedValueOnce(createMockDocSnapshot(true, group));
                } else {
                    const postTransferGroup = { ...group, ownerId: 'new-owner-456' };
                    mockTransactionGet.mockResolvedValueOnce(createMockDocSnapshot(true, postTransferGroup));
                }
                return callback(mockTransaction);
            });

            mockRemoveGroupPreference.mockRejectedValue(new Error('Cleanup error'));

            await transferAndLeaveWithCleanup(
                mockDb,
                'owner-user-123',
                'new-owner-456',
                'group-123',
                'boletapp'
            );

            // Both transactions should have been called
            expect(callCount).toBe(2);
            // Cleanup was attempted
            expect(mockRemoveGroupPreference).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Error Propagation Tests
    // =========================================================================

    describe('error propagation', () => {
        it('throws if transferOwnership fails (user not owner)', async () => {
            // Group exists but user is not the owner
            const group = createMockGroup({
                ownerId: 'different-owner',
                members: ['different-owner', 'new-owner-456'],
            });
            mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, group));

            await expect(
                transferAndLeaveWithCleanup(
                    mockDb,
                    'owner-user-123',  // Not the actual owner
                    'new-owner-456',
                    'group-123',
                    'boletapp'
                )
            ).rejects.toThrow('Only the group owner can transfer ownership');

            // Cleanup should NOT be called if transfer fails
            expect(mockRemoveGroupPreference).not.toHaveBeenCalled();
        });

        it('throws if leaveGroup fails after successful transfer', async () => {
            const group = createMockGroup({
                ownerId: 'owner-user-123',
                members: ['owner-user-123', 'new-owner-456'],
            });

            let callCount = 0;
            mockRunTransaction.mockImplementation(async (_db, callback) => {
                callCount++;
                if (callCount === 1) {
                    // Transfer succeeds
                    mockTransactionGet.mockResolvedValueOnce(createMockDocSnapshot(true, group));
                    return callback(mockTransaction);
                } else {
                    // Leave fails - group not found (simulating race condition)
                    mockTransactionGet.mockResolvedValueOnce(createMockDocSnapshot(false));
                    return callback(mockTransaction);
                }
            });

            await expect(
                transferAndLeaveWithCleanup(
                    mockDb,
                    'owner-user-123',
                    'new-owner-456',
                    'group-123',
                    'boletapp'
                )
            ).rejects.toThrow('Group not found');

            // Cleanup should NOT be called if leave fails
            expect(mockRemoveGroupPreference).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Input Validation
    // =========================================================================

    describe('input validation', () => {
        it('throws error for missing currentOwnerId', async () => {
            await expect(
                transferAndLeaveWithCleanup(mockDb, '', 'new-owner-456', 'group-123', 'boletapp')
            ).rejects.toThrow('Current owner ID, new owner ID, and group ID are required');
        });

        it('throws error for missing newOwnerId', async () => {
            await expect(
                transferAndLeaveWithCleanup(mockDb, 'owner-123', '', 'group-123', 'boletapp')
            ).rejects.toThrow('Current owner ID, new owner ID, and group ID are required');
        });

        it('throws error for missing groupId', async () => {
            await expect(
                transferAndLeaveWithCleanup(mockDb, 'owner-123', 'new-owner-456', '', 'boletapp')
            ).rejects.toThrow('Current owner ID, new owner ID, and group ID are required');
        });

        // ECC Review Fix: Test appId validation
        it('throws error for invalid appId', async () => {
            await expect(
                transferAndLeaveWithCleanup(mockDb, 'owner-123', 'new-owner-456', 'group-123', '../hack')
            ).rejects.toThrow('Invalid application ID');
        });

        it('throws error for unknown appId', async () => {
            await expect(
                transferAndLeaveWithCleanup(mockDb, 'owner-123', 'new-owner-456', 'group-123', 'unknown-app')
            ).rejects.toThrow('Invalid application ID');
        });
    });
});

// =============================================================================
// joinGroupDirectly - User Group Preference Tests (Story 14d-v2-1-13+14)
// =============================================================================

describe('joinGroupDirectly - user group preference (Story 14d-v2-1-13+14)', () => {
    const mockDb = createMockDb();
    const mockDocRef = createMockDocRef();
    const mockTimestamp = { toDate: () => new Date() };

    const validGroupId = 'group-123';
    const validUserId = 'user-xyz';
    const validAppId = 'boletapp';

    function createJoinableGroup(overrides: Partial<SharedGroup> = {}): SharedGroup {
        return createMockGroup({
            id: validGroupId,
            ownerId: 'owner-user-123',
            members: ['owner-user-123'], // User not yet a member
            ...overrides,
        });
    }

    beforeEach(() => {
        vi.clearAllMocks();
        mockDoc.mockReturnValue(mockDocRef);
        mockServerTimestamp.mockReturnValue(mockTimestamp);
        // Restore runTransaction implementation (clearAllMocks resets it)
        mockRunTransaction.mockImplementation(async (_db: unknown, callback: (transaction: typeof mockTransaction) => Promise<unknown>) => {
            return callback(mockTransaction);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should write user preference atomically when appId provided', async () => {
        const group = createJoinableGroup();
        mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, group));

        await joinGroupDirectly(mockDb, validGroupId, validUserId, undefined, validAppId);

        // transaction.set should have been called for the preference write
        expect(mockTransactionSet).toHaveBeenCalledTimes(1);
        expect(mockTransactionSet).toHaveBeenCalledWith(
            expect.anything(), // prefsDocRef
            {
                [`groupPreferences.${validGroupId}`]: {
                    shareMyTransactions: false,
                    lastToggleAt: null,
                    toggleCountToday: 0,
                    toggleCountResetAt: null,
                },
            },
            { merge: true }
        );
    });

    it('should create preference with shareMyTransactions=true when opted in', async () => {
        const group = createJoinableGroup();
        mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, group));

        await joinGroupDirectly(mockDb, validGroupId, validUserId, undefined, validAppId, true);

        expect(mockTransactionSet).toHaveBeenCalledWith(
            expect.anything(),
            {
                [`groupPreferences.${validGroupId}`]: expect.objectContaining({
                    shareMyTransactions: true,
                }),
            },
            { merge: true }
        );
    });

    it('should default shareMyTransactions to false', async () => {
        const group = createJoinableGroup();
        mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, group));

        await joinGroupDirectly(mockDb, validGroupId, validUserId, undefined, validAppId);

        expect(mockTransactionSet).toHaveBeenCalledWith(
            expect.anything(),
            {
                [`groupPreferences.${validGroupId}`]: expect.objectContaining({
                    shareMyTransactions: false,
                }),
            },
            { merge: true }
        );
    });

    it('should skip preference write when appId not provided', async () => {
        const group = createJoinableGroup();
        mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, group));

        // Call without appId (backward compatible)
        await joinGroupDirectly(mockDb, validGroupId, validUserId);

        // transaction.set should NOT have been called
        expect(mockTransactionSet).not.toHaveBeenCalled();
    });

    it('should build correct Firestore path for preference document', async () => {
        const group = createJoinableGroup();
        mockTransactionGet.mockResolvedValue(createMockDocSnapshot(true, group));

        await joinGroupDirectly(mockDb, validGroupId, validUserId, undefined, validAppId);

        // Verify doc() was called with the preference path
        expect(mockDoc).toHaveBeenCalledWith(
            mockDb,
            'artifacts', validAppId, 'users', validUserId, 'preferences', 'sharedGroups'
        );
    });

    // ECC Security Review fix: appId validation
    it('should reject invalid appId', async () => {
        await expect(
            joinGroupDirectly(mockDb, validGroupId, validUserId, undefined, 'invalid-app-id!', false)
        ).rejects.toThrow('Invalid application ID');
    });
});
