# Story 10.5 Context: Analytics Insight Cards

**Purpose:** This document aggregates all relevant codebase context for implementing Analytics Insight Cards.

---

## Target Files to Create

| File | Purpose |
|------|---------|
| `src/components/InsightCard.tsx` | Individual insight card |
| `src/components/InsightCardsContainer.tsx` | Container for cards on Analytics |

---

## Files to Modify

| File | Purpose |
|------|---------|
| `src/views/TrendsView.tsx` | Add InsightCardsContainer |
| `src/services/insightEngine.ts` | Add analytics-specific methods |
| `src/utils/translations.ts` | Add card strings |

---

## TrendsView Structure

```
Location: /home/khujta/projects/bmad/boletapp/src/views/TrendsView.tsx (~800+ lines)

Props (lines 51-72):
  transactions: Transaction[]
  theme: 'light' | 'dark'
  colorTheme?: 'normal' | 'professional'
  currency: string
  locale: string
  t: (key: string) => string
  onEditTransaction, exporting, onExporting, onUpgradeRequired

Key functions:
  getWeekOfMonth(date: string): number - lines 78-85
  filterTransactionsByNavState() - Core filtering, lines 91-119
  computeBarData() - Aggregation logic, lines 220-380

Integration point: Add InsightCardsContainer below date filters,
above chart components.
```

---

## Existing Card Component Pattern

```
Location: /home/khujta/projects/bmad/boletapp/src/components/analytics/DrillDownCard.tsx

Props (lines 19-47):
  label: string
  value: number
  percentage?: number
  onClick?: () => void
  colorKey?: string
  isEmpty?: boolean
  isClickable?: boolean
  theme?: 'light' | 'dark'
  locale?: string
  currency?: string

Key features:
  - Memoized component
  - 44px min touch target
  - Currency formatting (CLP no decimals)
  - Dark mode support

Use similar styling patterns for InsightCard.
```

---

## Analytics Context (Filter State)

```
Location: /home/khujta/projects/bmad/boletapp/src/contexts/AnalyticsContext.tsx (6,621 bytes)

Uses React Context + useReducer pattern

Actions:
  SET_TEMPORAL_LEVEL
  SET_CATEGORY_FILTER
  TOGGLE_CHART_MODE
  CLEAR_CATEGORY_FILTER

Hook: useAnalyticsNavigation()
Location: /home/khujta/projects/bmad/boletapp/src/hooks/useAnalyticsNavigation.ts

Usage:
  const { navState, navigateTo, goBack } = useAnalyticsNavigation();

NavState includes:
  temporalLevel: 'year' | 'quarter' | 'month' | 'week'
  temporalPosition: string
  categoryFilter?: string
```

---

## InsightCard Component

```typescript
// src/components/InsightCard.tsx

interface InsightCardProps {
  insight: Insight;
  onDismiss: () => void;
  onViewMore?: () => void;
  theme: 'light' | 'dark';
  locale: 'en' | 'es';
}

export function InsightCard({
  insight,
  onDismiss,
  onViewMore,
  theme,
  locale
}: InsightCardProps) {
  return (
    <div
      className={`
        relative p-3 rounded-lg shadow-sm
        ${theme === 'dark'
          ? 'bg-teal-900/30 text-gray-200'
          : 'bg-teal-50 text-gray-700'
        }
      `}
      role="status"
      aria-live="polite"
    >
      {/* Emoji + Message */}
      <div className="flex items-start gap-2 pr-6">
        <span className="text-lg">{insight.emoji}</span>
        <p className="text-sm">{insight.message}</p>
      </div>

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        aria-label="Dismiss"
      >
        <XIcon className="w-4 h-4" />
      </button>

      {/* Optional action */}
      {onViewMore && (
        <button
          onClick={onViewMore}
          className="mt-2 text-xs text-teal-600 hover:underline"
        >
          Ver más
        </button>
      )}
    </div>
  );
}
```

---

## InsightCardsContainer Component

```typescript
// src/components/InsightCardsContainer.tsx

interface InsightCardsContainerProps {
  transactions: Transaction[];
  dateRange: { start: string; end: string };
  selectedCategory?: string;
  theme: 'light' | 'dark';
  locale: 'en' | 'es';
  insightEngine: InsightEngine;
}

export function InsightCardsContainer({
  transactions,
  dateRange,
  selectedCategory,
  theme,
  locale,
  insightEngine
}: InsightCardsContainerProps) {
  const [dismissedTypes, setDismissedTypes] = useState<Set<InsightType>>(new Set());

  const insights = useMemo(() => {
    return insightEngine
      .getAnalyticsInsights({
        transactions,
        dateRange,
        selectedCategory,
        locale
      })
      .filter(i => !dismissedTypes.has(i.type))
      .slice(0, 2);  // Max 2 cards
  }, [transactions, dateRange, selectedCategory, dismissedTypes]);

  const handleDismiss = (type: InsightType) => {
    setDismissedTypes(prev => new Set([...prev, type]));
  };

  if (insights.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
      {insights.map((insight, index) => (
        <InsightCard
          key={`${insight.type}-${index}`}
          insight={insight}
          onDismiss={() => handleDismiss(insight.type)}
          theme={theme}
          locale={locale}
        />
      ))}
    </div>
  );
}
```

---

## InsightEngine Analytics Extension

