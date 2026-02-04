/**
 * PendingInvitationsView Tests
 *
 * Story 14d-v2-1-6c-1: Pending Invitations Badge & List UI
 * Task 7.6: Add unit tests for component
 *
 * Tests for the standalone pending invitations view component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PendingInvitationsView } from '@/features/shared-groups/components/PendingInvitationsView';
import type { PendingInvitation } from '@/types/sharedGroup';

// =============================================================================
// Mocks
// =============================================================================

// Mock useAuth
const mockUser = { uid: 'test-user-123', email: 'test@example.com' };
vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({ user: mockUser }),
}));

// Mock usePendingInvitationsCount
let mockInvitations: PendingInvitation[] = [];
let mockIsLoading = false;
let mockHasInvitations = false;
const mockRefetch = vi.fn();

vi.mock('@/hooks/usePendingInvitationsCount', () => ({
    usePendingInvitationsCount: () => ({
        count: mockInvitations.length,
        invitations: mockInvitations,
        isLoading: mockIsLoading,
        hasInvitations: mockHasInvitations,
        error: null,
        refetch: mockRefetch,
    }),
}));

// Mock PendingInvitationsSection
vi.mock('@/features/shared-groups/components/PendingInvitationsSection', () => ({
    PendingInvitationsSection: ({ invitations }: { invitations: PendingInvitation[] }) => (
        <div data-testid="mock-pending-invitations-section">
            {invitations.length} invitations displayed
        </div>
    ),
}));

// =============================================================================
// Test Helpers
// =============================================================================

const mockT = (key: string, params?: Record<string, string | number>) => {
    const translations: Record<string, string> = {
        loading: 'Loading...',
        pendingInvitations: 'Pending Invitations',
        pendingInvitationsDesc: 'You have been invited to join these groups',
        noPendingInvitations: 'No pending invitations',
        noPendingInvitationsDesc: 'When someone invites you to a group, it will appear here',
    };
    let result = translations[key] || key;
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            result = result.replace(`{${k}}`, String(v));
        });
    }
    return result;
};

const defaultProps = {
    t: mockT,
    theme: 'light',
    lang: 'en' as const,
    onShowToast: vi.fn(),
    appId: 'boletapp',
};

function createMockInvitation(id: string, groupName: string): PendingInvitation {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
        id,
        groupId: `group-${id}`,
        groupName,
        groupColor: '#10b981',
        shareCode: 'ABC123DEF456GHI7',
        invitedEmail: 'test@example.com',
        invitedByUserId: 'inviter-456',
        invitedByName: 'Alice',
        createdAt: {
            toDate: () => now,
            seconds: Math.floor(now.getTime() / 1000),
            nanoseconds: 0,
        } as PendingInvitation['createdAt'],
        expiresAt: {
            toDate: () => expiresAt,
            seconds: Math.floor(expiresAt.getTime() / 1000),
            nanoseconds: 0,
        } as PendingInvitation['expiresAt'],
        status: 'pending',
    };
}

// =============================================================================
// Tests
// =============================================================================

describe('PendingInvitationsView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockInvitations = [];
        mockIsLoading = false;
        mockHasInvitations = false;
    });

    // =========================================================================
    // Loading State (Task 7.5)
    // =========================================================================

    describe('Loading State', () => {
        it('shows loading indicator when fetching invitations', () => {
            mockIsLoading = true;

            render(<PendingInvitationsView {...defaultProps} />);

            expect(screen.getByTestId('pending-invitations-loading')).toBeInTheDocument();
            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });

        it('does not show main content while loading', () => {
            mockIsLoading = true;

            render(<PendingInvitationsView {...defaultProps} />);

            expect(screen.queryByTestId('pending-invitations-view')).not.toBeInTheDocument();
            expect(screen.queryByTestId('pending-invitations-empty')).not.toBeInTheDocument();
        });
    });

    // =========================================================================
    // Empty State (Task 7.4)
    // =========================================================================

    describe('Empty State', () => {
        it('shows empty state when no invitations exist', () => {
            mockHasInvitations = false;
            mockInvitations = [];

            render(<PendingInvitationsView {...defaultProps} />);

            expect(screen.getByTestId('pending-invitations-empty')).toBeInTheDocument();
            expect(screen.getByText('No pending invitations')).toBeInTheDocument();
        });

        it('shows helpful message in empty state', () => {
            mockHasInvitations = false;
            mockInvitations = [];

            render(<PendingInvitationsView {...defaultProps} />);

            expect(screen.getByText('When someone invites you to a group, it will appear here')).toBeInTheDocument();
        });

        it('does not show invitations list when empty', () => {
            mockHasInvitations = false;
            mockInvitations = [];

            render(<PendingInvitationsView {...defaultProps} />);

            expect(screen.queryByTestId('mock-pending-invitations-section')).not.toBeInTheDocument();
        });
    });

    // =========================================================================
    // Invitations List (Tasks 7.1-7.3)
    // =========================================================================

    describe('Invitations List', () => {
        it('shows view container when invitations exist', () => {
            mockHasInvitations = true;
            mockInvitations = [
                createMockInvitation('inv-1', 'Family Expenses'),
                createMockInvitation('inv-2', 'Office Lunch'),
            ];

            render(<PendingInvitationsView {...defaultProps} />);

            expect(screen.getByTestId('pending-invitations-view')).toBeInTheDocument();
        });

        it('shows header with title', () => {
            mockHasInvitations = true;
            mockInvitations = [createMockInvitation('inv-1', 'Group 1')];

            render(<PendingInvitationsView {...defaultProps} />);

            expect(screen.getByText('Pending Invitations')).toBeInTheDocument();
            expect(screen.getByText('You have been invited to join these groups')).toBeInTheDocument();
        });

        it('renders PendingInvitationsSection with invitations', () => {
            mockHasInvitations = true;
            mockInvitations = [
                createMockInvitation('inv-1', 'Group 1'),
                createMockInvitation('inv-2', 'Group 2'),
            ];

            render(<PendingInvitationsView {...defaultProps} />);

            expect(screen.getByTestId('mock-pending-invitations-section')).toBeInTheDocument();
            expect(screen.getByText('2 invitations displayed')).toBeInTheDocument();
        });

        it('does not show empty state when invitations exist', () => {
            mockHasInvitations = true;
            mockInvitations = [createMockInvitation('inv-1', 'Group 1')];

            render(<PendingInvitationsView {...defaultProps} />);

            expect(screen.queryByTestId('pending-invitations-empty')).not.toBeInTheDocument();
        });
    });

    // =========================================================================
    // Theme Support
    // =========================================================================

    describe('Theme Support', () => {
        it('renders in light theme', () => {
            mockHasInvitations = false;

            render(<PendingInvitationsView {...defaultProps} theme="light" />);

            expect(screen.getByTestId('pending-invitations-empty')).toBeInTheDocument();
        });

        it('renders in dark theme', () => {
            mockHasInvitations = false;

            render(<PendingInvitationsView {...defaultProps} theme="dark" />);

            expect(screen.getByTestId('pending-invitations-empty')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Language Support
    // =========================================================================

    describe('Language Support', () => {
        it('uses Spanish translations when lang is es', () => {
            mockHasInvitations = false;

            const spanishT = (key: string) => {
                const translations: Record<string, string> = {
                    noPendingInvitations: 'No tienes invitaciones pendientes',
                };
                return translations[key] || key;
            };

            render(<PendingInvitationsView {...defaultProps} t={spanishT} lang="es" />);

            expect(screen.getByText('No tienes invitaciones pendientes')).toBeInTheDocument();
        });
    });
});
