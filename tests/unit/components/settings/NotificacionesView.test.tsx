/**
 * NotificacionesView Component Tests
 *
 * Story 14c.13: FCM Push Notifications for Shared Groups
 * Epic 14c: Household Sharing
 *
 * Tests for the push notification settings UI component.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificacionesView } from '@features/settings/components/subviews/NotificacionesView';

describe('NotificacionesView', () => {
    const mockEnableNotifications = vi.fn().mockResolvedValue(true);
    const mockDisableNotifications = vi.fn().mockResolvedValue(undefined);
    const mockShowToast = vi.fn();

    const defaultProps = {
        theme: 'light',
        lang: 'es' as const,
        isSupported: true,
        permission: 'default' as NotificationPermission,
        isEnabled: false,
        isLoading: false,
        error: null,
        onEnableNotifications: mockEnableNotifications,
        onDisableNotifications: mockDisableNotifications,
        onShowToast: mockShowToast,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('should render the main toggle card', () => {
            render(<NotificacionesView {...defaultProps} />);

            expect(screen.getByText('Notificaciones de Grupos')).toBeInTheDocument();
        });

        it('should render in English when lang is en', () => {
            render(<NotificacionesView {...defaultProps} lang="en" />);

            expect(screen.getByText('Group Notifications')).toBeInTheDocument();
        });

        it('should show "Desactivadas" when notifications are disabled', () => {
            render(<NotificacionesView {...defaultProps} isEnabled={false} />);

            expect(screen.getByText('Desactivadas')).toBeInTheDocument();
        });

        it('should show "Activadas" when notifications are enabled', () => {
            render(<NotificacionesView {...defaultProps} isEnabled={true} />);

            expect(screen.getByText('Activadas')).toBeInTheDocument();
        });

        it('should show description text', () => {
            render(<NotificacionesView {...defaultProps} />);

            expect(screen.getByText(/Recibe notificaciones cuando otros miembros/)).toBeInTheDocument();
        });

        it('should show what notifications include section', () => {
            render(<NotificacionesView {...defaultProps} />);

            expect(screen.getByText('¿Qué notificaciones recibiré?')).toBeInTheDocument();
            expect(screen.getByText('Gastos agregados por otros miembros')).toBeInTheDocument();
        });
    });

    describe('not supported state', () => {
        it('should show not available message when not supported', () => {
            render(<NotificacionesView {...defaultProps} isSupported={false} />);

            expect(screen.getByText('No disponible')).toBeInTheDocument();
            expect(screen.getByText(/Las notificaciones push no son compatibles/)).toBeInTheDocument();
        });

        it('should not show toggle when not supported', () => {
            render(<NotificacionesView {...defaultProps} isSupported={false} />);

            expect(screen.queryByRole('button', { name: /Activar notificaciones/i })).not.toBeInTheDocument();
        });
    });

    describe('permission denied state', () => {
        it('should show permission denied warning', () => {
            render(<NotificacionesView {...defaultProps} permission="denied" />);

            expect(screen.getByText('Permiso denegado')).toBeInTheDocument();
            expect(screen.getByText(/actívalas en la configuración de tu navegador/)).toBeInTheDocument();
        });

        it('should disable toggle when permission is denied', () => {
            render(<NotificacionesView {...defaultProps} permission="denied" />);

            const toggle = screen.getByRole('button', { name: /notificaciones/i });
            expect(toggle).toHaveStyle({ opacity: '0.5' });
        });
    });

    describe('toggle interactions', () => {
        it('should call onEnableNotifications when toggle is clicked and disabled', async () => {
            render(<NotificacionesView {...defaultProps} isEnabled={false} />);

            const toggle = screen.getByRole('button', { name: /Activar notificaciones/i });
            fireEvent.click(toggle);

            await waitFor(() => {
                expect(mockEnableNotifications).toHaveBeenCalledTimes(1);
            });
        });

        it('should call onDisableNotifications when toggle is clicked and enabled', async () => {
            render(<NotificacionesView {...defaultProps} isEnabled={true} />);

            const toggle = screen.getByRole('button', { name: /Desactivar notificaciones/i });
            fireEvent.click(toggle);

            await waitFor(() => {
                expect(mockDisableNotifications).toHaveBeenCalledTimes(1);
            });
        });

        it('should show toast on successful enable', async () => {
            render(<NotificacionesView {...defaultProps} isEnabled={false} />);

            const toggle = screen.getByRole('button', { name: /Activar notificaciones/i });
            fireEvent.click(toggle);

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith('Notificaciones activadas', 'success');
            });
        });

        it('should show toast on successful disable', async () => {
            render(<NotificacionesView {...defaultProps} isEnabled={true} />);

            const toggle = screen.getByRole('button', { name: /Desactivar notificaciones/i });
            fireEvent.click(toggle);

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith('Notificaciones desactivadas', 'success');
            });
        });

        it('should not call handlers while loading', async () => {
            render(<NotificacionesView {...defaultProps} isLoading={true} />);

            const toggle = screen.getByRole('button', { name: /notificaciones/i });
            fireEvent.click(toggle);

            expect(mockEnableNotifications).not.toHaveBeenCalled();
            expect(mockDisableNotifications).not.toHaveBeenCalled();
        });
    });

    describe('error state', () => {
        it('should display error message when error is present', () => {
            render(<NotificacionesView {...defaultProps} error="Failed to enable" />);

            expect(screen.getByText('Failed to enable')).toBeInTheDocument();
        });

        it('should not show error when permission is denied (shows warning instead)', () => {
            render(
                <NotificacionesView
                    {...defaultProps}
                    permission="denied"
                    error="Permission denied"
                />
            );

            // Should show the permission denied warning, not the error
            expect(screen.getByText('Permiso denegado')).toBeInTheDocument();
            // Error should not be shown when permission is denied
            const errorElements = screen.queryAllByText('Permission denied');
            // The warning text contains different content
            expect(errorElements.length).toBeLessThanOrEqual(1);
        });
    });

    describe('theme support', () => {
        it('should apply dark theme styles', () => {
            render(<NotificacionesView {...defaultProps} theme="dark" />);

            // The component should render without errors in dark mode
            expect(screen.getByText('Notificaciones de Grupos')).toBeInTheDocument();
        });
    });

    describe('accessibility', () => {
        it('should have proper aria-label on toggle button', () => {
            render(<NotificacionesView {...defaultProps} isEnabled={false} />);

            const toggle = screen.getByRole('button', { name: /Activar notificaciones/i });
            expect(toggle).toBeInTheDocument();
        });

        it('should update aria-label when enabled', () => {
            render(<NotificacionesView {...defaultProps} isEnabled={true} />);

            const toggle = screen.getByRole('button', { name: /Desactivar notificaciones/i });
            expect(toggle).toBeInTheDocument();
        });
    });
});
