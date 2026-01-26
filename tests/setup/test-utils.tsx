/**
 * React Testing Library Custom Utilities
 *
 * Story 14.29: React Query Migration
 * Story 14d.4b: ScanContext mock utilities
 *
 * This file provides custom render functions and utilities for testing React components.
 * It wraps components with necessary providers (e.g., QueryClientProvider, ScanProvider, etc.)
 */

import { render, RenderOptions, renderHook, RenderHookOptions } from '@testing-library/react';
import React, { ReactElement, ReactNode, createContext, useContext } from 'react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
// Story 14c-refactor.27: ViewHandlersContext for view tests
import { ViewHandlersProvider, type ViewHandlersContextValue } from '@/contexts/ViewHandlersContext';
import type { ScanContextValue } from '@/contexts/ScanContext';
import type { ScanState, ScanDialogType } from '@/types/scanStateMachine';
import { DIALOG_TYPES } from '@/types/scanStateMachine';

/**
 * Creates a fresh QueryClient for each test to ensure isolation.
 * Uses test-optimized settings (no retries, no gcTime).
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// =============================================================================
// Story 14c-refactor.27: ViewHandlersContext Mock Utilities
// =============================================================================

/**
 * Creates mock view handlers for testing.
 * All handlers are vi.fn() by default for easy assertion.
 */
export function createMockViewHandlers(): {
  transaction: ViewHandlersContextValue['transaction'];
  scan: ViewHandlersContextValue['scan'];
  navigation: ViewHandlersContextValue['navigation'];
  dialog: ViewHandlersContextValue['dialog'];
} {
  return {
    transaction: {
      saveTransaction: vi.fn().mockResolvedValue(undefined),
      deleteTransaction: vi.fn().mockResolvedValue(undefined),
      wipeDB: vi.fn().mockResolvedValue(undefined),
      handleExportData: vi.fn().mockResolvedValue(undefined),
      createDefaultTransaction: vi.fn().mockReturnValue({
        merchant: '',
        date: new Date().toISOString().split('T')[0],
        total: 0,
        category: 'Supermarket',
        items: [],
        country: '',
        city: '',
        currency: 'CLP',
      }),
    },
    scan: {
      isQuickSaveActive: false,
      handlePhotoSelect: vi.fn(),
      handleProcessScan: vi.fn(),
      handleQuickSaveCard: vi.fn(),
      handleQuickSaveSubmit: vi.fn().mockResolvedValue(undefined),
      handleQuickSaveDismiss: vi.fn(),
      handleCurrencyMismatch: vi.fn(),
      handleTotalMismatch: vi.fn(),
      handleScanOverlay: vi.fn(),
      openScanOverlay: vi.fn(),
      closeScanOverlay: vi.fn(),
    },
    navigation: {
      navigateToView: vi.fn(),
      navigateBack: vi.fn(),
      handleNavigateToHistory: vi.fn(),
    },
    dialog: {
      toastMessage: null,
      setToastMessage: vi.fn(),
      showToast: vi.fn(),
      showCreditInfoModal: false,
      setShowCreditInfoModal: vi.fn(),
      openCreditInfoModal: vi.fn(),
      closeCreditInfoModal: vi.fn(),
      showConflictDialog: false,
      setShowConflictDialog: vi.fn(),
      conflictDialogData: null,
      setConflictDialogData: vi.fn(),
      handleConflictClose: vi.fn(),
      handleConflictViewCurrent: vi.fn(),
      handleConflictDiscard: vi.fn(),
      openConflictDialog: vi.fn(),
    },
  };
}

// Default mock handlers for the provider
// Export so tests can access them for assertions and reset in beforeEach
export const mockViewHandlers = createMockViewHandlers();

/**
 * Story 14c-refactor.36: Helper to override navigation handler for testing fallback behavior.
 * Use this when testing DashboardView inline pagination (which only renders when
 * handleNavigateToHistory is undefined/falsy).
 *
 * @example
 * ```tsx
 * beforeEach(() => {
 *   disableNavigationHandler();
 * });
 * afterEach(() => {
 *   restoreNavigationHandler();
 * });
 * ```
 */
export function disableNavigationHandler(): void {
  (mockViewHandlers.navigation as { handleNavigateToHistory: unknown }).handleNavigateToHistory = undefined;
}

/**
 * Story 14c-refactor.36: Restore navigation handler after testing fallback behavior.
 */
export function restoreNavigationHandler(): void {
  mockViewHandlers.navigation.handleNavigateToHistory = vi.fn();
}

/**
 * Custom render function that wraps components with providers
 *
 * Usage:
 *   import { render } from '../setup/test-utils';
 *   render(<MyComponent />);
 */

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

/**
 * Wrapper component that provides all necessary context providers
 * Story 14c-refactor.9: Added AuthProvider wrapping
 * Story 14c-refactor.27: Added ViewHandlersProvider wrapping for view tests
 */
