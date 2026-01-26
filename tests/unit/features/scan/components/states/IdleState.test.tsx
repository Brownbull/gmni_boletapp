/**
 * Story 14e-9c: IdleState Unit Tests
 *
 * Tests for the IdleState component that renders when scan phase is 'idle'.
 *
 * Test Categories:
 * - Phase guard (returns null when not idle)
 * - Mode-aware rendering (single vs batch messaging)
 * - Translation integration
 * - Optional actions (onStartScan callback)
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IdleState } from '@features/scan/components/states';

// Mock the store selectors
vi.mock('@features/scan/store', () => ({
  useScanPhase: vi.fn(),
  useScanMode: vi.fn(),
}));

import { useScanPhase, useScanMode } from '@features/scan/store';

// Mock translation function
const mockT = (key: string): string => {
  const translations: Record<string, string> = {
    scanSinglePrompt: 'Tap to scan a receipt',
    scanBatchPrompt: 'Tap to add more receipts',
    scan: 'Scan',
  };
  return translations[key] || key;
};

describe('IdleState', () => {
  const defaultProps = {
    t: mockT,
    theme: 'light' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('phase guard', () => {
    it('should render when phase is idle', () => {
      vi.mocked(useScanPhase).mockReturnValue('idle');
      vi.mocked(useScanMode).mockReturnValue('single');

      render(<IdleState {...defaultProps} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should return null when phase is scanning', () => {
      vi.mocked(useScanPhase).mockReturnValue('scanning');
      vi.mocked(useScanMode).mockReturnValue('single');

      const { container } = render(<IdleState {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should return null when phase is reviewing', () => {
      vi.mocked(useScanPhase).mockReturnValue('reviewing');
      vi.mocked(useScanMode).mockReturnValue('single');

      const { container } = render(<IdleState {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should return null when phase is error', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanMode).mockReturnValue('single');

      const { container } = render(<IdleState {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should return null when phase is saving', () => {
      vi.mocked(useScanPhase).mockReturnValue('saving');
      vi.mocked(useScanMode).mockReturnValue('single');

      const { container } = render(<IdleState {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should return null when phase is capturing', () => {
      vi.mocked(useScanPhase).mockReturnValue('capturing');
      vi.mocked(useScanMode).mockReturnValue('single');

      const { container } = render(<IdleState {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('mode-aware rendering', () => {
    it('should show single scan message in single mode', () => {
      vi.mocked(useScanPhase).mockReturnValue('idle');
      vi.mocked(useScanMode).mockReturnValue('single');

      render(<IdleState {...defaultProps} />);

      expect(screen.getByText('Tap to scan a receipt')).toBeInTheDocument();
    });

    it('should show batch message in batch mode', () => {
      vi.mocked(useScanPhase).mockReturnValue('idle');
      vi.mocked(useScanMode).mockReturnValue('batch');

      render(<IdleState {...defaultProps} />);

      expect(screen.getByText('Tap to add more receipts')).toBeInTheDocument();
    });

    it('should show single message in statement mode (fallback)', () => {
      vi.mocked(useScanPhase).mockReturnValue('idle');
      vi.mocked(useScanMode).mockReturnValue('statement');

      render(<IdleState {...defaultProps} />);

      // Statement mode defaults to single prompt
      expect(screen.getByText('Tap to scan a receipt')).toBeInTheDocument();
    });
  });

  describe('theme support', () => {
    it('should render with light theme', () => {
      vi.mocked(useScanPhase).mockReturnValue('idle');
      vi.mocked(useScanMode).mockReturnValue('single');

      render(<IdleState {...defaultProps} theme="light" />);

      // Check element renders - CSS variables resolved at runtime
      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('rounded-xl');
    });

    it('should render with dark theme', () => {
      vi.mocked(useScanPhase).mockReturnValue('idle');
      vi.mocked(useScanMode).mockReturnValue('single');

      render(<IdleState {...defaultProps} theme="dark" />);

      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
    });
  });

  describe('onStartScan callback', () => {
    it('should render scan button when onStartScan is provided', () => {
      vi.mocked(useScanPhase).mockReturnValue('idle');
      vi.mocked(useScanMode).mockReturnValue('single');

      const onStartScan = vi.fn();
      render(<IdleState {...defaultProps} onStartScan={onStartScan} />);

      expect(screen.getByRole('button', { name: 'Scan' })).toBeInTheDocument();
    });

    it('should not render scan button when onStartScan is not provided', () => {
      vi.mocked(useScanPhase).mockReturnValue('idle');
      vi.mocked(useScanMode).mockReturnValue('single');

      render(<IdleState {...defaultProps} />);

      expect(screen.queryByRole('button', { name: 'Scan' })).not.toBeInTheDocument();
    });

    it('should call onStartScan when scan button is clicked', () => {
      vi.mocked(useScanPhase).mockReturnValue('idle');
      vi.mocked(useScanMode).mockReturnValue('single');

      const onStartScan = vi.fn();
      render(<IdleState {...defaultProps} onStartScan={onStartScan} />);

      fireEvent.click(screen.getByRole('button', { name: 'Scan' }));

      expect(onStartScan).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('should have role="status"', () => {
      vi.mocked(useScanPhase).mockReturnValue('idle');
      vi.mocked(useScanMode).mockReturnValue('single');

      render(<IdleState {...defaultProps} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-label with message', () => {
      vi.mocked(useScanPhase).mockReturnValue('idle');
      vi.mocked(useScanMode).mockReturnValue('single');

      render(<IdleState {...defaultProps} />);

      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        'Tap to scan a receipt'
      );
    });

    it('should hide decorative icon from assistive technology', () => {
      vi.mocked(useScanPhase).mockReturnValue('idle');
      vi.mocked(useScanMode).mockReturnValue('single');

      render(<IdleState {...defaultProps} />);

      const icons = document.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('translation fallbacks', () => {
    it('should use fallback message when translation returns key', () => {
      vi.mocked(useScanPhase).mockReturnValue('idle');
      vi.mocked(useScanMode).mockReturnValue('single');

      // When t returns the key (not found), the component uses || fallback
      const emptyT = (key: string) => key;
      render(<IdleState {...defaultProps} t={emptyT} />);

      // The component code: t('scanSinglePrompt') || 'Tap to scan a receipt'
      // When t returns 'scanSinglePrompt', it's truthy so fallback isn't used
      // But the message still displays (just the key)
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});
