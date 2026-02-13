/**
 * Story 14e-22: AppProviders Unit Tests
 * Story 15-7b: AppStateProvider removed (zero consumers)
 * Story 15-7c: ThemeProvider removed (migrated to useSettingsStore)
 *
 * Tests for the provider composition component that wraps
 * children with app-level React context providers.
 *
 * Remaining providers: NotificationProvider only.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppProviders } from '../../../src/app/AppProviders';

// Mock the contexts to verify they're being used
vi.mock('../../../src/contexts', () => ({
    NotificationProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="notification-provider">{children}</div>
    ),
}));

// Story 15-7c: Mock settingsActions used by AppProviders for fontFamily sync
vi.mock('../../../src/shared/stores', () => ({
    settingsActions: {
        setFontFamily: vi.fn(),
    },
}));

describe('AppProviders', () => {
    describe('Provider composition', () => {
        it('should render NotificationProvider', () => {
            render(
                <AppProviders>
                    <div data-testid="child">Content</div>
                </AppProviders>
            );

            expect(screen.getByTestId('notification-provider')).toBeInTheDocument();
        });

        it('should render children inside providers', () => {
            render(
                <AppProviders>
                    <div data-testid="child-content">Child content</div>
                </AppProviders>
            );

            expect(screen.getByTestId('child-content')).toBeInTheDocument();
            expect(screen.getByText('Child content')).toBeInTheDocument();
        });

        it('should nest children inside NotificationProvider', () => {
            render(
                <AppProviders>
                    <div data-testid="inner">Content</div>
                </AppProviders>
            );

            const notificationProvider = screen.getByTestId('notification-provider');
            const inner = screen.getByTestId('inner');
            expect(notificationProvider.contains(inner)).toBe(true);
        });
    });

    describe('Props handling', () => {
        it('should accept fontFamily prop', () => {
            expect(() => {
                render(
                    <AppProviders fontFamily="outfit">
                        <div>Content</div>
                    </AppProviders>
                );
            }).not.toThrow();
        });

        it('should accept db prop', () => {
            expect(() => {
                render(
                    <AppProviders db={null}>
                        <div>Content</div>
                    </AppProviders>
                );
            }).not.toThrow();
        });

        it('should accept userId prop', () => {
            expect(() => {
                render(
                    <AppProviders userId="test-user-id">
                        <div>Content</div>
                    </AppProviders>
                );
            }).not.toThrow();
        });

        it('should accept appId prop', () => {
            expect(() => {
                render(
                    <AppProviders appId="test-app-id">
                        <div>Content</div>
                    </AppProviders>
                );
            }).not.toThrow();
        });

        it('should work with all props provided', () => {
            render(
                <AppProviders
                    fontFamily="merriweather"
                    db={null}
                    userId="test-user"
                    appId="test-app"
                >
                    <div data-testid="all-props-child">All props test</div>
                </AppProviders>
            );

            expect(screen.getByTestId('all-props-child')).toBeInTheDocument();
        });
    });

    describe('Multiple children', () => {
        it('should render multiple children correctly', () => {
            render(
                <AppProviders>
                    <div data-testid="child-1">First</div>
                    <div data-testid="child-2">Second</div>
                    <div data-testid="child-3">Third</div>
                </AppProviders>
            );

            expect(screen.getByTestId('child-1')).toBeInTheDocument();
            expect(screen.getByTestId('child-2')).toBeInTheDocument();
            expect(screen.getByTestId('child-3')).toBeInTheDocument();
        });

        it('should handle React fragments as children', () => {
            render(
                <AppProviders>
                    <>
                        <div>Fragment child 1</div>
                        <div>Fragment child 2</div>
                    </>
                </AppProviders>
            );

            expect(screen.getByText('Fragment child 1')).toBeInTheDocument();
            expect(screen.getByText('Fragment child 2')).toBeInTheDocument();
        });
    });

    describe('Graceful degradation', () => {
        it('should render without optional props', () => {
            expect(() => {
                render(
                    <AppProviders>
                        <div>Test content</div>
                    </AppProviders>
                );
            }).not.toThrow();
        });

        it('should render with partial props', () => {
            expect(() => {
                render(
                    <AppProviders fontFamily="outfit">
                        <div>Partial props test</div>
                    </AppProviders>
                );
            }).not.toThrow();
        });
    });
});
