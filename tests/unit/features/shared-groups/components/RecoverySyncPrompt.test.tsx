/**
 * RecoverySyncPrompt Component Tests
 *
 * Story 14d-v2-1-9: Firestore TTL & Offline Persistence
 * Epic 14d-v2: Shared Groups v2
 *
 * Tests for the dialog that prompts users to perform a full sync
 * when they've been offline longer than the changelog TTL (30 days).
 *
 * Test Cases:
 * 1. Does not render when isOpen is false
 * 2. Renders when isOpen is true with proper structure
 * 3. Displays group name with color
 * 4. Displays group icon when provided
 * 5. Displays days since last sync when provided
 * 6. Calls onFullSync when Full Sync button clicked
 * 7. Calls onClose when Cancel button clicked
 * 8. Calls onClose when backdrop clicked
 * 9. Calls onClose on Escape key (when not syncing)
 * 10. Shows loading state during sync
 * 11. Disables buttons during sync
 * 12. Does NOT call onClose on Escape when syncing
 * 13. Has proper ARIA attributes (role="dialog", aria-modal)
 * 14. Supports both English and Spanish translations
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RecoverySyncPrompt, SYNC_COOLDOWN_MS } from '@/features/shared-groups/components/RecoverySyncPrompt';
import type { RecoverySyncPromptProps } from '@/features/shared-groups/components/RecoverySyncPrompt';

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockTranslation(lang: 'en' | 'es' = 'en') {
    const translations: Record<string, Record<string, string>> = {
        en: {
            recoverySyncTitle: 'Sync Recovery Needed',
            recoverySyncMessage: "You've been offline for a while. Some sync history has expired. Please do a full sync to restore your group data.",
            recoverySyncFullSync: 'Full Sync',
            cancel: 'Cancel',
            close: 'Close',
        },
        es: {
            recoverySyncTitle: 'Recuperacion de Sincronizacion',
            recoverySyncMessage: 'Has estado desconectado por un tiempo. Parte del historial de sincronizacion ha expirado. Por favor haz una sincronizacion completa para restaurar los datos del grupo.',
            recoverySyncFullSync: 'Sincronizacion Completa',
            cancel: 'Cancelar',
            close: 'Cerrar',
        },
    };

    return (key: string) => translations[lang][key] || key;
}

function createDefaultProps(overrides: Partial<RecoverySyncPromptProps> = {}): RecoverySyncPromptProps {
    return {
        isOpen: true,
        groupName: 'Test Group',
        groupColor: '#10b981',
        groupIcon: undefined,
        daysSinceLastSync: 35,
        onFullSync: vi.fn().mockResolvedValue(undefined),
        onClose: vi.fn(),
        t: createMockTranslation('en'),
        lang: 'en',
        ...overrides,
    };
}

// =============================================================================
// Tests
// =============================================================================

describe('RecoverySyncPrompt', () => {
    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
        user = userEvent.setup();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // =========================================================================
    // Rendering
    // =========================================================================
    describe('rendering', () => {
        it('does not render when isOpen is false', () => {
            const props = createDefaultProps({ isOpen: false });
            const { container } = render(<RecoverySyncPrompt {...props} />);

            expect(container.firstChild).toBeNull();
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('renders when isOpen is true with proper structure', () => {
            const props = createDefaultProps();
            render(<RecoverySyncPrompt {...props} />);

            // Dialog should be visible
            expect(screen.getByRole('dialog')).toBeInTheDocument();

            // Title should be visible
            expect(screen.getByText('Sync Recovery Needed')).toBeInTheDocument();

            // Message should be visible
            expect(screen.getByText(/offline for a while/)).toBeInTheDocument();

            // Full Sync button should be visible
            expect(screen.getByRole('button', { name: /Full Sync/i })).toBeInTheDocument();

            // Cancel button should be visible
            expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
        });

        it('displays group name with color', () => {
            const props = createDefaultProps({
                groupName: 'Family Expenses',
                groupColor: '#ef4444',
            });
            render(<RecoverySyncPrompt {...props} />);

            const groupNameElement = screen.getByText('Family Expenses');
            expect(groupNameElement).toBeInTheDocument();
            // Check color is applied (inline style)
            expect(groupNameElement).toHaveStyle({ color: '#ef4444' });
        });

        it('displays group icon when provided', () => {
            const props = createDefaultProps({ groupIcon: '🏠' });
            render(<RecoverySyncPrompt {...props} />);

            expect(screen.getByText('🏠')).toBeInTheDocument();
        });

        it('displays days since last sync when provided', () => {
            const props = createDefaultProps({ daysSinceLastSync: 45 });
            render(<RecoverySyncPrompt {...props} />);

            expect(screen.getByText(/45/)).toBeInTheDocument();
        });

        it('handles null daysSinceLastSync gracefully', () => {
            const props = createDefaultProps({ daysSinceLastSync: null });
            render(<RecoverySyncPrompt {...props} />);

            // Should still render without crashing
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Interactions
    // =========================================================================
    describe('interactions', () => {
        it('calls onFullSync when Full Sync button clicked', async () => {
            const onFullSync = vi.fn().mockResolvedValue(undefined);
            const props = createDefaultProps({ onFullSync });
            render(<RecoverySyncPrompt {...props} />);

            const fullSyncButton = screen.getByRole('button', { name: /Full Sync/i });
            await user.click(fullSyncButton);

            expect(onFullSync).toHaveBeenCalledTimes(1);
        });

        it('calls onClose when Cancel button clicked', async () => {
            const onClose = vi.fn();
            const props = createDefaultProps({ onClose });
            render(<RecoverySyncPrompt {...props} />);

            const cancelButton = screen.getByRole('button', { name: /Cancel/i });
            await user.click(cancelButton);

            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('calls onClose when backdrop clicked', async () => {
            const onClose = vi.fn();
            const props = createDefaultProps({ onClose });
            render(<RecoverySyncPrompt {...props} />);

            // Find the backdrop (the element with onClick that's not the modal content)
            const backdrop = screen.getByTestId('recovery-sync-prompt-backdrop');
            await user.click(backdrop);

            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('calls onClose on Escape key (when not syncing)', () => {
            const onClose = vi.fn();
            const props = createDefaultProps({ onClose });
            render(<RecoverySyncPrompt {...props} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    // =========================================================================
    // Loading State
    // =========================================================================
    describe('loading state', () => {
        it('shows loading state during sync', async () => {
            // Create a promise that we can control
            let resolveSync: () => void;
            const syncPromise = new Promise<void>((resolve) => {
                resolveSync = resolve;
            });
            const onFullSync = vi.fn().mockReturnValue(syncPromise);

            const props = createDefaultProps({ onFullSync });
            render(<RecoverySyncPrompt {...props} />);

            const fullSyncButton = screen.getByRole('button', { name: /Full Sync/i });
            await user.click(fullSyncButton);

            // Should show loading indicator
            await waitFor(() => {
                expect(screen.getByTestId('recovery-sync-loading')).toBeInTheDocument();
            });

            // Resolve the promise
            resolveSync!();
        });

        it('disables buttons during sync', async () => {
            // Create a promise that we can control
            let resolveSync: () => void;
            const syncPromise = new Promise<void>((resolve) => {
                resolveSync = resolve;
            });
            const onFullSync = vi.fn().mockReturnValue(syncPromise);

            const props = createDefaultProps({ onFullSync });
            render(<RecoverySyncPrompt {...props} />);

            const fullSyncButton = screen.getByRole('button', { name: /Full Sync/i });
            const cancelButton = screen.getByRole('button', { name: /Cancel/i });

            await user.click(fullSyncButton);

            // Buttons should be disabled during sync
            await waitFor(() => {
                expect(fullSyncButton).toBeDisabled();
                expect(cancelButton).toBeDisabled();
            });

            // Resolve the promise
            resolveSync!();
        });

        it('does NOT call onClose on Escape when syncing', async () => {
            // Create a promise that we can control
            let resolveSync: () => void;
            const syncPromise = new Promise<void>((resolve) => {
                resolveSync = resolve;
            });
            const onFullSync = vi.fn().mockReturnValue(syncPromise);
            const onClose = vi.fn();

            const props = createDefaultProps({ onFullSync, onClose });
            render(<RecoverySyncPrompt {...props} />);

            const fullSyncButton = screen.getByRole('button', { name: /Full Sync/i });
            await user.click(fullSyncButton);

            // Wait for loading state
            await waitFor(() => {
                expect(screen.getByTestId('recovery-sync-loading')).toBeInTheDocument();
            });

            // Press Escape while syncing
            fireEvent.keyDown(document, { key: 'Escape' });

            // onClose should NOT be called
            expect(onClose).not.toHaveBeenCalled();

            // Resolve the promise
            resolveSync!();
        });
    });

    // =========================================================================
    // Accessibility
    // =========================================================================
    describe('accessibility', () => {
        it('has proper ARIA attributes', () => {
            const props = createDefaultProps();
            render(<RecoverySyncPrompt {...props} />);

            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-modal', 'true');
            expect(dialog).toHaveAttribute('aria-labelledby');
        });

        it('has accessible close button', () => {
            const props = createDefaultProps();
            render(<RecoverySyncPrompt {...props} />);

            // Close button should have accessible label
            const closeButton = screen.getByTestId('recovery-sync-close-btn');
            expect(closeButton).toHaveAttribute('aria-label');
        });

        // L3: Focus management tests
        it('moves focus to close button when dialog opens', async () => {
            const props = createDefaultProps();
            render(<RecoverySyncPrompt {...props} />);

            // Wait for focus timeout to complete
            await waitFor(() => {
                const closeButton = screen.getByTestId('recovery-sync-close-btn');
                expect(document.activeElement).toBe(closeButton);
            });
        });

        it('cleans up focus timeout ref on unmount', () => {
            const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
            const props = createDefaultProps();
            const { unmount } = render(<RecoverySyncPrompt {...props} />);

            // Unmount before focus timeout fires
            unmount();

            // clearTimeout should have been called for cleanup
            expect(clearTimeoutSpy).toHaveBeenCalled();

            clearTimeoutSpy.mockRestore();
        });
    });

    // =========================================================================
    // Translations
    // =========================================================================
    describe('translations', () => {
        it('supports English translations', () => {
            const props = createDefaultProps({
                t: createMockTranslation('en'),
                lang: 'en',
            });
            render(<RecoverySyncPrompt {...props} />);

            expect(screen.getByText('Sync Recovery Needed')).toBeInTheDocument();
            expect(screen.getByText('Full Sync')).toBeInTheDocument();
            expect(screen.getByText('Cancel')).toBeInTheDocument();
        });

        it('supports Spanish translations', () => {
            const props = createDefaultProps({
                t: createMockTranslation('es'),
                lang: 'es',
            });
            render(<RecoverySyncPrompt {...props} />);

            expect(screen.getByText('Recuperacion de Sincronizacion')).toBeInTheDocument();
            expect(screen.getByText('Sincronizacion Completa')).toBeInTheDocument();
            expect(screen.getByText('Cancelar')).toBeInTheDocument();
        });

        it('falls back to English when translation key not found', () => {
            const emptyT = () => ''; // Returns empty string for all keys
            const props = createDefaultProps({
                t: emptyT,
                lang: 'en',
            });
            render(<RecoverySyncPrompt {...props} />);

            // Should fall back to hardcoded English text
            expect(screen.getByText('Sync Recovery Needed')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Rate Limiting (H1: Add Rate Limiting to Sync Operations)
    // =========================================================================
    describe('rate limiting', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('exports SYNC_COOLDOWN_MS constant as 30000ms', () => {
            expect(SYNC_COOLDOWN_MS).toBe(30000);
        });

        it('shows error when clicking sync during cooldown', async () => {
            const onFullSync = vi.fn().mockRejectedValue(new Error('Network error'));
            const props = createDefaultProps({ onFullSync });
            render(<RecoverySyncPrompt {...props} />);

            const fullSyncButton = screen.getByTestId('recovery-sync-full-btn');

            // First click - triggers sync which fails
            await act(async () => {
                fireEvent.click(fullSyncButton);
                // Allow the promise rejection to process
                await Promise.resolve();
            });

            // Second click - should be rate limited
            await act(async () => {
                fireEvent.click(fullSyncButton);
            });

            // Should show rate limit error message
            const errorElement = screen.getByTestId('recovery-sync-error');
            expect(errorElement).toBeInTheDocument();
            expect(errorElement.textContent).toMatch(/wait.*\d+s.*before/i);
        });

        it('countdown decrements every second', async () => {
            const onFullSync = vi.fn().mockRejectedValue(new Error('Network error'));
            const props = createDefaultProps({ onFullSync });
            render(<RecoverySyncPrompt {...props} />);

            const fullSyncButton = screen.getByTestId('recovery-sync-full-btn');

            // First click - triggers sync which fails, starting cooldown
            await act(async () => {
                fireEvent.click(fullSyncButton);
                await Promise.resolve();
            });

            // Get the initial error message showing 30s
            const errorElement = screen.getByTestId('recovery-sync-error');
            expect(errorElement.textContent).toMatch(/30s/);

            // Advance by 1 second
            await act(async () => {
                vi.advanceTimersByTime(1000);
            });

            // Should now show 29s
            expect(errorElement.textContent).toMatch(/29s/);

            // Advance by another 5 seconds
            await act(async () => {
                vi.advanceTimersByTime(5000);
            });

            // Should now show 24s
            expect(errorElement.textContent).toMatch(/24s/);
        });

        it('can sync again after cooldown expires', async () => {
            const onFullSync = vi.fn()
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce(undefined);
            const props = createDefaultProps({ onFullSync });
            render(<RecoverySyncPrompt {...props} />);

            const fullSyncButton = screen.getByTestId('recovery-sync-full-btn');

            // First click - triggers sync which fails
            await act(async () => {
                fireEvent.click(fullSyncButton);
                await Promise.resolve();
            });

            expect(onFullSync).toHaveBeenCalledTimes(1);

            // Wait for full cooldown to expire (30 seconds + advance interval timer to clear)
            await act(async () => {
                vi.advanceTimersByTime(SYNC_COOLDOWN_MS + 1000);
            });

            // Second click - should work now
            await act(async () => {
                fireEvent.click(fullSyncButton);
                await Promise.resolve();
            });

            expect(onFullSync).toHaveBeenCalledTimes(2);
        });

        it('cooldown starts after failed sync', async () => {
            const onFullSync = vi.fn().mockRejectedValue(new Error('Sync failed'));
            const props = createDefaultProps({ onFullSync });
            render(<RecoverySyncPrompt {...props} />);

            const fullSyncButton = screen.getByTestId('recovery-sync-full-btn');

            // Click to trigger failed sync
            await act(async () => {
                fireEvent.click(fullSyncButton);
                await Promise.resolve();
            });

            // Error should be displayed with cooldown
            const errorElement = screen.getByTestId('recovery-sync-error');
            expect(errorElement).toBeInTheDocument();
            expect(errorElement.textContent).toMatch(/30s/);

            // Try clicking again immediately
            await act(async () => {
                fireEvent.click(fullSyncButton);
            });

            // Should still show rate limit error (cooldown active)
            expect(errorElement.textContent).toMatch(/wait.*\d+s.*before/i);
            // onFullSync should only have been called once
            expect(onFullSync).toHaveBeenCalledTimes(1);
        });

        it('interval is cleared on unmount', async () => {
            const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
            const onFullSync = vi.fn().mockRejectedValue(new Error('Network error'));
            const props = createDefaultProps({ onFullSync });
            const { unmount } = render(<RecoverySyncPrompt {...props} />);

            const fullSyncButton = screen.getByTestId('recovery-sync-full-btn');

            // Click to trigger failed sync (starts cooldown interval)
            await act(async () => {
                fireEvent.click(fullSyncButton);
                await Promise.resolve();
            });

            // Unmount the component
            unmount();

            // clearInterval should have been called
            expect(clearIntervalSpy).toHaveBeenCalled();

            clearIntervalSpy.mockRestore();
        });

        it('does not rate limit the first sync attempt', async () => {
            const onFullSync = vi.fn().mockResolvedValue(undefined);
            const props = createDefaultProps({ onFullSync });
            render(<RecoverySyncPrompt {...props} />);

            const fullSyncButton = screen.getByTestId('recovery-sync-full-btn');

            // First click should work without any rate limiting
            await act(async () => {
                fireEvent.click(fullSyncButton);
                await Promise.resolve();
            });

            expect(onFullSync).toHaveBeenCalledTimes(1);
            // No error should be shown
            expect(screen.queryByTestId('recovery-sync-error')).not.toBeInTheDocument();
        });

        it('shows remaining seconds in rate limit error message', async () => {
            const onFullSync = vi.fn().mockRejectedValue(new Error('Network error'));
            const props = createDefaultProps({ onFullSync });
            render(<RecoverySyncPrompt {...props} />);

            const fullSyncButton = screen.getByTestId('recovery-sync-full-btn');

            // First click - triggers sync which fails
            await act(async () => {
                fireEvent.click(fullSyncButton);
                await Promise.resolve();
            });

            // Advance by 10 seconds
            await act(async () => {
                vi.advanceTimersByTime(10000);
            });

            // Second click - should show remaining time
            await act(async () => {
                fireEvent.click(fullSyncButton);
            });

            const errorElement = screen.getByTestId('recovery-sync-error');
            // Should show approximately 20s remaining
            expect(errorElement.textContent).toMatch(/20s/);
        });
    });
});
