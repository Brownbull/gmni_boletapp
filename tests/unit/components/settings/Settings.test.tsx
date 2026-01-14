/**
 * Settings Components Tests (Consolidated)
 * Story 14.22: Tests for settings components
 *
 * Consolidates:
 * - SettingsMenuItem (5 tests)
 * - SettingsBackHeader (4 tests)
 * - SettingsSelect (10 tests)
 *
 * Total: 19 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsMenuItem } from '../../../../src/components/settings/SettingsMenuItem';
import { SettingsBackHeader } from '../../../../src/components/settings/SettingsBackHeader';
import { SettingsSelect, SelectOption } from '../../../../src/components/settings/SettingsSelect';

// =============================================================================
// SettingsMenuItem Tests (5 tests)
// =============================================================================

describe('SettingsMenuItem', () => {
  const defaultProps = {
    title: 'Test Title',
    subtitle: 'Test Subtitle',
    icon: 'user' as const,
    iconBgColor: '#3b82f6',
    onClick: vi.fn(),
  };

  it('renders title and subtitle', () => {
    render(<SettingsMenuItem {...defaultProps} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<SettingsMenuItem {...defaultProps} onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders with correct testId', () => {
    render(<SettingsMenuItem {...defaultProps} testId="test-menu-item" />);

    expect(screen.getByTestId('test-menu-item')).toBeInTheDocument();
  });

  it('renders different icons', () => {
    // Updated to match mockup settings.html icons (circle-alert instead of alert-triangle)
    const icons = ['circle-alert', 'user', 'settings', 'camera', 'credit-card', 'book-open', 'smartphone', 'database'] as const;

    icons.forEach((icon) => {
      const { unmount } = render(
        <SettingsMenuItem {...defaultProps} icon={icon} testId={`icon-${icon}`} />
      );
      expect(screen.getByTestId(`icon-${icon}`)).toBeInTheDocument();
      unmount();
    });
  });

  it('applies custom icon background color', () => {
    const { container } = render(
      <SettingsMenuItem {...defaultProps} iconBgColor="#ff0000" />
    );

    const iconContainer = container.querySelector('.w-10.h-10');
    expect(iconContainer).toHaveStyle({ backgroundColor: '#ff0000' });
  });
});

// =============================================================================
// SettingsBackHeader Tests (4 tests)
// =============================================================================

describe('SettingsBackHeader', () => {
  it('renders title', () => {
    render(<SettingsBackHeader title="Test Title" onBack={vi.fn()} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(<SettingsBackHeader title="Test" onBack={onBack} />);

    fireEvent.click(screen.getByLabelText('Back to settings menu'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders with custom testId', () => {
    render(
      <SettingsBackHeader
        title="Test"
        onBack={vi.fn()}
        testId="custom-back-btn"
      />
    );

    expect(screen.getByTestId('custom-back-btn')).toBeInTheDocument();
  });

  it('renders default testId when not provided', () => {
    render(<SettingsBackHeader title="Test" onBack={vi.fn()} />);

    expect(screen.getByTestId('settings-back-button')).toBeInTheDocument();
  });
});

// =============================================================================
// SettingsSelect Tests (10 tests)
// =============================================================================

describe('SettingsSelect', () => {
  const mockOptions: SelectOption[] = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Espanol' },
    { value: 'fr', label: 'Francais' },
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

    const spanishOption = screen.getByRole('option', { name: 'Espanol' });
    fireEvent.click(spanishOption);

    expect(onChange).toHaveBeenCalledWith('es');
  });

  it('closes dropdown after selection', () => {
    render(<SettingsSelect {...defaultProps} />);

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    const spanishOption = screen.getByRole('option', { name: 'Espanol' });
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
    const unselectedOption = screen.getByRole('option', { name: 'Espanol' });
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
    expect(trigger).toHaveTextContent('Espanol');
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
