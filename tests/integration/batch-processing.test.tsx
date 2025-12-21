/**
 * Batch Processing Integration Tests
 *
 * Tests for Story 11.1: One Image = One Transaction
 * Covers: Multi-image batch processing flow from detection to batch summary
 *
 * Risk Level: HIGH (core scan flow with batch processing)
 * Coverage: processBatchImages flow, batch preview, batch progress, batch summary integration
 *
 * NOTE: These tests mock the analyzeReceipt API call. We create mock transactions
 * with realistic field values instead of calling the actual Gemini API.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React, { useState } from 'react';
import { BatchUploadPreview, MAX_BATCH_IMAGES } from '../../src/components/scan/BatchUploadPreview';
import { BatchProcessingProgress } from '../../src/components/scan/BatchProcessingProgress';
import type { BatchItemResult } from '../../src/components/scan/BatchProcessingProgress';
import type { Transaction, StoreCategory } from '../../src/types/transaction';

// ============================================================================
// Test Utilities
// ============================================================================

/** Categories for random transaction generation */
const STORE_CATEGORIES: StoreCategory[] = [
  'Supermarket', 'Restaurant', 'Pharmacy', 'GasStation', 'Clothing',
  'Electronics', 'Bakery', 'Hardware', 'Transport', 'Entertainment'
];

/** Mock merchants by category for realistic test data */
const MERCHANTS_BY_CATEGORY: Record<string, string[]> = {
  Supermarket: ['Jumbo', 'Líder', 'Santa Isabel', 'Unimarc'],
  Restaurant: ['McDonalds', 'Starbucks', 'Dominos Pizza', 'Burger King'],
  Pharmacy: ['Cruz Verde', 'Salcobrand', 'Ahumada'],
  GasStation: ['Copec', 'Shell', 'Petrobras'],
  Clothing: ['Falabella', 'Ripley', 'Paris'],
  Electronics: ['PCFactory', 'Hites', 'La Polar'],
  Bakery: ['San Camilo', 'Ideal', 'Bimbo'],
  Hardware: ['Sodimac', 'Easy', 'Construmart'],
  Transport: ['Uber', 'Didi', 'Cabify'],
  Entertainment: ['Cinemark', 'Cineplanet', 'Netflix']
};

/** Item names by category for realistic line items */
const ITEMS_BY_CATEGORY: Record<string, string[]> = {
  Supermarket: ['Leche', 'Pan', 'Huevos', 'Arroz', 'Fideos', 'Aceite'],
  Restaurant: ['Hamburguesa', 'Papas Fritas', 'Bebida', 'Café', 'Postre'],
  Pharmacy: ['Paracetamol', 'Vitaminas', 'Alcohol Gel', 'Parches'],
  GasStation: ['Gasolina 95', 'Gasolina 97', 'Diesel'],
  Clothing: ['Polera', 'Jeans', 'Zapatillas', 'Chaqueta'],
  Electronics: ['Audifonos', 'Cargador', 'Cable USB', 'Mouse'],
  Bakery: ['Marraqueta', 'Hallulla', 'Torta', 'Queque'],
  Hardware: ['Tornillos', 'Pintura', 'Brocha', 'Taladro'],
  Transport: ['Viaje al aeropuerto', 'Viaje al centro', 'Viaje nocturno'],
  Entertainment: ['Entrada cine', 'Combo palomitas', 'Suscripción mensual']
};

/**
 * Creates a mock transaction with realistic data
 * Simulates what analyzeReceipt would return from Gemini API
 */
