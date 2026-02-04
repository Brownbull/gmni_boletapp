/**
 * Story 14c-refactor.5: Placeholder UI States - ViewModeSwitcher Tests
 *
 * Tests the simplified ViewModeSwitcher that:
 * - Shows only Personal mode (no group options)
 * - Displays "Coming soon" placeholder for shared groups
 * - Always selects Personal by default
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewModeSwitcher } from '@/features/shared-groups';
import type { SharedGroup } from '@/types/sharedGroup';

// Mock useViewModeStore (Story 14d-v2-0: Migrated from ViewModeContext to Zustand store)
vi.mock('@/shared/stores/useViewModeStore', () => ({
  useViewMode: () => ({
    mode: 'personal',
    groupId: null,
    setPersonalMode: vi.fn(),
    setGroupMode: vi.fn(),
  }),
}));

describe('ViewModeSwitcher (Story 14c-refactor.5)', () => {
  const mockOnClose = vi.fn();
  const mockOnSelect = vi.fn();
  const mockT = (key: string) => {
    const translations: Record<string, string> = {
      selectViewMode: 'Seleccionar vista',
      personal: 'Personal',
      viewModePersonalDescription: 'Solo mis transacciones',
      sharedGroupsComingSoon: 'Grupos compartidos',
      sharedGroupsComingSoonDescription: 'Próximamente',
    };
    return translations[key] || key;
  };

  // Mock groups that should NOT be shown
  const mockGroups: SharedGroup[] = [
    {
      id: 'group-1',
      name: 'Family',
      icon: '👨‍👩‍👧',
      color: '#FF5733',
      ownerId: 'user-1',
      members: ['user-1', 'user-2'],
      memberDetails: {},
      createdAt: { toDate: () => new Date() } as never,
      updatedAt: { toDate: () => new Date() } as never,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC #1: Personal mode only', () => {
    it('renders only when isOpen is true', () => {
      const { rerender } = render(
        <ViewModeSwitcher
          isOpen={false}
          onClose={mockOnClose}
          groups={mockGroups}
          isLoading={false}
          onSelect={mockOnSelect}
          t={mockT}
        />
      );

      expect(screen.queryByTestId('view-mode-switcher')).not.toBeInTheDocument();

      rerender(
        <ViewModeSwitcher
          isOpen={true}
          onClose={mockOnClose}
          groups={mockGroups}
          isLoading={false}
          onSelect={mockOnSelect}
          t={mockT}
        />
      );

      expect(screen.getByTestId('view-mode-switcher')).toBeInTheDocument();
    });

    it('shows Personal mode option', () => {
      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={mockOnClose}
          groups={mockGroups}
          isLoading={false}
          onSelect={mockOnSelect}
          t={mockT}
        />
      );

      expect(screen.getByTestId('view-mode-option-personal')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
      expect(screen.getByText('Solo mis transacciones')).toBeInTheDocument();
    });

    it('does NOT show any group options (groups are passed but not rendered)', () => {
      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={mockOnClose}
          groups={mockGroups}
          isLoading={false}
          onSelect={mockOnSelect}
          t={mockT}
        />
      );

      // Group options should not exist
      expect(screen.queryByTestId('view-mode-option-group-1')).not.toBeInTheDocument();
      expect(screen.queryByText('Family')).not.toBeInTheDocument();
    });

    it('shows "Coming soon" placeholder for shared groups', () => {
      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={mockOnClose}
          groups={mockGroups}
          isLoading={false}
          onSelect={mockOnSelect}
          t={mockT}
        />
      );

      // Should show the coming soon placeholder
      expect(screen.getByTestId('view-mode-coming-soon')).toBeInTheDocument();
      expect(screen.getByText('Grupos compartidos')).toBeInTheDocument();
      expect(screen.getByText('Próximamente')).toBeInTheDocument();
    });

    it('does not render loading skeleton (feature disabled)', () => {
      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={mockOnClose}
          groups={[]}
          isLoading={true}
          onSelect={mockOnSelect}
          t={mockT}
        />
      );

      // Loading skeleton should not be shown
      expect(screen.queryByTestId('view-mode-switcher-skeleton')).not.toBeInTheDocument();
    });
  });

  describe('AC #1: Personal mode is always default', () => {
    it('selects Personal mode when clicking the Personal option', () => {
      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={mockOnClose}
          groups={mockGroups}
          isLoading={false}
          onSelect={mockOnSelect}
          t={mockT}
        />
      );

      fireEvent.click(screen.getByTestId('view-mode-option-personal'));

      expect(mockOnSelect).toHaveBeenCalledWith('personal', undefined);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('Personal option shows as active by default', () => {
      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={mockOnClose}
          groups={mockGroups}
          isLoading={false}
          onSelect={mockOnSelect}
          t={mockT}
        />
      );

      const personalOption = screen.getByTestId('view-mode-option-personal');
      expect(personalOption).toHaveAttribute('data-active', 'true');
    });
  });

  describe('Interaction', () => {
    it('closes when clicking overlay', () => {
      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={mockOnClose}
          groups={mockGroups}
          isLoading={false}
          onSelect={mockOnSelect}
          t={mockT}
        />
      );

      fireEvent.click(screen.getByTestId('view-mode-switcher-overlay'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes on Escape key', () => {
      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={mockOnClose}
          groups={mockGroups}
          isLoading={false}
          onSelect={mockOnSelect}
          t={mockT}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Coming Soon placeholder', () => {
    it('coming soon placeholder is disabled/grayed out', () => {
      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={mockOnClose}
          groups={mockGroups}
          isLoading={false}
          onSelect={mockOnSelect}
          t={mockT}
        />
      );

      const comingSoonPlaceholder = screen.getByTestId('view-mode-coming-soon');
      expect(comingSoonPlaceholder).toHaveAttribute('aria-disabled', 'true');
    });

    it('clicking coming soon placeholder does nothing', () => {
      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={mockOnClose}
          groups={mockGroups}
          isLoading={false}
          onSelect={mockOnSelect}
          t={mockT}
        />
      );

      fireEvent.click(screen.getByTestId('view-mode-coming-soon'));

      // Should not close or select
      expect(mockOnSelect).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});
