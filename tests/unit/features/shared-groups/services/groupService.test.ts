/**
 * Group Service Tests
 *
 * Story 14d-v2-1-7g: Edit Group Settings
 * Epic 14d-v2: Shared Groups v2
 *
 * Tests for updateGroup function:
 * - Field updates (name, icon, color)
 * - Validation (name length, whitelist)
 * - XSS protection (sanitizeInput)
 * - Authorization (owner check)
 * - Edge cases (empty updates, group not found)
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
const mockTransaction = {
    get: mockTransactionGet,
    update: mockTransactionUpdate,
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
