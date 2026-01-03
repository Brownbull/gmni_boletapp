import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TopHeader } from '../../../src/components/TopHeader';

// Mock translations
const mockT = (key: string) => {
    const translations: Record<string, string> = {
        home: 'Inicio',
        analytics: 'Analytics',
        history: 'Historial',
        settings: 'Configuración',
        transaction: 'Transacción',
        gastify: 'Gastify',
        transactions: 'Transacciones',
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

            await waitFor(() => {
                expect(screen.getByText('Transacciones')).toBeInTheDocument();
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
                expect(badges.length).toBeGreaterThanOrEqual(2); // Reports and Goals
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

            // Should show "Configuración" title (centered)
            expect(screen.getByText('Configuración')).toBeInTheDocument();

            // Should NOT show profile avatar
            expect(screen.queryByTestId('profile-avatar')).not.toBeInTheDocument();
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

        it('renders "Historial" title for history view', () => {
            render(
                <TopHeader
                    variant="home"
                    viewTitle="history"
                    onMenuClick={() => {}}
                    theme="light"
                    t={mockT}
                />
            );

            expect(screen.getByText('Historial')).toBeInTheDocument();
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
            expect(header?.className).toContain('h-14');
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
});
