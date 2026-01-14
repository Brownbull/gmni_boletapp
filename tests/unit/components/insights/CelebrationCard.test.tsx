/**
 * CelebrationCard Unit Tests
 *
 * Story 14.33d: Celebration & Personal Records Display
 * @see docs/sprint-artifacts/epic14/stories/story-14.33d-celebration-records-display.md
 *
 * Tests:
 * - AC1: Gradient background and styling
 * - AC2: Large emoji with bounce, title, subtitle, stats row
 * - AC5: Bounce animation respects prefers-reduced-motion
 * - AC6: Share button calls onShare
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CelebrationCard } from '../../../../src/components/insights/CelebrationCard';

// Simple translation mock
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    shareAchievement: 'Compartir logro',
    stats: 'Statistics',
  };
  return translations[key] || key;
};

describe('CelebrationCard', () => {
  const defaultProps = {
    emoji: '🌟',
    title: '¡Nuevo Record Personal!',
    subtitle: 'Tu semana con menos gastos en 3 meses',
    stats: [
      { value: '15,200', label: 'Esta semana' },
      { value: '-23%', label: 'vs promedio' },
    ],
    onShare: vi.fn(),
    theme: 'light',
    t: mockT,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders celebration emoji', () => {
      render(<CelebrationCard {...defaultProps} />);

      expect(screen.getByText('🌟')).toBeInTheDocument();
    });

    it('renders title', () => {
      render(<CelebrationCard {...defaultProps} />);

      expect(screen.getByText('¡Nuevo Record Personal!')).toBeInTheDocument();
    });

    it('renders subtitle', () => {
      render(<CelebrationCard {...defaultProps} />);

      expect(screen.getByText('Tu semana con menos gastos en 3 meses')).toBeInTheDocument();
    });

    it('renders stats row with values and labels', () => {
      render(<CelebrationCard {...defaultProps} />);

      expect(screen.getByText('15,200')).toBeInTheDocument();
      expect(screen.getByText('Esta semana')).toBeInTheDocument();
      expect(screen.getByText('-23%')).toBeInTheDocument();
      expect(screen.getByText('vs promedio')).toBeInTheDocument();
    });

    it('renders share button', () => {
      render(<CelebrationCard {...defaultProps} />);

      const shareButton = screen.getByRole('button', { name: /compartir logro/i });
      expect(shareButton).toBeInTheDocument();
    });

    it('renders correctly with empty stats array', () => {
      render(<CelebrationCard {...defaultProps} stats={[]} />);

      expect(screen.getByText('🌟')).toBeInTheDocument();
      expect(screen.getByText('¡Nuevo Record Personal!')).toBeInTheDocument();
    });
  });

  describe('Share button', () => {
    it('calls onShare when share button is clicked', () => {
      const onShare = vi.fn();
      render(<CelebrationCard {...defaultProps} onShare={onShare} />);

      fireEvent.click(screen.getByRole('button', { name: /compartir logro/i }));
      expect(onShare).toHaveBeenCalledTimes(1);
    });
  });

  describe('Styling', () => {
    it('applies gradient background', () => {
      const { container } = render(<CelebrationCard {...defaultProps} />);

      const card = container.querySelector('[role="region"]');
      expect(card).toHaveStyle({
        background: 'linear-gradient(135deg, var(--primary-light, #93c5fd), #dbeafe)',
      });
    });

    it('has correct border styling', () => {
      const { container } = render(<CelebrationCard {...defaultProps} />);

      const card = container.querySelector('[role="region"]');
      expect(card).toHaveStyle({
        border: '1px solid var(--primary)',
      });
    });
  });

  describe('Accessibility', () => {
    it('has region role with aria-label', () => {
      render(<CelebrationCard {...defaultProps} />);

      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-label', '¡Nuevo Record Personal!');
    });

    it('share button has aria-label', () => {
      render(<CelebrationCard {...defaultProps} />);

      const shareButton = screen.getByRole('button', { name: /compartir logro/i });
      expect(shareButton).toBeInTheDocument();
    });

    it('stats row has list semantics', () => {
      render(<CelebrationCard {...defaultProps} />);

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
    });
  });

  describe('Animation CSS', () => {
    it('includes bounce animation styles', () => {
      const { container } = render(<CelebrationCard {...defaultProps} />);

      const styleTag = container.querySelector('style');
      expect(styleTag?.textContent).toContain('@keyframes celebration-bounce');
    });

    it('includes reduced motion media query', () => {
      const { container } = render(<CelebrationCard {...defaultProps} />);

      const styleTag = container.querySelector('style');
      expect(styleTag?.textContent).toContain('@media (prefers-reduced-motion: reduce)');
    });

    it('emoji has celebration-emoji class', () => {
      const { container } = render(<CelebrationCard {...defaultProps} />);

      const emoji = container.querySelector('.celebration-emoji');
      expect(emoji).toBeInTheDocument();
    });
  });
});
