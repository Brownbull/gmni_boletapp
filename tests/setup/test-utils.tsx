/**
 * React Testing Library Custom Utilities
 *
 * This file provides custom render functions and utilities for testing React components.
 * It wraps components with necessary providers (e.g., Router, Context, etc.)
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

/**
 * Custom render function that wraps components with providers
 *
 * Usage:
 *   import { render } from '../setup/test-utils';
 *   render(<MyComponent />);
 */

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add any custom options here if needed in the future
  // For example: initialRoute?: string;
}

/**
 * Wrapper component that provides all necessary context providers
 */
function AllTheProviders({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Add context providers here as needed, for example:
        <AuthProvider>
          <RouterProvider>
            {children}
          </RouterProvider>
        </AuthProvider>
      */}
      {children}
    </>
  );
}

/**
 * Custom render function with providers
 */
function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions,
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Override render with custom render
export { customRender as render };
