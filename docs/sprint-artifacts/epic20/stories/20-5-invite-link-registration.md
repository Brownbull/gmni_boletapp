# Story 20-5: Invite-Link Registration System

## Status: ready-for-dev

## Intent
**Epic Handle:** "Tickets at the door, wristbands inside"
**Story Handle:** "This story builds the front door -- users can only enter with a valid invite ticket"

## Story
As a platform operator, I want new user registration gated by invite links with caps and expiration, so that growth is controlled during early rollout.

## Acceptance Criteria

### Functional
- **AC-1:** Given an admin or existing user, when they generate an invite link, then a unique invite code is created with max uses and expiration
- **AC-2:** Given a new user with a valid invite link, when they visit the link, then they can register via Google OAuth
- **AC-3:** Given a new user without an invite link, when they try to register, then registration is blocked with a message explaining invite-only access
- **AC-4:** Given an invite link that has reached max uses, when a new user tries to use it, then registration is denied
- **AC-5:** Given an invite link past its expiration date, when a new user tries to use it, then registration is denied

### Architectural
- **AC-ARCH-LOC-1:** Invite Cloud Functions at `functions/src/invites/`
- **AC-ARCH-LOC-2:** Invite redemption UI at `src/features/auth/components/InviteGate.tsx`
- **AC-ARCH-PATTERN-1:** Invite validation happens server-side (Cloud Function), client only passes invite code
- **AC-ARCH-PATTERN-2:** TOCTOU: validate invite + increment usage counter in same Firestore transaction
- **AC-ARCH-NO-1:** No client-side invite validation (client cannot determine if invite is valid)

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Create invite CF | `functions/src/invites/createInvite.ts` | Cloud Function (callable) | NEW |
| Redeem invite CF | `functions/src/invites/redeemInvite.ts` | Cloud Function (callable) | NEW |
| Invite types | `functions/src/invites/types.ts` | Types | NEW |
| Invite gate component | `src/features/auth/components/InviteGate.tsx` | FSD component | NEW |
| Invite landing page | `src/features/auth/views/InviteLandingView.tsx` | FSD view | NEW |
| Auth flow | `src/features/auth/hooks/useAuth.ts` | Feature hook | MODIFIED |
| Firestore rules | `firestore.rules` | Security rules | MODIFIED |
| Tests | `functions/src/invites/__tests__/redeemInvite.test.ts` | Jest | NEW |

## Tasks

### Task 1: Invite Data Model (2 subtasks)
- [ ] 1.1: Define invite doc schema: `code`, `createdBy`, `maxUses`, `currentUses`, `expiresAt`, `type` ('registration')
- [ ] 1.2: Add Firestore security rules: invites readable by anyone (for validation), writable only by Cloud Functions

### Task 2: Create Invite Cloud Function (2 subtasks)
- [ ] 2.1: Create `createInvite` callable -- generates unique code, sets maxUses (default 10), expiresAt (default 7 days)
- [ ] 2.2: **HARDENING (INPUT_SANITIZATION):** Validate maxUses (1-100), expiresAt (1-30 days), sanitize all inputs

### Task 3: Redeem Invite Cloud Function (3 subtasks)
- [ ] 3.1: Create `redeemInvite` callable -- validates code exists, not expired, not maxed out
- [ ] 3.2: **HARDENING (TOCTOU):** Validate + increment `currentUses` in single Firestore transaction
- [ ] 3.3: On successful redemption, mark user's auth record as registered (allow login)

### Task 4: Client-Side Invite Flow (3 subtasks)
- [ ] 4.1: Create `InviteLandingView.tsx` -- parses invite code from URL, shows invite status
- [ ] 4.2: Create `InviteGate.tsx` -- wraps auth flow, blocks registration without valid invite
- [ ] 4.3: Modify auth hook to check invite redemption status before completing registration

### Task 5: Tests and Build (2 subtasks)
- [ ] 5.1: Unit tests: create invite validation, redeem invite (valid/expired/maxed), TOCTOU atomicity
- [ ] 5.2: `cd functions && npm run build` and `npm run test:quick`

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 5
- **Subtasks:** 12
- **Files:** ~8

## Dependencies
- None (independent of subscription stories, but same epic)

## Risk Flags
- DATA_PIPELINE (invite redemption -- race condition on concurrent uses)
- INPUT_SANITIZATION (invite parameters)
- TOCTOU (validate + increment must be atomic)

## Dev Notes
- FR-8.3: "New users can only register via invite links with caps and expiration"
- Invite link format: `https://app.boletapp.cl/invite/{code}` -- the code is a random string (nanoid or UUID)
- Registration blocking: existing users who are already logged in are NOT affected. Only new Google OAuth sign-ups are gated.
- The `type` field on invites allows reuse of this infrastructure for group invites (Epic 19, Story 19-7) with `type: 'group'`.
- Race condition on concurrent redemptions: Firestore transaction with `currentUses` increment prevents over-redemption.
- Admin invite creation: initially, only the app owner can create invites (hardcoded admin UID check). Future: admin panel.
- **Cross-epic note (from hardening analysis):** Rate limiting on `redeemInvite` -- prevent brute-force code guessing. Simple approach: reject if same IP/userId attempts > 10 redemptions in 5 minutes. Same pattern as Epic 19 group invites (19-7).
