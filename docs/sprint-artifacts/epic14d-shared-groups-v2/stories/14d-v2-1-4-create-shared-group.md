# Story 14d-v2.1.4: Create Shared Group

Status: split

> **SPLIT 2026-02-01:** This story exceeded sizing limits and was split into 4 sub-stories.
> See: 14d-v2-1-4a, 14d-v2-1-4b, 14d-v2-1-4c, 14d-v2-1-4d
>
> **Original Metrics:** 8 tasks, 42 subtasks, 8 files (TOO_LARGE)
> **Split Strategy:** by_layer (Architectural Layer)
>
> | Sub-Story | Description | Sizing |
> |-----------|-------------|--------|
> | 14d-v2-1-4a | Types & Security Rules | MEDIUM (2 tasks, 11 subtasks) |
> | 14d-v2-1-4b | Service & Hook Layer | MEDIUM (2 tasks, 12 subtasks) |
> | 14d-v2-1-4c | UI Components | LARGE (3 tasks, 15 subtasks) |
> | 14d-v2-1-4d | Integration Testing | SMALL (1 task, 4 subtasks) |

## Story

As a **user**,
I want **to create a new shared expense group**,
So that **I can share expenses with family, roommates, or friends**.

## Acceptance Criteria

### Core Requirements (from Epic)

1. **Given** I am logged in
   **When** I tap "Create Group" and enter a name
   **Then** I see a creation flow that includes:
   - Group name input (required)
   - **Transaction sharing prompt**: "Would you like to allow transaction sharing in this group?" with options:
     - [Yes, allow sharing] (Recommended) - sets `transactionSharingEnabled: true`
     - [No, statistics only] - sets `transactionSharingEnabled: false`
   - Helper text explaining: "When enabled, members can choose to share their transaction details. Statistics are always shared."

2. **Given** I complete group creation
   **When** the group is created
   **Then** a new group document is created with:
   - `id`: Auto-generated unique ID
   - `name`: Name I provided
   - `ownerId`: My user ID
   - `members`: Array containing my user object
   - `createdAt`: Server timestamp
   - `timezone`: My device timezone (IANA format, e.g., "America/Santiago")
   - `transactionSharingEnabled`: Based on my selection (default recommendation: true)
   - `transactionSharingLastToggleAt`: null (never toggled)
   - `transactionSharingToggleCountToday`: 0

3. **Given** the group is created successfully
   **When** I return to the app
   **Then** I see the group in my groups list
   **And** I can select it in the View Mode Switcher

4. **Given** I already have 5 groups (as owner or member)
   **When** I try to create another group
   **Then** I see an error message: "You've reached the maximum of 5 groups"
   **And** I cannot proceed with creation (BC-1 enforcement)

### Atlas-Suggested Additional Criteria

5. **Given** the group name input
   **When** I enter a name
   **Then** validation enforces:
   - Minimum length: 2 characters
   - Maximum length: 50 characters
   - Trimmed of leading/trailing whitespace
   - Error displayed for invalid names

6. **Given** I complete group creation
   **When** the creation succeeds
   **Then** I see a success toast: "Group '[name]' created!"
   **And** I am automatically navigated to the newly created group view

7. **Given** group creation fails (network error)
   **When** the error occurs
   **Then** I see an error toast with retry option
   **And** my input is preserved for retry

8. **Given** I am in the group creation flow
   **When** I tap outside the dialog or press back
   **Then** I am prompted if I have unsaved changes: "Discard group creation?"
   **And** I can choose to continue or discard

## Tasks / Subtasks

