# Tech Debt Story TD-14d-50: Remove Unused lang Prop from Test Defaults

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-04) on story 14d-v2-1-11c
> **Priority:** LOW (cosmetic)
> **Estimated Effort:** XS (< 10 min)
> **Risk:** LOW (test cleanup)

## Story

As a **developer**,
I want **test default props to match the actual component props interface**,
So that **tests don't include misleading or unused props**.

## Problem Statement

The `createDefaultProps` helper in `TransactionSharingToggle.test.tsx` includes a `lang: 'en'` prop that is not defined in the `TransactionSharingToggleProps` interface:

**Current Code (line 101-102):**
```typescript
const createDefaultProps = (overrides: Partial<TransactionSharingToggleProps> = {}): TransactionSharingToggleProps => ({
    // ...
    lang: 'en',  // This prop doesn't exist in TransactionSharingToggleProps
```

This appears to be boilerplate copied from another test file. TypeScript should catch this, but the `as any` cast or spread allows it through.

## Acceptance Criteria

- [ ] AC1: Remove `lang` prop from `createDefaultProps` in test file
- [ ] AC2: All tests still pass after removal
- [ ] AC3: TypeScript compiles without errors

## Tasks / Subtasks

- [ ] 1.1 Remove `lang: 'en'` from default props
- [ ] 1.2 Run tests to verify no regressions
- [ ] 1.3 Verify TypeScript compilation

## Dev Notes

### Proposed Change

```typescript
// TransactionSharingToggle.test.tsx
const createDefaultProps = (overrides: Partial<TransactionSharingToggleProps> = {}): TransactionSharingToggleProps => ({
    group: createMockGroup(),
    isOwner: true,
    onToggle: vi.fn().mockResolvedValue(undefined),
    t: mockT,
    isPending: false,
    // Remove: lang: 'en',
    ...overrides,
});
```

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| Merge conflict risk | Low | Low |
| Functionality impact | None | None |
| Code quality | Improved clarity | Minor debt |

**Recommendation:** Cosmetic fix, very low priority

### References

- [14d-v2-1-11c](./14d-v2-1-11c-ui-components-integration.md) - Source story
