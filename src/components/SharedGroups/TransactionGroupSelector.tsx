/**
 * Story 14c.7: Tag Transactions to Groups - TransactionGroupSelector Component
 * Story 14c.8: Group Consolidation - shared groups only
 *
 * Multi-select modal for tagging transactions to shared groups.
 * Shows user's shared groups with selection checkmarks and member indicators.
 *
 * Features:
 * - Multi-select up to 5 groups (MAX_GROUPS_PER_TRANSACTION)
 * - Member count display for shared groups
 * - Selection count indicator (e.g., "2 of 5")
 * - Disabled selection when max reached
 *
 * @example
 * ```tsx
 * <TransactionGroupSelector
 *   groups={allUserGroups}
 *   selectedIds={transaction.sharedGroupIds || []}
 *   onSelect={setSelectedGroupIds}
 *   onClose={() => setShowSelector(false)}
 *   t={t}
 *   theme={theme}
 * />
 * ```
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Users, Trash2 } from 'lucide-react';
import { SHARED_GROUP_LIMITS } from '../../types/sharedGroup';

// =============================================================================
// Types
// =============================================================================

/**
 * Unified group representation for TransactionGroupSelector.
 * Combines personal TransactionGroups and SharedGroups into a single interface.
 */
export interface GroupWithMeta {
  /** Firestore document ID */
  id: string;
  /** Group display name (may include emoji prefix) */
  name: string;
  /** Group color (hex code, e.g., "#10b981") */
  color: string;
  /** Optional emoji icon */
  icon?: string;
  /** True for SharedGroups, false for personal TransactionGroups */
  isShared: boolean;
  /** Number of members (only for shared groups) */
  memberCount?: number;
}

export interface TransactionGroupSelectorProps {
  /** Available groups to select from */
  groups: GroupWithMeta[];
  /** Currently selected group IDs */
  selectedIds: string[];
  /** Callback when selection is confirmed */
  onSelect: (groupIds: string[]) => void;
  /** Callback to close the modal */
  onClose: () => void;
  /** Translation function */
  t: (key: string) => string;
  /** Theme for styling */
  theme: 'light' | 'dark';
  /** Whether groups are still loading */
  isLoading?: boolean;
  /** Read-only mode - view assigned groups without ability to modify */
  readOnly?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function TransactionGroupSelector({
  groups,
  selectedIds,
  onSelect,
  onClose,
  t,
  theme,
  isLoading = false,
  readOnly = false,
}: TransactionGroupSelectorProps): React.ReactElement {
  const isDark = theme === 'dark';
  const maxGroups = SHARED_GROUP_LIMITS.MAX_GROUPS_PER_TRANSACTION;

  // Track originally assigned groups (to show trash icon for removal)
  // This is set once when the modal opens and doesn't change
  const originallyAssigned = useMemo(() => new Set(selectedIds), []);

  // Local selection state (to allow cancel without saving)
  // Deduplicate incoming selectedIds to handle any existing duplicates in data
  const [localSelected, setLocalSelected] = useState<string[]>(() => [...new Set(selectedIds)]);

  // Sync local state when selectedIds prop changes
  useEffect(() => {
    setLocalSelected([...new Set(selectedIds)]);
  }, [selectedIds]);

  // Story 14c.8: All groups are now shared groups (no personal groups)
  const sharedGroups = groups;

  // Check if max selection reached
  const isMaxReached = localSelected.length >= maxGroups;

  // Handle group toggle (disabled in read-only mode)
  const handleToggle = useCallback(
    (groupId: string) => {
      if (readOnly) return;
      setLocalSelected((prev) => {
        const isSelected = prev.includes(groupId);
        if (isSelected) {
          // Deselect
          return prev.filter((id) => id !== groupId);
        } else if (prev.length < maxGroups) {
          // Select (if not at max)
          return [...prev, groupId];
        }
        return prev;
      });
    },
    [maxGroups, readOnly]
  );

  // Handle done button (in read-only mode, just close without saving)
  const handleDone = useCallback(() => {
    if (!readOnly) {
      onSelect(localSelected);
    }
    onClose();
  }, [localSelected, onSelect, onClose, readOnly]);

  // Render a group item
  const renderGroupItem = (group: GroupWithMeta) => {
    const isSelected = localSelected.includes(group.id);
    // Check if this group was originally assigned (will be removed if unchecked)
    const wasOriginallyAssigned = originallyAssigned.has(group.id);
    // Show delete indicator when: originally assigned AND still selected (clicking will remove it)
    const showDeleteIndicator = wasOriginallyAssigned && isSelected && !readOnly;
    // In read-only mode, all items are visually disabled for interaction but selected ones are shown
    const isDisabled = readOnly || (!isSelected && isMaxReached);

    return (
      <button
        key={group.id}
        onClick={() => !isDisabled && handleToggle(group.id)}
        disabled={isDisabled}
        className={`
          w-full flex items-center gap-3 p-3 rounded-xl transition-all
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}
        `}
        style={{
          backgroundColor: isSelected
            ? isDark
              ? 'rgba(34, 197, 94, 0.15)'
              : 'rgba(34, 197, 94, 0.1)'
            : isDark
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.02)',
          border: '1px solid',
          borderColor: isSelected
            ? 'var(--success)'
            : 'var(--border-light)',
        }}
        aria-pressed={isSelected}
        aria-label={`${group.name}, ${group.memberCount || 1} ${t('members')}${showDeleteIndicator ? ', tap to remove' : ''}`}
      >
        {/* Checkbox - shows trash icon for originally assigned groups */}
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            backgroundColor: isSelected
              ? showDeleteIndicator ? 'var(--error)' : 'var(--success)'
              : 'transparent',
            border: '2px solid',
            borderColor: isSelected
              ? showDeleteIndicator ? 'var(--error)' : 'var(--success)'
              : 'var(--border-medium)',
          }}
        >
          {isSelected && (
            showDeleteIndicator
              ? <Trash2 size={12} className="text-white" strokeWidth={2.5} />
              : <Check size={14} className="text-white" strokeWidth={3} />
          )}
        </div>

