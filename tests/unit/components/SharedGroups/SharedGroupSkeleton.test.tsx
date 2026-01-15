/**
 * SharedGroupSkeleton Component Tests
 *
 * Story 14c.10: Empty States & Loading
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for the full view skeleton showing multiple transaction card skeletons.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SharedGroupSkeleton } from '../../../../src/components/SharedGroups/SharedGroupSkeleton';

describe('SharedGroupSkeleton', () => {
    describe('rendering', () => {
        it('should render skeleton container with test id', () => {
            render(<SharedGroupSkeleton />);

            expect(screen.getByTestId('shared-group-skeleton')).toBeInTheDocument();
        });

        it('should have role="status" for accessibility', () => {
            render(<SharedGroupSkeleton />);

            const skeleton = screen.getByTestId('shared-group-skeleton');
            expect(skeleton).toHaveAttribute('role', 'status');
        });

        it('should have aria-busy="true" when loading', () => {
            render(<SharedGroupSkeleton />);

            const skeleton = screen.getByTestId('shared-group-skeleton');
            expect(skeleton).toHaveAttribute('aria-busy', 'true');
        });

        it('should have aria-label for accessibility', () => {
            render(<SharedGroupSkeleton />);

            const skeleton = screen.getByTestId('shared-group-skeleton');
            expect(skeleton).toHaveAttribute('aria-label', 'Loading transactions');
        });
    });

    describe('count prop', () => {
        it('should render 3 card skeletons by default', () => {
            render(<SharedGroupSkeleton />);

            const cards = screen.getAllByTestId('transaction-card-skeleton');
            expect(cards).toHaveLength(3);
        });

        it('should render specified number of card skeletons', () => {
            render(<SharedGroupSkeleton count={5} />);

            const cards = screen.getAllByTestId('transaction-card-skeleton');
            expect(cards).toHaveLength(5);
        });

        it('should render 1 card skeleton when count=1', () => {
            render(<SharedGroupSkeleton count={1} />);

            const cards = screen.getAllByTestId('transaction-card-skeleton');
            expect(cards).toHaveLength(1);
        });

        it('should render 0 cards when count=0', () => {
            render(<SharedGroupSkeleton count={0} />);

            const cards = screen.queryAllByTestId('transaction-card-skeleton');
            expect(cards).toHaveLength(0);
        });
    });

    describe('loadingText prop', () => {
        it('should not show loading text by default', () => {
            render(<SharedGroupSkeleton loadingText="Loading..." />);

            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        it('should show loading text when showLoadingText is true', () => {
            render(<SharedGroupSkeleton loadingText="Loading..." showLoadingText={true} />);

            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });

        it('should not show loading text when showLoadingText is true but no text provided', () => {
            render(<SharedGroupSkeleton showLoadingText={true} />);

            // Should not crash and should not show any loading text paragraph
            const skeleton = screen.getByTestId('shared-group-skeleton');
            expect(skeleton.querySelector('p')).not.toBeInTheDocument();
        });

        it('should show custom loading message', () => {
            render(
                <SharedGroupSkeleton
                    loadingText="Loading transactions from 3 members..."
                    showLoadingText={true}
                />
            );

            expect(screen.getByText('Loading transactions from 3 members...')).toBeInTheDocument();
        });
    });

    describe('structure', () => {
        it('should use space-y-3 for vertical spacing', () => {
            render(<SharedGroupSkeleton />);

            const skeleton = screen.getByTestId('shared-group-skeleton');
            expect(skeleton).toHaveClass('space-y-3');
        });
    });
});
