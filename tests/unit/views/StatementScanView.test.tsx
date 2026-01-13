/**
 * Unit Tests for StatementScanView Component
 *
 * Story 14d.9: Statement Scan Placeholder View
 *
 * Tests for the statement scan placeholder view that shows a "coming soon"
 * message when users select statement scanning from the mode selector.
 *
 * AC14: Unit tests for rendering
 * AC15: Unit tests for back button functionality
 * AC16: Snapshot test for visual consistency
 *
 * @see docs/sprint-artifacts/epic14d/stories/story-14d.9-statement-placeholder-view.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock ScanContext
const mockReset = vi.fn();
const mockScanContext = {
  state: { images: [], mode: 'statement' as const, phase: 'idle' as const },
  reset: mockReset,
  isIdle: true,
};

vi.mock('../../../src/contexts/ScanContext', () => ({
  useScan: vi.fn(() => mockScanContext),
}));

// Import after mocking
import { StatementScanView } from '../../../src/views/StatementScanView';
import { useScan } from '../../../src/contexts/ScanContext';

// Mock translation function
const t = (key: string) => {
  const translations: Record<string, string> = {
    back: 'Volver',
    statementScanTitle: 'Estado de Cuenta',
    comingSoon: 'Próximamente',
    statementScanDescription: 'Pronto podrás escanear estados de cuenta de tarjetas de crédito y añadir transacciones automáticamente.',
    returnToHome: 'Volver al inicio',
  };
  return translations[key] || key;
};

describe('StatementScanView Component', () => {
  const mockOnBack = vi.fn();

  const defaultProps = {
    theme: 'light' as const,
    t,
    onBack: mockOnBack,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC14: Rendering', () => {
    it('should render the view container with correct test ID', () => {
      render(<StatementScanView {...defaultProps} />);

      expect(screen.getByTestId('statement-scan-view')).toBeInTheDocument();
    });

    it('AC1: should render header with "Estado de Cuenta" title', () => {
      render(<StatementScanView {...defaultProps} />);

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveTextContent('Estado de Cuenta');
    });

    it('AC2: should render back button in header', () => {
      render(<StatementScanView {...defaultProps} />);

      const backButton = screen.getByTestId('back-button');
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveAttribute('aria-label', 'Volver');
    });

    it('AC3: should render credit card icon with violet theme', () => {
      render(<StatementScanView {...defaultProps} />);

      const iconContainer = screen.getByTestId('icon-container');
      expect(iconContainer).toBeInTheDocument();

      const icon = screen.getByTestId('credit-card-icon');
      expect(icon).toBeInTheDocument();
      // AC11: Violet color theme
      expect(icon).toHaveStyle({ color: '#8b5cf6' });
    });

    it('AC4: should render "Próximamente" heading', () => {
      render(<StatementScanView {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Próximamente');
    });

    it('AC5: should render explanatory text in Spanish', () => {
      render(<StatementScanView {...defaultProps} />);

      expect(screen.getByText(/Pronto podrás escanear estados de cuenta/i)).toBeInTheDocument();
      expect(screen.getByText(/tarjetas de crédito/i)).toBeInTheDocument();
    });

    it('AC6: should render "Volver al inicio" button', () => {
      render(<StatementScanView {...defaultProps} />);

      const returnButton = screen.getByTestId('return-button');
      expect(returnButton).toBeInTheDocument();
      expect(returnButton).toHaveTextContent('Volver al inicio');
    });

    it('AC11: should use violet color for icon and button', () => {
      render(<StatementScanView {...defaultProps} />);

      const returnButton = screen.getByTestId('return-button');
      // Violet background color
      expect(returnButton).toHaveStyle({ backgroundColor: '#8b5cf6' });
    });

    it('AC12: should have responsive layout with centered content', () => {
      render(<StatementScanView {...defaultProps} />);

      const main = screen.getByRole('main');
      expect(main).toHaveClass('flex-1', 'flex', 'flex-col', 'items-center', 'justify-center');
    });
  });

  describe('AC15: Back Button Functionality', () => {
    it('AC7: should call reset() and onBack() when back button is clicked', () => {
      render(<StatementScanView {...defaultProps} />);

      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);

      expect(mockReset).toHaveBeenCalledTimes(1);
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('AC8: should call reset() and onBack() when "Volver al inicio" button is clicked', () => {
      render(<StatementScanView {...defaultProps} />);

      const returnButton = screen.getByTestId('return-button');
      fireEvent.click(returnButton);

      expect(mockReset).toHaveBeenCalledTimes(1);
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('AC9: both buttons should trigger the same reset and navigation behavior', () => {
      render(<StatementScanView {...defaultProps} />);

      const backButton = screen.getByTestId('back-button');
      const returnButton = screen.getByTestId('return-button');

      fireEvent.click(backButton);
      fireEvent.click(returnButton);

      // Both clicks should call reset and onBack
      expect(mockReset).toHaveBeenCalledTimes(2);
      expect(mockOnBack).toHaveBeenCalledTimes(2);
    });
  });

  describe('Theme Support', () => {
    it('should render with light theme styling', () => {
      render(<StatementScanView {...defaultProps} theme="light" />);

      const view = screen.getByTestId('statement-scan-view');
      expect(view).toHaveStyle({ backgroundColor: '#f8fafc' });
    });

    it('should render with dark theme styling', () => {
      render(<StatementScanView {...defaultProps} theme="dark" />);

      const view = screen.getByTestId('statement-scan-view');
      // Dark theme uses CSS variable - check style attribute contains the variable reference
      expect(view).toHaveAttribute('style', expect.stringContaining('var(--bg)'));
    });
  });

  describe('AC16: Visual Consistency', () => {
    it('should match light theme snapshot', () => {
      const { container } = render(<StatementScanView {...defaultProps} theme="light" />);
      expect(container).toMatchSnapshot();
    });

    it('should match dark theme snapshot', () => {
      const { container } = render(<StatementScanView {...defaultProps} theme="dark" />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<StatementScanView {...defaultProps} />);

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });

      expect(h1).toBeInTheDocument();
      expect(h2).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      render(<StatementScanView {...defaultProps} />);

      const backButton = screen.getByTestId('back-button');
      expect(backButton).toHaveAttribute('aria-label', 'Volver');
    });

    // M2 Fix: Test keyboard focus accessibility
    it('should show focus styles on back button when focused', () => {
      render(<StatementScanView {...defaultProps} theme="light" />);

      const backButton = screen.getByTestId('back-button');

      // Initially transparent
      expect(backButton).toHaveStyle({ backgroundColor: 'transparent' });

      // Focus should change background
      fireEvent.focus(backButton);
      expect(backButton).toHaveStyle({ backgroundColor: '#f1f5f9' });

      // Blur should reset
      fireEvent.blur(backButton);
      expect(backButton).toHaveStyle({ backgroundColor: 'transparent' });
    });

    it('should show focus styles on return button when focused', () => {
      render(<StatementScanView {...defaultProps} />);

      const returnButton = screen.getByTestId('return-button');

      // Initially violet
      expect(returnButton).toHaveStyle({ backgroundColor: '#8b5cf6' });

      // Focus should darken
      fireEvent.focus(returnButton);
      expect(returnButton).toHaveStyle({ backgroundColor: '#7c3aed' });

      // Blur should reset
      fireEvent.blur(returnButton);
      expect(returnButton).toHaveStyle({ backgroundColor: '#8b5cf6' });
    });
  });

  describe('Safe Area Support (L1 Fix)', () => {
    // Note: JSDOM strips env() CSS functions, so we verify safe area support
    // via code inspection rather than runtime testing. The component includes:
    // - paddingTop: 'env(safe-area-inset-top, 0px)' on the view container
    // - paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' on main

    it('should render view and main elements for safe area styling', () => {
      render(<StatementScanView {...defaultProps} />);

      // Verify the elements that receive safe area styling are rendered
      const view = screen.getByTestId('statement-scan-view');
      expect(view).toBeInTheDocument();

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();

      // The actual env() values are stripped by JSDOM, but the code includes them.
      // Manual verification: src/views/StatementScanView.tsx lines 70-71, 104-105
    });
  });

  describe('Translation Support', () => {
    it('should use translation keys for all text', () => {
      const customT = vi.fn((key: string) => `translated:${key}`);
      render(<StatementScanView {...defaultProps} t={customT} />);

      // Verify translation function is called for the expected keys
      expect(customT).toHaveBeenCalledWith('statementScanTitle');
      expect(customT).toHaveBeenCalledWith('back');
      expect(customT).toHaveBeenCalledWith('comingSoon');
      expect(customT).toHaveBeenCalledWith('statementScanDescription');
      expect(customT).toHaveBeenCalledWith('returnToHome');
    });
  });
});
