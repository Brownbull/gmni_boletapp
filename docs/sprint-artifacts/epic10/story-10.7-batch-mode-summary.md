# Story 10.7: Batch Mode Summary

**Epic:** Epic 10 - Foundation + Engagement & Insight Engine
**Status:** ready-for-dev
**Story Points:** 3
**Dependencies:** Story 10.6 (Scan Complete Insight Card)

---

## User Story

As a **batch scanner**,
I want **a unified summary after scanning multiple receipts**,
So that **I see the big picture instead of individual insights**.

---

## Architecture Reference

**Architecture Document:** [architecture-epic10-insight-engine.md](../../planning/architecture-epic10-insight-engine.md)
**Brainstorming Document:** [epic-10-insight-engine-brainstorm.md](../../planning/epic-10-insight-engine-brainstorm.md)

---

## Acceptance Criteria

- [ ] **AC #1:** BatchSummary component shows after 3+ receipts in one session
- [ ] **AC #2:** Summary shows total amount scanned in session
- [ ] **AC #3:** Summary shows receipt count
- [ ] **AC #4:** Historical comparison vs last week shown (if data available)
- [ ] **AC #5:** Top insight from batch is highlighted
- [ ] **AC #6:** "Silenciar 4h" option queues insights for later
- [ ] **AC #7:** When silenced, individual InsightCards don't appear
- [ ] **AC #8:** Silenced state persists in localStorage
- [ ] **AC #9:** Summary respects dark mode

---

## Tasks / Subtasks

### Task 1: Track Batch Session State (0.5h)

Add to `src/hooks/useBatchSession.ts`:

```typescript
import { useState, useCallback, useEffect } from 'react';
import { Transaction } from '../types/transaction';
import { Insight } from '../types/insight';

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
  isBatchMode: boolean;
}

const BATCH_THRESHOLD = 3;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function useBatchSession(): UseBatchSessionReturn {
  const [session, setSession] = useState<BatchSession | null>(null);

  // Check if session is still active
  useEffect(() => {
    if (!session) return;

    const elapsed = Date.now() - session.startedAt.getTime();
    if (elapsed > SESSION_TIMEOUT_MS) {
      setSession(null);
    }
  }, [session]);

  const addToBatch = useCallback((tx: Transaction, insight: Insight | null) => {
    setSession(prev => {
      const now = new Date();

      // Start new session if none exists or expired
      if (!prev || (Date.now() - prev.startedAt.getTime()) > SESSION_TIMEOUT_MS) {
        return {
          receipts: [tx],
          insights: insight ? [insight] : [],
          startedAt: now,
          totalAmount: tx.total,
        };
      }

      // Add to existing session
      return {
        ...prev,
        receipts: [...prev.receipts, tx],
        insights: insight ? [...prev.insights, insight] : prev.insights,
        totalAmount: prev.totalAmount + tx.total,
      };
    });
  }, []);

  const clearBatch = useCallback(() => {
    setSession(null);
  }, []);

  return {
    session,
    addToBatch,
    clearBatch,
    isBatchMode: (session?.receipts.length ?? 0) >= BATCH_THRESHOLD,
  };
}
```

### Task 2: Create BatchSummary Component (1h)

Create `src/components/insights/BatchSummary.tsx`:

