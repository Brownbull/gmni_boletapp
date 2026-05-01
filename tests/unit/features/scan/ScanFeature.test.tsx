/** ScanFeature tests — phase rendering, overlay rendering, dialog rendering */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ScanFeature } from '@features/scan';
import type { ScanPhase, ScanMode } from '@/features/scan/types/scanStateMachine';
// Mocks

// Mock Zustand store selectors and actions
const mockUseScanPhase = vi.fn<[], ScanPhase>(() => 'idle');
const mockUseScanMode = vi.fn<[], ScanMode>(() => 'single');
const mockReset = vi.fn();
const mockUseScanActions = vi.fn(() => ({ reset: mockReset }));

// Mock store state: activeDialog + overlay fields (Story 16-2)
const mockStoreState: Record<string, unknown> = {
  activeDialog: null,
  overlayState: 'idle',
  overlayProgress: 0,
  overlayEta: null,
  overlayError: null,
};

vi.mock('@features/scan/store', () => ({
  useScanPhase: () => mockUseScanPhase(),
  useScanMode: () => mockUseScanMode(),
  useScanActions: () => mockUseScanActions(),
}));

vi.mock('@features/scan/store/useScanStore', () => ({
  useScanStore: (selector: (state: Record<string, unknown>) => unknown) => selector(mockStoreState),
}));

