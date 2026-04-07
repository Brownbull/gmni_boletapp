/**
 * CurrencyMismatchDialog Component Tests
 *
 * TD-18-26: Portal positioning test to ensure dialog renders
 * via createPortal to document.body (same fix as QuickSaveCard TD-18-21).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrencyMismatchDialog } from '@features/scan/components/CurrencyMismatchDialog';

describe('CurrencyMismatchDialog', () => {
  const mockT = (key: string) => {
    const translations: Record<string, string> = {
      currencyMismatchTitle: 'Currency Mismatch',
      currencyMismatchMessage: 'Detected {currency} instead of your default.',
      useDetectedCurrency: 'Use {currency}',
      useMyDefaultCurrency: 'Use {currency}',
      detected: 'Detected',
      yourDefault: 'Your default',
      close: 'Close',
    };
    return translations[key] || key;
  };

  const defaultProps = {
    detectedCurrency: 'USD',
    userCurrency: 'CLP',
    onUseDetected: vi.fn(),
    onUseDefault: vi.fn(),
    onCancel: vi.fn(),
    theme: 'light' as const,
    t: mockT,
    isOpen: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(<CurrencyMismatchDialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Currency Mismatch')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<CurrencyMismatchDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onUseDetected when detected currency button is clicked', () => {
    render(<CurrencyMismatchDialog {...defaultProps} />);
    const useDetectedButton = screen.getByRole('button', { name: /Use USD/i });
    fireEvent.click(useDetectedButton);
    expect(defaultProps.onUseDetected).toHaveBeenCalledTimes(1);
  });

  it('calls onUseDefault when default currency button is clicked', () => {
    render(<CurrencyMismatchDialog {...defaultProps} />);
    const useDefaultButton = screen.getByRole('button', { name: /Use CLP/i });
    fireEvent.click(useDefaultButton);
    expect(defaultProps.onUseDefault).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when close button is clicked', () => {
    render(<CurrencyMismatchDialog {...defaultProps} />);
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  // TD-18-26: Portal positioning tests
  describe('TD-18-26: portal positioning', () => {
    it('renders via portal as direct child of document.body', () => {
      const { container } = render(<CurrencyMismatchDialog {...defaultProps} />);

      // Dialog should NOT be inside the render container (it's portaled to body)
      expect(container.querySelector('[role="dialog"]')).toBeNull();

      // Dialog should be in document.body
      const dialog = document.body.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
    });
  });
});