```typescript
import React from 'react';
import { Receipt, TrendingUp, TrendingDown, Bell, BellOff } from 'lucide-react';
import { Transaction } from '../../types/transaction';
import { Insight } from '../../types/insight';

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

export function BatchSummary({
  receipts,
  insights,
  totalAmount,
  lastWeekTotal,
  onSilence,
  onDismiss,
  isSilenced,
  theme,
}: BatchSummaryProps) {
  // Find top insight (highest priority)
  const topInsight = insights.length > 0
    ? insights.reduce((best, current) =>
        current.priority > best.priority ? current : best
      )
    : null;

  // Calculate comparison
  const comparison = lastWeekTotal && lastWeekTotal > 0
    ? ((totalAmount - lastWeekTotal) / lastWeekTotal) * 100
    : null;

  return (
    <div
      role="dialog"
      aria-label="Resumen de escaneo"
      className={`
        fixed inset-x-4 bottom-20 mx-auto max-w-md
        p-5 rounded-2xl shadow-xl
        ${theme === 'dark'
          ? 'bg-gray-800 text-white border border-gray-700'
          : 'bg-white text-gray-800 border border-gray-200'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className={`
          text-lg font-semibold
          ${theme === 'dark' ? 'text-white' : 'text-gray-900'}
        `}>
          Resumen de escaneo
        </h2>
        <button
          onClick={onDismiss}
          className={`
            text-sm px-3 py-1 rounded-full
            ${theme === 'dark'
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          Cerrar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Total Amount */}
        <div className={`
          p-3 rounded-xl
          ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}
        `}>
          <p className={`
            text-sm
            ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}
          `}>
            Total escaneado
          </p>
          <p className={`
            text-xl font-bold
            ${theme === 'dark' ? 'text-white' : 'text-gray-900'}
          `}>
            ${totalAmount.toLocaleString('es-CL')}
          </p>
        </div>

        {/* Receipt Count */}
        <div className={`
          p-3 rounded-xl
          ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}
        `}>
          <p className={`
            text-sm
            ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}
          `}>
            Boletas
          </p>
          <div className="flex items-center gap-2">
            <Receipt className={`w-5 h-5 ${theme === 'dark' ? 'text-teal-400' : 'text-teal-600'}`} />
            <p className={`
              text-xl font-bold
              ${theme === 'dark' ? 'text-white' : 'text-gray-900'}
            `}>
              {receipts.length}
            </p>
          </div>
        </div>
      </div>

      {/* Historical Comparison */}
      {comparison !== null && (
        <div className={`
          flex items-center gap-2 p-3 rounded-xl mb-4
          ${comparison < 0
            ? (theme === 'dark' ? 'bg-green-900/30' : 'bg-green-50')
            : (theme === 'dark' ? 'bg-orange-900/30' : 'bg-orange-50')
          }
        `}>
          {comparison < 0 ? (
            <TrendingDown className="w-5 h-5 text-green-500" />
          ) : (
            <TrendingUp className="w-5 h-5 text-orange-500" />
          )}
          <p className={`
            text-sm
            ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}
          `}>
            {comparison < 0
              ? `${Math.abs(Math.round(comparison))}% menos que la semana pasada`
              : `${Math.round(comparison)}% más que la semana pasada`
            }
          </p>
        </div>
      )}

      {/* Top Insight */}
      {topInsight && (
        <div className={`
          p-3 rounded-xl mb-4
          ${theme === 'dark' ? 'bg-teal-900/30' : 'bg-teal-50'}
        `}>
          <p className={`
            text-sm font-medium mb-1
            ${theme === 'dark' ? 'text-teal-400' : 'text-teal-700'}
          `}>
            {topInsight.title}
          </p>
          <p className={`
            text-sm
            ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}
          `}>
            {topInsight.message}
          </p>
        </div>
      )}

      {/* Silence Toggle */}
      <button
        onClick={onSilence}
        className={`
          w-full flex items-center justify-center gap-2
          py-3 rounded-xl transition-colors
          ${isSilenced
            ? (theme === 'dark'
                ? 'bg-purple-900/50 text-purple-300'
                : 'bg-purple-100 text-purple-700')
            : (theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
          }
        `}
      >
        {isSilenced ? (
          <>
            <BellOff className="w-4 h-4" />
            <span>Insights silenciados (4h)</span>
          </>
        ) : (
          <>
            <Bell className="w-4 h-4" />
            <span>Silenciar insights (4h)</span>
          </>
        )}
      </button>
    </div>
  );
}
```

### Task 3: Implement Silence Logic (0.5h)

Add silence management to `src/services/insightEngineService.ts`:

```typescript
const SILENCE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Checks if insights are currently silenced.
 */
export function isInsightsSilenced(cache: LocalInsightCache): boolean {
  if (!cache.silencedUntil) return false;

  const silencedUntil = new Date(cache.silencedUntil);
  return silencedUntil > new Date();
}

/**
 * Silences insights for 4 hours.
 */
export function silenceInsights(cache: LocalInsightCache): LocalInsightCache {
  const silencedUntil = new Date(Date.now() + SILENCE_DURATION_MS);
  return {
    ...cache,
    silencedUntil: silencedUntil.toISOString(),
  };
}

/**
 * Unsilences insights.
 */
export function unsilenceInsights(cache: LocalInsightCache): LocalInsightCache {
  return {
    ...cache,
    silencedUntil: null,
  };
}
```

### Task 4: Calculate Historical Comparison (0.5h)

Add to `src/services/insightEngineService.ts`:

```typescript
/**
 * Calculates total spending from last week for comparison.
 */
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

### Task 5: Integration with App (0.5h)

Update `src/App.tsx`:

```typescript
import { useBatchSession } from './hooks/useBatchSession';
import { BatchSummary } from './components/insights/BatchSummary';
import {
  isInsightsSilenced,
  silenceInsights,
  getLastWeekTotal,
} from './services/insightEngineService';

// In App component
const { session, addToBatch, clearBatch, isBatchMode } = useBatchSession();
const [showBatchSummary, setShowBatchSummary] = useState(false);

// In saveTransaction handler
const saveTransaction = async (transaction: Transaction) => {
  const savedId = await addTransaction(db, userId, appId, transaction);
  setShowSavedToast(true);
  setView('dashboard');

  // Check if silenced
  if (isInsightsSilenced(localCache)) {
    // Just track for batch summary, don't generate insight
    addToBatch({ ...transaction, id: savedId }, null);
    return;
  }

  // Generate insight
  generateInsightForTransaction(/*...*/)
    .then(insight => {
      addToBatch({ ...transaction, id: savedId }, insight);

      // Show batch summary if threshold reached
      if (isBatchMode) {
        setShowBatchSummary(true);
        setShowInsightCard(false);
      } else {
        setCurrentInsight(insight);
        setShowInsightCard(true);
      }
    });
};

// Handle silence toggle
const handleSilence = () => {
  const newCache = isInsightsSilenced(localCache)
    ? unsilenceInsights(localCache)
    : silenceInsights(localCache);
  setLocalCache(newCache);
};

// Render BatchSummary
{showBatchSummary && session && (
  <BatchSummary
    receipts={session.receipts}
    insights={session.insights}
    totalAmount={session.totalAmount}
    lastWeekTotal={getLastWeekTotal(transactions)}
    onSilence={handleSilence}
    onDismiss={() => {
      setShowBatchSummary(false);
      clearBatch();
    }}
    isSilenced={isInsightsSilenced(localCache)}
    theme={theme}
  />
)}
```

---

## Technical Summary

This story implements **batch mode** - a summary view for users who scan multiple receipts in one session.

**Two User Modes (from Brainstorming):**

1. **Real-Time Scanner:** Scans one receipt at a time
   - Shows individual InsightCard after each save
   - "Silenciar 4h" queues insights

2. **Batch Scanner:** Scans 3+ receipts in succession
   - Shows unified BatchSummary
   - Includes historical comparison
   - Highlights top insight from batch

**Silence Feature:**
- User can silence insights for 4 hours
- Useful during shopping trips
- State persists in localStorage
- When silenced, insights are tracked but not shown

---

## Project Structure Notes

**Files to create:**
- `src/hooks/useBatchSession.ts`
- `src/components/insights/BatchSummary.tsx`

**Files to modify:**
- `src/services/insightEngineService.ts` - Add silence/comparison functions
- `src/App.tsx` - Integrate batch mode

---

## UI Specifications

**BatchSummary Layout:**
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

## Definition of Done

- [ ] All 9 acceptance criteria verified
- [ ] BatchSummary shows after 3+ receipts
- [ ] Historical comparison works
- [ ] Silence feature persists correctly
- [ ] Dark mode supported
- [ ] Unit tests passing
- [ ] Code review approved

---

## Dev Agent Record

### Agent Model Used
<!-- Will be populated during dev-story execution -->

### Completion Notes
<!-- Will be populated during dev-story execution -->

### Files Modified
<!-- Will be populated during dev-story execution -->

### Test Results
<!-- Will be populated during dev-story execution -->

---

## Review Notes
<!-- Will be populated during code review -->

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-17 | 1.0 | Story created from architecture (replaces Pattern Detection Engine) |
