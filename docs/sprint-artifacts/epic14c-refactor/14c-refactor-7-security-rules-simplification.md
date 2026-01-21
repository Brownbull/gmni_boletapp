# Story 14c-refactor.7: Security Rules Simplification

Status: done

## Story

As a **developer**,
I want **Firestore security rules simplified to deny all shared group access**,
so that **no unauthorized access is possible and rules are clean for Epic 14d rebuild**.

## Acceptance Criteria

1. **AC1: SharedGroups Collection Denied**
   - `/sharedGroups/{groupId}` rules simplified to:
     ```
     match /sharedGroups/{groupId} {
       allow read, write: if false; // Disabled until Epic 14d
     }
     ```
   - All helper functions for shared groups removed (isGroupMember, isGroupOwner, etc.)

2. **AC2: PendingInvitations Collection Denied**
   - `/pendingInvitations/{invitationId}` rules simplified to:
     ```
     match /pendingInvitations/{invitationId} {
       allow read, write: if false; // Disabled until Epic 14d
     }
     ```
   - All helper functions for invitations removed

3. **AC3: Cross-User Transaction Read Removed**
   - Remove the complex `isGroupMemberForTransaction()` helper function
   - Remove the cross-user read rule from `/artifacts/{appId}/users/{userId}/transactions/{transactionId}`
   - Users can ONLY read their own transactions (standard isolation)

4. **AC4: Collection Group Query Rule Simplified**
   - The `/{path=**}/transactions/{transactionId}` rule already denies reads
   - Keep as `allow read: if false;` but simplify comments

5. **AC5: Successful Deployment**
   - Rules deploy successfully: `firebase deploy --only firestore:rules`
   - No syntax errors or validation failures

6. **AC6: Existing Personal Transaction Rules Preserved**
   - User isolation rule remains: users can read/write their own data
   - `/artifacts/{appId}/users/{userId}/{document=**}` rule unchanged
   - Personal transaction CRUD continues to work

7. **AC7: Rules File Size Reduced**
   - Remove ~150 lines of shared group rules and helper functions
   - Keep clear comments explaining why rules are disabled

## Tasks / Subtasks

- [x] Task 1: Simplify SharedGroups rules (AC: #1)
  - [x] 1.1 Replace lines 84-166 with simple deny rule
  - [x] 1.2 Add comment explaining disabled status and Epic 14d reference
  - [x] 1.3 Remove `isGroupMember()`, `isGroupOwner()`, `isValidNewGroup()` helpers
  - [x] 1.4 Remove `isJoiningGroup()`, `isMemberUpdatingOwnTimestamp()`, `isMemberLeavingGroup()` helpers

- [x] Task 2: Simplify PendingInvitations rules (AC: #2)
  - [x] 2.1 Replace lines 177-209 with simple deny rule
  - [x] 2.2 Add comment explaining disabled status
  - [x] 2.3 Remove `isInvitedUser()`, `isStatusUpdateOnly()` helpers

- [x] Task 3: Remove cross-user transaction read (AC: #3)
  - [x] 3.1 Remove `isGroupMemberForTransaction()` helper function (lines 34-44)
  - [x] 3.2 Simplify transaction rule to owner-only access (lines 19-29)
  - [x] 3.3 Remove cross-user read condition from transaction match

- [x] Task 4: Clean up collection group query rule (AC: #4)
  - [x] 4.1 Simplify comments in lines 46-68
  - [x] 4.2 Keep `allow read: if false;` rule

- [x] Task 5: Verify and deploy (AC: #5, #6)
  - [x] 5.1 Run `firebase deploy --only firestore:rules --project boletapp-d609f`
  - [x] 5.2 Verify no deployment errors
  - [x] 5.3 Test personal transaction CRUD still works

- [x] Task 6: Verify rules file cleanup (AC: #7)
  - [x] 6.1 Count lines removed (target: ~150 lines)
  - [x] 6.2 Verify all helper functions removed
  - [x] 6.3 Ensure comments are clear and reference Epic 14d

## Dev Notes

### Current Rules Structure (216 lines)
```
Lines 1-4:    Header
Lines 5-29:   Cross-user transaction reads (REMOVE cross-user part)
Lines 31-44:  isGroupMemberForTransaction helper (DELETE)
Lines 46-68:  Collection group query deny (SIMPLIFY comments)
Lines 70-74:  User isolation rule (KEEP)
Lines 76-166: SharedGroups rules + 6 helpers (SIMPLIFY to deny)
Lines 168-209: PendingInvitations rules + 2 helpers (SIMPLIFY to deny)
Lines 211-215: Default deny (KEEP)
```

### Target Rules Structure (~70 lines)
```
Lines 1-4:    Header
Lines 5-15:   Transaction owner-only access (simplified)
Lines 17-25:  Collection group query deny (simplified comments)
Lines 27-31:  User isolation rule (unchanged)
Lines 33-38:  SharedGroups deny rule (new)
Lines 40-45:  PendingInvitations deny rule (new)
Lines 47-51:  Default deny (unchanged)
```

### Deployment Command
```bash
firebase deploy --only firestore:rules --project boletapp-d609f
```

### Testing After Deployment
1. Sign in to app
2. Create a new transaction - should work
3. Edit an existing transaction - should work
4. View transaction history - should work
5. Shared group UI shows "Coming soon" (already handled by stubbed code)

### References
- [Source: firestore.rules] - Current rules file
- [Source: docs/sprint-artifacts/epic14c-refactor/epics.md#Story 14c.7] - AC definitions
- [Source: stories 14c-refactor.1-5] - Stubbed services/hooks (runtime already handles disabled state)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- N/A - No issues encountered

### Completion Notes List
- ✅ Simplified firestore.rules from 217 lines to 55 lines (162 lines removed, exceeds target of ~150)
- ✅ Removed 9 helper functions: `isGroupMember`, `isGroupOwner`, `isValidNewGroup`, `isJoiningGroup`, `isMemberUpdatingOwnTimestamp`, `isMemberLeavingGroup`, `isGroupMemberForTransaction`, `isInvitedUser`, `isStatusUpdateOnly`
- ✅ SharedGroups collection now denies all read/write access
- ✅ PendingInvitations collection now denies all read/write access
- ✅ Cross-user transaction read removed; users can only access their own transactions
- ✅ Collection group query rule simplified (still denies all)
- ✅ User data isolation rule preserved unchanged
- ✅ Firebase rules validated without errors
- ✅ Successfully deployed to production: `firebase deploy --only firestore:rules --project boletapp-d609f`
- ✅ All 4557 tests pass (npm run test:quick)
- ✅ Clear comments reference Epic 14d for future rebuild

### Code Review Fixes (2026-01-21)
- ✅ Committed firestore.rules changes (was modified but not committed)
- ✅ Verified deployment: Firebase confirmed "latest version already up to date"
- ✅ All 4557 tests pass after commit

### File List
- Modified: `firestore.rules` (217 → 55 lines, -162 lines)
