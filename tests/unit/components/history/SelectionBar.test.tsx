/**
 * SelectionBar Component Tests
 *
 * Story 14.15: Transaction Selection Mode & Groups
 * Story 14c.8: Added "Select All" functionality
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SelectionBar } from '../../../../src/components/history/SelectionBar';

// ============================================================================
// Test Setup
// ============================================================================

// Story 14c.8 Code Review: Updated mockT with translation keys used by component
const mockT = (key: string) => {
    const translations: Record<string, string> = {
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
        none: 'None',
        groupLabel: 'Group',
        delete: 'Delete',
        selectionToolbar: 'Selection toolbar',
        exitSelectionMode: 'Exit selection mode',
        assignToGroup: 'Assign to group',
        deleteSelected: 'Delete selected',
    };
    return translations[key] || key;
};

const defaultProps = {
    selectedCount: 0,
    onClose: vi.fn(),
    onGroup: vi.fn(),
    onDelete: vi.fn(),
    t: mockT,
    theme: 'light' as const,
    lang: 'es' as const,
};

describe('SelectionBar', () => {
    // ========================================================================
    // Basic Rendering
    // ========================================================================

    describe('rendering', () => {
        it('renders selection bar with correct role', () => {
            render(<SelectionBar {...defaultProps} />);

            expect(screen.getByRole('toolbar')).toBeInTheDocument();
        });

        it('displays selection count in Spanish when lang is es', () => {
            render(<SelectionBar {...defaultProps} selectedCount={3} lang="es" />);

            expect(screen.getByText('3 seleccionados')).toBeInTheDocument();
        });

        it('displays selection count in English when lang is en', () => {
            render(<SelectionBar {...defaultProps} selectedCount={3} lang="en" />);

            expect(screen.getByText('3 selected')).toBeInTheDocument();
        });

        it('shows singular form for single selection (Spanish)', () => {
            render(<SelectionBar {...defaultProps} selectedCount={1} lang="es" />);

            expect(screen.getByText('1 seleccionado')).toBeInTheDocument();
        });

        it('shows singular form for single selection (English)', () => {
            render(<SelectionBar {...defaultProps} selectedCount={1} lang="en" />);

            expect(screen.getByText('1 selected')).toBeInTheDocument();
        });
    });

    // ========================================================================
    // Close Button
    // ========================================================================

    describe('close button', () => {
        it('renders close button', () => {
            render(<SelectionBar {...defaultProps} />);

            expect(screen.getByTestId('selection-bar-close')).toBeInTheDocument();
        });

        it('calls onClose when close button is clicked', () => {
            const onClose = vi.fn();
            render(<SelectionBar {...defaultProps} onClose={onClose} />);

            fireEvent.click(screen.getByTestId('selection-bar-close'));

            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    // ========================================================================
    // Group Button
    // ========================================================================

    describe('group button', () => {
        it('renders group button', () => {
            render(<SelectionBar {...defaultProps} />);

            expect(screen.getByTestId('selection-bar-group')).toBeInTheDocument();
        });

        it('disables group button when selectedCount is 0', () => {
            render(<SelectionBar {...defaultProps} selectedCount={0} />);

            expect(screen.getByTestId('selection-bar-group')).toBeDisabled();
        });

        it('enables group button when selectedCount > 0', () => {
            render(<SelectionBar {...defaultProps} selectedCount={2} />);

            expect(screen.getByTestId('selection-bar-group')).not.toBeDisabled();
        });

        it('calls onGroup when group button is clicked', () => {
            const onGroup = vi.fn();
            render(<SelectionBar {...defaultProps} selectedCount={2} onGroup={onGroup} />);

            fireEvent.click(screen.getByTestId('selection-bar-group'));

            expect(onGroup).toHaveBeenCalledTimes(1);
        });

        // Story 14c.8 Code Review: Now uses t() function, tests combined
        it('shows translated "Group" label via t() function', () => {
            render(<SelectionBar {...defaultProps} />);

            expect(screen.getByText('Group')).toBeInTheDocument();
        });
    });

    // ========================================================================
    // Delete Button
    // ========================================================================

    describe('delete button', () => {
        it('renders delete button', () => {
            render(<SelectionBar {...defaultProps} />);

            expect(screen.getByTestId('selection-bar-delete')).toBeInTheDocument();
        });

        it('disables delete button when selectedCount is 0', () => {
            render(<SelectionBar {...defaultProps} selectedCount={0} />);

            expect(screen.getByTestId('selection-bar-delete')).toBeDisabled();
        });

        it('enables delete button when selectedCount > 0', () => {
            render(<SelectionBar {...defaultProps} selectedCount={2} />);

            expect(screen.getByTestId('selection-bar-delete')).not.toBeDisabled();
        });

        it('calls onDelete when delete button is clicked', () => {
            const onDelete = vi.fn();
            render(<SelectionBar {...defaultProps} selectedCount={2} onDelete={onDelete} />);

            fireEvent.click(screen.getByTestId('selection-bar-delete'));

            expect(onDelete).toHaveBeenCalledTimes(1);
        });

        // Story 14c.8 Code Review: Now uses t() function, tests combined
        it('shows translated "Delete" label via t() function', () => {
            render(<SelectionBar {...defaultProps} />);

            expect(screen.getByText('Delete')).toBeInTheDocument();
        });
    });

    // ========================================================================
    // Story 14c.8: Select All Button
    // ========================================================================

    describe('select all button (Story 14c.8)', () => {
        it('does not render select all button when onSelectAll is not provided', () => {
            render(<SelectionBar {...defaultProps} totalVisible={5} />);

            expect(screen.queryByTestId('selection-bar-select-all')).not.toBeInTheDocument();
        });

        it('does not render select all button when totalVisible is 0', () => {
            const onSelectAll = vi.fn();
            render(<SelectionBar {...defaultProps} onSelectAll={onSelectAll} totalVisible={0} />);

            expect(screen.queryByTestId('selection-bar-select-all')).not.toBeInTheDocument();
        });

        it('renders select all button when onSelectAll and totalVisible are provided', () => {
            const onSelectAll = vi.fn();
            render(<SelectionBar {...defaultProps} onSelectAll={onSelectAll} totalVisible={5} />);

            expect(screen.getByTestId('selection-bar-select-all')).toBeInTheDocument();
        });

        it('calls onSelectAll when select all button is clicked', () => {
            const onSelectAll = vi.fn();
            render(<SelectionBar {...defaultProps} onSelectAll={onSelectAll} totalVisible={5} />);

            fireEvent.click(screen.getByTestId('selection-bar-select-all'));

            expect(onSelectAll).toHaveBeenCalledTimes(1);
        });

        // Story 14c.8 Code Review: Tests updated to use t() translation keys
        it('shows "Select All" label when not all are selected', () => {
            const onSelectAll = vi.fn();
            render(
                <SelectionBar
                    {...defaultProps}
                    selectedCount={2}
                    totalVisible={5}
                    onSelectAll={onSelectAll}
                />
            );

            expect(screen.getByText('Select All')).toBeInTheDocument();
        });

        it('shows "None" label when all are selected', () => {
            const onSelectAll = vi.fn();
            render(
                <SelectionBar
                    {...defaultProps}
                    selectedCount={5}
                    totalVisible={5}
                    onSelectAll={onSelectAll}
                />
            );

            expect(screen.getByText('None')).toBeInTheDocument();
        });

        // Story 14c.8 Code Review: Updated aria-label expectations to match mockT translations
        it('has correct aria-label when not all selected', () => {
            const onSelectAll = vi.fn();
            render(
                <SelectionBar
                    {...defaultProps}
                    selectedCount={2}
                    totalVisible={5}
                    onSelectAll={onSelectAll}
                />
            );

            expect(screen.getByTestId('selection-bar-select-all')).toHaveAttribute(
                'aria-label',
                'Select All'
            );
        });

        it('has correct aria-label when all selected', () => {
            const onSelectAll = vi.fn();
            render(
                <SelectionBar
                    {...defaultProps}
                    selectedCount={5}
                    totalVisible={5}
                    onSelectAll={onSelectAll}
                />
            );

            expect(screen.getByTestId('selection-bar-select-all')).toHaveAttribute(
                'aria-label',
                'Deselect All'
            );
        });
    });

    // ========================================================================
    // Accessibility
    // ========================================================================

    describe('accessibility', () => {
        it('has aria-live region for selection count', () => {
            render(<SelectionBar {...defaultProps} selectedCount={3} />);

            const countElement = screen.getByText('3 seleccionados');
            expect(countElement).toHaveAttribute('aria-live', 'polite');
        });

        // Story 14c.8 Code Review: Updated aria-label expectations to match mockT translations
        it('has correct aria-label on close button', () => {
            render(<SelectionBar {...defaultProps} />);

            expect(screen.getByTestId('selection-bar-close')).toHaveAttribute(
                'aria-label',
                'Exit selection mode'
            );
        });

        it('has correct aria-label on group button', () => {
            render(<SelectionBar {...defaultProps} />);

            expect(screen.getByTestId('selection-bar-group')).toHaveAttribute(
                'aria-label',
                'Assign to group'
            );
        });

        it('has correct aria-label on delete button', () => {
            render(<SelectionBar {...defaultProps} />);

            expect(screen.getByTestId('selection-bar-delete')).toHaveAttribute(
                'aria-label',
                'Delete selected'
            );
        });
    });
});
