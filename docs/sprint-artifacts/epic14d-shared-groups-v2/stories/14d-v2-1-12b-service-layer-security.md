# Story 14d-v2-1.12b: Service Layer (Backend + Security)

Status: ready-for-dev

> **Split from Story 14d-v2-1.12** (2026-02-01)
> Original story exceeded sizing limits (8 tasks, 34 subtasks, 8 files)
> Split strategy: by_layer (Foundation → Service → UI → Integration)
> Part 2 of 4

## Story

As a **developer**,
I want **the Firestore service functions and security rules for user preferences**,
so that **the UI layer can persist and retrieve user sharing preferences securely**.

## Background

This story implements the backend service layer and security rules for the user-level transaction sharing preference. It provides:
1. Firestore service functions for CRUD operations on user preferences
2. Security rules ensuring users can only access their own preferences

## Acceptance Criteria

### Service Functions (from original AC3, AC4, AC10, AC12, AC16)

**AC1:** Given I call `getUserGroupPreferences(userId)`, Then it returns the preferences document from `/users/{userId}/preferences/sharedGroups` or `null` if not exists

**AC2:** Given I call `updateShareMyTransactions(userId, groupId, enabled)`, Then:
- The preference is stored at correct Firestore path
- `lastToggleAt` is updated to current timestamp
- `toggleCountToday` is incremented
- Uses merge behavior for existing preferences document

**AC3:** Given I call `updateShareMyTransactions()` when document doesn't exist (new user), Then the document is created with default values (AC16 from original)

**AC4:** Given I update my preference on one device, When I read on another device, Then my preference is synced from Firestore (multi-device support, AC12 from original)

### Security Rules (from original AC10, AC18)

**AC5:** Given I am authenticated as user X, When I try to read `/users/X/preferences/sharedGroups`, Then the read is allowed

**AC6:** Given I am authenticated as user X, When I try to read `/users/Y/preferences/sharedGroups`, Then the read is denied (no cross-user access)

**AC7:** Given I am authenticated as user X, When I try to write to `/users/X/preferences/sharedGroups`, Then the write is allowed

**AC8:** Given I am not authenticated, When I try to access any user's preferences, Then the access is denied

## Tasks / Subtasks

### Task 1: User Preferences Service (AC: 1, 2, 3, 4)

- [ ] 1.1 Create `src/services/userGroupPreferencesService.ts` with functions:
  - `getUserGroupPreferences(userId): Promise<UserGroupPreferencesDocument | null>`
  - `updateShareMyTransactions(userId, groupId, enabled): Promise<void>`
- [ ] 1.2 Implement Firestore path: `/users/{userId}/preferences/sharedGroups`
- [ ] 1.3 Implement atomic update with `lastToggleAt` and `toggleCountToday` increment
- [ ] 1.4 Implement merge behavior for existing preferences document (setDoc with merge: true)
- [ ] 1.5 Handle document creation for new users (first write creates document)
- [ ] 1.6 Write 8+ unit tests for service functions:
  - Get existing preferences
  - Get non-existent preferences (returns null)
  - Update existing preference (merge behavior)
  - Update new group preference (creates entry)
  - First-time user (creates document)
  - Timestamp and counter updates

### Task 2: Security Rules (AC: 5, 6, 7, 8)

- [ ] 2.1 Add Firestore security rules for `/users/{userId}/preferences/sharedGroups`:
  ```
  match /users/{userId}/preferences/sharedGroups {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
  ```
- [ ] 2.2 Write 4+ security rules tests:
  - Owner can read own preferences
  - Owner can write own preferences
  - Other users cannot read
  - Unauthenticated users cannot access

## Dev Notes

### Architecture Patterns

- **User Document Pattern:** Preferences stored under user document for proper security scoping
- **Merge Behavior:** Uses `setDoc` with `merge: true` to safely update nested fields
- **Atomic Updates:** `lastToggleAt` and `toggleCountToday` updated in same write

### Source Tree Components

| Component | Path | Change Type |
|-----------|------|-------------|
| Preferences service | `src/services/userGroupPreferencesService.ts` | New |
| Security rules | `firestore.rules` | Update |
| Service tests | `tests/unit/services/userGroupPreferencesService.test.ts` | New |

### Firestore Document Schema

```
/users/{userId}/preferences/sharedGroups
{
  groupPreferences: {
    [groupId: string]: {
      shareMyTransactions: boolean,
      lastToggleAt: Timestamp | null,
      toggleCountToday: number,
      toggleCountResetAt: Timestamp | null
    }
  }
}
```

### Testing Standards

- Minimum 80% coverage for service functions
- Mock Firestore for unit tests
- Security rules tests using Firebase emulator

### Dependencies

- **Story 1.12a:** Types and interfaces (DEPENDS)

### Downstream Stories

- **Story 1.12c:** Uses service via custom hook
- **Story 1.12d:** Uses service for leave cleanup

### References

- [Source: docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-12-user-transaction-sharing-preference.md - Original story]
- [Source: docs/architecture/epic-14d-requirements-and-concerns.md - FR-20, FR-21]
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/04-architecture.md - Firestore patterns]

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
