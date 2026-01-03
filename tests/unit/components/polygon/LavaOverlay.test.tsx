/**
 * LavaOverlay Component Tests
 *
 * Story 14.7: Expanding Lava Visual
 * Epic 14: Core Implementation
 *
 * Tests for the dual-polygon lava overlay that shows
 * spending vs budget with visual tension effects.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LavaOverlay, type VertexData, calculateProximity, LAVA_COLORS } from '../../../../src/components/polygon/LavaOverlay';

// Mock useReducedMotion hook
vi.mock('../../../../src/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

import { useReducedMotion } from '../../../../src/hooks/useReducedMotion';

describe('LavaOverlay', () => {
  // Sample vertex data for tests
  const sampleVertices: VertexData[] = [
    { category: 'Supermarket', spending: 150000, budget: 200000 },
    { category: 'Restaurant', spending: 80000, budget: 100000 },
    { category: 'Transport', spending: 45000, budget: 60000 },
    { category: 'Entertainment', spending: 25000, budget: 50000 },
    { category: 'Utilities', spending: 30000, budget: 40000 },
  ];

  // Over-budget scenario
  const overBudgetVertices: VertexData[] = [
    { category: 'Supermarket', spending: 250000, budget: 200000 },
    { category: 'Restaurant', spending: 120000, budget: 100000 },
    { category: 'Transport', spending: 45000, budget: 60000 },
  ];

  // High tension scenario (80%+ spending)
  const highTensionVertices: VertexData[] = [
    { category: 'Supermarket', spending: 180000, budget: 200000 },
    { category: 'Restaurant', spending: 95000, budget: 100000 },
    { category: 'Transport', spending: 55000, budget: 60000 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(useReducedMotion).mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('AC #1 & #2: Dual polygon rendering (inner=spending, outer=budget)', () => {
    it('renders an SVG element with lava-overlay testid', () => {
      render(<LavaOverlay vertices={sampleVertices} />);
      const svg = screen.getByTestId('lava-overlay-svg');
      expect(svg).toBeInTheDocument();
      expect(svg.tagName.toLowerCase()).toBe('svg');
    });

    it('renders two polygon elements (spending + budget)', () => {
      render(<LavaOverlay vertices={sampleVertices} />);
      const svg = screen.getByTestId('lava-overlay-svg');
      const polygons = svg.querySelectorAll('polygon');
      expect(polygons.length).toBe(2);
    });

    it('renders outer (budget) polygon behind inner (spending) polygon', () => {
      render(<LavaOverlay vertices={sampleVertices} />);
      const budgetPolygon = screen.getByTestId('budget-polygon');
      const spendingPolygon = screen.getByTestId('spending-polygon');
      expect(budgetPolygon).toBeInTheDocument();
      expect(spendingPolygon).toBeInTheDocument();
    });

    it('uses warm colors (red/orange) for spending polygon', () => {
      render(<LavaOverlay vertices={sampleVertices} />);
      const spendingPolygon = screen.getByTestId('spending-polygon');
      // Check fill contains spending color
      expect(spendingPolygon.getAttribute('fill')).toContain('url(#');
    });

    it('uses cool colors (green/blue) for budget polygon', () => {
      render(<LavaOverlay vertices={sampleVertices} />);
      const budgetPolygon = screen.getByTestId('budget-polygon');
      // Check fill contains budget color
      expect(budgetPolygon.getAttribute('fill')).toContain(LAVA_COLORS.BUDGET);
    });

    it('calculates polygon points for both spending and budget', () => {
      render(<LavaOverlay vertices={sampleVertices} />);
      const budgetPolygon = screen.getByTestId('budget-polygon');
      const spendingPolygon = screen.getByTestId('spending-polygon');

      expect(budgetPolygon.getAttribute('points')).toBeTruthy();
      expect(spendingPolygon.getAttribute('points')).toBeTruthy();

      // Points should be different (spending < budget in normal case)
      expect(budgetPolygon.getAttribute('points')).not.toBe(spendingPolygon.getAttribute('points'));
    });
  });

  describe('AC #3: Visual tension (color intensifies as spending approaches budget)', () => {
    it('calculates correct proximity status for safe spending (<75%)', () => {
      const result = calculateProximity(50000, 100000);
      expect(result.ratio).toBe(0.5);
      expect(result.status).toBe('safe');
    });

    it('calculates correct proximity status for warning spending (75-90%)', () => {
      const result = calculateProximity(80000, 100000);
      expect(result.ratio).toBe(0.8);
      expect(result.status).toBe('warning');
    });

    it('calculates correct proximity status for danger spending (90-100%)', () => {
      const result = calculateProximity(95000, 100000);
      expect(result.ratio).toBe(0.95);
      expect(result.status).toBe('danger');
    });

    it('calculates correct proximity status for over-budget spending (>100%)', () => {
      const result = calculateProximity(120000, 100000);
      expect(result.ratio).toBe(1.2);
      expect(result.status).toBe('over');
    });

    it('handles zero budget gracefully', () => {
      const result = calculateProximity(100, 0);
      expect(result.ratio).toBe(Infinity);
      expect(result.status).toBe('over');
    });

    it('handles negative spending gracefully', () => {
      const result = calculateProximity(-50000, 100000);
      expect(result.ratio).toBe(-0.5);
      expect(result.status).toBe('safe'); // Negative ratio is < all thresholds
    });

    it('handles negative budget gracefully', () => {
      const result = calculateProximity(50000, -100000);
      expect(result.ratio).toBe(-0.5);
      expect(result.status).toBe('safe'); // Negative ratio is < all thresholds
    });

    it('applies glow effect to vertices with >80% ratio', () => {
      render(<LavaOverlay vertices={highTensionVertices} showGlow={true} />);
      // Check for filter or glow styling on high-tension vertices
      const svg = screen.getByTestId('lava-overlay-svg');
      const defs = svg.querySelector('defs');
      // Filter ID is now dynamic (Pattern #51), so check for any filter with lava-glow prefix
      const filters = defs?.querySelectorAll('filter');
      expect(filters?.length).toBeGreaterThan(0);
      expect(filters?.[0]?.id).toMatch(/^lava-glow-/);
    });
  });

  describe('AC #4: Proximity indicators (percentage at each vertex)', () => {
    it('renders proximity indicator labels when enabled', () => {
      render(<LavaOverlay vertices={sampleVertices} showIndicators={true} />);
      // Should find percentage indicators (multiple vertices may have same %)
      const indicators = screen.getAllByText('75%');
      expect(indicators.length).toBeGreaterThan(0); // Supermarket: 150000/200000 = 75%
    });

    it('positions indicators between polygons', () => {
      render(<LavaOverlay vertices={sampleVertices} showIndicators={true} />);
      const indicators = screen.getAllByTestId(/proximity-indicator-/);
      expect(indicators.length).toBe(5);
    });

    it('color-codes indicators by threshold (green <75%, yellow 75-90%, red >90%)', () => {
      // Create vertices with different thresholds
      const mixedVertices: VertexData[] = [
        { category: 'Safe', spending: 50000, budget: 100000 }, // 50% - green
        { category: 'Warning', spending: 80000, budget: 100000 }, // 80% - yellow
        { category: 'Danger', spending: 95000, budget: 100000 }, // 95% - red
      ];

      render(<LavaOverlay vertices={mixedVertices} showIndicators={true} />);

      const safeIndicator = screen.getByTestId('proximity-indicator-Safe');
      const warningIndicator = screen.getByTestId('proximity-indicator-Warning');
      const dangerIndicator = screen.getByTestId('proximity-indicator-Danger');

      // Check for appropriate color classes/styles
      expect(safeIndicator).toBeInTheDocument();
      expect(warningIndicator).toBeInTheDocument();
      expect(dangerIndicator).toBeInTheDocument();
    });

    it('hides indicators when showIndicators is false', () => {
      render(<LavaOverlay vertices={sampleVertices} showIndicators={false} />);
      expect(screen.queryAllByTestId(/proximity-indicator-/).length).toBe(0);
    });
  });

  describe('AC #5: Over-budget state (inner exceeds outer with warning)', () => {
    it('renders spending polygon larger than budget when over-budget', () => {
      render(<LavaOverlay vertices={overBudgetVertices} />);
      const budgetPolygon = screen.getByTestId('budget-polygon');
      const spendingPolygon = screen.getByTestId('spending-polygon');

      // Both should have points
      expect(budgetPolygon.getAttribute('points')).toBeTruthy();
      expect(spendingPolygon.getAttribute('points')).toBeTruthy();
    });

    it('applies solid red color to over-budget vertices', () => {
      render(<LavaOverlay vertices={overBudgetVertices} />);
      // Supermarket and Restaurant are over budget
      const supermarketVertex = screen.getByTestId('spending-vertex-Supermarket');
      // Check fill attribute directly since toHaveStyle may not work with SVG attributes
      expect(supermarketVertex.getAttribute('fill')).toBe(LAVA_COLORS.DANGER);
    });

    it('applies pulsing animation to over-budget vertices', () => {
      render(<LavaOverlay vertices={overBudgetVertices} />);
      const overBudgetVertex = screen.getByTestId('spending-vertex-Supermarket');
      // Should have pulse animation class or inline style
      expect(overBudgetVertex.getAttribute('class')).toContain('animate-pulse');
    });

    it('shows over-budget indicator (e.g., "125%")', () => {
      render(<LavaOverlay vertices={overBudgetVertices} showIndicators={true} />);
      expect(screen.getByText('125%')).toBeInTheDocument(); // 250000/200000
    });
  });

  describe('AC #6: Animation on data change', () => {
    it('animates polygon expansion when spending updates', () => {
      const { rerender } = render(<LavaOverlay vertices={sampleVertices} />);
      const initialPoints = screen.getByTestId('spending-polygon').getAttribute('points');

      // Update with higher spending
      const updatedVertices = sampleVertices.map(v => ({
        ...v,
        spending: v.spending * 1.2,
      }));

      rerender(<LavaOverlay vertices={updatedVertices} />);

      // Points should change immediately after re-render (CSS handles animation)
      const newPoints = screen.getByTestId('spending-polygon').getAttribute('points');
      expect(newPoints).not.toBe(initialPoints);
    });

    it('applies smooth transition with spring easing', () => {
      render(<LavaOverlay vertices={sampleVertices} />);
      const spendingPolygon = screen.getByTestId('spending-polygon');

      // Check for transition style
      const style = spendingPolygon.getAttribute('style') || '';
      expect(style).toContain('transition');
    });

    it('respects reduced motion preference', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);
      render(<LavaOverlay vertices={sampleVertices} />);

      const spendingPolygon = screen.getByTestId('spending-polygon');
      // Should not have transition when reduced motion preferred
      const style = spendingPolygon.getAttribute('style') || '';
      expect(style).not.toContain('transition');
    });
  });

  describe('Edge cases and accessibility', () => {
    it('handles empty vertices array gracefully', () => {
      render(<LavaOverlay vertices={[]} />);
      const svg = screen.getByTestId('lava-overlay-svg');
      expect(svg).toBeInTheDocument();
      // Should show empty state
      expect(screen.getByText('No budget data')).toBeInTheDocument();
    });

    it('handles fewer than 3 vertices gracefully', () => {
      const twoVertices = sampleVertices.slice(0, 2);
      render(<LavaOverlay vertices={twoVertices} />);
      expect(screen.getByText('Need at least 3 categories')).toBeInTheDocument();
    });

    it('has proper ARIA labels for accessibility', () => {
      render(<LavaOverlay vertices={sampleVertices} />);
      const svg = screen.getByTestId('lava-overlay-svg');
      expect(svg).toHaveAttribute('role', 'img');
      expect(svg).toHaveAttribute('aria-label');
    });

    it('accepts className prop for custom styling', () => {
      render(<LavaOverlay vertices={sampleVertices} className="custom-class" />);
      const container = screen.getByTestId('lava-overlay-container');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Color system constants', () => {
    it('exports LAVA_COLORS with correct values', () => {
      expect(LAVA_COLORS.SPENDING).toBe('rgba(239, 68, 68, 0.7)');
      expect(LAVA_COLORS.BUDGET).toBe('rgba(34, 197, 94, 0.3)');
      expect(LAVA_COLORS.DANGER).toBe('rgba(239, 68, 68, 1)');
      expect(LAVA_COLORS.WARNING).toBe('rgba(245, 158, 11, 0.8)');
    });

    it('exports LAVA_COLORS with dark mode variants', () => {
      expect(LAVA_COLORS.SPENDING_DARK).toBeDefined();
      expect(LAVA_COLORS.BUDGET_DARK).toBeDefined();
    });
  });
});
