/**
 * Story 14e-10 Review Follow-up: StatementPlaceholder Unit Tests
 * Story 14e-11: Updated to mock Zustand store for phase/mode guard
 *
 * Tests for the extracted StatementPlaceholder component.
 * Placeholder for statement scan mode - shows "Proximamente" per Epic 14d.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ScanPhase, ScanMode } from '@/types/scanStateMachine';

// Story 14e-11: Mock Zustand store for phase/mode guard
const mockUseScanPhase = vi.fn<[], ScanPhase>(() => 'capturing');
const mockUseScanMode = vi.fn<[], ScanMode>(() => 'statement');

vi.mock('@features/scan/store', () => ({
  useScanPhase: () => mockUseScanPhase(),
  useScanMode: () => mockUseScanMode(),
}));

// Import after mocking
import { StatementPlaceholder } from '@features/scan/components/states';

// Mock translation function
const mockT = (key: string): string => {
  const translations: Record<string, string> = {
    statementScanTitle: 'Statement Scanning',
    statementComingSoon: 'Proximamente',
    back: 'Back',
  };
  return translations[key] || key;
};

describe('StatementPlaceholder', () => {
  const defaultProps = {
    t: mockT,
    theme: 'light' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Story 14e-11: Set correct phase/mode for rendering
    mockUseScanPhase.mockReturnValue('capturing');
    mockUseScanMode.mockReturnValue('statement');
  });

  describe('phase/mode guard', () => {
    it('should return null when phase is not capturing', () => {
      mockUseScanPhase.mockReturnValue('idle');
      const { container } = render(<StatementPlaceholder {...defaultProps} />);

      expect(container.firstChild).toBeNull();
    });

    it('should return null when mode is not statement', () => {
      mockUseScanPhase.mockReturnValue('capturing');
      mockUseScanMode.mockReturnValue('single');
      const { container } = render(<StatementPlaceholder {...defaultProps} />);

      expect(container.firstChild).toBeNull();
    });

    it('should render when phase is capturing and mode is statement', () => {
      mockUseScanPhase.mockReturnValue('capturing');
      mockUseScanMode.mockReturnValue('statement');
      render(<StatementPlaceholder {...defaultProps} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('rendering', () => {
    it('should render placeholder container', () => {
      render(<StatementPlaceholder {...defaultProps} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should display statement scan title', () => {
      render(<StatementPlaceholder {...defaultProps} />);

      expect(screen.getByText('Statement Scanning')).toBeInTheDocument();
    });

    it('should display "Proximamente" message', () => {
      render(<StatementPlaceholder {...defaultProps} />);

      expect(screen.getByText('Proximamente')).toBeInTheDocument();
    });

    it('should render icon SVG', () => {
      render(<StatementPlaceholder {...defaultProps} />);

      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('back button', () => {
    it('should not render back button when onBack not provided', () => {
      render(<StatementPlaceholder {...defaultProps} />);

      expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    });

    it('should render back button when onBack is provided', () => {
      const onBack = vi.fn();
      render(<StatementPlaceholder {...defaultProps} onBack={onBack} />);

      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    });

    it('should call onBack when back button clicked', () => {
      const onBack = vi.fn();
      render(<StatementPlaceholder {...defaultProps} onBack={onBack} />);

      fireEvent.click(screen.getByRole('button', { name: 'Back' }));

      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('theme support', () => {
    it('should render with light theme', () => {
      render(<StatementPlaceholder {...defaultProps} theme="light" />);

      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
    });

    it('should render with dark theme', () => {
      render(<StatementPlaceholder {...defaultProps} theme="dark" />);

      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have role="status"', () => {
      render(<StatementPlaceholder {...defaultProps} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-label for coming soon', () => {
      render(<StatementPlaceholder {...defaultProps} />);

      // aria-label uses t('statementComingSoon') || 'Coming soon'
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Proximamente');
    });

    it('should have title as heading', () => {
      render(<StatementPlaceholder {...defaultProps} />);

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Statement Scanning');
    });
  });
});
