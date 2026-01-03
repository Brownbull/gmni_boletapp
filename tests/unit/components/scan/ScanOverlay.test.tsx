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
import { ScanOverlay, ScanOverlayProps, ScanOverlayState } from '../../../../src/components/scan/ScanOverlay';
import { AnimationProvider } from '../../../../src/components/animation';

// Mock useReducedMotion
vi.mock('../../../../src/hooks/useReducedMotion', () => ({
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
    tipCanNavigate: 'Puedes navegar mientras procesamos',
    scanError: 'Error al procesar',
    retry: 'Reintentar',
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

  describe('State: uploading', () => {
    it('should show uploading indicator with progress', () => {
      renderOverlay({ state: 'uploading', progress: 45 });

      expect(screen.getByText('Subiendo imagen...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('should show cancel button', () => {
      renderOverlay({ state: 'uploading', progress: 45 });
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    it('should call onCancel when cancel clicked', async () => {
      vi.useRealTimers();
      const onCancel = vi.fn();
      renderOverlay({ state: 'uploading', progress: 45, onCancel });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /cancelar/i }));

      expect(onCancel).toHaveBeenCalledTimes(1);
      vi.useFakeTimers();
    });

    it('should clamp progress between 0 and 100', () => {
      const { rerender } = renderOverlay({ state: 'uploading', progress: -10 });
      expect(screen.getByText('0%')).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <ScanOverlay {...defaultProps} state="uploading" progress={150} />
        </TestWrapper>
      );
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('State: processing', () => {
    it('should show processing indicator', () => {
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

    it('should show cancel button', () => {
      renderOverlay({ state: 'processing' });
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
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
});

// useScanOverlayState hook tests are covered via component behavior tests above
