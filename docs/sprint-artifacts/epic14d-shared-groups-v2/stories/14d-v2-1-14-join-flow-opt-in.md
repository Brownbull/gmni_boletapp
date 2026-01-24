# Story 14d-v2-1.14: Join Flow Transaction Sharing Opt-In

Status: ready-for-dev

## Story

As a **user joining a group**,
I want **to be prompted about transaction sharing when I join**,
so that **I can make an informed choice about sharing my transaction details**.

## Background

This story implements FR-25 (Join flow opt-in prompt) from the Layered Visibility Model. When a user accepts an invitation to a group that has `transactionSharingEnabled: true`, they should see a clear opt-in prompt BEFORE joining is finalized.

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYERED VISIBILITY MODEL                                       │
├─────────────────────────────────────────────────────────────────┤
│  STATISTICS (Always On)                                         │
│  - byCategory, byMember, totals, insights                       │
│  - All members' transactions contribute (anonymized)            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  TRANSACTIONS (Double-Gated)                                    │
│  - Gate 1: Group owner enables transactionSharingEnabled        │
│  - Gate 2: Each user opts in shareMyTransactions per group      │
│  - THIS STORY → Gate 2 initialization at join time              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Principle:** Privacy-first approach (LV-6) - the default is `false` if the user dismisses or doesn't choose.

## Acceptance Criteria

### Core Requirements (from Epic)

**AC1:** Given I accept a group invitation, When the group has `transactionSharingEnabled: true`, Then before completing the join, I see a dialog:
- Title: "[Group Name] allows transaction sharing"
- Body: "Would you like to share your transaction details with group members? Your spending totals will always be visible in group statistics."
- Options: [Yes, share my transactions] [No, just statistics]

**AC2:** Given I tap "Yes, share my transactions", When the join completes, Then `shareMyTransactions` is set to `true` for this group, And I see confirmation: "You're now a member of [Group Name]"

**AC3:** Given I tap "No, just statistics", When the join completes, Then `shareMyTransactions` is set to `false` for this group, And I see confirmation: "You're now a member of [Group Name]. You can change sharing preferences in group settings."

**AC4:** Given the group has `transactionSharingEnabled: false`, When I accept the invitation, Then I do NOT see the transaction sharing prompt, And I join directly with `shareMyTransactions: false`

**AC5:** Given I dismiss the dialog without choosing (backdrop tap, back button, swipe), When the join completes, Then `shareMyTransactions` defaults to `false` (privacy-first), And I see confirmation: "You're now a member of [Group Name]. Transaction sharing is off by default."

### Constraint Enforcement

**AC6:** Constraint FR-25 is enforced (join flow prompts user to opt-in when joining group with sharing enabled)

**AC7:** Constraint LV-6 is enforced (`shareMyTransactions` defaults to `false`)

**AC8:** Constraint LV-8 is enforced (prompt appears on join for sharing-enabled groups)

### Integration Requirements

**AC9:** Given the opt-in dialog is shown, When the user makes a choice, Then the preference is written to `/users/{userId}/preferences/sharedGroups` using Story 1.13 schema:
```typescript
groupPreferences[groupId] = {
  shareMyTransactions: boolean,  // based on user choice
  lastToggleAt: Timestamp,       // set to now
  toggleCountToday: 0,           // fresh join, no toggles yet
  toggleCountResetAt: null       // not yet relevant
}
```

**AC10:** Given the user completes the opt-in flow, When they are added to the group, Then the View Mode Switcher (Story 1.10) shows the new group immediately

**AC11:** Given the user chose "Yes, share my transactions", When other group members sync (Story 2.3), Then they can see this user's transactions (respecting double-gate model)

### Accessibility Requirements

**AC12:** The opt-in dialog is keyboard navigable (Tab between options, Enter to select)

**AC13:** The opt-in dialog is screen reader compatible with proper ARIA labels

### Edge Cases

**AC14:** Given the user is offline, When they try to accept an invitation, Then they see an offline error message before the opt-in dialog would appear

**AC15:** Given the preference write fails after user chooses, When the error occurs, Then the join is rolled back and user sees error: "Failed to join group. Please try again."

