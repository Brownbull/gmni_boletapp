/**
 * FeatureOrchestrator Tests
 *
 * Story 14e-21: Create FeatureOrchestrator
 *
 * Tests for the FeatureOrchestrator component covering:
 * - Basic rendering without errors
 * - Each feature is rendered when props provided
 * - ModalManager is rendered
 * - Features handle their own visibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureOrchestrator } from '@app/FeatureOrchestrator';
import type { FeatureOrchestratorProps } from '@app/FeatureOrchestrator';

// =============================================================================
// Mocks
// =============================================================================

// Track which features were rendered
const renderTracker = {
  scanFeature: false,
  batchReviewFeature: false,
  categoriesFeature: false,
  creditFeature: false,
  modalManager: false,
};

// Mock ScanFeature
vi.mock('@features/scan', () => ({
  ScanFeature: vi.fn(({ t, theme }: { t: (key: string) => string; theme: string }) => {
    renderTracker.scanFeature = true;
    return (
      <div data-testid="scan-feature" data-theme={theme}>
        {t('scanFeature')}
      </div>
    );
  }),
}));

// Mock BatchReviewFeature
vi.mock('@features/batch-review', () => ({
  BatchReviewFeature: vi.fn(({ t, theme }: { t: (key: string) => string; theme: string }) => {
    renderTracker.batchReviewFeature = true;
    return (
      <div data-testid="batch-review-feature" data-theme={theme}>
        {t('batchReviewFeature')}
      </div>
    );
  }),
}));

// Mock CategoriesFeature
vi.mock('@features/categories', () => ({
  CategoriesFeature: vi.fn(({ user, services, children }: { user: any; services: any; children?: React.ReactNode }) => {
    renderTracker.categoriesFeature = true;
    return (
      <div data-testid="categories-feature" data-user-id={user?.uid || 'null'}>
        {children}
      </div>
    );
  }),
}));

// Mock CreditFeature
vi.mock('@features/credit', () => ({
  CreditFeature: vi.fn(({ user, services, t }: { user: any; services: any; t?: (key: string) => string }) => {
    renderTracker.creditFeature = true;
    return (
      <div data-testid="credit-feature" data-user-id={user?.uid || 'null'}>
        {t?.('creditFeature') || 'credit'}
      </div>
    );
  }),
}));

// Mock ModalManager
vi.mock('@managers/ModalManager', () => ({
  ModalManager: vi.fn(() => {
    renderTracker.modalManager = true;
    return <div data-testid="modal-manager">ModalManager</div>;
  }),
}));

// =============================================================================
// Test Helpers
// =============================================================================

const mockT = (key: string) => key;

const minimalScanProps = {
  t: mockT,
  theme: 'light' as const,
};

const mockUser = { uid: 'test-user-123' } as any;
const mockServices = { db: {}, appId: 'test-app' } as any;

function resetRenderTracker() {
  renderTracker.scanFeature = false;
  renderTracker.batchReviewFeature = false;
  renderTracker.categoriesFeature = false;
  renderTracker.creditFeature = false;
  renderTracker.modalManager = false;
}

// =============================================================================
// Tests
// =============================================================================

describe('FeatureOrchestrator', () => {
  beforeEach(() => {
    resetRenderTracker();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Basic Rendering
  // -------------------------------------------------------------------------

  describe('basic rendering', () => {
    it('should render without errors with minimal props', () => {
      expect(() =>
        render(
          <FeatureOrchestrator
            scanFeatureProps={minimalScanProps}
          />
        )
      ).not.toThrow();
    });

    it('should render ScanFeature', () => {
      render(
        <FeatureOrchestrator
          scanFeatureProps={minimalScanProps}
        />
      );

      expect(screen.getByTestId('scan-feature')).toBeInTheDocument();
      expect(renderTracker.scanFeature).toBe(true);
    });

    it('should render ModalManager by default', () => {
      render(
        <FeatureOrchestrator
          scanFeatureProps={minimalScanProps}
        />
      );

      expect(screen.getByTestId('modal-manager')).toBeInTheDocument();
      expect(renderTracker.modalManager).toBe(true);
    });

    it('should not render ModalManager when renderModalManager is false', () => {
      render(
        <FeatureOrchestrator
          scanFeatureProps={minimalScanProps}
          renderModalManager={false}
        />
      );

      expect(screen.queryByTestId('modal-manager')).not.toBeInTheDocument();
      expect(renderTracker.modalManager).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Optional Features
  // -------------------------------------------------------------------------

  describe('optional features', () => {
    it('should render CategoriesFeature when props provided', () => {
      render(
        <FeatureOrchestrator
          scanFeatureProps={minimalScanProps}
          categoriesFeatureProps={{
            user: mockUser,
            services: mockServices,
          }}
        />
      );

      expect(screen.getByTestId('categories-feature')).toBeInTheDocument();
      expect(renderTracker.categoriesFeature).toBe(true);
    });

    it('should not render CategoriesFeature when props not provided', () => {
      render(
        <FeatureOrchestrator
          scanFeatureProps={minimalScanProps}
        />
      );

      expect(screen.queryByTestId('categories-feature')).not.toBeInTheDocument();
      expect(renderTracker.categoriesFeature).toBe(false);
    });

    it('should render CreditFeature when props provided', () => {
      render(
        <FeatureOrchestrator
          scanFeatureProps={minimalScanProps}
          creditFeatureProps={{
            user: mockUser,
            services: mockServices,
            t: mockT,
          }}
        />
      );

      expect(screen.getByTestId('credit-feature')).toBeInTheDocument();
      expect(renderTracker.creditFeature).toBe(true);
    });

    it('should not render CreditFeature when props not provided', () => {
      render(
        <FeatureOrchestrator
          scanFeatureProps={minimalScanProps}
        />
      );

      expect(screen.queryByTestId('credit-feature')).not.toBeInTheDocument();
      expect(renderTracker.creditFeature).toBe(false);
    });

    it('should render BatchReviewFeature when props provided', () => {
      render(
        <FeatureOrchestrator
          scanFeatureProps={minimalScanProps}
          batchReviewFeatureProps={{
            t: mockT,
            theme: 'dark',
            currency: 'USD',
            formatCurrency: (amount: number) => `$${amount}`,
          }}
        />
      );

      expect(screen.getByTestId('batch-review-feature')).toBeInTheDocument();
      expect(renderTracker.batchReviewFeature).toBe(true);
    });

    it('should not render BatchReviewFeature when props not provided', () => {
      render(
        <FeatureOrchestrator
          scanFeatureProps={minimalScanProps}
        />
      );

      expect(screen.queryByTestId('batch-review-feature')).not.toBeInTheDocument();
      expect(renderTracker.batchReviewFeature).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // All Features
  // -------------------------------------------------------------------------

  describe('all features', () => {
    it('should render all features when all props provided', () => {
      render(
        <FeatureOrchestrator
          scanFeatureProps={minimalScanProps}
          batchReviewFeatureProps={{
            t: mockT,
            theme: 'light',
            currency: 'USD',
            formatCurrency: (amount: number) => `$${amount}`,
          }}
          categoriesFeatureProps={{
            user: mockUser,
            services: mockServices,
          }}
          creditFeatureProps={{
            user: mockUser,
            services: mockServices,
          }}
        />
      );

      // All features should be rendered
      expect(screen.getByTestId('scan-feature')).toBeInTheDocument();
      expect(screen.getByTestId('batch-review-feature')).toBeInTheDocument();
      expect(screen.getByTestId('categories-feature')).toBeInTheDocument();
      expect(screen.getByTestId('credit-feature')).toBeInTheDocument();
      expect(screen.getByTestId('modal-manager')).toBeInTheDocument();

      // All tracked
      expect(renderTracker.scanFeature).toBe(true);
      expect(renderTracker.batchReviewFeature).toBe(true);
      expect(renderTracker.categoriesFeature).toBe(true);
      expect(renderTracker.creditFeature).toBe(true);
      expect(renderTracker.modalManager).toBe(true);
    });

    it('should only render ModalManager once', () => {
      render(
        <FeatureOrchestrator
          scanFeatureProps={minimalScanProps}
          batchReviewFeatureProps={{
            t: mockT,
            theme: 'light',
            currency: 'USD',
            formatCurrency: (amount: number) => `$${amount}`,
          }}
        />
      );

      const modalManagers = screen.getAllByTestId('modal-manager');
      expect(modalManagers).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // Props Passing
  // -------------------------------------------------------------------------

  describe('props passing', () => {
    it('should pass theme to ScanFeature', () => {
      render(
        <FeatureOrchestrator
          scanFeatureProps={{
            ...minimalScanProps,
            theme: 'dark',
          }}
        />
      );

      const scanFeature = screen.getByTestId('scan-feature');
      expect(scanFeature).toHaveAttribute('data-theme', 'dark');
    });

    it('should pass theme to BatchReviewFeature', () => {
      render(
        <FeatureOrchestrator
          scanFeatureProps={minimalScanProps}
          batchReviewFeatureProps={{
            t: mockT,
            theme: 'dark',
            currency: 'USD',
            formatCurrency: (amount: number) => `$${amount}`,
          }}
        />
      );

      const batchFeature = screen.getByTestId('batch-review-feature');
      expect(batchFeature).toHaveAttribute('data-theme', 'dark');
    });

    it('should pass user to CategoriesFeature', () => {
      render(
        <FeatureOrchestrator
          scanFeatureProps={minimalScanProps}
          categoriesFeatureProps={{
            user: mockUser,
            services: mockServices,
          }}
        />
      );

      const categoriesFeature = screen.getByTestId('categories-feature');
      expect(categoriesFeature).toHaveAttribute('data-user-id', 'test-user-123');
    });

    it('should pass user to CreditFeature', () => {
      render(
        <FeatureOrchestrator
          scanFeatureProps={minimalScanProps}
          creditFeatureProps={{
            user: mockUser,
            services: mockServices,
          }}
        />
      );

      const creditFeature = screen.getByTestId('credit-feature');
      expect(creditFeature).toHaveAttribute('data-user-id', 'test-user-123');
    });
  });

  // -------------------------------------------------------------------------
  // Render Order
  // -------------------------------------------------------------------------

  describe('render order', () => {
    it('should render features in correct order (categories, credit, scan, batch, modal)', () => {
      const { container } = render(
        <FeatureOrchestrator
          scanFeatureProps={minimalScanProps}
          batchReviewFeatureProps={{
            t: mockT,
            theme: 'light',
            currency: 'USD',
            formatCurrency: (amount: number) => `$${amount}`,
          }}
          categoriesFeatureProps={{
            user: mockUser,
            services: mockServices,
          }}
          creditFeatureProps={{
            user: mockUser,
            services: mockServices,
          }}
        />
      );

      // Get all rendered test elements
      const elements = container.querySelectorAll('[data-testid]');
      const order = Array.from(elements).map(el => el.getAttribute('data-testid'));

      // Categories should be first, ModalManager should be last
      expect(order.indexOf('categories-feature')).toBeLessThan(order.indexOf('credit-feature'));
      expect(order.indexOf('credit-feature')).toBeLessThan(order.indexOf('scan-feature'));
      expect(order.indexOf('scan-feature')).toBeLessThan(order.indexOf('batch-review-feature'));
      expect(order.indexOf('batch-review-feature')).toBeLessThan(order.indexOf('modal-manager'));
    });
  });
});
