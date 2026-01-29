/**
 * Story 14e-30: useScanInitiation Hook Tests
 *
 * Tests for the scan initiation handlers hook.
 * Covers handleNewTransaction, handleFileSelect, handleRescan, triggerScan.
 *
 * AC5: Tests for hook functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScanInitiation } from '../../../../../src/features/scan/hooks/useScanInitiation';
import type { ScanInitiationProps } from '../../../../../src/features/scan/hooks/useScanInitiation';
import type { Transaction } from '../../../../../src/types/transaction';
import type { ScanState } from '../../../../../src/types/scanStateMachine';
import { DIALOG_TYPES } from '../../../../../src/types/scanStateMachine';

// =============================================================================
// Mocks
// =============================================================================

// Mock store actions - use vi.hoisted to define mocks before they're used
const { mockScanStoreActions, mockNavigationStoreActions } = vi.hoisted(() => ({
  mockScanStoreActions: {
    dismissDialog: vi.fn(),
    setBatchEditingIndex: vi.fn(),
  },
  mockNavigationStoreActions: {
    setView: vi.fn(),
    navigateToView: vi.fn(),
  },
}));

vi.mock('../../../../../src/features/scan/store/useScanStore', () => ({
  useScanStore: () => mockScanStoreActions,
}));

vi.mock('../../../../../src/shared/stores/useNavigationStore', () => ({
  useNavigationStore: () => mockNavigationStoreActions,
}));

// Mock analyzeReceipt
vi.mock('../../../../../src/services/gemini', () => ({
  analyzeReceipt: vi.fn().mockResolvedValue({
    merchant: 'Test Merchant',
    date: '2026-01-28',
    total: 1000,
    category: 'Supermarket',
    items: [{ name: 'Item 1', price: 500, qty: 1 }, { name: 'Item 2', price: 500, qty: 1 }],
    currency: 'CLP',
    time: '12:00',
    country: 'CL',
    city: 'Santiago',
    receiptType: 'supermarket',
    promptVersion: 'v3',
  }),
}));

// Mock validation utils
vi.mock('../../../../../src/utils/validation', () => ({
  getSafeDate: vi.fn((date) => date || '2026-01-28'),
  parseStrictNumber: vi.fn((num) => Number(num) || 0),
}));

// =============================================================================
// Test Helpers
// =============================================================================

function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'test-tx-1',
    date: '2026-01-28',
    merchant: 'Test Merchant',
    category: 'Supermarket',
    total: 1000,
    items: [{ name: 'Test Item', price: 1000, qty: 1 }],
    currency: 'CLP',
    ...overrides,
  };
}

function createMockScanState(overrides: Partial<ScanState> = {}): ScanState {
  return {
    phase: 'idle',
    mode: 'single',
    images: [],
    results: [],
    error: null,
    activeDialog: null,
    batchReceipts: null,
    batchEditingIndex: null,
    creditType: 'normal',
    creditsUsed: 0,
    ...overrides,
  } as ScanState;
}

function createMockFileInputRef(): React.RefObject<HTMLInputElement> {
  return {
    current: {
      click: vi.fn(),
      value: '',
    } as unknown as HTMLInputElement,
  };
}

function createDefaultProps(overrides: Partial<ScanInitiationProps> = {}): ScanInitiationProps {
  return {
    scanState: createMockScanState(),
    hasBatchReceipts: false,
    scanImages: [],
    currentTransaction: null,
    createDefaultTransaction: vi.fn(() => createMockTransaction({ id: undefined })),
    defaultCurrency: 'CLP',
    userCredits: { remaining: 10, used: 0, superRemaining: 5, superUsed: 0 },
    lang: 'en',
    setTransactionEditorMode: vi.fn(),
    setCurrentTransaction: vi.fn(),
    setScanImages: vi.fn(),
    setScanError: vi.fn(),
    setScanStoreType: vi.fn(),
    setScanCurrency: vi.fn(),
    setBatchImages: vi.fn(),
    setShowBatchPreview: vi.fn(),
    setToastMessage: vi.fn(),
    setSkipScanCompleteModal: vi.fn(),
    setCreditUsedInSession: vi.fn(),
    setIsRescanning: vi.fn(),
    deductUserCredits: vi.fn().mockResolvedValue(true),
    addUserCredits: vi.fn().mockResolvedValue(undefined),
    processScan: vi.fn().mockResolvedValue(undefined),
    reconcileItemsTotal: vi.fn((items, _total, _lang) => ({ items, hasDiscrepancy: false })),
    t: vi.fn((key) => key),
    fileInputRef: createMockFileInputRef(),
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('useScanInitiation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('hook initialization', () => {
    it('should return all expected handlers', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useScanInitiation(props));

      expect(result.current).toHaveProperty('handleNewTransaction');
      expect(result.current).toHaveProperty('handleFileSelect');
      expect(result.current).toHaveProperty('handleRescan');
      expect(result.current).toHaveProperty('triggerScan');
    });
  });

  describe('handleNewTransaction', () => {
    it('should navigate to batch-review if hasBatchReceipts is true', () => {
      const props = createDefaultProps({ hasBatchReceipts: true });
      const { result } = renderHook(() => useScanInitiation(props));

      act(() => {
        result.current.handleNewTransaction(false);
      });

      expect(mockNavigationStoreActions.setView).toHaveBeenCalledWith('batch-review');
    });

    it('should clear batch editing index when starting fresh single scan', () => {
      const props = createDefaultProps({
        scanState: createMockScanState({ batchEditingIndex: 2 }),
      });
      const { result } = renderHook(() => useScanInitiation(props));

      act(() => {
        result.current.handleNewTransaction(false);
      });

      expect(mockScanStoreActions.setBatchEditingIndex).toHaveBeenCalledWith(null);
    });

    it('should restore pending scan with results', () => {
      const existingTx = createMockTransaction({ id: 'pending-tx' });
      const props = createDefaultProps({
        scanState: createMockScanState({
          phase: 'reviewing',
          images: ['image1.jpg'],
          results: [existingTx],
        }),
      });
      const { result } = renderHook(() => useScanInitiation(props));

      act(() => {
        result.current.handleNewTransaction(false);
      });

      expect(props.setCurrentTransaction).toHaveBeenCalledWith(existingTx);
      expect(props.setTransactionEditorMode).toHaveBeenCalledWith('new');
      expect(mockNavigationStoreActions.navigateToView).toHaveBeenCalledWith('transaction-editor');
    });

    it('should dismiss QuickSaveCard when restoring pending transaction', () => {
      const props = createDefaultProps({
        scanState: createMockScanState({
          phase: 'reviewing',
          images: ['image1.jpg'],
          results: [createMockTransaction()],
          activeDialog: { type: DIALOG_TYPES.QUICKSAVE, data: {} },
        }),
      });
      const { result } = renderHook(() => useScanInitiation(props));

      act(() => {
        result.current.handleNewTransaction(false);
      });

      expect(mockScanStoreActions.dismissDialog).toHaveBeenCalled();
    });

    it('should create fresh session when no pending scan', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useScanInitiation(props));

      act(() => {
        result.current.handleNewTransaction(false);
      });

      expect(props.setScanImages).toHaveBeenCalledWith([]);
      expect(props.setScanError).toHaveBeenCalledWith(null);
      expect(props.setScanStoreType).toHaveBeenCalledWith('auto');
      expect(props.setScanCurrency).toHaveBeenCalledWith('CLP');
      expect(props.createDefaultTransaction).toHaveBeenCalled();
    });

    it('should open file picker when autoOpenFilePicker is true', async () => {
      vi.useFakeTimers();
      const props = createDefaultProps();
      const { result } = renderHook(() => useScanInitiation(props));

      act(() => {
        result.current.handleNewTransaction(true);
      });

      expect(mockNavigationStoreActions.navigateToView).toHaveBeenCalledWith('transaction-editor');

      // Advance timer for the setTimeout
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      expect(props.fileInputRef.current?.click).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('triggerScan', () => {
    it('should call handleNewTransaction with autoOpenFilePicker=true', async () => {
      vi.useFakeTimers();
      const props = createDefaultProps();
      const { result } = renderHook(() => useScanInitiation(props));

      act(() => {
        result.current.triggerScan();
      });

      expect(mockNavigationStoreActions.navigateToView).toHaveBeenCalledWith('transaction-editor');
      vi.useRealTimers();
    });
  });

  describe('handleFileSelect', () => {
    /**
     * Helper to create a mock file change event
     */
    function createMockFileEvent(files: File[]): React.ChangeEvent<HTMLInputElement> {
      const fileList = {
        length: files.length,
        item: (index: number) => files[index] || null,
        [Symbol.iterator]: function* () {
          for (const file of files) yield file;
        },
      } as FileList;

      // Add array-like indexing
      files.forEach((file, index) => {
        Object.defineProperty(fileList, index, { value: file, enumerable: true });
      });

      return {
        target: {
          files: fileList,
        },
      } as React.ChangeEvent<HTMLInputElement>;
    }

    /**
     * Helper to create a mock File with base64 content
     */
    function createMockFile(name: string, content = 'data:image/jpeg;base64,mockdata'): File {
      const blob = new Blob([content], { type: 'image/jpeg' });
      return new File([blob], name, { type: 'image/jpeg' });
    }

    // Mock FileReader for all handleFileSelect tests
    beforeEach(() => {
      // Mock FileReader as a constructor class
      class MockFileReader {
        result: string | null = null;
        onload: (() => void) | null = null;
        readAsDataURL() {
          // Simulate async file reading with microtask
          Promise.resolve().then(() => {
            this.result = 'data:image/jpeg;base64,mockbase64data';
            if (this.onload) this.onload();
          });
        }
      }
      vi.stubGlobal('FileReader', MockFileReader);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should return early if no files selected', async () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useScanInitiation(props));

      const emptyEvent = {
        target: { files: null },
      } as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        await result.current.handleFileSelect(emptyEvent);
      });

      expect(props.setScanImages).not.toHaveBeenCalled();
    });

    it('should return early if files array is empty', async () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useScanInitiation(props));

      const emptyFilesEvent = createMockFileEvent([]);

      await act(async () => {
        await result.current.handleFileSelect(emptyFilesEvent);
      });

      expect(props.setScanImages).not.toHaveBeenCalled();
    });

    it('should process single file in single scan mode and trigger auto-scan', async () => {
      vi.useFakeTimers();
      const props = createDefaultProps({
        scanState: createMockScanState({ mode: 'single' }),
      });
      const { result } = renderHook(() => useScanInitiation(props));

      const event = createMockFileEvent([createMockFile('receipt.jpg')]);

      await act(async () => {
        result.current.handleFileSelect(event);
        // Flush microtask queue for FileReader mock
        await vi.runAllTimersAsync();
      });

      expect(props.setScanImages).toHaveBeenCalled();
      expect(mockNavigationStoreActions.setView).toHaveBeenCalledWith('transaction-editor');
      expect(props.setTransactionEditorMode).toHaveBeenCalledWith('new');
      expect(props.processScan).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should show toast and use only first image when multiple files in single scan mode', async () => {
      vi.useFakeTimers();
      const props = createDefaultProps({
        scanState: createMockScanState({ mode: 'single' }),
      });
      const { result } = renderHook(() => useScanInitiation(props));

      const event = createMockFileEvent([
        createMockFile('receipt1.jpg'),
        createMockFile('receipt2.jpg'),
        createMockFile('receipt3.jpg'),
      ]);

      await act(async () => {
        result.current.handleFileSelect(event);
        await vi.runAllTimersAsync();
      });

      // Should show toast about single image only
      expect(props.setToastMessage).toHaveBeenCalledWith({
        text: 'singleScanOneImageOnly',
        type: 'info',
      });
      // Should still update images (with first one only)
      expect(props.setScanImages).toHaveBeenCalled();
      // Should navigate to transaction editor
      expect(mockNavigationStoreActions.setView).toHaveBeenCalledWith('transaction-editor');
      // Should NOT auto-trigger processScan (user selected multiple, let them review)
      expect(props.processScan).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should show batch preview when multiple files in batch mode', async () => {
      vi.useFakeTimers();
      const props = createDefaultProps({
        scanState: createMockScanState({ mode: 'batch' }),
      });
      const { result } = renderHook(() => useScanInitiation(props));

      const event = createMockFileEvent([
        createMockFile('receipt1.jpg'),
        createMockFile('receipt2.jpg'),
      ]);

      await act(async () => {
        result.current.handleFileSelect(event);
        await vi.runAllTimersAsync();
      });

      expect(props.setBatchImages).toHaveBeenCalled();
      expect(props.setShowBatchPreview).toHaveBeenCalledWith(true);
      // Should NOT navigate to transaction editor
      expect(mockNavigationStoreActions.setView).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should show error toast when exceeding MAX_BATCH_IMAGES limit', async () => {
      vi.useFakeTimers();
      const props = createDefaultProps({
        scanState: createMockScanState({ mode: 'batch' }),
      });
      const { result } = renderHook(() => useScanInitiation(props));

      // Create more files than MAX_BATCH_IMAGES (which is 10)
      const manyFiles = Array.from({ length: 15 }, (_, i) => createMockFile(`receipt${i}.jpg`));
      const event = createMockFileEvent(manyFiles);

      await act(async () => {
        result.current.handleFileSelect(event);
        await vi.runAllTimersAsync();
      });

      expect(props.setToastMessage).toHaveBeenCalledWith({
        text: 'batchMaxLimitError',
        type: 'info',
      });
      // Should NOT show batch preview
      expect(props.setShowBatchPreview).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should clear file input value after selection', async () => {
      vi.useFakeTimers();
      const mockFileInput = {
        click: vi.fn(),
        value: 'some-file-path',
      };
      const fileInputRef = { current: mockFileInput as unknown as HTMLInputElement };

      const props = createDefaultProps({
        scanState: createMockScanState({ mode: 'single' }),
        fileInputRef,
      });
      const { result } = renderHook(() => useScanInitiation(props));

      const event = createMockFileEvent([createMockFile('receipt.jpg')]);

      await act(async () => {
        result.current.handleFileSelect(event);
        await vi.runAllTimersAsync();
      });

      expect(mockFileInput.value).toBe('');
      vi.useRealTimers();
    });
  });

  describe('handleRescan', () => {
    it('should return early if no current transaction', async () => {
      const props = createDefaultProps({ currentTransaction: null });
      const { result } = renderHook(() => useScanInitiation(props));

      await act(async () => {
        await result.current.handleRescan();
      });

      expect(props.deductUserCredits).not.toHaveBeenCalled();
    });

    it('should return early if transaction has no imageUrls', async () => {
      const props = createDefaultProps({
        currentTransaction: createMockTransaction({ imageUrls: [] }),
      });
      const { result } = renderHook(() => useScanInitiation(props));

      await act(async () => {
        await result.current.handleRescan();
      });

      expect(props.deductUserCredits).not.toHaveBeenCalled();
    });

    it('should show toast if no credits remaining', async () => {
      const props = createDefaultProps({
        currentTransaction: createMockTransaction({ imageUrls: ['url1.jpg'] }),
        userCredits: { remaining: 0, used: 10, superRemaining: 0, superUsed: 5 },
      });
      const { result } = renderHook(() => useScanInitiation(props));

      await act(async () => {
        await result.current.handleRescan();
      });

      expect(props.setToastMessage).toHaveBeenCalledWith({
        text: 'noCreditsMessage',
        type: 'info',
      });
      expect(props.deductUserCredits).not.toHaveBeenCalled();
    });

    it('should deduct credit and set rescanning state', async () => {
      const props = createDefaultProps({
        currentTransaction: createMockTransaction({ imageUrls: ['url1.jpg'] }),
      });
      const { result } = renderHook(() => useScanInitiation(props));

      await act(async () => {
        await result.current.handleRescan();
      });

      expect(props.deductUserCredits).toHaveBeenCalledWith(1);
      expect(props.setCreditUsedInSession).toHaveBeenCalledWith(true);
      expect(props.setIsRescanning).toHaveBeenCalledWith(true);
    });

    it('should update transaction with rescan results', async () => {
      const props = createDefaultProps({
        currentTransaction: createMockTransaction({ imageUrls: ['url1.jpg'] }),
      });
      const { result } = renderHook(() => useScanInitiation(props));

      await act(async () => {
        await result.current.handleRescan();
      });

      expect(props.setCurrentTransaction).toHaveBeenCalled();
      expect(props.setIsRescanning).toHaveBeenCalledWith(false);
    });
  });
});
