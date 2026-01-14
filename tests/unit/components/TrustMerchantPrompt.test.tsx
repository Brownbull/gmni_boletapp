import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { TrustMerchantPrompt } from '../../../src/components/TrustMerchantPrompt';

describe('TrustMerchantPrompt', () => {
    const mockT = (key: string) => {
        const translations: Record<string, string> = {
            trustMerchantTitle: 'Trust {merchant}?',
            trustMerchantMessage: "You've scanned {count} receipts from {merchant} without editing. Future receipts will be auto-saved.",
            trustMerchantConfirm: 'Yes, trust',
            trustMerchantDecline: 'Not now',
        };
        return translations[key] || key;
    };

    const defaultProps = {
        merchantName: 'Jumbo',
        scanCount: 3,
        onAccept: vi.fn().mockResolvedValue(undefined),
        onDecline: vi.fn().mockResolvedValue(undefined),
        theme: 'light' as const,
        t: mockT,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering (AC #3)', () => {
        it('should render the trust prompt dialog', () => {
            render(<TrustMerchantPrompt {...defaultProps} />);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('should display the merchant name in the title', () => {
            render(<TrustMerchantPrompt {...defaultProps} />);

            expect(screen.getByText('Trust Jumbo?')).toBeInTheDocument();
        });

        it('should display the scan count in the message', () => {
            render(<TrustMerchantPrompt {...defaultProps} />);

            expect(screen.getByText(/You've scanned 3 receipts from Jumbo without editing/)).toBeInTheDocument();
        });

        it('should display accept and decline buttons', () => {
            render(<TrustMerchantPrompt {...defaultProps} />);

            expect(screen.getByRole('button', { name: 'Yes, trust' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Not now' })).toBeInTheDocument();
        });
    });

    describe('Localization (AC #3 - EN/ES)', () => {
        it('should render with Spanish translations', () => {
            const spanishT = (key: string) => {
                const translations: Record<string, string> = {
                    trustMerchantTitle: '¿Confiar en {merchant}?',
                    trustMerchantMessage: 'Has escaneado {count} boletas de {merchant} sin editar. Las próximas boletas se guardarán automáticamente.',
                    trustMerchantConfirm: 'Sí, confiar',
                    trustMerchantDecline: 'No ahora',
                };
                return translations[key] || key;
            };

            render(<TrustMerchantPrompt {...defaultProps} t={spanishT} />);

            expect(screen.getByText('¿Confiar en Jumbo?')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Sí, confiar' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'No ahora' })).toBeInTheDocument();
        });
    });

    describe('User Interactions (AC #4)', () => {
        it('should call onAccept when accept button is clicked', async () => {
            render(<TrustMerchantPrompt {...defaultProps} />);

            const acceptButton = screen.getByRole('button', { name: 'Yes, trust' });
            fireEvent.click(acceptButton);

            await waitFor(() => {
                expect(defaultProps.onAccept).toHaveBeenCalledTimes(1);
            });
        });

        it('should call onDecline when decline button is clicked', async () => {
            render(<TrustMerchantPrompt {...defaultProps} />);

            const declineButton = screen.getByRole('button', { name: 'Not now' });
            fireEvent.click(declineButton);

            await waitFor(() => {
                expect(defaultProps.onDecline).toHaveBeenCalledTimes(1);
            });
        });

        it('should disable buttons while processing', async () => {
            // Story 14.30.8: Use controlled promise instead of setTimeout to avoid CI delay
            let resolveAccept: () => void;
            const slowAccept = vi.fn().mockImplementation(() => new Promise<void>(resolve => { resolveAccept = resolve; }));

            render(<TrustMerchantPrompt {...defaultProps} onAccept={slowAccept} />);

            const acceptButton = screen.getByRole('button', { name: 'Yes, trust' });
            fireEvent.click(acceptButton);

            // During processing, button should be disabled
            expect(acceptButton).toBeDisabled();
            expect(slowAccept).toHaveBeenCalled();

            // Cleanup: resolve the pending promise
            await act(async () => { resolveAccept(); });
        });

        it('should prevent multiple clicks while processing', async () => {
            // Story 14.30.8: Use controlled promise instead of setTimeout to avoid CI delay
            let resolveAccept: () => void;
            const slowAccept = vi.fn().mockImplementation(() => new Promise<void>(resolve => { resolveAccept = resolve; }));

            render(<TrustMerchantPrompt {...defaultProps} onAccept={slowAccept} />);

            const acceptButton = screen.getByRole('button', { name: 'Yes, trust' });

            // Click multiple times rapidly
            fireEvent.click(acceptButton);
            fireEvent.click(acceptButton);
            fireEvent.click(acceptButton);

            // Should only be called once (subsequent clicks blocked by disabled state)
            expect(slowAccept).toHaveBeenCalledTimes(1);

            // Cleanup: resolve the pending promise
            await act(async () => { resolveAccept(); });
        });
    });

    describe('Theme Support', () => {
        it('should render with light theme prop', () => {
            render(<TrustMerchantPrompt {...defaultProps} theme="light" />);

            const dialog = screen.getByRole('dialog');
            // Component uses CSS variables for theming, not Tailwind classes
            // Just verify it renders without errors
            expect(dialog).toBeInTheDocument();
        });

        it('should render with dark theme prop', () => {
            render(<TrustMerchantPrompt {...defaultProps} theme="dark" />);

            const dialog = screen.getByRole('dialog');
            // Component uses CSS variables for theming, not Tailwind classes
            expect(dialog).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have correct ARIA attributes', () => {
            render(<TrustMerchantPrompt {...defaultProps} />);

            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-modal', 'true');
            expect(dialog).toHaveAttribute('aria-labelledby', 'trust-merchant-title');
            expect(dialog).toHaveAttribute('aria-describedby', 'trust-merchant-message');
        });

        it('should have accessible button labels', () => {
            render(<TrustMerchantPrompt {...defaultProps} />);

            const acceptButton = screen.getByRole('button', { name: 'Yes, trust' });
            const declineButton = screen.getByRole('button', { name: 'Not now' });

            expect(acceptButton).toHaveAccessibleName();
            expect(declineButton).toHaveAccessibleName();
        });
    });

    describe('Edge Cases', () => {
        it('should handle different scan counts', () => {
            render(<TrustMerchantPrompt {...defaultProps} scanCount={10} />);

            expect(screen.getByText(/You've scanned 10 receipts/)).toBeInTheDocument();
        });

        it('should handle long merchant names', () => {
            render(
                <TrustMerchantPrompt
                    {...defaultProps}
                    merchantName="Supermercado Jumbo Express Mall Plaza Oeste"
                />
            );

            expect(screen.getByText(/Trust Supermercado Jumbo Express Mall Plaza Oeste\?/)).toBeInTheDocument();
        });

        it('should handle special characters in merchant name', () => {
            render(<TrustMerchantPrompt {...defaultProps} merchantName="Café & Co." />);

            expect(screen.getByText(/Trust Café & Co\.\?/)).toBeInTheDocument();
        });
    });
});
