import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
            const slowAccept = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

            render(<TrustMerchantPrompt {...defaultProps} onAccept={slowAccept} />);

            const acceptButton = screen.getByRole('button', { name: 'Yes, trust' });
            fireEvent.click(acceptButton);

            // During processing, button should be disabled
            expect(acceptButton).toBeDisabled();

            await waitFor(() => {
                expect(slowAccept).toHaveBeenCalled();
            });
        });

        it('should prevent multiple clicks while processing', async () => {
            const slowAccept = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 50)));

            render(<TrustMerchantPrompt {...defaultProps} onAccept={slowAccept} />);

            const acceptButton = screen.getByRole('button', { name: 'Yes, trust' });

            // Click multiple times rapidly
            fireEvent.click(acceptButton);
            fireEvent.click(acceptButton);
            fireEvent.click(acceptButton);

            await waitFor(() => {
                // Should only be called once
                expect(slowAccept).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('Theme Support', () => {
        it('should apply light theme styling', () => {
            render(<TrustMerchantPrompt {...defaultProps} theme="light" />);

            const dialog = screen.getByRole('dialog');
            expect(dialog.querySelector('.bg-white')).toBeInTheDocument();
        });

        it('should apply dark theme styling', () => {
            render(<TrustMerchantPrompt {...defaultProps} theme="dark" />);

            const dialog = screen.getByRole('dialog');
            expect(dialog.querySelector('.bg-slate-800')).toBeInTheDocument();
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
