/**
 * SessionComplete Component Unit Tests
 *
 * Story 14.20: Session Completion Messaging
 *
 * Tests for the SessionComplete component.
 * Coverage:
 * - AC #1: Component displays after save + insight flow
 * - AC #2: Encouraging messages based on context
 * - AC #3: Session summary display
 * - AC #4: Next-step suggestions
 * - AC #5: Auto-dismiss after 5 seconds + manual dismiss
 * - AC #6: Non-intrusive behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import {
  SessionComplete,
  selectMessage,
  getSuggestions,
  SessionContext,
  SessionAction,
} from '../../../../src/components/session/SessionComplete';

// Mock translation function
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    sessionCompleteTitle: 'Session Complete',
    sessionMsgDefault: 'Great check-in today!',
    sessionMsgPersonalRecord: 'Personal record achieved!',
    sessionMsgFirstOfWeek: 'First receipt this week!',
    sessionMsgStreak7: 'Amazing! You\'ve been tracking for {days} days',
    sessionMsgStreak3: 'You\'ve been at it for {days} days straight!',
    sessionMsgMultiple: '{count} receipts saved today!',
    sessionSuggestAnalytics: 'View your week',
    sessionSuggestScan: 'Scan another',
    sessionSuggestHistory: 'Review history',
    sessionSummaryTotal: 'Total saved',
    sessionSummaryCategories: 'categories',
    close: 'Close',
  };
  return translations[key] || key;
});

// Default context for tests
const defaultContext: SessionContext = {
  transactionsSaved: 1,
  consecutiveDays: 1,
  isFirstOfWeek: false,
  isPersonalRecord: false,
  totalAmount: 15000,
  currency: 'CLP',
  categoriesTouched: ['Supermercado'],
};

// Mock matchMedia for reduced motion tests
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: query.includes('prefers-reduced-motion') ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe('SessionComplete', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMatchMedia(false); // Default: animations enabled
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // AC #1: Component renders properly
  // ==========================================================================

  describe('AC #1: Component display', () => {
    it('renders the component with title', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();

      render(
        <SessionComplete
          context={defaultContext}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      expect(screen.getByText('Session Complete')).toBeInTheDocument();
    });

    it('has proper ARIA attributes for accessibility', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();

      render(
        <SessionComplete
          context={defaultContext}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('renders in dark theme correctly', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();

      render(
        <SessionComplete
          context={defaultContext}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="dark"
        />
      );

      const container = screen.getByRole('status');
      expect(container.className).toContain('bg-gray-800');
    });

    it('renders in light theme correctly', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();

      render(
        <SessionComplete
          context={defaultContext}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      const container = screen.getByRole('status');
      expect(container.className).toContain('bg-white');
    });
  });

  // ==========================================================================
  // AC #2: Message selection based on context
  // ==========================================================================

  describe('AC #2: Message selection', () => {
    describe('selectMessage function', () => {
      it('returns personal record message when isPersonalRecord is true', () => {
        const context: SessionContext = {
          ...defaultContext,
          isPersonalRecord: true,
        };
        expect(selectMessage(context)).toBe('sessionMsgPersonalRecord');
      });

      it('returns first of week message when isFirstOfWeek is true', () => {
        const context: SessionContext = {
          ...defaultContext,
          isFirstOfWeek: true,
        };
        expect(selectMessage(context)).toBe('sessionMsgFirstOfWeek');
      });

      it('returns 7-day streak message when consecutiveDays >= 7', () => {
        const context: SessionContext = {
          ...defaultContext,
          consecutiveDays: 7,
        };
        expect(selectMessage(context)).toBe('sessionMsgStreak7');
      });

      it('returns 3-day streak message when consecutiveDays >= 3 and < 7', () => {
        const context: SessionContext = {
          ...defaultContext,
          consecutiveDays: 5,
        };
        expect(selectMessage(context)).toBe('sessionMsgStreak3');
      });

      it('returns multiple transactions message when transactionsSaved > 1', () => {
        const context: SessionContext = {
          ...defaultContext,
          transactionsSaved: 3,
        };
        expect(selectMessage(context)).toBe('sessionMsgMultiple');
      });

      it('returns default message for basic session', () => {
        expect(selectMessage(defaultContext)).toBe('sessionMsgDefault');
      });

      it('prioritizes personal record over other conditions', () => {
        const context: SessionContext = {
          ...defaultContext,
          isPersonalRecord: true,
          isFirstOfWeek: true,
          consecutiveDays: 10,
          transactionsSaved: 5,
        };
        expect(selectMessage(context)).toBe('sessionMsgPersonalRecord');
      });

      it('prioritizes first of week over streak', () => {
        const context: SessionContext = {
          ...defaultContext,
          isFirstOfWeek: true,
          consecutiveDays: 10,
        };
        expect(selectMessage(context)).toBe('sessionMsgFirstOfWeek');
      });
    });

    it('displays the correct message with placeholder substitution', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();
      const context: SessionContext = {
        ...defaultContext,
        consecutiveDays: 10,
      };

      render(
        <SessionComplete
          context={context}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      expect(screen.getByText("Amazing! You've been tracking for 10 days")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC #3: Session summary display
  // ==========================================================================

  describe('AC #3: Session summary', () => {
    it('displays total amount when > 0', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();

      render(
        <SessionComplete
          context={defaultContext}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      // CLP formatting: $15.000
      expect(screen.getByText(/Total saved:/)).toBeInTheDocument();
    });

    it('does not display total when amount is 0', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();
      const context: SessionContext = {
        ...defaultContext,
        totalAmount: 0,
      };

      render(
        <SessionComplete
          context={context}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      expect(screen.queryByText(/Total saved:/)).not.toBeInTheDocument();
    });

    it('displays single category name when one category', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();

      render(
        <SessionComplete
          context={defaultContext}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      expect(screen.getByText('Supermercado')).toBeInTheDocument();
    });

    it('displays category count when multiple categories', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();
      const context: SessionContext = {
        ...defaultContext,
        categoriesTouched: ['Supermercado', 'Restaurante', 'Farmacia'],
      };

      render(
        <SessionComplete
          context={context}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      expect(screen.getByText('3 categories')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC #4: Next-step suggestions
  // ==========================================================================

  describe('AC #4: Next-step suggestions', () => {
    describe('getSuggestions function', () => {
      it('always includes analytics suggestion', () => {
        const suggestions = getSuggestions(defaultContext, mockT);
        expect(suggestions.some((s) => s.action === 'analytics')).toBe(true);
      });

      it('includes scan suggestion for quick sessions (< 3 transactions)', () => {
        const context: SessionContext = {
          ...defaultContext,
          transactionsSaved: 2,
        };
        const suggestions = getSuggestions(context, mockT);
        expect(suggestions.some((s) => s.action === 'scan')).toBe(true);
      });

      it('includes history suggestion for longer sessions (>= 3 transactions)', () => {
        const context: SessionContext = {
          ...defaultContext,
          transactionsSaved: 3,
        };
        const suggestions = getSuggestions(context, mockT);
        expect(suggestions.some((s) => s.action === 'history')).toBe(true);
      });

      it('returns max 2 suggestions', () => {
        const suggestions = getSuggestions(defaultContext, mockT);
        expect(suggestions.length).toBeLessThanOrEqual(2);
      });
    });

    it('renders suggestion buttons', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();

      render(
        <SessionComplete
          context={defaultContext}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      expect(screen.getByText('View your week')).toBeInTheDocument();
      expect(screen.getByText('Scan another')).toBeInTheDocument();
    });

    it('calls onAction when suggestion is clicked', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();

      render(
        <SessionComplete
          context={defaultContext}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      fireEvent.click(screen.getByText('View your week'));

      act(() => {
        vi.runAllTimers();
      });

      expect(onAction).toHaveBeenCalledWith('analytics');
    });

    it('dismisses component when suggestion is clicked', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();

      render(
        <SessionComplete
          context={defaultContext}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      fireEvent.click(screen.getByText('View your week'));

      act(() => {
        vi.runAllTimers();
      });

      expect(onDismiss).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // AC #5: Auto-dismiss and manual dismiss
  // ==========================================================================

  describe('AC #5: Auto-dismiss functionality', () => {
    it('auto-dismisses after default 5 seconds', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();

      render(
        <SessionComplete
          context={defaultContext}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      // Should not be dismissed yet
      expect(onDismiss).not.toHaveBeenCalled();

      // Fast-forward 5 seconds + animation delay
      act(() => {
        vi.advanceTimersByTime(5000 + 200);
      });

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('auto-dismisses after custom duration', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();

      render(
        <SessionComplete
          context={defaultContext}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
          autoDismissMs={3000}
        />
      );

      // Should not be dismissed at 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(onDismiss).not.toHaveBeenCalled();

      // Should be dismissed at 3 seconds + animation delay
      act(() => {
        vi.advanceTimersByTime(1000 + 200);
      });
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('pauses timer on mouse enter', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();

      render(
        <SessionComplete
          context={defaultContext}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      const container = screen.getByRole('status');

      // Hover over the component
      fireEvent.mouseEnter(container);

      // Fast-forward past the dismiss time
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // Should not be dismissed because timer is paused
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('resumes timer on mouse leave', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();

      render(
        <SessionComplete
          context={defaultContext}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      const container = screen.getByRole('status');

      // Hover, then leave
      fireEvent.mouseEnter(container);
      fireEvent.mouseLeave(container);

      // Fast-forward past the dismiss time
      act(() => {
        vi.advanceTimersByTime(5000 + 200);
      });

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('dismisses on close button click', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();

      render(
        <SessionComplete
          context={defaultContext}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      fireEvent.click(screen.getByLabelText('Close'));

      act(() => {
        vi.advanceTimersByTime(200); // Animation delay
      });

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('pauses timer on touch start', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();

      render(
        <SessionComplete
          context={defaultContext}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      const container = screen.getByRole('status');

      fireEvent.touchStart(container, {
        touches: [{ clientY: 100 }],
      });

      // Fast-forward past the dismiss time
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // Should not be dismissed because timer is paused
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('dismisses on swipe down (> 50px threshold)', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();

      render(
        <SessionComplete
          context={defaultContext}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      const container = screen.getByRole('status');

      // Start touch at y=100
      fireEvent.touchStart(container, {
        touches: [{ clientY: 100 }],
      });

      // Move down by 60px (exceeds 50px threshold)
      fireEvent.touchMove(container, {
        touches: [{ clientY: 160 }],
      });

      // Should trigger dismiss
      act(() => {
        vi.advanceTimersByTime(200); // Animation delay
      });

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not dismiss on small swipe (< 50px threshold)', () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();

      render(
        <SessionComplete
          context={defaultContext}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      const container = screen.getByRole('status');

      // Start touch at y=100
      fireEvent.touchStart(container, {
        touches: [{ clientY: 100 }],
      });

      // Move down by only 30px (below 50px threshold)
      fireEvent.touchMove(container, {
        touches: [{ clientY: 130 }],
      });

      // End touch
      fireEvent.touchEnd(container);

      // Should not trigger dismiss immediately
      expect(onDismiss).not.toHaveBeenCalled();

      // First advance 500ms to resume timer (setTimeout in touchEnd)
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Then wait for 5s auto-dismiss + animation delay
      act(() => {
        vi.advanceTimersByTime(5000 + 200);
      });

      // Now should be dismissed from auto-dismiss timer
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // AC #6: Non-intrusive behavior
  // ==========================================================================

  describe('AC #6: Non-intrusive behavior', () => {
    it('has z-index of 50 (below modals)', async () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();

      render(
        <SessionComplete
          context={defaultContext}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      // Allow any pending effects to settle
      await act(async () => {
        await Promise.resolve();
      });

      const container = screen.getByRole('status');
      expect(container.className).toContain('z-50');
    });

    it('is positioned at bottom of screen', async () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();

      render(
        <SessionComplete
          context={defaultContext}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      // Allow any pending effects to settle
      await act(async () => {
        await Promise.resolve();
      });

      const container = screen.getByRole('status');
      expect(container.className).toContain('fixed');
      expect(container.className).toContain('bottom-20');
    });

    it('has max-width constraint', async () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();

      render(
        <SessionComplete
          context={defaultContext}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      // Allow any pending effects to settle
      await act(async () => {
        await Promise.resolve();
      });

      const container = screen.getByRole('status');
      expect(container.className).toContain('max-w-sm');
    });
  });

  // ==========================================================================
  // Reduced motion tests
  // ==========================================================================

  describe('Reduced motion support', () => {
    it('respects prefers-reduced-motion preference', async () => {
      mockMatchMedia(true); // Enable reduced motion

      const onDismiss = vi.fn();
      const onAction = vi.fn();

      render(
        <SessionComplete
          context={defaultContext}
          onDismiss={onDismiss}
          onAction={onAction}
          t={mockT}
          theme="light"
        />
      );

      // Allow any pending effects to settle
      await act(async () => {
        await Promise.resolve();
      });

      // With reduced motion, dismiss should be instant (no animation delay)
      fireEvent.click(screen.getByLabelText('Close'));

      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(onDismiss).toHaveBeenCalled();
    });
  });
});
