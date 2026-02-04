# Tech Debt Story TD-14d-15: Strengthen Idempotency Test Assertions

Status: ready-for-dev

> **Source:** ECC TDD Guide Review (2026-02-04) on story 14d-v2-1-8b
> **Priority:** LOW (tests pass, coverage is good)
> **Estimated Effort:** Small (30 min - 1 hour)
> **Risk:** LOW (tests already passing)

## Story

As a **developer**,
I want **stronger assertions in idempotency tests**,
So that **document ID format `{eventId}-{changeType}` is explicitly verified**.

## Problem Statement

The current idempotency tests have weak assertions that only verify the mock was called, not the specific document ID format:

```typescript
// functions/src/__tests__/changelogWriter.test.ts:538-549
it('should use event ID as part of document ID for idempotency', async () => {
  // ...
  await changelogWriterHandler(event);

  // Assert - the document ID should include the event ID
  // This is verified by checking the mock was called with correct path
  // The implementation should write to: sharedGroups/{groupId}/changelog/{eventId}-{type}
  expect(mockSet).toHaveBeenCalled();  // WEAK - doesn't verify ID format
});
```

Similar weak assertions exist in:
- `should use set() for idempotent writes` (line 551-562)
- `should use deterministic document IDs in batch for idempotency` (line 961-973)

## Acceptance Criteria

1. **Given** the idempotency test runs
   **When** the assertion executes
   **Then** the document ID format `{eventId}-{changeType}` is explicitly verified

2. **Given** the batch idempotency test runs
   **When** the assertion executes
   **Then** both document IDs follow the format pattern

3. **Given** the document ID format changes
   **When** tests run
   **Then** tests fail with clear error message

## Tasks / Subtasks

- [ ] **Task 1: Enhance mock to capture document paths**
  - [ ] 1.1: Update mock to store document paths when `set()` is called
  - [ ] 1.2: Update mock to store document paths when `batch.set()` is called

- [ ] **Task 2: Update assertions**
  - [ ] 2.1: Verify document ID matches `{eventId}-TRANSACTION_ADDED` pattern
  - [ ] 2.2: Verify document ID matches `{eventId}-TRANSACTION_REMOVED` pattern
  - [ ] 2.3: Verify batch writes use correct IDs

- [ ] **Task 3: Add explicit format test**
  - [ ] 3.1: Add test that verifies document ID regex pattern

## Dev Notes

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| Test quality | Better | Same |
| Complexity | Low | Low |
| Sprint capacity | Uses ~30 min | Scheduled for later |
| Bug prevention | Better regression detection | Same |

**Recommendation:** Can be done quickly as part of 14d-v2-1-8d (Tests & Deploy story).

### Implementation Approach

```typescript
// Enhanced mock setup
let capturedDocPaths: string[] = [];

const createDocRef = (groupId: string, docId: string) => {
  const path = `sharedGroups/${groupId}/changelog/${docId}`;
  return {
    set: jest.fn((data) => {
      capturedDocPaths.push(path);
      return mockSet(data);
    }),
    path,
  };
};

beforeEach(() => {
  capturedDocPaths = [];
});

// Enhanced assertion
it('should use event ID as part of document ID for idempotency', async () => {
  const afterTx = createSampleTransaction({ sharedGroupId: 'group-A' });
  const event = createMockEvent(null, afterTx, 'unique-event-id-123');

  await changelogWriterHandler(event);

  // Strong assertion - verify document ID format
  expect(capturedDocPaths).toHaveLength(1);
  expect(capturedDocPaths[0]).toMatch(
    /^sharedGroups\/group-A\/changelog\/unique-event-id-123-TRANSACTION_ADDED$/
  );
});
```

### Files Affected

| File | Action |
|------|--------|
| `functions/src/__tests__/changelogWriter.test.ts` | MODIFY (enhance assertions) |

### References

- [14d-v2-1-8b](./14d-v2-1-8b-changelog-writer-validation.md) - Source of this tech debt item
- [14d-v2-1-8d](./14d-v2-1-8d-changelog-writer-tests-deploy.md) - Natural home for this improvement
