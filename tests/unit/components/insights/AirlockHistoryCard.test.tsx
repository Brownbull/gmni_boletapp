/**
 * AirlockHistoryCard Component Unit Tests
 *
 * Story 14.33c.1: Airlock Generation & Persistence
 *
 * Acceptance Criteria Coverage:
 * - AC #5: Card displays emoji, title, date generated
 * - AC #6: Visual indicator for unviewed airlocks
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AirlockHistoryCard } from '@features/insights/components/AirlockHistoryCard';
import { AirlockRecord } from '../../../../src/types/airlock';
import { createMockTimestamp, createMockTimestampDaysAgo } from '../../../helpers';

// ============================================================================
// Test Helpers
// ============================================================================

const mockT = (key: string) => {
  const translations: Record<string, string> = {
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
// Basic Rendering Tests (AC5)
// ============================================================================

describe('AirlockHistoryCard - Basic Rendering', () => {
  it('displays emoji in card', () => {
    const airlock = createMockAirlock({ emoji: '🎯' });

    render(
      <AirlockHistoryCard
        airlock={airlock}
        onClick={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  it('displays title', () => {
    const airlock = createMockAirlock({ title: 'Test Title' });

    render(
      <AirlockHistoryCard
        airlock={airlock}
        onClick={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('displays Today for recent airlocks', () => {
    const airlock = createMockAirlock({ createdAt: createMockTimestamp() });

    render(
      <AirlockHistoryCard
        airlock={airlock}
        onClick={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('displays Yesterday for 1 day old airlocks', () => {
    const airlock = createMockAirlock({ createdAt: createMockTimestampDaysAgo(1) });

    render(
      <AirlockHistoryCard
        airlock={airlock}
        onClick={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });
});

// ============================================================================
// Unviewed State Tests (AC6)
// ============================================================================

describe('AirlockHistoryCard - Unviewed State', () => {
  it('AC6: shows "New" badge for unviewed airlocks', () => {
    const airlock = createMockAirlock({ viewedAt: null });

    render(
      <AirlockHistoryCard
        airlock={airlock}
        onClick={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('AC6: does NOT show badge for viewed airlocks', () => {
    const airlock = createMockAirlock({
      viewedAt: createMockTimestamp(),
    });

    render(
      <AirlockHistoryCard
        airlock={airlock}
        onClick={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    expect(screen.queryByText('New')).not.toBeInTheDocument();
  });
});

// ============================================================================
// Interaction Tests
// ============================================================================

describe('AirlockHistoryCard - Interactions', () => {
  it('calls onClick when card is clicked', () => {
    const onClick = vi.fn();
    const airlock = createMockAirlock();

    render(
      <AirlockHistoryCard
        airlock={airlock}
        onClick={onClick}
        t={mockT}
        theme="light"
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick on Enter key press', () => {
    const onClick = vi.fn();
    const airlock = createMockAirlock();

    render(
      <AirlockHistoryCard
        airlock={airlock}
        onClick={onClick}
        t={mockT}
        theme="light"
      />
    );

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick on Space key press', () => {
    const onClick = vi.fn();
    const airlock = createMockAirlock();

    render(
      <AirlockHistoryCard
        airlock={airlock}
        onClick={onClick}
        t={mockT}
        theme="light"
      />
    );

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('AirlockHistoryCard - Accessibility', () => {
  it('has role="button"', () => {
    render(
      <AirlockHistoryCard
        airlock={createMockAirlock()}
        onClick={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('has tabIndex=0 for keyboard navigation', () => {
    render(
      <AirlockHistoryCard
        airlock={createMockAirlock()}
        onClick={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    expect(screen.getByRole('button')).toHaveAttribute('tabIndex', '0');
  });

  it('has descriptive aria-label', () => {
    const airlock = createMockAirlock({
      title: 'Test Title',
      message: 'Test message',
    });

    render(
      <AirlockHistoryCard
        airlock={airlock}
        onClick={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    const card = screen.getByRole('button');
    const ariaLabel = card.getAttribute('aria-label');
    expect(ariaLabel).toContain('Test Title');
    expect(ariaLabel).toContain('Test message');
  });

  it('includes "New" in aria-label for unviewed airlocks', () => {
    const airlock = createMockAirlock({ viewedAt: null });

    render(
      <AirlockHistoryCard
        airlock={airlock}
        onClick={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    const card = screen.getByRole('button');
    expect(card.getAttribute('aria-label')).toContain('New');
  });
});

// ============================================================================
// Theme Tests
// ============================================================================

describe('AirlockHistoryCard - Themes', () => {
  it('renders correctly in light theme', () => {
    const { container } = render(
      <AirlockHistoryCard
        airlock={createMockAirlock()}
        onClick={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders correctly in dark theme', () => {
    const { container } = render(
      <AirlockHistoryCard
        airlock={createMockAirlock()}
        onClick={vi.fn()}
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

describe('AirlockHistoryCard - Edge Cases', () => {
  it('handles missing recommendation gracefully', () => {
    const airlock = createMockAirlock({
      recommendation: undefined,
    });

    render(
      <AirlockHistoryCard
        airlock={airlock}
        onClick={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    expect(screen.getByText(airlock.title)).toBeInTheDocument();
  });

  it('handles empty emoji', () => {
    const airlock = createMockAirlock({
      emoji: '',
    });

    const { container } = render(
      <AirlockHistoryCard
        airlock={airlock}
        onClick={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    // Should still render without crashing
    expect(container.firstChild).toBeInTheDocument();
  });
});
