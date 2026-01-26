/**
 * Story 14e-10: ScanFeature Orchestrator Tests
 * Story 14e-11: Updated for Partial Integration Behavior
 *
 * Tests the phase-based rendering logic of ScanFeature component.
 *
 * During partial integration (Story 14e-11), ScanFeature returns null for most
 * phases when view props are not provided. This allows existing view-based
 * rendering in App.tsx and ScanOverlay to handle the UI.
 *
 * @see src/features/scan/ScanFeature.tsx
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ScanFeature } from '@features/scan';
import type { ScanPhase, ScanMode } from '@/types/scanStateMachine';

// =============================================================================
// Mocks
// =============================================================================

// Mock Zustand store selectors and actions
const mockUseScanPhase = vi.fn<[], ScanPhase>(() => 'idle');
const mockUseScanMode = vi.fn<[], ScanMode>(() => 'single');
const mockReset = vi.fn();
const mockUseScanActions = vi.fn(() => ({ reset: mockReset }));

vi.mock('@features/scan/store', () => ({
  useScanPhase: () => mockUseScanPhase(),
  useScanMode: () => mockUseScanMode(),
  useScanActions: () => mockUseScanActions(),
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

// =============================================================================
// Test Utilities
// =============================================================================

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

// =============================================================================
// Tests
// =============================================================================

describe('ScanFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setPhase('idle');
    setMode('single');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // Phase: idle
  // ===========================================================================

  describe('when phase is idle', () => {
    beforeEach(() => {
      setPhase('idle');
    });

    it('renders nothing by default (showIdleState=false)', () => {
      const { container } = render(<ScanFeature {...defaultProps} />);
      expect(container.firstChild).toBeNull();
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

  // ===========================================================================
  // Phase: capturing
  // ===========================================================================

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

      // Story 14e-11: Now returns null when batchCaptureView not provided
      // (Existing views in App.tsx handle batch capture rendering)
      it('renders nothing when batchCaptureView not provided (partial integration)', () => {
        const { container } = render(<ScanFeature {...defaultProps} />);
        expect(container.firstChild).toBeNull();
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

      it('renders nothing when singleCaptureView not provided', () => {
        const { container } = render(<ScanFeature {...defaultProps} />);
        expect(container.firstChild).toBeNull();
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

      // Story 14e-11: Now returns null when statementView not provided
      // (StatementScanView in App.tsx handles statement capture rendering)
      it('renders nothing when statementView not provided (partial integration)', () => {
        const { container } = render(<ScanFeature {...defaultProps} />);
        expect(container.firstChild).toBeNull();
      });
    });
  });

  // ===========================================================================
  // Phase: scanning
  // Story 14e-11: ScanOverlay in AppOverlays handles processing state
  // ===========================================================================

  describe('when phase is scanning', () => {
    beforeEach(() => {
      setPhase('scanning');
    });

    // Story 14e-11: ScanFeature returns null for scanning phase
    // ScanOverlay in AppOverlays.tsx handles the processing UI as a fixed overlay
    it('renders nothing (ScanOverlay handles processing state)', () => {
      const { container } = render(<ScanFeature {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });

    it('does not render ProcessingState during partial integration', () => {
      render(<ScanFeature {...defaultProps} />);
      expect(screen.queryByTestId('processing-state')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Phase: reviewing
  // ===========================================================================

  describe('when phase is reviewing', () => {
    beforeEach(() => {
      setPhase('reviewing');
    });

    // Story 14e-11: Only renders when reviewView prop is provided
    it('renders nothing when reviewView not provided (partial integration)', () => {
      const { container } = render(<ScanFeature {...defaultProps} />);
      expect(container.firstChild).toBeNull();
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

  // ===========================================================================
  // Phase: saving
  // Story 14e-11: Save operation shows QuickSaveCard or navigates away
  // ===========================================================================

  describe('when phase is saving', () => {
    beforeEach(() => {
      setPhase('saving');
    });

    // Story 14e-11: ScanFeature returns null for saving phase
    // QuickSaveCard's "Guardando..." state handles the saving UI
    it('renders nothing (QuickSaveCard handles saving state)', () => {
      const { container } = render(<ScanFeature {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });

    it('does not render SavingState during partial integration', () => {
      render(<ScanFeature {...defaultProps} />);
      expect(screen.queryByTestId('saving-state')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Phase: error
  // Story 14e-11: ScanOverlay in AppOverlays handles error state
  // ===========================================================================

  describe('when phase is error', () => {
    beforeEach(() => {
      setPhase('error');
    });

    // Story 14e-11: ScanFeature returns null for error phase
    // ScanOverlay in AppOverlays.tsx handles the error UI as a fixed overlay
    it('renders nothing (ScanOverlay handles error state)', () => {
      const { container } = render(<ScanFeature {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });

    it('does not render ErrorState during partial integration', () => {
      render(<ScanFeature {...defaultProps} />);
      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Props passing
  // ===========================================================================

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

  // ===========================================================================
  // Mode-aware rendering
  // ===========================================================================

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

    it('renders nothing for batch mode without batchCaptureView prop', () => {
      setPhase('capturing');
      setMode('batch');

      const { container } = render(<ScanFeature {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });
  });

  // ===========================================================================
  // Edge cases
  // ===========================================================================

  describe('edge cases', () => {
    it('handles unknown phase gracefully (returns null)', () => {
      // Force an unknown phase value
      mockUseScanPhase.mockReturnValue('unknown' as ScanPhase);

      const { container } = render(<ScanFeature {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });

    // Story 14e-11: Updated for partial integration behavior
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

    it('returns null for all phases without view props (partial integration)', () => {
      const phases: ScanPhase[] = ['capturing', 'scanning', 'reviewing', 'saving', 'error'];

      phases.forEach((phase) => {
        setPhase(phase);
        const { container } = render(<ScanFeature {...defaultProps} />);
        expect(container.firstChild).toBeNull();
      });
    });
  });
});
