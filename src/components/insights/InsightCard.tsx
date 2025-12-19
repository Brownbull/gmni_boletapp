/**
 * InsightCard Component
 *
 * Story 10.6: Scan Complete Insight Card
 * Architecture: architecture-epic10-insight-engine.md
 *
 * Displays a personalized insight after saving a transaction.
 * Features:
 * - Auto-dismiss after 5 seconds (configurable)
 * - Manual dismiss via close button
 * - Slide-up entry animation, fade-out exit animation
 * - Respects prefers-reduced-motion
 * - Dark mode support
 */

import { useEffect, useState, useCallback, ComponentType } from 'react';
import { X, Sparkles, LucideProps } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Insight } from '../../types/insight';

interface InsightCardProps {
  insight: Insight;
  onDismiss: () => void;
  autoDismissMs?: number;
  theme: 'light' | 'dark';
}

// Type-safe icon lookup for lucide-react
type LucideIcon = ComponentType<LucideProps>;

function getIconByName(name: string | undefined): LucideIcon {
  if (!name) return Sparkles;
  const icon = (Icons as unknown as Record<string, LucideIcon>)[name];
  return icon || Sparkles;
}

export function InsightCard({
  insight,
  onDismiss,
  autoDismissMs = 5000,
  theme,
}: InsightCardProps) {
  const [isExiting, setIsExiting] = useState(false);

  // Memoize dismiss handler to avoid useEffect dependency issues
  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    // Wait for exit animation before calling onDismiss
    setTimeout(onDismiss, 200);
  }, [onDismiss]);

  // Auto-dismiss timer (AC #5)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [autoDismissMs, handleDismiss]);

  // Get icon component dynamically from insight.icon string (AC #1)
  // Falls back to Sparkles if icon not found
  const IconComponent = getIconByName(insight.icon);

  // Check reduced motion preference (AC #8)
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Build animation classes
  const animationClasses = prefersReducedMotion
    ? isExiting ? 'opacity-0' : ''
    : isExiting ? 'animate-fade-out' : 'animate-slide-up';

  const isDark = theme === 'dark';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed bottom-20 left-4 right-4 mx-auto max-w-sm
        p-4 rounded-xl shadow-lg z-50
        ${isDark
          ? 'bg-gray-800 text-white border border-gray-700'
          : 'bg-white text-gray-800 border border-gray-200'
        }
        ${animationClasses}
      `}
    >
      {/* Header with icon, title, and close button */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`
            p-2 rounded-lg
            ${isDark ? 'bg-teal-900/50' : 'bg-teal-50'}
          `}>
            <IconComponent
              className={`w-5 h-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`}
            />
          </div>
          <span className={`
            text-sm font-medium
            ${isDark ? 'text-gray-300' : 'text-gray-600'}
          `}>
            {insight.title}
          </span>
        </div>

        {/* Close button (AC #6) */}
        <button
          onClick={handleDismiss}
          className={`
            p-1 rounded-full transition-colors
            ${isDark
              ? 'hover:bg-gray-700 text-gray-400'
              : 'hover:bg-gray-100 text-gray-500'
            }
          `}
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message body */}
      <p className={`
        text-base
        ${isDark ? 'text-white' : 'text-gray-800'}
      `}>
        {insight.message}
      </p>
    </div>
  );
}
