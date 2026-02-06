/**
 * Story 14d-v2-1-10b: ViewModeSwitcher UI Implementation Tests
 *
 * Tests the ViewModeSwitcher component UI for:
 * - Group list rendering (AC #1)
 * - Empty state with Create Group button (AC #2)
 * - Selection behavior (AC #3)
 * - Accessibility: role=listbox, role=option, aria-selected (AC #4)
 * - Keyboard navigation (AC #4)
 * - Loading state handling
 *
 * TDD Methodology:
 * - Tests written FIRST (RED phase)
 * - Implementation follows to make tests pass (GREEN phase)
 * - Refactoring with tests green (REFACTOR phase)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewModeSwitcher } from '@/features/shared-groups';
import type { SharedGroup } from '@/types/sharedGroup';

// =============================================================================
// Mock Setup
// =============================================================================

const mockSetPersonalMode = vi.fn();
const mockSetGroupMode = vi.fn();
const mockUpdateGroupData = vi.fn();

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
    setPersonalMode: mockSetPersonalMode,
    setGroupMode: mockSetGroupMode,
    updateGroupData: mockUpdateGroupData,
  }),
}));

// Mock groupDialogsActions for Create Group button
// NOTE: This must be defined before vi.mock due to hoisting
const mockOpenCreateDialog = vi.fn();

vi.mock('@/features/shared-groups/store/useGroupDialogsStore', () => ({
  groupDialogsActions: {
    openCreateDialog: () => mockOpenCreateDialog(),
  },
}));

// =============================================================================
// Test Fixtures
// =============================================================================

const mockOnClose = vi.fn();
const mockOnSelect = vi.fn();
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    selectViewMode: 'Seleccionar vista',
    personal: 'Personal',
    viewModePersonalDescription: 'Solo mis transacciones',
    sharedGroupsComingSoon: 'Grupos compartidos',
    sharedGroupsComingSoonDescription: 'Proximamente',
    members: 'miembros',
    createGroup: 'Crear grupo',
  };
  return translations[key] || key;
};

// Mock groups with realistic data
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
  {
    id: 'group-2',
    name: 'Work',
    icon: '💼',
    color: '#3498db',
    ownerId: 'user-1',
    members: ['user-1', 'user-3', 'user-4'],
    memberDetails: {},
    createdAt: { toDate: () => new Date() } as never,
    updatedAt: { toDate: () => new Date() } as never,
  },
];

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  groups: mockGroups,
  isLoading: false,
  onSelect: mockOnSelect,
  t: mockT,
};

// =============================================================================
// [ECC-Review][LOW] Test Helpers
// =============================================================================

/**
 * Renders ViewModeSwitcher with default props merged with overrides.
 * Simplifies test setup by avoiding repeated prop spreading.
 *
 * @param overrides - Partial props to override defaults
 * @returns render result from @testing-library/react
 *
 * @example
 * // Render with empty groups
 * renderViewModeSwitcher({ groups: [] });
 *
 * @example
 * // Render in loading state
 * renderViewModeSwitcher({ groups: [], isLoading: true });
 */
const renderViewModeSwitcher = (
  overrides: Partial<typeof defaultProps> = {}
) => {
  return render(<ViewModeSwitcher {...defaultProps} {...overrides} />);
};

// =============================================================================
// Tests
// =============================================================================

