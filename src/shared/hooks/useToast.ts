import { useState, useCallback, useEffect } from 'react';

export interface ToastMessage {
    text: string;
    type: 'success' | 'info';
}

/**
 * Hook for managing toast notification state with auto-dismiss.
 *
 * @param autoDismissMs - Time in milliseconds before toast auto-dismisses (default: 3000)
 * @returns Toast state and control functions
 *
 * @example
 * ```tsx
 * const { toastMessage, showToast, dismissToast } = useToast();
 *
 * // Show a toast
 * showToast('Save successful', 'success');
 *
 * // Manually dismiss
 * dismissToast();
 * ```
 */
export const useToast = (autoDismissMs = 3000) => {
    const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

    const showToast = useCallback((text: string, type: 'success' | 'info' = 'info') => {
        setToastMessage({ text, type });
    }, []);

    const dismissToast = useCallback(() => {
        setToastMessage(null);
    }, []);

    // Auto-dismiss effect
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(dismissToast, autoDismissMs);
            return () => clearTimeout(timer);
        }
    }, [toastMessage, autoDismissMs, dismissToast]);

    return { toastMessage, showToast, dismissToast };
};
