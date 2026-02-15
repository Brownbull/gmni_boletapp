/**
 * AirlockHistoryList Component Unit Tests
 *
 * Story 14.33c.1: Airlock Generation & Persistence
 *
 * Acceptance Criteria Coverage:
 * - AC #5: Display saved airlocks below generate button
 *        - Sort by most recent first
 *        - Empty state messaging
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AirlockHistoryList } from '@features/insights/components/AirlockHistoryList';
import { AirlockRecord } from '../../../../src/types/airlock';
import { createMockTimestamp, createMockTimestampDaysAgo } from '../../../helpers';

// ============================================================================
// Test Helpers
// ============================================================================

const mockT = (key: string) => {
  const translations: Record<string, string> = {
    loading: 'Loading',
    noAirlocksYet: 'No airlocks generated yet',
    generateFirstAirlock: 'Generate your first AI insight!',
    yourAirlocks: 'Your Airlocks',
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: '{days} days ago',
    oneWeekAgo: '1 week ago',
    weeksAgo: '{weeks} weeks ago',
    newBadge: 'New',
  };
  return translations[key] || key;
};

function createMockAirlock(overrides: Partial<AirlockRecord> = {}): AirlockRecord {
  return {
    id: 'airlock-1',
    userId: 'user-123',
    title: 'Tu café de la semana',
    message: 'Gastaste $45 en café esta semana.',
    emoji: '☕',
    createdAt: createMockTimestamp(),
    viewedAt: null,
    ...overrides,
  };
}

// ============================================================================
// Loading State Tests
// ============================================================================

describe('AirlockHistoryList - Loading State', () => {
  it('shows loading spinner when isLoading is true', () => {
    render(
      <AirlockHistoryList
        airlocks={[]}
        isLoading={true}
        onAirlockClick={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

// ============================================================================
// Empty State Tests (AC5)
// ============================================================================

describe('AirlockHistoryList - Empty State', () => {
  it('AC5: shows empty state message when no airlocks', () => {
    render(
      <AirlockHistoryList
        airlocks={[]}
        isLoading={false}
        onAirlockClick={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    expect(screen.getByText('No airlocks generated yet')).toBeInTheDocument();
    expect(screen.getByText('Generate your first AI insight!')).toBeInTheDocument();
  });
});

// ============================================================================
// List Rendering Tests (AC5)
// ============================================================================

describe('AirlockHistoryList - List Rendering', () => {
  it('AC5: displays section header with airlock count', () => {
    const airlocks = [
      createMockAirlock({ id: 'a1', title: 'Airlock 1' }),
      createMockAirlock({ id: 'a2', title: 'Airlock 2' }),
    ];

    render(
      <AirlockHistoryList
        airlocks={airlocks}
        isLoading={false}
        onAirlockClick={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    expect(screen.getByText('Your Airlocks')).toBeInTheDocument();
    expect(screen.getByText('2 insights')).toBeInTheDocument();
  });

  it('shows singular "insight" for single airlock', () => {
    const airlocks = [createMockAirlock()];

    render(
      <AirlockHistoryList
        airlocks={airlocks}
        isLoading={false}
        onAirlockClick={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    expect(screen.getByText('1 insight')).toBeInTheDocument();
  });

  it('renders all airlock cards', () => {
    const airlocks = [
      createMockAirlock({ id: 'a1', title: 'Airlock One', emoji: '☕' }),
      createMockAirlock({ id: 'a2', title: 'Airlock Two', emoji: '🛒' }),
      createMockAirlock({ id: 'a3', title: 'Airlock Three', emoji: '🌙' }),
    ];

    render(
      <AirlockHistoryList
        airlocks={airlocks}
        isLoading={false}
        onAirlockClick={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    expect(screen.getByText('Airlock One')).toBeInTheDocument();
    expect(screen.getByText('Airlock Two')).toBeInTheDocument();
    expect(screen.getByText('Airlock Three')).toBeInTheDocument();
  });
});

// ============================================================================
// Sorting Tests (AC5)
// ============================================================================

describe('AirlockHistoryList - Sorting', () => {
  it('AC5: sorts airlocks by most recent first', () => {
    const airlocks = [
      createMockAirlock({ id: 'old', title: 'Old Airlock', createdAt: createMockTimestampDaysAgo(5) }),
      createMockAirlock({ id: 'new', title: 'New Airlock', createdAt: createMockTimestamp() }),
      createMockAirlock({ id: 'mid', title: 'Mid Airlock', createdAt: createMockTimestampDaysAgo(2) }),
    ];

    render(
      <AirlockHistoryList
        airlocks={airlocks}
        isLoading={false}
        onAirlockClick={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    const cards = screen.getAllByRole('button');

    // First card should be newest
    expect(cards[0]).toHaveTextContent('New Airlock');
    // Second should be middle
    expect(cards[1]).toHaveTextContent('Mid Airlock');
    // Last should be oldest
    expect(cards[2]).toHaveTextContent('Old Airlock');
  });
});

// ============================================================================
// Interaction Tests
// ============================================================================

describe('AirlockHistoryList - Interactions', () => {
  it('calls onAirlockClick with correct airlock when card clicked', () => {
    const onAirlockClick = vi.fn();
    const airlocks = [
      createMockAirlock({ id: 'a1', title: 'Clickable Airlock' }),
    ];

    render(
      <AirlockHistoryList
        airlocks={airlocks}
        isLoading={false}
        onAirlockClick={onAirlockClick}
        t={mockT}
        theme="light"
      />
    );

    fireEvent.click(screen.getByText('Clickable Airlock'));

    expect(onAirlockClick).toHaveBeenCalledTimes(1);
    expect(onAirlockClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a1', title: 'Clickable Airlock' })
    );
  });

  it('handles clicking different airlocks independently', () => {
    const onAirlockClick = vi.fn();
    const airlocks = [
      createMockAirlock({ id: 'a1', title: 'First' }),
      createMockAirlock({ id: 'a2', title: 'Second' }),
    ];

    render(
      <AirlockHistoryList
        airlocks={airlocks}
        isLoading={false}
        onAirlockClick={onAirlockClick}
        t={mockT}
        theme="light"
      />
    );

    fireEvent.click(screen.getByText('Second'));

    expect(onAirlockClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a2' })
    );
  });
});

// ============================================================================
// Theme Tests
// ============================================================================

describe('AirlockHistoryList - Themes', () => {
  it('renders correctly in light theme', () => {
    const { container } = render(
      <AirlockHistoryList
        airlocks={[createMockAirlock()]}
        isLoading={false}
        onAirlockClick={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders correctly in dark theme', () => {
    const { container } = render(
      <AirlockHistoryList
        airlocks={[createMockAirlock()]}
        isLoading={false}
        onAirlockClick={vi.fn()}
        t={mockT}
        theme="dark"
      />
    );

    expect(container.firstChild).toBeInTheDocument();
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('AirlockHistoryList - Edge Cases', () => {
  it('handles corrupted timestamps gracefully', () => {
    const airlockWithBadTimestamp = createMockAirlock({
      createdAt: {
        toDate: () => { throw new Error('Corrupted'); }
      } as unknown as Timestamp,
    });

    // Should not throw
    expect(() => {
      render(
        <AirlockHistoryList
          airlocks={[airlockWithBadTimestamp]}
          isLoading={false}
          onAirlockClick={vi.fn()}
          t={mockT}
          theme="light"
        />
      );
    }).not.toThrow();
  });
});
