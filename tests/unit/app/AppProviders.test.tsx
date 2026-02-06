/**
 * Story 14e-22: AppProviders Unit Tests
 * Story 14e-25d: Updated - ViewHandlersProvider removed
 * Story 14e-45: Updated - NavigationProvider removed (navigation via Zustand)
 *
 * Tests for the provider composition component that wraps
 * children with app-level React context providers.
 *
 * Tests verify:
 * 1. Provider composition and hierarchy
 * 2. Props handling (fontFamily, db, userId, appId)
 * 3. Graceful degradation
 *
 * Note: ViewHandlersProvider was removed in Story 14e-25d.
 * Note: NavigationProvider was removed in Story 14e-45 - navigation uses Zustand store.
 * Views now use direct hooks for navigation and handlers.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppProviders } from '../../../src/app/AppProviders';

// Mock the contexts to verify they're being used
// Story 14e-45: NavigationProvider removed - navigation now via useNavigationStore
vi.mock('../../../src/contexts', () => ({
    ThemeProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="theme-provider">{children}</div>
    ),
    AppStateProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="appstate-provider">{children}</div>
    ),
    NotificationProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="notification-provider">{children}</div>
    ),
}));

describe('AppProviders', () => {
    describe('Provider composition', () => {
        it('should render all required providers in correct nesting order', () => {
            render(
                <AppProviders>
                    <div data-testid="child">Content</div>
                </AppProviders>
            );

            // All providers should be in the tree
            // Story 14e-45: NavigationProvider removed - navigation via Zustand
            expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
            expect(screen.getByTestId('appstate-provider')).toBeInTheDocument();
            expect(screen.getByTestId('notification-provider')).toBeInTheDocument();
        });

        it('should render children inside all providers', () => {
            render(
                <AppProviders>
                    <div data-testid="child-content">Child content</div>
                </AppProviders>
            );

            expect(screen.getByTestId('child-content')).toBeInTheDocument();
            expect(screen.getByText('Child content')).toBeInTheDocument();
        });

        it('should maintain correct provider hierarchy', () => {
            render(
                <AppProviders>
                    <div>Content</div>
                </AppProviders>
            );

            // Story 14e-45: Verify nesting order: Theme > AppState > Notification > children
            // (NavigationProvider removed - navigation via Zustand)
            const themeProvider = screen.getByTestId('theme-provider');
            const appStateProvider = screen.getByTestId('appstate-provider');
            const notificationProvider = screen.getByTestId('notification-provider');

            // Theme should contain AppState
            expect(themeProvider.contains(appStateProvider)).toBe(true);
            // AppState should contain Notification
            expect(appStateProvider.contains(notificationProvider)).toBe(true);
        });
    });

    describe('Props handling', () => {
        it('should accept fontFamily prop', () => {
            // This test ensures the component doesn't throw with the prop
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
            // This is important for test environments
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
