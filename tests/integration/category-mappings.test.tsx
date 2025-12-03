/**
 * Integration Tests: CategoryMappingsList Component
 *
 * Story 6.5: Mappings Management UI
 *
 * These tests validate the CategoryMappingsList component behavior with mocked
 * Firebase services, covering all acceptance criteria for the mappings management UI.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryMappingsList, CategoryMappingsListProps } from '../../src/components/CategoryMappingsList';
import { CategoryMapping } from '../../src/types/categoryMapping';
import { Timestamp } from 'firebase/firestore';

// Mock translations
const mockT = (key: string): string => {
  const translations: Record<string, string> = {
    learnedCategories: 'Learned Categories',
    learnedCategoriesEmpty: 'No learned categories yet',
    learnedCategoriesHint: "Edit a transaction's category to start learning",
    deleteMapping: 'Delete',
    deleteMappingConfirm: 'Remove this learned category?',
    usedTimes: 'Used {count} times',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
  };
  return translations[key] || key;
};

// Mock category mappings
const createMockMapping = (overrides: Partial<CategoryMapping> = {}): CategoryMapping => ({
  id: 'mapping-1',
  originalItem: 'UBER EATS',
  normalizedItem: 'uber eats',
  targetCategory: 'Transport',
  confidence: 1.0,
  source: 'user',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  usageCount: 5,
  ...overrides,
});

describe('CategoryMappingsList Component - Story 6.5', () => {
  const defaultProps: CategoryMappingsListProps = {
    mappings: [],
    loading: false,
    onDeleteMapping: vi.fn().mockResolvedValue(undefined),
    t: mockT,
    theme: 'light',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC#2: List displays all user\'s category mappings', () => {
    it('should render list of mappings when mappings exist', () => {
      const mappings = [
        createMockMapping({ id: 'mapping-1', originalItem: 'UBER EATS' }),
        createMockMapping({ id: 'mapping-2', originalItem: 'WALMART', targetCategory: 'Supermarket', usageCount: 12 }),
      ];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} />);

      expect(screen.getByText('"UBER EATS"')).toBeInTheDocument();
      expect(screen.getByText('"WALMART"')).toBeInTheDocument();
    });

    it('should render list with proper role and aria-label', () => {
      const mappings = [createMockMapping()];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} />);

      const list = screen.getByRole('list', { name: /learned categories/i });
      expect(list).toBeInTheDocument();
    });
  });

  describe('AC#3: Each mapping shows item name, category, and usage count', () => {
    it('should display item name with quotes', () => {
      const mappings = [createMockMapping({ originalItem: 'STARBUCKS' })];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} />);

      expect(screen.getByText('"STARBUCKS"')).toBeInTheDocument();
    });

    it('should display category badge', () => {
      const mappings = [createMockMapping({ targetCategory: 'Food & Drinks' })];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} />);

      expect(screen.getByText('Food & Drinks')).toBeInTheDocument();
    });

    it('should display usage count in correct format', () => {
      const mappings = [createMockMapping({ usageCount: 12 })];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} />);

      expect(screen.getByText('Used 12 times')).toBeInTheDocument();
    });

    it('should display usage count of zero correctly', () => {
      const mappings = [createMockMapping({ usageCount: 0 })];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} />);

      expect(screen.getByText('Used 0 times')).toBeInTheDocument();
    });
  });

  describe('AC#4: User can delete a mapping with confirmation', () => {
    it('should show delete button for each mapping', () => {
      const mappings = [
        createMockMapping({ id: 'mapping-1', originalItem: 'UBER EATS' }),
        createMockMapping({ id: 'mapping-2', originalItem: 'WALMART' }),
      ];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons).toHaveLength(2);
    });

    it('should open confirmation modal when delete button is clicked', async () => {
      const mappings = [createMockMapping({ originalItem: 'UBER EATS' })];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} />);

      const deleteButton = screen.getByRole('button', { name: /delete.*uber eats/i });
      await userEvent.click(deleteButton);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText('Remove this learned category?')).toBeInTheDocument();
      // Modal shows item name in description - use getAllByText since it appears in list and modal
      const uberEatsTexts = screen.getAllByText(/"UBER EATS"/);
      expect(uberEatsTexts.length).toBeGreaterThanOrEqual(2); // In list and in modal
    });

    it('should call onDeleteMapping when confirm is clicked', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      const mappings = [createMockMapping({ id: 'mapping-123', originalItem: 'UBER EATS' })];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} onDeleteMapping={mockDelete} />);

      // Open modal
      const deleteButton = screen.getByRole('button', { name: /delete.*uber eats/i });
      await userEvent.click(deleteButton);

      // Click confirm
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('mapping-123');
      });
    });

    it('should close modal without deleting when cancel is clicked', async () => {
      const mockDelete = vi.fn();
      const mappings = [createMockMapping({ originalItem: 'UBER EATS' })];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} onDeleteMapping={mockDelete} />);

      // Open modal
      const deleteButton = screen.getByRole('button', { name: /delete.*uber eats/i });
      await userEvent.click(deleteButton);

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should close modal when clicking backdrop', async () => {
      const mappings = [createMockMapping({ originalItem: 'UBER EATS' })];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} />);

      // Open modal
      const deleteButton = screen.getByRole('button', { name: /delete.*uber eats/i });
      await userEvent.click(deleteButton);

      // Click backdrop (the presentation div)
      const backdrop = screen.getByRole('presentation');
      fireEvent.click(backdrop);

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('AC#5: Empty state shows helpful message', () => {
    it('should show empty state when no mappings exist', () => {
      render(<CategoryMappingsList {...defaultProps} mappings={[]} />);

      expect(screen.getByText('No learned categories yet')).toBeInTheDocument();
      expect(screen.getByText("Edit a transaction's category to start learning")).toBeInTheDocument();
    });

    it('should have proper aria-label for empty state', () => {
      render(<CategoryMappingsList {...defaultProps} mappings={[]} />);

      const emptyState = screen.getByRole('status', { name: /no learned categories/i });
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe('AC#6: List is keyboard navigable and accessible', () => {
    it('should close modal with Escape key', async () => {
      const mappings = [createMockMapping({ originalItem: 'UBER EATS' })];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} />);

      // Open modal
      const deleteButton = screen.getByRole('button', { name: /delete.*uber eats/i });
      await userEvent.click(deleteButton);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      // Press Escape
      await userEvent.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });

    it('should focus confirm button when modal opens', async () => {
      const mappings = [createMockMapping({ originalItem: 'UBER EATS' })];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} />);

      const deleteButton = screen.getByRole('button', { name: /delete.*uber eats/i });
      await userEvent.click(deleteButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /confirm/i });
        expect(document.activeElement).toBe(confirmButton);
      });
    });

    it('should have delete buttons with descriptive aria-labels', () => {
      const mappings = [
        createMockMapping({ id: 'mapping-1', originalItem: 'UBER EATS' }),
        createMockMapping({ id: 'mapping-2', originalItem: 'WALMART' }),
      ];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} />);

      expect(screen.getByRole('button', { name: /delete.*uber eats/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete.*walmart/i })).toBeInTheDocument();
    });

    it('should trigger delete modal with Enter key on delete button', async () => {
      const mappings = [createMockMapping({ originalItem: 'UBER EATS' })];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} />);

      const deleteButton = screen.getByRole('button', { name: /delete.*uber eats/i });
      deleteButton.focus();

      // Simulate Enter key press
      fireEvent.keyDown(deleteButton, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });
    });

    it('should trigger delete modal with Space key on delete button', async () => {
      const mappings = [createMockMapping({ originalItem: 'UBER EATS' })];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} />);

      const deleteButton = screen.getByRole('button', { name: /delete.*uber eats/i });
      deleteButton.focus();

      // Simulate Space key press
      fireEvent.keyDown(deleteButton, { key: ' ', code: 'Space' });

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });
    });

    it('should have proper modal accessibility attributes', async () => {
      const mappings = [createMockMapping({ originalItem: 'UBER EATS' })];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} />);

      const deleteButton = screen.getByRole('button', { name: /delete.*uber eats/i });
      await userEvent.click(deleteButton);

      const modal = screen.getByRole('alertdialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'delete-modal-title');
      expect(modal).toHaveAttribute('aria-describedby', 'delete-modal-description');
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton when loading is true', () => {
      render(<CategoryMappingsList {...defaultProps} loading={true} />);

      // Check for loading skeleton (animate-pulse class elements)
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not show mappings when loading', () => {
      const mappings = [createMockMapping({ originalItem: 'UBER EATS' })];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} loading={true} />);

      expect(screen.queryByText('"UBER EATS"')).not.toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('should apply dark theme styling when theme is dark', () => {
      const mappings = [createMockMapping()];

      const { container } = render(
        <CategoryMappingsList {...defaultProps} mappings={mappings} theme="dark" />
      );

      // Check for dark mode classes
      const list = container.querySelector('ul');
      expect(list?.className).toContain('bg-slate-800');
    });

    it('should apply light theme styling when theme is light', () => {
      const mappings = [createMockMapping()];

      const { container } = render(
        <CategoryMappingsList {...defaultProps} mappings={mappings} theme="light" />
      );

      // Check for light mode classes
      const list = container.querySelector('ul');
      expect(list?.className).toContain('bg-slate-50');
    });
  });

  describe('Error Handling', () => {
    it('should handle delete failure gracefully', async () => {
      const mockDelete = vi.fn().mockRejectedValue(new Error('Delete failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mappings = [createMockMapping({ id: 'mapping-123', originalItem: 'UBER EATS' })];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} onDeleteMapping={mockDelete} />);

      // Open modal
      const deleteButton = screen.getByRole('button', { name: /delete.*uber eats/i });
      await userEvent.click(deleteButton);

      // Click confirm
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('mapping-123');
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should close modal after delete failure', async () => {
      const mockDelete = vi.fn().mockRejectedValue(new Error('Delete failed'));
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const mappings = [createMockMapping({ originalItem: 'UBER EATS' })];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} onDeleteMapping={mockDelete} />);

      // Open modal
      const deleteButton = screen.getByRole('button', { name: /delete.*uber eats/i });
      await userEvent.click(deleteButton);

      // Click confirm
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Multiple Mappings', () => {
    it('should render multiple mappings correctly', () => {
      const mappings = [
        createMockMapping({ id: '1', originalItem: 'UBER EATS', targetCategory: 'Transport', usageCount: 5 }),
        createMockMapping({ id: '2', originalItem: 'WALMART', targetCategory: 'Supermarket', usageCount: 12 }),
        createMockMapping({ id: '3', originalItem: 'STARBUCKS', targetCategory: 'Food & Drinks', usageCount: 3 }),
      ];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} />);

      expect(screen.getByText('"UBER EATS"')).toBeInTheDocument();
      expect(screen.getByText('"WALMART"')).toBeInTheDocument();
      expect(screen.getByText('"STARBUCKS"')).toBeInTheDocument();

      expect(screen.getByText('Transport')).toBeInTheDocument();
      expect(screen.getByText('Supermarket')).toBeInTheDocument();
      expect(screen.getByText('Food & Drinks')).toBeInTheDocument();

      expect(screen.getByText('Used 5 times')).toBeInTheDocument();
      expect(screen.getByText('Used 12 times')).toBeInTheDocument();
      expect(screen.getByText('Used 3 times')).toBeInTheDocument();
    });

    it('should delete correct mapping when multiple exist', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      const mappings = [
        createMockMapping({ id: 'mapping-1', originalItem: 'UBER EATS' }),
        createMockMapping({ id: 'mapping-2', originalItem: 'WALMART' }),
      ];

      render(<CategoryMappingsList {...defaultProps} mappings={mappings} onDeleteMapping={mockDelete} />);

      // Click delete on second mapping
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await userEvent.click(deleteButtons[1]); // WALMART's delete button

      // Confirm delete
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('mapping-2');
      });
    });
  });
});
