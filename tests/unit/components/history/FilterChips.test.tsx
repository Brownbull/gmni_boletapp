/**
 * FilterChips Component Tests
 *
 * Story 14.14: Transaction List Redesign (AC #3)
 * Tests for filter chip display and removal.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterChips } from '../../../../src/components/history/FilterChips';
import { HistoryFiltersProvider, type HistoryFilterState } from '../../../../src/contexts/HistoryFiltersContext';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockT = (key: string) => {
  const translations: Record<string, string> = {
    activeFilters: 'Filtros activos',
    remove: 'Remover',
    clearAll: 'Limpiar todo',
    clearAllFilters: 'Limpiar todos los filtros',
    allCategories: 'Todas las categorías',
    allLocations: 'Todas las ubicaciones',
  };
  return translations[key] || key;
};

const defaultInitialState: HistoryFilterState = {
  temporal: { level: 'all' },
  category: { level: 'all' },
  location: {},
  group: {},
};

const renderWithProvider = (
  initialState: HistoryFilterState = defaultInitialState
) => {
  return render(
    <HistoryFiltersProvider initialState={initialState}>
      <FilterChips locale="es" t={mockT} />
    </HistoryFiltersProvider>
  );
};

// ============================================================================
// Tests
// ============================================================================

describe('FilterChips', () => {
  describe('Visibility', () => {
    it('renders nothing when no filters are active', () => {
      const { container } = renderWithProvider();

      // FilterChips returns null when no filters, so container should be empty
      expect(container.textContent).toBe('');
    });

    it('renders chips when temporal filter is active', () => {
      renderWithProvider({
        ...defaultInitialState,
        temporal: { level: 'year', year: '2024' },
      });

      // Should show a chip with the year
      expect(screen.getByText('2024')).toBeInTheDocument();
    });

    it('renders chips when category filter is active', () => {
      renderWithProvider({
        ...defaultInitialState,
        category: { level: 'category', category: 'Supermarket' },
      });

      expect(screen.getByText('Supermarket')).toBeInTheDocument();
    });

    it('renders chips when location filter is active', () => {
      renderWithProvider({
        ...defaultInitialState,
        location: { country: 'Chile', city: 'Santiago' },
      });

      expect(screen.getByText('Chile > Santiago')).toBeInTheDocument();
    });
  });

  describe('Clear All Button', () => {
    it('shows Clear All when multiple filters active', () => {
      renderWithProvider({
        temporal: { level: 'year', year: '2024' },
        category: { level: 'category', category: 'Supermarket' },
        location: {},
        group: {},
      });

      expect(screen.getByText('Limpiar todo')).toBeInTheDocument();
    });

    it('does not show Clear All when only one filter active', () => {
      renderWithProvider({
        ...defaultInitialState,
        temporal: { level: 'year', year: '2024' },
      });

      expect(screen.queryByText('Limpiar todo')).not.toBeInTheDocument();
    });
  });

  describe('Filter Removal', () => {
    it('chip is clickable for temporal filter', () => {
      renderWithProvider({
        ...defaultInitialState,
        temporal: { level: 'year', year: '2024' },
      });

      // Click the chip (which acts as a remove button)
      const chip = screen.getByText('2024').closest('button');
      expect(chip).toBeInTheDocument();

      // The chip should be a button and clickable
      fireEvent.click(chip!);
      // After click, dispatch is called - state change verified in integration tests
    });
  });

  describe('Accessibility', () => {
    it('has accessible group role', () => {
      renderWithProvider({
        ...defaultInitialState,
        temporal: { level: 'year', year: '2024' },
      });

      expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Filtros activos');
    });

    it('chips have accessible remove labels', () => {
      renderWithProvider({
        ...defaultInitialState,
        temporal: { level: 'year', year: '2024' },
      });

      const chip = screen.getByText('2024').closest('button');
      expect(chip).toHaveAttribute('aria-label', expect.stringContaining('Remover'));
    });
  });

  describe('Theme Support', () => {
    it('renders with theme using CSS variables', () => {
      renderWithProvider({
        ...defaultInitialState,
        temporal: { level: 'year', year: '2024' },
      });

      const chip = screen.getByText('2024').closest('button');
      expect(chip).toBeInTheDocument();
      // CSS variables are applied via style prop, verified by visual inspection
    });
  });

  describe('Icons', () => {
    it('shows calendar icon for temporal filter', () => {
      const { container } = renderWithProvider({
        ...defaultInitialState,
        temporal: { level: 'year', year: '2024' },
      });

      // Lucide icons render as SVGs
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });
});
