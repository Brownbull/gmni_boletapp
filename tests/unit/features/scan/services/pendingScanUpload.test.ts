/**
 * Story TD-18-10: pendingScanUpload service tests
 *
 * Tests uploadScanImages (progress, errors, limits, MIME validation)
 * and copyPendingToReceipts (progress, URL validation).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { UploadTaskSnapshot } from 'firebase/storage';

// Mock variables declared before vi.mock (hoisted)
const mockRef = vi.fn();
const mockUploadBytesResumable = vi.fn();
const mockGetDownloadURL = vi.fn();

vi.mock('firebase/storage', () => ({
  ref: (...args: unknown[]) => mockRef(...args),
  uploadBytesResumable: (...args: unknown[]) => mockUploadBytesResumable(...args),
  getDownloadURL: (...args: unknown[]) => mockGetDownloadURL(...args),
}));

vi.mock('@/config/firebase', () => ({
  storage: { name: 'mock-storage' },
}));

import { uploadScanImages, copyPendingToReceipts } from '@features/scan/services/pendingScanUpload';

// Minimal valid base64 JPEG data URL for tests
const VALID_JPEG_DATA_URL = 'data:image/jpeg;base64,' + btoa('fake-jpeg-bytes');
const VALID_PNG_DATA_URL = 'data:image/png;base64,' + btoa('fake-png-bytes');

type OnCallback = (
  event: string,
  progressCb: (snap: Partial<UploadTaskSnapshot>) => void,
  errorCb: (err: Error) => void,
  completeCb: () => void
) => void;

/** Factory for uploadBytesResumable mock return value (uploadScanImages path) */
function makeUploadTask(
  outcome: 'success' | 'error',
  errorMsg = 'storage/unauthorized'
) {
  const snapshotRef = { fullPath: 'mock-ref' };
  return {
    snapshot: { ref: snapshotRef },
    on: vi.fn(((
      _event: string,
      progressCb: (snap: Partial<UploadTaskSnapshot>) => void,
      errorCb: (err: Error) => void,
      completeCb: () => void
    ) => {
      if (outcome === 'success') {
        progressCb({ bytesTransferred: 100, totalBytes: 100 });
        completeCb();
      } else {
        errorCb(new Error(errorMsg));
      }
    }) as OnCallback),
  };
}

describe('uploadScanImages', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRef.mockReturnValue('storage-ref');
    mockGetDownloadURL.mockResolvedValue('https://firebasestorage.googleapis.com/download/img.jpg');
  });

  // AC-3: empty array returns empty array
  it('returns empty array when no images provided', async () => {
    const result = await uploadScanImages('user-1', 'scan-1', []);

    expect(result).toEqual([]);
    expect(mockUploadBytesResumable).not.toHaveBeenCalled();
  });

  // AC-4: exceeding MAX_SCAN_IMAGES throws
  it('throws when image count exceeds MAX_SCAN_IMAGES (10)', async () => {
    const tooManyImages = Array.from({ length: 11 }, () => VALID_JPEG_DATA_URL);

    await expect(uploadScanImages('user-1', 'scan-1', tooManyImages))
      .rejects.toThrow('Too many images: 11. Maximum is 10.');
  });

  // AC-5: rejects non-allowlisted MIME types (via base64ToBlob)
  it('rejects non-allowlisted MIME type (image/gif)', async () => {
    const gifDataUrl = 'data:image/gif;base64,' + btoa('fake-gif');

    await expect(uploadScanImages('user-1', 'scan-1', [gifDataUrl]))
      .rejects.toThrow('Unsupported image type: image/gif');
  });

  // AC-6: rejects malformed data URLs (missing comma)
  it('rejects data URL missing base64 content', async () => {
    await expect(uploadScanImages('user-1', 'scan-1', ['nodataprefix']))
      .rejects.toThrow('Invalid data URL: missing base64 content');
  });

  // AC-6: rejects data URL missing MIME type
  it('rejects data URL with missing MIME type', async () => {
    await expect(uploadScanImages('user-1', 'scan-1', ['nocolon;base64,abc']))
      .rejects.toThrow('Invalid data URL: missing MIME type');
  });

  // AC-1: success path with progress callback assertions
  it('uploads images and reports progress via callback', async () => {
    const task = makeUploadTask('success');
    mockUploadBytesResumable.mockReturnValue(task);

    const onProgress = vi.fn();
    const result = await uploadScanImages('user-1', 'scan-1', [VALID_JPEG_DATA_URL, VALID_PNG_DATA_URL], onProgress);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe('https://firebasestorage.googleapis.com/download/img.jpg');
    expect(mockRef).toHaveBeenCalledWith({ name: 'mock-storage' }, 'users/user-1/scans/scan-1/image_0.jpg');
    expect(mockRef).toHaveBeenCalledWith({ name: 'mock-storage' }, 'users/user-1/scans/scan-1/image_1.jpg');
    expect(onProgress).toHaveBeenCalledWith(100);
  });

  // AC-1: single image progress goes to 100
  it('reports 100% progress for single image upload', async () => {
    const task = makeUploadTask('success');
    mockUploadBytesResumable.mockReturnValue(task);

    const onProgress = vi.fn();
    await uploadScanImages('user-1', 'scan-1', [VALID_JPEG_DATA_URL], onProgress);

    expect(onProgress).toHaveBeenCalledWith(100);
  });

  // AC-2: upload failure returns meaningful error
  it('rejects with meaningful error on upload failure', async () => {
    const task = makeUploadTask('error', 'storage/unauthorized');
    mockUploadBytesResumable.mockReturnValue(task);

    await expect(uploadScanImages('user-1', 'scan-1', [VALID_JPEG_DATA_URL]))
      .rejects.toThrow('Upload failed for image 0: storage/unauthorized');
  });

  // AC-2: getDownloadURL failure
  it('rejects when getDownloadURL fails', async () => {
    const snapshotRef = { fullPath: 'mock-ref' };
    mockUploadBytesResumable.mockReturnValue({
      snapshot: { ref: snapshotRef },
      on: vi.fn((_event: string, _progressCb: unknown, _errorCb: unknown, completeCb: () => void) => {
        completeCb();
      }),
    });
    mockGetDownloadURL.mockRejectedValue(new Error('permission denied'));

    await expect(uploadScanImages('user-1', 'scan-1', [VALID_JPEG_DATA_URL]))
      .rejects.toThrow('Failed to get download URL for image 0');
  });
});

