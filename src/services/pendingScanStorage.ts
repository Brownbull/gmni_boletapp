/**
 * Pending Scan Storage Service
 *
 * Story 14.24: Persistent Transaction State
 * Stores pending scan state in localStorage so it survives:
 * - Page refresh
 * - Tab close/reopen
 * - Logout/login
 *
 * The pending scan is stored per-user to avoid conflicts when switching accounts.
 * Images are stored as base64 strings which can be large, so we use a size limit.
 */

import { PendingScan, createPendingScan } from '../types/scan';
import { Transaction } from '../types/transaction';

const STORAGE_KEY_PREFIX = 'boletapp_pending_scan_';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB max per image

/**
 * Get the storage key for a specific user
 */
function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

/**
 * Serialize a PendingScan for storage.
 * Handles Date conversion and validates image sizes.
 */
function serializePendingScan(scan: PendingScan): string {
  // Filter out oversized images with warning
  const filteredImages = scan.images.filter((img, index) => {
    const size = img.length;
    if (size > MAX_IMAGE_SIZE_BYTES) {
      console.warn(`Image ${index} exceeds max size (${size} bytes), skipping storage`);
      return false;
    }
    return true;
  });

  const serializable = {
    ...scan,
    images: filteredImages,
    createdAt: scan.createdAt.toISOString(),
  };

  return JSON.stringify(serializable);
}

/**
 * Deserialize a PendingScan from storage.
 * Handles Date parsing and validates structure.
 */
function deserializePendingScan(json: string): PendingScan | null {
  try {
    const parsed = JSON.parse(json);

    // Validate required fields
    if (!parsed.sessionId || typeof parsed.sessionId !== 'string') {
      console.warn('Invalid pending scan: missing sessionId');
      return null;
    }

    // Reconstruct with proper types
    const scan: PendingScan = {
      sessionId: parsed.sessionId,
      images: Array.isArray(parsed.images) ? parsed.images : [],
      analyzedTransaction: parsed.analyzedTransaction || null,
      createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(),
      status: parsed.status || 'images_added',
      error: parsed.error || undefined,
    };

    return scan;
  } catch (error) {
    console.error('Failed to parse pending scan from storage:', error);
    return null;
  }
}

/**
 * Save pending scan to localStorage for a specific user.
 * Returns true if successful, false otherwise.
 */
export function savePendingScan(userId: string, scan: PendingScan | null): boolean {
  if (!userId) {
    console.warn('Cannot save pending scan: no userId');
    return false;
  }

  const key = getStorageKey(userId);

  try {
    if (scan === null) {
      // Clear the stored scan
      localStorage.removeItem(key);
      return true;
    }

    const serialized = serializePendingScan(scan);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    // Handle quota exceeded or other storage errors
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded, cannot save pending scan');
      // Try to save without images as fallback
      // Note: scan cannot be null here because we return early at line 95 for null case
      try {
        const scanWithoutImages: PendingScan = { ...scan!, images: [] };
        localStorage.setItem(key, serializePendingScan(scanWithoutImages));
        console.warn('Saved pending scan without images due to quota');
        return true;
      } catch {
        return false;
      }
    }
    console.error('Failed to save pending scan:', error);
    return false;
  }
}

/**
 * Load pending scan from localStorage for a specific user.
 * Returns null if no scan is stored or if parsing fails.
 */
export function loadPendingScan(userId: string): PendingScan | null {
  if (!userId) {
    return null;
  }

  const key = getStorageKey(userId);

  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return null;
    }

    return deserializePendingScan(stored);
  } catch (error) {
    console.error('Failed to load pending scan:', error);
    return null;
  }
}

/**
 * Clear pending scan from localStorage for a specific user.
 */
export function clearPendingScan(userId: string): void {
  if (!userId) {
    return;
  }

  const key = getStorageKey(userId);
  localStorage.removeItem(key);
}

/**
 * Check if a pending scan exists in storage for a specific user.
 */
export function hasPendingScan(userId: string): boolean {
  if (!userId) {
    return false;
  }

  const key = getStorageKey(userId);
  return localStorage.getItem(key) !== null;
}

/**
 * Update just the analyzed transaction in storage without rewriting images.
 * This is more efficient for frequent updates during editing.
 */
export function updatePendingScanTransaction(
  userId: string,
  transaction: Transaction | null
): boolean {
  const scan = loadPendingScan(userId);
  if (!scan) {
    // No existing scan, create a new one with the transaction
    if (transaction) {
      const newScan = createPendingScan();
      newScan.analyzedTransaction = transaction;
      return savePendingScan(userId, newScan);
    }
    return false;
  }

  // Update the existing scan
  scan.analyzedTransaction = transaction;
  return savePendingScan(userId, scan);
}

/**
 * Update just the images in storage.
 */
export function updatePendingScanImages(
  userId: string,
  images: string[]
): boolean {
  const scan = loadPendingScan(userId);
  if (!scan) {
    // No existing scan, create a new one with images
    const newScan = createPendingScan();
    newScan.images = images;
    newScan.status = images.length > 0 ? 'images_added' : 'images_added';
    return savePendingScan(userId, newScan);
  }

  // Update the existing scan
  scan.images = images;
  scan.status = images.length > 0 ? 'images_added' : scan.status;
  return savePendingScan(userId, scan);
}

/**
 * Get storage usage info for debugging.
 */
export function getPendingScanStorageInfo(userId: string): {
  exists: boolean;
  sizeBytes: number;
  imageCount: number;
  hasTransaction: boolean;
} {
  if (!userId) {
    return { exists: false, sizeBytes: 0, imageCount: 0, hasTransaction: false };
  }

  const key = getStorageKey(userId);
  const stored = localStorage.getItem(key);

  if (!stored) {
    return { exists: false, sizeBytes: 0, imageCount: 0, hasTransaction: false };
  }

  const scan = deserializePendingScan(stored);
  return {
    exists: true,
    sizeBytes: stored.length * 2, // UTF-16 encoding
    imageCount: scan?.images.length || 0,
    hasTransaction: scan?.analyzedTransaction !== null,
  };
}
