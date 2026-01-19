/**
 * InviteMembersPrompt Component Tests
 *
 * Story 14c.10: Empty States & Loading
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for the inline prompt encouraging users to invite members.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InviteMembersPrompt } from '../../../../src/components/SharedGroups/InviteMembersPrompt';

describe('InviteMembersPrompt', () => {
    const mockT = (key: string) => {
        const translations: Record<string, string> = {
            sharedGroupInvitePromptLabel: 'Invite members prompt',
            sharedGroupInviteFamilyOrFriends: 'Invite family or friends',
            sharedGroupShareExpensesTogether: 'Share expenses together and track group spending',
            sharedGroupShareInviteLink: 'Share Invite Link',
        };
        return translations[key] || key;
    };

    const defaultProps = {
        groupId: 'group-123',
        groupName: '🏠 Household Expenses',
        onOpenShare: vi.fn(),
        t: mockT,
    };

    describe('rendering', () => {
        it('should render prompt container with test id', () => {
            render(<InviteMembersPrompt {...defaultProps} />);

            expect(screen.getByTestId('invite-members-prompt')).toBeInTheDocument();
        });

        it('should render with correct group-id data attribute', () => {
            render(<InviteMembersPrompt {...defaultProps} />);

            const prompt = screen.getByTestId('invite-members-prompt');
            expect(prompt).toHaveAttribute('data-group-id', 'group-123');
        });

        it('should render title text', () => {
            render(<InviteMembersPrompt {...defaultProps} />);

            expect(screen.getByText('Invite family or friends')).toBeInTheDocument();
        });

        it('should render description text', () => {
            render(<InviteMembersPrompt {...defaultProps} />);

            expect(screen.getByText('Share expenses together and track group spending')).toBeInTheDocument();
        });

        it('should render share button', () => {
            render(<InviteMembersPrompt {...defaultProps} />);

            expect(screen.getByTestId('invite-prompt-share-btn')).toBeInTheDocument();
            expect(screen.getByText('Share Invite Link')).toBeInTheDocument();
        });

        it('should render group name when provided', () => {
            render(<InviteMembersPrompt {...defaultProps} />);

            expect(screen.getByText('🏠 Household Expenses')).toBeInTheDocument();
        });
    });

    describe('without group name', () => {
        it('should not render group name when not provided', () => {
            render(<InviteMembersPrompt {...defaultProps} groupName={undefined} />);

            expect(screen.queryByText('🏠 Household Expenses')).not.toBeInTheDocument();
        });

        it('should still render other content without group name', () => {
            render(<InviteMembersPrompt {...defaultProps} groupName={undefined} />);

            expect(screen.getByText('Invite family or friends')).toBeInTheDocument();
            expect(screen.getByTestId('invite-prompt-share-btn')).toBeInTheDocument();
        });
    });

    describe('accessibility', () => {
        it('should have role="region"', () => {
            render(<InviteMembersPrompt {...defaultProps} />);

            const prompt = screen.getByTestId('invite-members-prompt');
            expect(prompt).toHaveAttribute('role', 'region');
        });

        it('should have aria-label', () => {
            render(<InviteMembersPrompt {...defaultProps} />);

            const prompt = screen.getByTestId('invite-members-prompt');
            expect(prompt).toHaveAttribute('aria-label', 'Invite members prompt');
        });
    });

    describe('interactions', () => {
        it('should call onOpenShare when share button clicked', () => {
            const mockOnShare = vi.fn();
            render(<InviteMembersPrompt {...defaultProps} onOpenShare={mockOnShare} />);

            fireEvent.click(screen.getByTestId('invite-prompt-share-btn'));

            expect(mockOnShare).toHaveBeenCalledTimes(1);
        });

        it('should handle multiple clicks on share button', () => {
            const mockOnShare = vi.fn();
            render(<InviteMembersPrompt {...defaultProps} onOpenShare={mockOnShare} />);

            const button = screen.getByTestId('invite-prompt-share-btn');
            fireEvent.click(button);
            fireEvent.click(button);
            fireEvent.click(button);

            expect(mockOnShare).toHaveBeenCalledTimes(3);
        });
    });

    describe('styling', () => {
        it('should have rounded-lg class', () => {
            render(<InviteMembersPrompt {...defaultProps} />);

            const prompt = screen.getByTestId('invite-members-prompt');
            expect(prompt).toHaveClass('rounded-lg');
        });

        it('should have margin-bottom for spacing', () => {
            render(<InviteMembersPrompt {...defaultProps} />);

            const prompt = screen.getByTestId('invite-members-prompt');
            expect(prompt).toHaveClass('mb-4');
        });
    });
});
