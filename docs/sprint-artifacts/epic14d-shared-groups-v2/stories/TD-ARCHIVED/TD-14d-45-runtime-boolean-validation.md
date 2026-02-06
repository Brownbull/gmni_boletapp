# Tech Debt Story TD-14d-45: Add Runtime Boolean Validation

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-04) on story 14d-v2-1-11b
> **Priority:** LOW (defense-in-depth)
> **Estimated Effort:** XS (< 30 min)
> **Risk:** LOW (input validation)

## Story

As a **developer**,
I want **runtime validation that `enabled` parameter is a boolean**,
So that **invalid inputs are caught even if TypeScript types are bypassed**.

## Problem Statement

TypeScript types are compile-time only. At runtime, a caller could pass:
- `1` or `0` (truthy/falsy)
- `"true"` or `"false"` (strings)
- `null` or `undefined`

Firestore would accept these, potentially storing unexpected values.

## Acceptance Criteria

- [ ] AC1: Add `typeof enabled !== 'boolean'` check
- [ ] AC2: Throw descriptive error if validation fails
- [ ] AC3: Add unit test for invalid input types

## Tasks / Subtasks

- [ ] 1.1 Add runtime validation after existing input checks
- [ ] 1.2 Add test cases for invalid types

## Dev Notes

### Proposed Change

```typescript
// After line 1302 in groupService.ts
if (typeof enabled !== 'boolean') {
    throw new Error('enabled must be a boolean');
}
```

### Test Cases

```typescript
it('throws error for non-boolean enabled value', async () => {
    await expect(
        updateTransactionSharingEnabled(mockDb, TEST_GROUP_ID, OWNER_ID, 'true' as any)
    ).rejects.toThrow('enabled must be a boolean');

    await expect(
        updateTransactionSharingEnabled(mockDb, TEST_GROUP_ID, OWNER_ID, 1 as any)
    ).rejects.toThrow('enabled must be a boolean');
});
```

### References

- [14d-v2-1-11b](./14d-v2-1-11b-service-layer-security.md) - Source story
