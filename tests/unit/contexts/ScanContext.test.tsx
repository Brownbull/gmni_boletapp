/**
 * Story 14d.2: ScanContext Provider Tests
 *
 * Tests for the ScanContext provider and consumer hooks:
 * - Provider rendering and state provision
 * - useScan hook behavior (throws outside provider)
 * - useScanOptional hook behavior (returns null outside provider)
 * - Action wrapper referential stability (useCallback)
 * - State propagation to consumers
 *
 * @see docs/sprint-artifacts/epic14d/stories/story-14d.2-scan-context-provider.md
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, renderHook, waitFor } from '@testing-library/react';
import { ScanProvider, useScan, useScanOptional } from '../../../src/contexts/ScanContext';
import type { ScanContextValue } from '../../../src/contexts/ScanContext';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Test wrapper component that provides ScanContext.
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <ScanProvider>{children}</ScanProvider>;
}

/**
 * Consumer component that displays scan state for testing.
 */
function ScanStateDisplay() {
  const { state, isIdle, isProcessing, hasActiveRequest } = useScan();

  return (
    <div>
      <span data-testid="phase">{state.phase}</span>
      <span data-testid="mode">{state.mode}</span>
      <span data-testid="is-idle">{isIdle.toString()}</span>
      <span data-testid="is-processing">{isProcessing.toString()}</span>
      <span data-testid="has-active-request">{hasActiveRequest.toString()}</span>
      <span data-testid="image-count">{state.images.length}</span>
    </div>
  );
}

/**
 * Consumer component that dispatches actions for testing.
 */
function ScanActionDispatcher({
  onContextReady,
}: {
  onContextReady: (ctx: ScanContextValue) => void;
}) {
  const context = useScan();

  React.useEffect(() => {
    onContextReady(context);
  }, [context, onContextReady]);

  return null;
}

/**
 * Consumer using optional hook for testing outside provider behavior.
 */
function OptionalConsumer() {
  const scan = useScanOptional();

  return (
    <div>
      <span data-testid="has-context">{(scan !== null).toString()}</span>
      {scan && <span data-testid="phase">{scan.state.phase}</span>}
    </div>
  );
}

// =============================================================================
// Provider Tests
// =============================================================================

