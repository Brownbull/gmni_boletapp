# Story 10.3: Transaction-Intrinsic Insights

**Epic:** Epic 10 - Foundation + Engagement & Insight Engine
**Status:** done
**Story Points:** 5
**Dependencies:** Story 10.2 (Phase Detection & User Profile)

---

## User Story

As a **new user**,
I want **to see interesting insights even on my first scan**,
So that **I immediately understand the value of the app**.

---

## Architecture Reference

**Architecture Document:** [architecture-epic10-insight-engine.md](../../planning/architecture-epic10-insight-engine.md)
**Brainstorming Document:** [epic-10-insight-engine-brainstorm.md](../../planning/epic-10-insight-engine-brainstorm.md)

---

## Acceptance Criteria

- [x] **AC #1:** 7 transaction-intrinsic insight generators implemented
- [x] **AC #2:** All generators follow `InsightGenerator` interface pattern
- [x] **AC #3:** `biggest_item` insight works with any transaction
- [x] **AC #4:** `item_count` triggers when items > 5
- [x] **AC #5:** `unusual_hour` triggers for purchases before 6am or after 10pm
- [x] **AC #6:** `weekend_warrior` triggers on Saturday/Sunday
- [x] **AC #7:** `new_merchant` triggers on first visit to a merchant
- [x] **AC #8:** `new_city` triggers when city differs from history
- [x] **AC #9:** `category_variety` triggers when receipt has 3+ categories
- [x] **AC #10:** All generators have Spanish messages (Chilean locale)

---

## Tasks / Subtasks

### Task 1: Create Insight Generators File (0.5h)

Create `src/utils/insightGenerators.ts`:

```typescript
import { Transaction } from '../types/transaction';
import { Insight, InsightGenerator, InsightCategory } from '../types/insight';

// Export all generators as a registry
export const INSIGHT_GENERATORS: Record<string, InsightGenerator> = {
  // Transaction-Intrinsic (this story)
  biggest_item: biggestItemGenerator,
  item_count: itemCountGenerator,
  unusual_hour: unusualHourGenerator,
  weekend_warrior: weekendWarriorGenerator,
  new_merchant: newMerchantGenerator,
  new_city: newCityGenerator,
  category_variety: categoryVarietyGenerator,

  // Pattern Detection (Story 10.4)
  // merchant_frequency: ...,
  // category_trend: ...,
  // etc.
};

/**
 * Generates all candidate insights for a transaction.
 */
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

### Task 2: Implement Cold-Start Generators (2h)

```typescript
// src/utils/insightGenerators.ts

// ============================================
// TRANSACTION-INTRINSIC GENERATORS
// These work with ANY single transaction (cold start)
// ============================================

const biggestItemGenerator: InsightGenerator = {
  id: 'biggest_item',
  category: 'QUIRKY_FIRST',
  canGenerate: (tx) => tx.items.length > 0,
  generate: (tx) => {
    const biggest = tx.items.reduce((max, item) =>
      item.price > max.price ? item : max
    , tx.items[0]);

    return {
      id: 'biggest_item',
      category: 'QUIRKY_FIRST',
      title: 'Compra destacada',
      message: `${biggest.name} fue lo más caro: $${biggest.price.toLocaleString('es-CL')}`,
      icon: 'Star',
      priority: 3,
      transactionId: tx.id,
    };
  },
};

const itemCountGenerator: InsightGenerator = {
  id: 'item_count',
  category: 'QUIRKY_FIRST',
  canGenerate: (tx) => tx.items.length > 5,
  generate: (tx) => ({
    id: 'item_count',
    category: 'QUIRKY_FIRST',
    title: 'Carrito lleno',
    message: `${tx.items.length} productos en esta compra`,
    icon: 'ShoppingCart',
    priority: 2,
    transactionId: tx.id,
  }),
};

