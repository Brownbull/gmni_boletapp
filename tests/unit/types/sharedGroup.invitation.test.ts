/**
 * Shared Group Invitation Type Tests
 *
 * Story 14d-v2-1-5a: Invitation Foundation (Types & Utils)
 *
 * Tests for PendingInvitation type and utility functions:
 * - isInvitationExpired() - AC #1
 * - getInvitationTimeRemaining() - AC #1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
    isInvitationExpired,
    getInvitationTimeRemaining,
    type PendingInvitation,
} from '../../../src/types/sharedGroup';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a mock Timestamp for testing
 */
function createMockTimestamp(date: Date): Timestamp {
    return {
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
    } as unknown as Timestamp;
}

/**
 * Create a mock PendingInvitation for testing
 */
function createMockInvitation(overrides: Partial<PendingInvitation> = {}): PendingInvitation {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    return {
        id: 'test-invitation-id',
        groupId: 'test-group-id',
        groupName: 'Test Group',
        groupColor: '#10b981',
        shareCode: 'MockShareCode12345', // Story 14d-v2-1-5b-1: Added shareCode
        invitedEmail: 'invitee@example.com',
        invitedByUserId: 'inviter-user-id',
        invitedByName: 'John Doe',
        createdAt: createMockTimestamp(now),
        expiresAt: createMockTimestamp(expiresAt),
        status: 'pending',
        ...overrides,
    };
}

// =============================================================================
// Tests
// =============================================================================

