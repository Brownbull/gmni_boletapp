# Story 10.6: Scan Complete Insight Card

**Epic:** Epic 10 - Foundation + Engagement & Insight Engine
**Status:** ready-for-dev
**Story Points:** 3
**Dependencies:** Story 10.5 (Selection Algorithm + Sprinkle)

---

## User Story

As a **user**,
I want **to see a personalized insight after saving a receipt**,
So that **I feel rewarded for scanning and learn something about my habits**.

---

## Architecture Reference

**Architecture Document:** [architecture-epic10-insight-engine.md](../../planning/architecture-epic10-insight-engine.md)
**Brainstorming Document:** [epic-10-insight-engine-brainstorm.md](../../planning/epic-10-insight-engine-brainstorm.md)

---

## Acceptance Criteria

- [ ] **AC #1:** InsightCard component displays insight after transaction save
- [ ] **AC #2:** Insight generation uses async side-effect pattern (doesn't block save)
- [ ] **AC #3:** BuildingProfileCard fallback shown when no insight available
- [ ] **AC #4:** Card appears AFTER save confirmation, not before
- [ ] **AC #5:** Card auto-dismisses after 5 seconds
- [ ] **AC #6:** User can manually dismiss card
- [ ] **AC #7:** Card supports dark mode
- [ ] **AC #8:** Animation respects `prefers-reduced-motion`
- [ ] **AC #9:** Insight is recorded in UserInsightProfile

---

## Tasks / Subtasks

### Task 1: Create InsightCard Component (1h)

Create `src/components/insights/InsightCard.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Insight } from '../../types/insight';
import * as Icons from 'lucide-react';

interface InsightCardProps {
  insight: Insight;
  onDismiss: () => void;
  autoDismissMs?: number;
  theme: 'light' | 'dark';
}

export function InsightCard({
  insight,
  onDismiss,
  autoDismissMs = 5000,
  theme,
}: InsightCardProps) {
  const [isExiting, setIsExiting] = useState(false);

  // Auto-dismiss timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 200); // Wait for exit animation
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [autoDismissMs, onDismiss]);

  // Handle manual dismiss
  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 200);
  };

  // Get icon component
  const IconComponent = insight.icon
    ? (Icons as any)[insight.icon] || Icons.Sparkles
    : Icons.Sparkles;

  // Check reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed bottom-20 left-4 right-4 mx-auto max-w-sm
        p-4 rounded-xl shadow-lg
        ${theme === 'dark'
          ? 'bg-gray-800 text-white border border-gray-700'
          : 'bg-white text-gray-800 border border-gray-200'
        }
        ${!prefersReducedMotion && !isExiting
          ? 'animate-slide-up'
          : ''
        }
        ${!prefersReducedMotion && isExiting
          ? 'animate-fade-out'
          : ''
        }
        ${isExiting && prefersReducedMotion ? 'opacity-0' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`
            p-2 rounded-lg
            ${theme === 'dark' ? 'bg-teal-900/50' : 'bg-teal-50'}
          `}>
            <IconComponent
              className={`w-5 h-5 ${theme === 'dark' ? 'text-teal-400' : 'text-teal-600'}`}
            />
          </div>
          <span className={`
            text-sm font-medium
            ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}
          `}>
            {insight.title}
          </span>
        </div>

        <button
          onClick={handleDismiss}
          className={`
            p-1 rounded-full transition-colors
            ${theme === 'dark'
              ? 'hover:bg-gray-700 text-gray-400'
              : 'hover:bg-gray-100 text-gray-500'
            }
          `}
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message */}
      <p className={`
        text-base
        ${theme === 'dark' ? 'text-white' : 'text-gray-800'}
      `}>
        {insight.message}
      </p>
    </div>
  );
}
```

### Task 2: Create BuildingProfileCard Fallback (0.5h)

Create `src/components/insights/BuildingProfileCard.tsx`:

```typescript
import React from 'react';
import { Sparkles } from 'lucide-react';

interface BuildingProfileCardProps {
  onDismiss: () => void;
  theme: 'light' | 'dark';
}

export function BuildingProfileCard({
  onDismiss,
  theme,
}: BuildingProfileCardProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed bottom-20 left-4 right-4 mx-auto max-w-sm
        p-4 rounded-xl shadow-lg
        ${theme === 'dark'
          ? 'bg-gray-800 text-white border border-gray-700'
          : 'bg-white text-gray-800 border border-gray-200'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`
          p-2 rounded-lg
          ${theme === 'dark' ? 'bg-purple-900/50' : 'bg-purple-50'}
        `}>
          <Sparkles className={`
            w-5 h-5
            ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}
          `} />
        </div>
        <div>
          <p className={`
            text-sm font-medium
            ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}
          `}>
            Construyendo tu perfil
          </p>
          <p className={`
            text-sm
            ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}
          `}>
            Con más datos, te mostraremos insights personalizados
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Task 3: Add CSS Animations (0.25h)

Add to `src/index.css` or Tailwind config:

```css
/* Insight Card Animations */
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out forwards;
}

