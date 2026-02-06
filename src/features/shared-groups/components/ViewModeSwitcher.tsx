/**
 * Story 14d-v2-1-10b: ViewModeSwitcher UI Implementation
 *
 * ViewModeSwitcher component with full group list and keyboard navigation.
 *
 * Features:
 * - Personal mode option (always shown first)
 * - Group list rendering with member count
 * - Empty state with "Create Group" button
 * - Keyboard navigation (Arrow keys, Enter, Space, Escape)
 * - Accessible roles: listbox/option with aria-selected
 *
 * @example
 * ```tsx
 * <ViewModeSwitcher
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   groups={userGroups}
 *   isLoading={isLoading}
 *   onSelect={(mode, group) => handleSelect(mode, group)}
 *   t={t}
 * />
 * ```
 */

import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { Check, User, Users, Plus } from 'lucide-react';
// Story 14d-v2-0: ViewMode migrated from Context to Zustand store
import { useViewMode } from '@/shared/stores/useViewModeStore';
// Story 14d-v2-1-10b: Import groupDialogsActions for Create Group button
import { groupDialogsActions } from '@/features/shared-groups/store/useGroupDialogsStore';
import type { SharedGroup } from '@/types/sharedGroup';

// =============================================================================
// Types
// =============================================================================

export interface ViewModeSwitcherProps {
  /** Whether the switcher is open/visible */
  isOpen: boolean;
  /** Callback when the switcher should close */
  onClose: () => void;
  /** Array of shared groups to display */
  groups: SharedGroup[];
  /** Whether groups are still loading */
  isLoading: boolean;
  /** Callback when a mode is selected */
  onSelect?: (mode: 'personal' | 'group', group?: SharedGroup) => void;
  /** Translation function */
  t: (key: string) => string;
}

// Option type for keyboard navigation
type OptionItem =
  | { type: 'personal' }
  | { type: 'group'; group: SharedGroup }
  | { type: 'create' };

// =============================================================================
// [ECC-Review][LOW] Icon Size Constants
// =============================================================================

/** Standard icon size for option icons (User, Users, Plus) */
const ICON_SIZE = 24;
/** Smaller icon size for the checkmark indicator */
const CHECK_ICON_SIZE = 20;

// =============================================================================
// [ECC-Review][MEDIUM] Style Constants (extracted for performance)
// =============================================================================

const STYLES = {
  dropdownContainer: {
    backgroundColor: 'var(--bg-card, #ffffff)',
    border: '1px solid var(--border, #e2e8f0)',
  },
  header: {
    borderColor: 'var(--border, #e2e8f0)',
    backgroundColor: 'var(--bg-elevated, #f8fafc)',
  },
  headerText: {
    color: 'var(--text-secondary, #64748b)',
  },
  iconPrimary: {
    color: 'var(--text-primary, #0f172a)',
  },
  iconContainer: {
    backgroundColor: 'var(--bg-muted, #f1f5f9)',
  },
  createButtonContainer: {
    backgroundColor: 'transparent',
  },
  createIconContainer: {
    backgroundColor: 'var(--primary-bg, #eff6ff)',
  },
  primaryColor: {
    color: 'var(--primary, #2563eb)',
  },
  textPrimary: {
    color: 'var(--text-primary, #0f172a)',
  },
  textTertiary: {
    color: 'var(--text-tertiary, #94a3b8)',
  },
} as const;

// =============================================================================
// Component
// =============================================================================

