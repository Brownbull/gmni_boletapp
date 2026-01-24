# Story 14d-v2-1.12: User Transaction Sharing Preference

Status: ready-for-dev

## Story

As a **group member**,
I want **to choose whether to share my transaction details with the group**,
so that **I can contribute to statistics while keeping my spending details private**.

## Background

This story implements the **user-level gate** (Gate 2) of the Layered Visibility Model defined in the Epic 14d-v2 architecture:

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
│  - Gate 2: Each user opts in shareMyTransactions per group ← THIS STORY
│  - Both gates must be TRUE to see a user's transactions         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Difference from Story 1.11:**
- Story 1.11 is the **group-level** toggle controlled by the owner (15 min cooldown)
- This story is the **user-level** preference per group (5 min cooldown)
- Both gates must be TRUE for transaction visibility

## Acceptance Criteria

### Core Toggle Functionality

**AC1:** Given I am a member of a group with `transactionSharingEnabled: true`, When I go to Group Settings > My Sharing Preferences, Then I see a toggle "Share My Transactions" with:
- Current state (enabled/disabled)
- Helper text: "Your spending totals always appear in group statistics. This controls whether others see your individual transaction details."

**AC2:** Given `transactionSharingEnabled` is false for the group, When I view My Sharing Preferences, Then:
- The toggle is disabled (greyed out)
- Helper text shows: "Transaction sharing is disabled for this group by the owner"

**AC3:** Given I toggle `shareMyTransactions` to true, When the change is saved, Then:
- Preference is stored at `/users/{userId}/preferences/sharedGroups`
- `lastToggleAt` is updated to now (Timestamp)
- `toggleCountToday` is incremented
- Other members will see my transactions on their next sync

**AC4:** Given I toggle `shareMyTransactions` to false, When the change is saved, Then:
- Preference is updated
- I see confirmation: "Your future transactions won't be shared. Existing cached data on other devices will be cleared on their next sync."

### Cooldown & Rate Limiting

**AC5:** Given I try to toggle again within 5 minutes, When I tap the toggle, Then I see: "Please wait X minutes before changing this setting"

**AC6:** Given I have toggled 3 times today, When I try to toggle again, Then I see: "Daily limit reached. Try again tomorrow."

**AC7:** Given it's a new day (midnight in my local timezone), When I try to toggle, Then my daily count has reset and I can toggle again

### UI Feedback

**AC8:** Given I successfully toggle the setting, When the Firestore write completes, Then I see a success toast: "Sharing preference updated"

**AC9:** Given the Firestore write fails (network error), When the error is caught, Then:
- I see an error toast: "Failed to update preference. Please try again."
- The toggle state is reverted to previous value (optimistic rollback)

### Data Model (Preferences Document Schema)

**AC10:** Given the user preferences document exists at `/users/{userId}/preferences/sharedGroups`, Then the document structure follows:
```typescript
{
  groupPreferences: {
    [groupId: string]: {
      shareMyTransactions: boolean;          // default: false
      lastToggleAt: Timestamp | null;
      toggleCountToday: number;
      toggleCountResetAt: Timestamp | null;
    }
  }
}
```

**AC11:** Given I join a new group, When no preference exists for that group, Then `shareMyTransactions` defaults to `false` (privacy-first, per LV-6)

### Atlas-Suggested: Persistence & Cleanup

**AC12:** Given I update my preference on one device, When I open the app on another device, Then my preference is synced from Firestore (multi-device support)

**AC13:** Given I leave a group (or am removed), When the leave is processed, Then my preference entry for that group is deleted from the preferences document (cleanup)

**AC14:** Given I view group statistics (byMember breakdown), When my `shareMyTransactions` is false, Then:
- My spending total STILL appears in byMember breakdown (statistics always on per LV-1/FR-22)
- Only individual transaction details are hidden

**AC15:** Given I toggle `shareMyTransactions` to false, When the helper text appears, Then it explains eventual consistency: "Other members will stop seeing your transactions on their next sync."

### Edge Cases

**AC16:** Given the preferences document doesn't exist (new user), When I access Group Settings, Then the document is created with default values on first write

**AC17:** Given the `toggleCountToday` field is missing (migration), When I view the toggle, Then the field defaults to 0

**AC18:** Given I am not a member of the group (edge case), When I try to access preferences, Then the operation fails with appropriate error handling

## Tasks / Subtasks

### Task 1: User Preferences Type & Schema (AC: 10, 11, 16, 17)

