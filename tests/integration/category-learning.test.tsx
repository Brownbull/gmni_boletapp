/**
 * Category Learning Prompt Integration Tests
 *
 * Tests for Story 6.3: Category Learning Prompt
 * Covers: Prompt rendering, confirm/dismiss actions, accessibility,
 * focus trap, keyboard navigation, translations, and toast feedback.
 *
 * Risk Level: MEDIUM (user preference learning feature)
 * Coverage: CategoryLearningPrompt component, EditView integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { CategoryLearningPrompt } from '../../src/components/CategoryLearningPrompt'
import { EditView } from '../../src/views/EditView'
import type { StoreCategory } from '../../src/types/transaction'

// Mock translations
const mockTranslations: Record<string, string> = {
  learnCategoryTitle: 'Learn This Category?',
  learnCategoryMessage: 'Remember "{item}" as {category} for future receipts?',
  learnCategoryConfirm: 'Yes, Remember',
  learnCategorySkip: 'Not Now',
  learnCategorySuccess: "Got it! I'll remember this.",
  close: 'Close',
  back: 'Back',
  editTrans: 'Edit Transaction',
  newTrans: 'New Transaction',
  total: 'Total',
  merchant: 'Merchant',
  alias: 'Alias',
  date: 'Date',
  items: 'Items',
  addItem: 'Add Item',
  itemName: 'Item Name',
  itemCat: 'Item Category',
  delete: 'Delete',
  save: 'Save',
  deleteItem: 'Delete Item',
  confirmItem: 'Confirm Item',
}

const mockT = (key: string) => mockTranslations[key] || key

describe('Category Learning Prompt - Story 6.3', () => {
  describe('CategoryLearningPrompt Component', () => {
    const defaultProps = {
      isOpen: true,
      itemName: 'UBER EATS',
      category: 'Transport' as StoreCategory,
      onConfirm: vi.fn(),
      onClose: vi.fn(),
      t: mockT,
      theme: 'light' as const,
    }

    beforeEach(() => {
      vi.clearAllMocks()
    })

    afterEach(() => {
      vi.restoreAllMocks()
      document.body.style.overflow = ''
    })

    describe('AC#1: Prompt appears on category change', () => {
      it('should render when isOpen is true', () => {
        render(<CategoryLearningPrompt {...defaultProps} />)

        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Learn This Category?')).toBeInTheDocument()
      })

      it('should not render when isOpen is false', () => {
        render(<CategoryLearningPrompt {...defaultProps} isOpen={false} />)

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    describe('AC#2: Prompt shows item name and category', () => {
      it('should display item name in message', () => {
        render(<CategoryLearningPrompt {...defaultProps} itemName="UBER EATS" />)

        expect(
          screen.getByText('Remember "UBER EATS" as Transport for future receipts?')
        ).toBeInTheDocument()
      })

      it('should display category in message', () => {
        render(
          <CategoryLearningPrompt {...defaultProps} category="Restaurant" />
        )

        expect(
          screen.getByText('Remember "UBER EATS" as Restaurant for future receipts?')
        ).toBeInTheDocument()
      })

      it('should update message when item or category changes', () => {
        const { rerender } = render(
          <CategoryLearningPrompt {...defaultProps} itemName="STARBUCKS" category="Restaurant" />
        )

        expect(
          screen.getByText('Remember "STARBUCKS" as Restaurant for future receipts?')
        ).toBeInTheDocument()

        rerender(
          <CategoryLearningPrompt {...defaultProps} itemName="WALMART" category="Supermarket" />
        )

        expect(
          screen.getByText('Remember "WALMART" as Supermarket for future receipts?')
        ).toBeInTheDocument()
      })
    })

    describe('AC#3: "Yes, Remember" button saves mapping', () => {
      it('should render confirm button with correct text', () => {
        render(<CategoryLearningPrompt {...defaultProps} />)

        expect(
          screen.getByRole('button', { name: 'Yes, Remember' })
        ).toBeInTheDocument()
      })

      it('should call onConfirm when confirm button is clicked', () => {
        const onConfirm = vi.fn()
        render(<CategoryLearningPrompt {...defaultProps} onConfirm={onConfirm} />)

        fireEvent.click(screen.getByRole('button', { name: 'Yes, Remember' }))

        expect(onConfirm).toHaveBeenCalledTimes(1)
      })
    })

    describe('AC#4: "Not Now" button dismisses without saving', () => {
      it('should render dismiss button with correct text', () => {
        render(<CategoryLearningPrompt {...defaultProps} />)

        expect(
          screen.getByRole('button', { name: 'Not Now' })
        ).toBeInTheDocument()
      })

      it('should call onClose when dismiss button is clicked', () => {
        const onClose = vi.fn()
        render(<CategoryLearningPrompt {...defaultProps} onClose={onClose} />)

        fireEvent.click(screen.getByRole('button', { name: 'Not Now' }))

        expect(onClose).toHaveBeenCalledTimes(1)
      })

      it('should not call onConfirm when dismiss button is clicked', () => {
        const onConfirm = vi.fn()
        const onClose = vi.fn()
        render(
          <CategoryLearningPrompt
            {...defaultProps}
            onConfirm={onConfirm}
            onClose={onClose}
          />
        )

        fireEvent.click(screen.getByRole('button', { name: 'Not Now' }))

        expect(onClose).toHaveBeenCalledTimes(1)
        expect(onConfirm).not.toHaveBeenCalled()
      })
    })

    describe('AC#6: Accessibility (focus trap, keyboard navigation)', () => {
      it('should have role="dialog" and aria-modal="true"', () => {
        render(<CategoryLearningPrompt {...defaultProps} />)

        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAttribute('aria-modal', 'true')
      })

      it('should have aria-labelledby pointing to title', () => {
        render(<CategoryLearningPrompt {...defaultProps} />)

        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAttribute('aria-labelledby', 'learn-modal-title')

        const title = screen.getByText('Learn This Category?')
        expect(title).toHaveAttribute('id', 'learn-modal-title')
      })

      it('should have aria-describedby pointing to description', () => {
        render(<CategoryLearningPrompt {...defaultProps} />)

        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAttribute('aria-describedby', 'learn-modal-description')
      })

      it('should close on Escape key press', () => {
        const onClose = vi.fn()
        render(<CategoryLearningPrompt {...defaultProps} onClose={onClose} />)

        fireEvent.keyDown(document, { key: 'Escape' })

        expect(onClose).toHaveBeenCalledTimes(1)
      })

      it('should close when clicking backdrop', () => {
        const onClose = vi.fn()
        render(<CategoryLearningPrompt {...defaultProps} onClose={onClose} />)

        // Find the backdrop (the outer div with role="presentation")
        const backdrop = screen.getByRole('presentation')
        fireEvent.click(backdrop)

        expect(onClose).toHaveBeenCalledTimes(1)
      })

      it('should not close when clicking modal content', () => {
        const onClose = vi.fn()
        render(<CategoryLearningPrompt {...defaultProps} onClose={onClose} />)

        const dialog = screen.getByRole('dialog')
        fireEvent.click(dialog)

        expect(onClose).not.toHaveBeenCalled()
      })

      it('should have close button with aria-label', () => {
        render(<CategoryLearningPrompt {...defaultProps} />)

        const closeButton = screen.getByRole('button', { name: 'Close' })
        expect(closeButton).toBeInTheDocument()
      })

      it('should prevent body scroll when open', () => {
        render(<CategoryLearningPrompt {...defaultProps} isOpen={true} />)

        expect(document.body.style.overflow).toBe('hidden')
      })

      it('should restore body scroll when closed', () => {
        const { rerender } = render(
          <CategoryLearningPrompt {...defaultProps} isOpen={true} />
        )

        expect(document.body.style.overflow).toBe('hidden')

        rerender(<CategoryLearningPrompt {...defaultProps} isOpen={false} />)

        expect(document.body.style.overflow).toBe('')
      })
    })

    describe('AC#7: Translations (English and Spanish)', () => {
      it('should display English translations', () => {
        render(<CategoryLearningPrompt {...defaultProps} />)

        expect(screen.getByText('Learn This Category?')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Yes, Remember' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Not Now' })).toBeInTheDocument()
      })

      it('should display Spanish translations', () => {
        const spanishT = (key: string) => {
          const translations: Record<string, string> = {
            learnCategoryTitle: '¿Aprender Esta Categoría?',
            learnCategoryMessage:
              '¿Recordar "{item}" como {category} para futuras boletas?',
            learnCategoryConfirm: 'Sí, Recordar',
            learnCategorySkip: 'Ahora No',
            close: 'Cerrar',
          }
          return translations[key] || key
        }

        render(<CategoryLearningPrompt {...defaultProps} t={spanishT} />)

        expect(screen.getByText('¿Aprender Esta Categoría?')).toBeInTheDocument()
        expect(
          screen.getByRole('button', { name: 'Sí, Recordar' })
        ).toBeInTheDocument()
        expect(
          screen.getByRole('button', { name: 'Ahora No' })
        ).toBeInTheDocument()
      })
    })

    describe('Theme Support', () => {
      it('should apply light theme styling', () => {
        render(<CategoryLearningPrompt {...defaultProps} theme="light" />)

        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveClass('bg-white')
      })

      it('should apply dark theme styling', () => {
        render(<CategoryLearningPrompt {...defaultProps} theme="dark" />)

        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveClass('bg-slate-800')
      })
    })
  })

  describe('EditView Integration', () => {
    const defaultTransaction = {
      id: '123',
      merchant: 'Test Store',
      alias: 'Store',
      date: '2025-12-03',
      total: 100,
      category: 'Supermarket',
      items: [{ name: 'UBER EATS', price: 50, category: 'Food' }],
    }

    const defaultEditViewProps = {
      currentTransaction: defaultTransaction,
      editingItemIndex: null,
      distinctAliases: ['Store'],
      theme: 'light',
      currency: 'USD',
      t: mockT,
      storeCategories: ['Supermarket', 'Restaurant', 'Transport', 'Other'],
      formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
      parseStrictNumber: (val: any) => parseFloat(val) || 0,
      onBack: vi.fn(),
      onDelete: vi.fn(),
      onSave: vi.fn().mockResolvedValue(undefined),
      onUpdateTransaction: vi.fn(),
      onSetEditingItemIndex: vi.fn(),
      onSaveMapping: vi.fn().mockResolvedValue('mapping-123'),
      onShowToast: vi.fn(),
    }

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should not show learning prompt initially', () => {
      render(<EditView {...defaultEditViewProps} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should show learning prompt when category is changed and save is clicked', async () => {
      const onUpdateTransaction = vi.fn()
      const onSave = vi.fn().mockResolvedValue(undefined)

      const { rerender } = render(
        <EditView
          {...defaultEditViewProps}
          onUpdateTransaction={onUpdateTransaction}
          onSave={onSave}
        />
      )

      // Simulate category change by re-rendering with new category
      // (In real usage, onUpdateTransaction updates the transaction)
      const updatedTransaction = {
        ...defaultTransaction,
        category: 'Transport',
      }

      rerender(
        <EditView
          {...defaultEditViewProps}
          currentTransaction={updatedTransaction}
          onUpdateTransaction={onUpdateTransaction}
          onSave={onSave}
        />
      )

      // Click save button
      const saveButton = screen.getByRole('button', { name: 'Save' })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled()
      })

      // Learning prompt should appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('should not show learning prompt when category is unchanged', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)

      render(
        <EditView
          {...defaultEditViewProps}
          onSave={onSave}
        />
      )

      // Click save without changing category
      const saveButton = screen.getByRole('button', { name: 'Save' })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled()
      })

      // No learning prompt should appear
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should not show learning prompt when transaction has no items', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      const transactionWithNoItems = {
        ...defaultTransaction,
        items: [],
        category: 'Transport', // Category changed
      }

      render(
        <EditView
          {...defaultEditViewProps}
          currentTransaction={transactionWithNoItems}
          onSave={onSave}
        />
      )

      // Click save
      const saveButton = screen.getByRole('button', { name: 'Save' })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled()
      })

      // No learning prompt should appear (no items to learn from)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should call onSaveMapping when confirm is clicked', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      const onSaveMapping = vi.fn().mockResolvedValue('mapping-123')

      // First render with original category
      const { rerender } = render(
        <EditView
          {...defaultEditViewProps}
          currentTransaction={defaultTransaction}
          onSave={onSave}
          onSaveMapping={onSaveMapping}
        />
      )

      // Simulate category change via rerender
      const updatedTransaction = {
        ...defaultTransaction,
        category: 'Transport',
      }

      rerender(
        <EditView
          {...defaultEditViewProps}
          currentTransaction={updatedTransaction}
          onSave={onSave}
          onSaveMapping={onSaveMapping}
        />
      )

      // Click save
      const saveButton = screen.getByRole('button', { name: 'Save' })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Click confirm
      const confirmButton = screen.getByRole('button', { name: 'Yes, Remember' })
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(onSaveMapping).toHaveBeenCalledWith('UBER EATS', 'Transport', 'user')
      })
    })

    it('should show success toast after saving mapping', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      const onSaveMapping = vi.fn().mockResolvedValue('mapping-123')
      const onShowToast = vi.fn()

      // First render with original category
      const { rerender } = render(
        <EditView
          {...defaultEditViewProps}
          currentTransaction={defaultTransaction}
          onSave={onSave}
          onSaveMapping={onSaveMapping}
          onShowToast={onShowToast}
        />
      )

      // Simulate category change via rerender
      const updatedTransaction = {
        ...defaultTransaction,
        category: 'Transport',
      }

      rerender(
        <EditView
          {...defaultEditViewProps}
          currentTransaction={updatedTransaction}
          onSave={onSave}
          onSaveMapping={onSaveMapping}
          onShowToast={onShowToast}
        />
      )

      // Click save
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Click confirm
      fireEvent.click(screen.getByRole('button', { name: 'Yes, Remember' }))

      await waitFor(() => {
        expect(onShowToast).toHaveBeenCalledWith("Got it! I'll remember this.")
      })
    })

    it('should close prompt when dismiss is clicked without saving', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      const onSaveMapping = vi.fn()

      // First render with original category
      const { rerender } = render(
        <EditView
          {...defaultEditViewProps}
          currentTransaction={defaultTransaction}
          onSave={onSave}
          onSaveMapping={onSaveMapping}
        />
      )

      // Simulate category change via rerender
      const updatedTransaction = {
        ...defaultTransaction,
        category: 'Transport',
      }

      rerender(
        <EditView
          {...defaultEditViewProps}
          currentTransaction={updatedTransaction}
          onSave={onSave}
          onSaveMapping={onSaveMapping}
        />
      )

      // Click save
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Click dismiss
      fireEvent.click(screen.getByRole('button', { name: 'Not Now' }))

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // Should not call saveMapping
      expect(onSaveMapping).not.toHaveBeenCalled()
    })

    it('should not show prompt when onSaveMapping is not provided', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)

      const updatedTransaction = {
        ...defaultTransaction,
        category: 'Transport',
      }

      render(
        <EditView
          {...defaultEditViewProps}
          currentTransaction={updatedTransaction}
          onSave={onSave}
          onSaveMapping={undefined} // Not provided
        />
      )

      // Click save
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled()
      })

      // No learning prompt should appear
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    // Expanded trigger tests - Story 6.3 scope expansion
    describe('Expanded Triggers (merchant, item name)', () => {
      it('should show learning prompt when merchant is changed', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined)

        const { rerender } = render(
          <EditView
            {...defaultEditViewProps}
            currentTransaction={defaultTransaction}
            onSave={onSave}
          />
        )

        // Simulate merchant change via rerender
        const updatedTransaction = {
          ...defaultTransaction,
          merchant: 'New Store Name', // Only merchant changed
        }

        rerender(
          <EditView
            {...defaultEditViewProps}
            currentTransaction={updatedTransaction}
            onSave={onSave}
          />
        )

        // Click save
        fireEvent.click(screen.getByRole('button', { name: 'Save' }))

        await waitFor(() => {
          expect(onSave).toHaveBeenCalled()
        })

        // Learning prompt should appear
        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument()
        })
      })

      it('should show learning prompt when item name is changed', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined)

        const { rerender } = render(
          <EditView
            {...defaultEditViewProps}
            currentTransaction={defaultTransaction}
            onSave={onSave}
          />
        )

        // Simulate item name change via rerender
        const updatedTransaction = {
          ...defaultTransaction,
          items: [{ name: 'CORRECTED ITEM NAME', price: 50, category: 'Food' }], // Only item name changed
        }

        rerender(
          <EditView
            {...defaultEditViewProps}
            currentTransaction={updatedTransaction}
            onSave={onSave}
          />
        )

        // Click save
        fireEvent.click(screen.getByRole('button', { name: 'Save' }))

        await waitFor(() => {
          expect(onSave).toHaveBeenCalled()
        })

        // Learning prompt should appear
        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument()
        })
      })
    })

    describe('Non-Triggers (item prices, add/remove items, alias, date, total do NOT trigger prompt)', () => {
      it('should NOT show learning prompt when only item price is changed', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined)

        const { rerender } = render(
          <EditView
            {...defaultEditViewProps}
            currentTransaction={defaultTransaction}
            onSave={onSave}
          />
        )

        // Simulate item price change via rerender
        const updatedTransaction = {
          ...defaultTransaction,
          items: [{ name: 'UBER EATS', price: 75, category: 'Food' }], // Only price changed
        }

        rerender(
          <EditView
            {...defaultEditViewProps}
            currentTransaction={updatedTransaction}
            onSave={onSave}
          />
        )

        // Click save
        fireEvent.click(screen.getByRole('button', { name: 'Save' }))

        await waitFor(() => {
          expect(onSave).toHaveBeenCalled()
        })

        // No learning prompt should appear (price change does not trigger)
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      it('should NOT show learning prompt when item is added', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined)

        const { rerender } = render(
          <EditView
            {...defaultEditViewProps}
            currentTransaction={defaultTransaction}
            onSave={onSave}
          />
        )

        // Simulate adding an item via rerender
        const updatedTransaction = {
          ...defaultTransaction,
          items: [
            { name: 'UBER EATS', price: 50, category: 'Food' },
            { name: 'NEW ITEM', price: 25, category: 'Other' }, // New item added
          ],
        }

        rerender(
          <EditView
            {...defaultEditViewProps}
            currentTransaction={updatedTransaction}
            onSave={onSave}
          />
        )

        // Click save
        fireEvent.click(screen.getByRole('button', { name: 'Save' }))

        await waitFor(() => {
          expect(onSave).toHaveBeenCalled()
        })

        // No learning prompt should appear (adding items does not trigger)
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      it('should NOT show learning prompt when item is removed', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined)
        const transactionWithTwoItems = {
          ...defaultTransaction,
          items: [
            { name: 'UBER EATS', price: 50, category: 'Food' },
            { name: 'SECOND ITEM', price: 25, category: 'Other' },
          ],
        }

        const { rerender } = render(
          <EditView
            {...defaultEditViewProps}
            currentTransaction={transactionWithTwoItems}
            onSave={onSave}
          />
        )

        // Simulate removing an item via rerender
        const updatedTransaction = {
          ...transactionWithTwoItems,
          items: [{ name: 'UBER EATS', price: 50, category: 'Food' }], // One item removed
        }

        rerender(
          <EditView
            {...defaultEditViewProps}
            currentTransaction={updatedTransaction}
            onSave={onSave}
          />
        )

        // Click save
        fireEvent.click(screen.getByRole('button', { name: 'Save' }))

        await waitFor(() => {
          expect(onSave).toHaveBeenCalled()
        })

        // No learning prompt should appear (removing items does not trigger)
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })


      it('should NOT show learning prompt when only alias is changed', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined)

        const { rerender } = render(
          <EditView
            {...defaultEditViewProps}
            currentTransaction={defaultTransaction}
            onSave={onSave}
          />
        )

        // Simulate alias change via rerender
        const updatedTransaction = {
          ...defaultTransaction,
          alias: 'New Alias Name', // Only alias changed
        }

        rerender(
          <EditView
            {...defaultEditViewProps}
            currentTransaction={updatedTransaction}
            onSave={onSave}
          />
        )

        // Click save
        fireEvent.click(screen.getByRole('button', { name: 'Save' }))

        await waitFor(() => {
          expect(onSave).toHaveBeenCalled()
        })

        // No learning prompt should appear (alias change does not trigger)
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      it('should NOT show learning prompt when only date is changed', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined)

        const { rerender } = render(
          <EditView
            {...defaultEditViewProps}
            currentTransaction={defaultTransaction}
            onSave={onSave}
          />
        )

        // Simulate date change via rerender
        const updatedTransaction = {
          ...defaultTransaction,
          date: '2025-12-25', // Only date changed
        }

        rerender(
          <EditView
            {...defaultEditViewProps}
            currentTransaction={updatedTransaction}
            onSave={onSave}
          />
        )

        // Click save
        fireEvent.click(screen.getByRole('button', { name: 'Save' }))

        await waitFor(() => {
          expect(onSave).toHaveBeenCalled()
        })

        // No learning prompt should appear (date change does not trigger)
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      it('should NOT show learning prompt when only total is changed', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined)

        const { rerender } = render(
          <EditView
            {...defaultEditViewProps}
            currentTransaction={defaultTransaction}
            onSave={onSave}
          />
        )

        // Simulate total change via rerender
        const updatedTransaction = {
          ...defaultTransaction,
          total: 999, // Only total changed
        }

        rerender(
          <EditView
            {...defaultEditViewProps}
            currentTransaction={updatedTransaction}
            onSave={onSave}
          />
        )

        // Click save
        fireEvent.click(screen.getByRole('button', { name: 'Save' }))

        await waitFor(() => {
          expect(onSave).toHaveBeenCalled()
        })

        // No learning prompt should appear (total change does not trigger)
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      it('should NOT show learning prompt when alias AND date are changed together', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined)

        const { rerender } = render(
          <EditView
            {...defaultEditViewProps}
            currentTransaction={defaultTransaction}
            onSave={onSave}
          />
        )

        // Simulate alias and date change via rerender
        const updatedTransaction = {
          ...defaultTransaction,
          alias: 'New Alias',
          date: '2025-12-25',
        }

        rerender(
          <EditView
            {...defaultEditViewProps}
            currentTransaction={updatedTransaction}
            onSave={onSave}
          />
        )

        // Click save
        fireEvent.click(screen.getByRole('button', { name: 'Save' }))

        await waitFor(() => {
          expect(onSave).toHaveBeenCalled()
        })

        // No learning prompt should appear
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })
})
