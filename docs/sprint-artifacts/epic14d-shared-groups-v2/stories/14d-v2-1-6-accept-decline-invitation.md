# Story 14d-v2.1.6: Accept/Decline Group Invitation

Status: ready-for-dev

## Story

As a **user**,
I want **to accept or decline group invitations**,
So that **I can join groups I want and ignore ones I don't**.

## Acceptance Criteria

### Core Requirements (from Epic)

1. **Given** I have a pending group invitation
   **When** I open the app
   **Then** I see a notification badge indicating pending invitations
   **And** I can view the invitation details (group name, inviter)

2. **Given** I view a pending invitation
   **When** I tap "Accept"
   **Then** I become a member of the group
   **And** the invitation is removed from pending
   **And** other group members can see me in the member list

3. **Given** I view a pending invitation
   **When** I tap "Decline"
   **Then** the invitation is removed
   **And** I do not become a member

4. **Given** I tap an invite link while not logged in
   **When** I log in
   **Then** I am prompted to accept/decline the invitation

5. **Given** I tap an invite link with an invalid share code (not 16-char alphanumeric)
   **When** the link is processed
   **Then** I see a clear error message: "This invite link is invalid or expired"
   **And** I am NOT silently redirected
   **And** constraint FR-26 is enforced (user-friendly error for invalid share codes)

### Atlas-Suggested Additional Criteria

6. **Given** I access an invite link `/join/{shareCode}` while not authenticated
   **When** the deep link is processed
   **Then** the share code is stored in session/localStorage
   **And** I am redirected to login
   **And** after successful login, the invitation prompt is shown automatically

7. **Given** I access an invite link `/join/{shareCode}` while authenticated
   **When** the deep link is processed
   **Then** I am immediately shown the invitation details
   **And** I can accept or decline without additional navigation

8. **Given** I accept a group invitation
   **When** the group has `transactionSharingEnabled: true`
   **Then** before completing the join, I see a dialog:
     - Title: "[Group Name] allows transaction sharing"
     - Body: "Would you like to share your transaction details with group members? Your spending totals will always be visible in group statistics."
     - Options: [Yes, share my transactions] [No, just statistics]
   **And** constraint FR-25 is enforced (join flow opt-in prompt)

9. **Given** I tap "Yes, share my transactions" in the opt-in dialog
   **When** the join completes
   **Then** `shareMyTransactions` is set to `true` for this group
   **And** I see confirmation: "You're now a member of [Group Name]"

10. **Given** I tap "No, just statistics" in the opt-in dialog
    **When** the join completes
    **Then** `shareMyTransactions` is set to `false` for this group
    **And** I see confirmation: "You're now a member of [Group Name]. You can change sharing preferences in group settings."

11. **Given** the group has `transactionSharingEnabled: false`
    **When** I accept the invitation
    **Then** I do NOT see the transaction sharing prompt
    **And** I join directly with `shareMyTransactions: false`

12. **Given** I dismiss the opt-in dialog without choosing
    **When** the join completes
    **Then** `shareMyTransactions` defaults to `false` (privacy-first)
    **And** constraint LV-6 is enforced (default: false)

13. **Given** the share code has expired (>7 days old)
    **When** I try to accept the invitation
    **Then** I see: "This invitation has expired. Please ask for a new invite."
    **And** the invitation is not processed

14. **Given** I accept an invitation successfully
    **When** the View Mode Switcher is opened
    **Then** the newly joined group appears immediately in my groups list

15. **Given** I have multiple pending invitations
    **When** I view the invitations list
    **Then** I see all pending invitations sorted by date (newest first)
    **And** each shows group name, inviter name, and invitation date

## Tasks / Subtasks

