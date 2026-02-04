# Story 14d-v2-1.11: Transaction Sharing Toggle (Group Level)

Status: split

> **SPLIT 2026-02-01:** This story exceeded all sizing limits (6 tasks, 28 subtasks, 12 files).
> Split via Atlas Story Sizing workflow into 3 sub-stories:
> - [14d-v2-1-11a](14d-v2-1-11a-foundation-types-cooldown.md) - Foundation: Types + Cooldown (2 pts)
> - [14d-v2-1-11b](14d-v2-1-11b-service-layer-security.md) - Service Layer + Security (2 pts)
> - [14d-v2-1-11c](14d-v2-1-11c-ui-components-integration.md) - UI Components + Integration (2 pts)
> Total: 6 pts (was 3 pts - underestimated)

> **Architecture Alignment Review (2026-02-01):**
> Reviewed during Epic 14d-v2 alignment with Epic 14e Zustand patterns.
> No changes required - this story manages Firestore state, not client state.
> See [14d-v2-architecture-alignment-plan.md](../14d-v2-architecture-alignment-plan.md)

## Story

As a **group owner**,
I want **to enable or disable transaction sharing for my group**,
so that **I can control whether members can see each other's transaction details while still allowing statistics to be shared**.

## Background

This story implements the **group-level gate** (Gate 1) of the Layered Visibility Model defined in the Epic 14d-v2 architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│  STATISTICS (Always On)                                         │
│  - byCategory, byMember, totals, insights                       │
│  - All members' transactions contribute (anonymized)            │
│  - Non-negotiable part of group membership                      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  TRANSACTIONS (Double-Gated)                                    │
│  - Gate 1: Group owner enables transactionSharingEnabled  ← THIS STORY
│  - Gate 2: Each user opts in shareMyTransactions per group      │
│  - Both gates must be TRUE to see a user's transactions         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Acceptance Criteria

### Core Toggle Functionality

**AC1:** Given I am a group owner, When I go to Group Settings, Then I see a toggle "Allow Transaction Sharing" with:
- Current state (enabled/disabled)
- Helper text: "When enabled, members can choose to share their transaction details with the group."

**AC2:** Given I toggle the setting, When the change is saved, Then:
- `transactionSharingEnabled` is updated on the group document
- `transactionSharingLastToggleAt` is set to now (Timestamp)
- `transactionSharingToggleCountToday` is incremented

**AC3:** Given I try to toggle again within 15 minutes, When I tap the toggle, Then I see: "Please wait X minutes before changing this setting"

**AC4:** Given I have toggled 3 times today, When I try to toggle again, Then I see: "Daily limit reached. Try again tomorrow."

**AC5:** Given it's a new day (midnight in group's timezone), When I try to toggle, Then my daily count has reset and I can toggle again

### UI Feedback (Atlas Suggested)

**AC6:** Given I successfully toggle the setting, When the Firestore write completes, Then I see a success toast: "Transaction sharing [enabled/disabled]"

**AC7:** Given the Firestore write fails (network error), When the error is caught, Then:
- I see an error toast: "Failed to update setting. Please try again."
- The toggle state is reverted to previous value (optimistic rollback)

### Ownership Transfer Behavior

**AC8:** Given ownership is transferred to another member, When the transfer completes, Then the new owner inherits the group's current toggle state:
- `transactionSharingToggleCountToday` is NOT reset
- `transactionSharingLastToggleAt` is preserved
- Cooldown continues from where it was (no reset on transfer)

### Member Experience (Downstream Impact)

**AC9:** Given `transactionSharingEnabled` is false for the group, When members view group transactions, Then:
- They see ONLY their own transactions tagged with this group
- They see a notice: "Transaction sharing is disabled for this group"
- They can still view group statistics (byCategory, byMember breakdowns)

**AC10:** Given I change `transactionSharingEnabled` from `true` to `false`, When members perform their next sync, Then:
- Members' cached other-user transactions are cleared on sync (eventual consistency)
- Statistics remain fully populated (all members still contribute)

### Edge Cases

**AC11:** Given I am NOT the group owner (regular member), When I view Group Settings, Then:
- I see the toggle state as read-only (disabled toggle)
- Helper text: "Only the group owner can change this setting"

**AC12:** Given the group document doesn't have `transactionSharingToggleCountToday` field (migration), When I view the toggle, Then the field defaults to 0

## Tasks / Subtasks

### Task 1: Extend SharedGroup Type (AC: 1, 2, 12)

- [ ] 1.1 Add `transactionSharingEnabled: boolean` to SharedGroup type
- [ ] 1.2 Add `transactionSharingLastToggleAt: Timestamp | null` field
- [ ] 1.3 Add `transactionSharingToggleCountToday: number` field
- [ ] 1.4 Add `transactionSharingToggleCountResetAt: Timestamp | null` field
- [ ] 1.5 Update Firestore security rules to allow owner write to these fields

### Task 2: Toggle Cooldown Service Logic (AC: 3, 4, 5)

- [ ] 2.1 Create `canToggleTransactionSharing(group): { allowed: boolean, waitMinutes?: number, reason?: string }` utility
- [ ] 2.2 Implement 15-minute cooldown check using `transactionSharingLastToggleAt`
- [ ] 2.3 Implement 3x daily limit check using `transactionSharingToggleCountToday`
- [ ] 2.4 Implement midnight reset logic using group's timezone
- [ ] 2.5 Write 12+ unit tests for cooldown scenarios

### Task 3: Toggle UI Component (AC: 1, 3, 4, 6, 7, 11)

