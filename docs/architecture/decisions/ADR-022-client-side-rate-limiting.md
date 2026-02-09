# ADR-022: Client-Side Rate Limiting for Sharing Toggles

## Status

Accepted (2026-02-04)

## Context

Stories 14d-v2-1-11a/b (group-level) and 14d-v2-1-12a/b (user-level) implement rate limiting for transaction sharing toggles. These toggles control whether a user's transactions are shared with their group. Rapid toggling could cause:

1. **Excessive Firestore writes** — Each toggle triggers a document update
2. **Changelog noise** — Each toggle generates a changelog entry for other group members
3. **UX confusion** — Rapid on/off creates inconsistent state for other members

Rate limiting must prevent abuse while keeping the implementation simple.

**Options considered:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Server-side Firestore rules** | Encode rate limits in security rules using `request.time` and stored timestamps | Tamper-proof; enforced at the database level | Complex rule logic; hard to express daily limits; no user-friendly error messages; rules become brittle |
| **Cloud Function middleware** | Route toggle through a Cloud Function that enforces rate limits | Full server-side control; rich error messages | Added latency; cold start delays; infrastructure cost; over-engineered for owner-only operations |
| **Client-side cooldowns** | Enforce cooldown and daily limits in JavaScript before calling Firestore | Simple; instant UX feedback; rich error messages; no infrastructure | Bypassable by sophisticated users via direct Firestore REST API |

## Decision

Use **client-side cooldowns** for rate limiting transaction sharing toggles.

### Rationale

1. **Owner-only impact** — The sharing toggle can only be changed by the group owner (group-level) or the individual user (user-level). A user bypassing their own rate limit only affects their own group. There is no privilege escalation or cross-user impact.

2. **Firestore rules as the real security boundary** — Firestore security rules already enforce that only the group owner can write to the group document, and only the user can write to their own preferences. Rate limiting is a UX guardrail, not a security boundary.

3. **Simplicity** — Client-side implementation requires no Cloud Functions, no complex Firestore rule expressions, and no additional infrastructure. The entire cooldown engine is ~120 lines in `cooldownCore.ts`.

4. **Rich UX feedback** — Client-side enforcement enables immediate, user-friendly messages: "Please wait 12 minutes" or "Daily limit reached, try again tomorrow." Server-side enforcement would require parsing error responses.

### Implementation

The cooldown system uses a shared engine (`cooldownCore.ts`) with two consumers:

**Architecture:**
```
cooldownCore.ts (shared engine)
├── sharingCooldown.ts     (group-level: 15min cooldown, 3x/day, group timezone)
└── userSharingCooldown.ts (user-level: 5min cooldown, 3x/day, device timezone)
```

**Rate Limits (FR-21):**

| Level | Cooldown | Daily Limit | Reset Strategy |
|-------|----------|-------------|----------------|
| Group-level | 15 minutes | 3 toggles/day | Midnight in group's IANA timezone |
| User-level | 5 minutes | 3 toggles/day | Midnight in device's local timezone |

**Cooldown State Machine:**
1. Check time-based cooldown (minutes since last toggle)
2. Check daily limit (considering midnight reset)
3. Return `{ allowed: true }` or `{ allowed: false, reason: 'cooldown' | 'daily_limit', waitMinutes?: number }`

**Key files:**
- `src/utils/cooldownCore.ts` — Shared cooldown engine (TD-CONSOLIDATED-4 DRY extraction)
- `src/utils/sharingCooldown.ts` — Group-level cooldown (IANA timezone)
- `src/utils/userSharingCooldown.ts` — User-level cooldown (device timezone)
- `src/features/shared-groups/services/groupService.ts` — `updateTransactionSharingEnabled()` calls `canToggleTransactionSharing()` before mutation

### Security Trade-off

**What a sophisticated owner could do:** Use the Firebase REST API or Firestore SDK directly to bypass client-side cooldown checks and toggle sharing more frequently.

**Why this is acceptable:**
- The owner can only modify their own group's `transactionSharingEnabled` field
- Firestore rules prevent non-owners from writing this field
- Excessive toggling only creates changelog noise in the owner's own group
- The cooldown timestamps are stored in Firestore and would still be updated, making the bypass self-limiting for the daily count
- If server-side enforcement becomes necessary, TD-CONSOLIDATED-11 (Server-Side Rate Limiting) is already planned as a future story

## Consequences

### Positive

- Simple implementation (~120 LOC shared engine)
- Instant UX feedback with clear error messages
- No Cloud Function infrastructure or cold-start latency
- Easily testable (pure functions with injectable `now` parameter)
- DRY: single engine serves both group and user levels

### Negative

- Technically bypassable by a determined group owner
- Cooldown state could drift if device clock is wrong (mitigated by server timestamps on writes)

### Future Considerations

- **TD-CONSOLIDATED-11** proposes server-side rate limiting for destructive operations (group deletion, member removal). If implemented, the sharing toggle could be included.
- If abuse is detected in production analytics, server-side enforcement can be added without changing the client UX (add Firestore rule validation alongside existing client checks).

## References

- [Story 14d-v2-1-11b](../../sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-11b-service-layer-security.md) — Group-level toggle service
- [Story 14d-v2-1-12a](../../sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-12a-foundation-types-cooldown.md) — User-level cooldown foundation
- [TD-CONSOLIDATED-4](../../sprint-artifacts/epic14d-shared-groups-v2/stories/TD-CONSOLIDATED-4-cooldown-core-extraction.md) — DRY extraction of cooldown engine
- [TD-CONSOLIDATED-11](../../sprint-artifacts/epic14d-shared-groups-v2/stories/TD-CONSOLIDATED-11-server-side-rate-limiting.md) — Future server-side rate limiting
- ECC Code Review 2026-02-04 — Security Reviewer finding on story 14d-v2-1-11b
