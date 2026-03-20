# Story 19-7: Group Invite Links

## Status: ready-for-dev

## Intent
**Epic Handle:** "Pin your receipts to the shared board"
**Story Handle:** "Add shareable keys — invite links that open the door for new members"

## Story
As a group admin, I want to generate invite links to share with potential members, so that they can join my group easily.

## Acceptance Criteria

### Functional
- **AC-1:** Given a Cloud Function `createInvite`, when admin generates a group invite, then a short code is stored in Firestore with groupId, expiry, and uses remaining
- **AC-2:** Given a Cloud Function `redeemInvite`, when a user redeems a valid invite code, then they are added to the group as a member (with memberProfiles populated)
- **AC-3:** Given an expired or exhausted invite, when redeemed, then the request is DENIED with clear error
- **AC-4:** Given a user who is already a group member, when they redeem an invite for that group, then return success with "already a member" message (idempotent — do NOT decrement uses)
- **AC-5:** Given a user who already belongs to 5 groups, when they redeem any invite, then the request is DENIED with GROUP_LIMIT_REACHED error
- **AC-6:** Given a user who attempts more than 10 redemptions in 5 minutes, when they try again, then the request is DENIED with RATE_LIMITED error
- **AC-7:** Given the admin UI, when admin taps "Generate Invite", then a shareable link/code is displayed with copy/share options

### Architectural
- **AC-ARCH-LOC-1:** Invite collection at `/artifacts/{appId}/invites/{code}`
- **AC-ARCH-LOC-2:** Cloud Functions at `functions/src/groups/createInvite.ts` and `functions/src/groups/redeemInvite.ts`
- **AC-ARCH-PATTERN-1:** Invite codes: 8-char alphanumeric, stored in Firestore
- **AC-ARCH-PATTERN-2:** Security rules: read if authenticated, write only via Cloud Function
- **AC-ARCH-PATTERN-3:** Rate limiting via Firestore rate doc per userId

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Create invite CF | `functions/src/groups/createInvite.ts` | Cloud Function | NEW |
| Redeem invite CF | `functions/src/groups/redeemInvite.ts` | Cloud Function | NEW |
| Rate limiter | `functions/src/groups/rateLimiter.ts` | Utility | NEW |
| Invite UI | `src/features/groups/components/InviteLinkGenerator.tsx` | FSD component | NEW |
| Redeem UI | `src/features/groups/components/RedeemInvite.tsx` | FSD component | NEW |
| Firestore rules | `firestore.rules` | Security rules | MODIFIED |
| Tests | `functions/src/groups/__tests__/invite.test.ts` | Jest | NEW |

## Tasks

### Task 1: Invite Cloud Functions (4 subtasks)
- [ ] 1.1: Build `createInvite` — generate 8-char alphanumeric code, store with groupId, expiresAt (7 days default), usesRemaining (10 default), type: 'group'
- [ ] 1.2: Build `redeemInvite` — validate code, check expiry/uses, check "already member" (idempotent — return success without decrementing), check group limit (max 5 per user), add member to group with memberProfiles populated, decrement uses
- [ ] 1.3: **HARDENING (TOCTOU):** Redeem uses transaction: check + decrement + add member atomically
- [ ] 1.4: **HARDENING (RATE_LIMITING):** Create `rateLimiter.ts` — Firestore rate doc per userId at `/artifacts/{appId}/rateLimits/{userId}`, reject if > 10 redemption attempts in 5 minutes. Reusable for Epic 20 registration invites.

### Task 2: Invite UI (2 subtasks)
- [ ] 2.1: Create `InviteLinkGenerator.tsx` — admin clicks generate, sees code, copy button (clipboard) + share button (navigator.share API for PWA, falls back to clipboard)
- [ ] 2.2: Create `RedeemInvite.tsx` — input field for code, redeem button, feedback for all states: success (joined), already member, expired, exhausted, rate limited, group limit reached

### Task 3: Security Rules (1 subtask)
- [ ] 3.1: Add invite collection rules: read if authenticated, write via Cloud Function only (admin SDK)

### Task 4: Tests (2 subtasks)
- [ ] 4.1: Unit tests: create invite (code generation, expiry), redeem (valid, expired, exhausted, already member idempotent, group limit reached, rate limited)
- [ ] 4.2: UI tests: InviteLinkGenerator and RedeemInvite components

### Task 5: Verification (1 subtask)
- [ ] 5.1: Build, deploy, run tests

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 5
- **Subtasks:** 10
- **Files:** ~7

## Dependencies
- **19-2** (group CRUD — member management, memberProfiles population)

## Risk Flags
- DATA_PIPELINE (invite lifecycle)
- INPUT_SANITIZATION (invite code input)

## Dev Notes
- Architecture decision 2b: Custom codes in Firestore. Firebase Dynamic Links is deprecated.
- Invite type field: `'group'` for this story, `'registration'` for Epic 20 (app-level invites)
- Code generation: `crypto.randomUUID().slice(0, 8)` or similar — short enough to share verbally
- Share mechanism: navigator.share API (PWA) or copy to clipboard fallback
- Rate limiter is reusable: same pattern applies to Epic 20 registration invites (20-5). Store at `/artifacts/{appId}/rateLimits/{userId}` with `{ attempts: number, windowStart: Timestamp }`.
- "Already member" check is idempotent — returns success without decrementing uses. This prevents confusion when sharing links in group chats where existing members might click the link.
