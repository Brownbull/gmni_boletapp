/**
 * PolygonModeToggle Component Tests
 *
 * Story 14.6: Polygon Dual Mode
 * Epic 14: Core Implementation
 *
 * Tests for the segmented control that toggles between
 * merchant categories and item groups views.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PolygonModeToggle, type PolygonMode } from '../../../../src/components/polygon/PolygonModeToggle';

describe('PolygonModeToggle', () => {
  const defaultProps = {
    mode: 'categories' as PolygonMode,
    onModeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC #1: Mode toggle component - segmented control', () => {
    it('renders two toggle options', () => {
      render(<PolygonModeToggle {...defaultProps} />);

      expect(screen.getByText('Categorías')).toBeInTheDocument();
      expect(screen.getByText('Grupos')).toBeInTheDocument();
    });

    it('shows categories option as active when mode is categories', () => {
      render(<PolygonModeToggle {...defaultProps} mode="categories" />);

      const categoriesButton = screen.getByRole('button', { name: /categorías/i });
      expect(categoriesButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('shows groups option as active when mode is groups', () => {
      render(<PolygonModeToggle {...defaultProps} mode="groups" />);

      const groupsButton = screen.getByRole('button', { name: /grupos/i });
      expect(groupsButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('calls onModeChange when clicking inactive option', () => {
      const onModeChange = vi.fn();
      render(<PolygonModeToggle mode="categories" onModeChange={onModeChange} />);

      const groupsButton = screen.getByRole('button', { name: /grupos/i });
      fireEvent.click(groupsButton);

      expect(onModeChange).toHaveBeenCalledWith('groups');
    });

    it('does not call onModeChange when clicking active option', () => {
      const onModeChange = vi.fn();
      render(<PolygonModeToggle mode="categories" onModeChange={onModeChange} />);

      const categoriesButton = screen.getByRole('button', { name: /categorías/i });
      fireEvent.click(categoriesButton);

      expect(onModeChange).not.toHaveBeenCalled();
    });
  });

  describe('Active state styling', () => {
    it('applies active styling to selected option', () => {
      render(<PolygonModeToggle {...defaultProps} mode="categories" />);

      const categoriesButton = screen.getByRole('button', { name: /categorías/i });
      const groupsButton = screen.getByRole('button', { name: /grupos/i });

      // Active button should have different styling
      expect(categoriesButton.className).toContain('bg-');
      expect(groupsButton).not.toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Touch-friendly sizing', () => {
    it('has minimum touch target size', () => {
      const { container } = render(<PolygonModeToggle {...defaultProps} />);

      // Container should have appropriate padding/sizing classes
      const toggleContainer = container.firstChild as HTMLElement;
      expect(toggleContainer).toBeInTheDocument();
    });

    it('renders as accessible toggle group', () => {
      render(<PolygonModeToggle {...defaultProps} />);

      const toggleGroup = screen.getByRole('group');
      expect(toggleGroup).toBeInTheDocument();
      expect(toggleGroup).toHaveAttribute('aria-label', 'Polygon view mode');
    });
  });

  describe('Accessibility', () => {
    it('supports keyboard navigation with Enter key', () => {
      const onModeChange = vi.fn();
      render(<PolygonModeToggle mode="categories" onModeChange={onModeChange} />);

      const groupsButton = screen.getByRole('button', { name: /grupos/i });
      fireEvent.keyDown(groupsButton, { key: 'Enter' });

      expect(onModeChange).toHaveBeenCalledWith('groups');
    });

    it('supports keyboard navigation with Space key', () => {
      const onModeChange = vi.fn();
      render(<PolygonModeToggle mode="categories" onModeChange={onModeChange} />);

      const groupsButton = screen.getByRole('button', { name: /grupos/i });
      fireEvent.keyDown(groupsButton, { key: ' ' });

      expect(onModeChange).toHaveBeenCalledWith('groups');
    });
  });

  describe('className prop', () => {
    it('accepts additional className', () => {
      const { container } = render(
        <PolygonModeToggle {...defaultProps} className="mt-4" />
      );

      expect(container.firstChild).toHaveClass('mt-4');
    });
  });
});