function createWrapper(queryClient: QueryClient) {
  return function AllTheProviders({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ViewHandlersProvider
            transaction={mockViewHandlers.transaction}
            scan={mockViewHandlers.scan}
            navigation={mockViewHandlers.navigation}
            dialog={mockViewHandlers.dialog}
          >
            {children}
          </ViewHandlersProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
  };
}

/**
 * Custom render function with providers
 */
function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions,
) {
  const queryClient = options?.queryClient ?? createTestQueryClient();
  return render(ui, { wrapper: createWrapper(queryClient), ...options });
}

/**
 * Custom renderHook function with QueryClientProvider
 *
 * Story 14.29: Required for testing hooks that use React Query
 *
 * Usage:
 *   import { renderHookWithClient } from '../setup/test-utils';
 *   const { result } = renderHookWithClient(() => useMyHook());
 */
interface CustomRenderHookOptions<TProps> extends Omit<RenderHookOptions<TProps>, 'wrapper'> {
  queryClient?: QueryClient;
}

function customRenderHook<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options?: CustomRenderHookOptions<TProps>,
) {
  const queryClient = options?.queryClient ?? createTestQueryClient();
  return renderHook(hook, {
    wrapper: createWrapper(queryClient),
    ...options
  });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Override render with custom render
export { customRender as render };

// Export custom renderHook
export { customRenderHook as renderHookWithClient };

// Export createTestQueryClient for custom test setups
export { createTestQueryClient };

// =============================================================================
// Story 14d.4b: ScanContext Mock Utilities
// =============================================================================

/**
 * Initial/default scan state for testing
 */
export const initialMockScanState: ScanState = {
  phase: 'idle',
  mode: 'single',
  requestId: null,
  userId: null,
  startedAt: null,
  images: [],
  results: [],
  activeResultIndex: 0,
  creditStatus: 'none',
  creditType: null,
  creditsCount: 0,
  activeDialog: null,
  error: null,
  batchProgress: null,
  storeType: null,
  currency: null,
};

/**
 * Creates a mock ScanContext value with sensible defaults.
 * Override specific values as needed for your test scenario.
 *
 * @example
 * ```tsx
 * const mockContext = createMockScanContext({
 *   state: { ...initialMockScanState, phase: 'scanning' },
 *   isProcessing: true,
 * });
 * ```
 */
export function createMockScanContext(
  overrides: Partial<ScanContextValue> = {}
): ScanContextValue {
  const state = overrides.state ?? initialMockScanState;

  return {
    // State
    state,

    // Computed values (derived from state unless overridden)
    hasActiveRequest: overrides.hasActiveRequest ?? state.phase !== 'idle',
    isProcessing: overrides.isProcessing ?? state.phase === 'scanning',
    isIdle: overrides.isIdle ?? state.phase === 'idle',
    hasError: overrides.hasError ?? state.phase === 'error',
    hasDialog: overrides.hasDialog ?? state.activeDialog !== null,
    isBlocking: overrides.isBlocking ?? (state.phase !== 'idle' && state.activeDialog !== null),
    creditSpent: overrides.creditSpent ?? (state.creditStatus === 'confirmed'),
    canNavigateFreely: overrides.canNavigateFreely ?? (state.phase === 'idle' || (state.activeDialog === null && state.phase !== 'scanning')),
    canSave: overrides.canSave ?? (state.phase === 'reviewing' && state.results.length > 0),
    currentView: overrides.currentView ?? 'none',
    imageCount: overrides.imageCount ?? state.images.length,
    resultCount: overrides.resultCount ?? state.results.length,

    // Action wrappers (all no-op by default, can be mocked with vi.fn())
    startSingleScan: overrides.startSingleScan ?? (() => {}),
    startBatchScan: overrides.startBatchScan ?? (() => {}),
    startStatementScan: overrides.startStatementScan ?? (() => {}),
    addImage: overrides.addImage ?? (() => {}),
    removeImage: overrides.removeImage ?? (() => {}),
    setImages: overrides.setImages ?? (() => {}),
    setStoreType: overrides.setStoreType ?? (() => {}),
    setCurrency: overrides.setCurrency ?? (() => {}),
    processStart: overrides.processStart ?? (() => {}),
    processSuccess: overrides.processSuccess ?? (() => {}),
    processError: overrides.processError ?? (() => {}),
    showDialog: overrides.showDialog ?? (() => {}),
    resolveDialog: overrides.resolveDialog ?? (() => {}),
    dismissDialog: overrides.dismissDialog ?? (() => {}),
    updateResult: overrides.updateResult ?? (() => {}),
    setActiveResult: overrides.setActiveResult ?? (() => {}),
    saveStart: overrides.saveStart ?? (() => {}),
    saveSuccess: overrides.saveSuccess ?? (() => {}),
    saveError: overrides.saveError ?? (() => {}),
    batchItemStart: overrides.batchItemStart ?? (() => {}),
    batchItemSuccess: overrides.batchItemSuccess ?? (() => {}),
    batchItemError: overrides.batchItemError ?? (() => {}),
    batchComplete: overrides.batchComplete ?? (() => {}),
    cancel: overrides.cancel ?? (() => {}),
    reset: overrides.reset ?? (() => {}),
    restoreState: overrides.restoreState ?? (() => {}),
    refundCredit: overrides.refundCredit ?? (() => {}),

    // Raw dispatch
    dispatch: overrides.dispatch ?? (() => {}),
  };
}

/**
 * Mock ScanContext for testing.
 * Use MockScanProvider to wrap components that use useScan() or useScanOptional().
 */
const MockScanContext = createContext<ScanContextValue | null>(null);

/**
 * Mock ScanProvider for testing components that use ScanContext.
 *
 * @example
 * ```tsx
 * render(
 *   <MockScanProvider value={createMockScanContext({ isProcessing: true })}>
 *     <MyComponent />
 *   </MockScanProvider>
 * );
 * ```
 */
export function MockScanProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ScanContextValue;
}) {
  return (
    <MockScanContext.Provider value={value}>
      {children}
    </MockScanContext.Provider>
  );
}

