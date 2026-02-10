/**
 * AppStateContext — DEPRECATED (Story 15-7b)
 *
 * AppStateContext had zero external consumers. Toast notifications
 * are managed by useToast() from '@/shared/hooks'.
 *
 * This file exists only for backward-compatible type re-exports.
 */

import type { ToastMessage } from '@/shared/hooks/useToast';

// Re-export types for backward compatibility
export type { ToastMessage };

/**
 * @deprecated Zero consumers. Use useToast() from '@/shared/hooks' instead.
 */
export interface AppStateContextValue {
    toastMessage: ToastMessage | null;
    setToastMessage: (message: ToastMessage | null) => void;
    wiping: boolean;
    setWiping: (wiping: boolean) => void;
    exporting: boolean;
    setExporting: (exporting: boolean) => void;
}
