/**
 * CategoryLearningPrompt Component
 *
 * Accessible modal that prompts users to save a category preference for future use.
 * Implements WCAG 2.1 Level AA compliance with proper focus trap and keyboard handling.
 *
 * @module CategoryLearningPrompt
 * @see Story 6.3: Category Learning Prompt
 */

import React, { useEffect, useRef, useCallback } from 'react'
import { X, BookMarked } from 'lucide-react'
import { StoreCategory } from '../types/transaction'

/**
 * Item to learn mapping
 */
export interface ItemToLearn {
  itemName: string
  newGroup: string
}

/**
 * Props for the CategoryLearningPrompt component
 */
export interface CategoryLearningPromptProps {
  /** Whether the modal is currently open */
  isOpen: boolean
  /** Items to learn (array of item name → group mappings) */
  items: ItemToLearn[]
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
 * Accessible category learning prompt modal.
 *
 * Features:
 * - WCAG 2.1 Level AA compliant (role="dialog", aria-modal, aria-labelledby)
 * - Focus trap within modal while open
 * - Escape key closes modal
 * - Focus returns to trigger element after close
 * - Support for both English and Spanish translations
 *
 * @param props - CategoryLearningPromptProps
 * @returns Modal component or null when closed
 *
 * @example
 * ```tsx
 * <CategoryLearningPrompt
 *   isOpen={showLearningPrompt}
 *   itemName="UBER EATS"
 *   category="Transport"
 *   onConfirm={handleSaveMapping}
 *   onClose={() => setShowLearningPrompt(false)}
 *   t={t}
 *   theme="light"
 * />
 * ```
 */
export const CategoryLearningPrompt: React.FC<CategoryLearningPromptProps> = ({
  isOpen,
  items,
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

  // Handle Escape key to close modal (AC#6)
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

  // Focus trap within modal (AC#6)
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

  if (!isOpen || items.length === 0) return null

  // Theme-aware styling
  const cardBg = theme === 'dark' ? 'bg-slate-800' : 'bg-white'
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const secondaryText = theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
  const borderColor = theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
  const itemBg = theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
      role="presentation"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="learn-modal-title"
        aria-describedby="learn-modal-description"
        className={`relative w-full max-w-sm rounded-2xl ${cardBg} ${textColor} shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={handleClose}
          className={`absolute right-4 top-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${secondaryText}`}
          aria-label={t('close') || 'Close'}
        >
          <X size={20} aria-hidden="true" />
        </button>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
            <BookMarked size={32} className="text-white" aria-hidden="true" />
          </div>

          {/* Title */}
          <h2
            id="learn-modal-title"
            className="text-xl font-bold mb-2"
          >
            {t('learnCategoryTitle')}
          </h2>

          {/* Description - show list of items to learn */}
          <div
            id="learn-modal-description"
            className={`mb-6 ${secondaryText}`}
          >
            <p className="mb-3">{t('learnCategoryMessage')}</p>
            <ul className="text-left space-y-2">
              {items.map((item, index) => (
                <li
                  key={index}
                  className={`px-3 py-2 rounded-lg ${itemBg} text-sm`}
                >
                  <span className="font-medium">{item.itemName}</span>
                  <span className={secondaryText}> → </span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{item.newGroup}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md"
            >
              {t('learnCategoryConfirm')}
            </button>

            <button
              onClick={handleClose}
              className={`w-full py-3 px-4 rounded-xl border ${borderColor} ${textColor} font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors`}
            >
              {t('learnCategorySkip')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
