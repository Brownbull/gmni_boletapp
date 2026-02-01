/**
 * Story 14c-refactor.22d: AppOverlays Unit Tests
 * Story 14e-23a: Scan overlays migrated to ScanFeature
 * Story 14e-23b: NavigationBlocker and PWAUpdatePrompt moved to App.tsx
 *
 * Tests for the AppOverlays component that centralizes non-scan overlay/modal rendering.
 * Scan overlays (ScanOverlay, QuickSaveCard, BatchCompleteModal, CurrencyMismatchDialog,
 * TotalMismatchDialog) are now rendered by ScanFeature - test those in ScanFeature tests.
 *
 * Test categories:
 * - Conditional visibility overlays (InsightCard, SessionComplete, etc.)
 * - Props passing to child components
 * - React.memo behavior
 *
 * Story 14e-23b: NavigationBlocker and PWAUpdatePrompt are now rendered directly in App.tsx
 * and are no longer tested here.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppOverlays, type AppOverlaysProps } from '../../../../src/components/App/AppOverlays';

// =============================================================================
// Mock all overlay components to isolate AppOverlays logic
// =============================================================================

// Story 14e-23b: NavigationBlocker and PWAUpdatePrompt mocks removed
// These components are now rendered directly in App.tsx
// Story 14e-23a: Scan overlays moved to ScanFeature - mocks removed

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

// Story 14e-39: TrustMerchantPrompt mock removed - now rendered by CreditFeature

// Story 14e-18c: CreditWarningDialog mock removed - now rendered by CreditFeature
// Story 14e-5: TransactionConflictDialog mock removed - now rendered by ModalManager, not AppOverlays
// Story 14e-23a: ScanOverlay, QuickSaveCard, BatchCompleteModal, CurrencyMismatchDialog, TotalMismatchDialog
//               mocks removed - now rendered by ScanFeature

// =============================================================================
// Test Fixtures
// =============================================================================

const createMockProps = (overrides: Partial<AppOverlaysProps> = {}): AppOverlaysProps => ({
    // Core dependencies
    // Story 14e-23b: currentView and lang removed (now passed directly in App.tsx)
    theme: 'light',
    t: (key: string) => key,

    // Story 14e-23a: Scan-related props removed (now in ScanFeature)

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

    // Batch summary props
    showBatchSummary: false,
    batchSession: null,
    transactions: [],
    insightCache: null,
    onBatchSummarySilence: vi.fn(),
    onBatchSummaryDismiss: vi.fn(),

    // Story 14e-39: Trust merchant prompt props removed - now managed by CreditFeature

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

    // Story 14e-23b: NavigationBlocker and PWAUpdatePrompt tests removed
    // These components are now rendered directly in App.tsx, not via AppOverlays
    // Story 14e-23a: ScanOverlay visibility tests moved to ScanFeature tests
    // These overlays are now rendered by ScanFeature based on phase, not view

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

    // Story 14e-18c: CreditWarningDialog visibility tests moved to CreditFeature.test.tsx

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

    // Story 14e-39: TrustMerchantPrompt visibility tests removed - now rendered by CreditFeature

    // Story 14e-5: TransactionConflictDialog tests removed - now rendered by ModalManager, not AppOverlays
    // Story 14e-23a: BatchCompleteModal tests moved to ScanFeature tests

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