describe('PendingInvitation utilities', () => {
    // =========================================================================
    // isInvitationExpired Tests (AC #1)
    // =========================================================================
    describe('isInvitationExpired', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('returns false for invitation that expires in the future', () => {
            const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
            const invitation = createMockInvitation({
                expiresAt: createMockTimestamp(futureDate),
            });

            expect(isInvitationExpired(invitation)).toBe(false);
        });

        it('returns true for invitation that expired in the past', () => {
            const pastDate = new Date(Date.now() - 1000); // 1 second ago
            const invitation = createMockInvitation({
                expiresAt: createMockTimestamp(pastDate),
            });

            expect(isInvitationExpired(invitation)).toBe(true);
        });

        it('returns true for invitation that just expired', () => {
            // Set current time
            const now = new Date('2026-01-15T12:00:00Z');
            vi.setSystemTime(now);

            // Expiry exactly 1ms before now
            const expiredDate = new Date('2026-01-15T11:59:59.999Z');
            const invitation = createMockInvitation({
                expiresAt: createMockTimestamp(expiredDate),
            });

            expect(isInvitationExpired(invitation)).toBe(true);
        });

        it('returns true when expiresAt is null', () => {
            const invitation = createMockInvitation({
                expiresAt: null as unknown as Timestamp,
            });

            expect(isInvitationExpired(invitation)).toBe(true);
        });

        it('returns true when expiresAt is undefined', () => {
            const invitation = createMockInvitation();
            delete (invitation as Record<string, unknown>).expiresAt;

            expect(isInvitationExpired(invitation)).toBe(true);
        });

        it('handles edge case at exact expiry time', () => {
            const now = new Date('2026-01-15T12:00:00.000Z');
            vi.setSystemTime(now);

            // Expiry exactly now (0ms difference)
            const invitation = createMockInvitation({
                expiresAt: createMockTimestamp(now),
            });

            // At exact expiry time, it should NOT be expired (now > expiresAt is false)
            expect(isInvitationExpired(invitation)).toBe(false);
        });

        it('correctly identifies expiry after advancing time', () => {
            const now = new Date('2026-01-15T12:00:00Z');
            vi.setSystemTime(now);

            const expiresIn1Hour = new Date('2026-01-15T13:00:00Z');
            const invitation = createMockInvitation({
                expiresAt: createMockTimestamp(expiresIn1Hour),
            });

            // Not expired yet
            expect(isInvitationExpired(invitation)).toBe(false);

            // Advance time past expiry
            vi.setSystemTime(new Date('2026-01-15T13:00:01Z'));

            // Now expired
            expect(isInvitationExpired(invitation)).toBe(true);
        });
    });

    // =========================================================================
    // getInvitationTimeRemaining Tests (AC #1)
    // =========================================================================
    describe('getInvitationTimeRemaining', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('returns days and hours for valid future invitation', () => {
            const now = new Date('2026-01-15T12:00:00Z');
            vi.setSystemTime(now);

            // Expires in 5 days and 3 hours
            const expiresAt = new Date('2026-01-20T15:00:00Z');
            const invitation = createMockInvitation({
                expiresAt: createMockTimestamp(expiresAt),
            });

            const result = getInvitationTimeRemaining(invitation);

            expect(result).not.toBeNull();
            expect(result!.days).toBe(5);
            expect(result!.hours).toBe(3);
        });

        it('returns null for expired invitation', () => {
            const now = new Date('2026-01-15T12:00:00Z');
            vi.setSystemTime(now);

            // Expired 1 day ago
            const expiresAt = new Date('2026-01-14T12:00:00Z');
            const invitation = createMockInvitation({
                expiresAt: createMockTimestamp(expiresAt),
            });

            const result = getInvitationTimeRemaining(invitation);

            expect(result).toBeNull();
        });

        it('returns null when expiresAt is null', () => {
            const invitation = createMockInvitation({
                expiresAt: null as unknown as Timestamp,
            });

            const result = getInvitationTimeRemaining(invitation);

            expect(result).toBeNull();
        });

        it('returns 0 days and remaining hours for less than 1 day', () => {
            const now = new Date('2026-01-15T12:00:00Z');
            vi.setSystemTime(now);

            // Expires in 5 hours
            const expiresAt = new Date('2026-01-15T17:00:00Z');
            const invitation = createMockInvitation({
                expiresAt: createMockTimestamp(expiresAt),
            });

            const result = getInvitationTimeRemaining(invitation);

            expect(result).not.toBeNull();
            expect(result!.days).toBe(0);
            expect(result!.hours).toBe(5);
        });

        it('returns 0 days and 0 hours for less than 1 hour', () => {
            const now = new Date('2026-01-15T12:00:00Z');
            vi.setSystemTime(now);

            // Expires in 30 minutes
            const expiresAt = new Date('2026-01-15T12:30:00Z');
            const invitation = createMockInvitation({
                expiresAt: createMockTimestamp(expiresAt),
            });

            const result = getInvitationTimeRemaining(invitation);

            expect(result).not.toBeNull();
            expect(result!.days).toBe(0);
            expect(result!.hours).toBe(0);
        });

        it('returns exactly 7 days for new invitation', () => {
            const now = new Date('2026-01-15T00:00:00Z');
            vi.setSystemTime(now);

            // Expires in exactly 7 days
            const expiresAt = new Date('2026-01-22T00:00:00Z');
            const invitation = createMockInvitation({
                expiresAt: createMockTimestamp(expiresAt),
            });

            const result = getInvitationTimeRemaining(invitation);

            expect(result).not.toBeNull();
            expect(result!.days).toBe(7);
            expect(result!.hours).toBe(0);
        });

        it('handles edge case at exact expiry time', () => {
            const now = new Date('2026-01-15T12:00:00.000Z');
            vi.setSystemTime(now);

            // Expiry exactly now
            const invitation = createMockInvitation({
                expiresAt: createMockTimestamp(now),
            });

            const result = getInvitationTimeRemaining(invitation);

            // At exact expiry, diff is 0, so should return null
            expect(result).toBeNull();
        });

        it('correctly calculates days without including partial days', () => {
            const now = new Date('2026-01-15T12:00:00Z');
            vi.setSystemTime(now);

            // Expires in 2 days and 23 hours (almost 3 full days)
            const expiresAt = new Date('2026-01-18T11:00:00Z');
            const invitation = createMockInvitation({
                expiresAt: createMockTimestamp(expiresAt),
            });

            const result = getInvitationTimeRemaining(invitation);

            expect(result).not.toBeNull();
            expect(result!.days).toBe(2);
            expect(result!.hours).toBe(23);
        });
    });

    // =========================================================================
    // PendingInvitation Type Tests
    // =========================================================================
    describe('PendingInvitation type', () => {
        it('has all required fields', () => {
            const invitation = createMockInvitation();

            expect(invitation.groupId).toBeDefined();
            expect(invitation.groupName).toBeDefined();
            expect(invitation.groupColor).toBeDefined();
            expect(invitation.shareCode).toBeDefined(); // Story 14d-v2-1-5b-1: Added shareCode
            expect(invitation.invitedEmail).toBeDefined();
            expect(invitation.invitedByUserId).toBeDefined();
            expect(invitation.invitedByName).toBeDefined();
            expect(invitation.createdAt).toBeDefined();
            expect(invitation.expiresAt).toBeDefined();
            expect(invitation.status).toBeDefined();
        });

        it('has shareCode for deep link support (Story 14d-v2-1-5b-1)', () => {
            const invitation = createMockInvitation({ shareCode: 'Ab3dEf7hIj9kLm0p' });

            expect(invitation.shareCode).toBe('Ab3dEf7hIj9kLm0p');
            expect(invitation.shareCode).toHaveLength(16);
        });

        it('accepts valid status values', () => {
            const pendingInvitation = createMockInvitation({ status: 'pending' });
            const acceptedInvitation = createMockInvitation({ status: 'accepted' });
            const declinedInvitation = createMockInvitation({ status: 'declined' });
            const expiredInvitation = createMockInvitation({ status: 'expired' });

            expect(pendingInvitation.status).toBe('pending');
            expect(acceptedInvitation.status).toBe('accepted');
            expect(declinedInvitation.status).toBe('declined');
            expect(expiredInvitation.status).toBe('expired');
        });

        it('allows optional groupIcon', () => {
            const withIcon = createMockInvitation({ groupIcon: '🏠' });
            const withoutIcon = createMockInvitation();
            delete withoutIcon.groupIcon;

            expect(withIcon.groupIcon).toBe('🏠');
            expect(withoutIcon.groupIcon).toBeUndefined();
        });

        it('allows optional id field', () => {
            const withId = createMockInvitation({ id: 'custom-id' });
            const withoutId = createMockInvitation();
            delete withoutId.id;

            expect(withId.id).toBe('custom-id');
            expect(withoutId.id).toBeUndefined();
        });
    });
});
