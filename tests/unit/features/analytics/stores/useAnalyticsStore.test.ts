import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAnalyticsStore, analyticsActions } from '@features/analytics/stores/useAnalyticsStore';
import { getDefaultNavigationState } from '@features/analytics/utils/analyticsHelpers';

// Mock getCurrentYear for deterministic tests
vi.mock('@features/analytics/utils/analyticsHelpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@features/analytics/utils/analyticsHelpers')>();
  return {
    ...actual,
    getCurrentYear: () => '2026',
  };
});

function resetStore() {
  const defaults = getDefaultNavigationState('2026');
  useAnalyticsStore.setState({
    temporal: defaults.temporal,
    category: defaults.category,
    chartMode: defaults.chartMode,
    drillDownMode: defaults.drillDownMode,
  });
}

describe('useAnalyticsStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('initial state', () => {
    it('has correct default values matching AC5', () => {
      const { temporal, category, chartMode, drillDownMode } = useAnalyticsStore.getState();
      expect(temporal).toEqual({ level: 'year', year: '2026' });
      expect(category).toEqual({ level: 'all' });
      expect(chartMode).toBe('aggregation');
      expect(drillDownMode).toBe('temporal');
    });
  });

  describe('setTemporalLevel', () => {
    it('updates temporal while preserving category', () => {
      const store = useAnalyticsStore.getState();
      store.setCategoryFilter({ level: 'category', category: 'Food' });
      store.setTemporalLevel({ level: 'quarter', year: '2026', quarter: 'Q1' });

      const state = useAnalyticsStore.getState();
      expect(state.temporal).toEqual({ level: 'quarter', year: '2026', quarter: 'Q1' });
      expect(state.category).toEqual({ level: 'category', category: 'Food' });
    });

    it('validates state (month auto-derives quarter)', () => {
      const store = useAnalyticsStore.getState();
      store.setTemporalLevel({ level: 'month', year: '2026', month: '2026-03' });

      const { temporal } = useAnalyticsStore.getState();
      expect(temporal.quarter).toBeDefined();
    });
  });

  describe('setCategoryFilter', () => {
    it('updates category while preserving temporal', () => {
      const store = useAnalyticsStore.getState();
      store.setTemporalLevel({ level: 'quarter', year: '2026', quarter: 'Q2' });
      store.setCategoryFilter({ level: 'category', category: 'Transport' });

      const state = useAnalyticsStore.getState();
      expect(state.category).toEqual({ level: 'category', category: 'Transport' });
      expect(state.temporal).toEqual({ level: 'quarter', year: '2026', quarter: 'Q2' });
    });

    it('validates state (subcategory without group resets to all)', () => {
      const store = useAnalyticsStore.getState();
      store.setCategoryFilter({ level: 'subcategory', subcategory: 'Meats' });

      const { category } = useAnalyticsStore.getState();
      expect(category.level).toBe('all');
    });
  });

  describe('toggleChartMode', () => {
    it('toggles from aggregation to comparison', () => {
      useAnalyticsStore.getState().toggleChartMode();
      expect(useAnalyticsStore.getState().chartMode).toBe('comparison');
    });

    it('toggles back to aggregation', () => {
      useAnalyticsStore.getState().toggleChartMode();
      useAnalyticsStore.getState().toggleChartMode();
      expect(useAnalyticsStore.getState().chartMode).toBe('aggregation');
    });
  });

  describe('toggleDrillDownMode', () => {
    it('toggles from temporal to category', () => {
      useAnalyticsStore.getState().toggleDrillDownMode();
      expect(useAnalyticsStore.getState().drillDownMode).toBe('category');
    });

    it('toggles back to temporal', () => {
      useAnalyticsStore.getState().toggleDrillDownMode();
      useAnalyticsStore.getState().toggleDrillDownMode();
      expect(useAnalyticsStore.getState().drillDownMode).toBe('temporal');
    });
  });

  describe('resetToYear', () => {
    it('resets temporal to year level while preserving category', () => {
      const store = useAnalyticsStore.getState();
      store.setTemporalLevel({ level: 'month', year: '2026', quarter: 'Q1', month: '2026-03' });
      store.setCategoryFilter({ level: 'category', category: 'Food' });
      store.resetToYear('2025');

      const state = useAnalyticsStore.getState();
      expect(state.temporal).toEqual({ level: 'year', year: '2025' });
      expect(state.category).toEqual({ level: 'category', category: 'Food' });
    });
  });

  describe('clearCategoryFilter', () => {
    it('clears category while preserving temporal', () => {
      const store = useAnalyticsStore.getState();
      store.setTemporalLevel({ level: 'quarter', year: '2026', quarter: 'Q3' });
      store.setCategoryFilter({ level: 'group', category: 'Food', group: 'Groceries' });
      store.clearCategoryFilter();

      const state = useAnalyticsStore.getState();
      expect(state.category).toEqual({ level: 'all' });
      expect(state.temporal).toEqual({ level: 'quarter', year: '2026', quarter: 'Q3' });
    });
  });

  describe('initialize', () => {
    it('sets full state from provided value', () => {
      const custom = {
        temporal: { level: 'month' as const, year: '2025', quarter: 'Q4', month: '2025-12' },
        category: { level: 'category' as const, category: 'Health' },
        chartMode: 'comparison' as const,
        drillDownMode: 'category' as const,
      };

      useAnalyticsStore.getState().initialize(custom);

      const state = useAnalyticsStore.getState();
      expect(state.temporal).toEqual(custom.temporal);
      expect(state.category).toEqual(custom.category);
      expect(state.chartMode).toBe('comparison');
      expect(state.drillDownMode).toBe('category');
    });

    it('resets to defaults when called without argument', () => {
      useAnalyticsStore.getState().toggleChartMode();
      useAnalyticsStore.getState().initialize();

      const state = useAnalyticsStore.getState();
      expect(state.chartMode).toBe('aggregation');
      expect(state.temporal).toEqual({ level: 'year', year: '2026' });
    });

    it('validates provided state', () => {
      useAnalyticsStore.getState().initialize({
        temporal: { level: 'day', year: '2026' }, // day without month = invalid
        category: { level: 'all' },
        chartMode: 'aggregation',
        drillDownMode: 'temporal',
      });

      const { temporal } = useAnalyticsStore.getState();
      // Should auto-correct to year level since day without month is invalid
      expect(temporal.level).toBe('year');
    });
  });

  describe('dispatch (backward-compatible)', () => {
    it('routes SET_TEMPORAL_LEVEL action', () => {
      useAnalyticsStore.getState().dispatch({
        type: 'SET_TEMPORAL_LEVEL',
        payload: { level: 'quarter', year: '2026', quarter: 'Q2' },
      });
      expect(useAnalyticsStore.getState().temporal.level).toBe('quarter');
    });

    it('routes SET_CATEGORY_FILTER action', () => {
      useAnalyticsStore.getState().dispatch({
        type: 'SET_CATEGORY_FILTER',
        payload: { level: 'category', category: 'Food' },
      });
      expect(useAnalyticsStore.getState().category.category).toBe('Food');
    });

    it('routes TOGGLE_CHART_MODE action', () => {
      useAnalyticsStore.getState().dispatch({ type: 'TOGGLE_CHART_MODE' });
      expect(useAnalyticsStore.getState().chartMode).toBe('comparison');
    });

    it('routes TOGGLE_DRILLDOWN_MODE action', () => {
      useAnalyticsStore.getState().dispatch({ type: 'TOGGLE_DRILLDOWN_MODE' });
      expect(useAnalyticsStore.getState().drillDownMode).toBe('category');
    });

    it('routes RESET_TO_YEAR action', () => {
      useAnalyticsStore.getState().dispatch({
        type: 'RESET_TO_YEAR',
        payload: { year: '2024' },
      });
      expect(useAnalyticsStore.getState().temporal).toEqual({ level: 'year', year: '2024' });
    });

    it('routes CLEAR_CATEGORY_FILTER action', () => {
      useAnalyticsStore.getState().dispatch({
        type: 'SET_CATEGORY_FILTER',
        payload: { level: 'category', category: 'X' },
      });
      useAnalyticsStore.getState().dispatch({ type: 'CLEAR_CATEGORY_FILTER' });
      expect(useAnalyticsStore.getState().category).toEqual({ level: 'all' });
    });
  });

  describe('analyticsActions (imperative)', () => {
    it('exposes all actions for use outside React', () => {
      expect(typeof analyticsActions.setTemporalLevel).toBe('function');
      expect(typeof analyticsActions.setCategoryFilter).toBe('function');
      expect(typeof analyticsActions.toggleChartMode).toBe('function');
      expect(typeof analyticsActions.toggleDrillDownMode).toBe('function');
      expect(typeof analyticsActions.resetToYear).toBe('function');
      expect(typeof analyticsActions.clearCategoryFilter).toBe('function');
      expect(typeof analyticsActions.initialize).toBe('function');
      expect(typeof analyticsActions.dispatch).toBe('function');
      expect(typeof analyticsActions.getState).toBe('function');
    });

    it('getState returns current navigation state', () => {
      analyticsActions.toggleChartMode();
      const state = analyticsActions.getState();
      expect(state.chartMode).toBe('comparison');
      expect(state.temporal).toEqual({ level: 'year', year: '2026' });
    });
  });
});
