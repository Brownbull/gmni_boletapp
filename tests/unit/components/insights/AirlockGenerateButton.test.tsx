/**
 * AirlockGenerateButton Component Unit Tests
 *
 * Story 14.33c.1: Airlock Generation & Persistence
 *
 * Acceptance Criteria Coverage:
 * - AC #2: Generate Airlock Button shows credit cost and proper states
 * - AC #3: Credit integration with insufficient credits warning
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AirlockGenerateButton } from '@features/insights/components/AirlockGenerateButton';

// ============================================================================
// Test Helpers
// ============================================================================

const mockT = (key: string) => {
  const translations: Record<string, string> = {
    generateAirlock: 'Generate Insight',
    generatingAirlock: 'Analyzing...',
    insufficientCredits: 'Insufficient Credits',
    needMoreCreditsMessage: 'You need more credits',
    understood: 'Understood',
    buyMoreCredits: 'Buy more',
    comingSoon: 'Coming Soon',
    airlockCreditCost: 'credit',
    credit: 'credit',
    credits: 'credits',
    available: 'available',
  };
  return translations[key] || key;
};

// ============================================================================
// Default State Tests (AC2)
// ============================================================================

describe('AirlockGenerateButton - Default State', () => {
  it('renders with generate label when credits available', () => {
    render(
      <AirlockGenerateButton
        canGenerate={true}
        isGenerating={false}
        credits={5}
        onGenerate={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    expect(screen.getByText('Generate Insight')).toBeInTheDocument();
    expect(screen.getByText('5 credits available')).toBeInTheDocument();
  });

  it('shows credit cost indicator', () => {
    render(
      <AirlockGenerateButton
        canGenerate={true}
        isGenerating={false}
        credits={10}
        onGenerate={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    // Credit cost should be visible on button
    expect(screen.getByText(/1 credit/)).toBeInTheDocument();
  });

  it('displays singular credit when only 1 available', () => {
    render(
      <AirlockGenerateButton
        canGenerate={true}
        isGenerating={false}
        credits={1}
        onGenerate={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    expect(screen.getByText('1 credit available')).toBeInTheDocument();
  });
});

// ============================================================================
// Loading State Tests (AC2)
// ============================================================================

describe('AirlockGenerateButton - Loading State', () => {
  it('shows loading state while generating', () => {
    render(
      <AirlockGenerateButton
        canGenerate={true}
        isGenerating={true}
        credits={5}
        onGenerate={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    expect(screen.getByText('Analyzing...')).toBeInTheDocument();
  });

  it('disables button while generating', () => {
    render(
      <AirlockGenerateButton
        canGenerate={true}
        isGenerating={true}
        credits={5}
        onGenerate={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    const button = screen.getByRole('button', { name: /analyzing/i });
    expect(button).toBeDisabled();
  });
});

// ============================================================================
// Disabled State Tests (AC2, AC3)
// ============================================================================

describe('AirlockGenerateButton - Disabled State', () => {
  it('shows disabled state when canGenerate is false', () => {
    render(
      <AirlockGenerateButton
        canGenerate={false}
        isGenerating={false}
        credits={0}
        onGenerate={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    // Button should indicate insufficient credits
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows 0 credits available', () => {
    render(
      <AirlockGenerateButton
        canGenerate={false}
        isGenerating={false}
        credits={0}
        onGenerate={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    expect(screen.getByText('0 credits available')).toBeInTheDocument();
  });
});

// ============================================================================
// Interaction Tests
// ============================================================================

describe('AirlockGenerateButton - Interactions', () => {
  it('calls onGenerate when clicked with credits available', async () => {
    const onGenerate = vi.fn().mockResolvedValue(undefined);

    render(
      <AirlockGenerateButton
        canGenerate={true}
        isGenerating={false}
        credits={5}
        onGenerate={onGenerate}
        t={mockT}
        theme="light"
      />
    );

    const button = screen.getByRole('button', { name: /generate/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(onGenerate).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call onGenerate while already generating', async () => {
    const onGenerate = vi.fn();

    render(
      <AirlockGenerateButton
        canGenerate={true}
        isGenerating={true}
        credits={5}
        onGenerate={onGenerate}
        t={mockT}
        theme="light"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(onGenerate).not.toHaveBeenCalled();
  });

  it('AC3: shows warning dialog when clicking without credits', async () => {
    const onGenerate = vi.fn();

    render(
      <AirlockGenerateButton
        canGenerate={false}
        isGenerating={false}
        credits={0}
        onGenerate={onGenerate}
        t={mockT}
        theme="light"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Warning dialog should appear
    await waitFor(() => {
      expect(screen.getByText('Insufficient Credits')).toBeInTheDocument();
      expect(screen.getByText('You need more credits')).toBeInTheDocument();
    });

    // onGenerate should NOT be called
    expect(onGenerate).not.toHaveBeenCalled();
  });

  it('AC3: dismisses warning dialog on button click', async () => {
    render(
      <AirlockGenerateButton
        canGenerate={false}
        isGenerating={false}
        credits={0}
        onGenerate={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    // Trigger warning
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Wait for dialog
    await waitFor(() => {
      expect(screen.getByText('Insufficient Credits')).toBeInTheDocument();
    });

    // Click understood button
    const understoodButton = screen.getByRole('button', { name: /understood/i });
    fireEvent.click(understoodButton);

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByText('Insufficient Credits')).not.toBeInTheDocument();
    });
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('AirlockGenerateButton - Accessibility', () => {
  it('has proper aria-label when enabled', () => {
    render(
      <AirlockGenerateButton
        canGenerate={true}
        isGenerating={false}
        credits={5}
        onGenerate={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button.getAttribute('aria-label')).toContain('Generate Insight');
  });

  it('has proper aria-label when disabled', () => {
    render(
      <AirlockGenerateButton
        canGenerate={false}
        isGenerating={false}
        credits={0}
        onGenerate={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-label')).toContain('Insufficient');
  });

  it('warning dialog has proper ARIA attributes', async () => {
    render(
      <AirlockGenerateButton
        canGenerate={false}
        isGenerating={false}
        credits={0}
        onGenerate={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });
  });
});

// ============================================================================
// Theme Tests
// ============================================================================

describe('AirlockGenerateButton - Themes', () => {
  it('renders correctly in light theme', () => {
    const { container } = render(
      <AirlockGenerateButton
        canGenerate={true}
        isGenerating={false}
        credits={5}
        onGenerate={vi.fn()}
        t={mockT}
        theme="light"
      />
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders correctly in dark theme', () => {
    const { container } = render(
      <AirlockGenerateButton
        canGenerate={true}
        isGenerating={false}
        credits={5}
        onGenerate={vi.fn()}
        t={mockT}
        theme="dark"
      />
    );

    expect(container.firstChild).toBeInTheDocument();
  });
});
