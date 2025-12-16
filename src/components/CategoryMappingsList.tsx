/**
 * CategoryMappingsList Component
 *
 * Displays user's learned category mappings with edit and delete functionality.
 * Implements WCAG 2.1 Level AA compliance with keyboard navigation and focus management.
 *
 * @module CategoryMappingsList
 * @see Story 6.5: Mappings Management UI
 * @see Story 9.7 enhancement: Edit functionality added
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Trash2, Edit2, BookMarked, X, Check } from 'lucide-react'
import { CategoryMapping } from '../types/categoryMapping'
import { STORE_CATEGORIES } from '../config/constants'

/**
 * Props for the CategoryMappingsList component
 */
export interface CategoryMappingsListProps {
  /** List of category mappings to display */
  mappings: CategoryMapping[]
  /** Loading state */
  loading: boolean
  /** Callback to delete a mapping */
  onDeleteMapping: (mappingId: string) => Promise<void>
  /** Callback to edit a mapping's target category (Story 9.7 enhancement) */
  onEditMapping?: (mappingId: string, newCategory: string) => Promise<void>
  /** Translation function */
  t: (key: string) => string
  /** Current theme for styling */
  theme?: 'light' | 'dark'
}

/**
 * Delete confirmation modal component
 */
interface DeleteModalProps {
  isOpen: boolean
  itemName: string
  onConfirm: () => void
  onCancel: () => void
  t: (key: string) => string
  theme?: 'light' | 'dark'
}