/**
 * Hook to access mock scan context in tests.
 * Throws if used outside MockScanProvider (same behavior as real useScan).
 */
export function useMockScan(): ScanContextValue {
  const context = useContext(MockScanContext);
  if (!context) {
    throw new Error('useMockScan must be used within a MockScanProvider');
  }
  return context;
}

/**
 * Hook to optionally access mock scan context in tests.
 * Returns null if outside MockScanProvider (same behavior as real useScanOptional).
 */
export function useMockScanOptional(): ScanContextValue | null {
  return useContext(MockScanContext);
}

/**
 * Helper to create a mock dialog state for testing.
 *
 * @example
 * ```tsx
 * const dialogState = createMockDialogState('currency_mismatch', {
 *   detectedCurrency: 'EUR',
 *   pendingTransaction: mockTransaction,
 * });
 * ```
 */
export function createMockDialogState<T = unknown>(
  type: ScanDialogType,
  data: T
): { type: ScanDialogType; data: T } {
  return { type, data };
}

// Re-export DIALOG_TYPES for convenience in tests
export { DIALOG_TYPES };

// =============================================================================
// Story 14e-9b: Zustand Scan Store Mock Utilities
// =============================================================================

import { useScanStore, initialScanState } from '@features/scan/store/useScanStore';

/**
 * Reset the Zustand scan store to initial state.
 * Call this in beforeEach() to ensure test isolation.
 *
 * Note: Uses merge mode (not replace) to preserve action functions.
 *
 * @example
 * ```tsx
 * beforeEach(() => {
 *   resetScanStore();
 * });
 * ```
 */
export function resetScanStore(): void {
  // Use merge mode (false) to preserve actions, only reset state properties
  useScanStore.setState(initialScanState, false);
}

/**
 * Set the Zustand scan store to a specific state.
 * Useful for testing components with specific state requirements.
 *
 * Note: Uses merge mode (not replace) to preserve action functions.
 *
 * @example
 * ```tsx
 * beforeEach(() => {
 *   setScanStoreState({
 *     phase: 'reviewing',
 *     results: [mockTransaction],
 *     activeDialog: { type: 'scan_complete', data: { transaction: mockTransaction } },
 *   });
 * });
 * ```
 */
export function setScanStoreState(state: Partial<ScanState>): void {
  // First reset to initial state, then apply overrides (both with merge mode to preserve actions)
  useScanStore.setState({ ...initialScanState, ...state }, false);
}

/**
 * Get the current Zustand scan store state.
 * Useful for assertions in tests.
 *
 * @example
 * ```tsx
 * expect(getScanStoreState().phase).toBe('reviewing');
 * ```
 */
export function getScanStoreState(): ScanState {
  return useScanStore.getState();
}

/**
 * Call a Zustand scan store action directly.
 * Useful for simulating user actions in tests.
 *
 * @example
 * ```tsx
 * callScanStoreAction('startSingle', 'test-user-id');
 * expect(getScanStoreState().phase).toBe('capturing');
 * ```
 */
export function callScanStoreAction<K extends keyof ReturnType<typeof useScanStore.getState>>(
  actionName: K,
  ...args: ReturnType<typeof useScanStore.getState>[K] extends (...args: infer P) => unknown ? P : never
): void {
  const store = useScanStore.getState();
  const action = store[actionName];
  if (typeof action === 'function') {
    (action as (...args: unknown[]) => void)(...args);
  }
}

// Re-export initialScanState for convenience in tests
export { initialScanState };

// Re-export the store hook for direct access in tests
export { useScanStore };
