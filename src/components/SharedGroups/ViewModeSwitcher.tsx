/**
 * Story 14c.4: View Mode Switcher - ViewModeSwitcher Component
 *
 * Dropdown/bottom sheet component for switching between personal and group view modes.
 * Shows "Personal" as the first option followed by all shared groups the user is a member of.
 *
 * Features:
 * - Personal mode option with description
 * - Group options with icon, name, and member count with mini avatars
 * - Checkmark on currently active mode
 * - Loading skeleton while fetching groups
 * - Keyboard navigation and accessibility
 * - Larger icons (48px) for better visibility
 *
 * @example
 * ```tsx
 * <ViewModeSwitcher
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   groups={groups}
 *   isLoading={isLoading}
 *   onSelect={(mode, group) => handleSelect(mode, group)}
 *   t={t}
 * />
 * ```
 */

import React, { useEffect, useCallback } from 'react';
import { Check, User } from 'lucide-react';
import { useViewMode } from '../../contexts/ViewModeContext';
import type { SharedGroup } from '../../types/sharedGroup';

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
  const { mode: currentMode, groupId: currentGroupId, setPersonalMode, setGroupMode } = useViewMode();

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle selection of personal mode
  const handleSelectPersonal = useCallback(() => {
    setPersonalMode();
    onSelect?.('personal', undefined);
    onClose();
  }, [setPersonalMode, onSelect, onClose]);

  // Handle selection of a group
  const handleSelectGroup = useCallback(
    (group: SharedGroup) => {
      setGroupMode(group.id!, group);
      onSelect?.('group', group);
      onClose();
    },
    [setGroupMode, onSelect, onClose]
  );

  // Don't render if closed
  if (!isOpen) {
    return null;
  }

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
        role="menu"
        aria-label={t('selectViewMode')}
        className="absolute left-0 top-full mt-2 z-50 w-72 rounded-xl shadow-lg overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 border-b"
          style={{
            borderColor: 'var(--border, #e2e8f0)',
            backgroundColor: 'var(--bg-elevated, #f8fafc)',
          }}
        >
          <h3
            className="font-semibold text-sm"
            style={{ color: 'var(--text-secondary, #64748b)' }}
          >
            {t('selectViewMode')}
          </h3>
        </div>

        {/* Options list */}
        <div className="py-1">
          {/* Personal option (always first) */}
          <ViewModeOption
            testId="view-mode-option-personal"
            isActive={currentMode === 'personal'}
            icon={<User size={24} style={{ color: 'var(--text-primary, #0f172a)' }} />}
            name={t('personal')}
            description={t('viewModePersonalDescription')}
            onClick={handleSelectPersonal}
          />

          {/* Loading skeleton */}
          {isLoading && (
            <div data-testid="view-mode-switcher-skeleton" className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full animate-pulse"
                  style={{ backgroundColor: 'var(--bg-skeleton, #e2e8f0)' }}
                />
                <div className="flex-1 space-y-2">
                  <div
                    className="h-4 w-24 rounded animate-pulse"
                    style={{ backgroundColor: 'var(--bg-skeleton, #e2e8f0)' }}
                  />
                  <div
                    className="h-3 w-32 rounded animate-pulse"
                    style={{ backgroundColor: 'var(--bg-skeleton, #e2e8f0)' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Group options */}
          {!isLoading &&
            groups.map((group) => (
              <ViewModeOption
                key={group.id}
                testId={`view-mode-option-${group.id}`}
                isActive={currentMode === 'group' && currentGroupId === group.id}
                icon={
                  <span
                    className="text-2xl"
                    role="img"
                    aria-label={group.name}
                    style={{
                      fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", "EmojiSymbols", sans-serif',
                      lineHeight: 1,
                    }}
                  >
                    {group.icon || '👥'}
                  </span>
                }
                name={group.name}
                color={group.color}
                onClick={() => handleSelectGroup(group)}
                memberCount={group.members.length}
              />
            ))}
        </div>
      </div>
    </>
  );
};

// =============================================================================
// Option Component
// =============================================================================

interface ViewModeOptionProps {
  testId: string;
  isActive: boolean;
  icon: React.ReactNode;
  name: string;
  description?: string;
  color?: string;
  onClick: () => void;
  /** Member count for display */
  memberCount?: number;
}

const ViewModeOption: React.FC<ViewModeOptionProps> = ({
  testId,
  isActive,
  icon,
  name,
  description,
  color,
  onClick,
  memberCount,
}) => {
  return (
    <button
      data-testid={testId}
      data-active={isActive}
      role="menuitem"
      onClick={onClick}
      className="w-full px-4 py-3 flex items-center gap-3 transition-colors hover:bg-opacity-10"
      style={{
        backgroundColor: isActive ? 'var(--primary-bg, #eff6ff)' : 'transparent',
      }}
    >
      {/* Icon container - larger 48px for better visibility */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: color || 'var(--bg-muted, #f1f5f9)',
        }}
      >
        {icon}
      </div>

      {/* Text content */}
      <div className="flex-1 text-left min-w-0">
        <div
          className="font-medium text-sm truncate"
          style={{ color: 'var(--text-primary, #0f172a)' }}
        >
          {name}
        </div>

        {/* Member count OR description */}
        {memberCount !== undefined ? (
          <div
            className="text-xs"
            style={{ color: 'var(--text-tertiary, #94a3b8)' }}
          >
            {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}
          </div>
        ) : description ? (
          <div
            className="text-xs"
            style={{ color: 'var(--text-tertiary, #94a3b8)' }}
          >
            {description}
          </div>
        ) : null}
      </div>

      {/* Checkmark for active option */}
      {isActive && (
        <Check
          size={20}
          className="flex-shrink-0"
          style={{ color: 'var(--primary, #2563eb)' }}
        />
      )}
    </button>
  );
};

export default ViewModeSwitcher;
