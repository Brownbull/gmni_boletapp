/**
 * MerchantMappingsList Component
 *
 * Displays user's learned merchant mappings with edit and delete functionality.
 * Implements WCAG 2.1 Level AA compliance with keyboard navigation and focus management.
 *
 * @module MerchantMappingsList
 * @see Story 9.7: Merchant Mappings Management UI
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Trash2, Edit2, Store, X, Check } from 'lucide-react'
import { MerchantMapping } from '../types/merchantMapping'

/**
 * Props for the MerchantMappingsList component
 */
export interface MerchantMappingsListProps {
  /** List of merchant mappings to display */
  mappings: MerchantMapping[]
  /** Loading state */
  loading: boolean
  /** Callback to delete a mapping */
  onDeleteMapping: (mappingId: string) => Promise<void>
  /** Callback to edit a mapping's target merchant */
  onEditMapping: (mappingId: string, newTarget: string) => Promise<void>
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
        aria-labelledby="delete-merchant-modal-title"
        aria-describedby="delete-merchant-modal-description"
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
            id="delete-merchant-modal-title"
            className="text-xl font-bold mb-2"
          >
            {t('deleteMerchantMappingConfirm')}
          </h2>

          {/* Description */}
          <p
            id="delete-merchant-modal-description"
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
 * Edit modal for changing the target merchant name
 */
interface EditModalProps {
  isOpen: boolean
  mapping: MerchantMapping | null
  onSave: (newTarget: string) => void
  onCancel: () => void
  t: (key: string) => string
  theme?: 'light' | 'dark'
}

const EditMerchantModal: React.FC<EditModalProps> = ({
  isOpen,
  mapping,
  onSave,
  onCancel,
  t,
  theme = 'light',
}) => {
  const [editValue, setEditValue] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const previousActiveElement = useRef<Element | null>(null)

  // Initialize edit value when modal opens
  useEffect(() => {
    if (isOpen && mapping) {
      setEditValue(mapping.targetMerchant)
      previousActiveElement.current = document.activeElement
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
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

  // Handle Escape key and Enter to save
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
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== mapping?.targetMerchant) {
      onSave(trimmed)
    } else {
      handleClose()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
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
        aria-labelledby="edit-merchant-modal-title"
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
            id="edit-merchant-modal-title"
            className="text-xl font-bold mb-2 text-center"
          >
            {t('editMerchantTarget')}
          </h2>

          {/* Original name display */}
          <p className={`text-sm ${secondaryText} text-center mb-4`}>
            {mapping.originalMerchant}
          </p>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className={`w-full px-4 py-3 rounded-xl ${inputBg} ${textColor} border ${borderColor} focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6`}
            placeholder={t('displayName') || 'Display name'}
            aria-label={t('editMerchantTarget')}
          />

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSave}
              disabled={!editValue.trim()}
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
 * MerchantMappingsList displays all user's learned merchant mappings
 * with the ability to edit and delete individual mappings.
 *
 * Features:
 * - WCAG 2.1 Level AA compliant (keyboard navigation, aria-labels)
 * - Delete with confirmation modal
 * - Edit with modal dialog
 * - Empty state with helpful message
 * - Theme-aware styling
 *
 * @param props - MerchantMappingsListProps
 * @returns List component with mappings
 */
export const MerchantMappingsList: React.FC<MerchantMappingsListProps> = ({
  mappings,
  loading,
  onDeleteMapping,
  onEditMapping,
  t,
  theme = 'light',
}) => {
  const [deleteTarget, setDeleteTarget] = useState<MerchantMapping | null>(null)
  const [editTarget, setEditTarget] = useState<MerchantMapping | null>(null)
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
      console.error('Failed to delete merchant mapping:', error)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  // Handle edit save
  const handleSaveEdit = async (newTarget: string) => {
    if (!editTarget?.id) return

    setEditing(true)
    try {
      await onEditMapping(editTarget.id, newTarget)
    } catch (error) {
      console.error('Failed to edit merchant mapping:', error)
    } finally {
      setEditing(false)
      setEditTarget(null)
    }
  }

  // Handle keyboard navigation for the list
  const handleKeyDown = (e: React.KeyboardEvent, mapping: MerchantMapping, action: 'delete' | 'edit') => {
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

  // Empty state (AC#6)
  if (mappings.length === 0) {
    return (
      <div
        className={`p-6 rounded-xl ${cardBg} ${textColor} text-center`}
        role="status"
        aria-label={t('learnedMerchantsEmpty')}
      >
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center">
          <Store size={32} className={secondaryText} aria-hidden="true" />
        </div>
        <p className="font-medium mb-2">{t('learnedMerchantsEmpty')}</p>
        <p className={`text-sm ${secondaryText}`}>{t('learnedMerchantsHint')}</p>
      </div>
    )
  }

  return (
    <>
      <ul
        ref={listRef}
        className={`rounded-xl ${cardBg} overflow-hidden divide-y ${borderColor}`}
        role="list"
        aria-label={t('learnedMerchants')}
      >
        {mappings.map((mapping, index) => (
          <li
            key={mapping.id || index}
            className={`${itemBg} p-3 flex items-center justify-between gap-3 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-inset`}
          >
            <div className="flex-1 min-w-0">
              {/* Original merchant name */}
              <p className={`text-sm ${secondaryText} truncate`}>
                {mapping.originalMerchant}
              </p>
              {/* Target merchant (display name) and usage count */}
              <div className="flex items-center gap-2 mt-1">
                <span className={`font-medium ${textColor} truncate`}>
                  → {mapping.targetMerchant}
                </span>
                <span className={`text-xs ${secondaryText} flex-shrink-0`}>
                  ({formatUsageCount(mapping.usageCount)})
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Edit button */}
              <button
                onClick={() => setEditTarget(mapping)}
                onKeyDown={(e) => handleKeyDown(e, mapping, 'edit')}
                className={`p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500`}
                aria-label={`${t('editMerchantMapping')} "${mapping.originalMerchant}"`}
                disabled={editing}
              >
                <Edit2 size={18} aria-hidden="true" />
              </button>

              {/* Delete button */}
              <button
                onClick={() => setDeleteTarget(mapping)}
                onKeyDown={(e) => handleKeyDown(e, mapping, 'delete')}
                className={`p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500`}
                aria-label={`${t('deleteMapping')} "${mapping.originalMerchant}"`}
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
        itemName={deleteTarget ? `${deleteTarget.originalMerchant} → ${deleteTarget.targetMerchant}` : ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        t={t}
        theme={theme}
      />

      {/* Edit modal (AC#5) */}
      <EditMerchantModal
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
