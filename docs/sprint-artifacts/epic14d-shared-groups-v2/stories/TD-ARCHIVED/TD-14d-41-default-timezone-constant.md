# Tech Debt Story TD-14d-41: Use DEFAULT_TIMEZONE Constant

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-04) on story 14d-v2-1-11b
> **Priority:** LOW (DRY principle)
> **Estimated Effort:** XS (< 30 min)
> **Risk:** LOW (trivial change)

## Story

As a **developer**,
I want **consistent use of the DEFAULT_TIMEZONE constant**,
So that **timezone fallback is defined in one place**.

## Problem Statement

Line 1335 uses hardcoded `'UTC'` string:
```typescript
group.timezone || 'UTC'
```

But `DEFAULT_TIMEZONE` constant is already defined at line 79 of the same file.

## Acceptance Criteria

- [ ] AC1: Replace hardcoded `'UTC'` with `DEFAULT_TIMEZONE` constant
- [ ] AC2: Verify no other hardcoded 'UTC' strings in groupService.ts

## Tasks / Subtasks

- [ ] 1.1 Replace `'UTC'` with `DEFAULT_TIMEZONE` at line 1335
- [ ] 1.2 Search for other occurrences and fix if found

## Dev Notes

### Change Location

```typescript
// File: src/features/shared-groups/services/groupService.ts
// Line 1335

// Current:
group.timezone || 'UTC'

// Proposed:
group.timezone || DEFAULT_TIMEZONE
```

### References

- [14d-v2-1-11b](./14d-v2-1-11b-service-layer-security.md) - Source story
