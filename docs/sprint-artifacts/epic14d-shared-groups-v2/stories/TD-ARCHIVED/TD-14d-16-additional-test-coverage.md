# Tech Debt Story TD-14d-16: Additional Changelog Writer Test Coverage

Status: ready-for-dev

> **Source:** ECC TDD Guide Review (2026-02-04) on story 14d-v2-1-8b
> **Priority:** LOW (coverage is already 85-90%)
> **Estimated Effort:** Small (1-2 hours)
> **Risk:** LOW (existing tests cover critical paths)

## Story

As a **developer**,
I want **additional edge case test coverage for the changelog writer**,
So that **boundary conditions and error scenarios are explicitly validated**.

## Problem Statement

The current test coverage is 85-90% with 42 tests, but some edge cases are missing:

1. **groupId > 1500 bytes**: The implementation validates this boundary (`isValidGroupId`), but no test verifies it
2. **Firestore membership check error**: The `isUserGroupMember` catch block returns `false` on error, but no test triggers this path
3. **Category field sanitization**: Only merchant/description sanitization is tested, not category
4. **Single-write Firestore failure**: Batch commit failure is tested, but `mockSet` failure for single writes is not
5. **Empty batch scenario**: When both `beforeValid` and `afterValid` are false in group change

## Acceptance Criteria

1. **Given** a groupId with length > 1500 bytes
   **When** the Cloud Function processes the transaction
   **Then** the changelog write is rejected

2. **Given** Firestore throws an error during membership check
   **When** the Cloud Function processes the transaction
   **Then** the user is treated as non-member and entry is not created

3. **Given** a category field with HTML tags
   **When** the changelog entry is created
   **Then** the category is sanitized

4. **Given** a single-write scenario where `set()` fails
   **When** the Cloud Function processes the transaction
   **Then** the error is propagated for retry

5. **Given** a group change where user is member of neither group
   **When** the Cloud Function processes the transaction
   **Then** `writeChangelogBatch` is called with empty array (no-op)

## Tasks / Subtasks

- [ ] **Task 1: Add boundary tests**
  - [ ] 1.1: Test groupId at exactly 1500 bytes (valid)
  - [ ] 1.2: Test groupId at 1501 bytes (invalid)

- [ ] **Task 2: Add error handling tests**
  - [ ] 2.1: Mock Firestore `get()` to throw error
  - [ ] 2.2: Verify membership check returns false
  - [ ] 2.3: Mock `set()` to throw error
  - [ ] 2.4: Verify error propagates for retry

- [ ] **Task 3: Add sanitization tests**
  - [ ] 3.1: Test category field with HTML tags
  - [ ] 3.2: Test category field truncation

- [ ] **Task 4: Add edge case tests**
  - [ ] 4.1: Test group change where user is member of neither group
  - [ ] 4.2: Verify batch is empty or function returns early

## Dev Notes

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| Test quality | Better | Same |
| Coverage | ~90% -> ~95% | ~90% |
| Sprint capacity | Uses ~1-2 hours | Scheduled for later |
| Bug prevention | Better | Same |

**Recommendation:** Defer to 14d-v2-1-8d (Tests & Deploy story) - natural fit.

### Test Implementations

```typescript
// Task 1: Boundary tests
describe('GroupId Length Boundary', () => {
  it('should accept groupId at exactly 1500 bytes', async () => {
    const validGroupId = 'A'.repeat(1500);
    mockGroupMembers = { [validGroupId]: ['user-123'] };
    const afterTx = createSampleTransaction({ sharedGroupId: validGroupId });
    const event = createMockEvent(null, afterTx, 'event-boundary-001');

    await changelogWriterHandler(event);

    expect(mockSet).toHaveBeenCalled();
  });

  it('should reject groupId at 1501 bytes', async () => {
    const invalidGroupId = 'A'.repeat(1501);
    const afterTx = createSampleTransaction({ sharedGroupId: invalidGroupId });
    const event = createMockEvent(null, afterTx, 'event-boundary-002');

    await changelogWriterHandler(event);

    expect(mockSet).not.toHaveBeenCalled();
  });
});

// Task 2: Error handling tests
describe('Firestore Error Handling', () => {
  it('should treat user as non-member when membership check throws', async () => {
    // Mock the get() to throw
    const originalMock = mockGroupMembers;
    // Simulate error by making the group doc read throw
    // (Implementation depends on mock structure)

    const afterTx = createSampleTransaction({ sharedGroupId: 'group-A' });
    const event = createMockEvent(null, afterTx, 'event-error-001');

    await changelogWriterHandler(event);

    expect(mockSet).not.toHaveBeenCalled();
  });

  it('should propagate error when single set() fails', async () => {
    mockSet.mockRejectedValueOnce(new Error('Firestore write failed'));
    const afterTx = createSampleTransaction({ sharedGroupId: 'group-A' });
    const event = createMockEvent(null, afterTx, 'event-error-002');

    await expect(changelogWriterHandler(event)).rejects.toThrow('Firestore write failed');
  });
});

// Task 3: Category sanitization
describe('Category Sanitization', () => {
  it('should sanitize HTML tags from category', async () => {
    const afterTx = createSampleTransaction({
      sharedGroupId: 'group-A',
      category: '<script>alert("xss")</script>Groceries',
    });
    const event = createMockEvent(null, afterTx, 'event-category-001');

    await changelogWriterHandler(event);

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: expect.objectContaining({
          category: expect.not.stringContaining('<script>'),
        }),
      })
    );
  });
});
```

### Files Affected

| File | Action |
|------|--------|
| `functions/src/__tests__/changelogWriter.test.ts` | MODIFY (add tests) |

### References

- [14d-v2-1-8b](./14d-v2-1-8b-changelog-writer-validation.md) - Source of this tech debt item
- [14d-v2-1-8d](./14d-v2-1-8d-changelog-writer-tests-deploy.md) - Natural home for this improvement
