/**
 * Tests for handlePrintReport() DOM API refactoring
 *
 * Story 15-TD-17: Replace innerHTML template literals with
 * createElement/textContent for defense-in-depth XSS prevention.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { testHandlePrintReport } from '@/features/reports/components/ReportDetailOverlay';

describe('handlePrintReport - DOM API sanitization', () => {
  let printContainer: HTMLDivElement;
  let reportContentDiv: HTMLDivElement;
  let reportContentRef: { current: HTMLDivElement | null };
  const mockPrint = vi.fn();
  let originalPrint: typeof window.print;
  let originalTitle: string;

  const baseReportData = {
    fullTitle: 'Semana 23 · Diciembre · Q4 2025',
    transactionCount: 42,
    periodType: 'weekly' as const,
    dateRange: {
      start: new Date(2025, 11, 2),
      end: new Date(2025, 11, 8),
    },
  };

  beforeEach(() => {
    // Setup DOM
    printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    document.body.appendChild(printContainer);

    reportContentDiv = document.createElement('div');
    reportContentDiv.textContent = 'Report content';
    reportContentRef = { current: reportContentDiv };

    originalPrint = window.print;
    window.print = mockPrint;
    originalTitle = document.title;
  });

  afterEach(() => {
    printContainer.remove();
    window.print = originalPrint;
    document.title = originalTitle;
    mockPrint.mockClear();
    vi.restoreAllMocks();
  });

  it('should create branding section with DOM APIs', () => {
    testHandlePrintReport(reportContentRef, baseReportData);

    const branding = printContainer.querySelector('.print-branding');
    expect(branding).not.toBeNull();

    const logoCircle = branding?.querySelector('.print-logo-circle');
    expect(logoCircle).not.toBeNull();
    expect(logoCircle?.textContent).toBe('G');

    const wordmark = branding?.querySelector('.print-wordmark');
    expect(wordmark).not.toBeNull();
    expect(wordmark?.textContent).toBe('Gastify');
  });

  it('should create report header with textContent (not innerHTML)', () => {
    testHandlePrintReport(reportContentRef, baseReportData);

    const header = printContainer.querySelector('.print-report-header');
    expect(header).not.toBeNull();

    const h1 = header?.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toBe('Semana 23 · Diciembre · Q4 2025');

    const p = header?.querySelector('p');
    expect(p).not.toBeNull();
    expect(p?.textContent).toBe('42 transacciones');
  });

  it('should use singular "transacción" when count is 1', () => {
    testHandlePrintReport(reportContentRef, {
      ...baseReportData,
      transactionCount: 1,
    });

    const header = printContainer.querySelector('.print-report-header');
    const p = header?.querySelector('p');
    expect(p?.textContent).toBe('1 transacción');
  });

  it('should create footer with DOM APIs', () => {
    testHandlePrintReport(reportContentRef, baseReportData);

    const footer = printContainer.querySelector('.print-footer');
    expect(footer).not.toBeNull();

    const divider = footer?.querySelector('.print-footer-divider');
    expect(divider).not.toBeNull();

    const title = footer?.querySelector('.print-footer-title');
    expect(title?.textContent).toBe('Reporte generado automáticamente por Gastify');

    const disclaimer = footer?.querySelector('.print-footer-disclaimer');
    expect(disclaimer?.textContent).toBe('Este reporte es solo para uso personal.');

    const url = footer?.querySelector('.print-footer-url');
    expect(url?.textContent).toBe('gastify.cl');
  });

  it('should escape XSS in fullTitle via textContent', () => {
    const xssData = {
      ...baseReportData,
      fullTitle: '<script>alert("xss")</script>',
    };

    testHandlePrintReport(reportContentRef, xssData);

    const h1 = printContainer.querySelector('.print-report-header h1');
    // textContent preserves the literal string — browser does NOT parse it as HTML
    expect(h1?.textContent).toBe('<script>alert("xss")</script>');
    // innerHTML shows the escaped version, proving it was set via textContent
    expect(h1?.innerHTML).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
  });

  it('should do nothing when reportContentRef.current is null', () => {
    const nullRef = { current: null };
    testHandlePrintReport(nullRef, baseReportData);

    expect(mockPrint).not.toHaveBeenCalled();
  });

  it('should call window.print after populating container', () => {
    testHandlePrintReport(reportContentRef, baseReportData);

    expect(mockPrint).toHaveBeenCalledOnce();
  });

  it('should set document.title to generated filename', () => {
    testHandlePrintReport(reportContentRef, baseReportData);

    // Weekly report: Gastify_report_YYYY_Q4_Dic_SXX
    expect(document.title).toMatch(/^Gastify_report_2025_Q4_Dic_S\d+$/);
  });

  it('should add printing-report class to body', () => {
    testHandlePrintReport(reportContentRef, baseReportData);

    expect(document.body.classList.contains('printing-report')).toBe(true);
  });

  it('should clean up after timeout fallback', () => {
    vi.useFakeTimers();

    testHandlePrintReport(reportContentRef, baseReportData);
    expect(document.body.classList.contains('printing-report')).toBe(true);

    vi.advanceTimersByTime(1000);
    expect(document.body.classList.contains('printing-report')).toBe(false);
    expect(printContainer.childNodes.length).toBe(0);
    expect(document.title).toBe(originalTitle);

    vi.useRealTimers();
  });

  it('should clean up via afterprint event', () => {
    testHandlePrintReport(reportContentRef, baseReportData);
    expect(document.body.classList.contains('printing-report')).toBe(true);

    window.dispatchEvent(new Event('afterprint'));
    expect(document.body.classList.contains('printing-report')).toBe(false);
    expect(printContainer.childNodes.length).toBe(0);
    expect(document.title).toBe(originalTitle);
  });
});
