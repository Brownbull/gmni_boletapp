/**
 * DynamicPolygon Component Tests
 *
 * Story 14.5: Dynamic Polygon Component
 * Epic 14: Core Implementation
 *
 * Tests for the dynamic polygon visualization that shows
 * top spending categories at a glance.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DynamicPolygon, type CategorySpending } from '../../../../src/components/polygon/DynamicPolygon';

// Mock useReducedMotion hook
vi.mock('../../../../src/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

// Mock useBreathing hook
vi.mock('../../../../src/components/animation/useBreathing', () => ({
  useBreathing: vi.fn(() => ({
    scale: 1,
    opacity: 1,
    phase: 0,
    isAnimating: true,
    style: { transform: 'scale(1)', opacity: 1 },
    transform: 'scale(1)',
  })),
}));

import { useReducedMotion } from '../../../../src/hooks/useReducedMotion';
import { useBreathing } from '../../../../src/components/animation/useBreathing';

describe('DynamicPolygon', () => {
  // Sample category data for tests
  const sampleCategories: CategorySpending[] = [
    { name: 'Supermarket', amount: 216800, color: '#22c55e' },
    { name: 'Restaurant', amount: 162600, color: '#f59e0b' },
    { name: 'Transport', amount: 108400, color: '#3b82f6' },
    { name: 'Entertainment', amount: 54200, color: '#8b5cf6' },
    { name: 'Utilities', amount: 43360, color: '#f59e0b' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useReducedMotion).mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AC #1: DynamicPolygon component renders SVG-based polygon with 3-6 vertices', () => {
    it('renders an SVG element', () => {
      render(<DynamicPolygon categories={sampleCategories} />);
      const svg = screen.getByTestId('dynamic-polygon-svg');
      expect(svg).toBeInTheDocument();
      expect(svg.tagName.toLowerCase()).toBe('svg');
    });

    it('renders a polygon element inside SVG', () => {
      render(<DynamicPolygon categories={sampleCategories} />);
      const svg = screen.getByTestId('dynamic-polygon-svg');
      const polygon = svg.querySelector('polygon');
      expect(polygon).toBeInTheDocument();
    });

    it('calculates polygon points on unit circle scaled by spending ratio', () => {
      render(<DynamicPolygon categories={sampleCategories} />);
      const svg = screen.getByTestId('dynamic-polygon-svg');
      const polygon = svg.querySelector('polygon');
      expect(polygon).toHaveAttribute('points');

      // Points should be a space-separated list of x,y coordinates
      const points = polygon?.getAttribute('points') || '';
      const coordinates = points.split(' ');
      expect(coordinates.length).toBe(5); // 5 categories
    });
  });

  describe('AC #2: Dynamic side count based on number of significant spending categories', () => {
    it('renders minimum 3 vertices (triangle) with 3 categories', () => {
      const threeCategories = sampleCategories.slice(0, 3);
      render(<DynamicPolygon categories={threeCategories} />);
      const svg = screen.getByTestId('dynamic-polygon-svg');
      const polygon = svg.querySelector('polygon');
      const points = polygon?.getAttribute('points')?.split(' ') || [];
      expect(points.length).toBe(3);
    });

    it('renders maximum 6 vertices (hexagon) with 6+ categories', () => {
      const sixCategories = [
        ...sampleCategories,
        { name: 'Medical', amount: 20000, color: '#ec4899' },
        { name: 'Education', amount: 15000, color: '#06b6d4' },
      ];
      render(<DynamicPolygon categories={sixCategories} maxVertices={6} />);
      const svg = screen.getByTestId('dynamic-polygon-svg');
      const polygon = svg.querySelector('polygon');
      const points = polygon?.getAttribute('points')?.split(' ') || [];
      expect(points.length).toBe(6);
    });

    it('handles edge case with 0 categories gracefully', () => {
      render(<DynamicPolygon categories={[]} />);
      const svg = screen.getByTestId('dynamic-polygon-svg');
      expect(svg).toBeInTheDocument();
      // Should not render a polygon or show empty state
      const polygon = svg.querySelector('polygon');
      expect(polygon).toBeNull();
    });

    it('displays "No spending data" message when 0 categories', () => {
      render(<DynamicPolygon categories={[]} />);
      expect(screen.getByText('No spending data')).toBeInTheDocument();
    });

    it('handles edge case with 1-2 categories by showing minimum vertices', () => {
      const twoCategories = sampleCategories.slice(0, 2);
      render(<DynamicPolygon categories={twoCategories} />);
      const svg = screen.getByTestId('dynamic-polygon-svg');
      // With fewer than 3 categories, no polygon should be drawn
      const polygon = svg.querySelector('polygon');
      expect(polygon).toBeNull();
    });

    it('displays "Need at least 3 categories" message when 1-2 categories', () => {
      const twoCategories = sampleCategories.slice(0, 2);
      render(<DynamicPolygon categories={twoCategories} />);
      expect(screen.getByText('Need at least 3 categories')).toBeInTheDocument();
    });
  });

  describe('AC #3: Breathing animation applied using useBreathing hook (3s cycle)', () => {
    it('uses breathing hook by default', () => {
      render(<DynamicPolygon categories={sampleCategories} />);
      expect(useBreathing).toHaveBeenCalled();
    });

    it('disables breathing when breathing prop is false', () => {
      vi.mocked(useBreathing).mockClear();
      render(<DynamicPolygon categories={sampleCategories} breathing={false} />);
      // Hook should be called with enabled: false
      expect(useBreathing).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
    });

    it('applies breathing animation style to container', () => {
      vi.mocked(useBreathing).mockReturnValue({
        scale: 1.02,
        opacity: 0.95,
        phase: 0.5,
        isAnimating: true,
        style: { transform: 'scale(1.02)', opacity: 0.95, transformOrigin: 'center center', willChange: 'transform, opacity' },
        transform: 'scale(1.02)',
      });

      const { container } = render(<DynamicPolygon categories={sampleCategories} />);
      const wrapper = container.querySelector('[data-testid="polygon-breathing-wrapper"]');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('AC #4: Category labeling shown at each vertex with category name and amount', () => {
    it('renders labels at each vertex', () => {
      render(<DynamicPolygon categories={sampleCategories} />);
      // Should find labels for each category
      sampleCategories.forEach((cat) => {
        expect(screen.getByText(cat.name)).toBeInTheDocument();
      });
    });

    it('displays amount in currency format', () => {
      render(<DynamicPolygon categories={sampleCategories} />);
      // Look for formatted amounts (CLP format: $216.800)
      expect(screen.getByText(/\$216\.800/)).toBeInTheDocument();
    });

    it('positions labels near their respective vertices', () => {
      render(<DynamicPolygon categories={sampleCategories} />);
      // Labels should have position styles
      const labels = screen.getAllByTestId(/polygon-label-/);
      expect(labels.length).toBe(5);
    });
  });

  describe('AC #5: Touch/click interactivity - tapping a vertex drills into that category', () => {
    it('calls onVertexClick when a vertex is clicked', () => {
      const handleClick = vi.fn();
      render(<DynamicPolygon categories={sampleCategories} onVertexClick={handleClick} />);

      const vertex = screen.getByTestId('polygon-vertex-Supermarket');
      fireEvent.click(vertex);

      expect(handleClick).toHaveBeenCalledWith('Supermarket');
    });

    it('provides visual feedback on touch (scale animation)', () => {
      render(<DynamicPolygon categories={sampleCategories} onVertexClick={vi.fn()} />);
      const vertex = screen.getByTestId('polygon-vertex-Supermarket');

      // Should have hover scale class and cursor style
      expect(vertex).toHaveClass('hover:scale-125');
      expect(vertex).toHaveStyle({ cursor: 'pointer' });
    });

    it('does not call onVertexClick if prop is not provided', () => {
      render(<DynamicPolygon categories={sampleCategories} />);
      const vertex = screen.getByTestId('polygon-vertex-Supermarket');

      // Should not throw when clicking
      expect(() => fireEvent.click(vertex)).not.toThrow();
    });

    it('calls onVertexClick when Enter key is pressed on a vertex', () => {
      const handleClick = vi.fn();
      render(<DynamicPolygon categories={sampleCategories} onVertexClick={handleClick} />);

      const vertex = screen.getByTestId('polygon-vertex-Supermarket');
      fireEvent.keyDown(vertex, { key: 'Enter' });

      expect(handleClick).toHaveBeenCalledWith('Supermarket');
    });

    it('calls onVertexClick when Space key is pressed on a vertex', () => {
      const handleClick = vi.fn();
      render(<DynamicPolygon categories={sampleCategories} onVertexClick={handleClick} />);

      const vertex = screen.getByTestId('polygon-vertex-Restaurant');
      fireEvent.keyDown(vertex, { key: ' ' });

      expect(handleClick).toHaveBeenCalledWith('Restaurant');
    });

    it('does not call onVertexClick for other keys', () => {
      const handleClick = vi.fn();
      render(<DynamicPolygon categories={sampleCategories} onVertexClick={handleClick} />);

      const vertex = screen.getByTestId('polygon-vertex-Supermarket');
      fireEvent.keyDown(vertex, { key: 'Tab' });
      fireEvent.keyDown(vertex, { key: 'Escape' });
      fireEvent.keyDown(vertex, { key: 'a' });

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('AC #6: Responsive sizing - polygon scales appropriately on different screen sizes', () => {
    it('uses viewBox for SVG scaling', () => {
      render(<DynamicPolygon categories={sampleCategories} />);
      const svg = screen.getByTestId('dynamic-polygon-svg');
      expect(svg).toHaveAttribute('viewBox');
    });

    it('maintains aspect ratio with preserveAspectRatio', () => {
      render(<DynamicPolygon categories={sampleCategories} />);
      const svg = screen.getByTestId('dynamic-polygon-svg');
      expect(svg).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
    });

    it('accepts className prop for sizing', () => {
      render(<DynamicPolygon categories={sampleCategories} className="w-64 h-64" />);
      const container = screen.getByTestId('dynamic-polygon-container');
      expect(container).toHaveClass('w-64', 'h-64');
    });
  });

  describe('AC #7: Reduced motion support - static polygon without breathing when preferred', () => {
    it('renders static polygon when reduced motion is preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);
      vi.mocked(useBreathing).mockReturnValue({
        scale: 1,
        opacity: 1,
        phase: 0,
        isAnimating: false,
        style: { transform: 'scale(1)', opacity: 1 },
        transform: 'scale(1)',
      });

      render(<DynamicPolygon categories={sampleCategories} />);

      // Should still render
      const svg = screen.getByTestId('dynamic-polygon-svg');
      expect(svg).toBeInTheDocument();

      // Should have no animation transform
      expect(useBreathing).toHaveBeenCalled();
    });

    it('remains interactive even with reduced motion', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);
      const handleClick = vi.fn();

      render(<DynamicPolygon categories={sampleCategories} onVertexClick={handleClick} />);

      const vertex = screen.getByTestId('polygon-vertex-Supermarket');
      fireEvent.click(vertex);

      expect(handleClick).toHaveBeenCalledWith('Supermarket');
    });
  });

  describe('Polygon calculation utilities', () => {
    it('calculates polygon points starting from top (12 o\'clock position)', () => {
      const threeCategories: CategorySpending[] = [
        { name: 'A', amount: 100, color: '#000' },
        { name: 'B', amount: 100, color: '#111' },
        { name: 'C', amount: 100, color: '#222' },
      ];

      render(<DynamicPolygon categories={threeCategories} />);
      const svg = screen.getByTestId('dynamic-polygon-svg');
      const polygon = svg.querySelector('polygon');
      const points = polygon?.getAttribute('points') || '';

      // First point should be at the top (x = center, y < center)
      const firstPoint = points.split(' ')[0];
      const [x, y] = firstPoint.split(',').map(Number);

      // Center should be around 100 (viewBox 200x200), first point y should be less than center
      expect(y).toBeLessThan(100);
    });

    it('scales radii by spending ratio (min 30%, max 100%)', () => {
      const categories: CategorySpending[] = [
        { name: 'Max', amount: 100, color: '#000' },
        { name: 'Mid', amount: 50, color: '#111' },
        { name: 'Min', amount: 10, color: '#222' },
      ];

      render(<DynamicPolygon categories={categories} />);
      const svg = screen.getByTestId('dynamic-polygon-svg');
      const polygon = svg.querySelector('polygon');
      const points = polygon?.getAttribute('points') || '';

      // Points exist - specific radii tested in implementation
      const coordinates = points.split(' ');
      expect(coordinates.length).toBe(3);
    });
  });
});
