/**
 * RecoverySyncPrompt Component
 *
 * Story 14d-v2-1-9: Firestore TTL & Offline Persistence
 * Epic 14d-v2: Shared Groups v2
 *
 * Dialog that prompts users to perform a full sync when they've been
 * offline longer than the changelog TTL (30 days).
 *
 * Features:
 * - WCAG 2.1 Level AA compliant (role="dialog", aria-modal, aria-labelledby)
 * - Focus trap within modal while open
 * - Escape key closes modal (when not syncing)
 * - Loading state during sync operation
 * - Bilingual support (English/Spanish)
 *
 * AC10: User is prompted to perform a full sync when offline > 30 days
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { X, RefreshCw, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { useBodyScrollLock, useEscapeKey, useFocusTrap } from '@/shared/hooks';
import { Z_INDEX } from '@/constants';
import { safeCSSColor } from '@/utils/validationUtils';

/**
 * Cooldown duration between sync attempts in milliseconds.
 * H1: Rate limiting to prevent abuse/DoS.
 */
export const SYNC_COOLDOWN_MS = 30000; // 30 seconds

/**
 * Props for RecoverySyncPrompt component.
 */
export interface RecoverySyncPromptProps {
    /** Whether the modal is currently open */
    isOpen: boolean;
    /** Name of the group that needs sync */
    groupName: string;
    /** Color of the group (for visual consistency) */
    groupColor: string;
    /** Icon/emoji of the group (optional) */
    groupIcon?: string;
    /** Number of days since last sync (optional, for display) */
    daysSinceLastSync?: number | null;
    /** Callback when user clicks Full Sync button */
    onFullSync: () => Promise<void>;
    /** Callback when dialog is closed/canceled */
    onClose: () => void;
    /** Translation function */
    t: (key: string) => string;
    /** Language for fallback text */
    lang?: 'en' | 'es';
}

/**
 * Recovery sync prompt dialog for offline recovery.
 */
