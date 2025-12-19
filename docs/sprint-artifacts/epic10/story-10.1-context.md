# Story 10.1 Context: InsightEngine Service Interface

**Purpose:** Context document for implementing the Insight Engine foundation - types and service interface.
**Architecture:** [architecture-epic10-insight-engine.md](../../planning/architecture-epic10-insight-engine.md)
**Updated:** 2025-12-17 (Architecture-Aligned)

---

## Target Files to Create

| File | Purpose |
|------|---------|
| `src/types/insight.ts` | All insight-related type definitions |
| `src/services/insightEngineService.ts` | Functional module with service interface |
| `tests/unit/services/insightEngineService.test.ts` | Unit tests |

---

## Type Definitions (from Architecture)

```typescript
// src/types/insight.ts

import { Timestamp } from 'firebase/firestore';
import { Transaction } from './transaction';

// User maturity phases (ADR-017)
export type UserPhase = 'WEEK_1' | 'WEEKS_2_3' | 'MATURE';

// Insight categories for selection algorithm
export type InsightCategory = 'QUIRKY_FIRST' | 'CELEBRATORY' | 'ACTIONABLE';

// Core insight interface
export interface Insight {
  id: string;                          // e.g., "merchant_frequency"
  category: InsightCategory;
  title: string;                       // e.g., "Visita frecuente"
  message: string;                     // e.g., "3ra vez en Jumbo este mes"
  icon?: string;                       // Lucide icon name
  priority: number;                    // For tie-breaking (higher = better)
  transactionId?: string;              // Which transaction triggered it
}

// Generator interface for all insight types
export interface InsightGenerator {
  id: string;
  category: InsightCategory;
  canGenerate: (tx: Transaction, history: Transaction[]) => boolean;
  generate: (tx: Transaction, history: Transaction[]) => Insight;
}

// Firestore document: artifacts/{appId}/users/{userId}/insightProfile/profile
export interface UserInsightProfile {
  schemaVersion: 1;
  firstTransactionDate: Timestamp;
  totalTransactions: number;
  recentInsights: InsightRecord[];  // Last 30 insights
}

export interface InsightRecord {
  insightId: string;
  shownAt: Timestamp;
  transactionId?: string;
}

// localStorage cache: boletapp_insight_cache
export interface LocalInsightCache {
  weekdayScanCount: number;
  weekendScanCount: number;
  lastCounterReset: string;           // ISO date
  silencedUntil: string | null;
  precomputedAggregates?: PrecomputedAggregates;
}

export interface PrecomputedAggregates {
  merchantVisits: Record<string, number>;
  categoryTotals: Record<string, number>;
  computedAt: string;                 // ISO timestamp
}
```

---

## Service Interface Pattern (ADR-015)

**Pattern:** Functional module, NOT class-based

```typescript
// src/services/insightEngineService.ts

import { Transaction } from '../types/transaction';
import {
  Insight,
  UserInsightProfile,
  LocalInsightCache,
  UserPhase,
  InsightRecord
} from '../types/insight';

// ============================================
// MAIN ENTRY POINT
// ============================================

/**
 * Main entry point - generates an insight for a transaction.
 * CRITICAL: MUST NOT block transaction save (async side-effect pattern).
 */
export async function generateInsightForTransaction(
  transaction: Transaction,
  allTransactions: Transaction[],
  profile: UserInsightProfile,
  cache: LocalInsightCache
): Promise<Insight | null> {
  // Stub - returns fallback
  return getFallbackInsight();
}

// ============================================
// PHASE CALCULATION (Story 10.2)
// ============================================

/**
 * Calculates user phase based on profile data.
 */
export function calculateUserPhase(profile: UserInsightProfile): UserPhase {
  // Stub - implemented in Story 10.2
  return 'WEEK_1';
}

// ============================================
// SELECTION ALGORITHM (Story 10.5)
// ============================================

/**
 * Selects the best insight from candidates using phase-based priority.
 */
export function selectInsight(
  candidates: Insight[],
  profile: UserInsightProfile,
  cache: LocalInsightCache
): Insight | null {
  // Stub - implemented in Story 10.5
  return candidates[0] || null;
}

/**
 * Checks if an insight is on cooldown (shown recently).
 */
export function checkCooldown(
  insightId: string,
  recentInsights: InsightRecord[]
): boolean {
  // Stub - implemented in Story 10.5
  return false;
}

// ============================================
// CACHE MANAGEMENT
// ============================================

const CACHE_KEY = 'boletapp_insight_cache';

export function getLocalCache(): LocalInsightCache {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Corrupted cache - reset
    }
  }
  return getDefaultCache();
}

export function setLocalCache(cache: LocalInsightCache): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export function getDefaultCache(): LocalInsightCache {
  return {
    weekdayScanCount: 0,
    weekendScanCount: 0,
    lastCounterReset: new Date().toISOString().split('T')[0],
    silencedUntil: null,
  };
}

// ============================================
// FALLBACK
// ============================================

/**
 * Fallback insight when no candidates available.
 */
export function getFallbackInsight(): Insight {
  return {
    id: 'building_profile',
    category: 'QUIRKY_FIRST',
    title: 'Construyendo tu perfil',
    message: 'Con más datos, te mostraremos insights personalizados.',
    priority: 0,
  };
}
```

