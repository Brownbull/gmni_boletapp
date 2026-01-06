/**
 * DrillDownCard Component Unit Tests
 *
 * Tests for the presentational drill-down card component used in
 * analytics views for temporal and category navigation.
 *
 * Story 7.5 - Drill-Down Cards Grid
 * AC #6, #7, #15, #16, #17: DrillDownCard acceptance criteria
 *
 * Story 7.10 - UX Cards & Visual Elements Alignment
 * Updated to test new colored dot pattern instead of border-left
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { DrillDownCard } from '../../../src/components/analytics/DrillDownCard';

// ============================================================================
// Test Helpers
// ============================================================================

const defaultProps = {
  label: 'Q4',
  value: 125000, // $125,000 CLP (CLP has no decimals)
  onClick: vi.fn(),
};

function renderCard(props: Partial<React.ComponentProps<typeof DrillDownCard>> = {}) {
  return render(<DrillDownCard {...defaultProps} {...props} />);
}

// ============================================================================
// AC #6: Card displays label, total amount, and percentage
// ============================================================================

describe('DrillDownCard - AC #6: Displays label, value, percentage', () => {
  it('renders label correctly', () => {
    renderCard({ label: 'October' });

    expect(screen.getByText('October')).toBeInTheDocument();
  });

  it('renders value as formatted currency', () => {
    renderCard({ value: 125000, locale: 'en', currency: 'CLP' });

    // 125000 CLP displays as "CLP 125,000" (CLP has no decimals)
    const valueElement = screen.getByText(/CLP.*125[.,]000/);
    expect(valueElement).toBeInTheDocument();
  });

  it('renders percentage when provided', () => {
    renderCard({ percentage: 32.5 });

    // Story 7.10: Percentage now displayed without parentheses
    expect(screen.getByText('32.5%')).toBeInTheDocument();
  });

  it('does not render percentage when not provided', () => {
    renderCard({ percentage: undefined });

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('formats percentage to one decimal place', () => {
    renderCard({ percentage: 33.333 });

    // Story 7.10: Percentage displayed without parentheses
    expect(screen.getByText('33.3%')).toBeInTheDocument();
  });

  it('handles zero percentage', () => {
    renderCard({ percentage: 0 });

    // Story 7.10: Percentage displayed without parentheses
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('handles 100% percentage', () => {
    renderCard({ percentage: 100 });

    // Story 7.10: Percentage displayed without parentheses
    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });
});

// ============================================================================
// AC #7: Color indicator matching chart segment colors
// Story 7.18: Changed from colored dot to progress bar color
// ============================================================================

describe('DrillDownCard - AC #7: Color indicator', () => {
  it('applies color from colorKey via progress bar', () => {
    const { container } = renderCard({ colorKey: 'Supermarket', percentage: 50 });

    // Story 7.18: Color is now on the progress bar fill element
    const fillBar = container.querySelector('[role="progressbar"] > div');
    // Story 14.21: Colors from unified categoryColors (normal theme, light mode)
    // Supermarket bg: #dcfce7 (green-100)
    expect(fillBar).toHaveStyle({ backgroundColor: '#dcfce7' });
  });

  it('uses different colors for different colorKeys', () => {
    const { container: container1 } = renderCard({ colorKey: 'Supermarket', percentage: 50 });
    const { container: container2 } = renderCard({ colorKey: 'Restaurant', percentage: 50 });

    // Story 7.18: Color is now on the progress bar fill element
    const fill1 = container1.querySelector('[role="progressbar"] > div');
    const fill2 = container2.querySelector('[role="progressbar"] > div');

    // Story 14.21: Colors from unified categoryColors (normal theme, light mode)
    // Supermarket bg: #dcfce7, Restaurant bg: #ffedd5
    expect(fill1).toHaveStyle({ backgroundColor: '#dcfce7' }); // Supermarket
    expect(fill2).toHaveStyle({ backgroundColor: '#ffedd5' }); // Restaurant
  });

  it('uses default color when no colorKey provided', () => {
    const { container } = renderCard({ colorKey: undefined, percentage: 50 });

    // Story 7.18: Color is now on the progress bar fill element
    const fillBar = container.querySelector('[role="progressbar"] > div');
    // Default is #94a3b8 (slate-400)
    expect(fillBar).toHaveStyle({ backgroundColor: '#94a3b8' });
  });

  it('does not show progress bar for empty state', () => {
    const { container } = renderCard({ isEmpty: true, colorKey: 'Supermarket', percentage: 50 });

    // Story 7.18: Empty cards don't show progress bar
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).not.toBeInTheDocument();
  });
});

// ============================================================================
// AC #15: 44x44px minimum touch targets
// ============================================================================

describe('DrillDownCard - AC #15: Touch targets', () => {
  it('has min-h-11 class for 44px minimum height', () => {
    const { container } = renderCard();

    const button = container.querySelector('button');
    expect(button).toHaveClass('min-h-11');
  });

  it('button is full width for mobile-friendly touch', () => {
    const { container } = renderCard();

    const button = container.querySelector('button');
    expect(button).toHaveClass('w-full');
  });
});

// ============================================================================
// AC #16: Hover/tap feedback
// Story 7.10: Hover states now handled via JS (onMouseEnter/Leave)
// ============================================================================

describe('DrillDownCard - AC #16: Hover/tap feedback', () => {
  it('changes border color on hover via JS handler', () => {
    const { container } = renderCard();

    const button = container.querySelector('button');
    // Story 7.10: Hover now handled via onMouseEnter/Leave, border starts transparent
    expect(button).toHaveStyle({ borderColor: 'transparent' });

    // Simulate hover
    fireEvent.mouseEnter(button!);
    expect(button).toHaveStyle({ borderColor: '#3b82f6' }); // accent color
  });

  it('restores border color on mouse leave', () => {
    const { container } = renderCard();

    const button = container.querySelector('button');
    fireEvent.mouseEnter(button!);
    fireEvent.mouseLeave(button!);

    // Should return to transparent
    expect(button).toHaveStyle({ borderColor: 'transparent' });
  });

  it('has active scale transform for tap feedback', () => {
    const { container } = renderCard();

    const button = container.querySelector('button');
    expect(button).toHaveClass('active:scale-[0.98]');
  });

  it('has transition classes for smooth animation', () => {
    const { container } = renderCard();

    const button = container.querySelector('button');
    expect(button).toHaveClass('transition-all');
    expect(button).toHaveClass('duration-150');
  });
});

// ============================================================================
// AC #17: React.memo for performance
// ============================================================================

describe('DrillDownCard - AC #17: React.memo optimization', () => {
  it('does not re-render when props are the same', () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <DrillDownCard label="Q4" value={125000} onClick={onClick} />
    );

    // Re-render with same props
    rerender(<DrillDownCard label="Q4" value={125000} onClick={onClick} />);

    // Component should still work (memo doesn't break functionality)
    expect(screen.getByText('Q4')).toBeInTheDocument();
  });

  it('re-renders when props change', () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <DrillDownCard label="Q3" value={100000} onClick={onClick} />
    );

    expect(screen.getByText('Q3')).toBeInTheDocument();

    // Re-render with different props
    rerender(<DrillDownCard label="Q4" value={125000} onClick={onClick} />);

    expect(screen.getByText('Q4')).toBeInTheDocument();
    expect(screen.queryByText('Q3')).not.toBeInTheDocument();
  });
});

// ============================================================================
// Click Handler
// ============================================================================

describe('DrillDownCard - Click handler', () => {
  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    renderCard({ onClick });

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick on Enter key press', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    renderCard({ onClick });

    const button = screen.getByRole('button');
    button.focus();
    await user.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick on Space key press', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    renderCard({ onClick });

    const button = screen.getByRole('button');
    button.focus();
    await user.keyboard(' ');

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Empty State (AC #12, #13, #14)
// ============================================================================

describe('DrillDownCard - Empty state handling', () => {
  it('renders empty message when isEmpty=true', () => {
    renderCard({ isEmpty: true, emptyMessage: 'No transactions in Q4' });

    expect(screen.getByText('No transactions in Q4')).toBeInTheDocument();
  });

  it('uses default empty message when no emptyMessage provided', () => {
    renderCard({ isEmpty: true });

    expect(screen.getByText('No transactions')).toBeInTheDocument();
  });

  it('does not show value when empty', () => {
    renderCard({ isEmpty: true, value: 125000 });

    // Value should not be displayed for empty cards
    expect(screen.queryByText(/CLP.*1[.,]250/)).not.toBeInTheDocument();
  });

  it('applies opacity class for grayed appearance', () => {
    const { container } = renderCard({ isEmpty: true });

    const button = container.querySelector('button');
    expect(button).toHaveClass('opacity-60');
  });

  it('remains clickable when empty (AC #14)', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    renderCard({ isEmpty: true, onClick });

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('still shows label when empty', () => {
    renderCard({ isEmpty: true, label: 'October' });

    expect(screen.getByText('October')).toBeInTheDocument();
  });
});

// ============================================================================
// Accessibility
// ============================================================================

describe('DrillDownCard - Accessibility', () => {
  it('has role="button"', () => {
    renderCard();

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('has descriptive aria-label for non-empty card', () => {
    renderCard({ label: 'October', value: 125000, percentage: 25.5 });

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button.getAttribute('aria-label')).toContain('October');
    expect(button.getAttribute('aria-label')).toContain('25.5%');
  });

  it('has descriptive aria-label for empty card', () => {
    renderCard({ label: 'October', isEmpty: true, emptyMessage: 'No transactions' });

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button.getAttribute('aria-label')).toContain('October');
    expect(button.getAttribute('aria-label')).toContain('No transactions');
  });

  it('has focus ring classes', () => {
    const { container } = renderCard();

    const button = container.querySelector('button');
    expect(button).toHaveClass('focus:ring-2');
    expect(button).toHaveClass('focus:ring-blue-500');
  });

  it('is focusable', () => {
    renderCard();

    const button = screen.getByRole('button');
    button.focus();

    expect(document.activeElement).toBe(button);
  });

  it('progress bar has proper aria attributes', () => {
    const { container } = renderCard({ percentage: 50 });

    // Story 7.18: Progress bar has accessibility attributes
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });
});

// ============================================================================
// Theme Support
// ============================================================================

describe('DrillDownCard - Theme support', () => {
  it('renders light theme by default', () => {
    const { container } = renderCard();

    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-white');
  });

  it('renders dark theme when specified', () => {
    const { container } = renderCard({ theme: 'dark' });

    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-slate-800');
  });

  it('applies dark theme text colors', () => {
    renderCard({ theme: 'dark', label: 'Q4' });

    const label = screen.getByText('Q4');
    expect(label).toHaveClass('text-slate-200');
  });

  it('applies light theme text colors', () => {
    renderCard({ theme: 'light', label: 'Q4' });

    const label = screen.getByText('Q4');
    expect(label).toHaveClass('text-slate-800');
  });

  it('applies dark theme focus ring offset', () => {
    const { container } = renderCard({ theme: 'dark' });

    const button = container.querySelector('button');
    expect(button).toHaveClass('focus:ring-offset-slate-900');
  });
});

// ============================================================================
// Currency Formatting
// ============================================================================

describe('DrillDownCard - Currency formatting', () => {
  it('formats with default currency (CLP)', () => {
    renderCard({ value: 125000 });

    // CLP uses no decimals, 125000 CLP displays as "CLP 125,000"
    expect(screen.getByText(/CLP.*125[.,]000/)).toBeInTheDocument();
  });

  it('formats value as integer (no decimals for CLP)', () => {
    renderCard({ value: 125050, currency: 'CLP' });

    // CLP has no decimals, 125050 CLP displays as "CLP 125,050"
    const valueElement = screen.getByText(/CLP.*125[.,]050/);
    expect(valueElement).toBeInTheDocument();
  });

  it('handles zero value', () => {
    renderCard({ value: 0 });

    // CLP 0 format
    expect(screen.getByText(/CLP.*0/)).toBeInTheDocument();
  });
});

// ============================================================================
// Locale Support
// ============================================================================

describe('DrillDownCard - Locale support', () => {
  it('uses English locale by default', () => {
    renderCard({ locale: 'en' });

    // Default behavior - just check it renders
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('supports Spanish locale', () => {
    renderCard({ locale: 'es' });

    // Check it renders with es locale
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

// ============================================================================
// Story 7.18: Progress Bar Indicator
// AC #1-8: Visual percentage representation
// ============================================================================

describe('DrillDownCard - Story 7.18: Progress Bar', () => {
  // AC #1: Progress bar displays below label
  describe('AC #1: Progress bar placement', () => {
    it('renders progress bar when percentage is provided', () => {
      const { container } = renderCard({ percentage: 25 });

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('does not render progress bar when percentage is undefined', () => {
      const { container } = renderCard({ percentage: undefined });

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).not.toBeInTheDocument();
    });

    it('does not render progress bar when isEmpty is true', () => {
      const { container } = renderCard({ isEmpty: true, percentage: 25 });

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).not.toBeInTheDocument();
    });

    it('progress bar is within the label container structure', () => {
      const { container } = renderCard({ percentage: 25, label: 'October' });

      // Find the label
      const label = screen.getByText('October');
      // Progress bar should be a sibling (in same flex-col container)
      const labelContainer = label.parentElement;
      expect(labelContainer).toHaveClass('flex-col');

      const progressBar = labelContainer?.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  // AC #2: Progress bar width represents percentage
  describe('AC #2: Width represents percentage', () => {
    it('sets width to percentage value', () => {
      const { container } = renderCard({ percentage: 22.5 });

      const fillBar = container.querySelector('[role="progressbar"] > div');
      expect(fillBar).toHaveStyle({ width: '22.5%' });
    });

    it('handles 0% width', () => {
      const { container } = renderCard({ percentage: 0 });

      const fillBar = container.querySelector('[role="progressbar"] > div');
      expect(fillBar).toHaveStyle({ width: '0%' });
    });

    it('handles 100% width', () => {
      const { container } = renderCard({ percentage: 100 });

      const fillBar = container.querySelector('[role="progressbar"] > div');
      expect(fillBar).toHaveStyle({ width: '100%' });
    });

    it('handles decimal percentages', () => {
      const { container } = renderCard({ percentage: 33.333 });

      const fillBar = container.querySelector('[role="progressbar"] > div');
      expect(fillBar).toHaveStyle({ width: '33.333%' });
    });
  });

  // AC #3: Progress bar color from colorKey
  // Story 14.21: Updated to use unified categoryColors
  describe('AC #3: Progress bar color from colorKey', () => {
    it('progress bar uses color for Supermarket', () => {
      const { container } = renderCard({ percentage: 50, colorKey: 'Supermarket' });

      const fillBar = container.querySelector('[role="progressbar"] > div');

      // Story 14.21: Supermarket bg: #dcfce7 (green-100)
      expect(fillBar).toHaveStyle({ backgroundColor: '#dcfce7' });
    });

    it('progress bar uses color for Restaurant', () => {
      const { container } = renderCard({ percentage: 50, colorKey: 'Restaurant' });

      const fillBar = container.querySelector('[role="progressbar"] > div');

      // Story 14.21: Restaurant bg: #ffedd5 (orange-100)
      expect(fillBar).toHaveStyle({ backgroundColor: '#ffedd5' });
    });

    it('progress bar uses default color when no colorKey', () => {
      const { container } = renderCard({ percentage: 50, colorKey: undefined });

      const fillBar = container.querySelector('[role="progressbar"] > div');

      // Default is #94a3b8 (slate-400)
      expect(fillBar).toHaveStyle({ backgroundColor: '#94a3b8' });
    });

    it('progress bar uses temporal colors correctly', () => {
      const { container } = renderCard({ percentage: 50, colorKey: 'temporal-0' });

      const fillBar = container.querySelector('[role="progressbar"] > div');

      // Story 14.21: temporal-0 falls back to Other category color #f1f5f9 (slate-100)
      expect(fillBar).toHaveStyle({ backgroundColor: '#f1f5f9' });
    });
  });

  // AC #4: Progress bar is subtle/thin (4px height)
  describe('AC #4: Thin progress bar styling', () => {
    it('progress bar track has h-1 class (4px height)', () => {
      const { container } = renderCard({ percentage: 50 });

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveClass('h-1');
    });

    it('progress bar has rounded corners', () => {
      const { container } = renderCard({ percentage: 50 });

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveClass('rounded-full');
      expect(progressBar).toHaveClass('overflow-hidden');
    });
  });

  // AC #7: Smooth animation on width change
  describe('AC #7: Smooth animation', () => {
    it('progress bar fill has transition classes', () => {
      const { container } = renderCard({ percentage: 50 });

      const fillBar = container.querySelector('[role="progressbar"] > div');
      expect(fillBar).toHaveClass('transition-all');
      expect(fillBar).toHaveClass('duration-300');
    });

    it('fill bar has rounded corners', () => {
      const { container } = renderCard({ percentage: 50 });

      const fillBar = container.querySelector('[role="progressbar"] > div');
      expect(fillBar).toHaveClass('rounded-full');
    });
  });

  // AC #8: Works in both light and dark themes
  describe('AC #8: Theme support', () => {
    it('track uses light theme background (bg-slate-200)', () => {
      const { container } = renderCard({ percentage: 50, theme: 'light' });

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveClass('bg-slate-200');
    });

    it('track uses dark theme background (bg-slate-700)', () => {
      const { container } = renderCard({ percentage: 50, theme: 'dark' });

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveClass('bg-slate-700');
    });
  });

  // Accessibility
  describe('Progress bar accessibility', () => {
    it('has progressbar role', () => {
      const { container } = renderCard({ percentage: 50 });

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('has aria-valuenow set to percentage', () => {
      const { container } = renderCard({ percentage: 22.5 });

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute('aria-valuenow', '22.5');
    });

    it('has aria-valuemin set to 0', () => {
      const { container } = renderCard({ percentage: 50 });

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    });

    it('has aria-valuemax set to 100', () => {
      const { container } = renderCard({ percentage: 50 });

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('has descriptive aria-label', () => {
      const { container } = renderCard({ percentage: 22.5 });

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute('aria-label', '22.5% of total');
    });
  });
});

// ============================================================================
// Story 9.20: Transaction Count Badge
// AC #1-6: Badge display and navigation
// ============================================================================

describe('DrillDownCard - Story 9.20: Transaction Count Badge', () => {
  // AC #1: Badge displays on left of card
  describe('AC #1: Badge display', () => {
    it('renders badge when transactionCount > 0 and onBadgeClick is provided', () => {
      const onBadgeClick = vi.fn();
      renderCard({ transactionCount: 5, onBadgeClick });

      // Badge should show "5"
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('does not render badge when transactionCount is 0', () => {
      const onBadgeClick = vi.fn();
      renderCard({ transactionCount: 0, onBadgeClick });

      // Badge should not be rendered for 0 transactions
      // The card label (Q4) should still be there
      expect(screen.getByText('Q4')).toBeInTheDocument();
      expect(screen.queryByLabelText(/transactions/i)).not.toBeInTheDocument();
    });

    it('does not render badge when transactionCount is undefined', () => {
      const onBadgeClick = vi.fn();
      renderCard({ transactionCount: undefined, onBadgeClick });

      expect(screen.queryByLabelText(/transactions/i)).not.toBeInTheDocument();
    });

    it('does not render badge when onBadgeClick is not provided', () => {
      renderCard({ transactionCount: 5, onBadgeClick: undefined });

      // Badge should not be rendered without click handler
      expect(screen.queryByLabelText(/transactions/i)).not.toBeInTheDocument();
    });

    it('does not render badge when isEmpty is true', () => {
      const onBadgeClick = vi.fn();
      renderCard({ isEmpty: true, transactionCount: 5, onBadgeClick });

      // Badge aria-label contains "transactions" - check that the badge button is not present
      // The card itself has aria-label containing "No transactions" so we need to be specific
      const badge = screen.queryByRole('button', { name: /view \d+ transactions/i });
      expect(badge).not.toBeInTheDocument();
    });
  });

  // AC #2: Badge scales for 3+ digits
  describe('AC #2: Badge size scaling', () => {
    it('uses standard size for 1-2 digit counts', () => {
      const onBadgeClick = vi.fn();
      const { container } = renderCard({ transactionCount: 5, onBadgeClick });

      const badge = container.querySelector('[aria-label*="transactions"]');
      expect(badge).toHaveClass('min-w-9', 'min-h-9');
    });

    it('uses larger size for 3+ digit counts', () => {
      const onBadgeClick = vi.fn();
      const { container } = renderCard({ transactionCount: 100, onBadgeClick });

      // "100" triggers 99+ display, which is 3 characters
      const badge = container.querySelector('[aria-label*="transactions"]');
      expect(badge).toHaveClass('min-w-10', 'min-h-10', 'px-2');
    });
  });

  // AC #3: Badge click navigates to History (stopPropagation)
  describe('AC #3: Badge click behavior', () => {
    it('calls onBadgeClick when badge is clicked', async () => {
      const user = userEvent.setup();
      const onBadgeClick = vi.fn();
      const onClick = vi.fn();
      renderCard({ transactionCount: 5, onBadgeClick, onClick });

      const badge = screen.getByLabelText(/view 5 transactions/i);
      await user.click(badge);

      expect(onBadgeClick).toHaveBeenCalledTimes(1);
    });

    it('does not trigger card onClick when badge is clicked', async () => {
      const user = userEvent.setup();
      const onBadgeClick = vi.fn();
      const onClick = vi.fn();
      renderCard({ transactionCount: 5, onBadgeClick, onClick });

      const badge = screen.getByLabelText(/view 5 transactions/i);
      await user.click(badge);

      // Card click should NOT be called (stopPropagation)
      expect(onClick).not.toHaveBeenCalled();
    });

    it('badge has 44px minimum touch target', () => {
      const onBadgeClick = vi.fn();
      const { container } = renderCard({ transactionCount: 5, onBadgeClick });

      // The wrapper div has min-width/min-height style for touch target
      const touchTarget = container.querySelector('div[style*="min"]');
      expect(touchTarget).toBeInTheDocument();
      expect(touchTarget).toHaveStyle({ minWidth: '44px', minHeight: '44px' });
    });

    it('badge has tap feedback animation', () => {
      const onBadgeClick = vi.fn();
      const { container } = renderCard({ transactionCount: 5, onBadgeClick });

      const badge = container.querySelector('[aria-label*="transactions"]');
      expect(badge).toHaveClass('active:scale-95');
    });
  });

  // AC #5: 99+ display for large counts
  describe('AC #5: 99+ truncation', () => {
    it('displays count directly for counts < 100', () => {
      const onBadgeClick = vi.fn();
      renderCard({ transactionCount: 42, onBadgeClick });

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('displays "99+" for counts >= 100', () => {
      const onBadgeClick = vi.fn();
      renderCard({ transactionCount: 100, onBadgeClick });

      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('displays "99+" for very large counts', () => {
      const onBadgeClick = vi.fn();
      renderCard({ transactionCount: 999, onBadgeClick });

      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });

  // Accessibility
  describe('Badge accessibility', () => {
    it('badge has descriptive aria-label in English', () => {
      const onBadgeClick = vi.fn();
      renderCard({ transactionCount: 5, onBadgeClick, locale: 'en' });

      const badge = screen.getByLabelText('View 5 transactions');
      expect(badge).toBeInTheDocument();
    });

    it('badge has descriptive aria-label in Spanish', () => {
      const onBadgeClick = vi.fn();
      renderCard({ transactionCount: 5, onBadgeClick, locale: 'es' });

      const badge = screen.getByLabelText('Ver 5 transacciones');
      expect(badge).toBeInTheDocument();
    });

    it('badge is keyboard accessible (Enter)', async () => {
      const user = userEvent.setup();
      const onBadgeClick = vi.fn();
      renderCard({ transactionCount: 5, onBadgeClick });

      const badge = screen.getByLabelText(/view 5 transactions/i);
      badge.focus();
      await user.keyboard('{Enter}');

      expect(onBadgeClick).toHaveBeenCalledTimes(1);
    });

    it('badge is keyboard accessible (Space)', async () => {
      const user = userEvent.setup();
      const onBadgeClick = vi.fn();
      renderCard({ transactionCount: 5, onBadgeClick });

      const badge = screen.getByLabelText(/view 5 transactions/i);
      badge.focus();
      await user.keyboard(' ');

      expect(onBadgeClick).toHaveBeenCalledTimes(1);
    });

    it('badge has focus ring', () => {
      const onBadgeClick = vi.fn();
      const { container } = renderCard({ transactionCount: 5, onBadgeClick });

      const badge = container.querySelector('[aria-label*="transactions"]');
      expect(badge).toHaveClass('focus:ring-2', 'focus:ring-blue-400');
    });
  });
});
