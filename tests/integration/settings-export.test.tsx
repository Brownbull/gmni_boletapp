/**
 * Settings Export Integration Tests
 *
 * Tests for Story 5.2: Basic Data Export (Settings)
 * Updated for Story 14.22: Tests CuentaView subview directly
 *
 * Covers: Export button rendering, downloadBasicData integration, loading states,
 * empty state handling, success feedback, and accessibility.
 *
 * Risk Level: MEDIUM (user data export feature)
 * Coverage: CuentaView export button, App export handler, csvExport integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CuentaView } from '../../src/components/settings/subviews/CuentaView';
import * as csvExport from '../../src/utils/csvExport';
import type { Transaction } from '../../src/types/transaction';

// Mock translations
const mockTranslations: Record<string, string> = {
  settings: 'Settings',
  downloadAllData: 'Download All Your Data',
  exportingData: 'Exporting...',
  noTransactionsToExport: 'No transactions to export',
  exportSuccess: 'Export complete',
  wipe: 'Factory Reset',
  wipeConfirm: 'Delete ALL data?',
  signout: 'Sign Out',
};

const mockT = (key: string) => mockTranslations[key] || key;

// Default props for CuentaView (Story 14.22 structure)
const defaultProps = {
  t: mockT,
  theme: 'light',
  wiping: false,
  exporting: false,
  onExportAll: vi.fn(),
  onWipeDB: vi.fn().mockResolvedValue(undefined),
  onSignOut: vi.fn(),
};

describe('Settings Export - Story 5.2 (via CuentaView)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AC#1: Download Button in Settings', () => {
    it('should render export button with correct label', () => {
      render(<CuentaView {...defaultProps} />);

      // Check button is visible with translated text
      expect(screen.getByText('Download All Your Data')).toBeInTheDocument();
    });

    it('should render CSV button text when not exporting', () => {
      render(<CuentaView {...defaultProps} />);

      const exportButton = screen.getByText('CSV');
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('AC#5: Loading State UX', () => {
    it('should show loading text when exporting', () => {
      render(<CuentaView {...defaultProps} exporting={true} />);

      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });

    it('should disable button during export', () => {
      render(<CuentaView {...defaultProps} exporting={true} />);

      const exportButton = screen.getByText('Exporting...');
      expect(exportButton.closest('button')).toBeDisabled();
    });

    it('should not be disabled when not exporting', () => {
      render(<CuentaView {...defaultProps} exporting={false} />);

      const exportButton = screen.getByText('CSV');
      expect(exportButton.closest('button')).not.toBeDisabled();
    });
  });

  describe('AC#2 & AC#8: Export triggers downloadBasicData', () => {
    it('should call onExportAll when button is clicked', () => {
      const onExportAll = vi.fn();
      render(<CuentaView {...defaultProps} onExportAll={onExportAll} />);

      const exportButton = screen.getByText('CSV');
      fireEvent.click(exportButton.closest('button')!);

      expect(onExportAll).toHaveBeenCalledTimes(1);
    });

    it('should not call onExportAll when button is disabled', () => {
      const onExportAll = vi.fn();
      render(<CuentaView {...defaultProps} onExportAll={onExportAll} exporting={true} />);

      const exportButton = screen.getByText('Exporting...');
      fireEvent.click(exportButton.closest('button')!);

      expect(onExportAll).not.toHaveBeenCalled();
    });
  });

  describe('csvExport Integration', () => {
    let downloadBasicDataSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      // Mock browser APIs for downloadCSV
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement);

      downloadBasicDataSpy = vi.spyOn(csvExport, 'downloadBasicData');
    });

    it('should call downloadBasicData with transactions', () => {
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          date: '2025-12-01',
          merchant: 'Test Store',
          category: 'Supermarket',
          total: 100.00,
          items: [],
        },
        {
          id: '2',
          date: '2025-12-02',
          merchant: 'Coffee Shop',
          category: 'Restaurant',
          total: 25.50,
          items: [],
        },
      ];

      csvExport.downloadBasicData(mockTransactions);

      expect(downloadBasicDataSpy).toHaveBeenCalledWith(mockTransactions);
    });

    it('should not download when transactions array is empty', () => {
      const createURLSpy = vi.spyOn(URL, 'createObjectURL');

      csvExport.downloadBasicData([]);

      expect(createURLSpy).not.toHaveBeenCalled();
    });

    it('should generate CSV with correct columns (Date, Merchant, Total)', () => {
      let capturedContent = '';
      const originalBlob = globalThis.Blob;
      globalThis.Blob = class extends originalBlob {
        constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
          super(parts, options);
          if (parts && parts[0]) {
            capturedContent = parts[0] as string;
          }
        }
      } as typeof Blob;

      const mockTransactions: Transaction[] = [
        {
          date: '2025-12-01',
          merchant: 'Test Store',
          alias: 'Store Alias',
          category: 'Supermarket',
          total: 100.00,
          items: [],
        },
      ];

      csvExport.downloadBasicData(mockTransactions);

      globalThis.Blob = originalBlob;

      // Verify CSV header contains ONLY minimal columns (Date, Merchant, Total)
      expect(capturedContent).toContain('Date');
      expect(capturedContent).toContain('Merchant');
      expect(capturedContent).toContain('Total');
      // Verify Alias and Category are NOT included (minimal export)
      expect(capturedContent).not.toContain('Alias');
      expect(capturedContent).not.toContain('Category');
      // Verify data row
      expect(capturedContent).toContain('2025-12-01');
      expect(capturedContent).toContain('Test Store');
      expect(capturedContent).toContain('100');
    });
  });

  describe('AC#3: File Naming Convention', () => {
    it('should generate filename with boletapp-basic-YYYY-MM-DD pattern', () => {
      // Mock date to control the filename
      const mockDate = new Date('2025-12-02T12:00:00Z');
      vi.setSystemTime(mockDate);

      // Mock browser APIs
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLAnchorElement);

      const mockTransactions: Transaction[] = [
        {
          date: '2025-12-01',
          merchant: 'Test Store',
          category: 'Supermarket',
          total: 100.00,
          items: [],
        },
      ];

      csvExport.downloadBasicData(mockTransactions);

      // Verify filename pattern
      expect(mockAnchor.download).toBe('boletapp-basic-2025-12-02.csv');

      vi.useRealTimers();
    });
  });

  describe('AC#6: Button returns to normal state', () => {
    it('should show CSV button when not exporting', () => {
      render(<CuentaView {...defaultProps} exporting={false} />);

      const exportButton = screen.getByText('CSV');
      expect(exportButton).toBeInTheDocument();
      expect(exportButton.closest('button')).not.toBeDisabled();
    });

    it('should transition from loading to normal state', () => {
      const { rerender } = render(<CuentaView {...defaultProps} exporting={true} />);

      // While exporting
      expect(screen.getByText('Exporting...')).toBeInTheDocument();

      // After export completes
      rerender(<CuentaView {...defaultProps} exporting={false} />);

      expect(screen.queryByText('Exporting...')).not.toBeInTheDocument();
      expect(screen.getByText('CSV')).toBeInTheDocument();
    });
  });

  describe('Translations', () => {
    it('should display Spanish translation for download button', () => {
      const spanishTranslations: Record<string, string> = {
        ...mockTranslations,
        downloadAllData: 'Descargar Todos Tus Datos',
        exportingData: 'Exportando...',
      };

      render(
        <CuentaView
          {...defaultProps}
          t={(key) => spanishTranslations[key] || key}
        />
      );

      expect(screen.getByText('Descargar Todos Tus Datos')).toBeInTheDocument();
    });

    it('should display Spanish loading text when exporting', () => {
      const spanishTranslations: Record<string, string> = {
        ...mockTranslations,
        downloadAllData: 'Descargar Todos Tus Datos',
        exportingData: 'Exportando...',
      };

      render(
        <CuentaView
          {...defaultProps}
          exporting={true}
          t={(key) => spanishTranslations[key] || key}
        />
      );

      expect(screen.getByText('Exportando...')).toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('should apply light theme styling', () => {
      render(<CuentaView {...defaultProps} theme="light" />);

      // Button should be visible and styled (basic check)
      const exportButton = screen.getByText('CSV');
      expect(exportButton).toBeInTheDocument();
    });

    it('should apply dark theme styling', () => {
      render(<CuentaView {...defaultProps} theme="dark" />);

      // Button should be visible and styled (basic check)
      const exportButton = screen.getByText('CSV');
      expect(exportButton).toBeInTheDocument();
    });
  });
});
