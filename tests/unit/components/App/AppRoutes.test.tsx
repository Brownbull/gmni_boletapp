/**
 * Story 14c-refactor.11: AppRoutes Unit Tests
 *
 * Tests for the view routing switch component that centralizes
 * view rendering logic using a render prop pattern.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppRoutes } from '../../../../src/components/App/AppRoutes';
import type { View } from '@app/types';

describe('AppRoutes', () => {
    describe('Render prop pattern', () => {
        it('should call renderView with the current view', () => {
            const mockRenderView = vi.fn(() => <div>Dashboard</div>);

            render(<AppRoutes view="dashboard" renderView={mockRenderView} />);

            expect(mockRenderView).toHaveBeenCalledWith('dashboard');
            expect(mockRenderView).toHaveBeenCalledTimes(1);
        });

        it('should render the result of renderView function', () => {
            const mockRenderView = (view: View) => (
                <div data-testid="view-content">Current view: {view}</div>
            );

            render(<AppRoutes view="trends" renderView={mockRenderView} />);

            expect(screen.getByTestId('view-content')).toBeInTheDocument();
            expect(screen.getByText('Current view: trends')).toBeInTheDocument();
        });

        it('should re-render when view changes', () => {
            const mockRenderView = vi.fn((view: View) => <div>{view}</div>);

            const { rerender } = render(<AppRoutes view="dashboard" renderView={mockRenderView} />);
            expect(mockRenderView).toHaveBeenLastCalledWith('dashboard');

            rerender(<AppRoutes view="settings" renderView={mockRenderView} />);
            expect(mockRenderView).toHaveBeenLastCalledWith('settings');
        });
    });

    describe('View types', () => {
        const views: View[] = [
            'dashboard',
            'scan',
            'scan-result',
            'edit',
            'transaction-editor',
            'trends',
            'insights',
            'settings',
            'alerts',
            'batch-capture',
            'batch-review',
            'history',
            'reports',
            'items',
            'statement-scan',
            'recent-scans',
        ];

        views.forEach((view) => {
            it(`should render ${view} view correctly`, () => {
                const mockRenderView = (v: View) => <div data-testid={v}>{v} content</div>;

                render(<AppRoutes view={view} renderView={mockRenderView} />);

                expect(screen.getByTestId(view)).toBeInTheDocument();
                expect(screen.getByText(`${view} content`)).toBeInTheDocument();
            });
        });
    });

    describe('Complex render functions', () => {
        it('should handle render functions that return null', () => {
            const mockRenderView = () => null;

            const { container } = render(<AppRoutes view="dashboard" renderView={mockRenderView} />);

            expect(container.firstChild).toBeNull();
        });

        it('should handle render functions that return fragments', () => {
            const mockRenderView = () => (
                <>
                    <div>Part 1</div>
                    <div>Part 2</div>
                </>
            );

            render(<AppRoutes view="dashboard" renderView={mockRenderView} />);

            expect(screen.getByText('Part 1')).toBeInTheDocument();
            expect(screen.getByText('Part 2')).toBeInTheDocument();
        });

        it('should handle render functions with conditionals', () => {
            const mockRenderView = (view: View) => {
                if (view === 'dashboard') {
                    return <div>Dashboard View</div>;
                }
                return <div>Other View</div>;
            };

            const { rerender } = render(<AppRoutes view="dashboard" renderView={mockRenderView} />);
            expect(screen.getByText('Dashboard View')).toBeInTheDocument();

            rerender(<AppRoutes view="settings" renderView={mockRenderView} />);
            expect(screen.getByText('Other View')).toBeInTheDocument();
        });

        it('should handle render functions with switch statements', () => {
            const mockRenderView = (view: View) => {
                switch (view) {
                    case 'dashboard':
                        return <div>Home</div>;
                    case 'trends':
                        return <div>Analytics</div>;
                    case 'settings':
                        return <div>Preferences</div>;
                    default:
                        return <div>Unknown</div>;
                }
            };

            const { rerender } = render(<AppRoutes view="dashboard" renderView={mockRenderView} />);
            expect(screen.getByText('Home')).toBeInTheDocument();

            rerender(<AppRoutes view="trends" renderView={mockRenderView} />);
            expect(screen.getByText('Analytics')).toBeInTheDocument();

            rerender(<AppRoutes view="settings" renderView={mockRenderView} />);
            expect(screen.getByText('Preferences')).toBeInTheDocument();
        });
    });
});
