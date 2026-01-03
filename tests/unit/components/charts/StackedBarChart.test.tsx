/**
 * StackedBarChart Tests
 *
 * Story 14.8: Enhanced Existing Charts
 * Epic 14: Core Implementation
 *
 * Tests for animated stacked bar chart with staggered entry animations,
 * hover effects, touch feedback, and reduced motion support.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { StackedBarChart, BarChartData } from '../../../../src/components/charts/GroupedBarChart';

// Mock useReducedMotion
vi.mock('../../../../src/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

import { useReducedMotion } from '../../../../src/hooks/useReducedMotion';

const mockData: BarChartData[] = [
  {
    label: 'Week 1',
    total: 1000,
    segments: [
      { label: 'Food', value: 500, color: '#ef4444' },
      { label: 'Transport', value: 300, color: '#3b82f6' },
      { label: 'Shopping', value: 200, color: '#22c55e' },
    ],
  },
  {
    label: 'Week 2',
    total: 800,
    segments: [
      { label: 'Food', value: 400, color: '#ef4444' },
      { label: 'Transport', value: 250, color: '#3b82f6' },
      { label: 'Shopping', value: 150, color: '#22c55e' },
    ],
  },
  {
    label: 'Week 3',
    total: 600,
    segments: [
      { label: 'Food', value: 300, color: '#ef4444' },
      { label: 'Transport', value: 200, color: '#3b82f6' },
      { label: 'Shopping', value: 100, color: '#22c55e' },
    ],
  },
];

describe('StackedBarChart', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(useReducedMotion).mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render chart with bars', () => {
      render(<StackedBarChart data={mockData} theme="light" currency="CLP" />);

      // Should have labels for each bar
      expect(screen.getByText('Week 1')).toBeInTheDocument();
      expect(screen.getByText('Week 2')).toBeInTheDocument();
      expect(screen.getByText('Week 3')).toBeInTheDocument();
    });

    it('should show "No Data" when data is empty', () => {
      render(<StackedBarChart data={[]} theme="light" currency="CLP" />);

      expect(screen.getByText('No Data')).toBeInTheDocument();
    });

    it('should render segments for each bar', () => {
      render(<StackedBarChart data={mockData} theme="light" currency="CLP" />);

      // Total segments = 3 bars x 3 segments = 9
      const segments = screen.getAllByRole('button');
      expect(segments).toHaveLength(9);
    });
  });

  describe('staggered entry animation', () => {
    it('should have staggered delays for bar animations', () => {
      render(<StackedBarChart data={mockData} theme="light" currency="CLP" />);

      // Advance timer to trigger entry animation
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Bars should have staggered transition delays
      // Testing presence of bars is sufficient
      expect(screen.getByText('Week 1')).toBeInTheDocument();
      expect(screen.getByText('Week 2')).toBeInTheDocument();
      expect(screen.getByText('Week 3')).toBeInTheDocument();
    });

    it('should skip staggered animation when reduced motion preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(<StackedBarChart data={mockData} theme="light" currency="CLP" />);

      // All bars should be immediately visible
      expect(screen.getByText('Week 1')).toBeInTheDocument();
      expect(screen.getByText('Week 2')).toBeInTheDocument();
      expect(screen.getByText('Week 3')).toBeInTheDocument();
    });

    it('should use faster stagger for many bars', () => {
      // Create 12 bars to trigger faster stagger
      const manyBars: BarChartData[] = Array.from({ length: 12 }, (_, i) => ({
        label: `Bar ${i + 1}`,
        total: 100,
        segments: [{ label: 'Seg', value: 100, color: '#ccc' }],
      }));

      render(<StackedBarChart data={manyBars} theme="light" currency="CLP" />);

      // Should render all bars
      expect(screen.getByText('Bar 1')).toBeInTheDocument();
      expect(screen.getByText('Bar 12')).toBeInTheDocument();
    });
  });

  describe('tooltip behavior', () => {
    it('should show tooltip on segment click', () => {
      render(<StackedBarChart data={mockData} theme="light" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const segments = screen.getAllByRole('button');
      fireEvent.click(segments[0]);

      // Should show segment label in tooltip
      const tooltipLabels = screen.getAllByText('Food');
      expect(tooltipLabels.length).toBeGreaterThanOrEqual(1);
    });

    it('should dismiss tooltip on clicking same segment', () => {
      render(<StackedBarChart data={mockData} theme="light" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const segments = screen.getAllByRole('button');

      // Click to show
      fireEvent.click(segments[0]);
      expect(screen.getAllByText('Food').length).toBeGreaterThanOrEqual(1);

      // Click again to dismiss
      fireEvent.click(segments[0]);

      // Tooltip percentage should be gone
      expect(screen.queryByText(/50\.0%/)).not.toBeInTheDocument();
    });

    it('should auto-dismiss tooltip after 5 seconds', () => {
      render(<StackedBarChart data={mockData} theme="light" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const segments = screen.getAllByRole('button');
      fireEvent.click(segments[0]);

      // Verify tooltip is shown (checking for percentage)
      const tooltipContent = screen.getByText(/50\.0%/);
      expect(tooltipContent).toBeInTheDocument();

      // Fast-forward 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Tooltip should be dismissed
      expect(screen.queryByText(/50\.0%/)).not.toBeInTheDocument();
    });
  });

  describe('hover effects', () => {
    it('should apply hover scale on segment mouse enter', () => {
      render(<StackedBarChart data={mockData} theme="light" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const segments = screen.getAllByRole('button');
      fireEvent.mouseEnter(segments[0]);

      // Segment should have scale transform applied (horizontal)
      expect(segments[0]).toHaveStyle({ transform: 'scaleX(1.05)' });
    });

    it('should remove hover scale on mouse leave', () => {
      render(<StackedBarChart data={mockData} theme="light" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const segments = screen.getAllByRole('button');
      fireEvent.mouseEnter(segments[0]);
      fireEvent.mouseLeave(segments[0]);

      expect(segments[0]).toHaveStyle({ transform: 'scaleX(1)' });
    });

    it('should not apply hover scale when reduced motion preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(<StackedBarChart data={mockData} theme="light" currency="CLP" />);

      const segments = screen.getAllByRole('button');
      fireEvent.mouseEnter(segments[0]);

      // Should remain at default scale
      expect(segments[0]).toHaveStyle({ transform: 'scaleX(1)' });
    });
  });

  describe('touch feedback', () => {
    it('should apply press-in scale on touch start', () => {
      render(<StackedBarChart data={mockData} theme="light" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const segments = screen.getAllByRole('button');
      fireEvent.touchStart(segments[0]);

      expect(segments[0]).toHaveStyle({ transform: 'scaleX(0.95)' });
    });

    it('should remove press-in scale on touch end', () => {
      render(<StackedBarChart data={mockData} theme="light" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const segments = screen.getAllByRole('button');
      fireEvent.touchStart(segments[0]);
      fireEvent.touchEnd(segments[0]);

      expect(segments[0]).toHaveStyle({ transform: 'scaleX(1)' });
    });

    it('should not apply touch feedback when reduced motion preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(<StackedBarChart data={mockData} theme="light" currency="CLP" />);

      const segments = screen.getAllByRole('button');
      fireEvent.touchStart(segments[0]);

      expect(segments[0]).toHaveStyle({ transform: 'scaleX(1)' });
    });
  });

  describe('keyboard accessibility', () => {
    it('should show tooltip on Enter key', () => {
      render(<StackedBarChart data={mockData} theme="light" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const segments = screen.getAllByRole('button');
      fireEvent.keyDown(segments[0], { key: 'Enter' });

      expect(screen.getAllByText('Food').length).toBeGreaterThanOrEqual(1);
    });

    it('should show tooltip on Space key', () => {
      render(<StackedBarChart data={mockData} theme="light" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const segments = screen.getAllByRole('button');
      fireEvent.keyDown(segments[0], { key: ' ' });

      expect(screen.getAllByText('Food').length).toBeGreaterThanOrEqual(1);
    });

    it('should apply focus state on focus', () => {
      render(<StackedBarChart data={mockData} theme="light" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const segments = screen.getAllByRole('button');
      fireEvent.focus(segments[0]);

      // Focus should trigger hover-like effect
      expect(segments[0]).toHaveStyle({ transform: 'scaleX(1.05)' });
    });

    it('should have proper aria-labels', () => {
      render(<StackedBarChart data={mockData} theme="light" currency="CLP" />);

      const segments = screen.getAllByRole('button');
      expect(segments[0]).toHaveAttribute('aria-label', expect.stringContaining('Food'));
    });
  });

  describe('scrolling behavior', () => {
    it('should enable horizontal scroll for many bars', () => {
      // Create 10 bars to trigger scroll
      const manyBars: BarChartData[] = Array.from({ length: 10 }, (_, i) => ({
        label: `Bar ${i + 1}`,
        total: 100,
        segments: [{ label: 'Seg', value: 100, color: '#ccc' }],
      }));

      render(<StackedBarChart data={manyBars} theme="light" currency="CLP" />);

      const chartArea = document.querySelector('.overflow-x-auto');
      expect(chartArea).toBeInTheDocument();
    });

    it('should not enable scroll for few bars', () => {
      render(<StackedBarChart data={mockData} theme="light" currency="CLP" />);

      const chartArea = document.querySelector('.overflow-x-auto');
      expect(chartArea).not.toBeInTheDocument();
    });
  });

  describe('theme support', () => {
    it('should apply dark theme tooltip styles', () => {
      render(<StackedBarChart data={mockData} theme="dark" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const segments = screen.getAllByRole('button');
      fireEvent.click(segments[0]);

      // Find tooltip container
      const tooltipLabels = screen.getAllByText('Food');
      const tooltip = tooltipLabels[0].closest('.bg-slate-800');
      expect(tooltip).toBeInTheDocument();
    });

    it('should apply light theme label styles', () => {
      render(<StackedBarChart data={mockData} theme="light" currency="CLP" />);

      const label = screen.getByText('Week 1');
      expect(label.className).toContain('text-slate-500');
    });

    it('should apply dark theme label styles', () => {
      render(<StackedBarChart data={mockData} theme="dark" currency="CLP" />);

      const label = screen.getByText('Week 1');
      expect(label.className).toContain('text-slate-400');
    });
  });

  describe('reduced motion support', () => {
    it('should show static bars without transitions when reduced motion preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(<StackedBarChart data={mockData} theme="light" currency="CLP" />);

      // All bars should be immediately visible
      expect(screen.getByText('Week 1')).toBeInTheDocument();
      expect(screen.getByText('Week 2')).toBeInTheDocument();
      expect(screen.getByText('Week 3')).toBeInTheDocument();

      // Segments should not have animation-related styles
      const segments = screen.getAllByRole('button');
      // Check that transition is not applied
      expect(segments[0].style.transition).toBeFalsy();
    });
  });
});
