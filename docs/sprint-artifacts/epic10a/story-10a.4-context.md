# Story 10a.4 Context: Insights History View

**Story:** 10a.4 - Insights History View
**Points:** 5
**Status:** Ready for Development
**Dependencies:** Story 10a.5 (InsightRecord storage)

---

## Implementation Summary

Create a new InsightsView that displays the user's insight history, grouped by week, with the ability to navigate to the source transaction.

---

## File Changes

### 1. Create `src/views/InsightsView.tsx`

```typescript
/**
 * InsightsView - Insight History Panel
 *
 * Story 10a.4: Insights History View
 * Displays chronological list of past insights grouped by week.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Lightbulb, Inbox } from 'lucide-react';
import { getUserInsightProfile } from '../services/insightEngineService';
import { InsightHistoryCard } from '../components/insights/InsightHistoryCard';
import { InsightRecord } from '../types/insight';
import { useAuth } from '../contexts/AuthContext';

interface InsightsViewProps {
    onBack: () => void;
    onEditTransaction: (transactionId: string) => void;
    theme: string;
    t: (key: string) => string;
}

// Group insights by week
type InsightGroup = {
    label: string;  // "This Week", "Last Week", "Earlier"
    insights: InsightRecord[];
};

function groupByWeek(insights: InsightRecord[]): InsightGroup[] {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek: InsightRecord[] = [];
    const lastWeek: InsightRecord[] = [];
    const earlier: InsightRecord[] = [];

    insights.forEach(insight => {
        const date = insight.shownAt.toDate();
        if (date >= oneWeekAgo) {
            thisWeek.push(insight);
        } else if (date >= twoWeeksAgo) {
            lastWeek.push(insight);
        } else {
            earlier.push(insight);
        }
    });

    const groups: InsightGroup[] = [];
    if (thisWeek.length > 0) groups.push({ label: 'This Week', insights: thisWeek });
    if (lastWeek.length > 0) groups.push({ label: 'Last Week', insights: lastWeek });
    if (earlier.length > 0) groups.push({ label: 'Earlier', insights: earlier });

    return groups;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
    onBack,
    onEditTransaction,
    theme,
    t,
}) => {
    const { user } = useAuth();
    const [insights, setInsights] = useState<InsightRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadInsights() {
            if (!user) return;
            try {
                const profile = await getUserInsightProfile(user.uid);
                // Sort by date descending (most recent first)
                const sorted = (profile?.recentInsights || []).sort((a, b) =>
                    b.shownAt.toDate().getTime() - a.shownAt.toDate().getTime()
                );
                setInsights(sorted);
            } catch (error) {
                console.error('Failed to load insights:', error);
            } finally {
                setLoading(false);
            }
        }
        loadInsights();
    }, [user]);

    const groupedInsights = useMemo(() => groupByWeek(insights), [insights]);

    const handleInsightClick = (transactionId?: string) => {
        if (transactionId) {
            onEditTransaction(transactionId);
        }
    };

    const isDark = theme === 'dark';

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
        );
    }

    return (
        <div className="pb-24">
            {/* Header */}
            <button
                onClick={onBack}
                className="mb-4 min-w-11 min-h-11 flex items-center justify-center"
                style={{ color: 'var(--primary)' }}
            >
                <ArrowLeft size={24} strokeWidth={2} />
            </button>
            <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--primary)' }}>
                {t('insights')}
            </h1>

            {/* Empty state */}
            {insights.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Lightbulb size={48} className="mb-4 opacity-50" style={{ color: 'var(--secondary)' }} />
                    <p className="text-lg font-medium mb-2" style={{ color: 'var(--primary)' }}>
                        {t('noInsightsYet') || 'No insights yet'}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--secondary)' }}>
                        {t('scanMoreReceipts') || 'Scan more receipts to see insights here'}
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {groupedInsights.map(group => (
                        <div key={group.label}>
                            <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide"
                                style={{ color: 'var(--secondary)' }}>
                                {group.label}
                            </h2>
                            <div className="space-y-3">
                                {group.insights.map((insight, idx) => (
                                    <InsightHistoryCard
                                        key={`${insight.insightId}-${idx}`}
                                        insight={insight}
                                        onClick={() => handleInsightClick(insight.transactionId)}
                                        theme={theme}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
```

---

### 2. Create `src/components/insights/InsightHistoryCard.tsx`

```typescript
/**
 * InsightHistoryCard - Display a single historical insight
 *
 * Story 10a.4: Insights History View
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { InsightRecord } from '../../types/insight';

interface InsightHistoryCardProps {
    insight: InsightRecord;
    onClick: () => void;
    theme: string;
}

export const InsightHistoryCard: React.FC<InsightHistoryCardProps> = ({
    insight,
    onClick,
    theme,
}) => {
    const isDark = theme === 'dark';

    // Get icon component dynamically
    const IconComponent = insight.icon
        ? (LucideIcons as any)[insight.icon] || LucideIcons.Lightbulb
        : LucideIcons.Lightbulb;

    // Format date
    const date = insight.shownAt.toDate();
    const formattedDate = date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });

    // Fallback for old records without title/message
    const title = insight.title || insight.insightId.replace(/_/g, ' ');
    const message = insight.message || '';

    return (
        <div
            onClick={onClick}
            className="p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01]"
            style={{
                backgroundColor: 'var(--surface)',
                borderColor: isDark ? '#334155' : '#e2e8f0',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = isDark ? '#334155' : '#e2e8f0'; }}
        >
            <div className="flex gap-3">
                {/* Icon */}
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }}
                >
                    <IconComponent size={20} style={{ color: 'var(--accent)' }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="font-semibold capitalize" style={{ color: 'var(--primary)' }}>
                        {title}
                    </div>
                    {message && (
                        <div className="text-sm mt-0.5" style={{ color: 'var(--secondary)' }}>
                            {message}
                        </div>
                    )}
                    <div className="text-xs mt-1" style={{ color: 'var(--secondary)', opacity: 0.7 }}>
                        {formattedDate}
                    </div>
                </div>
            </div>
        </div>
    );
};
```

---

### 3. Update `src/App.tsx`

Add InsightsView to the routing:

```tsx
import { InsightsView } from './views/InsightsView';

// ... in render
{view === 'insights' && (
    <InsightsView
        onBack={() => setView('dashboard')}
        onEditTransaction={(txId) => {
            // Find transaction by ID and navigate to edit
            const tx = transactions.find(t => t.id === txId);
            if (tx) {
                setSelectedTransaction(tx);
                setView('edit');
            }
        }}
        theme={theme}
        t={t}
    />
)}
```

---

### 4. Update `src/utils/translations.ts`

Add new translation keys:

```typescript
noInsightsYet: {
    en: 'No insights yet',
    es: 'Sin ideas todavía',
},
scanMoreReceipts: {
    en: 'Scan more receipts to see insights here',
    es: 'Escanea más boletas para ver ideas aquí',
},
```

---

## Testing Checklist

- [ ] InsightsView loads and displays insights
- [ ] Insights grouped correctly (This Week, Last Week, Earlier)
- [ ] Each card shows icon, title, message, date
- [ ] Clicking insight navigates to transaction
- [ ] Empty state shows when no insights
- [ ] Old InsightRecords without title/message display fallback

---

## Estimated Time

~2-3 hours
