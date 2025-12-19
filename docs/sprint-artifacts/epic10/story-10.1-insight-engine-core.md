# Story 10.1: InsightEngine Service Interface

**Epic:** Epic 10 - Foundation + Engagement & Insight Engine
**Status:** done
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

- [x] **AC #1:** `types/insight.ts` defines all insight types and interfaces
- [x] **AC #2:** `UserPhase` type with 3 phases: `WEEK_1`, `WEEKS_2_3`, `MATURE`
- [x] **AC #3:** `InsightCategory` type: `QUIRKY_FIRST`, `CELEBRATORY`, `ACTIONABLE`
- [x] **AC #4:** `Insight` interface matches architecture spec
- [x] **AC #5:** `InsightGenerator` interface with `canGenerate()` and `generate()` methods
- [x] **AC #6:** `UserInsightProfile` interface for Firestore document
- [x] **AC #7:** `LocalInsightCache` interface for localStorage
- [x] **AC #8:** `insightEngineService.ts` exports main entry point function
- [x] **AC #9:** Service follows functional module pattern (not class-based)

---

## Tasks / Subtasks

### Task 1: Create Type Definitions (1h) [x]

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

### Task 2: Create Service Skeleton (0.5h) [x]

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

### Task 3: Create Storage Utilities (0.5h) [x]

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

### Task 4: Unit Tests (1h) [x]

Create `tests/unit/services/insightEngineService.test.ts`:

- [x] Test type exports are correct
- [x] Test `calculateUserPhase()` returns valid phases
- [x] Test `getFallbackInsight()` returns valid insight
- [x] Test `getLocalCache()` returns default on missing/corrupted
- [x] Test `checkCooldown()` logic

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

- [x] All 9 acceptance criteria verified
- [x] Types compile without errors
- [x] Service exports all required functions
- [x] Unit tests passing (47 new tests, 1057 total)
- [x] Code review approved

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes
- Created `src/types/insight.ts` with all type definitions matching architecture spec
- Created `src/services/insightEngineService.ts` following functional module pattern
- Implemented all core functions: `generateInsightForTransaction()`, `calculateUserPhase()`, `selectInsight()`, `checkCooldown()`, `getFallbackInsight()`
- Added local cache utilities: `getLocalCache()`, `setLocalCache()`, `getDefaultCache()`, `incrementScanCounter()`, `isInsightsSilenced()`, `silenceInsights()`, `clearSilence()`
- Included constants: `INSIGHT_CACHE_KEY`, `INSIGHT_COOLDOWN_MS`, `MAX_RECENT_INSIGHTS`, `PHASE_THRESHOLDS`
- Stub implementations return fallback insight - actual generators in Story 10.3/10.4, selection algorithm in Story 10.5

### Files Modified
**Created:**
- `src/types/insight.ts` - Core insight type definitions (173 lines)
- `src/services/insightEngineService.ts` - Insight engine service (381 lines)
- `tests/unit/services/insightEngineService.test.ts` - Unit tests (645 lines)

**Modified:**
- `docs/sprint-artifacts/sprint-status.yaml` - Story status: ready-for-dev → in-progress → review

### Test Results
- **47 new unit tests** added for insightEngineService (includes 4 defensive Timestamp handling tests)
- All 1057 unit tests passing
- All 328 integration tests passing
- TypeScript compiles without errors

---

## Review Notes

**Atlas-Enhanced Code Review: 2025-12-18**
- **Reviewer:** Claude Opus 4.5 (atlas-code-review workflow)
- **Verdict:** ✅ APPROVED

**Issues Addressed During Review:**
1. Added defensive handling for corrupted Firestore Timestamps in `checkCooldown()` - prevents crashes from malformed data
2. Added 4 new tests covering edge cases: null shownAt, throwing toDate(), null return from toDate(), invalid Date objects
3. Updated file line counts and test counts in story documentation

**Architecture Compliance:**
- ADR-015 (Client-Side Engine): ✅ Compliant
- ADR-016 (Hybrid Storage): ✅ Compliant
- ADR-017 (Phase-Based Priority): ✅ Compliant
- Functional module pattern: ✅ Compliant
- Naming conventions: ✅ Compliant

**Final Metrics:**
- 47 unit tests, all passing
- 1057 total unit tests
- TypeScript: No errors
- All 9 acceptance criteria verified

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted from Epic 10 PRD |
| 2025-12-17 | 2.0 | **Retrofitted** to match architecture-epic10-insight-engine.md |
| 2025-12-18 | 3.0 | **Implementation complete** - All ACs verified, ready for code review |
| 2025-12-18 | 4.0 | **Code review approved** - Added defensive Timestamp handling, 4 new edge case tests |