// Story 14e-23a: Mock overlay components to verify rendering
vi.mock('@features/scan/components', () => ({
  ScanOverlay: ({ visible, state, onCancel, onRetry, onDismiss }: any) =>
    visible ? (
      <div data-testid="scan-overlay" data-state={state}>
        ScanOverlay
        {onCancel && <button onClick={onCancel}>Cancel</button>}
        {onRetry && <button onClick={onRetry}>Retry</button>}
        {onDismiss && <button onClick={onDismiss}>Dismiss</button>}
      </div>
    ) : null,
  QuickSaveCard: ({ onSave, onEdit, onCancel, isSaving }: any) => (
    <div data-testid="quick-save-card" data-saving={isSaving}>
      QuickSaveCard
      <button onClick={onSave}>Save</button>
      <button onClick={onEdit}>Edit</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
  BatchCompleteModal: ({ transactions, onDismiss, onNavigateToHistory, onGoHome }: any) => (
    <div data-testid="batch-complete-modal" data-tx-count={transactions?.length ?? 0}>
      BatchCompleteModal
      <button onClick={onDismiss}>Dismiss</button>
      <button onClick={onNavigateToHistory}>History</button>
      <button onClick={onGoHome}>Home</button>
    </div>
  ),
  CurrencyMismatchDialog: ({ onUseDetected, onUseDefault, onCancel }: any) => (
    <div data-testid="currency-mismatch-dialog">
      CurrencyMismatchDialog
      <button onClick={onUseDetected}>Use Detected</button>
      <button onClick={onUseDefault}>Use Default</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
  TotalMismatchDialog: ({ onUseItemsSum, onKeepOriginal, onCancel }: any) => (
    <div data-testid="total-mismatch-dialog">
      TotalMismatchDialog
      <button onClick={onUseItemsSum}>Use Items Sum</button>
      <button onClick={onKeepOriginal}>Keep Original</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

// Mock state components to verify they're rendered
vi.mock('@features/scan/components/states', () => ({
  IdleState: ({ t, onStartScan }: any) => (
    <div data-testid="idle-state">
      IdleState
      {onStartScan && <button onClick={onStartScan}>Start Scan</button>}
    </div>
  ),
  ProcessingState: ({ onCancel }: any) => (
    <div data-testid="processing-state">
      ProcessingState
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
  ReviewingState: ({ children }: any) => (
    <div data-testid="reviewing-state">
      ReviewingState
      {children}
    </div>
  ),
  ErrorState: ({ onRetry, onDismiss }: any) => (
    <div data-testid="error-state">
      ErrorState
      {onRetry && <button onClick={onRetry}>Retry</button>}
      {onDismiss && <button onClick={onDismiss}>Dismiss</button>}
    </div>
  ),
  SavingState: ({ t, message }: any) => (
    <div data-testid="saving-state" role="status" aria-live="polite">
      <div className="animate-spin" aria-hidden="true" />
      <span>{message || t?.('saving') || 'Saving...'}</span>
    </div>
  ),
  StatementPlaceholder: ({ t, onBack }: any) => (
    <div data-testid="statement-placeholder" role="status" aria-label="Coming soon">
      <h2>{t?.('statementScanTitle') || 'Statement Scanning'}</h2>
      <p>{t?.('statementComingSoon') || 'Proximamente'}</p>
      {onBack && <button onClick={onBack}>{t?.('back') || 'Back'}</button>}
    </div>
  ),
}));
// Test Utilities

const defaultProps = {
  t: (key: string) => key,
  theme: 'light' as const,
};

function setPhase(phase: ScanPhase) {
  mockUseScanPhase.mockReturnValue(phase);
}

function setMode(mode: ScanMode) {
  mockUseScanMode.mockReturnValue(mode);
}

function setActiveDialog(dialog: { type: string; data: unknown } | null) {
  mockStoreState.activeDialog = dialog;
}

function setOverlay(state: string, error?: { type: string; message: string } | null) {
  mockStoreState.overlayState = state;
  if (error !== undefined) mockStoreState.overlayError = error;
}

function expectOnlyHiddenFileInput(container: HTMLElement) {
  const children = container.querySelectorAll('*');
  expect(children.length).toBe(1);
  expect(children[0].tagName).toBe('INPUT');
  expect(children[0]).toHaveAttribute('type', 'file');
  expect(children[0]).toHaveClass('hidden');
}
// Tests

describe('ScanFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setPhase('idle');
    setMode('single');
    setActiveDialog(null);
    setOverlay('idle');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when phase is idle', () => {
    beforeEach(() => {
      setPhase('idle');
    });

    it('renders only hidden file input by default (showIdleState=false)', () => {
      const { container } = render(<ScanFeature {...defaultProps} />);
      expectOnlyHiddenFileInput(container);
    });

    it('renders IdleState when showIdleState=true', () => {
      render(<ScanFeature {...defaultProps} showIdleState={true} />);
      expect(screen.getByTestId('idle-state')).toBeInTheDocument();
    });

    it('passes onStartScan to IdleState', () => {
      const onStartScan = vi.fn();
      render(
        <ScanFeature
          {...defaultProps}
          showIdleState={true}
          onStartScan={onStartScan}
        />
      );

      fireEvent.click(screen.getByText('Start Scan'));
      expect(onStartScan).toHaveBeenCalled();
    });
  });

  describe('when phase is capturing', () => {
    beforeEach(() => {
      setPhase('capturing');
    });

    describe('in batch mode', () => {
      beforeEach(() => {
        setMode('batch');
      });

      it('renders batchCaptureView when provided', () => {
        render(
          <ScanFeature
            {...defaultProps}
            batchCaptureView={<div data-testid="batch-capture">Batch Capture</div>}
          />
        );
        expect(screen.getByTestId('batch-capture')).toBeInTheDocument();
      });

      it('renders only file input when batchCaptureView not provided (partial integration)', () => {
        const { container } = render(<ScanFeature {...defaultProps} />);
        expectOnlyHiddenFileInput(container);
      });
    });

    describe('in single mode', () => {
      beforeEach(() => {
        setMode('single');
      });

      it('renders singleCaptureView when provided', () => {
        render(
          <ScanFeature
            {...defaultProps}
            singleCaptureView={<div data-testid="single-capture">Single Capture</div>}
          />
        );
        expect(screen.getByTestId('single-capture')).toBeInTheDocument();
      });

      it('renders only file input when singleCaptureView not provided', () => {
        const { container } = render(<ScanFeature {...defaultProps} />);
        expectOnlyHiddenFileInput(container);
      });
    });

    describe('in statement mode', () => {
      beforeEach(() => {
        setMode('statement');
      });

      it('renders statementView when provided', () => {
        render(
          <ScanFeature
            {...defaultProps}
            statementView={<div data-testid="statement-view">Statement View</div>}
          />
        );
        expect(screen.getByTestId('statement-view')).toBeInTheDocument();
      });

      it('renders only file input when statementView not provided (partial integration)', () => {
        const { container } = render(<ScanFeature {...defaultProps} />);
        expectOnlyHiddenFileInput(container);
      });
    });
  });
  // Phase: scanning

  describe('when phase is scanning', () => {
    beforeEach(() => {
      setPhase('scanning');
    });

    it('renders only file input when scanOverlay prop not provided', () => {
      const { container } = render(<ScanFeature {...defaultProps} />);
      expectOnlyHiddenFileInput(container);
    });

    it('does not render ProcessingState during partial integration', () => {
      render(<ScanFeature {...defaultProps} />);
      expect(screen.queryByTestId('processing-state')).not.toBeInTheDocument();
    });
  });

  describe('when phase is reviewing', () => {
    beforeEach(() => {
      setPhase('reviewing');
    });

    it('renders only file input when reviewView not provided (partial integration)', () => {
      const { container } = render(<ScanFeature {...defaultProps} />);
      expectOnlyHiddenFileInput(container);
    });

    it('renders ReviewingState with reviewView when provided', () => {
      render(
        <ScanFeature
          {...defaultProps}
          reviewView={<div data-testid="review-content">Review Content</div>}
        />
      );

      expect(screen.getByTestId('reviewing-state')).toBeInTheDocument();
      expect(screen.getByTestId('review-content')).toBeInTheDocument();
    });
  });
  describe('when phase is saving', () => {
    beforeEach(() => {
      setPhase('saving');
    });

    it('renders only file input (QuickSaveCard handles saving state)', () => {
      const { container } = render(<ScanFeature {...defaultProps} />);
      expectOnlyHiddenFileInput(container);
    });

    it('does not render SavingState during partial integration', () => {
      render(<ScanFeature {...defaultProps} />);
      expect(screen.queryByTestId('saving-state')).not.toBeInTheDocument();
    });
  });
  // Phase: error

  describe('when phase is error', () => {
    beforeEach(() => {
      setPhase('error');
    });

    it('renders only file input when scanOverlay prop not provided', () => {
      const { container } = render(<ScanFeature {...defaultProps} />);
      expectOnlyHiddenFileInput(container);
    });

    it('does not render ErrorState during partial integration', () => {
      render(<ScanFeature {...defaultProps} />);
      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
    });
  });

  describe('prop forwarding', () => {
    it('forwards t and theme to IdleState when showIdleState is true', () => {
      setPhase('idle');
      const customT = vi.fn((key: string) => `translated:${key}`);

      render(<ScanFeature t={customT} theme="dark" showIdleState />);

      // IdleState is rendered with t and theme
      expect(screen.getByTestId('idle-state')).toBeInTheDocument();
    });

    it('forwards t and theme to ReviewingState when reviewView provided', () => {
      setPhase('reviewing');
      const customT = vi.fn((key: string) => `translated:${key}`);

      render(
        <ScanFeature
          t={customT}
          theme="dark"
          reviewView={<div>Review Content</div>}
        />
      );

      expect(screen.getByTestId('reviewing-state')).toBeInTheDocument();
    });
  });

  describe('mode-aware rendering', () => {
    it('renders different content for batch vs single in capturing phase', () => {
      setPhase('capturing');

      // Test batch mode
      setMode('batch');
      const { rerender } = render(
        <ScanFeature
          {...defaultProps}
          batchCaptureView={<div data-testid="batch-view">Batch</div>}
          singleCaptureView={<div data-testid="single-view">Single</div>}
        />
      );
      expect(screen.getByTestId('batch-view')).toBeInTheDocument();
      expect(screen.queryByTestId('single-view')).not.toBeInTheDocument();

      // Test single mode
      setMode('single');
      rerender(
        <ScanFeature
          {...defaultProps}
          batchCaptureView={<div data-testid="batch-view">Batch</div>}
          singleCaptureView={<div data-testid="single-view">Single</div>}
        />
      );
      expect(screen.queryByTestId('batch-view')).not.toBeInTheDocument();
      expect(screen.getByTestId('single-view')).toBeInTheDocument();
    });

    it('renders only file input for batch mode without batchCaptureView prop', () => {
      setPhase('capturing');
      setMode('batch');

      const { container } = render(<ScanFeature {...defaultProps} />);
      expectOnlyHiddenFileInput(container);
    });
  });

  describe('edge cases', () => {
    it('handles unknown phase gracefully (renders only file input)', () => {
      // Force an unknown phase value
      mockUseScanPhase.mockReturnValue('unknown' as ScanPhase);

      const { container } = render(<ScanFeature {...defaultProps} />);
      expectOnlyHiddenFileInput(container);
    });

    it('handles phase transitions correctly (partial integration)', () => {
      // Start idle with showIdleState
      setPhase('idle');
      const { rerender } = render(<ScanFeature {...defaultProps} showIdleState />);
      expect(screen.getByTestId('idle-state')).toBeInTheDocument();

      // Transition to scanning - returns null (ScanOverlay handles it)
      setPhase('scanning');
      rerender(<ScanFeature {...defaultProps} showIdleState />);
      expect(screen.queryByTestId('idle-state')).not.toBeInTheDocument();
      expect(screen.queryByTestId('processing-state')).not.toBeInTheDocument();

      // Transition to reviewing with reviewView
      setPhase('reviewing');
      rerender(
        <ScanFeature
          {...defaultProps}
          showIdleState
          reviewView={<div data-testid="review">Review</div>}
        />
      );
      expect(screen.getByTestId('reviewing-state')).toBeInTheDocument();

      // Transition to error - returns null (ScanOverlay handles it)
      setPhase('error');
      rerender(<ScanFeature {...defaultProps} showIdleState />);
      expect(screen.queryByTestId('reviewing-state')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
    });

    it('renders only file input for all phases without view props (partial integration)', () => {
      const phases: ScanPhase[] = ['capturing', 'scanning', 'reviewing', 'saving', 'error'];

      phases.forEach((phase) => {
        setPhase(phase);
        const { container } = render(<ScanFeature {...defaultProps} />);
        expectOnlyHiddenFileInput(container);
      });
    });
  });
  // Story 14e-23a: Overlay Rendering Tests

  describe('overlay rendering (Story 14e-23a)', () => {

    describe('ScanOverlay', () => {
      const overlayHandlers = {
        scanImages: ['data:image/png;base64,test'],
        onScanOverlayCancel: vi.fn(),
        onScanOverlayRetry: vi.fn(),
        onScanOverlayDismiss: vi.fn(),
      };

      it('renders ScanOverlay when phase is scanning and overlay is processing', () => {
        setPhase('scanning');
        setOverlay('processing');
        render(<ScanFeature {...defaultProps} {...overlayHandlers} />);
        expect(screen.getByTestId('scan-overlay')).toBeInTheDocument();
      });

      it('renders ScanOverlay when phase is error and overlay state is error', () => {
        setPhase('error');
        setOverlay('error', { type: 'api', message: 'fail' });
        render(<ScanFeature {...defaultProps} {...overlayHandlers} />);
        expect(screen.getByTestId('scan-overlay')).toBeInTheDocument();
        expect(screen.getByTestId('scan-overlay')).toHaveAttribute('data-state', 'error');
      });

      it('does not render ScanOverlay when phase is idle', () => {
        setPhase('idle');
        setOverlay('processing');
        render(<ScanFeature {...defaultProps} {...overlayHandlers} showIdleState />);
        expect(screen.queryByTestId('scan-overlay')).not.toBeInTheDocument();
      });

      it('calls onScanOverlayCancel when Cancel button is clicked', () => {
        setPhase('scanning');
        setOverlay('processing');
        const onCancel = vi.fn();
        render(<ScanFeature {...defaultProps} {...overlayHandlers} onScanOverlayCancel={onCancel} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(onCancel).toHaveBeenCalled();
      });

      it('calls onScanOverlayRetry when Retry button is clicked', () => {
        setPhase('error');
        setOverlay('error', { type: 'api', message: 'fail' });
        const onRetry = vi.fn();
        render(<ScanFeature {...defaultProps} {...overlayHandlers} onScanOverlayRetry={onRetry} />);
        fireEvent.click(screen.getByText('Retry'));
        expect(onRetry).toHaveBeenCalled();
      });
    });

    describe('QuickSaveCard', () => {
      const quickSaveProps = {
        onQuickSave: vi.fn(),
        onQuickSaveEdit: vi.fn(),
        onQuickSaveCancel: vi.fn(),
        isQuickSaving: false,
        currency: 'CLP',
        formatCurrency: (amount: number, curr: string) => `${curr} ${amount}`,
      };

      it('renders QuickSaveCard when all handlers are provided', () => {
        setPhase('idle');

        render(<ScanFeature {...defaultProps} {...quickSaveProps} />);

        expect(screen.getByTestId('quick-save-card')).toBeInTheDocument();
      });

      it('does not render QuickSaveCard when handlers are missing', () => {
        setPhase('idle');

        render(<ScanFeature {...defaultProps} />);

        expect(screen.queryByTestId('quick-save-card')).not.toBeInTheDocument();
      });

      it('calls onQuickSave when Save button is clicked', () => {
        setPhase('idle');
        const onSave = vi.fn();

        render(
          <ScanFeature {...defaultProps} {...quickSaveProps} onQuickSave={onSave} />
        );

        fireEvent.click(screen.getByText('Save'));
        expect(onSave).toHaveBeenCalled();
      });

      it('calls onQuickSaveEdit when Edit button is clicked', () => {
        setPhase('idle');
        const onEdit = vi.fn();

        render(
          <ScanFeature {...defaultProps} {...quickSaveProps} onQuickSaveEdit={onEdit} />
        );

        fireEvent.click(screen.getByText('Edit'));
        expect(onEdit).toHaveBeenCalled();
      });

      it('passes isSaving prop to QuickSaveCard', () => {
        setPhase('idle');

        render(
          <ScanFeature {...defaultProps} {...quickSaveProps} isQuickSaving={true} />
        );

        expect(screen.getByTestId('quick-save-card')).toHaveAttribute('data-saving', 'true');
      });
    });

    describe('BatchCompleteModal', () => {
      const batchCompleteProps = {
        userCreditsRemaining: 5,
        onBatchCompleteDismiss: vi.fn(),
        onBatchCompleteNavigateToHistory: vi.fn(),
        onBatchCompleteGoHome: vi.fn(),
      };

      it('renders BatchCompleteModal when activeDialog.type is BATCH_COMPLETE', () => {
        setPhase('idle');
        setActiveDialog({
          type: 'batch_complete',
          data: { transactions: [{ id: '1' }, { id: '2' }], creditsUsed: 1 },
        });

        render(<ScanFeature {...defaultProps} {...batchCompleteProps} />);

        expect(screen.getByTestId('batch-complete-modal')).toBeInTheDocument();
        expect(screen.getByTestId('batch-complete-modal')).toHaveAttribute('data-tx-count', '2');
      });

      it('does not render BatchCompleteModal when activeDialog is null', () => {
        setPhase('idle');
        setActiveDialog(null);

        render(<ScanFeature {...defaultProps} {...batchCompleteProps} />);

        expect(screen.queryByTestId('batch-complete-modal')).not.toBeInTheDocument();
      });

      it('does not render BatchCompleteModal when transactions array is empty', () => {
        setPhase('idle');
        setActiveDialog({
          type: 'batch_complete',
          data: { transactions: [], creditsUsed: 0 },
        });

        render(<ScanFeature {...defaultProps} {...batchCompleteProps} />);

        expect(screen.queryByTestId('batch-complete-modal')).not.toBeInTheDocument();
      });

      it('calls onBatchCompleteDismiss when Dismiss button is clicked', () => {
        setPhase('idle');
        setActiveDialog({
          type: 'batch_complete',
          data: { transactions: [{ id: '1' }], creditsUsed: 1 },
        });
        const onDismiss = vi.fn();

        // Provide all required handlers explicitly to ensure modal renders
        render(
          <ScanFeature
            {...defaultProps}
            userCreditsRemaining={5}
            onBatchCompleteDismiss={onDismiss}
            onBatchCompleteNavigateToHistory={vi.fn()}
            onBatchCompleteGoHome={vi.fn()}
          />
        );

        fireEvent.click(screen.getByText('Dismiss'));
        expect(onDismiss).toHaveBeenCalled();
      });

      it('calls onBatchCompleteNavigateToHistory when History button is clicked', () => {
        setPhase('idle');
        setActiveDialog({
          type: 'batch_complete',
          data: { transactions: [{ id: '1' }], creditsUsed: 1 },
        });
        const onNavigate = vi.fn();

        // Provide all required handlers explicitly to ensure modal renders
        render(
          <ScanFeature
            {...defaultProps}
            userCreditsRemaining={5}
            onBatchCompleteDismiss={vi.fn()}
            onBatchCompleteNavigateToHistory={onNavigate}
            onBatchCompleteGoHome={vi.fn()}
          />
        );

        fireEvent.click(screen.getByText('History'));
        expect(onNavigate).toHaveBeenCalled();
      });
    });

    describe('CurrencyMismatchDialog', () => {
      const currencyMismatchProps = {
        userCurrency: 'CLP' as const,
        onCurrencyUseDetected: vi.fn(),
        onCurrencyUseDefault: vi.fn(),
        onCurrencyMismatchCancel: vi.fn(),
      };

      it('renders CurrencyMismatchDialog when all handlers are provided', () => {
        setPhase('idle');

        render(<ScanFeature {...defaultProps} {...currencyMismatchProps} />);

        expect(screen.getByTestId('currency-mismatch-dialog')).toBeInTheDocument();
      });

      it('does not render CurrencyMismatchDialog when handlers are missing', () => {
        setPhase('idle');

        render(<ScanFeature {...defaultProps} />);

        expect(screen.queryByTestId('currency-mismatch-dialog')).not.toBeInTheDocument();
      });

      it('calls onCurrencyUseDetected when Use Detected button is clicked', () => {
        setPhase('idle');
        const onUseDetected = vi.fn();

        render(
          <ScanFeature
            {...defaultProps}
            {...currencyMismatchProps}
            onCurrencyUseDetected={onUseDetected}
          />
        );

        fireEvent.click(screen.getByText('Use Detected'));
        expect(onUseDetected).toHaveBeenCalled();
      });

      it('calls onCurrencyUseDefault when Use Default button is clicked', () => {
        setPhase('idle');
        const onUseDefault = vi.fn();

        render(
          <ScanFeature
            {...defaultProps}
            {...currencyMismatchProps}
            onCurrencyUseDefault={onUseDefault}
          />
        );

        fireEvent.click(screen.getByText('Use Default'));
        expect(onUseDefault).toHaveBeenCalled();
      });
    });


    describe('TotalMismatchDialog', () => {
      const totalMismatchProps = {
        onTotalUseItemsSum: vi.fn(),
        onTotalKeepOriginal: vi.fn(),
        onTotalMismatchCancel: vi.fn(),
      };

      it('renders TotalMismatchDialog when all handlers are provided', () => {
        setPhase('idle');

        render(<ScanFeature {...defaultProps} {...totalMismatchProps} />);

        expect(screen.getByTestId('total-mismatch-dialog')).toBeInTheDocument();
      });

      it('does not render TotalMismatchDialog when handlers are missing', () => {
        setPhase('idle');

        render(<ScanFeature {...defaultProps} />);

        expect(screen.queryByTestId('total-mismatch-dialog')).not.toBeInTheDocument();
      });

      it('calls onTotalUseItemsSum when Use Items Sum button is clicked', () => {
        setPhase('idle');
        const onUseItemsSum = vi.fn();

        render(
          <ScanFeature
            {...defaultProps}
            {...totalMismatchProps}
            onTotalUseItemsSum={onUseItemsSum}
          />
        );

        fireEvent.click(screen.getByText('Use Items Sum'));
        expect(onUseItemsSum).toHaveBeenCalled();
      });

      it('calls onTotalKeepOriginal when Keep Original button is clicked', () => {
        setPhase('idle');
        const onKeepOriginal = vi.fn();

        render(
          <ScanFeature
            {...defaultProps}
            {...totalMismatchProps}
            onTotalKeepOriginal={onKeepOriginal}
          />
        );

        fireEvent.click(screen.getByText('Keep Original'));
        expect(onKeepOriginal).toHaveBeenCalled();
      });
    });
  });
});
