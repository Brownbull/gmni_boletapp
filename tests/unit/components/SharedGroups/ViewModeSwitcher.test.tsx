/**
 * Story 14c.4: View Mode Switcher - ViewModeSwitcher Component Tests
 *
 * Tests for the dropdown/bottom sheet component that allows users to
 * switch between personal and group view modes.
 *
 * Test coverage:
 * - AC2: Group selector dropdown with all options
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ViewModeSwitcher } from '../../../../src/components/SharedGroups/ViewModeSwitcher';
import { ViewModeProvider } from '../../../../src/contexts/ViewModeContext';
import type { SharedGroup } from '../../../../src/types/sharedGroup';
import { Timestamp } from 'firebase/firestore';

// =============================================================================
// Mocks
// =============================================================================

// Mock localStorage
let mockStorage: Record<string, string>;

beforeEach(() => {
  mockStorage = {};
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => mockStorage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
    }),
    clear: vi.fn(() => {
      mockStorage = {};
    }),
    length: 0,
    key: vi.fn(() => null),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// =============================================================================
// Test Utilities
// =============================================================================

function createMockSharedGroup(overrides: Partial<SharedGroup> = {}): SharedGroup {
  const now = Timestamp.now();
  return {
    id: 'group-123',
    ownerId: 'user-456',
    appId: 'boletapp',
    name: 'Familia Martinez',
    color: '#10b981',
    icon: '👨‍👩‍👧',
    shareCode: 'abc123def456',
    shareCodeExpiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    members: ['user-456', 'user-789'],
    memberUpdates: {},
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ViewModeProvider>{children}</ViewModeProvider>
      </QueryClientProvider>
    );
  };
}

const mockT = (key: string) => {
  const translations: Record<string, string> = {
    personal: 'Personal',
    viewModePersonalDescription: 'Solo tus transacciones',
    selectViewMode: 'Seleccionar vista',
    members: 'miembros',
    viewing: 'Viendo',
  };
  return translations[key] || key;
};

describe('ViewModeSwitcher', () => {
  // ===========================================================================
  // Rendering Tests
  // ===========================================================================

  describe('Rendering', () => {
    it('should render when open', () => {
      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={() => {}}
          groups={[]}
          isLoading={false}
          t={mockT}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('view-mode-switcher')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(
        <ViewModeSwitcher
          isOpen={false}
          onClose={() => {}}
          groups={[]}
          isLoading={false}
          t={mockT}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByTestId('view-mode-switcher')).not.toBeInTheDocument();
    });

    it('should show header with title', () => {
      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={() => {}}
          groups={[]}
          isLoading={false}
          t={mockT}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Seleccionar vista')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Personal Mode Option (AC2)
  // ===========================================================================

  describe('Personal Mode Option (AC2)', () => {
    it('should show "Personal" as the first option', () => {
      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={() => {}}
          groups={[]}
          isLoading={false}
          t={mockT}
        />,
        { wrapper: createWrapper() }
      );

      const personalOption = screen.getByText('Personal');
      expect(personalOption).toBeInTheDocument();
    });

    it('should show description for Personal option', () => {
      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={() => {}}
          groups={[]}
          isLoading={false}
          t={mockT}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Solo tus transacciones')).toBeInTheDocument();
    });

    it('should show checkmark on Personal when in personal mode (default)', () => {
      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={() => {}}
          groups={[]}
          isLoading={false}
          t={mockT}
        />,
        { wrapper: createWrapper() }
      );

      const personalOption = screen.getByTestId('view-mode-option-personal');
      expect(personalOption).toHaveAttribute('data-active', 'true');
    });
  });

  // ===========================================================================
  // Group Options (AC2)
  // ===========================================================================

  describe('Group Options (AC2)', () => {
    it('should show all shared groups', () => {
      const groups = [
        createMockSharedGroup({ id: 'group-1', name: 'Familia Martinez', icon: '👨‍👩‍👧' }),
        createMockSharedGroup({ id: 'group-2', name: 'Roommates', icon: '🏠' }),
      ];

      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={() => {}}
          groups={groups}
          isLoading={false}
          t={mockT}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Familia Martinez')).toBeInTheDocument();
      expect(screen.getByText('Roommates')).toBeInTheDocument();
    });

    it('should show group icon', () => {
      const groups = [
        createMockSharedGroup({ id: 'group-1', name: 'Familia', icon: '👨‍👩‍👧' }),
      ];

      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={() => {}}
          groups={groups}
          isLoading={false}
          t={mockT}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('👨‍👩‍👧')).toBeInTheDocument();
    });

    it('should show member count for each group', () => {
      const groups = [
        createMockSharedGroup({
          id: 'group-1',
          name: 'Familia',
          members: ['user-1', 'user-2', 'user-3'],
        }),
      ];

      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={() => {}}
          groups={groups}
          isLoading={false}
          t={mockT}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('3 miembros')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Selection Tests
  // ===========================================================================

  describe('Selection', () => {
    it('should call onSelect when Personal is clicked', () => {
      const onSelect = vi.fn();

      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={() => {}}
          onSelect={onSelect}
          groups={[]}
          isLoading={false}
          t={mockT}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByTestId('view-mode-option-personal'));

      expect(onSelect).toHaveBeenCalledWith('personal', undefined);
    });

    it('should call onSelect when a group is clicked', () => {
      const onSelect = vi.fn();
      const group = createMockSharedGroup({ id: 'group-1', name: 'Familia' });

      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={() => {}}
          onSelect={onSelect}
          groups={[group]}
          isLoading={false}
          t={mockT}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByTestId('view-mode-option-group-1'));

      expect(onSelect).toHaveBeenCalledWith('group', group);
    });

    it('should call onClose after selection', () => {
      const onClose = vi.fn();

      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={onClose}
          groups={[]}
          isLoading={false}
          t={mockT}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByTestId('view-mode-option-personal'));

      expect(onClose).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Loading State Tests
  // ===========================================================================

  describe('Loading State', () => {
    it('should show skeleton when loading', () => {
      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={() => {}}
          groups={[]}
          isLoading={true}
          t={mockT}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('view-mode-switcher-skeleton')).toBeInTheDocument();
    });

    it('should still show Personal option when loading', () => {
      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={() => {}}
          groups={[]}
          isLoading={true}
          t={mockT}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Personal')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Empty State Tests
  // ===========================================================================

  describe('Empty State', () => {
    it('should show only Personal option when no groups', () => {
      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={() => {}}
          groups={[]}
          isLoading={false}
          t={mockT}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('view-mode-option-personal')).toBeInTheDocument();
      expect(screen.queryByTestId(/view-mode-option-group/)).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have role="menu"', () => {
      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={() => {}}
          groups={[]}
          isLoading={false}
          t={mockT}
        />,
        { wrapper: createWrapper() }
      );

      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
    });

    it('should have role="menuitem" for each option', () => {
      const groups = [createMockSharedGroup({ id: 'group-1' })];

      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={() => {}}
          groups={groups}
          isLoading={false}
          t={mockT}
        />,
        { wrapper: createWrapper() }
      );

      const menuitems = screen.getAllByRole('menuitem');
      expect(menuitems).toHaveLength(2); // Personal + 1 group
    });

    it('should close on Escape key', () => {
      const onClose = vi.fn();

      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={onClose}
          groups={[]}
          isLoading={false}
          t={mockT}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Overlay Tests
  // ===========================================================================

  describe('Overlay', () => {
    it('should close when clicking outside/overlay', () => {
      const onClose = vi.fn();

      render(
        <ViewModeSwitcher
          isOpen={true}
          onClose={onClose}
          groups={[]}
          isLoading={false}
          t={mockT}
        />,
        { wrapper: createWrapper() }
      );

      const overlay = screen.getByTestId('view-mode-switcher-overlay');
      fireEvent.click(overlay);

      expect(onClose).toHaveBeenCalled();
    });
  });
});
