/**
 * InsightsView - Insight History Panel
 *
 * Story 10a.4: Insights History View
 * @see docs/sprint-artifacts/epic10a/story-10a.4-insights-history-view.md
 *
 * Displays chronological list of past insights with temporal filtering.
 *
 * AC1: Insights list renders with icon, title, message, date
 * AC2: Grouped by week (This Week, Last Week, Earlier)
 * AC3: Insight card display with all fields
 * AC4: Navigate to transaction on tap (via modal)
 * AC5: Empty state with suggestion to scan
 * AC6: Backward compatibility for old records
 *
 * Enhancement: Temporal filters + Detail modal on click
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ArrowLeft, Lightbulb, Trash2, X } from 'lucide-react';
import { getUserInsightProfile } from '../services/insightEngineService';
import { InsightHistoryCard } from '../components/insights/InsightHistoryCard';
import { InsightDetailModal } from '../components/insights/InsightDetailModal';
import {
  InsightsTemporalFilter,
  InsightTemporalFilter,
} from '../components/insights/InsightsTemporalFilter';
import { InsightRecord } from '../types/insight';
import { useAuth } from '../hooks/useAuth';
import { useInsightProfile } from '../hooks/useInsightProfile';
import { getISOWeekNumber, LONG_PRESS_DELAY_MS } from '../utils/dateHelpers';

interface InsightsViewProps {
  onBack: () => void;
  onEditTransaction: (transactionId: string) => void;
  theme: string;
  t: (key: string) => string;
}

// Group insights by week (AC2)
type InsightGroup = {
  label: string;
  labelKey: string; // Translation key for i18n
  insights: InsightRecord[];
};

/**
 * Groups insights into "This Week", "Last Week", and "Earlier" buckets.
 * Insights are assumed to already be sorted by date descending.
 */
function groupByWeek(insights: InsightRecord[], t: (key: string) => string): InsightGroup[] {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeek: InsightRecord[] = [];
  const lastWeek: InsightRecord[] = [];
  const earlier: InsightRecord[] = [];

  insights.forEach((insight) => {
    try {
      // Defensive: handle corrupted Timestamp
      if (!insight.shownAt?.toDate) {
        earlier.push(insight);
        return;
      }
      const date = insight.shownAt.toDate();
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        earlier.push(insight);
        return;
      }

      if (date >= oneWeekAgo) {
        thisWeek.push(insight);
      } else if (date >= twoWeeksAgo) {
        lastWeek.push(insight);
      } else {
        earlier.push(insight);
      }
    } catch {
      // Corrupted Timestamp - put in earlier bucket
      earlier.push(insight);
    }
  });

  const groups: InsightGroup[] = [];
  if (thisWeek.length > 0) {
    groups.push({ label: t('thisWeek') || 'This Week', labelKey: 'thisWeek', insights: thisWeek });
  }
  if (lastWeek.length > 0) {
    groups.push({ label: t('lastWeek') || 'Last Week', labelKey: 'lastWeek', insights: lastWeek });
  }
  if (earlier.length > 0) {
    groups.push({ label: t('earlier') || 'Earlier', labelKey: 'earlier', insights: earlier });
  }

  return groups;
}

/**
 * Filters insights based on temporal filter settings.
 */
function filterInsightsByTemporal(
  insights: InsightRecord[],
  filter: InsightTemporalFilter
): InsightRecord[] {
  if (filter.level === 'all') return insights;

  return insights.filter((insight) => {
    try {
      const date = insight.shownAt?.toDate?.();
      if (!(date instanceof Date) || isNaN(date.getTime())) return false;

      const year = date.getFullYear();
      const month = date.getMonth();
      const quarter = Math.floor(month / 3) + 1;

      // Get ISO week number using shared utility
      const week = getISOWeekNumber(date);

      if (filter.level === 'year') {
        return year === filter.year;
      }
      if (filter.level === 'quarter') {
        return year === filter.year && quarter === filter.quarter;
      }
      if (filter.level === 'month') {
        return year === filter.year && month === filter.month;
      }
      if (filter.level === 'week') {
        return year === filter.year && month === filter.month && week === filter.week;
      }
      return true;
    } catch {
      return false;
    }
  });
}

