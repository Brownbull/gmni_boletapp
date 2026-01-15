# Story 14c.3: Leave/Manage Group

Status: ready-for-dev

## Story

As a group member,
I want to leave a shared group or manage its members,
so that I can control my participation and my transactions' visibility.

## Acceptance Criteria

1. **AC1: Leave Group Button**
   - Given I am a member of a shared group (not owner)
   - When I view the group in Settings > Custom Groups
   - Then I see a "Leave Group" button
   - And tapping it opens a confirmation dialog

2. **AC2: Soft Leave Option**
   - Given I choose to leave a group
   - When the leave dialog appears
   - Then I see option "Keep transactions shared" (soft leave)
   - And selecting this removes me from `members[]`
   - And my transactions remain tagged with `sharedGroupIds[]` (read-only to others)
   - And I lose access to view group transactions

3. **AC3: Hard Leave Option**
   - Given I choose to leave a group
   - When the leave dialog appears
   - Then I see option "Remove my transactions" (hard leave)
   - And selecting this removes me from `members[]`
   - And removes the `groupId` from all my transactions' `sharedGroupIds[]`
   - And my transactions become private again

4. **AC4: Owner Leaving Requirement**
   - Given I am the owner of a shared group
   - When I try to leave
   - Then I see a warning that I must transfer ownership first
   - Or I can delete the entire group
   - And I cannot leave while remaining owner

5. **AC5: Ownership Transfer**
   - Given I am the group owner
   - When I view group management
   - Then I see a list of members
   - And I can tap a member to "Transfer Ownership"
   - And confirming updates `ownerId` to the selected member
   - And I become a regular member

6. **AC6: Owner Can Remove Members**
   - Given I am the group owner
   - When I view the members list
   - Then I see a "Remove" option next to each member (except myself)
   - And removing a member performs a soft leave for them
   - And they lose group access but transactions stay shared

7. **AC7: Confirmation Dialogs**
   - Given any destructive action (leave, remove, transfer, delete)
   - When the action is triggered
   - Then a confirmation dialog shows consequences
   - And "Soft leave: Others can still see your transactions"
   - And "Hard leave: Your transactions become private"
   - And "Remove member: They lose access but transactions stay"
   - And "Delete group: All members lose access"

8. **AC8: Profile Update on Leave**
   - Given I leave a group (soft or hard)
   - When the leave is processed
   - Then `groupId` is removed from my `memberOfSharedGroups[]` profile field
   - And I can no longer read the group document
   - And security rules block my access

## Tasks / Subtasks

