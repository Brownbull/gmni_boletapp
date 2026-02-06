# Tech Debt Story TD-14d-54: Barrel Export Type Completeness

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-05) on story 14d-v2-1-12a
> **Priority:** LOW (consistency improvement)
> **Estimated Effort:** XS (15-30 min)
> **Risk:** LOW (no runtime impact)

## Story

As a **developer**,
I want **UserGroupPreference and UserSharedGroupsPreferences types exported via the barrel file**,
So that **import patterns are consistent across the codebase**.

## Problem Statement

The `UserGroupPreference` and `UserSharedGroupsPreferences` types are defined in `src/types/sharedGroup.ts` but are not re-exported via the barrel file `src/types/index.ts`. This creates inconsistency:

- `createDefaultGroupPreference` function IS exported via barrel (line 77)
- `UserGroupPreference` type is NOT exported via barrel
- `UserSharedGroupsPreferences` type is NOT exported via barrel
- `DEFAULT_GROUP_PREFERENCE` constant is NOT exported via barrel

Developers must use direct imports from `@/types/sharedGroup` instead of the standard `@/types` barrel.

## Acceptance Criteria

**AC1:** Given the `src/types/index.ts` barrel file, When I import types, Then `UserGroupPreference` is available via `import type { UserGroupPreference } from '@/types'`

**AC2:** Given the `src/types/index.ts` barrel file, When I import types, Then `UserSharedGroupsPreferences` is available via `import type { UserSharedGroupsPreferences } from '@/types'`

**AC3:** Given the `src/types/index.ts` barrel file, When I import constants, Then `DEFAULT_GROUP_PREFERENCE` is available via `import { DEFAULT_GROUP_PREFERENCE } from '@/types'`

**AC4:** Given the barrel export exists, When a developer searches for where to import these types, Then the barrel file is the obvious choice

## Tasks / Subtasks

### Task 1: Add Type Exports to Barrel

- [ ] 1.1 Add `UserGroupPreference` to type exports in `src/types/index.ts`
- [ ] 1.2 Add `UserSharedGroupsPreferences` to type exports in `src/types/index.ts`
- [ ] 1.3 Add `DEFAULT_GROUP_PREFERENCE` to value exports in `src/types/index.ts`

### Task 2: Add Test for Barrel Export (Optional)

- [ ] 2.1 Add test in `tests/unit/types/` verifying barrel exports work correctly

## Dev Notes

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| Merge conflict risk | Low | Low |
| Context window fit | Minimal | Clean separation |
| Sprint capacity | 15-30 min | Future sprint |
| Accumulation risk | May forget | Tracked |

**Recommendation:** Can be batched with other barrel export cleanups.

### Dependencies

- None

### References

- [14d-v2-1-12a-foundation-types-cooldown.md](./14d-v2-1-12a-foundation-types-cooldown.md) - Source of this tech debt item
- ECC Code Review 2026-02-05 - Finding [M2]
