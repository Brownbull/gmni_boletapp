# TD-CONSOLIDATED-11: Server-Side Rate Limiting

Status: backlog

> **Tier:** 5 - Technical Improvements (BACKLOG)
> **Consolidated from:** TD-14d-6, TD-14d-39
> **Priority:** LOW (nice to have)
> **Estimated Effort:** 3-4 hours
> **Risk:** MEDIUM
> **Dependencies:** None

## Story

As a **developer**,
I want **server-side rate limiting for destructive group operations**,
So that **malicious or buggy clients cannot perform excessive deletions or modifications**.

## Problem Statement

Currently, rate limiting is only enforced client-side via cooldown utilities. A malicious client could bypass these and perform unlimited destructive operations. Server-side enforcement via Firestore security rules would provide defense in depth.

## Acceptance Criteria

- [ ] Add Firestore security rule rate limiting for delete operations
- [ ] Add rate limiting for group settings modifications
- [ ] Client-side cooldowns remain as UX layer
- [ ] Security rules tests updated
- [ ] Document approach in rate limiting ADR (see TD-CONSOLIDATED-9)

## Cross-References

- **Original stories:**
  - [TD-14d-6](TD-ARCHIVED/TD-14d-6-delete-rate-limiting.md) - Delete rate limiting
  - [TD-14d-39](TD-ARCHIVED/TD-14d-39-server-side-rate-limiting.md) - Server-side rate limiting
- **Related:** TD-CONSOLIDATED-9 (ADR documentation)
- **Sources:** ECC Reviews (2026-02-03, 2026-02-04)