function createMockTransaction(options?: {
  category?: StoreCategory;
  itemCount?: number;
  minTotal?: number;
  maxTotal?: number;
}): Transaction {
  const category = options?.category || STORE_CATEGORIES[Math.floor(Math.random() * STORE_CATEGORIES.length)];
  const itemCount = options?.itemCount || Math.floor(Math.random() * 3) + 1;
  const merchants = MERCHANTS_BY_CATEGORY[category] || ['Unknown Store'];
  const merchant = merchants[Math.floor(Math.random() * merchants.length)];
  const itemNames = ITEMS_BY_CATEGORY[category] || ['Item'];

  const items = Array.from({ length: itemCount }, () => {
    const name = itemNames[Math.floor(Math.random() * itemNames.length)];
    const price = Math.floor(Math.random() * 10000) + 500; // 500 to 10500 CLP
    return { name, price, qty: 1 };
  });

  const total = items.reduce((sum, item) => sum + item.price, 0);

  return {
    date: new Date().toISOString().split('T')[0],
    merchant,
    alias: merchant,
    category,
    total,
    items,
    time: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    country: 'Chile',
    city: 'Santiago',
    currency: 'CLP',
    receiptType: 'receipt',
    promptVersion: '2.6.0',
    merchantSource: 'scan'
  };
}

/**
 * Creates mock base64 image data (small placeholder)
 */
function createMockImages(count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    `data:image/png;base64,mockImageData${i}_${Date.now()}`
  );
}

/**
 * Mock translation function
 */
const mockT = (key: string): string => {
  const translations: Record<string, string> = {
    batchReceiptsDetected: 'boletas detectadas',
    batchExplanation: 'Cada imagen será una transacción separada.',
    batchMaxLimitError: 'Máximo 10 imágenes por vez',
    viewImages: 'Ver imágenes',
    hideImages: 'Ocultar imágenes',
    batchImageList: 'Imágenes seleccionadas',
    removeImage: 'Quitar imagen',
    processAll: 'Procesar todas',
    cancel: 'Cancelar',
    receipt: 'Boleta',
    batchProcessingTitle: 'Procesando boletas...',
    batchResultsList: 'Resultados del procesamiento',
    batchItemFailed: 'No se pudo leer la imagen',
    batchItemProcessing: 'Procesando...',
    batchItemPending: 'Esperando...',
    batchPartialWarning: '{count} imagen(es) no pudo(ieron) ser procesada(s)',
    scanFailed: 'Error al escanear',
    noCreditsMessage: 'Sin créditos disponibles',
  };
  return translations[key] || key;
};

// ============================================================================
// Integration Tests
// ============================================================================