---

## Existing Data Access Patterns

**Accessing Transactions:**
```
Location: /home/khujta/projects/bmad/boletapp/src/App.tsx

Hook: useTransactions
Returns: Transaction[] via Firestore subscription

Access pattern:
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
  time?: string;          // HH:mm
  country?: string;
  city?: string;
  currency?: string;
  createdAt?: any;        // Firestore timestamp
  merchantSource?: MerchantSource;
}
```

---

## Firestore Path for Profile

```
artifacts/{appId}/users/{userId}/insightProfile/profile
```

**Security Rule to Add:**
```
match /artifacts/{appId}/users/{userId}/insightProfile/{docId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

---

## localStorage Key

```
Key: boletapp_insight_cache
```

---

## Service Pattern Reference

**Existing Service (for pattern):**
```
Location: /home/khujta/projects/bmad/boletapp/src/services/firestore.ts

Pattern:
1. Import types
2. Export pure functions (no classes)
3. Each function handles one operation
4. Uses db, userId, appId pattern
```

---

## Testing Pattern

```typescript
// tests/unit/services/insightEngineService.test.ts

import { describe, it, expect } from 'vitest';
import {
  getFallbackInsight,
  getDefaultCache,
  calculateUserPhase
} from '../../../src/services/insightEngineService';

describe('insightEngineService', () => {
  describe('getFallbackInsight', () => {
    it('returns valid insight structure', () => {
      const insight = getFallbackInsight();
      expect(insight.id).toBe('building_profile');
      expect(insight.category).toBe('QUIRKY_FIRST');
      expect(insight.title).toBeDefined();
      expect(insight.message).toBeDefined();
    });
  });

  describe('getDefaultCache', () => {
    it('returns zeroed counters', () => {
      const cache = getDefaultCache();
      expect(cache.weekdayScanCount).toBe(0);
      expect(cache.weekendScanCount).toBe(0);
      expect(cache.silencedUntil).toBeNull();
    });
  });

  describe('calculateUserPhase', () => {
    it('returns WEEK_1 for new user', () => {
      // Stub test - actual implementation in Story 10.2
    });
  });
});
```

---

## Integration Points

**Where insightEngineService will be called:**
1. After transaction save → Story 10.6 (InsightCard component)
2. Batch mode summary → Story 10.7
3. NOT used for weekly/monthly summaries (deferred to future epic)

---

## Performance Requirements

From Architecture:
- **Total insight generation:** <100ms
- **Phase calculation:** <5ms
- **Cache operations:** <10ms

---

## Key Differences from Old PRD

| Old (PRD) | New (Architecture) |
|-----------|-------------------|
| Class `InsightEngine` | Functional module |
| 5 insight types | 25+ types in 4 categories |
| Confidence scoring | Phase-based priority + 33/66 sprinkle |
| `insightEngine.ts` | `insightEngineService.ts` |
| No phase concept | WEEK_1 → WEEKS_2_3 → MATURE |
| No storage design | Hybrid Firestore + localStorage |