## Tasks / Subtasks

### Task 1: Transaction Sharing Opt-In Dialog Component (AC: 1, 5, 12, 13)

- [ ] 1.1 Create `src/components/SharedGroups/TransactionSharingOptInDialog.tsx`
- [ ] 1.2 Implement dialog UI matching design spec:
  ```
  ┌────────────────────────────────────────┐
  │ 🔐 [Group Name] allows transaction     │
  │ sharing                                │
  ├────────────────────────────────────────┤
  │ Would you like to share your           │
  │ transaction details with group         │
  │ members?                               │
  │                                        │
  │ Your spending totals will always be    │
  │ visible in group statistics.           │
  │                                        │
  │ ┌────────────────────────────────────┐ │
  │ │ ○ Yes, share my transactions       │ │
  │ └────────────────────────────────────┘ │
  │ ┌────────────────────────────────────┐ │
  │ │ ● No, just statistics (default)    │ │
  │ └────────────────────────────────────┘ │
  │                                        │
  │ ℹ️ You can change this later in       │
  │ group settings.                        │
  │                                        │
  │ [Cancel]              [Join Group]     │
  └────────────────────────────────────────┘
  ```
- [ ] 1.3 Props interface:
  ```typescript
  interface TransactionSharingOptInDialogProps {
    open: boolean;
    groupName: string;
    onConfirm: (shareMyTransactions: boolean) => void;
    onCancel: () => void;
  }
  ```
- [ ] 1.4 Default selection is "No, just statistics" (privacy-first)
- [ ] 1.5 Handle dismiss (backdrop tap) as Cancel with `shareMyTransactions: false`
- [ ] 1.6 Add keyboard navigation (Tab, Enter, Escape)
- [ ] 1.7 Add ARIA labels for screen readers
- [ ] 1.8 Apply theme colors (use existing theme context)
- [ ] 1.9 Write 12 unit tests covering all states

### Task 2: Integrate Opt-In with Accept Invitation Flow (AC: 1, 4, 9)

- [ ] 2.1 Modify `AcceptInvitationDialog.tsx` (from Story 1.6) to check `group.transactionSharingEnabled`
- [ ] 2.2 If `transactionSharingEnabled: true`: Show `TransactionSharingOptInDialog` before finalizing join
- [ ] 2.3 If `transactionSharingEnabled: false`: Skip opt-in, join with `shareMyTransactions: false`
- [ ] 2.4 Pass user's choice to `acceptInvitation()` service function
- [ ] 2.5 Write 8 integration tests for the flow

### Task 3: Update Accept Invitation Service (AC: 2, 3, 9, 15)

- [ ] 3.1 Modify `acceptInvitation(invitationId, shareMyTransactions)` in `invitationService.ts`
- [ ] 3.2 Create user group preferences document on accept:
  ```typescript
  // In Firestore transaction:
  const preferencesRef = doc(db, 'users', userId, 'preferences', 'sharedGroups');
  await updateDoc(preferencesRef, {
    [`groupPreferences.${groupId}`]: {
      shareMyTransactions: shareMyTransactions,
      lastToggleAt: serverTimestamp(),
      toggleCountToday: 0,
      toggleCountResetAt: null
    }
  }, { merge: true });
  ```
- [ ] 3.3 Ensure atomicity with group membership update
- [ ] 3.4 Implement rollback on failure
- [ ] 3.5 Write 10 unit tests for service function

### Task 4: Confirmation Messages (AC: 2, 3, 5)

- [ ] 4.1 Create confirmation toast variants:
  - Opted in: "You're now a member of [Group Name]"
  - Opted out: "You're now a member of [Group Name]. You can change sharing preferences in group settings."
  - Dismissed: "You're now a member of [Group Name]. Transaction sharing is off by default."
- [ ] 4.2 Use existing toast system
- [ ] 4.3 Write 3 unit tests for toast messages

### Task 5: Offline Handling (AC: 14)

