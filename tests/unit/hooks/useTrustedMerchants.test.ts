/**
 * useTrustedMerchants Hook Tests
 *
 * Story 14.29: Updated to use renderHookWithClient for React Query support
 * Story 15-TD-9: Updated to mock repository pattern (useTrustRepository)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { renderHookWithClient } from '../../setup/test-utils';
import type { ITrustRepository } from '../../../src/repositories';

// Mock the repository hook
const mockTrustRepo: ITrustRepository = {
    recordScan: vi.fn(),
    isTrusted: vi.fn(),
    trust: vi.fn(),
    declineTrust: vi.fn(),
    revokeTrust: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(),
    getOnlyTrusted: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    getRecord: vi.fn(),
};

vi.mock('../../../src/repositories', () => ({
    useTrustRepository: vi.fn(() => mockTrustRepo),
}));

import { useTrustedMerchants } from '../../../src/hooks/useTrustedMerchants';
import { useTrustRepository } from '../../../src/repositories';
import type { Services } from '../../../src/hooks/useAuth';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

describe('useTrustedMerchants', () => {
    const mockUser = { uid: 'test-user-123' } as User;
    const mockServices = {
        db: {} as Firestore,
        appId: 'test-app-id',
    } as Services;

    beforeEach(() => {
        vi.clearAllMocks();
        // Default: repository is available (authenticated)
        vi.mocked(useTrustRepository).mockReturnValue(mockTrustRepo);
    });

    describe('Initialization', () => {
        it('should return empty merchants when user is null', () => {
            const { result } = renderHookWithClient(() => useTrustedMerchants(null, mockServices));

            expect(result.current.merchants).toEqual([]);
            expect(result.current.trustedMerchants).toEqual([]);
            expect(result.current.loading).toBe(false);
        });

        it('should return empty merchants when services is null', () => {
            const { result } = renderHookWithClient(() => useTrustedMerchants(mockUser, null));

            expect(result.current.merchants).toEqual([]);
            expect(result.current.trustedMerchants).toEqual([]);
            expect(result.current.loading).toBe(false);
        });

        it('should return empty merchants when repository is null (not auth)', () => {
            vi.mocked(useTrustRepository).mockReturnValue(null);
            const { result } = renderHookWithClient(() => useTrustedMerchants(mockUser, mockServices));

            expect(result.current.merchants).toEqual([]);
            expect(result.current.loading).toBe(false);
        });

        it('should subscribe via repository when all dependencies are available', () => {
            renderHookWithClient(() => useTrustedMerchants(mockUser, mockServices));

            expect(mockTrustRepo.subscribe).toHaveBeenCalledWith(expect.any(Function));
        });
    });

    describe('recordMerchantScan (AC #1, #2)', () => {
        it('should call repository recordScan', async () => {
            const mockEligibility = { shouldShowPrompt: false, reason: 'insufficient_scans' as const };
            vi.mocked(mockTrustRepo.recordScan).mockResolvedValue(mockEligibility);

            const { result } = renderHookWithClient(() => useTrustedMerchants(mockUser, mockServices));

            let eligibility;
            await act(async () => {
                eligibility = await result.current.recordMerchantScan('Jumbo', false);
            });

            expect(mockTrustRepo.recordScan).toHaveBeenCalledWith('Jumbo', false);
            expect(eligibility).toEqual(mockEligibility);
        });

        it('should return insufficient_scans when repository is null', async () => {
            vi.mocked(useTrustRepository).mockReturnValue(null);
            const { result } = renderHookWithClient(() => useTrustedMerchants(null, mockServices));

            let eligibility;
            await act(async () => {
                eligibility = await result.current.recordMerchantScan('Jumbo', false);
            });

            expect(eligibility).toEqual({
                shouldShowPrompt: false,
                reason: 'insufficient_scans',
            });
        });
    });

    describe('checkTrusted (AC #5)', () => {
        it('should call repository isTrusted', async () => {
            vi.mocked(mockTrustRepo.isTrusted).mockResolvedValue(true);

            const { result } = renderHookWithClient(() => useTrustedMerchants(mockUser, mockServices));

            let isTrusted;
            await act(async () => {
                isTrusted = await result.current.checkTrusted('Jumbo');
            });

            expect(mockTrustRepo.isTrusted).toHaveBeenCalledWith('Jumbo');
            expect(isTrusted).toBe(true);
        });

        it('should return false when repository is null', async () => {
            vi.mocked(useTrustRepository).mockReturnValue(null);
            const { result } = renderHookWithClient(() => useTrustedMerchants(null, mockServices));

            let isTrusted;
            await act(async () => {
                isTrusted = await result.current.checkTrusted('Jumbo');
            });

            expect(isTrusted).toBe(false);
        });
    });

    describe('acceptTrust (AC #4)', () => {
        it('should call repository trust', async () => {
            vi.mocked(mockTrustRepo.trust).mockResolvedValue(undefined);

            const { result } = renderHookWithClient(() => useTrustedMerchants(mockUser, mockServices));

            await act(async () => {
                await result.current.acceptTrust('Jumbo');
            });

            expect(mockTrustRepo.trust).toHaveBeenCalledWith('Jumbo');
        });

        it('should throw when repository is null', async () => {
            vi.mocked(useTrustRepository).mockReturnValue(null);
            const { result } = renderHookWithClient(() => useTrustedMerchants(null, mockServices));

            await expect(
                act(async () => {
                    await result.current.acceptTrust('Jumbo');
                })
            ).rejects.toThrow('User must be authenticated to trust merchants');
        });
    });

    describe('declinePrompt (AC #4)', () => {
        it('should call repository declineTrust', async () => {
            vi.mocked(mockTrustRepo.declineTrust).mockResolvedValue(undefined);

            const { result } = renderHookWithClient(() => useTrustedMerchants(mockUser, mockServices));

            await act(async () => {
                await result.current.declinePrompt('Jumbo');
            });

            expect(mockTrustRepo.declineTrust).toHaveBeenCalledWith('Jumbo');
        });
    });

    describe('removeTrust (AC #7)', () => {
        it('should call repository revokeTrust', async () => {
            vi.mocked(mockTrustRepo.revokeTrust).mockResolvedValue(undefined);

            const { result } = renderHookWithClient(() => useTrustedMerchants(mockUser, mockServices));

            await act(async () => {
                await result.current.removeTrust('Jumbo');
            });

            expect(mockTrustRepo.revokeTrust).toHaveBeenCalledWith('Jumbo');
        });
    });

    describe('trustedMerchants computed property', () => {
        it('should filter only trusted merchants', () => {
            const { result } = renderHookWithClient(() => useTrustedMerchants(mockUser, mockServices));

            // Initially empty since subscription hasn't fired
            expect(result.current.trustedMerchants).toEqual([]);
        });
    });
});
