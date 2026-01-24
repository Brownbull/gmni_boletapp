# Story 14d-v2-1.13: User Group Preferences Document

Status: ready-for-dev

## Story

As a **system**,
I want **a user preferences document for per-group settings**,
so that **each user's sharing preferences are stored and retrievable with proper security isolation**.

## Background

This story implements the **data model foundation** for the user-level gate (Gate 2) of the Layered Visibility Model. While Story 1.11 handles the group-level toggle (Gate 1), this story creates the Firestore schema that Story 1.12 will use to store individual user preferences.

```
┌─────────────────────────────────────────────────────────────────┐
│  STATISTICS (Always On)                                         │
│  - byCategory, byMember, totals, insights                       │
│  - All members' transactions contribute (anonymized)            │
│  - Non-negotiable part of group membership                      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  TRANSACTIONS (Double-Gated)                                    │
│  - Gate 1: Group owner enables transactionSharingEnabled        │
│  - Gate 2: Each user opts in shareMyTransactions per group ← THIS STORY (data model)
│  - Both gates must be TRUE to see a user's transactions         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Acceptance Criteria

### Document Structure

**AC1:** Given a user is a member of shared groups, When they have group-specific preferences, Then preferences are stored at: `/users/{userId}/preferences/sharedGroups`

**AC2:** The document structure must be:
```typescript
{
  groupPreferences: {
    [groupId: string]: {
      shareMyTransactions: boolean;          // default: false (LV-6)
      lastToggleAt: Timestamp | null;        // last preference change
      toggleCountToday: number;              // for rate limiting
      toggleCountResetAt: Timestamp | null;  // midnight reset tracking
    }
  }
}
```

### Default Behavior

**AC3:** Given a user joins a new group, When no preference exists for that group, Then `shareMyTransactions` defaults to `false` (constraint LV-6: privacy-first)

**AC4:** Given the groupPreferences object doesn't exist, When preferences are accessed, Then an empty object `{}` is returned (not null/undefined)

### Cleanup Behavior

**AC5:** Given a user leaves a group, When the leave is processed, Then their preference entry for that group is deleted from `groupPreferences`

**AC6:** Given a user leaves all groups, When the last group preference is deleted, Then the `groupPreferences` object becomes empty `{}` (not deleted)

### Security Rules

**AC7:** Firestore security rules allow:
- Read: owner only (`userId == request.auth.uid`)
- Write: owner only (`userId == request.auth.uid`)

**AC8:** Given a different user attempts to read/write preferences, When the operation is attempted, Then Firestore denies with permission error

### Type Safety

**AC9:** Given the application uses TypeScript, When accessing preferences, Then full type safety is available via exported types:
- `UserGroupPreferences` (document type)
- `GroupPreference` (per-group preference type)

### Migration/Compatibility

**AC10:** Given an existing user without preferences document, When preferences are read, Then the document is created lazily on first write (not on read)

## Tasks / Subtasks

### Task 1: TypeScript Type Definitions (AC: 2, 9)

- [ ] 1.1 Create `UserGroupPreferences` interface in `src/types/userPreferences.ts`:
  ```typescript
  export interface GroupPreference {
    shareMyTransactions: boolean;
    lastToggleAt: Timestamp | null;
    toggleCountToday: number;
    toggleCountResetAt: Timestamp | null;
  }

  export interface UserGroupPreferences {
    groupPreferences: Record<string, GroupPreference>;
  }
  ```
- [ ] 1.2 Export types from `src/types/index.ts`
- [ ] 1.3 Add JSDoc documentation with examples
- [ ] 1.4 Write 4 type assertion tests

### Task 2: Firestore Service Functions (AC: 1, 3, 4, 5, 6, 10)

- [ ] 2.1 Create `src/services/userPreferencesService.ts` with:
  - `getUserGroupPreferences(userId): Promise<UserGroupPreferences>`
  - `getGroupPreference(userId, groupId): Promise<GroupPreference | null>`
  - `setGroupPreference(userId, groupId, preference): Promise<void>`
  - `deleteGroupPreference(userId, groupId): Promise<void>`
- [ ] 2.2 Implement lazy document creation (create on first write)
- [ ] 2.3 Implement default value handling (AC3, AC4)
- [ ] 2.4 Implement atomic preference deletion (AC5, AC6)
- [ ] 2.5 Write 15+ unit tests covering all functions and edge cases

### Task 3: Firestore Security Rules (AC: 7, 8)

- [ ] 3.1 Add security rules to `firestore.rules`:
  ```
  match /users/{userId}/preferences/sharedGroups {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
  ```
- [ ] 3.2 Write 6 security rules tests:
  - Owner can read own preferences
  - Owner can write own preferences
  - Other user cannot read preferences
  - Other user cannot write preferences
  - Unauthenticated user cannot read
  - Unauthenticated user cannot write

### Task 4: Default Preference Factory (AC: 3, 4)

- [ ] 4.1 Create `createDefaultGroupPreference()` factory function:
  ```typescript
  export function createDefaultGroupPreference(): GroupPreference {
    return {
      shareMyTransactions: false,  // LV-6: privacy-first default
      lastToggleAt: null,
      toggleCountToday: 0,
      toggleCountResetAt: null,
    };
  }
  ```
- [ ] 4.2 Use factory in all preference read operations
- [ ] 4.3 Write 3 unit tests for factory function

### Task 5: Integration with Leave Group Flow (AC: 5, 6)

- [ ] 5.1 Add `deleteGroupPreference()` call to leave group service (placeholder)
- [ ] 5.2 Document integration point for Story 1.7 (Leave/Manage Group)
- [ ] 5.3 Write integration test for cleanup flow

## Dev Notes

### Architecture Patterns

- **Privacy-First (LV-6):** Default `shareMyTransactions: false` ensures users must explicitly opt-in
- **Lazy Creation (AC10):** Document created on first write, not on read - reduces empty document clutter
- **User-Scoped Security:** Each user's preferences isolated via security rules, not queryable by others
- **Flat Structure:** Single document per user (not subcollection) for efficient reads

### Source Tree Components

| Component | Path | Change Type |
|-----------|------|-------------|
| Type definitions | `src/types/userPreferences.ts` | New |
| Types barrel export | `src/types/index.ts` | Extend |
| Service functions | `src/services/userPreferencesService.ts` | New |
| Security rules | `firestore.rules` | Update |
| Service tests | `tests/unit/services/userPreferencesService.test.ts` | New |
| Security rules tests | `tests/unit/firestore-rules/userPreferences.test.ts` | New |

### Testing Standards

- Minimum 80% coverage for new service functions
- All security rule scenarios must be tested
- Edge cases: empty object, missing fields, invalid data
- Mock Firestore for unit tests

### Constraints from Architecture

- **LV-6:** Default `shareMyTransactions: false` (privacy-first)
- **FR-20:** Users can opt-in/out of sharing their transactions per group
- **FR-21:** Toggle settings have cooldown (tracked via `toggleCountToday`, `lastToggleAt`)
- **AD-11:** Firestore offline persistence enabled (affects when writes are visible)

### Firestore Index Requirements

No additional indexes required for this document structure.

### Cost Considerations

- Single document read per user (efficient)
- Document size: ~200-500 bytes per group (10 groups = ~5KB max)
- Well within Firestore free tier limits

### Project Structure Notes

- Service follows existing `src/services/` patterns (e.g., `transactionService.ts`)
- Types follow existing `src/types/` patterns
- Security rules follow existing `firestore.rules` patterns

### References

- [Source: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md - Story 1.13]
- [Source: docs/architecture/epic-14d-requirements-and-concerns.md - Layered Visibility Model, LV-6]
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/04-architecture.md - Data Model section]

---

## Atlas Workflow Analysis

> This section was generated by Atlas workflow chain analysis

### Affected Workflows

| Workflow | Impact Description |
|----------|-------------------|
| **None (Foundation)** | This is a data model story with no UI changes - existing workflows unaffected |

### Downstream Effects to Consider

| Story | Effect |
|-------|--------|
| **1.12 (User Transaction Sharing Preference)** | Directly uses this document for preference UI - **primary consumer** |
| **1.14 (Join Flow Opt-In)** | Initializes preference entry when user joins a group |
| **1.7 (Leave/Manage Group)** | Calls `deleteGroupPreference()` when user leaves |
| **2.2 (View Group Transactions)** | Reads `shareMyTransactions` to determine transaction visibility |
| **2.11 (Cloud Function Visibility Filtering)** | Server-side reads of preference for double-gate enforcement |

### Testing Implications

- **Existing tests to verify:** None (new Firestore path)
- **New scenarios to add:**
  - Document CRUD operations
  - Default value handling
  - Security rules isolation
  - Cleanup on group leave

### Workflow Chain Visualization

```
[Story 1.6: Accept Invitation]
            ↓
     (Initialize preference)
            ↓
[THIS STORY: Preferences Document] ← Data Model Foundation
            ↓
[Story 1.12: User Preference UI] ← Primary Consumer
            ↓
[Story 2.2: View Transactions] + [Story 2.11: Visibility Filter]
```

---

## Dev Agent Record

### Agent Model Used

(To be filled during development)

### Debug Log References

(To be filled during development)

### Completion Notes List

(To be filled during development)

### File List

(To be filled during development)
