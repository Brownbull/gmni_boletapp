/**
 * AirlockTemporalFilter Component Unit Tests
 *
 * Story 14.33c.1: Airlock Generation & Persistence (AC7)
 *
 * Acceptance Criteria Coverage:
 * - AC #7: Temporal filtering by year/quarter/month/week
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  AirlockTemporalFilter,
  filterAirlocksByTemporal,
  type AirlockTemporalFilterState,
} from '@features/insights/components/AirlockTemporalFilter';
import { AirlockRecord } from '../../../../../src/types/airlock';
import { createMockTimestamp } from '../../../../helpers';

// ============================================================================
// Test Helpers
// ============================================================================

const mockT = (key: string) => {
  const translations: Record<string, string> = {
    allTime: 'All Time',
    week: 'Week',
    clearFilter: 'Clear filter',
    selectYear: 'Select',
    selectQuarter: 'Select',
    selectMonth: 'Select',
  };
  return translations[key] || key;
};

function createMockAirlock(date: Date, id: string = 'airlock-1'): AirlockRecord {
  return {
    id,
    userId: 'user-123',
    title: 'Test Airlock',
    message: 'Test message',
    emoji: '☕',
    createdAt: createMockTimestamp(date),
    viewedAt: null,
  };
}

// ============================================================================
// filterAirlocksByTemporal Tests
// ============================================================================

describe('filterAirlocksByTemporal', () => {
  const jan2024 = new Date(2024, 0, 15);
  const mar2024 = new Date(2024, 2, 15);
  const jul2024 = new Date(2024, 6, 15);
  const dec2024 = new Date(2024, 11, 15);
  const jan2025 = new Date(2025, 0, 15);

  const airlocks = [
    createMockAirlock(jan2024, 'jan24'),
    createMockAirlock(mar2024, 'mar24'),
    createMockAirlock(jul2024, 'jul24'),
    createMockAirlock(dec2024, 'dec24'),
    createMockAirlock(jan2025, 'jan25'),
  ];

  it('returns all airlocks when level is "all"', () => {
    const filter: AirlockTemporalFilterState = { level: 'all' };
    const result = filterAirlocksByTemporal(airlocks, filter);
    expect(result).toHaveLength(5);
  });

  it('filters by year', () => {
    const filter: AirlockTemporalFilterState = { level: 'year', year: 2024 };
    const result = filterAirlocksByTemporal(airlocks, filter);
    expect(result).toHaveLength(4);
    expect(result.map((a) => a.id)).not.toContain('jan25');
  });

  it('filters by quarter', () => {
    const filter: AirlockTemporalFilterState = { level: 'quarter', year: 2024, quarter: 1 };
    const result = filterAirlocksByTemporal(airlocks, filter);
    expect(result).toHaveLength(2); // Jan and Mar are in Q1
    expect(result.map((a) => a.id)).toContain('jan24');
    expect(result.map((a) => a.id)).toContain('mar24');
  });

  it('filters by month', () => {
    const filter: AirlockTemporalFilterState = { level: 'month', year: 2024, month: 6 }; // July
    const result = filterAirlocksByTemporal(airlocks, filter);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('jul24');
  });

  it('handles corrupted timestamps gracefully', () => {
    const corruptedAirlock = {
      ...createMockAirlock(jan2024, 'corrupted'),
      createdAt: {
        toDate: () => {
          throw new Error('Corrupted');
        },
      } as unknown as Timestamp,
    };

    const filter: AirlockTemporalFilterState = { level: 'year', year: 2024 };
    const result = filterAirlocksByTemporal([corruptedAirlock], filter);
    expect(result).toHaveLength(0);
  });
});

// ============================================================================
// Component Rendering Tests
// ============================================================================

describe('AirlockTemporalFilter - Rendering', () => {
  const mockAirlocks = [
    createMockAirlock(new Date(2024, 5, 15), 'a1'),
    createMockAirlock(new Date(2024, 8, 15), 'a2'),
  ];

  it('renders nothing when no airlocks have valid dates', () => {
    const { container } = render(
      <AirlockTemporalFilter
        airlocks={[]}
        filter={{ level: 'all' }}
        onFilterChange={vi.fn()}
        theme="light"
        t={mockT}
      />
    );
    // Component returns null when no valid dates, so container.firstChild is null
    expect(container.firstChild).toBeNull();
  });

  it('renders filter button with "All Time" label by default', () => {
    render(
      <AirlockTemporalFilter
        airlocks={mockAirlocks}
        filter={{ level: 'all' }}
        onFilterChange={vi.fn()}
        theme="light"
        t={mockT}
      />
    );

    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('shows year in label when year filter is active', () => {
    render(
      <AirlockTemporalFilter
        airlocks={mockAirlocks}
        filter={{ level: 'year', year: 2024 }}
        onFilterChange={vi.fn()}
        theme="light"
        t={mockT}
      />
    );

    expect(screen.getByText('2024')).toBeInTheDocument();
  });

  it('shows clear button when filter is active', () => {
    render(
      <AirlockTemporalFilter
        airlocks={mockAirlocks}
        filter={{ level: 'year', year: 2024 }}
        onFilterChange={vi.fn()}
        theme="light"
        t={mockT}
      />
    );

    expect(screen.getByLabelText('Clear filter')).toBeInTheDocument();
  });

  it('does not show clear button when "all" filter', () => {
    render(
      <AirlockTemporalFilter
        airlocks={mockAirlocks}
        filter={{ level: 'all' }}
        onFilterChange={vi.fn()}
        theme="light"
        t={mockT}
      />
    );

    expect(screen.queryByLabelText('Clear filter')).not.toBeInTheDocument();
  });
});

// ============================================================================
// Interaction Tests
// ============================================================================

describe('AirlockTemporalFilter - Interactions', () => {
  const mockAirlocks = [
    createMockAirlock(new Date(2024, 5, 15), 'a1'),
    createMockAirlock(new Date(2024, 8, 15), 'a2'),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens dropdown when filter button is clicked', async () => {
    render(
      <AirlockTemporalFilter
        airlocks={mockAirlocks}
        filter={{ level: 'all' }}
        onFilterChange={vi.fn()}
        theme="light"
        t={mockT}
      />
    );

    fireEvent.click(screen.getByText('All Time'));

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  it('calls onFilterChange with "all" when clear button clicked', () => {
    const onFilterChange = vi.fn();

    render(
      <AirlockTemporalFilter
        airlocks={mockAirlocks}
        filter={{ level: 'year', year: 2024 }}
        onFilterChange={onFilterChange}
        theme="light"
        t={mockT}
      />
    );

    fireEvent.click(screen.getByLabelText('Clear filter'));

    expect(onFilterChange).toHaveBeenCalledWith({ level: 'all' });
  });

  it('shows available years in dropdown', async () => {
    render(
      <AirlockTemporalFilter
        airlocks={mockAirlocks}
        filter={{ level: 'all' }}
        onFilterChange={vi.fn()}
        theme="light"
        t={mockT}
      />
    );

    fireEvent.click(screen.getByText('All Time'));

    await waitFor(() => {
      expect(screen.getByText('2024')).toBeInTheDocument();
    });
  });

  it('calls onFilterChange when year is selected', async () => {
    const onFilterChange = vi.fn();

    render(
      <AirlockTemporalFilter
        airlocks={mockAirlocks}
        filter={{ level: 'all' }}
        onFilterChange={onFilterChange}
        theme="light"
        t={mockT}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByText('All Time'));

    // Click on year to drill down
    await waitFor(() => {
      fireEvent.click(screen.getByText('2024'));
    });

    // Now click "Select 2024" to select the year
    await waitFor(() => {
      const selectButton = screen.getByText(/Select.*2024/);
      fireEvent.click(selectButton);
    });

    expect(onFilterChange).toHaveBeenCalledWith({ level: 'year', year: 2024 });
  });
});

// ============================================================================
// Theme Tests
// ============================================================================

describe('AirlockTemporalFilter - Themes', () => {
  const mockAirlocks = [createMockAirlock(new Date(2024, 5, 15), 'a1')];

  it('renders correctly in light theme', () => {
    const { container } = render(
      <AirlockTemporalFilter
        airlocks={mockAirlocks}
        filter={{ level: 'all' }}
        onFilterChange={vi.fn()}
        theme="light"
        t={mockT}
      />
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders correctly in dark theme', () => {
    const { container } = render(
      <AirlockTemporalFilter
        airlocks={mockAirlocks}
        filter={{ level: 'all' }}
        onFilterChange={vi.fn()}
        theme="dark"
        t={mockT}
      />
    );

    expect(container.firstChild).toBeInTheDocument();
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('AirlockTemporalFilter - Accessibility', () => {
  const mockAirlocks = [createMockAirlock(new Date(2024, 5, 15), 'a1')];

  it('has aria-expanded attribute on button', () => {
    render(
      <AirlockTemporalFilter
        airlocks={mockAirlocks}
        filter={{ level: 'all' }}
        onFilterChange={vi.fn()}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button', { name: /All Time/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('updates aria-expanded when dropdown opens', async () => {
    render(
      <AirlockTemporalFilter
        airlocks={mockAirlocks}
        filter={{ level: 'all' }}
        onFilterChange={vi.fn()}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button', { name: /All Time/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('has aria-haspopup attribute', () => {
    render(
      <AirlockTemporalFilter
        airlocks={mockAirlocks}
        filter={{ level: 'all' }}
        onFilterChange={vi.fn()}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button', { name: /All Time/i });
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
  });
});