        {/* Group icon/color indicator - circular with proper emoji sizing */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: group.color || 'var(--primary)',
          }}
        >
          <span
            style={{
              fontSize: '1.5rem',
              lineHeight: 1,
              fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
            }}
          >
            {group.icon || '📁'}
          </span>
        </div>

        {/* Group info */}
        <div className="flex-1 text-left min-w-0">
          <div
            className="font-medium truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {group.name}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="inline-flex items-center gap-1 text-xs"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <Users size={12} />
              {group.memberCount || 1} {t('members')}
            </span>
          </div>
        </div>
      </button>
    );
  };

  const hasGroups = groups.length > 0;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-selector-title"
    >
      {/* Modal content */}
      <div
        className="w-full max-w-lg rounded-t-2xl max-h-[80vh] flex flex-col"
        style={{
          backgroundColor: 'var(--bg)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'var(--border-light)' }}
        >
          <h2
            id="group-selector-title"
            className="font-semibold text-lg"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('selectGroups')}
            <span
              className="ml-2 text-sm font-normal"
              style={{ color: 'var(--text-tertiary)' }}
            >
              ({localSelected.length} {t('of')} {maxGroups})
            </span>
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-95"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
            aria-label={t('close')}
          >
            <X size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl animate-pulse"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                />
              ))}
            </div>
          ) : !hasGroups ? (
            // Empty state
            <div className="py-8 text-center">
              <div
                className="text-4xl mb-3"
                role="img"
                aria-label="No groups"
              >
                📁
              </div>
              <p
                className="text-sm"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {t('noGroupsAvailable')}
              </p>
            </div>
          ) : (
            /* All groups (shared groups only after consolidation) */
            <div className="space-y-2">
              {sharedGroups.map(renderGroupItem)}
            </div>
          )}
        </div>

        {/* Footer with Done button - includes Check icon */}
        <div
          className="px-4 py-3 border-t"
          style={{ borderColor: 'var(--border-light)' }}
        >
          <button
            onClick={handleDone}
            className="w-full py-3 rounded-xl font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
            }}
          >
            <Check size={20} strokeWidth={2.5} />
            {t('done')}
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document.body to escape any overflow:hidden containers
  return createPortal(modalContent, document.body);
}
