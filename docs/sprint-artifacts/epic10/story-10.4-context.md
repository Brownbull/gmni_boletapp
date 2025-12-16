# Story 10.4 Context: Monthly Summary View

**Purpose:** This document aggregates all relevant codebase context for implementing the Monthly Summary View.

---

## Target Files to Create

| File | Purpose |
|------|---------|
| `src/views/MonthlySummaryView.tsx` | Monthly summary modal/view |
| `src/components/CelebrationAnimation.tsx` | Celebration overlay component |

---

## Files to Modify

| File | Purpose |
|------|---------|
| `src/services/summaryService.ts` | Add monthly summary functions |
| `src/components/ReportsSection.tsx` | Support monthly report cards |
| `src/utils/translations.ts` | Add monthly summary strings |
| `src/types/report.ts` | Already has 'monthly' type |

---

## Existing Celebration Utilities

```
Location: /home/khujta/projects/bmad/boletapp/src/utils/confetti.ts (48 lines)

Two celebration functions available:

celebrateSuccess() (lines 12-21):
  - 80 particles, 60° spread
  - Origin: y = 0.6
  - Colors: ['#3b82f6', '#6366f1', '#8b5cf6', '#22c55e', '#f59e0b']
  - Already respects disableForReducedMotion: true

celebrateBig() (lines 27-47):
  - 150 particles total with multiple bursts
  - Larger, more dramatic celebration
  - Already respects disableForReducedMotion: true

Library: canvas-confetti (imported as 'confetti')
```

---

## Animation & Reduced Motion

```typescript
// Confetti already handles prefers-reduced-motion natively via:
// disableForReducedMotion: true

// For additional animations (text, emojis), use this pattern:

const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

// Or create a hook:
// src/hooks/useReducedMotion.ts

import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}
```

---

## Monthly Summary Service Interface

```typescript
// src/services/summaryService.ts (extend existing)

interface MonthlySummary {
  month: number;        // 1-12
  year: number;
  monthName: string;    // Localized month name
  totalSpent: number;
  transactionCount: number;
  vsLastMonth: {
    amount: number;
    percentage: number;
    direction: 'up' | 'down' | 'same';
  };
  categories: CategoryComparison[];
  highlights: {
    biggestIncrease: CategoryChange | null;
    biggestDecrease: CategoryChange | null;
  };
  shouldCelebrate: boolean;
}

interface CategoryComparison {
  category: string;
  amount: number;
  percentage: number;   // of total this month
  vsLastMonth: {
    percentage: number; // change from last month
    direction: 'up' | 'down' | 'same';
  };
  emoji: string;
}

interface CategoryChange {
  category: string;
  emoji: string;
  changePercentage: number;
}

export function getMonthlySummary(
  transactions: Transaction[],
  year: number,
  month: number,
  locale: 'en' | 'es'
): MonthlySummary;
```

---

## Celebration Logic

```typescript
// Celebration criteria (ethical design - no shame)

function shouldCelebrate(
  currentMonth: MonthlySummary,
  previousMonth: MonthlySummary | null
): boolean {
  // Always celebrate first month
  if (!previousMonth) return true;

  // Celebrate if total spending decreased ANY amount
  if (currentMonth.totalSpent < previousMonth.totalSpent) {
    return true;
  }

  // Celebrate if ANY category improved >10%
  const anySignificantImprovement = currentMonth.categories.some(
    cat => cat.vsLastMonth.direction === 'down' &&
           cat.vsLastMonth.percentage >= 10
  );

  return anySignificantImprovement;
}

// In MonthlySummaryView:
useEffect(() => {
  if (summary.shouldCelebrate && !prefersReducedMotion) {
    // Slight delay for view to render first
    setTimeout(() => celebrateSuccess(), 300);
  }
}, [summary.shouldCelebrate]);
```

---

## Celebration Component

```typescript
// src/components/CelebrationAnimation.tsx

interface CelebrationAnimationProps {
  show: boolean;
  message: string;
  emoji?: string;
  onComplete?: () => void;
}

export function CelebrationAnimation({
  show,
  message,
  emoji = '🎉',
  onComplete
}: CelebrationAnimationProps) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (show && !prefersReducedMotion) {
      celebrateSuccess();
    }

    // Auto-dismiss after 1.5s
    if (show) {
      const timeout = setTimeout(() => {
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className={`
        text-center
        ${prefersReducedMotion ? '' : 'animate-bounce'}
      `}>
        <span className="text-6xl mb-4 block">{emoji}</span>
        <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
          {message}
        </span>
      </div>
    </div>
  );
}
```

---

## Monthly Card in Reports Section

```typescript
// Differentiate monthly vs weekly cards

interface ReportCardProps {
  report: Report;
  onClick: () => void;
  isNew: boolean;
  locale: 'en' | 'es';
}

function ReportCard({ report, onClick, isNew, locale }: ReportCardProps) {
  const isMonthly = report.type === 'monthly';

  return (
    <button
      onClick={onClick}
      className={`
        w-24 h-20 rounded-lg p-2 text-center
        ${isMonthly
          ? 'bg-teal-50 dark:bg-teal-900/30'
          : 'bg-gray-50 dark:bg-gray-800'
        }
      `}
    >
      {/* Icon */}
      <span className="text-2xl">
        {isMonthly ? '📅' : '📊'}
      </span>

      {/* Label */}
      <span className="text-xs block mt-1">
        {isMonthly
          ? formatMonthName(report.periodStart, locale)
          : formatWeekLabel(report.periodStart, report.periodEnd, locale)
        }
      </span>

      {/* New badge */}
      {isNew && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}
    </button>
  );
}
```

---

## Translation Strings to Add

