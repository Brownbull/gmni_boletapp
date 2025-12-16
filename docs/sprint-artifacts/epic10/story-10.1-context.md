# Story 10.1 Context: Insight Engine Core

**Purpose:** This document aggregates all relevant codebase context for implementing the Insight Engine.

---

## Target Files to Create

| File | Purpose |
|------|---------|
| `src/services/insightEngine.ts` | Core insight generation service |
| `src/types/insight.ts` | Insight type definitions |
| `src/services/insightEngine.test.ts` | Unit tests |

---

## Type Definitions to Create

```typescript
// src/types/insight.ts

export type InsightType =
  | 'frequency'           // "3ra boleta de restaurante esta semana"
  | 'merchant_concentration' // "40% de tu gasto es en Líder"
  | 'category_growth'     // "Restaurante subió 40% vs mes pasado"
  | 'improvement'         // "¡Gastaste 15% menos en X!"
  | 'milestone';          // "¡Primer mes completo!"

export interface Insight {
  type: InsightType;
  message: string;
  messageKey: string;     // i18n key
  emoji: string;
  confidence: number;     // 0-1
  priority: number;       // Higher = show first
  dataPoints: number;     // Min data required
  metadata?: Record<string, any>;
}

export interface InsightContext {
  currentTransaction?: Transaction;
  allTransactions: Transaction[];
  locale: 'en' | 'es';
}

export interface InsightRule {
  type: InsightType;
  condition: (ctx: InsightContext) => boolean;
  generate: (ctx: InsightContext) => Insight;
  minDataPoints: number;
}
```

---

## Transaction Query Dependencies

**From Story 10.0 - transactionQuery.ts:**
```typescript
// Functions the Insight Engine will need:

getThisWeek(transactions): Transaction[]
getThisMonth(transactions): Transaction[]
getLastNDays(transactions, n): Transaction[]
aggregateByCategory(transactions): CategoryAggregate[]
aggregateByMerchant(transactions): MerchantAggregate[]
```

---

## Existing Data Access Patterns

**Accessing Transactions:**
```
Location: /home/khujta/projects/bmad/boletapp/src/App.tsx

Hook: useTransactions (line 46)
Returns: Transaction[] via Firestore subscription

Access pattern in App.tsx:
const { transactions } = useTransactions(user, services);
```

**Transaction Structure:**
```
Location: /home/khujta/projects/bmad/boletapp/src/types/transaction.ts

interface Transaction {
  id?: string;
  date: string;           // YYYY-MM-DD
  merchant: string;
  alias?: string;
  category: StoreCategory;
  total: number;
  items: TransactionItem[];
  time?: string;
  country?: string;
  city?: string;
  currency?: string;
  createdAt?: any;        // Firestore timestamp
}
```

---

## Translation Patterns

**Adding Insight Strings:**
```
Location: /home/khujta/projects/bmad/boletapp/src/utils/translations.ts

Pattern - add to both en and es objects:

// English (around line 150+)
insightFrequency: '{ordinal} {category} receipt this week',
insightMerchantConcentration: '{percentage}% of your spending is at {merchant}',
insightCategoryGrowth: '{category} increased {percentage}% vs last month',
insightImprovement: 'You spent {percentage}% less on {category}!',
insightMilestoneFirstMonth: 'First complete month!',

// Spanish
insightFrequency: '{ordinal} boleta de {category} esta semana',
insightMerchantConcentration: 'El {percentage}% de tu gasto es en {merchant}',
insightCategoryGrowth: '{category} subió {percentage}% vs mes pasado',
insightImprovement: '¡Gastaste {percentage}% menos en {category}!',
insightMilestoneFirstMonth: '¡Primer mes completo!',
```

**Category Translation Function:**
```
Location: /home/khujta/projects/bmad/boletapp/src/utils/categoryTranslations.ts

// Use for translating category names in insights
import { translateStoreCategory } from './categoryTranslations';

const translatedCategory = translateStoreCategory(category, lang);
```

---

## Insight Priority Reference

From habits loops.md research:

| Priority | Type | When to Show |
|----------|------|--------------|
| 10 | improvement | Always show wins first |
| 8 | milestone | Celebrate achievements |
| 6 | category_growth | Informational |
| 5 | merchant_concentration | Pattern emerges |
| 3 | frequency | Regular engagement |

---

## Minimum Data Point Requirements

| Insight Type | Min Transactions | Rationale |
|--------------|------------------|-----------|
| frequency | 2 | Show on 3rd+ occurrence |
| merchant_concentration | 10 | Need pattern to emerge |
| category_growth | 5 per month | Statistical significance |
| improvement | 5 per month | Need comparison data |
| milestone | 1 | First scan milestone |

---

## Date/Time Utilities Available

```
Location: /home/khujta/projects/bmad/boletapp/src/utils/analyticsHelpers.ts

Useful functions:
- getQuarterFromMonth(monthStr) - "2025-Q1"
- getCurrentYear() - "2025"

May need to add:
- getWeekNumber(date)
- getMonthStart(date)
- getWeekStart(date)
```

---

## Service Pattern to Follow

**Reference Service:**
```
Location: /home/khujta/projects/bmad/boletapp/src/services/categoryMappingService.ts

Structure:
1. Import types
2. Export interface (optional)
3. Export functions
4. Each function is pure or async
```

**Insight Engine Structure:**
```typescript
// src/services/insightEngine.ts

import { Transaction } from '../types/transaction';
import { Insight, InsightContext, InsightType } from '../types/insight';

const insightRules: InsightRule[] = [
  // Define rules for each insight type
];

export function generateInsights(context: InsightContext): Insight[] {
  return insightRules
    .filter(rule => context.allTransactions.length >= rule.minDataPoints)
    .filter(rule => rule.condition(context))
    .map(rule => rule.generate(context))
    .sort((a, b) => b.priority - a.priority);
}

export function selectBestInsight(context: InsightContext): Insight | null {
  const insights = generateInsights(context);
  return insights[0] || null;
}
```

---

## Testing Pattern

**Reference Test:**
```
Location: /home/khujta/projects/bmad/boletapp/tests/unit/

Pattern:
import { describe, it, expect } from 'vitest';
import { generateInsights } from '../../src/services/insightEngine';

describe('InsightEngine', () => {
  describe('generateInsights', () => {
    it('should generate frequency insight when 3+ same category this week', () => {
      const context = createMockContext([...]);
      const insights = generateInsights(context);
      expect(insights).toContainEqual(expect.objectContaining({
        type: 'frequency'
      }));
    });
  });
});
```

---

## Performance Considerations

**Target:** <500ms for typical user data

**Optimization Strategies:**
1. Pre-filter transactions by date range before aggregating
2. Use Map for O(1) lookups in aggregation
3. Exit early when minimum data points not met
4. Cache computed values where appropriate

---

## Integration Points

**Where Insight Engine will be called:**
1. After transaction save → Scan Complete Insight (Story 10.2)
2. Friday 7pm → Weekly Summary (Story 10.3)
3. End of month → Monthly Summary (Story 10.4)
4. Analytics view load → Analytics Cards (Story 10.5)
