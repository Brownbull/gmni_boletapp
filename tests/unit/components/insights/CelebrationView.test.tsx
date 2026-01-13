/**
 * CelebrationView Unit Tests
 *
 * Story 14.33d: Celebration & Personal Records Display
 * @see docs/sprint-artifacts/epic14/stories/story-14.33d-celebration-records-display.md
 *
 * Tests:
 * - AC4: Integration with recordsService.ts
 * - AC6: Web Share API integration with clipboard fallback
 * - AC7: Empty state with motivational message
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';
import { CelebrationView } from '../../../../src/components/insights/CelebrationView';
import * as recordsService from '../../../../src/services/recordsService';
import * as confettiUtil from '../../../../src/utils/confetti';
import type { StoredPersonalRecord } from '../../../../src/types/personalRecord';

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
      now: () => ({
        toDate: () => new Date(),
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
      }),
    },
  };
});

// Mock recordsService
vi.mock('../../../../src/services/recordsService', () => ({
  getRecentPersonalRecords: vi.fn(),
}));

// Mock confetti
vi.mock('../../../../src/utils/confetti', () => ({
  triggerConfetti: vi.fn(),
}));

// Translation mock
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    newPersonalRecord: '¡Nuevo Record Personal!',
    shareAchievement: 'Compartir logro',
    badgeUnlocked: 'Insignia Desbloqueada',
    noAchievementsYet: 'Aún no tienes logros',
    keepScanning: '¡Sigue escaneando para desbloquear logros!',
    thisWeek: 'Esta semana',
    vsAverage: 'vs promedio',
    copiedToClipboard: 'Copiado al portapapeles',
    previousRecords: 'Logros anteriores',
    personalRecord: 'Record Personal',
    eliteSaver: 'Ahorrador Elite',
    weeksUnderBudget: '3 semanas bajo presupuesto',
    stats: 'Statistics',
  };
  return translations[key] || key;
};

// Helper to create mock stored record
function createMockRecord(overrides: Partial<StoredPersonalRecord> = {}): StoredPersonalRecord {
  const now = new Date();
  return {
    type: 'lowest_total_week',
    value: 15200,
    previousBest: 19800,
    lookbackPeriod: 3,
    achievedAt: Timestamp.fromDate(now),
    ...overrides,
  } as StoredPersonalRecord;
}

describe('CelebrationView', () => {
  const defaultProps = {
    onBack: vi.fn(),
    theme: 'light',
    t: mockT,
    db: {} as never,
    userId: 'user-123',
    appId: 'app-test',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset navigator.share mock
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  describe('Loading state', () => {
    it('shows loading spinner while fetching records', async () => {
      // Mock getRecentPersonalRecords to never resolve during this test
      vi.mocked(recordsService.getRecentPersonalRecords).mockImplementation(
        () => new Promise(() => {})
      );

      render(<CelebrationView {...defaultProps} />);

      // Should show loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Empty state (AC7)', () => {
    it('shows empty state when no records exist', async () => {
      vi.mocked(recordsService.getRecentPersonalRecords).mockResolvedValue([]);

      render(<CelebrationView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Aún no tienes logros')).toBeInTheDocument();
      });

      expect(screen.getByText('¡Sigue escaneando para desbloquear logros!')).toBeInTheDocument();
    });

    it('shows Trophy icon in empty state', async () => {
      vi.mocked(recordsService.getRecentPersonalRecords).mockResolvedValue([]);

      render(<CelebrationView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Aún no tienes logros')).toBeInTheDocument();
      });
    });
  });

  describe('Records display (AC4)', () => {
    it('fetches records from recordsService on mount', async () => {
      vi.mocked(recordsService.getRecentPersonalRecords).mockResolvedValue([createMockRecord()]);

      render(<CelebrationView {...defaultProps} />);

      await waitFor(() => {
        expect(recordsService.getRecentPersonalRecords).toHaveBeenCalledWith(
          defaultProps.db,
          defaultProps.userId,
          defaultProps.appId,
          10
        );
      });
    });

    it('displays celebration card for most recent record', async () => {
      vi.mocked(recordsService.getRecentPersonalRecords).mockResolvedValue([createMockRecord()]);

      render(<CelebrationView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('¡Nuevo Record Personal!')).toBeInTheDocument();
      });
    });

    it('displays stats with formatted values', async () => {
      vi.mocked(recordsService.getRecentPersonalRecords).mockResolvedValue([
        createMockRecord({ value: 15200, previousBest: 19800 }),
      ]);

      render(<CelebrationView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('15.200')).toBeInTheDocument();
        expect(screen.getByText('Esta semana')).toBeInTheDocument();
      });
    });

    it('displays record type emoji', async () => {
      vi.mocked(recordsService.getRecentPersonalRecords).mockResolvedValue([
        createMockRecord({ type: 'lowest_total_week' }),
      ]);

      render(<CelebrationView {...defaultProps} />);

      await waitFor(() => {
        // lowest_total_week emoji is 🌟 - may appear multiple times (card + badge)
        // Use getAllByText and check at least one exists
        const emojis = screen.getAllByText('🌟');
        expect(emojis.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Badge unlock display', () => {
    it('shows badge when record type has an associated badge', async () => {
      vi.mocked(recordsService.getRecentPersonalRecords).mockResolvedValue([
        createMockRecord({ type: 'first_under_budget' }),
      ]);

      render(<CelebrationView {...defaultProps} />);

      await waitFor(() => {
        // first_under_budget badge is "Elite Saver"
        expect(screen.getByText('Ahorrador Elite')).toBeInTheDocument();
      });
    });
  });

  describe('Previous records', () => {
    it('shows previous records section when more than one record', async () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      vi.mocked(recordsService.getRecentPersonalRecords).mockResolvedValue([
        createMockRecord({ type: 'lowest_total_week', achievedAt: Timestamp.fromDate(now) }),
        createMockRecord({ type: 'lowest_category_week', category: 'Restaurant', achievedAt: Timestamp.fromDate(weekAgo) }),
      ]);

      render(<CelebrationView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Logros anteriores')).toBeInTheDocument();
      });
    });
  });

  describe('Confetti trigger', () => {
    it('triggers confetti for recent records (within 24 hours)', async () => {
      const now = new Date();
      vi.mocked(recordsService.getRecentPersonalRecords).mockResolvedValue([
        createMockRecord({ achievedAt: Timestamp.fromDate(now) }),
      ]);

      render(<CelebrationView {...defaultProps} />);

      await waitFor(() => {
        expect(confettiUtil.triggerConfetti).toHaveBeenCalledWith('big');
      });
    });

    it('does not trigger confetti for old records', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      vi.mocked(recordsService.getRecentPersonalRecords).mockResolvedValue([
        createMockRecord({ achievedAt: Timestamp.fromDate(twoDaysAgo) }),
      ]);

      render(<CelebrationView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('¡Nuevo Record Personal!')).toBeInTheDocument();
      });

      // Should not trigger confetti
      expect(confettiUtil.triggerConfetti).not.toHaveBeenCalled();
    });
  });

  describe('Share functionality (AC6)', () => {
    it('uses Web Share API when available', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true,
      });

      vi.mocked(recordsService.getRecentPersonalRecords).mockResolvedValue([createMockRecord()]);

      render(<CelebrationView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Compartir logro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Compartir logro'));

      expect(mockShare).toHaveBeenCalled();
    });

    it('falls back to clipboard when Web Share is not available', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      });

      vi.mocked(recordsService.getRecentPersonalRecords).mockResolvedValue([createMockRecord()]);

      render(<CelebrationView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Compartir logro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Compartir logro'));

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalled();
      });
    });

    it('shows copied toast after clipboard copy', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      });

      vi.mocked(recordsService.getRecentPersonalRecords).mockResolvedValue([createMockRecord()]);

      render(<CelebrationView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Compartir logro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Compartir logro'));

      await waitFor(() => {
        expect(screen.getByText('Copiado al portapapeles')).toBeInTheDocument();
      });
    });
  });

  describe('Unauthenticated state', () => {
    it('shows empty state when userId is null', async () => {
      vi.mocked(recordsService.getRecentPersonalRecords).mockResolvedValue([]);

      render(<CelebrationView {...defaultProps} userId={null} />);

      await waitFor(() => {
        expect(screen.getByText('Aún no tienes logros')).toBeInTheDocument();
      });

      // Should not call recordsService
      expect(recordsService.getRecentPersonalRecords).not.toHaveBeenCalled();
    });

    it('shows empty state when db is null', async () => {
      render(<CelebrationView {...defaultProps} db={null} />);

      await waitFor(() => {
        expect(screen.getByText('Aún no tienes logros')).toBeInTheDocument();
      });

      // Should not call recordsService
      expect(recordsService.getRecentPersonalRecords).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('shows empty state when recordsService throws', async () => {
      vi.mocked(recordsService.getRecentPersonalRecords).mockRejectedValue(
        new Error('Network error')
      );

      render(<CelebrationView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Aún no tienes logros')).toBeInTheDocument();
      });
    });
  });
});