describe('copyPendingToReceipts', () => {
  const VALID_STORAGE_URL = 'https://firebasestorage.googleapis.com/v0/b/bucket/o/image.jpg';
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
    mockRef.mockReturnValue('storage-ref');
    mockUploadBytesResumable.mockResolvedValue(undefined);
    mockGetDownloadURL.mockResolvedValue('https://firebasestorage.googleapis.com/v0/b/bucket/o/receipt.jpg');
    global.fetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob(['fake'], { type: 'image/jpeg' })),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // Empty array returns empty
  it('returns empty array when no URLs provided', async () => {
    const result = await copyPendingToReceipts([], 'user-1', 'tx-1');

    expect(result).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // AC-8: rejects non-Firebase-Storage URLs
  it('rejects non-Firebase-Storage URL', async () => {
    await expect(copyPendingToReceipts(['https://example.com/img.jpg'], 'user-1', 'tx-1'))
      .rejects.toThrow('Invalid Storage URL at index 0: URL must be a Firebase Storage URL');
  });

  // AC-8: mixed valid and invalid URLs — fails on invalid
  it('rejects when any URL is invalid (mixed array)', async () => {
    await expect(
      copyPendingToReceipts([VALID_STORAGE_URL, 'https://evil.com/img.jpg'], 'user-1', 'tx-1')
    ).rejects.toThrow('Invalid Storage URL at index 1');
  });

  // AC-7: success with progress callback
  it('copies images and reports progress via callback', async () => {
    const urls = [VALID_STORAGE_URL, VALID_STORAGE_URL];
    const onProgress = vi.fn();

    const result = await copyPendingToReceipts(urls, 'user-1', 'tx-1', onProgress);

    expect(result).toHaveLength(2);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(mockRef).toHaveBeenCalledWith({ name: 'mock-storage' }, 'receipts/user-1/tx-1/image_0.jpg');
    expect(mockRef).toHaveBeenCalledWith({ name: 'mock-storage' }, 'receipts/user-1/tx-1/image_1.jpg');
    expect(onProgress).toHaveBeenCalledWith(50);
    expect(onProgress).toHaveBeenCalledWith(100);
  });

  // AC-7: single URL reports 100%
  it('reports 100% progress for single URL', async () => {
    const onProgress = vi.fn();

    await copyPendingToReceipts([VALID_STORAGE_URL], 'user-1', 'tx-1', onProgress);

    expect(onProgress).toHaveBeenCalledWith(100);
    expect(onProgress).toHaveBeenCalledTimes(1);
  });

  // Fetch failure propagates
  it('propagates fetch error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network error'));

    await expect(copyPendingToReceipts([VALID_STORAGE_URL], 'user-1', 'tx-1'))
      .rejects.toThrow('network error');
  });
});
