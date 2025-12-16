/**
 * LearnMerchantDialog Component
 *
 * Accessible modal that prompts users to save a merchant name correction for future use.
 * Implements WCAG 2.1 Level AA compliance with proper focus trap and keyboard handling.
 *
 * @module LearnMerchantDialog
 * @see Story 9.6: Merchant Learning Prompt
 */

import React, { useEffect, useRef, useCallback } from 'react'
import { X, BookMarked } from 'lucide-react'

/**
 * Props for the LearnMerchantDialog component
 */
export interface LearnMerchantDialogProps {
  /** Whether the modal is currently open */
  isOpen: boolean
  /** Original merchant name (from AI scan or previous value) */
  originalMerchant: string
  /** User's corrected merchant name */
  correctedMerchant: string
  /** Callback when user clicks "Yes, Remember" */
  onConfirm: () => void
  /** Callback when user dismisses the modal */
  onClose: () => void
  /** Translation function */
  t: (key: string) => string
  /** Current theme for styling */
  theme?: 'light' | 'dark'
}

/**
 * Accessible merchant learning prompt modal.
 *
 * Features:
 * - WCAG 2.1 Level AA compliant (role="dialog", aria-modal, aria-labelledby)
 * - Focus trap within modal while open
 * - Escape key closes modal
 * - Focus returns to trigger element after close
 * - Support for both English and Spanish translations
 * - Shows original vs corrected merchant name clearly
 *
 * @param props - LearnMerchantDialogProps
 * @returns Modal component or null when closed
 *
 * @example
 * ```tsx
 * <LearnMerchantDialog
 *   isOpen={showMerchantLearningPrompt}
 *   originalMerchant="SUPERMERC JUMBO #123"
 *   correctedMerchant="Jumbo Supermarket"
 *   onConfirm={handleLearnMerchant}
 *   onClose={() => setShowMerchantLearningPrompt(false)}
 *   t={t}
 *   theme="light"
 * />
 * ```
 */
export const LearnMerchantDialog: React.FC<LearnMerchantDialogProps> = ({
  isOpen,
  originalMerchant,
  correctedMerchant,
  onConfirm,
  onClose,
  t,
  theme = 'light',
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousActiveElement = useRef<Element | null>(null)

  // Store the previously focused element when modal opens
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement
      // Focus the close button after a short delay to allow modal to render
      setTimeout(() => {
        closeButtonRef.current?.focus()
      }, 0)
    }
  }, [isOpen])

  // Restore focus when modal closes
  const handleClose = useCallback(() => {
    onClose()
    // Return focus to the element that triggered the modal
    setTimeout(() => {
      (previousActiveElement.current as HTMLElement)?.focus?.()
    }, 0)
  }, [onClose])

  // Handle Escape key to close modal (AC#5 - same UX as category learning)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  // Focus trap within modal (AC#5 - accessibility)
  useEffect(() => {
    if (!isOpen || !modalRef.current) return

    const modalElement = modalRef.current
    const focusableElements = modalElement.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab: moving backwards
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isOpen])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Don't render if not open or no merchant names provided
  if (!isOpen || !originalMerchant || !correctedMerchant) return null

  // Theme-aware styling using CSS variables
  const isDark = theme === 'dark'

  // Modal card styling using CSS variables
  const modalStyle: React.CSSProperties = {
    backgroundColor: 'var(--surface)',
    color: 'var(--primary)',
  }

  // Merchant display styling
  const merchantBoxStyle: React.CSSProperties = {
    backgroundColor: isDark ? '#334155' : '#f1f5f9',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
      role="presentation"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      {/* Modal with CSS variable styling */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="learn-merchant-modal-title"
        aria-describedby="learn-merchant-modal-description"
        className="relative w-full max-w-sm rounded-2xl shadow-xl"
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={handleClose}
          className="absolute right-4 top-4 p-2 rounded-full transition-colors"
          style={{
            color: 'var(--secondary)',
            backgroundColor: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(100, 116, 139, 0.1)',
          }}
          aria-label={t('close') || 'Close'}
        >
          <X size={20} aria-hidden="true" />
        </button>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Icon with gradient accent */}
          <div
            className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--accent), #6366f1)' }}
          >
            <BookMarked size={32} className="text-white" aria-hidden="true" />
          </div>

          {/* Title (AC#1) */}
          <h2
            id="learn-merchant-modal-title"
            className="text-xl font-bold mb-2"
            style={{ color: 'var(--primary)' }}
          >
            {t('learnMerchantTitle')}
          </h2>

          {/* Description (AC#2 - shows original vs corrected clearly) */}
          <div
            id="learn-merchant-modal-description"
            className="mb-6"
            style={{ color: 'var(--secondary)' }}
          >
            <p className="mb-4">{t('learnMerchantMessage')}</p>

            {/* Original merchant */}
            <div className="text-left mb-2">
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--secondary)' }}>
                {t('learnMerchantOriginal')}
              </div>
              <div
                className="px-3 py-2 rounded-lg text-sm font-mono"
                style={merchantBoxStyle}
              >
                <span style={{ color: 'var(--secondary)' }}>{originalMerchant}</span>
              </div>
            </div>

            {/* Arrow indicator */}
            <div className="text-center my-2" style={{ color: 'var(--secondary)' }}>
              ↓
            </div>

            {/* Corrected merchant */}
            <div className="text-left">
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--secondary)' }}>
                {t('learnMerchantCorrected')}
              </div>
              <div
                className="px-3 py-2 rounded-lg text-sm"
                style={{
                  ...merchantBoxStyle,
                  borderLeft: '3px solid var(--accent)',
                }}
              >
                <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                  {correctedMerchant}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons (AC#3, AC#4) */}
          <div className="flex flex-col gap-3">
            {/* Remember button (AC#3) */}
            <button
              onClick={onConfirm}
              className="w-full py-3 px-4 rounded-xl text-white font-semibold shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: 'linear-gradient(135deg, var(--accent), #6366f1)' }}
            >
              {t('learnMerchantConfirm')}
            </button>

            {/* Skip button (AC#4) */}
            <button
              onClick={handleClose}
              className="w-full py-3 px-4 rounded-xl border font-medium transition-colors"
              style={{
                borderColor: isDark ? '#475569' : '#e2e8f0',
                color: 'var(--primary)',
                backgroundColor: 'transparent',
              }}
            >
              {t('learnMerchantSkip')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
