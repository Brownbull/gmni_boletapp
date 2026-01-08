/**
 * SettingsSelect Component Tests
 * Story 14.22: Custom dropdown select component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SettingsSelect, SelectOption } from '../../../../src/components/settings/SettingsSelect';

describe('SettingsSelect', () => {
    const mockOptions: SelectOption[] = [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Español' },
        { value: 'fr', label: 'Français' },
    ];

    const defaultProps = {
        label: 'Language',
        value: 'en',
        options: mockOptions,
        onChange: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders label and has correct aria attributes', () => {
        render(<SettingsSelect {...defaultProps} />);

        const combobox = screen.getByRole('combobox');
        expect(combobox).toHaveAttribute('aria-label', 'Language');
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByText('Language')).toBeInTheDocument();
    });

    it('opens dropdown on click', () => {
        render(<SettingsSelect {...defaultProps} />);

        const trigger = screen.getByRole('combobox');
        fireEvent.click(trigger);

        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        // All options should be visible
        const listbox = screen.getByRole('listbox');
        expect(listbox).toHaveStyle({ visibility: 'visible' });
    });

    it('calls onChange when option is selected', () => {
        const onChange = vi.fn();
        render(<SettingsSelect {...defaultProps} onChange={onChange} />);

        const trigger = screen.getByRole('combobox');
        fireEvent.click(trigger);

        const spanishOption = screen.getByRole('option', { name: 'Español' });
        fireEvent.click(spanishOption);

        expect(onChange).toHaveBeenCalledWith('es');
    });

    it('closes dropdown after selection', () => {
        render(<SettingsSelect {...defaultProps} />);

        const trigger = screen.getByRole('combobox');
        fireEvent.click(trigger);

        const spanishOption = screen.getByRole('option', { name: 'Español' });
        fireEvent.click(spanishOption);

        // Check aria-expanded instead of visibility (more reliable)
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('shows checkmark for selected option', () => {
        render(<SettingsSelect {...defaultProps} />);

        const trigger = screen.getByRole('combobox');
        fireEvent.click(trigger);

        const selectedOption = screen.getByRole('option', { name: 'English' });
        expect(selectedOption).toHaveAttribute('aria-selected', 'true');

        // Non-selected options should not have aria-selected=true
        const unselectedOption = screen.getByRole('option', { name: 'Español' });
        expect(unselectedOption).toHaveAttribute('aria-selected', 'false');
    });

    it('supports keyboard navigation with Enter', () => {
        render(<SettingsSelect {...defaultProps} />);

        const trigger = screen.getByRole('combobox');
        fireEvent.keyDown(trigger, { key: 'Enter' });

        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('supports keyboard navigation with Escape', () => {
        render(<SettingsSelect {...defaultProps} />);

        const trigger = screen.getByRole('combobox');
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');

        fireEvent.keyDown(trigger, { key: 'Escape' });
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('supports aria-label prop', () => {
        render(<SettingsSelect {...defaultProps} aria-label="Select your language" />);

        const trigger = screen.getByRole('combobox');
        expect(trigger).toHaveAttribute('aria-label', 'Select your language');
    });

    it('displays correct value when prop changes', () => {
        const { rerender } = render(<SettingsSelect {...defaultProps} value="en" />);

        // The selected option in trigger should show English
        const trigger = screen.getByRole('combobox');
        expect(trigger).toHaveTextContent('English');

        rerender(<SettingsSelect {...defaultProps} value="es" />);
        expect(trigger).toHaveTextContent('Español');
    });

    it('closes on click outside', () => {
        render(
            <div>
                <div data-testid="outside">Outside</div>
                <SettingsSelect {...defaultProps} />
            </div>
        );

        const trigger = screen.getByRole('combobox');
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');

        fireEvent.mouseDown(screen.getByTestId('outside'));
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
});
