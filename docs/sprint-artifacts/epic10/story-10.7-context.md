# Story 10.7 Context: Batch Mode Summary

**Purpose:** Context document for implementing batch scanning mode with summary view.
**Architecture:** [architecture-epic10-insight-engine.md](./architecture-epic10-insight-engine.md)
**Updated:** 2025-12-17 (Architecture-Aligned)

---

## Target Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useBatchSession.ts` | Track batch session state |
| `src/components/insights/BatchSummary.tsx` | Summary card component |

## Target Files to Modify

| File | Changes |
|------|---------|
| `src/services/insightEngineService.ts` | Add silence functions, getLastWeekTotal |
| `src/App.tsx` | Integrate batch mode |

---

## Dependencies

**Must exist before this story:**
- Story 10.6: `InsightCard`, insight state management
- Story 10.1: `LocalInsightCache` type with `silencedUntil`

---

## Two User Modes

From brainstorming session:

1. **Real-Time Scanner:** Scans 1-2 receipts
   - Shows individual InsightCard after each save
   - Standard flow from Story 10.6

2. **Batch Scanner:** Scans 3+ receipts in succession
   - Shows unified BatchSummary instead of individual cards
   - Includes historical comparison
   - Option to silence insights

---

## Batch Session Hook

```typescript
interface BatchSession {
  receipts: Transaction[];
  insights: Insight[];
  startedAt: Date;
  totalAmount: number;
}

interface UseBatchSessionReturn {
  session: BatchSession | null;
  addToBatch: (tx: Transaction, insight: Insight | null) => void;
  clearBatch: () => void;
  isBatchMode: boolean;  // true when receipts.length >= 3
}
```

**Session Rules:**
- BATCH_THRESHOLD = 3 receipts
- SESSION_TIMEOUT_MS = 30 minutes
- Session auto-expires after timeout

---

## Silence Feature

**Purpose:** Let users silence insights during shopping trips

```typescript
// In LocalInsightCache (from Story 10.1)
interface LocalInsightCache {
  // ... other fields
  silencedUntil: string | null;  // ISO timestamp or null
}

// Silence functions to add
const SILENCE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

export function isInsightsSilenced(cache: LocalInsightCache): boolean {
  if (!cache.silencedUntil) return false;
  return new Date(cache.silencedUntil) > new Date();
}

export function silenceInsights(cache: LocalInsightCache): LocalInsightCache {
  return {
    ...cache,
    silencedUntil: new Date(Date.now() + SILENCE_DURATION_MS).toISOString(),
  };
}

export function unsilenceInsights(cache: LocalInsightCache): LocalInsightCache {
  return { ...cache, silencedUntil: null };
}
```

---

## Historical Comparison

```typescript
// Get last week's total for comparison
export function getLastWeekTotal(transactions: Transaction[]): number {
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(now.getDate() - 14);

  return transactions
    .filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= twoWeeksAgo && txDate < oneWeekAgo;
    })
    .reduce((sum, tx) => sum + tx.total, 0);
}
```

---

## BatchSummary Props

```typescript
interface BatchSummaryProps {
  receipts: Transaction[];
  insights: Insight[];
  totalAmount: number;
  lastWeekTotal?: number;
  onSilence: () => void;
  onDismiss: () => void;
  isSilenced: boolean;
  theme: 'light' | 'dark';
}
```

---

## Top Insight Selection

BatchSummary shows the "best" insight from the batch:

```typescript
const topInsight = insights.length > 0
  ? insights.reduce((best, current) =>
      current.priority > best.priority ? current : best
    )
  : null;
```

---

## Integration Flow

```typescript
// In saveTransaction handler
const saveTransaction = async (transaction: Transaction) => {
  const savedId = await addTransaction(...);
  setShowSavedToast(true);
  setView('dashboard');

  // Check if silenced
  if (isInsightsSilenced(localCache)) {
    addToBatch({ ...transaction, id: savedId }, null);
    return;
  }

  // Generate insight
  generateInsightForTransaction(...)
    .then(insight => {
      addToBatch({ ...transaction, id: savedId }, insight);

      // Show batch summary OR individual card
      if (isBatchMode) {
        setShowBatchSummary(true);
        setShowInsightCard(false);
      } else {
        setCurrentInsight(insight);
        setShowInsightCard(true);
      }
    });
};
```

---

## UI Layout

```
┌──────────────────────────────────────┐
│  Resumen de escaneo          [Cerrar]│
│                                      │
│  ┌────────────┐  ┌────────────┐     │
│  │Total       │  │Boletas     │     │
│  │$45,000     │  │ 📄 5       │     │
│  └────────────┘  └────────────┘     │
│                                      │
│  ↘ 15% menos que la semana pasada   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ 💡 Top insight message       │   │
│  └──────────────────────────────┘   │
│                                      │
│  [ 🔔 Silenciar insights (4h) ]     │
└──────────────────────────────────────┘
```

---

## Dark Mode Colors

| Element | Light | Dark |
|---------|-------|------|
| Background | `bg-white` | `bg-gray-800` |
| Stats card bg | `bg-gray-50` | `bg-gray-700/50` |
| Comparison (down) | `bg-green-50` | `bg-green-900/30` |
| Comparison (up) | `bg-orange-50` | `bg-orange-900/30` |
| Top insight bg | `bg-teal-50` | `bg-teal-900/30` |
| Silence btn active | `bg-purple-100` | `bg-purple-900/50` |

---

## Key Behavior Notes

1. **Batch threshold:** 3 receipts triggers batch mode
2. **Session timeout:** 30 minutes of inactivity clears session
3. **Silence duration:** 4 hours
4. **Silence persists:** Stored in localStorage via LocalInsightCache
5. **When silenced:** Insights tracked but not displayed
6. **Top insight:** Highest priority insight shown in summary
