# Tech Debt Story TD-14d-40: Error Message Reset Time Enhancement

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-04) on story 14d-v2-1-11b
> **Priority:** LOW (UX improvement)
> **Estimated Effort:** XS (< 1 hour)
> **Risk:** LOW (string change only)

## Story

As a **group owner**,
I want **the daily limit error message to tell me when I can toggle again**,
So that **I know when to come back instead of guessing**.

## Problem Statement

Current error message:
```
"Daily toggle limit reached (3 changes per day)"
```

This doesn't tell the user when the limit resets.

## Acceptance Criteria

- [ ] AC1: Error message includes reset time information
- [ ] AC2: Message is i18n-ready (uses translation key)
- [ ] AC3: Unit test updated to verify new message format

## Tasks / Subtasks

- [ ] 1.1 Update error message in `groupService.ts:1329`
- [ ] 1.2 Add i18n translation if applicable
- [ ] 1.3 Update unit test assertion

## Dev Notes

### Proposed Change

```typescript
// Current (line 1329):
throw new Error('Daily toggle limit reached (3 changes per day)');

// Proposed:
throw new Error('Daily toggle limit reached (3 changes per day). Limit resets at midnight in your timezone.');
```

### Alternative with Dynamic Time

Could calculate actual reset time based on `transactionSharingToggleCountResetAt` + 24 hours, but simpler message is clearer.

### Files Affected

- `src/features/shared-groups/services/groupService.ts` (1 line)
- `tests/unit/features/shared-groups/services/groupService.test.ts` (assertion update)

### References

- [14d-v2-1-11b](./14d-v2-1-11b-service-layer-security.md) - Source story
