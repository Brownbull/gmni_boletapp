/**
 * Tests for pendingScanStorage service
 *
 * Story 14.24: Persistent Transaction State
 * Story 14d.4d: pendingScan Migration - ScanState format with backwards compatibility
 * Story 14d.5e: Batch persistence migration - unified persistence for single + batch
 * Tests localStorage-based persistence for pending scans
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  // New API (Story 14d.4d)
  savePersistedScanState,
  loadPersistedScanState,
  clearPersistedScanState,
  hasPersistedScanState,
  getScanStateStorageInfo,
  // Story 14d.5e: Legacy batch migration helpers
  clearLegacyBatchStorage,
  hasLegacyBatchStorage,
  // Legacy API (backwards compatibility)
  savePendingScan,
  loadPendingScan,
  clearPendingScan,
  hasPendingScan,
  getPendingScanStorageInfo,
} from '../../../src/services/pendingScanStorage';
import { createPendingScan, PendingScan } from '../../../src/types/scan';
import type { ScanState } from '../../../src/types/scanStateMachine';
import { SCAN_STATE_VERSION } from '../../../src/types/scanStateMachine';

describe('pendingScanStorage', () => {
  let mockStorage: Record<string, string>;
  let mockLocalStorage: Storage;

  beforeEach(() => {
    // Create mock localStorage
    mockStorage = {};
    mockLocalStorage = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
      length: 0,
      key: vi.fn(() => null),
    };
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('savePendingScan', () => {
    it('saves a pending scan to localStorage', () => {
      const userId = 'test-user-123';
      const scan = createPendingScan();
      scan.images = ['data:image/png;base64,abc123'];

      const result = savePendingScan(userId, scan);

      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `boletapp_pending_scan_${userId}`,
        expect.any(String)
      );
    });

    it('returns false when no userId provided', () => {
      const scan = createPendingScan();
      const result = savePendingScan('', scan);

      expect(result).toBe(false);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('clears storage when scan is null', () => {
      const userId = 'test-user-123';

      const result = savePendingScan(userId, null);

      expect(result).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        `boletapp_pending_scan_${userId}`
      );
    });

    it('filters out oversized images', () => {
      const userId = 'test-user-123';
      const scan = createPendingScan();
      // Create an oversized image (> 5MB)
      const largeImage = 'data:image/png;base64,' + 'a'.repeat(6 * 1024 * 1024);
      scan.images = [largeImage, 'data:image/png;base64,small'];

      savePendingScan(userId, scan);

      // Verify setItem was called
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(
        (mockLocalStorage.setItem as any).mock.calls[0][1]
      );
      // Story 14d.4d: New format wraps state in { version, state, persistedAt }
      // The oversized image should be filtered out
      const images = savedData.state?.images ?? savedData.images;
      expect(images.length).toBe(1);
      expect(images[0]).toBe('data:image/png;base64,small');
    });

    it('saves empty scan without clearing (consumer decides when to clear)', () => {
      const userId = 'test-user-123';
      const scan = createPendingScan();
      // Empty scan - no images, no transaction

      const result = savePendingScan(userId, scan);

      // savePendingScan saves any non-null scan; App.tsx decides when to clear
      // based on business logic (e.g., phase === 'idle' with no content)
      expect(result).toBe(true);
      const loaded = loadPendingScan(userId);
      expect(loaded).not.toBeNull();
    });
  });

  describe('loadPendingScan', () => {
    it('returns null when no userId provided', () => {
      const result = loadPendingScan('');
      expect(result).toBeNull();
    });

    it('returns null when no scan stored', () => {
      const result = loadPendingScan('test-user-123');
      expect(result).toBeNull();
    });

    it('loads and deserializes a stored scan', () => {
      const userId = 'test-user-123';
      const scan = createPendingScan();
      scan.images = ['data:image/png;base64,abc'];

      // Store the scan
      savePendingScan(userId, scan);

      // Load it back
      const loaded = loadPendingScan(userId);

      expect(loaded).not.toBeNull();
      expect(loaded?.sessionId).toBe(scan.sessionId);
      expect(loaded?.images).toEqual(scan.images);
      expect(loaded?.createdAt).toBeInstanceOf(Date);
    });

    it('returns null for invalid JSON', () => {
      const userId = 'test-user-123';
      mockStorage[`boletapp_pending_scan_${userId}`] = 'invalid json {{{';

      const result = loadPendingScan(userId);
      expect(result).toBeNull();
    });

    it('returns null for missing sessionId', () => {
      const userId = 'test-user-123';
      mockStorage[`boletapp_pending_scan_${userId}`] = JSON.stringify({
        images: [],
        status: 'images_added',
      });

      const result = loadPendingScan(userId);
      expect(result).toBeNull();
    });
  });

  describe('clearPendingScan', () => {
    it('removes the scan from storage', () => {
      const userId = 'test-user-123';
      const scan = createPendingScan();
      savePendingScan(userId, scan);

      clearPendingScan(userId);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        `boletapp_pending_scan_${userId}`
      );
    });

    it('does nothing when no userId provided', () => {
      clearPendingScan('');
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('hasPendingScan', () => {
    it('returns false when no userId provided', () => {
      expect(hasPendingScan('')).toBe(false);
    });

    it('returns false when no scan stored', () => {
      expect(hasPendingScan('test-user-123')).toBe(false);
    });

    it('returns true when scan exists', () => {
      const userId = 'test-user-123';
      const scan = createPendingScan();
      scan.images = ['test'];
      savePendingScan(userId, scan);

      expect(hasPendingScan(userId)).toBe(true);
    });
  });

  describe('getPendingScanStorageInfo', () => {
    it('returns empty info when no userId provided', () => {
      const info = getPendingScanStorageInfo('');
      expect(info.exists).toBe(false);
      expect(info.sizeBytes).toBe(0);
    });

    it('returns empty info when no scan stored', () => {
      const info = getPendingScanStorageInfo('test-user-123');
      expect(info.exists).toBe(false);
    });

    it('returns correct info for stored scan', () => {
      const userId = 'test-user-123';
      const scan = createPendingScan();
      scan.images = ['data:image/png;base64,abc'];
      scan.analyzedTransaction = {
        merchant: 'Test Store',
        total: 1000,
        date: '2025-01-01',
        category: 'Supermarket',
        items: [],
      } as any;

      savePendingScan(userId, scan);

      const info = getPendingScanStorageInfo(userId);
      expect(info.exists).toBe(true);
      expect(info.sizeBytes).toBeGreaterThan(0);
      expect(info.imageCount).toBe(1);
      expect(info.hasTransaction).toBe(true);
    });
  });

  // ==========================================================================
  // Story 14d.4d: New ScanState API Tests
  // ==========================================================================

  describe('savePersistedScanState (Story 14d.4d)', () => {
    const createTestScanState = (overrides: Partial<ScanState> = {}): ScanState => ({
      phase: 'capturing',
      mode: 'single',
      requestId: 'req-test-123',
      userId: 'test-user-123',
      startedAt: 1704067200000,
      images: [],
      results: [],
      activeResultIndex: 0,
      creditStatus: 'none',
      creditType: null,
      creditsCount: 0,
      activeDialog: null,
      error: null,
      batchProgress: null,
      storeType: null,
      currency: null,
      ...overrides,
    });

    it('saves ScanState to localStorage with versioned wrapper', () => {
      const userId = 'test-user-123';
      const state = createTestScanState({ images: ['data:image/png;base64,test'] });

      const result = savePersistedScanState(userId, state);

      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();

      const savedData = JSON.parse(
        (mockLocalStorage.setItem as any).mock.calls[0][1]
      );
      expect(savedData.version).toBe(SCAN_STATE_VERSION);
      expect(savedData.state.phase).toBe('capturing');
      expect(savedData.state.images).toEqual(['data:image/png;base64,test']);
      expect(savedData.persistedAt).toBeGreaterThan(0);
    });

    it('returns false when no userId provided', () => {
      const state = createTestScanState();
      const result = savePersistedScanState('', state);

      expect(result).toBe(false);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('clears storage when state is null', () => {
      const userId = 'test-user-123';

      const result = savePersistedScanState(userId, null);

      expect(result).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        `boletapp_pending_scan_${userId}`
      );
    });

    it('filters out oversized images from state', () => {
      const userId = 'test-user-123';
      const largeImage = 'data:image/png;base64,' + 'a'.repeat(6 * 1024 * 1024);
      const state = createTestScanState({
        images: [largeImage, 'data:image/png;base64,small'],
      });

      savePersistedScanState(userId, state);

      const savedData = JSON.parse(
        (mockLocalStorage.setItem as any).mock.calls[0][1]
      );
      expect(savedData.state.images.length).toBe(1);
      expect(savedData.state.images[0]).toBe('data:image/png;base64,small');
    });
  });

  describe('loadPersistedScanState (Story 14d.4d)', () => {
    it('returns null when no userId provided', () => {
      const result = loadPersistedScanState('');
      expect(result).toBeNull();
    });

    it('returns null when no state stored', () => {
      const result = loadPersistedScanState('test-user-123');
      expect(result).toBeNull();
    });

    it('loads and deserializes ScanState from new format', () => {
      const userId = 'test-user-123';
      const storedState = {
        version: SCAN_STATE_VERSION,
        state: {
          phase: 'reviewing',
          mode: 'single',
          requestId: 'req-123',
          userId,
          startedAt: 1704067200000,
          images: ['data:image/png;base64,test'],
          results: [{ merchant: 'Test', total: 100 }],
          activeResultIndex: 0,
          creditStatus: 'confirmed',
          creditType: 'normal',
          creditsCount: 1,
          activeDialog: null,
          error: null,
          batchProgress: null,
          storeType: null,
          currency: null,
        },
        persistedAt: Date.now(),
      };
      mockStorage[`boletapp_pending_scan_${userId}`] = JSON.stringify(storedState);

      const loaded = loadPersistedScanState(userId);

      expect(loaded).not.toBeNull();
      expect(loaded?.phase).toBe('reviewing');
      expect(loaded?.creditStatus).toBe('confirmed');
      expect(loaded?.results.length).toBe(1);
    });

    it('migrates old PendingScan format to ScanState', () => {
      const userId = 'test-user-123';
      // Old format - has sessionId at root, no version
      const oldFormat = {
        sessionId: 'scan-old-123',
        images: ['data:image/png;base64,old'],
        analyzedTransaction: { merchant: 'Old Store', total: 50, items: [] },
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'analyzed',
      };
      mockStorage[`boletapp_pending_scan_${userId}`] = JSON.stringify(oldFormat);

      const loaded = loadPersistedScanState(userId);

      expect(loaded).not.toBeNull();
      // Should migrate to new format
      expect(loaded?.phase).toBe('reviewing'); // 'analyzed' -> 'reviewing'
      expect(loaded?.mode).toBe('single');
      expect(loaded?.requestId).toBe('scan-old-123');
      expect(loaded?.images).toEqual(['data:image/png;base64,old']);
      expect(loaded?.results.length).toBe(1);
      expect(loaded?.results[0].merchant).toBe('Old Store');
      expect(loaded?.creditStatus).toBe('confirmed'); // Has transaction = credit spent
      expect(loaded?.userId).toBe(userId); // Set during migration
    });

    it('migrates interrupted scan (analyzing) to error state', () => {
      const userId = 'test-user-123';
      const oldFormat = {
        sessionId: 'scan-interrupted',
        images: ['data:image/png;base64,img'],
        analyzedTransaction: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'analyzing', // Was in progress when app closed
      };
      mockStorage[`boletapp_pending_scan_${userId}`] = JSON.stringify(oldFormat);

      const loaded = loadPersistedScanState(userId);

      expect(loaded).not.toBeNull();
      expect(loaded?.phase).toBe('error');
      expect(loaded?.error).toBe('Escaneo interrumpido. Intenta de nuevo.');
    });

    it('migrates images_added status to capturing phase', () => {
      const userId = 'test-user-123';
      const oldFormat = {
        sessionId: 'scan-images',
        images: ['data:image/png;base64,img1', 'data:image/png;base64,img2'],
        analyzedTransaction: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'images_added',
      };
      mockStorage[`boletapp_pending_scan_${userId}`] = JSON.stringify(oldFormat);

      const loaded = loadPersistedScanState(userId);

      expect(loaded).not.toBeNull();
      expect(loaded?.phase).toBe('capturing');
      expect(loaded?.images.length).toBe(2);
      expect(loaded?.creditStatus).toBe('none'); // No transaction = no credit
    });
  });

  describe('getScanStateStorageInfo (Story 14d.4d)', () => {
    it('returns isLegacyFormat: true for old format', () => {
      const userId = 'test-user-123';
      const oldFormat = {
        sessionId: 'old-scan',
        images: [],
        analyzedTransaction: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'images_added',
      };
      mockStorage[`boletapp_pending_scan_${userId}`] = JSON.stringify(oldFormat);

      const info = getScanStateStorageInfo(userId);

      expect(info.exists).toBe(true);
      expect(info.isLegacyFormat).toBe(true);
      expect(info.phase).toBe('capturing');
    });

    it('returns isLegacyFormat: false for new format', () => {
      const userId = 'test-user-123';
      const newFormat = {
        version: SCAN_STATE_VERSION,
        state: {
          phase: 'reviewing',
          mode: 'single',
          images: ['img1'],
          results: [{ merchant: 'Test' }],
        },
        persistedAt: Date.now(),
      };
      mockStorage[`boletapp_pending_scan_${userId}`] = JSON.stringify(newFormat);

      const info = getScanStateStorageInfo(userId);

      expect(info.exists).toBe(true);
      expect(info.isLegacyFormat).toBe(false);
      expect(info.phase).toBe('reviewing');
      expect(info.imageCount).toBe(1);
      expect(info.resultCount).toBe(1);
    });
  });

  describe('Legacy API compatibility (Story 14d.4d)', () => {
    it('savePendingScan converts to new format internally', () => {
      const userId = 'test-user-123';
      const scan = createPendingScan();
      scan.images = ['data:image/png;base64,test'];

      savePendingScan(userId, scan);

      // Should be saved in new format
      const savedData = JSON.parse(
        (mockLocalStorage.setItem as any).mock.calls[0][1]
      );
      expect(savedData.version).toBe(SCAN_STATE_VERSION);
      expect(savedData.state).toBeDefined();
    });

    it('loadPendingScan returns data in old format for compatibility', () => {
      const userId = 'test-user-123';
      // Save in new format
      const newFormat = {
        version: SCAN_STATE_VERSION,
        state: {
          phase: 'reviewing',
          mode: 'single',
          requestId: 'req-123',
          userId,
          images: ['data:image/png;base64,test'],
          results: [{ merchant: 'Test Store', total: 100, items: [] }],
          creditStatus: 'confirmed',
          creditType: 'normal',
          creditsCount: 1,
          startedAt: Date.now(),
          activeResultIndex: 0,
          activeDialog: null,
          error: null,
          batchProgress: null,
          storeType: null,
          currency: null,
        },
        persistedAt: Date.now(),
      };
      mockStorage[`boletapp_pending_scan_${userId}`] = JSON.stringify(newFormat);

      const loaded = loadPendingScan(userId);

      // Should return old PendingScan format
      expect(loaded).not.toBeNull();
      expect(loaded?.sessionId).toBe('req-123');
      expect(loaded?.status).toBe('analyzed'); // 'reviewing' -> 'analyzed'
      expect(loaded?.images).toEqual(['data:image/png;base64,test']);
      expect(loaded?.analyzedTransaction).toEqual({ merchant: 'Test Store', total: 100, items: [] });
    });
  });

  // ==========================================================================
  // Story 14d.5e: Batch Persistence Migration Tests
  // ==========================================================================

  describe('Batch persistence migration (Story 14d.5e)', () => {
    const LEGACY_BATCH_KEY_PREFIX = 'boletapp_pending_batch_';

    describe('loadPersistedScanState with legacy batch', () => {
      it('migrates legacy batch storage when no regular scan state exists', () => {
        const userId = 'test-user-123';
        // Legacy batch format (from pendingBatchStorage.ts)
        const legacyBatch = {
          sessionId: 'batch_12345',
          images: ['data:image/png;base64,batch1', 'data:image/png;base64,batch2'],
          results: [
            { id: 'r1', index: 0, success: true, result: { merchant: 'Store A', total: 100, items: [] } },
            { id: 'r2', index: 1, success: true, result: { merchant: 'Store B', total: 200, items: [] } },
          ],
          status: 'reviewing',
          createdAt: '2025-01-01T00:00:00.000Z',
          creditsUsed: 1,
        };
        mockStorage[`${LEGACY_BATCH_KEY_PREFIX}${userId}`] = JSON.stringify(legacyBatch);

        const loaded = loadPersistedScanState(userId);

        expect(loaded).not.toBeNull();
        expect(loaded?.mode).toBe('batch');
        expect(loaded?.phase).toBe('reviewing');
        expect(loaded?.images.length).toBe(2);
        expect(loaded?.results.length).toBe(2);
        expect(loaded?.results[0].merchant).toBe('Store A');
        expect(loaded?.creditStatus).toBe('confirmed');
      });

      it('prefers regular scan state over legacy batch', () => {
        const userId = 'test-user-123';
        // Regular scan state (new format)
        const newFormat = {
          version: SCAN_STATE_VERSION,
          state: {
            phase: 'reviewing',
            mode: 'single',
            requestId: 'req-single',
            userId,
            images: ['data:image/png;base64,single'],
            results: [{ merchant: 'Single Store', total: 50, items: [] }],
            creditStatus: 'confirmed',
            creditType: 'normal',
            creditsCount: 1,
            startedAt: Date.now(),
            activeResultIndex: 0,
            activeDialog: null,
            error: null,
            batchProgress: null,
            storeType: null,
            currency: null,
          },
          persistedAt: Date.now(),
        };
        mockStorage[`boletapp_pending_scan_${userId}`] = JSON.stringify(newFormat);

        // Legacy batch also exists
        const legacyBatch = {
          sessionId: 'batch_12345',
          images: ['data:image/png;base64,batch1'],
          results: [{ id: 'r1', index: 0, success: true, result: { merchant: 'Batch Store', total: 100, items: [] } }],
          status: 'reviewing',
          createdAt: '2025-01-01T00:00:00.000Z',
          creditsUsed: 1,
        };
        mockStorage[`${LEGACY_BATCH_KEY_PREFIX}${userId}`] = JSON.stringify(legacyBatch);

        const loaded = loadPersistedScanState(userId);

        // Should load regular scan state, not batch
        expect(loaded).not.toBeNull();
        expect(loaded?.mode).toBe('single');
        expect(loaded?.results[0].merchant).toBe('Single Store');
      });

      it('migrates legacy batch with capturing status', () => {
        const userId = 'test-user-123';
        const legacyBatch = {
          sessionId: 'batch_capture',
          images: ['data:image/png;base64,img1', 'data:image/png;base64,img2', 'data:image/png;base64,img3'],
          results: [],
          status: 'capturing',
          createdAt: '2025-01-01T00:00:00.000Z',
          creditsUsed: 0,
        };
        mockStorage[`${LEGACY_BATCH_KEY_PREFIX}${userId}`] = JSON.stringify(legacyBatch);

        const loaded = loadPersistedScanState(userId);

        expect(loaded).not.toBeNull();
        expect(loaded?.mode).toBe('batch');
        expect(loaded?.phase).toBe('capturing');
        expect(loaded?.images.length).toBe(3);
        expect(loaded?.creditStatus).toBe('none');
      });

      it('migrates legacy batch with failed results', () => {
        const userId = 'test-user-123';
        const legacyBatch = {
          sessionId: 'batch_mixed',
          images: ['data:image/png;base64,img1', 'data:image/png;base64,img2'],
          results: [
            { id: 'r1', index: 0, success: true, result: { merchant: 'Good Store', total: 100, items: [] } },
            { id: 'r2', index: 1, success: false, error: 'OCR failed' },
          ],
          status: 'reviewing',
          createdAt: '2025-01-01T00:00:00.000Z',
          creditsUsed: 1,
        };
        mockStorage[`${LEGACY_BATCH_KEY_PREFIX}${userId}`] = JSON.stringify(legacyBatch);

        const loaded = loadPersistedScanState(userId);

        expect(loaded).not.toBeNull();
        expect(loaded?.mode).toBe('batch');
        expect(loaded?.results.length).toBe(1); // Only successful results
        expect(loaded?.batchProgress?.failed.length).toBe(1);
        expect(loaded?.batchProgress?.failed[0].error).toBe('OCR failed');
      });
    });

    describe('hasLegacyBatchStorage', () => {
      it('returns false when no legacy batch exists', () => {
        expect(hasLegacyBatchStorage('test-user-123')).toBe(false);
      });

      it('returns true when legacy batch exists', () => {
        const userId = 'test-user-123';
        mockStorage[`${LEGACY_BATCH_KEY_PREFIX}${userId}`] = JSON.stringify({
          sessionId: 'batch_test',
          images: [],
          results: [],
          status: 'capturing',
        });

        expect(hasLegacyBatchStorage(userId)).toBe(true);
      });

      it('returns false when no userId provided', () => {
        expect(hasLegacyBatchStorage('')).toBe(false);
      });
    });

    describe('clearLegacyBatchStorage', () => {
      it('removes legacy batch from storage', () => {
        const userId = 'test-user-123';
        mockStorage[`${LEGACY_BATCH_KEY_PREFIX}${userId}`] = JSON.stringify({
          sessionId: 'batch_test',
        });

        clearLegacyBatchStorage(userId);

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
          `${LEGACY_BATCH_KEY_PREFIX}${userId}`
        );
        expect(hasLegacyBatchStorage(userId)).toBe(false);
      });

      it('does nothing when no userId provided', () => {
        clearLegacyBatchStorage('');
        expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
      });
    });

    describe('Batch state persistence round-trip', () => {
      const createBatchScanState = (overrides: Partial<ScanState> = {}): ScanState => ({
        phase: 'reviewing',
        mode: 'batch',
        requestId: 'batch-req-123',
        userId: 'test-user-123',
        startedAt: 1704067200000,
        images: ['data:image/png;base64,batch1', 'data:image/png;base64,batch2'],
        results: [
          { merchant: 'Store A', total: 100, items: [], date: '2025-01-01', category: 'Supermarket' } as any,
          { merchant: 'Store B', total: 200, items: [], date: '2025-01-02', category: 'Restaurant' } as any,
        ],
        activeResultIndex: 0,
        creditStatus: 'confirmed',
        creditType: 'super',
        creditsCount: 1,
        activeDialog: null,
        error: null,
        batchProgress: {
          current: 2,
          total: 2,
          completed: [],
          failed: [],
        },
        batchReceipts: [
          { id: 'r1', imageDataUrl: 'data:image/png;base64,batch1', status: 'pending', transaction: { merchant: 'Store A', total: 100, items: [], date: '2025-01-01', category: 'Supermarket' } as any },
          { id: 'r2', imageDataUrl: 'data:image/png;base64,batch2', status: 'pending', transaction: { merchant: 'Store B', total: 200, items: [], date: '2025-01-02', category: 'Restaurant' } as any },
        ],
        batchEditingIndex: null,
        storeType: null,
        currency: null,
        ...overrides,
      });

      it('saves and loads batch state correctly', () => {
        const userId = 'test-user-123';
        const batchState = createBatchScanState();

        savePersistedScanState(userId, batchState);
        const loaded = loadPersistedScanState(userId);

        expect(loaded).not.toBeNull();
        expect(loaded?.mode).toBe('batch');
        expect(loaded?.phase).toBe('reviewing');
        expect(loaded?.images.length).toBe(2);
        expect(loaded?.results.length).toBe(2);
        expect(loaded?.batchReceipts?.length).toBe(2);
        expect(loaded?.creditType).toBe('super');
      });

      it('preserves batchEditingIndex during persistence', () => {
        const userId = 'test-user-123';
        const batchState = createBatchScanState({ batchEditingIndex: 1 });

        savePersistedScanState(userId, batchState);
        const loaded = loadPersistedScanState(userId);

        expect(loaded?.batchEditingIndex).toBe(1);
      });

      it('preserves batchProgress during persistence', () => {
        const userId = 'test-user-123';
        const batchState = createBatchScanState({
          batchProgress: {
            current: 3,
            total: 5,
            completed: [{ merchant: 'Done', total: 50 } as any],
            failed: [{ index: 2, error: 'Failed to process' }],
          },
        });

        savePersistedScanState(userId, batchState);
        const loaded = loadPersistedScanState(userId);

        expect(loaded?.batchProgress?.current).toBe(3);
        expect(loaded?.batchProgress?.total).toBe(5);
        expect(loaded?.batchProgress?.failed.length).toBe(1);
        expect(loaded?.batchProgress?.failed[0].error).toBe('Failed to process');
      });
    });
  });
});
