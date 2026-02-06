/**
 * Story 14d-v2-1-10c: HeaderModeIndicator Component
 *
 * Header component that displays current view mode indicator:
 * - Personal mode: Shows default "G" logo (36x36)
 * - Group mode: Shows group emoji icon (44x44), truncated name, ChevronDown
 *
 * Clicking the indicator opens the ViewModeSwitcher.
 *
 * @example
 * ```tsx
 * <HeaderModeIndicator
 *   onOpen={() => setIsViewModeSwitcherOpen(true)}
 *   t={t}
 * />
 * ```
 */

import React from 'react';
import { ChevronDown, Users } from 'lucide-react';
import { useViewMode } from '@/shared/stores/useViewModeStore';

// =============================================================================
// Types
// =============================================================================

export interface HeaderModeIndicatorProps {
  /** Callback when indicator is clicked to open ViewModeSwitcher */
  onOpen: () => void;
  /** Translation function */
  t: (key: string) => string;
  /** Optional: Whether the ViewModeSwitcher dropdown is open (for aria-expanded) */
  isOpen?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

/** Maximum characters for group name before truncation */
const MAX_GROUP_NAME_LENGTH = 15;

/** Personal mode logo size */
const PERSONAL_LOGO_SIZE = 36;

/** Group mode icon size */
const GROUP_ICON_SIZE = 44;

/** Chevron icon size */
const CHEVRON_SIZE = 16;

// =============================================================================
// Style Constants (CSS Variables)
// =============================================================================

const STYLES = {
  personalLogo: {
    width: `${PERSONAL_LOGO_SIZE}px`,
    height: `${PERSONAL_LOGO_SIZE}px`,
    background: 'var(--primary, #2563eb)',
  },
  groupIcon: {
    width: `${GROUP_ICON_SIZE}px`,
    height: `${GROUP_ICON_SIZE}px`,
  },
  groupName: {
    color: 'var(--text-primary, #0f172a)',
  },
  chevron: {
    color: 'var(--text-secondary, #64748b)',
  },
} as const;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Truncates text to maxLength, adding ellipsis if truncated.
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

// =============================================================================
// Component
// =============================================================================

export const HeaderModeIndicator: React.FC<HeaderModeIndicatorProps> = ({
  onOpen,
  t,
  isOpen = false,
}) => {
  const { mode, group } = useViewMode();

  // Determine if we should show group mode display
  // Only show group mode if we have actual group data
  const isGroupMode = mode === 'group' && group !== null;

  return (
    <button
      data-testid="header-mode-indicator"
      onClick={onOpen}
      className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
      aria-label={t('switchViewMode')}
      aria-haspopup="true"
      aria-expanded={isOpen}
    >
      {isGroupMode ? (
        <>
          {/* Group Icon */}
          <div
            data-testid="header-mode-indicator-icon"
            className="rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300"
            style={{
              ...STYLES.groupIcon,
              background: group.color || 'var(--primary, #2563eb)',
            }}
          >
            {group.icon ? (
              <span
                style={{
                  fontSize: '24px',
                  fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", "EmojiSymbols", sans-serif',
                  lineHeight: 1,
                }}
                role="img"
                aria-label={group.name}
              >
                {group.icon}
              </span>
            ) : (
              <Users
                size={24}
                className="text-white"
                aria-hidden="true"
              />
            )}
          </div>

          {/* Group Name (truncated) */}
          <span
            data-testid="header-mode-indicator-name"
            className="font-medium text-sm"
            style={STYLES.groupName}
          >
            {truncateText(group.name, MAX_GROUP_NAME_LENGTH)}
          </span>

          {/* Chevron Down */}
          <ChevronDown
            data-testid="header-mode-indicator-chevron"
            size={CHEVRON_SIZE}
            style={STYLES.chevron}
            aria-hidden="true"
          />
        </>
      ) : (
        /* Personal Mode: Default "G" Logo */
        <div
          data-testid="header-mode-indicator-logo"
          className="rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300"
          style={STYLES.personalLogo}
        >
          <span
            className="text-white font-bold"
            style={{
              fontFamily: "var(--font-family-wordmark, 'Baloo 2', cursive)",
              fontSize: '18px',
            }}
          >
            G
          </span>
        </div>
      )}
    </button>
  );
};

export default HeaderModeIndicator;
