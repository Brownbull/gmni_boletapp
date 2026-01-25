/**
 * CreditInfoModal Component Tests
 *
 * Story 14e-4: Unit tests for the CreditInfoModal component.
 * Tests rendering, accessibility, close handling, and props display.
 *
 * Note: Tests use lang='en' to test English fallbacks. Default lang is 'es' (Spanish)
 * per Chilean fintech standards.
 *
 * @module tests/components/modals/CreditInfoModal.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreditInfoModal } from '../../../../src/components/modals/CreditInfoModal';

describe('CreditInfoModal', () => {
  // Use lang='en' for tests to verify English fallback text
  const defaultProps = {
    normalCredits: 10,
    superCredits: 5,
    onClose: vi.fn(),
    lang: 'en' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the modal with correct structure', () => {
      render(<CreditInfoModal {...defaultProps} />);

      // Check modal container exists with proper accessibility attributes
      const modal = screen.getByTestId('credit-info-modal');
      expect(modal).toHaveAttribute('role', 'dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'credit-info-title');
    });

    it('renders the title in English when lang=en', () => {
      render(<CreditInfoModal {...defaultProps} />);

      expect(screen.getByText('Your Credits')).toBeInTheDocument();
    });

    it('renders the title in Spanish when lang=es (default)', () => {
      render(<CreditInfoModal {...defaultProps} lang="es" />);

      expect(screen.getByText('Tus Créditos')).toBeInTheDocument();
    });

    it('displays normal credits value correctly', () => {
      render(<CreditInfoModal {...defaultProps} />);

      const normalCreditsValue = screen.getByTestId('normal-credits-value');
      expect(normalCreditsValue).toHaveTextContent('10');
    });

    it('displays super credits value correctly', () => {
      render(<CreditInfoModal {...defaultProps} />);

      const superCreditsValue = screen.getByTestId('super-credits-value');
      expect(superCreditsValue).toHaveTextContent('5');
    });

    it('displays normal credits section with label and description in English', () => {
      render(<CreditInfoModal {...defaultProps} />);

      expect(screen.getByText('Normal Credits')).toBeInTheDocument();
      expect(screen.getByText('Single receipt scans')).toBeInTheDocument();
    });

    it('displays normal credits section with label and description in Spanish', () => {
      render(<CreditInfoModal {...defaultProps} lang="es" />);

      expect(screen.getByText('Créditos Normales')).toBeInTheDocument();
      expect(screen.getByText('Escaneos de boletas individuales')).toBeInTheDocument();
    });

    it('displays super credits section with label and description in English', () => {
      render(<CreditInfoModal {...defaultProps} />);

      expect(screen.getByText('Super Credits')).toBeInTheDocument();
      expect(screen.getByText('Batch processing (up to 10 receipts)')).toBeInTheDocument();
    });

    it('displays super credits section with label and description in Spanish', () => {
      render(<CreditInfoModal {...defaultProps} lang="es" />);

      expect(screen.getByText('Súper Créditos')).toBeInTheDocument();
      expect(screen.getByText('Procesamiento por lote (hasta 10 boletas)')).toBeInTheDocument();
    });

    it('renders with different credit values', () => {
      const { rerender } = render(
        <CreditInfoModal normalCredits={100} superCredits={25} onClose={vi.fn()} lang="en" />
      );

      expect(screen.getByTestId('normal-credits-value')).toHaveTextContent('100');
      expect(screen.getByTestId('super-credits-value')).toHaveTextContent('25');

      // Rerender with zero credits
      rerender(<CreditInfoModal normalCredits={0} superCredits={0} onClose={vi.fn()} lang="en" />);

      expect(screen.getByTestId('normal-credits-value')).toHaveTextContent('0');
      expect(screen.getByTestId('super-credits-value')).toHaveTextContent('0');
    });
  });

  describe('Close Button Functionality', () => {
    it('calls onClose when X button is clicked', async () => {
      const onClose = vi.fn();
      render(<CreditInfoModal {...defaultProps} onClose={onClose} />);

      const closeXButton = screen.getByTestId('credit-info-close-x');
      await userEvent.click(closeXButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Close button at bottom is clicked', async () => {
      const onClose = vi.fn();
      render(<CreditInfoModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByTestId('credit-info-close-button');
      await userEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Backdrop Click', () => {
    it('calls onClose when backdrop is clicked', async () => {
      const onClose = vi.fn();
      render(<CreditInfoModal {...defaultProps} onClose={onClose} />);

      const backdrop = screen.getByTestId('credit-info-backdrop');
      await userEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when modal content is clicked', async () => {
      const onClose = vi.fn();
      render(<CreditInfoModal {...defaultProps} onClose={onClose} />);

      const content = screen.getByTestId('credit-info-content');
      await userEvent.click(content);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Escape Key', () => {
    it('calls onClose when Escape key is pressed', () => {
      const onClose = vi.fn();
      render(<CreditInfoModal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose for other keys', () => {
      const onClose = vi.fn();
      render(<CreditInfoModal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Tab' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Purchase Button', () => {
    it('does not render purchase button when onPurchase is not provided', () => {
      render(<CreditInfoModal {...defaultProps} />);

      expect(screen.queryByTestId('credit-info-purchase')).not.toBeInTheDocument();
    });

    it('renders purchase button when onPurchase is provided (English)', () => {
      const onPurchase = vi.fn();
      render(<CreditInfoModal {...defaultProps} onPurchase={onPurchase} />);

      const purchaseButton = screen.getByTestId('credit-info-purchase');
      expect(purchaseButton).toBeInTheDocument();
      expect(purchaseButton).toHaveTextContent('Get More Credits');
    });

    it('renders purchase button when onPurchase is provided (Spanish)', () => {
      const onPurchase = vi.fn();
      render(<CreditInfoModal {...defaultProps} lang="es" onPurchase={onPurchase} />);

      const purchaseButton = screen.getByTestId('credit-info-purchase');
      expect(purchaseButton).toBeInTheDocument();
      expect(purchaseButton).toHaveTextContent('Obtener Más Créditos');
    });

    it('calls onPurchase when purchase button is clicked', async () => {
      const onPurchase = vi.fn();
      render(<CreditInfoModal {...defaultProps} onPurchase={onPurchase} />);

      const purchaseButton = screen.getByTestId('credit-info-purchase');
      await userEvent.click(purchaseButton);

      expect(onPurchase).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<CreditInfoModal {...defaultProps} />);

      const modal = screen.getByTestId('credit-info-modal');
      expect(modal).toHaveAttribute('role', 'dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'credit-info-title');
    });

    it('has accessible close button with aria-label (English)', () => {
      render(<CreditInfoModal {...defaultProps} />);

      const closeXButton = screen.getByTestId('credit-info-close-x');
      expect(closeXButton).toHaveAttribute('aria-label', 'Close');
    });

    it('has accessible close button with aria-label (Spanish)', () => {
      render(<CreditInfoModal {...defaultProps} lang="es" />);

      const closeXButton = screen.getByTestId('credit-info-close-x');
      expect(closeXButton).toHaveAttribute('aria-label', 'Cerrar');
    });

    it('backdrop has aria-hidden attribute', () => {
      render(<CreditInfoModal {...defaultProps} />);

      const backdrop = screen.getByTestId('credit-info-backdrop');
      expect(backdrop).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Translation function', () => {
    it('uses t() translations when provided', () => {
      const mockT = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          creditInfoTitle: 'Custom Title',
          normalCredits: 'Custom Normal',
          superCredits: 'Custom Super',
        };
        return translations[key] || '';
      });

      render(<CreditInfoModal {...defaultProps} t={mockT} />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom Normal')).toBeInTheDocument();
      expect(screen.getByText('Custom Super')).toBeInTheDocument();
    });
  });
});
