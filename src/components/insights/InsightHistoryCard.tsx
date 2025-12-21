/**
 * InsightHistoryCard - Display a single historical insight
 *
 * Story 10a.4: Insights History View
 * @see docs/sprint-artifacts/epic10a/story-10a.4-insights-history-view.md
 *
 * AC3: Insight Card Display - Shows icon, title, message, date
 * AC6: Backward Compatibility - Falls back to insightId if title/message missing
 *
 * Enhancement: Type-specific icons and colors per insight type
 */

import React from 'react';
import { InsightRecord } from '../../types/insight';
import {
  getInsightConfig,
  getIconByName,
  getInsightFallbackMessage,
} from '../../utils/insightTypeConfig';

interface InsightHistoryCardProps {
  insight: InsightRecord;
  onClick: () => void;
  onLongPressStart?: () => void;
  onLongPressEnd?: () => void;
  isSelected?: boolean;
  selectionMode?: boolean;
  theme: string;
}

export const InsightHistoryCard: React.FC<InsightHistoryCardProps> = ({
  insight,
  onClick,
  onLongPressStart,
  onLongPressEnd,
  isSelected = false,
  selectionMode = false,
  theme,
}) => {
  const isDark = theme === 'dark';

  // Get config based on insight type
  const config = getInsightConfig(insight.insightId, insight.category, isDark);
  const IconComponent = getIconByName(insight.icon || config.icon);

  // Format date - show year only if different from current year
  const formatDate = (timestamp: { toDate?: () => Date }) => {
    try {
      // Defensive: handle corrupted Timestamp
      if (!timestamp?.toDate) {
        return '';
      }
      const date = timestamp.toDate();
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return '';
      }
      const currentYear = new Date().getFullYear();
      const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        ...(date.getFullYear() !== currentYear && { year: 'numeric' }),
      };
      return date.toLocaleDateString(undefined, options);
    } catch {
      // Corrupted Timestamp - return empty string
      return '';
    }
  };

  const formattedDate = formatDate(insight.shownAt);

  // AC6: Fallback for old records without title/message
  // Convert snake_case insightId to readable title (e.g., "merchant_frequency" -> "Merchant Frequency")
  const title = insight.title || insight.insightId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  // Use insight-specific fallback message for old records
  const message = insight.message || getInsightFallbackMessage(insight.insightId);

  // Border color based on selection state
  const getBorderColor = () => {
    if (isSelected) return '#3b82f6'; // blue-500
    return isDark ? '#334155' : '#e2e8f0';
  };

  // Keyboard handler for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
    // Shift+Enter to toggle selection (accessibility for long-press alternative)
    if (e.key === 'Enter' && e.shiftKey && onLongPressStart) {
      e.preventDefault();
      onLongPressStart();
      // Immediately trigger selection (no delay for keyboard)
      setTimeout(() => onLongPressEnd?.(), 10);
    }
  };

  return (
    <div
      onClick={onClick}
      onMouseDown={onLongPressStart}
      onMouseUp={onLongPressEnd}
      onMouseLeave={onLongPressEnd}
      onTouchStart={onLongPressStart}
      onTouchEnd={onLongPressEnd}
      onTouchCancel={onLongPressEnd}
      className="p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
      style={{
        backgroundColor: isSelected
          ? (isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)')
          : 'var(--surface)',
        borderColor: getBorderColor(),
        borderWidth: isSelected ? '2px' : '1px',
      }}
      onMouseEnter={(e) => {
        if (!isSelected && !selectionMode) {
          e.currentTarget.style.borderColor = config.color;
        }
      }}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${title}${message ? `: ${message}` : ''}${formattedDate ? ` - ${formattedDate}` : ''}`}
      aria-pressed={selectionMode ? isSelected : undefined}
    >
      <div className="flex gap-3 items-center">
        {/* Selection checkbox in selection mode */}
        {selectionMode && (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors"
            style={{
              borderColor: isSelected ? '#3b82f6' : (isDark ? '#6b7280' : '#9ca3af'),
              backgroundColor: isSelected ? '#3b82f6' : 'transparent',
            }}
            aria-hidden="true"
          >
            {isSelected && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>
        )}

        {/* Icon with type-specific color - centered vertically */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: config.bgColor }}
          aria-hidden="true"
        >
          <IconComponent size={20} style={{ color: config.color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row with date on the right */}
          <div className="flex items-center justify-between gap-2">
            <div
              className="font-semibold capitalize truncate"
              style={{ color: 'var(--primary)' }}
            >
              {title}
            </div>
            {formattedDate && (
              <div
                className="text-xs flex-shrink-0"
                style={{ color: 'var(--secondary)', opacity: 0.7 }}
              >
                {formattedDate}
              </div>
            )}
          </div>
          {message && (
            <div
              className="text-sm mt-0.5 line-clamp-2"
              style={{ color: 'var(--secondary)' }}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
