# Story 10.2 Context: Phase Detection & User Profile

**Purpose:** Context document for implementing phase detection and Firestore user profile.
**Architecture:** [architecture-epic10-insight-engine.md](../../planning/architecture-epic10-insight-engine.md)
**Updated:** 2025-12-17 (Architecture-Aligned)

---

## Target Files

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/services/insightProfileService.ts` | Firestore profile CRUD |
| Modify | `src/services/insightEngineService.ts` | Implement `calculateUserPhase()` |
| Modify | `firestore.rules` | Add insightProfile security rules |
| Create | `tests/unit/services/insightEngineService.phase.test.ts` | Phase calculation tests |

---

## Phase Detection Logic (ADR-017)

```typescript
// src/services/insightEngineService.ts

import { Timestamp } from 'firebase/firestore';
import { UserInsightProfile, UserPhase } from '../types/insight';

/**
 * Calculates user phase based on days since first transaction.
 *
 * Phase definitions (from ADR-017):
 * - WEEK_1: 0-7 days → 100% Quirky insights
 * - WEEKS_2_3: 8-21 days → 66% Celebratory / 33% Actionable
 * - MATURE: 22+ days → Weekday/weekend differentiation
 *
 * IMPORTANT: Uses firstTransactionDate, NOT account creation date.
 */
export function calculateUserPhase(profile: UserInsightProfile): UserPhase {
  if (!profile.firstTransactionDate) {
    return 'WEEK_1'; // New user
  }

  const now = new Date();
  const firstDate = profile.firstTransactionDate.toDate();
  const daysSinceFirst = Math.floor(
    (now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceFirst <= 7) {
    return 'WEEK_1';
  }
  if (daysSinceFirst <= 21) {
    return 'WEEKS_2_3';
  }
  return 'MATURE';
}
```

---

## Phase Purpose Table

| Phase | Duration | Insight Focus | Why |
|-------|----------|---------------|-----|
| `WEEK_1` | Days 0-7 | 100% Quirky/Delightful | Build engagement, delight users |
| `WEEKS_2_3` | Days 8-21 | 66% Celebratory / 33% Actionable | Build trust, celebrate wins |
| `MATURE` | Day 22+ | Weekday: 66% Actionable, Weekend: 66% Celebratory | Provide value, respect context |

---

## Firestore Profile Service

```typescript
// src/services/insightProfileService.ts

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Firestore,
  arrayUnion,
  increment,
  Timestamp
} from 'firebase/firestore';
import { UserInsightProfile, InsightRecord } from '../types/insight';

const PROFILE_COLLECTION = 'artifacts';

/**
 * Gets the user's insight profile, creating one if it doesn't exist.
 */
export async function getOrCreateInsightProfile(
  db: Firestore,
  userId: string,
  appId: string
): Promise<UserInsightProfile> {
  const profileRef = doc(
    db,
    PROFILE_COLLECTION,
    appId,
    'users',
    userId,
    'insightProfile',
    'profile'
  );
  const snapshot = await getDoc(profileRef);

  if (snapshot.exists()) {
    return snapshot.data() as UserInsightProfile;
  }

  // Create new profile
  const newProfile: UserInsightProfile = {
    schemaVersion: 1,
    firstTransactionDate: serverTimestamp() as unknown as Timestamp,
    totalTransactions: 0,
    recentInsights: [],
  };

  await setDoc(profileRef, newProfile);
  return newProfile;
}

/**
 * Records that an insight was shown to the user.
 * Also increments totalTransactions.
 */
export async function recordInsightShown(
  db: Firestore,
  userId: string,
  appId: string,
  insightId: string,
  transactionId?: string
): Promise<void> {
  const profileRef = doc(
    db,
    PROFILE_COLLECTION,
    appId,
    'users',
    userId,
    'insightProfile',
    'profile'
  );

  const record: InsightRecord = {
    insightId,
    shownAt: Timestamp.now(),
    transactionId,
  };

  await updateDoc(profileRef, {
    recentInsights: arrayUnion(record),
    totalTransactions: increment(1),
  });

  // Note: Trimming recentInsights to 30 is handled separately if needed
}

/**
 * Updates the first transaction date if this is the user's first transaction.
 */