- [ ] **Task 1: Deep Link Handler for `/join/{shareCode}`** (AC: #4, #6, #7)
  - [ ] 1.1: Create `src/hooks/useDeepLinkInvitation.ts`
  - [ ] 1.2: Detect `/join/{shareCode}` URL pattern on app open
  - [ ] 1.3: If authenticated: fetch invitation by share code immediately
  - [ ] 1.4: If not authenticated: store share code in localStorage, redirect to login
  - [ ] 1.5: After login: check localStorage for pending share code, trigger invitation flow
  - [ ] 1.6: Clear stored share code after processing (success or failure)
  - [ ] 1.7: Add unit tests for deep link scenarios

- [ ] **Task 2: Pending Invitations Service** (AC: #1, #15)
  - [ ] 2.1: Add `getPendingInvitationsForUser(email): Promise<PendingInvitation[]>` to `invitationService.ts`
  - [ ] 2.2: Query invitations where `invitedEmail == user.email` AND `status == 'pending'`
  - [ ] 2.3: Also query by share code for link-based invitations
  - [ ] 2.4: Sort by `createdAt` descending (newest first)
  - [ ] 2.5: Add unit tests for service function

- [ ] **Task 3: Accept Invitation Logic** (AC: #2, #8-12)
  - [ ] 3.1: Create `acceptInvitation(invitationId, shareMyTransactions): Promise<void>` in `invitationService.ts`
  - [ ] 3.2: Validate invitation exists and is not expired
  - [ ] 3.3: Add user to group's `members` array
  - [ ] 3.4: Create user group preferences document with `shareMyTransactions` setting
  - [ ] 3.5: Update invitation status to `'accepted'`
  - [ ] 3.6: Use Firestore transaction for atomicity
  - [ ] 3.7: Add unit tests for accept flow

- [ ] **Task 4: Decline Invitation Logic** (AC: #3)
  - [ ] 4.1: Create `declineInvitation(invitationId): Promise<void>` in `invitationService.ts`
  - [ ] 4.2: Update invitation status to `'declined'`
  - [ ] 4.3: Do NOT add user to group
  - [ ] 4.4: Add unit tests for decline flow

- [ ] **Task 5: Invalid/Expired Share Code Handling** (AC: #5, #13)
  - [ ] 5.1: Add validation in `getInvitationByShareCode()` for:
    - Share code format (16+ alphanumeric)
    - Invitation exists
    - Invitation not expired (`expiresAt > now`)
    - Invitation status is `'pending'`
  - [ ] 5.2: Return error type enum: `INVALID_FORMAT`, `NOT_FOUND`, `EXPIRED`, `ALREADY_PROCESSED`
  - [ ] 5.3: Add unit tests for each error case

- [ ] **Task 6: Pending Invitations Badge** (AC: #1)
  - [ ] 6.1: Create `usePendingInvitationsCount()` hook
  - [ ] 6.2: Query count of pending invitations for current user
  - [ ] 6.3: Update Settings icon or dedicated location with badge count
  - [ ] 6.4: Add unit tests for badge logic

- [ ] **Task 7: Invitations List UI** (AC: #1, #15)
  - [ ] 7.1: Create `src/components/SharedGroups/PendingInvitationsView.tsx`
  - [ ] 7.2: Display list of pending invitations with group name, inviter, date
  - [ ] 7.3: Add Accept/Decline buttons for each invitation
  - [ ] 7.4: Handle empty state: "No pending invitations"
  - [ ] 7.5: Add loading state while fetching
  - [ ] 7.6: Add unit tests for component

- [ ] **Task 8: Invitation Detail/Accept Dialog** (AC: #2, #8-12)
  - [ ] 8.1: Create `src/components/SharedGroups/AcceptInvitationDialog.tsx`
  - [ ] 8.2: Show invitation details: group name, inviter name, member count
  - [ ] 8.3: If `transactionSharingEnabled == true`: show opt-in prompt before accept
  - [ ] 8.4: If `transactionSharingEnabled == false`: skip opt-in, join directly
  - [ ] 8.5: Add Accept/Decline/Cancel buttons
  - [ ] 8.6: Show success toast on accept
  - [ ] 8.7: Navigate to new group after accept (AC: #14)
  - [ ] 8.8: Add unit tests for dialog states

- [ ] **Task 9: Transaction Sharing Opt-In Dialog** (AC: #8-12)
  - [ ] 9.1: Create `src/components/SharedGroups/TransactionSharingOptInDialog.tsx`
  - [ ] 9.2: Display per FR-25: "[Group Name] allows transaction sharing"
  - [ ] 9.3: Explain: "Would you like to share your transaction details..."
  - [ ] 9.4: Options: [Yes, share my transactions] [No, just statistics]
  - [ ] 9.5: Handle dismiss as "No" (privacy-first, per LV-6)
  - [ ] 9.6: Add unit tests for dialog

- [ ] **Task 10: Error Handling UI** (AC: #5, #13)
  - [ ] 10.1: Create `src/components/SharedGroups/InvitationErrorView.tsx`
  - [ ] 10.2: Display appropriate error message based on error type
  - [ ] 10.3: "This invite link is invalid or expired" for invalid format
  - [ ] 10.4: "This invitation has expired. Please ask for a new invite." for expired
  - [ ] 10.5: "This invitation was already used" for already processed
  - [ ] 10.6: Add "Back to Home" button
  - [ ] 10.7: Add unit tests for error states

- [ ] **Task 11: Firestore Security Rules** (AC: #2, #3)
  - [ ] 11.1: Add rule for updating invitation status (accept/decline)
  - [ ] 11.2: Allow: authenticated user AND (invited email matches OR share code accessed)
  - [ ] 11.3: Prevent: changing invitation to non-terminal status
  - [ ] 11.4: Add security rules tests

- [ ] **Task 12: User Group Preferences Document** (AC: #9, #10, #12)
  - [ ] 12.1: Create/update `/users/{userId}/preferences/sharedGroups` on accept
  - [ ] 12.2: Set `groupPreferences[groupId].shareMyTransactions` based on opt-in choice
  - [ ] 12.3: Initialize toggle tracking fields (`lastToggleAt`, `toggleCountToday`)
  - [ ] 12.4: Add security rules for preferences document
  - [ ] 12.5: Add unit tests for preferences creation

- [ ] **Task 13: Integration Tests** (AC: all)
  - [ ] 13.1: E2E test: Accept invitation via email (authenticated)
  - [ ] 13.2: E2E test: Accept invitation via deep link (authenticated)
  - [ ] 13.3: E2E test: Accept invitation via deep link (requires login)
  - [ ] 13.4: E2E test: Decline invitation
  - [ ] 13.5: E2E test: Invalid share code handling
  - [ ] 13.6: E2E test: Expired invitation handling
  - [ ] 13.7: E2E test: Transaction sharing opt-in flow
  - [ ] 13.8: E2E test: Verify group appears in View Mode Switcher

## Dev Notes

### Architecture Decisions (from Epic 14d-v2)

| Decision | Value | Rationale |
|----------|-------|-----------|
| **FR-25** | Join flow opt-in prompt | Clear consent when joining sharing-enabled group |
| **FR-26** | Invalid share codes display error | User-friendly error handling |
| **LV-6** | Default `shareMyTransactions: false` | Privacy-first approach |
| **LV-8** | Join flow opt-in prompt | Prompt on join for sharing-enabled groups |

### Data Flow: Accept Invitation

```
User clicks Accept
        │
        ├── Check group.transactionSharingEnabled
        │       │
        │       ├── TRUE → Show opt-in dialog
        │       │           │
        │       │           ├── "Yes, share" → shareMyTransactions: true
        │       │           │
        │       │           └── "No, statistics" OR dismiss → shareMyTransactions: false
        │       │
        │       └── FALSE → Skip opt-in (shareMyTransactions: false)
        │
        └── Execute Firestore transaction:
            1. Add user to group.members[]
            2. Create/update user preferences document
            3. Update invitation.status = 'accepted'
            4. Invalidate React Query cache for groups
```

### Deep Link Flow: `/join/{shareCode}`

```
User clicks link: https://gastify.app/join/aB3dEfGhIjKlMnOp
        │
        ├── App opens
        │       │
        │       ├── Authenticated?
        │       │       │
        │       │       ├── YES → Fetch invitation by shareCode
        │       │       │           │
        │       │       │           ├── Valid → Show AcceptInvitationDialog
        │       │       │           │
        │       │       │           └── Invalid → Show InvitationErrorView
        │       │       │
        │       │       └── NO → Store shareCode in localStorage
        │       │                       │
        │       │                       └── Redirect to login
        │       │                               │
        │       │                               └── After login: Check localStorage
        │       │                                       │
        │       │                                       └── shareCode found → Resume flow
        │
```

### PendingInvitation Status State Machine

```
pending ──┬──► accepted (terminal)
          │
          ├──► declined (terminal)
          │
          └──► expired (auto-set by TTL check, terminal)
```

### Error Messages (per FR-26)

| Error Type | User Message |
|------------|--------------|
| `INVALID_FORMAT` | "This invite link is invalid or expired" |
| `NOT_FOUND` | "This invite link is invalid or expired" |
| `EXPIRED` | "This invitation has expired. Please ask for a new invite." |
| `ALREADY_PROCESSED` | "This invitation was already used" |

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useDeepLinkInvitation.ts` | **NEW** | Deep link handler |
| `src/hooks/usePendingInvitationsCount.ts` | **NEW** | Badge count hook |
| `src/services/invitationService.ts` | MODIFY | Add accept/decline/query functions |
| `src/components/SharedGroups/PendingInvitationsView.tsx` | **NEW** | Invitations list |
| `src/components/SharedGroups/AcceptInvitationDialog.tsx` | **NEW** | Accept/decline dialog |
| `src/components/SharedGroups/TransactionSharingOptInDialog.tsx` | **NEW** | Opt-in prompt |
| `src/components/SharedGroups/InvitationErrorView.tsx` | **NEW** | Error display |
| `firestore.rules` | MODIFY | Add invitation update rules |
| `tests/unit/hooks/useDeepLinkInvitation.test.ts` | **NEW** | Hook tests |
| `tests/unit/services/invitationService.test.ts` | MODIFY | Add accept/decline tests |
| `tests/unit/components/SharedGroups/PendingInvitationsView.test.tsx` | **NEW** | Component tests |
| `tests/unit/components/SharedGroups/AcceptInvitationDialog.test.tsx` | **NEW** | Dialog tests |
| `tests/unit/components/SharedGroups/TransactionSharingOptInDialog.test.tsx` | **NEW** | Opt-in tests |

### UI Mockup Reference

**Pending Invitations List:**
```
┌────────────────────────────────────────┐
│ Pending Invitations                    │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ 🏠 Household                       │ │
│ │ Invited by Alice • 2 days ago     │ │
│ │ [Accept]  [Decline]               │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ 🏢 Office Lunch                    │ │
│ │ Invited by Bob • 5 days ago       │ │
│ │ [Accept]  [Decline]               │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**Accept Dialog (with opt-in):**
```
┌────────────────────────────────────────┐
│ Join "Household"?                      │
├────────────────────────────────────────┤
│ Alice invited you to join this group.  │
│                                        │
│ 🔐 "Household" allows transaction     │
│ sharing. Would you like to share your  │
│ transaction details with group members?│
│                                        │
│ Your spending totals will always be    │
│ visible in group statistics.           │
│                                        │
│ ○ Yes, share my transactions           │
│ ● No, just statistics (selected)       │
│                                        │
│ [Cancel]              [Join Group]     │
└────────────────────────────────────────┘
```

### Testing Standards

- **Unit tests:** 40+ tests covering services, hooks, and components
- **Security rules tests:** 15+ tests for all permission scenarios
- **E2E tests:** 8+ tests for complete user journeys
- **Coverage target:** 80%+ for new code

### Project Structure Notes

- Components: `src/components/SharedGroups/` directory
- Hooks: `src/hooks/` for React hooks
- Services: `src/services/` for Firestore operations
- Deep linking: Handled in `App.tsx` or dedicated routing component

### References

- [Epic 14d-v2 Requirements: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md#story-16-acceptdecline-group-invitation]
- [FR-25 (Join flow opt-in): epics.md line 84]
- [FR-26 (Invalid share codes): epics.md line 477]
- [LV-6 (Default shareMyTransactions: false): epics.md line 161]
- [LV-8 (Join flow opt-in prompt): epics.md line 163]
- [Story 1.5 (Invite Members): docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-5-invite-members.md]
- [Architecture Document: docs/architecture/epic-14d-requirements-and-concerns.md]

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis

### Affected Workflows

| Workflow | Impact |
|----------|--------|
| **Auth Critical Path** | Join/invitation handling requires authenticated user; deep linking must handle unauthenticated state |
| **Deep Link Flow** | Must handle `/join/{shareCode}` URLs from Story 1.5 - process invitation after login if needed |
| **Navigation Flow** | After accepting, navigate to newly joined group |
| **View Mode Switcher** | Newly joined groups must appear immediately in selector |
| **Push Notification Flow** | Badge indicator for pending invitations |

### Downstream Effects to Consider

- **Story 1.7 (Leave/Manage Group)** - Creates group membership that 1.7 will allow leaving
- **Story 1.10 (View Mode Switcher)** - Groups list populated after acceptance
- **Story 1.14 (Join Flow Opt-In)** - This story implements FR-25 opt-in prompt
- **Epic 2 (Sync)** - After joining, user can sync group transactions
- **Epic 4 (Notifications)** - Notifications sent after member joins

### Testing Implications

- **Existing tests to verify:** Auth flow tests, Firestore security rules tests
- **New scenarios to add:**
  - Deep link handling (authenticated and unauthenticated)
  - Accept invitation happy path
  - Decline invitation
  - Transaction sharing opt-in (yes/no/dismiss)
  - Invalid/expired share code handling
  - View Mode Switcher update after accept

### Workflow Chain Visualization

```
[Invite Members (1.5)] → [THIS STORY: Accept/Decline] → [Leave/Manage (1.7)]
                                    │
                                    ↓
                        [View Mode Switcher (1.10)]
                                    │
                                    ↓
                        [Tag Transactions (2.1)]
                                    │
                                    ↓
                        [Sync Group Transactions (2.3)]
```

### Dependency Graph

```
UPSTREAM (must be complete):
- Story 1.4: Create Shared Group (provides group structure)
- Story 1.5: Invite Members (provides PendingInvitation, share codes)
- Story 1.13: User Group Preferences Document (schema for shareMyTransactions)

DOWNSTREAM (depends on this):
- Story 1.7: Leave/Manage Group (user can leave after joining)
- Story 1.10: View Mode Switcher (shows joined groups)
- Story 1.14: Join Flow Transaction Sharing Opt-In (implemented IN this story per FR-25)
- Story 2.1: Tag Transaction to Group (requires group membership)
- Story 2.2: View Group Transactions (requires group membership)
- Epic 4.1: Push Notification Infrastructure (notifies group of new member)
```

## Dev Agent Record

### Agent Model Used

_To be filled during implementation_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled during implementation_

### File List

_To be filled during implementation_
