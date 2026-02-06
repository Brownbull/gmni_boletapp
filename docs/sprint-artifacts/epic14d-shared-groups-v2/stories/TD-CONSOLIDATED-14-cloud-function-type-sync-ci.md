# TD-CONSOLIDATED-14: Cloud Function Type Sync CI

Status: backlog

> **Tier:** 5 - Technical Improvements (BACKLOG)
> **Consolidated from:** TD-14d-9
> **Priority:** LOW
> **Estimated Effort:** 1-2 hours
> **Risk:** LOW
> **Dependencies:** None

## Story

As a **developer**,
I want **CI validation that Cloud Function types stay synchronized with client types**,
So that **type mismatches between client and server are caught before deployment**.

## Problem Statement

Cloud Functions and the client app share TypeScript types (e.g., changelog entries, group structures). Currently there's no CI check to ensure these stay synchronized when either side changes.

## Acceptance Criteria

- [ ] Add CI step to validate shared types between client and Cloud Functions
- [ ] Fail build if types diverge
- [ ] Document sync validation approach

## Cross-References

- **Original story:** [TD-14d-9](TD-ARCHIVED/TD-14d-9-type-sync-validation.md)
- **Source:** ECC Parallel Review (2026-02-03) on story 14d-v2-1-8a
