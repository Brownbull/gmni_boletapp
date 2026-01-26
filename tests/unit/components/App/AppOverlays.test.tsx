/**
 * Story 14c-refactor.22d: AppOverlays Unit Tests
 *
 * Tests for the AppOverlays component that centralizes all overlay/modal rendering.
 * Verifies conditional rendering logic for 15 overlay components across z-index layers.
 *
 * Test categories:
 * - Always-rendered overlays (NavigationBlocker, PWAUpdatePrompt, ScanOverlay, etc.)
 * - Conditional visibility overlays (InsightCard, SessionComplete, etc.)
 * - Props passing to child components
 * - React.memo behavior
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppOverlays, type AppOverlaysProps } from '../../../../src/components/App/AppOverlays';
import { DIALOG_TYPES } from '../../../../src/types/scanStateMachine';

// =============================================================================
// Mock all overlay components to isolate AppOverlays logic
// =============================================================================

vi.mock('../../../../src/components/NavigationBlocker', () => ({
    NavigationBlocker: ({ currentView }: { currentView: string }) => (
        <div data-testid="navigation-blocker" data-current-view={currentView}>
            NavigationBlocker
        </div>
    ),
}));

vi.mock('../../../../src/components/PWAUpdatePrompt', () => ({
    PWAUpdatePrompt: ({ language }: { language: string }) => (
        <div data-testid="pwa-update-prompt" data-language={language}>
            PWAUpdatePrompt
        </div>
    ),
}));

vi.mock('../../../../src/components/scan', () => ({
    ScanOverlay: ({ visible }: { visible: boolean }) => (
        visible ? <div data-testid="scan-overlay">ScanOverlay</div> : null
    ),
    QuickSaveCard: () => <div data-testid="quick-save-card">QuickSaveCard</div>,
    BatchCompleteModal: () => <div data-testid="batch-complete-modal">BatchCompleteModal</div>,
    CurrencyMismatchDialog: () => <div data-testid="currency-mismatch-dialog">CurrencyMismatchDialog</div>,
    TotalMismatchDialog: () => <div data-testid="total-mismatch-dialog">TotalMismatchDialog</div>,
}));

vi.mock('../../../../src/components/insights/InsightCard', () => ({
    InsightCard: ({ insight }: { insight: { id: string } }) => (
        <div data-testid="insight-card" data-insight-id={insight.id}>
            InsightCard
        </div>
    ),
}));

vi.mock('../../../../src/components/insights/BuildingProfileCard', () => ({
    BuildingProfileCard: () => <div data-testid="building-profile-card">BuildingProfileCard</div>,
}));

vi.mock('../../../../src/components/insights/BatchSummary', () => ({
    BatchSummary: () => <div data-testid="batch-summary">BatchSummary</div>,
}));

vi.mock('../../../../src/components/celebrations', () => ({
    PersonalRecordBanner: ({ record }: { record: { type: string } }) => (
        <div data-testid="personal-record-banner" data-record-type={record.type}>
            PersonalRecordBanner
        </div>
    ),
}));

vi.mock('../../../../src/components/session', () => ({
    SessionComplete: ({ context }: { context: { type: string } }) => (
        <div data-testid="session-complete" data-context-type={context.type}>
            SessionComplete
        </div>
    ),
}));

vi.mock('../../../../src/components/TrustMerchantPrompt', () => ({
    TrustMerchantPrompt: ({ merchantName }: { merchantName: string }) => (
        <div data-testid="trust-merchant-prompt" data-merchant={merchantName}>
            TrustMerchantPrompt
        </div>
    ),
}));

vi.mock('../../../../src/components/batch', () => ({
    CreditWarningDialog: ({ creditCheck }: { creditCheck: { hasEnoughCredits: boolean } }) => (
        <div data-testid="credit-warning-dialog" data-has-credits={String(creditCheck.hasEnoughCredits)}>
            CreditWarningDialog
        </div>
    ),
}));

// Story 14e-5: TransactionConflictDialog mock removed - now rendered by ModalManager, not AppOverlays

// =============================================================================
// Test Fixtures
// =============================================================================

const createMockProps = (overrides: Partial<AppOverlaysProps> = {}): AppOverlaysProps => ({
    // Core dependencies
    currentView: 'dashboard',
    lang: 'en',
    theme: 'light',
    t: (key: string) => key,

    // ScanContext state
    scanState: {
        phase: 'idle',
        mode: 'single',
        activeDialog: null,
        pendingTransaction: null,
        batchReceipts: [],
        error: null,
    },
    scanOverlay: {
        state: 'idle',
        progress: 0,
        eta: null,
        error: null,
        startProcessing: vi.fn(),
        updateProgress: vi.fn(),
        setError: vi.fn(),
        reset: vi.fn(),
    },
    isAnalyzing: false,
    scanImages: [],

    // Scan overlay handlers
    onScanOverlayCancel: vi.fn(),
    onScanOverlayRetry: vi.fn(),
    onScanOverlayDismiss: vi.fn(),

    // QuickSaveCard props
    onQuickSave: vi.fn(),
    onQuickSaveEdit: vi.fn(),
    onQuickSaveCancel: vi.fn(),
    onQuickSaveComplete: vi.fn(),
    isQuickSaving: false,
    currency: 'CLP',
    formatCurrency: (amount: number, curr: string) => `${curr} ${amount}`,
    userDefaultCountry: 'CL',
    activeGroupForQuickSave: null,

    // Insight card props
    showInsightCard: false,
    currentInsight: null,
    onInsightDismiss: vi.fn(),

    // Session complete props
    showSessionComplete: false,
    sessionContext: null,
    onSessionCompleteDismiss: vi.fn(),
    onSessionCompleteAction: vi.fn(),

    // Personal record banner props
    showRecordBanner: false,
    recordToCelebrate: null,
    onRecordDismiss: vi.fn(),

    // Credit warning dialog props
    showCreditWarning: false,
    creditCheckResult: null,
    batchImageCount: 0,
    onCreditWarningConfirm: vi.fn(),
    onCreditWarningCancel: vi.fn(),
    onReduceBatch: vi.fn(),

    // Batch summary props
    showBatchSummary: false,
    batchSession: null,
    transactions: [],
    insightCache: null,
    onBatchSummarySilence: vi.fn(),
    onBatchSummaryDismiss: vi.fn(),

    // Trust merchant prompt props
    showTrustPrompt: false,
    trustPromptData: null,
    onAcceptTrust: vi.fn(),
    onDeclineTrust: vi.fn(),

    // Currency/Total mismatch dialog props
    userCurrency: 'CLP',
    onCurrencyUseDetected: vi.fn(),
    onCurrencyUseDefault: vi.fn(),
    onCurrencyMismatchCancel: vi.fn(),
    onTotalUseItemsSum: vi.fn(),
    onTotalKeepOriginal: vi.fn(),
    onTotalMismatchCancel: vi.fn(),

    // Story 14e-5: Transaction conflict dialog props removed - now uses Modal Manager

    // Batch complete modal props
    userCreditsRemaining: 10,
    onBatchCompleteDismiss: vi.fn(),
    onBatchCompleteNavigateToHistory: vi.fn(),
    onBatchCompleteGoHome: vi.fn(),

    // Utility functions
    getLastWeekTotal: vi.fn(() => 0),
    isInsightsSilenced: vi.fn(() => false),

    ...overrides,
});

// =============================================================================
// Tests
// =============================================================================

describe('AppOverlays', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Always-rendered overlays', () => {
        it('renders NavigationBlocker with currentView prop', () => {
            const props = createMockProps({ currentView: 'scan' });
            render(<AppOverlays {...props} />);

            const blocker = screen.getByTestId('navigation-blocker');
            expect(blocker).toBeInTheDocument();
            expect(blocker).toHaveAttribute('data-current-view', 'scan');
        });

        it('renders PWAUpdatePrompt with language prop', () => {
            const props = createMockProps({ lang: 'es' });
            render(<AppOverlays {...props} />);

            const prompt = screen.getByTestId('pwa-update-prompt');
            expect(prompt).toBeInTheDocument();
            expect(prompt).toHaveAttribute('data-language', 'es');
        });

        it('renders QuickSaveCard (unconditionally - reads from ScanContext)', () => {
            const props = createMockProps();
            render(<AppOverlays {...props} />);

            expect(screen.getByTestId('quick-save-card')).toBeInTheDocument();
        });

        it('renders CurrencyMismatchDialog (unconditionally - reads from ScanContext)', () => {
            const props = createMockProps();
            render(<AppOverlays {...props} />);

            expect(screen.getByTestId('currency-mismatch-dialog')).toBeInTheDocument();
        });

        it('renders TotalMismatchDialog (unconditionally - reads from ScanContext)', () => {
            const props = createMockProps();
            render(<AppOverlays {...props} />);

            expect(screen.getByTestId('total-mismatch-dialog')).toBeInTheDocument();
        });
    });

    describe('ScanOverlay visibility', () => {
        it('shows ScanOverlay when isAnalyzing is true and on scan view', () => {
            const props = createMockProps({
                isAnalyzing: true,
                currentView: 'scan',
            });
            render(<AppOverlays {...props} />);

            expect(screen.getByTestId('scan-overlay')).toBeInTheDocument();
        });

        it('shows ScanOverlay when scanOverlay.state is error', () => {
            const props = createMockProps({
                currentView: 'scan',
                scanOverlay: {
                    state: 'error',
                    progress: 0,
                    eta: null,
                    error: 'Test error',
                    startProcessing: vi.fn(),
                    updateProgress: vi.fn(),
                    setError: vi.fn(),
                    reset: vi.fn(),
                },
            });
            render(<AppOverlays {...props} />);

            expect(screen.getByTestId('scan-overlay')).toBeInTheDocument();
        });

        it('hides ScanOverlay when not analyzing and no error on dashboard', () => {
            const props = createMockProps({
                isAnalyzing: false,
                currentView: 'dashboard',
            });
            render(<AppOverlays {...props} />);

            expect(screen.queryByTestId('scan-overlay')).not.toBeInTheDocument();
        });
    });

    describe('InsightCard visibility', () => {
        it('shows InsightCard when showInsightCard is true and insight exists', () => {
            const props = createMockProps({
                showInsightCard: true,
                currentInsight: {
                    id: 'test-insight',
                    type: 'spending_spike',
                    title: 'Test',
                    body: 'Test body',
                    priority: 1,
                    createdAt: new Date(),
                },
            });
            render(<AppOverlays {...props} />);

            const card = screen.getByTestId('insight-card');
            expect(card).toBeInTheDocument();
            expect(card).toHaveAttribute('data-insight-id', 'test-insight');
        });

        it('shows BuildingProfileCard when insight id is building_profile', () => {
            const props = createMockProps({
                showInsightCard: true,
                currentInsight: {
                    id: 'building_profile',
                    type: 'building_profile',
                    title: 'Building Profile',
                    body: 'We are learning...',
                    priority: 1,
                    createdAt: new Date(),
                },
            });
            render(<AppOverlays {...props} />);

            expect(screen.getByTestId('building-profile-card')).toBeInTheDocument();
            expect(screen.queryByTestId('insight-card')).not.toBeInTheDocument();
        });

        it('hides InsightCard when showInsightCard is false', () => {
            const props = createMockProps({
                showInsightCard: false,
                currentInsight: {
                    id: 'test-insight',
                    type: 'spending_spike',
                    title: 'Test',
                    body: 'Test body',
                    priority: 1,
                    createdAt: new Date(),
                },
            });
            render(<AppOverlays {...props} />);

            expect(screen.queryByTestId('insight-card')).not.toBeInTheDocument();
        });
    });

    describe('SessionComplete visibility', () => {
        it('shows SessionComplete when showSessionComplete is true and context exists', () => {
            const props = createMockProps({
                showSessionComplete: true,
                sessionContext: {
                    type: 'batch_complete',
                    receiptCount: 3,
                    totalAmount: 15000,
                },
            });
            render(<AppOverlays {...props} />);

            const session = screen.getByTestId('session-complete');
            expect(session).toBeInTheDocument();
            expect(session).toHaveAttribute('data-context-type', 'batch_complete');
        });

        it('hides SessionComplete when showSessionComplete is false', () => {
            const props = createMockProps({
                showSessionComplete: false,
                sessionContext: { type: 'batch_complete', receiptCount: 3, totalAmount: 15000 },
            });
            render(<AppOverlays {...props} />);

            expect(screen.queryByTestId('session-complete')).not.toBeInTheDocument();
        });
    });

    describe('PersonalRecordBanner visibility', () => {
        it('shows PersonalRecordBanner when showRecordBanner is true and record exists', () => {
            const props = createMockProps({
                showRecordBanner: true,
                recordToCelebrate: {
                    type: 'daily_savings',
                    value: 5000,
                    previousValue: 3000,
                    achievedAt: new Date(),
                },
            });
            render(<AppOverlays {...props} />);

            const banner = screen.getByTestId('personal-record-banner');
            expect(banner).toBeInTheDocument();
            expect(banner).toHaveAttribute('data-record-type', 'daily_savings');
        });

        it('hides PersonalRecordBanner when showRecordBanner is false', () => {
            const props = createMockProps({
                showRecordBanner: false,
                recordToCelebrate: { type: 'daily_savings', value: 5000, previousValue: 3000, achievedAt: new Date() },
            });
            render(<AppOverlays {...props} />);

            expect(screen.queryByTestId('personal-record-banner')).not.toBeInTheDocument();
        });
    });

    describe('CreditWarningDialog visibility', () => {
        it('shows CreditWarningDialog when showCreditWarning is true and result exists', () => {
            const props = createMockProps({
                showCreditWarning: true,
                creditCheckResult: {
                    hasEnoughCredits: false,
                    availableCredits: 2,
                    requiredCredits: 5,
                    maxProcessable: 2,
                },
            });
            render(<AppOverlays {...props} />);

            const dialog = screen.getByTestId('credit-warning-dialog');
            expect(dialog).toBeInTheDocument();
            expect(dialog).toHaveAttribute('data-has-credits', 'false');
        });

        it('hides CreditWarningDialog when showCreditWarning is false', () => {
            const props = createMockProps({
                showCreditWarning: false,
                creditCheckResult: { hasEnoughCredits: true, availableCredits: 10, requiredCredits: 5, maxProcessable: 5 },
            });
            render(<AppOverlays {...props} />);

            expect(screen.queryByTestId('credit-warning-dialog')).not.toBeInTheDocument();
        });
    });

    describe('BatchSummary visibility', () => {
        it('shows BatchSummary when showBatchSummary is true and data exists', () => {
            const props = createMockProps({
                showBatchSummary: true,
                batchSession: {
                    receipts: [],
                    insights: [],
                    totalAmount: 10000,
                },
                insightCache: {
                    insights: [],
                    lastUpdated: new Date().toISOString(),
                    silencedUntil: null,
                },
            });
            render(<AppOverlays {...props} />);

            expect(screen.getByTestId('batch-summary')).toBeInTheDocument();
        });

        it('hides BatchSummary when showBatchSummary is false', () => {
            const props = createMockProps({
                showBatchSummary: false,
                batchSession: { receipts: [], insights: [], totalAmount: 10000 },
                insightCache: { insights: [], lastUpdated: new Date().toISOString(), silencedUntil: null },
            });
            render(<AppOverlays {...props} />);

            expect(screen.queryByTestId('batch-summary')).not.toBeInTheDocument();
        });
    });

    describe('TrustMerchantPrompt visibility', () => {
        it('shows TrustMerchantPrompt when showTrustPrompt is true and data exists', () => {
            const props = createMockProps({
                showTrustPrompt: true,
                trustPromptData: {
                    eligible: true,
                    merchant: {
                        merchantName: 'Test Store',
                        scanCount: 3,
                    },
                },
            });
            render(<AppOverlays {...props} />);

            const prompt = screen.getByTestId('trust-merchant-prompt');
            expect(prompt).toBeInTheDocument();
            expect(prompt).toHaveAttribute('data-merchant', 'Test Store');
        });

        it('hides TrustMerchantPrompt when showTrustPrompt is false', () => {
            const props = createMockProps({
                showTrustPrompt: false,
                trustPromptData: { eligible: true, merchant: { merchantName: 'Test', scanCount: 3 } },
            });
            render(<AppOverlays {...props} />);

            expect(screen.queryByTestId('trust-merchant-prompt')).not.toBeInTheDocument();
        });
    });

    // Story 14e-5: TransactionConflictDialog tests removed - now rendered by ModalManager, not AppOverlays
    // Test TransactionConflictDialog via ModalManager integration tests instead

    describe('BatchCompleteModal visibility', () => {
        it('shows BatchCompleteModal when activeDialog is BATCH_COMPLETE with transactions', () => {
            const props = createMockProps({
                scanState: {
                    phase: 'idle',
                    mode: 'batch',
                    activeDialog: {
                        type: DIALOG_TYPES.BATCH_COMPLETE,
                        data: {
                            transactions: [{ id: 'tx-1' }, { id: 'tx-2' }],
                            creditsUsed: 2,
                        },
                    },
                    pendingTransaction: null,
                    batchReceipts: [],
                    error: null,
                },
            });
            render(<AppOverlays {...props} />);

            expect(screen.getByTestId('batch-complete-modal')).toBeInTheDocument();
        });

        it('hides BatchCompleteModal when no activeDialog', () => {
            const props = createMockProps({
                scanState: {
                    phase: 'idle',
                    mode: 'single',
                    activeDialog: null,
                    pendingTransaction: null,
                    batchReceipts: [],
                    error: null,
                },
            });
            render(<AppOverlays {...props} />);

            expect(screen.queryByTestId('batch-complete-modal')).not.toBeInTheDocument();
        });

        it('hides BatchCompleteModal when transactions array is empty', () => {
            const props = createMockProps({
                scanState: {
                    phase: 'idle',
                    mode: 'batch',
                    activeDialog: {
                        type: DIALOG_TYPES.BATCH_COMPLETE,
                        data: {
                            transactions: [],
                            creditsUsed: 0,
                        },
                    },
                    pendingTransaction: null,
                    batchReceipts: [],
                    error: null,
                },
            });
            render(<AppOverlays {...props} />);

            expect(screen.queryByTestId('batch-complete-modal')).not.toBeInTheDocument();
        });
    });

    describe('Component memoization', () => {
        it('is wrapped with React.memo', () => {
            // React.memo wrapped components have a $$typeof of Symbol(react.memo)
            // We can verify the component is memoized by checking its type
            expect(AppOverlays).toBeDefined();
            // The component should be callable (function component)
            expect(typeof AppOverlays).toBe('object'); // memo returns an object
        });
    });

    describe('Props interface completeness', () => {
        it('accepts all required props without TypeScript errors', () => {
            // This test verifies the props interface is complete
            // If any required prop is missing, TypeScript would error during compilation
            const props = createMockProps();
            const { container } = render(<AppOverlays {...props} />);
            expect(container).toBeInTheDocument();
        });
    });
});
