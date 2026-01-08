/**
 * React Testing Library Custom Utilities
 *
 * Story 14.29: React Query Migration
 *
 * This file provides custom render functions and utilities for testing React components.
 * It wraps components with necessary providers (e.g., QueryClientProvider, etc.)
 */

import { render, RenderOptions, renderHook, RenderHookOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
 */
function createWrapper(queryClient: QueryClient) {
  return function AllTheProviders({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
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