- [ ] Task 1: Leave Group Service Functions (AC: #2, #3, #8)
  - [ ] 1.1 Implement `leaveGroupSoft(db, userId, appId, groupId)` - removes from members, keeps transactions
  - [ ] 1.2 Implement `leaveGroupHard(db, userId, appId, groupId)` - removes from members + untags transactions
  - [ ] 1.3 Update user profile `memberOfSharedGroups` on leave
  - [ ] 1.4 Use batch writes for atomic operations
  - [ ] 1.5 Handle error cases (not a member, already left)

- [ ] Task 2: Ownership Management Functions (AC: #4, #5)
  - [ ] 2.1 Implement `transferOwnership(db, currentOwnerId, newOwnerId, groupId)`
  - [ ] 2.2 Validate current user is owner before transfer
  - [ ] 2.3 Update `ownerId` field on group document
  - [ ] 2.4 Block owner from leaving without transfer

- [ ] Task 3: Member Removal Functions (AC: #6)
  - [ ] 3.1 Implement `removeMember(db, ownerId, memberId, groupId)`
  - [ ] 3.2 Validate requester is owner
  - [ ] 3.3 Perform soft leave for removed member
  - [ ] 3.4 Update removed user's profile

- [ ] Task 4: Leave Group UI (AC: #1, #7)
  - [ ] 4.1 Add "Leave Group" button to group detail view (non-owners)
  - [ ] 4.2 Create `LeaveGroupDialog.tsx` with soft/hard options
  - [ ] 4.3 Show consequence explanation for each option
  - [ ] 4.4 Add loading state during leave operation
  - [ ] 4.5 Navigate away from group after successful leave

- [ ] Task 5: Group Management UI (AC: #4, #5, #6)
  - [ ] 5.1 Create `GroupMembersManager.tsx` - list view with actions
  - [ ] 5.2 Add "Transfer Ownership" option per member (owner only)
  - [ ] 5.3 Add "Remove" option per member (owner only)
  - [ ] 5.4 Create `TransferOwnershipDialog.tsx`
  - [ ] 5.5 Create `RemoveMemberDialog.tsx`
  - [ ] 5.6 Show owner badge on current owner

- [ ] Task 6: Delete Group Functionality (AC: #4)
  - [ ] 6.1 Implement `deleteSharedGroup(db, ownerId, groupId)`
  - [ ] 6.2 Remove groupId from all members' profiles
  - [ ] 6.3 Optionally untag all transactions (or leave tagged for history)
  - [ ] 6.4 Create `DeleteGroupDialog.tsx` with confirmation
  - [ ] 6.5 Navigate to personal view after deletion

- [ ] Task 7: i18n Translations
  - [ ] 7.1 Add all dialog strings in English and Spanish
  - [ ] 7.2 Include consequence explanations
  - [ ] 7.3 Add error messages

- [ ] Task 8: Component Tests
  - [ ] 8.1 Test soft leave removes from members but keeps transactions
  - [ ] 8.2 Test hard leave removes from members and untags transactions
  - [ ] 8.3 Test ownership transfer updates ownerId
  - [ ] 8.4 Test owner cannot leave without transfer
  - [ ] 8.5 Test member removal (owner only)

## Dev Notes

### Architecture Context

**Leave Modes Decision:** From brainstorming session
- **Soft Leave:** User loses access, but their transactions remain visible to group
- **Hard Leave:** User loses access AND their transactions are removed from group view
- This gives users control over their data after leaving

**Transaction Update Strategy for Hard Leave:**
```typescript
// Query all user's transactions with this groupId
const txQuery = query(
  collection(db, `artifacts/${appId}/users/${userId}/transactions`),
  where('sharedGroupIds', 'array-contains', groupId)
);

// Batch update to remove groupId from each
const batch = writeBatch(db);
snapshot.forEach(doc => {
  batch.update(doc.ref, {
    sharedGroupIds: arrayRemove(groupId)
  });
});
await batch.commit();
```

### Existing Code to Leverage

**Group Service Patterns:** `src/services/groupService.ts`
- `deleteGroup()` - pattern for group deletion
- `updateGroup()` - pattern for group updates
- Batch write patterns

**Dialog Patterns:** `src/components/dialogs/`
- `ConfirmDialog.tsx` - basic confirmation pattern
- `LearnMerchantDialog.tsx` - dialog with options pattern

### Project Structure Notes

**New files to create:**
```
src/
├── components/
│   └── dialogs/
│       ├── LeaveGroupDialog.tsx        # Soft/hard leave options
│       ├── TransferOwnershipDialog.tsx # Ownership transfer
│       ├── RemoveMemberDialog.tsx      # Owner removes member
│       └── DeleteGroupDialog.tsx       # Delete entire group
│   └── shared-groups/
│       └── GroupMembersManager.tsx     # Members list + actions
```

**Files to modify:**
```
src/services/sharedGroupService.ts    # Add leave/transfer/remove functions
src/components/views/SettingsView.tsx # Integration point for group management
```

### Leave Flow State Diagram

```
┌─────────────────┐
│  Leave Button   │
│    Clicked      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Is User Owner? │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐  ┌────────────────────┐
│  No   │  │       Yes          │
└───┬───┘  └─────────┬──────────┘
    │                │
    ▼                ▼
┌───────────┐   ┌──────────────────┐
│  Leave    │   │ Must Transfer    │
│  Dialog   │   │ Ownership or     │
│ (Options) │   │ Delete Group     │
└─────┬─────┘   └────────┬─────────┘
      │                  │
      ▼                  ▼
┌────────────────┐  ┌──────────────┐
│ Soft or Hard?  │  │ Transfer or  │
└───────┬────────┘  │ Delete?      │
        │           └──────┬───────┘
   ┌────┴────┐            │
   │         │       ┌────┴────┐
   ▼         ▼       │         │
┌──────┐ ┌──────┐    ▼         ▼
│ Soft │ │ Hard │ ┌────────┐ ┌────────┐
└──┬───┘ └──┬───┘ │Transfer│ │ Delete │
   │        │     └───┬────┘ └───┬────┘
   │        │         │          │
   ▼        ▼         ▼          ▼
┌──────────────────────────────────────┐
│         Process & Navigate           │
└──────────────────────────────────────┘
```

### Batch Write Example

```typescript
// Hard leave - atomic batch
export async function leaveGroupHard(
  db: Firestore,
  userId: string,
  appId: string,
  groupId: string
): Promise<void> {
  const batch = writeBatch(db);

  // 1. Remove from group members
  const groupRef = doc(db, 'sharedGroups', groupId);
  batch.update(groupRef, {
    members: arrayRemove(userId),
    [`memberUpdates.${userId}`]: deleteField(),
  });

  // 2. Update user profile
  const profileRef = doc(db, `artifacts/${appId}/users/${userId}`);
  batch.update(profileRef, {
    memberOfSharedGroups: arrayRemove(groupId),
  });

  await batch.commit();

  // 3. Untag transactions (separate operation - could be many)
  await untagUserTransactions(db, userId, appId, groupId);
}
```

### Security Considerations

**Owner-only Operations:**
- Transfer ownership
- Remove members
- Delete group

Security rules should enforce owner check for update/delete operations.

**Member Removal Side Effects:**
- Removed member loses read access immediately
- Their cached data should be cleared client-side
- Other members' view of their transactions remains (soft remove)

### UX Copy for Dialogs

**Leave Group (Non-owner):**
```
"Leave [Group Name]?"

○ Keep transactions shared
  Others can still see your past transactions

○ Remove my transactions
  Your transactions become private again

[Cancel] [Leave Group]
```

**Owner Leave Warning:**
```
"You're the owner of this group"

As owner, you must either:
• Transfer ownership to another member
• Delete the group entirely

[Manage Members] [Delete Group]
```

### References

- [Epic 14C Architecture]: docs/sprint-artifacts/epic14/epic-14c-household-sharing.md
- [Brainstorming - Leave Modes]: docs/analysis/brainstorming-session-2026-01-15.md#category-1-data-sync-edge-cases
- [Brainstorming - Owner Leaving]: docs/analysis/brainstorming-session-2026-01-15.md#category-2-membership-access
- [Firestore arrayRemove]: https://firebase.google.com/docs/firestore/manage-data/add-data#update_elements_in_an_array

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Completion Notes List

### File List

