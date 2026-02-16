import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TrustedMerchantsList } from '@features/settings/components/TrustedMerchantsList';
import { TrustedMerchant } from '@/types/trust';
import { createMockTimestamp } from '../../../../helpers';

describe('TrustedMerchantsList', () => {
    const mockT = (key: string) => {
        const translations: Record<string, string> = {
            trustedMerchants: 'trustedMerchants',
            trustedMerchantsEmpty: 'No trusted merchants yet',
            trustedMerchantsHint: 'Merchants you trust will auto-save on scan',
            scansFromMerchant: '{count} scans',
            removeTrust: 'Remove Trust',
            removeTrustConfirm: 'Stop auto-saving for this merchant?',
            confirm: 'Confirm',
            cancel: 'Cancel',
            loading: 'Loading...',
            trusted: 'Trusted',
        };
        return translations[key] || key;
    };

    const createMerchant = (overrides: Partial<TrustedMerchant> = {}): TrustedMerchant => ({
        id: 'jumbo',
        merchantName: 'Jumbo',
        normalizedName: 'jumbo',
        scanCount: 5,
        editCount: 0,
        editRate: 0,
        trusted: true,
        trustedAt: createMockTimestamp(),
        lastScanAt: createMockTimestamp(),
        createdAt: createMockTimestamp(),
        updatedAt: createMockTimestamp(),
        ...overrides,
    });

    const defaultProps = {
        merchants: [createMerchant()],
        loading: false,
        onRevokeTrust: vi.fn().mockResolvedValue(undefined),
        t: mockT,
        theme: 'light' as const,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering (AC #6)', () => {
        it('should render list of trusted merchants', () => {
            render(<TrustedMerchantsList {...defaultProps} />);
            expect(screen.getByText('"Jumbo"')).toBeInTheDocument();
            expect(screen.getByText('5x')).toBeInTheDocument();
        });

        it('should render multiple trusted merchants', () => {
            const merchants = [
                createMerchant({ id: 'jumbo', merchantName: 'Jumbo' }),
                createMerchant({ id: 'lider', merchantName: 'Lider', scanCount: 10 }),
            ];
            render(<TrustedMerchantsList {...defaultProps} merchants={merchants} />);
            expect(screen.getByText('"Jumbo"')).toBeInTheDocument();
            expect(screen.getByText('"Lider"')).toBeInTheDocument();
            expect(screen.getByText('5x')).toBeInTheDocument();
            expect(screen.getByText('10x')).toBeInTheDocument();
        });

        it('should only show trusted merchants (trusted=true)', () => {
            const merchants = [
                createMerchant({ id: 'jumbo', merchantName: 'Jumbo', trusted: true }),
                createMerchant({ id: 'lider', merchantName: 'Lider', trusted: false }),
            ];
            render(<TrustedMerchantsList {...defaultProps} merchants={merchants} />);
            expect(screen.getByText('"Jumbo"')).toBeInTheDocument();
            expect(screen.queryByText('"Lider"')).not.toBeInTheDocument();
        });
    });

    describe('Empty State', () => {
        it('should show empty state when no trusted merchants', () => {
            render(<TrustedMerchantsList {...defaultProps} merchants={[]} />);
            expect(screen.getByText('No trusted merchants yet')).toBeInTheDocument();
            expect(screen.getByText('Merchants you trust will auto-save on scan')).toBeInTheDocument();
        });

        it('should show empty state when all merchants are not trusted', () => {
            const merchants = [createMerchant({ id: 'jumbo', trusted: false })];
            render(<TrustedMerchantsList {...defaultProps} merchants={merchants} />);
            expect(screen.getByText('No trusted merchants yet')).toBeInTheDocument();
        });
    });

    describe('Loading State', () => {
        it('should show loading indicator when loading', () => {
            const { container } = render(<TrustedMerchantsList {...defaultProps} loading={true} />);
            expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
        });
    });

    describe('Revoke Trust (AC #7)', () => {
        it('should show revoke button for each merchant', () => {
            render(<TrustedMerchantsList {...defaultProps} />);
            const revokeButton = screen.getByRole('button', { name: 'Remove Trust' });
            expect(revokeButton).toBeInTheDocument();
        });

        it('should show confirmation dialog when revoke button is clicked', () => {
            render(<TrustedMerchantsList {...defaultProps} />);

            const revokeButton = screen.getByRole('button', { name: 'Remove Trust' });
            fireEvent.click(revokeButton);

            // ConfirmationDialog should appear
            expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
            expect(defaultProps.onRevokeTrust).not.toHaveBeenCalled();
        });

        it('should call onRevokeTrust when confirmed via dialog', async () => {
            render(<TrustedMerchantsList {...defaultProps} />);

            // Click revoke to show dialog
            fireEvent.click(screen.getByRole('button', { name: 'Remove Trust' }));

            // Click confirm in dialog
            fireEvent.click(screen.getByTestId('confirm-button'));

            await waitFor(() => {
                expect(defaultProps.onRevokeTrust).toHaveBeenCalledWith('Jumbo');
            });
        });

        it('should not call onRevokeTrust when cancelled via dialog', () => {
            render(<TrustedMerchantsList {...defaultProps} />);

            // Click revoke to show dialog
            fireEvent.click(screen.getByRole('button', { name: 'Remove Trust' }));

            // Click cancel in dialog
            fireEvent.click(screen.getByTestId('cancel-button'));

            expect(defaultProps.onRevokeTrust).not.toHaveBeenCalled();
            // Dialog should be closed
            expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument();
        });
    });

    describe('Theme Support', () => {
        it('should apply light theme styling', () => {
            render(<TrustedMerchantsList {...defaultProps} theme="light" />);
            expect(screen.getByText('"Jumbo"')).toBeInTheDocument();
        });

        it('should apply dark theme styling', () => {
            render(<TrustedMerchantsList {...defaultProps} theme="dark" />);
            expect(screen.getByText('"Jumbo"')).toBeInTheDocument();
        });
    });
});
