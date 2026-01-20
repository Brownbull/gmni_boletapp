/**
 * SyncButton Component Unit Tests
 *
 * Story 14c.20: Shared Group Cache Optimization
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for the manual sync button component:
 * - Renders sync button with correct state
 * - Calls triggerSync on click
 * - Shows cooldown countdown when in cooldown
 * - Shows last sync time when available
 * - Compact mode shows icon only
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock localStorage
let mockStorage: Record<string, string>;
let mockLocalStorage: Storage;

beforeEach(() => {
    mockStorage = {};
    mockLocalStorage = {
        getItem: vi.fn((key) => mockStorage[key] || null),
        setItem: vi.fn((key, value) => {
            mockStorage[key] = value;
        }),
        removeItem: vi.fn((key) => {
            delete mockStorage[key];
        }),
        clear: vi.fn(() => {
            mockStorage = {};
        }),
        length: 0,
        key: vi.fn(() => null),
    };
    vi.stubGlobal('localStorage', mockLocalStorage);
});

afterEach(() => {
    vi.restoreAllMocks();
});

import { SyncButton } from '../../../../src/components/SharedGroups/SyncButton';
import { SYNC_COOLDOWN_KEY_PREFIX } from '../../../../src/hooks/useManualSync';

// ============================================================================
// Test Setup
// ============================================================================

function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
            },
        },
    });
}

function renderWithQueryClient(ui: React.ReactElement) {
    const queryClient = createTestQueryClient();
    return {
        ...render(
            <QueryClientProvider client={queryClient}>
                {ui}
            </QueryClientProvider>
        ),
        queryClient,
    };
}

// ============================================================================
// Tests: SyncButton
// ============================================================================

describe('SyncButton', () => {
    describe('Rendering', () => {
        it('should render sync button with "Sincronizar" text in Spanish', () => {
            renderWithQueryClient(
                <SyncButton groupId="group-123" lang="es" />
            );

            expect(screen.getByTestId('sync-button')).toBeInTheDocument();
            expect(screen.getByText('Sincronizar')).toBeInTheDocument();
        });

        it('should render sync button with "Sync Now" text in English', () => {
            renderWithQueryClient(
                <SyncButton groupId="group-123" lang="en" />
            );

            expect(screen.getByText('Sync Now')).toBeInTheDocument();
        });

        it('should render with compact mode (icon only)', () => {
            renderWithQueryClient(
                <SyncButton groupId="group-123" lang="es" compact />
            );

            // In compact mode, there should be a button but no "Sincronizar" text
            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
            expect(screen.queryByText('Sincronizar')).not.toBeInTheDocument();
        });
    });

    describe('Initial State', () => {
        it('should be enabled when no previous sync', () => {
            renderWithQueryClient(
                <SyncButton groupId="group-123" lang="es" />
            );

            const button = screen.getByTestId('sync-button');
            expect(button).not.toBeDisabled();
        });

        it('should show no last sync time when never synced', () => {
            renderWithQueryClient(
                <SyncButton groupId="group-123" lang="es" />
            );

            expect(screen.queryByTestId('last-sync-time')).not.toBeInTheDocument();
        });
    });

    describe('Cooldown State', () => {
        it('should show cooldown countdown when within cooldown period', () => {
            // Set a recent sync (30 seconds ago)
            const recentSync = Date.now() - 30000;
            mockStorage[`${SYNC_COOLDOWN_KEY_PREFIX}group-123`] = recentSync.toString();

            renderWithQueryClient(
                <SyncButton groupId="group-123" lang="es" />
            );

            // Should show "Espera Xs" where X is around 30
            expect(screen.getByText(/Espera \d+s/)).toBeInTheDocument();
        });

        it('should disable button during cooldown', () => {
            // Set a recent sync (30 seconds ago)
            const recentSync = Date.now() - 30000;
            mockStorage[`${SYNC_COOLDOWN_KEY_PREFIX}group-123`] = recentSync.toString();

            renderWithQueryClient(
                <SyncButton groupId="group-123" lang="es" />
            );

            const button = screen.getByTestId('sync-button');
            expect(button).toBeDisabled();
        });
    });

    describe('Last Sync Time Display', () => {
        it('should show last sync time when previously synced', () => {
            // Set a past sync (5 minutes ago)
            const pastSync = Date.now() - 300000;
            mockStorage[`${SYNC_COOLDOWN_KEY_PREFIX}group-123`] = pastSync.toString();

            renderWithQueryClient(
                <SyncButton groupId="group-123" lang="es" />
            );

            // Should show last sync time (cooldown expired, so button enabled and showing last sync)
            expect(screen.getByTestId('last-sync-time')).toBeInTheDocument();
            expect(screen.getByText(/Última sync:/)).toBeInTheDocument();
        });

        it('should show relative time format', () => {
            // Set a past sync (5 minutes ago)
            const pastSync = Date.now() - 300000;
            mockStorage[`${SYNC_COOLDOWN_KEY_PREFIX}group-123`] = pastSync.toString();

            renderWithQueryClient(
                <SyncButton groupId="group-123" lang="es" />
            );

            // Should show "hace 5 min" or similar
            expect(screen.getByText(/hace \d+ min/)).toBeInTheDocument();
        });
    });

    describe('Sync Action', () => {
        it('should call onShowToast on successful sync', async () => {
            const onShowToast = vi.fn();

            renderWithQueryClient(
                <SyncButton groupId="group-123" lang="es" onShowToast={onShowToast} />
            );

            const button = screen.getByTestId('sync-button');
            fireEvent.click(button);

            await waitFor(() => {
                expect(onShowToast).toHaveBeenCalledWith(
                    'Sincronizado correctamente',
                    'success'
                );
            });
        });

        it('should disable button while syncing', async () => {
            renderWithQueryClient(
                <SyncButton groupId="group-123" lang="es" />
            );

            const button = screen.getByTestId('sync-button');
            fireEvent.click(button);

            // Button should show syncing state
            expect(screen.getByText(/Sincronizando/)).toBeInTheDocument();
        });

        it('should update localStorage after sync', async () => {
            renderWithQueryClient(
                <SyncButton groupId="group-123" lang="es" />
            );

            const button = screen.getByTestId('sync-button');
            fireEvent.click(button);

            await waitFor(() => {
                expect(mockLocalStorage.setItem).toHaveBeenCalled();
            });
        });
    });

    describe('Per-Group Isolation', () => {
        it('should have separate cooldowns for different groups', () => {
            // Group A has recent sync
            const recentSync = Date.now() - 30000;
            mockStorage[`${SYNC_COOLDOWN_KEY_PREFIX}group-A`] = recentSync.toString();
            // Group B has no sync

            const { rerender } = renderWithQueryClient(
                <SyncButton groupId="group-A" lang="es" />
            );

            // Group A should be in cooldown
            expect(screen.getByTestId('sync-button')).toBeDisabled();

            // Render for Group B
            rerender(
                <QueryClientProvider client={createTestQueryClient()}>
                    <SyncButton groupId="group-B" lang="es" />
                </QueryClientProvider>
            );

            // Group B should NOT be in cooldown
            expect(screen.getByTestId('sync-button')).not.toBeDisabled();
        });
    });
});