describe('ScanContext', () => {
  describe('ScanProvider', () => {
    it('should render children', () => {
      render(
        <ScanProvider>
          <div data-testid="child">Child content</div>
        </ScanProvider>
      );

      expect(screen.getByTestId('child')).toHaveTextContent('Child content');
    });

    it('should provide initial scan state to children', () => {
      render(
        <ScanProvider>
          <ScanStateDisplay />
        </ScanProvider>
      );

      expect(screen.getByTestId('phase')).toHaveTextContent('idle');
      expect(screen.getByTestId('mode')).toHaveTextContent('single');
      expect(screen.getByTestId('is-idle')).toHaveTextContent('true');
      expect(screen.getByTestId('is-processing')).toHaveTextContent('false');
      expect(screen.getByTestId('has-active-request')).toHaveTextContent('false');
    });

    it('should provide action methods to consumers', () => {
      let contextValue: ScanContextValue | null = null;

      render(
        <ScanProvider>
          <ScanActionDispatcher
            onContextReady={(ctx) => {
              contextValue = ctx;
            }}
          />
        </ScanProvider>
      );

      expect(contextValue).not.toBeNull();
      expect(typeof contextValue!.startSingleScan).toBe('function');
      expect(typeof contextValue!.startBatchScan).toBe('function');
      expect(typeof contextValue!.startStatementScan).toBe('function');
      expect(typeof contextValue!.addImage).toBe('function');
      expect(typeof contextValue!.removeImage).toBe('function');
      expect(typeof contextValue!.processStart).toBe('function');
      expect(typeof contextValue!.processSuccess).toBe('function');
      expect(typeof contextValue!.processError).toBe('function');
      expect(typeof contextValue!.showDialog).toBe('function');
      expect(typeof contextValue!.resolveDialog).toBe('function');
      expect(typeof contextValue!.cancel).toBe('function');
      expect(typeof contextValue!.reset).toBe('function');
      expect(typeof contextValue!.dispatch).toBe('function');
    });

    it('should update state when actions are dispatched', async () => {
      let contextValue: ScanContextValue | null = null;

      render(
        <ScanProvider>
          <ScanActionDispatcher
            onContextReady={(ctx) => {
              contextValue = ctx;
            }}
          />
          <ScanStateDisplay />
        </ScanProvider>
      );

      // Initial state
      expect(screen.getByTestId('phase')).toHaveTextContent('idle');

      // Start a scan
      act(() => {
        contextValue!.startSingleScan('test-user-id');
      });

      await waitFor(() => {
        expect(screen.getByTestId('phase')).toHaveTextContent('capturing');
      });
      expect(screen.getByTestId('has-active-request')).toHaveTextContent('true');
      expect(screen.getByTestId('is-idle')).toHaveTextContent('false');
    });

    it('should handle image operations', async () => {
      let contextValue: ScanContextValue | null = null;

      render(
        <ScanProvider>
          <ScanActionDispatcher
            onContextReady={(ctx) => {
              contextValue = ctx;
            }}
          />
          <ScanStateDisplay />
        </ScanProvider>
      );

      // Start a scan first (required before adding images)
      act(() => {
        contextValue!.startSingleScan('test-user-id');
      });

      await waitFor(() => {
        expect(screen.getByTestId('phase')).toHaveTextContent('capturing');
      });

      // Add an image
      act(() => {
        contextValue!.addImage('base64-test-image');
      });

      await waitFor(() => {
        expect(screen.getByTestId('image-count')).toHaveTextContent('1');
      });

      // Remove the image
      act(() => {
        contextValue!.removeImage(0);
      });

      await waitFor(() => {
        expect(screen.getByTestId('image-count')).toHaveTextContent('0');
      });
    });
  });

  // ===========================================================================
  // useScan Hook Tests
  // ===========================================================================

  describe('useScan', () => {
    it('should throw when used outside ScanProvider', () => {
      // Suppress console.error for this test since we expect an error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useScan());
      }).toThrow('useScan must be used within a ScanProvider');

      consoleSpy.mockRestore();
    });

    it('should return context value when inside ScanProvider', () => {
      const { result } = renderHook(() => useScan(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBeDefined();
      expect(result.current.state).toBeDefined();
      expect(result.current.state.phase).toBe('idle');
      expect(result.current.dispatch).toBeDefined();
    });

    it('should have stable action references (useCallback)', () => {
      const { result, rerender } = renderHook(() => useScan(), {
        wrapper: TestWrapper,
      });

      const initialActions = {
        startSingleScan: result.current.startSingleScan,
        startBatchScan: result.current.startBatchScan,
        addImage: result.current.addImage,
        cancel: result.current.cancel,
        reset: result.current.reset,
      };

      // Trigger a re-render
      rerender();

      // Action references should be stable (same identity)
      expect(result.current.startSingleScan).toBe(initialActions.startSingleScan);
      expect(result.current.startBatchScan).toBe(initialActions.startBatchScan);
      expect(result.current.addImage).toBe(initialActions.addImage);
      expect(result.current.cancel).toBe(initialActions.cancel);
      expect(result.current.reset).toBe(initialActions.reset);
    });
  });

  // ===========================================================================
  // useScanOptional Hook Tests
  // ===========================================================================

  describe('useScanOptional', () => {
    it('should return null when used outside ScanProvider', () => {
      const { result } = renderHook(() => useScanOptional());

      expect(result.current).toBeNull();
    });

    it('should return context value when inside ScanProvider', () => {
      const { result } = renderHook(() => useScanOptional(), {
        wrapper: TestWrapper,
      });

      expect(result.current).not.toBeNull();
      expect(result.current?.state.phase).toBe('idle');
    });

    it('should work in render without throwing', () => {
      // Outside provider - should not throw
      render(<OptionalConsumer />);
      expect(screen.getByTestId('has-context')).toHaveTextContent('false');
    });

    it('should work inside provider', () => {
      render(
        <ScanProvider>
          <OptionalConsumer />
        </ScanProvider>
      );

      expect(screen.getByTestId('has-context')).toHaveTextContent('true');
      expect(screen.getByTestId('phase')).toHaveTextContent('idle');
    });
  });

  // ===========================================================================
  // Integration Tests
  // ===========================================================================

  describe('integration', () => {
    it('should propagate state changes to all consumers', async () => {
      let context1: ScanContextValue | null = null;
      let context2: ScanContextValue | null = null;

      const Consumer1 = () => {
        context1 = useScan();
        return <span data-testid="c1-phase">{context1.state.phase}</span>;
      };

      const Consumer2 = () => {
        context2 = useScan();
        return <span data-testid="c2-phase">{context2.state.phase}</span>;
      };

      render(
        <ScanProvider>
          <Consumer1 />
          <Consumer2 />
        </ScanProvider>
      );

      // Both consumers see same initial state
      expect(screen.getByTestId('c1-phase')).toHaveTextContent('idle');
      expect(screen.getByTestId('c2-phase')).toHaveTextContent('idle');

      // Dispatch from one consumer
      act(() => {
        context1!.startSingleScan('user-123');
      });

      // Both consumers should update
      await waitFor(() => {
        expect(screen.getByTestId('c1-phase')).toHaveTextContent('capturing');
        expect(screen.getByTestId('c2-phase')).toHaveTextContent('capturing');
      });
    });

    it('should handle rapid action dispatches', async () => {
      let context: ScanContextValue | null = null;

      render(
        <ScanProvider>
          <ScanActionDispatcher
            onContextReady={(ctx) => {
              context = ctx;
            }}
          />
          <ScanStateDisplay />
        </ScanProvider>
      );

      // Rapid sequence of actions
      act(() => {
        context!.startSingleScan('user-123');
      });

      await waitFor(() => {
        expect(screen.getByTestId('phase')).toHaveTextContent('capturing');
      });

      act(() => {
        context!.addImage('image-1');
        context!.addImage('image-2');
        context!.addImage('image-3');
      });

      await waitFor(() => {
        expect(screen.getByTestId('image-count')).toHaveTextContent('3');
      });

      // Cancel should reset
      act(() => {
        context!.cancel();
      });

      await waitFor(() => {
        expect(screen.getByTestId('phase')).toHaveTextContent('idle');
        expect(screen.getByTestId('image-count')).toHaveTextContent('0');
      });
    });

    it('should expose all computed values correctly', async () => {
      let context: ScanContextValue | null = null;

      render(
        <ScanProvider>
          <ScanActionDispatcher
            onContextReady={(ctx) => {
              context = ctx;
            }}
          />
        </ScanProvider>
      );

      // Initial computed values
      expect(context!.isIdle).toBe(true);
      expect(context!.isProcessing).toBe(false);
      expect(context!.hasActiveRequest).toBe(false);
      expect(context!.hasError).toBe(false);
      expect(context!.hasDialog).toBe(false);
      expect(context!.canNavigateFreely).toBe(true);
      expect(context!.currentView).toBe('none');

      // After starting a scan
      act(() => {
        context!.startSingleScan('user-123');
      });

      await waitFor(() => {
        expect(context!.isIdle).toBe(false);
        expect(context!.hasActiveRequest).toBe(true);
        expect(context!.currentView).toBe('single-capture');
      });
    });
  });

  // ===========================================================================
  // Action Wrapper Tests
  // ===========================================================================

  describe('action wrappers', () => {
    it('startSingleScan should dispatch START_SINGLE', async () => {
      const { result } = renderHook(() => useScan(), { wrapper: TestWrapper });

      act(() => {
        result.current.startSingleScan('user-123');
      });

      await waitFor(() => {
        expect(result.current.state.phase).toBe('capturing');
        expect(result.current.state.mode).toBe('single');
        expect(result.current.state.userId).toBe('user-123');
      });
    });

    it('startBatchScan should dispatch START_BATCH', async () => {
      const { result } = renderHook(() => useScan(), { wrapper: TestWrapper });

      act(() => {
        result.current.startBatchScan('user-456');
      });

      await waitFor(() => {
        expect(result.current.state.phase).toBe('capturing');
        expect(result.current.state.mode).toBe('batch');
        expect(result.current.state.userId).toBe('user-456');
        expect(result.current.state.batchProgress).not.toBeNull();
      });
    });

    it('showDialog should dispatch SHOW_DIALOG with type and data', async () => {
      const { result } = renderHook(() => useScan(), { wrapper: TestWrapper });

      act(() => {
        result.current.showDialog('currency_mismatch', { detected: 'USD', expected: 'CLP' });
      });

      await waitFor(() => {
        expect(result.current.state.activeDialog).not.toBeNull();
        expect(result.current.state.activeDialog?.type).toBe('currency_mismatch');
        expect(result.current.state.activeDialog?.data).toEqual({
          detected: 'USD',
          expected: 'CLP',
        });
        expect(result.current.hasDialog).toBe(true);
      });
    });

    it('resolveDialog should dispatch RESOLVE_DIALOG with type and result', async () => {
      const { result } = renderHook(() => useScan(), { wrapper: TestWrapper });

      // First show a dialog
      act(() => {
        result.current.showDialog('currency_mismatch', { detected: 'USD' });
      });

      await waitFor(() => {
        expect(result.current.state.activeDialog).not.toBeNull();
      });

      // Then resolve it
      act(() => {
        result.current.resolveDialog('currency_mismatch', { confirmed: true });
      });

      await waitFor(() => {
        expect(result.current.state.activeDialog).toBeNull();
        expect(result.current.hasDialog).toBe(false);
      });
    });

    it('dismissDialog should dispatch DISMISS_DIALOG', async () => {
      const { result } = renderHook(() => useScan(), { wrapper: TestWrapper });

      // First show a dialog
      act(() => {
        result.current.showDialog('cancel_warning', { creditSpent: true });
      });

      await waitFor(() => {
        expect(result.current.state.activeDialog).not.toBeNull();
        expect(result.current.state.activeDialog?.type).toBe('cancel_warning');
      });

      // Dismiss without resolving
      act(() => {
        result.current.dismissDialog();
      });

      await waitFor(() => {
        expect(result.current.state.activeDialog).toBeNull();
        expect(result.current.hasDialog).toBe(false);
      });
    });

    it('cancel should dispatch CANCEL', async () => {
      const { result } = renderHook(() => useScan(), { wrapper: TestWrapper });

      // Start a scan
      act(() => {
        result.current.startSingleScan('user-123');
      });

      await waitFor(() => {
        expect(result.current.state.phase).toBe('capturing');
      });

      // Cancel
      act(() => {
        result.current.cancel();
      });

      await waitFor(() => {
        expect(result.current.state.phase).toBe('idle');
        expect(result.current.isIdle).toBe(true);
      });
    });

    it('reset should dispatch RESET', async () => {
      const { result } = renderHook(() => useScan(), { wrapper: TestWrapper });

      // Start a scan and add image
      act(() => {
        result.current.startSingleScan('user-123');
        result.current.addImage('test-image');
      });

      await waitFor(() => {
        expect(result.current.state.images.length).toBe(1);
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      await waitFor(() => {
        expect(result.current.state.phase).toBe('idle');
        expect(result.current.state.images.length).toBe(0);
      });
    });
  });

  // ===========================================================================
  // Types Export Tests
  // ===========================================================================

  describe('type exports', () => {
    it('should export ScanContextValue type', () => {
      // This test verifies the type is exported and usable
      // If it compiles, the type is properly exported
      const contextValue: ScanContextValue | null = null;
      expect(contextValue).toBeNull(); // Just a runtime assertion
    });
  });
});
