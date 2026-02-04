# Tech Debt Story TD-14d-8: Integration Test DRY Refactoring

Status: ready-for-dev

> **Source:** ECC Code Review #6 (2026-02-03) on story 14d-v2-1-7f
> **Priority:** LOW (code quality, no functional impact)
> **Estimated Effort:** 30-45 minutes
> **Risk:** LOW (test-only changes, no production code affected)

## Story

As a **developer**,
I want **integration test helpers properly imported instead of duplicated**,
So that **test maintenance is simplified and inconsistencies are prevented**.

## Problem Statement

The ECC parallel code review of story 14d-v2-1-7f identified DRY violations in the integration test files. The `helpers.ts` file was created with shared utilities (`createTestGroup`, `createTestTransaction`, `createTestInvitation`, `TEST_APP_ID`, `TEST_USER_3`), but these are duplicated in each test file instead of being imported.

**Current state:**
- `leaveGroup.test.ts` defines its own `createTestGroup`, `createTestTransaction`, `TEST_USER_3`, `TEST_APP_ID`
- `transferOwnership.test.ts` defines its own `createTestGroup`, `TEST_USER_3`, `TEST_APP_ID`
- `deleteGroup.test.ts` defines its own `createTestGroup`, `createTestTransaction`, `createTestInvitation`, `TEST_USER_3`, `TEST_APP_ID`
- `helpers.ts` exports all of these but is not imported

**Desired state:**
- All test files import shared utilities from `helpers.ts`
- `TEST_USERS.USER_3` is used from `firebase-emulator.ts`
- No duplicate function definitions

## Acceptance Criteria

1. **Given** the test files in `tests/integration/sharedGroups/`
   **When** reviewed for DRY compliance
   **Then** all shared utilities are imported from `helpers.ts`, not redefined locally

2. **Given** `TEST_USER_3` usage
   **When** importing in test files
   **Then** `TEST_USERS.USER_3` from `firebase-emulator.ts` is used (or helpers.ts re-exports it)

3. **Given** all refactoring changes
   **When** tests are run
   **Then** all 49 tests pass without modification to test logic

4. **Given** `deleteGroup.test.ts`
   **When** reviewing edge case coverage
   **Then** test for `deleteGroupAsLastMember` on non-existent group exists (matches Test 17 pattern)

## Tasks / Subtasks

- [ ] **Task 1: Refactor leaveGroup.test.ts**
  - [ ] 1.1: Remove local `createTestGroup` function (lines 60-82)
  - [ ] 1.2: Remove local `createTestTransaction` function (lines 87-99)
  - [ ] 1.3: Remove local `TEST_USER_3` and `TEST_APP_ID` constants
  - [ ] 1.4: Add import: `import { createTestGroup, createTestTransaction, TEST_APP_ID } from './helpers';`
  - [ ] 1.5: Update to use `TEST_USERS.USER_3` from firebase-emulator.ts
  - [ ] 1.6: Run tests to verify

- [ ] **Task 2: Refactor transferOwnership.test.ts**
  - [ ] 2.1: Remove local `createTestGroup` function (lines 56-78)
  - [ ] 2.2: Remove local `TEST_USER_3` and `TEST_APP_ID` constants
  - [ ] 2.3: Add import from helpers.ts
  - [ ] 2.4: Run tests to verify

- [ ] **Task 3: Refactor deleteGroup.test.ts**
  - [ ] 3.1: Remove local `createTestGroup` function (lines 81-103)
  - [ ] 3.2: Remove local `createTestTransaction` function (lines 108-120)
  - [ ] 3.3: Remove local `createTestInvitation` function (lines 125-138)
  - [ ] 3.4: Remove local `TEST_USER_3` and `TEST_APP_ID` constants
  - [ ] 3.5: Add import from helpers.ts
  - [ ] 3.6: Run tests to verify

- [ ] **Task 4: Add Missing Edge Case Test**
  - [ ] 4.1: Add test for `deleteGroupAsLastMember` on non-existent group (pattern from Test 17)
  - [ ] 4.2: Expected error: `'Group not found'` or similar
  - [ ] 4.3: Update test count comment in file header

- [ ] **Task 5: Minor Cleanup**
  - [ ] 5.1: Update Test 8 comment header in transferOwnership.test.ts to say "Allow" not "Reject"
  - [ ] 5.2: Remove unused `TEST_GROUP_ID` export from helpers.ts OR document as default fallback
  - [ ] 5.3: (Optional) Use `vi.spyOn(console, 'warn')` in useViewModeStore.leaveGroup.test.ts

- [ ] **Task 6: Final Verification**
  - [ ] 6.1: Run all 49+ integration tests
  - [ ] 6.2: Verify no duplicate function definitions remain
  - [ ] 6.3: Update story file list if needed

## Dev Notes

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `tests/integration/sharedGroups/leaveGroup.test.ts` | MODIFY | Remove duplicates, add imports |
| `tests/integration/sharedGroups/transferOwnership.test.ts` | MODIFY | Remove duplicates, add imports |
| `tests/integration/sharedGroups/deleteGroup.test.ts` | MODIFY | Remove duplicates, add imports, add test |
| `tests/integration/sharedGroups/helpers.ts` | MODIFY | Clean up unused export |
| `tests/unit/shared/stores/useViewModeStore.leaveGroup.test.ts` | MODIFY | (Optional) Use vi.spyOn pattern |

### Import Pattern

```typescript
// Before (in each test file)
const TEST_USER_3 = 'test-user-3-uid';
const TEST_APP_ID = 'boletapp';
function createTestGroup(...) { ... }

// After
import { createTestGroup, createTestTransaction, TEST_APP_ID } from './helpers';
import { TEST_USERS } from '../../setup/firebase-emulator';
// Use TEST_USERS.USER_3 instead of TEST_USER_3
```

### Missing Test Pattern (Task 4)

```typescript
// Add to deleteGroupAsLastMember describe block
it('should reject delete of non-existent group as last member', async () => {
    // ACT & ASSERT: Attempt to delete group that doesn't exist
    await withSecurityRulesDisabled(async (firestore) => {
        await expect(
            deleteGroupAsLastMember(firestore, TEST_USERS.USER_1, 'non-existent-group-id', TEST_APP_ID)
        ).rejects.toThrow('Group not found');
    });
});
```

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| **Functional Impact** | None | None |
| **Maintenance** | Improved | Current duplication persists |
| **Consistency Risk** | Eliminated | Future edits may diverge |
| **Test Stability** | Same (no logic changes) | Same |
| **Time Investment** | 30-45 minutes | - |

**Recommendation:** Low priority, can be done opportunistically when touching these files.

### Dependencies

- None (standalone maintenance task)

### References

- [14d-v2-1-7f](./14d-v2-1-7f-integration-tests.md) - Source of this tech debt item (ECC Review #6)
- [helpers.ts](../../../tests/integration/sharedGroups/helpers.ts) - Shared test utilities