.animate-fade-out {
  animation: fade-out 0.2s ease-out forwards;
}
```

### Task 4: Integrate with Save Flow (0.75h)

Update save handler in `src/App.tsx`:

```typescript
import { generateInsightForTransaction } from './services/insightEngineService';
import { recordInsightShown } from './services/insightProfileService';
import { InsightCard } from './components/insights/InsightCard';
import { BuildingProfileCard } from './components/insights/BuildingProfileCard';

// Add state
const [currentInsight, setCurrentInsight] = useState<Insight | null>(null);
const [showInsightCard, setShowInsightCard] = useState(false);

// In saveTransaction handler - ASYNC SIDE EFFECT PATTERN
const saveTransaction = async (transaction: Transaction) => {
  // 1. Primary flow - MUST succeed
  const savedId = await addTransaction(db, userId, appId, transaction);
  setShowSavedToast(true);
  setView('dashboard');

  // 2. Side effect - fire and forget (doesn't block save)
  generateInsightForTransaction(
    { ...transaction, id: savedId },
    transactions,
    insightProfile,
    localCache
  )
    .then(insight => {
      setCurrentInsight(insight);
      setShowInsightCard(true);

      // Record that insight was shown
      if (insight && insight.id !== 'building_profile') {
        recordInsightShown(db, userId, appId, insight.id, savedId);
      }
    })
    .catch(err => {
      console.warn('Insight generation failed:', err);
      // Show fallback - never show nothing
      setCurrentInsight(null);
      setShowInsightCard(true);
    });
};

// In render
{showInsightCard && (
  currentInsight && currentInsight.id !== 'building_profile'
    ? <InsightCard
        insight={currentInsight}
        onDismiss={() => setShowInsightCard(false)}
        theme={theme}
      />
    : <BuildingProfileCard
        onDismiss={() => setShowInsightCard(false)}
        theme={theme}
      />
)}
```

### Task 5: Unit Tests (0.5h)

Create `tests/unit/components/InsightCard.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InsightCard } from '../../../src/components/insights/InsightCard';

const mockInsight = {
  id: 'test_insight',
  category: 'QUIRKY_FIRST' as const,
  title: 'Test Title',
  message: 'Test message',
  icon: 'Star',
  priority: 5,
};

describe('InsightCard', () => {
  it('renders insight title and message', () => {
    render(
      <InsightCard
        insight={mockInsight}
        onDismiss={() => {}}
        theme="light"
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('calls onDismiss when close button clicked', () => {
    const onDismiss = vi.fn();
    render(
      <InsightCard
        insight={mockInsight}
        onDismiss={onDismiss}
        theme="light"
      />
    );

    fireEvent.click(screen.getByLabelText('Cerrar'));

    // Wait for exit animation
    waitFor(() => {
      expect(onDismiss).toHaveBeenCalled();
    });
  });

  it('auto-dismisses after timeout', async () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(
      <InsightCard
        insight={mockInsight}
        onDismiss={onDismiss}
        autoDismissMs={1000}
        theme="light"
      />
    );

    vi.advanceTimersByTime(1200);

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalled();
    });

    vi.useRealTimers();
  });

  it('supports dark mode', () => {
    render(
      <InsightCard
        insight={mockInsight}
        onDismiss={() => {}}
        theme="dark"
      />
    );

    const card = screen.getByRole('status');
    expect(card.className).toContain('bg-gray-800');
  });
});
```

---

## Technical Summary

This story implements the **UI layer** for insights - the InsightCard that appears after saving a transaction.

**Key Architecture Patterns:**

1. **Async Side-Effect Pattern:**
   ```
   Save transaction → Show success → Navigate to dashboard
                   ↘
                    Generate insight (async, fire-and-forget)
                    ↓
                    Show InsightCard (or fallback)
   ```

2. **Fallback Chain:**
   - Try to generate insight
   - If no insight available → Show BuildingProfileCard
   - Never show nothing after a save

3. **Timing:**
   - Insight appears AFTER save confirmation
   - Auto-dismisses after 5 seconds
   - User can dismiss manually

---

## Project Structure Notes

**Files to create:**
- `src/components/insights/InsightCard.tsx`
- `src/components/insights/BuildingProfileCard.tsx`
- `tests/unit/components/InsightCard.test.tsx`

**Files to modify:**
- `src/App.tsx` - Add insight state and rendering
- `src/index.css` - Add animations

---

## UI Specifications

**Positioning:**
- Fixed at bottom of screen
- 16px margins
- Max width 384px (max-w-sm)
- Above bottom nav (bottom-20)

**Colors:**
| Element | Light | Dark |
|---------|-------|------|
| Background | white | gray-800 |
| Title | gray-600 | gray-300 |
| Message | gray-800 | white |
| Icon bg | teal-50 | teal-900/50 |
| Icon | teal-600 | teal-400 |

**Animation:**
- Enter: slide-up 300ms
- Exit: fade-out 200ms
- Respect `prefers-reduced-motion`

---

## Definition of Done

- [ ] All 9 acceptance criteria verified
- [ ] InsightCard renders correctly
- [ ] BuildingProfileCard fallback works
- [ ] Async side-effect pattern implemented
- [ ] Auto-dismiss and manual dismiss work
- [ ] Dark mode supported
- [ ] Animations respect reduced motion
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
| 2025-12-17 | 1.0 | Story created from architecture (replaces Push Notification Integration) |
