/**
 * ShareCodeDisplay Component
 *
 * Story 14c.1: Create Shared Group
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Displays a share code with copy and share functionality.
 * Used after creating a shared group to show the shareable link.
 *
 * Features:
 * - Prominent share code display
 * - Copy to clipboard button
 * - Native share sheet integration
 * - Expiry date indicator
 * - QR code placeholder (future)
 */

import React, { useState, useCallback } from 'react';
import { Copy, Share2, Check, Clock, RefreshCw } from 'lucide-react';

export interface ShareCodeDisplayProps {
    /** The 16-character share code */
    shareCode: string;
    /** Full share link URL */
    shareLink: string;
    /** When the code expires (ISO string or Date) */
    expiresAt: Date | null;
    /** Group name for share message */
    groupName: string;
    /** Whether the code is expired */
    isExpired?: boolean;
    /** Callback to regenerate code (owner only) */
    onRegenerate?: () => Promise<void>;
    /** Translation function */
    t: (key: string) => string;
    /** Language for formatting */
    lang?: 'en' | 'es';
}

export const ShareCodeDisplay: React.FC<ShareCodeDisplayProps> = ({
    shareCode,
    shareLink,
    expiresAt,
    groupName,
    isExpired = false,
    onRegenerate,
    t: _t, // Kept for API consistency; uses inline lang-based strings
    lang = 'es',
}) => {
    // Note: _t is intentionally unused - this component uses inline
    // Spanish/English strings via the lang prop for simplicity
    const [isCopied, setIsCopied] = useState(false);
    const [isCodeCopied, setIsCodeCopied] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Format expiry date
    const formatExpiry = (date: Date | null): string => {
        if (!date) return '';
        const options: Intl.DateTimeFormatOptions = {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        };
        return date.toLocaleDateString(lang === 'es' ? 'es-CL' : 'en-US', options);
    };

    // Copy link to clipboard
    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(shareLink);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('[ShareCodeDisplay] Copy failed:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = shareLink;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    }, [shareLink]);

    // Copy just the code to clipboard
    const handleCopyCode = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(shareCode);
            setIsCodeCopied(true);
            setTimeout(() => setIsCodeCopied(false), 2000);
        } catch (err) {
            console.error('[ShareCodeDisplay] Copy code failed:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = shareCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setIsCodeCopied(true);
            setTimeout(() => setIsCodeCopied(false), 2000);
        }
    }, [shareCode]);

    // Native share
    const handleShare = useCallback(async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: groupName,
                    text: lang === 'es'
                        ? `Únete a mi grupo "${groupName}" en BoletApp`
                        : `Join my group "${groupName}" on BoletApp`,
                    url: shareLink,
                });
            } catch (err) {
                // User cancelled or error
                if ((err as Error).name !== 'AbortError') {
                    console.error('[ShareCodeDisplay] Share failed:', err);
                }
            }
        } else {
            // Fallback to copy
            handleCopy();
        }
    }, [groupName, shareLink, lang, handleCopy]);

    // Regenerate share code
    const handleRegenerate = useCallback(async () => {
        if (!onRegenerate) return;
        setIsRegenerating(true);
        try {
            await onRegenerate();
        } finally {
            setIsRegenerating(false);
        }
    }, [onRegenerate]);

    return (
        <div className="space-y-4">
            {/* Share Code Box */}
            <div
                className="rounded-xl p-4"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: `1px solid ${isExpired ? 'var(--error)' : 'var(--border-light)'}`,
                }}
            >
                {/* Code Display - clickable to copy */}
                <div className="text-center mb-3">
                    <div
                        className="text-xs font-medium mb-1"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {lang === 'es' ? 'Código para compartir' : 'Share Code'}
                    </div>
                    <button
                        onClick={handleCopyCode}
                        disabled={isExpired}
                        className="font-mono text-2xl font-bold tracking-wider px-3 py-1 rounded-lg transition-all cursor-pointer hover:opacity-80"
                        style={{
                            color: isCodeCopied ? 'white' : (isExpired ? 'var(--error)' : 'var(--primary)'),
                            backgroundColor: isCodeCopied ? '#10b981' : 'transparent',
                            letterSpacing: '0.1em',
                        }}
                        data-testid="share-code"
                        title={lang === 'es' ? 'Clic para copiar código' : 'Click to copy code'}
                    >
                        {isCodeCopied ? (lang === 'es' ? '¡Copiado!' : 'Copied!') : shareCode}
                    </button>
                </div>

                {/* Expiry Info */}
                {expiresAt && (
                    <div
                        className="flex items-center justify-center gap-1.5 text-xs mb-3"
                        style={{
                            color: isExpired ? 'var(--error)' : 'var(--text-secondary)',
                        }}
                    >
                        <Clock size={12} />
                        <span>
                            {isExpired
                                ? (lang === 'es' ? 'Código expirado' : 'Code expired')
                                : (lang === 'es'
                                    ? `Válido hasta ${formatExpiry(expiresAt)}`
                                    : `Valid until ${formatExpiry(expiresAt)}`
                                )
                            }
                        </span>
                    </div>
                )}

                {/* Share Link Display */}
                <div
                    className="rounded-lg p-2.5 mb-3 text-center overflow-hidden"
                    style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-light)',
                    }}
                >
                    <div
                        className="text-xs font-mono truncate"
                        style={{ color: 'var(--text-secondary)' }}
                        title={shareLink}
                    >
                        {shareLink}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    {/* Copy Button */}
                    <button
                        onClick={handleCopy}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-medium rounded-lg transition-all"
                        style={{
                            backgroundColor: isCopied ? '#10b981' : 'var(--bg-tertiary)',
                            border: '1px solid var(--border-light)',
                            color: isCopied ? 'white' : 'var(--text-primary)',
                        }}
                        disabled={isExpired}
                        data-testid="share-copy-btn"
                    >
                        {isCopied ? (
                            <>
                                <Check size={16} />
                                <span>{lang === 'es' ? 'Copiado!' : 'Copied!'}</span>
                            </>
                        ) : (
                            <>
                                <Copy size={16} />
                                <span>{lang === 'es' ? 'Copiar' : 'Copy'}</span>
                            </>
                        )}
                    </button>

                    {/* Share Button (if Web Share API available) */}
                    {typeof navigator !== 'undefined' && 'share' in navigator && (
                        <button
                            onClick={handleShare}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-semibold rounded-lg transition-colors"
                            style={{
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                            }}
                            disabled={isExpired}
                            data-testid="share-native-btn"
                        >
                            <Share2 size={16} />
                            <span>{lang === 'es' ? 'Compartir' : 'Share'}</span>
                        </button>
                    )}
                </div>

                {/* Regenerate Button - always available for owners */}
                {onRegenerate && (
                    <button
                        onClick={handleRegenerate}
                        disabled={isRegenerating}
                        className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-medium rounded-lg transition-colors"
                        style={{
                            backgroundColor: isExpired ? 'var(--primary)' : 'var(--bg-tertiary)',
                            color: isExpired ? 'white' : 'var(--text-secondary)',
                            border: isExpired ? 'none' : '1px solid var(--border-light)',
                            opacity: isRegenerating ? 0.6 : 1,
                        }}
                        data-testid="share-regenerate-btn"
                    >
                        <RefreshCw size={16} className={isRegenerating ? 'animate-spin' : ''} />
                        <span>
                            {isRegenerating
                                ? (lang === 'es' ? 'Regenerando...' : 'Regenerating...')
                                : (lang === 'es' ? 'Regenerar Código' : 'Regenerate Code')
                            }
                        </span>
                    </button>
                )}
            </div>

            {/* Instructions */}
            <div
                className="text-xs text-center"
                style={{ color: 'var(--text-secondary)' }}
            >
                {lang === 'es'
                    ? 'Comparte este enlace para invitar a otros al grupo'
                    : 'Share this link to invite others to the group'
                }
            </div>
        </div>
    );
};

export default ShareCodeDisplay;
