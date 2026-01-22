/**
 * Story 14c-refactor.11: App Types Unit Tests
 *
 * Tests for the shared type definitions and helper functions
 * used across App-level components.
 */
import { describe, it, expect } from 'vitest';
import {
    FULL_SCREEN_VIEWS,
    VIEWS_WITHOUT_TOP_HEADER,
    shouldShowTopHeader,
    isFullScreenView,
    type View,
} from '../../../../src/components/App/types';

describe('View Classification Constants', () => {
    describe('FULL_SCREEN_VIEWS', () => {
        it('should include all views that manage their own headers', () => {
            const expected: View[] = [
                'trends',
                'history',
                'items',
                'reports',
                'scan-result',
                'edit',
                'transaction-editor',
                'batch-capture',
                'batch-review',
                'statement-scan',
                'recent-scans',
                'insights',
                'alerts',
            ];

            expected.forEach((view) => {
                expect(FULL_SCREEN_VIEWS).toContain(view);
            });
        });

        it('should not include dashboard', () => {
            expect(FULL_SCREEN_VIEWS).not.toContain('dashboard');
        });

        it('should not include settings', () => {
            expect(FULL_SCREEN_VIEWS).not.toContain('settings');
        });

        it('should not include scan (pre-capture state)', () => {
            expect(FULL_SCREEN_VIEWS).not.toContain('scan');
        });
    });

    describe('VIEWS_WITHOUT_TOP_HEADER', () => {
        it('should include all views that have their own headers', () => {
            const expected: View[] = [
                'trends',
                'history',
                'reports',
                'items',
                'scan-result',
                'edit',
                'transaction-editor',
                'batch-capture',
                'batch-review',
                'statement-scan',
                'recent-scans',
                'insights',
                'alerts',
            ];

            expected.forEach((view) => {
                expect(VIEWS_WITHOUT_TOP_HEADER).toContain(view);
            });
        });

        it('should not include dashboard', () => {
            expect(VIEWS_WITHOUT_TOP_HEADER).not.toContain('dashboard');
        });

        it('should not include settings', () => {
            expect(VIEWS_WITHOUT_TOP_HEADER).not.toContain('settings');
        });
    });
});

describe('shouldShowTopHeader', () => {
    describe('Views that should show header', () => {
        const viewsWithHeader: View[] = ['dashboard', 'settings', 'scan'];

        viewsWithHeader.forEach((view) => {
            it(`should return true for ${view}`, () => {
                expect(shouldShowTopHeader(view)).toBe(true);
            });
        });
    });

    describe('Views that should NOT show header', () => {
        const viewsWithoutHeader: View[] = [
            'trends',
            'history',
            'reports',
            'items',
            'scan-result',
            'edit',
            'transaction-editor',
            'batch-capture',
            'batch-review',
            'statement-scan',
            'recent-scans',
            'insights',
            'alerts',
        ];

        viewsWithoutHeader.forEach((view) => {
            it(`should return false for ${view}`, () => {
                expect(shouldShowTopHeader(view)).toBe(false);
            });
        });
    });
});

describe('isFullScreenView', () => {
    describe('Full-screen views', () => {
        const fullScreenViews: View[] = [
            'trends',
            'history',
            'items',
            'reports',
            'scan-result',
            'edit',
            'transaction-editor',
            'batch-capture',
            'batch-review',
            'statement-scan',
            'recent-scans',
            'insights',
            'alerts',
        ];

        fullScreenViews.forEach((view) => {
            it(`should return true for ${view}`, () => {
                expect(isFullScreenView(view)).toBe(true);
            });
        });
    });

    describe('Non-full-screen views', () => {
        const regularViews: View[] = ['dashboard', 'settings', 'scan'];

        regularViews.forEach((view) => {
            it(`should return false for ${view}`, () => {
                expect(isFullScreenView(view)).toBe(false);
            });
        });
    });
});

describe('Type consistency', () => {
    it('should have FULL_SCREEN_VIEWS and VIEWS_WITHOUT_TOP_HEADER mostly overlap', () => {
        // These arrays should be nearly identical (both contain views that manage their own headers)
        // The logic: if a view is full-screen, it shouldn't show the top header
        FULL_SCREEN_VIEWS.forEach((view) => {
            expect(VIEWS_WITHOUT_TOP_HEADER).toContain(view);
        });
    });

    it('should return consistent results between isFullScreenView and shouldShowTopHeader', () => {
        // If a view is full-screen, it should NOT show the top header (for most cases)
        const allViews: View[] = [
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

        allViews.forEach((view) => {
            // Full-screen views don't show top header
            if (isFullScreenView(view)) {
                expect(shouldShowTopHeader(view)).toBe(false);
            }
        });
    });
});
