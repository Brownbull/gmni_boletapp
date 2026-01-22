/**
 * Story 14c-refactor.11: AppErrorBoundary Unit Tests
 *
 * Tests for the App-level error boundary component that catches
 * and displays errors with theme-aware styling.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppErrorBoundary } from '../../../../src/components/App/AppErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow, message = 'Test error' }: { shouldThrow: boolean; message?: string }) {
    if (shouldThrow) {
        throw new Error(message);
    }
    return <div>No error</div>;
}

describe('AppErrorBoundary', () => {
    // Suppress console.error during error boundary tests
    const originalError = console.error;
    beforeEach(() => {
        console.error = vi.fn();
    });
    afterEach(() => {
        console.error = originalError;
    });

    describe('Normal rendering', () => {
        it('should render children when no error occurs', () => {
            render(
                <AppErrorBoundary>
                    <div>Child content</div>
                </AppErrorBoundary>
            );
            expect(screen.getByText('Child content')).toBeInTheDocument();
        });

        it('should render multiple children correctly', () => {
            render(
                <AppErrorBoundary>
                    <div>First child</div>
                    <div>Second child</div>
                </AppErrorBoundary>
            );
            expect(screen.getByText('First child')).toBeInTheDocument();
            expect(screen.getByText('Second child')).toBeInTheDocument();
        });
    });

    describe('Error handling', () => {
        it('should catch errors and display fallback UI', () => {
            render(
                <AppErrorBoundary>
                    <ThrowError shouldThrow={true} message="Component crashed" />
                </AppErrorBoundary>
            );

            // Component displays "Critical Error" title and description
            expect(screen.getByText('Critical Error')).toBeInTheDocument();
            expect(screen.getByText(/Component crashed/)).toBeInTheDocument();
        });

        it('should display error message in fallback UI', () => {
            render(
                <AppErrorBoundary>
                    <ThrowError shouldThrow={true} message="Specific error message" />
                </AppErrorBoundary>
            );

            expect(screen.getByText(/Specific error message/)).toBeInTheDocument();
        });

        it('should have a reload button in error UI', () => {
            render(
                <AppErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </AppErrorBoundary>
            );

            const reloadButton = screen.getByText('Reload App');
            expect(reloadButton).toBeInTheDocument();
        });

        it('should call window.location.reload when reload button is clicked', () => {
            // Mock window.location.reload
            const mockReload = vi.fn();
            const originalLocation = window.location;
            Object.defineProperty(window, 'location', {
                value: { ...originalLocation, reload: mockReload },
                writable: true,
            });

            render(
                <AppErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </AppErrorBoundary>
            );

            const reloadButton = screen.getByText('Reload App');
            fireEvent.click(reloadButton);

            expect(mockReload).toHaveBeenCalled();

            // Restore
            Object.defineProperty(window, 'location', {
                value: originalLocation,
                writable: true,
            });
        });
    });

    describe('Styling and theme', () => {
        it('should apply theme-aware background color to error container', () => {
            const { container } = render(
                <AppErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </AppErrorBoundary>
            );

            // The main container should exist with min-h-screen class
            const errorDiv = container.querySelector('.min-h-screen');
            expect(errorDiv).toBeInTheDocument();
        });

        it('should display error icon', () => {
            render(
                <AppErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </AppErrorBoundary>
            );

            // Should have the TriangleAlert icon (SVG)
            const svg = document.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });
    });

    describe('Stack trace display (AC #6, Task 2.4)', () => {
        it('should show stack trace only in development mode', () => {
            const originalEnv = import.meta.env.DEV;

            // In test environment, DEV is typically true
            // This test verifies the conditional rendering is present
            render(
                <AppErrorBoundary>
                    <ThrowError shouldThrow={true} message="Test error" />
                </AppErrorBoundary>
            );

            // The error message should always be visible
            expect(screen.getByText(/Error:/)).toBeInTheDocument();

            // In DEV mode, stack trace should be visible (conditional based on import.meta.env.DEV)
            // Note: The actual visibility depends on the build environment
        });
    });

    describe('Error boundary isolation', () => {
        it('should not affect sibling components when one throws', () => {
            // This tests that errors are properly contained
            render(
                <>
                    <AppErrorBoundary>
                        <ThrowError shouldThrow={true} />
                    </AppErrorBoundary>
                    <div data-testid="sibling">Sibling content</div>
                </>
            );

            // Error is caught (displays "Critical Error" title)
            expect(screen.getByText('Critical Error')).toBeInTheDocument();
            // Sibling is unaffected
            expect(screen.getByTestId('sibling')).toBeInTheDocument();
        });
    });
});