```typescript
// src/utils/translations.ts

// English
monthlySummary: 'Monthly Summary',
monthlySummaryOf: 'Summary of {month}',
monthComplete: 'Month complete!',
congratulations: 'Congratulations!',
categories: 'Categories',
biggestIncrease: 'Biggest increase',
biggestSavings: 'Biggest savings',
viewFullAnalysis: 'View full analysis',
vsLastMonth: 'vs last month',
noTransactionsThisMonth: 'No expenses recorded this month.',
firstMonth: 'First month',

// Spanish
monthlySummary: 'Resumen Mensual',
monthlySummaryOf: 'Resumen de {month}',
monthComplete: '¡Mes completo!',
congratulations: '¡Felicitaciones!',
categories: 'Categorías',
biggestIncrease: 'Mayor aumento',
biggestSavings: 'Mayor ahorro',
viewFullAnalysis: 'Ver análisis completo',
vsLastMonth: 'vs mes anterior',
noTransactionsThisMonth: 'No hay gastos registrados este mes.',
firstMonth: 'Primer mes',
```

---

## Category Change Indicator Component

```typescript
// src/components/CategoryChangeIndicator.tsx

interface CategoryChangeIndicatorProps {
  direction: 'up' | 'down' | 'same';
  percentage: number;
}

export function CategoryChangeIndicator({
  direction,
  percentage
}: CategoryChangeIndicatorProps) {
  if (direction === 'same' || Math.abs(percentage) < 2) {
    return <span className="text-gray-400">=</span>;
  }

  const isUp = direction === 'up';

  return (
    <span className={`
      text-xs font-medium
      ${isUp
        ? 'text-orange-500'  // Increase = neutral (not alarming)
        : 'text-green-500'   // Decrease = positive (savings!)
      }
    `}>
      {isUp ? '↑' : '↓'}{Math.abs(percentage)}%
    </span>
  );
}
```

---

## Month Name Formatting

```typescript
// Utility for localized month names

const monthNames = {
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  es: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
};

export function getMonthName(month: number, locale: 'en' | 'es'): string {
  return monthNames[locale][month - 1];
}

// Alternative: Use Intl.DateTimeFormat
export function getMonthNameIntl(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);
}
```

---

## Monthly Report Generation Logic

```typescript
// Trigger monthly report creation

function shouldGenerateMonthlyReport(
  transactions: Transaction[],
  lastMonthlyReport: Report | null
): boolean {
  const now = new Date();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const currentHour = now.getHours();

  // Last day of month, 6pm or later
  const isLastDayEvening = currentDay === lastDayOfMonth && currentHour >= 18;

  // Or first few days of new month (catch-up)
  const isEarlyNewMonth = currentDay <= 3;

  if (!isLastDayEvening && !isEarlyNewMonth) return false;

  // Check if report already exists for last month
  const targetMonth = isEarlyNewMonth
    ? now.getMonth()  // Previous month (0-indexed)
    : now.getMonth() + 1;

  if (lastMonthlyReport) {
    const reportMonth = new Date(lastMonthlyReport.periodStart).getMonth() + 1;
    if (reportMonth === targetMonth) return false;
  }

  // Check if user has transactions
  const monthTransactions = transactions.filter(t => {
    const txMonth = new Date(t.date).getMonth() + 1;
    return txMonth === targetMonth;
  });

  return monthTransactions.length > 0;
}
```

---

## UI Layout Reference

```
┌─────────────────────────────────────────┐
│  ← Resumen de Noviembre          [X]   │
│                                         │
│  🎉 ¡Mes completo!                      │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Total: $987.450               │    │
│  │  ↓ 8% vs mes anterior          │    │
│  │  47 boletas                    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Categorías                            │
│  ─────────────────────────────────      │
│  🛒 Supermercado  $398.200  40%  ↓5%  │
│  🍽️ Restaurante   $198.450  20%  ↑12% │
│  🚗 Transporte    $156.800  16%  ↓3%  │
│  📱 Servicios     $118.000  12%  =    │
│  🎬 Entret.       $78.000   8%   ↑25% │
│  📦 Otros         $38.000   4%   ↓8%  │
│                                         │
│  ─────────────────────────────────      │
│  📈 Mayor aumento: Entretenimiento +25%│
│  📉 Mayor ahorro: Supermercado -5%     │
│                                         │
│  [Ver análisis completo]               │
│                                         │
└─────────────────────────────────────────┘
```

---

## Testing Considerations

```typescript
// tests/unit/services/summaryService.test.ts

describe('getMonthlySummary', () => {
  it('calculates total spent for month', () => {...});
  it('calculates month-over-month change', () => {...});
  it('identifies biggest increase category', () => {...});
  it('identifies biggest decrease category', () => {...});
  it('determines celebration eligibility', () => {...});
  it('handles first month (no comparison)', () => {...});
  it('handles empty month', () => {...});
});

// tests/unit/views/MonthlySummaryView.test.tsx

describe('MonthlySummaryView', () => {
  it('renders summary data', () => {...});
  it('shows celebration when eligible', () => {...});
  it('respects reduced motion preference', () => {...});
  it('displays all category comparisons', () => {...});
  it('shows highlights section', () => {...});
});

// tests/unit/components/CelebrationAnimation.test.tsx

describe('CelebrationAnimation', () => {
  it('triggers confetti on show', () => {...});
  it('skips animation for reduced motion', () => {...});
  it('auto-dismisses after duration', () => {...});
});
```

---

## Performance Target

- Summary calculation: <300ms
- Celebration animation: <1500ms (non-blocking)
- Total load time: <1s

---

## Accessibility Notes

- Celebration animation respects `prefers-reduced-motion`
- Success message still shown (just without animation)
- All category data accessible via screen reader
- Color indicators supplemented with symbols (↑↓=)
