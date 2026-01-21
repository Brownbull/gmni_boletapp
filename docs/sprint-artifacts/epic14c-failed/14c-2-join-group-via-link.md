# Story 14c.2: Accept/Decline Invitation

Status: complete

## Story

As a user who was invited to a shared group by email,
I want to see my pending invitations and accept or decline them,
so that I can join groups my family/friends created.

## Acceptance Criteria

1. **AC1: Query Pending Invitations**
   - Given I am logged in
   - When I have pending invitations matching my email
   - Then the app queries `pendingInvitations` where `invitedEmail == user.email` and `status == 'pending'`
   - And results are ordered by `createdAt` descending

2. **AC2: Notification Badge on Alerts**
   - Given I have pending invitations
   - When the app loads
   - Then the Alerts nav icon shows a badge with the count
   - And the badge uses the existing notification badge pattern

3. **AC3: Navigate to Groups from Badge**
   - Given I tap the Alerts nav icon with pending invitations
   - When the notification relates to group invitations
   - Then I am navigated to Settings > Groups
   - And the pending invitations section is visible

4. **AC4: Pending Invitations Section**
   - Given I view Settings > Groups
   - When I have pending invitations
   - Then I see a "Pending Invitations" section at the top
   - And each invitation shows: group name, group color/icon, inviter name, expiry time
   - And each has "Accept" and "Decline" buttons

5. **AC5: Accept Invitation**
   - Given I tap "Accept" on a pending invitation
   - When the accept is processed
   - Then I am added to `group.members[]` array
   - And `groupId` is added to my `memberOfSharedGroups[]` profile field
   - And `group.memberUpdates[myUserId]` timestamp is set
   - And invitation `status` is updated to 'accepted'
   - And I see a success toast "Joined [Group Name]"

6. **AC6: Decline Invitation**
   - Given I tap "Decline" on a pending invitation
   - When the decline is processed
   - Then invitation `status` is updated to 'declined'
   - And the invitation is removed from the pending list
   - And I see a toast "Invitation declined"

7. **AC7: Expired Invitations**
   - Given an invitation has `expiresAt < now`
   - When I view my invitations
   - Then expired invitations are shown grayed out
   - And they show "Expired" label instead of buttons
   - And they can be dismissed

8. **AC8: Error States**
   - Given I try to accept an invitation
   - When the group is full (10 members)
   - Then I see "Group is full" error
   - When I'm already a member
   - Then I see "You're already a member" with link to view group
   - When the invitation expired
   - Then I see "This invitation has expired"

## Tasks / Subtasks

