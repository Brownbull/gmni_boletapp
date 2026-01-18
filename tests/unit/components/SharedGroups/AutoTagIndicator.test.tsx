/**
 * Story 14c.8: Auto-Tag on Scan - AutoTagIndicator Component Tests
 *
 * Tests for the AutoTagIndicator component that shows when a transaction
 * will be automatically shared to a group.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AutoTagIndicator } from '../../../../src/components/SharedGroups/AutoTagIndicator';

// =============================================================================
// Test Setup
// =============================================================================

const mockT = (key: string) => {
  const translations: Record<string, string> = {
    willBeSharedTo: 'Will be shared to',
    removeGroupTag: 'Remove group tag',
  };
  return translations[key] || key;
};

const defaultProps = {
  groupId: 'group-123',
  groupName: 'Family',
  groupColor: '#10b981',
  t: mockT,
};

// =============================================================================
// Tests
// =============================================================================

describe('AutoTagIndicator', () => {
  describe('Rendering', () => {
    it('renders with group name and "will be shared to" message', () => {
      render(<AutoTagIndicator {...defaultProps} />);

      expect(screen.getByText('Will be shared to')).toBeInTheDocument();
      expect(screen.getByText('Family')).toBeInTheDocument();
    });

    it('renders with correct test id', () => {
      render(<AutoTagIndicator {...defaultProps} />);

      expect(screen.getByTestId('auto-tag-indicator-group-123')).toBeInTheDocument();
    });

    it('shows group icon when provided', () => {
      render(<AutoTagIndicator {...defaultProps} groupIcon="👨‍👩‍👧" />);

      expect(screen.getByText('👨‍👩‍👧')).toBeInTheDocument();
    });

    it('shows Users icon when no group icon provided', () => {
      render(<AutoTagIndicator {...defaultProps} />);

      // Should have the icon badge area with lucide Users icon
      const badge = screen.getByRole('status').querySelector('svg');
      expect(badge).toBeInTheDocument();
    });

    it('applies group color to styling', () => {
      render(<AutoTagIndicator {...defaultProps} />);

      const container = screen.getByTestId('auto-tag-indicator-group-123');
      // Check that backgroundColor contains the group color (hex with opacity suffix)
      expect(container.style.backgroundColor).toContain('#10b981');
    });
  });

  describe('Remove Button', () => {
    it('shows remove button when onRemove is provided', () => {
      const onRemove = vi.fn();
      render(<AutoTagIndicator {...defaultProps} onRemove={onRemove} />);

      expect(screen.getByTestId('auto-tag-remove-group-123')).toBeInTheDocument();
    });

    it('hides remove button when onRemove is not provided', () => {
      render(<AutoTagIndicator {...defaultProps} />);

      expect(screen.queryByTestId('auto-tag-remove-group-123')).not.toBeInTheDocument();
    });

    it('hides remove button when showRemove is false even if onRemove is provided', () => {
      const onRemove = vi.fn();
      render(<AutoTagIndicator {...defaultProps} onRemove={onRemove} showRemove={false} />);

      expect(screen.queryByTestId('auto-tag-remove-group-123')).not.toBeInTheDocument();
    });

    it('calls onRemove when remove button is clicked', () => {
      const onRemove = vi.fn();
      render(<AutoTagIndicator {...defaultProps} onRemove={onRemove} />);

      fireEvent.click(screen.getByTestId('auto-tag-remove-group-123'));

      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('stops event propagation when remove button is clicked', () => {
      const onRemove = vi.fn();
      const onContainerClick = vi.fn();

      render(
        <div onClick={onContainerClick}>
          <AutoTagIndicator {...defaultProps} onRemove={onRemove} />
        </div>
      );

      fireEvent.click(screen.getByTestId('auto-tag-remove-group-123'));

      expect(onRemove).toHaveBeenCalled();
      expect(onContainerClick).not.toHaveBeenCalled();
    });
  });

  describe('Size Variants', () => {
    it('renders with normal size by default', () => {
      render(<AutoTagIndicator {...defaultProps} />);

      const container = screen.getByTestId('auto-tag-indicator-group-123');
      expect(container.className).toContain('px-3');
      expect(container.className).toContain('py-2');
      expect(container.className).toContain('text-sm');
    });

    it('renders with small size when specified', () => {
      render(<AutoTagIndicator {...defaultProps} size="small" />);

      const container = screen.getByTestId('auto-tag-indicator-group-123');
      expect(container.className).toContain('px-2');
      expect(container.className).toContain('py-1.5');
      expect(container.className).toContain('text-xs');
    });
  });

  describe('Accessibility', () => {
    it('has correct role and aria-label', () => {
      render(<AutoTagIndicator {...defaultProps} />);

      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-label', 'Will be shared to Family');
    });

    it('remove button has accessible aria-label', () => {
      const onRemove = vi.fn();
      render(<AutoTagIndicator {...defaultProps} onRemove={onRemove} />);

      const button = screen.getByTestId('auto-tag-remove-group-123');
      expect(button).toHaveAttribute('aria-label', 'Remove group tag');
    });
  });
});
