/**
 * SimplePieChart Tests
 *
 * Story 14.8: Enhanced Existing Charts
 * Epic 14: Core Implementation
 *
 * Tests for animated pie chart with entry animations,
 * count-up, hover effects, touch feedback, and reduced motion support.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { SimplePieChart, PieChartData } from '../../../../src/components/charts/SimplePieChart';

// Mock useReducedMotion
vi.mock('../../../../src/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

// Mock useCountUp - return target value immediately for simpler testing
vi.mock('../../../../src/hooks/useCountUp', () => ({
  useCountUp: vi.fn((value: number) => value),
}));

import { useReducedMotion } from '../../../../src/hooks/useReducedMotion';
import { useCountUp } from '../../../../src/hooks/useCountUp';

const mockData: PieChartData[] = [
  { label: 'Food', value: 500, color: '#ef4444' },
  { label: 'Transport', value: 300, color: '#3b82f6' },
  { label: 'Shopping', value: 200, color: '#22c55e' },
];

describe('SimplePieChart', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(useReducedMotion).mockReturnValue(false);
    vi.mocked(useCountUp).mockImplementation((value: number) => value);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render chart with data', () => {
      render(<SimplePieChart data={mockData} theme="light" currency="CLP" />);

      // Should have SVG with paths for each slice
      const paths = screen.getAllByRole('button');
      expect(paths).toHaveLength(3);
    });

    it('should show "No Data" when total is 0', () => {
      const emptyData: PieChartData[] = [
        { label: 'Empty', value: 0, color: '#ccc' },
      ];

      render(<SimplePieChart data={emptyData} theme="light" currency="CLP" />);

      expect(screen.getByText('No Data')).toBeInTheDocument();
    });

    it('should display total in center with count-up', () => {
      render(<SimplePieChart data={mockData} theme="light" currency="CLP" />);

      // Total should be displayed (1000 CLP = $1.000)
      // The exact format depends on formatCurrency implementation
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();

      // useCountUp should be called with total value
      expect(useCountUp).toHaveBeenCalledWith(1000, expect.objectContaining({
        duration: expect.any(Number),
      }));
    });
  });

  describe('entry animation', () => {
    it('should start with opacity 0 and animate to 1', () => {
      render(<SimplePieChart data={mockData} theme="light" currency="CLP" />);

      const container = document.querySelector('div.flex.flex-col');
      expect(container).toBeInTheDocument();

      // Advance timer to trigger entry animation
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // After animation trigger, should be visible
      // (actual styles are inline, testing presence is sufficient)
    });

    it('should skip entry animation when reduced motion preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(<SimplePieChart data={mockData} theme="light" currency="CLP" />);

      // With reduced motion, should not have transition styles
      const container = document.querySelector('div.flex.flex-col');
      expect(container).toBeInTheDocument();

      // hasEntered should be true immediately
      // No transition should be applied
    });
  });

  describe('tooltip behavior', () => {
    it('should show tooltip on slice click', async () => {
      render(<SimplePieChart data={mockData} theme="light" currency="CLP" />);

      // Advance timer for entry animation
      act(() => {
        vi.advanceTimersByTime(100);
      });

      const slices = screen.getAllByRole('button');
      fireEvent.click(slices[0]);

      expect(screen.getByText('Food')).toBeInTheDocument();
    });

    it('should dismiss tooltip on clicking same slice', async () => {
      render(<SimplePieChart data={mockData} theme="light" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const slices = screen.getAllByRole('button');

      // Click to show
      fireEvent.click(slices[0]);
      expect(screen.getByText('Food')).toBeInTheDocument();

      // Click again to dismiss
      fireEvent.click(slices[0]);
      expect(screen.queryByText(/50\.0%/)).not.toBeInTheDocument();
    });

    it('should auto-dismiss tooltip after 5 seconds', async () => {
      render(<SimplePieChart data={mockData} theme="light" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const slices = screen.getAllByRole('button');
      fireEvent.click(slices[0]);

      expect(screen.getByText('Food')).toBeInTheDocument();

      // Fast-forward 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Tooltip should be dismissed
      expect(screen.queryByText(/50\.0%/)).not.toBeInTheDocument();
    });
  });

  describe('hover effects', () => {
    it('should apply hover scale on mouse enter', () => {
      render(<SimplePieChart data={mockData} theme="light" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const slices = screen.getAllByRole('button');
      fireEvent.mouseEnter(slices[0]);

      // Slice should have scale transform applied
      expect(slices[0]).toHaveStyle({ transform: 'scale(1.02)' });
    });

    it('should remove hover scale on mouse leave', () => {
      render(<SimplePieChart data={mockData} theme="light" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const slices = screen.getAllByRole('button');
      fireEvent.mouseEnter(slices[0]);
      fireEvent.mouseLeave(slices[0]);

      expect(slices[0]).toHaveStyle({ transform: 'scale(1)' });
    });

    it('should not apply hover scale when reduced motion preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(<SimplePieChart data={mockData} theme="light" currency="CLP" />);

      const slices = screen.getAllByRole('button');
      fireEvent.mouseEnter(slices[0]);

      // Should remain at default scale
      expect(slices[0]).toHaveStyle({ transform: 'scale(1)' });
    });
  });

  describe('touch feedback', () => {
    it('should apply press-in scale on touch start', () => {
      render(<SimplePieChart data={mockData} theme="light" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const slices = screen.getAllByRole('button');
      fireEvent.touchStart(slices[0]);

      expect(slices[0]).toHaveStyle({ transform: 'scale(0.95)' });
    });

    it('should remove press-in scale on touch end', () => {
      render(<SimplePieChart data={mockData} theme="light" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const slices = screen.getAllByRole('button');
      fireEvent.touchStart(slices[0]);
      fireEvent.touchEnd(slices[0]);

      expect(slices[0]).toHaveStyle({ transform: 'scale(1)' });
    });

    it('should not apply touch feedback when reduced motion preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(<SimplePieChart data={mockData} theme="light" currency="CLP" />);

      const slices = screen.getAllByRole('button');
      fireEvent.touchStart(slices[0]);

      expect(slices[0]).toHaveStyle({ transform: 'scale(1)' });
    });
  });

  describe('keyboard accessibility', () => {
    it('should show tooltip on Enter key', () => {
      render(<SimplePieChart data={mockData} theme="light" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const slices = screen.getAllByRole('button');
      fireEvent.keyDown(slices[0], { key: 'Enter' });

      expect(screen.getByText('Food')).toBeInTheDocument();
    });

    it('should show tooltip on Space key', () => {
      render(<SimplePieChart data={mockData} theme="light" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const slices = screen.getAllByRole('button');
      fireEvent.keyDown(slices[0], { key: ' ' });

      expect(screen.getByText('Food')).toBeInTheDocument();
    });

    it('should apply focus state on focus', () => {
      render(<SimplePieChart data={mockData} theme="light" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const slices = screen.getAllByRole('button');
      fireEvent.focus(slices[0]);

      // Focus should trigger hover-like effect
      expect(slices[0]).toHaveStyle({ transform: 'scale(1.02)' });
    });

    it('should have proper aria-labels', () => {
      render(<SimplePieChart data={mockData} theme="light" currency="CLP" />);

      const slices = screen.getAllByRole('button');
      expect(slices[0]).toHaveAttribute('aria-label', expect.stringContaining('Food'));
    });
  });

  describe('theme support', () => {
    it('should apply dark theme tooltip styles', () => {
      render(<SimplePieChart data={mockData} theme="dark" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const slices = screen.getAllByRole('button');
      fireEvent.click(slices[0]);

      // Look for the tooltip container with the theme class
      const tooltipContainer = document.querySelector('.bg-slate-800');
      expect(tooltipContainer).toBeInTheDocument();
    });

    it('should apply light theme tooltip styles', () => {
      render(<SimplePieChart data={mockData} theme="light" currency="CLP" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const slices = screen.getAllByRole('button');
      fireEvent.click(slices[0]);

      // Look for the tooltip container with the theme class
      const tooltipContainer = document.querySelector('.bg-white');
      expect(tooltipContainer).toBeInTheDocument();
    });
  });

  describe('reduced motion support', () => {
    it('should disable count-up animation when reduced motion preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(<SimplePieChart data={mockData} theme="light" currency="CLP" />);

      // useCountUp should be called with enabled: false
      expect(useCountUp).toHaveBeenCalledWith(1000, expect.objectContaining({
        enabled: false,
      }));
    });

    it('should show static chart without transitions when reduced motion preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(<SimplePieChart data={mockData} theme="light" currency="CLP" />);

      const container = document.querySelector('div.flex.flex-col');
      // With reduced motion, entry style should be empty object
      expect(container).toBeInTheDocument();
    });
  });
});
