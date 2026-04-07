/**
 * ScanSkeleton Component Tests
 *
 * Story TD-18-24: ScanSkeleton Component Test Coverage
 * Story TD-18-25: SkeletonLine Render Coverage (shimmer element assertions)
 * Source: TD-18-19 code review finding #3
 *
 * Tests shimmer rendering, ETA display, accessibility,
 * theme support, and cancel button behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScanSkeleton } from '@features/scan/components';

// Mock translation function
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    scanProcessing: 'Procesando boleta...',
    cancel: 'Cancelar',
    seconds: 'segundos',
  };
  return translations[key] || key;
});

describe('ScanSkeleton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TD-18-24 AC-2: Tests verify skeleton renders with processing text
  describe('processing text', () => {
    it('renders processing text from translation', () => {
      render(<ScanSkeleton theme="light" t={mockT} />);

      expect(screen.getByText('Procesando boleta...')).toBeInTheDocument();
    });
  });

  // TD-18-24 AC-3: Tests verify ETA display when estimatedTime is provided vs null
  describe('ETA display', () => {
    it('shows estimated time when estimatedTime is provided', () => {
      render(<ScanSkeleton theme="light" t={mockT} estimatedTime={5} />);

      expect(screen.getByText(/~5 segundos/)).toBeInTheDocument();
    });

    it('does not show estimated time when estimatedTime is null', () => {
      render(<ScanSkeleton theme="light" t={mockT} estimatedTime={null} />);

      expect(screen.queryByText(/segundos/)).not.toBeInTheDocument();
    });

    it('does not show estimated time when estimatedTime is undefined', () => {
      render(<ScanSkeleton theme="light" t={mockT} />);

      expect(screen.queryByText(/segundos/)).not.toBeInTheDocument();
    });

    it('shows estimated time when estimatedTime is 0', () => {
      render(<ScanSkeleton theme="light" t={mockT} estimatedTime={0} />);

      expect(screen.getByText(/~0 segundos/)).toBeInTheDocument();
    });
  });

  // TD-18-24 AC-4: Tests verify light and dark theme rendering
  describe('theme rendering', () => {
    it('renders with light theme border color', () => {
      render(<ScanSkeleton theme="light" t={mockT} />);

      const root = screen.getByLabelText('Procesando boleta...');
      expect(root.style.border).toContain('#e2e8f0');
    });

    it('renders with dark theme border color', () => {
      render(<ScanSkeleton theme="dark" t={mockT} />);

      const root = screen.getByLabelText('Procesando boleta...');
      expect(root.style.border).toContain('#334155');
    });
  });

  // TD-18-24 AC-5: Tests verify accessibility: aria-label attribute present
  describe('accessibility', () => {
    it('has aria-label on root element', () => {
      render(<ScanSkeleton theme="light" t={mockT} />);

      expect(screen.getByLabelText('Procesando boleta...')).toBeInTheDocument();
    });
  });

  // TD-18-25 AC-1: Tests verify shimmer placeholder elements render in the DOM
  describe('SkeletonLine shimmer elements', () => {
    it('renders merchant section skeleton lines', () => {
      const { container } = render(<ScanSkeleton theme="light" t={mockT} />);

      // Merchant section: 60% width (name) + 40% width (detail)
      const skeletonLines = container.querySelectorAll<HTMLElement>('.rounded');
      const widths = Array.from(skeletonLines).map((el) => el.style.width);

      expect(widths).toContain('60%');
      expect(widths).toContain('40%');
    });

    it('renders total amount section skeleton lines', () => {
      const { container } = render(<ScanSkeleton theme="light" t={mockT} />);

      const skeletonLines = container.querySelectorAll<HTMLElement>('.rounded');
      const widths = Array.from(skeletonLines).map((el) => el.style.width);

      expect(widths).toContain('80px');
      expect(widths).toContain('140px');
    });

    it('renders items section skeleton lines', () => {
      const { container } = render(<ScanSkeleton theme="light" t={mockT} />);

      const skeletonLines = container.querySelectorAll<HTMLElement>('.rounded');
      const widths = Array.from(skeletonLines).map((el) => el.style.width);

      expect(widths).toContain('45%');
      expect(widths.filter((w) => w === '100%')).toHaveLength(2);
      expect(widths).toContain('75%');
    });

    it('renders all 8 skeleton line placeholders', () => {
      const { container } = render(<ScanSkeleton theme="light" t={mockT} />);

      // SkeletonLine uses .rounded class + shimmer background
      const skeletonLines = container.querySelectorAll<HTMLElement>('.rounded');
      const shimmerLines = Array.from(skeletonLines).filter((el) =>
        el.style.background?.includes('linear-gradient'),
      );

      // Merchant: 2 + Total: 2 + Items header: 1 + Items: 3 = 8
      expect(shimmerLines).toHaveLength(8);
    });
  });

  // TD-18-25 AC-2: Tests verify shimmer elements use theme-appropriate gradients
  describe('SkeletonLine theme gradients', () => {
    it('uses light theme gradient colors', () => {
      const { container } = render(<ScanSkeleton theme="light" t={mockT} />);

      const skeletonLines = container.querySelectorAll<HTMLElement>('.rounded');
      const shimmerLines = Array.from(skeletonLines).filter((el) =>
        el.style.background?.includes('linear-gradient'),
      );

      // Light theme uses #e2e8f0 and #f1f5f9
      expect(shimmerLines.length).toBeGreaterThan(0);
      shimmerLines.forEach((el) => {
        expect(el.style.background).toContain('#e2e8f0');
        expect(el.style.background).toContain('#f1f5f9');
      });
    });

    it('uses dark theme gradient colors', () => {
      const { container } = render(<ScanSkeleton theme="dark" t={mockT} />);

      const skeletonLines = container.querySelectorAll<HTMLElement>('.rounded');
      const shimmerLines = Array.from(skeletonLines).filter((el) =>
        el.style.background?.includes('linear-gradient'),
      );

      // Dark theme uses #334155 and #475569
      expect(shimmerLines.length).toBeGreaterThan(0);
      shimmerLines.forEach((el) => {
        expect(el.style.background).toContain('#334155');
        expect(el.style.background).toContain('#475569');
      });
    });
  });

  // TD-18-24 AC-6: Tests verify cancel button renders/does not render based on onCancel
  describe('cancel button', () => {
    it('renders cancel button when onCancel is provided', () => {
      const handleCancel = vi.fn();
      render(<ScanSkeleton theme="light" t={mockT} onCancel={handleCancel} />);

      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    it('does not render cancel button when onCancel is omitted', () => {
      render(<ScanSkeleton theme="light" t={mockT} />);

      expect(screen.queryByText('Cancelar')).not.toBeInTheDocument();
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const handleCancel = vi.fn();
      render(<ScanSkeleton theme="light" t={mockT} onCancel={handleCancel} />);

      await user.click(screen.getByText('Cancelar'));

      expect(handleCancel).toHaveBeenCalledTimes(1);
    });
  });
});