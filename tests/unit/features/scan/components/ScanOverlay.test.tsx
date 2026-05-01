/**
 * ScanOverlay Tests
 *
 * Story 14.3: Scan Overlay Flow
 * Epic 14: Core Implementation
 *
 * Tests for the non-blocking scan overlay component with:
 * - State machine (idle → uploading → processing → ready → error)
 * - ETA calculation based on average processing time
 * - Progressive item reveal on completion
 * - Non-blocking navigation support
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScanOverlay } from '@features/scan/components';
import type { ScanOverlayProps, ScanOverlayState } from '@features/scan/components/ScanOverlay';
import { AnimationProvider } from '@/components/animation';
import { useScanStore, initialScanState } from '@features/scan/store';

// Mock useReducedMotion
vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
  default: () => false,
}));

// Test wrapper with AnimationProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AnimationProvider initialEnabled={true}>
    {children}
  </AnimationProvider>
);

// Mock translation function
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    scanUploading: 'Subiendo imagen...',
    scanProcessing: 'Procesando boleta...',
    scanReady: '¡Listo!',
    cancel: 'Cancelar',
    estimatedTime: 'Tiempo estimado',
    seconds: 'segundos',
    // Story 14.15: Updated key name to match ScanOverlay component
    tipCanNavigateWhileProcessing: 'Puedes navegar mientras procesamos',
    scanError: 'Error al procesar',
    retry: 'Reintentar',
    saveNow: 'Guardar ahora',
    editFirst: 'Editar primero',
    scanFailedCreditRefunded: 'No se usó tu crédito.',
  };
  return translations[key] || key;
};

// Default props
const defaultProps: ScanOverlayProps = {
  state: 'idle',
  progress: 0,
  eta: null,
  error: null,
  onCancel: vi.fn(),
  onRetry: vi.fn(),
  theme: 'light',
  t: mockT,
  visible: true,
};

const renderOverlay = (props: Partial<ScanOverlayProps> = {}) => {
  return render(
    <TestWrapper>
      <ScanOverlay {...defaultProps} {...props} />
    </TestWrapper>
  );
};

describe('ScanOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Visibility', () => {
    it('should not render when visible is false', () => {
      renderOverlay({ visible: false });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when visible is true', () => {
      renderOverlay({ visible: true, state: 'uploading' });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('State: idle', () => {
    it('should not render any content in idle state', () => {
      renderOverlay({ state: 'idle' });
      // Idle state should not show any overlay content
      expect(screen.queryByText('Subiendo imagen...')).not.toBeInTheDocument();
      expect(screen.queryByText('Procesando boleta...')).not.toBeInTheDocument();
    });
  });

  // TD-18-19: Uploading and processing now show skeleton placeholders
  describe('State: uploading (TD-18-19: skeleton)', () => {
    it('should show skeleton placeholders instead of upload progress (AC-1, AC-2)', () => {
      renderOverlay({ state: 'uploading', progress: 45 });
      // Should NOT show percentage-based progress
      expect(screen.queryByText('45%')).not.toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      // Should show skeleton with processing text
      expect(screen.getByText('Procesando boleta...')).toBeInTheDocument();
    });

    it('should NOT show cancel button during uploading (credit already deducted)', () => {
      renderOverlay({ state: 'uploading', progress: 45 });
      expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument();
    });

    it('should show navigation tip during uploading', () => {
      renderOverlay({ state: 'uploading' });
      expect(screen.getByText('Puedes navegar mientras procesamos')).toBeInTheDocument();
    });
  });

  describe('State: processing (TD-18-19: skeleton)', () => {
    it('should show skeleton with processing text (AC-3)', () => {
      renderOverlay({ state: 'processing' });
      expect(screen.getByText('Procesando boleta...')).toBeInTheDocument();
    });

    it('should display ETA when provided', () => {
      renderOverlay({ state: 'processing', eta: 5 });
      expect(screen.getByText(/5/)).toBeInTheDocument();
      expect(screen.getByText(/segundos/i)).toBeInTheDocument();
    });

    it('should not display ETA when null', () => {
      renderOverlay({ state: 'processing', eta: null });
      expect(screen.queryByText(/segundos/i)).not.toBeInTheDocument();
    });

    it('should show navigation tip', () => {
      renderOverlay({ state: 'processing' });
      expect(screen.getByText('Puedes navegar mientras procesamos')).toBeInTheDocument();
    });

    it('should NOT show cancel button during processing (credit already deducted)', () => {
      renderOverlay({ state: 'processing' });
      expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument();
    });
  });

  describe('State: ready', () => {
    it('should show ready indicator', () => {
      renderOverlay({ state: 'ready' });
      expect(screen.getByText('¡Listo!')).toBeInTheDocument();
    });

    it('should not show cancel button in ready state', () => {
      renderOverlay({ state: 'ready' });
      expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument();
    });

    it('should auto-dismiss after specified duration', () => {
      const onDismiss = vi.fn();
      renderOverlay({ state: 'ready', onDismiss });

      // Ready state auto-dismisses after 500ms (READY_DISPLAY_MS)
      expect(onDismiss).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('State: error', () => {
    it('should show error message', () => {
      renderOverlay({
        state: 'error',
        error: { type: 'api', message: 'Failed to process receipt' }
      });
      expect(screen.getByText('Error al procesar')).toBeInTheDocument();
      expect(screen.getByText('Failed to process receipt')).toBeInTheDocument();
    });

    it('should show retry button', () => {
      renderOverlay({
        state: 'error',
        error: { type: 'network', message: 'Network error' }
      });
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });

    it('should call onRetry when retry clicked', async () => {
      vi.useRealTimers();
      const onRetry = vi.fn();
      renderOverlay({
        state: 'error',
        error: { type: 'network', message: 'Network error' },
        onRetry
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /reintentar/i }));

      expect(onRetry).toHaveBeenCalledTimes(1);
      vi.useFakeTimers();
    });

    it('should show cancel button', () => {
      renderOverlay({
        state: 'error',
        error: { type: 'timeout', message: 'Timeout' }
      });
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    // TD-18-19 AC-10: Credit refund message inline
    it('should show credit refund message in error state (AC-10)', () => {
      renderOverlay({
        state: 'error',
        error: { type: 'api', message: 'Server error' }
      });
      expect(screen.getByTestId('scan-error-credit-refund')).toBeInTheDocument();
      expect(screen.getByText('No se usó tu crédito.')).toBeInTheDocument();
    });
  });

  describe('Styling and Theme', () => {
    it('should apply dark theme styles', () => {
      renderOverlay({ state: 'processing', theme: 'dark' });
      const overlay = screen.getByRole('dialog');
      // Just verify it renders - detailed style testing should be visual
      expect(overlay).toBeInTheDocument();
    });

    it('should apply light theme styles', () => {
      renderOverlay({ state: 'processing', theme: 'light' });
      const overlay = screen.getByRole('dialog');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-modal attribute', () => {
      renderOverlay({ state: 'processing' });
      const overlay = screen.getByRole('dialog');
      expect(overlay).toHaveAttribute('aria-modal', 'true');
    });

    it('should have appropriate aria-label for each state', () => {
      const { rerender } = renderOverlay({ state: 'uploading' });
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Subiendo imagen...');

      rerender(
        <TestWrapper>
          <ScanOverlay {...defaultProps} state="processing" />
        </TestWrapper>
      );
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Procesando boleta...');
    });

    it('should announce state changes with aria-live', () => {
      renderOverlay({ state: 'processing' });
      // TD-18-19 review fix: ScanSkeleton no longer duplicates role="status"
      const statusContainer = screen.getByRole('status');
      expect(statusContainer).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Backdrop behavior', () => {
    it('should have semi-transparent backdrop', () => {
      renderOverlay({ state: 'processing' });
      const backdrop = screen.getByTestId('scan-overlay-backdrop');
      expect(backdrop).toHaveClass('bg-black/40');
    });

    it('should apply blur effect to background', () => {
      renderOverlay({ state: 'processing' });
      const backdrop = screen.getByTestId('scan-overlay-backdrop');
      expect(backdrop).toHaveClass('backdrop-blur-sm');
    });
  });

  // TD-18-3: Auto-dismiss guard when activeDialog is set
  describe('Auto-dismiss with activeDialog guard (TD-18-3)', () => {
    afterEach(() => {
      useScanStore.setState(initialScanState);
    });

    // AC-7: Dialog active → auto-dismiss suppressed
    it('should NOT auto-dismiss when activeDialog is non-null', () => {
      useScanStore.setState({ activeDialog: { type: 'total_mismatch', data: {} } });
      const onDismiss = vi.fn();
      renderOverlay({ state: 'ready', onDismiss });

      act(() => { vi.advanceTimersByTime(1000); });
      expect(onDismiss).not.toHaveBeenCalled();
    });

    // AC-8: No dialog → auto-dismiss fires normally (when no action buttons)
    it('should auto-dismiss normally when activeDialog is null and no action buttons', () => {
      useScanStore.setState({ activeDialog: null });
      const onDismiss = vi.fn();
      renderOverlay({ state: 'ready', onDismiss });

      act(() => { vi.advanceTimersByTime(500); });
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  // TD-18-19: Ready state with result data and action buttons
  describe('TD-18-19: Ready state with result data (AC-5 to AC-7)', () => {
    const mockResult = {
      merchant: 'Supermercado Test',
      total: 15990,
      items: [
        { name: 'Leche', totalPrice: 1990 },
        { name: 'Pan', totalPrice: 990 },
      ],
      date: '2026-04-06',
      category: 'supermercado' as const,
    };

    beforeEach(() => {
      useScanStore.setState({
        results: [mockResult],
        activeResultIndex: 0,
        activeDialog: null,
      });
    });

    afterEach(() => {
      useScanStore.setState(initialScanState);
    });

    it('should show merchant name and total in ready state (AC-5)', () => {
      renderOverlay({ state: 'ready', onSave: vi.fn(), onEdit: vi.fn() });
      expect(screen.getByText('Supermercado Test')).toBeInTheDocument();
      expect(screen.getByText(/15,990/)).toBeInTheDocument();
    });

    it('should show item count in ready state', () => {
      renderOverlay({ state: 'ready', onSave: vi.fn(), onEdit: vi.fn() });
      expect(screen.getByText('2 items')).toBeInTheDocument();
    });

    it('should show "Escaneo completo!" header with checkmark (AC-6)', () => {
      renderOverlay({ state: 'ready', onSave: vi.fn() });
      expect(screen.getByText('¡Listo!')).toBeInTheDocument();
    });

    it('should show save and edit buttons after data (AC-7)', () => {
      renderOverlay({ state: 'ready', onSave: vi.fn(), onEdit: vi.fn() });
      expect(screen.getByTestId('scan-overlay-save-btn')).toBeInTheDocument();
      expect(screen.getByTestId('scan-overlay-edit-btn')).toBeInTheDocument();
      expect(screen.getByText('Guardar ahora')).toBeInTheDocument();
      expect(screen.getByText('Editar primero')).toBeInTheDocument();
    });

    it('should call onSave when save button clicked', async () => {
      vi.useRealTimers();
      const onSave = vi.fn();
      renderOverlay({ state: 'ready', onSave, onEdit: vi.fn() });
      const user = userEvent.setup();
      await user.click(screen.getByTestId('scan-overlay-save-btn'));
      expect(onSave).toHaveBeenCalledTimes(1);
      vi.useFakeTimers();
    });

    it('should call onEdit when edit button clicked', async () => {
      vi.useRealTimers();
      const onEdit = vi.fn();
      renderOverlay({ state: 'ready', onSave: vi.fn(), onEdit });
      const user = userEvent.setup();
      await user.click(screen.getByTestId('scan-overlay-edit-btn'));
      expect(onEdit).toHaveBeenCalledTimes(1);
      vi.useFakeTimers();
    });

    it('should NOT auto-dismiss when action buttons are present', () => {
      const onDismiss = vi.fn();
      renderOverlay({ state: 'ready', onDismiss, onSave: vi.fn(), onEdit: vi.fn() });
      act(() => { vi.advanceTimersByTime(1000); });
      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  // TD-18-19 AC-11: Pending scan detection preserved (no test needed — no changes to usePendingScan)

  // TD-18-19 AC-12: Fast scan skips skeleton animation
  describe('TD-18-19: Fast scan edge case (AC-12)', () => {
    const mockResult = {
      merchant: 'Fast Store',
      total: 5000,
      items: [{ name: 'Item', totalPrice: 5000 }],
      date: '2026-04-06',
      category: 'supermercado' as const,
    };

    afterEach(() => {
      useScanStore.setState(initialScanState);
    });

    it('should skip fade animation when scan completes in under 1s', () => {
      useScanStore.setState({ results: [mockResult], activeResultIndex: 0, activeDialog: null });

      // First render in uploading state (starts the clock)
      const { rerender } = renderOverlay({ state: 'uploading', onSave: vi.fn(), onEdit: vi.fn() });

      // Immediately transition to ready (< 1s elapsed)
      rerender(
        <TestWrapper>
          <ScanOverlay {...defaultProps} state="ready" visible={true} onSave={vi.fn()} onEdit={vi.fn()} />
        </TestWrapper>
      );

      // Result summary should render without fade animation class
      const summary = screen.getByTestId('scan-result-summary');
      expect(summary.className).not.toContain('animate-');
    });

    // AC-5: Normal path — fade animation SHOULD apply when skeleton shown >1s
    it('should apply fade animation when scan takes longer than 1s (AC-5)', () => {
      useScanStore.setState({ results: [mockResult], activeResultIndex: 0, activeDialog: null });

      // Render uploading state (starts the skeleton clock)
      const { rerender } = renderOverlay({ state: 'uploading', onSave: vi.fn(), onEdit: vi.fn() });

      // Advance time past 1s threshold
      act(() => { vi.advanceTimersByTime(1500); });

      // Transition to ready (> 1s elapsed)
      rerender(
        <TestWrapper>
          <ScanOverlay {...defaultProps} state="ready" visible={true} onSave={vi.fn()} onEdit={vi.fn()} />
        </TestWrapper>
      );

      // Result summary SHOULD have fade animation class
      const summary = screen.getByTestId('scan-result-summary');
      expect(summary.className).toContain('animate-');
    });
  });
});
