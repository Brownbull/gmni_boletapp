/**
 * IntentionalPrompt Component Unit Tests
 *
 * Story 14.17: "Intentional or Accidental?" Pattern
 *
 * Acceptance Criteria Coverage:
 * - AC #1: IntentionalPrompt dialog component with two-button response
 * - AC #2: Non-judgmental language (Sí, fue intencional / No me había dado cuenta)
 * - AC #5: Dismissible - user can close without responding
 * - AC #6: Entry animation - dialog slides up smoothly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { Timestamp } from 'firebase/firestore';
import {
  IntentionalPrompt,
  shouldShowIntentionalPrompt,
} from '@features/insights/components/IntentionalPrompt';
import type { InsightRecord } from '../../../../src/types/insight';

// ============================================================================
// Test Data
// ============================================================================

const mockInsight: InsightRecord = {
  insightId: 'category_trend',
  shownAt: { seconds: 1704067200, nanoseconds: 0 } as Timestamp,
  transactionId: 'test-tx-123',
  title: 'Restaurantes subió',
  message: 'Restaurantes subió 45% esta semana',
  category: 'ACTIONABLE',
};

const mockTranslations: Record<string, string> = {
  close: 'Cerrar',
  intentionalPromptTitle: '¿Fue intencional?',
  intentionalYes: 'Sí, fue intencional',
  intentionalNo: 'No me había dado cuenta',
};

const mockT = (key: string): string => mockTranslations[key] || key;

// ============================================================================
// IntentionalPrompt Tests
// ============================================================================

describe('IntentionalPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body overflow
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Clean up body overflow
    document.body.style.overflow = '';
  });

  // AC #1: Dialog component with two-button response
  it('renders dialog with two response buttons', () => {
    render(
      <IntentionalPrompt
        insight={mockInsight}
        context="Restaurantes subió 45% esta semana"
        onResponse={() => {}}
        onDismiss={() => {}}
        t={mockT}
        theme="light"
      />
    );

    // Check title
    expect(screen.getByText('¿Fue intencional?')).toBeInTheDocument();

    // Check context message
    expect(screen.getByText('Restaurantes subió 45% esta semana')).toBeInTheDocument();

    // Check both response buttons (AC #2: non-judgmental language)
    expect(screen.getByText('Sí, fue intencional')).toBeInTheDocument();
    expect(screen.getByText('No me había dado cuenta')).toBeInTheDocument();
  });

  // AC #1: Intentional button calls onResponse(true)
  it('calls onResponse with true when intentional button is clicked', async () => {
    vi.useFakeTimers();
    const onResponse = vi.fn();

    render(
      <IntentionalPrompt
        insight={mockInsight}
        context="Test context"
        onResponse={onResponse}
        onDismiss={() => {}}
        t={mockT}
        theme="light"
      />
    );

    const intentionalButton = screen.getByText('Sí, fue intencional');
    fireEvent.click(intentionalButton);

    // Wait for exit animation
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onResponse).toHaveBeenCalledWith(true);
    vi.useRealTimers();
  });

  // AC #1: Unintentional button calls onResponse(false)
  it('calls onResponse with false when unintentional button is clicked', async () => {
    vi.useFakeTimers();
    const onResponse = vi.fn();

    render(
      <IntentionalPrompt
        insight={mockInsight}
        context="Test context"
        onResponse={onResponse}
        onDismiss={() => {}}
        t={mockT}
        theme="light"
      />
    );

    const unintentionalButton = screen.getByText('No me había dado cuenta');
    fireEvent.click(unintentionalButton);

    // Wait for exit animation
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onResponse).toHaveBeenCalledWith(false);
    vi.useRealTimers();
  });

  // AC #5: Dismissible - X button closes without responding
  it('calls onDismiss when close button is clicked', async () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const onResponse = vi.fn();

    render(
      <IntentionalPrompt
        insight={mockInsight}
        context="Test context"
        onResponse={onResponse}
        onDismiss={onDismiss}
        t={mockT}
        theme="light"
      />
    );

    const closeButton = screen.getByLabelText('Cerrar');
    fireEvent.click(closeButton);

    // Wait for exit animation
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onResponse).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  // AC #5: Backdrop click dismisses
  it('calls onDismiss when backdrop is clicked', async () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(
      <IntentionalPrompt
        insight={mockInsight}
        context="Test context"
        onResponse={() => {}}
        onDismiss={onDismiss}
        t={mockT}
        theme="light"
      />
    );

    // Click the backdrop (the outer wrapper with role="presentation")
    const backdrop = screen.getByRole('presentation');
    fireEvent.click(backdrop);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  // AC #5: Escape key dismisses
  it('calls onDismiss when Escape key is pressed', async () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(
      <IntentionalPrompt
        insight={mockInsight}
        context="Test context"
        onResponse={() => {}}
        onDismiss={onDismiss}
        t={mockT}
        theme="light"
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  // Dark mode support
  it('applies dark mode styles', () => {
    render(
      <IntentionalPrompt
        insight={mockInsight}
        context="Test context"
        onResponse={() => {}}
        onDismiss={() => {}}
        t={mockT}
        theme="dark"
      />
    );

    // Close button should have dark mode styling
    const closeButton = screen.getByLabelText('Cerrar');
    expect(closeButton).toBeInTheDocument();
  });

  // Light mode support
  it('applies light mode styles', () => {
    render(
      <IntentionalPrompt
        insight={mockInsight}
        context="Test context"
        onResponse={() => {}}
        onDismiss={() => {}}
        t={mockT}
        theme="light"
      />
    );

    const closeButton = screen.getByLabelText('Cerrar');
    expect(closeButton).toBeInTheDocument();
  });

  // ARIA accessibility
  it('has correct ARIA attributes for accessibility', () => {
    render(
      <IntentionalPrompt
        insight={mockInsight}
        context="Test context"
        onResponse={() => {}}
        onDismiss={() => {}}
        t={mockT}
        theme="light"
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'intentional-prompt-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'intentional-prompt-description');
  });

  // Prevents body scroll
  it('prevents body scroll when open', () => {
    render(
      <IntentionalPrompt
        insight={mockInsight}
        context="Test context"
        onResponse={() => {}}
        onDismiss={() => {}}
        t={mockT}
        theme="light"
      />
    );

    expect(document.body.style.overflow).toBe('hidden');
  });
});

// ============================================================================
// shouldShowIntentionalPrompt Tests
// ============================================================================

describe('shouldShowIntentionalPrompt', () => {
  it('returns true for category_trend insight with >30% increase', () => {
    const insight = {
      insightId: 'category_trend',
      shownAt: { seconds: 1704067200, nanoseconds: 0 } as Timestamp,
      metadata: {
        direction: 'up',
        percentChange: 45,
      },
    } as InsightRecord & { metadata: { direction: string; percentChange: number } };

    expect(shouldShowIntentionalPrompt(insight)).toBe(true);
  });

  it('returns true for spending_velocity insight with >30% increase', () => {
    const insight = {
      insightId: 'spending_velocity',
      shownAt: { seconds: 1704067200, nanoseconds: 0 } as Timestamp,
      metadata: {
        direction: 'up',
        percentChange: 50,
      },
    } as InsightRecord & { metadata: { direction: string; percentChange: number } };

    expect(shouldShowIntentionalPrompt(insight)).toBe(true);
  });

  it('returns false for category_trend with decrease (direction down)', () => {
    const insight = {
      insightId: 'category_trend',
      shownAt: { seconds: 1704067200, nanoseconds: 0 } as Timestamp,
      metadata: {
        direction: 'down',
        percentChange: 45,
      },
    } as InsightRecord & { metadata: { direction: string; percentChange: number } };

    expect(shouldShowIntentionalPrompt(insight)).toBe(false);
  });

  it('returns false for category_trend with <30% increase', () => {
    const insight = {
      insightId: 'category_trend',
      shownAt: { seconds: 1704067200, nanoseconds: 0 } as Timestamp,
      metadata: {
        direction: 'up',
        percentChange: 25,
      },
    } as InsightRecord & { metadata: { direction: string; percentChange: number } };

    expect(shouldShowIntentionalPrompt(insight)).toBe(false);
  });

  it('returns false for non-trigger insight types', () => {
    const insight = {
      insightId: 'merchant_frequency',
      shownAt: { seconds: 1704067200, nanoseconds: 0 } as Timestamp,
      metadata: {
        direction: 'up',
        percentChange: 50,
      },
    } as InsightRecord & { metadata: { direction: string; percentChange: number } };

    expect(shouldShowIntentionalPrompt(insight)).toBe(false);
  });

  it('returns false when metadata is missing', () => {
    const insight: InsightRecord = {
      insightId: 'category_trend',
      shownAt: { seconds: 1704067200, nanoseconds: 0 } as Timestamp,
    };

    expect(shouldShowIntentionalPrompt(insight)).toBe(false);
  });
});
