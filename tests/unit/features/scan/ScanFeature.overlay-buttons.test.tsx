/** TD-18-23: ScanOverlay save/edit button differentiation tests */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ScanFeature } from '@features/scan';
import type { ScanPhase, ScanMode } from '@/features/scan/types/scanStateMachine';

// Mocks — same structure as ScanFeature.test.tsx
const mockUseScanPhase = vi.fn<[], ScanPhase>(() => 'idle');
const mockUseScanMode = vi.fn<[], ScanMode>(() => 'single');
const mockUseScanActions = vi.fn(() => ({ reset: vi.fn() }));

const mockStoreState: Record<string, unknown> = {
  activeDialog: null,
  overlayState: 'idle',
  overlayProgress: 0,
  overlayEta: null,
  overlayError: null,
  results: [{ id: 'mock-tx', merchant: 'Test', total: 1000, items: [{ name: 'item', price: 1000 }] }],
  activeResultIndex: 0,
};

vi.mock('@features/scan/store', () => ({
  useScanPhase: () => mockUseScanPhase(),
  useScanMode: () => mockUseScanMode(),
  useScanActions: () => mockUseScanActions(),
}));

vi.mock('@features/scan/store/useScanStore', () => ({
  useScanStore: (selector: (state: Record<string, unknown>) => unknown) => selector(mockStoreState),
}));

// TD-18-23: ScanOverlay mock exposes onSave/onEdit buttons
vi.mock('@features/scan/components', () => ({
  ScanOverlay: ({ visible, state, onCancel, onRetry, onDismiss, onSave, onEdit }: Record<string, unknown>) =>
    visible ? (
      <div data-testid="scan-overlay" data-state={state as string}>
        {onCancel && <button onClick={onCancel as () => void}>Cancel</button>}
        {onRetry && <button onClick={onRetry as () => void}>Retry</button>}
        {onDismiss && <button onClick={onDismiss as () => void}>Dismiss</button>}
        {onSave && <button onClick={onSave as () => void}>OverlaySave</button>}
        {onEdit && <button onClick={onEdit as () => void}>OverlayEdit</button>}
      </div>
    ) : null,
  QuickSaveCard: () => null,
  BatchCompleteModal: () => null,
  CurrencyMismatchDialog: () => null,
  TotalMismatchDialog: () => null,
}));

vi.mock('@features/scan/components/states', () => ({
  IdleState: () => null,
  ReviewingState: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@features/scan/components/BatchDiscardDialog', () => ({
  BatchDiscardDialog: () => null,
}));

const defaultProps = {
  t: (key: string) => key,
  theme: 'light' as const,
};

const overlayHandlers = {
  scanImages: ['data:image/png;base64,test'],
  onScanOverlayCancel: vi.fn(),
  onScanOverlayRetry: vi.fn(),
  onScanOverlayDismiss: vi.fn(),
};

const quickSaveProps = {
  onQuickSave: vi.fn(),
  onQuickSaveEdit: vi.fn(),
  onQuickSaveCancel: vi.fn(),
  isQuickSaving: false,
  currency: 'CLP',
  formatCurrency: (amount: number, curr: string) => `${curr} ${amount}`,
};

