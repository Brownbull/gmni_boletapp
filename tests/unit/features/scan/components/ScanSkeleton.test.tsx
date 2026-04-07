/**
 * ScanSkeleton Component Tests
 *
 * Story TD-18-24: ScanSkeleton Component Test Coverage
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
    vi.resetAllMocks();
  });

  // AC-2: Tests verify skeleton renders with processing text
  describe('processing text', () => {
    it('renders processing text from translation', () => {
      render(<ScanSkeleton theme="light" t={mockT} />);

      expect(screen.getByText('Procesando boleta...')).toBeInTheDocument();
    });
  });

  // AC-3: Tests verify ETA display when estimatedTime is provided vs null
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

  // AC-4: Tests verify light and dark theme rendering
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

  // AC-5: Tests verify accessibility: aria-label attribute present
  describe('accessibility', () => {
    it('has aria-label on root element', () => {
      render(<ScanSkeleton theme="light" t={mockT} />);

      expect(screen.getByLabelText('Procesando boleta...')).toBeInTheDocument();
    });
  });

  // AC-6: Tests verify cancel button renders/does not render based on onCancel
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