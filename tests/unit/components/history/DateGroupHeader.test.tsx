/**
 * DateGroupHeader Component Tests
 *
 * Story 14.14: Transaction List Redesign (AC #2)
 * Tests for sticky date group headers and grouping utilities.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  DateGroupHeader,
  formatDateGroupLabel,
  groupTransactionsByDate,
  calculateGroupTotal,
} from '@features/history/components/DateGroupHeader';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockFormatCurrency = (amount: number, currency: string) => {
  return `${currency} ${amount.toLocaleString('es-CL')}`;
};

const mockT = (key: string) => {
  const translations: Record<string, string> = {
    today: 'Hoy',
    yesterday: 'Ayer',
  };
  return translations[key] || key;
};

// ============================================================================
// DateGroupHeader Component Tests
// ============================================================================

describe('DateGroupHeader', () => {
  describe('Rendering', () => {
    it('renders the date label', () => {
      render(<DateGroupHeader label="Hoy" />);

      expect(screen.getByText('Hoy')).toBeInTheDocument();
    });

    it('renders total when provided', () => {
      render(
        <DateGroupHeader
          label="Hoy"
          total={45990}
          currency="CLP"
          formatCurrency={mockFormatCurrency}
        />
      );

      expect(screen.getByText('Hoy')).toBeInTheDocument();
      expect(screen.getByText('CLP 45.990')).toBeInTheDocument();
    });

    it('does not render total when not provided', () => {
      const { container } = render(<DateGroupHeader label="Hoy" />);

      // Only the label should be present
      expect(container.textContent).toBe('Hoy');
    });

    it('has heading role with level 3', () => {
      render(<DateGroupHeader label="Hoy" />);

      const header = screen.getByRole('heading', { level: 3 });
      expect(header).toBeInTheDocument();
    });
  });

  describe('Sticky Behavior', () => {
    it('applies sticky positioning by default', () => {
      render(<DateGroupHeader label="Hoy" />);

      const header = screen.getByRole('heading', { level: 3 });
      expect(header).toHaveClass('sticky');
    });

    it('does not apply sticky when sticky=false', () => {
      render(<DateGroupHeader label="Hoy" sticky={false} />);

      const header = screen.getByRole('heading', { level: 3 });
      expect(header).not.toHaveClass('sticky');
    });
  });

  describe('Theme Support', () => {
    it('uses CSS variables for styling', () => {
      render(<DateGroupHeader label="Hoy" theme="dark" />);

      const header = screen.getByRole('heading', { level: 3 });
      expect(header).toBeInTheDocument();
      // CSS variables are applied via inline styles
    });
  });
});

// ============================================================================
// formatDateGroupLabel Utility Tests
// ============================================================================

describe('formatDateGroupLabel', () => {
  it('returns "Hoy" for today\'s date', () => {
    const today = new Date().toISOString().split('T')[0];
    const result = formatDateGroupLabel(today, 'es', mockT);

    expect(result).toBe('Hoy');
  });

  it('returns "Ayer" for yesterday\'s date', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const result = formatDateGroupLabel(yesterday, 'es', mockT);

    expect(result).toBe('Ayer');
  });

  it('returns formatted date for older dates in Spanish', () => {
    const oldDate = '2024-12-25';
    const result = formatDateGroupLabel(oldDate, 'es', mockT);

    // Should return something like "25 dic" in Spanish
    expect(result).toMatch(/\d+.*dic/i);
  });

  it('returns formatted date for older dates in English', () => {
    const oldDate = '2024-12-25';
    const result = formatDateGroupLabel(oldDate, 'en', mockT);

    // Should return something like "Dec 25" in English
    expect(result).toMatch(/Dec.*\d+/i);
  });
});

// ============================================================================
// groupTransactionsByDate Utility Tests
// ============================================================================

describe('groupTransactionsByDate', () => {
  const transactions = [
    { id: '1', date: '2024-12-28', total: 100 },
    { id: '2', date: '2024-12-28', total: 200 },
    { id: '3', date: '2024-12-27', total: 300 },
    { id: '4', date: '2024-12-29', total: 400 },
  ];

  it('groups transactions by date', () => {
    const grouped = groupTransactionsByDate(transactions);

    expect(grouped.size).toBe(3);
    expect(grouped.get('2024-12-28')).toHaveLength(2);
    expect(grouped.get('2024-12-27')).toHaveLength(1);
    expect(grouped.get('2024-12-29')).toHaveLength(1);
  });

  it('sorts groups by date descending (most recent first)', () => {
    const grouped = groupTransactionsByDate(transactions);
    const keys = Array.from(grouped.keys());

    expect(keys[0]).toBe('2024-12-29'); // Most recent
    expect(keys[1]).toBe('2024-12-28');
    expect(keys[2]).toBe('2024-12-27'); // Oldest
  });

  it('preserves transaction order within groups', () => {
    const grouped = groupTransactionsByDate(transactions);
    const dec28 = grouped.get('2024-12-28');

    expect(dec28![0].id).toBe('1');
    expect(dec28![1].id).toBe('2');
  });

  it('handles empty array', () => {
    const grouped = groupTransactionsByDate([]);

    expect(grouped.size).toBe(0);
  });

  it('handles single transaction', () => {
    const grouped = groupTransactionsByDate([{ id: '1', date: '2024-12-28', total: 100 }]);

    expect(grouped.size).toBe(1);
    expect(grouped.get('2024-12-28')).toHaveLength(1);
  });
});

// ============================================================================
// calculateGroupTotal Utility Tests
// ============================================================================

describe('calculateGroupTotal', () => {
  it('calculates sum of totals', () => {
    const transactions = [
      { total: 1000 },
      { total: 2500 },
      { total: 1500 },
    ];

    const result = calculateGroupTotal(transactions);

    expect(result).toBe(5000);
  });

  it('returns 0 for empty array', () => {
    const result = calculateGroupTotal([]);

    expect(result).toBe(0);
  });

  it('handles single transaction', () => {
    const result = calculateGroupTotal([{ total: 45990 }]);

    expect(result).toBe(45990);
  });

  it('handles transactions with zero totals', () => {
    const transactions = [
      { total: 0 },
      { total: 1000 },
      { total: 0 },
    ];

    const result = calculateGroupTotal(transactions);

    expect(result).toBe(1000);
  });
});
