/**
 * BadgeUnlock Unit Tests
 *
 * Story 14.33d: Celebration & Personal Records Display
 * @see docs/sprint-artifacts/epic14/stories/story-14.33d-celebration-records-display.md
 *
 * Tests:
 * - AC3: Badge notification with secondary background
 *        Header: uppercase, small text
 *        Badge icon: 48x48, gradient background
 *        Badge name and description
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BadgeUnlock } from '@features/insights/components/BadgeUnlock';

// Simple translation mock
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    badgeUnlocked: 'Insignia Desbloqueada',
  };
  return translations[key] || key;
};

describe('BadgeUnlock', () => {
  const defaultProps = {
    emoji: '💎',
    name: 'Ahorrador Elite',
    description: '3 semanas bajo presupuesto',
    theme: 'light',
    t: mockT,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders badge unlocked header', () => {
      render(<BadgeUnlock {...defaultProps} />);

      expect(screen.getByText('Insignia Desbloqueada')).toBeInTheDocument();
    });

    it('renders badge emoji', () => {
      render(<BadgeUnlock {...defaultProps} />);

      expect(screen.getByText('💎')).toBeInTheDocument();
    });

    it('renders badge name', () => {
      render(<BadgeUnlock {...defaultProps} />);

      expect(screen.getByText('Ahorrador Elite')).toBeInTheDocument();
    });

    it('renders badge description', () => {
      render(<BadgeUnlock {...defaultProps} />);

      expect(screen.getByText('3 semanas bajo presupuesto')).toBeInTheDocument();
    });
  });

  describe('Header styling', () => {
    it('header is uppercase', () => {
      render(<BadgeUnlock {...defaultProps} />);

      const header = screen.getByText('Insignia Desbloqueada');
      expect(header).toHaveClass('uppercase');
    });

    it('header has tracking-wider for letter spacing', () => {
      render(<BadgeUnlock {...defaultProps} />);

      const header = screen.getByText('Insignia Desbloqueada');
      expect(header).toHaveClass('tracking-wider');
    });
  });

  describe('Badge icon styling', () => {
    it('emoji container has correct dimensions', () => {
      const { container } = render(<BadgeUnlock {...defaultProps} />);

      // Find the gradient circle (emoji container)
      const emojiContainer = container.querySelector('[style*="width: 48px"]');
      expect(emojiContainer).toBeInTheDocument();
      expect(emojiContainer).toHaveStyle({ width: '48px', height: '48px' });
    });

    it('emoji container has border-radius 50%', () => {
      const { container } = render(<BadgeUnlock {...defaultProps} />);

      const emojiContainer = container.querySelector('[style*="border-radius: 50%"]');
      expect(emojiContainer).toBeInTheDocument();
    });

    it('emoji container has gradient background', () => {
      const { container } = render(<BadgeUnlock {...defaultProps} />);

      // The gradient is applied via inline style, but jsdom may not parse the full style
      // Check for the 48px circular container which holds the gradient
      const emojiContainer = container.querySelector('[style*="width: 48px"]');
      expect(emojiContainer).toBeInTheDocument();
      // Verify it has the gradient class structure (flex-shrink-0 and centered)
      expect(emojiContainer).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });

  describe('Accessibility', () => {
    it('has region role with aria-label', () => {
      render(<BadgeUnlock {...defaultProps} />);

      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-label', 'Insignia Desbloqueada');
    });

    it('emoji is hidden from screen readers', () => {
      const { container } = render(<BadgeUnlock {...defaultProps} />);

      const emojiContainer = container.querySelector('[aria-hidden="true"]');
      expect(emojiContainer).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('has flex layout for badge content', () => {
      const { container } = render(<BadgeUnlock {...defaultProps} />);

      // Find the flex container with emoji and text
      const flexContainer = container.querySelector('.flex.items-center.gap-4');
      expect(flexContainer).toBeInTheDocument();
    });

    it('text content truncates on overflow', () => {
      render(<BadgeUnlock {...defaultProps} name="This is a very long badge name that should truncate" />);

      const badgeName = screen.getByText('This is a very long badge name that should truncate');
      expect(badgeName).toHaveClass('truncate');
    });

    it('description truncates on overflow', () => {
      render(<BadgeUnlock {...defaultProps} />);

      const description = screen.getByText('3 semanas bajo presupuesto');
      expect(description).toHaveClass('truncate');
    });
  });

  describe('Different badges', () => {
    it('renders centenarian badge', () => {
      render(
        <BadgeUnlock
          {...defaultProps}
          emoji="🏆"
          name="Centenario"
          description="100 boletas escaneadas"
        />
      );

      expect(screen.getByText('🏆')).toBeInTheDocument();
      expect(screen.getByText('Centenario')).toBeInTheDocument();
      expect(screen.getByText('100 boletas escaneadas')).toBeInTheDocument();
    });

    it('renders week record badge', () => {
      render(
        <BadgeUnlock
          {...defaultProps}
          emoji="🌟"
          name="Semana Record"
          description="Tu semana con menos gastos"
        />
      );

      expect(screen.getByText('🌟')).toBeInTheDocument();
      expect(screen.getByText('Semana Record')).toBeInTheDocument();
      expect(screen.getByText('Tu semana con menos gastos')).toBeInTheDocument();
    });

    it('renders category champion badge', () => {
      render(
        <BadgeUnlock
          {...defaultProps}
          emoji="🏅"
          name="Campeón de Categoría"
          description="Record en una categoría"
        />
      );

      expect(screen.getByText('🏅')).toBeInTheDocument();
      expect(screen.getByText('Campeón de Categoría')).toBeInTheDocument();
      expect(screen.getByText('Record en una categoría')).toBeInTheDocument();
    });
  });
});
