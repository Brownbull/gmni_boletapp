# Story 10.2: Phase Detection & User Profile

**Epic:** Epic 10 - Foundation + Engagement & Insight Engine
**Status:** ready-for-dev
**Story Points:** 3
**Dependencies:** Story 10.1 (InsightEngine Service Interface)

---

## User Story

As a **user**,
I want **the app to understand my journey stage**,
So that **I receive insights appropriate to my experience level**.

---

## Architecture Reference

**Architecture Document:** [architecture-epic10-insight-engine.md](../../planning/architecture-epic10-insight-engine.md)
**Key ADRs:** ADR-017 (Phase-Based Priority System)

---

## Acceptance Criteria

- [ ] **AC #1:** `calculateUserPhase()` correctly identifies WEEK_1 phase (0-7 days)
- [ ] **AC #2:** `calculateUserPhase()` correctly identifies WEEKS_2_3 phase (8-21 days)
- [ ] **AC #3:** `calculateUserPhase()` correctly identifies MATURE phase (22+ days)
- [ ] **AC #4:** UserInsightProfile Firestore document created on first insight generation
- [ ] **AC #5:** Profile tracks `firstTransactionDate` accurately
- [ ] **AC #6:** Profile tracks `totalTransactions` count
- [ ] **AC #7:** Profile stores `recentInsights` array (max 30 entries)
- [ ] **AC #8:** Firestore security rules allow user to read/write own profile
- [ ] **AC #9:** Phase calculation uses `firstTransactionDate`, not account creation

---

## Tasks / Subtasks

### Task 1: Implement Phase Calculation (0.5h)

In `src/services/insightEngineService.ts`:

```typescript
import { Timestamp } from 'firebase/firestore';
import { UserInsightProfile, UserPhase } from '../types/insight';

/**
 * Calculates user phase based on days since first transaction.
 *
 * Phase definitions (from ADR-017):
 * - WEEK_1: 0-7 days → 100% Quirky insights
 * - WEEKS_2_3: 8-21 days → 66% Celebratory / 33% Actionable
 * - MATURE: 22+ days → Weekday/weekend differentiation
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

### Task 2: Implement Profile Firestore Operations (1h)

Create `src/services/insightProfileService.ts`:

```typescript
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Firestore,
  arrayUnion,
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
  const profileRef = doc(db, PROFILE_COLLECTION, appId, 'users', userId, 'insightProfile', 'profile');
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
 */
export async function recordInsightShown(
  db: Firestore,
  userId: string,
  appId: string,
  insightId: string,
  transactionId?: string
): Promise<void> {
  const profileRef = doc(db, PROFILE_COLLECTION, appId, 'users', userId, 'insightProfile', 'profile');

  const record: InsightRecord = {
    insightId,
    shownAt: Timestamp.now(),
    transactionId,
  };

  await updateDoc(profileRef, {
    recentInsights: arrayUnion(record),
    totalTransactions: increment(1),
  });

  // Trim recentInsights to max 30 (done in a follow-up if needed)
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
    const profileRef = doc(db, PROFILE_COLLECTION, appId, 'users', userId, 'insightProfile', 'profile');
    await updateDoc(profileRef, {
      firstTransactionDate: Timestamp.fromDate(transactionDate),
    });
  }
}
```

### Task 3: Add Firestore Security Rules (0.5h)

Add to `firestore.rules`:

```
// Insight Profile rules
match /artifacts/{appId}/users/{userId}/insightProfile/{docId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

### Task 4: Unit Tests for Phase Calculation (1h)

Create `tests/unit/services/insightEngineService.phase.test.ts`:

```typescript
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

## Technical Summary

This story implements **phase detection** - the foundation of the phase-based priority system (ADR-017). The user's phase determines which type of insights they receive.

**Phase Purpose:**
| Phase | Duration | Insight Focus |
|-------|----------|---------------|
| WEEK_1 | Days 0-7 | Delight and engagement (100% Quirky) |
| WEEKS_2_3 | Days 8-21 | Build trust (66% Celebratory) |
| MATURE | Day 22+ | Provide value (Actionable insights) |

**Key Design Decision:**
Phase is calculated from `firstTransactionDate`, NOT account creation date. This means:
- User creates account Day 1
- User scans first receipt Day 30
- User is in WEEK_1 phase until Day 37

---

## Project Structure Notes

**Files to create:**
- `src/services/insightProfileService.ts`
- `tests/unit/services/insightEngineService.phase.test.ts`

**Files to modify:**
- `src/services/insightEngineService.ts` - Implement `calculateUserPhase()`
- `firestore.rules` - Add insightProfile rules

**Firestore Document Path:**
```
artifacts/{appId}/users/{userId}/insightProfile/profile
```

---

## Definition of Done

- [ ] All 9 acceptance criteria verified
- [ ] Phase calculation tested for all edge cases
- [ ] Firestore profile CRUD operations working
- [ ] Security rules deployed and tested
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
| 2025-12-16 | 1.0 | Story drafted as "Scan Complete Insights" |
| 2025-12-17 | 2.0 | **Retrofitted** - Renamed to "Phase Detection & User Profile" per architecture. Original scan complete UI moved to Story 10.6. |
