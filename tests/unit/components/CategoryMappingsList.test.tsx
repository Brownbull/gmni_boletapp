/**
 * CategoryMappingsList Component Unit Tests
 *
 * Tests the thin wrapper that delegates to MappingsList<CategoryMapping>.
 * Focuses on wrapper-specific behavior: optional onEditMapping, select dropdown.
 *
 * Story 15-3b: Config-driven generic replaces 632-line component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { CategoryMappingsList } from '@features/settings/components/CategoryMappingsList'
import type { CategoryMapping } from '../../../src/types/categoryMapping'
import { Timestamp } from 'firebase/firestore'

// ============================================================================
// Test Helpers
// ============================================================================

const mockT = (key: string) => {
  const translations: Record<string, string> = {
    learnedCategories: 'Learned Categories',
    learnedCategoriesEmpty: 'No learned categories yet',
    learnedCategoriesHint: 'Categorize items and choose to remember',
    deleteMappingConfirm: 'Delete this category mapping?',
    editCategoryTarget: 'Edit category',
    editCategoryMapping: 'Edit',
    deleteMapping: 'Delete',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    close: 'Close',
  }
  return translations[key] || key
}

const createMapping = (overrides: Partial<CategoryMapping> = {}): CategoryMapping => ({
  id: 'cat-1',
  originalItem: 'UBER EATS',
  normalizedItem: 'uber eats',
  targetCategory: 'Restaurant' as CategoryMapping['targetCategory'],
  confidence: 1.0,
  source: 'user',
  usageCount: 8,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  ...overrides,
})

const defaultProps = {
  mappings: [createMapping()],
  loading: false,
  onDeleteMapping: vi.fn().mockResolvedValue(undefined),
  t: mockT,
  theme: 'light' as const,
}

// ============================================================================
// Tests
// ============================================================================

describe('CategoryMappingsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  describe('Rendering', () => {
    it('renders category mapping with original item in quotes', () => {
      render(<CategoryMappingsList {...defaultProps} />)
      expect(screen.getByText('"UBER EATS"')).toBeInTheDocument()
    })

    it('renders target category as tag', () => {
      render(<CategoryMappingsList {...defaultProps} />)
      expect(screen.getByText('Restaurant')).toBeInTheDocument()
    })

    it('renders usage count', () => {
      render(<CategoryMappingsList {...defaultProps} />)
      expect(screen.getByText('8x')).toBeInTheDocument()
    })

    it('renders list with proper role', () => {
      render(<CategoryMappingsList {...defaultProps} />)
      expect(screen.getByRole('list')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('shows empty message and hint', () => {
      render(<CategoryMappingsList {...defaultProps} mappings={[]} />)
      expect(screen.getByText('No learned categories yet')).toBeInTheDocument()
      expect(screen.getByText('Categorize items and choose to remember')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('shows skeleton when loading', () => {
      const { container } = render(<CategoryMappingsList {...defaultProps} loading={true} />)
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    })
  })

  describe('Optional onEditMapping', () => {
    it('renders without onEditMapping (uses noop)', () => {
      expect(() => {
        render(<CategoryMappingsList {...defaultProps} />)
      }).not.toThrow()
    })

    it('renders with onEditMapping provided', () => {
      const onEditMapping = vi.fn().mockResolvedValue(undefined)
      render(<CategoryMappingsList {...defaultProps} onEditMapping={onEditMapping} />)
      expect(screen.getByText('"UBER EATS"')).toBeInTheDocument()
    })
  })

  describe('Select Dropdown Edit', () => {
    it('opens edit modal with select dropdown', async () => {
      const onEditMapping = vi.fn().mockResolvedValue(undefined)
      render(<CategoryMappingsList {...defaultProps} onEditMapping={onEditMapping} />)

      await userEvent.click(screen.getByLabelText('Edit "UBER EATS"'))

      const dialog = screen.getByRole('dialog')
      const select = dialog.querySelector('select')
      expect(select).toBeInTheDocument()
      expect(select).toHaveValue('Restaurant')
    })

    it('shows STORE_CATEGORIES as options', async () => {
      const onEditMapping = vi.fn().mockResolvedValue(undefined)
      render(<CategoryMappingsList {...defaultProps} onEditMapping={onEditMapping} />)

      await userEvent.click(screen.getByLabelText('Edit "UBER EATS"'))

      const dialog = screen.getByRole('dialog')
      const options = dialog.querySelectorAll('option')
      expect(options.length).toBeGreaterThan(5)
      // Check a few known categories
      const optionValues = Array.from(options).map((o) => o.textContent)
      expect(optionValues).toContain('Supermarket')
      expect(optionValues).toContain('Restaurant')
      expect(optionValues).toContain('Pharmacy')
    })

    it('calls onEditMapping with selected category', async () => {
      const onEditMapping = vi.fn().mockResolvedValue(undefined)
      render(<CategoryMappingsList {...defaultProps} onEditMapping={onEditMapping} />)

      await userEvent.click(screen.getByLabelText('Edit "UBER EATS"'))

      const dialog = screen.getByRole('dialog')
      const select = dialog.querySelector('select') as HTMLSelectElement
      await userEvent.selectOptions(select, 'Supermarket')
      await userEvent.click(screen.getByText('Save'))

      expect(onEditMapping).toHaveBeenCalledWith('cat-1', 'Supermarket')
    })
  })

  describe('Delete Flow', () => {
    it('opens confirmation dialog on delete', async () => {
      render(<CategoryMappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Delete "UBER EATS"'))
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument()
    })

    it('shows original item in delete message', async () => {
      render(<CategoryMappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Delete "UBER EATS"'))
      const dialog = screen.getByTestId('confirmation-dialog')
      expect(dialog.textContent).toContain('UBER EATS')
    })

    it('calls onDeleteMapping on confirm', async () => {
      const onDeleteMapping = vi.fn().mockResolvedValue(undefined)
      render(<CategoryMappingsList {...defaultProps} onDeleteMapping={onDeleteMapping} />)

      await userEvent.click(screen.getByLabelText('Delete "UBER EATS"'))
      await userEvent.click(screen.getByText('Confirm'))

      expect(onDeleteMapping).toHaveBeenCalledWith('cat-1')
    })
  })
})
