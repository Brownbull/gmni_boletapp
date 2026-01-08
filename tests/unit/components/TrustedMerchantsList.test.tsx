import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TrustedMerchantsList } from '../../../src/components/TrustedMerchantsList';
import { TrustedMerchant } from '../../../src/types/trust';
import { Timestamp } from 'firebase/firestore';

// Mock Timestamp
function createMockTimestamp(): Timestamp {
    const date = new Date();
    return {
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
        toMillis: () => date.getTime(),
        isEqual: () => false,
        valueOf: () => '',
        toJSON: () => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 }),
    } as unknown as Timestamp;
}

describe('TrustedMerchantsList', () => {
    const mockT = (key: string) => {
        const translations: Record<string, string> = {
            trustedMerchants: 'trustedMerchants',
            trustedMerchantsEmpty: 'No trusted merchants yet',
            trustedMerchantsHint: 'Merchants you trust will auto-save on scan',
            scansFromMerchant: '{count} scans',
            removeTrust: 'Remove Trust',
            removeTrustConfirm: 'Stop auto-saving for this merchant?',
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
        // Mock window.confirm - assign directly since window.confirm may not exist in jsdom
        window.confirm = vi.fn().mockReturnValue(true);
    });

    describe('Rendering (AC #6)', () => {
        it('should render list of trusted merchants', () => {
            render(<TrustedMerchantsList {...defaultProps} />);

            // Component displays merchant name in quotes
            expect(screen.getByText('"Jumbo"')).toBeInTheDocument();
            // Component displays scan count as "Nx" format
            expect(screen.getByText('5x')).toBeInTheDocument();
        });

        it('should render multiple trusted merchants', () => {
            const merchants = [
                createMerchant({ id: 'jumbo', merchantName: 'Jumbo' }),
                createMerchant({ id: 'lider', merchantName: 'Lider', scanCount: 10 }),
            ];

            render(<TrustedMerchantsList {...defaultProps} merchants={merchants} />);

            // Component displays merchant names in quotes
            expect(screen.getByText('"Jumbo"')).toBeInTheDocument();
            expect(screen.getByText('"Lider"')).toBeInTheDocument();
            // Component displays scan count as "Nx" format
            expect(screen.getByText('5x')).toBeInTheDocument();
            expect(screen.getByText('10x')).toBeInTheDocument();
        });

        it('should only show trusted merchants (trusted=true)', () => {
            const merchants = [
                createMerchant({ id: 'jumbo', merchantName: 'Jumbo', trusted: true }),
                createMerchant({ id: 'lider', merchantName: 'Lider', trusted: false }),
            ];

            render(<TrustedMerchantsList {...defaultProps} merchants={merchants} />);

            // Component displays merchant name in quotes
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
            const merchants = [
                createMerchant({ id: 'jumbo', trusted: false }),
            ];

            render(<TrustedMerchantsList {...defaultProps} merchants={merchants} />);

            expect(screen.getByText('No trusted merchants yet')).toBeInTheDocument();
        });
    });

    describe('Loading State', () => {
        it('should show loading indicator when loading', () => {
            const { container } = render(<TrustedMerchantsList {...defaultProps} loading={true} />);

            // Component shows animate-pulse skeleton, not text
            expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
        });
    });

    describe('Revoke Trust (AC #7)', () => {
        it('should show revoke button for each merchant', () => {
            render(<TrustedMerchantsList {...defaultProps} />);

            const revokeButton = screen.getByRole('button', { name: 'Remove Trust' });
            expect(revokeButton).toBeInTheDocument();
        });

        it('should show confirmation dialog when revoking', async () => {
            window.confirm = vi.fn().mockReturnValue(false);
            render(<TrustedMerchantsList {...defaultProps} />);

            const revokeButton = screen.getByRole('button', { name: 'Remove Trust' });
            fireEvent.click(revokeButton);

            expect(window.confirm).toHaveBeenCalledWith('Stop auto-saving for this merchant?');
            expect(defaultProps.onRevokeTrust).not.toHaveBeenCalled();
        });

        it('should call onRevokeTrust when confirmed', async () => {
            window.confirm = vi.fn().mockReturnValue(true);
            render(<TrustedMerchantsList {...defaultProps} />);

            const revokeButton = screen.getByRole('button', { name: 'Remove Trust' });
            fireEvent.click(revokeButton);

            await waitFor(() => {
                expect(defaultProps.onRevokeTrust).toHaveBeenCalledWith('Jumbo');
            });
        });

        it('should not call onRevokeTrust when cancelled', async () => {
            window.confirm = vi.fn().mockReturnValue(false);
            render(<TrustedMerchantsList {...defaultProps} />);

            const revokeButton = screen.getByRole('button', { name: 'Remove Trust' });
            fireEvent.click(revokeButton);

            expect(defaultProps.onRevokeTrust).not.toHaveBeenCalled();
        });
    });

    describe('Theme Support', () => {
        it('should apply light theme styling', () => {
            render(<TrustedMerchantsList {...defaultProps} theme="light" />);

            // Component displays merchant name in quotes
            expect(screen.getByText('"Jumbo"')).toBeInTheDocument();
        });

        it('should apply dark theme styling', () => {
            render(<TrustedMerchantsList {...defaultProps} theme="dark" />);

            // Component displays merchant name in quotes
            expect(screen.getByText('"Jumbo"')).toBeInTheDocument();
        });
    });
});
