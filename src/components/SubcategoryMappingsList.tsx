/**
 * SubcategoryMappingsList Component
 *
 * Displays user's learned subcategory mappings with edit and delete functionality.
 * Implements WCAG 2.1 Level AA compliance with keyboard navigation and focus management.
 *
 * @module SubcategoryMappingsList
 * @see Story 9.15: Subcategory Learning & Management
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Trash2, Pencil, Tag, X } from 'lucide-react'
import { SubcategoryMapping } from '../types/subcategoryMapping'

/**
 * Props for the SubcategoryMappingsList component
 */
export interface SubcategoryMappingsListProps {
  /** List of subcategory mappings to display */
  mappings: SubcategoryMapping[]
  /** Loading state */
  loading: boolean
  /** Callback to delete a mapping */
  onDeleteMapping: (mappingId: string) => Promise<void>
  /** Callback to update a mapping's target subcategory */
  onUpdateMapping: (mappingId: string, newSubcategory: string) => Promise<void>
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

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement
      setTimeout(() => {
        confirmButtonRef.current?.focus()
      }, 0)
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    onCancel()
    setTimeout(() => {
      (previousActiveElement.current as HTMLElement)?.focus?.()
    }, 0)
  }, [onCancel])

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
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      <div
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-subcategory-modal-title"
        aria-describedby="delete-subcategory-modal-description"
        className={`relative w-full max-w-sm rounded-2xl ${cardBg} ${textColor} shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className={`absolute right-4 top-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${secondaryText}`}
          aria-label={t('close') || 'Close'}
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="p-6 text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
            <Trash2 size={32} className="text-white" aria-hidden="true" />
          </div>

          <h2 id="delete-subcategory-modal-title" className="text-xl font-bold mb-2">
            {t('deleteSubcategoryMappingConfirm')}
          </h2>

          <p id="delete-subcategory-modal-description" className={`mb-6 ${secondaryText}`}>
            "{itemName}"
          </p>

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
 * Edit modal component for updating subcategory
 */
interface EditModalProps {
  isOpen: boolean
  itemName: string
  currentSubcategory: string
  onSave: (newSubcategory: string) => void
  onCancel: () => void
  t: (key: string) => string
  theme?: 'light' | 'dark'
}

const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  itemName,
  currentSubcategory,
  onSave,
  onCancel,
  t,
  theme = 'light',
}) => {
  const [newSubcategory, setNewSubcategory] = useState(currentSubcategory)
  const modalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const previousActiveElement = useRef<Element | null>(null)

  useEffect(() => {
    if (isOpen) {
      setNewSubcategory(currentSubcategory)
      previousActiveElement.current = document.activeElement
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [isOpen, currentSubcategory])

  const handleClose = useCallback(() => {
    onCancel()
    setTimeout(() => {
      (previousActiveElement.current as HTMLElement)?.focus?.()
    }, 0)
  }, [onCancel])

  const handleSave = () => {
    if (newSubcategory.trim()) {
      onSave(newSubcategory.trim())
    }
  }

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSave()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose, newSubcategory])

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
  const inputBg = theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-subcategory-modal-title"
        className={`relative w-full max-w-sm rounded-2xl ${cardBg} ${textColor} shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className={`absolute right-4 top-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${secondaryText}`}
          aria-label={t('close') || 'Close'}
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="p-6">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <Pencil size={32} className="text-white" aria-hidden="true" />
          </div>

          <h2 id="edit-subcategory-modal-title" className="text-xl font-bold mb-2 text-center">
            {t('editSubcategoryMapping')}
          </h2>

          <p className={`mb-4 text-center ${secondaryText}`}>
            "{itemName}"
          </p>

          <div className="mb-6">
            <label htmlFor="subcategory-input" className={`block text-sm font-medium mb-2 ${secondaryText}`}>
              {t('subcategory')}
            </label>
            <input
              ref={inputRef}
              id="subcategory-input"
              type="text"
              value={newSubcategory}
              onChange={(e) => setNewSubcategory(e.target.value)}
              className={`w-full p-3 rounded-lg border ${borderColor} ${inputBg} ${textColor} focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none`}
              placeholder={t('enterSubcategory')}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className={`flex-1 py-3 px-4 rounded-xl border ${borderColor} ${textColor} font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors`}
            >
              {t('cancel')}
            </button>

            <button
              onClick={handleSave}
              disabled={!newSubcategory.trim()}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * SubcategoryMappingsList displays all user's learned subcategory mappings
 * with the ability to edit and delete individual mappings.
 *
 * Features:
 * - WCAG 2.1 Level AA compliant (keyboard navigation, aria-labels)
 * - Edit with modal
 * - Delete with confirmation modal
 * - Empty state with helpful message
 * - Theme-aware styling
 * - Usage count display
 */
export const SubcategoryMappingsList: React.FC<SubcategoryMappingsListProps> = ({
  mappings,
  loading,
  onDeleteMapping,
  onUpdateMapping,
  t,
  theme = 'light',
}) => {
  const [deleteTarget, setDeleteTarget] = useState<SubcategoryMapping | null>(null)
  const [editTarget, setEditTarget] = useState<SubcategoryMapping | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [updating, setUpdating] = useState(false)

  // Theme-aware styling using CSS variables for consistency
  const isDark = theme === 'dark'

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return

    setDeleting(true)
    try {
      await onDeleteMapping(deleteTarget.id)
    } catch (error) {
      console.error('Failed to delete subcategory mapping:', error)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  // Handle edit save
  const handleSaveEdit = async (newSubcategory: string) => {
    if (!editTarget?.id) return

    setUpdating(true)
    try {
      await onUpdateMapping(editTarget.id, newSubcategory)
    } catch (error) {
      console.error('Failed to update subcategory mapping:', error)
    } finally {
      setUpdating(false)
      setEditTarget(null)
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

  // Empty state
  if (mappings.length === 0) {
    return (
      <div
        className="py-6 text-center"
        role="status"
        aria-label={t('learnedSubcategoriesEmpty')}
      >
        <div
          className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: isDark ? '#334155' : '#e2e8f0' }}
        >
          <Tag size={24} style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
        </div>
        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
          {t('learnedSubcategoriesEmpty')}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          {t('learnedSubcategoriesHint')}
        </p>
      </div>
    )
  }

  return (
    <>
      <div role="list" aria-label={t('learnedSubcategories')}>
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
              {/* Subcategory tag and usage count */}
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: '#fce7f3',
                    color: '#db2777',
                  }}
                >
                  {mapping.targetSubcategory}
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
              <button
                onClick={() => setEditTarget(mapping)}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{
                  color: '#22c55e',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                aria-label={`${t('editMapping')} "${mapping.originalItem}"`}
                disabled={updating}
              >
                <Pencil size={16} aria-hidden="true" />
              </button>

              {/* Delete button - red per mockup */}
              <button
                onClick={() => setDeleteTarget(mapping)}
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

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.originalItem || ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        t={t}
        theme={theme}
      />

      {/* Edit modal */}
      <EditModal
        isOpen={!!editTarget}
        itemName={editTarget?.originalItem || ''}
        currentSubcategory={editTarget?.targetSubcategory || ''}
        onSave={handleSaveEdit}
        onCancel={() => setEditTarget(null)}
        t={t}
        theme={theme}
      />
    </>
  )
}
