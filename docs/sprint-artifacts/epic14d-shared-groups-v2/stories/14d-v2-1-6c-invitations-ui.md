# Story 14d-v2.1.6c: Invitations UI Components

Status: split

> **SPLIT 2026-02-01:** Story exceeded sizing limits (18 subtasks > 15 max)
> **Split into:**
> - [14d-v2-1-6c-1-badge-list.md](14d-v2-1-6c-1-badge-list.md) - Badge & List UI (2 tasks, 10 subtasks)
> - [14d-v2-1-6c-2-accept-dialog.md](14d-v2-1-6c-2-accept-dialog.md) - Accept Dialog (1 task, 8 subtasks)
>
> **Split strategy:** by_feature (foundation UI vs interaction logic)

> **Split from:** [14d-v2-1-6-accept-decline-invitation.md](14d-v2-1-6-accept-decline-invitation.md)
> **Part:** 3 of 5 (UI Components - Main Interaction)
> **Related stories:** 14d-v2-1-6a (Deep Link), 14d-v2-1-6b (Logic), 14d-v2-1-6d (Opt-In), 14d-v2-1-6e (Rules)

## Story

As a **user**,
I want **to see my pending invitations and accept/decline them with a clear UI**,
So that **I can easily manage group invitations from the app**.

## Acceptance Criteria

### From Original Story (AC: #1, #2, #14, #15)

1. **Given** I have a pending group invitation
   **When** I open the app
   **Then** I see a notification badge indicating pending invitations
   **And** I can view the invitation details (group name, inviter)

2. **Given** I view a pending invitation
   **When** I tap "Accept"
   **Then** I become a member of the group
   **And** the invitation is removed from pending
   **And** other group members can see me in the member list

3. **Given** I accept an invitation successfully
   **When** the View Mode Switcher is opened
   **Then** the newly joined group appears immediately in my groups list

4. **Given** I have multiple pending invitations
   **When** I view the invitations list
   **Then** I see all pending invitations sorted by date (newest first)
   **And** each shows group name, inviter name, and invitation date

## Tasks / Subtasks

- [ ] **Task 6: Pending Invitations Badge** (AC: #1)
  - [ ] 6.1: Create `usePendingInvitationsCount()` hook
  - [ ] 6.2: Query count of pending invitations for current user
  - [ ] 6.3: Update Settings icon or dedicated location with badge count
  - [ ] 6.4: Add unit tests for badge logic

- [ ] **Task 7: Invitations List UI** (AC: #1, #4)
  - [ ] 7.1: Create `src/components/SharedGroups/PendingInvitationsView.tsx`
  - [ ] 7.2: Display list of pending invitations with group name, inviter, date
  - [ ] 7.3: Add Accept/Decline buttons for each invitation
  - [ ] 7.4: Handle empty state: "No pending invitations"
  - [ ] 7.5: Add loading state while fetching
  - [ ] 7.6: Add unit tests for component

- [ ] **Task 8: Invitation Detail/Accept Dialog** (AC: #2, #3)
  - [ ] 8.1: Create `src/components/SharedGroups/AcceptInvitationDialog.tsx`
  - [ ] 8.2: Show invitation details: group name, inviter name, member count
  - [ ] 8.3: If `transactionSharingEnabled == true`: trigger opt-in flow (Story 1.6d)
  - [ ] 8.4: If `transactionSharingEnabled == false`: skip opt-in, join directly
  - [ ] 8.5: Add Accept/Decline/Cancel buttons
  - [ ] 8.6: Show success toast on accept
  - [ ] 8.7: Navigate to new group after accept (AC: #3 - View Mode Switcher)
  - [ ] 8.8: Add unit tests for dialog states

## Dev Notes

### Architecture Decisions (from Epic 14d-v2)

| Decision | Value | Rationale |
|----------|-------|-----------|
| **Badge Location** | Settings icon or dedicated area | Visible notification of pending invitations |
| **List Sorting** | Newest first | Most relevant invitations at top |
| **Post-Accept Navigation** | View Mode Switcher | Immediate access to new group |

### UI Mockup Reference

**Pending Invitations List:**
```
┌────────────────────────────────────────┐
│ Pending Invitations                    │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ Household                          │ │
│ │ Invited by Alice - 2 days ago     │ │
│ │ [Accept]  [Decline]               │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ Office Lunch                       │ │
│ │ Invited by Bob - 5 days ago       │ │
│ │ [Accept]  [Decline]               │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**Accept Dialog (basic - no sharing):**
```
┌────────────────────────────────────────┐
│ Join "Household"?                      │
├────────────────────────────────────────┤
│ Alice invited you to join this group.  │
│                                        │
│ Members: 3                             │
│                                        │
│ [Cancel]  [Decline]  [Join Group]     │
└────────────────────────────────────────┘
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/usePendingInvitationsCount.ts` | **NEW** | Badge count hook |
| `src/components/SharedGroups/PendingInvitationsView.tsx` | **NEW** | Invitations list |
| `src/components/SharedGroups/AcceptInvitationDialog.tsx` | **NEW** | Accept/decline dialog |
| `tests/unit/hooks/usePendingInvitationsCount.test.ts` | **NEW** | Hook tests |
| `tests/unit/components/SharedGroups/PendingInvitationsView.test.tsx` | **NEW** | Component tests |
| `tests/unit/components/SharedGroups/AcceptInvitationDialog.test.tsx` | **NEW** | Dialog tests |

### Testing Standards

- **Unit tests:** 25+ tests covering hooks and components
- **Coverage target:** 80%+ for new code
- **Test patterns:** Mock service functions, test loading/empty/error states

### Project Structure Notes

- Components: `src/components/SharedGroups/` directory
- Hooks: `src/hooks/` for React hooks
- Feature directory: `src/features/shared-groups/` (per Epic 14e patterns)

### References

- [Original Story: 14d-v2-1-6-accept-decline-invitation.md](14d-v2-1-6-accept-decline-invitation.md)
- [Story 1.10 (View Mode Switcher): 14d-v2-1-10a-viewmode-store-integration.md]

## Dependency Notes

**UPSTREAM (must be complete):**
- Story 14d-v2-1-6a: Deep Link & Service (provides getPendingInvitationsForUser)
- Story 14d-v2-1-6b: Accept/Decline Logic (provides accept/decline functions)

**DOWNSTREAM (depends on this):**
- Story 14d-v2-1-6d: Opt-In Dialog (triggered from AcceptInvitationDialog)
- Story 14d-v2-1-10b: View Mode Switcher UI (shows newly joined groups)

## Dev Agent Record

### Agent Model Used

_To be filled during implementation_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled during implementation_

### File List

_To be filled during implementation_