- [ ] 5.1 Check network status before showing opt-in dialog
- [ ] 5.2 If offline, show error: "You're offline. Please connect to join groups."
- [ ] 5.3 Use existing `useOnlineStatus` hook
- [ ] 5.4 Write 2 unit tests for offline scenarios

### Task 6: Analytics Event Tracking (Suggested AC)

- [ ] 6.1 Track opt-in dialog impressions
- [ ] 6.2 Track user choice (yes/no/dismiss)
- [ ] 6.3 Calculate opt-in rate for product insights
- [ ] 6.4 Use existing analytics service pattern

### Task 7: Integration Tests (AC: all)

- [ ] 7.1 E2E: Join group with sharing enabled, choose "Yes"
- [ ] 7.2 E2E: Join group with sharing enabled, choose "No"
- [ ] 7.3 E2E: Join group with sharing enabled, dismiss dialog
- [ ] 7.4 E2E: Join group with sharing disabled (no dialog)
- [ ] 7.5 E2E: Verify preference persists after join
- [ ] 7.6 E2E: Verify group appears in View Mode Switcher
- [ ] 7.7 E2E: Verify other members can/cannot see transactions based on choice

## Dev Notes

### Architecture Decisions

| Decision | Value | Source |
|----------|-------|--------|
| **FR-25** | Join flow opt-in prompt | [epics.md line 84] |
| **LV-6** | Default `shareMyTransactions: false` | [architecture.md Section 5.1] |
| **LV-8** | Prompt on join for sharing-enabled groups | [epics.md line 163] |

### Data Flow

```
User clicks "Accept" on invitation
        │
        ├── Fetch group document
        │       │
        │       ├── group.transactionSharingEnabled == true?
        │       │       │
        │       │       └── YES → Show TransactionSharingOptInDialog
        │       │               │
        │       │               ├── "Yes, share" → shareMyTransactions: true
        │       │               │
        │       │               ├── "No, statistics" → shareMyTransactions: false
        │       │               │
        │       │               └── Dismiss/Cancel → shareMyTransactions: false (LV-6)
        │       │
        │       └── NO → Skip dialog, shareMyTransactions: false
        │
        └── Execute Firestore transaction:
            1. Add user to group.members[]
            2. Write user preferences document (Story 1.13 schema)
            3. Update invitation.status = 'accepted'
            4. Invalidate React Query cache
```

### UI Mockup (Detailed)

**Opt-In Dialog - Sharing Enabled:**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│   🔐  "Household" allows transaction sharing                   │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Would you like to share your transaction details with        │
│   group members?                                               │
│                                                                │
│   Your spending totals will always be visible in group         │
│   statistics.                                                  │
│                                                                │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │  ○  Yes, share my transactions                           │ │
│   │     Other members can see your individual expenses       │ │
│   └──────────────────────────────────────────────────────────┘ │
│                                                                │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │  ●  No, just statistics  ✓ (selected by default)         │ │
│   │     Only your spending totals are visible                │ │
│   └──────────────────────────────────────────────────────────┘ │
│                                                                │
│   ℹ️  You can change this anytime in group settings           │
│                                                                │
│   ┌──────────────┐                    ┌──────────────────────┐ │
│   │   Cancel     │                    │   Join Group  ✓      │ │
│   └──────────────┘                    └──────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/SharedGroups/TransactionSharingOptInDialog.tsx` | **NEW** | Opt-in dialog component |
| `src/components/SharedGroups/TransactionSharingOptInDialog.test.tsx` | **NEW** | Component tests |
| `src/components/SharedGroups/AcceptInvitationDialog.tsx` | MODIFY | Integrate opt-in dialog |
| `src/services/invitationService.ts` | MODIFY | Add preference creation on accept |
| `tests/unit/services/invitationService.test.ts` | MODIFY | Add opt-in tests |
| `tests/e2e/sharedGroups/joinFlow.spec.ts` | **NEW** | E2E tests for join flow |

### Dependency Graph

```
UPSTREAM (must be complete):
├── Story 1.4: Create Shared Group (provides group with transactionSharingEnabled)
├── Story 1.5: Invite Members (provides PendingInvitation, share codes)
├── Story 1.6: Accept/Decline Invitation (provides AcceptInvitationDialog to extend)
└── Story 1.13: User Group Preferences Document (provides Firestore schema)

