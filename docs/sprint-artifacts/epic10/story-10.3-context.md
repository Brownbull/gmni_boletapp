# Story 10.3 Context: Transaction-Intrinsic Insights

**Purpose:** Context document for implementing cold-start insight generators.
**Architecture:** [architecture-epic10-insight-engine.md](./architecture-epic10-insight-engine.md)
**Updated:** 2025-12-17 (Architecture-Aligned)

---

## Target Files to Create

| File | Purpose |
|------|---------|
| `src/utils/insightGenerators.ts` | All insight generators + registry |
| `tests/unit/utils/insightGenerators.test.ts` | Unit tests |

---

## Dependencies

**Must exist before this story (from Story 10.1 and 10.2):**
- `src/types/insight.ts` - InsightGenerator interface, Insight type
- `src/services/insightEngineService.ts` - Service shell with stubs

---

## 7 Transaction-Intrinsic Generators

| ID | Category | Triggers When | Cold-Start Safe |
|----|----------|---------------|-----------------|
| `biggest_item` | QUIRKY_FIRST | Always (if items exist) | Yes |
| `item_count` | QUIRKY_FIRST | items.length > 5 | Yes |
| `unusual_hour` | QUIRKY_FIRST | hour < 6 or hour >= 22 | Yes |
| `weekend_warrior` | QUIRKY_FIRST | Saturday or Sunday | Yes |
| `new_merchant` | CELEBRATORY | Merchant not in history | Yes (always first) |
| `new_city` | CELEBRATORY | City not in history | Yes (always first) |
| `category_variety` | QUIRKY_FIRST | 3+ unique categories in items | Yes |

---

## InsightGenerator Interface (from Story 10.1)

```typescript
// src/types/insight.ts (already created in 10.1)
export interface InsightGenerator {
  id: string;
  category: InsightCategory;
  canGenerate: (tx: Transaction, history: Transaction[]) => boolean;
  generate: (tx: Transaction, history: Transaction[]) => Insight;
}
```

---

## Generator Pattern

```typescript
const exampleGenerator: InsightGenerator = {
  id: 'example_id',           // snake_case
  category: 'QUIRKY_FIRST',   // or CELEBRATORY, ACTIONABLE
  canGenerate: (tx, history) => {
    // Return true if this insight applies
    return tx.items.length > 0;
  },
  generate: (tx, history) => ({
    id: 'example_id',
    category: 'QUIRKY_FIRST',
    title: 'Spanish Title',     // Always Spanish
    message: 'Message with ${tx.merchant}',
    icon: 'LucideIconName',     // From lucide-react
    priority: 5,                // Higher = better
    transactionId: tx.id,
  }),
};
```

---

## Transaction Fields Available

```typescript
// From src/types/transaction.ts
interface Transaction {
  id?: string;
  date: string;           // YYYY-MM-DD (used for weekend_warrior)
  time?: string;          // HH:mm (used for unusual_hour)
  merchant: string;       // Used for new_merchant
  category: string;       // Store category
  city?: string;          // Used for new_city
  total: number;
  items: TransactionItem[];
}

interface TransactionItem {
  name: string;
  price: number;
  category?: string;      // Item category (used for category_variety)
}
```

---

## Spanish Messages (Chilean Locale)

All messages must be in Spanish. Examples:
- "Compra destacada" (not "Purchase highlight")
- "$5.000" (not "$5,000" - use `toLocaleString('es-CL')`)
- "Primera vez en Jumbo" (not "First time at Jumbo")

---

## Registry Export

```typescript
// Export all generators as a registry
export const INSIGHT_GENERATORS: Record<string, InsightGenerator> = {
  biggest_item: biggestItemGenerator,
  item_count: itemCountGenerator,
  // ... etc
};

// Helper function
export function generateAllCandidates(
  transaction: Transaction,
  history: Transaction[]
): Insight[] {
  const candidates: Insight[] = [];
  for (const generator of Object.values(INSIGHT_GENERATORS)) {
    if (generator.canGenerate(transaction, history)) {
      candidates.push(generator.generate(transaction, history));
    }
  }
  return candidates;
}
```

---

## Testing Pattern

```typescript
describe('Transaction-Intrinsic Generators', () => {
  describe('biggest_item', () => {
    const gen = INSIGHT_GENERATORS.biggest_item;

    it('can generate when items exist', () => {
      const tx = createTransaction();
      expect(gen.canGenerate(tx, [])).toBe(true);
    });

    it('generates insight with most expensive item', () => {
      const tx = createTransaction({
        items: [
          { name: 'Cheap', price: 100 },
          { name: 'Expensive', price: 5000 },
        ],
      });
      const insight = gen.generate(tx, []);
      expect(insight.message).toContain('Expensive');
    });
  });
});
```

---

## Integration Point

This story creates generators. Story 10.5 (Selection Algorithm) will use them.

```typescript
// Story 10.5 will call:
import { generateAllCandidates } from '../utils/insightGenerators';

const candidates = generateAllCandidates(transaction, history);
const selected = selectInsight(candidates, profile, cache);
```