const unusualHourGenerator: InsightGenerator = {
  id: 'unusual_hour',
  category: 'QUIRKY_FIRST',
  canGenerate: (tx) => {
    if (!tx.time) return false;
    const hour = parseInt(tx.time.split(':')[0], 10);
    return hour < 6 || hour >= 22;
  },
  generate: (tx) => {
    const hour = parseInt(tx.time!.split(':')[0], 10);
    const isLateNight = hour >= 22 || hour < 6;

    return {
      id: 'unusual_hour',
      category: 'QUIRKY_FIRST',
      title: isLateNight ? 'Compra nocturna' : 'Madrugador',
      message: isLateNight
        ? `Comprando a las ${tx.time} - ¡noctámbulo!`
        : `Comprando a las ${tx.time} - ¡tempranero!`,
      icon: 'Moon',
      priority: 5,
      transactionId: tx.id,
    };
  },
};

const weekendWarriorGenerator: InsightGenerator = {
  id: 'weekend_warrior',
  category: 'QUIRKY_FIRST',
  canGenerate: (tx) => {
    const date = new Date(tx.date);
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  },
  generate: (tx) => ({
    id: 'weekend_warrior',
    category: 'QUIRKY_FIRST',
    title: 'Compra de fin de semana',
    message: 'Aprovechando el finde para las compras',
    icon: 'Calendar',
    priority: 2,
    transactionId: tx.id,
  }),
};

const newMerchantGenerator: InsightGenerator = {
  id: 'new_merchant',
  category: 'CELEBRATORY',
  canGenerate: (tx, history) => {
    return !history.some(h => h.merchant === tx.merchant);
  },
  generate: (tx) => ({
    id: 'new_merchant',
    category: 'CELEBRATORY',
    title: 'Nuevo lugar',
    message: `Primera vez en ${tx.merchant}`,
    icon: 'MapPin',
    priority: 6,
    transactionId: tx.id,
  }),
};

const newCityGenerator: InsightGenerator = {
  id: 'new_city',
  category: 'CELEBRATORY',
  canGenerate: (tx, history) => {
    if (!tx.city) return false;
    return !history.some(h => h.city === tx.city);
  },
  generate: (tx) => ({
    id: 'new_city',
    category: 'CELEBRATORY',
    title: 'Nueva ciudad',
    message: `Primera compra en ${tx.city}`,
    icon: 'Globe',
    priority: 7,
    transactionId: tx.id,
  }),
};

const categoryVarietyGenerator: InsightGenerator = {
  id: 'category_variety',
  category: 'QUIRKY_FIRST',
  canGenerate: (tx) => {
    const uniqueCategories = new Set(
      tx.items
        .filter(item => item.category)
        .map(item => item.category)
    );
    return uniqueCategories.size >= 3;
  },
  generate: (tx) => {
    const uniqueCategories = new Set(
      tx.items
        .filter(item => item.category)
        .map(item => item.category)
    );

    return {
      id: 'category_variety',
      category: 'QUIRKY_FIRST',
      title: 'Compra variada',
      message: `${uniqueCategories.size} categorías diferentes en una boleta`,
      icon: 'Layers',
      priority: 3,
      transactionId: tx.id,
    };
  },
};
```

### Task 3: Unit Tests (1.5h)

Create `tests/unit/utils/insightGenerators.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  INSIGHT_GENERATORS,
  generateAllCandidates,
} from '../../../src/utils/insightGenerators';
import { Transaction } from '../../../src/types/transaction';

// Test fixtures
const createTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-123',
  date: '2025-12-17',
  merchant: 'Jumbo',
  category: 'Supermarket',
  total: 25000,
  items: [
    { name: 'Leche', price: 1500, category: 'Dairy & Eggs' },
    { name: 'Pan', price: 2000, category: 'Bakery' },
  ],
  ...overrides,
});

