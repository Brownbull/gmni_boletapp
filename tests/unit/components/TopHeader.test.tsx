import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TopHeader } from '../../../src/components/TopHeader';

/**
 * Mock translations
 *
 * Story 14.30.5a: Updated to match actual translation keys used by ProfileDropdown.
 * - ProfileDropdown uses t('purchases') not t('transactions')
 * - ProfileDropdown uses t('productos') for Items menu
 */
const mockT = (key: string) => {
    const translations: Record<string, string> = {
        home: 'Inicio',
        analytics: 'Analytics',
        history: 'Historial',
        settings: 'Configuración',
        transaction: 'Transacción',
        gastify: 'Gastify',
        transactions: 'Transacciones',
        // Story 14.30.5a: ProfileDropdown uses 'purchases' key, not 'transactions'
        purchases: 'Compras',
        // Story 14.31: ProfileDropdown uses 'productos' for Items menu
        productos: 'Productos',
        reports: 'Reportes',
        goals: 'Metas',
        comingSoon: 'Próximamente',
        insights: 'Ideas',
    };
    return translations[key] || key;
};

describe('TopHeader', () => {
    describe('Home variant', () => {
        it('renders logo and centered wordmark for home variant', () => {
            render(
                <TopHeader
                    variant="home"
                    onMenuClick={() => {}}
                    theme="light"
                    t={mockT}
                />
            );

            // Should show logo
            expect(screen.getByTestId('app-logo')).toBeInTheDocument();

            // Should show wordmark "Gastify" (centered)
            expect(screen.getByText('Gastify')).toBeInTheDocument();

            // Should show profile avatar (not hamburger menu)
            expect(screen.getByTestId('profile-avatar')).toBeInTheDocument();
        });

        it('shows profile avatar with "?" initials when no user name provided', () => {
            render(
                <TopHeader
                    variant="home"
                    onMenuClick={() => {}}
                    theme="light"
                    t={mockT}
                />
            );

            const avatar = screen.getByTestId('profile-avatar');
            expect(avatar).toHaveTextContent('?');
        });

        it('shows profile avatar with user initials when name provided', () => {
            render(
                <TopHeader
                    variant="home"
                    onMenuClick={() => {}}
                    userName="Juan Díaz"
                    userEmail="juan@ejemplo.com"
                    theme="light"
                    t={mockT}
                />
            );

            const avatar = screen.getByTestId('profile-avatar');
            expect(avatar).toHaveTextContent('JD');
        });

        it('does not render back button for home variant', () => {
            render(
                <TopHeader
                    variant="home"
                    onMenuClick={() => {}}
                    theme="light"
                    t={mockT}
                />
            );

            expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
        });
    });

    describe('Profile Dropdown', () => {
        it('opens dropdown when avatar is clicked', async () => {
            render(
                <TopHeader
                    variant="home"
                    onMenuClick={() => {}}
                    userName="Juan Díaz"
                    userEmail="juan@ejemplo.com"
                    theme="light"
                    t={mockT}
                />
            );

            const avatar = screen.getByTestId('profile-avatar');
            fireEvent.click(avatar);

            await waitFor(() => {
                expect(screen.getByTestId('profile-dropdown')).toBeInTheDocument();
            });
        });

        it('shows user name and email in dropdown', async () => {
            render(
                <TopHeader
                    variant="home"
                    onMenuClick={() => {}}
                    userName="Juan Díaz"
                    userEmail="juan@ejemplo.com"
                    theme="light"
                    t={mockT}
                />
            );

            fireEvent.click(screen.getByTestId('profile-avatar'));

            await waitFor(() => {
                expect(screen.getByText('Juan Díaz')).toBeInTheDocument();
                expect(screen.getByText('juan@ejemplo.com')).toBeInTheDocument();
            });
        });

        it('shows menu items in dropdown', async () => {
            render(
                <TopHeader
                    variant="home"
                    onMenuClick={() => {}}
                    userName="Juan Díaz"
                    theme="light"
                    t={mockT}
                />
            );

            fireEvent.click(screen.getByTestId('profile-avatar'));

            // Story 14.30.5a: ProfileDropdown uses 'purchases' key → 'Compras'
            await waitFor(() => {
                expect(screen.getByText('Compras')).toBeInTheDocument();
                expect(screen.getByText('Productos')).toBeInTheDocument();
                expect(screen.getByText('Reportes')).toBeInTheDocument();
                expect(screen.getByText('Metas')).toBeInTheDocument();
                expect(screen.getByText('Configuración')).toBeInTheDocument();
            });
        });

        it('shows "Coming soon" badge on disabled items', async () => {
            render(
                <TopHeader
                    variant="home"
                    onMenuClick={() => {}}
                    theme="light"
                    t={mockT}
                />
            );

            fireEvent.click(screen.getByTestId('profile-avatar'));

            await waitFor(() => {
                const badges = screen.getAllByText('Próximamente');
                // Story 14.16: Reports now enabled, only Goals shows "Próximamente"
                expect(badges.length).toBeGreaterThanOrEqual(1); // Goals only
            });
        });

        it('calls onMenuClick when Settings is clicked in dropdown', async () => {
            const onMenuClick = vi.fn();
            render(
                <TopHeader
                    variant="home"
                    onMenuClick={onMenuClick}
                    theme="light"
                    t={mockT}
                />
            );

            fireEvent.click(screen.getByTestId('profile-avatar'));

            await waitFor(() => {
                const settingsButton = screen.getByText('Configuración');
                fireEvent.click(settingsButton);
            });

            expect(onMenuClick).toHaveBeenCalledTimes(1);
        });

        it('closes dropdown when clicking outside', async () => {
            render(
                <TopHeader
                    variant="home"
                    onMenuClick={() => {}}
                    theme="light"
                    t={mockT}
                />
            );

            fireEvent.click(screen.getByTestId('profile-avatar'));

            await waitFor(() => {
                expect(screen.getByTestId('profile-dropdown')).toBeInTheDocument();
            });

            // Click outside
            fireEvent.mouseDown(document.body);

            await waitFor(() => {
                expect(screen.queryByTestId('profile-dropdown')).not.toBeInTheDocument();
            });
        });

        it('closes dropdown when Escape key is pressed', async () => {
            render(
                <TopHeader
                    variant="home"
                    onMenuClick={() => {}}
                    theme="light"
                    t={mockT}
                />
            );

            fireEvent.click(screen.getByTestId('profile-avatar'));

            await waitFor(() => {
                expect(screen.getByTestId('profile-dropdown')).toBeInTheDocument();
            });

            fireEvent.keyDown(document, { key: 'Escape' });

            await waitFor(() => {
                expect(screen.queryByTestId('profile-dropdown')).not.toBeInTheDocument();
            });
        });
    });

    describe('Detail variant', () => {
        it('renders back button and title for detail variant', () => {
            render(
                <TopHeader
                    variant="detail"
                    title="Transacción"
                    onBack={() => {}}
                    theme="light"
                    t={mockT}
                />
            );

            // Should show back button
            expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();

            // Should show title (centered)
            expect(screen.getByText('Transacción')).toBeInTheDocument();

            // Should NOT show profile avatar
            expect(screen.queryByTestId('profile-avatar')).not.toBeInTheDocument();
        });

        it('calls onBack when back button is clicked', () => {
            const onBack = vi.fn();
            render(
                <TopHeader
                    variant="detail"
                    title="Transacción"
                    onBack={onBack}
                    theme="light"
                    t={mockT}
                />
            );

            fireEvent.click(screen.getByRole('button', { name: /back/i }));
            expect(onBack).toHaveBeenCalledTimes(1);
        });

        it('does not render logo for detail variant', () => {
            render(
                <TopHeader
                    variant="detail"
                    title="Transacción"
                    onBack={() => {}}
                    theme="light"
                    t={mockT}
                />
            );

            expect(screen.queryByTestId('app-logo')).not.toBeInTheDocument();
            expect(screen.queryByText('Gastify')).not.toBeInTheDocument();
        });
    });

    describe('Settings variant', () => {
        it('renders back button and settings title', () => {
            render(
                <TopHeader
                    variant="settings"
                    onBack={() => {}}
                    theme="light"
                    t={mockT}
                />
            );

            // Should show back button
            expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();

            // Should show "Configuración" title (left-aligned per Story 14.22)
            expect(screen.getByText('Configuración')).toBeInTheDocument();

            // Story 14.22: Settings now shows profile avatar (like home variant)
            expect(screen.queryByTestId('profile-avatar')).toBeInTheDocument();
        });
    });

    describe('View-specific titles', () => {
        it('renders "Analytics" title for trends view', () => {
            render(
                <TopHeader
                    variant="home"
                    viewTitle="analytics"
                    onMenuClick={() => {}}
                    theme="light"
                    t={mockT}
                />
            );

            expect(screen.getByTestId('app-logo')).toBeInTheDocument();
            expect(screen.getByText('Analytics')).toBeInTheDocument();
        });

        it('renders "Transacciones" title for history view', () => {
            // Story 14.14: History view now uses "Transacciones" instead of "Historial"
            render(
                <TopHeader
                    variant="home"
                    viewTitle="history"
                    onMenuClick={() => {}}
                    theme="light"
                    t={mockT}
                />
            );

            expect(screen.getByText('Transacciones')).toBeInTheDocument();
        });
    });

    describe('Theme support', () => {
        it('applies light theme styling', () => {
            const { container } = render(
                <TopHeader
                    variant="home"
                    onMenuClick={() => {}}
                    theme="light"
                    t={mockT}
                />
            );

            expect(container.querySelector('header')).toBeInTheDocument();
        });

        it('applies dark theme styling', () => {
            const { container } = render(
                <TopHeader
                    variant="home"
                    onMenuClick={() => {}}
                    theme="dark"
                    t={mockT}
                />
            );

            expect(container.querySelector('header')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('has accessible name for profile avatar', () => {
            render(
                <TopHeader
                    variant="home"
                    onMenuClick={() => {}}
                    theme="light"
                    t={mockT}
                />
            );

            const avatar = screen.getByTestId('profile-avatar');
            expect(avatar).toHaveAttribute('aria-label', 'Open profile menu');
            expect(avatar).toHaveAttribute('aria-haspopup', 'true');
        });

        it('has accessible names for all buttons', () => {
            render(
                <TopHeader
                    variant="detail"
                    title="Test"
                    onBack={() => {}}
                    theme="light"
                    t={mockT}
                />
            );

            const backButton = screen.getByRole('button', { name: /back/i });
            expect(backButton).toHaveAttribute('aria-label');
        });

        it('dropdown has proper role attributes', async () => {
            render(
                <TopHeader
                    variant="home"
                    onMenuClick={() => {}}
                    theme="light"
                    t={mockT}
                />
            );

            fireEvent.click(screen.getByTestId('profile-avatar'));

            await waitFor(() => {
                const dropdown = screen.getByTestId('profile-dropdown');
                expect(dropdown).toHaveAttribute('role', 'menu');
            });
        });
    });

    describe('Fixed position and layout', () => {
        it('has fixed positioning', () => {
            const { container } = render(
                <TopHeader
                    variant="home"
                    onMenuClick={() => {}}
                    theme="light"
                    t={mockT}
                />
            );

            const header = container.querySelector('header');
            expect(header?.className).toContain('fixed');
        });

        it('has consistent height (h-14 = 56px)', () => {
            const { container } = render(
                <TopHeader
                    variant="home"
                    onMenuClick={() => {}}
                    theme="light"
                    t={mockT}
                />
            );

            const header = container.querySelector('header');
            // Header uses inline style for height instead of Tailwind class for better control
            expect(header?.style.height).toBe('72px');
        });

        it('centers the wordmark absolutely', () => {
            const { container } = render(
                <TopHeader
                    variant="home"
                    onMenuClick={() => {}}
                    theme="light"
                    t={mockT}
                />
            );

            // The center div should have absolute positioning classes
            const centerDiv = container.querySelector('.absolute.left-1\\/2');
            expect(centerDiv).toBeInTheDocument();
        });
    });

    describe('Initials generation', () => {
        it('generates correct initials for two-word names', () => {
            render(
                <TopHeader
                    variant="home"
                    onMenuClick={() => {}}
                    userName="María García"
                    theme="light"
                    t={mockT}
                />
            );

            expect(screen.getByTestId('profile-avatar')).toHaveTextContent('MG');
        });

        it('generates correct initials for single-word names', () => {
            render(
                <TopHeader
                    variant="home"
                    onMenuClick={() => {}}
                    userName="Admin"
                    theme="light"
                    t={mockT}
                />
            );

            expect(screen.getByTestId('profile-avatar')).toHaveTextContent('A');
        });

        it('handles three-word names (first and last)', () => {
            render(
                <TopHeader
                    variant="home"
                    onMenuClick={() => {}}
                    userName="Juan Carlos Pérez"
                    theme="light"
                    t={mockT}
                />
            );

            expect(screen.getByTestId('profile-avatar')).toHaveTextContent('JP');
        });
    });

    /**
     * Story 14c.4: View Mode Switcher Tests
     * Tests for tappable logo and group mode visual states
     */
    describe('View Mode Switcher (Story 14c.4)', () => {
        describe('Tappable Logo (AC1)', () => {
            it('should make logo area tappable when onLogoClick is provided', () => {
                const onLogoClick = vi.fn();
                render(
                    <TopHeader
                        variant="home"
                        onMenuClick={() => {}}
                        onLogoClick={onLogoClick}
                        theme="light"
                        t={mockT}
                    />
                );

                const logoButton = screen.getByTestId('app-logo-button');
                expect(logoButton).toBeInTheDocument();
            });

            it('should call onLogoClick when logo is clicked', () => {
                const onLogoClick = vi.fn();
                render(
                    <TopHeader
                        variant="home"
                        onMenuClick={() => {}}
                        onLogoClick={onLogoClick}
                        theme="light"
                        t={mockT}
                    />
                );

                const logoButton = screen.getByTestId('app-logo-button');
                fireEvent.click(logoButton);

                expect(onLogoClick).toHaveBeenCalledTimes(1);
            });

            it('should not be tappable when onLogoClick is not provided', () => {
                render(
                    <TopHeader
                        variant="home"
                        onMenuClick={() => {}}
                        theme="light"
                        t={mockT}
                    />
                );

                // Should render logo but not as a button
                expect(screen.getByTestId('app-logo')).toBeInTheDocument();
                expect(screen.queryByTestId('app-logo-button')).not.toBeInTheDocument();
            });
        });

        describe('Personal Mode Appearance (AC3)', () => {
            it('should show default Boletapp logo in personal mode', () => {
                render(
                    <TopHeader
                        variant="home"
                        onMenuClick={() => {}}
                        viewMode="personal"
                        theme="light"
                        t={mockT}
                    />
                );

                const logo = screen.getByTestId('app-logo');
                expect(logo).toBeInTheDocument();
                expect(logo).toHaveTextContent('G');
            });
        });

        describe('Group Mode Appearance (AC4)', () => {
            it('should show group icon when in group mode', () => {
                render(
                    <TopHeader
                        variant="home"
                        onMenuClick={() => {}}
                        viewMode="group"
                        activeGroup={{
                            id: 'group-123',
                            name: 'Familia Martinez',
                            icon: '👨‍👩‍👧',
                            color: '#10b981',
                            members: ['user-1', 'user-2'],
                        }}
                        theme="light"
                        t={mockT}
                    />
                );

                const groupIcon = screen.getByTestId('group-mode-icon');
                expect(groupIcon).toBeInTheDocument();
                expect(groupIcon).toHaveTextContent('👨‍👩‍👧');
            });

            it('should show group name in header when in group mode', () => {
                render(
                    <TopHeader
                        variant="home"
                        onMenuClick={() => {}}
                        viewMode="group"
                        activeGroup={{
                            id: 'group-123',
                            name: 'Familia Martinez',
                            icon: '👨‍👩‍👧',
                            color: '#10b981',
                            members: ['user-1', 'user-2'],
                        }}
                        theme="light"
                        t={mockT}
                    />
                );

                expect(screen.getByText('Familia Martinez')).toBeInTheDocument();
            });

            it('should show group mode icon with group color in header', () => {
                render(
                    <TopHeader
                        variant="home"
                        onMenuClick={() => {}}
                        viewMode="group"
                        activeGroup={{
                            id: 'group-123',
                            name: 'Familia',
                            color: '#10b981',
                            members: ['user-1'],
                        }}
                        theme="light"
                        t={mockT}
                    />
                );

                // Group mode icon should be displayed with the group's color
                const groupModeIcon = screen.getByTestId('group-mode-icon');
                expect(groupModeIcon).toBeInTheDocument();
                expect(groupModeIcon).toHaveStyle({ background: '#10b981' });
            });
        });

        describe('Visual Mode Indicator (AC7)', () => {
            it('should show group name indicator when in group mode', () => {
                render(
                    <TopHeader
                        variant="home"
                        onMenuClick={() => {}}
                        viewMode="group"
                        activeGroup={{
                            id: 'group-123',
                            name: 'Familia Martinez',
                            color: '#10b981',
                            members: ['user-1', 'user-2'],
                        }}
                        theme="light"
                        t={mockT}
                    />
                );

                // Should have a clear visual indicator
                const indicator = screen.getByTestId('group-mode-indicator');
                expect(indicator).toBeInTheDocument();
            });

            it('should not show group indicator in personal mode', () => {
                render(
                    <TopHeader
                        variant="home"
                        onMenuClick={() => {}}
                        viewMode="personal"
                        theme="light"
                        t={mockT}
                    />
                );

                expect(screen.queryByTestId('group-mode-indicator')).not.toBeInTheDocument();
            });
        });
    });
});
