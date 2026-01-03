/**
 * Tests for PageTransition Component
 *
 * Story 14.2: Screen Transition System
 * Epic 14: Core Implementation
 *
 * Tests screen transition animations including:
 * - Basic rendering and transitions (AC #1)
 * - Settings screen exception (AC #3)
 * - Duration configuration (AC #4)
 * - Navigation direction (AC #5)
 * - Reduced motion accessibility (AC #6)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { PageTransition } from '../../../../src/components/animation/PageTransition';

// Mock useReducedMotion
vi.mock('../../../../src/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

import { useReducedMotion } from '../../../../src/hooks/useReducedMotion';

describe('PageTransition', () => {
  beforeEach(() => {
    vi.mocked(useReducedMotion).mockReturnValue(false);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('basic rendering (AC #1)', () => {
    it('should render children', () => {
      render(
        <PageTransition viewKey="dashboard">
          <div data-testid="content">Dashboard Content</div>
        </PageTransition>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    it('should apply page-transition class', () => {
      render(
        <PageTransition viewKey="dashboard">
          <div>Content</div>
        </PageTransition>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveClass('page-transition');
    });

    it('should set data-view attribute', () => {
      render(
        <PageTransition viewKey="trends">
          <div>Content</div>
        </PageTransition>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveAttribute('data-view', 'trends');
    });
  });

  describe('animation on view change', () => {
    it('should trigger animation when viewKey changes', () => {
      const { rerender } = render(
        <PageTransition viewKey="dashboard">
          <div>Content</div>
        </PageTransition>
      );

      // Change view
      rerender(
        <PageTransition viewKey="trends">
          <div>Content</div>
        </PageTransition>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveAttribute('data-animating', 'true');
    });

    it('should call onTransitionStart when animation begins', () => {
      const onStart = vi.fn();
      const { rerender } = render(
        <PageTransition viewKey="dashboard" onTransitionStart={onStart}>
          <div>Content</div>
        </PageTransition>
      );

      rerender(
        <PageTransition viewKey="trends" onTransitionStart={onStart}>
          <div>Content</div>
        </PageTransition>
      );

      expect(onStart).toHaveBeenCalledTimes(1);
    });

    it('should call onTransitionEnd after duration', () => {
      const onEnd = vi.fn();
      const duration = 300;
      const { rerender } = render(
        <PageTransition viewKey="dashboard" duration={duration} onTransitionEnd={onEnd}>
          <div>Content</div>
        </PageTransition>
      );

      rerender(
        <PageTransition viewKey="trends" duration={duration} onTransitionEnd={onEnd}>
          <div>Content</div>
        </PageTransition>
      );

      expect(onEnd).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(duration);
      });

      expect(onEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe('navigation direction (AC #5)', () => {
    it('should apply forward direction by default', () => {
      const { rerender } = render(
        <PageTransition viewKey="dashboard">
          <div>Content</div>
        </PageTransition>
      );

      rerender(
        <PageTransition viewKey="trends">
          <div>Content</div>
        </PageTransition>
      );

      const container = screen.getByText('Content').parentElement;
      const style = container?.getAttribute('style') || '';
      // Forward = slide from right (positive translateX)
      expect(style).toContain('--translate-start');
    });

    it('should respect back direction for slide from left', () => {
      const { rerender } = render(
        <PageTransition viewKey="trends" direction="back">
          <div>Content</div>
        </PageTransition>
      );

      rerender(
        <PageTransition viewKey="dashboard" direction="back">
          <div>Content</div>
        </PageTransition>
      );

      const container = screen.getByText('Content').parentElement;
      const style = container?.getAttribute('style') || '';
      expect(style).toContain('-30px'); // Negative for back
    });

    it('should handle none direction with fade only (no slide)', () => {
      const { rerender } = render(
        <PageTransition viewKey="dashboard" direction="none">
          <div>Content</div>
        </PageTransition>
      );

      // Change view with direction="none"
      rerender(
        <PageTransition viewKey="trends" direction="none">
          <div>Content</div>
        </PageTransition>
      );

      const container = screen.getByText('Content').parentElement;
      const style = container?.getAttribute('style') || '';
      // Should use fade animation, not slide
      expect(style).toContain('pageTransitionFade');
      expect(style).not.toContain('--translate-start');
    });
  });

  describe('Settings exception (AC #3)', () => {
    it('should skip animation for settings viewKey', () => {
      const { rerender } = render(
        <PageTransition viewKey="dashboard">
          <div>Content</div>
        </PageTransition>
      );

      rerender(
        <PageTransition viewKey="settings">
          <div>Content</div>
        </PageTransition>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveAttribute('data-animating', 'false');
    });

    it('should skip animation for Settings (case insensitive)', () => {
      const { rerender } = render(
        <PageTransition viewKey="dashboard">
          <div>Content</div>
        </PageTransition>
      );

      rerender(
        <PageTransition viewKey="Settings">
          <div>Content</div>
        </PageTransition>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveAttribute('data-animating', 'false');
    });

    it('should respect explicit skipAnimation prop', () => {
      const { rerender } = render(
        <PageTransition viewKey="dashboard">
          <div>Content</div>
        </PageTransition>
      );

      rerender(
        <PageTransition viewKey="trends" skipAnimation>
          <div>Content</div>
        </PageTransition>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveAttribute('data-animating', 'false');
    });
  });

  describe('duration configuration (AC #4)', () => {
    it('should use default duration of 300ms', () => {
      const onEnd = vi.fn();
      const { rerender } = render(
        <PageTransition viewKey="dashboard" onTransitionEnd={onEnd}>
          <div>Content</div>
        </PageTransition>
      );

      rerender(
        <PageTransition viewKey="trends" onTransitionEnd={onEnd}>
          <div>Content</div>
        </PageTransition>
      );

      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(onEnd).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onEnd).toHaveBeenCalled();
    });

    it('should respect custom duration', () => {
      const onEnd = vi.fn();
      const { rerender } = render(
        <PageTransition viewKey="dashboard" duration={500} onTransitionEnd={onEnd}>
          <div>Content</div>
        </PageTransition>
      );

      rerender(
        <PageTransition viewKey="trends" duration={500} onTransitionEnd={onEnd}>
          <div>Content</div>
        </PageTransition>
      );

      act(() => {
        vi.advanceTimersByTime(499);
      });
      expect(onEnd).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onEnd).toHaveBeenCalled();
    });
  });

  describe('reduced motion (AC #6)', () => {
    it('should skip animation when reduced motion is preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      const { rerender } = render(
        <PageTransition viewKey="dashboard">
          <div>Content</div>
        </PageTransition>
      );

      rerender(
        <PageTransition viewKey="trends">
          <div>Content</div>
        </PageTransition>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveAttribute('data-animating', 'false');
    });

    it('should not call onTransitionStart when reduced motion', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);
      const onStart = vi.fn();

      const { rerender } = render(
        <PageTransition viewKey="dashboard" onTransitionStart={onStart}>
          <div>Content</div>
        </PageTransition>
      );

      rerender(
        <PageTransition viewKey="trends" onTransitionStart={onStart}>
          <div>Content</div>
        </PageTransition>
      );

      expect(onStart).not.toHaveBeenCalled();
    });
  });

  describe('custom styling', () => {
    it('should apply custom className', () => {
      render(
        <PageTransition viewKey="dashboard" className="custom-class">
          <div>Content</div>
        </PageTransition>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveClass('page-transition');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('edge cases', () => {
    it('should not animate when viewKey stays the same', () => {
      const onStart = vi.fn();
      const { rerender } = render(
        <PageTransition viewKey="dashboard" onTransitionStart={onStart}>
          <div>Content</div>
        </PageTransition>
      );

      rerender(
        <PageTransition viewKey="dashboard" onTransitionStart={onStart}>
          <div>Updated Content</div>
        </PageTransition>
      );

      expect(onStart).not.toHaveBeenCalled();
    });
  });
});
