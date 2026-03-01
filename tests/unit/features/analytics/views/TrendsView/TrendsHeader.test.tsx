/**
 * TrendsHeader - Unit tests
 *
 * Story 15b-2m: Extracted header component from TrendsView.tsx
 * Props-only component — no store/context access. Pure render + callback tests.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrendsHeader, type TrendsHeaderProps } from '@features/analytics/views/TrendsView/TrendsHeader';

// Mock dependencies
vi.mock('@/components/ProfileDropdown', () => ({
    ProfileDropdown: ({ isOpen }: { isOpen: boolean }) =>
        isOpen ? <div data-testid="profile-dropdown">Dropdown</div> : null,
    ProfileAvatar: React.forwardRef<HTMLButtonElement, { initials: string; onClick: () => void }>(
        ({ initials, onClick }, ref) => (
            <button ref={ref} data-testid="profile-avatar" onClick={onClick}>
                {initials}
            </button>
        ),
    ),
    getInitials: (name: string) => name.split(' ').map(n => n[0]).join(''),
}));

vi.mock('@features/history/components/IconFilterBar', () => ({
    IconFilterBar: () => <div data-testid="icon-filter-bar">FilterBar</div>,
}));

vi.mock('lucide-react', () => ({
    ChevronLeft: ({ size }: { size: number }) => <span data-testid="chevron-left">{size}</span>,
    ChevronRight: ({ size }: { size: number }) => <span data-testid="chevron-right">{size}</span>,
}));

function makeProps(overrides: Partial<TrendsHeaderProps> = {}): TrendsHeaderProps {
    return {
        onBack: vi.fn(),
        locale: 'es',
        userName: 'Test User',
        userEmail: 'test@example.com',
        isProfileOpen: false,
        setIsProfileOpen: vi.fn(),
        profileButtonRef: { current: null },
        handleProfileNavigate: vi.fn(),
        theme: 'light',
        t: (key: string) => key,
        availableFilters: { categories: [], paymentMethods: [], stores: [] },
        donutViewMode: 'category',
        setDonutViewMode: vi.fn(),
        timePeriod: 'month',
        handleTimePeriodClick: vi.fn(),
        isViewingCurrentPeriod: true,
        prefersReducedMotion: false,
        periodLabel: 'Febrero 2026',
        goPrevPeriod: vi.fn(),
        goNextPeriod: vi.fn(),
        ...overrides,
    };
}

describe('TrendsHeader', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('renders title via t() i18n function', () => {
        render(<TrendsHeader {...makeProps()} />);
        // t mock returns key as-is, so 'analytics' key → rendered text 'analytics'
        expect(screen.getByText('analytics')).toBeInTheDocument();
    });

    it('renders back button with correct aria-label for Spanish locale', () => {
        render(<TrendsHeader {...makeProps({ locale: 'es' })} />);
        expect(screen.getByTestId('back-button')).toHaveAttribute('aria-label', 'Volver');
    });

    it('renders back button with English aria-label', () => {
        render(<TrendsHeader {...makeProps({ locale: 'en' })} />);
        expect(screen.getByTestId('back-button')).toHaveAttribute('aria-label', 'Back');
    });

    it('calls onBack when back button clicked', () => {
        const onBack = vi.fn();
        render(<TrendsHeader {...makeProps({ onBack })} />);
        fireEvent.click(screen.getByTestId('back-button'));
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('renders all 4 time period pills', () => {
        render(<TrendsHeader {...makeProps()} />);
        expect(screen.getByTestId('time-pill-year')).toBeInTheDocument();
        expect(screen.getByTestId('time-pill-quarter')).toBeInTheDocument();
        expect(screen.getByTestId('time-pill-month')).toBeInTheDocument();
        expect(screen.getByTestId('time-pill-week')).toBeInTheDocument();
    });

    it('marks active pill with aria-pressed', () => {
        render(<TrendsHeader {...makeProps({ timePeriod: 'quarter' })} />);
        expect(screen.getByTestId('time-pill-quarter')).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByTestId('time-pill-month')).toHaveAttribute('aria-pressed', 'false');
    });

    it('calls handleTimePeriodClick when pill clicked', () => {
        const handleTimePeriodClick = vi.fn();
        render(<TrendsHeader {...makeProps({ handleTimePeriodClick })} />);
        fireEvent.click(screen.getByTestId('time-pill-week'));
        expect(handleTimePeriodClick).toHaveBeenCalledWith('week');
    });

    it('shows Spanish labels when locale is es', () => {
        render(<TrendsHeader {...makeProps({ locale: 'es' })} />);
        expect(screen.getByTestId('time-pill-year')).toHaveTextContent('Año');
        expect(screen.getByTestId('time-pill-month')).toHaveTextContent('Mes');
    });

    it('shows English labels when locale is en', () => {
        render(<TrendsHeader {...makeProps({ locale: 'en' })} />);
        expect(screen.getByTestId('time-pill-year')).toHaveTextContent('Year');
        expect(screen.getByTestId('time-pill-month')).toHaveTextContent('Month');
    });

    it('shows past indicator dot when viewing non-current period', () => {
        render(<TrendsHeader {...makeProps({ timePeriod: 'month', isViewingCurrentPeriod: false })} />);
        expect(screen.getByTestId('past-indicator')).toBeInTheDocument();
    });

    it('does not show past indicator when viewing current period', () => {
        render(<TrendsHeader {...makeProps({ timePeriod: 'month', isViewingCurrentPeriod: true })} />);
        expect(screen.queryByTestId('past-indicator')).not.toBeInTheDocument();
    });

    it('renders period label', () => {
        render(<TrendsHeader {...makeProps({ periodLabel: 'Enero 2026' })} />);
        expect(screen.getByTestId('period-label')).toHaveTextContent('Enero 2026');
    });

    it('calls goPrevPeriod and goNextPeriod on nav button clicks', () => {
        const goPrevPeriod = vi.fn();
        const goNextPeriod = vi.fn();
        render(<TrendsHeader {...makeProps({ goPrevPeriod, goNextPeriod })} />);
        fireEvent.click(screen.getByTestId('period-nav-prev'));
        expect(goPrevPeriod).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByTestId('period-nav-next'));
        expect(goNextPeriod).toHaveBeenCalledTimes(1);
    });

    it('renders IconFilterBar and ProfileAvatar', () => {
        render(<TrendsHeader {...makeProps()} />);
        expect(screen.getByTestId('icon-filter-bar')).toBeInTheDocument();
        expect(screen.getByTestId('profile-avatar')).toBeInTheDocument();
    });

    it('renders time pills container with tablist role', () => {
        render(<TrendsHeader {...makeProps()} />);
        expect(screen.getByTestId('time-pills-container')).toHaveAttribute('role', 'tablist');
    });
});
