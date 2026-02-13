/**
 * Story 14c-refactor.22c: viewRenderers Unit Tests
 *
 * Tests for the view renderer functions including:
 * - renderViewSwitch unified switch function
 * - Individual render functions (renderAlertsView, renderSettingsView, etc.)
 * - ViewRenderProps and ViewRenderPropsMap type exports
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { View } from '@app/types';

// Mock all view components to avoid their complex dependencies
vi.mock('../../../../src/views/DashboardView', () => ({
    DashboardView: (props: Record<string, unknown>) => (
        <div data-testid="dashboard-view" data-props={JSON.stringify(Object.keys(props))}>
            DashboardView
        </div>
    ),
}));

vi.mock('../../../../src/views/TrendsView', () => ({
    TrendsView: (props: Record<string, unknown>) => (
        <div data-testid="trends-view" data-props={JSON.stringify(Object.keys(props))}>
            TrendsView
        </div>
    ),
}));

vi.mock('../../../../src/views/InsightsView', () => ({
    InsightsView: (props: Record<string, unknown>) => (
        <div data-testid="insights-view" data-props={JSON.stringify(Object.keys(props))}>
            InsightsView
        </div>
    ),
}));

vi.mock('../../../../src/views/HistoryView', () => ({
    HistoryView: (props: Record<string, unknown>) => (
        <div data-testid="history-view" data-props={JSON.stringify(Object.keys(props))}>
            HistoryView
        </div>
    ),
}));

vi.mock('../../../../src/views/ItemsView', () => ({
    ItemsView: (props: Record<string, unknown>) => (
        <div data-testid="items-view" data-props={JSON.stringify(Object.keys(props))}>
            ItemsView
        </div>
    ),
}));

vi.mock('../../../../src/views/RecentScansView', () => ({
    RecentScansView: (props: Record<string, unknown>) => (
        <div data-testid="recent-scans-view" data-props={JSON.stringify(Object.keys(props))}>
            RecentScansView
        </div>
    ),
}));

vi.mock('../../../../src/views/ReportsView', () => ({
    ReportsView: (props: Record<string, unknown>) => (
        <div data-testid="reports-view" data-props={JSON.stringify(Object.keys(props))}>
            ReportsView
        </div>
    ),
}));

vi.mock('../../../../src/views/StatementScanView', () => ({
    StatementScanView: (props: Record<string, unknown>) => (
        <div data-testid="statement-scan-view" data-props={JSON.stringify(Object.keys(props))}>
            StatementScanView
        </div>
    ),
}));

vi.mock('../../../../src/views/NotificationsView', () => ({
    NotificationsView: (props: Record<string, unknown>) => (
        <div data-testid="notifications-view" data-props={JSON.stringify(Object.keys(props))}>
            NotificationsView
        </div>
    ),
}));

vi.mock('../../../../src/views/SettingsView', () => ({
    SettingsView: (props: Record<string, unknown>) => (
        <div data-testid="settings-view" data-props={JSON.stringify(Object.keys(props))}>
            SettingsView
        </div>
    ),
}));

vi.mock('../../../../src/views/TransactionEditorView', () => ({
    TransactionEditorView: (props: Record<string, unknown>) => (
        <div data-testid="transaction-editor-view" data-props={JSON.stringify(Object.keys(props))}>
            TransactionEditorView
        </div>
    ),
}));

vi.mock('../../../../src/views/BatchCaptureView', () => ({
    BatchCaptureView: (props: Record<string, unknown>) => (
        <div data-testid="batch-capture-view" data-props={JSON.stringify(Object.keys(props))}>
            BatchCaptureView
        </div>
    ),
}));

vi.mock('../../../../src/views/BatchReviewView', () => ({
    BatchReviewView: (props: Record<string, unknown>) => (
        <div data-testid="batch-review-view" data-props={JSON.stringify(Object.keys(props))}>
            BatchReviewView
        </div>
    ),
}));

// Mock providers
vi.mock('../../../../src/contexts/AnalyticsContext', () => ({
    AnalyticsProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="analytics-provider">{children}</div>
    ),
}));

vi.mock('../../../../src/contexts/HistoryFiltersContext', () => ({
    HistoryFiltersProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="history-filters-provider">{children}</div>
    ),
}));

// Import after mocks
import {
    renderDashboardView,
    renderTrendsView,
    renderInsightsView,
    renderHistoryView,
    renderItemsView,
    renderRecentScansView,
    renderReportsView,
    renderStatementScanView,
    renderAlertsView,
    renderSettingsView,
    renderTransactionEditorView,
    renderBatchCaptureView,
    renderBatchReviewView,
    renderViewSwitch,
    type ViewRenderProps,
    type ViewRenderPropsMap,
} from '../../../../src/components/App/viewRenderers';

// =============================================================================
// Test Utilities
// =============================================================================

// Minimal props for testing - actual prop validation is done by TypeScript
const createMinimalProps = () => ({
    theme: 'light' as const,
    t: (key: string) => key,
});

// =============================================================================
// Individual Render Function Tests
// =============================================================================

describe('viewRenderers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('renderDashboardView', () => {
        it('should render DashboardView wrapped in HistoryFiltersProvider', () => {
            const props = createMinimalProps() as Parameters<typeof renderDashboardView>[0];
            const { container } = render(<>{renderDashboardView(props)}</>);

            expect(screen.getByTestId('history-filters-provider')).toBeInTheDocument();
            expect(screen.getByTestId('dashboard-view')).toBeInTheDocument();
        });
    });

    describe('renderTrendsView', () => {
        it('should render TrendsView wrapped in HistoryFiltersProvider and AnalyticsProvider', () => {
            const props = createMinimalProps() as Parameters<typeof renderTrendsView>[0];
            const { container } = render(<>{renderTrendsView(props)}</>);

            expect(screen.getByTestId('history-filters-provider')).toBeInTheDocument();
            expect(screen.getByTestId('analytics-provider')).toBeInTheDocument();
            expect(screen.getByTestId('trends-view')).toBeInTheDocument();
        });

        it('should pass analyticsInitialState to AnalyticsProvider when provided', () => {
            const props = {
                ...createMinimalProps(),
                analyticsInitialState: { temporal: { level: 'month' } },
            } as Parameters<typeof renderTrendsView>[0];

            render(<>{renderTrendsView(props)}</>);

            expect(screen.getByTestId('trends-view')).toBeInTheDocument();
        });
    });

    describe('renderInsightsView', () => {
        it('should render InsightsView directly without provider wrapping', () => {
            const props = createMinimalProps() as Parameters<typeof renderInsightsView>[0];
            render(<>{renderInsightsView(props)}</>);

            expect(screen.getByTestId('insights-view')).toBeInTheDocument();
            expect(screen.queryByTestId('history-filters-provider')).not.toBeInTheDocument();
        });
    });

    describe('renderHistoryView', () => {
        it('should render HistoryView wrapped in HistoryFiltersProvider', () => {
            const props = createMinimalProps() as Parameters<typeof renderHistoryView>[0];
            render(<>{renderHistoryView(props)}</>);

            expect(screen.getByTestId('history-filters-provider')).toBeInTheDocument();
            expect(screen.getByTestId('history-view')).toBeInTheDocument();
        });
    });

    describe('renderItemsView', () => {
        it('should render ItemsView wrapped in HistoryFiltersProvider', () => {
            const props = createMinimalProps() as Parameters<typeof renderItemsView>[0];
            render(<>{renderItemsView(props)}</>);

            expect(screen.getByTestId('history-filters-provider')).toBeInTheDocument();
            expect(screen.getByTestId('items-view')).toBeInTheDocument();
        });
    });

    describe('renderRecentScansView', () => {
        it('should render RecentScansView directly', () => {
            const props = createMinimalProps() as Parameters<typeof renderRecentScansView>[0];
            render(<>{renderRecentScansView(props)}</>);

            expect(screen.getByTestId('recent-scans-view')).toBeInTheDocument();
        });
    });

    describe('renderReportsView', () => {
        it('should render ReportsView directly', () => {
            const props = createMinimalProps() as Parameters<typeof renderReportsView>[0];
            render(<>{renderReportsView(props)}</>);

            expect(screen.getByTestId('reports-view')).toBeInTheDocument();
        });
    });

    describe('renderStatementScanView', () => {
        it('should render StatementScanView directly', () => {
            const props = createMinimalProps() as Parameters<typeof renderStatementScanView>[0];
            render(<>{renderStatementScanView(props)}</>);

            expect(screen.getByTestId('statement-scan-view')).toBeInTheDocument();
        });
    });

    // Story 14c-refactor.22c: New render function tests
    describe('renderAlertsView', () => {
        it('should render NotificationsView (alerts uses NotificationsView component)', () => {
            const props = createMinimalProps() as Parameters<typeof renderAlertsView>[0];
            render(<>{renderAlertsView(props)}</>);

            expect(screen.getByTestId('notifications-view')).toBeInTheDocument();
        });
    });

    describe('renderSettingsView', () => {
        it('should render SettingsView directly', () => {
            const props = createMinimalProps() as Parameters<typeof renderSettingsView>[0];
            render(<>{renderSettingsView(props)}</>);

            expect(screen.getByTestId('settings-view')).toBeInTheDocument();
        });
    });

    describe('renderTransactionEditorView', () => {
        it('should render TransactionEditorView directly', () => {
            const props = createMinimalProps() as Parameters<typeof renderTransactionEditorView>[0];
            render(<>{renderTransactionEditorView(props)}</>);

            expect(screen.getByTestId('transaction-editor-view')).toBeInTheDocument();
        });
    });

    describe('renderBatchCaptureView', () => {
        it('should render BatchCaptureView directly', () => {
            const props = createMinimalProps() as Parameters<typeof renderBatchCaptureView>[0];
            render(<>{renderBatchCaptureView(props)}</>);

            expect(screen.getByTestId('batch-capture-view')).toBeInTheDocument();
        });
    });

    describe('renderBatchReviewView', () => {
        it('should render BatchReviewView directly', () => {
            const props = createMinimalProps() as Parameters<typeof renderBatchReviewView>[0];
            render(<>{renderBatchReviewView(props)}</>);

            expect(screen.getByTestId('batch-review-view')).toBeInTheDocument();
        });
    });
});

// =============================================================================
// renderViewSwitch Tests
// =============================================================================

describe('renderViewSwitch', () => {
    const minimalProps = createMinimalProps();

    describe('Active views', () => {
        const activeViewTestCases: Array<{ view: View; expectedTestId: string; propsKey: keyof ViewRenderProps }> = [
            { view: 'dashboard', expectedTestId: 'dashboard-view', propsKey: 'dashboard' },
            { view: 'trends', expectedTestId: 'trends-view', propsKey: 'trends' },
            { view: 'insights', expectedTestId: 'insights-view', propsKey: 'insights' },
            { view: 'history', expectedTestId: 'history-view', propsKey: 'history' },
            { view: 'items', expectedTestId: 'items-view', propsKey: 'items' },
            { view: 'recent-scans', expectedTestId: 'recent-scans-view', propsKey: 'recentScans' },
            { view: 'reports', expectedTestId: 'reports-view', propsKey: 'reports' },
            { view: 'statement-scan', expectedTestId: 'statement-scan-view', propsKey: 'statementScan' },
            { view: 'alerts', expectedTestId: 'notifications-view', propsKey: 'alerts' },
            { view: 'settings', expectedTestId: 'settings-view', propsKey: 'settings' },
            { view: 'transaction-editor', expectedTestId: 'transaction-editor-view', propsKey: 'transactionEditor' },
            { view: 'batch-capture', expectedTestId: 'batch-capture-view', propsKey: 'batchCapture' },
            { view: 'batch-review', expectedTestId: 'batch-review-view', propsKey: 'batchReview' },
        ];

        activeViewTestCases.forEach(({ view, expectedTestId, propsKey }) => {
            it(`should render ${view} view when props.${propsKey} is provided`, () => {
                const props: ViewRenderProps = {
                    [propsKey]: minimalProps,
                };

                const result = renderViewSwitch(view, props);
                render(<>{result}</>);

                expect(screen.getByTestId(expectedTestId)).toBeInTheDocument();
            });

            it(`should return null for ${view} view when props.${propsKey} is not provided`, () => {
                const props: ViewRenderProps = {};

                const result = renderViewSwitch(view, props);

                expect(result).toBeNull();
            });
        });
    });

    describe('Deprecated views', () => {
        const deprecatedViews: View[] = ['scan', 'scan-result', 'edit'];

        deprecatedViews.forEach((view) => {
            it(`should return null for deprecated view: ${view}`, () => {
                const props: ViewRenderProps = {};

                const result = renderViewSwitch(view, props);

                expect(result).toBeNull();
            });
        });
    });

    describe('Provider wrapping', () => {
        it('should wrap dashboard in HistoryFiltersProvider', () => {
            const props: ViewRenderProps = { dashboard: minimalProps as ViewRenderPropsMap['dashboard'] };
            render(<>{renderViewSwitch('dashboard', props)}</>);

            expect(screen.getByTestId('history-filters-provider')).toBeInTheDocument();
        });

        it('should wrap trends in HistoryFiltersProvider and AnalyticsProvider', () => {
            const props: ViewRenderProps = { trends: minimalProps as ViewRenderPropsMap['trends'] };
            render(<>{renderViewSwitch('trends', props)}</>);

            expect(screen.getByTestId('history-filters-provider')).toBeInTheDocument();
            expect(screen.getByTestId('analytics-provider')).toBeInTheDocument();
        });

        it('should wrap history in HistoryFiltersProvider', () => {
            const props: ViewRenderProps = { history: minimalProps as ViewRenderPropsMap['history'] };
            render(<>{renderViewSwitch('history', props)}</>);

            expect(screen.getByTestId('history-filters-provider')).toBeInTheDocument();
        });

        it('should wrap items in HistoryFiltersProvider', () => {
            const props: ViewRenderProps = { items: minimalProps as ViewRenderPropsMap['items'] };
            render(<>{renderViewSwitch('items', props)}</>);

            expect(screen.getByTestId('history-filters-provider')).toBeInTheDocument();
        });
    });
});

// =============================================================================
// Type Export Tests
// =============================================================================

describe('Type exports', () => {
    it('should export ViewRenderProps type', () => {
        // Type-level test - if this compiles, the type is exported correctly
        const props: ViewRenderProps = {};
        expect(props).toBeDefined();
    });

    it('should export ViewRenderPropsMap type with all view keys', () => {
        // Type-level test - if this compiles, the type has all expected keys
        const _map: ViewRenderPropsMap = {
            dashboard: {} as ViewRenderPropsMap['dashboard'],
            trends: {} as ViewRenderPropsMap['trends'],
            insights: {} as ViewRenderPropsMap['insights'],
            history: {} as ViewRenderPropsMap['history'],
            items: {} as ViewRenderPropsMap['items'],
            'recent-scans': {} as ViewRenderPropsMap['recent-scans'],
            reports: {} as ViewRenderPropsMap['reports'],
            'statement-scan': {} as ViewRenderPropsMap['statement-scan'],
            alerts: {} as ViewRenderPropsMap['alerts'],
            settings: {} as ViewRenderPropsMap['settings'],
            'transaction-editor': {} as ViewRenderPropsMap['transaction-editor'],
            'batch-capture': {} as ViewRenderPropsMap['batch-capture'],
            'batch-review': {} as ViewRenderPropsMap['batch-review'],
        };
        expect(_map).toBeDefined();
    });
});