- [x] Task 1: Pending Invitations Query Hook (AC: #1)
  - [x] 1.1 Create `usePendingInvitations(userEmail)` hook
  - [x] 1.2 Query `pendingInvitations` collection with email filter
  - [x] 1.3 Use React Query for caching and real-time updates
  - [x] 1.4 Filter out expired/declined invitations client-side

- [x] Task 2: Notification Badge Integration (AC: #2, #3)
  - [x] 2.1 Add invitation count to Nav component badge
  - [x] 2.2 Merge with existing notification count if any
  - [x] 2.3 Handle tap to navigate to Settings > Groups

- [x] Task 3: Pending Invitations UI (AC: #4, #7)
  - [x] 3.1 Create `PendingInvitationsSection.tsx` component
  - [x] 3.2 Display invitation cards with group info
  - [x] 3.3 Show inviter name and time remaining
  - [x] 3.4 Style expired invitations differently
  - [x] 3.5 Integrate into GruposView.tsx

- [x] Task 4: Accept Invitation Logic (AC: #5, #8)
  - [x] 4.1 Create `acceptInvitation(db, userId, invitationId)` service function
  - [x] 4.2 Use batch write: add to members[], update profile, update invitation status
  - [x] 4.3 Handle error cases: group full, already member, expired
  - [x] 4.4 Show success toast on completion

- [x] Task 5: Decline Invitation Logic (AC: #6)
  - [x] 5.1 Create `declineInvitation(db, invitationId)` service function
  - [x] 5.2 Update invitation status to 'declined'
  - [x] 5.3 Show confirmation toast

- [x] Task 6: Component Tests
  - [x] 6.1 Test pending invitations display correctly
  - [x] 6.2 Test accept flow updates Firestore correctly
  - [x] 6.3 Test decline flow updates status
  - [x] 6.4 Test expired invitations shown grayed out
  - [x] 6.5 Test error states render correctly

## Dev Notes

### Architecture Context

**Pivot from Link-based to Email-based (2026-01-15):**
- Original story used deep links (`/join/{shareCode}`) requiring URL handling
- New approach uses email-based invitations stored in Firestore
- Much simpler: all happens in-app, no URL parsing or sessionStorage needed
- User must already have an account with matching email

### Data Model

```typescript
// pendingInvitations/{invitationId}
interface PendingInvitation {
  id: string;
  groupId: string;
  groupName: string;         // Denormalized
  groupColor: string;        // Denormalized
  groupIcon?: string;        // Denormalized
  invitedEmail: string;      // Lowercase, matched against user.email
  invitedByUserId: string;
  invitedByName: string;     // Denormalized
  createdAt: Timestamp;
  expiresAt: Timestamp;      // 7 days
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}
```

### Query Strategy

```typescript
// Query pending invitations for current user
const q = query(
  collection(db, 'pendingInvitations'),
  where('invitedEmail', '==', user.email?.toLowerCase()),
  where('status', '==', 'pending'),
  orderBy('createdAt', 'desc'),
  limit(20)
);
```

### Accept Flow

```typescript
async function acceptInvitation(db, userId, appId, invitation) {
  const batch = writeBatch(db);

  // 1. Add user to group members
  const groupRef = doc(db, 'sharedGroups', invitation.groupId);
  batch.update(groupRef, {
    members: arrayUnion(userId),
    [`memberUpdates.${userId}`]: serverTimestamp(),
  });

  // 2. Update user profile
  const profileRef = doc(db, `artifacts/${appId}/users/${userId}/preferences/settings`);
  batch.update(profileRef, {
    memberOfSharedGroups: arrayUnion(invitation.groupId),
  });

  // 3. Mark invitation as accepted
  const inviteRef = doc(db, 'pendingInvitations', invitation.id);
  batch.update(inviteRef, {
    status: 'accepted',
  });

  await batch.commit();
}
```

### Security Rules for pendingInvitations

```javascript
match /pendingInvitations/{invitationId} {
  // Anyone authenticated can read invitations addressed to their email
  allow read: if request.auth != null
    && resource.data.invitedEmail == request.auth.token.email;

  // Group owner can create invitations
  allow create: if request.auth != null;

  // Invited user can update status (accept/decline)
  allow update: if request.auth != null
    && resource.data.invitedEmail == request.auth.token.email
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status']);
}
```

### UX Reference

**Mockup**: `docs/uxui/mockups/01_views/shared-groups.html`
- **Groups (Filled)** state shows pending invitations section

### Invitation Card Design

```
┌────────────────────────────────────────────┐
│  [🏠]  Familia Martinez                    │
│        Invited by Gabriel                  │
│        Expires in 5 days                   │
│                                            │
│        [Decline]  [Accept]                 │
└────────────────────────────────────────────┘
```

### References

- [Epic 14C Architecture]: docs/sprint-artifacts/epic14/epic-14c-household-sharing.md
- [Story 14c.1 - Invitation Creation]: docs/sprint-artifacts/epic14c/14c-1-create-shared-group.md
- [UX Mockup]: docs/uxui/mockups/01_views/shared-groups.html

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Completion Notes List

1. **Task 1: usePendingInvitations hook** - Created hook that queries pendingInvitations collection by user email with React Query caching and real-time subscription
2. **Task 2: Notification Badge** - Added `alertsBadgeCount` prop to Nav component with badge display on Alerts icon
3. **Task 3: PendingInvitationsSection** - Created full UI component with invitation cards showing group info, inviter, expiry, and accept/decline buttons
4. **Task 4: Accept Invitation** - Implemented `acceptInvitation()` in sharedGroupService using batch write to atomically update group members, user profile, and invitation status
5. **Task 5: Decline Invitation** - Implemented `declineInvitation()` service function
6. **Task 6: Tests** - Created unit tests for hook (11 tests passing), component tests (26 tests passing), updated integration test setup with pendingInvitations rules

### Code Review Fixes (2026-01-15)

- **M1 Fixed**: Added missing PendingInvitationsSection component tests (26 tests)
- **M2 Fixed**: Removed redundant useMemo wrapper in usePendingInvitations hook
- **L3 Fixed**: Added Firestore composite indexes for pendingInvitations and sharedGroups queries

### File List

**New Files:**
- `src/hooks/usePendingInvitations.ts` - Hook for subscribing to pending invitations
- `src/components/SharedGroups/PendingInvitationsSection.tsx` - UI component for pending invitations
- `tests/unit/hooks/usePendingInvitations.test.ts` - Unit tests for hook (11 tests)
- `tests/unit/components/SharedGroups/PendingInvitationsSection.test.tsx` - Component tests (26 tests)
- `firestore.indexes.json` - Composite indexes for pendingInvitations and sharedGroups queries

**Modified Files:**
- `src/types/sharedGroup.ts` - Added PendingInvitation type and helper functions
- `src/services/sharedGroupService.ts` - Added acceptInvitation, declineInvitation, createPendingInvitation functions
- `src/components/Nav.tsx` - Added alertsBadgeCount prop for notification badge
- `src/components/settings/subviews/GruposView.tsx` - Integrated PendingInvitationsSection
- `src/views/SettingsView.tsx` - Pass userEmail to GruposView
- `src/App.tsx` - Added usePendingInvitations hook and PendingInvitationsSection to alerts view
- `src/utils/translations.ts` - Added translations for invitation-related UI (en + es)
- `firestore.rules` - Added pendingInvitations security rules and isJoiningGroup rule for sharedGroups
- `firebase.json` - Added reference to firestore.indexes.json
- `tests/setup/firebase-emulator.ts` - Added pendingInvitations rules and getAuthedFirestoreWithEmail helper
- `tests/integration/shared-groups-rules.test.ts` - Added JOIN GROUP and pendingInvitations security tests

