/**
 * CelebrationView Unit Tests
 *
 * Story 14.33d: Celebration & Personal Records Display
 * @see docs/sprint-artifacts/epic14/stories/story-14.33d-celebration-records-display.md
 *
 * Note: CelebrationView is currently a placeholder component showing "Logros y Records"
 * (Coming Soon). These tests verify the placeholder behavior.
 *
 * When the full celebration system is implemented, these tests should be updated
 * to test the actual functionality (records fetching, confetti, share, etc.)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CelebrationView } from '../../../../src/components/insights/CelebrationView';

describe('CelebrationView', () => {
  const defaultProps = {
    onBack: vi.fn(),
    theme: 'light',
    t: (key: string) => key,
    db: {} as never,
    userId: 'user-123',
    appId: 'app-test',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Placeholder state', () => {
    it('renders the placeholder view', () => {
      render(<CelebrationView {...defaultProps} />);

      // Placeholder shows "Logros y Records" title
      expect(screen.getByText('Logros y Records')).toBeInTheDocument();
    });

    it('shows coming soon message', () => {
      render(<CelebrationView {...defaultProps} />);

      expect(screen.getByText('Próximamente disponible')).toBeInTheDocument();
    });

    it('displays trophy emoji', () => {
      render(<CelebrationView {...defaultProps} />);

      expect(screen.getByText('🏆')).toBeInTheDocument();
    });

    it('shows description text', () => {
      render(<CelebrationView {...defaultProps} />);

      expect(screen.getByText(/celebrar tus records personales/)).toBeInTheDocument();
    });
  });

  describe('Props handling', () => {
    it('accepts all required props without errors', () => {
      expect(() => render(<CelebrationView {...defaultProps} />)).not.toThrow();
    });

    it('renders with null userId', () => {
      expect(() => render(<CelebrationView {...defaultProps} userId={null} />)).not.toThrow();
    });

    it('renders with null db', () => {
      expect(() => render(<CelebrationView {...defaultProps} db={null} />)).not.toThrow();
    });
  });
});
