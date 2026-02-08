/**
 * JoinGroupByCode Tests
 *
 * Story 14d-v2-1-6c-1: Enhancement - Manual Share Code Entry
 * Epic 14d-v2: Shared Groups v2
 *
 * Tests for the JoinGroupByCode component that allows users
 * to manually enter a share code to join a group.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JoinGroupByCode } from '@/features/shared-groups/components/JoinGroupByCode';
import type { PendingInvitation } from '@/types/sharedGroup';
import { createMockInvitation } from '@helpers/sharedGroupFactory';

// =============================================================================
// Mocks
// =============================================================================

// Mock Firebase
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
}));

// Mock Firebase Auth (TD-CONSOLIDATED-5: getAuth used for email in security rules)
vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({
        currentUser: { email: 'test@example.com' },
    })),
}));

// Mock invitation service
const mockGetInvitationByShareCode = vi.fn();
vi.mock('@/services/invitationService', () => ({
    getInvitationByShareCode: (...args: unknown[]) => mockGetInvitationByShareCode(...args),
}));

// Mock shareCodeUtils
vi.mock('@/utils/shareCodeUtils', () => ({
    isValidShareCode: (code: string) => {
        // Simple validation: 16 alphanumeric characters
        return code.length === 16 && /^[A-Za-z0-9_-]+$/.test(code);
    },
}));

// =============================================================================
// Test Helpers
// =============================================================================

const mockT = (key: string) => {
    const translations: Record<string, string> = {
        joinByCode: 'Join by Code',
        enterShareCode: 'Enter invitation code',
        joinGroup: 'Join',
        searching: 'Searching...',
        invalidShareCode: 'Invalid code. Must be 16 alphanumeric characters.',
        invitationNotFound: 'No invitation found with this code.',
        invitationExpired: 'This invitation has expired.',
        networkError: 'Connection error. Please try again.',
    };
    return translations[key] || key;
};

const mockOnInvitationFound = vi.fn();
const mockOnShowToast = vi.fn();

const defaultProps = {
    t: mockT,
    lang: 'en' as const,
    onInvitationFound: mockOnInvitationFound,
    onShowToast: mockOnShowToast,
};

// =============================================================================
// Tests
// =============================================================================

describe('JoinGroupByCode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetInvitationByShareCode.mockReset();
    });

    // =========================================================================
    // Rendering
    // =========================================================================

    describe('Rendering', () => {
        it('renders the component with input and button', () => {
            render(<JoinGroupByCode {...defaultProps} />);

            expect(screen.getByTestId('join-group-by-code')).toBeInTheDocument();
            expect(screen.getByTestId('share-code-input')).toBeInTheDocument();
            expect(screen.getByTestId('join-by-code-btn')).toBeInTheDocument();
        });

        it('shows title', () => {
            render(<JoinGroupByCode {...defaultProps} />);

            expect(screen.getByText('Join by Code')).toBeInTheDocument();
        });

        it('shows placeholder text', () => {
            render(<JoinGroupByCode {...defaultProps} />);

            expect(screen.getByPlaceholderText('Enter invitation code')).toBeInTheDocument();
        });

        it('button is disabled when input is empty', () => {
            render(<JoinGroupByCode {...defaultProps} />);

            expect(screen.getByTestId('join-by-code-btn')).toBeDisabled();
        });
    });

    // =========================================================================
    // Input Handling
    // =========================================================================

    describe('Input Handling', () => {
        it('allows alphanumeric input', async () => {
            render(<JoinGroupByCode {...defaultProps} />);

            const input = screen.getByTestId('share-code-input');
            await userEvent.type(input, 'aB3dEfGhIjKlMnOp');

            expect(input).toHaveValue('aB3dEfGhIjKlMnOp');
        });

        it('allows underscore and dash characters', async () => {
            render(<JoinGroupByCode {...defaultProps} />);

            const input = screen.getByTestId('share-code-input');
            await userEvent.type(input, 'aB3_-fGhIjKl-nOp');

            expect(input).toHaveValue('aB3_-fGhIjKl-nOp');
        });

        it('filters out invalid characters', async () => {
            render(<JoinGroupByCode {...defaultProps} />);

            const input = screen.getByTestId('share-code-input');
            await userEvent.type(input, 'abc!@#$%123');

            expect(input).toHaveValue('abc123');
        });

        it('limits input to 16 characters', async () => {
            render(<JoinGroupByCode {...defaultProps} />);

            const input = screen.getByTestId('share-code-input');
            await userEvent.type(input, 'aB3dEfGhIjKlMnOpQrSt');

            expect(input).toHaveValue('aB3dEfGhIjKlMnOp'); // Only first 16
        });

        it('enables button when code is entered', async () => {
            render(<JoinGroupByCode {...defaultProps} />);

            const input = screen.getByTestId('share-code-input');
            await userEvent.type(input, 'aB3dEfGhIjKlMnOp');

            expect(screen.getByTestId('join-by-code-btn')).not.toBeDisabled();
        });
    });

    // =========================================================================
    // Validation
    // =========================================================================

    describe('Validation', () => {
        it('shows error for code that is too short', async () => {
            render(<JoinGroupByCode {...defaultProps} />);

            const input = screen.getByTestId('share-code-input');
            await userEvent.type(input, 'abc123');

            const button = screen.getByTestId('join-by-code-btn');
            await userEvent.click(button);

            expect(screen.getByTestId('share-code-error')).toBeInTheDocument();
            expect(screen.getByText('Invalid code. Must be 16 alphanumeric characters.')).toBeInTheDocument();
        });

        it('clears error when user types', async () => {
            render(<JoinGroupByCode {...defaultProps} />);

            const input = screen.getByTestId('share-code-input');
            await userEvent.type(input, 'abc');

            const button = screen.getByTestId('join-by-code-btn');
            await userEvent.click(button);

            expect(screen.getByTestId('share-code-error')).toBeInTheDocument();

            // Type more to clear error
            await userEvent.type(input, 'd');

            expect(screen.queryByTestId('share-code-error')).not.toBeInTheDocument();
        });
    });

    // =========================================================================
    // API Integration
    // =========================================================================

    describe('API Integration', () => {
        it('calls getInvitationByShareCode with valid code', async () => {
            mockGetInvitationByShareCode.mockResolvedValue(createMockInvitation({ id: 'inv-1', groupName: 'Family' }));

            render(<JoinGroupByCode {...defaultProps} />);

            const input = screen.getByTestId('share-code-input');
            await userEvent.type(input, 'aB3dEfGhIjKlMnOp');

            const button = screen.getByTestId('join-by-code-btn');
            await userEvent.click(button);

            await waitFor(() => {
                expect(mockGetInvitationByShareCode).toHaveBeenCalledWith(
                    expect.anything(),
                    'aB3dEfGhIjKlMnOp',
                    'test@example.com'
                );
            });
        });

        it('calls onInvitationFound when valid invitation is found', async () => {
            const mockInvitation = createMockInvitation({ id: 'inv-1', groupName: 'Family' });
            mockGetInvitationByShareCode.mockResolvedValue(mockInvitation);

            render(<JoinGroupByCode {...defaultProps} />);

            const input = screen.getByTestId('share-code-input');
            await userEvent.type(input, 'aB3dEfGhIjKlMnOp');

            const button = screen.getByTestId('join-by-code-btn');
            await userEvent.click(button);

            await waitFor(() => {
                expect(mockOnInvitationFound).toHaveBeenCalledWith(mockInvitation);
            });
        });

        it('clears input after successful lookup', async () => {
            mockGetInvitationByShareCode.mockResolvedValue(createMockInvitation({ id: 'inv-1', groupName: 'Family' }));

            render(<JoinGroupByCode {...defaultProps} />);

            const input = screen.getByTestId('share-code-input');
            await userEvent.type(input, 'aB3dEfGhIjKlMnOp');

            const button = screen.getByTestId('join-by-code-btn');
            await userEvent.click(button);

            await waitFor(() => {
                expect(input).toHaveValue('');
            });
        });

        it('shows error when invitation is not found', async () => {
            mockGetInvitationByShareCode.mockResolvedValue(null);

            render(<JoinGroupByCode {...defaultProps} />);

            const input = screen.getByTestId('share-code-input');
            await userEvent.type(input, 'aB3dEfGhIjKlMnOp');

            const button = screen.getByTestId('join-by-code-btn');
            await userEvent.click(button);

            await waitFor(() => {
                expect(screen.getByTestId('share-code-error')).toBeInTheDocument();
            });
        });

        it('shows error when invitation is expired', async () => {
            const expiredInvitation = createMockInvitation({ id: 'inv-1', groupName: 'Family' });
            // Set expiresAt to past
            expiredInvitation.expiresAt = {
                toDate: () => new Date(Date.now() - 1000),
                seconds: Math.floor((Date.now() - 1000) / 1000),
                nanoseconds: 0,
            } as PendingInvitation['expiresAt'];

            mockGetInvitationByShareCode.mockResolvedValue(expiredInvitation);

            render(<JoinGroupByCode {...defaultProps} />);

            const input = screen.getByTestId('share-code-input');
            await userEvent.type(input, 'aB3dEfGhIjKlMnOp');

            const button = screen.getByTestId('join-by-code-btn');
            await userEvent.click(button);

            await waitFor(() => {
                expect(screen.getByText('This invitation has expired.')).toBeInTheDocument();
            });
        });

        it('shows error on network failure', async () => {
            mockGetInvitationByShareCode.mockRejectedValue(new Error('Network error'));

            render(<JoinGroupByCode {...defaultProps} />);

            const input = screen.getByTestId('share-code-input');
            await userEvent.type(input, 'aB3dEfGhIjKlMnOp');

            const button = screen.getByTestId('join-by-code-btn');
            await userEvent.click(button);

            await waitFor(() => {
                expect(screen.getByText('Connection error. Please try again.')).toBeInTheDocument();
            });
        });

        it('calls onShowToast on network error', async () => {
            mockGetInvitationByShareCode.mockRejectedValue(new Error('Network error'));

            render(<JoinGroupByCode {...defaultProps} />);

            const input = screen.getByTestId('share-code-input');
            await userEvent.type(input, 'aB3dEfGhIjKlMnOp');

            const button = screen.getByTestId('join-by-code-btn');
            await userEvent.click(button);

            await waitFor(() => {
                expect(mockOnShowToast).toHaveBeenCalledWith('Connection error. Please try again.', 'error');
            });
        });
    });

    // =========================================================================
    // Loading State
    // =========================================================================

    describe('Loading State', () => {
        it('disables input and button while loading', async () => {
            // Make the mock hang to simulate loading
            mockGetInvitationByShareCode.mockImplementation(
                () => new Promise(() => {}) // Never resolves
            );

            render(<JoinGroupByCode {...defaultProps} />);

            const input = screen.getByTestId('share-code-input');
            await userEvent.type(input, 'aB3dEfGhIjKlMnOp');

            const button = screen.getByTestId('join-by-code-btn');
            await userEvent.click(button);

            await waitFor(() => {
                expect(input).toBeDisabled();
                expect(button).toBeDisabled();
            });
        });
    });

    // =========================================================================
    // Language Support
    // =========================================================================

    describe('Language Support', () => {
        it('uses Spanish translations when lang is es', () => {
            const spanishT = (key: string) => {
                const translations: Record<string, string> = {
                    joinByCode: 'Unirse con Código',
                    enterShareCode: 'Ingresa el código de invitación',
                };
                return translations[key] || key;
            };

            render(<JoinGroupByCode {...defaultProps} t={spanishT} lang="es" />);

            expect(screen.getByText('Unirse con Código')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Accessibility
    // =========================================================================

    describe('Accessibility', () => {
        it('has aria-label on input', () => {
            render(<JoinGroupByCode {...defaultProps} />);

            const input = screen.getByTestId('share-code-input');
            expect(input).toHaveAttribute('aria-label', 'Enter invitation code');
        });

        it('sets aria-invalid when there is an error', async () => {
            render(<JoinGroupByCode {...defaultProps} />);

            const input = screen.getByTestId('share-code-input');
            await userEvent.type(input, 'abc');

            const button = screen.getByTestId('join-by-code-btn');
            await userEvent.click(button);

            await waitFor(() => {
                expect(input).toHaveAttribute('aria-invalid', 'true');
            });
        });

        it('error has role="alert"', async () => {
            render(<JoinGroupByCode {...defaultProps} />);

            const input = screen.getByTestId('share-code-input');
            await userEvent.type(input, 'abc');

            const button = screen.getByTestId('join-by-code-btn');
            await userEvent.click(button);

            await waitFor(() => {
                expect(screen.getByRole('alert')).toBeInTheDocument();
            });
        });
    });
});