DOWNSTREAM (depends on this):
├── Story 1.12: User Transaction Sharing Preference (settings UI to change preference)
├── Story 2.2: View Group Transactions (reads shareMyTransactions for visibility)
└── Story 2.11: Cloud Function Visibility Filtering (server-side double-gate)
```

### Testing Standards

- **Unit tests:** 35+ tests covering component, service, and edge cases
- **Integration tests:** 7+ E2E tests for complete user journeys
- **Coverage target:** 80%+ for new code
- **Accessibility tests:** Dialog tested with Axe DevTools

### Project Structure Notes

- Components: `src/components/SharedGroups/` directory
- Services: `src/services/invitationService.ts` (existing)
- Types: Use `GroupPreference` from Story 1.13

### Relationship with Story 1.6

This story and Story 1.6 have overlapping requirements. The recommended implementation approach:
1. **Story 1.6** implements the core accept/decline flow and dialog integration
2. **Story 1.14** implements the opt-in dialog component itself (`TransactionSharingOptInDialog.tsx`)

If implementing together, Story 1.6 can include Task 9 (from this story's Task 1) or reference this story's component.

### References

- [Source: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md - Story 1.14]
- [Source: docs/architecture/epic-14d-requirements-and-concerns.md - Section 5.1 Layered Visibility Model]
- [Source: docs/architecture/epic-14d-requirements-and-concerns.md - FR-25, LV-6, LV-8]
- [Source: Story 1.6: docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-6-accept-decline-invitation.md]
- [Source: Story 1.13: docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-13-user-group-preferences-document.md]

---

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis

### Affected Workflows

| Workflow | Impact Description |
|----------|-------------------|
| **Accept/Decline Flow (Story 1.6)** | Adds intermediate opt-in dialog step between Accept and Join completion |
| **Deep Link Flow** | Share code handling must preserve state through the opt-in dialog |
| **User Group Preferences (Story 1.13)** | Initializes `shareMyTransactions` preference at join time |
| **View Mode Switcher (Story 1.10)** | New group appears immediately after join |

### Downstream Effects to Consider

| Story | Effect |
|-------|--------|
| **Story 2.2 (View Group Transactions)** | Uses `shareMyTransactions` set here to filter visibility |
| **Story 2.11 (Cloud Function Visibility Filtering)** | Server-side double-gate enforcement reads this preference |
| **Story 2.12 (Sharing Disabled Empty State)** | Shows appropriate UX based on preference |
| **Story 1.12 (User Transaction Sharing Preference)** | Allows changing the preference set at join time |

### Testing Implications

- **Existing tests to verify:** Story 1.6 acceptance tests (if implemented)
- **New scenarios to add:**
  - Dialog appears when `transactionSharingEnabled: true`
  - Dialog skipped when `transactionSharingEnabled: false`
  - "Yes" option sets `shareMyTransactions: true`
  - "No" option sets `shareMyTransactions: false`
  - Dismiss defaults to `shareMyTransactions: false` (LV-6)
  - Preference is immediately readable after dialog dismissal
  - Group appears in View Mode Switcher after join

### Workflow Chain Visualization

```
[Invite Members (1.5)] → [Accept/Decline (1.6)]
                                    │
                                    ↓
                        [THIS STORY: Opt-In Dialog]
                                    │
                     ┌──────────────┼──────────────┐
                     ↓              ↓              ↓
             Yes, share      No, stats      Dismiss
             (true)          (false)        (false/LV-6)
                     └──────────────┼──────────────┘
                                    ↓
                        [Preferences Saved (1.13)]
                                    │
                                    ↓
                        [View Mode Switcher (1.10)]
                                    │
                     ┌──────────────┴──────────────┐
                     ↓                             ↓
          [View Transactions (2.2)]     [Change Preference (1.12)]
```

---

## Dev Agent Record

### Agent Model Used

_To be filled during implementation_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled during implementation_

### File List

_To be filled during implementation_
