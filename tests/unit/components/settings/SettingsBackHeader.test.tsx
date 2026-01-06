/**
 * SettingsBackHeader Component Tests
 * Story 14.22: Tests for settings sub-view back header component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsBackHeader } from '../../../../src/components/settings/SettingsBackHeader';

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
