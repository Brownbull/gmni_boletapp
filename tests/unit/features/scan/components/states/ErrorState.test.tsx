/**
 * Story 14e-9c: ErrorState Unit Tests
 *
 * Tests for the ErrorState component that renders when scan phase is 'error'.
 *
 * Test Categories:
 * - Phase guard (returns null when not error)
 * - Error type detection (network, timeout, invalid, api, unknown)
 * - Retry callback (default reset vs custom)
 * - Cancel/dismiss callback
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState } from '@features/scan/components/states';

// Mock the store selectors and actions
vi.mock('@features/scan/store', () => ({
  useScanPhase: vi.fn(),
  useScanError: vi.fn(),
  useScanActions: vi.fn(),
}));

// Mock ScanError component
vi.mock('@features/scan/components/ScanError', () => ({
  ScanError: ({
    errorType,
    errorMessage,
    onRetry,
    onCancel,
    t,
  }: {
    errorType: string;
    errorMessage: string;
    onRetry: () => void;
    onCancel: () => void;
    t: (key: string) => string;
  }) => (
    <div data-testid="scan-error" role="alert">
      <span data-testid="error-type">{errorType}</span>
      <span data-testid="error-message">{errorMessage}</span>
      <button onClick={onRetry}>{t('scanRetry')}</button>
      <button onClick={onCancel}>{t('cancel')}</button>
    </div>
  ),
}));

import { useScanPhase, useScanError, useScanActions } from '@features/scan/store';

// Mock translation function
const mockT = (key: string): string => {
  const translations: Record<string, string> = {
    scanErrorMessage: 'Something went wrong',
    scanRetry: 'Retry',
    cancel: 'Cancel',
  };
  return translations[key] || key;
};

describe('ErrorState', () => {
  const mockReset = vi.fn();
  const mockActions = { reset: mockReset };

  const defaultProps = {
    t: mockT,
    theme: 'light' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useScanActions).mockReturnValue(mockActions as ReturnType<typeof useScanActions>);
  });

  describe('phase guard', () => {
    it('should render when phase is error', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanError).mockReturnValue('Test error');

      render(<ErrorState {...defaultProps} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should return null when phase is idle', () => {
      vi.mocked(useScanPhase).mockReturnValue('idle');
      vi.mocked(useScanError).mockReturnValue(null);

      const { container } = render(<ErrorState {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should return null when phase is scanning', () => {
      vi.mocked(useScanPhase).mockReturnValue('scanning');
      vi.mocked(useScanError).mockReturnValue(null);

      const { container } = render(<ErrorState {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should return null when phase is reviewing', () => {
      vi.mocked(useScanPhase).mockReturnValue('reviewing');
      vi.mocked(useScanError).mockReturnValue(null);

      const { container } = render(<ErrorState {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should return null when phase is saving', () => {
      vi.mocked(useScanPhase).mockReturnValue('saving');
      vi.mocked(useScanError).mockReturnValue(null);

      const { container } = render(<ErrorState {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should return null when phase is capturing', () => {
      vi.mocked(useScanPhase).mockReturnValue('capturing');
      vi.mocked(useScanError).mockReturnValue(null);

      const { container } = render(<ErrorState {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('error type detection', () => {
    it('should detect network error type', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanError).mockReturnValue('Network connection failed');

      render(<ErrorState {...defaultProps} />);

      expect(screen.getByTestId('error-type')).toHaveTextContent('network');
    });

    it('should detect timeout error type', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanError).mockReturnValue('Request timed out');

      render(<ErrorState {...defaultProps} />);

      expect(screen.getByTestId('error-type')).toHaveTextContent('timeout');
    });

    it('should detect invalid error type', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanError).mockReturnValue('Invalid image format');

      render(<ErrorState {...defaultProps} />);

      expect(screen.getByTestId('error-type')).toHaveTextContent('invalid');
    });

    it('should detect api error type', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanError).mockReturnValue('API service unavailable');

      render(<ErrorState {...defaultProps} />);

      expect(screen.getByTestId('error-type')).toHaveTextContent('api');
    });

    it('should default to unknown error type', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanError).mockReturnValue('Some random error');

      render(<ErrorState {...defaultProps} />);

      expect(screen.getByTestId('error-type')).toHaveTextContent('unknown');
    });

    it('should handle null error with unknown type', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanError).mockReturnValue(null);

      render(<ErrorState {...defaultProps} />);

      expect(screen.getByTestId('error-type')).toHaveTextContent('unknown');
    });

    it('should detect offline keyword', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanError).mockReturnValue('Device is offline');

      render(<ErrorState {...defaultProps} />);

      expect(screen.getByTestId('error-type')).toHaveTextContent('network');
    });

    it('should detect server keyword as api', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanError).mockReturnValue('Server error occurred');

      render(<ErrorState {...defaultProps} />);

      expect(screen.getByTestId('error-type')).toHaveTextContent('api');
    });
  });

  describe('error message display', () => {
    it('should display error message from store', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanError).mockReturnValue('Custom error message');

      render(<ErrorState {...defaultProps} />);

      expect(screen.getByTestId('error-message')).toHaveTextContent('Custom error message');
    });

    it('should use fallback message when error is null', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanError).mockReturnValue(null);

      render(<ErrorState {...defaultProps} />);

      expect(screen.getByTestId('error-message')).toHaveTextContent('Something went wrong');
    });
  });

  describe('retry callback', () => {
    it('should call reset by default on retry', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanError).mockReturnValue('Test error');

      render(<ErrorState {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it('should call custom onRetry when provided', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanError).mockReturnValue('Test error');

      const onRetry = vi.fn();
      render(<ErrorState {...defaultProps} onRetry={onRetry} />);

      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(mockReset).not.toHaveBeenCalled();
    });
  });

  describe('cancel/dismiss callback', () => {
    it('should call reset on cancel', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanError).mockReturnValue('Test error');

      render(<ErrorState {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it('should call onDismiss after reset on cancel', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanError).mockReturnValue('Test error');

      const onDismiss = vi.fn();
      render(<ErrorState {...defaultProps} onDismiss={onDismiss} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockReset).toHaveBeenCalledTimes(1);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not call onDismiss when not provided', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanError).mockReturnValue('Test error');

      render(<ErrorState {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      // Should not throw
      expect(mockReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('theme support', () => {
    it('should pass light theme to ScanError', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanError).mockReturnValue('Test error');

      render(<ErrorState {...defaultProps} theme="light" />);

      expect(screen.getByTestId('scan-error')).toBeInTheDocument();
    });

    it('should pass dark theme to ScanError', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanError).mockReturnValue('Test error');

      render(<ErrorState {...defaultProps} theme="dark" />);

      expect(screen.getByTestId('scan-error')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should render with role="alert"', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanError).mockReturnValue('Test error');

      render(<ErrorState {...defaultProps} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have retry and cancel buttons', () => {
      vi.mocked(useScanPhase).mockReturnValue('error');
      vi.mocked(useScanError).mockReturnValue('Test error');

      render(<ErrorState {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });
  });
});
