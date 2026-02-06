# TD-CONSOLIDATED-12: React Query Cache Staleness

Status: backlog

> **Tier:** 5 - Technical Improvements (BACKLOG)
> **Consolidated from:** TD-14d-47
> **Priority:** LOW
> **Estimated Effort:** 2-3 hours
> **Risk:** MEDIUM
> **Dependencies:** None

## Story

As a **developer**,
I want **React Query cache properly invalidated after Firestore mutations**,
So that **UI always reflects the latest data without requiring manual refresh**.

## Problem Statement

React Query returns stale data after Firestore mutations. The cache is not properly invalidated/updated when mutations occur, leading to the UI showing outdated information until the next automatic refetch.

## Acceptance Criteria

- [ ] Implement optimistic cache update for group mutations
- [ ] Invalidate relevant queries after successful mutations
- [ ] Test that UI updates immediately after mutations
- [ ] No regression in existing group operations

## Cross-References

- **Original story:** [TD-14d-47](TD-ARCHIVED/TD-14d-47-react-query-cache-staleness.md)
- **Source:** E2E Test investigation (2026-02-04) on story 14d-v2-1-11c
