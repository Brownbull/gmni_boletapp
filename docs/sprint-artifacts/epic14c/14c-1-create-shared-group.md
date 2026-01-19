# Story 14c.1: Create Shared Group

Status: ready-for-deploy

## Story

As a user with custom groups,
I want to make one of my groups shareable,
so that family/friends can see and add transactions to it.

## Acceptance Criteria

1. **AC1: sharedGroups Firestore Collection**
   - Given I am a user with custom groups
   - When a shared group is created
   - Then a new document exists in `sharedGroups/{groupId}` collection (top-level, NOT under user path)
   - And the document contains: `id`, `ownerId`, `name`, `color`, `icon`, `shareCode`, `shareCodeExpiresAt`, `members[]`, `memberUpdates{}`, `createdAt`, `updatedAt`

2. **AC2: Transaction Model Extension**
   - Given the Transaction type in `src/types/transaction.ts`
   - When I update the type
   - Then `sharedGroupIds?: string[]` field is added (max 5 groups per transaction)
   - And `deletedAt?: Timestamp` field is added (for soft delete support)

3. **AC3: User Profile Extension**
   - Given a user's Firestore profile document
   - When they join a shared group
   - Then `memberOfSharedGroups: string[]` field exists on their profile
   - And this field is used by security rules for cross-user transaction reads

4. **AC4: Make Shareable UI**
   - Given I am viewing Settings > Custom Groups
   - When I tap a custom group
   - Then I see a "Make Shareable" button/option
   - And tapping it creates a SharedGroup from my custom group data

5. **AC5: Share Code Generation**
   - Given I convert a group to shareable
   - When the SharedGroup is created
   - Then a 16-character nanoid is generated as `shareCode`
   - And `shareCodeExpiresAt` is set to 7 days from now

6. **AC6: Share Code Display (Optional Fallback)**
   - Given I have created a shared group
   - When I view the group details
   - Then I see the share code displayed (secondary option)
   - And I can tap to copy to clipboard
   - And I can share via native share sheet

7. **AC7: Invite by Email (Primary Method)**
   - Given I have created a shared group
   - When I tap "Invite Member"
   - Then I see an email input dialog
   - And I can enter an email address
   - And tapping "Send Invite" creates a `PendingInvitation` document
   - And I see a success toast "Invitation sent"

8. **AC8: Pending Invitations Collection**
   - Given I send an email invitation
   - When the invitation is created
   - Then a document is created in `pendingInvitations/{invitationId}`
   - And it contains: `groupId`, `groupName`, `invitedEmail`, `invitedByUserId`, `invitedByName`, `expiresAt`, `status`
   - And `expiresAt` is set to 7 days from now
   - And `status` is set to 'pending'

9. **AC9: User Not Found Validation**
   - Given I enter an email to invite
   - When I tap "Send Invite"
   - Then the system checks if a user with that email exists
   - If not found, show error: "No user found with this email. They must sign up first."

10. **AC10: Security Rules - Members Read, Owner Write**
   - Given a SharedGroup document
   - When a member tries to read
   - Then they can read if their userId is in `members[]` array
   - When a non-member tries to read
   - Then they are denied
   - When the owner tries to update/delete
   - Then they can do so
   - When a non-owner member tries to update
   - Then they are denied

11. **AC11: Firebase Emulator Tests**
   - Given the new security rules
   - When I run `firebase emulators:exec --only firestore 'npm test:rules'`
   - Then all security rule tests pass
   - And tests cover: member read, non-member denied, owner write, non-owner denied

## Tasks / Subtasks

