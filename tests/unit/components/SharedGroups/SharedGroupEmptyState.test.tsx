/**
 * SharedGroupEmptyState Component Tests
 *
 * Story 14c.10: Empty States & Loading
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for the empty state component shown when a shared group has no transactions.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SharedGroupEmptyState } from '../../../../src/components/SharedGroups/SharedGroupEmptyState';

describe('SharedGroupEmptyState', () => {
    const mockT = (key: string) => {
        const translations: Record<string, string> = {
            sharedGroupNoTransactions: 'No transactions in this group',
            sharedGroupNoTransactionsTitle: 'No transactions yet',
            sharedGroupInviteMembersToStart: 'Invite family or friends to start tracking shared expenses',
            sharedGroupScanToAddFirst: 'Scan a receipt to add the first transaction to this group',
            sharedGroupInviteMembers: 'Invite Members',
            sharedGroupScanFirstReceipt: 'Scan First Receipt',
            sharedGroupOrInviteMore: 'Or invite more members',
        };
        return translations[key] || key;
    };

    const defaultProps = {
        groupName: '🏠 Household Expenses',
        memberCount: 1,
        onScanReceipt: vi.fn(),
        onInviteMembers: vi.fn(),
        t: mockT,
    };

    describe('rendering', () => {
        it('should render empty state container with test id', () => {
            render(<SharedGroupEmptyState {...defaultProps} />);

            expect(screen.getByTestId('shared-group-empty-state')).toBeInTheDocument();
        });

        it('should render title', () => {
            render(<SharedGroupEmptyState {...defaultProps} />);

            expect(screen.getByText('No transactions yet')).toBeInTheDocument();
        });

        it('should render group name at bottom', () => {
            render(<SharedGroupEmptyState {...defaultProps} />);

            expect(screen.getByText('🏠 Household Expenses')).toBeInTheDocument();
        });

        it('should have accessible region role', () => {
            render(<SharedGroupEmptyState {...defaultProps} />);

            const container = screen.getByTestId('shared-group-empty-state');
            expect(container).toHaveAttribute('role', 'region');
        });
    });

    describe('solo member state (memberCount <= 1)', () => {
        it('should show invite members message when user is only member', () => {
            render(<SharedGroupEmptyState {...defaultProps} memberCount={1} />);

            expect(
                screen.getByText('Invite family or friends to start tracking shared expenses')
            ).toBeInTheDocument();
        });

        it('should show Invite Members as primary CTA', () => {
            render(<SharedGroupEmptyState {...defaultProps} memberCount={1} />);

            expect(screen.getByTestId('empty-state-invite-btn')).toBeInTheDocument();
            expect(screen.getByText('Invite Members')).toBeInTheDocument();
        });

        it('should NOT show secondary invite button when solo member', () => {
            render(<SharedGroupEmptyState {...defaultProps} memberCount={1} />);

            expect(screen.queryByTestId('empty-state-invite-secondary-btn')).not.toBeInTheDocument();
        });

        it('should NOT show scan receipt button when solo member', () => {
            render(<SharedGroupEmptyState {...defaultProps} memberCount={1} />);

            expect(screen.queryByTestId('empty-state-scan-btn')).not.toBeInTheDocument();
        });

        it('should call onInviteMembers when invite button clicked', () => {
            const mockOnInvite = vi.fn();
            render(
                <SharedGroupEmptyState
                    {...defaultProps}
                    memberCount={1}
                    onInviteMembers={mockOnInvite}
                />
            );

            fireEvent.click(screen.getByTestId('empty-state-invite-btn'));

            expect(mockOnInvite).toHaveBeenCalledTimes(1);
        });

        it('should handle memberCount of 0 as solo member', () => {
            render(<SharedGroupEmptyState {...defaultProps} memberCount={0} />);

            expect(screen.getByTestId('empty-state-invite-btn')).toBeInTheDocument();
        });
    });

    describe('group with members state (memberCount > 1)', () => {
        it('should show scan receipt message when group has multiple members', () => {
            render(<SharedGroupEmptyState {...defaultProps} memberCount={3} />);

            expect(
                screen.getByText('Scan a receipt to add the first transaction to this group')
            ).toBeInTheDocument();
        });

        it('should show Scan First Receipt as primary CTA', () => {
            render(<SharedGroupEmptyState {...defaultProps} memberCount={3} />);

            expect(screen.getByTestId('empty-state-scan-btn')).toBeInTheDocument();
            expect(screen.getByText('Scan First Receipt')).toBeInTheDocument();
        });

        it('should show secondary invite more members button', () => {
            render(<SharedGroupEmptyState {...defaultProps} memberCount={3} />);

            expect(screen.getByTestId('empty-state-invite-secondary-btn')).toBeInTheDocument();
            expect(screen.getByText('Or invite more members')).toBeInTheDocument();
        });

        it('should call onScanReceipt when scan button clicked', () => {
            const mockOnScan = vi.fn();
            render(
                <SharedGroupEmptyState
                    {...defaultProps}
                    memberCount={3}
                    onScanReceipt={mockOnScan}
                />
            );

            fireEvent.click(screen.getByTestId('empty-state-scan-btn'));

            expect(mockOnScan).toHaveBeenCalledTimes(1);
        });

        it('should call onInviteMembers when secondary invite button clicked', () => {
            const mockOnInvite = vi.fn();
            render(
                <SharedGroupEmptyState
                    {...defaultProps}
                    memberCount={3}
                    onInviteMembers={mockOnInvite}
                />
            );

            fireEvent.click(screen.getByTestId('empty-state-invite-secondary-btn'));

            expect(mockOnInvite).toHaveBeenCalledTimes(1);
        });
    });

    describe('edge cases', () => {
        it('should handle large member count', () => {
            render(<SharedGroupEmptyState {...defaultProps} memberCount={10} />);

            // Should still show scan as primary CTA
            expect(screen.getByTestId('empty-state-scan-btn')).toBeInTheDocument();
        });

        it('should handle empty group name', () => {
            render(<SharedGroupEmptyState {...defaultProps} groupName="" />);

            // Should not crash
            expect(screen.getByTestId('shared-group-empty-state')).toBeInTheDocument();
        });

        it('should handle negative memberCount defensively (treat as solo member)', () => {
            render(<SharedGroupEmptyState {...defaultProps} memberCount={-1} />);

            // Negative count should be treated as solo member (via <= 1 check)
            expect(screen.getByTestId('empty-state-invite-btn')).toBeInTheDocument();
            expect(screen.queryByTestId('empty-state-scan-btn')).not.toBeInTheDocument();
        });
    });
});
