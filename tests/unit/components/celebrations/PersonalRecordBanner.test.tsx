/**
 * PersonalRecordBanner Tests
 *
 * Story 14.19: Personal Records Detection
 * Story 14.37: Toast Notification Theme Integration
 * Epic 14: Core Implementation
 *
 * Tests for the PersonalRecordBanner component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
    PersonalRecordBanner,
    CompactRecordBanner,
} from '../../../../src/components/celebrations/PersonalRecordBanner';
import type { PersonalRecord } from '../../../../src/types/personalRecord';

describe('PersonalRecordBanner', () => {
    const mockRecord: PersonalRecord = {
        id: 'test-record-1',
        type: 'lowest_category_week',
        category: 'Restaurante',
        value: 5000,
        previousBest: 8000,
        achievedAt: new Date('2025-01-12'),
        message: '¡Tu semana más baja en Restaurante en 3 meses!',
        lookbackPeriod: 3,
    };

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('rendering', () => {
        it('renders the record message', () => {
            const onDismiss = vi.fn();
            render(
                <PersonalRecordBanner
                    record={mockRecord}
                    onDismiss={onDismiss}
                    autoDismissMs={0}
                />
            );

            expect(screen.getByText('¡Tu semana más baja en Restaurante en 3 meses!')).toBeInTheDocument();
        });

        it('renders the title', () => {
            const onDismiss = vi.fn();
            render(
                <PersonalRecordBanner
                    record={mockRecord}
                    onDismiss={onDismiss}
                    autoDismissMs={0}
                />
            );

            expect(screen.getByText('¡Récord Personal!')).toBeInTheDocument();
        });

        it('has role="status" for accessibility', () => {
            const onDismiss = vi.fn();
            render(
                <PersonalRecordBanner
                    record={mockRecord}
                    onDismiss={onDismiss}
                    autoDismissMs={0}
                />
            );

            expect(screen.getByRole('status')).toBeInTheDocument();
        });

        it('renders dismiss button', () => {
            const onDismiss = vi.fn();
            render(
                <PersonalRecordBanner
                    record={mockRecord}
                    onDismiss={onDismiss}
                    autoDismissMs={0}
                />
            );

            expect(screen.getByRole('button', { name: /cerrar/i })).toBeInTheDocument();
        });
    });

    describe('dismiss behavior', () => {
        it('calls onDismiss when dismiss button is clicked', async () => {
            const onDismiss = vi.fn();
            render(
                <PersonalRecordBanner
                    record={mockRecord}
                    onDismiss={onDismiss}
                    autoDismissMs={0}
                />
            );

            const dismissButton = screen.getByRole('button', { name: /cerrar/i });
            fireEvent.click(dismissButton);

            // Wait for exit animation - wrap in act() to avoid React warnings
            await act(async () => {
                vi.advanceTimersByTime(300);
            });

            expect(onDismiss).toHaveBeenCalledTimes(1);
        });

        it('auto-dismisses after specified delay', async () => {
            const onDismiss = vi.fn();
            render(
                <PersonalRecordBanner
                    record={mockRecord}
                    onDismiss={onDismiss}
                    autoDismissMs={5000}
                />
            );

            expect(onDismiss).not.toHaveBeenCalled();

            // Fast-forward to just before auto-dismiss - wrap in act()
            await act(async () => {
                vi.advanceTimersByTime(4900);
            });
            expect(onDismiss).not.toHaveBeenCalled();

            // Fast-forward past auto-dismiss + animation time
            await act(async () => {
                vi.advanceTimersByTime(400); // 5000 total + 300 animation
            });
            expect(onDismiss).toHaveBeenCalledTimes(1);
        });

        it('does not auto-dismiss when autoDismissMs is 0', async () => {
            const onDismiss = vi.fn();
            render(
                <PersonalRecordBanner
                    record={mockRecord}
                    onDismiss={onDismiss}
                    autoDismissMs={0}
                />
            );

            await act(async () => {
                vi.advanceTimersByTime(60000); // 1 minute
            });
            expect(onDismiss).not.toHaveBeenCalled();
        });
    });

    describe('animation', () => {
        it('starts hidden and animates in by default', async () => {
            const onDismiss = vi.fn();
            render(
                <PersonalRecordBanner
                    record={mockRecord}
                    onDismiss={onDismiss}
                    autoDismissMs={0}
                    animate={true}
                />
            );

            // Animation delay - wrap in act()
            await act(async () => {
                vi.advanceTimersByTime(100);
            });

            // Component should be in DOM with animation classes
            const banner = screen.getByRole('status');
            expect(banner).toBeInTheDocument();
        });

        it('skips entry animation when animate is false', () => {
            const onDismiss = vi.fn();
            render(
                <PersonalRecordBanner
                    record={mockRecord}
                    onDismiss={onDismiss}
                    autoDismissMs={0}
                    animate={false}
                />
            );

            const banner = screen.getByRole('status');
            expect(banner).toBeInTheDocument();
        });
    });
});

describe('CompactRecordBanner', () => {
    const mockRecord: PersonalRecord = {
        id: 'test-record-1',
        type: 'lowest_category_week',
        category: 'Restaurante',
        value: 5000,
        previousBest: 8000,
        achievedAt: new Date('2025-01-12'),
        message: '¡Tu semana más baja en Restaurante en 3 meses!',
        lookbackPeriod: 3,
    };

    it('renders the record message', () => {
        render(<CompactRecordBanner record={mockRecord} />);

        expect(screen.getByText('¡Tu semana más baja en Restaurante en 3 meses!')).toBeInTheDocument();
    });

    it('renders as status when no onClick', () => {
        render(<CompactRecordBanner record={mockRecord} />);

        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders as button when onClick is provided', () => {
        const onClick = vi.fn();
        render(<CompactRecordBanner record={mockRecord} onClick={onClick} />);

        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const onClick = vi.fn();
        render(<CompactRecordBanner record={mockRecord} onClick={onClick} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick on Enter key press', () => {
        const onClick = vi.fn();
        render(<CompactRecordBanner record={mockRecord} onClick={onClick} />);

        const button = screen.getByRole('button');
        fireEvent.keyDown(button, { key: 'Enter' });

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick on Space key press', () => {
        const onClick = vi.fn();
        render(<CompactRecordBanner record={mockRecord} onClick={onClick} />);

        const button = screen.getByRole('button');
        fireEvent.keyDown(button, { key: ' ' });

        expect(onClick).toHaveBeenCalledTimes(1);
    });
});

/**
 * Story 14.37: Theme Integration Tests
 *
 * Note: jsdom doesn't evaluate CSS variables, so we check the raw style attribute
 * values instead of computed styles.
 */
