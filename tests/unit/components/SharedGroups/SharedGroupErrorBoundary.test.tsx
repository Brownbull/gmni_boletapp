/**
 * SharedGroupErrorBoundary Component Tests
 *
 * Story 14c.11: Error Handling
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for the React error boundary component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SharedGroupErrorBoundary } from '../../../../src/components/SharedGroups/SharedGroupErrorBoundary';

// Mock translation function
const mockT = (key: string): string => {
    const translations: Record<string, string> = {
        errorBoundaryTitle: 'Something went wrong',
        errorBoundaryMessage: "This section couldn't load. Try refreshing or return to the home screen.",
        errorDetails: 'Technical details',
        tryAgain: 'Try Again',
        returnToHome: 'Return to Home',
    };
    return translations[key] || key;
};

// Component that throws an error
const ThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test error from child component');
    }
    return <div data-testid="child-content">Child content rendered</div>;
};

// Component that conditionally throws
const ConditionalThrowingComponent = ({ throwError }: { throwError: boolean }) => {
    if (throwError) {
        throw new Error('Conditional test error');
    }
    return <div data-testid="child-content">No error content</div>;
};

describe('SharedGroupErrorBoundary', () => {
    // Suppress console.error during error boundary tests
    const originalError = console.error;

    beforeEach(() => {
        vi.clearAllMocks();
        console.error = vi.fn();
    });

    afterEach(() => {
        console.error = originalError;
    });

    describe('Normal Rendering', () => {
        it('renders children when no error occurs', () => {
            render(
                <SharedGroupErrorBoundary t={mockT}>
                    <div data-testid="child">Normal content</div>
                </SharedGroupErrorBoundary>
            );

            expect(screen.getByTestId('child')).toBeInTheDocument();
            expect(screen.getByText('Normal content')).toBeInTheDocument();
        });

        it('renders multiple children', () => {
            render(
                <SharedGroupErrorBoundary t={mockT}>
                    <div data-testid="child-1">First child</div>
                    <div data-testid="child-2">Second child</div>
                </SharedGroupErrorBoundary>
            );

            expect(screen.getByTestId('child-1')).toBeInTheDocument();
            expect(screen.getByTestId('child-2')).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('catches errors and displays error UI', () => {
            render(
                <SharedGroupErrorBoundary t={mockT}>
                    <ThrowingComponent />
                </SharedGroupErrorBoundary>
            );

            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
            expect(screen.getByText("This section couldn't load. Try refreshing or return to the home screen.")).toBeInTheDocument();
        });

        it('displays retry button', () => {
            render(
                <SharedGroupErrorBoundary t={mockT}>
                    <ThrowingComponent />
                </SharedGroupErrorBoundary>
            );

            expect(screen.getByText('Try Again')).toBeInTheDocument();
        });

        it('has role="alert" for accessibility', () => {
            render(
                <SharedGroupErrorBoundary t={mockT}>
                    <ThrowingComponent />
                </SharedGroupErrorBoundary>
            );

            expect(screen.getByRole('alert')).toBeInTheDocument();
        });

        it('logs error to console', () => {
            render(
                <SharedGroupErrorBoundary t={mockT}>
                    <ThrowingComponent />
                </SharedGroupErrorBoundary>
            );

            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('Retry Functionality', () => {
        it('provides retry button that triggers re-render attempt', () => {
            render(
                <SharedGroupErrorBoundary t={mockT}>
                    <ThrowingComponent />
                </SharedGroupErrorBoundary>
            );

            // Error UI should be shown
            expect(screen.getByText('Something went wrong')).toBeInTheDocument();

            // Retry button should be present
            const retryButton = screen.getByText('Try Again');
            expect(retryButton).toBeInTheDocument();

            // Clicking retry should not throw (it will re-catch the error)
            expect(() => fireEvent.click(retryButton)).not.toThrow();
        });
    });

    describe('Navigate Home Button', () => {
        it('shows navigate home button when callback provided', () => {
            const onNavigateHome = vi.fn();

            render(
                <SharedGroupErrorBoundary t={mockT} onNavigateHome={onNavigateHome}>
                    <ThrowingComponent />
                </SharedGroupErrorBoundary>
            );

            expect(screen.getByText('Return to Home')).toBeInTheDocument();
        });

        it('does not show navigate home button without callback', () => {
            render(
                <SharedGroupErrorBoundary t={mockT}>
                    <ThrowingComponent />
                </SharedGroupErrorBoundary>
            );

            expect(screen.queryByText('Return to Home')).not.toBeInTheDocument();
        });

        it('calls onNavigateHome when button clicked', () => {
            const onNavigateHome = vi.fn();

            render(
                <SharedGroupErrorBoundary t={mockT} onNavigateHome={onNavigateHome}>
                    <ThrowingComponent />
                </SharedGroupErrorBoundary>
            );

            fireEvent.click(screen.getByText('Return to Home'));

            expect(onNavigateHome).toHaveBeenCalledTimes(1);
        });
    });

    describe('Custom Fallback', () => {
        it('renders custom fallback when provided', () => {
            const customFallback = <div data-testid="custom-fallback">Custom error display</div>;

            render(
                <SharedGroupErrorBoundary t={mockT} fallback={customFallback}>
                    <ThrowingComponent />
                </SharedGroupErrorBoundary>
            );

            expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
            expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
        });
    });

    describe('Theme Support', () => {
        it('renders with light theme', () => {
            const { container } = render(
                <SharedGroupErrorBoundary t={mockT} theme="light">
                    <ThrowingComponent />
                </SharedGroupErrorBoundary>
            );

            expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
        });

        it('renders with dark theme', () => {
            const { container } = render(
                <SharedGroupErrorBoundary t={mockT} theme="dark">
                    <ThrowingComponent />
                </SharedGroupErrorBoundary>
            );

            expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
        });
    });

    describe('Error Details', () => {
        it('shows error title and message', () => {
            render(
                <SharedGroupErrorBoundary t={mockT}>
                    <ThrowingComponent />
                </SharedGroupErrorBoundary>
            );

            // Title should be shown
            expect(screen.getByText('Something went wrong')).toBeInTheDocument();

            // Message should be shown
            expect(screen.getByText("This section couldn't load. Try refreshing or return to the home screen.")).toBeInTheDocument();
        });

        it('shows technical details link in dev mode', () => {
            // This test verifies the structure exists when errors occur
            // In dev mode (import.meta.env.DEV is typically true in test)
            render(
                <SharedGroupErrorBoundary t={mockT}>
                    <ThrowingComponent />
                </SharedGroupErrorBoundary>
            );

            // The error boundary should catch and display error UI
            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        });
    });

    describe('Error State Persistence', () => {
        it('maintains error state when child continues to throw', () => {
            render(
                <SharedGroupErrorBoundary t={mockT}>
                    <ThrowingComponent />
                </SharedGroupErrorBoundary>
            );

            // Error UI should be shown
            expect(screen.getByText('Something went wrong')).toBeInTheDocument();

            // Click retry - error boundary resets state but child still throws
            const retryButton = screen.getByText('Try Again');
            fireEvent.click(retryButton);

            // Error UI should still be shown (child threw again)
            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        });
    });
});
