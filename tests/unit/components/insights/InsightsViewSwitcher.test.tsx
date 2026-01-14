/**
 * InsightsViewSwitcher Unit Tests
 *
 * Story 14.33b: View Switcher & Carousel Mode
 * @see docs/sprint-artifacts/epic14/stories/story-14.33b-view-switcher-carousel.md
 *
 * Tests AC1: View switcher with 3 buttons (Lista, Airlock, Logro)
 * Note: Destacados (carousel) was merged into Lista as a top section
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  InsightsViewSwitcher,
  InsightsViewMode,
} from '../../../../src/components/insights/InsightsViewSwitcher';

// Simple translation mock
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    list: 'Lista',
    airlock: 'Airlock',
    achievement: 'Logro',
    insightsViews: 'Vistas de ideas',
  };
  return translations[key] || key;
};

describe('InsightsViewSwitcher', () => {
  const defaultProps = {
    activeView: 'list' as InsightsViewMode,
    onViewChange: vi.fn(),
    t: mockT,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC1: 3 buttons with correct labels (Destacados merged into Lista)
  it('renders 3 view buttons', () => {
    render(<InsightsViewSwitcher {...defaultProps} />);

    expect(screen.getByRole('tab', { name: 'Lista' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Airlock' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Logro' })).toBeInTheDocument();
  });

  // AC1: Active button styling
  it('marks the active view button as selected', () => {
    render(<InsightsViewSwitcher {...defaultProps} activeView="list" />);

    const listButton = screen.getByRole('tab', { name: 'Lista' });
    expect(listButton).toHaveAttribute('aria-selected', 'true');

    const airlockButton = screen.getByRole('tab', { name: 'Airlock' });
    expect(airlockButton).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onViewChange when clicking a different view button', () => {
    const onViewChange = vi.fn();
    render(<InsightsViewSwitcher {...defaultProps} onViewChange={onViewChange} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Airlock' }));
    expect(onViewChange).toHaveBeenCalledWith('airlock');

    fireEvent.click(screen.getByRole('tab', { name: 'Logro' }));
    expect(onViewChange).toHaveBeenCalledWith('celebration');
  });

  it('calls onViewChange even when clicking the current active view', () => {
    const onViewChange = vi.fn();
    render(<InsightsViewSwitcher {...defaultProps} activeView="list" onViewChange={onViewChange} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Lista' }));
    expect(onViewChange).toHaveBeenCalledWith('list');
  });

  it('renders with airlock view active', () => {
    render(<InsightsViewSwitcher {...defaultProps} activeView="airlock" />);

    const airlockButton = screen.getByRole('tab', { name: 'Airlock' });
    expect(airlockButton).toHaveAttribute('aria-selected', 'true');
  });

  it('renders with celebration view active', () => {
    render(<InsightsViewSwitcher {...defaultProps} activeView="celebration" />);

    const celebrationButton = screen.getByRole('tab', { name: 'Logro' });
    expect(celebrationButton).toHaveAttribute('aria-selected', 'true');
  });

  it('has correct accessibility attributes', () => {
    render(<InsightsViewSwitcher {...defaultProps} />);

    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveAttribute('aria-label', 'Vistas de ideas');
  });

  describe('disabled views', () => {
    it('reduces opacity for disabled views', () => {
      render(
        <InsightsViewSwitcher
          {...defaultProps}
          disabledViews={['airlock', 'celebration']}
        />
      );

      const airlockButton = screen.getByRole('tab', { name: 'Airlock' });
      expect(airlockButton).toHaveAttribute('aria-disabled', 'true');
      expect(airlockButton).toHaveStyle({ opacity: '0.5' });
    });

    it('calls onDisabledViewClick when clicking a disabled view', () => {
      const onDisabledViewClick = vi.fn();
      render(
        <InsightsViewSwitcher
          {...defaultProps}
          disabledViews={['airlock']}
          onDisabledViewClick={onDisabledViewClick}
        />
      );

      fireEvent.click(screen.getByRole('tab', { name: 'Airlock' }));
      expect(onDisabledViewClick).toHaveBeenCalledWith('airlock');
    });
  });
});