const DeleteConfirmModal: React.FC<DeleteModalProps> = ({
  isOpen,
  itemName,
  onConfirm,
  onCancel,
  t,
  theme = 'light',
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const previousActiveElement = useRef<Element | null>(null)

  // Store previously focused element and focus confirm button when modal opens
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement
      setTimeout(() => {
        confirmButtonRef.current?.focus()
      }, 0)
    }
  }, [isOpen])

  // Restore focus when modal closes
  const handleClose = useCallback(() => {
    onCancel()
    setTimeout(() => {
      (previousActiveElement.current as HTMLElement)?.focus?.()
    }, 0)
  }, [onCancel])

  // Handle Escape key
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

  // Focus trap within modal
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
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
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

  if (!isOpen) return null

  const cardBg = theme === 'dark' ? 'bg-slate-800' : 'bg-white'
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const secondaryText = theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
  const borderColor = theme === 'dark' ? 'border-slate-700' : 'border-slate-200'

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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-description"
        className={`relative w-full max-w-sm rounded-2xl ${cardBg} ${textColor} shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className={`absolute right-4 top-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${secondaryText}`}
          aria-label={t('close') || 'Close'}
        >
          <X size={20} aria-hidden="true" />
        </button>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
            <Trash2 size={32} className="text-white" aria-hidden="true" />
          </div>

          {/* Title */}
          <h2
            id="delete-modal-title"
            className="text-xl font-bold mb-2"
          >
            {t('deleteMappingConfirm')}
          </h2>

          {/* Description */}
          <p
            id="delete-modal-description"
            className={`mb-6 ${secondaryText}`}
          >
            "{itemName}"
          </p>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-md"
            >
              {t('confirm')}
            </button>

            <button
              onClick={handleClose}
              className={`w-full py-3 px-4 rounded-xl border ${borderColor} ${textColor} font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors`}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Edit category modal component (Story 9.7 enhancement)
 */
interface EditCategoryModalProps {
  isOpen: boolean
  mapping: CategoryMapping | null
  onSave: (newCategory: string) => void
  onCancel: () => void
  t: (key: string) => string
  theme?: 'light' | 'dark'
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  isOpen,
  mapping,
  onSave,
  onCancel,
  t,
  theme = 'light',
}) => {
  const [selectedCategory, setSelectedCategory] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)
  const previousActiveElement = useRef<Element | null>(null)

  // Initialize selected category when modal opens
  useEffect(() => {
    if (isOpen && mapping) {
      setSelectedCategory(mapping.targetCategory)
      previousActiveElement.current = document.activeElement
      setTimeout(() => {
        selectRef.current?.focus()
      }, 0)
    }
  }, [isOpen, mapping])

  // Restore focus when modal closes
  const handleClose = useCallback(() => {
    onCancel()
    setTimeout(() => {
      (previousActiveElement.current as HTMLElement)?.focus?.()
    }, 0)
  }, [onCancel])

  // Handle Escape key
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

  // Focus trap within modal
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
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
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

  const handleSave = () => {
    if (selectedCategory && selectedCategory !== mapping?.targetCategory) {
      onSave(selectedCategory)
    } else {
      handleClose()
    }
  }

  if (!isOpen || !mapping) return null

  const cardBg = theme === 'dark' ? 'bg-slate-800' : 'bg-white'
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const secondaryText = theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
  const borderColor = theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
  const inputBg = theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'

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
        aria-labelledby="edit-category-modal-title"
        className={`relative w-full max-w-sm rounded-2xl ${cardBg} ${textColor} shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className={`absolute right-4 top-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${secondaryText}`}
          aria-label={t('close') || 'Close'}
        >
          <X size={20} aria-hidden="true" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <Edit2 size={32} className="text-white" aria-hidden="true" />
          </div>

          {/* Title */}
          <h2
            id="edit-category-modal-title"
            className="text-xl font-bold mb-2 text-center"
          >
            {t('editCategoryTarget')}
          </h2>

          {/* Item name display */}
          <p className={`text-sm ${secondaryText} text-center mb-4`}>
            "{mapping.originalItem}"
          </p>

          {/* Category selector */}
          <select
            ref={selectRef}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl ${inputBg} ${textColor} border ${borderColor} focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6`}
            aria-label={t('editCategoryTarget')}
          >
            {STORE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSave}
              disabled={!selectedCategory}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check size={20} aria-hidden="true" />
              {t('save')}
            </button>

            <button
              onClick={handleClose}
              className={`w-full py-3 px-4 rounded-xl border ${borderColor} ${textColor} font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors`}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * CategoryMappingsList displays all user's learned category mappings
 * with the ability to edit and delete individual mappings.
 *
 * Features:
 * - WCAG 2.1 Level AA compliant (keyboard navigation, aria-labels)
 * - Edit with category selector modal (Story 9.7 enhancement)
 * - Delete with confirmation modal
 * - Empty state with helpful message
 * - Theme-aware styling
 *
 * @param props - CategoryMappingsListProps
 * @returns List component with mappings
 */
export const CategoryMappingsList: React.FC<CategoryMappingsListProps> = ({
  mappings,
  loading,
  onDeleteMapping,
  onEditMapping,
  t,
  theme = 'light',
}) => {
  const [deleteTarget, setDeleteTarget] = useState<CategoryMapping | null>(null)
  const [editTarget, setEditTarget] = useState<CategoryMapping | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)

  // Theme-aware styling
  const cardBg = theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'
  const itemBg = theme === 'dark' ? 'bg-slate-700' : 'bg-white'
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const secondaryText = theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
  const borderColor = theme === 'dark' ? 'border-slate-600' : 'border-slate-200'

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return

    setDeleting(true)
    try {
      await onDeleteMapping(deleteTarget.id)
    } catch (error) {
      console.error('Failed to delete mapping:', error)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  // Handle edit save (Story 9.7 enhancement)
  const handleSaveEdit = async (newCategory: string) => {
    if (!editTarget?.id || !onEditMapping) return

    setEditing(true)
    try {
      await onEditMapping(editTarget.id, newCategory)
    } catch (error) {
      console.error('Failed to edit category mapping:', error)
    } finally {
      setEditing(false)
      setEditTarget(null)
    }
  }

  // Handle keyboard navigation for the list
  const handleKeyDown = (e: React.KeyboardEvent, mapping: CategoryMapping, action: 'delete' | 'edit') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (action === 'delete') {
        setDeleteTarget(mapping)
      } else {
        setEditTarget(mapping)
      }
    }
  }

  // Format usage count message
  const formatUsageCount = (count: number): string => {
    return t('usedTimes').replace('{count}', count.toString())
  }

  // Loading state
  if (loading) {
    return (
      <div className={`p-4 rounded-xl ${cardBg} ${textColor}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-1/3"></div>
          <div className="h-12 bg-slate-300 dark:bg-slate-600 rounded"></div>
          <div className="h-12 bg-slate-300 dark:bg-slate-600 rounded"></div>
        </div>
      </div>
    )
  }

  // Empty state (AC#5)
  if (mappings.length === 0) {
    return (
      <div
        className={`p-6 rounded-xl ${cardBg} ${textColor} text-center`}
        role="status"
        aria-label={t('learnedCategoriesEmpty')}
      >
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center">
          <BookMarked size={32} className={secondaryText} aria-hidden="true" />
        </div>
        <p className="font-medium mb-2">{t('learnedCategoriesEmpty')}</p>
        <p className={`text-sm ${secondaryText}`}>{t('learnedCategoriesHint')}</p>
      </div>
    )
  }

  return (
    <>
      <ul
        ref={listRef}
        className={`rounded-xl ${cardBg} overflow-hidden divide-y ${borderColor}`}
        role="list"
        aria-label={t('learnedCategories')}
      >
        {mappings.map((mapping, index) => (
          <li
            key={mapping.id || index}
            className={`${itemBg} p-3 flex items-center justify-between gap-3 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-inset`}
          >
            <div className="flex-1 min-w-0">
              {/* Item name */}
              <p className={`font-medium ${textColor} truncate`}>
                "{mapping.originalItem}"
              </p>
              {/* Category badge and usage count */}
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  {mapping.targetCategory}
                </span>
                <span className={`text-xs ${secondaryText}`}>
                  {formatUsageCount(mapping.usageCount)}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Edit button (Story 9.7 enhancement) */}
              {onEditMapping && (
                <button
                  onClick={() => setEditTarget(mapping)}
                  onKeyDown={(e) => handleKeyDown(e, mapping, 'edit')}
                  className={`p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  aria-label={`${t('editCategoryMapping') || 'Edit'} "${mapping.originalItem}"`}
                  disabled={editing}
                >
                  <Edit2 size={18} aria-hidden="true" />
                </button>
              )}

              {/* Delete button */}
              <button
                onClick={() => setDeleteTarget(mapping)}
                onKeyDown={(e) => handleKeyDown(e, mapping, 'delete')}
                className={`p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500`}
                aria-label={`${t('deleteMapping')} "${mapping.originalItem}"`}
                disabled={deleting}
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Delete confirmation modal (AC#4) */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.originalItem || ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        t={t}
        theme={theme}
      />

      {/* Edit category modal (Story 9.7 enhancement) */}
      <EditCategoryModal
        isOpen={!!editTarget}
        mapping={editTarget}
        onSave={handleSaveEdit}
        onCancel={() => setEditTarget(null)}
        t={t}
        theme={theme}
      />
    </>
  )
}
