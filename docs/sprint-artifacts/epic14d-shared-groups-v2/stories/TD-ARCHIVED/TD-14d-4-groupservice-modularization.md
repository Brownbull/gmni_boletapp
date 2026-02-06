# Tech Debt Story TD-14d-4: Modularize groupService.ts

Status: ready-for-dev

> **Source:** ECC Code Review #5 (2026-02-03) on story 14d-v2-1-7e
> **Priority:** MEDIUM (file size exceeds 800-line guideline significantly)
> **Estimated Effort:** 4-6 hours
> **Risk:** MEDIUM (many exports, potential import path changes)

## Story

As a **developer**,
I want **groupService.ts (1068 lines) split into focused service modules**,
So that **each module has a single responsibility and the codebase is easier to maintain**.

## Problem Statement

`src/features/shared-groups/services/groupService.ts` is currently **1068 lines**, exceeding the 800-line guideline. It contains multiple responsibilities:

```typescript
// Current file structure (1068 lines)
// - Constants & Types (lines 1-130)
// - Group CRUD: createGroup, getUserGroups, getGroupCount, canCreateGroup (lines 130-320)
// - Share Code: getGroupByShareCode, joinGroupDirectly (lines 320-450)
// - Leave & Transfer: leaveGroup, transferOwnership (lines 450-590)
// - Deletion Helpers: processBatchedOperation, clearTransactionsSharedGroupId, etc. (lines 590-750)
// - Deletion Functions: deleteGroupAsLastMember, deleteGroupAsOwner (lines 750-1068)
```

## Acceptance Criteria

1. **Given** groupService.ts with 1068 lines
   **When** split into modules
   **Then** no single file exceeds 400 lines

2. **Given** existing exports from groupService.ts
   **When** split into modules
   **Then** all exports remain available from the feature barrel

3. **Given** existing tests for groupService
   **When** run after modularization
   **Then** all tests pass without changes

4. **Given** existing consumers importing from feature barrel
   **When** modularization is complete
   **Then** no consumer import changes are needed

## Proposed Module Structure

```
src/features/shared-groups/services/
├── index.ts                    # Barrel exports from all modules
├── groupService.ts             # DEPRECATED - re-exports for backward compatibility
├── groupCrudService.ts         # createGroup, getUserGroups, getGroupCount, canCreateGroup
├── groupJoinService.ts         # getGroupByShareCode, joinGroupDirectly
├── groupMembershipService.ts   # leaveGroup, transferOwnership
├── groupDeletionService.ts     # deleteGroupAsLastMember, deleteGroupAsOwner
└── groupDeletionHelpers.ts     # processBatchedOperation, clearTransactionsSharedGroupId, etc. (internal)
```

## Tasks / Subtasks

- [ ] **Task 1: Create Service Modules** (AC: #1)
  - [ ] 1.1: Create `groupCrudService.ts` (~200 lines)
  - [ ] 1.2: Create `groupJoinService.ts` (~150 lines)
  - [ ] 1.3: Create `groupMembershipService.ts` (~150 lines)
  - [ ] 1.4: Create `groupDeletionService.ts` (~350 lines)
  - [ ] 1.5: Create `groupDeletionHelpers.ts` (~200 lines, internal)

- [ ] **Task 2: Update Barrel Exports** (AC: #2, #4)
  - [ ] 2.1: Update `services/index.ts` to export from all modules
  - [ ] 2.2: Keep `groupService.ts` with re-exports for backward compatibility
  - [ ] 2.3: Update `features/shared-groups/index.ts` barrel

- [ ] **Task 3: Update Tests** (AC: #3)
  - [ ] 3.1: Update test imports if needed
  - [ ] 3.2: Run full test suite
  - [ ] 3.3: Verify coverage unchanged

- [ ] **Task 4: Deprecation Path**
  - [ ] 4.1: Add JSDoc deprecation notice to old `groupService.ts`
  - [ ] 4.2: Document migration path in dev notes

## Dev Notes

### Shared Constants

Create `groupServiceConstants.ts` for shared constants:

```typescript
// src/features/shared-groups/services/groupServiceConstants.ts
export const GROUPS_COLLECTION = 'sharedGroups';
export const DEFAULT_GROUP_COLOR = '#10b981';
export const DEFAULT_TIMEZONE = 'UTC';
export const CHANGELOG_SUBCOLLECTION = 'changelog';
export const ANALYTICS_SUBCOLLECTION = 'analytics';
export const INVITATIONS_COLLECTION = 'pendingInvitations';
export const BATCH_SIZE = 500;
```

### Import Path Stability

Consumers currently import via:
```typescript
import { deleteGroupAsOwner, createGroup } from '@/features/shared-groups';
```

This barrel import pattern means **no consumer changes needed** after modularization.

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| **Context window fit** | ❌ Large file harder to review | ✅ No change |
| **Merge conflicts** | ❌ High if other stories touch this | ✅ No conflict risk |
| **Testing overhead** | ✅ Tests already exist | ✅ No change |
| **Future stories** | ✅ Cleaner starting point | ❌ Continues to grow |
| **Dependencies** | 14d-v2-1-8 (changelog writer) may touch this | - |

**Recommendation:** Defer until after Epic 14d-v2 is complete to avoid merge conflicts with in-progress stories.

### Dependencies

- Wait for: All Epic 14d-v2 stories that modify groupService.ts
- Before: Epic 14d-v2 retrospective

### References

- [14d-v2-1-7e](./14d-v2-1-7e-delete-ui-security-rules.md) - Source of this tech debt item (ECC Review #5)
- [groupService.ts](../../../../src/features/shared-groups/services/groupService.ts) - Current implementation
