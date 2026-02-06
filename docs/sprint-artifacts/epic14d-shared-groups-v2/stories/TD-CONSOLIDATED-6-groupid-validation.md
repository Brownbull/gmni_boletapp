# TD-CONSOLIDATED-6: GroupId Validation

Status: ready-for-dev

> **Tier:** 2 - Security (SHOULD DO)
> **Consolidated from:** TD-14d-55
> **Priority:** MEDIUM (path injection prevention)
> **Estimated Effort:** 1-2 hours
> **Risk:** LOW
> **Dependencies:** None

## Story

As a **developer**,
I want **groupId validated before use in Firestore field paths**,
So that **path injection attacks are prevented**.

## Problem Statement

GroupId values are used directly in Firestore field paths without validation. A malicious groupId containing path separators (e.g., `/`) could potentially access unintended document paths.

## Acceptance Criteria

- [ ] Add `validateGroupId()` utility function
- [ ] Validate groupId format (alphanumeric + hyphens only)
- [ ] Apply validation at service layer entry points
- [ ] Unit tests for validation edge cases

## Cross-References

- **Original story:** [TD-14d-55](TD-ARCHIVED/TD-14d-55-groupid-validation.md)
- **Source:** ECC Parallel Review #2 (2026-02-05) on story 14d-v2-1-12a
