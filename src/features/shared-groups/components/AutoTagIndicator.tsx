/**
 *
 * Displays a visual indicator when a transaction will be automatically
 * shared to a group. Shows the group icon, name, and color with an
 * optional remove button.
 *
 * Used in:
 * - QuickSaveCard (single scan review)
 * - TransactionEditorView (edit mode)
 * - BatchReviewView (batch scan review)
 *
 * Features:
 * - Shows "Will be shared to [Group Name]" message
 * - Displays group icon and color
 * - Optional remove button for user control
 * - Theme-aware styling using CSS variables
 *
 * @example
 * ```tsx
 * <AutoTagIndicator
 *   groupId="group-123"
 *   groupName="Family"
 *   groupColor="#10b981"
 *   groupIcon="👨‍👩‍👧"
 *   onRemove={() => handleRemoveTag()}
 *   t={t}
 * />
 * ```
 */

import { X, Users } from 'lucide-react';
import { safeCSSColor } from '@/utils/validationUtils';

// =============================================================================
// Types
// =============================================================================

export interface AutoTagIndicatorProps {
  /** Group ID (for key purposes if needed) */
  groupId: string;
  /** Group name to display */
  groupName: string;
  /** Group color (hex code) */
  groupColor: string;
  /** Group icon emoji (optional) */
  groupIcon?: string;
  /** Callback when user removes the tag (optional - hides remove button if not provided) */
  onRemove?: () => void;
  /** Whether to show the remove button (defaults to true if onRemove is provided) */
  showRemove?: boolean;
  /** Translation function */
  t: (key: string) => string;
  /** Size variant */
  size?: 'small' | 'normal';
}

// =============================================================================
// Component
// =============================================================================

/**
 * AutoTagIndicator - Shows that a transaction will be shared to a group.
 */
export function AutoTagIndicator({
  groupId,
  groupName,
  groupColor,
  groupIcon,
  onRemove,
  showRemove = true,
  t,
  size = 'normal',
}: AutoTagIndicatorProps) {
  const canRemove = showRemove && onRemove;
  const validatedColor = safeCSSColor(groupColor);

  // Size-specific classes
  const sizeClasses = {
    small: {
      container: 'px-2 py-1.5 text-xs',
      icon: 'w-5 h-5 text-[10px]',
      button: 'w-5 h-5',
    },
    normal: {
      container: 'px-3 py-2 text-sm',
      icon: 'w-6 h-6 text-xs',
      button: 'w-6 h-6',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div
      className={`flex items-center gap-2 rounded-lg ${classes.container}`}
      style={{
        backgroundColor: `${validatedColor}15`, // 15 = ~9% opacity
        border: `1px solid ${validatedColor}40`, // 40 = ~25% opacity
      }}
      data-testid={`auto-tag-indicator-${groupId}`}
      role="status"
      aria-label={`${t('willBeSharedTo') || 'Will be shared to'} ${groupName}`}
    >
      {/* Group Icon Badge */}
      <span
        className={`${classes.icon} rounded-full flex items-center justify-center font-semibold`}
        style={{
          backgroundColor: validatedColor,
          color: 'white',
          // Emoji font-family for proper rendering per Atlas Section 6 lessons
          ...(groupIcon ? { fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' } : {}),
        }}
      >
        {groupIcon || <Users size={size === 'small' ? 10 : 12} />}
      </span>

      {/* Label Text */}
      <span style={{ color: 'var(--text-secondary)' }}>
        <span className="text-inherit opacity-75">
          {t('willBeSharedTo') || 'Will be shared to'}
        </span>{' '}
        <strong style={{ color: validatedColor }}>{groupName}</strong>
      </span>

      {/* Remove Button */}
      {canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={`${classes.button} ml-auto flex items-center justify-center rounded-full transition-colors hover:bg-black/10`}
          style={{ color: validatedColor }}
          aria-label={t('removeGroupTag') || 'Remove group tag'}
          data-testid={`auto-tag-remove-${groupId}`}
        >
          <X size={size === 'small' ? 12 : 14} />
        </button>
      )}
    </div>
  );
}

export default AutoTagIndicator;
