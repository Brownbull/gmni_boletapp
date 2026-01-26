/**
 * Story 14e-9c: ProcessingState Unit Tests
 *
 * Tests for the ProcessingState component that renders when scan phase is 'scanning'.
 *
 * Test Categories:
 * - Phase guard (returns null when not scanning)
 * - Mode-aware rendering (batch with progress vs single indeterminate)
 * - Cancel callback
 * - Accessibility
 *
 * Review follow-up 14e-10: Updated to mock useScanStore with useShallow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProcessingState } from '@features/scan/components/states';
import type { ScanPhase, ScanMode, BatchProgress } from '@/types/scanStateMachine';

// Mock state to be modified per test
let mockPhase: ScanPhase = 'scanning';
let mockMode: ScanMode = 'single';
let mockBatchProgress: BatchProgress | null = null;

// Mock the scan store - useShallow passes a selector function
vi.mock('@features/scan/store', () => ({
  useScanStore: (selector: (state: unknown) => unknown) => {
    const mockState = {
      phase: mockPhase,
      mode: mockMode,
      batchProgress: mockBatchProgress,
    };
    return selector(mockState);
  },
}));

// Mock useShallow from zustand
vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: (s: unknown) => unknown) => fn,
}));

// Mock ScanProgress component
vi.mock('@features/scan/components/ScanProgress', () => ({
  ScanProgress: ({
    progress,
    onCancel,
    t,
  }: {
    progress: number;
    onCancel: () => void;
    t: (key: string) => string;
  }) => (
    <div data-testid="scan-progress">
      <span data-testid="progress-value">{progress}%</span>
      <button onClick={onCancel}>{t('cancel')}</button>
    </div>
  ),
}));

// Mock useReducedMotion hook
vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

// Mock translation function
const mockT = (key: string): string => {
  const translations: Record<string, string> = {
    scanProcessing: 'Processing receipt...',
    scanUploading: 'Uploading...',
    cancel: 'Cancel',
  };
  return translations[key] || key;
};

// Helper to set mock state
const setMockState = (
  phase: ScanPhase,
  mode: ScanMode,
  batchProgress: BatchProgress | null = null
) => {
  mockPhase = phase;
  mockMode = mode;
  mockBatchProgress = batchProgress;
};

describe('ProcessingState', () => {
  const defaultProps = {
    t: mockT,
    theme: 'light' as const,
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default state
    setMockState('scanning', 'single', null);
  });

  describe('phase guard', () => {
    it('should render when phase is scanning', () => {
      setMockState('scanning', 'single', null);

      render(<ProcessingState {...defaultProps} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should return null when phase is idle', () => {
      setMockState('idle', 'single', null);

      const { container } = render(<ProcessingState {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should return null when phase is reviewing', () => {
      setMockState('reviewing', 'single', null);

      const { container } = render(<ProcessingState {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should return null when phase is error', () => {
      setMockState('error', 'single', null);

      const { container } = render(<ProcessingState {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should return null when phase is saving', () => {
      setMockState('saving', 'single', null);

      const { container } = render(<ProcessingState {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should return null when phase is capturing', () => {
      setMockState('capturing', 'single', null);

      const { container } = render(<ProcessingState {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('batch mode with progress', () => {
    it('should render ScanProgress when in batch mode with valid progress', () => {
      // 2/4 completed = 50%
      setMockState('scanning', 'batch', {
        total: 4,
        completed: ['id1', 'id2'],
        failed: [],
        currentIndex: 2,
      });

      render(<ProcessingState {...defaultProps} />);

      expect(screen.getByTestId('scan-progress')).toBeInTheDocument();
      expect(screen.getByTestId('progress-value')).toHaveTextContent('50%');
    });

    it('should render ScanProgress at 0% progress', () => {
      // 0/4 completed = 0%
      setMockState('scanning', 'batch', {
        total: 4,
        completed: [],
        failed: [],
        currentIndex: 0,
      });

      render(<ProcessingState {...defaultProps} />);

      expect(screen.getByTestId('scan-progress')).toBeInTheDocument();
      expect(screen.getByTestId('progress-value')).toHaveTextContent('0%');
    });

    it('should render ScanProgress at 100% progress', () => {
      // 4/4 completed = 100%
      setMockState('scanning', 'batch', {
        total: 4,
        completed: ['id1', 'id2', 'id3', 'id4'],
        failed: [],
        currentIndex: 4,
      });

      render(<ProcessingState {...defaultProps} />);

      expect(screen.getByTestId('scan-progress')).toBeInTheDocument();
      expect(screen.getByTestId('progress-value')).toHaveTextContent('100%');
    });

    it('should include failed items in progress calculation', () => {
      // 2 completed + 1 failed = 3/4 = 75%
      setMockState('scanning', 'batch', {
        total: 4,
        completed: ['id1', 'id2'],
        failed: ['id3'],
        currentIndex: 3,
      });

      render(<ProcessingState {...defaultProps} />);

      expect(screen.getByTestId('progress-value')).toHaveTextContent('75%');
    });
  });

  describe('single mode (indeterminate)', () => {
    it('should render indeterminate spinner in single mode', () => {
      setMockState('scanning', 'single', null);

      render(<ProcessingState {...defaultProps} />);

      // Should NOT render ScanProgress
      expect(screen.queryByTestId('scan-progress')).not.toBeInTheDocument();

      // Should render indeterminate UI
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Processing receipt...')).toBeInTheDocument();
    });

    it('should render indeterminate spinner in statement mode', () => {
      setMockState('scanning', 'statement', null);

      render(<ProcessingState {...defaultProps} />);

      expect(screen.queryByTestId('scan-progress')).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should show cancel button in indeterminate mode', () => {
      setMockState('scanning', 'single', null);

      render(<ProcessingState {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });
  });

  describe('cancel callback', () => {
    it('should call onCancel when cancel button clicked in batch mode', () => {
      setMockState('scanning', 'batch', {
        total: 4,
        completed: ['id1', 'id2'],
        failed: [],
        currentIndex: 2,
      });

      const onCancel = vi.fn();
      render(<ProcessingState {...defaultProps} onCancel={onCancel} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button clicked in single mode', () => {
      setMockState('scanning', 'single', null);

      const onCancel = vi.fn();
      render(<ProcessingState {...defaultProps} onCancel={onCancel} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('theme support', () => {
    it('should render with light theme', () => {
      setMockState('scanning', 'single', null);

      render(<ProcessingState {...defaultProps} theme="light" />);

      // Check element renders - CSS variables resolved at runtime
      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('rounded-xl');
    });

    it('should render with dark theme', () => {
      setMockState('scanning', 'single', null);

      render(<ProcessingState {...defaultProps} theme="dark" />);

      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have role="status" in single mode', () => {
      setMockState('scanning', 'single', null);

      render(<ProcessingState {...defaultProps} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-live="polite"', () => {
      setMockState('scanning', 'single', null);

      render(<ProcessingState {...defaultProps} />);

      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-label describing processing', () => {
      setMockState('scanning', 'single', null);

      render(<ProcessingState {...defaultProps} />);

      // Uses t('scanProcessing') || 'Processing...'
      // mockT returns 'Processing receipt...' for 'scanProcessing'
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Processing receipt...');
    });
  });
});
