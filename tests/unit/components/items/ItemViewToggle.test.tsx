/**
 * ItemViewToggle Component Tests
 *
 * Story 14.38: Item View Toggle - Grouped vs Original Order
 * @see docs/sprint-artifacts/epic14/stories/story-14.38-item-view-toggle.md
 *
 * Tests the toggle component that switches between:
 * - Grouped view: Items organized by category group, sorted by price descending
 * - Original view: Items in array index order (as received from scan)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemViewToggle, type ItemViewMode } from '../../../../src/components/items/ItemViewToggle';

describe('ItemViewToggle', () => {
  const mockOnViewChange = vi.fn();

  const defaultProps = {
    activeView: 'grouped' as ItemViewMode,
    onViewChange: mockOnViewChange,
    t: (key: string) => {
      const translations: Record<string, string> = {
        byGroup: 'By Group',
        originalOrder: 'Original',
        itemViewModes: 'Item view modes',
      };
      return translations[key] || key;
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders two view options', () => {
      render(<ItemViewToggle {...defaultProps} />);

      expect(screen.getByRole('tab', { name: /by group/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /original/i })).toBeInTheDocument();
    });

    it('renders with tablist role for accessibility', () => {
      render(<ItemViewToggle {...defaultProps} />);

      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('shows grouped view as active when activeView is grouped', () => {
      render(<ItemViewToggle {...defaultProps} activeView="grouped" />);

      const groupedTab = screen.getByRole('tab', { name: /by group/i });
      expect(groupedTab).toHaveAttribute('aria-selected', 'true');
    });

    it('shows original view as active when activeView is original', () => {
      render(<ItemViewToggle {...defaultProps} activeView="original" />);

      const originalTab = screen.getByRole('tab', { name: /original/i });
      expect(originalTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Interactions', () => {
    it('calls onViewChange with "grouped" when grouped button is clicked', () => {
      render(<ItemViewToggle {...defaultProps} activeView="original" />);

      fireEvent.click(screen.getByRole('tab', { name: /by group/i }));

      expect(mockOnViewChange).toHaveBeenCalledWith('grouped');
      expect(mockOnViewChange).toHaveBeenCalledTimes(1);
    });

    it('calls onViewChange with "original" when original button is clicked', () => {
      render(<ItemViewToggle {...defaultProps} activeView="grouped" />);

      fireEvent.click(screen.getByRole('tab', { name: /original/i }));

      expect(mockOnViewChange).toHaveBeenCalledWith('original');
      expect(mockOnViewChange).toHaveBeenCalledTimes(1);
    });

    it('calls onViewChange even when clicking already active view', () => {
      render(<ItemViewToggle {...defaultProps} activeView="grouped" />);

      fireEvent.click(screen.getByRole('tab', { name: /by group/i }));

      expect(mockOnViewChange).toHaveBeenCalledWith('grouped');
    });
  });

  describe('Styling', () => {
    it('has pill-shaped container with rounded-full class', () => {
      const { container } = render(<ItemViewToggle {...defaultProps} />);

      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).toHaveClass('rounded-full');
    });

    it('applies theme CSS variables for background', () => {
      const { container } = render(<ItemViewToggle {...defaultProps} />);

      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).toHaveStyle({ backgroundColor: 'var(--bg-tertiary, #f1f5f9)' });
    });
  });

  describe('Sliding Indicator', () => {
    it('renders sliding background indicator', () => {
      const { container } = render(<ItemViewToggle {...defaultProps} />);

      // Look for the sliding indicator div (has absolute positioning and transition)
      const indicator = container.querySelector('.absolute.transition-all');
      expect(indicator).toBeInTheDocument();
    });

    it('indicator has primary background color', () => {
      const { container } = render(<ItemViewToggle {...defaultProps} />);

      const indicator = container.querySelector('.absolute.transition-all') as HTMLElement;
      // CSS variables don't compute in jsdom, so check style attribute directly
      expect(indicator?.style.backgroundColor).toBe('var(--primary)');
    });
  });

  describe('Translations', () => {
    it('uses translation function for labels', () => {
      const customT = vi.fn((key: string) => `translated_${key}`);
      render(<ItemViewToggle {...defaultProps} t={customT} />);

      expect(customT).toHaveBeenCalledWith('byGroup');
      expect(customT).toHaveBeenCalledWith('originalOrder');
    });

    it('renders Spanish translations correctly', () => {
      const spanishT = (key: string) => {
        const translations: Record<string, string> = {
          byGroup: 'Por Grupo',
          originalOrder: 'Original',
          itemViewModes: 'Modos de vista de ítems',
        };
        return translations[key] || key;
      };

      render(<ItemViewToggle {...defaultProps} t={spanishT} />);

      expect(screen.getByRole('tab', { name: /por grupo/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /original/i })).toBeInTheDocument();
    });
  });

  describe('Full Width Layout', () => {
    it('renders with prominent buttons for touch targets', () => {
      render(<ItemViewToggle {...defaultProps} />);

      // Buttons should have larger padding for better touch targets
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('px-6', 'py-2.5');
      });
    });

    it('buttons have text-sm font size for readability', () => {
      render(<ItemViewToggle {...defaultProps} />);

      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('text-sm');
      });
    });
  });
});
