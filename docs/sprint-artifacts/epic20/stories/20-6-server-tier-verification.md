# Story 20-6: Server-Side Tier Verification

## Status: ready-for-dev

## Intent
**Epic Handle:** "Tickets at the door, wristbands inside"
**Story Handle:** "This story adds the bouncer at each VIP room -- the server double-checks the wristband before letting you in"

## Story
As a system, I want Cloud Functions to verify subscription tier before executing premium operations, so that client-side gating cannot be bypassed.

## Acceptance Criteria

### Functional
- **AC-1:** Given a `verifyTier` utility function, when called with userId and requiredTier, then it reads subscription doc and returns allowed/denied
- **AC-2:** Given a free-tier user calling a premium Cloud Function (e.g., advanced export), when tier check fails, then the function returns PERMISSION_DENIED
- **AC-3:** Given a pro-tier user calling a pro-tier function, when tier check passes, then the function executes normally
- **AC-4:** Given no subscription doc exists for user, when tier is checked, then user is treated as free tier

### Architectural
- **AC-ARCH-LOC-1:** Tier verification utility at `functions/src/payments/verifyTier.ts`
- **AC-ARCH-PATTERN-1:** verifyTier is a pure utility -- each Cloud Function calls it explicitly (no middleware magic)
- **AC-ARCH-PATTERN-2:** Tier check reads subscription doc inside the same transaction as the protected operation (TOCTOU)
- **AC-ARCH-NO-1:** No caching of tier status in Cloud Functions -- always read fresh from Firestore
- **AC-ARCH-NO-2:** No client-side tier verification for security decisions

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Tier verification utility | `functions/src/payments/verifyTier.ts` | Utility | NEW |
| Tier verification tests | `functions/src/payments/__tests__/verifyTier.test.ts` | Jest | NEW |
| Functions index | `functions/src/index.ts` | Barrel | MODIFIED (if new exports) |

## Tasks

### Task 1: Verification Utility (2 subtasks)
- [ ] 1.1: Create `verifyTier(userId, requiredTier)` -- reads subscription doc, compares tier hierarchy (free < pro < max)
- [ ] 1.2: Handle missing subscription doc as free tier, handle expired subscriptions (tierExpiry < now) as free tier

### Task 2: Integration Points (2 subtasks)
- [ ] 2.1: Add tier verification to premium export Cloud Function (if exists) or document integration pattern for future functions
- [ ] 2.2: Add tier verification to group creation Cloud Function (Epic 19 integration point -- groups require pro tier)

### Task 3: Tests (2 subtasks)
- [ ] 3.1: Unit tests: free user denied, pro user allowed, max user allowed, missing doc = free, expired = free
- [ ] 3.2: Unit tests: tier hierarchy (max can access pro features, pro cannot access max features)

### Task 4: Build (1 subtask)
- [ ] 4.1: `cd functions && npm run build` and `npm run test:quick`

## Sizing
- **Points:** 3 (SMALL-MEDIUM)
- **Tasks:** 4
- **Subtasks:** 7
- **Files:** ~3

## Dependencies
- **20-1** (subscription doc schema, tier definitions)

## Risk Flags
- TOCTOU (tier check must be inside transaction with protected operation)

## Dev Notes
- NFR-2.9: "Subscription tier status is stored server-side; client-side feature gating is backed by server-side verification"
- The verifyTier utility is intentionally simple -- it's a function, not middleware. Each Cloud Function that needs tier checking calls it explicitly inside its own transaction. This keeps the pattern visible and auditable.
- Tier hierarchy: free (0) < pro (1) < max (2). A user with tier >= requiredTier passes the check.
- Expired subscription handling: if `tierExpiry` is in the past, treat as free regardless of stored tier. The webhook (20-3) should also handle expiration events from Mercado Pago.
- This story may modify Cloud Functions from Epic 19 (groups) to add tier checks. If Epic 19 isn't built yet, document the integration pattern and add TODO comments.
