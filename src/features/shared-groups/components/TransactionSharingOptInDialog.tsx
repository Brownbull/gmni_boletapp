/**
 * TransactionSharingOptInDialog Component
 *
 * Story 14d-v2-1-6d: Transaction Sharing Opt-In & Error UI
 * Epic 14d-v2: Shared Groups v2
 *
 * Modal dialog for opt-in consent when joining a group with transaction sharing enabled.
 * Features:
 * - Shows group name and explains transaction sharing
 * - Two options: share transactions or statistics only
 * - Default: no sharing (privacy-first, per LV-6)
 * - Dismiss treated as "No" (privacy-first)
 * - Accessible (keyboard navigation, ARIA)
 *
 * @example
 * ```tsx
 * <TransactionSharingOptInDialog
 *   open={showOptIn}
 *   groupName="🏠 Household"
 *   groupColor="#10b981"
 *   onJoin={(shareMyTransactions) => handleJoin(shareMyTransactions)}
 *   onCancel={() => setShowOptIn(false)}
 *   isPending={isPending}
 *   t={t}
 * />
 * ```
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Users, Loader2, Info, Check } from 'lucide-react';
import { extractGroupEmoji, extractGroupLabel } from '@/types/sharedGroup';

// =============================================================================
// Types
// =============================================================================

export interface TransactionSharingOptInDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Group name (may include emoji prefix) */
    groupName: string;
    /** Group color for visual identification */
    groupColor: string;
    /** Group icon (optional, falls back to extracted emoji from name) */
    groupIcon?: string;
    /** Callback when user confirms join (passes shareMyTransactions choice) */
    onJoin: (shareMyTransactions: boolean) => void;
    /** Callback when user cancels (returns to accept dialog) */
    onCancel: () => void;
    /** Whether join is in progress */
    isPending: boolean;
    /** Translation function */
    t: (key: string, params?: Record<string, string | number>) => string;
    /** Language for fallback text */
    lang?: 'en' | 'es';
}

// =============================================================================
// Component
// =============================================================================

