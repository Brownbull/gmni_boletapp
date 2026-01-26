/**
 * Story 14e-10 Review Follow-up: SavingState Unit Tests
 * Story 14e-11: Updated to mock Zustand store for phase guard
 *
 * Tests for the extracted SavingState component.
 * Shows during phase='saving' with spinner animation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ScanPhase } from '@/types/scanStateMachine';

// Story 14e-11: Mock Zustand store for phase guard
const mockUseScanPhase = vi.fn<[], ScanPhase>(() => 'saving');

vi.mock('@features/scan/store', () => ({
  useScanPhase: () => mockUseScanPhase(),
}));

// Import after mocking
import { SavingState } from '@features/scan/components/states';

// Mock translation function
const mockT = (key: string): string => {
  const translations: Record<string, string> = {
    saving: 'Saving...',
  };
  return translations[key] || key;
};

describe('SavingState', () => {
  const defaultProps = {
    t: mockT,
    theme: 'light' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Story 14e-11: Set correct phase for rendering
    mockUseScanPhase.mockReturnValue('saving');
  });

  describe('phase guard', () => {
    it('should return null when phase is not saving', () => {
      mockUseScanPhase.mockReturnValue('idle');
      const { container } = render(<SavingState {...defaultProps} />);

      expect(container.firstChild).toBeNull();
    });

    it('should render when phase is saving', () => {
      mockUseScanPhase.mockReturnValue('saving');
      render(<SavingState {...defaultProps} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('rendering', () => {
    it('should render saving indicator', () => {
      render(<SavingState {...defaultProps} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should display default message from translation', () => {
      render(<SavingState {...defaultProps} />);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should display custom message when provided', () => {
      render(<SavingState {...defaultProps} message="Saving transaction..." />);

      expect(screen.getByText('Saving transaction...')).toBeInTheDocument();
    });

    it('should render spinner animation', () => {
      render(<SavingState {...defaultProps} />);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('theme support', () => {
    it('should render with light theme', () => {
      render(<SavingState {...defaultProps} theme="light" />);

      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
    });

    it('should render with dark theme', () => {
      render(<SavingState {...defaultProps} theme="dark" />);

      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have role="status"', () => {
      render(<SavingState {...defaultProps} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-live="polite"', () => {
      render(<SavingState {...defaultProps} />);

      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('should have appropriate aria-label', () => {
      render(<SavingState {...defaultProps} />);

      // aria-label uses the message or t('saving') or fallback
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Saving...');
    });

    it('should use custom message in aria-label', () => {
      render(<SavingState {...defaultProps} message="Custom saving message" />);

      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Custom saving message');
    });

    it('should hide spinner from screen readers', () => {
      render(<SavingState {...defaultProps} />);

      const spinner = document.querySelector('[aria-hidden="true"]');
      expect(spinner).toBeInTheDocument();
    });
  });
});
