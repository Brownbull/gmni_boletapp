/**
 * Story 14d-v2-1-10c: HeaderModeIndicator Unit Tests
 *
 * Tests the HeaderModeIndicator component for:
 * - Personal mode shows default "G" logo (AC #1)
 * - Group mode shows group icon + truncated name + chevron (AC #2)
 * - Click calls onOpen callback (AC #3)
 * - Keyboard accessibility (Enter/Space)
 * - CSS variables used (no hardcoded colors)
 * - All data-testid attributes present
 *
 * TDD Methodology:
 * - Tests written FIRST (RED phase)
 * - Implementation follows to make tests pass (GREEN phase)
 * - Refactoring with tests green (REFACTOR phase)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeaderModeIndicator } from '@/features/shared-groups/components/HeaderModeIndicator';
import type { SharedGroup } from '@/types/sharedGroup';

// =============================================================================
// Mock Setup
// =============================================================================

// Mutable state for testing different modes
let mockViewModeState = {
  mode: 'personal' as 'personal' | 'group',
  groupId: null as string | null,
  group: null as SharedGroup | null,
};

vi.mock('@/shared/stores/useViewModeStore', () => ({
  useViewMode: () => ({
    mode: mockViewModeState.mode,
    groupId: mockViewModeState.groupId,
    group: mockViewModeState.group,
    isGroupMode: mockViewModeState.mode === 'group',
  }),
}));

// =============================================================================
// Test Fixtures
// =============================================================================

const mockOnOpen = vi.fn();
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    switchViewMode: 'Cambiar modo de vista',
    personal: 'Personal',
  };
  return translations[key] || key;
};

// Mock group with realistic data
const mockGroup: SharedGroup = {
  id: 'group-1',
  name: 'Family Budget',
  icon: '👨‍👩‍👧',
  color: '#FF5733',
  ownerId: 'user-1',
  members: ['user-1', 'user-2'],
  memberDetails: {},
  createdAt: { toDate: () => new Date() } as never,
  updatedAt: { toDate: () => new Date() } as never,
};

// Mock group with long name (for truncation testing)
const mockGroupLongName: SharedGroup = {
  ...mockGroup,
  id: 'group-2',
  name: 'My Very Long Group Name That Should Be Truncated',
};

const defaultProps = {
  onOpen: mockOnOpen,
  t: mockT,
  isOpen: false,
};

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Renders HeaderModeIndicator with default props merged with overrides.
 */
const renderHeaderModeIndicator = (
  overrides: Partial<typeof defaultProps> = {}
) => {
  return render(<HeaderModeIndicator {...defaultProps} {...overrides} />);
};

// =============================================================================
// Tests
// =============================================================================