describe('Transaction-Intrinsic Generators', () => {
  describe('biggest_item', () => {
    const gen = INSIGHT_GENERATORS.biggest_item;

    it('can generate when items exist', () => {
      const tx = createTransaction();
      expect(gen.canGenerate(tx, [])).toBe(true);
    });

    it('cannot generate when no items', () => {
      const tx = createTransaction({ items: [] });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('generates insight with most expensive item', () => {
      const tx = createTransaction({
        items: [
          { name: 'Cheap', price: 100 },
          { name: 'Expensive', price: 5000 },
          { name: 'Medium', price: 1000 },
        ],
      });
      const insight = gen.generate(tx, []);
      expect(insight.message).toContain('Expensive');
      expect(insight.message).toContain('5.000');
    });
  });

  describe('item_count', () => {
    const gen = INSIGHT_GENERATORS.item_count;

    it('triggers when items > 5', () => {
      const tx = createTransaction({
        items: Array(6).fill({ name: 'Item', price: 100 }),
      });
      expect(gen.canGenerate(tx, [])).toBe(true);
    });

    it('does not trigger when items <= 5', () => {
      const tx = createTransaction({
        items: Array(5).fill({ name: 'Item', price: 100 }),
      });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });
  });

  describe('unusual_hour', () => {
    const gen = INSIGHT_GENERATORS.unusual_hour;

    it('triggers for late night (after 10pm)', () => {
      const tx = createTransaction({ time: '23:30' });
      expect(gen.canGenerate(tx, [])).toBe(true);
    });

    it('triggers for early morning (before 6am)', () => {
      const tx = createTransaction({ time: '05:30' });
      expect(gen.canGenerate(tx, [])).toBe(true);
    });

    it('does not trigger for normal hours', () => {
      const tx = createTransaction({ time: '14:00' });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('does not trigger when no time', () => {
      const tx = createTransaction({ time: undefined });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });
  });

  describe('weekend_warrior', () => {
    const gen = INSIGHT_GENERATORS.weekend_warrior;

    it('triggers on Saturday', () => {
      const tx = createTransaction({ date: '2025-12-20' }); // Saturday
      expect(gen.canGenerate(tx, [])).toBe(true);
    });

    it('triggers on Sunday', () => {
      const tx = createTransaction({ date: '2025-12-21' }); // Sunday
      expect(gen.canGenerate(tx, [])).toBe(true);
    });

    it('does not trigger on weekday', () => {
      const tx = createTransaction({ date: '2025-12-17' }); // Wednesday
      expect(gen.canGenerate(tx, [])).toBe(false);
    });
  });

  describe('new_merchant', () => {
    const gen = INSIGHT_GENERATORS.new_merchant;

    it('triggers when merchant not in history', () => {
      const tx = createTransaction({ merchant: 'New Store' });
      const history = [createTransaction({ merchant: 'Old Store' })];
      expect(gen.canGenerate(tx, history)).toBe(true);
    });

    it('does not trigger when merchant in history', () => {
      const tx = createTransaction({ merchant: 'Jumbo' });
      const history = [createTransaction({ merchant: 'Jumbo' })];
      expect(gen.canGenerate(tx, history)).toBe(false);
    });

    it('triggers on first transaction (empty history)', () => {
      const tx = createTransaction();
      expect(gen.canGenerate(tx, [])).toBe(true);
    });
  });

  describe('new_city', () => {
    const gen = INSIGHT_GENERATORS.new_city;

    it('triggers when city not in history', () => {
      const tx = createTransaction({ city: 'Valparaíso' });
      const history = [createTransaction({ city: 'Santiago' })];
      expect(gen.canGenerate(tx, history)).toBe(true);
    });

    it('does not trigger when city in history', () => {
      const tx = createTransaction({ city: 'Santiago' });
      const history = [createTransaction({ city: 'Santiago' })];
      expect(gen.canGenerate(tx, history)).toBe(false);
    });

    it('does not trigger when no city', () => {
      const tx = createTransaction({ city: undefined });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });
  });

  describe('category_variety', () => {
    const gen = INSIGHT_GENERATORS.category_variety;

    it('triggers when 3+ unique categories', () => {
      const tx = createTransaction({
        items: [
          { name: 'A', price: 100, category: 'Dairy & Eggs' },
          { name: 'B', price: 100, category: 'Bakery' },
          { name: 'C', price: 100, category: 'Produce' },
        ],
      });
      expect(gen.canGenerate(tx, [])).toBe(true);
    });

    it('does not trigger when < 3 categories', () => {
      const tx = createTransaction({
        items: [
          { name: 'A', price: 100, category: 'Dairy & Eggs' },
          { name: 'B', price: 100, category: 'Dairy & Eggs' },
        ],
      });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });
  });
});

describe('generateAllCandidates', () => {
  it('returns all applicable insights', () => {
    const tx = createTransaction({
      time: '23:30',
      date: '2025-12-20', // Saturday
      items: Array(6).fill({ name: 'Item', price: 100, category: 'Snacks' }),
    });

    const candidates = generateAllCandidates(tx, []);

    // Should have at least: biggest_item, item_count, unusual_hour, weekend_warrior, new_merchant
    expect(candidates.length).toBeGreaterThanOrEqual(5);
    expect(candidates.some(c => c.id === 'biggest_item')).toBe(true);
    expect(candidates.some(c => c.id === 'unusual_hour')).toBe(true);
  });
});
```

### Task 4: Integration with Service (0.5h)

Update `src/services/insightEngineService.ts` to use generators:

```typescript
import { generateAllCandidates } from '../utils/insightGenerators';

export async function generateInsightForTransaction(
  transaction: Transaction,
  allTransactions: Transaction[],
  profile: UserInsightProfile,
  cache: LocalInsightCache
): Promise<Insight | null> {
  // Generate all candidates
  const candidates = generateAllCandidates(transaction, allTransactions);

  // Select best using phase-based priority (Story 10.5)
  const selected = selectInsight(candidates, profile, cache);

  return selected || getFallbackInsight();
}
```

---

## Technical Summary

This story implements the **cold-start strategy** for the Insight Engine. These 7 generators work with ANY single transaction, ensuring new users see value immediately.

**Generator Categories:**
| Generator | Category | Purpose |
|-----------|----------|---------|
| `biggest_item` | QUIRKY_FIRST | Always available - highlight expensive item |
| `item_count` | QUIRKY_FIRST | Comment on large baskets |
| `unusual_hour` | QUIRKY_FIRST | Note early/late shopping |
| `weekend_warrior` | QUIRKY_FIRST | Weekend shopping recognition |
| `new_merchant` | CELEBRATORY | First visit celebration |
| `new_city` | CELEBRATORY | New location recognition |
| `category_variety` | QUIRKY_FIRST | Diverse shopping recognition |

**Cold Start Guarantee:**
Even with 0 transaction history, these insights are available:
- `biggest_item` - Always has a most expensive item
- `item_count` - Can comment on basket size (if > 5)
- `unusual_hour` - Time is always available (if captured)
- `weekend_warrior` - Date is always available
- `new_merchant` - First transaction = new merchant

---

## Project Structure Notes

**Files to create:**
- `src/utils/insightGenerators.ts`
- `tests/unit/utils/insightGenerators.test.ts`

**Files to modify:**
- `src/services/insightEngineService.ts` - Import and use generators

**Naming Conventions:**
- Insight IDs: `snake_case` (e.g., `biggest_item`)
- Generator constants: `camelCase` (e.g., `biggestItemGenerator`)

---

## Definition of Done

- [x] All 10 acceptance criteria verified
- [x] 7 generators implemented and tested
- [x] Generators follow `InsightGenerator` interface
- [x] All messages in Spanish (Chilean locale)
- [x] Unit tests passing (56 tests for generators, 1137 total)
- [ ] Code review approved

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes
Implemented 7 transaction-intrinsic insight generators following the architecture from Epic 10. All generators follow the `InsightGenerator` interface pattern established in Story 10.1.

**Key Implementation Details:**
- Created `src/utils/insightGenerators.ts` with all 7 generators and a registry
- Fixed timezone issue in `weekend_warrior` by parsing date components individually to avoid UTC conversion
- Integrated generators with `insightEngineService.ts` - service now calls `generateAllCandidates()` and uses `selectInsight()` for priority-based selection
- All Spanish messages use Chilean locale formatting (`toLocaleString('es-CL')`)
- Added helper functions: `getGenerator()`, `getGeneratorsByCategory()` for future pattern detection story

**Cold-Start Guarantee:**
- `biggest_item` - Always works if transaction has items
- `new_merchant` - Always triggers on first transaction (empty history)
- `weekend_warrior` - Works with date only
- Additional generators activate based on transaction data

### Files Modified
- `src/utils/insightGenerators.ts` (NEW) - 7 generators + registry + helper functions
- `tests/unit/utils/insightGenerators.test.ts` (NEW) - 56 comprehensive unit tests
- `src/services/insightEngineService.ts` - Integrated generators with main entry point
- `tests/unit/services/insightEngineService.test.ts` - Updated test to expect actual insights

### Test Results
- **56 new tests** for insightGenerators.ts covering all generators
- **1137 total tests** pass (no regressions)
- TypeScript type-check passes
- All boundary conditions tested (e.g., hour=22 for unusual_hour, day parsing for weekend)

---

## Review Notes

### Atlas-Enhanced Code Review - 2025-12-18

**Reviewer:** Claude Opus 4.5 (Atlas-Enhanced)
**Verdict:** ✅ **APPROVED with follow-up items**

#### Summary
- All 10 Acceptance Criteria: ✅ VERIFIED
- All 4 Tasks: ✅ COMPLETED
- Git vs Story Claims: ✅ ALIGNED
- Atlas Architecture Compliance: ✅ PASS (ADR-015, ADR-016, ADR-017)
- Atlas Pattern Compliance: ✅ PASS
- Tests: 1137 passing (56 new for generators)
- TypeScript: No errors

#### What Went Well
1. **Clean generator pattern** - All 7 generators follow `InsightGenerator` interface consistently
2. **Timezone-aware date parsing** - `weekend_warrior` correctly handles local dates
3. **Comprehensive tests** - 56 new tests with boundary condition coverage
4. **Spanish localization** - All messages in Chilean Spanish with proper formatting
5. **Cold-start guarantee** - Multiple generators work with zero history

#### Review Follow-ups (AI)

**MEDIUM Priority:**
- [x] [AI-Review][MEDIUM] ~~Potential crash if `tx.time` format malformed~~ - **FIXED**: Added `parseHour()` helper with regex validation. 3 new edge case tests added. [insightGenerators.ts:70-77]
- [ ] [AI-Review][MEDIUM] Case-sensitive merchant comparison may cause duplicate insights - "Jumbo" vs "jumbo" treated as different merchants. Test confirms intentional but consider `.toLowerCase()` normalization. [insightGenerators.ts:129]
- [ ] [AI-Review][MEDIUM] Story 10.2 files uncommitted - `insightProfileService.ts` files appear untracked despite Story 10.2 being "done". Ensure committed before next deployment.

**LOW Priority:**
- [x] [AI-Review][LOW] ~~`category_variety` may count empty string categories~~ - **FIXED**: Added explicit `String(item.category).trim()` check. [insightGenerators.ts:185]
- [ ] [AI-Review][LOW] Test uses `Array.fill()` with same object reference - `Array(6).fill(createItem())` creates 6 references to same object. Works because tests don't mutate, but could cause subtle bugs. [insightGenerators.test.ts:168]

#### Atlas Validation Results
- **Architecture (Section 4):** ✅ Follows ADR-015 (client-side), functional module pattern, correct code organization
- **Testing (Section 5):** ✅ Test naming, coverage, factory patterns all correct. 56 new tests.
- **Lessons (Section 6):** ✅ Timezone handling addressed proactively in `weekend_warrior`
- **Workflow Chains (Section 8):** ℹ️ New "Insight Generation Flow" - integrates with Scan Receipt flow as post-save side effect

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-17 | 1.0 | Story created from architecture (replaces Weekly Summary View) |
| 2025-12-18 | 1.1 | Implementation complete - all 10 ACs verified, 56 unit tests added |
| 2025-12-18 | 1.2 | **Code Review** - Atlas-enhanced review APPROVED with 5 follow-up items (3 MEDIUM, 2 LOW). Status → done. |
| 2025-12-18 | 1.3 | **Fixes Applied** - Fixed M1 (parseHour helper) and L2 (category trim). 1140 tests passing (+3 new edge case tests). |
