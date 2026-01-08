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

  // Theme-aware styling using CSS variables for consistency
  const isDark = theme === 'dark'

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

  // Loading state
  if (loading) {
    return (
      <div className="py-4" style={{ color: 'var(--text-secondary)' }}>
        <div className="animate-pulse space-y-3">
          <div className="h-12 rounded" style={{ backgroundColor: isDark ? '#334155' : '#e2e8f0' }}></div>
          <div className="h-12 rounded" style={{ backgroundColor: isDark ? '#334155' : '#e2e8f0' }}></div>
        </div>
      </div>
    )
  }

  // Empty state (AC#5)
  if (mappings.length === 0) {
    return (
      <div
        className="py-6 text-center"
        role="status"
        aria-label={t('learnedCategoriesEmpty')}
      >
        <div
          className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: isDark ? '#334155' : '#e2e8f0' }}
        >
          <BookMarked size={24} style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
        </div>
        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
          {t('learnedCategoriesEmpty')}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          {t('learnedCategoriesHint')}
        </p>
      </div>
    )
  }

  return (
    <>
      <div role="list" aria-label={t('learnedCategories')}>
        {mappings.map((mapping, index) => (
          <div
            key={mapping.id || index}
            className="flex items-center justify-between py-2.5"
            style={{
              borderBottom: index < mappings.length - 1 ? `1px solid ${isDark ? '#334155' : '#e2e8f0'}` : 'none',
            }}
            role="listitem"
          >
            {/* Item info */}
            <div className="flex-1 min-w-0">
              {/* Item name in quotes */}
              <p
                className="font-semibold text-sm truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                "{mapping.originalItem}"
              </p>
              {/* Category tag and usage count */}
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: '#dbeafe',
                    color: '#2563eb',
                  }}
                >
                  {mapping.targetCategory}
                </span>
                <span
                  className="text-xs"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {mapping.usageCount}x
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Edit button - green per mockup */}
              {onEditMapping && (
                <button
                  onClick={() => setEditTarget(mapping)}
                  onKeyDown={(e) => handleKeyDown(e, mapping, 'edit')}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                  style={{
                    color: '#22c55e',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  aria-label={`${t('editCategoryMapping') || 'Edit'} "${mapping.originalItem}"`}
                  disabled={editing}
                >
                  <Edit2 size={16} aria-hidden="true" />
                </button>
              )}

              {/* Delete button - red per mockup */}
              <button
                onClick={() => setDeleteTarget(mapping)}
                onKeyDown={(e) => handleKeyDown(e, mapping, 'delete')}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{
                  color: '#ef4444',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                aria-label={`${t('deleteMapping')} "${mapping.originalItem}"`}
                disabled={deleting}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>

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
