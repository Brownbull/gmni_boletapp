# TD-CONSOLIDATED-5: Invitation Read Restriction

Status: ready-for-dev

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

- [ ] Restrict `pendingInvitations` read to email match query only
- [ ] Update security rules to enforce `resource.data.email == request.auth.token.email`
- [ ] All invitation flows continue to work
- [ ] Security rules tests updated and passing

## Cross-References

- **Original story:** [TD-14d-5](TD-ARCHIVED/TD-14d-5-invitation-read-restriction.md)
- **Source:** ECC Code Review #5 (2026-02-03) on story 14d-v2-1-7e