- [ ] 3.1 Create `TransactionSharingToggle.tsx` component
- [ ] 3.2 Implement toggle with helper text and current state display
- [ ] 3.3 Implement cooldown UI (disabled state, "wait X minutes" message)
- [ ] 3.4 Implement daily limit UI ("Daily limit reached" message)
- [ ] 3.5 Implement read-only mode for non-owners
- [ ] 3.6 Add success/error toast notifications
- [ ] 3.7 Write 10+ unit tests for component states

### Task 4: Firestore Update Service (AC: 2, 7, 8)

- [ ] 4.1 Create `updateTransactionSharingEnabled(groupId, enabled): Promise<void>` service function
- [ ] 4.2 Implement atomic update with all related fields (enabled, lastToggleAt, toggleCount)
- [ ] 4.3 Implement optimistic UI pattern with rollback on failure
- [ ] 4.4 Ensure ownership transfer preserves toggle state (no mutations)
- [ ] 4.5 Write 6+ unit tests for service function

### Task 5: Integration into Group Settings View (AC: 1, 9, 10)

- [ ] 5.1 Add TransactionSharingToggle to existing Group Settings UI (Story 14.22 pattern)
- [ ] 5.2 Add "Sharing disabled" notice to group transaction views when `transactionSharingEnabled: false`
- [ ] 5.3 Add info tooltip explaining the double-gate model
- [ ] 5.4 Write integration tests for full flow

### Task 6: Security Rules Update (AC: 2, 8)

- [ ] 6.1 Add Firestore security rules for new fields:
  - `transactionSharingEnabled`: write allowed only by `ownerId`
  - `transactionSharingLastToggleAt`: write allowed only by `ownerId`
  - `transactionSharingToggleCountToday`: write allowed only by `ownerId`
- [ ] 6.2 Write security rules tests (4+ tests)

## Dev Notes

### Architecture Patterns

- **Layered Visibility Model (LV-1):** Statistics ALWAYS include all members' contributions regardless of this toggle
- **Double-Gate (LV-3):** Transaction visibility requires BOTH `transactionSharingEnabled` (group) AND `shareMyTransactions` (user)
- **Eventual Consistency (LV-5):** When toggle changes to false, other members' cache clears on next sync (no purge signal)
- **Cooldown Pattern:** Same pattern as Story 1.12 (user preferences) - 15 min group-level, 5 min user-level

### Source Tree Components

| Component | Path | Change Type |
|-----------|------|-------------|
| SharedGroup type | `src/types/sharedGroup.ts` | Extend |
| Cooldown utility | `src/utils/sharingCooldown.ts` | New |
| Toggle component | `src/components/SharedGroups/TransactionSharingToggle.tsx` | New |
| Service function | `src/services/sharedGroupService.ts` | Extend stub |
| Group Settings UI | `src/views/SettingsView.tsx` (or extracted view) | Integrate |
| Security rules | `firestore.rules` | Update |

### Testing Standards

- Minimum 80% coverage for new code
- Test all cooldown edge cases (boundary conditions)
- Test timezone-aware midnight reset
- Test ownership transfer preservation
- Security rules tests for all new fields

### Constraints from Architecture

- **FR-19:** Group owner controls transaction sharing toggle
- **FR-21:** 15 min cooldown, 3×/day limit
- **FR-24:** Clear UX communication on setting changes
- **BC-1:** Max 5 groups per user (existing)
- **AD-6:** Group-level timezone (IANA format) used for midnight reset

### Project Structure Notes

- Component follows Epic 14.22 Settings patterns (hierarchical settings)
- Toggle follows BoletApp's toggle component conventions
- Service function follows stub pattern from Epic 14c-refactor (will be un-stubbed)

### References

- [Source: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md - Story 1.11]
- [Source: docs/architecture/epic-14d-requirements-and-concerns.md - Layered Visibility Model]
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/04-architecture.md - Shared Group patterns]

---

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis

### Affected Workflows

| Workflow | Impact Description |
|----------|-------------------|
| **Settings Flow** | Entry point for new group-level toggle UI - integrates with Story 14.22 Settings redesign patterns |
| **View Mode Switcher** | Groups list may show sharing status indicator (enabled/disabled badge) - downstream UI consideration |
| **Group Management Flow** | Toggle is part of group owner settings alongside create/invite/leave |
| **Transaction Visibility Flow** | This is Gate 1 of double-gate model - downstream stories (2.2, 2.11) depend on this |

### Downstream Effects to Consider

| Story | Effect |
|-------|--------|
| **2.2 (View Group Transactions)** | Uses `transactionSharingEnabled` to filter visible transactions |
| **2.11 (Cloud Function Visibility Filtering)** | Reads this flag for server-side double-gate enforcement |
| **2.12 (Sharing Disabled Empty State)** | Shows UX when this toggle is false |
| **1.12 (User Transaction Sharing Preference)** | User-level toggle is gated by this group-level toggle |

### Testing Implications

- **Existing tests to verify:** None (new feature, but follows existing Settings patterns)
- **New scenarios to add:**
  - Toggle cooldown logic (15 min, 3x daily, midnight reset)
  - Ownership transfer preserves cooldown state
  - Firestore persistence and rollback
  - Security rules enforcement
  - UI integration with Group Settings

### Workflow Chain Visualization

```
[Story 1.4: Create Group] → [THIS STORY: Toggle Setting] → [Story 1.12: User Preference]
                                      ↓
                            [Story 2.2: View Transactions]
                                      ↓
                            [Story 2.11: Visibility Filtering]
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
