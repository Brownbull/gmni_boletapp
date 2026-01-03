/**
 * Tests for TransitionChild Component
 *
 * Story 14.2: Screen Transition System
 * Epic 14: Core Implementation
 *
 * Tests staggered child animations including:
 * - Staggered delay calculation (AC #2)
 * - Max duration compression (AC #4)
 * - Reduced motion accessibility (AC #6)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransitionChild } from '../../../../src/components/animation/TransitionChild';
import { STAGGER, DURATION, EASING } from '../../../../src/components/animation/constants';

// Mock useReducedMotion
vi.mock('../../../../src/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

import { useReducedMotion } from '../../../../src/hooks/useReducedMotion';

describe('TransitionChild', () => {
  beforeEach(() => {
    vi.mocked(useReducedMotion).mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render children', () => {
      render(
        <TransitionChild index={0}>
          <div data-testid="child">Child Content</div>
        </TransitionChild>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should apply transition-child class', () => {
      render(
        <TransitionChild index={0}>
          <div>Content</div>
        </TransitionChild>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveClass('transition-child');
    });

    it('should set data-index attribute', () => {
      render(
        <TransitionChild index={5}>
          <div>Content</div>
        </TransitionChild>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveAttribute('data-index', '5');
    });
  });

  describe('staggered delay calculation (AC #2)', () => {
    it('should apply no delay for first item (index 0)', () => {
      render(
        <TransitionChild index={0} totalItems={5}>
          <div>First</div>
        </TransitionChild>
      );

      const container = screen.getByText('First').parentElement;
      expect(container).toHaveAttribute('data-delay', String(STAGGER.INITIAL_DELAY));
    });

    it('should apply increasing delay for subsequent items', () => {
      render(
        <>
          <TransitionChild index={0} totalItems={3}>
            <div>Item 0</div>
          </TransitionChild>
          <TransitionChild index={1} totalItems={3}>
            <div>Item 1</div>
          </TransitionChild>
          <TransitionChild index={2} totalItems={3}>
            <div>Item 2</div>
          </TransitionChild>
        </>
      );

      const item0 = screen.getByText('Item 0').parentElement;
      const item1 = screen.getByText('Item 1').parentElement;
      const item2 = screen.getByText('Item 2').parentElement;

      // Check delays are increasing
      const delay0 = parseInt(item0?.getAttribute('data-delay') || '0');
      const delay1 = parseInt(item1?.getAttribute('data-delay') || '0');
      const delay2 = parseInt(item2?.getAttribute('data-delay') || '0');

      expect(delay1).toBeGreaterThan(delay0);
      expect(delay2).toBeGreaterThan(delay1);
    });

    it('should respect custom staggerMs', () => {
      render(
        <>
          <TransitionChild index={0} totalItems={3} staggerMs={50}>
            <div>Item 0</div>
          </TransitionChild>
          <TransitionChild index={1} totalItems={3} staggerMs={50}>
            <div>Item 1</div>
          </TransitionChild>
        </>
      );

      const item0 = screen.getByText('Item 0').parentElement;
      const item1 = screen.getByText('Item 1').parentElement;

      const delay0 = parseInt(item0?.getAttribute('data-delay') || '0');
      const delay1 = parseInt(item1?.getAttribute('data-delay') || '0');

      expect(delay1 - delay0).toBe(50);
    });

    it('should respect initialDelayMs', () => {
      render(
        <TransitionChild index={0} totalItems={3} initialDelayMs={500}>
          <div>Item</div>
        </TransitionChild>
      );

      const container = screen.getByText('Item').parentElement;
      expect(container).toHaveAttribute('data-delay', '500');
    });
  });

  describe('compression for long lists (AC #4)', () => {
    it('should compress delays when exceeding maxDurationMs', () => {
      // 50 items with 100ms stagger + 300ms initial = 5200ms total
      // maxDurationMs = 2500ms default
      const items = Array.from({ length: 50 }, (_, i) => i);

      render(
        <>
          {items.map((i) => (
            <TransitionChild key={i} index={i} totalItems={50}>
              <div>Item {i}</div>
            </TransitionChild>
          ))}
        </>
      );

      const lastItem = screen.getByText('Item 49').parentElement;
      const lastDelay = parseInt(lastItem?.getAttribute('data-delay') || '0');

      // Last delay should be less than maxDurationMs
      expect(lastDelay).toBeLessThanOrEqual(STAGGER.MAX_DURATION);
    });

    it('should not compress when under maxDurationMs', () => {
      // 5 items with 100ms stagger = 400ms total (under 2500ms)
      render(
        <>
          <TransitionChild index={0} totalItems={5}>
            <div>Item 0</div>
          </TransitionChild>
          <TransitionChild index={4} totalItems={5}>
            <div>Item 4</div>
          </TransitionChild>
        </>
      );

      const item4 = screen.getByText('Item 4').parentElement;
      const delay = parseInt(item4?.getAttribute('data-delay') || '0');

      // Should use default calculation: 300 + 4 * 100 = 700ms
      expect(delay).toBe(STAGGER.INITIAL_DELAY + 4 * STAGGER.DEFAULT);
    });

    it('should respect custom maxDurationMs', () => {
      render(
        <>
          {Array.from({ length: 20 }, (_, i) => (
            <TransitionChild key={i} index={i} totalItems={20} maxDurationMs={1000}>
              <div>Item {i}</div>
            </TransitionChild>
          ))}
        </>
      );

      const lastItem = screen.getByText('Item 19').parentElement;
      const lastDelay = parseInt(lastItem?.getAttribute('data-delay') || '0');

      expect(lastDelay).toBeLessThanOrEqual(1000);
    });
  });

  describe('animation styles', () => {
    it('should apply animation CSS properties', () => {
      render(
        <TransitionChild index={1} totalItems={3}>
          <div>Content</div>
        </TransitionChild>
      );

      const container = screen.getByText('Content').parentElement;
      const style = container?.getAttribute('style') || '';

      // Should have animation property
      expect(style).toContain('animation');
      expect(style).toContain('transitionChildReveal');
    });

    it('should respect custom animationDuration', () => {
      render(
        <TransitionChild index={0} animationDuration={400}>
          <div>Content</div>
        </TransitionChild>
      );

      const container = screen.getByText('Content').parentElement;
      const style = container?.getAttribute('style') || '';

      expect(style).toContain('400ms');
    });

    it('should apply will-change for performance', () => {
      render(
        <TransitionChild index={0}>
          <div>Content</div>
        </TransitionChild>
      );

      const container = screen.getByText('Content').parentElement;
      const style = container?.getAttribute('style') || '';

      expect(style).toContain('will-change');
    });
  });

  describe('reduced motion (AC #6)', () => {
    it('should skip animation when reduced motion is preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(
        <TransitionChild index={0}>
          <div>Content</div>
        </TransitionChild>
      );

      const container = screen.getByText('Content').parentElement;
      // Should not have data-delay attribute when animation disabled
      expect(container).not.toHaveAttribute('data-delay');
    });

    it('should apply static styles when reduced motion', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(
        <TransitionChild index={2} totalItems={5}>
          <div>Content</div>
        </TransitionChild>
      );

      const container = screen.getByText('Content').parentElement;
      const style = container?.getAttribute('style') || '';

      // Should have static opacity and transform
      expect(style).toContain('opacity: 1');
    });
  });

  describe('enabled option', () => {
    it('should skip animation when disabled', () => {
      render(
        <TransitionChild index={2} totalItems={5} enabled={false}>
          <div>Content</div>
        </TransitionChild>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).not.toHaveAttribute('data-delay');
    });
  });

  describe('custom styling', () => {
    it('should apply custom className', () => {
      render(
        <TransitionChild index={0} className="custom-item">
          <div>Content</div>
        </TransitionChild>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveClass('transition-child');
      expect(container).toHaveClass('custom-item');
    });

    it('should merge custom style with animation style', () => {
      render(
        <TransitionChild index={0} style={{ padding: '10px' }}>
          <div>Content</div>
        </TransitionChild>
      );

      const container = screen.getByText('Content').parentElement;
      const style = container?.getAttribute('style') || '';

      expect(style).toContain('padding');
      expect(style).toContain('animation');
    });
  });

  describe('edge cases', () => {
    it('should handle index without totalItems', () => {
      render(
        <TransitionChild index={5}>
          <div>Content</div>
        </TransitionChild>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveAttribute('data-index', '5');
      expect(container).toHaveAttribute('data-delay');
    });
  });
});
