/**
 * MappingsList<T> Generic Component Unit Tests
 *
 * Tests the shared generic component that powers all 4 mapping list types.
 * Uses merchantMappingsConfig as the default test config (text edit, flat list).
 *
 * Story 15-3b: Generic MappingsList replacing 4 near-identical components.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MappingsList } from '../../../../src/components/shared/MappingsList'
import { merchantMappingsConfig, itemNameMappingsConfig } from '../../../../src/components/shared/mappingsListConfigs'
import type { MerchantMapping } from '../../../../src/types/merchantMapping'
import type { ItemNameMapping } from '../../../../src/types/itemNameMapping'
import { Timestamp } from 'firebase/firestore'

// ============================================================================
// Test Helpers
// ============================================================================

const mockT = (key: string) => {
  const translations: Record<string, string> = {
    learnedMerchants: 'Learned Merchants',
    learnedMerchantsEmpty: 'No learned merchants yet',
    deleteMerchantMappingConfirm: 'Remove this learned merchant?',
    editMerchantTarget: 'Edit display name',
    editMerchantMapping: 'Edit',
    deleteMapping: 'Delete',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    close: 'Close',
    displayName: 'Display name',
    learnedItemNames: 'Learned Item Names',
    learnedItemNamesEmpty: 'No learned item names yet',
    deleteItemNameMappingConfirm: 'Delete item name mapping?',
    editItemNameTarget: 'Edit item name',
    editItemNameMapping: 'Edit item name',
    itemName: 'Item name',
  }
  return translations[key] || key
}

const createMerchantMapping = (overrides: Partial<MerchantMapping> = {}): MerchantMapping => ({
  id: 'mapping-1',
  originalMerchant: 'STORE ABC',
  normalizedMerchant: 'store abc',
  targetMerchant: 'Store ABC',
  confidence: 1.0,
  source: 'user',
  usageCount: 3,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  ...overrides,
})

const createItemNameMapping = (overrides: Partial<ItemNameMapping> = {}): ItemNameMapping => ({
  id: 'item-1',
  normalizedMerchant: 'jumbo',
  originalItemName: 'LECHE 1L',
  normalizedItemName: 'leche 1l',
  targetItemName: 'Leche Entera 1L',
  confidence: 1.0,
  source: 'user',
  usageCount: 5,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  ...overrides,
})

const defaultProps = {
  mappings: [createMerchantMapping()],
  loading: false,
  onDeleteMapping: vi.fn().mockResolvedValue(undefined),
  onEditMapping: vi.fn().mockResolvedValue(undefined),
  t: mockT,
  theme: 'light' as const,
  config: merchantMappingsConfig,
}

// ============================================================================
// Tests
// ============================================================================

describe('MappingsList<T>', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  // --------------------------------------------------------------------------
  // Loading State
  // --------------------------------------------------------------------------

  describe('Loading State', () => {
    it('shows loading skeleton when loading', () => {
      const { container } = render(<MappingsList {...defaultProps} loading={true} />)
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('does not show mappings while loading', () => {
      render(<MappingsList {...defaultProps} loading={true} />)
      expect(screen.queryByText('"Store ABC"')).not.toBeInTheDocument()
    })
  })

  // --------------------------------------------------------------------------
  // Empty State
  // --------------------------------------------------------------------------

  describe('Empty State', () => {
    it('shows empty state message when no mappings', () => {
      render(<MappingsList {...defaultProps} mappings={[]} />)
      expect(screen.getByText('No learned merchants yet')).toBeInTheDocument()
    })

    it('renders empty icon', () => {
      render(<MappingsList {...defaultProps} mappings={[]} />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  // --------------------------------------------------------------------------
  // Flat List Rendering
  // --------------------------------------------------------------------------

  describe('Flat List Rendering', () => {
    it('renders items with display name in quotes', () => {
      render(<MappingsList {...defaultProps} />)
      expect(screen.getByText('"Store ABC"')).toBeInTheDocument()
    })

    it('renders tag label', () => {
      render(<MappingsList {...defaultProps} />)
      expect(screen.getByText('STORE ABC')).toBeInTheDocument()
    })

    it('renders usage count', () => {
      render(<MappingsList {...defaultProps} />)
      expect(screen.getByText('3x')).toBeInTheDocument()
    })

    it('renders list with proper role', () => {
      render(<MappingsList {...defaultProps} />)
      expect(screen.getByRole('list')).toBeInTheDocument()
    })

    it('renders list items with listitem role', () => {
      const mappings = [
        createMerchantMapping({ id: '1', targetMerchant: 'A' }),
        createMerchantMapping({ id: '2', targetMerchant: 'B' }),
      ]
      render(<MappingsList {...defaultProps} mappings={mappings} />)
      expect(screen.getAllByRole('listitem')).toHaveLength(2)
    })

    it('truncates tag labels longer than 15 characters', () => {
      const mappings = [createMerchantMapping({
        originalMerchant: 'VERY LONG MERCHANT NAME HERE',
      })]
      render(<MappingsList {...defaultProps} mappings={mappings} />)
      expect(screen.getByText('VERY LONG ME...')).toBeInTheDocument()
    })
  })

  // --------------------------------------------------------------------------
  // Delete Flow
  // --------------------------------------------------------------------------

  describe('Delete Flow', () => {
    it('opens confirmation dialog on delete click', async () => {
      render(<MappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Delete "Store ABC"'))
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument()
    })

    it('shows delete message in dialog', async () => {
      render(<MappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Delete "Store ABC"'))
      expect(screen.getByText(/"STORE ABC → Store ABC"/)).toBeInTheDocument()
    })

    it('calls onDeleteMapping on confirm', async () => {
      const onDeleteMapping = vi.fn().mockResolvedValue(undefined)
      render(<MappingsList {...defaultProps} onDeleteMapping={onDeleteMapping} />)

      await userEvent.click(screen.getByLabelText('Delete "Store ABC"'))
      await userEvent.click(screen.getByText('Confirm'))

      expect(onDeleteMapping).toHaveBeenCalledWith('mapping-1')
    })

    it('closes dialog on cancel', async () => {
      render(<MappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Delete "Store ABC"'))
      await userEvent.click(screen.getByText('Cancel'))
      expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument()
    })

    it('does not call onDeleteMapping when item has no id', async () => {
      const onDeleteMapping = vi.fn().mockResolvedValue(undefined)
      const mappings = [createMerchantMapping({ id: undefined as unknown as string })]
      render(<MappingsList {...defaultProps} mappings={mappings} onDeleteMapping={onDeleteMapping} />)

      await userEvent.click(screen.getByLabelText('Delete "Store ABC"'))
      await userEvent.click(screen.getByText('Confirm'))

      expect(onDeleteMapping).not.toHaveBeenCalled()
    })
  })

  // --------------------------------------------------------------------------
  // Edit Flow (Text Input)
  // --------------------------------------------------------------------------

  describe('Edit Flow (Text Input)', () => {
    it('opens edit modal on edit click', async () => {
      render(<MappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Edit "Store ABC"'))
      expect(screen.getByTestId('edit-mapping-modal')).toBeInTheDocument()
    })

    it('pre-fills input with current value', async () => {
      render(<MappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Edit "Store ABC"'))

      const dialog = screen.getByRole('dialog')
      const input = dialog.querySelector('input')
      expect(input).toHaveValue('Store ABC')
    })

    it('has maxLength on text input', async () => {
      render(<MappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Edit "Store ABC"'))

      const dialog = screen.getByRole('dialog')
      const input = dialog.querySelector('input')
      expect(input).toHaveAttribute('maxLength', '200')
    })

    it('calls onEditMapping with new value on save', async () => {
      const onEditMapping = vi.fn().mockResolvedValue(undefined)
      render(<MappingsList {...defaultProps} onEditMapping={onEditMapping} />)

      await userEvent.click(screen.getByLabelText('Edit "Store ABC"'))
      const dialog = screen.getByRole('dialog')
      const input = dialog.querySelector('input') as HTMLInputElement
      await userEvent.clear(input)
      await userEvent.type(input, 'New Name')
      await userEvent.click(screen.getByText('Save'))

      expect(onEditMapping).toHaveBeenCalledWith('mapping-1', 'New Name')
    })

    it('does not save when value is unchanged', async () => {
      const onEditMapping = vi.fn().mockResolvedValue(undefined)
      render(<MappingsList {...defaultProps} onEditMapping={onEditMapping} />)

      await userEvent.click(screen.getByLabelText('Edit "Store ABC"'))
      await userEvent.click(screen.getByText('Save'))

      expect(onEditMapping).not.toHaveBeenCalled()
    })

    it('closes on cancel without saving', async () => {
      const onEditMapping = vi.fn()
      render(<MappingsList {...defaultProps} onEditMapping={onEditMapping} />)

      await userEvent.click(screen.getByLabelText('Edit "Store ABC"'))
      await userEvent.click(screen.getByText('Cancel'))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(onEditMapping).not.toHaveBeenCalled()
    })

    it('closes on Escape key', async () => {
      render(<MappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Edit "Store ABC"'))
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await userEvent.keyboard('{Escape}')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('saves on Enter key', async () => {
      const onEditMapping = vi.fn().mockResolvedValue(undefined)
      render(<MappingsList {...defaultProps} onEditMapping={onEditMapping} />)

      await userEvent.click(screen.getByLabelText('Edit "Store ABC"'))
      const dialog = screen.getByRole('dialog')
      const input = dialog.querySelector('input') as HTMLInputElement
      await userEvent.clear(input)
      await userEvent.type(input, 'Enter Test{Enter}')

      expect(onEditMapping).toHaveBeenCalledWith('mapping-1', 'Enter Test')
    })

    it('disables save when input is empty', async () => {
      render(<MappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Edit "Store ABC"'))

      const dialog = screen.getByRole('dialog')
      const input = dialog.querySelector('input') as HTMLInputElement
      await userEvent.clear(input)

      expect(screen.getByText('Save')).toBeDisabled()
    })

    it('shows edit context when config provides getEditContext', async () => {
      render(<MappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Edit "Store ABC"'))
      // merchantMappingsConfig has getEditContext returning originalMerchant
      const dialog = screen.getByRole('dialog')
      // The context text appears inside the dialog as a paragraph
      expect(dialog.textContent).toContain('STORE ABC')
    })

    it('closes on backdrop click', async () => {
      render(<MappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Edit "Store ABC"'))
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      // Click the backdrop (the presentation div wrapping the dialog)
      const backdrop = screen.getByRole('presentation')
      await userEvent.click(backdrop)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  // --------------------------------------------------------------------------
  // Modal Behavior
  // --------------------------------------------------------------------------

  describe('Modal Behavior', () => {
    it('locks body scroll when edit modal opens', async () => {
      render(<MappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Edit "Store ABC"'))
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('restores body scroll when edit modal closes', async () => {
      render(<MappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Edit "Store ABC"'))
      await userEvent.click(screen.getByText('Cancel'))

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('')
      })
    })

    it('disables delete button while deleting', async () => {
      const slow = vi.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 100)))
      render(<MappingsList {...defaultProps} onDeleteMapping={slow} />)

      await userEvent.click(screen.getByLabelText('Delete "Store ABC"'))
      await userEvent.click(screen.getByText('Confirm'))

      // Delete button should be disabled while delete is in progress
      expect(screen.getByLabelText('Delete "Store ABC"')).toBeDisabled()
    })
  })

  // --------------------------------------------------------------------------
  // Grouped Rendering
  // --------------------------------------------------------------------------

  describe('Grouped Rendering', () => {
    const groupedMappings: ItemNameMapping[] = [
      createItemNameMapping({ id: 'i1', normalizedMerchant: 'jumbo', originalItemName: 'ITEM A', targetItemName: 'Item A' }),
      createItemNameMapping({ id: 'i2', normalizedMerchant: 'jumbo', originalItemName: 'ITEM B', targetItemName: 'Item B' }),
      createItemNameMapping({ id: 'i3', normalizedMerchant: 'lider', originalItemName: 'ITEM C', targetItemName: 'Item C' }),
    ]

    const groupedProps = {
      mappings: groupedMappings,
      loading: false,
      onDeleteMapping: vi.fn().mockResolvedValue(undefined),
      onEditMapping: vi.fn().mockResolvedValue(undefined),
      t: mockT,
      theme: 'light' as const,
      config: itemNameMappingsConfig,
    }

    it('renders group headers with formatted labels', () => {
      render(<MappingsList {...groupedProps} />)
      expect(screen.getByText('Jumbo')).toBeInTheDocument()
      expect(screen.getByText('Lider')).toBeInTheDocument()
    })

    it('shows item count per group', () => {
      render(<MappingsList {...groupedProps} />)
      expect(screen.getByText('(2)')).toBeInTheDocument()
      expect(screen.getByText('(1)')).toBeInTheDocument()
    })

    it('renders items within their groups', () => {
      render(<MappingsList {...groupedProps} />)
      expect(screen.getByText('"Item A"')).toBeInTheDocument()
      expect(screen.getByText('"Item B"')).toBeInTheDocument()
      expect(screen.getByText('"Item C"')).toBeInTheDocument()
    })

    it('renders group items with list role', () => {
      render(<MappingsList {...groupedProps} />)
      const lists = screen.getAllByRole('list')
      expect(lists.length).toBeGreaterThanOrEqual(2)
    })

    it('sorts groups alphabetically', () => {
      const { container } = render(<MappingsList {...groupedProps} />)
      const headers = container.querySelectorAll('.uppercase')
      expect(headers[0]).toHaveTextContent('Jumbo')
      expect(headers[1]).toHaveTextContent('Lider')
    })
  })

  // --------------------------------------------------------------------------
  // Theme Support
  // --------------------------------------------------------------------------

  describe('Theme Support', () => {
    it('renders in light theme', () => {
      render(<MappingsList {...defaultProps} theme="light" />)
      expect(screen.getByRole('list')).toBeInTheDocument()
    })

    it('renders in dark theme', () => {
      render(<MappingsList {...defaultProps} theme="dark" />)
      expect(screen.getByRole('list')).toBeInTheDocument()
    })

    it('uses dark tag background when configured', () => {
      // merchantMappingsConfig has darkBg for tag style
      const mappings = [createMerchantMapping()]
      render(<MappingsList {...defaultProps} mappings={mappings} theme="dark" />)

      const tag = screen.getByText('STORE ABC')
      expect(tag).toHaveStyle({ backgroundColor: 'rgba(254, 243, 199, 0.2)' })
    })
  })
})
