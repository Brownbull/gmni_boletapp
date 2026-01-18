/**
 * Tests for MemberContributionChart Component
 *
 * Story 14c.9: Shared Group Analytics
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests the member contribution visualization component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
    MemberContributionChart,
    MemberContributionChartSkeleton,
    type MemberContributionChartProps,
} from '../../../../src/components/SharedGroups/MemberContributionChart';
import type { MemberContribution } from '../../../../src/hooks/useAnalyticsTransactions';

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockContribution = (
    overrides: Partial<MemberContribution> = {}
): MemberContribution => ({
    memberId: `user-${Math.random().toString(36).slice(2, 7)}`,
    memberName: 'Test User',
    avatarColor: '#3B82F6',
    total: 1000,
    percentage: 50,
    transactionCount: 5,
    ...overrides,
});

const mockContributions: MemberContribution[] = [
    createMockContribution({
        memberId: 'user-1',
        memberName: 'Alice Johnson',
        avatarColor: '#FF5722',
        total: 5000,
        percentage: 50,
        transactionCount: 10,
    }),
    createMockContribution({
        memberId: 'user-2',
        memberName: 'Bob',
        avatarColor: '#4CAF50',
        total: 3000,
        percentage: 30,
        transactionCount: 6,
    }),
    createMockContribution({
        memberId: 'user-3',
        memberName: 'Charlie Smith',
        avatarColor: '#2196F3',
        total: 2000,
        percentage: 20,
        transactionCount: 4,
    }),
];

// ============================================================================
// Tests
// ============================================================================

describe('MemberContributionChart', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render all members with their names', () => {
            render(<MemberContributionChart contributions={mockContributions} />);

            expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
            expect(screen.getByText('Bob')).toBeInTheDocument();
            expect(screen.getByText('Charlie Smith')).toBeInTheDocument();
        });

        it('should display formatted amounts', () => {
            render(<MemberContributionChart contributions={mockContributions} currency="CLP" />);

            // CLP format with Chilean locale
            expect(screen.getByText((content) => content.includes('5.000'))).toBeInTheDocument();
        });

        it('should display percentages', () => {
            render(<MemberContributionChart contributions={mockContributions} />);

            expect(screen.getByText('(50%)')).toBeInTheDocument();
            expect(screen.getByText('(30%)')).toBeInTheDocument();
            expect(screen.getByText('(20%)')).toBeInTheDocument();
        });

        it('should display transaction counts when enabled', () => {
            render(
                <MemberContributionChart
                    contributions={mockContributions}
                    showTransactionCount={true}
                />
            );

            expect(screen.getByText('10 transacciones')).toBeInTheDocument();
            expect(screen.getByText('6 transacciones')).toBeInTheDocument();
            expect(screen.getByText('4 transacciones')).toBeInTheDocument();
        });

        it('should use singular "transacción" for count of 1', () => {
            const singleTransaction = [
                createMockContribution({ transactionCount: 1 }),
            ];

            render(
                <MemberContributionChart
                    contributions={singleTransaction}
                    showTransactionCount={true}
                />
            );

            // Should appear twice: once in row and once in footer total
            expect(screen.getAllByText('1 transacción')).toHaveLength(2);
        });

        it('should hide individual row transaction counts when disabled but show footer total', () => {
            render(
                <MemberContributionChart
                    contributions={mockContributions}
                    showTransactionCount={false}
                />
            );

            // Individual member transaction counts should be hidden
            expect(screen.queryByText('10 transacciones')).not.toBeInTheDocument();
            expect(screen.queryByText('6 transacciones')).not.toBeInTheDocument();
            expect(screen.queryByText('4 transacciones')).not.toBeInTheDocument();
            // But the footer total should still show (20 total transactions)
            expect(screen.getByText('20 transacciones')).toBeInTheDocument();
        });

        it('should display title when provided', () => {
            render(
                <MemberContributionChart
                    contributions={mockContributions}
                    title="Contribución por miembro"
                />
            );

            expect(screen.getByText('Contribución por miembro')).toBeInTheDocument();
        });

        it('should display grand total at the bottom', () => {
            render(<MemberContributionChart contributions={mockContributions} />);

            expect(screen.getByText('Total del grupo')).toBeInTheDocument();
            // Total is 5000 + 3000 + 2000 = 10000
            expect(screen.getByText((content) => content.includes('10.000'))).toBeInTheDocument();
        });

        it('should render member initials in avatars', () => {
            render(<MemberContributionChart contributions={mockContributions} />);

            // Alice Johnson -> AJ
            expect(screen.getByText('AJ')).toBeInTheDocument();
            // Bob -> B
            expect(screen.getByText('B')).toBeInTheDocument();
            // Charlie Smith -> CS
            expect(screen.getByText('CS')).toBeInTheDocument();
        });
    });

    describe('Sorting', () => {
        it('should sort contributions by total (highest first)', () => {
            const unsorted = [
                createMockContribution({ memberId: 'low', memberName: 'Low Spender', total: 100 }),
                createMockContribution({ memberId: 'high', memberName: 'High Spender', total: 1000 }),
                createMockContribution({ memberId: 'mid', memberName: 'Mid Spender', total: 500 }),
            ];

            const { container } = render(<MemberContributionChart contributions={unsorted} />);

            // Get all member names in order as they appear in the DOM
            const nameElements = container.querySelectorAll('.font-medium.truncate');
            const names = Array.from(nameElements).map(el => el.textContent);

            // Should be sorted by total: High (1000) > Mid (500) > Low (100)
            expect(names[0]).toBe('High Spender');
            expect(names[1]).toBe('Mid Spender');
            expect(names[2]).toBe('Low Spender');
        });
    });

    describe('maxMembers prop', () => {
        it('should limit displayed members when maxMembers is set', () => {
            const manyMembers = [
                createMockContribution({ memberId: '1', memberName: 'Member 1', total: 500 }),
                createMockContribution({ memberId: '2', memberName: 'Member 2', total: 400 }),
                createMockContribution({ memberId: '3', memberName: 'Member 3', total: 300 }),
                createMockContribution({ memberId: '4', memberName: 'Member 4', total: 200 }),
                createMockContribution({ memberId: '5', memberName: 'Member 5', total: 100 }),
            ];

            render(<MemberContributionChart contributions={manyMembers} maxMembers={3} />);

            // Should show top 3 by total
            expect(screen.getByText('Member 1')).toBeInTheDocument();
            expect(screen.getByText('Member 2')).toBeInTheDocument();
            expect(screen.getByText('Member 3')).toBeInTheDocument();
            expect(screen.queryByText('Member 4')).not.toBeInTheDocument();
            expect(screen.queryByText('Member 5')).not.toBeInTheDocument();
        });

        it('should show all members when maxMembers is 0', () => {
            const members = [
                createMockContribution({ memberId: '1', memberName: 'Member 1' }),
                createMockContribution({ memberId: '2', memberName: 'Member 2' }),
                createMockContribution({ memberId: '3', memberName: 'Member 3' }),
            ];

            render(<MemberContributionChart contributions={members} maxMembers={0} />);

            expect(screen.getByText('Member 1')).toBeInTheDocument();
            expect(screen.getByText('Member 2')).toBeInTheDocument();
            expect(screen.getByText('Member 3')).toBeInTheDocument();
        });
    });

    describe('Compact mode', () => {
        it('should hide transaction counts in compact mode', () => {
            render(
                <MemberContributionChart
                    contributions={mockContributions}
                    compact={true}
                    showTransactionCount={true}
                />
            );

            expect(screen.queryByText(/transacci/)).not.toBeInTheDocument();
        });

        it('should hide total summary in compact mode', () => {
            render(
                <MemberContributionChart
                    contributions={mockContributions}
                    compact={true}
                />
            );

            expect(screen.queryByText('Total del grupo')).not.toBeInTheDocument();
        });
    });

    describe('Interaction', () => {
        it('should call onMemberClick when member row is clicked', () => {
            const handleClick = vi.fn();

            render(
                <MemberContributionChart
                    contributions={mockContributions}
                    onMemberClick={handleClick}
                />
            );

            // Find Alice's row and click it
            const aliceRow = screen.getByText('Alice Johnson').closest('[role="button"]');
            expect(aliceRow).toBeInTheDocument();
            fireEvent.click(aliceRow!);

            expect(handleClick).toHaveBeenCalledWith('user-1');
        });

        it('should call onMemberClick on Enter key press', () => {
            const handleClick = vi.fn();

            render(
                <MemberContributionChart
                    contributions={mockContributions}
                    onMemberClick={handleClick}
                />
            );

            const bobRow = screen.getByText('Bob').closest('[role="button"]');
            fireEvent.keyDown(bobRow!, { key: 'Enter' });

            expect(handleClick).toHaveBeenCalledWith('user-2');
        });

        it('should not have button role when onMemberClick is not provided', () => {
            render(<MemberContributionChart contributions={mockContributions} />);

            const row = screen.getByText('Alice Johnson').parentElement?.parentElement;
            expect(row).not.toHaveAttribute('role', 'button');
        });
    });

    describe('Empty state', () => {
        it('should show empty message when no contributions', () => {
            render(<MemberContributionChart contributions={[]} />);

            expect(screen.getByText('No hay datos de contribución')).toBeInTheDocument();
        });
    });

    describe('Theme support', () => {
        it('should apply light theme classes', () => {
            const { container } = render(
                <MemberContributionChart contributions={mockContributions} theme="light" />
            );

            const card = container.firstChild as HTMLElement;
            expect(card).toHaveClass('bg-white');
        });

        it('should apply dark theme classes', () => {
            const { container } = render(
                <MemberContributionChart contributions={mockContributions} theme="dark" />
            );

            const card = container.firstChild as HTMLElement;
            expect(card).toHaveClass('bg-[var(--color-card)]');
        });
    });

    describe('Fallback colors', () => {
        it('should use fallback colors when avatarColor is not provided', () => {
            const noColorContributions = [
                createMockContribution({
                    memberId: 'user-1',
                    memberName: 'No Color User',
                    avatarColor: '' as string,
                }),
            ];

            render(<MemberContributionChart contributions={noColorContributions} />);

            // Component should still render without error
            expect(screen.getByText('No Color User')).toBeInTheDocument();
        });
    });
});

describe('MemberContributionChartSkeleton', () => {
    it('should render default 3 rows', () => {
        const { container } = render(<MemberContributionChartSkeleton />);

        // Count avatar placeholders (circles) - use separate selectors
        const avatars = container.querySelectorAll('.bg-gray-300.rounded-full, .rounded-full.bg-gray-300');
        // We should have at least 3 avatars for the default rows
        expect(avatars.length).toBeGreaterThanOrEqual(3);
    });

    it('should render custom number of rows', () => {
        const { container } = render(<MemberContributionChartSkeleton count={5} />);

        // Count the outer row containers
        const rows = container.querySelectorAll('.flex.items-center.gap-3');
        expect(rows.length).toBe(5);
    });

    it('should hide total in compact mode', () => {
        const { container } = render(<MemberContributionChartSkeleton compact={true} />);

        // Compact mode should not have border-t (total section)
        const totalSection = container.querySelector('.border-t');
        expect(totalSection).not.toBeInTheDocument();
    });
});
