# Story 10.3 Context: Weekly Summary View

**Purpose:** This document aggregates all relevant codebase context for implementing the Weekly Summary View.

---

## Target Files to Create

| File | Purpose |
|------|---------|
| `src/views/WeeklySummaryView.tsx` | Weekly summary modal/view |
| `src/components/ReportsSection.tsx` | Reports section on home screen |
| `src/services/summaryService.ts` | Summary data aggregation |
| `src/types/report.ts` | Report type definitions |
| `src/hooks/useReports.ts` | Report state management |

---

## Files to Modify

| File | Purpose |
|------|---------|
| `src/views/DashboardView.tsx` | Add Reports Section |
| `src/utils/translations.ts` | Add summary strings |
| `src/App.tsx` | Add view routing for summary |

---

## Home Screen Context

**Note:** The app uses `DashboardView.tsx` as the home screen (NOT HomeView).

```
Location: /home/khujta/projects/bmad/boletapp/src/views/DashboardView.tsx

DashboardView serves as the home screen showing:
- 5 recent transactions with thumbnails
- Quick edit/view capabilities
- Transaction summary

Integration point: Add ReportsSection component above or below
recent transactions section.
```

---

## Date Formatting Utilities

```
Location: /home/khujta/projects/bmad/boletapp/src/utils/date.ts (219 lines)

Key functions available:

getWeeksInMonth(month, locale) - Lines 138-172
  Returns WeekRange[] with month-aligned 7-day chunks

formatWeekLabel(start, end, locale) - Lines 190-207
  Formats locale-aware week labels like "Oct 1-7"

WeekRange interface (lines 28-33):
  {
    label: string;
    start: string;  // YYYY-MM-DD
    end: string;    // YYYY-MM-DD
    weekNumber: number;  // 1-5
  }

IMPORTANT (ADR-012): Week calculation uses month-aligned chunks
NOT ISO weeks. Week 1 = days 1-7, Week 2 = days 8-14, etc.
```

---

## Modal Pattern to Follow

```
Location: /home/khujta/projects/bmad/boletapp/src/components/UpgradePromptModal.tsx

Existing modal pattern (WCAG 2.1 Level AA compliant):
- Props: isOpen, onClose, onUpgrade, t (translation), theme
- Focus trap implementation
- Keyboard handling (Escape to close)
- Backdrop click handling

Use this as reference for WeeklySummaryView modal.
```

---

## View Navigation Pattern

```
Location: /home/khujta/projects/bmad/boletapp/src/App.tsx

Current view state management (line 42):
type View = 'dashboard' | 'scan' | 'edit' | 'trends' | 'list' | 'settings';

Pattern to add 'weekly-summary' view:
1. Add to View type
2. Add conditional render in main component
3. Add navigation callback: onViewWeeklySummary
```

---

## Summary Service Interface

```typescript
// src/services/summaryService.ts

import { Transaction } from '../types/transaction';
import { getWeeksInMonth, formatWeekLabel } from '../utils/date';

interface WeeklySummary {
  periodStart: string;  // YYYY-MM-DD
  periodEnd: string;    // YYYY-MM-DD
  weekLabel: string;    // Formatted label
  totalSpent: number;
  transactionCount: number;
  vsLastWeek: {
    amount: number;
    percentage: number;
    direction: 'up' | 'down' | 'same';
  };
  topCategories: CategoryBreakdown[];
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  emoji: string;
}

export function getWeeklySummary(
  transactions: Transaction[],
  weekStart: string,
  locale: 'en' | 'es'
): WeeklySummary;

export function getRecentWeeks(
  transactions: Transaction[],
  count: number
): WeekRange[];
```

---

## Report Type Definitions

```typescript
// src/types/report.ts

export type ReportType = 'weekly' | 'monthly';

export interface Report {
  id: string;
  type: ReportType;
  periodStart: string;  // YYYY-MM-DD
  periodEnd: string;    // YYYY-MM-DD
  createdAt: string;    // ISO timestamp
  seen: boolean;
  seenAt?: string;      // ISO timestamp
}

export interface ReportsState {
  reports: Report[];
  maxReports: 5;  // FIFO limit
}
```

---

## Reports Section Layout

```
┌─────────────────────────────────────────┐
│  📊 Reportes                  [Ver todo]│
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Semana  │ │ Semana  │ │  Mes    │   │
│  │ Dic 9-15│ │ Dic 2-8 │ │  Nov    │   │
│  │  🔴 New │ │         │ │         │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
└─────────────────────────────────────────┘

Card specs:
- Width: ~100px (3 cards per row)
- Height: ~80px
- Border radius: 8px
- New badge: Red dot (8px) or "Nuevo" label
- Horizontal scroll if more than 3
```

---

## Translation Strings to Add

