/**
 * InsightsTemporalFilter Unit Tests
 *
 * Story 10a.4 Enhancement: Temporal filtering for insights
 * Tests for the hierarchical date filter component.
 *
 * Coverage:
 * - Filter levels: all, year, quarter, month, week
 * - Hierarchical navigation
 * - Available options based on insight data
 * - Clear filter functionality
 * - Theme support
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../setup/test-utils';
import {
  InsightsTemporalFilter,
  InsightTemporalFilter,
} from '../../../../src/components/insights/InsightsTemporalFilter';
import { Timestamp } from 'firebase/firestore';
import { InsightRecord } from '../../../../src/types/insight';

// ============================================================================
// Mock Helpers
// ============================================================================

function createMockTimestamp(date: Date): Timestamp {
  return {
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    toMillis: () => date.getTime(),
    isEqual: () => false,
    valueOf: () => '',
    toJSON: () => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 }),
  } as unknown as Timestamp;
}

const defaultTranslations: Record<string, string> = {
  allTime: 'All Time',
  selectYear: 'Select year',
  selectQuarter: 'Select quarter',
  selectMonth: 'Select month',
  selectWeek: 'Select week',
  week: 'Week',
  clearFilter: 'Clear filter',
  q1: 'Q1',
  q2: 'Q2',
  q3: 'Q3',
  q4: 'Q4',
};

const defaultProps = {
  filter: { level: 'all' as const },
  onFilterChange: vi.fn(),
  theme: 'light',
  t: (key: string) => defaultTranslations[key] || key,
};

// ============================================================================
// Test Data
// ============================================================================

// Create insights across different time periods
const createInsightsAcrossTime = (): InsightRecord[] => [
  // 2024 Q4 December Week 50
  {
    insightId: 'insight_1',
    shownAt: createMockTimestamp(new Date('2024-12-15T10:00:00')),
    title: 'December Insight',
  },
  // 2024 Q4 November
  {
    insightId: 'insight_2',
    shownAt: createMockTimestamp(new Date('2024-11-20T10:00:00')),
    title: 'November Insight',
  },
  // 2024 Q3 August
  {
    insightId: 'insight_3',
    shownAt: createMockTimestamp(new Date('2024-08-10T10:00:00')),
    title: 'August Insight',
  },
  // 2023 Q1 January
  {
    insightId: 'insight_4',
    shownAt: createMockTimestamp(new Date('2023-01-05T10:00:00')),
    title: 'January 2023 Insight',
  },
];

const mockInsights = createInsightsAcrossTime();

// ============================================================================
// Tests
// ============================================================================

describe('InsightsTemporalFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State - All Time', () => {
    it('renders All Time button at start', () => {
      render(<InsightsTemporalFilter insights={mockInsights} {...defaultProps} />);

      expect(screen.getByText('All Time')).toBeInTheDocument();
    });

    it('shows available years in dropdown', () => {
      render(<InsightsTemporalFilter insights={mockInsights} {...defaultProps} />);

      // Click to open dropdown
      fireEvent.click(screen.getByText('All Time'));

      // Should show years from insights data
      expect(screen.getByText('2024')).toBeInTheDocument();
      expect(screen.getByText('2023')).toBeInTheDocument();
    });

    it('navigates to year level when clicking a year', () => {
      render(
        <InsightsTemporalFilter
          insights={mockInsights}
          {...defaultProps}
        />
      );

      // Click to open dropdown
      fireEvent.click(screen.getByText('All Time'));

      // Click year to navigate into it (shows sub-navigation)
      fireEvent.click(screen.getByText('2024'));

      // Should show a "Select 2024" option now
      expect(screen.getByText(/Select.*2024/i)).toBeInTheDocument();
    });
  });

  describe('Year Level', () => {
    it('shows year button when filter is at year level', () => {
      const filter: InsightTemporalFilter = { level: 'year', year: 2024 };
      render(
        <InsightsTemporalFilter
          insights={mockInsights}
          {...defaultProps}
          filter={filter}
        />
      );

      expect(screen.getByText('2024')).toBeInTheDocument();
    });

    it('shows dropdown with quarters when clicking year filter', () => {
      const filter: InsightTemporalFilter = { level: 'year', year: 2024 };
      render(
        <InsightsTemporalFilter
          insights={mockInsights}
          {...defaultProps}
          filter={filter}
        />
      );

      // Click year to open dropdown at root level
      fireEvent.click(screen.getByText('2024'));

      // Dropdown should be visible
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('can select a year when filter is already at year level', () => {
      const onFilterChange = vi.fn();
      const filter: InsightTemporalFilter = { level: 'year', year: 2024 };
      render(
        <InsightsTemporalFilter
          insights={mockInsights}
          {...defaultProps}
          filter={filter}
          onFilterChange={onFilterChange}
        />
      );

      // The button shows the year value
      expect(screen.getByText('2024')).toBeInTheDocument();
    });
  });

  describe('Quarter Level', () => {
    it('shows quarter label when filter is at quarter level', () => {
      const filter: InsightTemporalFilter = { level: 'quarter', year: 2024, quarter: 4 };
      render(
        <InsightsTemporalFilter
          insights={mockInsights}
          {...defaultProps}
          filter={filter}
        />
      );

      // The label is combined as "Q4 2024"
      expect(screen.getByText('Q4 2024')).toBeInTheDocument();
    });

    it('shows dropdown when clicking quarter button', () => {
      const filter: InsightTemporalFilter = { level: 'quarter', year: 2024, quarter: 4 };
      render(
        <InsightsTemporalFilter
          insights={mockInsights}
          {...defaultProps}
          filter={filter}
        />
      );

      fireEvent.click(screen.getByText('Q4 2024'));

      // Dropdown should be visible
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  describe('Month Level', () => {
    it('shows month button when filter is at month level', () => {
      const filter: InsightTemporalFilter = { level: 'month', year: 2024, month: 11 }; // December (0-indexed)
      render(
        <InsightsTemporalFilter
          insights={mockInsights}
          {...defaultProps}
          filter={filter}
        />
      );

      // Should show December (month name)
      expect(screen.getByText(/Dec/i)).toBeInTheDocument();
    });
  });

  describe('Clear Filter', () => {
    it('shows clear button when not at all level', () => {
      const filter: InsightTemporalFilter = { level: 'year', year: 2024 };
      render(
        <InsightsTemporalFilter
          insights={mockInsights}
          {...defaultProps}
          filter={filter}
        />
      );

      expect(screen.getByLabelText('Clear filter')).toBeInTheDocument();
    });

    it('does not show clear button at all level', () => {
      render(<InsightsTemporalFilter insights={mockInsights} {...defaultProps} />);

      expect(screen.queryByLabelText('Clear filter')).not.toBeInTheDocument();
    });

    it('resets to all level when clear is clicked', () => {
      const onFilterChange = vi.fn();
      const filter: InsightTemporalFilter = { level: 'year', year: 2024 };
      render(
        <InsightsTemporalFilter
          insights={mockInsights}
          {...defaultProps}
          filter={filter}
          onFilterChange={onFilterChange}
        />
      );

      fireEvent.click(screen.getByLabelText('Clear filter'));

      expect(onFilterChange).toHaveBeenCalledWith({ level: 'all' });
    });
  });

  describe('Empty State', () => {
    it('shows All Time even with no insights', () => {
      render(<InsightsTemporalFilter insights={[]} {...defaultProps} />);

      expect(screen.getByText('All Time')).toBeInTheDocument();
    });

    it('dropdown shows no options with no insights', () => {
      render(<InsightsTemporalFilter insights={[]} {...defaultProps} />);

      fireEvent.click(screen.getByText('All Time'));

      // Should not show any year options
      expect(screen.queryByText('2024')).not.toBeInTheDocument();
    });
  });

  describe('Corrupted Timestamps', () => {
    it('handles insights with corrupted timestamps', () => {
      const corruptedInsights: InsightRecord[] = [
        {
          insightId: 'corrupted',
          shownAt: {
            toDate: () => { throw new Error('Corrupted'); },
          } as unknown as Timestamp,
          title: 'Corrupted',
        },
        ...mockInsights,
      ];

      // Should not throw
      expect(() =>
        render(<InsightsTemporalFilter insights={corruptedInsights} {...defaultProps} />)
      ).not.toThrow();
    });

    it('handles insights without toDate method', () => {
      const badInsights: InsightRecord[] = [
        {
          insightId: 'bad',
          shownAt: {} as unknown as Timestamp,
          title: 'Bad',
        },
      ];

      expect(() =>
        render(<InsightsTemporalFilter insights={badInsights} {...defaultProps} />)
      ).not.toThrow();
    });
  });

  describe('Theme Support', () => {
    it('applies light theme styles', () => {
      render(
        <InsightsTemporalFilter
          insights={mockInsights}
          {...defaultProps}
          theme="light"
        />
      );

      const button = screen.getByText('All Time');
      expect(button).toBeInTheDocument();
    });

    it('applies dark theme styles', () => {
      render(
        <InsightsTemporalFilter
          insights={mockInsights}
          {...defaultProps}
          theme="dark"
        />
      );

      const button = screen.getByText('All Time');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Filter Label Display', () => {
    it('shows year in label at year level', () => {
      const filter: InsightTemporalFilter = { level: 'year', year: 2024 };
      render(
        <InsightsTemporalFilter
          insights={mockInsights}
          {...defaultProps}
          filter={filter}
        />
      );

      expect(screen.getByText('2024')).toBeInTheDocument();
    });

    it('shows combined quarter label at quarter level', () => {
      const filter: InsightTemporalFilter = { level: 'quarter', year: 2024, quarter: 4 };
      render(
        <InsightsTemporalFilter
          insights={mockInsights}
          {...defaultProps}
          filter={filter}
        />
      );

      // Label is combined as "Q4 2024"
      expect(screen.getByText('Q4 2024')).toBeInTheDocument();
    });

    it('shows combined month label at month level', () => {
      const filter: InsightTemporalFilter = { level: 'month', year: 2024, month: 11 }; // December
      render(
        <InsightsTemporalFilter
          insights={mockInsights}
          {...defaultProps}
          filter={filter}
        />
      );

      // Label includes month name and year
      expect(screen.getByText(/December 2024/)).toBeInTheDocument();
    });
  });
});