- [x] Task 1: Create SharedGroup TypeScript types (AC: #1, #2, #3)
  - [x] 1.1 Create `src/types/sharedGroup.ts` with `SharedGroup` interface
  - [x] 1.2 Add `sharedGroupIds?: string[]` to Transaction type
  - [x] 1.3 Add `deletedAt?: Timestamp` to Transaction type
  - [x] 1.4 Create `SHARED_GROUP_LIMITS` constants in `src/config/constants.ts`

- [x] Task 2: Create sharedGroupService (AC: #1, #5, #7)
  - [x] 2.1 Create `src/services/sharedGroupService.ts`
  - [x] 2.2 Implement `createSharedGroup(db, userId, appId, customGroup)` - converts custom group to shared
  - [x] 2.3 Implement `generateShareCode()` - 16-char nanoid
  - [x] 2.4 Implement `regenerateShareCode(db, groupId)` - owner only
  - [x] 2.5 Implement `getSharedGroupByShareCode(db, shareCode)` - for join flow
  - [x] 2.6 Implement `subscribeToSharedGroup(db, groupId, onUpdate)` - real-time listener
  - [x] 2.7 Install `nanoid` package: `npm install nanoid`

- [x] Task 3: Update Firestore Security Rules (AC: #8)
  - [x] 3.1 Add `/sharedGroups/{groupId}` rules to `firestore.rules`
  - [x] 3.2 Add helper function `isSharedGroupMember(groupId)`
  - [x] 3.3 Add helper function `isSharedGroupOwner(groupId)`
  - [x] 3.4 Allow member read via `members` array check
  - [x] 3.5 Allow owner write/delete

- [x] Task 4: Create "Make Shareable" UI (AC: #4, #6)
  - [x] 4.1 Add "Make Shareable" button to group detail view in Settings (`GruposView.tsx`)
  - [x] 4.2 Create `MakeShareableDialog.tsx` - confirmation before converting
  - [x] 4.3 Create `ShareCodeDisplay.tsx` - shows code + copy + share buttons
  - [x] 4.4 Integrate with native Web Share API for share sheet
  - [x] 4.5 UI uses inline Spanish/English strings (consistent with codebase pattern)

- [x] Task 5: Firebase Emulator Security Rule Tests (AC: #11)
  - [x] 5.1 Create `tests/integration/shared-groups-rules.test.ts`
  - [x] 5.2 Test: member can read shared group
  - [x] 5.3 Test: non-member cannot read shared group
  - [x] 5.4 Test: owner can update shared group
  - [x] 5.5 Test: non-owner cannot update shared group
  - [x] 5.6 Test: owner can delete shared group
  - [x] 5.7 Updated `tests/setup/firebase-emulator.ts` with shared groups rules

- [ ] Task 6: Email Invitation System (AC: #7, #8, #9) **NEW**
  - [ ] 6.1 Create `PendingInvitation` type in `src/types/sharedGroup.ts`
  - [ ] 6.2 Add `sendInvitation(db, groupId, inviterUserId, inviteeEmail)` to sharedGroupService
  - [ ] 6.3 Add `checkUserExistsByEmail(db, email)` helper function
  - [ ] 6.4 Create `InviteMemberDialog.tsx` with email input
  - [ ] 6.5 Add "Invite Member" button to ShareCodeDisplay or new component
  - [ ] 6.6 Add security rules for `pendingInvitations` collection
  - [ ] 6.7 Test: invitation created with correct fields
  - [ ] 6.8 Test: error shown when user not found

## Dev Notes

### Architecture Context

**Epic 14C Architecture Decision:** Option 4 - Hybrid Model
- SharedGroup document at top-level `sharedGroups/{groupId}`
- Transactions stay in user's subcollection but reference `sharedGroupIds[]`
- Cross-user reads enabled via `memberOfSharedGroups` on user profile + security rules

**Why top-level collection?**
- Firestore security rules can't easily reference sibling user documents
- Top-level allows simpler member-based access control
- Avoids nested subcollection complexity for multi-user access

### Existing Code to Leverage

**groupService.ts** - Personal groups already implemented:
- `createGroup()`, `updateGroup()`, `deleteGroup()` patterns
- `subscribeToGroups()` real-time listener pattern
- Batch update patterns for denormalized fields

**transactionGroup.ts** - Type patterns to follow:
- `TransactionGroup` interface structure
- `CreateTransactionGroupInput`, `UpdateTransactionGroupInput` patterns
- `extractGroupEmoji()`, `extractGroupLabel()` utilities

### Project Structure Notes

**New files to create:**
```
src/
├── types/
│   └── sharedGroup.ts           # SharedGroup interface, limits
├── services/
│   └── sharedGroupService.ts    # CRUD + share code generation
├── components/
│   ├── MakeShareableDialog.tsx  # Confirmation dialog
│   └── ShareCodeDisplay.tsx     # Share code UI component
tests/
└── firestore-rules/
    └── sharedGroups.test.ts     # Security rule tests
```

**Files to modify:**
```
src/types/transaction.ts         # Add sharedGroupIds[], deletedAt
src/lib/constants.ts             # Add SHARED_GROUP_LIMITS
firestore.rules                  # Add sharedGroups collection rules
package.json                     # Add test:rules script if needed
```

### Security Rules Implementation

```javascript
// firestore.rules addition
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Existing user isolation rules...

    // New: Shared Groups (top-level collection)
    match /sharedGroups/{groupId} {
      // Helper functions
      function isGroupMember() {
        return request.auth != null
            && request.auth.uid in resource.data.members;
      }

      function isGroupOwner() {
        return request.auth != null
            && request.auth.uid == resource.data.ownerId;
      }

      function isValidNewGroup() {
        return request.auth != null
            && request.resource.data.ownerId == request.auth.uid
            && request.resource.data.members.hasOnly([request.auth.uid])
            && request.resource.data.members.size() == 1;
      }

      // Create: authenticated user, must be owner and only member
      allow create: if isValidNewGroup();

      // Read: must be member
      allow read: if isGroupMember();

      // Update/Delete: owner only
      allow update, delete: if isGroupOwner();
    }
  }
}
```

### Share Code Implementation

```typescript
// src/services/sharedGroupService.ts
import { nanoid } from 'nanoid';

const SHARE_CODE_LENGTH = 16;
const SHARE_CODE_EXPIRY_DAYS = 7;

export function generateShareCode(): string {
  return nanoid(SHARE_CODE_LENGTH);
}

export function getShareCodeExpiry(): Timestamp {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + SHARE_CODE_EXPIRY_DAYS);
  return Timestamp.fromDate(expiryDate);
}

export function getShareLink(shareCode: string): string {
  return `https://boletapp.web.app/join/${shareCode}`;
}
```

### UI Component Patterns

Follow existing component patterns from:
- `src/components/views/SettingsView.tsx` - Settings section structure
- `src/components/TransactionGroupSelector.tsx` - Group selection UI
- `src/components/dialogs/ConfirmDialog.tsx` - Dialog pattern

### Testing Strategy

**Security Rules Tests:**
- Use `@firebase/rules-unit-testing` package
- Create test users: owner, member, non-member
- Test each rule condition explicitly

**Component Tests:**
- Mock `sharedGroupService` functions
- Test share code display + copy functionality
- Test share sheet integration (can mock)

### References

- [Epic 14C Architecture]: docs/sprint-artifacts/epic14/epic-14c-household-sharing.md#architecture-decisions
- [Brainstorming Session]: docs/analysis/brainstorming-session-2026-01-15.md
- [Existing Group Service]: src/services/groupService.ts
- [Existing Group Types]: src/types/transactionGroup.ts
- [Firestore Security Rules]: firestore.rules
- [Firebase Emulator Testing]: https://firebase.google.com/docs/rules/unit-tests

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Completion Notes List

### File List

**New Files:**
- `src/types/sharedGroup.ts` - SharedGroup types, constants, and type guards
- `src/services/sharedGroupService.ts` - CRUD operations for shared groups
- `src/hooks/useSharedGroups.ts` - Real-time subscription hook
- `src/components/SharedGroups/MakeShareableDialog.tsx` - Two-stage dialog
- `src/components/SharedGroups/ShareCodeDisplay.tsx` - Share code with copy/share
- `src/components/SharedGroups/index.ts` - Barrel exports
- `tests/integration/shared-groups-rules.test.ts` - Security rules tests (17 tests)
- `tests/unit/hooks/useSharedGroups.test.ts` - Hook unit tests
- `tests/unit/components/SharedGroups/ShareCodeDisplay.test.tsx` - Component tests
- `tests/unit/components/SharedGroups/MakeShareableDialog.test.tsx` - Component tests

**Modified Files:**
- `firestore.rules` - Added sharedGroups collection security rules
- `src/components/settings/subviews/GruposView.tsx` - Integrated shared groups UI
- `src/config/constants.ts` - Re-export SHARED_GROUP_LIMITS
- `src/types/transaction.ts` - Added sharedGroupIds field
- `src/views/SettingsView.tsx` - Import GruposView
- `tests/setup/firebase-emulator.ts` - Extended for shared groups testing
- `package.json` - Added nanoid dependency

