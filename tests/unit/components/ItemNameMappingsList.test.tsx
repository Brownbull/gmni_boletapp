/**
 * ItemNameMappingsList Component Unit Tests
 *
 * Tests the thin wrapper that delegates to MappingsList<ItemNameMapping>.
 * Focuses on wrapper-specific behavior: grouped rendering by merchant.
 *
 * Story 15-3b: Config-driven generic replaces 551-line component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { ItemNameMappingsList } from '../../../src/components/ItemNameMappingsList'
import type { ItemNameMapping } from '../../../src/types/itemNameMapping'
import { Timestamp } from 'firebase/firestore'

// ============================================================================
// Test Helpers
// ============================================================================

const mockT = (key: string) => {
  const translations: Record<string, string> = {
    learnedItemNames: 'Learned Item Names',
    learnedItemNamesEmpty: 'No learned item names yet',
    deleteItemNameMappingConfirm: 'Delete item name mapping?',
    editItemNameTarget: 'Edit item name',
    editItemNameMapping: 'Edit',
    deleteMapping: 'Delete',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    close: 'Close',
    itemName: 'Item name',
  }
  return translations[key] || key
}

const createMapping = (overrides: Partial<ItemNameMapping> = {}): ItemNameMapping => ({
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
  mappings: [createMapping()],
  loading: false,
  onDeleteMapping: vi.fn().mockResolvedValue(undefined),
  onEditMapping: vi.fn().mockResolvedValue(undefined),
  t: mockT,
  theme: 'light' as const,
}

// ============================================================================
// Tests
// ============================================================================

describe('ItemNameMappingsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  describe('Rendering', () => {
    it('renders item name mapping with target name in quotes', () => {
      render(<ItemNameMappingsList {...defaultProps} />)
      expect(screen.getByText('"Leche Entera 1L"')).toBeInTheDocument()
    })

    it('renders original item name as tag', () => {
      render(<ItemNameMappingsList {...defaultProps} />)
      expect(screen.getByText('LECHE 1L')).toBeInTheDocument()
    })

    it('renders usage count', () => {
      render(<ItemNameMappingsList {...defaultProps} />)
      expect(screen.getByText('5x')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('shows empty message', () => {
      render(<ItemNameMappingsList {...defaultProps} mappings={[]} />)
      expect(screen.getByText('No learned item names yet')).toBeInTheDocument()
    })
  })

  describe('Grouped by Merchant', () => {
    it('groups items by normalized merchant', () => {
      const mappings = [
        createMapping({ id: '1', normalizedMerchant: 'jumbo', targetItemName: 'Item A' }),
        createMapping({ id: '2', normalizedMerchant: 'jumbo', targetItemName: 'Item B' }),
        createMapping({ id: '3', normalizedMerchant: 'lider', targetItemName: 'Item C' }),
      ]
      render(<ItemNameMappingsList {...defaultProps} mappings={mappings} />)

      expect(screen.getByText('Jumbo')).toBeInTheDocument()
      expect(screen.getByText('Lider')).toBeInTheDocument()
    })

    it('shows item count per group', () => {
      const mappings = [
        createMapping({ id: '1', normalizedMerchant: 'jumbo', targetItemName: 'Item A' }),
        createMapping({ id: '2', normalizedMerchant: 'jumbo', targetItemName: 'Item B' }),
        createMapping({ id: '3', normalizedMerchant: 'lider', targetItemName: 'Item C' }),
      ]
      render(<ItemNameMappingsList {...defaultProps} mappings={mappings} />)

      expect(screen.getByText('(2)')).toBeInTheDocument()
      expect(screen.getByText('(1)')).toBeInTheDocument()
    })

    it('formats group labels with title case', () => {
      const mappings = [
        createMapping({ id: '1', normalizedMerchant: 'santa isabel', targetItemName: 'Item A' }),
      ]
      render(<ItemNameMappingsList {...defaultProps} mappings={mappings} />)
      expect(screen.getByText('Santa Isabel')).toBeInTheDocument()
    })
  })

  describe('Edit Flow', () => {
    it('opens edit modal with text input', async () => {
      render(<ItemNameMappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Edit "Leche Entera 1L"'))

      const dialog = screen.getByRole('dialog')
      const input = dialog.querySelector('input')
      expect(input).toHaveValue('Leche Entera 1L')
    })

    it('shows merchant context in edit modal', async () => {
      render(<ItemNameMappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Edit "Leche Entera 1L"'))

      // getEditContext returns "Jumbo:" (title-cased merchant with colon)
      expect(screen.getByText('Jumbo:')).toBeInTheDocument()
    })

    it('calls onEditMapping with new value', async () => {
      const onEditMapping = vi.fn().mockResolvedValue(undefined)
      render(<ItemNameMappingsList {...defaultProps} onEditMapping={onEditMapping} />)

      await userEvent.click(screen.getByLabelText('Edit "Leche Entera 1L"'))

      const dialog = screen.getByRole('dialog')
      const input = dialog.querySelector('input') as HTMLInputElement
      await userEvent.clear(input)
      await userEvent.type(input, 'Leche Descremada')
      await userEvent.click(screen.getByText('Save'))

      expect(onEditMapping).toHaveBeenCalledWith('item-1', 'Leche Descremada')
    })

    it('shows input placeholder', async () => {
      render(<ItemNameMappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Edit "Leche Entera 1L"'))

      const dialog = screen.getByRole('dialog')
      const input = dialog.querySelector('input')
      expect(input).toHaveAttribute('placeholder', 'Item name')
    })
  })

  describe('Delete Flow', () => {
    it('shows merchant and item in delete message', async () => {
      render(<ItemNameMappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Delete "Leche Entera 1L"'))

      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument()
      // getDeleteMessage returns: Jumbo: "LECHE 1L → Leche Entera 1L"
      expect(screen.getByText(/Jumbo.*LECHE 1L.*Leche Entera 1L/)).toBeInTheDocument()
    })

    it('calls onDeleteMapping on confirm', async () => {
      const onDeleteMapping = vi.fn().mockResolvedValue(undefined)
      render(<ItemNameMappingsList {...defaultProps} onDeleteMapping={onDeleteMapping} />)

      await userEvent.click(screen.getByLabelText('Delete "Leche Entera 1L"'))
      await userEvent.click(screen.getByText('Confirm'))

      expect(onDeleteMapping).toHaveBeenCalledWith('item-1')
    })
  })
})