export const RecoverySyncPrompt: React.FC<RecoverySyncPromptProps> = ({
    isOpen,
    groupName,
    groupColor,
    groupIcon,
    daysSinceLastSync,
    onFullSync,
    onClose,
    t,
    lang = 'es',
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const previousActiveElement = useRef<Element | null>(null);
    const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // L1: Track close focus restoration

    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);

    // H1: Rate limiting state and refs
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const lastSyncAttemptRef = useRef<number>(0);
    const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // H1: Helper to start cooldown timer
    const startCooldownTimer = useCallback((seconds: number) => {
        setCooldownRemaining(seconds);
        if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
        }
        cooldownIntervalRef.current = setInterval(() => {
            setCooldownRemaining(prev => {
                if (prev <= 1) {
                    if (cooldownIntervalRef.current) {
                        clearInterval(cooldownIntervalRef.current);
                        cooldownIntervalRef.current = null;
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    // H1: Cleanup cooldown interval on unmount
    useEffect(() => {
        return () => {
            if (cooldownIntervalRef.current) {
                clearInterval(cooldownIntervalRef.current);
                cooldownIntervalRef.current = null;
            }
        };
    }, []);

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setIsSyncing(false);
            setSyncError(null);
        }
    }, [isOpen]);

    // Store the previously focused element when modal opens
    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement;
            focusTimeoutRef.current = setTimeout(() => {
                closeButtonRef.current?.focus();
            }, 0);
        }
        return () => {
            if (focusTimeoutRef.current) {
                clearTimeout(focusTimeoutRef.current);
                focusTimeoutRef.current = null;
            }
        };
    }, [isOpen]);

    // Restore focus when modal closes
    const handleClose = useCallback(() => {
        if (isSyncing) return; // Don't close while syncing
        onClose();
        // L1: Track close timeout for cleanup
        closeTimeoutRef.current = setTimeout(() => {
            (previousActiveElement.current as HTMLElement)?.focus?.();
        }, 0);
    }, [onClose, isSyncing]);

    // L1: Cleanup close timeout on unmount
    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
            }
        };
    }, []);

    // Shared dialog hooks for accessibility
    useEscapeKey(handleClose, isOpen, isSyncing);
    useFocusTrap(modalRef, isOpen);
    useBodyScrollLock(isOpen);

    // Handle full sync with error handling and rate limiting (H1 fix from code review)
    const handleFullSync = useCallback(async () => {
        // H1: Rate limiting check
        const now = Date.now();
        const elapsed = now - lastSyncAttemptRef.current;
        if (elapsed < SYNC_COOLDOWN_MS && lastSyncAttemptRef.current > 0) {
            const remainingSeconds = Math.ceil((SYNC_COOLDOWN_MS - elapsed) / 1000);
            setSyncError(`Please wait ${remainingSeconds}s before retrying`);
            startCooldownTimer(remainingSeconds);
            return;
        }

        lastSyncAttemptRef.current = now;
        setIsSyncing(true);
        setSyncError(null);
        try {
            await onFullSync();
            // Success - parent should close dialog after successful sync
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Sync failed';
            setSyncError(message);
            // H1: Start cooldown after failure
            startCooldownTimer(SYNC_COOLDOWN_MS / 1000);
        } finally {
            setIsSyncing(false);
        }
    }, [onFullSync, startCooldownTimer]);

    if (!isOpen) return null;

    // Translations with fallbacks
    const texts = {
        title: t('recoverySyncTitle') || (lang === 'es'
            ? 'Recuperación de Sincronización'
            : 'Sync Recovery Needed'),
        message: t('recoverySyncMessage') || (lang === 'es'
            ? 'Has estado desconectado por un tiempo. Parte del historial de sincronización ha expirado. Por favor haz una sincronización completa para restaurar los datos del grupo.'
            : "You've been offline for a while. Some sync history has expired. Please do a full sync to restore your group data."),
        fullSync: t('recoverySyncFullSync') || (lang === 'es'
            ? 'Sincronización Completa'
            : 'Full Sync'),
        cancel: t('cancel') || (lang === 'es' ? 'Cancelar' : 'Cancel'),
        close: t('close') || (lang === 'es' ? 'Cerrar' : 'Close'),
        daysAgo: lang === 'es' ? 'días sin sincronizar' : 'days since last sync',
        syncFailed: lang === 'es' ? 'Error al sincronizar' : 'Sync failed',
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: Z_INDEX.MODAL }}
            role="presentation"
            data-testid="recovery-sync-prompt-backdrop"
            onClick={handleClose}
        >
            {/* Full-screen backdrop - covers entire viewport including nav */}
            <div
                className="fixed inset-0 bg-black/50"
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="recovery-sync-modal-title"
                aria-describedby="recovery-sync-modal-description"
                className="relative z-10 w-full max-w-sm mx-4 rounded-2xl shadow-xl"
                style={{ backgroundColor: 'var(--surface)' }}
                onClick={(e) => e.stopPropagation()}
                data-testid="recovery-sync-prompt-dialog"
            >
                {/* Close button */}
                <button
                    ref={closeButtonRef}
                    onClick={handleClose}
                    disabled={isSyncing}
                    className="absolute right-4 top-4 p-2 rounded-full transition-colors disabled:opacity-50"
                    style={{
                        color: 'var(--secondary)',
                        backgroundColor: 'var(--bg-tertiary)',
                    }}
                    aria-label={texts.close}
                    data-testid="recovery-sync-close-btn"
                >
                    <X size={20} aria-hidden="true" />
                </button>

                {/* Content */}
                <div className="p-6 text-center">
                    {/* Warning Icon or Group Icon */}
                    <div
                        className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                        style={{ backgroundColor: safeCSSColor(groupColor) }}
                        aria-hidden="true"
                    >
                        {groupIcon || <AlertTriangle className="text-white" size={28} />}
                    </div>

                    {/* Title */}
                    <h2
                        id="recovery-sync-modal-title"
                        className="text-xl font-bold mb-1"
                        style={{ color: 'var(--primary)' }}
                    >
                        {texts.title}
                    </h2>

                    {/* Group name */}
                    <p
                        className="text-sm mb-2 font-medium"
                        style={{ color: safeCSSColor(groupColor) }}
                    >
                        {groupName}
                    </p>

                    {/* Days since last sync */}
                    {daysSinceLastSync !== null && daysSinceLastSync !== undefined && (
                        <div
                            className="flex items-center justify-center gap-2 mb-4 text-sm"
                            style={{ color: 'var(--secondary)' }}
                        >
                            <Clock size={16} aria-hidden="true" />
                            <span>{daysSinceLastSync} {texts.daysAgo}</span>
                        </div>
                    )}

                    {/* Description */}
                    <p
                        id="recovery-sync-modal-description"
                        className="text-sm mb-6"
                        style={{ color: 'var(--secondary)' }}
                    >
                        {texts.message}
                    </p>

                    {/* Error message */}
                    {(syncError || cooldownRemaining > 0) && (
                        <div
                            className="mb-4 p-3 rounded-lg text-sm"
                            style={{
                                backgroundColor: 'var(--error-bg, rgba(239, 68, 68, 0.1))',
                                color: 'var(--error, #ef4444)',
                            }}
                            role="alert"
                            data-testid="recovery-sync-error"
                        >
                            {cooldownRemaining > 0
                                ? `${texts.syncFailed}: Please wait ${cooldownRemaining}s before retrying`
                                : `${texts.syncFailed}: ${syncError}`}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3">
                        {/* Full Sync button */}
                        <button
                            type="button"
                            onClick={handleFullSync}
                            disabled={isSyncing}
                            className="w-full py-3 px-4 rounded-xl text-white font-semibold shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            style={{ backgroundColor: safeCSSColor(groupColor) }}
                            data-testid="recovery-sync-full-btn"
                        >
                            {isSyncing ? (
                                <>
                                    <Loader2
                                        className="animate-spin"
                                        size={18}
                                        data-testid="recovery-sync-loading"
                                    />
                                    {lang === 'es' ? 'Sincronizando...' : 'Syncing...'}
                                </>
                            ) : (
                                <>
                                    <RefreshCw size={18} />
                                    {texts.fullSync}
                                </>
                            )}
                        </button>

                        {/* Cancel button */}
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSyncing}
                            className="w-full py-3 px-4 rounded-xl border font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{
                                borderColor: 'var(--border-light)',
                                color: 'var(--text-primary)',
                                backgroundColor: 'var(--bg-secondary)',
                            }}
                            data-testid="recovery-sync-cancel-btn"
                        >
                            <X size={18} />
                            {texts.cancel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecoverySyncPrompt;