```typescript
// src/services/insightEngine.ts (add to existing)

interface AnalyticsInsightContext {
  transactions: Transaction[];
  dateRange: { start: string; end: string };
  selectedCategory?: string;
  locale: 'en' | 'es';
}

export function getAnalyticsInsights(
  context: AnalyticsInsightContext
): Insight[] {
  const allInsights = generateAllInsights(context);

  // Filter out insights redundant with visible charts
  return allInsights
    .filter(i => !isRedundantWithChart(i, context))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 2);
}

function isRedundantWithChart(
  insight: Insight,
  context: AnalyticsInsightContext
): boolean {
  // Don't show "Top category is X" when pie chart shows it
  if (insight.type === 'frequency' && !context.selectedCategory) {
    return true;  // Pie chart already shows category distribution
  }

  // Don't show total spent insight - bar chart shows it
  if (insight.message.includes('total')) {
    return true;
  }

  return false;
}

// Analytics-specific insight types to prioritize:
// 1. Comparison to previous period (week-over-week, month-over-month)
// 2. Trend direction (spending velocity)
// 3. Merchant insights within selected category
// 4. Pattern insights (if data available)
```

---

## Animation Specifications

```typescript
// Card entry/exit animations

// CSS Classes (Tailwind)
const enterAnimation = `
  animate-in fade-in slide-in-from-bottom-2
  duration-300
`;

const exitAnimation = `
  animate-out fade-out slide-out-to-left-4
  duration-200
`;

// Or use CSS keyframes:

/*
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideOutLeft {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-20px);
  }
}
*/

// Reduced motion alternative:
const prefersReducedMotion = useReducedMotion();
const animationClass = prefersReducedMotion
  ? ''
  : 'transition-all duration-300';
```

---

## Integration with TrendsView

```typescript
// In TrendsView.tsx, add after date filters

// Import
import { InsightCardsContainer } from '../components/InsightCardsContainer';
import { insightEngine } from '../services/insightEngine';

// Inside render, after filter controls but before charts:
{navState && (
  <InsightCardsContainer
    transactions={filteredTransactions}
    dateRange={{
      start: navState.temporalPosition,
      end: getEndDate(navState)
    }}
    selectedCategory={navState.categoryFilter}
    theme={theme}
    locale={locale}
    insightEngine={insightEngine}
  />
)}
```

---

## Translation Strings to Add

```typescript
// src/utils/translations.ts

// English
insightDismiss: 'Dismiss',
insightViewMore: 'View more',
insightNoData: 'Not enough data for insights',

// Spanish
insightDismiss: 'Descartar',
insightViewMore: 'Ver más',
insightNoData: 'No hay suficientes datos para insights',
```

---

## UI Specifications

```
Card Layout:
┌─────────────────────────────────────────┐
│  💡  El 35% de tu gasto este mes es    │
│      en Supermercado                   │
│                                    [X] │
└─────────────────────────────────────────┘

Dimensions:
- Width: Full width with 16px margins (calc(100% - 32px))
- Height: Auto (content-driven, typically 60-80px)
- Border radius: 8px
- Padding: 12px
- Shadow: shadow-sm

Colors:
- Light mode: bg-teal-50, text-gray-700
- Dark mode: bg-teal-900/30, text-gray-200

Position:
- Below date filters
- Above charts
- Does not scroll with chart content
- z-index: 10 (above content, below modals)
```

---

## Dismiss State Management

```typescript
// Session-based dismiss tracking (resets on page refresh)

const [dismissedInsights, setDismissedInsights] = useState<Set<InsightType>>(
  new Set()
);

const handleDismiss = (insightType: InsightType) => {
  setDismissedInsights(prev => new Set([...prev, insightType]));
};

// Filter insights before rendering
const visibleInsights = insights.filter(
  i => !dismissedInsights.has(i.type)
);

// Note: Dismissed state is NOT persisted across sessions
// This is intentional - fresh insights each visit
```

---

## Accessibility Requirements

```typescript
// InsightCard accessibility

<div
  role="status"
  aria-live="polite"
  className="..."
>
  {/* Screen reader announces insight when it appears */}

  <button
    onClick={onDismiss}
    aria-label={t('insightDismiss')}
    className="..."
  >
    <XIcon aria-hidden="true" />
  </button>
</div>

// Keyboard support
// - Tab to focus dismiss button
// - Enter/Space to activate dismiss
// - Focus management when card is dismissed
```

---

## Testing Considerations

```typescript
// tests/unit/components/InsightCard.test.tsx

describe('InsightCard', () => {
  it('renders emoji and message', () => {...});
  it('calls onDismiss when X clicked', () => {...});
  it('renders "View more" when onViewMore provided', () => {...});
  it('supports dark mode', () => {...});
  it('has accessible dismiss button', () => {...});
});

// tests/unit/components/InsightCardsContainer.test.tsx

describe('InsightCardsContainer', () => {
  it('renders max 2 cards', () => {...});
  it('filters dismissed insight types', () => {...});
  it('refreshes insights when filters change', () => {...});
  it('returns null when no insights', () => {...});
});

// tests/unit/services/insightEngine.analytics.test.ts

describe('getAnalyticsInsights', () => {
  it('filters redundant insights', () => {...});
  it('returns max 2 insights', () => {...});
  it('considers selected category', () => {...});
});
```

---

## Performance Notes

- Use `useMemo` for insight generation (expensive computation)
- Memoize InsightCard component with `React.memo`
- Debounce filter changes if insights flicker
- Target: <100ms insight generation for typical data
