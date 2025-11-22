/**
 * React Testing Library Smoke Test
 *
 * This test verifies that React Testing Library is configured correctly
 * and can render React components.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../setup/test-utils';

// Simple test component
function TestComponent() {
  return (
    <div>
      <h1>Hello, World!</h1>
      <p>This is a test component</p>
      <button>Click me</button>
    </div>
  );
}

describe('React Testing Library Smoke Test', () => {
  it('should render a simple component', () => {
    render(<TestComponent />);

    // Verify elements are rendered
    expect(screen.getByText('Hello, World!')).toBeInTheDocument();
    expect(screen.getByText('This is a test component')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('should find elements by role', () => {
    render(<TestComponent />);

    const heading = screen.getByRole('heading', { name: 'Hello, World!' });
    const button = screen.getByRole('button', { name: 'Click me' });

    expect(heading).toBeInTheDocument();
    expect(button).toBeInTheDocument();
  });

  it('should support custom matchers from jest-dom', () => {
    render(<TestComponent />);

    const button = screen.getByRole('button');

    // Testing Library matchers from @testing-library/jest-dom
    expect(button).toBeVisible();
    expect(button).toHaveTextContent('Click me');
  });
});
