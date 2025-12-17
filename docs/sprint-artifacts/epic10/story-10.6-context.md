# Story 10.6 Context: Scan Complete Insight Card

**Purpose:** Context document for implementing the UI layer for post-scan insights.
**Architecture:** [architecture-epic10-insight-engine.md](./architecture-epic10-insight-engine.md)
**Updated:** 2025-12-17 (Architecture-Aligned)

---

## Target Files to Create

| File | Purpose |
|------|---------|
| `src/components/insights/InsightCard.tsx` | Main insight display component |
| `src/components/insights/BuildingProfileCard.tsx` | Fallback for new users |
| `tests/unit/components/InsightCard.test.tsx` | Unit tests |

## Target Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add insight state, render cards |
| `src/index.css` | Add slide-up/fade-out animations |

---

## Dependencies

**Must exist before this story:**
- Story 10.5: `selectInsight()` function
- Story 10.1: `Insight` type, `generateInsightForTransaction()`

---

## Critical Architecture Pattern: Async Side-Effect

**MUST NOT BLOCK TRANSACTION SAVE**

```
User clicks Save
    ↓
1. Save transaction to Firestore (SYNC - must succeed)
2. Show success toast
3. Navigate to dashboard
    ↓ (async, fire-and-forget)
4. Generate insight
5. Show InsightCard (or fallback)
```

```typescript
// CORRECT: Async side-effect
const saveTransaction = async (transaction: Transaction) => {
  // Primary flow - MUST succeed
  const savedId = await addTransaction(db, userId, appId, transaction);
  setShowSavedToast(true);
  setView('dashboard');

  // Side effect - fire and forget
  generateInsightForTransaction(...)
    .then(insight => {
      setCurrentInsight(insight);
      setShowInsightCard(true);
    })
    .catch(err => {
      // Show fallback - NEVER show nothing
      setCurrentInsight(null);
      setShowInsightCard(true);
    });
};
```

---

## Fallback Chain

1. Try to generate insight
2. If null/error → Show BuildingProfileCard
3. **NEVER** show nothing after a save

```typescript
{showInsightCard && (
  currentInsight && currentInsight.id !== 'building_profile'
    ? <InsightCard insight={currentInsight} ... />
    : <BuildingProfileCard ... />
)}
```

---

## InsightCard Props

```typescript
interface InsightCardProps {
  insight: Insight;
  onDismiss: () => void;
  autoDismissMs?: number;  // Default: 5000
  theme: 'light' | 'dark';
}
```

---

## Dynamic Icon Loading

```typescript
import * as Icons from 'lucide-react';

// Get icon component from string name
const IconComponent = insight.icon
  ? (Icons as any)[insight.icon] || Icons.Sparkles
  : Icons.Sparkles;

// Usage
<IconComponent className="w-5 h-5" />
```

---

## Animation CSS

```css
/* src/index.css */
@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out forwards;
}

.animate-fade-out {
  animation: fade-out 0.2s ease-out forwards;
}
```

---

## Accessibility

```typescript
// Respect reduced motion preference
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Apply animation classes conditionally
className={`
  ${!prefersReducedMotion && !isExiting ? 'animate-slide-up' : ''}
  ${!prefersReducedMotion && isExiting ? 'animate-fade-out' : ''}
  ${isExiting && prefersReducedMotion ? 'opacity-0' : ''}
`}

// ARIA attributes
<div role="status" aria-live="polite">
```

---

## Auto-Dismiss Timer

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    setIsExiting(true);
    setTimeout(onDismiss, 200); // Wait for exit animation
  }, autoDismissMs);

  return () => clearTimeout(timer);
}, [autoDismissMs, onDismiss]);
```

---

## UI Positioning

- Fixed at bottom of screen
- Above bottom navigation (`bottom-20`)
- 16px margins (`left-4 right-4`)
- Max width 384px (`max-w-sm`)

---

## Dark Mode Colors

| Element | Light | Dark |
|---------|-------|------|
| Background | `bg-white` | `bg-gray-800` |
| Title | `text-gray-600` | `text-gray-300` |
| Message | `text-gray-800` | `text-white` |
| Icon bg | `bg-teal-50` | `bg-teal-900/50` |
| Icon | `text-teal-600` | `text-teal-400` |
| Border | `border-gray-200` | `border-gray-700` |

---

## Record Insight Shown

After showing an insight, record it in the user's profile:

```typescript
// After insight is shown
if (insight && insight.id !== 'building_profile') {
  recordInsightShown(db, userId, appId, insight.id, savedId);
}
```

This is for cooldown tracking (preventing repeated insights).