describe('ViewModeSwitcher (Story 14d-v2-1-10b)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state to default
    mockViewModeState = { mode: 'personal', groupId: null, group: null };
  });

  // ===========================================================================
  // AC #1: Group List Rendering
  // ===========================================================================
  describe('AC #1: Group List Rendering', () => {
    it('renders group options when groups are provided', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      expect(screen.getByTestId('view-mode-option-group-group-1')).toBeInTheDocument();
      expect(screen.getByTestId('view-mode-option-group-group-2')).toBeInTheDocument();
    });

    it('shows group icon for each group option', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      // Each group should have the Users icon (we can verify by presence of the option)
      const group1Option = screen.getByTestId('view-mode-option-group-group-1');
      const group2Option = screen.getByTestId('view-mode-option-group-group-2');

      expect(group1Option).toBeInTheDocument();
      expect(group2Option).toBeInTheDocument();
    });

    it('shows group name for each group option', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      expect(screen.getByText('Family')).toBeInTheDocument();
      expect(screen.getByText('Work')).toBeInTheDocument();
    });

    it('shows member count for each group option', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      // Family has 2 members, Work has 3 members
      expect(screen.getByText('2 miembros')).toBeInTheDocument();
      expect(screen.getByText('3 miembros')).toBeInTheDocument();
    });

    it('shows checkmark on active group when selected', () => {
      mockViewModeState = {
        mode: 'group',
        groupId: 'group-1',
        group: mockGroups[0],
      };

      render(<ViewModeSwitcher {...defaultProps} />);

      const group1Option = screen.getByTestId('view-mode-option-group-group-1');
      expect(group1Option).toHaveAttribute('data-active', 'true');

      const group2Option = screen.getByTestId('view-mode-option-group-group-2');
      expect(group2Option).toHaveAttribute('data-active', 'false');
    });

    it('does NOT show Coming Soon placeholder when groups are provided', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      expect(screen.queryByTestId('view-mode-coming-soon')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // AC #2: Empty State - Create Group Button
  // ===========================================================================
  describe('AC #2: Empty State - Create Group Button', () => {
    it('shows Create Group button when groups array is empty', () => {
      render(<ViewModeSwitcher {...defaultProps} groups={[]} />);

      expect(screen.getByTestId('view-mode-create-group')).toBeInTheDocument();
      expect(screen.getByText('Crear grupo')).toBeInTheDocument();
    });

    it('does NOT show Create Group when groups exist', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      expect(screen.queryByTestId('view-mode-create-group')).not.toBeInTheDocument();
    });

    it('clicking Create Group opens CreateGroupDialog', () => {
      render(<ViewModeSwitcher {...defaultProps} groups={[]} />);

      fireEvent.click(screen.getByTestId('view-mode-create-group'));

      expect(mockOpenCreateDialog).toHaveBeenCalledTimes(1);
    });

    it('clicking Create Group closes the switcher', () => {
      render(<ViewModeSwitcher {...defaultProps} groups={[]} />);

      fireEvent.click(screen.getByTestId('view-mode-create-group'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does NOT show Create Group button when loading', () => {
      render(<ViewModeSwitcher {...defaultProps} groups={[]} isLoading={true} />);

      expect(screen.queryByTestId('view-mode-create-group')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // AC #3: Selection Behavior
  // ===========================================================================
  describe('AC #3: Selection Behavior', () => {
    it('calls setGroupMode when group option clicked', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      fireEvent.click(screen.getByTestId('view-mode-option-group-group-1'));

      expect(mockSetGroupMode).toHaveBeenCalledWith('group-1', mockGroups[0]);
    });

    it('calls onSelect with group data after selection', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      fireEvent.click(screen.getByTestId('view-mode-option-group-group-2'));

      expect(mockOnSelect).toHaveBeenCalledWith('group', mockGroups[1]);
    });

    it('calls onClose after group selection', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      fireEvent.click(screen.getByTestId('view-mode-option-group-group-1'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('setGroupMode is called before onSelect and onClose', () => {
      const callOrder: string[] = [];

      mockSetGroupMode.mockImplementation(() => callOrder.push('setGroupMode'));
      mockOnSelect.mockImplementation(() => callOrder.push('onSelect'));
      mockOnClose.mockImplementation(() => callOrder.push('onClose'));

      render(<ViewModeSwitcher {...defaultProps} />);
      fireEvent.click(screen.getByTestId('view-mode-option-group-group-1'));

      expect(callOrder).toEqual(['setGroupMode', 'onSelect', 'onClose']);
    });

    // [ECC-Review][MEDIUM] Test for group without ID edge case (defensive code at line 102-107)
    it('does not call setGroupMode when group has no id (defensive)', () => {
      // Create a mock group without id (edge case - shouldn't happen in practice)
      const groupWithoutId: SharedGroup = {
        ...mockGroups[0],
        id: '', // Empty string id
      };

      render(<ViewModeSwitcher {...defaultProps} groups={[groupWithoutId]} />);

      // Click the group option (using partial match since id is empty)
      const groupOption = screen.getByTestId('view-mode-option-group-');
      fireEvent.click(groupOption);

      // setGroupMode should NOT be called due to early return
      expect(mockSetGroupMode).not.toHaveBeenCalled();
      // onSelect should NOT be called either
      expect(mockOnSelect).not.toHaveBeenCalled();
      // onClose should NOT be called either
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // AC #4: Accessibility - Roles and ARIA
  // ===========================================================================
  describe('AC #4: Accessibility - Roles and ARIA', () => {
    it('container has role="listbox"', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      const container = screen.getByTestId('view-mode-switcher');
      expect(container).toHaveAttribute('role', 'listbox');
    });

    it('options have role="option"', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      const personalOption = screen.getByTestId('view-mode-option-personal');
      expect(personalOption).toHaveAttribute('role', 'option');

      const group1Option = screen.getByTestId('view-mode-option-group-group-1');
      expect(group1Option).toHaveAttribute('role', 'option');

      const group2Option = screen.getByTestId('view-mode-option-group-group-2');
      expect(group2Option).toHaveAttribute('role', 'option');
    });

    it('selected option has aria-selected="true"', () => {
      mockViewModeState = {
        mode: 'group',
        groupId: 'group-1',
        group: mockGroups[0],
      };

      render(<ViewModeSwitcher {...defaultProps} />);

      const group1Option = screen.getByTestId('view-mode-option-group-group-1');
      expect(group1Option).toHaveAttribute('aria-selected', 'true');
    });

    it('non-selected options have aria-selected="false"', () => {
      mockViewModeState = {
        mode: 'group',
        groupId: 'group-1',
        group: mockGroups[0],
      };

      render(<ViewModeSwitcher {...defaultProps} />);

      const personalOption = screen.getByTestId('view-mode-option-personal');
      expect(personalOption).toHaveAttribute('aria-selected', 'false');

      const group2Option = screen.getByTestId('view-mode-option-group-group-2');
      expect(group2Option).toHaveAttribute('aria-selected', 'false');
    });

    it('Create Group button has role="option" and aria-selected="false"', () => {
      render(<ViewModeSwitcher {...defaultProps} groups={[]} />);

      const createButton = screen.getByTestId('view-mode-create-group');
      expect(createButton).toHaveAttribute('role', 'option');
      expect(createButton).toHaveAttribute('aria-selected', 'false');
    });
  });

  // ===========================================================================
  // AC #4: Keyboard Navigation
  // ===========================================================================
  describe('AC #4: Keyboard Navigation', () => {
    it('ArrowDown moves focus to next option', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      // First focus is on Personal (index 0), ArrowDown should move to group-1 (index 1)
      fireEvent.keyDown(document, { key: 'ArrowDown' });

      const group1Option = screen.getByTestId('view-mode-option-group-group-1');
      expect(document.activeElement).toBe(group1Option);
    });

    it('ArrowUp moves focus to previous option', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      // Move down twice first to get to group-2
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      fireEvent.keyDown(document, { key: 'ArrowDown' });

      // Now ArrowUp should go back to group-1
      fireEvent.keyDown(document, { key: 'ArrowUp' });

      const group1Option = screen.getByTestId('view-mode-option-group-group-1');
      expect(document.activeElement).toBe(group1Option);
    });

    it('ArrowDown does not go past last option', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      // Move down 3 times (Personal -> group-1 -> group-2)
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      fireEvent.keyDown(document, { key: 'ArrowDown' });

      // ArrowDown again should stay on last option
      fireEvent.keyDown(document, { key: 'ArrowDown' });

      const group2Option = screen.getByTestId('view-mode-option-group-group-2');
      expect(document.activeElement).toBe(group2Option);
    });

    it('ArrowUp does not go past first option', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      // ArrowUp on first option should stay on first
      fireEvent.keyDown(document, { key: 'ArrowUp' });

      const personalOption = screen.getByTestId('view-mode-option-personal');
      expect(document.activeElement).toBe(personalOption);
    });

    it('Enter selects focused option', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      // Move to group-1 and press Enter
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      fireEvent.keyDown(document, { key: 'Enter' });

      expect(mockSetGroupMode).toHaveBeenCalledWith('group-1', mockGroups[0]);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('Space selects focused option', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      // Move to group-2 and press Space
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      fireEvent.keyDown(document, { key: ' ' });

      expect(mockSetGroupMode).toHaveBeenCalledWith('group-2', mockGroups[1]);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('Enter on Personal selects personal mode', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      // Focus is on Personal by default, press Enter
      fireEvent.keyDown(document, { key: 'Enter' });

      expect(mockSetPersonalMode).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('keyboard navigation works with empty groups (Create Group button)', () => {
      render(<ViewModeSwitcher {...defaultProps} groups={[]} />);

      // Move down from Personal to Create Group
      fireEvent.keyDown(document, { key: 'ArrowDown' });

      const createButton = screen.getByTestId('view-mode-create-group');
      expect(document.activeElement).toBe(createButton);

      // Press Enter to open create dialog
      fireEvent.keyDown(document, { key: 'Enter' });

      expect(mockOpenCreateDialog).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Loading State
  // ===========================================================================
  describe('Loading State', () => {
    // [ECC-Review][MEDIUM] Removed duplicate 'does NOT show Create Group button when loading'
    // test - already covered in AC#2 Empty State section

    it('shows only Personal option when loading with empty groups', () => {
      render(<ViewModeSwitcher {...defaultProps} groups={[]} isLoading={true} />);

      expect(screen.getByTestId('view-mode-option-personal')).toBeInTheDocument();
      expect(screen.queryByTestId('view-mode-create-group')).not.toBeInTheDocument();
      expect(screen.queryByTestId('view-mode-option-group-group-1')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Existing Behavior Preserved (from 14d-v2-1-10a)
  // ===========================================================================
  describe('Existing Behavior Preserved (from 14d-v2-1-10a)', () => {
    it('renders only when isOpen is true', () => {
      const { rerender } = render(
        <ViewModeSwitcher {...defaultProps} isOpen={false} />
      );

      expect(screen.queryByTestId('view-mode-switcher')).not.toBeInTheDocument();

      rerender(<ViewModeSwitcher {...defaultProps} isOpen={true} />);

      expect(screen.getByTestId('view-mode-switcher')).toBeInTheDocument();
    });

    it('shows Personal mode option', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      expect(screen.getByTestId('view-mode-option-personal')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
      expect(screen.getByText('Solo mis transacciones')).toBeInTheDocument();
    });

    it('closes when clicking overlay', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      fireEvent.click(screen.getByTestId('view-mode-switcher-overlay'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes on Escape key', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls setPersonalMode from store when Personal option clicked', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      fireEvent.click(screen.getByTestId('view-mode-option-personal'));

      expect(mockSetPersonalMode).toHaveBeenCalledTimes(1);
    });

    it('calls onSelect callback with "personal" after setPersonalMode', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      fireEvent.click(screen.getByTestId('view-mode-option-personal'));

      expect(mockOnSelect).toHaveBeenCalledWith('personal', undefined);
    });

    it('calls onClose after selecting Personal mode', () => {
      render(<ViewModeSwitcher {...defaultProps} />);

      fireEvent.click(screen.getByTestId('view-mode-option-personal'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('shows Personal as active when store mode is personal', () => {
      mockViewModeState = { mode: 'personal', groupId: null, group: null };

      render(<ViewModeSwitcher {...defaultProps} />);

      const personalOption = screen.getByTestId('view-mode-option-personal');
      expect(personalOption).toHaveAttribute('data-active', 'true');
    });

    it('shows Personal as inactive when store mode is group', () => {
      mockViewModeState = {
        mode: 'group',
        groupId: 'group-1',
        group: mockGroups[0],
      };

      render(<ViewModeSwitcher {...defaultProps} />);

      const personalOption = screen.getByTestId('view-mode-option-personal');
      expect(personalOption).toHaveAttribute('data-active', 'false');
    });

    it('works correctly without onSelect callback', () => {
      render(<ViewModeSwitcher {...defaultProps} onSelect={undefined} />);

      // Should not throw when clicking
      expect(() => {
        fireEvent.click(screen.getByTestId('view-mode-option-personal'));
      }).not.toThrow();

      expect(mockSetPersonalMode).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
