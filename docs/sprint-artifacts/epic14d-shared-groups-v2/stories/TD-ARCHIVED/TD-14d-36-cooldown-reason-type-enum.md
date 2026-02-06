# Tech Debt Story TD-14d-36: Refactor Cooldown Reason to Const Enum

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-04) on story 14d-v2-1-11a
> **Priority:** LOW (optional improvement, not blocking)
> **Estimated Effort:** XS (< 1 hour)
> **Risk:** LOW (TypeScript provides safety with current string literals)

## Story

As a **developer**,
I want **the toggle block reason to use a const enum pattern instead of string literals**,
So that **refactoring is safer and IDE support is improved across the codebase**.

## Problem Statement

The `reason` field in `ToggleCooldownResult` uses inline string literals (`'cooldown' | 'daily_limit'`). While TypeScript still provides type safety, this pattern has drawbacks:

1. **Refactoring risk:** Renaming a reason requires finding all usages manually
2. **IDE support:** No autocomplete for reason values in consuming code
3. **Consistency:** Other parts of codebase use const object pattern (e.g., `SHARED_GROUP_LIMITS`)

**Current implementation:**
```typescript
export interface ToggleCooldownResult {
    allowed: boolean;
    waitMinutes?: number;
    reason?: 'cooldown' | 'daily_limit';  // String literals
}
```

**Proposed implementation:**
```typescript
export const TOGGLE_BLOCK_REASONS = {
    COOLDOWN: 'cooldown',
    DAILY_LIMIT: 'daily_limit',
} as const;

export type ToggleBlockReason = typeof TOGGLE_BLOCK_REASONS[keyof typeof TOGGLE_BLOCK_REASONS];

export interface ToggleCooldownResult {
    allowed: boolean;
    waitMinutes?: number;
    reason?: ToggleBlockReason;
}
```

## Acceptance Criteria

**AC1:** `TOGGLE_BLOCK_REASONS` constant object is exported from `sharingCooldown.ts`
**AC2:** `ToggleBlockReason` type is derived from the constant object
**AC3:** `ToggleCooldownResult.reason` uses the new type
**AC4:** All usages in `canToggleTransactionSharing()` use the constant
**AC5:** All tests use the exported constants instead of string literals
**AC6:** Stories 11b and 11c (if already implemented) are updated to use constants

## Tasks / Subtasks

### Task 1: Extract Constants

- [ ] 1.1 Create `TOGGLE_BLOCK_REASONS` constant object in `sharingCooldown.ts`
- [ ] 1.2 Create `ToggleBlockReason` derived type
- [ ] 1.3 Update `ToggleCooldownResult` interface to use new type
- [ ] 1.4 Update `canToggleTransactionSharing()` to use constants

### Task 2: Update Tests

- [ ] 2.1 Import `TOGGLE_BLOCK_REASONS` in test file
- [ ] 2.2 Replace string literal assertions with constant references
- [ ] 2.3 Run tests to verify no regressions

### Task 3: Update Downstream Code (if applicable)

- [ ] 3.1 Search for usages of `'cooldown'` and `'daily_limit'` strings
- [ ] 3.2 Update any consuming code in Stories 11b/11c

## Dev Notes

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| **Merge conflict risk** | Low - isolated change | Low |
| **Context window fit** | XS effort | Clean separation |
| **Accumulation risk** | None - TypeScript handles safety | None |

**Recommendation:** Safe to defer indefinitely. Current implementation is fully functional and type-safe.

### Dependencies

- None - this is a pure refactoring story

### References

- [14d-v2-1-11a](./14d-v2-1-11a-foundation-types-cooldown.md) - Source of this tech debt item
- ECC Code Review finding: MEDIUM severity (optional improvement)
