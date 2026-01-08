/**
 * SettingsMenuItem Component Tests
 * Story 14.22: Tests for hierarchical settings menu item component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsMenuItem } from '../../../../src/components/settings/SettingsMenuItem';

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
