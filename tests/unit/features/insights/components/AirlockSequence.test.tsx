/**
 * AirlockSequence Unit Tests
 *
 * Story 14.33c: Airlock Sequence UI
 * @see docs/sprint-artifacts/epic14/stories/story-14.33c-airlock-sequence.md
 *
 * Tests:
 * - AC1: 3-step reveal UI (Curiosity → Brace → Reveal)
 * - AC2: Appropriate emoji animations for each step
 * - AC3: Progress dots showing current step
 * - AC4: "Maybe later" dismiss option on step 2
 * - AC5: Dynamic insight content on step 3
 * - AC6: Float animation with reduced motion support
 * - AC7: Recommendation box on reveal step
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';
import { AirlockSequence } from '@features/insights/components/AirlockSequence';
import { InsightRecord, InsightCategory } from '../../../../../src/types/insight';

// Mock Firebase Timestamp
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    Timestamp: {
      fromDate: (date: Date) => ({
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
      }),
    },
  };
});

// Translation mock
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    airlockCuriosityTitle: 'Hmm... something interesting',
    airlockCuriositySubtitle: 'We noticed something about your spending that you might want to know.',
    tellMeMore: 'Tell me more',
    airlockBraceTitle: "Don't worry, this is neutral",
    airlockBraceSubtitle: "It's just an observation, not a judgment. Ready to see it?",
    imReady: "I'm ready",
    maybeLater: 'Maybe Later',
    airlockRevealTitle: "Here's what we found",
    airlockRevealSubtitle: 'This is just information to help you understand your spending better.',
    airlockRecommendationLabel: 'Smart Recommendations',
    airlockRecommendationPlaceholder: 'Personalized savings tips coming soon!',
    understood: 'Understood',
  };
  return translations[key] || key;
};

// Helper to create mock insights
function createMockInsight(
  id: string,
  category: InsightCategory = 'QUIRKY_FIRST',
  title: string = 'Test Insight',
  message: string = 'Test message'
): InsightRecord {
  return {
    insightId: id,
    category,
    title,
    message,
    shownAt: Timestamp.fromDate(new Date()),
    transactionId: `txn-${id}`,
    icon: 'Lightbulb',
  };
}

describe('AirlockSequence', () => {
  const mockOnComplete = vi.fn();
  const mockOnDismiss = vi.fn();

  const defaultProps = {
    insight: createMockInsight('coffee_spending', 'QUIRKY_FIRST', 'Coffee Habit Detected', 'You spent $120 on coffee this month'),
    onComplete: mockOnComplete,
    onDismiss: mockOnDismiss,
    theme: 'light',
    t: mockT,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC1: 3-step reveal UI', () => {
    it('starts on step 1 (Curiosity Gate) by default', () => {
      render(<AirlockSequence {...defaultProps} />);

      expect(screen.getByText('Hmm... something interesting')).toBeInTheDocument();
      expect(screen.getByText('Tell me more')).toBeInTheDocument();
    });

    it('advances to step 2 (Playful Brace) when clicking "Tell me more"', () => {
      render(<AirlockSequence {...defaultProps} />);

      fireEvent.click(screen.getByText('Tell me more'));

      expect(screen.getByText("Don't worry, this is neutral")).toBeInTheDocument();
      expect(screen.getByText("I'm ready")).toBeInTheDocument();
    });

    it('advances to step 3 (The Reveal) when clicking "I\'m ready"', () => {
      render(<AirlockSequence {...defaultProps} />);

      fireEvent.click(screen.getByText('Tell me more'));
      fireEvent.click(screen.getByText("I'm ready"));

      expect(screen.getByText('Understood')).toBeInTheDocument();
    });
  });

  describe('AC2: Appropriate emoji animations', () => {
    it('shows crystal ball emoji (🔮) on step 1', () => {
      render(<AirlockSequence {...defaultProps} />);

      expect(screen.getByText('🔮')).toBeInTheDocument();
    });

    it('shows roller coaster emoji (🎢) on step 2', () => {
      render(<AirlockSequence {...defaultProps} />);

      fireEvent.click(screen.getByText('Tell me more'));

      expect(screen.getByText('🎢')).toBeInTheDocument();
    });

    it('shows insight-specific emoji (☕) on step 3 for coffee_spending', () => {
      render(<AirlockSequence {...defaultProps} />);

      fireEvent.click(screen.getByText('Tell me more'));
      fireEvent.click(screen.getByText("I'm ready"));

      expect(screen.getByText('☕')).toBeInTheDocument();
    });

    it('shows default emoji (💡) for unknown insight type', () => {
      const unknownInsight = createMockInsight('unknown_type', 'QUIRKY_FIRST');
      render(<AirlockSequence {...defaultProps} insight={unknownInsight} />);

      fireEvent.click(screen.getByText('Tell me more'));
      fireEvent.click(screen.getByText("I'm ready"));

      expect(screen.getByText('💡')).toBeInTheDocument();
    });
  });

  describe('AC3: Progress dots', () => {
    it('renders progress indicator with 3 dots', () => {
      render(<AirlockSequence {...defaultProps} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '1');
      expect(progressBar).toHaveAttribute('aria-valuemax', '3');
    });

    it('updates progress indicator to step 2', () => {
      render(<AirlockSequence {...defaultProps} />);

      fireEvent.click(screen.getByText('Tell me more'));

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '2');
    });

    it('updates progress indicator to step 3', () => {
      render(<AirlockSequence {...defaultProps} />);

      fireEvent.click(screen.getByText('Tell me more'));
      fireEvent.click(screen.getByText("I'm ready"));

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '3');
    });
  });

  describe('AC4: "Maybe later" dismiss option on step 2', () => {
    it('shows "Maybe Later" button only on step 2', () => {
      render(<AirlockSequence {...defaultProps} />);

      // Step 1: No "Maybe Later" button
      expect(screen.queryByText('Maybe Later')).not.toBeInTheDocument();

      // Step 2: "Maybe Later" button appears
      fireEvent.click(screen.getByText('Tell me more'));
      expect(screen.getByText('Maybe Later')).toBeInTheDocument();
    });

    it('calls onDismiss when clicking "Maybe Later"', () => {
      render(<AirlockSequence {...defaultProps} />);

      fireEvent.click(screen.getByText('Tell me more'));
      fireEvent.click(screen.getByText('Maybe Later'));

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('AC5: Dynamic insight content on step 3', () => {
    it('displays insight title on step 3', () => {
      render(<AirlockSequence {...defaultProps} />);

      fireEvent.click(screen.getByText('Tell me more'));
      fireEvent.click(screen.getByText("I'm ready"));

      expect(screen.getByText('Coffee Habit Detected')).toBeInTheDocument();
    });

    it('displays insight message on step 3', () => {
      render(<AirlockSequence {...defaultProps} />);

      fireEvent.click(screen.getByText('Tell me more'));
      fireEvent.click(screen.getByText("I'm ready"));

      expect(screen.getByText('You spent $120 on coffee this month')).toBeInTheDocument();
    });

    it('falls back to generic title if insight has no title', () => {
      const noTitleInsight = createMockInsight('test', 'QUIRKY_FIRST', '', 'Test message');
      render(<AirlockSequence {...defaultProps} insight={noTitleInsight} />);

      fireEvent.click(screen.getByText('Tell me more'));
      fireEvent.click(screen.getByText("I'm ready"));

      expect(screen.getByText("Here's what we found")).toBeInTheDocument();
    });
  });

  describe('AC6: Float animation with reduced motion support', () => {
    it('applies float animation class to emoji', () => {
      render(<AirlockSequence {...defaultProps} />);

      const emoji = screen.getByText('🔮');
      expect(emoji).toHaveClass('airlock-emoji-animated');
    });

    it('includes reduced motion media query in styles', () => {
      render(<AirlockSequence {...defaultProps} />);

      const styleTag = document.querySelector('style');
      expect(styleTag?.textContent).toContain('@media (prefers-reduced-motion: reduce)');
      expect(styleTag?.textContent).toContain('animation: none');
    });
  });

  describe('AC7: Recommendation box on reveal step', () => {
    it('shows recommendation placeholder box on step 3', () => {
      render(<AirlockSequence {...defaultProps} />);

      fireEvent.click(screen.getByText('Tell me more'));
      fireEvent.click(screen.getByText("I'm ready"));

      expect(screen.getByText(/Smart Recommendations/)).toBeInTheDocument();
      expect(screen.getByText(/Personalized savings tips coming soon!/)).toBeInTheDocument();
    });
  });

  describe('Completion flow', () => {
    it('calls onComplete when clicking "Understood" on step 3', () => {
      render(<AirlockSequence {...defaultProps} />);

      fireEvent.click(screen.getByText('Tell me more'));
      fireEvent.click(screen.getByText("I'm ready"));
      fireEvent.click(screen.getByText('Understood'));

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog role', () => {
      render(<AirlockSequence {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-labelledby for title', () => {
      render(<AirlockSequence {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'airlock-title');
    });

    it('has aria-describedby for subtitle', () => {
      render(<AirlockSequence {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-describedby', 'airlock-subtitle');
    });

    it('buttons have minimum 44px touch target', () => {
      render(<AirlockSequence {...defaultProps} />);

      const button = screen.getByText('Tell me more');
      expect(button).toHaveClass('min-h-[44px]');
      expect(button).toHaveClass('min-w-[44px]');
    });
  });

  describe('Theme support', () => {
    it('uses CSS custom properties for colors', () => {
      render(<AirlockSequence {...defaultProps} />);

      const title = screen.getByText('Hmm... something interesting');
      // jsdom doesn't compute CSS variables, so we check the style attribute contains the variable reference
      expect(title.getAttribute('style')).toContain('color');
      expect(title.getAttribute('style')).toContain('--text-primary');
    });

    it('applies gradient background on step 3', () => {
      render(<AirlockSequence {...defaultProps} />);

      fireEvent.click(screen.getByText('Tell me more'));
      fireEvent.click(screen.getByText("I'm ready"));

      const card = document.querySelector('.airlock-card');
      expect(card).toHaveStyle({
        background: 'linear-gradient(135deg, var(--warning-light), #fef9c3)',
      });
    });
  });

  describe('Insight type emoji mapping', () => {
    const emojiTestCases = [
      { insightId: 'night_snacker', expectedEmoji: '🌙' },
      { insightId: 'weekend_shopper', expectedEmoji: '🛒' },
      { insightId: 'merchant_frequency', expectedEmoji: '🏪' },
      { insightId: 'category_dominance', expectedEmoji: '📊' },
      { insightId: 'first_scan', expectedEmoji: '🎉' },
      { insightId: 'milestone_10', expectedEmoji: '🔟' },
      { insightId: 'milestone_50', expectedEmoji: '⭐' },
      { insightId: 'milestone_100', expectedEmoji: '💯' },
    ];

    emojiTestCases.forEach(({ insightId, expectedEmoji }) => {
      it(`shows ${expectedEmoji} for ${insightId} insight`, () => {
        const insight = createMockInsight(insightId, 'QUIRKY_FIRST');
        render(<AirlockSequence {...defaultProps} insight={insight} />);

        fireEvent.click(screen.getByText('Tell me more'));
        fireEvent.click(screen.getByText("I'm ready"));

        expect(screen.getByText(expectedEmoji)).toBeInTheDocument();
      });
    });
  });
});
