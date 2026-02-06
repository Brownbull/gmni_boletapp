# Tech Debt Story TD-14d-35: Standardize Test Override Prop Naming

Status: ready-for-dev

> **Source:** ECC Parallel Code Review (2026-02-04) on story 14d-v2-1-10d
> **Priority:** LOW (Consistency improvement)
> **Estimated Effort:** 30 min - 1 hour
> **Risk:** Low (test-only changes)

## Story

As a **developer**,
I want **consistent naming for test override props in hooks**,
So that **the codebase follows a predictable pattern and reduces cognitive load**.

## Problem Statement

The ECC Code Review identified inconsistent naming conventions for test override props:

**Inconsistent naming:**
- `src/views/HistoryView/useHistoryViewData.ts:349` - uses `_testOverrides`
- `src/views/TrendsView/useTrendsViewData.ts:294` - uses `__testData`

This inconsistency makes it harder to discover and use test hooks correctly.

## Acceptance Criteria

1. **Given** all hooks with test override props
   **When** I search for the pattern
   **Then** they use a consistent naming convention

2. **Given** the chosen naming convention
   **When** documented
   **Then** it's added to the testing patterns documentation

## Tasks / Subtasks

- [ ] Task 1: Audit existing test override patterns
  - [ ] Search: `grep -r "_test" src/`
  - [ ] List all test override prop names
  - [ ] Choose standard: `_testOverrides` (single underscore) or `__testOverrides` (double)

- [ ] Task 2: Standardize naming (if needed)
  - [ ] Update `useTrendsViewData.ts` to use `_testOverrides`
  - [ ] Update corresponding test files
  - [ ] Verify tests pass

- [ ] Task 3: Document the pattern
  - [ ] Add to Atlas `05-testing.md` under "Hook Testing Patterns"
  - [ ] Example: `_testOverrides` for DI in hooks

## Dev Notes

### Current State

```typescript
// useHistoryViewData.ts:349
export function useHistoryViewData({ _testOverrides }: Props = {}) {
  const overrides = _testOverrides ?? {};
  // ...
}

// useTrendsViewData.ts:294
export function useTrendsViewData({
  __testData,
}: {
  __testData?: { transactions?: Transaction[] };
} = {}) {
  // ...
}
```

### Recommended Convention

Use **single underscore** `_testOverrides` because:
1. Consistent with `_guardPhase` pattern in stores
2. More common in the codebase
3. Double underscore often implies "truly private" in Python-influenced conventions

```typescript
// Standard pattern for all hooks with test overrides
export function useHookName({
  _testOverrides,
}: {
  _testOverrides?: {
    // Specific overridable values
  };
} = {}) {
  // ...
}
```

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/views/TrendsView/useTrendsViewData.ts` | Modify | Rename `__testData` → `_testOverrides` |
| `tests/unit/views/TrendsView/useTrendsViewData.viewMode.test.tsx` | Modify | Update prop name |
| `_bmad/agents/atlas/atlas-sidecar/knowledge/05-testing.md` | Modify | Document pattern |

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| **Consistency** | Immediate | Continues to diverge |
| **Merge conflict risk** | Low | Low |
| **Context window fit** | Trivial | Trivial |
| **Sprint capacity** | 30 min | Scheduled later |

**Recommendation:** Low priority - Fix when touching TrendsView or during general cleanup.

### References

- [14d-v2-1-10d-data-filtering-integration.md](./14d-v2-1-10d-data-filtering-integration.md) - Source story
- ECC Parallel Code Review 2026-02-04 - Code Reviewer agent
