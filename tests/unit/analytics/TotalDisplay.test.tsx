/**
 * TotalDisplay Component Unit Tests
 *
 * Tests for the total amount display component.
 *
 * Story 7.4 - Chart Mode Toggle & Registry
 * AC #9: Total amount display tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TotalDisplay } from '@features/analytics/components/TotalDisplay';

// ============================================================================
// AC #9: Chart displays total amount
// ============================================================================

describe('TotalDisplay - AC #9: Total amount display', () => {
  it('renders formatted amount', () => {
    render(<TotalDisplay amount={150000} period="October 2024" currency="CLP" />);

    const amount = screen.getByTestId('total-amount');
    expect(amount).toBeInTheDocument();
    // CLP formatting: $150.000 (Chilean peso uses dot as thousands separator)
    expect(amount.textContent).toContain('150');
  });

  it('renders period label', () => {
    render(<TotalDisplay amount={150000} period="October 2024" currency="CLP" />);

    const period = screen.getByTestId('total-period');
    expect(period).toBeInTheDocument();
    expect(period).toHaveTextContent('October 2024');
  });

  it('renders with zero amount', () => {
    render(<TotalDisplay amount={0} period="November 2024" currency="CLP" />);

    const amount = screen.getByTestId('total-amount');
    expect(amount).toHaveTextContent('$0');
  });

  it('renders with large amount', () => {
    render(<TotalDisplay amount={9999999} period="Year 2024" currency="CLP" />);

    const amount = screen.getByTestId('total-amount');
    expect(amount.textContent).toContain('9');
  });
});

// ============================================================================
// Currency formatting tests
// ============================================================================

describe('TotalDisplay - Currency formatting', () => {
  it('formats CLP currency (Chilean pesos)', () => {
    render(<TotalDisplay amount={150000} period="Test" currency="CLP" />);

    const amount = screen.getByTestId('total-amount');
    // CLP uses $ symbol and no decimals
    expect(amount.textContent).toContain('$');
  });

  it('formats USD currency', () => {
    render(<TotalDisplay amount={1500} period="Test" currency="USD" />);

    const amount = screen.getByTestId('total-amount');
    expect(amount.textContent).toContain('$');
  });

  it('uses CLP as default currency', () => {
    render(<TotalDisplay amount={50000} period="Test" />);

    const amount = screen.getByTestId('total-amount');
    expect(amount.textContent).toContain('$');
  });

  it('handles NaN amount gracefully', () => {
    render(<TotalDisplay amount={NaN} period="Test" currency="CLP" />);

    const amount = screen.getByTestId('total-amount');
    // formatCurrency should handle NaN and return $0
    expect(amount.textContent).toContain('$0');
  });
});

// ============================================================================
// Theme support tests
// ============================================================================

describe('TotalDisplay - Theme support', () => {
  it('renders in light theme by default', () => {
    render(<TotalDisplay amount={100} period="Test" />);

    const amount = screen.getByTestId('total-amount');
    expect(amount).toHaveClass('text-slate-900');
  });

  it('renders in dark theme when specified', () => {
    render(<TotalDisplay amount={100} period="Test" theme="dark" />);

    const amount = screen.getByTestId('total-amount');
    expect(amount).toHaveClass('text-white');
  });

  it('period label has correct styling in light theme', () => {
    render(<TotalDisplay amount={100} period="Test" />);

    const period = screen.getByTestId('total-period');
    expect(period).toHaveClass('text-slate-500');
  });

  it('period label has correct styling in dark theme', () => {
    render(<TotalDisplay amount={100} period="Test" theme="dark" />);

    const period = screen.getByTestId('total-period');
    expect(period).toHaveClass('text-slate-400');
  });
});

// ============================================================================
// Styling tests
// ============================================================================

describe('TotalDisplay - Styling', () => {
  it('amount has text-3xl class', () => {
    render(<TotalDisplay amount={100} period="Test" />);

    const amount = screen.getByTestId('total-amount');
    expect(amount).toHaveClass('text-3xl');
  });

  it('amount has font-bold class', () => {
    render(<TotalDisplay amount={100} period="Test" />);

    const amount = screen.getByTestId('total-amount');
    expect(amount).toHaveClass('font-bold');
  });

  it('period has text-sm class', () => {
    render(<TotalDisplay amount={100} period="Test" />);

    const period = screen.getByTestId('total-period');
    expect(period).toHaveClass('text-sm');
  });

  it('container is centered', () => {
    const { container } = render(<TotalDisplay amount={100} period="Test" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('items-center');
    expect(wrapper).toHaveClass('text-center');
  });
});

// ============================================================================
// Period label variations
// ============================================================================

describe('TotalDisplay - Period labels', () => {
  it('displays year period', () => {
    render(<TotalDisplay amount={100} period="2024" />);

    expect(screen.getByTestId('total-period')).toHaveTextContent('2024');
  });

  it('displays quarter period', () => {
    render(<TotalDisplay amount={100} period="Q4 2024" />);

    expect(screen.getByTestId('total-period')).toHaveTextContent('Q4 2024');
  });

  it('displays month period', () => {
    render(<TotalDisplay amount={100} period="November 2024" />);

    expect(screen.getByTestId('total-period')).toHaveTextContent('November 2024');
  });

  it('displays week period', () => {
    render(<TotalDisplay amount={100} period="Oct 1-7, 2024" />);

    expect(screen.getByTestId('total-period')).toHaveTextContent('Oct 1-7, 2024');
  });

  it('displays day period', () => {
    render(<TotalDisplay amount={100} period="Oct 15, 2024" />);

    expect(screen.getByTestId('total-period')).toHaveTextContent('Oct 15, 2024');
  });
});
