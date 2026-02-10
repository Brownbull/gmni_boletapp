/**
 * PerfilView Component Tests
 * Story 14.22: Tests for profile sub-view with avatar, form fields, and save functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PerfilView } from '@features/settings/components/subviews/PerfilView';

describe('PerfilView', () => {
    const mockT = (key: string) => {
        const translations: Record<string, string> = {
            settingsPerfil: 'Perfil',
            fullName: 'Nombre Completo',
            email: 'Correo Electronico',
            phone: 'Telefono',
            birthDate: 'Fecha de Nacimiento',
            optional: 'opcional',
            linkedAccount: 'Vinculado',
            linkedAccountSection: 'Cuenta Vinculada',
            connected: 'Conectado',
            saveChanges: 'Guardar Cambios',
            saving: 'Guardando...',
            changesSaved: 'Cambios guardados',
            errorSavingChanges: 'Error al guardar',
            changeProfilePhoto: 'Cambiar foto de perfil',
        };
        return translations[key] || key;
    };

    const defaultProps = {
        t: mockT,
        theme: 'light',
        onBack: vi.fn(),
        displayName: 'Maria Rodriguez',
        email: 'maria@gmail.com',
        phoneNumber: '912345678',
        birthDate: '',
        onSetDisplayName: vi.fn(),
        onSetPhoneNumber: vi.fn(),
        onSetBirthDate: vi.fn(),
        onShowToast: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Avatar', () => {
        it('displays initials from display name', () => {
            render(<PerfilView {...defaultProps} displayName="Maria Rodriguez" />);

            // MR = first + last initial
            expect(screen.getByText('MR')).toBeInTheDocument();
        });

        it('displays initials from email when no name', () => {
            render(<PerfilView {...defaultProps} displayName="" email="test@gmail.com" />);

            // TE = first two letters of email
            expect(screen.getByText('TE')).toBeInTheDocument();
        });

        it('displays ?? when no name or email', () => {
            render(<PerfilView {...defaultProps} displayName="" email="" />);

            expect(screen.getByText('??')).toBeInTheDocument();
        });

        it('renders camera button for photo change', () => {
            render(<PerfilView {...defaultProps} />);

            expect(screen.getByLabelText('Cambiar foto de perfil')).toBeInTheDocument();
        });
    });

    describe('Form Fields', () => {
        it('renders name field with current value', () => {
            render(<PerfilView {...defaultProps} displayName="Maria Rodriguez" />);

            // Using floating label pattern - find by label text
            const nameInput = screen.getByLabelText('Nombre Completo');
            expect(nameInput).toHaveValue('Maria Rodriguez');
        });

        it('renders email field as read-only', () => {
            render(<PerfilView {...defaultProps} email="maria@gmail.com" />);

            const emailInput = screen.getByDisplayValue('maria@gmail.com');
            expect(emailInput).toHaveAttribute('readonly');
        });

        it('displays "Vinculado" badge on email field', () => {
            render(<PerfilView {...defaultProps} />);

            expect(screen.getByText('Vinculado')).toBeInTheDocument();
        });

        it('renders phone field with current value', () => {
            render(<PerfilView {...defaultProps} phoneNumber="912345678" />);

            const phoneInput = screen.getByDisplayValue('912345678');
            expect(phoneInput).toBeInTheDocument();
        });

        it('renders birth date field', () => {
            render(<PerfilView {...defaultProps} />);

            // Using floating label pattern - find by label text
            const birthDateInput = screen.getByLabelText(/Fecha de Nacimiento/);
            expect(birthDateInput).toBeInTheDocument();
        });

        it('shows birth date label with optional indicator', () => {
            render(<PerfilView {...defaultProps} />);

            expect(screen.getByText(/Fecha de Nacimiento/)).toBeInTheDocument();
            expect(screen.getByText(/opcional/)).toBeInTheDocument();
        });
    });

    describe('Linked Account Section', () => {
        it('renders linked account section header', () => {
            render(<PerfilView {...defaultProps} />);

            expect(screen.getByText('Cuenta Vinculada')).toBeInTheDocument();
        });

        it('shows Google provider with email', () => {
            render(<PerfilView {...defaultProps} email="maria@gmail.com" />);

            // Google text and email in the card
            expect(screen.getByText('Google')).toBeInTheDocument();
            // Email appears twice - once in email field, once in linked account
            const emailElements = screen.getAllByText('maria@gmail.com');
            expect(emailElements.length).toBeGreaterThanOrEqual(1);
        });

        it('shows connected badge', () => {
            render(<PerfilView {...defaultProps} />);

            expect(screen.getByText('Conectado')).toBeInTheDocument();
        });
    });

    describe('Save Changes', () => {
        it('save button is disabled when no changes', () => {
            render(<PerfilView {...defaultProps} />);

            const saveButton = screen.getByRole('button', { name: /Guardar Cambios/i });
            expect(saveButton).toBeDisabled();
        });

        it('save button is enabled when name changes', () => {
            render(<PerfilView {...defaultProps} />);

            const nameInput = screen.getByLabelText('Nombre Completo');
            fireEvent.change(nameInput, { target: { value: 'New Name' } });

            const saveButton = screen.getByRole('button', { name: /Guardar Cambios/i });
            expect(saveButton).not.toBeDisabled();
        });

        it('save button is enabled when phone changes', () => {
            render(<PerfilView {...defaultProps} />);

            const phoneInput = screen.getByPlaceholderText('9 1234 5678');
            fireEvent.change(phoneInput, { target: { value: '987654321' } });

            const saveButton = screen.getByRole('button', { name: /Guardar Cambios/i });
            expect(saveButton).not.toBeDisabled();
        });

        it('save button is enabled when birth date changes', () => {
            render(<PerfilView {...defaultProps} />);

            // Date input uses ISO format YYYY-MM-DD
            const birthDateInput = screen.getByLabelText(/Fecha de Nacimiento/);
            fireEvent.change(birthDateInput, { target: { value: '1990-06-15' } });

            const saveButton = screen.getByRole('button', { name: /Guardar Cambios/i });
            expect(saveButton).not.toBeDisabled();
        });

        it('calls onSetDisplayName when saving name change', async () => {
            const onSetDisplayName = vi.fn();
            render(<PerfilView {...defaultProps} onSetDisplayName={onSetDisplayName} />);

            const nameInput = screen.getByLabelText('Nombre Completo');
            fireEvent.change(nameInput, { target: { value: 'New Name' } });

            const saveButton = screen.getByRole('button', { name: /Guardar Cambios/i });
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(onSetDisplayName).toHaveBeenCalledWith('New Name');
            });
        });

        it('calls onSetPhoneNumber when saving phone change', async () => {
            const onSetPhoneNumber = vi.fn();
            render(<PerfilView {...defaultProps} onSetPhoneNumber={onSetPhoneNumber} />);

            const phoneInput = screen.getByPlaceholderText('9 1234 5678');
            fireEvent.change(phoneInput, { target: { value: '999888777' } });

            const saveButton = screen.getByRole('button', { name: /Guardar Cambios/i });
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(onSetPhoneNumber).toHaveBeenCalledWith('999888777');
            });
        });

        it('calls onSetBirthDate when saving birth date change', async () => {
            const onSetBirthDate = vi.fn();
            render(<PerfilView {...defaultProps} onSetBirthDate={onSetBirthDate} />);

            // Date input uses ISO format YYYY-MM-DD
            const birthDateInput = screen.getByLabelText(/Fecha de Nacimiento/);
            fireEvent.change(birthDateInput, { target: { value: '1985-12-25' } });

            const saveButton = screen.getByRole('button', { name: /Guardar Cambios/i });
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(onSetBirthDate).toHaveBeenCalledWith('1985-12-25');
            });
        });

        it('shows toast on successful save', async () => {
            const onShowToast = vi.fn();
            render(<PerfilView {...defaultProps} onShowToast={onShowToast} />);

            const nameInput = screen.getByLabelText('Nombre Completo');
            fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

            const saveButton = screen.getByRole('button', { name: /Guardar Cambios/i });
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(onShowToast).toHaveBeenCalledWith('Cambios guardados', 'success');
            });
        });
    });

    // Note: Back navigation is now handled by TopHeader breadcrumb, not PerfilView

    describe('Theme Support', () => {
        it('renders correctly in light theme', () => {
            const { container } = render(<PerfilView {...defaultProps} theme="light" />);

            // Should not have issues rendering
            expect(container).toBeInTheDocument();
        });

        it('renders correctly in dark theme', () => {
            const { container } = render(<PerfilView {...defaultProps} theme="dark" />);

            // Should not have issues rendering
            expect(container).toBeInTheDocument();
        });
    });

    describe('Country Code Selector', () => {
        it('renders country code selector with Chile as default', () => {
            render(<PerfilView {...defaultProps} />);

            // Default is +56 (Chile) - now in a select dropdown
            const countrySelect = screen.getByLabelText('Country code');
            expect(countrySelect).toHaveValue('+56');
        });

        it('renders phone input field', () => {
            render(<PerfilView {...defaultProps} />);

            // Phone input should be available
            const phoneInput = screen.getByPlaceholderText('9 1234 5678');
            expect(phoneInput).toBeInTheDocument();
        });
    });
});
