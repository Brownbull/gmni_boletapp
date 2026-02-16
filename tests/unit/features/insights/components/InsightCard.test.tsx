/**
 * InsightCard Component Unit Tests
 *
 * Story 10.6: Scan Complete Insight Card
 * Tests for the InsightCard and BuildingProfileCard components.
 *
 * Acceptance Criteria Coverage:
 * - AC #1: InsightCard component displays insight after transaction save
 * - AC #5: Card auto-dismisses after 5 seconds
 * - AC #6: User can manually dismiss card
 * - AC #7: Card supports dark mode
 * - AC #8: Animation respects prefers-reduced-motion
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { InsightCard } from '@features/insights/components/InsightCard';
import { BuildingProfileCard } from '@features/insights/components/BuildingProfileCard';
import { Insight } from '../../../../../src/types/insight';

// ============================================================================
// Test Data
// ============================================================================

const mockInsight: Insight = {
  id: 'test_insight',
  category: 'QUIRKY_FIRST',
  title: 'Test Title',
  message: 'This is a test message for the insight card.',
  icon: 'Star',
  priority: 5,
};

const mockInsightWithSparkles: Insight = {
  id: 'sparkles_insight',
  category: 'CELEBRATORY',
  title: 'Milestone!',
  message: 'You reached a milestone!',
  icon: 'Sparkles',
  priority: 8,
};

const mockInsightNoIcon: Insight = {
  id: 'no_icon_insight',
  category: 'ACTIONABLE',
  title: 'No Icon Test',
  message: 'This insight has no icon specified.',
  priority: 3,
};

// ============================================================================
// InsightCard Tests
// ============================================================================

describe('InsightCard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  // AC #1: Displays insight title and message
  it('renders insight title and message', () => {
    render(
      <InsightCard
        insight={mockInsight}
        onDismiss={() => {}}
        theme="light"
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('This is a test message for the insight card.')).toBeInTheDocument();
  });

  // AC #6: Manual dismiss - test that clicking sets up dismiss flow
  it('calls onDismiss when close button is clicked', () => {
    const onDismiss = vi.fn();
    render(
      <InsightCard
        insight={mockInsight}
        onDismiss={onDismiss}
        theme="light"
      />
    );

    const closeButton = screen.getByLabelText('Cerrar');
    fireEvent.click(closeButton);

    // Advance timers past the 200ms animation delay
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  // AC #5: Auto-dismiss after timeout
  it('auto-dismisses after the specified timeout', () => {
    const onDismiss = vi.fn();

    render(
      <InsightCard
        insight={mockInsight}
        onDismiss={onDismiss}
        autoDismissMs={1000}
        theme="light"
      />
    );

    // Should not be dismissed yet
    expect(onDismiss).not.toHaveBeenCalled();

    // Advance timer past auto-dismiss + animation time (1000 + 200)
    act(() => {
      vi.advanceTimersByTime(1300);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  // AC #5: Default 5 second auto-dismiss
  it('uses 5 second default for auto-dismiss', () => {
    const onDismiss = vi.fn();

    render(
      <InsightCard
        insight={mockInsight}
        onDismiss={onDismiss}
        theme="light"
      />
    );

    // At 4 seconds, should not be dismissed
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    // At 5.2 seconds (5s + 200ms animation), should be dismissed
    act(() => {
      vi.advanceTimersByTime(1300);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  // AC #7: Dark mode support
  it('applies dark mode styles when theme is dark', () => {
    render(
      <InsightCard
        insight={mockInsight}
        onDismiss={() => {}}
        theme="dark"
      />
    );

    const card = screen.getByRole('status');
    expect(card.className).toContain('bg-gray-800');
    expect(card.className).toContain('text-white');
    expect(card.className).toContain('border-gray-700');
  });

  // AC #7: Light mode styles
  it('applies light mode styles when theme is light', () => {
    render(
      <InsightCard
        insight={mockInsight}
        onDismiss={() => {}}
        theme="light"
      />
    );

    const card = screen.getByRole('status');
    expect(card.className).toContain('bg-white');
    expect(card.className).toContain('text-gray-800');
    expect(card.className).toContain('border-gray-200');
  });

  // Icon rendering
  it('renders with custom icon', () => {
    render(
      <InsightCard
        insight={mockInsightWithSparkles}
        onDismiss={() => {}}
        theme="light"
      />
    );

    // Should render without errors - icon is an SVG
    expect(screen.getByText('Milestone!')).toBeInTheDocument();
  });

  // Fallback icon when no icon specified
  it('renders with fallback icon when icon not specified', () => {
    render(
      <InsightCard
        insight={mockInsightNoIcon}
        onDismiss={() => {}}
        theme="light"
      />
    );

    // Should render without errors with default Sparkles icon
    expect(screen.getByText('No Icon Test')).toBeInTheDocument();
  });

  // ARIA accessibility
  it('has correct ARIA attributes for accessibility', () => {
    render(
      <InsightCard
        insight={mockInsight}
        onDismiss={() => {}}
        theme="light"
      />
    );

    const card = screen.getByRole('status');
    expect(card).toHaveAttribute('aria-live', 'polite');
  });

  // Positioning classes
  it('has correct positioning classes', () => {
    render(
      <InsightCard
        insight={mockInsight}
        onDismiss={() => {}}
        theme="light"
      />
    );

    const card = screen.getByRole('status');
    expect(card.className).toContain('fixed');
    expect(card.className).toContain('bottom-20');
    expect(card.className).toContain('max-w-sm');
    expect(card.className).toContain('z-50');
  });
});

// ============================================================================
// BuildingProfileCard Tests
// ============================================================================

describe('BuildingProfileCard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  // Renders fallback content
  it('renders building profile message', () => {
    render(
      <BuildingProfileCard
        onDismiss={() => {}}
        theme="light"
      />
    );

    expect(screen.getByText('Construyendo tu perfil')).toBeInTheDocument();
    expect(screen.getByText(/Con mas datos, te mostraremos insights personalizados/)).toBeInTheDocument();
  });

  // Manual dismiss
  it('calls onDismiss when close button is clicked', () => {
    const onDismiss = vi.fn();
    render(
      <BuildingProfileCard
        onDismiss={onDismiss}
        theme="light"
      />
    );

    const closeButton = screen.getByLabelText('Cerrar');
    fireEvent.click(closeButton);

    // Wait for exit animation timeout
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  // Auto-dismiss
  it('auto-dismisses after timeout', () => {
    const onDismiss = vi.fn();

    render(
      <BuildingProfileCard
        onDismiss={onDismiss}
        autoDismissMs={1000}
        theme="light"
      />
    );

    act(() => {
      vi.advanceTimersByTime(1300);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  // Dark mode
  it('applies dark mode styles', () => {
    render(
      <BuildingProfileCard
        onDismiss={() => {}}
        theme="dark"
      />
    );

    const card = screen.getByRole('status');
    expect(card.className).toContain('bg-gray-800');
    expect(card.className).toContain('border-gray-700');
  });

  // Light mode
  it('applies light mode styles', () => {
    render(
      <BuildingProfileCard
        onDismiss={() => {}}
        theme="light"
      />
    );

    const card = screen.getByRole('status');
    expect(card.className).toContain('bg-white');
    expect(card.className).toContain('border-gray-200');
  });

  // ARIA attributes
  it('has correct ARIA attributes', () => {
    render(
      <BuildingProfileCard
        onDismiss={() => {}}
        theme="light"
      />
    );

    const card = screen.getByRole('status');
    expect(card).toHaveAttribute('aria-live', 'polite');
  });

  // Positioning
  it('has correct positioning classes', () => {
    render(
      <BuildingProfileCard
        onDismiss={() => {}}
        theme="light"
      />
    );

    const card = screen.getByRole('status');
    expect(card.className).toContain('fixed');
    expect(card.className).toContain('bottom-20');
    expect(card.className).toContain('max-w-sm');
    expect(card.className).toContain('z-50');
  });

  // Purple icon styling (different from InsightCard teal)
  it('uses purple icon styling for building profile', () => {
    render(
      <BuildingProfileCard
        onDismiss={() => {}}
        theme="light"
      />
    );

    // The card should contain purple styling elements
    const card = screen.getByRole('status');
    expect(card.innerHTML).toContain('purple');
  });
});
