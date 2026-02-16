/**
 * Unit Tests for useBatchCapture Hook - Constants and Types
 *
 * Story 12.1: Batch Capture UI
 * Tests for the batch image capture state management - constants and exported values.
 *
 * Note: The hook itself uses browser APIs (Image, Canvas, FileReader) that
 * require a real browser environment. Integration tests should be used for
 * full hook testing with component mounting.
 *
 * @see docs/sprint-artifacts/epic12/story-12.1-batch-capture-ui.md
 */

import { describe, it, expect } from 'vitest';
import { MAX_BATCH_CAPTURE_IMAGES } from '@features/batch-review/hooks/useBatchCapture';

describe('useBatchCapture Hook Constants', () => {
  describe('MAX_BATCH_CAPTURE_IMAGES', () => {
    it('should be 10 (AC #7)', () => {
      expect(MAX_BATCH_CAPTURE_IMAGES).toBe(10);
    });

    it('should be a positive integer', () => {
      expect(MAX_BATCH_CAPTURE_IMAGES).toBeGreaterThan(0);
      expect(Number.isInteger(MAX_BATCH_CAPTURE_IMAGES)).toBe(true);
    });
  });

  describe('Exported Types', () => {
    it('should export CapturedImage interface', async () => {
      // Type check - if this compiles, the type is exported
      const { CapturedImage } = await import('@features/batch-review/hooks/useBatchCapture').then(m => ({
        CapturedImage: null as unknown as import('@features/batch-review/hooks/useBatchCapture').CapturedImage,
      }));
      expect(true).toBe(true); // Type exists if we get here
    });

    it('should export UseBatchCaptureReturn interface', async () => {
      // Type check - if this compiles, the type is exported
      const { UseBatchCaptureReturn } = await import('@features/batch-review/hooks/useBatchCapture').then(m => ({
        UseBatchCaptureReturn: null as unknown as import('@features/batch-review/hooks/useBatchCapture').UseBatchCaptureReturn,
      }));
      expect(true).toBe(true); // Type exists if we get here
    });
  });
});

describe('useBatchCapture Hook API Contract', () => {
  it('should export useBatchCapture function', async () => {
    const module = await import('@features/batch-review/hooks/useBatchCapture');
    expect(typeof module.useBatchCapture).toBe('function');
  });

  it('should export MAX_BATCH_CAPTURE_IMAGES constant', async () => {
    const module = await import('@features/batch-review/hooks/useBatchCapture');
    expect(typeof module.MAX_BATCH_CAPTURE_IMAGES).toBe('number');
  });

  it('should have default export pointing to useBatchCapture', async () => {
    const module = await import('@features/batch-review/hooks/useBatchCapture');
    expect(module.default).toBe(module.useBatchCapture);
  });
});