// Unique key for an insight (for selection tracking)
type InsightKey = string;
function getInsightKey(insight: InsightRecord): InsightKey {
  return `${insight.insightId}:${insight.shownAt?.seconds ?? 0}`;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  onBack,
  onEditTransaction,
  theme,
  t,
}) => {
  const { user, services } = useAuth();
  const { removeInsight, removeInsights } = useInsightProfile(user, services);
  const [insights, setInsights] = useState<InsightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [temporalFilter, setTemporalFilter] = useState<InsightTemporalFilter>({ level: 'all' });
  const [selectedInsight, setSelectedInsight] = useState<InsightRecord | null>(null);

  // Batch selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<InsightKey>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  useEffect(() => {
    async function loadInsights() {
      if (!user || !services) {
        setLoading(false);
        return;
      }
      try {
        const profile = await getUserInsightProfile(services.db, user.uid, services.appId);
        if (profile?.recentInsights) {
          // Sort by date descending (most recent first)
          const sorted = [...profile.recentInsights].sort((a, b) => {
            try {
              const aTime = a.shownAt?.toDate?.()?.getTime?.() ?? 0;
              const bTime = b.shownAt?.toDate?.()?.getTime?.() ?? 0;
              return bTime - aTime;
            } catch {
              return 0;
            }
          });
          setInsights(sorted);
        }
      } catch (error) {
        console.error('Failed to load insights:', error);
      } finally {
        setLoading(false);
      }
    }
    loadInsights();
  }, [user, services]);

  // Apply temporal filter
  const filteredInsights = useMemo(
    () => filterInsightsByTemporal(insights, temporalFilter),
    [insights, temporalFilter]
  );

  // Group filtered insights by week
  const groupedInsights = useMemo(
    () => groupByWeek(filteredInsights, t),
    [filteredInsights, t]
  );

  // Long press handling for batch selection
  const handleLongPressStart = useCallback((insight: InsightRecord) => {
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      setSelectionMode(true);
      setSelectedKeys(new Set([getInsightKey(insight)]));
    }, LONG_PRESS_DELAY_MS);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Handle insight click - either toggle selection or show modal
  const handleInsightClick = useCallback((insight: InsightRecord) => {
    // If long press was triggered, don't open modal
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }

    if (selectionMode) {
      // Toggle selection
      const key = getInsightKey(insight);
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    } else {
      setSelectedInsight(insight);
    }
  }, [selectionMode]);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setSelectedInsight(null);
  }, []);

  // Navigate to transaction from modal
  const handleNavigateToTransaction = useCallback(() => {
    if (selectedInsight?.transactionId) {
      onEditTransaction(selectedInsight.transactionId);
      setSelectedInsight(null);
    }
  }, [selectedInsight, onEditTransaction]);

  // Delete single insight from modal
  const handleDeleteInsight = useCallback(async () => {
    if (!selectedInsight) return;
    await removeInsight(
      selectedInsight.insightId,
      selectedInsight.shownAt?.seconds ?? 0
    );
    // Update local state
    setInsights((prev) =>
      prev.filter((i) => getInsightKey(i) !== getInsightKey(selectedInsight))
    );
  }, [selectedInsight, removeInsight]);

  // Delete selected insights (batch)
  const handleDeleteSelected = useCallback(async () => {
    if (selectedKeys.size === 0) return;
    setIsDeleting(true);
    try {
      // Build list of insights to delete
      const toDelete = insights
        .filter((i) => selectedKeys.has(getInsightKey(i)))
        .map((i) => ({
          insightId: i.insightId,
          shownAtSeconds: i.shownAt?.seconds ?? 0,
        }));

      await removeInsights(toDelete);

      // Update local state
      setInsights((prev) =>
        prev.filter((i) => !selectedKeys.has(getInsightKey(i)))
      );
      setSelectedKeys(new Set());
      setSelectionMode(false);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedKeys, insights, removeInsights]);

  // Exit selection mode
  const handleCancelSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedKeys(new Set());
  }, []);

  // Select all filtered insights
  const handleSelectAll = useCallback(() => {
    const allKeys = new Set(filteredInsights.map(getInsightKey));
    setSelectedKeys(allKeys);
  }, [filteredInsights]);

  // Check if all are selected
  const allSelected = filteredInsights.length > 0 && selectedKeys.size === filteredInsights.length;

  // Loading state
  if (loading) {
    return (
      <div className="pb-24">
        <button
          onClick={onBack}
          className="mb-4 min-w-11 min-h-11 flex items-center justify-center"
          style={{ color: 'var(--primary)' }}
        >
          <ArrowLeft size={24} strokeWidth={2} />
        </button>
        <h1
          className="text-2xl font-bold mb-6"
          style={{ color: 'var(--primary)' }}
        >
          {t('insights')}
        </h1>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header with back button */}
      <button
        onClick={onBack}
        className="mb-4 min-w-11 min-h-11 flex items-center justify-center"
        style={{ color: 'var(--primary)' }}
      >
        <ArrowLeft size={24} strokeWidth={2} />
      </button>

      {/* Title row with filter on right */}
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--primary)' }}
        >
          {t('insights')}
        </h1>
        {insights.length > 0 && (
          <InsightsTemporalFilter
            insights={insights}
            filter={temporalFilter}
            onFilterChange={setTemporalFilter}
            theme={theme}
            t={t}
          />
        )}
      </div>

      {/* Selection Mode Toolbar */}
      {/* Story 11.6: Position above nav bar accounting for safe area (AC #3) */}
      {selectionMode && (
        <div
          className="fixed left-4 right-4 z-40 p-3 rounded-xl shadow-lg flex items-center justify-between"
          style={{
            backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
            borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
            borderWidth: 1,
            bottom: 'calc(5rem + var(--safe-bottom, 0px))',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancelSelection}
              className="p-2 rounded-full transition-colors min-w-10 min-h-10 flex items-center justify-center"
              style={{ color: 'var(--primary)' }}
              aria-label={t('close') || 'Close'}
            >
              <X size={20} />
            </button>
            <span style={{ color: 'var(--primary)' }}>
              {selectedKeys.size} {t('selected') || 'selected'}
            </span>
          </div>
          {/* Story 14.16b: Using --error CSS variable for destructive action */}
          <button
            onClick={handleDeleteSelected}
            disabled={selectedKeys.size === 0 || isDeleting}
            className="py-2 px-3 rounded-lg font-medium flex items-center gap-1.5 min-h-10 transition-colors text-sm"
            style={{
              backgroundColor: selectedKeys.size > 0
                ? (theme === 'dark' ? 'var(--negative-bg)' : 'var(--negative-bg)')
                : (theme === 'dark' ? '#374151' : '#f3f4f6'),
              color: selectedKeys.size > 0 ? 'var(--error)' : (theme === 'dark' ? '#6b7280' : '#9ca3af'),
              opacity: isDeleting ? 0.6 : 1,
            }}
          >
            <Trash2 size={16} />
            {isDeleting ? (t('deleting') || 'Deleting...') : (t('delete') || 'Delete')}
          </button>
        </div>
      )}

      {/* AC5: Empty state */}
      {insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Lightbulb
            size={48}
            className="mb-4 opacity-50"
            style={{ color: 'var(--secondary)' }}
          />
          <p
            className="text-lg font-medium mb-2"
            style={{ color: 'var(--primary)' }}
          >
            {t('noInsightsYet')}
          </p>
          <p className="text-sm" style={{ color: 'var(--secondary)' }}>
            {t('scanMoreReceipts')}
          </p>
        </div>
      ) : filteredInsights.length === 0 ? (
        /* No results for current filter */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Lightbulb
            size={48}
            className="mb-4 opacity-50"
            style={{ color: 'var(--secondary)' }}
          />
          <p
            className="text-lg font-medium mb-2"
            style={{ color: 'var(--primary)' }}
          >
            {t('noInsightsForPeriod') || 'No insights for this period'}
          </p>
          <p className="text-sm" style={{ color: 'var(--secondary)' }}>
            {t('tryDifferentFilter') || 'Try selecting a different time period'}
          </p>
        </div>
      ) : (
        /* AC1 & AC2: Grouped insights list */
        <div className="space-y-6">
          {groupedInsights.map((group, groupIdx) => (
            <div key={group.labelKey}>
              <div className="flex items-center justify-between mb-3">
                <h2
                  className="text-sm font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--secondary)' }}
                >
                  {group.label}
                </h2>
                {/* Show Select All only on first group when in selection mode */}
                {selectionMode && groupIdx === 0 && (
                  <button
                    onClick={allSelected ? handleCancelSelection : handleSelectAll}
                    className="text-sm font-medium"
                    style={{ color: '#3b82f6' }}
                  >
                    {allSelected ? (t('deselectAll') || 'Deselect All') : (t('selectAll') || 'Select All')}
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {group.insights.map((insight, idx) => (
                  <InsightHistoryCard
                    key={`${insight.insightId}-${idx}`}
                    insight={insight}
                    onClick={() => handleInsightClick(insight)}
                    onLongPressStart={() => handleLongPressStart(insight)}
                    onLongPressEnd={handleLongPressEnd}
                    isSelected={selectedKeys.has(getInsightKey(insight))}
                    selectionMode={selectionMode}
                    theme={theme}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedInsight && (
        <InsightDetailModal
          insight={selectedInsight}
          onClose={handleCloseModal}
          onNavigateToTransaction={handleNavigateToTransaction}
          onDelete={handleDeleteInsight}
          theme={theme}
          t={t}
        />
      )}
    </div>
  );
};