```typescript
// src/utils/translations.ts

// English
reports: 'Reports',
reportsViewAll: 'View all',
weeklySummary: 'Weekly Summary',
weeklySummaryTitle: 'Summary for {weekRange}',
totalSpent: 'Total spent',
receipts: 'receipts',
vsLastWeek: 'vs last week',
topCategories: 'Top Categories',
viewDetailedAnalysis: 'View detailed analysis',
noTransactionsThisWeek: 'No expenses recorded this week. Scan your first receipt!',
firstWeek: 'First week',
newReport: 'New',

// Spanish
reports: 'Reportes',
reportsViewAll: 'Ver todo',
weeklySummary: 'Resumen Semanal',
weeklySummaryTitle: 'Resumen de {weekRange}',
totalSpent: 'Total gastado',
receipts: 'boletas',
vsLastWeek: 'vs semana anterior',
topCategories: 'Top Categorías',
viewDetailedAnalysis: 'Ver análisis detallado',
noTransactionsThisWeek: 'No hay gastos registrados esta semana. ¡Escanea tu primera boleta!',
firstWeek: 'Primera semana',
newReport: 'Nuevo',
```

---

## Category Emoji Mapping

```typescript
// Can be extracted to a utility or use existing pattern

const categoryEmojis: Record<string, string> = {
  'Supermercado': '🛒',
  'Grocery': '🛒',
  'Restaurante': '🍽️',
  'Restaurant': '🍽️',
  'Transporte': '🚗',
  'Transportation': '🚗',
  'Entretenimiento': '🎬',
  'Entertainment': '🎬',
  'Salud': '💊',
  'Health': '💊',
  'Shopping': '🛍️',
  'Servicios': '📱',
  'Services': '📱',
  'Otro': '📦',
  'Other': '📦'
};
```

---

## Week Generation Logic

```typescript
// Trigger weekly report creation

function shouldGenerateWeeklyReport(lastReport: Report | null): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay();  // 0 = Sunday, 5 = Friday
  const hour = now.getHours();

  // Friday 7pm (19:00) trigger
  const isFridayEvening = dayOfWeek === 5 && hour >= 19;

  // Or after Friday 7pm (Sat/Sun/early week)
  const isAfterFriday = dayOfWeek > 5 || (dayOfWeek < 5 && lastReport === null);

  if (!isFridayEvening && !isAfterFriday) return false;

  // Check if report already exists for this week
  if (lastReport && isCurrentWeek(lastReport.periodEnd)) {
    return false;
  }

  return true;
}
```

---

## Storage Strategy

```typescript
// Reports can be stored in:
// 1. localStorage (simpler, offline-first)
// 2. Firestore user document (sync across devices)

// Recommended: localStorage for MVP, migrate to Firestore later

const REPORTS_KEY = 'boletapp_reports';

function saveReports(reports: Report[]): void {
  // Keep only last 5 (FIFO)
  const trimmed = reports.slice(0, 5);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(trimmed));
}

function loadReports(): Report[] {
  const stored = localStorage.getItem(REPORTS_KEY);
  return stored ? JSON.parse(stored) : [];
}
```

---

## Navigation to Analytics

```typescript
// From WeeklySummaryView, navigate to TrendsView with date filter

// Current TrendsView doesn't accept date params directly,
// but can use AnalyticsContext to set navigation state

// Pattern:
const handleViewDetailedAnalysis = () => {
  // Set analytics context to this week's date range
  analyticsNav.navigateTo({
    temporalLevel: 'week',
    temporalPosition: weekStart, // YYYY-MM-DD
  });

  // Navigate to trends view
  onClose();
  setView('trends');
};
```

---

## Accessibility Requirements

```typescript
// WeeklySummaryView accessibility

<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="weekly-summary-title"
  className="..."
>
  <h1 id="weekly-summary-title">{t('weeklySummary')}</h1>

  {/* Close button */}
  <button
    aria-label={t('close')}
    onClick={onClose}
  >
    <XIcon />
  </button>

  {/* Content */}
</div>

// Keyboard support: Escape to close (use existing modal pattern)
```

---

## Testing Considerations

```typescript
// tests/unit/services/summaryService.test.ts

describe('summaryService', () => {
  describe('getWeeklySummary', () => {
    it('calculates total spent for week', () => {...});
    it('calculates week-over-week change', () => {...});
    it('returns top 5 categories', () => {...});
    it('handles empty week gracefully', () => {...});
    it('handles first week (no comparison)', () => {...});
  });
});

// tests/unit/views/WeeklySummaryView.test.tsx

describe('WeeklySummaryView', () => {
  it('renders summary data', () => {...});
  it('shows empty state when no transactions', () => {...});
  it('navigates to analytics on button click', () => {...});
  it('closes on X button click', () => {...});
  it('closes on Escape key', () => {...});
});
```

---

## Performance Target

- Summary calculation: <200ms
- View render: <100ms
- Total load time: <500ms (including data fetch)

Use React.memo() for category breakdown items to prevent unnecessary re-renders.
