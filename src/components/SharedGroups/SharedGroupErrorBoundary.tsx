/**
 * SharedGroupErrorBoundary Component
 *
 * Story 14c.11: Error Handling
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * React Error Boundary specifically for shared group components.
 * Catches JavaScript errors in child components and displays
 * a graceful error UI instead of crashing the entire app.
 *
 * Usage:
 * <SharedGroupErrorBoundary t={t} theme={theme} onNavigateHome={handleGoHome}>
 *   <SharedGroupTransactionsView ... />
 * </SharedGroupErrorBoundary>
 */

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export interface SharedGroupErrorBoundaryProps {
    /** Child components to wrap */
    children: ReactNode;
    /** Translation function */
    t: (key: string, params?: Record<string, string | number>) => string;
    /** Theme */
    theme?: string;
    /** Callback to navigate to home/settings */
    onNavigateHome?: () => void;
    /** Fallback component to render on error (optional override) */
    fallback?: ReactNode;
}

interface SharedGroupErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: { componentStack: string } | null;
}

export class SharedGroupErrorBoundary extends Component<
    SharedGroupErrorBoundaryProps,
    SharedGroupErrorBoundaryState
> {
    constructor(props: SharedGroupErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<SharedGroupErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: { componentStack: string }): void {
        // Log error details for debugging
        console.error('[SharedGroupErrorBoundary] Component error:', error);
        console.error('[SharedGroupErrorBoundary] Component stack:', errorInfo.componentStack);

        this.setState({ errorInfo });
    }

    handleRetry = (): void => {
        // Reset error state to attempt re-render
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render(): ReactNode {
        const { children, t, theme = 'light', onNavigateHome, fallback } = this.props;
        const { hasError, error } = this.state;

        if (!hasError) {
            return children;
        }

        // Use custom fallback if provided
        if (fallback) {
            return fallback;
        }

        const isDark = theme === 'dark';

        // Default error UI
        return (
            <div
                className="min-h-[300px] flex flex-col items-center justify-center p-6 text-center"
                role="alert"
                aria-live="assertive"
            >
                {/* Error Icon */}
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{
                        backgroundColor: isDark
                            ? 'rgba(239, 68, 68, 0.2)'
                            : 'rgba(239, 68, 68, 0.1)',
                    }}
                >
                    <AlertTriangle
                        className="w-8 h-8"
                        style={{ color: '#ef4444' }}
                    />
                </div>

                {/* Title */}
                <h2
                    className="text-lg font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                >
                    {t('errorBoundaryTitle')}
                </h2>

                {/* Message */}
                <p
                    className="text-sm mb-4 max-w-xs"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    {t('errorBoundaryMessage')}
                </p>

                {/* Error details (collapsed by default, for debugging) */}
                {import.meta.env.DEV && error && (
                    <details
                        className="mb-4 text-left w-full max-w-md"
                        style={{ color: 'var(--text-tertiary)' }}
                    >
                        <summary className="text-xs cursor-pointer mb-2">
                            {t('errorDetails')}
                        </summary>
                        <pre
                            className="text-xs p-3 rounded-lg overflow-auto max-h-32"
                            style={{
                                backgroundColor: isDark
                                    ? 'rgba(0,0,0,0.3)'
                                    : 'rgba(0,0,0,0.05)',
                            }}
                        >
                            {error.message}
                            {'\n'}
                            {error.stack}
                        </pre>
                    </details>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={this.handleRetry}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                        style={{
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                        }}
                    >
                        <RefreshCw className="w-4 h-4" />
                        {t('tryAgain')}
                    </button>

                    {onNavigateHome && (
                        <button
                            onClick={onNavigateHome}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                            style={{
                                backgroundColor: isDark
                                    ? 'rgba(255,255,255,0.1)'
                                    : 'rgba(0,0,0,0.05)',
                                color: 'var(--text-primary)',
                            }}
                        >
                            <Home className="w-4 h-4" />
                            {t('returnToHome')}
                        </button>
                    )}
                </div>
            </div>
        );
    }
}

export default SharedGroupErrorBoundary;
