/**
 * Tests for AnimatedItem component
 *
 * Story 11.3: Animated Item Reveal
 * Epic 11: Quick Save & Scan Flow Optimization
 *
 * Tests the animated wrapper component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedItem } from '../../../src/components/AnimatedItem';

// Mock useReducedMotion hook
vi.mock('../../../src/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

import { useReducedMotion } from '../../../src/hooks/useReducedMotion';

describe('AnimatedItem', () => {
  beforeEach(() => {
    vi.mocked(useReducedMotion).mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render children content', () => {
      render(
        <AnimatedItem>
          <span>Test content</span>
        </AnimatedItem>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should apply animate-item-reveal class when motion is allowed', () => {
      render(
        <AnimatedItem testId="test-item">
          <span>Content</span>
        </AnimatedItem>
      );

      const element = screen.getByTestId('test-item');
      expect(element).toHaveClass('animate-item-reveal');
    });

    it('should apply custom className', () => {
      render(
        <AnimatedItem className="custom-class" testId="test-item">
          <span>Content</span>
        </AnimatedItem>
      );

      const element = screen.getByTestId('test-item');
      expect(element).toHaveClass('custom-class');
    });

    it('should set data-index attribute', () => {
      render(
        <AnimatedItem index={5} testId="test-item">
          <span>Content</span>
        </AnimatedItem>
      );

      const element = screen.getByTestId('test-item');
      expect(element).toHaveAttribute('data-index', '5');
    });

    it('should set data-testid attribute', () => {
      render(
        <AnimatedItem testId="my-test-id">
          <span>Content</span>
        </AnimatedItem>
      );

      expect(screen.getByTestId('my-test-id')).toBeInTheDocument();
    });
  });

  describe('animation delay', () => {
    it('should apply animation delay via inline style', () => {
      render(
        <AnimatedItem delay={200} testId="test-item">
          <span>Content</span>
        </AnimatedItem>
      );

      const element = screen.getByTestId('test-item');
      expect(element.style.animationDelay).toBe('200ms');
    });

    it('should default to 0ms delay when not provided', () => {
      render(
        <AnimatedItem testId="test-item">
          <span>Content</span>
        </AnimatedItem>
      );

      const element = screen.getByTestId('test-item');
      expect(element.style.animationDelay).toBe('0ms');
    });

    it('should handle large delay values', () => {
      render(
        <AnimatedItem delay={2500} testId="test-item">
          <span>Content</span>
        </AnimatedItem>
      );

      const element = screen.getByTestId('test-item');
      expect(element.style.animationDelay).toBe('2500ms');
    });
  });

  describe('reduced motion preference', () => {
    it('should not apply animation class when reduced motion is preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(
        <AnimatedItem testId="test-item">
          <span>Content</span>
        </AnimatedItem>
      );

      const element = screen.getByTestId('test-item');
      expect(element).not.toHaveClass('animate-item-reveal');
    });

    it('should still render content when reduced motion is preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(
        <AnimatedItem>
          <span>Accessible content</span>
        </AnimatedItem>
      );

      expect(screen.getByText('Accessible content')).toBeInTheDocument();
    });

    it('should still apply custom className when reduced motion is preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(
        <AnimatedItem className="my-class" testId="test-item">
          <span>Content</span>
        </AnimatedItem>
      );

      const element = screen.getByTestId('test-item');
      expect(element).toHaveClass('my-class');
    });
  });

  describe('initial opacity', () => {
    it('should set initial opacity to 0 for animation', () => {
      render(
        <AnimatedItem testId="test-item">
          <span>Content</span>
        </AnimatedItem>
      );

      const element = screen.getByTestId('test-item');
      expect(element.style.opacity).toBe('0');
    });

    it('should not set opacity when reduced motion is preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(
        <AnimatedItem testId="test-item">
          <span>Content</span>
        </AnimatedItem>
      );

      const element = screen.getByTestId('test-item');
      expect(element.style.opacity).toBe('');
    });
  });

  describe('complex children', () => {
    it('should render nested elements', () => {
      render(
        <AnimatedItem>
          <div>
            <span>Nested</span>
            <button>Button</button>
          </div>
        </AnimatedItem>
      );

      expect(screen.getByText('Nested')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Button' })).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <AnimatedItem>
          <span>First</span>
          <span>Second</span>
          <span>Third</span>
        </AnimatedItem>
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });
  });
});