- [ ] **Task 1: Define SharedGroup Type** (AC: #2)
  - [ ] 1.1: Create `src/types/sharedGroup.ts` (or update if exists from 14c cleanup)
  - [ ] 1.2: Define `SharedGroup` interface with all required fields
  - [ ] 1.3: Define `SharedGroupMember` interface
  - [ ] 1.4: Add JSDoc comments explaining each field's purpose
  - [ ] 1.5: Export types from `src/types/index.ts`

- [ ] **Task 2: Create Firestore Security Rules** (AC: #2, #4)
  - [ ] 2.1: Add `/groups/{groupId}` collection rules
  - [ ] 2.2: Allow read: only group members
  - [ ] 2.3: Allow create: authenticated users (with BC-1 validation)
  - [ ] 2.4: Allow update: owner only (for group settings)
  - [ ] 2.5: Allow delete: owner only
  - [ ] 2.6: Add unit tests for security rules

- [ ] **Task 3: Create Group Service** (AC: #2, #4)
  - [ ] 3.1: Create `src/services/groupService.ts`
  - [ ] 3.2: Implement `createGroup(name, transactionSharingEnabled): Promise<SharedGroup>`
  - [ ] 3.3: Implement `getUserGroups(): Promise<SharedGroup[]>`
  - [ ] 3.4: Implement `getGroupCount(): Promise<number>` for BC-1 check
  - [ ] 3.5: Add timezone detection using `Intl.DateTimeFormat().resolvedOptions().timeZone`
  - [ ] 3.6: Add unit tests for service functions

- [ ] **Task 4: Create useGroups Hook** (AC: #3)
  - [ ] 4.1: Create `src/hooks/useGroups.ts`
  - [ ] 4.2: Implement React Query integration for group fetching
  - [ ] 4.3: Implement `useCreateGroup()` mutation
  - [ ] 4.4: Implement optimistic updates for immediate UI feedback
  - [ ] 4.5: Add cache invalidation on create
  - [ ] 4.6: Add unit tests for hook

- [ ] **Task 5: Create Group Creation Dialog UI** (AC: #1, #5, #6, #7, #8)
  - [ ] 5.1: Create `src/components/SharedGroups/CreateGroupDialog.tsx`
  - [ ] 5.2: Implement group name input with validation
  - [ ] 5.3: Implement transaction sharing toggle with helper text
  - [ ] 5.4: Add loading state during creation
  - [ ] 5.5: Add success/error toast notifications
  - [ ] 5.6: Add discard confirmation dialog
  - [ ] 5.7: Implement navigation to new group on success
  - [ ] 5.8: Add unit tests for dialog component

- [ ] **Task 6: Add Entry Point** (AC: #1)
  - [ ] 6.1: Add "Create Group" button to Settings view or header menu
  - [ ] 6.2: Wire up dialog open/close state
  - [ ] 6.3: Consider FAB long-press option (future enhancement)

- [ ] **Task 7: BC-1 Limit Enforcement** (AC: #4)
  - [ ] 7.1: Query user's group count before showing create option
  - [ ] 7.2: Disable button if limit reached
  - [ ] 7.3: Show tooltip explaining limit when disabled
  - [ ] 7.4: Double-check in service layer before creation (defense in depth)

- [ ] **Task 8: Integration Testing** (AC: all)
  - [ ] 8.1: E2E test for happy path group creation
  - [ ] 8.2: E2E test for BC-1 limit enforcement
  - [ ] 8.3: Unit tests for all validation scenarios
  - [ ] 8.4: Verify group appears in View Mode Switcher after creation

## Dev Notes

### Architecture Decisions (from Epic 14d-v2)

| Decision | Value | Rationale |
|----------|-------|-----------|
| **BC-1** | Max 5 groups per user | Prevents abuse, controls complexity |
| **BC-2** | Max 10 contributors per group | Firestore query limits |
| **BC-3** | Max 200 viewers per group | Read scalability |
| **AD-6** | Group-level timezone | Analytics consistency |
| **LV-1** | Stats always include all members | Core value proposition |
| **FR-19** | Owner controls group transaction sharing | Privacy control |

### SharedGroup Type Definition

```typescript
export interface SharedGroup {
  id: string;
  name: string;
  ownerId: string;
  members: SharedGroupMember[];
  createdAt: Timestamp;
  timezone: string;  // IANA format (e.g., "America/Santiago")

  // Transaction sharing controls (Layered Visibility Model)
  transactionSharingEnabled: boolean;
  transactionSharingLastToggleAt: Timestamp | null;
  transactionSharingToggleCountToday: number;

  // Optional fields
  shareCode?: string;  // For invite links (Story 1.5)
  shareCodeCreatedAt?: Timestamp;
}

export interface SharedGroupMember {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'owner' | 'member';
  joinedAt: Timestamp;
}
```

### Firestore Collection Structure

```
/groups/{groupId}
  ├── id: string
  ├── name: string
  ├── ownerId: string
  ├── members: SharedGroupMember[]
  ├── createdAt: Timestamp
  ├── timezone: string
  ├── transactionSharingEnabled: boolean
  ├── transactionSharingLastToggleAt: Timestamp | null
  ├── transactionSharingToggleCountToday: number
  └── (future: shareCode, analytics subcollection, changelog subcollection)
```

### Security Rules Pattern

```javascript
match /groups/{groupId} {
  // Helper functions
  function isGroupMember() {
    return request.auth != null &&
           request.auth.uid in resource.data.members.map(m => m.id);
  }

  function isGroupOwner() {
    return request.auth != null &&
           request.auth.uid == resource.data.ownerId;
  }

  function getUserGroupCount() {
    // Note: Firestore rules can't count across collections
    // BC-1 enforcement must be done in Cloud Function or client-side
    return true;
  }

  allow read: if isGroupMember();
  allow create: if request.auth != null;
  allow update: if isGroupOwner();
  allow delete: if isGroupOwner();
}
```

### BC-1 Enforcement Strategy

Since Firestore security rules cannot count documents across collections, BC-1 must be enforced:
1. **Client-side:** Query user's groups before showing create option
2. **Server-side (optional):** Cloud Function to validate before write
3. **Defense in depth:** Both layers for security

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/types/sharedGroup.ts` | CREATE | Type definitions |
| `src/services/groupService.ts` | CREATE | Group CRUD operations |
| `src/hooks/useGroups.ts` | CREATE | React Query hook |
| `src/components/SharedGroups/CreateGroupDialog.tsx` | CREATE | Creation UI |
| `firestore.rules` | MODIFY | Add group collection rules |
| `tests/unit/services/groupService.test.ts` | CREATE | Service tests |
| `tests/unit/hooks/useGroups.test.ts` | CREATE | Hook tests |
| `tests/unit/components/SharedGroups/CreateGroupDialog.test.tsx` | CREATE | UI tests |

### UI Design Notes

**Create Group Dialog:**
- Modal dialog (not full screen)
- Step 1: Group name input with character counter
- Step 2: Transaction sharing toggle with explanation
- Buttons: [Cancel] [Create Group]
- Loading spinner during creation
- Success: Auto-close + navigate to group

**Transaction Sharing Explanation:**
```
"When enabled, members can choose to share their individual
transaction details with the group. Statistics (totals,
breakdowns by category and member) are always shared
regardless of this setting."
```

### Testing Standards

- **Unit tests:** 80%+ coverage for new code
- **Service tests:** Mock Firestore operations
- **Hook tests:** Mock service layer
- **Component tests:** React Testing Library
- **E2E tests:** Playwright for critical paths

### References

- [Epic 14d-v2 Requirements: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md#story-14]
- [Layered Visibility Model: epics.md lines 23-48]
- [BC-1 Constraint: epics.md line 104]
- [FR-19 Requirement: epics.md line 69]
- [View Mode Switcher: Story 1.10 in epics.md]

## Atlas Workflow Analysis

> This section was generated by Atlas workflow chain analysis

### Affected Workflows

| Workflow | Impact |
|----------|--------|
| **Settings Flow** | New "Create Group" entry point needed |
| **Navigation Flow** | Navigate to new group after creation |
| **View Mode Switcher** | Groups list populated from created groups |
| **Future: Analytics (#4)** | Group analytics will depend on group existence |

### Downstream Effects to Consider

- Story 1.5 (Invite Members) - depends on group existence for invitations
- Story 1.10 (View Mode Switcher) - needs groups to display in selector
- Story 1.11 (Transaction Sharing Toggle) - requires group owner permissions
- Story 2.1 (Tag Transactions) - requires groups to exist for selection
- Future analytics workflows will filter by `sharedGroupId`

### Testing Implications

- **Existing tests to verify:** N/A (new feature)
- **New scenarios to add:**
  - Create group happy path
  - BC-1 limit enforcement (5 groups max)
  - Timezone detection accuracy
  - Transaction sharing toggle state
  - Validation edge cases

### Workflow Chain Visualization

```
[Transaction Type Migration] → [Changelog Infrastructure] → [THIS STORY]
                                                                ↓
                                                     [Invite Members]
                                                                ↓
                                               [Accept/Decline Invitation]
                                                                ↓
                                                    [View Mode Switcher]
                                                                ↓
                                                    [Tag Transactions]
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
