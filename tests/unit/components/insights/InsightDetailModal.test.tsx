/**
 * InsightDetailModal Unit Tests
 *
 * Story 10a.4 Enhancement: Insight detail view on click
 * Tests for the modal that shows insight details with transaction navigation.
 *
 * Coverage:
 * - Modal renders with all insight fields
 * - Close button functionality
 * - View Transaction button (conditional)
 * - Backward compatibility for old records
 * - Theme support (light/dark)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../setup/test-utils';
import { InsightDetailModal } from '../../../../src/components/insights/InsightDetailModal';
import { InsightRecord } from '../../../../src/types/insight';
import { createMockTimestamp } from '../../../helpers';

const defaultTranslations: Record<string, string> = {
  close: 'Close',
  viewTransaction: 'View Transaction',
  noMessageAvailable: 'No additional details available',
  deleteInsight: 'Delete Insight',
  deleting: 'Deleting...',
};

const defaultProps = {
  onClose: vi.fn(),
  onNavigateToTransaction: vi.fn(),
  onDelete: vi.fn().mockResolvedValue(undefined),
  theme: 'light',
  t: (key: string) => defaultTranslations[key] || key,
};

// ============================================================================
// Test Data
// ============================================================================

const mockInsightFull: InsightRecord = {
  insightId: 'merchant_frequency',
  shownAt: createMockTimestamp(new Date('2024-12-15T14:30:00')),
  transactionId: 'tx-123',
  title: 'Frequent Visitor',
  message: 'This is your 3rd visit to Jumbo this month!',
  category: 'ACTIONABLE',
  icon: 'Repeat',
};

const mockInsightNoTransaction: InsightRecord = {
  insightId: 'weekend_warrior',
  shownAt: createMockTimestamp(new Date('2024-12-14T10:00:00')),
  title: 'Weekend Warrior',
  message: 'You shop more on weekends!',
  category: 'QUIRKY_FIRST',
  icon: 'Calendar',
};

const mockInsightOldFormat: InsightRecord = {
  insightId: 'legacy_insight_id',
  shownAt: createMockTimestamp(new Date('2024-12-10T08:00:00')),
  transactionId: 'tx-456',
  // No title, message, icon, category - old format
};

// ============================================================================
// Tests
// ============================================================================

describe('InsightDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Rendering', () => {
    it('renders modal with all insight fields', () => {
      render(<InsightDetailModal insight={mockInsightFull} {...defaultProps} />);

      expect(screen.getByText('Frequent Visitor')).toBeInTheDocument();
      expect(screen.getByText('This is your 3rd visit to Jumbo this month!')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('displays date in readable format', () => {
      render(<InsightDetailModal insight={mockInsightFull} {...defaultProps} />);

      // Date should be formatted (locale-dependent, check for presence of year)
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });

    it('uses type-specific icon based on insightId', () => {
      render(<InsightDetailModal insight={mockInsightFull} {...defaultProps} />);

      // Icon should be rendered (we can check for svg element)
      const dialog = screen.getByRole('dialog');
      expect(dialog.querySelector('svg')).toBeInTheDocument();
    });

    it('uses category-based fallback icon when insightId not in config', () => {
      const unknownInsight: InsightRecord = {
        insightId: 'unknown_insight_type',
        shownAt: createMockTimestamp(),
        category: 'CELEBRATORY',
        title: 'Unknown Type',
        message: 'Test message',
      };
      render(<InsightDetailModal insight={unknownInsight} {...defaultProps} />);

      // Should render without error
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    it('renders X close button in header', () => {
      render(<InsightDetailModal insight={mockInsightFull} {...defaultProps} />);

      // Only one close button - header X (no footer close button)
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('calls onClose when X close button is clicked', () => {
      const onClose = vi.fn();
      render(<InsightDetailModal insight={mockInsightFull} {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking backdrop', () => {
      const onClose = vi.fn();
      render(<InsightDetailModal insight={mockInsightFull} {...defaultProps} onClose={onClose} />);

      // Click the backdrop (the element with aria-hidden)
      const backdrop = document.querySelector('[aria-hidden="true"]');
      fireEvent.click(backdrop!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicking modal content', () => {
      const onClose = vi.fn();
      render(<InsightDetailModal insight={mockInsightFull} {...defaultProps} onClose={onClose} />);

      // Click the modal dialog itself
      const modal = screen.getByRole('dialog');
      fireEvent.click(modal);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('View Transaction Button', () => {
    it('shows View Transaction button when transactionId exists', () => {
      render(<InsightDetailModal insight={mockInsightFull} {...defaultProps} />);

      expect(screen.getByRole('button', { name: /View Transaction/i })).toBeInTheDocument();
    });

    it('hides View Transaction button when no transactionId', () => {
      render(<InsightDetailModal insight={mockInsightNoTransaction} {...defaultProps} />);

      expect(screen.queryByRole('button', { name: /View Transaction/i })).not.toBeInTheDocument();
    });

    it('calls onNavigateToTransaction when button is clicked', () => {
      const onNavigateToTransaction = vi.fn();
      render(
        <InsightDetailModal
          insight={mockInsightFull}
          {...defaultProps}
          onNavigateToTransaction={onNavigateToTransaction}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /View Transaction/i }));

      expect(onNavigateToTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Backward Compatibility', () => {
    it('uses insightId as fallback title for old records', () => {
      render(<InsightDetailModal insight={mockInsightOldFormat} {...defaultProps} />);

      // snake_case should be converted to readable format
      expect(screen.getByText(/legacy insight id/i)).toBeInTheDocument();
    });

    it('shows fallback message for old records without message', () => {
      render(<InsightDetailModal insight={mockInsightOldFormat} {...defaultProps} />);

      expect(screen.getByText('No additional details available')).toBeInTheDocument();
    });

    it('handles corrupted timestamp gracefully', () => {
      const corruptedInsight: InsightRecord = {
        insightId: 'corrupted',
        shownAt: {
          toDate: () => { throw new Error('Corrupted'); },
        } as unknown as Timestamp,
        title: 'Corrupted Test',
      };

      // Should not throw
      expect(() => render(<InsightDetailModal insight={corruptedInsight} {...defaultProps} />)).not.toThrow();
    });

    it('handles timestamp without toDate method', () => {
      const badTimestamp: InsightRecord = {
        insightId: 'bad_ts',
        shownAt: {} as unknown as Timestamp,
        title: 'Bad Timestamp',
      };

      expect(() => render(<InsightDetailModal insight={badTimestamp} {...defaultProps} />)).not.toThrow();
    });
  });

  describe('Theme Support', () => {
    it('applies light theme styles', () => {
      render(<InsightDetailModal insight={mockInsightFull} {...defaultProps} theme="light" />);

      const dialog = screen.getByRole('dialog');
      expect(dialog.getAttribute('style')).toContain('background-color: var(--surface)');
    });

    it('applies dark theme styles', () => {
      render(<InsightDetailModal insight={mockInsightFull} {...defaultProps} theme="dark" />);

      const dialog = screen.getByRole('dialog');
      expect(dialog.getAttribute('style')).toContain('background-color: var(--surface)');
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog role and aria attributes', () => {
      render(<InsightDetailModal insight={mockInsightFull} {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('has close button with aria-label', () => {
      render(<InsightDetailModal insight={mockInsightFull} {...defaultProps} />);

      // Header close button should have aria-label
      const closeButtons = screen.getAllByRole('button');
      const headerCloseBtn = closeButtons.find(btn => btn.getAttribute('aria-label'));
      expect(headerCloseBtn).toBeDefined();
    });
  });
});
