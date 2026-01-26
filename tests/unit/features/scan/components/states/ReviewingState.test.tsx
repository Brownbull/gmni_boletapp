/**
 * Story 14e-9c: ReviewingState Unit Tests
 *
 * Tests for the ReviewingState component that renders when scan phase is 'reviewing'.
 *
 * Test Categories:
 * - Phase guard (returns null when not reviewing)
 * - Mode-aware rendering (single vs batch)
 * - Children rendering (wrapper mode)
 * - Action callbacks (onReview, onSave)
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewingState } from '@features/scan/components/states';

// Mock the store selectors
vi.mock('@features/scan/store', () => ({
  useScanPhase: vi.fn(),
  useScanMode: vi.fn(),
  useResultCount: vi.fn(),
}));

import { useScanPhase, useScanMode, useResultCount } from '@features/scan/store';

// Mock translation function
const mockT = (key: string): string => {
  const translations: Record<string, string> = {
    batchReviewTitle: 'Batch Review',
    batchReviewMessage: '{count} receipts ready for review',
    reviewTitle: 'Review Transaction',
    reviewMessage: 'Review and confirm your transaction',
    review: 'Review',
    save: 'Save',
  };
  return translations[key] || key;
};

describe('ReviewingState', () => {
  const defaultProps = {
    t: mockT,
    theme: 'light' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('phase guard', () => {
    it('should render when phase is reviewing', () => {
      vi.mocked(useScanPhase).mockReturnValue('reviewing');
      vi.mocked(useScanMode).mockReturnValue('single');
      vi.mocked(useResultCount).mockReturnValue(1);

      render(<ReviewingState {...defaultProps} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should return null when phase is idle', () => {
      vi.mocked(useScanPhase).mockReturnValue('idle');
      vi.mocked(useScanMode).mockReturnValue('single');
      vi.mocked(useResultCount).mockReturnValue(0);

      const { container } = render(<ReviewingState {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should return null when phase is scanning', () => {
      vi.mocked(useScanPhase).mockReturnValue('scanning');
      vi.mocked(useScanMode).mockReturnValue('single');
      vi.mocked(useResultCount).mockReturnValue(0);

      const { container } = render(<ReviewingState {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should return null when phase is error', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanMode).mockReturnValue('single');
      vi.mocked(useResultCount).mockReturnValue(0);

      const { container } = render(<ReviewingState {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should return null when phase is saving', () => {
      vi.mocked(useScanPhase).mockReturnValue('saving');
      vi.mocked(useScanMode).mockReturnValue('single');
      vi.mocked(useResultCount).mockReturnValue(0);

      const { container } = render(<ReviewingState {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should return null when phase is capturing', () => {
      vi.mocked(useScanPhase).mockReturnValue('capturing');
      vi.mocked(useScanMode).mockReturnValue('single');
      vi.mocked(useResultCount).mockReturnValue(0);

      const { container } = render(<ReviewingState {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('single mode rendering', () => {
    it('should show single review title', () => {
      vi.mocked(useScanPhase).mockReturnValue('reviewing');
      vi.mocked(useScanMode).mockReturnValue('single');
      vi.mocked(useResultCount).mockReturnValue(1);

      render(<ReviewingState {...defaultProps} />);

      expect(screen.getByText('Review Transaction')).toBeInTheDocument();
    });

    it('should show single review message', () => {
      vi.mocked(useScanPhase).mockReturnValue('reviewing');
      vi.mocked(useScanMode).mockReturnValue('single');
      vi.mocked(useResultCount).mockReturnValue(1);

      render(<ReviewingState {...defaultProps} />);

      expect(screen.getByText('Review and confirm your transaction')).toBeInTheDocument();
    });

    it('should show save button when onSave provided in single mode', () => {
      vi.mocked(useScanPhase).mockReturnValue('reviewing');
      vi.mocked(useScanMode).mockReturnValue('single');
      vi.mocked(useResultCount).mockReturnValue(1);

      const onSave = vi.fn();
      render(<ReviewingState {...defaultProps} onSave={onSave} />);

      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });
  });

  describe('batch mode rendering', () => {
    it('should show batch review title', () => {
      vi.mocked(useScanPhase).mockReturnValue('reviewing');
      vi.mocked(useScanMode).mockReturnValue('batch');
      vi.mocked(useResultCount).mockReturnValue(5);

      render(<ReviewingState {...defaultProps} />);

      expect(screen.getByText('Batch Review')).toBeInTheDocument();
    });

    it('should show batch review message with count', () => {
      vi.mocked(useScanPhase).mockReturnValue('reviewing');
      vi.mocked(useScanMode).mockReturnValue('batch');
      vi.mocked(useResultCount).mockReturnValue(5);

      render(<ReviewingState {...defaultProps} />);

      expect(screen.getByText('5 receipts ready for review')).toBeInTheDocument();
    });

    it('should NOT show save button in batch mode', () => {
      vi.mocked(useScanPhase).mockReturnValue('reviewing');
      vi.mocked(useScanMode).mockReturnValue('batch');
      vi.mocked(useResultCount).mockReturnValue(5);

      const onSave = vi.fn();
      render(<ReviewingState {...defaultProps} onSave={onSave} />);

      expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    });
  });

  describe('children rendering (wrapper mode)', () => {
    it('should render children when provided', () => {
      vi.mocked(useScanPhase).mockReturnValue('reviewing');
      vi.mocked(useScanMode).mockReturnValue('single');
      vi.mocked(useResultCount).mockReturnValue(1);

      render(
        <ReviewingState {...defaultProps}>
          <div data-testid="child-component">Child Content</div>
        </ReviewingState>
      );

      expect(screen.getByTestId('child-component')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should only render children, not default UI', () => {
      vi.mocked(useScanPhase).mockReturnValue('reviewing');
      vi.mocked(useScanMode).mockReturnValue('single');
      vi.mocked(useResultCount).mockReturnValue(1);

      render(
        <ReviewingState {...defaultProps}>
          <div>Child Only</div>
        </ReviewingState>
      );

      // Default UI should not render
      expect(screen.queryByText('Review Transaction')).not.toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should respect phase guard even with children', () => {
      vi.mocked(useScanPhase).mockReturnValue('idle');
      vi.mocked(useScanMode).mockReturnValue('single');
      vi.mocked(useResultCount).mockReturnValue(1);

      const { container } = render(
        <ReviewingState {...defaultProps}>
          <div data-testid="child-component">Child Content</div>
        </ReviewingState>
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('action callbacks', () => {
    it('should render review button when onReview provided', () => {
      vi.mocked(useScanPhase).mockReturnValue('reviewing');
      vi.mocked(useScanMode).mockReturnValue('single');
      vi.mocked(useResultCount).mockReturnValue(1);

      const onReview = vi.fn();
      render(<ReviewingState {...defaultProps} onReview={onReview} />);

      expect(screen.getByRole('button', { name: 'Review' })).toBeInTheDocument();
    });

    it('should call onReview when review button clicked', () => {
      vi.mocked(useScanPhase).mockReturnValue('reviewing');
      vi.mocked(useScanMode).mockReturnValue('single');
      vi.mocked(useResultCount).mockReturnValue(1);

      const onReview = vi.fn();
      render(<ReviewingState {...defaultProps} onReview={onReview} />);

      fireEvent.click(screen.getByRole('button', { name: 'Review' }));

      expect(onReview).toHaveBeenCalledTimes(1);
    });

    it('should call onSave when save button clicked', () => {
      vi.mocked(useScanPhase).mockReturnValue('reviewing');
      vi.mocked(useScanMode).mockReturnValue('single');
      vi.mocked(useResultCount).mockReturnValue(1);

      const onSave = vi.fn();
      render(<ReviewingState {...defaultProps} onSave={onSave} />);

      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('should not render buttons when callbacks not provided', () => {
      vi.mocked(useScanPhase).mockReturnValue('reviewing');
      vi.mocked(useScanMode).mockReturnValue('single');
      vi.mocked(useResultCount).mockReturnValue(1);

      render(<ReviewingState {...defaultProps} />);

      expect(screen.queryByRole('button', { name: 'Review' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    });
  });

  describe('theme support', () => {
    it('should render with light theme', () => {
      vi.mocked(useScanPhase).mockReturnValue('reviewing');
      vi.mocked(useScanMode).mockReturnValue('single');
      vi.mocked(useResultCount).mockReturnValue(1);

      render(<ReviewingState {...defaultProps} theme="light" />);

      // Check element renders - CSS variables resolved at runtime
      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('rounded-xl');
    });

    it('should render with dark theme', () => {
      vi.mocked(useScanPhase).mockReturnValue('reviewing');
      vi.mocked(useScanMode).mockReturnValue('single');
      vi.mocked(useResultCount).mockReturnValue(1);

      render(<ReviewingState {...defaultProps} theme="dark" />);

      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have role="status"', () => {
      vi.mocked(useScanPhase).mockReturnValue('reviewing');
      vi.mocked(useScanMode).mockReturnValue('single');
      vi.mocked(useResultCount).mockReturnValue(1);

      render(<ReviewingState {...defaultProps} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-label with title', () => {
      vi.mocked(useScanPhase).mockReturnValue('reviewing');
      vi.mocked(useScanMode).mockReturnValue('single');
      vi.mocked(useResultCount).mockReturnValue(1);

      render(<ReviewingState {...defaultProps} />);

      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        'Review Transaction'
      );
    });

    it('should hide decorative icon from assistive technology', () => {
      vi.mocked(useScanPhase).mockReturnValue('reviewing');
      vi.mocked(useScanMode).mockReturnValue('single');
      vi.mocked(useResultCount).mockReturnValue(1);

      render(<ReviewingState {...defaultProps} />);

      const icons = document.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
