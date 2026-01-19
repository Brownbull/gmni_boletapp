/**
 * Story 14c.6: Transaction Ownership Indicators - ProfileIndicator Component
 *
 * Small avatar component that displays a user's profile indicator (initial or photo).
 * Used on transaction cards to show who owns a transaction in shared group view.
 *
 * Features:
 * - Small size for card overlay (24px)
 * - Medium size for detail view header (40px)
 * - Shows profile photo if available, otherwise initial letter
 * - Consistent color based on user ID (deterministic hashing)
 * - White border for visibility on any background
 *
 * @example
 * ```tsx
 * // On transaction card
 * <ProfileIndicator
 *   profile={{ displayName: 'John', photoURL: null }}
 *   size="small"
 *   className="absolute bottom-2 left-2"
 * />
 *
 * // In detail view header
 * <ProfileIndicator
 *   profile={{ displayName: 'John', photoURL: 'https://...' }}
 *   size="medium"
 * />
 * ```
 */

import { useState } from 'react';
import type { MemberProfile } from '../../types/sharedGroup';

// =============================================================================
// Constants
// =============================================================================

/**
 * Color palette for profile indicators (deterministic based on userId hash)
 */
const PROFILE_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#84cc16', // lime-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
];

/**
 * Get a deterministic color based on user ID
 */
function getProfileColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % PROFILE_COLORS.length;
  return PROFILE_COLORS[index];
}

/**
 * Get first letter of display name (uppercase), or '?' if unavailable
 */
function getInitial(displayName?: string): string {
  if (!displayName) return '?';
  return displayName.charAt(0).toUpperCase();
}

// =============================================================================
// Types
// =============================================================================

export interface ProfileIndicatorProps {
  /** User ID for deterministic color selection */
  userId: string;
  /** Profile data (may be partial or undefined) */
  profile?: MemberProfile | null;
  /** Size variant */
  size?: 'small' | 'medium';
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * ProfileIndicator - Avatar indicator for transaction ownership.
 */
export function ProfileIndicator({
  userId,
  profile,
  size = 'small',
  className = '',
}: ProfileIndicatorProps) {
  // Track image load error state - React pattern instead of DOM manipulation
  const [hasImageError, setHasImageError] = useState(false);

  const backgroundColor = getProfileColor(userId);
  const initial = getInitial(profile?.displayName);

  // Size classes
  const sizeClasses = {
    small: 'w-6 h-6 text-[10px]',
    medium: 'w-10 h-10 text-sm',
  };

  // Border width - consistent across sizes for visual uniformity
  const borderWidth = '2px';

  // Determine if we should show the photo (has URL and hasn't errored)
  const showPhoto = profile?.photoURL && !hasImageError;

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-white shadow-sm ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor,
        border: `${borderWidth} solid white`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }}
      aria-label={profile?.displayName || 'Unknown user'}
      title={profile?.displayName || undefined}
    >
      {showPhoto ? (
        <img
          src={profile.photoURL!}
          alt={profile.displayName || 'User'}
          className="w-full h-full rounded-full object-cover"
          onError={() => setHasImageError(true)}
        />
      ) : (
        initial
      )}
    </div>
  );
}

export default ProfileIndicator;