- [ ] 1.1 Create `UserGroupPreferences` type in `src/types/userPreferences.ts`:
  ```typescript
  interface UserGroupPreference {
    shareMyTransactions: boolean;
    lastToggleAt: Timestamp | null;
    toggleCountToday: number;
    toggleCountResetAt: Timestamp | null;
  }

  interface UserGroupPreferencesDocument {
    groupPreferences: Record<string, UserGroupPreference>;
  }
  ```
- [ ] 1.2 Add default values factory function `createDefaultGroupPreference()`
- [ ] 1.3 Write 4+ unit tests for type utilities

### Task 2: User Preferences Service (AC: 3, 4, 10, 12, 13, 16)

- [ ] 2.1 Create `src/services/userGroupPreferencesService.ts` with functions:
  - `getUserGroupPreferences(userId): Promise<UserGroupPreferencesDocument | null>`
  - `updateShareMyTransactions(userId, groupId, enabled): Promise<void>`
  - `deleteGroupPreference(userId, groupId): Promise<void>`
- [ ] 2.2 Implement Firestore path: `/users/{userId}/preferences/sharedGroups`
- [ ] 2.3 Implement atomic update with `lastToggleAt` and `toggleCountToday`
- [ ] 2.4 Implement merge behavior for existing preferences document
- [ ] 2.5 Write 8+ unit tests for service functions

### Task 3: Toggle Cooldown Logic (AC: 5, 6, 7, 17)

- [ ] 3.1 Create `canToggleUserSharingPreference(preference): { allowed: boolean, waitMinutes?: number, reason?: string }` utility
- [ ] 3.2 Implement 5-minute cooldown check using `lastToggleAt`
- [ ] 3.3 Implement 3x daily limit check using `toggleCountToday`
- [ ] 3.4 Implement midnight reset logic using device local timezone
- [ ] 3.5 Write 12+ unit tests for cooldown scenarios (boundary conditions, timezone edge cases)

### Task 4: User Sharing Toggle Component (AC: 1, 2, 5, 6, 8, 9)

- [ ] 4.1 Create `UserTransactionSharingToggle.tsx` component
- [ ] 4.2 Implement toggle with helper text based on state
- [ ] 4.3 Implement disabled state when group sharing is off (AC2)
- [ ] 4.4 Implement cooldown UI (disabled state, "wait X minutes" message)
- [ ] 4.5 Implement daily limit UI ("Daily limit reached" message)
- [ ] 4.6 Add success/error toast notifications (optimistic with rollback)
- [ ] 4.7 Write 12+ unit tests for component states

### Task 5: Integration into Group Settings (AC: 1, 2, 14, 15)

- [ ] 5.1 Add "My Sharing Preferences" section to Group Settings UI
- [ ] 5.2 Show toggle per group the user belongs to
- [ ] 5.3 Add info tooltip explaining the double-gate model and statistics visibility
- [ ] 5.4 Add eventual consistency explanation text
- [ ] 5.5 Write integration tests for full flow

### Task 6: Group Leave Cleanup Hook (AC: 13)

- [ ] 6.1 Update `leaveGroup()` service to also call `deleteGroupPreference(userId, groupId)`
- [ ] 6.2 Handle cleanup in ownership transfer scenarios
- [ ] 6.3 Write 4+ unit tests for cleanup scenarios

### Task 7: Security Rules (AC: 10, 18)

- [ ] 7.1 Add Firestore security rules for `/users/{userId}/preferences/sharedGroups`:
  - Read: owner only (`userId == request.auth.uid`)
  - Write: owner only
  - No cross-user access
- [ ] 7.2 Write security rules tests (4+ tests)

### Task 8: Custom Hook for Preference Access (AC: 1, 12)

- [ ] 8.1 Create `useUserGroupPreference(groupId)` hook
- [ ] 8.2 Implement Firestore subscription for real-time updates
- [ ] 8.3 Return `{ preference, isLoading, updatePreference, canToggle }`
- [ ] 8.4 Write 6+ unit tests for hook

## Dev Notes

### Architecture Patterns

- **Layered Visibility Model (LV-1):** Statistics ALWAYS include all members' contributions regardless of this toggle
- **Double-Gate (LV-3):** Transaction visibility requires BOTH `transactionSharingEnabled` (group, Story 1.11) AND `shareMyTransactions` (user, this story)
- **Eventual Consistency (LV-5):** When toggle changes to false, other members' cache clears on next sync (no purge signal)
- **Privacy-First (LV-6):** Default `shareMyTransactions: false` when joining a group
- **Cooldown Pattern:** 5 min user-level (vs 15 min group-level in Story 1.11)

### Source Tree Components

