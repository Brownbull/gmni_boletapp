# Tech Debt Story TD-14d-31: Replace `as any` Type Casts in Test Factories

Status: ready-for-dev

> **Source:** ECC Parallel Code Review (2026-02-04) on story 14d-v2-1-10d
> **Priority:** MEDIUM (Type safety improvement)
> **Estimated Effort:** 1-2 hours
> **Risk:** Low (test-only changes)

## Story

As a **developer**,
I want **test factories to use proper TypeScript types instead of `as any` casts**,
So that **type errors are caught at compile time and tests remain valid as types evolve**.

## Problem Statement

The ECC Code Review identified `as any` type casts in test transaction factories across multiple test files:

**Affected files:**
- `tests/unit/utils/viewModeFilterUtils.test.ts:32`
- `tests/unit/views/HistoryView/useHistoryViewData.viewMode.test.tsx:34`
- `tests/unit/views/DashboardView/useDashboardViewData.viewMode.test.tsx:34`
- `tests/unit/views/TrendsView/useTrendsViewData.viewMode.test.tsx:34`

```typescript
// Current (unsafe):
category: 'Supermercado' as any,

// Should be:
category: 'Supermercado' as StoreCategory,
```

Using `as any` hides potential type mismatches and defeats TypeScript's compile-time safety.

## Acceptance Criteria

1. **Given** all test factory functions creating Transaction objects
   **When** I review the type casts
   **Then** no `as any` casts are used for typed fields

2. **Given** the `category` field in test transactions
   **When** assigned a string value
   **Then** it uses proper `StoreCategory` type import

3. **Given** any other fields using `as any`
   **When** reviewed
   **Then** they are replaced with proper type imports or type-safe alternatives

## Tasks / Subtasks

- [ ] Task 1: Import StoreCategory type in affected test files
  - [ ] Add `import type { StoreCategory } from '@/types/transaction'`
  - [ ] Replace `as any` with `as StoreCategory` for category field

- [ ] Task 2: Audit for other `as any` usage in test factories
  - [ ] Search: `grep -r "as any" tests/unit/`
  - [ ] Review each occurrence
  - [ ] Replace with proper types or document why `as any` is required

- [ ] Task 3: Verify tests still compile and pass
  - [ ] Run `npm run typecheck`
  - [ ] Run affected test files

## Dev Notes

### Current vs Recommended

```typescript
// Current (tests/unit/utils/viewModeFilterUtils.test.ts:32)
const createTestTransaction = (
  id: string,
  sharedGroupId: string | null | undefined
): Transaction => ({
  id,
  // ... other fields
  category: 'Supermercado' as any,  // <-- unsafe
  // ...
});

// Recommended
import type { StoreCategory } from '@/types/transaction';

const createTestTransaction = (
  id: string,
  sharedGroupId: string | null | undefined
): Transaction => ({
  id,
  // ... other fields
  category: 'Supermercado' as StoreCategory,  // <-- type-safe
  // ...
});
```

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `tests/unit/utils/viewModeFilterUtils.test.ts` | Modify | Replace `as any` |
| `tests/unit/views/HistoryView/useHistoryViewData.viewMode.test.tsx` | Modify | Replace `as any` |
| `tests/unit/views/DashboardView/useDashboardViewData.viewMode.test.tsx` | Modify | Replace `as any` |
| `tests/unit/views/TrendsView/useTrendsViewData.viewMode.test.tsx` | Modify | Replace `as any` |

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| **Type safety** | Compile-time errors caught | May miss type changes |
| **Merge conflict risk** | Low | Low |
| **Context window fit** | Easy | Easy |
| **Sprint capacity** | 1-2 hrs | Scheduled later |

**Recommendation:** Low-Medium priority - Fix when touching test files or during TypeScript strictness improvements.

### References

- [14d-v2-1-10d-data-filtering-integration.md](./14d-v2-1-10d-data-filtering-integration.md) - Source story
- ECC Parallel Code Review 2026-02-04 - Code Reviewer agent