describe('PersonalRecordBanner - Theme Integration (Story 14.37)', () => {
    const mockRecord: PersonalRecord = {
        id: 'test-record-1',
        type: 'lowest_category_week',
        category: 'Restaurante',
        value: 5000,
        previousBest: 8000,
        achievedAt: new Date('2025-01-12'),
        message: '¡Tu semana más baja en Restaurante en 3 meses!',
        lookbackPeriod: 3,
    };

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('CSS variable usage', () => {
        it('uses CSS variables for background color', () => {
            const onDismiss = vi.fn();
            render(
                <PersonalRecordBanner
                    record={mockRecord}
                    onDismiss={onDismiss}
                    autoDismissMs={0}
                />
            );

            const banner = screen.getByRole('status');
            expect(banner.style.backgroundColor).toBe('var(--insight-celebration-bg)');
        });

        it('uses CSS variables for border color', () => {
            const onDismiss = vi.fn();
            render(
                <PersonalRecordBanner
                    record={mockRecord}
                    onDismiss={onDismiss}
                    autoDismissMs={0}
                />
            );

            const banner = screen.getByRole('status');
            expect(banner.style.borderColor).toBe('var(--border-light)');
        });

        it('uses CSS variables for title color', () => {
            const onDismiss = vi.fn();
            render(
                <PersonalRecordBanner
                    record={mockRecord}
                    onDismiss={onDismiss}
                    autoDismissMs={0}
                />
            );

            const title = screen.getByText('¡Récord Personal!');
            expect(title.style.color).toBe('var(--insight-celebration-icon)');
        });

        it('uses CSS variables for message color', () => {
            const onDismiss = vi.fn();
            render(
                <PersonalRecordBanner
                    record={mockRecord}
                    onDismiss={onDismiss}
                    autoDismissMs={0}
                />
            );

            const message = screen.getByText('¡Tu semana más baja en Restaurante en 3 meses!');
            expect(message.style.color).toBe('var(--text-secondary)');
        });

        it('uses CSS variables for dismiss button color', () => {
            const onDismiss = vi.fn();
            render(
                <PersonalRecordBanner
                    record={mockRecord}
                    onDismiss={onDismiss}
                    autoDismissMs={0}
                />
            );

            const dismissButton = screen.getByRole('button', { name: /cerrar/i });
            expect(dismissButton.style.color).toBe('var(--insight-celebration-icon)');
        });
    });

    describe('trophy icon alignment', () => {
        it('renders trophy icon container with fixed dimensions for centering', () => {
            const onDismiss = vi.fn();
            render(
                <PersonalRecordBanner
                    record={mockRecord}
                    onDismiss={onDismiss}
                    autoDismissMs={0}
                />
            );

            // Trophy icon container should have w-12 h-12 classes
            const banner = screen.getByRole('status');
            const iconContainer = banner.querySelector('.w-12.h-12');
            expect(iconContainer).toBeInTheDocument();
            expect(iconContainer).toHaveClass('flex', 'items-center', 'justify-center');
        });
    });

    describe('light/dark theme variations', () => {
        it('applies dark mode background for icon container when theme is dark', () => {
            const onDismiss = vi.fn();
            render(
                <PersonalRecordBanner
                    record={mockRecord}
                    onDismiss={onDismiss}
                    autoDismissMs={0}
                    theme="dark"
                />
            );

            const banner = screen.getByRole('status');
            const iconContainer = banner.querySelector('.w-12.h-12') as HTMLElement;
            expect(iconContainer?.style.backgroundColor).toBe('rgba(255, 255, 255, 0.1)');
        });

        it('applies light mode background for icon container when theme is light', () => {
            const onDismiss = vi.fn();
            render(
                <PersonalRecordBanner
                    record={mockRecord}
                    onDismiss={onDismiss}
                    autoDismissMs={0}
                    theme="light"
                />
            );

            const banner = screen.getByRole('status');
            const iconContainer = banner.querySelector('.w-12.h-12') as HTMLElement;
            expect(iconContainer?.style.backgroundColor).toBe('rgba(0, 0, 0, 0.06)');
        });
    });
});

describe('CompactRecordBanner - Theme Integration (Story 14.37)', () => {
    const mockRecord: PersonalRecord = {
        id: 'test-record-1',
        type: 'lowest_category_week',
        category: 'Restaurante',
        value: 5000,
        previousBest: 8000,
        achievedAt: new Date('2025-01-12'),
        message: '¡Tu semana más baja en Restaurante en 3 meses!',
        lookbackPeriod: 3,
    };

    it('uses CSS variables for background color', () => {
        render(<CompactRecordBanner record={mockRecord} />);

        const banner = screen.getByRole('status');
        expect(banner.style.backgroundColor).toBe('var(--insight-celebration-bg)');
    });

    it('uses CSS variables for trophy icon color', () => {
        render(<CompactRecordBanner record={mockRecord} />);

        const banner = screen.getByRole('status');
        const svg = banner.querySelector('svg') as SVGElement;
        expect(svg?.style.color).toBe('var(--insight-celebration-icon)');
    });

    it('uses CSS variables for message text color', () => {
        render(<CompactRecordBanner record={mockRecord} />);

        const message = screen.getByText('¡Tu semana más baja en Restaurante en 3 meses!');
        expect(message.style.color).toBe('var(--insight-celebration-icon)');
    });
});
