/**
 * TransactionCardSkeleton Component Tests
 *
 * Story 14c.10: Empty States & Loading
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for the transaction card skeleton loading placeholder.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionCardSkeleton } from '../../../../src/components/SharedGroups/TransactionCardSkeleton';

describe('TransactionCardSkeleton', () => {
    describe('rendering', () => {
        it('should render skeleton with test id', () => {
            render(<TransactionCardSkeleton />);

            expect(screen.getByTestId('transaction-card-skeleton')).toBeInTheDocument();
        });

        it('should have animate-pulse class for shimmer effect', () => {
            render(<TransactionCardSkeleton />);

            const skeleton = screen.getByTestId('transaction-card-skeleton');
            expect(skeleton).toHaveClass('animate-pulse');
        });

        it('should have role="status" for accessibility', () => {
            render(<TransactionCardSkeleton />);

            const skeleton = screen.getByTestId('transaction-card-skeleton');
            expect(skeleton).toHaveAttribute('role', 'status');
        });

        it('should have aria-label for accessibility', () => {
            render(<TransactionCardSkeleton />);

            const skeleton = screen.getByTestId('transaction-card-skeleton');
            expect(skeleton).toHaveAttribute('aria-label', 'Loading transaction');
        });

        it('should have rounded-lg class for card styling', () => {
            render(<TransactionCardSkeleton />);

            const skeleton = screen.getByTestId('transaction-card-skeleton');
            expect(skeleton).toHaveClass('rounded-lg');
        });

        it('should have border class', () => {
            render(<TransactionCardSkeleton />);

            const skeleton = screen.getByTestId('transaction-card-skeleton');
            expect(skeleton).toHaveClass('border');
        });
    });

    describe('custom className', () => {
        it('should accept and apply custom className', () => {
            render(<TransactionCardSkeleton className="my-custom-class" />);

            const skeleton = screen.getByTestId('transaction-card-skeleton');
            expect(skeleton).toHaveClass('my-custom-class');
        });

        it('should preserve existing classes when custom className added', () => {
            render(<TransactionCardSkeleton className="my-custom-class" />);

            const skeleton = screen.getByTestId('transaction-card-skeleton');
            expect(skeleton).toHaveClass('animate-pulse');
            expect(skeleton).toHaveClass('my-custom-class');
        });
    });

    describe('structure', () => {
        it('should render thumbnail placeholder', () => {
            const { container } = render(<TransactionCardSkeleton />);

            // Thumbnail placeholder - matches TransactionCard dimensions
            const thumbnail = container.querySelector('.w-10.h-\\[46px\\]');
            expect(thumbnail).toBeInTheDocument();
        });

        it('should render content placeholders', () => {
            const { container } = render(<TransactionCardSkeleton />);

            // Should have multiple placeholder divs
            const placeholders = container.querySelectorAll('.rounded, .rounded-full');
            expect(placeholders.length).toBeGreaterThan(0);
        });
    });
});