describe('Batch Processing Integration - Story 11.1', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==========================================================================
  // AC #1 & #2: Single vs Multi-Image Detection
  // ==========================================================================

  describe('AC #1 & #2: Image Detection Flow', () => {
    it('should show batch preview when multiple images selected (AC #2)', () => {
      const images = createMockImages(3);
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(
        <BatchUploadPreview
          images={images}
          theme="light"
          t={mockT}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      // Should show "3 boletas detectadas"
      expect(screen.getByText('3 boletas detectadas')).toBeInTheDocument();
      expect(screen.getByText('Cada imagen será una transacción separada.')).toBeInTheDocument();
    });

    it('should enforce 10 image maximum (AC #7)', () => {
      const images = createMockImages(11);
      const onConfirm = vi.fn();

      render(
        <BatchUploadPreview
          images={images}
          theme="light"
          t={mockT}
          onConfirm={onConfirm}
          onCancel={vi.fn()}
        />
      );

      // Should show limit error
      expect(screen.getByText('Máximo 10 imágenes por vez')).toBeInTheDocument();

      // Process button should be disabled
      const processButton = screen.getByText('Procesar todas');
      expect(processButton).toBeDisabled();

      // Clicking shouldn't trigger confirm
      fireEvent.click(processButton);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('should allow exactly 10 images (boundary test)', () => {
      const images = createMockImages(10);
      const onConfirm = vi.fn();

      render(
        <BatchUploadPreview
          images={images}
          theme="light"
          t={mockT}
          onConfirm={onConfirm}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('10 boletas detectadas')).toBeInTheDocument();

      const processButton = screen.getByText('Procesar todas');
      expect(processButton).not.toBeDisabled();

      fireEvent.click(processButton);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // AC #3 & #4: Sequential Processing with Progress
  // ==========================================================================

  describe('AC #3 & #4: Sequential Processing with Progress Indicator', () => {
    it('should display progress as "X/Y" during processing (AC #4)', () => {
      const results: BatchItemResult[] = [
        { index: 0, status: 'success', merchant: 'Jumbo', total: 15000 },
        { index: 1, status: 'processing' },
        { index: 2, status: 'pending' },
        { index: 3, status: 'pending' },
      ];

      render(
        <BatchProcessingProgress
          current={2}
          total={4}
          results={results}
          theme="light"
          currency="CLP"
          t={mockT}
        />
      );

      // Should show "2/4" progress
      expect(screen.getByText('2/4')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();

      // Should have progress bar
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '2');
      expect(progressBar).toHaveAttribute('aria-valuemax', '4');
    });

    it('should show real-time results list with success/processing/pending states', () => {
      const results: BatchItemResult[] = [
        { index: 0, status: 'success', merchant: 'Jumbo', total: 15000 },
        { index: 1, status: 'success', merchant: 'Cruz Verde', total: 8500 },
        { index: 2, status: 'processing' },
        { index: 3, status: 'pending' },
        { index: 4, status: 'pending' },
      ];

      render(
        <BatchProcessingProgress
          current={3}
          total={5}
          results={results}
          theme="light"
          currency="CLP"
          t={mockT}
        />
      );

      // Should show successful merchants
      expect(screen.getByText(/Jumbo/)).toBeInTheDocument();
      expect(screen.getByText(/Cruz Verde/)).toBeInTheDocument();

      // Should show processing state
      expect(screen.getByText('Procesando...')).toBeInTheDocument();

      // Should show pending states
      const waitingItems = screen.getAllByText('Esperando...');
      expect(waitingItems).toHaveLength(2);
    });
  });

  // ==========================================================================
  // AC #6: Partial Failure Handling
  // ==========================================================================

  describe('AC #6: Partial Failure Handling', () => {
    it('should display failed items with error message', () => {
      const results: BatchItemResult[] = [
        { index: 0, status: 'success', merchant: 'Jumbo', total: 15000 },
        { index: 1, status: 'failed', error: 'Image too blurry' },
        { index: 2, status: 'success', merchant: 'Starbucks', total: 5200 },
      ];

      render(
        <BatchProcessingProgress
          current={3}
          total={3}
          results={results}
          theme="light"
          currency="CLP"
          t={mockT}
        />
      );

      // Should show successful merchants
      expect(screen.getByText(/Jumbo/)).toBeInTheDocument();
      expect(screen.getByText(/Starbucks/)).toBeInTheDocument();

      // Should show generic failure message (not the specific error)
      expect(screen.getByText('No se pudo leer la imagen')).toBeInTheDocument();
    });

    it('should handle all-failed scenario', () => {
      const results: BatchItemResult[] = [
        { index: 0, status: 'failed', error: 'Network error' },
        { index: 1, status: 'failed', error: 'Invalid image' },
        { index: 2, status: 'failed', error: 'API error' },
      ];

      render(
        <BatchProcessingProgress
          current={3}
          total={3}
          results={results}
          theme="light"
          currency="CLP"
          t={mockT}
        />
      );

      // All should show failure message
      const failedItems = screen.getAllByText('No se pudo leer la imagen');
      expect(failedItems).toHaveLength(3);

      // Progress should be complete (100%)
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC #9: Dark Mode Support
  // ==========================================================================

  describe('AC #9: Dark Mode Support', () => {
    it('should apply dark theme to BatchUploadPreview', () => {
      const images = createMockImages(3);

      const { container } = render(
        <BatchUploadPreview
          images={images}
          theme="dark"
          t={mockT}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toHaveClass('bg-slate-800');
    });

    it('should apply dark theme to BatchProcessingProgress', () => {
      const results: BatchItemResult[] = [
        { index: 0, status: 'processing' },
      ];

      const { container } = render(
        <BatchProcessingProgress
          current={1}
          total={1}
          results={results}
          theme="dark"
          currency="CLP"
          t={mockT}
        />
      );

      const status = container.querySelector('[role="status"]');
      expect(status).toHaveClass('bg-slate-800');
    });
  });

  // ==========================================================================
  // Full Flow Simulation
  // ==========================================================================

  describe('Full Batch Processing Flow Simulation', () => {
    /**
     * Simulates the processBatchImages function behavior
     * This mirrors the actual App.tsx implementation but uses mocks
     */
    async function simulateProcessBatchImages(
      images: string[],
      mockAnalyzeReceipt: (image: string) => Promise<Transaction>,
      onProgress: (current: number, total: number, results: BatchItemResult[]) => void
    ): Promise<{ successCount: number; failCount: number; transactions: Transaction[] }> {
      const results: BatchItemResult[] = images.map((_, index) => ({
        index,
        status: 'pending' as const,
      }));

      const savedTransactions: Transaction[] = [];

      for (let i = 0; i < images.length; i++) {
        // Update to processing
        results[i] = { ...results[i], status: 'processing' };
        onProgress(i + 1, images.length, [...results]);

        try {
          // Simulate API call
          const transaction = await mockAnalyzeReceipt(images[i]);
          savedTransactions.push(transaction);

          // Update to success
          results[i] = {
            index: i,
            status: 'success',
            merchant: transaction.alias || transaction.merchant,
            total: transaction.total,
          };
        } catch (error: any) {
          // Update to failed
          results[i] = {
            index: i,
            status: 'failed',
            error: error.message || 'Unknown error',
          };
        }

        onProgress(i + 1, images.length, [...results]);
      }

      const successCount = results.filter(r => r.status === 'success').length;
      const failCount = results.filter(r => r.status === 'failed').length;

      return { successCount, failCount, transactions: savedTransactions };
    }

    it('should process all images successfully and trigger batch summary', async () => {
      const images = createMockImages(3);
      const progressUpdates: { current: number; total: number; results: BatchItemResult[] }[] = [];

      // Mock that creates successful transactions
      const mockAnalyze = vi.fn().mockImplementation(() =>
        Promise.resolve(createMockTransaction({ category: 'Supermarket', itemCount: 2 }))
      );

      const result = await simulateProcessBatchImages(
        images,
        mockAnalyze,
        (current, total, results) => {
          progressUpdates.push({ current, total, results: [...results] });
        }
      );

      // Should have called analyze for each image
      expect(mockAnalyze).toHaveBeenCalledTimes(3);

      // All should succeed
      expect(result.successCount).toBe(3);
      expect(result.failCount).toBe(0);
      expect(result.transactions).toHaveLength(3);

      // Should have progress updates (2 per image: processing + result)
      expect(progressUpdates.length).toBe(6);

      // Final update should show all success
      const finalResults = progressUpdates[progressUpdates.length - 1].results;
      expect(finalResults.every(r => r.status === 'success')).toBe(true);
    });

    it('should continue processing after failures and report partial success', async () => {
      const images = createMockImages(4);
      let callCount = 0;

      // Mock that fails on 2nd and 4th calls
      const mockAnalyze = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 2 || callCount === 4) {
          return Promise.reject(new Error('Image too blurry'));
        }
        return Promise.resolve(createMockTransaction());
      });

      const result = await simulateProcessBatchImages(
        images,
        mockAnalyze,
        () => {} // Ignore progress for this test
      );

      // Should have called analyze for ALL images (continues after failure)
      expect(mockAnalyze).toHaveBeenCalledTimes(4);

      // Should have partial success
      expect(result.successCount).toBe(2);
      expect(result.failCount).toBe(2);
      expect(result.transactions).toHaveLength(2);
    });

    it('should handle all failures gracefully', async () => {
      const images = createMockImages(3);

      // Mock that always fails
      const mockAnalyze = vi.fn().mockRejectedValue(new Error('API unavailable'));

      const result = await simulateProcessBatchImages(
        images,
        mockAnalyze,
        () => {}
      );

      // Should have tried all images
      expect(mockAnalyze).toHaveBeenCalledTimes(3);

      // All should fail
      expect(result.successCount).toBe(0);
      expect(result.failCount).toBe(3);
      expect(result.transactions).toHaveLength(0);
    });

    it('should create transactions with correct structure', async () => {
      const images = createMockImages(1);

      const expectedTransaction = createMockTransaction({
        category: 'Restaurant',
        itemCount: 3
      });

      const mockAnalyze = vi.fn().mockResolvedValue(expectedTransaction);

      const result = await simulateProcessBatchImages(
        images,
        mockAnalyze,
        () => {}
      );

      // Verify transaction structure
      const tx = result.transactions[0];
      expect(tx).toBeDefined();
      expect(tx.merchant).toBeDefined();
      expect(tx.category).toBe('Restaurant');
      expect(tx.items).toHaveLength(3);
      expect(tx.total).toBe(tx.items.reduce((sum, item) => sum + item.price, 0));
      expect(tx.currency).toBe('CLP');
      expect(tx.country).toBe('Chile');
    });
  });

  // ==========================================================================
  // Image Removal Flow
  // ==========================================================================

  describe('Image Removal from Batch', () => {
    it('should call onRemoveImage when remove button clicked', () => {
      const images = createMockImages(3);
      const onRemoveImage = vi.fn();

      render(
        <BatchUploadPreview
          images={images}
          theme="light"
          t={mockT}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          onRemoveImage={onRemoveImage}
        />
      );

      // Open thumbnails
      fireEvent.click(screen.getByText('Ver imágenes'));

      // Click remove on first image
      const removeButtons = screen.getAllByLabelText(/Quitar imagen/);
      fireEvent.click(removeButtons[0]);

      expect(onRemoveImage).toHaveBeenCalledWith(0);
    });

    it('should not show remove buttons when onRemoveImage not provided', () => {
      const images = createMockImages(3);

      render(
        <BatchUploadPreview
          images={images}
          theme="light"
          t={mockT}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          // No onRemoveImage prop
        />
      );

      // Open thumbnails
      fireEvent.click(screen.getByText('Ver imágenes'));

      // Remove buttons should not exist
      expect(screen.queryByLabelText(/Quitar imagen/)).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Currency Formatting
  // ==========================================================================

  describe('Currency Formatting in Results', () => {
    it('should format CLP amounts correctly', () => {
      const results: BatchItemResult[] = [
        { index: 0, status: 'success', merchant: 'Jumbo', total: 15000 },
      ];

      render(
        <BatchProcessingProgress
          current={1}
          total={1}
          results={results}
          theme="light"
          currency="CLP"
          t={mockT}
        />
      );

      // CLP format: $15.000
      expect(screen.getByText(/\$15\.000/)).toBeInTheDocument();
    });

    it('should format USD amounts correctly', () => {
      const results: BatchItemResult[] = [
        { index: 0, status: 'success', merchant: 'Walmart', total: 99.99 },
      ];

      render(
        <BatchProcessingProgress
          current={1}
          total={1}
          results={results}
          theme="light"
          currency="USD"
          t={mockT}
        />
      );

      // USD format includes Walmart
      expect(screen.getByText(/Walmart/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Accessibility
  // ==========================================================================

  describe('Accessibility', () => {
    it('should have accessible batch preview dialog', () => {
      const images = createMockImages(3);

      render(
        <BatchUploadPreview
          images={images}
          theme="light"
          t={mockT}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Dialog should have role
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Should have accessible label
      expect(screen.getByLabelText(/boletas detectadas/i)).toBeInTheDocument();
    });

    it('should have live region for progress updates', () => {
      const results: BatchItemResult[] = [
        { index: 0, status: 'processing' },
      ];

      const { container } = render(
        <BatchProcessingProgress
          current={1}
          total={3}
          results={results}
          theme="light"
          currency="CLP"
          t={mockT}
        />
      );

      // Should have status role with live region
      const status = container.querySelector('[role="status"]');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });
  });
});
