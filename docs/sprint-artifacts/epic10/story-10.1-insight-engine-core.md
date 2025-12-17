# Story 10.1: InsightEngine Service Interface

**Epic:** Epic 10 - Foundation + Engagement & Insight Engine
**Status:** ready-for-dev
**Story Points:** 3
**Dependencies:** Story 10.0 (Foundation Sprint)

---

## User Story

As a **developer**,
I want **a well-defined InsightEngine service interface with core types**,
So that **all insight-related stories can build on a consistent foundation**.

---

## Architecture Reference

**Architecture Document:** [architecture-epic10-insight-engine.md](../../planning/architecture-epic10-insight-engine.md)
**Key ADRs:** ADR-015 (Client-Side Engine), ADR-016 (Hybrid Storage)

---

## Acceptance Criteria

- [ ] **AC #1:** `types/insight.ts` defines all insight types and interfaces
- [ ] **AC #2:** `UserPhase` type with 3 phases: `WEEK_1`, `WEEKS_2_3`, `MATURE`
- [ ] **AC #3:** `InsightCategory` type: `QUIRKY_FIRST`, `CELEBRATORY`, `ACTIONABLE`
- [ ] **AC #4:** `Insight` interface matches architecture spec
- [ ] **AC #5:** `InsightGenerator` interface with `canGenerate()` and `generate()` methods
- [ ] **AC #6:** `UserInsightProfile` interface for Firestore document
- [ ] **AC #7:** `LocalInsightCache` interface for localStorage
- [ ] **AC #8:** `insightEngineService.ts` exports main entry point function
- [ ] **AC #9:** Service follows functional module pattern (not class-based)

---

## Tasks / Subtasks

### Task 1: Create Type Definitions (1h)

Create `src/types/insight.ts`:

```typescript
// User maturity phases
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

// Firestore document: users/{userId}/insightProfile
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

### Task 2: Create Service Skeleton (0.5h)

Create `src/services/insightEngineService.ts`:

```typescript
import { Transaction } from '../types/transaction';
import {
  Insight,
  UserInsightProfile,
  LocalInsightCache,
  UserPhase
} from '../types/insight';

/**
 * Main entry point - generates an insight for a transaction.
 * MUST NOT block transaction save (async side-effect pattern).
 */
export async function generateInsightForTransaction(
  transaction: Transaction,
  allTransactions: Transaction[],
  profile: UserInsightProfile,
  cache: LocalInsightCache
): Promise<Insight | null> {
  // Stub implementation - returns fallback
  return getFallbackInsight();
}

/**
 * Calculates user phase based on profile data.
 */
export function calculateUserPhase(profile: UserInsightProfile): UserPhase {
  // Stub implementation
  return 'WEEK_1';
}

/**
 * Selects the best insight from candidates using phase-based priority.
 */
export function selectInsight(
  candidates: Insight[],
  profile: UserInsightProfile,
  cache: LocalInsightCache
): Insight | null {
  // Stub implementation
  return candidates[0] || null;
}

/**
 * Checks if an insight is on cooldown (shown recently).
 */
export function checkCooldown(
  insightId: string,
  recentInsights: InsightRecord[]
): boolean {
  // Stub implementation - 1 week cooldown
  return false;
}

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

### Task 3: Create Storage Utilities (0.5h)

Create helper functions for profile and cache management:

```typescript
// In insightEngineService.ts or separate file

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
```

### Task 4: Unit Tests (1h)

Create `tests/unit/services/insightEngineService.test.ts`:

- Test type exports are correct
- Test `calculateUserPhase()` returns valid phases
- Test `getFallbackInsight()` returns valid insight
- Test `getLocalCache()` returns default on missing/corrupted
- Test `checkCooldown()` logic

---

## Technical Summary

This story establishes the **foundation** for the Insight Engine. It creates the type definitions and service interface that all subsequent stories will build upon.

**Key Architecture Decisions Applied:**
1. **Functional module pattern** - No classes, just exported functions
2. **Hybrid storage** - Firestore for profile, localStorage for cache
3. **Single entry point** - `generateInsightForTransaction()` is the only public API

**What This Story Does NOT Include:**
- Actual insight generators (Story 10.3, 10.4)
- Selection algorithm with sprinkle logic (Story 10.5)
- UI components (Story 10.6)

---

## Project Structure Notes

**Files to create:**
- `src/types/insight.ts`
- `src/services/insightEngineService.ts`
- `tests/unit/services/insightEngineService.test.ts`

**Files NOT modified:**
- No changes to existing code
- This is pure additive foundation

**Naming Conventions (from Architecture):**
| Type | Convention | Example |
|------|------------|---------|
| Insight IDs | snake_case | `merchant_frequency` |
| Type interfaces | PascalCase | `UserInsightProfile` |
| Service files | camelCase + Service | `insightEngineService.ts` |

---

## Definition of Done

- [ ] All 9 acceptance criteria verified
- [ ] Types compile without errors
- [ ] Service exports all required functions
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
| 2025-12-16 | 1.0 | Story drafted from Epic 10 PRD |
| 2025-12-17 | 2.0 | **Retrofitted** to match architecture-epic10-insight-engine.md |