describe('ScanOverlay save/edit differentiation (TD-18-23)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseScanPhase.mockReturnValue('scanning');
    mockUseScanMode.mockReturnValue('single');
    mockStoreState.activeDialog = null;
    mockStoreState.overlayState = 'ready';
    mockStoreState.results = [{ id: 'mock-tx', merchant: 'Test', total: 1000, items: [{ name: 'item', price: 1000 }] }];
    mockStoreState.activeResultIndex = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('AC-1: "Guardar ahora" triggers onQuickSave with transaction data (not onScanOverlayDismiss)', () => {
    const onQuickSave = vi.fn();
    const onDismiss = vi.fn();

    render(
      <ScanFeature
        {...defaultProps}
        {...overlayHandlers}
        {...quickSaveProps}
        onQuickSave={onQuickSave}
        onScanOverlayDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByText('OverlaySave'));
    expect(onQuickSave).toHaveBeenCalledWith(
      expect.objectContaining({ transaction: expect.objectContaining({ merchant: 'Test', total: 1000 }) })
    );
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('AC-1: "Editar primero" triggers onQuickSaveEdit with transaction data (not onScanOverlayDismiss)', () => {
    const onQuickSaveEdit = vi.fn();
    const onDismiss = vi.fn();

    render(
      <ScanFeature
        {...defaultProps}
        {...overlayHandlers}
        {...quickSaveProps}
        onQuickSaveEdit={onQuickSaveEdit}
        onScanOverlayDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByText('OverlayEdit'));
    expect(onQuickSaveEdit).toHaveBeenCalledWith(
      expect.objectContaining({ transaction: expect.objectContaining({ merchant: 'Test', total: 1000 }) })
    );
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('AC-2: overlay buttons bypass QuickSaveCard (no duplicate save/edit choice)', () => {
    mockStoreState.activeDialog = null;
    const onQuickSave = vi.fn();

    render(
      <ScanFeature
        {...defaultProps}
        {...overlayHandlers}
        {...quickSaveProps}
        onQuickSave={onQuickSave}
      />
    );

    // Overlay shows save/edit buttons
    expect(screen.getByTestId('scan-overlay')).toBeInTheDocument();

    // Clicking save calls onQuickSave directly — no intermediate QuickSaveCard dialog
    fireEvent.click(screen.getByText('OverlaySave'));
    expect(onQuickSave).toHaveBeenCalledWith(
      expect.objectContaining({ transaction: expect.any(Object), confidence: expect.any(Number) })
    );
    // No dialog was triggered (QuickSaveCard not activated)
    expect(mockStoreState.activeDialog).toBeNull();
  });

  it('AC-3: auto-dismiss preserved when no quick-save handlers provided', () => {
    const onDismiss = vi.fn();

    render(
      <ScanFeature
        {...defaultProps}
        scanImages={['img']}
        onScanOverlayCancel={vi.fn()}
        onScanOverlayRetry={vi.fn()}
        onScanOverlayDismiss={onDismiss}
      />
    );

    // Without onQuickSave/onQuickSaveEdit, overlay should NOT have save/edit buttons
    expect(screen.queryByText('OverlaySave')).not.toBeInTheDocument();
    expect(screen.queryByText('OverlayEdit')).not.toBeInTheDocument();
    // onDismiss should still work for auto-dismiss
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Dismiss'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('edge case: save falls back to dismiss when scanResults is empty', () => {
    mockStoreState.results = [];
    const onQuickSave = vi.fn();
    const onDismiss = vi.fn();

    render(
      <ScanFeature
        {...defaultProps}
        {...overlayHandlers}
        {...quickSaveProps}
        onQuickSave={onQuickSave}
        onScanOverlayDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByText('OverlaySave'));
    expect(onQuickSave).not.toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
  });

  it('edge case: null activeResultIndex falls back to index 0', () => {
    mockStoreState.activeResultIndex = null;
    const onQuickSave = vi.fn();

    render(
      <ScanFeature
        {...defaultProps}
        {...overlayHandlers}
        {...quickSaveProps}
        onQuickSave={onQuickSave}
      />
    );

    fireEvent.click(screen.getByText('OverlaySave'));
    expect(onQuickSave).toHaveBeenCalledWith(
      expect.objectContaining({ transaction: expect.objectContaining({ merchant: 'Test', total: 1000 }) })
    );
  });

  it('edge case: only onQuickSave provided shows save button but not edit', () => {
    render(
      <ScanFeature
        {...defaultProps}
        {...overlayHandlers}
        onQuickSave={vi.fn()}
        onQuickSaveCancel={vi.fn()}
        isQuickSaving={false}
        currency="CLP"
        formatCurrency={(a: number, c: string) => `${c} ${a}`}
      />
    );

    expect(screen.getByText('OverlaySave')).toBeInTheDocument();
    expect(screen.queryByText('OverlayEdit')).not.toBeInTheDocument();
  });

  it('AC-5: no save/edit buttons when onQuickSave not provided (auto-dismiss path)', () => {
    mockStoreState.overlayState = 'ready';

    render(
      <ScanFeature
        {...defaultProps}
        scanImages={['img']}
        onScanOverlayCancel={vi.fn()}
        onScanOverlayRetry={vi.fn()}
        onScanOverlayDismiss={vi.fn()}
      />
    );

    // ScanOverlay should not have save/edit buttons
    expect(screen.queryByText('OverlaySave')).not.toBeInTheDocument();
    expect(screen.queryByText('OverlayEdit')).not.toBeInTheDocument();
  });
});
