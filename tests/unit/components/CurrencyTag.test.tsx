/**
 * Tests for CurrencyTag component
 *
 * Story 14.41: View Mode Edit Button & Field Locking
 * Epic 14: Core Implementation
 *
 * Tests the disabled prop functionality for read-only mode.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrencyTag } from '../../../src/components/CurrencyTag';

describe('CurrencyTag', () => {
  const defaultProps = {
    currency: 'CLP',
    onCurrencyChange: vi.fn(),
    t: (key: string) => key,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render the currency tag button', () => {
      render(<CurrencyTag {...defaultProps} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should display currency symbol for CLP', () => {
      render(<CurrencyTag {...defaultProps} currency="CLP" />);

      expect(screen.getByText('$')).toBeInTheDocument();
    });

    it('should display currency symbol for USD', () => {
      render(<CurrencyTag {...defaultProps} currency="USD" />);

      expect(screen.getByText('US$')).toBeInTheDocument();
    });

    it('should display currency symbol for EUR', () => {
      render(<CurrencyTag {...defaultProps} currency="EUR" />);

      expect(screen.getByText('€')).toBeInTheDocument();
    });

    it('should display currency symbol for GBP', () => {
      render(<CurrencyTag {...defaultProps} currency="GBP" />);

      expect(screen.getByText('£')).toBeInTheDocument();
    });
  });

  describe('Story 14.41: disabled prop', () => {
    it('should be enabled by default', () => {
      render(<CurrencyTag {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('should have normal opacity when enabled', () => {
      render(<CurrencyTag {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button.style.opacity).not.toBe('0.7');
    });

    it('should be disabled when disabled=true', () => {
      render(<CurrencyTag {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should have reduced opacity when disabled', () => {
      render(<CurrencyTag {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button');
      expect(button.style.opacity).toBe('0.7');
    });

    it('should have default cursor when disabled', () => {
      render(<CurrencyTag {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button');
      expect(button.style.cursor).toBe('default');
    });

    it('should have pointer cursor when enabled', () => {
      render(<CurrencyTag {...defaultProps} disabled={false} />);

      const button = screen.getByRole('button');
      expect(button.style.cursor).toBe('pointer');
    });

    it('should not open dropdown when disabled and clicked', () => {
      render(<CurrencyTag {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Dropdown should not be visible (currency label not visible)
      expect(screen.queryByText('currency')).not.toBeInTheDocument();
    });

    it('should open dropdown when enabled and clicked', () => {
      render(<CurrencyTag {...defaultProps} disabled={false} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Dropdown should be visible
      expect(screen.getByText('currency')).toBeInTheDocument();
    });
  });

  describe('dropdown functionality when enabled', () => {
    it('should show confirm button in dropdown', () => {
      render(<CurrencyTag {...defaultProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('confirm')).toBeInTheDocument();
    });

    it('should show all currency options in dropdown', () => {
      render(<CurrencyTag {...defaultProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Check for some currency options
      expect(screen.getByText('CLP - Peso Chileno')).toBeInTheDocument();
      expect(screen.getByText('USD - US Dollar')).toBeInTheDocument();
      expect(screen.getByText('EUR - Euro')).toBeInTheDocument();
    });

    it('should close dropdown on confirm', () => {
      render(<CurrencyTag {...defaultProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Find confirm button in dropdown
      const allButtons = screen.getAllByRole('button');
      const confirmButton = allButtons.find(btn => btn.textContent === 'confirm');
      expect(confirmButton).toBeDefined();

      if (confirmButton) {
        fireEvent.click(confirmButton);
      }

      // Dropdown should be closed
      expect(screen.queryByText('currency')).not.toBeInTheDocument();
    });

    it('should call onCurrencyChange when currency is selected', () => {
      render(<CurrencyTag {...defaultProps} />);

      // Open dropdown
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Find and change select
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'USD' } });

      expect(defaultProps.onCurrencyChange).toHaveBeenCalledWith('USD');
    });
  });

  describe('edge cases', () => {
    it('should default to CLP if unknown currency is provided', () => {
      render(<CurrencyTag {...defaultProps} currency="UNKNOWN" />);

      // Should show CLP symbol as default
      expect(screen.getByText('$')).toBeInTheDocument();
    });
  });
});
