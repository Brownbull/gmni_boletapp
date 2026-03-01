/**
 * Story 15b-3g: viewRenderers Unit Tests
 *
 * Tests for the view renderer functions including:
 * - renderViewSwitch unified switch function
 * - Individual render functions with useHistoryFiltersInit integration
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { View } from '@app/types';

// Mock useHistoryFiltersInit (replaces HistoryFiltersProvider)
vi.mock('@/shared/hooks/useHistoryFiltersInit', () => ({
    useHistoryFiltersInit: vi.fn(),
}));

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

vi.mock('@features/scan/views/RecentScansView', () => ({
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

vi.mock('@features/scan/views/StatementScanView', () => ({
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
import { useHistoryFiltersInit } from '@/shared/hooks/useHistoryFiltersInit';

// =============================================================================
// Test Utilities
// =============================================================================

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
        it('should render DashboardView with useHistoryFiltersInit', () => {
            const props = createMinimalProps() as Parameters<typeof renderDashboardView>[0];
            render(<>{renderDashboardView(props)}</>);

            expect(screen.getByTestId('dashboard-view')).toBeInTheDocument();
            expect(useHistoryFiltersInit).toHaveBeenCalledWith();
        });
    });

    describe('renderTrendsView', () => {
        it('should render TrendsView with useHistoryFiltersInit', () => {
            const props = createMinimalProps() as Parameters<typeof renderTrendsView>[0];
            render(<>{renderTrendsView(props)}</>);

            expect(screen.getByTestId('trends-view')).toBeInTheDocument();
            expect(useHistoryFiltersInit).toHaveBeenCalledWith();
        });
    });

    describe('renderInsightsView', () => {
        it('should render InsightsView directly without filter init', () => {
            const props = createMinimalProps() as Parameters<typeof renderInsightsView>[0];
            render(<>{renderInsightsView(props)}</>);

            expect(screen.getByTestId('insights-view')).toBeInTheDocument();
            expect(useHistoryFiltersInit).not.toHaveBeenCalled();
        });
    });

    describe('renderHistoryView', () => {
        it('should render HistoryView with useHistoryFiltersInit', () => {
            const props = createMinimalProps() as Parameters<typeof renderHistoryView>[0];
            render(<>{renderHistoryView(props)}</>);

            expect(screen.getByTestId('history-view')).toBeInTheDocument();
            expect(useHistoryFiltersInit).toHaveBeenCalledWith({ initialState: undefined, onStateChange: undefined });
        });

        it('should pass initialState and onStateChange to useHistoryFiltersInit', () => {
            const onStateChange = vi.fn();
            const initialState = { temporal: { level: 'month' as const, year: '2026', month: '2026-01' }, category: { level: 'all' as const }, location: {} };
            const props = { ...createMinimalProps(), initialState, onStateChange } as Parameters<typeof renderHistoryView>[0];
            render(<>{renderHistoryView(props)}</>);

            expect(useHistoryFiltersInit).toHaveBeenCalledWith({ initialState, onStateChange });
        });
    });

    describe('renderItemsView', () => {
        it('should render ItemsView with useHistoryFiltersInit', () => {
            const props = createMinimalProps() as Parameters<typeof renderItemsView>[0];
            render(<>{renderItemsView(props)}</>);

            expect(screen.getByTestId('items-view')).toBeInTheDocument();
            expect(useHistoryFiltersInit).toHaveBeenCalledWith({ initialState: undefined, onStateChange: undefined });
        });

        it('should pass initialState and onStateChange to useHistoryFiltersInit', () => {
            const onStateChange = vi.fn();
            const initialState = { temporal: { level: 'month' as const, year: '2026', month: '2026-01' }, category: { level: 'all' as const }, location: {} };
            const props = { ...createMinimalProps(), initialState, onStateChange } as Parameters<typeof renderItemsView>[0];
            render(<>{renderItemsView(props)}</>);

            expect(useHistoryFiltersInit).toHaveBeenCalledWith({ initialState, onStateChange });
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

    describe('renderAlertsView', () => {
        it('should render NotificationsView', () => {
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

    beforeEach(() => {
        vi.clearAllMocks();
    });

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

    describe('Filter initialization', () => {
        it('should call useHistoryFiltersInit for dashboard view', () => {
            const props: ViewRenderProps = { dashboard: minimalProps as ViewRenderPropsMap['dashboard'] };
            render(<>{renderViewSwitch('dashboard', props)}</>);

            expect(useHistoryFiltersInit).toHaveBeenCalledWith();
        });

        it('should call useHistoryFiltersInit for trends view', () => {
            const props: ViewRenderProps = { trends: minimalProps as ViewRenderPropsMap['trends'] };
            render(<>{renderViewSwitch('trends', props)}</>);

            expect(useHistoryFiltersInit).toHaveBeenCalledWith();
        });

        it('should call useHistoryFiltersInit for history view', () => {
            const props: ViewRenderProps = { history: minimalProps as ViewRenderPropsMap['history'] };
            render(<>{renderViewSwitch('history', props)}</>);

            expect(useHistoryFiltersInit).toHaveBeenCalledWith({ initialState: undefined, onStateChange: undefined });
        });

        it('should call useHistoryFiltersInit for items view', () => {
            const props: ViewRenderProps = { items: minimalProps as ViewRenderPropsMap['items'] };
            render(<>{renderViewSwitch('items', props)}</>);

            expect(useHistoryFiltersInit).toHaveBeenCalledWith({ initialState: undefined, onStateChange: undefined });
        });
    });
});

// =============================================================================
// Type Export Tests
// =============================================================================

describe('Type exports', () => {
    it('should export ViewRenderProps type', () => {
        const props: ViewRenderProps = {};
        expect(props).toBeDefined();
    });

    it('should export ViewRenderPropsMap type with all view keys', () => {
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