export async function ensureFirstTransactionDate(
  db: Firestore,
  userId: string,
  appId: string,
  transactionDate: Date
): Promise<void> {
  const profile = await getOrCreateInsightProfile(db, userId, appId);

  if (!profile.firstTransactionDate) {
    const profileRef = doc(
      db,
      PROFILE_COLLECTION,
      appId,
      'users',
      userId,
      'insightProfile',
      'profile'
    );
    await updateDoc(profileRef, {
      firstTransactionDate: Timestamp.fromDate(transactionDate),
    });
  }
}
```

---

## Firestore Document Structure

**Path:** `artifacts/{appId}/users/{userId}/insightProfile/profile`

```typescript
{
  schemaVersion: 1,
  firstTransactionDate: Timestamp,    // When user scanned first receipt
  totalTransactions: number,          // Count of insights shown
  recentInsights: [                   // Last 30 insights (for cooldown)
    {
      insightId: "merchant_frequency",
      shownAt: Timestamp,
      transactionId: "abc123"
    },
    // ... up to 30 entries
  ]
}
```

---

## Firestore Security Rules

Add to `firestore.rules`:

```
// Insight Profile rules
match /artifacts/{appId}/users/{userId}/insightProfile/{docId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

---

## Existing Firestore Patterns

**Reference:**
```
Location: /home/khujta/projects/bmad/boletapp/src/services/firestore.ts

Pattern used:
- doc(db, 'artifacts', appId, 'users', userId, 'transactions', transactionId)
- getDoc, setDoc, updateDoc from firebase/firestore
- serverTimestamp() for timestamps
- async functions returning Promise<void> or Promise<T>
```

---

## Unit Tests for Phase Calculation

```typescript
// tests/unit/services/insightEngineService.phase.test.ts

import { describe, it, expect } from 'vitest';
import { calculateUserPhase } from '../../../src/services/insightEngineService';
import { UserInsightProfile } from '../../../src/types/insight';
import { Timestamp } from 'firebase/firestore';

describe('calculateUserPhase', () => {
  const createProfile = (daysAgo: number): UserInsightProfile => ({
    schemaVersion: 1,
    firstTransactionDate: Timestamp.fromDate(
      new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
    ),
    totalTransactions: 10,
    recentInsights: [],
  });

  it('returns WEEK_1 for new user (no firstTransactionDate)', () => {
    const profile: UserInsightProfile = {
      schemaVersion: 1,
      firstTransactionDate: null as any,
      totalTransactions: 0,
      recentInsights: [],
    };
    expect(calculateUserPhase(profile)).toBe('WEEK_1');
  });

  it('returns WEEK_1 for user with first transaction today', () => {
    expect(calculateUserPhase(createProfile(0))).toBe('WEEK_1');
  });

  it('returns WEEK_1 for user with first transaction 7 days ago', () => {
    expect(calculateUserPhase(createProfile(7))).toBe('WEEK_1');
  });

  it('returns WEEKS_2_3 for user with first transaction 8 days ago', () => {
    expect(calculateUserPhase(createProfile(8))).toBe('WEEKS_2_3');
  });

  it('returns WEEKS_2_3 for user with first transaction 21 days ago', () => {
    expect(calculateUserPhase(createProfile(21))).toBe('WEEKS_2_3');
  });

  it('returns MATURE for user with first transaction 22 days ago', () => {
    expect(calculateUserPhase(createProfile(22))).toBe('MATURE');
  });

  it('returns MATURE for user with first transaction 100 days ago', () => {
    expect(calculateUserPhase(createProfile(100))).toBe('MATURE');
  });
});
```

---

## Key Design Decision

**Phase is calculated from `firstTransactionDate`, NOT account creation date.**

Example:
- User creates account Day 1
- User scans first receipt Day 30
- User is in WEEK_1 phase until Day 37

This means a user who returns after being inactive gets a fresh "onboarding" experience.

---

## Integration with Story 10.5

The phase calculated here feeds into the selection algorithm:

```typescript
// In selectInsight() - Story 10.5
const phase = calculateUserPhase(profile);
const priorityOrder = getInsightPriority(phase, scanCounter, isWeekend);
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Profile doesn't exist | Create new profile on first call |
| `firstTransactionDate` is null | Return `WEEK_1` phase |
| Firestore read fails | Let error propagate (handled by caller) |
| Profile corrupted | Reset to defaults |

---

## Key Differences from Old PRD

| Old (PRD) | New (Architecture) |
|-----------|-------------------|
| Scan Complete Insights (UI) | Phase Detection & User Profile (Logic) |
| Toast component | Firestore profile service |
| No phase concept | Three phases with clear boundaries |
| No Firestore storage | insightProfile subcollection |
