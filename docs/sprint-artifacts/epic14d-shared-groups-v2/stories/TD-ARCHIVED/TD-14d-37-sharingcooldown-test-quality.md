# Tech Debt Story TD-14d-37: sharingCooldown Test Quality Improvements

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-04) on story 14d-v2-1-11a
> **Priority:** LOW (nice-to-have improvements)
> **Estimated Effort:** S (1-2 hours)
> **Risk:** LOW (tests are fully functional as-is)

## Story

As a **developer**,
I want **improved test quality patterns in the sharingCooldown test suite**,
So that **the tests are more maintainable and follow best practices**.

## Problem Statement

The `sharingCooldown.test.ts` test file has several minor quality issues identified during ECC code review:

1. **Magic numbers:** `1000 * 60` used for ms-to-minutes conversion without named constant
2. **Future dates:** Tests use hardcoded dates like `'2026-02-04T12:00:00Z'`
3. **Type assertions:** Migration tests use `as any` instead of typed partial mocks
4. **Missing documentation:** `createMockTimestamp` helper lacks JSDoc

These do not affect test correctness but could improve maintainability.

## Acceptance Criteria

**AC1:** Extract `MS_PER_MINUTE = 60_000` constant in source file
**AC2:** Add JSDoc to `createMockTimestamp` test helper
**AC3:** Create typed `createPartialGroup()` factory for migration tests
**AC4:** (Optional) Consider relative date patterns or document why absolute dates are acceptable

## Tasks / Subtasks

### Task 1: Source File Improvement

- [ ] 1.1 Add `MS_PER_MINUTE` constant to `sharingCooldown.ts`
- [ ] 1.2 Replace `1000 * 60` calculation with constant

### Task 2: Test Helper Improvements

- [ ] 2.1 Add JSDoc to `createMockTimestamp` explaining purpose and usage
- [ ] 2.2 Create `createPartialGroup(overrides)` typed factory function
- [ ] 2.3 Update migration tests (lines 254-307) to use factory instead of `as any`

### Task 3: Documentation

- [ ] 3.1 Add comment explaining why absolute dates are acceptable (now param injection)

## Dev Notes

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| **Merge conflict risk** | Low | Low |
| **Impact** | Minor readability improvement | None - tests work correctly |
| **Sprint capacity** | 1-2 hours | Scheduled for later |

**Recommendation:** Safe to defer indefinitely or address opportunistically when touching these files.

### Why Absolute Dates Are Acceptable

The tests inject `now` parameter, making the actual date values irrelevant to test correctness. The dates could be from 1970 or 2099 and tests would still pass. This is a non-issue but documenting it prevents future confusion.

### Typed Factory Pattern

```typescript
type PartialGroupForCooldown = Partial<Pick<SharedGroup,
    | 'transactionSharingLastToggleAt'
    | 'transactionSharingToggleCountToday'
    | 'transactionSharingToggleCountResetAt'
    | 'timezone'
>>;

function createPartialGroup(overrides: PartialGroupForCooldown = {}): PartialGroupForCooldown {
    return {
        timezone: 'America/Santiago',
        ...overrides,
    };
}
```

### Dependencies

- None - this is a pure quality improvement story

### References

- [14d-v2-1-11a](./14d-v2-1-11a-foundation-types-cooldown.md) - Source of this tech debt item
- ECC Code Review findings: 4 LOW severity items consolidated