| Component | Path | Change Type |
|-----------|------|-------------|
| User preferences types | `src/types/userPreferences.ts` | New |
| Preferences service | `src/services/userGroupPreferencesService.ts` | New |
| Cooldown utility | `src/utils/userSharingCooldown.ts` | New |
| Toggle component | `src/components/SharedGroups/UserTransactionSharingToggle.tsx` | New |
| Custom hook | `src/hooks/useUserGroupPreference.ts` | New |
| Group Settings UI | `src/views/SettingsView.tsx` or extracted view | Integrate |
| Leave group service | `src/services/sharedGroupService.ts` | Extend |
| Security rules | `firestore.rules` | Update |

### Testing Standards

- Minimum 80% coverage for new code
- Test all cooldown edge cases (boundary conditions, 0/1/2/3 toggles, 4:59/5:00/5:01 minutes)
- Test midnight reset across timezones
- Test multi-device sync via Firestore
- Test group leave cleanup
- Security rules tests for user preferences document

### Constraints from Architecture

- **FR-20:** Users can opt-in/out of sharing their transactions per group
- **FR-21:** 5 min cooldown, 3×/day limit (user-level)
- **FR-22:** Statistics always include all members' contributions
- **FR-24:** Clear UX communication on setting changes
- **LV-5:** Eventual consistency on opt-out
- **LV-6:** Default `shareMyTransactions: false` (privacy-first)

### Dependencies

- **Story 1.11 (Transaction Sharing Toggle - Group Level):** The group-level toggle must be enabled for this toggle to be active
- **Story 1.7 (Leave/Manage Group):** Leave flow should call cleanup function from this story
- **Story 1.14 (Join Flow Opt-In):** Join flow sets initial value of this preference

### Project Structure Notes

- Follows Epic 14.22 Settings patterns (hierarchical settings with sub-views)
- Toggle follows BoletApp's existing toggle component conventions
- Service follows user document patterns (`/users/{userId}/...`)
- Firestore path is under user document for proper security scoping

### References

- [Source: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md - Story 1.12, Story 1.13]
- [Source: docs/architecture/epic-14d-requirements-and-concerns.md - Layered Visibility Model, FR-20, FR-21, LV-5, LV-6]
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/04-architecture.md - Shared Group patterns]
- [Source: docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-11-transaction-sharing-toggle-group.md - Pattern reference]

---

## Atlas Workflow Analysis

> This section was generated by Atlas workflow chain analysis

### Affected Workflows

| Workflow | Impact Description |
|----------|-------------------|
| **Transaction Visibility Flow** | **GATE 2** of double-gate model - combined with group's `transactionSharingEnabled` determines which transactions are visible to other members |
| **Settings Flow** | New "My Sharing Preferences" section - nested under each group in Group Settings UI |
| **History Filter Flow (#6)** | Group view filtering respects this preference via Cloud Function visibility filtering (Story 2.11) |
| **Sync Flow (Stories 2.2-2.3)** | Sync applies double-gate logic - this toggle affects which transactions appear in other members' cache |
| **Join Flow (Story 1.14)** | Initial preference set during join - this story defines the preference schema that 1.14 writes to |

### Downstream Effects to Consider

| Story | Effect |
|-------|--------|
| **2.2 (View Group Transactions)** | Reads `shareMyTransactions` to determine which users' transactions are visible |
| **2.11 (Cloud Function Visibility Filtering)** | Server-side enforcement of double-gate model - reads this preference |
| **2.12 (Sharing Disabled Empty State)** | Shows appropriate UX when user has opted out |
| **1.14 (Join Flow Opt-In)** | Sets initial value of `shareMyTransactions` during group join |
| **1.7 (Leave/Manage Group)** | Cleanup: deletes preference entry when user leaves group |

### Testing Implications

- **Existing tests to verify:** None (new feature)
- **New scenarios to add:**
  - Toggle cooldown logic (5 min, 3x daily, midnight reset)
  - Disabled state when group `transactionSharingEnabled: false`
  - Firestore persistence and multi-device sync
  - Group leave cleanup (preference deletion)
  - Default value application for new group members
  - Integration with Story 2.2 visibility filtering (future)

### Workflow Chain Visualization

```
[Story 1.4: Create Group] → [Story 1.11: Group Toggle (Gate 1)]
                                        ↓
               [Story 1.14: Join Flow] → [THIS STORY: User Preference (Gate 2)]
                                                    ↓
                                        [Story 2.2: View Transactions]
                                                    ↓
                                        [Story 2.11: Cloud Function Visibility]
                                                    ↓
                                        [Story 2.12: Empty State UX]
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
