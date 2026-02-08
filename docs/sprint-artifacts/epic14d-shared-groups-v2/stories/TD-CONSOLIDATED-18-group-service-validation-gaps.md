# Tech Debt Story TD-CONSOLIDATED-18: Group Service Input Validation Gaps

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-07) on story TD-CONSOLIDATED-1
> **Priority:** LOW
> **Estimated Effort:** 1-2 hours
> **Tier:** 2 - Security

## Story

As a **developer**,
I want **remaining input validation gaps in group service functions addressed**,
So that **all service functions have consistent validation depth**.

## Problem Statement

Two pre-existing validation gaps were identified during the TD-CONSOLIDATED-1 code review:

1. **photoURL not URL-validated** in `joinGroupDirectly()`: The field is sanitized via `sanitizeInput()` (strips script tags, dangerous protocols) but does not verify it's actually a valid URL (e.g., requiring `https://` prefix).

2. **createGroup BC-1 limit check not atomic**: `getGroupCount()` and `addDoc()` are separate operations. Concurrent requests could both pass the count check before either writes, theoretically exceeding the MAX_MEMBER_OF_GROUPS limit.

## Acceptance Criteria

- [ ] `joinGroupDirectly()` validates `photoURL` format (must start with `https://` if provided)
- [ ] `createGroup()` wraps count check + addDoc in a Firestore transaction for atomicity, OR documents why the current approach is acceptable (e.g., Firestore security rules enforce the limit)
- [ ] Existing tests updated to cover new validation
- [ ] No regressions in existing test suite

## Tasks / Subtasks

- [ ] Task 1: Add photoURL URL-format validation
  - [ ] 1.1: Add `https://` prefix check for photoURL in `joinGroupDirectly`
  - [ ] 1.2: Add test for invalid photoURL rejection
- [ ] Task 2: Evaluate BC-1 atomicity (investigate-then-decide)
  - [ ] 2.1: Check if Firestore security rules already enforce the limit
  - [ ] 2.2: If rules enforce it, add code comment documenting the defense layer
  - [ ] 2.3: If rules don't enforce it, wrap in transaction or add security rule

## Dev Notes

- Source story: [TD-CONSOLIDATED-1](./TD-CONSOLIDATED-1-groupservice-modularization.md)
- Review findings: #9 (MEDIUM, Security), #10 (MEDIUM, Security)
- Files affected: `src/features/shared-groups/services/groupMemberService.ts`, `src/features/shared-groups/services/groupService.ts`
- Both are pre-existing gaps from original monolithic groupService.ts
