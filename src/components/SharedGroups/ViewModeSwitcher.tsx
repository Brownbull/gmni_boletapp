/**
 * Story 14c-refactor.5: ViewModeSwitcher - SIMPLIFIED (Feature Disabled)
 *
 * STUB: Shared Groups feature is temporarily unavailable.
 *
 * This simplified ViewModeSwitcher:
 * - Shows only Personal mode (no group options)
 * - Displays a "Coming soon" placeholder for shared groups
 * - Always selects Personal by default
 *
 * Original functionality will be restored in Epic 14d (Shared Groups v2).
 *
 * @example
 * ```tsx
 * <ViewModeSwitcher
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   groups={[]}  // Ignored - groups not rendered
 *   isLoading={false}  // Ignored - no loading state
 *   onSelect={(mode) => handleSelect(mode)}
 *   t={t}
 * />
 * ```
 */

import React, { useEffect, useCallback } from 'react';
import { Check, User, Users } from 'lucide-react';
import { useViewMode } from '../../contexts/ViewModeContext';
// Note: SharedGroup type still imported for props compatibility, but groups are not rendered
import type { SharedGroup } from '../../types/sharedGroup';

// =============================================================================
// Types
// =============================================================================

export interface ViewModeSwitcherProps {
  /** Whether the switcher is open/visible */
  isOpen: boolean;
  /** Callback when the switcher should close */
  onClose: () => void;
  /** @deprecated Array of shared groups - IGNORED (feature disabled) */
  groups: SharedGroup[];
  /** @deprecated Whether groups are still loading - IGNORED (feature disabled) */
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
  // groups and isLoading are intentionally ignored - feature disabled
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  groups: _groups,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isLoading: _isLoading,
  onSelect,
  t,
}) => {
  const { mode: currentMode, setPersonalMode } = useViewMode();

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
          {/* Personal option (always first and only active option) */}
          <ViewModeOption
            testId="view-mode-option-personal"
            isActive={currentMode === 'personal'}
            icon={<User size={24} style={{ color: 'var(--text-primary, #0f172a)' }} />}
            name={t('personal')}
            description={t('viewModePersonalDescription')}
            onClick={handleSelectPersonal}
          />

          {/* Story 14c-refactor.5: "Coming soon" placeholder for shared groups */}
          <div
            data-testid="view-mode-coming-soon"
            role="menuitem"
            aria-disabled="true"
            className="w-full px-4 py-3 flex items-center gap-3 opacity-50 cursor-not-allowed"
          >
            {/* Icon container - grayed out */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-muted, #f1f5f9)' }}
            >
              <Users size={24} style={{ color: 'var(--text-tertiary, #94a3b8)' }} />
            </div>

            {/* Text content */}
            <div className="flex-1 text-left min-w-0">
              <div
                className="font-medium text-sm truncate"
                style={{ color: 'var(--text-tertiary, #94a3b8)' }}
              >
                {t('sharedGroupsComingSoon')}
              </div>
              <div
                className="text-xs"
                style={{ color: 'var(--text-tertiary, #94a3b8)' }}
              >
                {t('sharedGroupsComingSoonDescription')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// =============================================================================
// Option Component - Simplified (no group options needed)
// =============================================================================

interface ViewModeOptionProps {
  testId: string;
  isActive: boolean;
  icon: React.ReactNode;
  name: string;
  description?: string;
  onClick: () => void;
}

const ViewModeOption: React.FC<ViewModeOptionProps> = ({
  testId,
  isActive,
  icon,
  name,
  description,
  onClick,
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
      {/* Icon container */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'var(--bg-muted, #f1f5f9)' }}
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

        {description && (
          <div
            className="text-xs"
            style={{ color: 'var(--text-tertiary, #94a3b8)' }}
          >
            {description}
          </div>
        )}
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
