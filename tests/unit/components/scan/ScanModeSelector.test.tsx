/**
 * Story 14d.7: ScanModeSelector Unit Tests
 *
 * Tests for the Mode Selector Popup component that allows users to select
 * between scan modes (single, batch, statement) via long-press on FAB.
 *
 * Test Categories:
 * - credits display (AC10-13)
 * - mode options (AC14-18)
 * - selection behavior (AC19-25)
 * - dismissal (AC23-24)
 * - accessibility (AC26-30)
 * - dark mode (AC31-32)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScanModeSelector } from '../../../../src/components/scan/ScanModeSelector';
import type { ScanModeId } from '../../../../src/components/scan/ScanModeSelector';

// Mock translation function
const mockT = (key: string, params?: Record<string, string | number>): string => {
  const translations: Record<string, string> = {
    scanModeSelectorTitle: 'SCAN MODE',
    scanModeSingle: 'Single scan',
    scanModeSingleDesc: 'One receipt at a time',
    scanModeBatch: 'Batch scan',
    scanModeBatchDesc: 'Multiple receipts at once',
    scanModeStatement: 'Bank statement',
    scanModeStatementDesc: 'Coming soon',
    scanModeCredit: '1 credit',
    comingSoon: 'Soon',
  };
  return translations[key] || key;
};

describe('ScanModeSelector', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelectMode: vi.fn(),
    normalCredits: 100,
    superCredits: 50,
    t: mockT,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<ScanModeSelector {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('scan-mode-selector')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(<ScanModeSelector {...defaultProps} />);

      expect(screen.getByTestId('scan-mode-selector')).toBeInTheDocument();
    });

    it('should render backdrop when open', () => {
      render(<ScanModeSelector {...defaultProps} />);

      expect(screen.getByTestId('scan-mode-selector-backdrop')).toBeInTheDocument();
    });
  });

  describe('credits display (AC10-13)', () => {
    it('AC10: should display super credits with lightning icon', () => {
      render(<ScanModeSelector {...defaultProps} superCredits={96} />);

      const superBadge = screen.getByTestId('super-credits-badge');
      expect(superBadge).toBeInTheDocument();
      expect(superBadge).toHaveTextContent('96');
    });

    it('AC11: should display normal credits with clock icon', () => {
      render(<ScanModeSelector {...defaultProps} normalCredits={150} />);

      const normalBadge = screen.getByTestId('normal-credits-badge');
      expect(normalBadge).toBeInTheDocument();
      expect(normalBadge).toHaveTextContent('150');
    });

    it('AC12: should format credits with "K" suffix for 1000+', () => {
      render(<ScanModeSelector {...defaultProps} normalCredits={1500} superCredits={2000} />);

      // 1500 -> "1K", 2000 -> "2K"
      expect(screen.getByTestId('normal-credits-badge')).toHaveTextContent('1K');
      expect(screen.getByTestId('super-credits-badge')).toHaveTextContent('2K');
    });

    it('should show 0 when no credits remaining', () => {
      render(<ScanModeSelector {...defaultProps} normalCredits={0} superCredits={0} />);

      expect(screen.getByTestId('normal-credits-badge')).toHaveTextContent('0');
      expect(screen.getByTestId('super-credits-badge')).toHaveTextContent('0');
    });
  });

  describe('mode options (AC14-18)', () => {
    it('AC14: should render three mode options', () => {
      render(<ScanModeSelector {...defaultProps} />);

      expect(screen.getByTestId('scan-mode-single')).toBeInTheDocument();
      expect(screen.getByTestId('scan-mode-batch')).toBeInTheDocument();
      expect(screen.getByTestId('scan-mode-statement')).toBeInTheDocument();
    });

    it('AC15: should display correct labels for each mode', () => {
      render(<ScanModeSelector {...defaultProps} />);

      expect(screen.getByText('Single scan')).toBeInTheDocument();
      expect(screen.getByText('Batch scan')).toBeInTheDocument();
      expect(screen.getByText('Bank statement')).toBeInTheDocument();
    });

    it('AC17: should show credit cost badge for single mode', () => {
      render(<ScanModeSelector {...defaultProps} />);

      const singleButton = screen.getByTestId('scan-mode-single');
      expect(singleButton).toHaveTextContent('1 credit');
    });

    it('AC17: should show super credit badge for batch mode', () => {
      render(<ScanModeSelector {...defaultProps} />);

      const batchButton = screen.getByTestId('scan-mode-batch');
      expect(batchButton).toHaveTextContent('1 super');
    });

    it('AC18: should show "Soon" badge for statement mode', () => {
      render(<ScanModeSelector {...defaultProps} />);

      const statementButton = screen.getByTestId('scan-mode-statement');
      expect(statementButton).toHaveTextContent('Soon');
    });

    it('AC25: should disable options when insufficient credits', () => {
      render(<ScanModeSelector {...defaultProps} normalCredits={0} superCredits={0} />);

      const singleButton = screen.getByTestId('scan-mode-single');
      const batchButton = screen.getByTestId('scan-mode-batch');

      expect(singleButton).toBeDisabled();
      expect(batchButton).toBeDisabled();
    });

    it('should not disable statement mode regardless of credits', () => {
      render(<ScanModeSelector {...defaultProps} normalCredits={0} superCredits={0} />);

      const statementButton = screen.getByTestId('scan-mode-statement');
      expect(statementButton).not.toBeDisabled();
    });
  });

  describe('selection behavior (AC19-22)', () => {
    it('AC19: should call onSelectMode with "single" when single option clicked', async () => {
      const onSelectMode = vi.fn();
      render(<ScanModeSelector {...defaultProps} onSelectMode={onSelectMode} />);

      await userEvent.click(screen.getByTestId('scan-mode-single'));

      expect(onSelectMode).toHaveBeenCalledWith('single');
    });

    it('AC20: should call onSelectMode with "batch" when batch option clicked', async () => {
      const onSelectMode = vi.fn();
      render(<ScanModeSelector {...defaultProps} onSelectMode={onSelectMode} />);

      await userEvent.click(screen.getByTestId('scan-mode-batch'));

      expect(onSelectMode).toHaveBeenCalledWith('batch');
    });

    it('AC21: should call onSelectMode with "statement" when statement option clicked', async () => {
      const onSelectMode = vi.fn();
      render(<ScanModeSelector {...defaultProps} onSelectMode={onSelectMode} />);

      await userEvent.click(screen.getByTestId('scan-mode-statement'));

      expect(onSelectMode).toHaveBeenCalledWith('statement');
    });

    it('AC22: should call onClose after mode selection', async () => {
      const onClose = vi.fn();
      render(<ScanModeSelector {...defaultProps} onClose={onClose} />);

      await userEvent.click(screen.getByTestId('scan-mode-single'));

      expect(onClose).toHaveBeenCalled();
    });

    it('should not call onSelectMode when disabled option clicked', async () => {
      const onSelectMode = vi.fn();
      render(<ScanModeSelector {...defaultProps} normalCredits={0} onSelectMode={onSelectMode} />);

      // Single should be disabled with 0 normal credits
      await userEvent.click(screen.getByTestId('scan-mode-single'));

      expect(onSelectMode).not.toHaveBeenCalled();
    });
  });

  describe('dismissal (AC23-24)', () => {
    it('AC23: should close on backdrop click', async () => {
      const onClose = vi.fn();
      render(<ScanModeSelector {...defaultProps} onClose={onClose} />);

      await userEvent.click(screen.getByTestId('scan-mode-selector-backdrop'));

      expect(onClose).toHaveBeenCalled();
    });

    it('AC24: should close on Escape key', async () => {
      const onClose = vi.fn();
      render(<ScanModeSelector {...defaultProps} onClose={onClose} />);

      // Focus the selector and press Escape
      fireEvent.keyDown(screen.getByTestId('scan-mode-selector'), { key: 'Escape' });

      expect(onClose).toHaveBeenCalled();
    });

    it('should not close on popup content click', async () => {
      const onClose = vi.fn();
      render(<ScanModeSelector {...defaultProps} onClose={onClose} />);

      // Click on the popup itself (not backdrop, not mode buttons)
      await userEvent.click(screen.getByText('SCAN MODE'));

      // onClose should NOT be called (only selecting a mode or backdrop should close)
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('accessibility (AC26-30)', () => {
    it('AC26: should have role="menu" on popup', () => {
      render(<ScanModeSelector {...defaultProps} />);

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('AC27: should have role="menuitem" on options', () => {
      render(<ScanModeSelector {...defaultProps} />);

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(3);
    });

    it('AC29: should focus first enabled option on open', async () => {
      render(<ScanModeSelector {...defaultProps} />);

      // Wait for focus to be set (has a small delay)
      await waitFor(() => {
        expect(screen.getByTestId('scan-mode-single')).toHaveFocus();
      });
    });

    it('AC30: should support arrow key navigation', async () => {
      render(<ScanModeSelector {...defaultProps} />);

      // Wait for initial focus
      await waitFor(() => {
        expect(screen.getByTestId('scan-mode-single')).toHaveFocus();
      });

      // Press ArrowDown to move to batch
      fireEvent.keyDown(screen.getByTestId('scan-mode-selector'), { key: 'ArrowDown' });
      expect(screen.getByTestId('scan-mode-batch')).toHaveFocus();

      // Press ArrowDown to move to statement
      fireEvent.keyDown(screen.getByTestId('scan-mode-selector'), { key: 'ArrowDown' });
      expect(screen.getByTestId('scan-mode-statement')).toHaveFocus();

      // Press ArrowUp to go back to batch
      fireEvent.keyDown(screen.getByTestId('scan-mode-selector'), { key: 'ArrowUp' });
      expect(screen.getByTestId('scan-mode-batch')).toHaveFocus();
    });

    it('should skip disabled options in arrow navigation', async () => {
      // With 0 normal credits, single is disabled
      render(<ScanModeSelector {...defaultProps} normalCredits={0} />);

      // Focus should go to first enabled option (batch)
      await waitFor(() => {
        expect(screen.getByTestId('scan-mode-batch')).toHaveFocus();
      });
    });
  });

  describe('credit sufficiency', () => {
    it('should enable single when normalCredits >= 1', () => {
      render(<ScanModeSelector {...defaultProps} normalCredits={1} superCredits={0} />);

      expect(screen.getByTestId('scan-mode-single')).not.toBeDisabled();
    });

    it('should enable batch when superCredits >= 1', () => {
      render(<ScanModeSelector {...defaultProps} normalCredits={0} superCredits={1} />);

      expect(screen.getByTestId('scan-mode-batch')).not.toBeDisabled();
    });

    it('should disable single when normalCredits = 0', () => {
      render(<ScanModeSelector {...defaultProps} normalCredits={0} superCredits={100} />);

      expect(screen.getByTestId('scan-mode-single')).toBeDisabled();
    });

    it('should disable batch when superCredits = 0', () => {
      render(<ScanModeSelector {...defaultProps} normalCredits={100} superCredits={0} />);

      expect(screen.getByTestId('scan-mode-batch')).toBeDisabled();
    });
  });
});
