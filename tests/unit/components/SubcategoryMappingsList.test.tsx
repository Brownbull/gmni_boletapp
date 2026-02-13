/**
 * SubcategoryMappingsList Component Unit Tests
 *
 * Tests the thin wrapper that delegates to MappingsList<SubcategoryMapping>.
 * Focuses on wrapper-specific behavior: onUpdateMapping → onEditMapping prop mapping.
 *
 * Story 15-3b: Config-driven generic replaces 581-line component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { SubcategoryMappingsList } from '../../../src/components/SubcategoryMappingsList'
import type { SubcategoryMapping } from '../../../src/types/subcategoryMapping'
import { Timestamp } from 'firebase/firestore'

// ============================================================================
// Test Helpers
// ============================================================================

const mockT = (key: string) => {
  const translations: Record<string, string> = {
    learnedSubcategories: 'Learned Subcategories',
    learnedSubcategoriesEmpty: 'No learned subcategories yet',
    learnedSubcategoriesHint: 'Assign subcategories and choose to remember',
    deleteSubcategoryMappingConfirm: 'Delete this subcategory mapping?',
    editSubcategoryMapping: 'Edit subcategory',
    editMapping: 'Edit',
    deleteMapping: 'Delete',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    close: 'Close',
    enterSubcategory: 'Enter subcategory',
  }
  return translations[key] || key
}

const createMapping = (overrides: Partial<SubcategoryMapping> = {}): SubcategoryMapping => ({
  id: 'sub-1',
  originalItem: 'LECHE ENTERA 1L',
  normalizedItem: 'leche entera 1l',
  targetSubcategory: 'Dairy',
  confidence: 1.0,
  source: 'user',
  usageCount: 4,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  ...overrides,
})

const defaultProps = {
  mappings: [createMapping()],
  loading: false,
  onDeleteMapping: vi.fn().mockResolvedValue(undefined),
  onUpdateMapping: vi.fn().mockResolvedValue(undefined),
  t: mockT,
  theme: 'light' as const,
}

// ============================================================================
// Tests
// ============================================================================

describe('SubcategoryMappingsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  describe('Rendering', () => {
    it('renders subcategory mapping with original item in quotes', () => {
      render(<SubcategoryMappingsList {...defaultProps} />)
      expect(screen.getByText('"LECHE ENTERA 1L"')).toBeInTheDocument()
    })

    it('renders target subcategory as tag', () => {
      render(<SubcategoryMappingsList {...defaultProps} />)
      expect(screen.getByText('Dairy')).toBeInTheDocument()
    })

    it('renders usage count', () => {
      render(<SubcategoryMappingsList {...defaultProps} />)
      expect(screen.getByText('4x')).toBeInTheDocument()
    })

    it('renders list with proper role', () => {
      render(<SubcategoryMappingsList {...defaultProps} />)
      expect(screen.getByRole('list')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('shows empty message and hint', () => {
      render(<SubcategoryMappingsList {...defaultProps} mappings={[]} />)
      expect(screen.getByText('No learned subcategories yet')).toBeInTheDocument()
      expect(screen.getByText('Assign subcategories and choose to remember')).toBeInTheDocument()
    })
  })

  describe('onUpdateMapping → onEditMapping Prop Mapping', () => {
    it('maps onUpdateMapping to onEditMapping for the generic component', async () => {
      const onUpdateMapping = vi.fn().mockResolvedValue(undefined)
      render(<SubcategoryMappingsList {...defaultProps} onUpdateMapping={onUpdateMapping} />)

      await userEvent.click(screen.getByLabelText('Edit "LECHE ENTERA 1L"'))

      const dialog = screen.getByRole('dialog')
      const input = dialog.querySelector('input') as HTMLInputElement
      await userEvent.clear(input)
      await userEvent.type(input, 'Lácteos')
      await userEvent.click(screen.getByText('Save'))

      expect(onUpdateMapping).toHaveBeenCalledWith('sub-1', 'Lácteos')
    })
  })

  describe('Edit Flow (Text Input)', () => {
    it('opens edit modal with text input', async () => {
      render(<SubcategoryMappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Edit "LECHE ENTERA 1L"'))

      const dialog = screen.getByRole('dialog')
      const input = dialog.querySelector('input')
      expect(input).toBeInTheDocument()
      expect(input).toHaveValue('Dairy')
    })

    it('shows placeholder text', async () => {
      render(<SubcategoryMappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Edit "LECHE ENTERA 1L"'))

      const dialog = screen.getByRole('dialog')
      const input = dialog.querySelector('input')
      expect(input).toHaveAttribute('placeholder', 'Enter subcategory')
    })

    it('shows edit title', async () => {
      render(<SubcategoryMappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Edit "LECHE ENTERA 1L"'))
      expect(screen.getByText('Edit subcategory')).toBeInTheDocument()
    })
  })

  describe('Delete Flow', () => {
    it('opens confirmation with correct message', async () => {
      render(<SubcategoryMappingsList {...defaultProps} />)
      await userEvent.click(screen.getByLabelText('Delete "LECHE ENTERA 1L"'))
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument()
      expect(screen.getByText('Delete this subcategory mapping?')).toBeInTheDocument()
    })

    it('calls onDeleteMapping on confirm', async () => {
      const onDeleteMapping = vi.fn().mockResolvedValue(undefined)
      render(<SubcategoryMappingsList {...defaultProps} onDeleteMapping={onDeleteMapping} />)

      await userEvent.click(screen.getByLabelText('Delete "LECHE ENTERA 1L"'))
      await userEvent.click(screen.getByText('Confirm'))

      expect(onDeleteMapping).toHaveBeenCalledWith('sub-1')
    })
  })

  describe('Theme Support', () => {
    it('renders in dark theme', () => {
      render(<SubcategoryMappingsList {...defaultProps} theme="dark" />)
      expect(screen.getByRole('list')).toBeInTheDocument()
      expect(screen.getByText('"LECHE ENTERA 1L"')).toBeInTheDocument()
    })
  })
})
