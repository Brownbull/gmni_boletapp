# TD-CONSOLIDATED-10: TOCTOU Atomic Transactions

Status: backlog

> **Tier:** 5 - Technical Improvements (BACKLOG)
> **Consolidated from:** TD-14d-11
> **Priority:** LOW (nice to have)
> **Estimated Effort:** 2-3 hours
> **Risk:** MEDIUM
> **Dependencies:** None

## Story

As a **developer**,
I want **membership validation wrapped in Firestore transactions**,
So that **time-of-check to time-of-use (TOCTOU) race conditions are prevented**.

## Problem Statement

Group membership is validated in a separate read before mutations. In rare concurrent scenarios, a user could pass validation then have their membership removed before the mutation executes.

## Acceptance Criteria

- [ ] Wrap membership validation + mutation in Firestore transaction
- [ ] Cover: leave group, transfer ownership, delete group operations
- [ ] All existing tests pass
- [ ] Add concurrent operation test

## Cross-References

- **Original story:** [TD-14d-11](TD-ARCHIVED/TD-14d-11-toctou-membership-validation.md)
- **Source:** ECC Parallel Review (2026-02-03) on story 14d-v2-1-8a
