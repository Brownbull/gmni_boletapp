/**
 * Tests for DateTimeTag component
 *
 * Story 14.41: View Mode Edit Button & Field Locking
 * Epic 14: Core Implementation
 *
 * Tests the disabled prop functionality for read-only mode.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateTimeTag } from '@features/transaction-editor/components/DateTimeTag';

describe('DateTimeTag', () => {
  const defaultProps = {
    date: '2026-01-13',
    time: '14:30',
    onDateChange: vi.fn(),
    onTimeChange: vi.fn(),
    t: (key: string) => key,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render date and time buttons', () => {
      render(<DateTimeTag {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2); // Date + Time buttons
    });

    it('should display formatted date', () => {
      render(<DateTimeTag {...defaultProps} />);

      // Date format: "13 Ene" (day + Spanish month abbreviation)
      expect(screen.getByText('13 Ene')).toBeInTheDocument();
    });

    it('should display time', () => {
      render(<DateTimeTag {...defaultProps} />);

      expect(screen.getByText('14:30')).toBeInTheDocument();
    });
  });

  describe('Story 14.41: disabled prop', () => {
    it('should be enabled by default', () => {
      render(<DateTimeTag {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should have normal opacity when enabled', () => {
      render(<DateTimeTag {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.style.opacity).not.toBe('0.7');
      });
    });

    it('should disable both date and time buttons when disabled=true', () => {
      render(<DateTimeTag {...defaultProps} disabled={true} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('should have reduced opacity when disabled', () => {
      render(<DateTimeTag {...defaultProps} disabled={true} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.style.opacity).toBe('0.7');
      });
    });

    it('should have default cursor when disabled', () => {
      render(<DateTimeTag {...defaultProps} disabled={true} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.style.cursor).toBe('default');
      });
    });

    it('should have pointer cursor when enabled', () => {
      render(<DateTimeTag {...defaultProps} disabled={false} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.style.cursor).toBe('pointer');
      });
    });

    it('should not open date dropdown when disabled and clicked', () => {
      render(<DateTimeTag {...defaultProps} disabled={true} />);

      // Click date button (first button)
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);

      // Dropdown should not be visible
      expect(screen.queryByText('selectDate')).not.toBeInTheDocument();
    });

    it('should not open time dropdown when disabled and clicked', () => {
      render(<DateTimeTag {...defaultProps} disabled={true} />);

      // Click time button (second button)
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[1]);

      // Dropdown should not be visible
      expect(screen.queryByText('selectTime')).not.toBeInTheDocument();
    });

    it('should open date dropdown when enabled and clicked', () => {
      render(<DateTimeTag {...defaultProps} disabled={false} />);

      // Click date button
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);

      // Dropdown should be visible
      expect(screen.getByText('selectDate')).toBeInTheDocument();
    });

    it('should open time dropdown when enabled and clicked', () => {
      render(<DateTimeTag {...defaultProps} disabled={false} />);

      // Click time button
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[1]);

      // Dropdown should be visible
      expect(screen.getByText('selectTime')).toBeInTheDocument();
    });
  });

  describe('dropdown functionality when enabled', () => {
    it('should show confirm button in date dropdown', () => {
      render(<DateTimeTag {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);

      expect(screen.getByText('confirm')).toBeInTheDocument();
    });

    it('should close date dropdown on confirm', () => {
      render(<DateTimeTag {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);

      // Find confirm button in dropdown
      const allButtons = screen.getAllByRole('button');
      const confirmButton = allButtons.find(btn => btn.textContent === 'confirm');
      expect(confirmButton).toBeDefined();

      if (confirmButton) {
        fireEvent.click(confirmButton);
      }

      // Dropdown should be closed
      expect(screen.queryByText('selectDate')).not.toBeInTheDocument();
    });

    it('should call onDateChange when date is changed', () => {
      render(<DateTimeTag {...defaultProps} />);

      // Open date dropdown
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);

      // Find date input
      const dateInput = document.querySelector('input[type="date"]');
      expect(dateInput).toBeDefined();

      if (dateInput) {
        fireEvent.change(dateInput, { target: { value: '2026-01-20' } });
      }

      expect(defaultProps.onDateChange).toHaveBeenCalledWith('2026-01-20');
    });

    it('should call onTimeChange when time is changed', () => {
      render(<DateTimeTag {...defaultProps} />);

      // Open time dropdown
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[1]);

      // Find time input
      const timeInput = document.querySelector('input[type="time"]');
      expect(timeInput).toBeDefined();

      if (timeInput) {
        fireEvent.change(timeInput, { target: { value: '16:45' } });
      }

      expect(defaultProps.onTimeChange).toHaveBeenCalledWith('16:45');
    });
  });

  describe('edge cases', () => {
    it('should handle missing time gracefully', () => {
      render(<DateTimeTag {...defaultProps} time={undefined} />);

      // When t function is provided and time is empty, it calls t('selectTime')
      // Our mock t function returns the key as-is
      expect(screen.getByText('selectTime')).toBeInTheDocument();
    });

    it('should handle empty date gracefully', () => {
      render(<DateTimeTag {...defaultProps} date="" />);

      // Should show placeholder text
      expect(screen.getByText('selectDate')).toBeInTheDocument();
    });
  });
});