describe('HeaderModeIndicator (Story 14d-v2-1-10c)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state to default (personal mode)
    mockViewModeState = { mode: 'personal', groupId: null, group: null };
  });

  // ===========================================================================
  // AC #1: Personal Mode Shows Default Logo
  // ===========================================================================
  describe('AC #1: Personal Mode Shows Default Logo', () => {
    it('renders the header mode indicator button', () => {
      renderHeaderModeIndicator();

      expect(screen.getByTestId('header-mode-indicator')).toBeInTheDocument();
    });

    it('shows default "G" logo in personal mode', () => {
      renderHeaderModeIndicator();

      // Should show the app logo (G logo)
      expect(screen.getByTestId('header-mode-indicator-logo')).toBeInTheDocument();
    });

    it('does NOT show group name in personal mode', () => {
      renderHeaderModeIndicator();

      expect(screen.queryByTestId('header-mode-indicator-name')).not.toBeInTheDocument();
    });

    it('does NOT show chevron in personal mode', () => {
      renderHeaderModeIndicator();

      expect(screen.queryByTestId('header-mode-indicator-chevron')).not.toBeInTheDocument();
    });

    it('logo has correct size (36x36) in personal mode', () => {
      renderHeaderModeIndicator();

      const logo = screen.getByTestId('header-mode-indicator-logo');
      expect(logo).toHaveStyle({ width: '36px', height: '36px' });
    });
  });

  // ===========================================================================
  // AC #2: Group Mode Shows Group Icon + Truncated Name + Chevron
  // ===========================================================================
  describe('AC #2: Group Mode Shows Group Icon + Truncated Name + Chevron', () => {
    beforeEach(() => {
      mockViewModeState = {
        mode: 'group',
        groupId: mockGroup.id,
        group: mockGroup,
      };
    });

    it('shows group emoji icon in group mode', () => {
      renderHeaderModeIndicator();

      const icon = screen.getByTestId('header-mode-indicator-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveTextContent(mockGroup.icon!);
    });

    it('group icon has correct size (44x44) in group mode', () => {
      renderHeaderModeIndicator();

      const icon = screen.getByTestId('header-mode-indicator-icon');
      expect(icon).toHaveStyle({ width: '44px', height: '44px' });
    });

    it('group icon uses group color as background', () => {
      renderHeaderModeIndicator();

      const icon = screen.getByTestId('header-mode-indicator-icon');
      expect(icon).toHaveStyle({ background: mockGroup.color });
    });

    it('shows group name in group mode', () => {
      renderHeaderModeIndicator();

      const name = screen.getByTestId('header-mode-indicator-name');
      expect(name).toBeInTheDocument();
      expect(name).toHaveTextContent('Family Budget');
    });

    it('truncates long group names (max 15 chars)', () => {
      mockViewModeState = {
        mode: 'group',
        groupId: mockGroupLongName.id,
        group: mockGroupLongName,
      };

      renderHeaderModeIndicator();

      const name = screen.getByTestId('header-mode-indicator-name');
      // "My Very Long Gr..." (15 chars + ellipsis)
      expect(name.textContent?.length).toBeLessThanOrEqual(18); // 15 + "..."
      expect(name).toHaveTextContent('My Very Long Gr');
    });

    it('shows ChevronDown icon in group mode', () => {
      renderHeaderModeIndicator();

      expect(screen.getByTestId('header-mode-indicator-chevron')).toBeInTheDocument();
    });

    it('does NOT show default logo in group mode', () => {
      renderHeaderModeIndicator();

      expect(screen.queryByTestId('header-mode-indicator-logo')).not.toBeInTheDocument();
    });

    it('uses default icon when group has no icon', () => {
      const groupWithoutIcon: SharedGroup = {
        ...mockGroup,
        icon: undefined,
      };
      mockViewModeState = {
        mode: 'group',
        groupId: groupWithoutIcon.id,
        group: groupWithoutIcon,
      };

      renderHeaderModeIndicator();

      const icon = screen.getByTestId('header-mode-indicator-icon');
      // Should show default Users icon or fallback emoji
      expect(icon).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // AC #3: Click Calls onOpen Callback
  // ===========================================================================
  describe('AC #3: Click Calls onOpen Callback', () => {
    it('calls onOpen when button is clicked in personal mode', () => {
      renderHeaderModeIndicator();

      fireEvent.click(screen.getByTestId('header-mode-indicator'));

      expect(mockOnOpen).toHaveBeenCalledTimes(1);
    });

    it('calls onOpen when button is clicked in group mode', () => {
      mockViewModeState = {
        mode: 'group',
        groupId: mockGroup.id,
        group: mockGroup,
      };

      renderHeaderModeIndicator();

      fireEvent.click(screen.getByTestId('header-mode-indicator'));

      expect(mockOnOpen).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // Keyboard Accessibility
  // ===========================================================================
  describe('Keyboard Accessibility', () => {
    it('renders as native button element (inherits keyboard support)', () => {
      renderHeaderModeIndicator();

      const button = screen.getByTestId('header-mode-indicator');
      // Native button elements automatically support Enter/Space key activation
      expect(button.tagName).toBe('BUTTON');
    });

    it('button is focusable', () => {
      renderHeaderModeIndicator();

      const button = screen.getByTestId('header-mode-indicator');
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('has aria-label for accessibility', () => {
      renderHeaderModeIndicator();

      const button = screen.getByTestId('header-mode-indicator');
      expect(button).toHaveAttribute('aria-label', mockT('switchViewMode'));
    });

    it('has aria-haspopup="true" indicating dropdown behavior', () => {
      renderHeaderModeIndicator();

      const button = screen.getByTestId('header-mode-indicator');
      expect(button).toHaveAttribute('aria-haspopup', 'true');
    });

    it('has aria-expanded="false" when dropdown is closed', () => {
      renderHeaderModeIndicator({ isOpen: false });

      const button = screen.getByTestId('header-mode-indicator');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('has aria-expanded="true" when dropdown is open', () => {
      renderHeaderModeIndicator({ isOpen: true });

      const button = screen.getByTestId('header-mode-indicator');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  // ===========================================================================
  // CSS Variables (UI Standards Compliance)
  // ===========================================================================
  describe('CSS Variables (UI Standards Compliance)', () => {
    it('personal mode logo uses CSS variable for background', () => {
      renderHeaderModeIndicator();

      const logo = screen.getByTestId('header-mode-indicator-logo');
      // Should use var(--primary, ...) for background
      expect(logo).toHaveStyle({ background: 'var(--primary, #2563eb)' });
    });

    it('group mode name uses CSS variable for color', () => {
      mockViewModeState = {
        mode: 'group',
        groupId: mockGroup.id,
        group: mockGroup,
      };

      renderHeaderModeIndicator();

      const name = screen.getByTestId('header-mode-indicator-name');
      // Should use var(--text-primary, ...) for color
      expect(name).toHaveStyle({ color: 'var(--text-primary, #0f172a)' });
    });

    it('chevron uses CSS variable for color', () => {
      mockViewModeState = {
        mode: 'group',
        groupId: mockGroup.id,
        group: mockGroup,
      };

      renderHeaderModeIndicator();

      const chevron = screen.getByTestId('header-mode-indicator-chevron');
      // Should use var(--text-secondary, ...) for color
      expect(chevron).toHaveStyle({ color: 'var(--text-secondary, #64748b)' });
    });
  });

  // ===========================================================================
  // Data Test IDs (Test Infrastructure)
  // ===========================================================================
  describe('Data Test IDs', () => {
    it('main button has data-testid="header-mode-indicator"', () => {
      renderHeaderModeIndicator();

      expect(screen.getByTestId('header-mode-indicator')).toBeInTheDocument();
    });

    it('personal mode logo has data-testid="header-mode-indicator-logo"', () => {
      renderHeaderModeIndicator();

      expect(screen.getByTestId('header-mode-indicator-logo')).toBeInTheDocument();
    });

    it('group mode icon has data-testid="header-mode-indicator-icon"', () => {
      mockViewModeState = {
        mode: 'group',
        groupId: mockGroup.id,
        group: mockGroup,
      };

      renderHeaderModeIndicator();

      expect(screen.getByTestId('header-mode-indicator-icon')).toBeInTheDocument();
    });

    it('group name has data-testid="header-mode-indicator-name"', () => {
      mockViewModeState = {
        mode: 'group',
        groupId: mockGroup.id,
        group: mockGroup,
      };

      renderHeaderModeIndicator();

      expect(screen.getByTestId('header-mode-indicator-name')).toBeInTheDocument();
    });

    it('chevron has data-testid="header-mode-indicator-chevron"', () => {
      mockViewModeState = {
        mode: 'group',
        groupId: mockGroup.id,
        group: mockGroup,
      };

      renderHeaderModeIndicator();

      expect(screen.getByTestId('header-mode-indicator-chevron')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================
  describe('Edge Cases', () => {
    it('handles null group gracefully (falls back to personal mode display)', () => {
      mockViewModeState = {
        mode: 'group',
        groupId: 'group-1',
        group: null, // Group data not yet loaded
      };

      renderHeaderModeIndicator();

      // Should show default logo when group data is missing
      expect(screen.getByTestId('header-mode-indicator-logo')).toBeInTheDocument();
      expect(screen.queryByTestId('header-mode-indicator-name')).not.toBeInTheDocument();
    });

    it('handles empty group name gracefully', () => {
      const groupWithEmptyName: SharedGroup = {
        ...mockGroup,
        name: '',
      };
      mockViewModeState = {
        mode: 'group',
        groupId: groupWithEmptyName.id,
        group: groupWithEmptyName,
      };

      renderHeaderModeIndicator();

      const name = screen.getByTestId('header-mode-indicator-name');
      expect(name).toHaveTextContent('');
    });

    it('handles group with color but no icon', () => {
      const groupNoIcon: SharedGroup = {
        ...mockGroup,
        icon: undefined,
        color: '#3498db',
      };
      mockViewModeState = {
        mode: 'group',
        groupId: groupNoIcon.id,
        group: groupNoIcon,
      };

      renderHeaderModeIndicator();

      const icon = screen.getByTestId('header-mode-indicator-icon');
      expect(icon).toHaveStyle({ background: '#3498db' });
    });

    it('uses default color when group has no color', () => {
      const groupNoColor: SharedGroup = {
        ...mockGroup,
        color: '',
      };
      mockViewModeState = {
        mode: 'group',
        groupId: groupNoColor.id,
        group: groupNoColor,
      };

      renderHeaderModeIndicator();

      const icon = screen.getByTestId('header-mode-indicator-icon');
      // Should fall back to CSS variable
      expect(icon).toHaveStyle({ background: 'var(--primary, #2563eb)' });
    });
  });
});
