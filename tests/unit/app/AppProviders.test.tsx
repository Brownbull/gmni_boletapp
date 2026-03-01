/**
 * Story 15b-3g: AppProviders Unit Tests
 *
 * AppProviders now only syncs fontFamily to Zustand settingsStore.
 * NotificationProvider removed (zero consumers).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppProviders } from '../../../src/app/AppProviders';
import { settingsActions } from '../../../src/shared/stores';

// Mock settingsActions used by AppProviders for fontFamily sync
vi.mock('../../../src/shared/stores', () => ({
    settingsActions: {
        setFontFamily: vi.fn(),
    },
}));

describe('AppProviders', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render children directly', () => {
        render(
            <AppProviders>
                <div data-testid="child-content">Child content</div>
            </AppProviders>
        );

        expect(screen.getByTestId('child-content')).toBeInTheDocument();
        expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('should call setFontFamily with provided fontFamily', () => {
        render(
            <AppProviders fontFamily="outfit">
                <div>Content</div>
            </AppProviders>
        );

        expect(settingsActions.setFontFamily).toHaveBeenCalledWith('outfit');
    });

    it('should call setFontFamily with default when no fontFamily provided', () => {
        render(
            <AppProviders>
                <div>Content</div>
            </AppProviders>
        );

        expect(settingsActions.setFontFamily).toHaveBeenCalledWith('outfit');
    });

    it('should render multiple children correctly', () => {
        render(
            <AppProviders>
                <div data-testid="child-1">First</div>
                <div data-testid="child-2">Second</div>
            </AppProviders>
        );

        expect(screen.getByTestId('child-1')).toBeInTheDocument();
        expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('should render without optional props', () => {
        expect(() => {
            render(
                <AppProviders>
                    <div>Test content</div>
                </AppProviders>
            );
        }).not.toThrow();
    });
});
