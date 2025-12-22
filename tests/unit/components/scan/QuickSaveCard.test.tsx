/**
 * Tests for QuickSaveCard component
 *
 * Story 11.2: Quick Save Card Component
 * Tests the quick save UI, button actions, and accessibility.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickSaveCard } from '../../../../src/components/scan/QuickSaveCard';
import type { Transaction } from '../../../../src/types/transaction';

// Mock transaction for testing
const mockTransaction: Transaction = {
  merchant: 'Test Supermarket',
  alias: 'My Supermarket',
  date: '2024-01-15',
  total: 25000,
  category: 'Supermarket',
  items: [
    { name: 'Milk', price: 5000, qty: 2 },
    { name: 'Bread', price: 3000, qty: 1 },
    { name: 'Eggs', price: 7000, qty: 1 },
  ],
};

// Mock translation function
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    quickSave: 'Guardar',
    editTrans: 'Editar',
    cancel: 'Cancelar',
    items: 'items',
    unknown: 'Desconocido',
    confidence: 'confidence',
    saving: 'Guardando...',
    category_Supermarket: 'Supermercado',
  };
  return translations[key] || key;
};

// Mock format currency function
const mockFormatCurrency = (amount: number, _currency: string) => {
  return `$${amount.toLocaleString()}`;
};

describe('QuickSaveCard', () => {
  let onSave: ReturnType<typeof vi.fn>;
  let onEdit: ReturnType<typeof vi.fn>;
  let onCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSave = vi.fn().mockResolvedValue(undefined);
    onEdit = vi.fn();
    onCancel = vi.fn();
  });

  const renderCard = (props: Partial<React.ComponentProps<typeof QuickSaveCard>> = {}) => {
    return render(
      <QuickSaveCard
        transaction={mockTransaction}
        confidence={0.92}
        onSave={onSave}
        onEdit={onEdit}
        onCancel={onCancel}
        theme="light"
        t={mockT}
        formatCurrency={mockFormatCurrency}
        currency="CLP"
        {...props}
      />
    );
  };

  describe('renders correctly', () => {
    it('displays merchant name (alias preferred)', () => {
      renderCard();
      expect(screen.getByText('My Supermarket')).toBeInTheDocument();
    });

    it('displays merchant when alias is not available', () => {
      renderCard({
        transaction: { ...mockTransaction, alias: undefined },
      });
      expect(screen.getByText('Test Supermarket')).toBeInTheDocument();
    });

    it('displays formatted total amount', () => {
      renderCard();
      expect(screen.getByText('$25,000')).toBeInTheDocument();
    });

    it('displays item count', () => {
      renderCard();
      expect(screen.getByText(/3 items/)).toBeInTheDocument();
    });

    it('displays singular item for 1 item', () => {
      renderCard({
        transaction: { ...mockTransaction, items: [{ name: 'Single', price: 100 }] },
      });
      // The component removes 's' from "items" for singular - "item"
      expect(screen.getByText(/1 item/i)).toBeInTheDocument();
    });

    it('displays category emoji', () => {
      renderCard();
      // Supermarket emoji
      const emoji = screen.getByRole('img', { name: 'Supermarket' });
      expect(emoji).toBeInTheDocument();
      expect(emoji.textContent).toBe('🛒');
    });

    it('displays confidence percentage', () => {
      renderCard({ confidence: 0.92 });
      expect(screen.getByText(/92%/)).toBeInTheDocument();
    });

    it('displays Guardar button', () => {
      renderCard();
      expect(screen.getByRole('button', { name: /Guardar/i })).toBeInTheDocument();
    });

    it('displays Editar button', () => {
      renderCard();
      expect(screen.getByRole('button', { name: /Editar/i })).toBeInTheDocument();
    });

    it('displays Cancelar link', () => {
      renderCard();
      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
    });
  });

  describe('button actions', () => {
    it('calls onSave when Guardar is clicked', async () => {
      renderCard();
      const saveButton = screen.getByRole('button', { name: /Guardar/i });
      fireEvent.click(saveButton);
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onEdit when Editar is clicked', () => {
      renderCard();
      const editButton = screen.getByRole('button', { name: /Editar/i });
      fireEvent.click(editButton);
      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when Cancelar is clicked', () => {
      renderCard();
      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      fireEvent.click(cancelButton);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('saving state', () => {
    it('shows saving text when isSaving is true', () => {
      renderCard({ isSaving: true });
      expect(screen.getByText('Guardando...')).toBeInTheDocument();
    });

    it('disables buttons when isSaving is true', () => {
      renderCard({ isSaving: true });

      // Find buttons - the save button still has aria-label="Guardar" even when showing saving text
      const saveButton = screen.getByRole('button', { name: /Guardar/i });
      const editButton = screen.getByRole('button', { name: /Editar/i });
      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });

      expect(saveButton).toBeDisabled();
      expect(editButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('does not call onSave when already saving', async () => {
      renderCard({ isSaving: true });
      // The button still has aria-label="Guardar" even when showing "Guardando..." text
      const saveButton = screen.getByRole('button', { name: /Guardar/i });
      fireEvent.click(saveButton);
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has correct dialog role', () => {
      renderCard();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal attribute', () => {
      renderCard();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby pointing to title', () => {
      renderCard();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'quick-save-title');
    });

    it('has focusable buttons with aria-labels', () => {
      renderCard();
      const saveButton = screen.getByRole('button', { name: /Guardar/i });
      const editButton = screen.getByRole('button', { name: /Editar/i });
      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });

      expect(saveButton).toHaveAttribute('aria-label');
      expect(editButton).toHaveAttribute('aria-label');
      expect(cancelButton).toHaveAttribute('aria-label');
    });
  });

  describe('dark mode', () => {
    it('applies dark mode styles when theme is dark', () => {
      renderCard({ theme: 'dark' });
      const dialog = screen.getByRole('dialog');
      const card = dialog.querySelector('div > div');
      expect(card?.className).toContain('bg-slate-800');
    });

    it('applies light mode styles when theme is light', () => {
      renderCard({ theme: 'light' });
      const dialog = screen.getByRole('dialog');
      const card = dialog.querySelector('div > div');
      expect(card?.className).toContain('bg-white');
    });
  });

  describe('edge cases', () => {
    it('handles transaction with 0 total', () => {
      renderCard({
        transaction: { ...mockTransaction, total: 0 },
      });
      expect(screen.getByText('$0')).toBeInTheDocument();
    });

    it('handles transaction with no items', () => {
      renderCard({
        transaction: { ...mockTransaction, items: [] },
      });
      expect(screen.getByText(/0 items/)).toBeInTheDocument();
    });

    it('handles "Other" category', () => {
      renderCard({
        transaction: { ...mockTransaction, category: 'Other' },
      });
      // Other category should show default box emoji
      const emoji = screen.getByRole('img', { name: 'Other' });
      expect(emoji.textContent).toBe('📦');
    });

    it('handles unknown merchant with fallback', () => {
      renderCard({
        transaction: { ...mockTransaction, merchant: '', alias: undefined },
      });
      expect(screen.getByText('Desconocido')).toBeInTheDocument();
    });
  });
});
