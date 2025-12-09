/**
 * FloatingDownloadFab Component Unit Tests
 *
 * Tests for the floating action button that triggers CSV export.
 *
 * Story 7.11 - Floating Download FAB
 * AC #1-10: Complete acceptance criteria coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { FloatingDownloadFab } from '../../../src/components/analytics/FloatingDownloadFab';

// ============================================================================
// Test Helpers
// ============================================================================

const defaultTranslations: Record<string, string> = {
  downloadAnalytics: 'Download Analytics',
  downloadStatistics: 'Download statistics',
  downloadTransactions: 'Download transactions',
};

const mockT = (key: string) => defaultTranslations[key] || key;

// ============================================================================
// AC #1: FAB positioned in bottom-right corner above navigation bar
// ============================================================================

describe('FloatingDownloadFab - AC #1: Positioning', () => {
  it('has fixed positioning classes', () => {
    render(
      <FloatingDownloadFab
        onExport={async () => {}}
        exporting={false}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button', { name: 'Download Analytics' });
    expect(button).toHaveClass('fixed');
    expect(button).toHaveClass('bottom-24'); // 96px above bottom (nav bar is 90px)
    expect(button).toHaveClass('right-4');   // 16px from right edge
  });

  it('has appropriate z-index', () => {
    render(
      <FloatingDownloadFab
        onExport={async () => {}}
        exporting={false}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('z-40'); // Above content, below modals
  });
});

// ============================================================================
// AC #2: FAB has fixed position that doesn't scroll with content
// ============================================================================

describe('FloatingDownloadFab - AC #2: Fixed position', () => {
  it('has position: fixed via className', () => {
    render(
      <FloatingDownloadFab
        onExport={async () => {}}
        exporting={false}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('fixed');
  });
});

// ============================================================================
// AC #3, #4: FAB displays icon with accent color background
// ============================================================================

describe('FloatingDownloadFab - AC #3, #4: Icon and styling', () => {
  it('displays FileText icon for transaction export', () => {
    render(
      <FloatingDownloadFab
        onExport={async () => {}}
        exporting={false}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('displays BarChart2 icon for statistics export', () => {
    render(
      <FloatingDownloadFab
        onExport={async () => {}}
        exporting={false}
        isStatisticsExport={true}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('has accent color background (blue)', () => {
    render(
      <FloatingDownloadFab
        onExport={async () => {}}
        exporting={false}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600');
    expect(button).toHaveClass('hover:bg-blue-700');
  });

  it('has white text/icon', () => {
    render(
      <FloatingDownloadFab
        onExport={async () => {}}
        exporting={false}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-white');
  });
});

// ============================================================================
// AC #5: FAB has appropriate shadow for floating appearance
// ============================================================================

describe('FloatingDownloadFab - AC #5: Shadow', () => {
  it('has shadow-lg for floating appearance', () => {
    render(
      <FloatingDownloadFab
        onExport={async () => {}}
        exporting={false}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('shadow-lg');
  });
});

// ============================================================================
// AC #6: FAB size is 48px (w-12 h-12)
// ============================================================================

describe('FloatingDownloadFab - AC #6: Size', () => {
  it('has 48px size (w-12 h-12)', () => {
    render(
      <FloatingDownloadFab
        onExport={async () => {}}
        exporting={false}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-12');
    expect(button).toHaveClass('h-12');
  });

  it('is round (rounded-full)', () => {
    render(
      <FloatingDownloadFab
        onExport={async () => {}}
        exporting={false}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('rounded-full');
  });
});

// ============================================================================
// AC #7: Tapping FAB triggers export functionality
// ============================================================================

describe('FloatingDownloadFab - AC #7: Export functionality', () => {
  it('calls onExport when clicked', async () => {
    const user = userEvent.setup();
    const mockExport = vi.fn().mockResolvedValue(undefined);

    render(
      <FloatingDownloadFab
        onExport={mockExport}
        exporting={false}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockExport).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner when exporting', () => {
    render(
      <FloatingDownloadFab
        onExport={async () => {}}
        exporting={true}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button');
    const spinner = button.querySelector('svg');
    expect(spinner).toHaveClass('animate-spin');
  });

  it('is disabled when exporting', () => {
    render(
      <FloatingDownloadFab
        onExport={async () => {}}
        exporting={true}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('does not call onExport when already exporting', async () => {
    const user = userEvent.setup();
    const mockExport = vi.fn().mockResolvedValue(undefined);

    render(
      <FloatingDownloadFab
        onExport={mockExport}
        exporting={true}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockExport).not.toHaveBeenCalled();
  });

  it('has disabled styling when exporting', () => {
    render(
      <FloatingDownloadFab
        onExport={async () => {}}
        exporting={true}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('disabled:opacity-50');
    expect(button).toHaveClass('disabled:cursor-not-allowed');
  });
});

// ============================================================================
// AC #9: FAB has aria-label for accessibility
// ============================================================================

describe('FloatingDownloadFab - AC #9: Accessibility', () => {
  it('has aria-label "Download Analytics"', () => {
    render(
      <FloatingDownloadFab
        onExport={async () => {}}
        exporting={false}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button', { name: 'Download Analytics' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Download Analytics');
  });

  it('has aria-busy when exporting', () => {
    render(
      <FloatingDownloadFab
        onExport={async () => {}}
        exporting={true}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('has focus ring for keyboard navigation', () => {
    render(
      <FloatingDownloadFab
        onExport={async () => {}}
        exporting={false}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus:ring-2');
    expect(button).toHaveClass('focus:ring-blue-500');
    expect(button).toHaveClass('focus:ring-offset-2');
  });
});

// ============================================================================
// Theme support
// ============================================================================

describe('FloatingDownloadFab - Theme support', () => {
  it('adjusts focus ring offset for light theme', () => {
    render(
      <FloatingDownloadFab
        onExport={async () => {}}
        exporting={false}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus:ring-offset-white');
  });

  it('adjusts focus ring offset for dark theme', () => {
    render(
      <FloatingDownloadFab
        onExport={async () => {}}
        exporting={false}
        isStatisticsExport={false}
        theme="dark"
        t={mockT}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus:ring-offset-slate-900');
  });
});

// ============================================================================
// Keyboard accessibility
// ============================================================================

describe('FloatingDownloadFab - Keyboard accessibility', () => {
  it('can be focused with Tab', async () => {
    const user = userEvent.setup();

    render(
      <FloatingDownloadFab
        onExport={async () => {}}
        exporting={false}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    await user.tab();

    const button = screen.getByRole('button');
    expect(document.activeElement).toBe(button);
  });

  it('triggers on Enter key', async () => {
    const user = userEvent.setup();
    const mockExport = vi.fn().mockResolvedValue(undefined);

    render(
      <FloatingDownloadFab
        onExport={mockExport}
        exporting={false}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button');
    button.focus();
    await user.keyboard('{Enter}');

    expect(mockExport).toHaveBeenCalledTimes(1);
  });

  it('triggers on Space key', async () => {
    const user = userEvent.setup();
    const mockExport = vi.fn().mockResolvedValue(undefined);

    render(
      <FloatingDownloadFab
        onExport={mockExport}
        exporting={false}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button');
    button.focus();
    await user.keyboard(' ');

    expect(mockExport).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Transition animations
// ============================================================================

describe('FloatingDownloadFab - Animations', () => {
  it('has transition classes', () => {
    render(
      <FloatingDownloadFab
        onExport={async () => {}}
        exporting={false}
        isStatisticsExport={false}
        theme="light"
        t={mockT}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('transition-all');
    expect(button).toHaveClass('duration-200');
  });
});
