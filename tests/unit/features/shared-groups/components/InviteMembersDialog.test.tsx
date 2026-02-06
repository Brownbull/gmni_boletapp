/**
 * InviteMembersDialog Component Tests
 *
 * Story 14d-v2-1-5c: Invitation UI (Components & Integration)
 * Epic 14d-v2: Shared Groups v2
 *
 * Tests for the simplified InviteMembersDialog component that provides
 * share link and share code copy functionality.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InviteMembersDialog } from '@/features/shared-groups/components/InviteMembersDialog';

// Mock translation function
const mockT = vi.fn((key: string) => key);
const mockOnClose = vi.fn();

// Default props for most tests
const defaultProps = {
    open: true,
    onClose: mockOnClose,
    shareCode: 'Ab3dEf7hIj9kLm0p',
    groupName: '🏠 Home Expenses',
    t: mockT,
    lang: 'en' as const,
};

// Mock clipboard API
const mockWriteText = vi.fn().mockResolvedValue(undefined);
const mockClipboard = {
    writeText: mockWriteText,
    readText: vi.fn(),
    read: vi.fn(),
    write: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
};

describe('InviteMembersDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockT.mockImplementation((key: string) => key);
        mockWriteText.mockResolvedValue(undefined);

        Object.defineProperty(navigator, 'clipboard', {
            value: mockClipboard,
            writable: true,
            configurable: true,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // =========================================================================
    // Rendering Tests
    // =========================================================================

    describe('Rendering', () => {
        it('should render when open is true', () => {
            render(<InviteMembersDialog {...defaultProps} />);
            expect(screen.getByTestId('invite-members-dialog')).toBeInTheDocument();
        });

        it('should not render when open is false', () => {
            render(<InviteMembersDialog {...defaultProps} open={false} />);
            expect(screen.queryByTestId('invite-members-dialog')).not.toBeInTheDocument();
        });

        it('should display the dialog title', () => {
            render(<InviteMembersDialog {...defaultProps} />);
            expect(screen.getByText('inviteMembers')).toBeInTheDocument();
        });

        it('should display the group name in description', () => {
            render(<InviteMembersDialog {...defaultProps} />);
            expect(screen.getByText(/Home Expenses/)).toBeInTheDocument();
        });

        it('should display the share link', () => {
            render(<InviteMembersDialog {...defaultProps} />);
            expect(screen.getByTestId('invite-link-display')).toHaveTextContent(
                'https://gastify.app/join/Ab3dEf7hIj9kLm0p'
            );
        });

        it('should display the share code', () => {
            render(<InviteMembersDialog {...defaultProps} />);
            expect(screen.getByTestId('invite-code-display')).toHaveTextContent('Ab3dEf7hIj9kLm0p');
        });

        it('should display expiration notice', () => {
            render(<InviteMembersDialog {...defaultProps} />);
            expect(screen.getByTestId('expiration-notice')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Copy Link Tests
    // =========================================================================

    describe('Copy Link', () => {
        it('should copy link to clipboard when copy link button is clicked', async () => {
            render(<InviteMembersDialog {...defaultProps} />);

            const copyBtn = screen.getByTestId('copy-link-btn');
            fireEvent.click(copyBtn);

            await waitFor(() => {
                expect(mockWriteText).toHaveBeenCalledWith(
                    'https://gastify.app/join/Ab3dEf7hIj9kLm0p'
                );
            });
        });

        it('should show copied feedback after copying link', async () => {
            render(<InviteMembersDialog {...defaultProps} />);

            const copyBtn = screen.getByTestId('copy-link-btn');
            fireEvent.click(copyBtn);

            await waitFor(() => {
                expect(copyBtn.textContent).toContain('linkCopied');
            });
        });

        it('should show initial state before copying', () => {
            render(<InviteMembersDialog {...defaultProps} />);

            const copyBtn = screen.getByTestId('copy-link-btn');
            expect(copyBtn.textContent).toContain('copyInviteLink');
        });
    });

    // =========================================================================
    // Copy Code Tests
    // =========================================================================

    describe('Copy Code', () => {
        it('should copy code to clipboard when copy code button is clicked', async () => {
            render(<InviteMembersDialog {...defaultProps} />);

            const copyBtn = screen.getByTestId('copy-code-btn');
            fireEvent.click(copyBtn);

            await waitFor(() => {
                expect(mockWriteText).toHaveBeenCalledWith('Ab3dEf7hIj9kLm0p');
            });
        });

        it('should show copied feedback after copying code', async () => {
            render(<InviteMembersDialog {...defaultProps} />);

            const copyBtn = screen.getByTestId('copy-code-btn');
            fireEvent.click(copyBtn);

            await waitFor(() => {
                expect(copyBtn.textContent).toContain('codeCopied');
            });
        });

        it('should show initial state before copying code', () => {
            render(<InviteMembersDialog {...defaultProps} />);

            const copyBtn = screen.getByTestId('copy-code-btn');
            expect(copyBtn.textContent).toContain('copyCode');
        });
    });

    // =========================================================================
    // Dialog Close Tests
    // =========================================================================

    describe('Dialog Close', () => {
        it('should call onClose when close button is clicked', () => {
            render(<InviteMembersDialog {...defaultProps} />);

            const closeBtn = screen.getByTestId('close-btn');
            fireEvent.click(closeBtn);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('should call onClose when backdrop is clicked', () => {
            render(<InviteMembersDialog {...defaultProps} />);

            const backdrop = screen.getByTestId('backdrop-overlay');
            fireEvent.click(backdrop);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('should call onClose when Escape key is pressed', () => {
            render(<InviteMembersDialog {...defaultProps} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // State Reset Tests
    // =========================================================================

    describe('State Reset', () => {
        it('should reset copy states when dialog reopens', () => {
            const { rerender } = render(<InviteMembersDialog {...defaultProps} />);

            // Copy link
            const copyBtn = screen.getByTestId('copy-link-btn');
            fireEvent.click(copyBtn);

            // Close dialog
            rerender(<InviteMembersDialog {...defaultProps} open={false} />);

            // Reopen dialog
            rerender(<InviteMembersDialog {...defaultProps} open={true} />);

            // Should show initial state
            const newCopyBtn = screen.getByTestId('copy-link-btn');
            expect(newCopyBtn.textContent).toContain('copyInviteLink');
        });
    });

    // =========================================================================
    // Accessibility Tests
    // =========================================================================

    describe('Accessibility', () => {
        it('should have proper dialog role and aria attributes', () => {
            render(<InviteMembersDialog {...defaultProps} />);

            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-modal', 'true');
            expect(dialog).toHaveAttribute('aria-labelledby', 'invite-members-title');
        });

        it('should prevent body scroll when open', () => {
            render(<InviteMembersDialog {...defaultProps} />);
            expect(document.body.style.overflow).toBe('hidden');
        });

        it('should restore body scroll when closed', () => {
            const { rerender } = render(<InviteMembersDialog {...defaultProps} />);
            rerender(<InviteMembersDialog {...defaultProps} open={false} />);
            expect(document.body.style.overflow).toBe('');
        });
    });

    // =========================================================================
    // Language/Translation Tests
    // =========================================================================

    describe('Language/Translation', () => {
        it('should use Spanish fallback texts when lang is es', () => {
            mockT.mockImplementation((key: string) => key); // Return key as-is
            render(<InviteMembersDialog {...defaultProps} lang="es" />);

            // Description should include groupName with Spanish template
            expect(screen.getByText(/Comparte este enlace o código/)).toBeInTheDocument();
        });

        it('should use English fallback texts when lang is en', () => {
            mockT.mockImplementation((key: string) => key);
            render(<InviteMembersDialog {...defaultProps} lang="en" />);

            // Description should include groupName with English template
            expect(screen.getByText(/Share this link or code/)).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Data-testid Attributes Tests
    // =========================================================================

    describe('Data-testid Attributes', () => {
        it('should have all required data-testid attributes', () => {
            render(<InviteMembersDialog {...defaultProps} />);

            expect(screen.getByTestId('invite-members-dialog')).toBeInTheDocument();
            expect(screen.getByTestId('invite-link-display')).toBeInTheDocument();
            expect(screen.getByTestId('invite-code-display')).toBeInTheDocument();
            expect(screen.getByTestId('copy-link-btn')).toBeInTheDocument();
            expect(screen.getByTestId('copy-code-btn')).toBeInTheDocument();
            expect(screen.getByTestId('close-btn')).toBeInTheDocument();
            expect(screen.getByTestId('expiration-notice')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Integration Flow Tests
    // =========================================================================

    describe('Integration Flow Tests', () => {
        it('should complete share link copy flow: click → copy → feedback', async () => {
            render(<InviteMembersDialog {...defaultProps} />);

            // Step 1: Verify link is displayed correctly
            const linkDisplay = screen.getByTestId('invite-link-display');
            expect(linkDisplay.textContent).toBe('https://gastify.app/join/Ab3dEf7hIj9kLm0p');

            // Step 2: Click copy button
            const copyBtn = screen.getByTestId('copy-link-btn');
            fireEvent.click(copyBtn);

            // Step 3: Verify clipboard was called
            await waitFor(() => {
                expect(mockWriteText).toHaveBeenCalledWith('https://gastify.app/join/Ab3dEf7hIj9kLm0p');
            });

            // Step 4: Verify feedback shown
            await waitFor(() => {
                expect(copyBtn.textContent).toContain('linkCopied');
            });
        });

        it('should complete share code copy flow: click → copy → feedback', async () => {
            render(<InviteMembersDialog {...defaultProps} />);

            // Step 1: Verify code is displayed correctly
            const codeDisplay = screen.getByTestId('invite-code-display');
            expect(codeDisplay.textContent).toBe('Ab3dEf7hIj9kLm0p');

            // Step 2: Click copy button
            const copyBtn = screen.getByTestId('copy-code-btn');
            fireEvent.click(copyBtn);

            // Step 3: Verify clipboard was called with code only
            await waitFor(() => {
                expect(mockWriteText).toHaveBeenCalledWith('Ab3dEf7hIj9kLm0p');
            });

            // Step 4: Verify feedback shown
            await waitFor(() => {
                expect(copyBtn.textContent).toContain('codeCopied');
            });
        });

        it('should only show one copied state at a time', async () => {
            render(<InviteMembersDialog {...defaultProps} />);

            // Copy link first
            const copyLinkBtn = screen.getByTestId('copy-link-btn');
            fireEvent.click(copyLinkBtn);

            await waitFor(() => {
                expect(copyLinkBtn.textContent).toContain('linkCopied');
            });

            // Now copy code - link should reset
            const copyCodeBtn = screen.getByTestId('copy-code-btn');
            fireEvent.click(copyCodeBtn);

            await waitFor(() => {
                expect(copyCodeBtn.textContent).toContain('codeCopied');
                expect(copyLinkBtn.textContent).toContain('copyInviteLink');
            });
        });
    });
});
