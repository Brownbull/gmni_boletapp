# TD-CONSOLIDATED-5: Invitation Read Restriction

Status: done

> **Tier:** 2 - Security (SHOULD DO)
> **Consolidated from:** TD-14d-5
> **Priority:** MEDIUM (privacy enhancement)
> **Estimated Effort:** 2-3 hours
> **Risk:** LOW (security rule change, backward compatible)
> **Dependencies:** None

## Story

As a **user**,
I want **only my own pending invitations to be readable**,
So that **my email address and invitation status are not exposed to other users**.

## Problem Statement

Current Firestore security rules allow any authenticated user to read all pending invitations. This exposes email addresses, group names/IDs, and invitation statuses of other users.

## Acceptance Criteria

- [x] Restrict `pendingInvitations` list to email match or inviter match query only
- [x] Update security rules to enforce `resource.data.invitedEmail == request.auth.token.email` (list) while keeping `get` open for accept/decline flows
- [x] All invitation flows continue to work (deep link, manual code entry, group deletion)
- [x] Security rules tests updated and passing (Tests 6, 6b, 6c, 6d, 6e)

## Implementation Notes

**Firestore Rules** (TD-CONSOLIDATED-5):
- Split `allow read` into `allow get` (any auth) + `allow list` (restricted)
- List rule allows two patterns: email match (invitee) OR invitedByUserId match (owner cleanup)
- Get remains open for accept/decline flows using document IDs

**Service Changes**:
- `getInvitationByShareCode` accepts optional `userEmail` for email-filtered queries
- `deletePendingInvitationsForGroup` now filters by `invitedByUserId` for rule compliance

**Composite Indexes Added**:
- `shareCode + invitedEmail + status` (email-filtered share code lookup)
- `groupId + invitedByUserId` (owner deletion cleanup)

## Deferred Items

- `checkDuplicateInvitation` and `validateInvitationByShareCode` are exported but would fail under new list rules if called from client-side (currently unused). Flagged with JSDoc `@deprecated` warnings. Should be moved to Cloud Functions if needed in future.
- `allow get` permits any authenticated user to read by document ID. Could be narrowed to invitee+inviter only if accept/decline flows confirm they don't need broader access. Accepted risk — document IDs are cryptographically random (~10^35 possibilities).
- Email case sensitivity: `resource.data.invitedEmail` (normalized lowercase) vs `request.auth.token.email` — Google Sign-In typically returns lowercase, but not enforced as invariant. Low probability issue.

## Senior Developer Review (ECC)

- **Review date:** 2026-02-08
- **Classification:** STANDARD
- **ECC agents used:** code-reviewer, security-reviewer
- **Overall score:** 8/10
- **Outcome:** APPROVED — 6 quick fixes applied, 0 blockers
- **Quick fixes applied:**
  1. `getInvitationByShareCode` now returns null early when `userEmail` is missing (prevents opaque Firestore permission errors)
  2. Added orphan-expiry comments to `deletePendingInvitationsForGroup` call sites
  3. Changed `@security` to `@deprecated` on `checkDuplicateInvitation` and `validateInvitationByShareCode`
  4. Added DEV-guard to `console.error` in JoinGroupByCode and useDeepLinkInvitation
  5. Added comment to retained `shareCode + status` index (Cloud Functions use only)
  6. Added missing composite index for `invitedEmail + status + createdAt` (orderBy)

## Cross-References

- **Original story:** [TD-14d-5](TD-ARCHIVED/TD-14d-5-invitation-read-restriction.md)
- **Source:** ECC Code Review #5 (2026-02-03) on story 14d-v2-1-7e
