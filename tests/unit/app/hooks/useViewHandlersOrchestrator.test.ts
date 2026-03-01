/**
 * Unit tests for useViewHandlersOrchestrator
 *
 * Story TD-15b-35: Orchestrator Cleanup
 *
 * Verifies return shape after dead state removal (wiping/exporting).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useViewHandlersOrchestrator } from '../../../../src/app/hooks/useViewHandlersOrchestrator';
import type { UserPreferences } from '../../../../src/types/preferences';

// Mock shared stores
vi.mock('../../../../src/shared/stores', () => ({
    useSettingsStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
        selector({ theme: 'light', colorTheme: 'default', fontSize: 16 }),
    ),
    useLang: vi.fn(() => 'es'),
    useCurrency: vi.fn(() => 'CLP'),
    useDateFormat: vi.fn(() => 'DD/MM/YYYY'),
    useCurrentView: vi.fn(() => 'home'),
    useSettingsSubview: vi.fn(() => null),
    usePendingHistoryFilters: vi.fn(() => null),
    usePendingDistributionView: vi.fn(() => null),
    useAnalyticsInitialState: vi.fn(() => null),
    useNavigationActions: vi.fn(() => ({
        setView: vi.fn(),
        setSettingsSubview: vi.fn(),
        saveScrollPosition: vi.fn(),
        setPendingHistoryFilters: vi.fn(),
        setPendingDistributionView: vi.fn(),
        setAnalyticsInitialState: vi.fn(),
        clearAnalyticsInitialState: vi.fn(),
    })),
    useCurrentInsight: vi.fn(() => null),
    useShowInsightCard: vi.fn(() => false),
    useShowSessionComplete: vi.fn(() => false),
    useSessionContext: vi.fn(() => null),
    useShowBatchSummary: vi.fn(() => false),
    useInsightActions: vi.fn(() => ({
        showInsight: vi.fn(),
        hideInsight: vi.fn(),
        showSessionCompleteOverlay: vi.fn(),
        hideSessionCompleteOverlay: vi.fn(),
        showBatchSummaryOverlay: vi.fn(),
        hideBatchSummaryOverlay: vi.fn(),
    })),
}));

// Mock transaction editor store
vi.mock('../../../../src/features/transaction-editor', () => ({
    useCurrentTransaction: vi.fn(() => null),
    useNavigationList: vi.fn(() => null),
    useIsReadOnly: vi.fn(() => false),
    useCreditUsedInSession: vi.fn(() => false),
    useIsSaving: vi.fn(() => false),
    useAnimateItems: vi.fn(() => false),
    useEditorMode: vi.fn(() => 'new'),
    useTransactionEditorActions: vi.fn(() => ({
        setTransaction: vi.fn(),
        setNavigationList: vi.fn(),
        setReadOnly: vi.fn(),
        setCreditUsed: vi.fn(),
        setAnimateItems: vi.fn(),
        setMode: vi.fn(),
    })),
}));

// Mock toast
vi.mock('../../../../src/shared/hooks', () => ({
    useToast: vi.fn(() => ({
        toastMessage: null,
        showToast: vi.fn(),
        dismissToast: vi.fn(),
    })),
}));

// Mock modal actions
vi.mock('../../../../src/managers/ModalManager', () => ({
    useModalActions: vi.fn(() => ({
        openModal: vi.fn(),
        closeModal: vi.fn(),
    })),
}));

// Mock utilities
vi.mock('../../../../src/utils/currency', () => ({
    DEFAULT_CURRENCY: 'CLP',
}));

vi.mock('../../../../src/utils/validation', () => ({
    getSafeDate: vi.fn(() => '2026-01-01'),
}));

vi.mock('../../../../src/utils/translations', () => ({
    TRANSLATIONS: {
        es: {},
        en: {},
    },
}));

const mockPreferences: UserPreferences = {
    fontFamily: 'outfit',
    defaultCountry: 'Chile',
    defaultCity: 'Santiago',
    defaultCurrency: 'CLP',
} as UserPreferences;

describe('useViewHandlersOrchestrator', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('returns all expected keys', () => {
        const { result } = renderHook(() =>
            useViewHandlersOrchestrator(mockPreferences),
        );

        const expectedKeys = [
            // Navigation
            'view', 'settingsSubview', 'pendingHistoryFilters',
            'pendingDistributionView', 'analyticsInitialState',
            'setView', 'setSettingsSubview', 'saveScrollPosition',
            'setPendingHistoryFilters', 'setPendingDistributionView',
            'setAnalyticsInitialState', 'clearAnalyticsInitialState',
            // Transaction editor
            'currentTransaction', 'transactionNavigationList',
            'isViewingReadOnly', 'creditUsedInSession',
            'isTransactionSaving', 'animateEditViewItems', 'transactionEditorMode',
            'setCurrentTransaction', 'setTransactionNavigationList',
            'setIsViewingReadOnly', 'setCreditUsedInSession',
            'setAnimateEditViewItems', 'setTransactionEditorMode',
            // Insight UI
            'currentInsight', 'showInsightCard', 'showSessionComplete',
            'sessionContext', 'showBatchSummary',
            'storeShowInsight', 'hideInsight',
            'showSessionCompleteOverlay', 'hideSessionCompleteOverlay',
            'showBatchSummaryOverlay', 'hideBatchSummaryOverlay',
            'setCurrentInsight', 'setShowInsightCard',
            'setShowBatchSummary', 'setSessionContext',
            // Batch UI
            'showBatchPreview', 'setShowBatchPreview',
            'isQuickSaving', 'setIsQuickSaving',
            // Refs
            'trustActionsRef', 'creditActionsRef',
            // Settings
            'lang', 'currency', 'dateFormat', 'theme', 'colorTheme',
            'fontSize', 'fontFamily', 'defaultCountry', 'defaultCity',
            // Toast
            'toastMessage', 'showToast', 'dismissToast', 'setToastMessage',
            // File input
            'fileInputRef', 'setFileInputRef', 'handleFileInputReady',
            // Translation + modal + factory
            't', 'openModalAction', 'closeModalAction', 'createDefaultTransaction',
        ];

        for (const key of expectedKeys) {
            expect(result.current).toHaveProperty(key);
        }
    });

    it('does NOT return wiping or exporting (dead state removed)', () => {
        const { result } = renderHook(() =>
            useViewHandlersOrchestrator(mockPreferences),
        );

        expect(result.current).not.toHaveProperty('wiping');
        expect(result.current).not.toHaveProperty('exporting');
    });

    it('provides createDefaultTransaction with user preferences', () => {
        const { result } = renderHook(() =>
            useViewHandlersOrchestrator(mockPreferences),
        );

        const tx = result.current.createDefaultTransaction();
        expect(tx.country).toBe('Chile');
        expect(tx.city).toBe('Santiago');
        expect(tx.currency).toBe('CLP');
    });
});
