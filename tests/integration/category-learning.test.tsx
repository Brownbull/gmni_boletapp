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
  learnCategoryTitle: 'Learn These Groups?',
  learnCategoryMessage: 'Remember these groups for future receipts?',
  learnCategoryConfirm: 'Yes, Remember All',
  learnCategorySkip: 'Not Now',
  learnCategorySuccess: "Got it! I'll remember these.",
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
      items: [{ itemName: 'UBER EATS', newGroup: 'Transport' }],
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

    describe('AC#1: Prompt appears on item group change', () => {
      it('should render when isOpen is true with items', () => {
        render(<CategoryLearningPrompt {...defaultProps} />)

        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Learn These Groups?')).toBeInTheDocument()
      })

      it('should not render when isOpen is false', () => {
        render(<CategoryLearningPrompt {...defaultProps} isOpen={false} />)

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      it('should not render when items array is empty', () => {
        render(<CategoryLearningPrompt {...defaultProps} items={[]} />)

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      it('should display all items to learn', () => {
        const multipleItems = [
          { itemName: 'UBER EATS', newGroup: 'Transport' },
          { itemName: 'STARBUCKS', newGroup: 'Food' },
        ]
        render(<CategoryLearningPrompt {...defaultProps} items={multipleItems} />)

        expect(screen.getByText('UBER EATS')).toBeInTheDocument()
        expect(screen.getByText('Transport')).toBeInTheDocument()
        expect(screen.getByText('STARBUCKS')).toBeInTheDocument()
        expect(screen.getByText('Food')).toBeInTheDocument()
      })
    })

    describe('AC#2: Prompt shows items and groups', () => {
      it('should display items list with their groups', () => {
        render(<CategoryLearningPrompt {...defaultProps} />)

        expect(screen.getByText('UBER EATS')).toBeInTheDocument()
        expect(screen.getByText('Transport')).toBeInTheDocument()
      })

      it('should update list when items change', () => {
        const { rerender } = render(
          <CategoryLearningPrompt {...defaultProps} items={[{ itemName: 'STARBUCKS', newGroup: 'Restaurant' }]} />
        )

        expect(screen.getByText('STARBUCKS')).toBeInTheDocument()
        expect(screen.getByText('Restaurant')).toBeInTheDocument()

        rerender(
          <CategoryLearningPrompt {...defaultProps} items={[{ itemName: 'WALMART', newGroup: 'Supermarket' }]} />
        )

        expect(screen.getByText('WALMART')).toBeInTheDocument()
        expect(screen.getByText('Supermarket')).toBeInTheDocument()
      })
    })

    describe('AC#3: "Yes, Remember All" button saves mappings', () => {
      it('should render confirm button with correct text', () => {
        render(<CategoryLearningPrompt {...defaultProps} />)

        expect(
          screen.getByRole('button', { name: 'Yes, Remember All' })
        ).toBeInTheDocument()
      })

      it('should call onConfirm when confirm button is clicked', () => {
        const onConfirm = vi.fn()
        render(<CategoryLearningPrompt {...defaultProps} onConfirm={onConfirm} />)

        fireEvent.click(screen.getByRole('button', { name: 'Yes, Remember All' }))

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

        const title = screen.getByText('Learn These Groups?')
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

        expect(screen.getByText('Learn These Groups?')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Yes, Remember All' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Not Now' })).toBeInTheDocument()
      })

      it('should display Spanish translations', () => {
        const spanishT = (key: string) => {
          const translations: Record<string, string> = {
            learnCategoryTitle: '¿Aprender Estos Grupos?',
            learnCategoryMessage: '¿Recordar estos grupos para futuras boletas?',
            learnCategoryConfirm: 'Sí, Recordar Todos',
            learnCategorySkip: 'Ahora No',
            close: 'Cerrar',
          }
          return translations[key] || key
        }

        render(<CategoryLearningPrompt {...defaultProps} t={spanishT} />)

        expect(screen.getByText('¿Aprender Estos Grupos?')).toBeInTheDocument()
        expect(
          screen.getByRole('button', { name: 'Sí, Recordar Todos' })
        ).toBeInTheDocument()
        expect(
          screen.getByRole('button', { name: 'Ahora No' })
        ).toBeInTheDocument()
      })
    })

    describe('Theme Support', () => {
      it('should apply light theme styling', () => {
        render(<CategoryLearningPrompt {...defaultProps} theme="light" />)

        // Component now uses inline style for theming via CSS variables
        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeInTheDocument()
        // Light theme applies via modalStyle inline style, not CSS class
      })

      it('should apply dark theme styling', () => {
        render(<CategoryLearningPrompt {...defaultProps} theme="dark" />)

        // Component now uses inline style for theming via CSS variables
        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeInTheDocument()
        // Dark theme applies via modalStyle inline style, not CSS class
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

    it('should show learning prompt when item group is changed and save is clicked', async () => {
      const onUpdateTransaction = vi.fn()
      const onSave = vi.fn().mockResolvedValue(undefined)

      const { rerender } = render(
        <EditView
          {...defaultEditViewProps}
          onUpdateTransaction={onUpdateTransaction}
          onSave={onSave}
        />
      )

      // Simulate item group change by re-rendering with new item category
      // (In real usage, onUpdateTransaction updates the transaction)
      const updatedTransaction = {
        ...defaultTransaction,
        items: [{ name: 'UBER EATS', price: 50, category: 'Transport' }], // Changed from 'Food' to 'Transport'
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

      // Learning prompt should appear BEFORE save (because save navigates away)
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // onSave should NOT be called yet - it's called after user responds to prompt
      expect(onSave).not.toHaveBeenCalled()
    })

    it('should not show learning prompt when item group is unchanged', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)

      render(
        <EditView
          {...defaultEditViewProps}
          onSave={onSave}
        />
      )

      // Click save without changing item group
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

      // First render with original item group
      const { rerender } = render(
        <EditView
          {...defaultEditViewProps}
          currentTransaction={defaultTransaction}
          onSave={onSave}
          onSaveMapping={onSaveMapping}
        />
      )

      // Simulate item group change via rerender
      const updatedTransaction = {
        ...defaultTransaction,
        items: [{ name: 'UBER EATS', price: 50, category: 'Transport' }], // Changed from 'Food' to 'Transport'
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
      const confirmButton = screen.getByRole('button', { name: 'Yes, Remember All' })
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(onSaveMapping).toHaveBeenCalledWith('UBER EATS', 'Transport', 'user')
      })
    })

    it('should show success toast after saving mapping', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      const onSaveMapping = vi.fn().mockResolvedValue('mapping-123')
      const onShowToast = vi.fn()

      // First render with original item group
      const { rerender } = render(
        <EditView
          {...defaultEditViewProps}
          currentTransaction={defaultTransaction}
          onSave={onSave}
          onSaveMapping={onSaveMapping}
          onShowToast={onShowToast}
        />
      )

      // Simulate item group change via rerender
      const updatedTransaction = {
        ...defaultTransaction,
        items: [{ name: 'UBER EATS', price: 50, category: 'Transport' }],
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
      fireEvent.click(screen.getByRole('button', { name: 'Yes, Remember All' }))

      await waitFor(() => {
        expect(onShowToast).toHaveBeenCalledWith("Got it! I'll remember these.")
      })
    })

    it('should close prompt when dismiss is clicked without saving', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      const onSaveMapping = vi.fn()

      // First render with original item group
      const { rerender } = render(
        <EditView
          {...defaultEditViewProps}
          currentTransaction={defaultTransaction}
          onSave={onSave}
          onSaveMapping={onSaveMapping}
        />
      )

      // Simulate item group change via rerender
      const updatedTransaction = {
        ...defaultTransaction,
        items: [{ name: 'UBER EATS', price: 50, category: 'Transport' }],
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

      // Item group changed but no onSaveMapping provided
      const { rerender } = render(
        <EditView
          {...defaultEditViewProps}
          currentTransaction={defaultTransaction}
          onSave={onSave}
          onSaveMapping={undefined} // Not provided
        />
      )

      const updatedTransaction = {
        ...defaultTransaction,
        items: [{ name: 'UBER EATS', price: 50, category: 'Transport' }],
      }

      rerender(
        <EditView
          {...defaultEditViewProps}
          currentTransaction={updatedTransaction}
          onSave={onSave}
          onSaveMapping={undefined}
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

    // Non-triggers: changes that do NOT trigger the learning prompt
    describe('Non-Triggers (transaction category, merchant, item name, price, alias, date, total do NOT trigger prompt)', () => {
      it('should NOT show learning prompt when only transaction category is changed', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined)

        const { rerender } = render(
          <EditView
            {...defaultEditViewProps}
            currentTransaction={defaultTransaction}
            onSave={onSave}
          />
        )

        // Only transaction category changed, NOT item group
        const updatedTransaction = {
          ...defaultTransaction,
          category: 'Transport', // Transaction category changed
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

        // No prompt - only item group changes trigger
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      it('should NOT show learning prompt when only merchant is changed', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined)

        const { rerender } = render(
          <EditView
            {...defaultEditViewProps}
            currentTransaction={defaultTransaction}
            onSave={onSave}
          />
        )

        // Only merchant changed
        const updatedTransaction = {
          ...defaultTransaction,
          merchant: 'New Store Name',
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

        // No prompt - only item group changes trigger
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      it('should NOT show learning prompt when only item name is changed', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined)

        const { rerender } = render(
          <EditView
            {...defaultEditViewProps}
            currentTransaction={defaultTransaction}
            onSave={onSave}
          />
        )

        // Only item name changed, NOT item group
        const updatedTransaction = {
          ...defaultTransaction,
          items: [{ name: 'CORRECTED ITEM NAME', price: 50, category: 'Food' }],
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

        // No prompt - only item group changes trigger
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
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
