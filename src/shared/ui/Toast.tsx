/**
 * Toast - Notification component for feedback messages
 *
 * Story 14e-23: Extracted from App.tsx to shared UI component
 *
 * @example
 * ```tsx
 * const { toastMessage, showToast } = useToast();
 *
 * <Toast message={toastMessage} />
 * ```
 */
import React from 'react';
import type { ToastMessage } from '../hooks/useToast';

interface ToastProps {
    message: ToastMessage | null;
}

/**
 * Toast notification component with theme-aware styling.
 * Renders a fixed-position notification at the bottom of the screen.
 */
export function Toast({ message }: ToastProps): React.ReactElement | null {
    if (!message) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl shadow-lg z-50 animate-fade-in flex items-center gap-2"
            style={{
                backgroundColor: message.type === 'success' ? 'var(--primary)' : 'var(--accent)',
                color: '#ffffff',
                fontFamily: 'var(--font-family)',
                fontSize: '14px',
                fontWeight: 500,
            }}
        >
            {message.type === 'success' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
            )}
            {message.text}
        </div>
    );
}

export default Toast;