export const TransactionSharingOptInDialog: React.FC<TransactionSharingOptInDialogProps> = ({
    open,
    groupName,
    groupColor,
    groupIcon,
    onJoin,
    onCancel,
    isPending,
    t,
    lang = 'es',
}) => {
    // State - default to false (privacy-first, LV-6)
    const [shareMyTransactions, setShareMyTransactions] = useState(false);

    // Refs
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setShareMyTransactions(false); // Default to no sharing (LV-6)
            setTimeout(() => closeButtonRef.current?.focus(), 0);
        }
    }, [open]);

    // Handle Escape key
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isPending) {
                e.preventDefault();
                handleCancel();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, isPending]);

    // Prevent body scroll
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    // Handle cancel (dismiss = no sharing, per LV-6)
    const handleCancel = useCallback(() => {
        if (isPending) return;
        onCancel();
    }, [isPending, onCancel]);

    // Handle join
    const handleJoin = useCallback(() => {
        if (isPending) return;
        onJoin(shareMyTransactions);
    }, [isPending, onJoin, shareMyTransactions]);

    // Handle backdrop click (dismiss = no sharing)
    const handleBackdropClick = useCallback(() => {
        if (isPending) return;
        // Dismiss treated as cancel (back to accept dialog)
        onCancel();
    }, [isPending, onCancel]);

    // Don't render if closed
    if (!open) return null;

    // Extract group info
    const emoji = extractGroupEmoji(groupName);
    const groupLabel = extractGroupLabel(groupName);
    const displayIcon = groupIcon || emoji;

    // Translations with fallbacks
    const texts = {
        title: (t('groupAllowsTransactionSharing') || (lang === 'es'
            ? '"{group}" permite compartir transacciones'
            : '"{group}" allows transaction sharing')).replace('{group}', groupLabel),
        description: t('shareMyTransactionsDescription') || (lang === 'es'
            ? '¿Te gustaría compartir los detalles de tus transacciones con los miembros del grupo?'
            : 'Would you like to share your transaction details with group members?'),
        statisticsNote: t('statisticsAlwaysShared') || (lang === 'es'
            ? 'Tus totales de gasto siempre serán visibles en las estadísticas del grupo.'
            : 'Your spending totals will always be visible in group statistics.'),
        optionYes: t('yesShareTransactions') || (lang === 'es'
            ? 'Sí, compartir mis transacciones'
            : 'Yes, share my transactions'),
        optionYesDesc: t('yesShareTransactionsDesc') || (lang === 'es'
            ? 'Los miembros podrán ver tus transacciones individuales'
            : 'Members can see your individual transactions'),
        optionNo: t('noJustStatistics') || (lang === 'es'
            ? 'No, solo estadísticas'
            : 'No, just statistics'),
        optionNoDesc: t('noJustStatisticsDesc') || (lang === 'es'
            ? 'Solo se comparten tus totales, no los detalles'
            : 'Only your totals are shared, not the details'),
        privacyNote: t('privacyNoteOptIn') || (lang === 'es'
            ? 'Puedes cambiar esto más tarde en la configuración del grupo.'
            : 'You can change this later in group settings.'),
        cancel: t('cancel') || (lang === 'es' ? 'Cancelar' : 'Cancel'),
        joinGroup: t('joinGroup') || (lang === 'es' ? 'Unirse al Grupo' : 'Join Group'),
        joining: t('joining') || (lang === 'es' ? 'Uniendo...' : 'Joining...'),
        close: t('close') || (lang === 'es' ? 'Cerrar' : 'Close'),
        recommended: t('recommended') || (lang === 'es' ? 'Predeterminado' : 'Default'),
    };

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center"
            role="presentation"
            data-testid="optin-dialog-backdrop"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50"
                aria-hidden="true"
                onClick={handleBackdropClick}
                data-testid="backdrop-overlay"
            />

            {/* Modal */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="optin-dialog-title"
                className="relative z-10 w-full max-w-sm mx-4 max-h-[calc(100vh-4rem)] overflow-y-auto rounded-2xl shadow-xl"
                style={{ backgroundColor: 'var(--surface)' }}
                onClick={(e) => e.stopPropagation()}
                data-testid="optin-dialog"
            >
                {/* Close button */}
                <button
                    ref={closeButtonRef}
                    onClick={handleCancel}
                    disabled={isPending}
                    className="absolute right-4 top-4 p-2 rounded-full transition-colors disabled:opacity-50"
                    style={{ color: 'var(--secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                    aria-label={texts.close}
                    data-testid="close-btn"
                >
                    <X size={20} />
                </button>

                <div className="p-6">
                    {/* Header with Group Icon */}
                    <div className="flex items-center gap-4 mb-5">
                        <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                            style={{
                                backgroundColor: groupColor || '#10b981',
                                fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", "EmojiSymbols", sans-serif',
                            }}
                            data-testid="group-icon"
                        >
                            {displayIcon || <Users className="w-7 h-7 text-white" />}
                        </div>
                        <h2
                            id="optin-dialog-title"
                            className="text-lg font-bold pr-8"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {texts.title}
                        </h2>
                    </div>

                    {/* Description */}
                    <p
                        className="text-sm mb-4"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {texts.description}
                    </p>

                    {/* Statistics Note */}
                    <div
                        className="p-3 rounded-xl flex items-start gap-3 mb-5"
                        style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-light)',
                        }}
                        data-testid="statistics-note"
                    >
                        <Info
                            size={16}
                            className="flex-shrink-0 mt-0.5"
                            style={{ color: 'var(--text-secondary)' }}
                        />
                        <p
                            className="text-xs"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {texts.statisticsNote}
                        </p>
                    </div>

                    {/* Radio Options */}
                    <fieldset className="space-y-3 mb-5" role="radiogroup" aria-label={texts.description}>
                        {/* Option: Yes, share transactions */}
                        <label
                            className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-colors"
                            style={{
                                backgroundColor: shareMyTransactions ? 'var(--primary-light, rgba(16, 185, 129, 0.1))' : 'var(--bg-tertiary)',
                                border: shareMyTransactions ? '2px solid var(--primary)' : '2px solid var(--border-light)',
                            }}
                            data-testid="option-yes-label"
                        >
                            <input
                                type="radio"
                                name="shareMyTransactions"
                                value="yes"
                                checked={shareMyTransactions}
                                onChange={() => setShareMyTransactions(true)}
                                className="sr-only"
                                data-testid="share-yes-btn"
                            />
                            <div
                                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{
                                    borderColor: shareMyTransactions ? 'var(--primary)' : 'var(--border-light)',
                                    backgroundColor: shareMyTransactions ? 'var(--primary)' : 'transparent',
                                }}
                            >
                                {shareMyTransactions && <Check size={12} className="text-white" />}
                            </div>
                            <div className="flex-1">
                                <p
                                    className="text-sm font-medium"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {texts.optionYes}
                                </p>
                                <p
                                    className="text-xs mt-1"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    {texts.optionYesDesc}
                                </p>
                            </div>
                        </label>

                        {/* Option: No, just statistics (default) */}
                        <label
                            className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-colors"
                            style={{
                                backgroundColor: !shareMyTransactions ? 'var(--primary-light, rgba(16, 185, 129, 0.1))' : 'var(--bg-tertiary)',
                                border: !shareMyTransactions ? '2px solid var(--primary)' : '2px solid var(--border-light)',
                            }}
                            data-testid="option-no-label"
                        >
                            <input
                                type="radio"
                                name="shareMyTransactions"
                                value="no"
                                checked={!shareMyTransactions}
                                onChange={() => setShareMyTransactions(false)}
                                className="sr-only"
                                data-testid="share-no-btn"
                            />
                            <div
                                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{
                                    borderColor: !shareMyTransactions ? 'var(--primary)' : 'var(--border-light)',
                                    backgroundColor: !shareMyTransactions ? 'var(--primary)' : 'transparent',
                                }}
                            >
                                {!shareMyTransactions && <Check size={12} className="text-white" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p
                                        className="text-sm font-medium"
                                        style={{ color: 'var(--text-primary)' }}
                                    >
                                        {texts.optionNo}
                                    </p>
                                    <span
                                        className="text-xs px-2 py-0.5 rounded-full"
                                        style={{
                                            backgroundColor: 'var(--bg-secondary)',
                                            color: 'var(--text-secondary)',
                                        }}
                                    >
                                        {texts.recommended}
                                    </span>
                                </div>
                                <p
                                    className="text-xs mt-1"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    {texts.optionNoDesc}
                                </p>
                            </div>
                        </label>
                    </fieldset>

                    {/* Privacy Note */}
                    <p
                        className="text-xs text-center mb-5"
                        style={{ color: 'var(--text-tertiary)' }}
                        data-testid="privacy-note"
                    >
                        {texts.privacyNote}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                        {/* Join Button */}
                        <button
                            onClick={handleJoin}
                            disabled={isPending}
                            className="w-full py-3 px-4 rounded-xl text-white text-sm font-medium shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ backgroundColor: 'var(--primary)' }}
                            data-testid="join-btn"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} data-testid="loading-spinner" />
                                    {texts.joining}
                                </>
                            ) : (
                                <>
                                    <Check size={16} />
                                    {texts.joinGroup}
                                </>
                            )}
                        </button>

                        {/* Cancel Button */}
                        <button
                            onClick={handleCancel}
                            disabled={isPending}
                            className="w-full py-3 px-4 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50"
                            style={{
                                borderColor: 'var(--border-light)',
                                color: 'var(--text-primary)',
                                backgroundColor: 'var(--bg-secondary)',
                            }}
                            data-testid="cancel-btn"
                        >
                            {texts.cancel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionSharingOptInDialog;
