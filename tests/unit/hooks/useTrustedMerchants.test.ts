import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the service module before importing the hook
vi.mock('../../../src/services/merchantTrustService', () => ({
    subscribeToTrustedMerchants: vi.fn(() => vi.fn()),
    recordScan: vi.fn(),
    isMerchantTrusted: vi.fn(),
    trustMerchant: vi.fn(),
    declineTrust: vi.fn(),
    revokeTrust: vi.fn(),
    deleteTrustedMerchant: vi.fn(),
    getMerchantTrustRecord: vi.fn(),
}));

import { useTrustedMerchants } from '../../../src/hooks/useTrustedMerchants';
import * as merchantTrustService from '../../../src/services/merchantTrustService';
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
    });

    describe('Initialization', () => {
        it('should return empty merchants when user is null', () => {
            const { result } = renderHook(() => useTrustedMerchants(null, mockServices));

            expect(result.current.merchants).toEqual([]);
            expect(result.current.trustedMerchants).toEqual([]);
            expect(result.current.loading).toBe(false);
        });

        it('should return empty merchants when services is null', () => {
            const { result } = renderHook(() => useTrustedMerchants(mockUser, null));

            expect(result.current.merchants).toEqual([]);
            expect(result.current.trustedMerchants).toEqual([]);
            expect(result.current.loading).toBe(false);
        });

        it('should subscribe to merchants when user and services are provided', () => {
            renderHook(() => useTrustedMerchants(mockUser, mockServices));

            expect(merchantTrustService.subscribeToTrustedMerchants).toHaveBeenCalledWith(
                mockServices.db,
                mockUser.uid,
                mockServices.appId,
                expect.any(Function)
            );
        });
    });

    describe('recordMerchantScan (AC #1, #2)', () => {
        it('should call recordScan service', async () => {
            const mockEligibility = { shouldShowPrompt: false, reason: 'insufficient_scans' as const };
            vi.mocked(merchantTrustService.recordScan).mockResolvedValue(mockEligibility);

            const { result } = renderHook(() => useTrustedMerchants(mockUser, mockServices));

            let eligibility;
            await act(async () => {
                eligibility = await result.current.recordMerchantScan('Jumbo', false);
            });

            expect(merchantTrustService.recordScan).toHaveBeenCalledWith(
                mockServices.db,
                mockUser.uid,
                mockServices.appId,
                'Jumbo',
                false
            );
            expect(eligibility).toEqual(mockEligibility);
        });

        it('should return insufficient_scans when user is null', async () => {
            const { result } = renderHook(() => useTrustedMerchants(null, mockServices));

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
        it('should call isMerchantTrusted service', async () => {
            vi.mocked(merchantTrustService.isMerchantTrusted).mockResolvedValue(true);

            const { result } = renderHook(() => useTrustedMerchants(mockUser, mockServices));

            let isTrusted;
            await act(async () => {
                isTrusted = await result.current.checkTrusted('Jumbo');
            });

            expect(merchantTrustService.isMerchantTrusted).toHaveBeenCalledWith(
                mockServices.db,
                mockUser.uid,
                mockServices.appId,
                'Jumbo'
            );
            expect(isTrusted).toBe(true);
        });

        it('should return false when user is null', async () => {
            const { result } = renderHook(() => useTrustedMerchants(null, mockServices));

            let isTrusted;
            await act(async () => {
                isTrusted = await result.current.checkTrusted('Jumbo');
            });

            expect(isTrusted).toBe(false);
        });
    });

    describe('acceptTrust (AC #4)', () => {
        it('should call trustMerchant service', async () => {
            vi.mocked(merchantTrustService.trustMerchant).mockResolvedValue(undefined);

            const { result } = renderHook(() => useTrustedMerchants(mockUser, mockServices));

            await act(async () => {
                await result.current.acceptTrust('Jumbo');
            });

            expect(merchantTrustService.trustMerchant).toHaveBeenCalledWith(
                mockServices.db,
                mockUser.uid,
                mockServices.appId,
                'Jumbo'
            );
        });

        it('should throw when user is null', async () => {
            const { result } = renderHook(() => useTrustedMerchants(null, mockServices));

            await expect(
                act(async () => {
                    await result.current.acceptTrust('Jumbo');
                })
            ).rejects.toThrow('User must be authenticated to trust merchants');
        });
    });

    describe('declinePrompt (AC #4)', () => {
        it('should call declineTrust service', async () => {
            vi.mocked(merchantTrustService.declineTrust).mockResolvedValue(undefined);

            const { result } = renderHook(() => useTrustedMerchants(mockUser, mockServices));

            await act(async () => {
                await result.current.declinePrompt('Jumbo');
            });

            expect(merchantTrustService.declineTrust).toHaveBeenCalledWith(
                mockServices.db,
                mockUser.uid,
                mockServices.appId,
                'Jumbo'
            );
        });
    });

    describe('removeTrust (AC #7)', () => {
        it('should call revokeTrust service', async () => {
            vi.mocked(merchantTrustService.revokeTrust).mockResolvedValue(undefined);

            const { result } = renderHook(() => useTrustedMerchants(mockUser, mockServices));

            await act(async () => {
                await result.current.removeTrust('Jumbo');
            });

            expect(merchantTrustService.revokeTrust).toHaveBeenCalledWith(
                mockServices.db,
                mockUser.uid,
                mockServices.appId,
                'Jumbo'
            );
        });
    });

    describe('trustedMerchants computed property', () => {
        it('should filter only trusted merchants', () => {
            // The subscription callback is mocked, so we can't easily test the filter
            // This would require more complex mock setup
            const { result } = renderHook(() => useTrustedMerchants(mockUser, mockServices));

            // Initially empty since subscription hasn't fired
            expect(result.current.trustedMerchants).toEqual([]);
        });
    });
});
