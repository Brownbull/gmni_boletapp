/**
 * SankeyIconNode Component Tests
 * Story 14.13.3 Phase 5: Tests for icon node with progress-ring border
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SankeyIconNode } from '@features/analytics/components/SankeyIconNode';

describe('SankeyIconNode', () => {
    const defaultProps = {
        emoji: '🛒',
        percent: 50,
        color: '#3b82f6',
    };

    describe('rendering', () => {
        it('should render the emoji', () => {
            render(<SankeyIconNode {...defaultProps} />);
            expect(screen.getByText('🛒')).toBeInTheDocument();
        });

        it('should render with default size of 32px', () => {
            render(<SankeyIconNode {...defaultProps} testId="test-node" />);
            const button = screen.getByRole('button');
            expect(button).toHaveStyle({ width: '32px', height: '32px' });
        });

        it('should render with custom size', () => {
            render(<SankeyIconNode {...defaultProps} size={48} testId="test-node" />);
            const button = screen.getByRole('button');
            expect(button).toHaveStyle({ width: '48px', height: '48px' });
        });

        it('should render with conic-gradient background', () => {
            render(<SankeyIconNode {...defaultProps} percent={50} />);
            const button = screen.getByRole('button');
            // 50% = 180 degrees - check style attribute directly since jsdom may not parse it
            const style = button.getAttribute('style') || '';
            expect(style).toContain('conic-gradient');
        });

        it('should render label when provided', () => {
            render(<SankeyIconNode {...defaultProps} label="Test Label" />);
            expect(screen.getByText('Test Label')).toBeInTheDocument();
        });

        it('should not render label when not provided', () => {
            render(<SankeyIconNode {...defaultProps} />);
            expect(screen.queryByText('Test Label')).not.toBeInTheDocument();
        });
    });

    describe('accessibility', () => {
        it('should have proper aria-label with emoji and percentage', () => {
            render(<SankeyIconNode {...defaultProps} percent={75.5} />);
            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('aria-label', '🛒 - 75.5%');
        });

        it('should indicate selected state with aria-pressed', () => {
            render(<SankeyIconNode {...defaultProps} isSelected={true} />);
            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('aria-pressed', 'true');
        });

        it('should indicate not selected state with aria-pressed', () => {
            render(<SankeyIconNode {...defaultProps} isSelected={false} />);
            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('aria-pressed', 'false');
        });
    });

    describe('interactions', () => {
        it('should call onClick when clicked', () => {
            const handleClick = vi.fn();
            render(<SankeyIconNode {...defaultProps} onClick={handleClick} />);

            fireEvent.click(screen.getByRole('button'));
            expect(handleClick).toHaveBeenCalledTimes(1);
        });

        it('should call onClick when Enter key is pressed', () => {
            const handleClick = vi.fn();
            render(<SankeyIconNode {...defaultProps} onClick={handleClick} />);

            fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
            expect(handleClick).toHaveBeenCalledTimes(1);
        });

        it('should call onClick when Space key is pressed', () => {
            const handleClick = vi.fn();
            render(<SankeyIconNode {...defaultProps} onClick={handleClick} />);

            fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
            expect(handleClick).toHaveBeenCalledTimes(1);
        });

        it('should not throw when clicked without onClick handler', () => {
            render(<SankeyIconNode {...defaultProps} />);
            expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
        });
    });

    describe('percentage calculations', () => {
        it('should clamp percent to 0 when negative', () => {
            render(<SankeyIconNode {...defaultProps} percent={-10} />);
            const button = screen.getByRole('button');
            // Should show 0.0% in aria-label
            expect(button).toHaveAttribute('aria-label', '🛒 - 0.0%');
        });

        it('should clamp percent to 100 when over 100', () => {
            render(<SankeyIconNode {...defaultProps} percent={150} />);
            const button = screen.getByRole('button');
            // Should show 100.0% in aria-label
            expect(button).toHaveAttribute('aria-label', '🛒 - 100.0%');
        });

        it('should handle 0% correctly', () => {
            render(<SankeyIconNode {...defaultProps} percent={0} />);
            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('aria-label', '🛒 - 0.0%');
        });

        it('should handle 100% correctly', () => {
            render(<SankeyIconNode {...defaultProps} percent={100} />);
            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('aria-label', '🛒 - 100.0%');
        });
    });

    describe('selection state', () => {
        it('should show selection ring when selected', () => {
            const { container } = render(<SankeyIconNode {...defaultProps} isSelected={true} />);
            // Selection ring has animate-pulse class
            const selectionRing = container.querySelector('.animate-pulse');
            expect(selectionRing).toBeInTheDocument();
        });

        it('should not show selection ring when not selected', () => {
            const { container } = render(<SankeyIconNode {...defaultProps} isSelected={false} />);
            const selectionRing = container.querySelector('.animate-pulse');
            expect(selectionRing).not.toBeInTheDocument();
        });
    });

    describe('test id', () => {
        it('should render with testId', () => {
            render(<SankeyIconNode {...defaultProps} testId="my-test-node" />);
            expect(screen.getByTestId('my-test-node')).toBeInTheDocument();
        });
    });
});
