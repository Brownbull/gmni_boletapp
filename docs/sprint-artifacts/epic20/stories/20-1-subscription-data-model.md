# Story 20-1: Subscription Data Model and Tier Configuration

## Status: ready-for-dev

## Intent
**Epic Handle:** "Tickets at the door, wristbands inside"
**Story Handle:** "This story adds the ticket booth by defining the wristband types and where they're stored"

## Story
As a developer, I want the subscription data model, tier definitions, and TypeScript types, so that feature gating and payment integration have a foundation.

## Acceptance Criteria

### Functional
- **AC-1:** Given subscription collection path `/artifacts/{appId}/users/{userId}/subscription`, when created, then it stores tier, tierExpiry, paymentProvider, externalSubscriptionId, updatedAt
- **AC-2:** Given tier definitions (free/pro/max), when documented, then each tier lists: scan limit, export access, group access, statement access
- **AC-3:** Given Firestore security rules, when user reads own subscription, then read is ALLOWED
- **AC-4:** Given Firestore security rules, when user writes own subscription, then write is DENIED (Cloud Function only)

### Architectural
- **AC-ARCH-LOC-1:** Subscription types at `src/features/subscription/types.ts`
- **AC-ARCH-LOC-2:** Tier config at `src/features/subscription/config/tierConfig.ts`
- **AC-ARCH-PATTERN-1:** Subscription doc is separate from user profile (architecture decision 1c)
- **AC-ARCH-NO-1:** Client never writes subscription doc directly

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Subscription types | `src/features/subscription/types.ts` | FSD types | NEW |
| Tier config | `src/features/subscription/config/tierConfig.ts` | Config | NEW |
| Feature barrel | `src/features/subscription/index.ts` | FSD barrel | NEW |
| Firestore rules | `firestore.rules` | Security rules | MODIFIED |
| Collection paths | `src/shared/utils/collectionPaths.ts` | Path builder | MODIFIED |

## Tasks

### Task 1: Define Types and Config (3 subtasks)
- [ ] 1.1: Create subscription types: `SubscriptionTier`, `SubscriptionDoc`, `TierFeatures`
- [ ] 1.2: Create tier config: free (5 scans/day, basic export), pro (20 scans/day, all exports, groups), max (unlimited, all features)
- [ ] 1.3: Add subscription path to collection path builder

### Task 2: Security Rules (2 subtasks)
- [ ] 2.1: Add subscription doc rules: user can read own, only Cloud Functions can write
- [ ] 2.2: **HARDENING:** Verify rules don't break existing personal/group rules

### Task 3: Feature Scaffold (1 subtask)
- [ ] 3.1: Create `src/features/subscription/` directory structure and barrel

### Task 4: Verification (1 subtask)
- [ ] 4.1: Run `npm run test:quick` and `npx tsc --noEmit`

## Sizing
- **Points:** 2 (SMALL)
- **Tasks:** 4
- **Subtasks:** 7
- **Files:** ~5

## Dependencies
- None (first story in epic)

## Risk Flags
- DATA_PIPELINE (data model)

## Dev Notes
- Architecture decision 1c: Separate subscription collection, not merged into user profile
- Tier limits are configurable -- stored in code (tierConfig.ts), not in Firestore. Can be changed with a deploy.
- Default tier for all existing users: 'free' (no subscription doc needed -- absence = free)
- PaymentProvider field values: 'mercadopago' | 'flow' | 'dlocalgo' -- only mercadopago in initial implementation
