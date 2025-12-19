/**
 * BatchSummary Component Tests
 *
 * Story 10.7: Batch Mode Summary
 * Tests the batch summary display component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BatchSummary } from '../../../../src/components/insights/BatchSummary';
import { Transaction } from '../../../../src/types/transaction';
import { Insight } from '../../../../src/types/insight';

// Mock transaction factory
function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: `tx-${Date.now()}-${Math.random()}`,
    merchant: 'Test Store',
    date: '2025-12-19',
    total: 10000,
    category: 'Supermarket',
    items: [],
    ...overrides,
  };
}

// Mock insight factory
function createMockInsight(overrides: Partial<Insight> = {}): Insight {
  return {
    id: 'test_insight',
    category: 'QUIRKY_FIRST',
    title: 'Test Insight',
    message: 'This is a test insight',
    priority: 5,
    ...overrides,
  };
}

describe('BatchSummary', () => {
  const defaultProps = {
    receipts: [
      createMockTransaction({ total: 10000 }),
      createMockTransaction({ total: 15000 }),
      createMockTransaction({ total: 20000 }),
    ],
    insights: [],
    totalAmount: 45000,
    onSilence: vi.fn(),
    onDismiss: vi.fn(),
    isSilenced: false,
    theme: 'light' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering (AC #2, #3)', () => {
    it('should display total amount scanned in session (AC #2)', () => {
      render(<BatchSummary {...defaultProps} />);

      // Total should be formatted in Chilean locale
      expect(screen.getByText('$45.000')).toBeInTheDocument();
    });

    it('should display receipt count (AC #3)', () => {
      render(<BatchSummary {...defaultProps} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should show session summary header', () => {
      render(<BatchSummary {...defaultProps} />);

      expect(screen.getByText('Resumen de escaneo')).toBeInTheDocument();
    });
  });

  describe('historical comparison (AC #4)', () => {
    it('should show comparison when last week data available (less than)', () => {
      render(
        <BatchSummary
          {...defaultProps}
          totalAmount={45000}
          lastWeekTotal={60000}
        />
      );

      // 45000 vs 60000 = -25%
      expect(screen.getByText(/25% menos que la semana pasada/)).toBeInTheDocument();
    });

    it('should show comparison when last week data available (more than)', () => {
      render(
        <BatchSummary
          {...defaultProps}
          totalAmount={60000}
          lastWeekTotal={45000}
        />
      );

      // 60000 vs 45000 = +33%
      expect(screen.getByText(/33% más que la semana pasada/)).toBeInTheDocument();
    });

    it('should not show comparison when lastWeekTotal is undefined', () => {
      render(<BatchSummary {...defaultProps} />);

      expect(screen.queryByText(/semana pasada/)).not.toBeInTheDocument();
    });

    it('should not show comparison when lastWeekTotal is 0', () => {
      render(<BatchSummary {...defaultProps} lastWeekTotal={0} />);

      expect(screen.queryByText(/semana pasada/)).not.toBeInTheDocument();
    });
  });

  describe('top insight highlight (AC #5)', () => {
    it('should display top insight from batch', () => {
      const insights = [
        createMockInsight({ id: 'low', priority: 3, title: 'Low Priority', message: 'Low message' }),
        createMockInsight({ id: 'high', priority: 10, title: 'High Priority', message: 'High message' }),
        createMockInsight({ id: 'mid', priority: 5, title: 'Mid Priority', message: 'Mid message' }),
      ];

      render(<BatchSummary {...defaultProps} insights={insights} />);

      // Should display highest priority insight
      expect(screen.getByText('High Priority')).toBeInTheDocument();
      expect(screen.getByText('High message')).toBeInTheDocument();
    });

    it('should not show insight section when no insights', () => {
      render(<BatchSummary {...defaultProps} insights={[]} />);

      expect(screen.queryByText('Test Insight')).not.toBeInTheDocument();
    });
  });

  describe('silence functionality (AC #6)', () => {
    it('should call onSilence when silence button clicked', () => {
      const onSilence = vi.fn();
      render(<BatchSummary {...defaultProps} onSilence={onSilence} />);

      const silenceButton = screen.getByText(/Silenciar insights/);
      fireEvent.click(silenceButton);

      expect(onSilence).toHaveBeenCalledTimes(1);
    });

    it('should show "Silenciar insights (4h)" text when not silenced', () => {
      render(<BatchSummary {...defaultProps} isSilenced={false} />);

      expect(screen.getByText(/Silenciar insights/)).toBeInTheDocument();
    });

    it('should show "Insights silenciados (4h)" text when silenced (AC #8)', () => {
      render(<BatchSummary {...defaultProps} isSilenced={true} />);

      expect(screen.getByText(/Insights silenciados/)).toBeInTheDocument();
    });
  });

  describe('dismiss functionality', () => {
    it('should call onDismiss when close button clicked', () => {
      const onDismiss = vi.fn();
      render(<BatchSummary {...defaultProps} onDismiss={onDismiss} />);

      const closeButton = screen.getByText('Cerrar');
      fireEvent.click(closeButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('dark mode support (AC #9)', () => {
    it('should apply light theme classes', () => {
      const { container } = render(<BatchSummary {...defaultProps} theme="light" />);

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog?.className).toContain('bg-white');
      expect(dialog?.className).toContain('text-gray-800');
    });

    it('should apply dark theme classes', () => {
      const { container } = render(<BatchSummary {...defaultProps} theme="dark" />);

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog?.className).toContain('bg-gray-800');
      expect(dialog?.className).toContain('text-white');
    });
  });

  describe('accessibility', () => {
    it('should have role="dialog" for screen readers', () => {
      render(<BatchSummary {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-label on the dialog', () => {
      render(<BatchSummary {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'Resumen de escaneo');
    });
  });
});
