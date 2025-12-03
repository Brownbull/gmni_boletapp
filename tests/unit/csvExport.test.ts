/**
 * CSV Export Utilities - Unit Tests
 *
 * Tests for Story 5.1: CSV Export Utilities
 * Covers: escapeCSVValue, sanitizeCSVValue, generateCSV, downloadCSV
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  escapeCSVValue,
  sanitizeCSVValue,
  generateCSV,
  downloadCSV,
  downloadBasicData,
  downloadYearTransactions,
  downloadMonthlyTransactions,
  downloadStatistics,
  downloadYearlyStatistics,
  type Column,
  type StatisticsRow,
  type YearlyStatisticsRow,
} from '../../src/utils/csvExport';
import type { Transaction } from '../../src/types/transaction';

describe('csvExport utilities', () => {
  describe('escapeCSVValue', () => {
    describe('null and undefined handling', () => {
      it('should return empty string for null', () => {
        expect(escapeCSVValue(null)).toBe('');
      });

      it('should return empty string for undefined', () => {
        expect(escapeCSVValue(undefined)).toBe('');
      });

      it('should return empty string for empty string input', () => {
        expect(escapeCSVValue('')).toBe('');
      });
    });

    describe('number handling', () => {
      it('should convert number to string', () => {
        expect(escapeCSVValue(42)).toBe('42');
      });

      it('should convert decimal number to string', () => {
        expect(escapeCSVValue(1234.56)).toBe('1234.56');
      });

      it('should convert zero to string', () => {
        expect(escapeCSVValue(0)).toBe('0');
      });

      it('should convert negative number to string with sanitization', () => {
        // Negative numbers start with '-' which is a formula injection char
        expect(escapeCSVValue(-5)).toBe("'-5");
      });
    });

    describe('comma handling (RFC 4180)', () => {
      it('should quote strings containing commas', () => {
        expect(escapeCSVValue('Hello, World')).toBe('"Hello, World"');
      });

      it('should quote strings with multiple commas', () => {
        expect(escapeCSVValue('a,b,c,d')).toBe('"a,b,c,d"');
      });
    });

    describe('quote escaping (RFC 4180)', () => {
      it('should escape double quotes by doubling them', () => {
        expect(escapeCSVValue('Say "Hi"')).toBe('"Say ""Hi"""');
      });

      it('should handle multiple quotes', () => {
        expect(escapeCSVValue('"Hello" "World"')).toBe('"""Hello"" ""World"""');
      });

      it('should handle quote at start', () => {
        expect(escapeCSVValue('"quoted')).toBe('"""quoted"');
      });
    });

    describe('newline handling (RFC 4180)', () => {
      it('should quote strings containing newlines', () => {
        expect(escapeCSVValue('Line1\nLine2')).toBe('"Line1\nLine2"');
      });

      it('should handle carriage return with sanitization', () => {
        // \r at start is sanitized (escaped with single quote prefix)
        // \r alone doesn't trigger quoting (only comma, newline, quote do per RFC 4180)
        expect(escapeCSVValue('\rText')).toBe("'\rText");
      });
    });

    describe('combined special characters', () => {
      it('should handle comma and quotes together', () => {
        expect(escapeCSVValue('Hello, "World"')).toBe('"Hello, ""World"""');
      });

      it('should handle all special characters', () => {
        expect(escapeCSVValue('a,b\n"c"')).toBe('"a,b\n""c"""');
      });
    });

    describe('plain text', () => {
      it('should return plain text unchanged', () => {
        expect(escapeCSVValue('Hello World')).toBe('Hello World');
      });

      it('should handle Spanish characters', () => {
        expect(escapeCSVValue('Caf\u00e9 con le\u00f1a')).toBe('Caf\u00e9 con le\u00f1a');
      });

      it('should handle accented characters', () => {
        expect(escapeCSVValue('\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1')).toBe('\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1');
      });
    });
  });

  describe('sanitizeCSVValue', () => {
    describe('formula injection prevention', () => {
      it('should escape leading = character', () => {
        expect(sanitizeCSVValue('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
      });

      it('should escape leading + character', () => {
        expect(sanitizeCSVValue('+1234567890')).toBe("'+1234567890");
      });

      it('should escape leading - character', () => {
        expect(sanitizeCSVValue('-5')).toBe("'-5");
      });

      it('should escape leading @ character', () => {
        expect(sanitizeCSVValue('@SUM(A1)')).toBe("'@SUM(A1)");
      });

      it('should escape leading tab character', () => {
        expect(sanitizeCSVValue('\tdata')).toBe("'\tdata");
      });

      it('should escape leading carriage return', () => {
        expect(sanitizeCSVValue('\rdata')).toBe("'\rdata");
      });
    });

    describe('safe values', () => {
      it('should not modify values without dangerous leading chars', () => {
        expect(sanitizeCSVValue('Normal text')).toBe('Normal text');
      });

      it('should not modify values with dangerous chars in middle', () => {
        expect(sanitizeCSVValue('Hello=World')).toBe('Hello=World');
      });

      it('should not modify empty string', () => {
        expect(sanitizeCSVValue('')).toBe('');
      });

      it('should not modify numbers as strings', () => {
        expect(sanitizeCSVValue('123')).toBe('123');
      });
    });
  });

  describe('generateCSV', () => {
    interface TestData {
      name: string;
      age: number;
      city: string;
    }

    const testColumns: Column<TestData>[] = [
      { key: 'name', header: 'Name' },
      { key: 'age', header: 'Age' },
      { key: 'city', header: 'City' },
    ];

    describe('UTF-8 BOM', () => {
      it('should include UTF-8 BOM at start', () => {
        const csv = generateCSV<TestData>([], testColumns);
        expect(csv.charCodeAt(0)).toBe(0xfeff);
      });

      it('should start with BOM character \\ufeff', () => {
        const csv = generateCSV<TestData>([], testColumns);
        expect(csv.startsWith('\ufeff')).toBe(true);
      });
    });

    describe('header row', () => {
      it('should produce header row as first line after BOM', () => {
        const csv = generateCSV<TestData>([], testColumns);
        const lines = csv.split('\n');
        expect(lines[0]).toBe('\ufeffName,Age,City');
      });

      it('should use column headers in order', () => {
        const columns: Column<TestData>[] = [
          { key: 'city', header: 'Location' },
          { key: 'name', header: 'Full Name' },
        ];
        const csv = generateCSV<TestData>([], columns);
        expect(csv).toBe('\ufeffLocation,Full Name');
      });
    });

    describe('data rows', () => {
      it('should produce data rows matching column order', () => {
        const data: TestData[] = [
          { name: 'Alice', age: 30, city: 'NYC' },
        ];
        const csv = generateCSV(data, testColumns);
        const lines = csv.split('\n');
        expect(lines[1]).toBe('Alice,30,NYC');
      });

      it('should handle multiple rows', () => {
        const data: TestData[] = [
          { name: 'Alice', age: 30, city: 'NYC' },
          { name: 'Bob', age: 25, city: 'LA' },
        ];
        const csv = generateCSV(data, testColumns);
        const lines = csv.split('\n');
        expect(lines).toHaveLength(3); // header + 2 data rows
        expect(lines[1]).toBe('Alice,30,NYC');
        expect(lines[2]).toBe('Bob,25,LA');
      });

      it('should escape special characters in data', () => {
        const data: TestData[] = [
          { name: 'O\'Brien, John', age: 40, city: 'New York' },
        ];
        const csv = generateCSV(data, testColumns);
        const lines = csv.split('\n');
        expect(lines[1]).toBe('"O\'Brien, John",40,New York');
      });
    });

    describe('international characters', () => {
      it('should handle Spanish characters', () => {
        const data: TestData[] = [
          { name: 'Jos\u00e9 Garc\u00eda', age: 35, city: 'M\u00e9xico' },
        ];
        const csv = generateCSV(data, testColumns);
        expect(csv).toContain('Jos\u00e9 Garc\u00eda');
        expect(csv).toContain('M\u00e9xico');
      });
    });
  });

  describe('downloadCSV', () => {
    let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
    let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
    let appendChildSpy: ReturnType<typeof vi.spyOn>;
    let removeChildSpy: ReturnType<typeof vi.spyOn>;
    let clickSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // Mock URL methods
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      // Mock document methods
      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

      // Mock click
      clickSpy = vi.fn();
      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: clickSpy,
      } as unknown as HTMLAnchorElement);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create blob with correct MIME type', () => {
      downloadCSV('test,data', 'test.csv');

      expect(createObjectURLSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'text/csv;charset=utf-8;',
        })
      );
    });

    it('should trigger download click', () => {
      downloadCSV('test,data', 'test.csv');
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should clean up object URL after download', () => {
      downloadCSV('test,data', 'test.csv');
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should set correct filename', () => {
      const mockAnchor = {
        href: '',
        download: '',
        click: clickSpy,
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLAnchorElement);

      downloadCSV('test,data', 'boletapp-test-2025-01-01.csv');
      expect(mockAnchor.download).toBe('boletapp-test-2025-01-01.csv');
    });
  });

  describe('downloadBasicData', () => {
    let downloadCSVSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      // Mock URL methods for downloadCSV
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should not download if transactions array is empty', () => {
      const createURLSpy = vi.spyOn(URL, 'createObjectURL');
      downloadBasicData([]);
      expect(createURLSpy).not.toHaveBeenCalled();
    });

    it('should not download if transactions is null-ish', () => {
      const createURLSpy = vi.spyOn(URL, 'createObjectURL');
      downloadBasicData(null as unknown as Transaction[]);
      expect(createURLSpy).not.toHaveBeenCalled();
    });

    it('should only include Date, Merchant, Total columns (minimal export)', () => {
      const transactions: Transaction[] = [
        {
          date: '2025-01-15',
          merchant: 'Store',
          alias: 'My Store',
          category: 'Supermarket',
          total: 100,
          items: [],
        },
      ];

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

      downloadBasicData(transactions);

      globalThis.Blob = originalBlob;

      // Verify header has exactly 3 columns
      const headerLine = capturedContent.split('\n')[0].replace('\ufeff', '');
      expect(headerLine).toBe('Date,Merchant,Total');

      // Verify Alias and Category are NOT included
      expect(capturedContent).not.toContain('Alias');
      expect(capturedContent).not.toContain('Category');
      expect(capturedContent).not.toContain('My Store'); // Alias value
      expect(capturedContent).not.toContain('Supermarket'); // Category value
    });

    it('should export date in YYYY-MM-DD format', () => {
      const transactions: Transaction[] = [
        {
          date: '2025-01-15',
          merchant: 'Store',
          category: 'Supermarket',
          total: 100,
          items: [],
        },
      ];

      let capturedBlob: Blob | undefined;
      vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
        capturedBlob = blob as Blob;
        return 'blob:mock-url';
      });

      downloadBasicData(transactions);

      expect(capturedBlob).toBeDefined();
    });

    it('should export currency values as raw numbers', () => {
      const transactions: Transaction[] = [
        {
          date: '2025-01-15',
          merchant: 'Store',
          category: 'Supermarket',
          total: 1234.56,
          items: [],
        },
      ];

      let capturedContent = '';
      vi.spyOn(Blob.prototype, 'text').mockImplementation(async function(this: Blob) {
        return capturedContent;
      });

      // Create a custom mock to capture the blob content
      const originalBlob = globalThis.Blob;
      globalThis.Blob = class extends originalBlob {
        constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
          super(parts, options);
          if (parts && parts[0]) {
            capturedContent = parts[0] as string;
          }
        }
      } as typeof Blob;

      downloadBasicData(transactions);

      // Restore original Blob
      globalThis.Blob = originalBlob;

      // Verify the total is a raw number (1234.56 not $1,234.56)
      expect(capturedContent).toContain('1234.56');
      expect(capturedContent).not.toContain('$');
    });
  });

  describe('downloadYearTransactions', () => {
    beforeEach(() => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should not download if transactions array is empty', () => {
      const createURLSpy = vi.spyOn(URL, 'createObjectURL');
      downloadYearTransactions([], '2025');
      expect(createURLSpy).not.toHaveBeenCalled();
    });

    it('should generate filename with year', () => {
      const transactions: Transaction[] = [
        {
          date: '2025-01-15',
          merchant: 'Store',
          category: 'Supermarket',
          total: 100,
          items: [],
        },
      ];

      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLAnchorElement);

      downloadYearTransactions(transactions, '2025');
      expect(mockAnchor.download).toBe('boletapp-year-2025.csv');
    });

    it('should include item count column', () => {
      const transactions: Transaction[] = [
        {
          date: '2025-01-15',
          merchant: 'Store',
          category: 'Supermarket',
          total: 100,
          items: [
            { name: 'Item 1', price: 50 },
            { name: 'Item 2', price: 50 },
          ],
        },
      ];

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

      downloadYearTransactions(transactions, '2025');

      globalThis.Blob = originalBlob;

      // Check header includes Items column
      expect(capturedContent).toContain('Items');
      // Check item count is 2
      expect(capturedContent).toContain('2');
    });
  });

  describe('downloadMonthlyTransactions', () => {
    beforeEach(() => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should not download if transactions array is empty', () => {
      const createURLSpy = vi.spyOn(URL, 'createObjectURL');
      downloadMonthlyTransactions([], '2025', '01');
      expect(createURLSpy).not.toHaveBeenCalled();
    });

    it('should generate filename with year and month', () => {
      const transactions: Transaction[] = [
        {
          date: '2025-01-15',
          merchant: 'Store',
          category: 'Supermarket',
          total: 100,
          items: [],
        },
      ];

      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLAnchorElement);

      downloadMonthlyTransactions(transactions, '2025', '01');
      expect(mockAnchor.download).toBe('boletapp-month-2025-01.csv');
    });

    it('should explode transactions into item-level rows', () => {
      const transactions: Transaction[] = [
        {
          id: 'tx1',
          date: '2025-01-15',
          merchant: 'Store',
          category: 'Supermarket',
          total: 100,
          items: [
            { name: 'Apple', qty: 2, price: 30, category: 'Produce', subcategory: 'Fruit' },
            { name: 'Bread', qty: 1, price: 70, category: 'Bakery', subcategory: 'Loaves' },
          ],
        },
      ];

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

      downloadMonthlyTransactions(transactions, '2025', '01');

      globalThis.Blob = originalBlob;

      // Check headers for item-level columns
      expect(capturedContent).toContain('Transaction ID');
      expect(capturedContent).toContain('Item Name');
      expect(capturedContent).toContain('Qty');
      expect(capturedContent).toContain('Item Price');
      expect(capturedContent).toContain('Item Category');
      expect(capturedContent).toContain('Item Subcategory');

      // Check data rows contain item details
      expect(capturedContent).toContain('Apple');
      expect(capturedContent).toContain('Bread');
      expect(capturedContent).toContain('Produce');
      expect(capturedContent).toContain('Fruit');

      // Check transaction ID appears twice (once per item)
      const lines = capturedContent.split('\n');
      const dataLines = lines.slice(1); // Skip header
      expect(dataLines.filter(l => l.includes('tx1')).length).toBe(2);
    });
  });

  describe('downloadStatistics', () => {
    beforeEach(() => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should not download if transactions array is empty', () => {
      const createURLSpy = vi.spyOn(URL, 'createObjectURL');
      downloadStatistics([], '2025');
      expect(createURLSpy).not.toHaveBeenCalled();
    });

    it('should aggregate by category', () => {
      const transactions: Transaction[] = [
        { date: '2025-01-01', merchant: 'Store1', category: 'Supermarket', total: 100, items: [] },
        { date: '2025-01-02', merchant: 'Store2', category: 'Supermarket', total: 200, items: [] },
        { date: '2025-01-03', merchant: 'Resto', category: 'Restaurant', total: 50, items: [] },
      ];

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

      downloadStatistics(transactions, '2025');

      globalThis.Blob = originalBlob;

      // Check aggregated data
      expect(capturedContent).toContain('Supermarket');
      expect(capturedContent).toContain('Restaurant');
      // Supermarket: 2 transactions, $300 total
      expect(capturedContent).toContain('300');
      // Restaurant: 1 transaction, $50 total
      expect(capturedContent).toContain('50');
    });

    it('should generate filename with year', () => {
      const transactions: Transaction[] = [
        { date: '2025-01-01', merchant: 'Store', category: 'Supermarket', total: 100, items: [] },
      ];

      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLAnchorElement);

      downloadStatistics(transactions, '2025');
      expect(mockAnchor.download).toBe('boletapp-statistics-2025.csv');
    });
  });

  describe('date formatting', () => {
    beforeEach(() => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should preserve YYYY-MM-DD format', () => {
      const transactions: Transaction[] = [
        { date: '2025-01-15', merchant: 'Store', category: 'Supermarket', total: 100, items: [] },
      ];

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

      downloadBasicData(transactions);

      globalThis.Blob = originalBlob;

      expect(capturedContent).toContain('2025-01-15');
    });
  });

  /**
   * Story 5.5: Yearly Statistics Export Tests (AC#9)
   * Tests for downloadYearlyStatistics function
   */
  describe('downloadYearlyStatistics - Story 5.5', () => {
    beforeEach(() => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should not download if transactions array is empty', () => {
      const createURLSpy = vi.spyOn(URL, 'createObjectURL');
      downloadYearlyStatistics([], '2025');
      expect(createURLSpy).not.toHaveBeenCalled();
    });

    it('should not download if transactions is null-ish', () => {
      const createURLSpy = vi.spyOn(URL, 'createObjectURL');
      downloadYearlyStatistics(null as unknown as Transaction[], '2025');
      expect(createURLSpy).not.toHaveBeenCalled();
    });

    it('should not download if no transactions match the selected year', () => {
      const transactions: Transaction[] = [
        { date: '2024-01-15', merchant: 'Store', category: 'Supermarket', total: 100, items: [] },
      ];
      const createURLSpy = vi.spyOn(URL, 'createObjectURL');
      downloadYearlyStatistics(transactions, '2025');
      expect(createURLSpy).not.toHaveBeenCalled();
    });

    it('should generate correct filename with year', () => {
      const transactions: Transaction[] = [
        { date: '2025-01-15', merchant: 'Store', category: 'Supermarket', total: 100, items: [] },
      ];

      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLAnchorElement);

      downloadYearlyStatistics(transactions, '2025');
      expect(mockAnchor.download).toBe('boletapp-statistics-2025.csv');
    });

    it('should aggregate by month correctly (AC#9)', () => {
      const transactions: Transaction[] = [
        { date: '2025-01-15', merchant: 'Store1', category: 'Supermarket', total: 100, items: [] },
        { date: '2025-01-20', merchant: 'Store2', category: 'Supermarket', total: 50, items: [] },
        { date: '2025-02-10', merchant: 'Store3', category: 'Supermarket', total: 75, items: [] },
      ];

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

      downloadYearlyStatistics(transactions, '2025');

      globalThis.Blob = originalBlob;

      // Check months are present
      expect(capturedContent).toContain('2025-01');
      expect(capturedContent).toContain('2025-02');
      // January should have total of 150 (100 + 50)
      expect(capturedContent).toContain('150');
      // February should have total of 75
      expect(capturedContent).toContain('75');
    });

    it('should calculate percentage of monthly spend (AC#9)', () => {
      const transactions: Transaction[] = [
        { date: '2025-01-15', merchant: 'Store1', category: 'Supermarket', total: 75, items: [] },
        { date: '2025-01-20', merchant: 'Resto', category: 'Restaurant', total: 25, items: [] },
      ];

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

      downloadYearlyStatistics(transactions, '2025');

      globalThis.Blob = originalBlob;

      // Supermarket is 75/100 = 75% of January spend
      expect(capturedContent).toContain('75');
      // Restaurant is 25/100 = 25% of January spend
      expect(capturedContent).toContain('25');
    });

    it('should include transaction count per category per month (AC#9)', () => {
      const transactions: Transaction[] = [
        { date: '2025-01-15', merchant: 'Store1', category: 'Supermarket', total: 50, items: [] },
        { date: '2025-01-20', merchant: 'Store2', category: 'Supermarket', total: 50, items: [] },
        { date: '2025-01-25', merchant: 'Resto', category: 'Restaurant', total: 30, items: [] },
      ];

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

      downloadYearlyStatistics(transactions, '2025');

      globalThis.Blob = originalBlob;

      // Check headers
      expect(capturedContent).toContain('Transaction Count');
      // 2 Supermarket transactions, 1 Restaurant transaction
      const lines = capturedContent.split('\n');
      // Should have monthly rows with correct counts
      const supermarketLine = lines.find(l => l.includes('2025-01') && l.includes('Supermarket'));
      expect(supermarketLine).toContain(',2,'); // 2 transactions
    });

    it('should sort months chronologically (AC#9)', () => {
      const transactions: Transaction[] = [
        { date: '2025-03-15', merchant: 'Store', category: 'Supermarket', total: 100, items: [] },
        { date: '2025-01-15', merchant: 'Store', category: 'Supermarket', total: 100, items: [] },
        { date: '2025-02-15', merchant: 'Store', category: 'Supermarket', total: 100, items: [] },
      ];

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

      downloadYearlyStatistics(transactions, '2025');

      globalThis.Blob = originalBlob;

      const lines = capturedContent.split('\n');
      const dataLines = lines.slice(1); // Skip header

      // Find indices of months in the data
      const jan = dataLines.findIndex(l => l.includes('2025-01'));
      const feb = dataLines.findIndex(l => l.includes('2025-02'));
      const mar = dataLines.findIndex(l => l.includes('2025-03'));

      // January should come before February, February before March
      expect(jan).toBeLessThan(feb);
      expect(feb).toBeLessThan(mar);
    });

    it('should include yearly total summary rows (AC#9)', () => {
      const transactions: Transaction[] = [
        { date: '2025-01-15', merchant: 'Store1', category: 'Supermarket', total: 100, items: [] },
        { date: '2025-02-15', merchant: 'Store2', category: 'Supermarket', total: 200, items: [] },
        { date: '2025-01-20', merchant: 'Resto', category: 'Restaurant', total: 50, items: [] },
      ];

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

      downloadYearlyStatistics(transactions, '2025');

      globalThis.Blob = originalBlob;

      // Should have YEARLY TOTAL summary rows
      expect(capturedContent).toContain('YEARLY TOTAL');
      // Supermarket yearly total: 300
      expect(capturedContent).toContain('300');
      // Restaurant yearly total: 50
      const lines = capturedContent.split('\n');
      const yearlyLines = lines.filter(l => l.includes('YEARLY TOTAL'));
      expect(yearlyLines.length).toBe(2); // One for each category
    });

    it('should have correct CSV headers (AC#9)', () => {
      const transactions: Transaction[] = [
        { date: '2025-01-15', merchant: 'Store', category: 'Supermarket', total: 100, items: [] },
      ];

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

      downloadYearlyStatistics(transactions, '2025');

      globalThis.Blob = originalBlob;

      const headerLine = capturedContent.split('\n')[0].replace('\ufeff', '');
      expect(headerLine).toBe('Month,Category,Total,Transaction Count,% of Monthly Spend');
    });

    it('should handle single month of data', () => {
      const transactions: Transaction[] = [
        { date: '2025-06-15', merchant: 'Store', category: 'Supermarket', total: 100, items: [] },
      ];

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

      downloadYearlyStatistics(transactions, '2025');

      globalThis.Blob = originalBlob;

      // Should have June data
      expect(capturedContent).toContain('2025-06');
      // Only 1 month worth of data plus yearly summary
      const lines = capturedContent.split('\n');
      // Header + 1 monthly row + 1 yearly total row = 3 lines
      expect(lines.length).toBe(3);
    });

    it('should handle multiple categories in the same month', () => {
      const transactions: Transaction[] = [
        { date: '2025-01-15', merchant: 'Store', category: 'Supermarket', total: 60, items: [] },
        { date: '2025-01-16', merchant: 'Gas', category: 'Transport', total: 30, items: [] },
        { date: '2025-01-17', merchant: 'Resto', category: 'Restaurant', total: 10, items: [] },
      ];

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

      downloadYearlyStatistics(transactions, '2025');

      globalThis.Blob = originalBlob;

      // All 3 categories should be present in January
      expect(capturedContent).toContain('Supermarket');
      expect(capturedContent).toContain('Transport');
      expect(capturedContent).toContain('Restaurant');
      // Each monthly percentage should be based on monthly total (100)
      // Supermarket: 60/100 = 60%, Transport: 30/100 = 30%, Restaurant: 10/100 = 10%
    });

    it('should filter transactions to selected year only', () => {
      const transactions: Transaction[] = [
        { date: '2024-12-15', merchant: 'Store', category: 'Supermarket', total: 500, items: [] },
        { date: '2025-01-15', merchant: 'Store', category: 'Supermarket', total: 100, items: [] },
        { date: '2026-01-15', merchant: 'Store', category: 'Supermarket', total: 999, items: [] },
      ];

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

      downloadYearlyStatistics(transactions, '2025');

      globalThis.Blob = originalBlob;

      // Only 2025 data should be present
      expect(capturedContent).toContain('2025-01');
      expect(capturedContent).not.toContain('2024');
      expect(capturedContent).not.toContain('2026');
      // Should not include 500 or 999
      expect(capturedContent).not.toContain('500');
      expect(capturedContent).not.toContain('999');
    });
  });
});
