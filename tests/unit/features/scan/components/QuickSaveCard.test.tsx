/**
 * Tests for QuickSaveCard component
 *
 * Story 11.2: Quick Save Card Component
 * Story 14.4: Quick Save Path (Animations)
 * Tests the quick save UI, button actions, accessibility, and animations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QuickSaveCard } from '../../../../src/components/scan/QuickSaveCard';
import type { Transaction } from '../../../../src/types/transaction';

// Mock useReducedMotion hook
vi.mock('../../../../src/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

import { useReducedMotion } from '../../../../src/hooks/useReducedMotion';

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
    saved: '¡Guardado!',
    category_Supermarket: 'Supermercado',
    // Story 11.2: Items detected text
    itemsDetected: 'detectados',
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
      // Story 14.15: Item count shows "X Items detectados"
      expect(screen.getByText(/3 Items/i)).toBeInTheDocument();
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

    it('calls onCancel when cancel confirmation is accepted', () => {
      // Story 14.15: Cancel button now shows confirmation dialog (credit warning)
      renderCard();
      // First click shows confirmation dialog - use test id for specificity
      const cancelButton = screen.getByTestId('quick-save-cancel-button');
      fireEvent.click(cancelButton);
      // Then confirm by clicking the discard button (text comes from t('cancelAnyway'))
      const confirmButton = screen.getByText(/cancelAnyway/i);
      fireEvent.click(confirmButton);
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
    it('uses CSS variable for background in dark mode', () => {
      renderCard({ theme: 'dark' });
      const dialog = screen.getByRole('dialog');
      const card = dialog.querySelector('div > div') as HTMLElement;
      // Story 14.15: Component now uses CSS variables instead of hardcoded colors
      // The card uses var(--bg-secondary) which is theme-aware
      expect(card?.className).toContain('rounded-3xl');
      // Check that the style attribute contains the CSS variable
      expect(card?.style.backgroundColor).toBe('var(--bg-secondary)');
    });

    it('uses CSS variable for background in light mode', () => {
      renderCard({ theme: 'light' });
      const dialog = screen.getByRole('dialog');
      const card = dialog.querySelector('div > div') as HTMLElement;
      // Story 14.15: Component now uses CSS variables instead of hardcoded colors
      expect(card?.className).toContain('rounded-3xl');
      // Same CSS variable is used - theme determines actual color
      expect(card?.style.backgroundColor).toBe('var(--bg-secondary)');
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
      // Story 11.2: Items section is hidden when there are no items
      // The card should still render (showing merchant, category, total)
      expect(screen.getByText(mockTransaction.alias!)).toBeInTheDocument();
      // But the items section should not be visible
      expect(screen.queryByText(/Items detectados/)).not.toBeInTheDocument();
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

  // Story 14.34: Currency Formatting Tests
  describe('Story 14.34: currency handling', () => {
    it('uses transaction.currency when available (foreign receipt scenario)', () => {
      // Mock formatCurrency that verifies the correct currency is passed
      const mockFormatCurrencyWithTracking = vi.fn((amount: number, curr: string) => {
        // This simulates the real formatCurrency behavior
        if (curr === 'USD') {
          return `$${(amount / 100).toFixed(2)}`; // Convert cents to dollars
        }
        return `$${amount.toLocaleString()}`; // CLP doesn't divide
      });

      renderCard({
        transaction: { ...mockTransaction, total: 1899, currency: 'USD' },
        currency: 'CLP', // User's default is CLP
        formatCurrency: mockFormatCurrencyWithTracking,
      });

      // Verify formatCurrency was called with USD (transaction currency), not CLP (default)
      expect(mockFormatCurrencyWithTracking).toHaveBeenCalledWith(1899, 'USD');
      // Display should show formatted USD amount
      expect(screen.getByText('$18.99')).toBeInTheDocument();
    });

    it('falls back to prop currency when transaction.currency is undefined', () => {
      const mockFormatCurrencyWithTracking = vi.fn((amount: number, _curr: string) => {
        return `$${amount.toLocaleString()}`;
      });

      renderCard({
        transaction: { ...mockTransaction, total: 25000, currency: undefined },
        currency: 'CLP',
        formatCurrency: mockFormatCurrencyWithTracking,
      });

      // Verify formatCurrency was called with CLP (fallback)
      expect(mockFormatCurrencyWithTracking).toHaveBeenCalledWith(25000, 'CLP');
    });

    it('displays correct currency indicator for foreign currency', () => {
      renderCard({
        transaction: { ...mockTransaction, total: 1899, currency: 'USD' },
        currency: 'CLP',
      });

      // Currency indicator should show USD, not CLP
      expect(screen.getByText('USD')).toBeInTheDocument();
    });

    it('displays peso symbol for CLP transactions', () => {
      renderCard({
        transaction: { ...mockTransaction, total: 25000, currency: 'CLP' },
        currency: 'CLP',
      });

      // CLP should display as "$" not "CLP"
      // Note: The component shows "$" for CLP and the code for other currencies
      const currencyIndicators = screen.getAllByText('$');
      expect(currencyIndicators.length).toBeGreaterThan(0);
    });
  });

  // Story 14.4: Animation Tests
  describe('Story 14.4: animations', () => {
    beforeEach(() => {
      // Reset mock to default (motion enabled)
      vi.mocked(useReducedMotion).mockReturnValue(false);
    });

    it('shows success state after save completes (AC #2)', async () => {
      const onSaveComplete = vi.fn();
      renderCard({ onSaveComplete });

      // Click save button - wrap in act to handle async state updates
      await act(async () => {
        const saveButton = screen.getByTestId('quick-save-button');
        fireEvent.click(saveButton);
      });

      // Wait for onSave to resolve and success state to appear
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(screen.getByTestId('quick-save-success')).toBeInTheDocument();
      });

      // Success text should be visible
      expect(screen.getByText('¡Guardado!')).toBeInTheDocument();
    });

    it('hides action buttons when showing success state', async () => {
      renderCard();

      // Click save - wrap in act to handle async state updates
      await act(async () => {
        const saveButton = screen.getByTestId('quick-save-button');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('quick-save-success')).toBeInTheDocument();
      });

      // Action buttons should be hidden
      expect(screen.queryByTestId('quick-save-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('quick-save-edit-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('quick-save-cancel-button')).not.toBeInTheDocument();
    });

    it('calls onSaveComplete after success animation (AC #5)', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const onSaveComplete = vi.fn();
      renderCard({ onSaveComplete });

      // Click save - wrap in act to handle async state updates
      await act(async () => {
        const saveButton = screen.getByTestId('quick-save-button');
        fireEvent.click(saveButton);
      });

      // Wait for save to complete and success state
      await vi.waitFor(() => {
        expect(screen.getByTestId('quick-save-success')).toBeInTheDocument();
      });

      // Advance timers for animation duration (DURATION.SLOWER = 400ms)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });

      // onSaveComplete should have been called
      expect(onSaveComplete).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('disables edit and cancel buttons during save animation', async () => {
      // Make onSave return a pending promise
      let resolvePromise: () => void;
      onSave.mockImplementation(() => new Promise(resolve => {
        resolvePromise = resolve;
      }));

      renderCard();

      // Click save without awaiting - we want to check the intermediate state
      const saveButton = screen.getByTestId('quick-save-button');
      fireEvent.click(saveButton);

      // While saving, buttons should be disabled
      const editButton = screen.getByTestId('quick-save-edit-button');
      const cancelButton = screen.getByTestId('quick-save-cancel-button');

      expect(editButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();

      // Cleanup - resolve the promise inside act to avoid warnings
      await act(async () => {
        resolvePromise!();
      });
    });

    it('applies entry animation when isEntering is true', () => {
      renderCard({ isEntering: true });

      // Dialog should be present
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });

  // Story 14.4: Reduced Motion Tests
  describe('Story 14.4: reduced motion support (AC #6)', () => {
    beforeEach(() => {
      // Enable reduced motion
      vi.mocked(useReducedMotion).mockReturnValue(true);
    });

    afterEach(() => {
      vi.mocked(useReducedMotion).mockReturnValue(false);
    });

    it('skips animations when prefers-reduced-motion is enabled', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const onSaveComplete = vi.fn();
      renderCard({ onSaveComplete });

      // Click save - wrap in act to handle async state updates
      await act(async () => {
        const saveButton = screen.getByTestId('quick-save-button');
        fireEvent.click(saveButton);
      });

      await vi.waitFor(() => {
        expect(screen.getByTestId('quick-save-success')).toBeInTheDocument();
      });

      // With reduced motion, onSaveComplete should be called with 0ms delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10);
      });

      expect(onSaveComplete).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('shows content immediately without entry animation', () => {
      renderCard({ isEntering: true });

      // Dialog should be visible immediately (reduced motion skips entry animation)
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('opacity-100');
    });
  });
});