export const ViewModeSwitcher: React.FC<ViewModeSwitcherProps> = ({
  isOpen,
  onClose,
  groups,
  isLoading,
  onSelect,
  t,
}) => {
  // Story 14d-v2-1-10a: Store integration
  const { mode: currentMode, groupId: currentGroupId, setPersonalMode, setGroupMode } = useViewMode();

  // Story 14d-v2-1-10b: Keyboard navigation state
  const [focusedIndex, setFocusedIndex] = useState(0);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Build options list for keyboard navigation
  const allOptions = useMemo((): OptionItem[] => {
    const options: OptionItem[] = [{ type: 'personal' }];

    if (groups.length > 0) {
      groups.forEach((group) => options.push({ type: 'group', group }));
    } else if (!isLoading) {
      options.push({ type: 'create' });
    }

    return options;
  }, [groups, isLoading]);

  // [ECC-Review][HIGH] Cleanup stale refs when options change (e.g., groups added/removed)
  useEffect(() => {
    optionRefs.current = optionRefs.current.slice(0, allOptions.length);
  }, [allOptions.length]);

  // Handle selection of personal mode
  const handleSelectPersonal = useCallback(() => {
    setPersonalMode();
    onSelect?.('personal', undefined);
    onClose();
  }, [setPersonalMode, onSelect, onClose]);

  // Handle selection of a shared group
  const handleSelectGroup = useCallback(
    (group: SharedGroup) => {
      // group.id is required for selection - groups from Firestore always have id
      if (!group.id) {
        if (import.meta.env.DEV) {
          console.warn('[ViewModeSwitcher] Cannot select group without id');
        }
        return;
      }
      setGroupMode(group.id, group);
      onSelect?.('group', group);
      onClose();
    },
    [setGroupMode, onSelect, onClose]
  );

  // Handle Create Group button click
  const handleCreateGroup = useCallback(() => {
    groupDialogsActions.openCreateDialog();
    onClose();
  }, [onClose]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, allOptions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < allOptions.length) {
            const option = allOptions[focusedIndex];
            if (option.type === 'personal') {
              handleSelectPersonal();
            } else if (option.type === 'group') {
              handleSelectGroup(option.group);
            } else if (option.type === 'create') {
              handleCreateGroup();
            }
          }
          break;
      }
    },
    [isOpen, onClose, focusedIndex, allOptions, handleSelectPersonal, handleSelectGroup, handleCreateGroup]
  );

  // Set up keyboard event listener
  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // [ECC-Review][MEDIUM] Focus the current option when focused index changes
  // Guard against refs not ready on re-open
  useEffect(() => {
    if (!isOpen || focusedIndex < 0) return;

    const currentRef = optionRefs.current[focusedIndex];
    if (!currentRef) return; // Guard: ref may not be populated on re-open

    currentRef.focus();
  }, [isOpen, focusedIndex]);

  // Reset focus when opening/closing
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0);
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  // Don't render if closed
  if (!isOpen) {
    return null;
  }

  // Calculate if Personal is active
  const isPersonalActive = currentMode === 'personal';

  return (
    <>
      {/* Overlay */}
      <div
        data-testid="view-mode-switcher-overlay"
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dropdown menu */}
      <div
        data-testid="view-mode-switcher"
        role="listbox"
        aria-label={t('selectViewMode')}
        aria-activedescendant={focusedIndex >= 0 ? `view-mode-option-${focusedIndex}` : undefined}
        className="absolute left-0 top-full mt-2 z-50 w-72 rounded-xl shadow-lg overflow-hidden"
        style={STYLES.dropdownContainer}
      >
        {/* Header */}
        <div
          className="px-4 py-3 border-b"
          style={STYLES.header}
        >
          <h3
            className="font-semibold text-sm"
            style={STYLES.headerText}
          >
            {t('selectViewMode')}
          </h3>
        </div>

        {/* Options list */}
        <div className="py-1">
          {/* Personal option (always first) */}
          <ViewModeOption
            testId="view-mode-option-personal"
            id="view-mode-option-0"
            isActive={isPersonalActive}
            icon={<User size={ICON_SIZE} style={STYLES.iconPrimary} />}
            name={t('personal')}
            description={t('viewModePersonalDescription')}
            onClick={handleSelectPersonal}
            optionRef={(el) => {
              optionRefs.current[0] = el;
            }}
          />

          {/* Group options (when groups exist) */}
          {groups.map((group, index) => {
            const isGroupActive = currentMode === 'group' && currentGroupId === group.id;
            return (
              <ViewModeOption
                key={group.id}
                testId={`view-mode-option-group-${group.id}`}
                id={`view-mode-option-${index + 1}`}
                isActive={isGroupActive}
                icon={<Users size={ICON_SIZE} style={STYLES.iconPrimary} />}
                name={group.name}
                description={`${group.members.length} ${t('members')}`}
                onClick={() => handleSelectGroup(group)}
                optionRef={(el) => {
                  optionRefs.current[index + 1] = el;
                }}
              />
            );
          })}

          {/* Create Group button (when no groups and not loading) */}
          {groups.length === 0 && !isLoading && (
            <button
              data-testid="view-mode-create-group"
              id="view-mode-option-1"
              role="option"
              aria-selected={false}
              onClick={handleCreateGroup}
              ref={(el) => {
                optionRefs.current[1] = el;
              }}
              className="w-full px-4 py-3 flex items-center gap-3 transition-colors"
              style={STYLES.createButtonContainer}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={STYLES.createIconContainer}
              >
                <Plus size={ICON_SIZE} style={STYLES.primaryColor} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div
                  className="font-medium text-sm"
                  style={STYLES.primaryColor}
                >
                  {t('createGroup')}
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

// =============================================================================
// Option Component
// =============================================================================

/**
 * [ECC-Review][LOW] JSDoc for ViewModeOption sub-component
 *
 * Props for the ViewModeOption sub-component.
 *
 * ViewModeOption renders a single selectable option in the ViewModeSwitcher dropdown.
 * It displays an icon, name, optional description, and checkmark for active state.
 *
 * @example
 * ```tsx
 * <ViewModeOption
 *   testId="view-mode-option-personal"
 *   id="view-mode-option-0"
 *   isActive={mode === 'personal'}
 *   icon={<User size={ICON_SIZE} style={STYLES.iconPrimary} />}
 *   name="Personal"
 *   description="Solo mis transacciones"
 *   onClick={handleSelectPersonal}
 *   optionRef={(el) => { optionRefs.current[0] = el; }}
 * />
 * ```
 */
interface ViewModeOptionProps {
  testId: string;
  /** Unique id for aria-activedescendant tracking */
  id?: string;
  isActive: boolean;
  icon: React.ReactNode;
  name: string;
  description?: string;
  onClick: () => void;
  /** Ref callback for keyboard navigation */
  optionRef?: (el: HTMLButtonElement | null) => void;
}

const ViewModeOption: React.FC<ViewModeOptionProps> = ({
  testId,
  id,
  isActive,
  icon,
  name,
  description,
  onClick,
  optionRef,
}) => {
  return (
    <button
      data-testid={testId}
      id={id}
      data-active={isActive}
      role="option"
      aria-selected={isActive}
      onClick={onClick}
      ref={optionRef}
      className="w-full px-4 py-3 flex items-center gap-3 transition-colors hover:bg-opacity-10"
      style={{
        backgroundColor: isActive ? 'var(--primary-bg, #eff6ff)' : 'transparent',
      }}
    >
      {/* Icon container */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style={STYLES.iconContainer}
      >
        {icon}
      </div>

      {/* Text content */}
      <div className="flex-1 text-left min-w-0">
        <div
          className="font-medium text-sm truncate"
          style={STYLES.textPrimary}
        >
          {name}
        </div>

        {description && (
          <div
            className="text-xs"
            style={STYLES.textTertiary}
          >
            {description}
          </div>
        )}
      </div>

      {/* Checkmark for active option */}
      {isActive && (
        <Check
          size={CHECK_ICON_SIZE}
          className="flex-shrink-0"
          style={STYLES.primaryColor}
        />
      )}
    </button>
  );
};

export default ViewModeSwitcher;
