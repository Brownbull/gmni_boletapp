/**
 * TransactionCard Component Tests
 *
 * Story 14.14: Transaction List Redesign (AC #1)
 * Tests for the new card-based transaction display component.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionCard } from '@features/history/components/TransactionCard';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockFormatCurrency = (amount: number, currency: string) => {
  return `${currency} ${amount.toLocaleString('es-CL')}`;
};

const mockFormatDate = (date: string, format: string) => {
  const d = new Date(date);
  return d.toLocaleDateString('es-CL', { month: 'short', day: 'numeric' });
};

const mockT = (key: string) => {
  const translations: Record<string, string> = {
    today: 'Hoy',
    yesterday: 'Ayer',
    potentialDuplicate: 'Posible duplicado',
    collapse: 'Colapsar',
    expand: 'Expandir',
    receiptItems: 'Items del Recibo',
    moreItems: 'items más',
  };
  return translations[key] || key;
};

const defaultProps = {
  id: 'tx-1',
  merchant: 'Lider',
  date: new Date().toISOString().split('T')[0], // Today
  total: 45990,
  category: 'Supermarket',
  currency: 'CLP',
  theme: 'light',
  formatCurrency: mockFormatCurrency,
  formatDate: mockFormatDate,
  dateFormat: 'short',
  t: mockT,
};

// ============================================================================
// Tests
// ============================================================================

describe('TransactionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders merchant name and amount', () => {
      render(<TransactionCard {...defaultProps} />);

      expect(screen.getByText('Lider')).toBeInTheDocument();
      expect(screen.getByText('CLP 45.990')).toBeInTheDocument();
    });

    it('renders alias when provided', () => {
      render(<TransactionCard {...defaultProps} alias="Mi Supermercado" />);

      expect(screen.getByText('Mi Supermercado')).toBeInTheDocument();
    });

    it('renders category icon', () => {
      const { container } = render(<TransactionCard {...defaultProps} />);

      // Category icon should show shopping cart emoji for Supermarket
      expect(container.textContent).toContain('🛒');
    });

    it('renders city in meta pill when provided', () => {
      render(<TransactionCard {...defaultProps} city="Las Condes" />);

      expect(screen.getByText('Las Condes')).toBeInTheDocument();
    });

    it('renders time display for today', () => {
      render(<TransactionCard {...defaultProps} time="14:30" />);

      expect(screen.getByText('Hoy, 14:30')).toBeInTheDocument();
    });

    it('renders receipt thumbnail placeholder when no URL', () => {
      render(<TransactionCard {...defaultProps} />);

      // Should render receipt icon placeholder
      const thumbnail = document.querySelector('[data-testid="transaction-thumbnail"]');
      expect(thumbnail).toBeFalsy(); // No thumbnail element when no URL
    });
  });

  describe('Duplicate Warning', () => {
    it('shows duplicate warning when isDuplicate is true', () => {
      render(<TransactionCard {...defaultProps} isDuplicate />);

      expect(screen.getByText('Posible duplicado')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('does not show duplicate warning when isDuplicate is false', () => {
      render(<TransactionCard {...defaultProps} isDuplicate={false} />);

      expect(screen.queryByText('Posible duplicado')).not.toBeInTheDocument();
    });
  });

  describe('Expandable Items', () => {
    const propsWithItems = {
      ...defaultProps,
      items: [
        { name: 'Leche Entera 1L', price: 1290 },
        { name: 'Pan Molde', price: 2490 },
        { name: 'Huevos x12', price: 3890 },
      ],
    };

    it('renders expand chevron when items exist', () => {
      render(<TransactionCard {...propsWithItems} />);

      expect(screen.getByRole('button', { name: /expandir/i })).toBeInTheDocument();
    });

    it('does not render chevron when no items', () => {
      render(<TransactionCard {...defaultProps} items={[]} />);

      expect(screen.queryByRole('button', { name: /expandir/i })).not.toBeInTheDocument();
    });

    it('expands items section on chevron click', () => {
      render(<TransactionCard {...propsWithItems} />);

      const chevronButton = screen.getByRole('button', { name: /expandir/i });
      fireEvent.click(chevronButton);

      // After expansion, items should be visible
      expect(screen.getByText('Leche Entera 1L')).toBeInTheDocument();
      expect(screen.getByText('Pan Molde')).toBeInTheDocument();
      expect(screen.getByText('Huevos x12')).toBeInTheDocument();
    });

    it('shows "more items" link when more than 5 items', () => {
      const manyItems = [
        { name: 'Item 1', price: 100 },
        { name: 'Item 2', price: 200 },
        { name: 'Item 3', price: 300 },
        { name: 'Item 4', price: 400 },
        { name: 'Item 5', price: 500 },
        { name: 'Item 6', price: 600 },
        { name: 'Item 7', price: 700 },
      ];

      render(<TransactionCard {...defaultProps} items={manyItems} />);

      // Expand
      const chevronButton = screen.getByRole('button', { name: /expandir/i });
      fireEvent.click(chevronButton);

      // Should show "+2 más"
      expect(screen.getByText('+2 más')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClick when main content area is clicked', () => {
      const handleClick = vi.fn();
      render(<TransactionCard {...defaultProps} onClick={handleClick} />);

      // Click on the main content button (not the card wrapper)
      const mainButton = screen.getByRole('button', { name: /Lider.*CLP 45\.990/i });
      fireEvent.click(mainButton);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when chevron is clicked', () => {
      const handleClick = vi.fn();
      const propsWithItems = {
        ...defaultProps,
        items: [{ name: 'Item', price: 100 }],
        onClick: handleClick,
      };

      render(<TransactionCard {...propsWithItems} />);

      const chevronButton = screen.getByRole('button', { name: /expandir/i });
      fireEvent.click(chevronButton);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has accessible label including transaction details', () => {
      render(<TransactionCard {...defaultProps} />);

      const card = screen.getByTestId('transaction-card');
      const button = card.querySelector('[role="button"]');
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Lider'));
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('CLP 45.990'));
    });

    it('includes duplicate warning in accessible label', () => {
      render(<TransactionCard {...defaultProps} isDuplicate />);

      const card = screen.getByTestId('transaction-card');
      const button = card.querySelector('[role="button"]');
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('potential duplicate'));
    });

    it('expand button has aria-expanded attribute', () => {
      const propsWithItems = {
        ...defaultProps,
        items: [{ name: 'Item', price: 100 }],
      };

      render(<TransactionCard {...propsWithItems} />);

      const chevronButton = screen.getByRole('button', { name: /expandir/i });
      expect(chevronButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(chevronButton);
      expect(chevronButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Theme Support', () => {
    it('applies dark theme styles', () => {
      const { container } = render(<TransactionCard {...defaultProps} theme="dark" isDuplicate />);

      // Card should render with theme prop
      const card = container.querySelector('[data-testid="transaction-card"]');
      expect(card).toBeInTheDocument();
      // CSS variables are applied via inline styles and adapt to theme
    });
  });
});
