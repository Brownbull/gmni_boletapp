# Epic 14d-v2: Legacy File Verification Inventory

**Date:** 2026-02-01
**Purpose:** Verify which legacy shared groups files exist before Story 14d-v2-1.1 cleanup

---

## Summary

| Category | Story Assumption | Actual Status |
|----------|------------------|---------------|
| Transaction hooks | Delete if exist | ❌ NOT FOUND |
| Transaction service | Delete | ✅ EXISTS |
| Shared group service | Review for reuse | ✅ EXISTS |
| IndexedDB cache | Delete | ❌ NOT FOUND |
| Cloud Functions | Undeploy 3 functions | ❌ NOT DEPLOYED |
| Transaction type fields | Remove `sharedGroupIds` | ✅ EXISTS (line 82) |
| UI Components | Preserve shells (30 files) | ✅ 27 files found |
| Test files | Clean up related tests | ✅ 4 files found |

---

## Detailed Inventory

### 1. Hooks (src/hooks/)

**Story 14d-v2-1.1 assumed:** Delete `useSharedGroupTransactions*.ts`

| File | Status | Action |
|------|--------|--------|
| `useSharedGroupTransactions.ts` | ❌ NOT FOUND | No action needed |
| `useSharedGroupTransactionsV2.ts` | ❌ NOT FOUND | No action needed |
| `useSharedGroups.ts` | ✅ EXISTS | Review - may contain useful group CRUD |
| `useUserSharedGroups.ts` | ✅ EXISTS | Review - TanStack Query hook for user's groups |

**Update Story 14d-v2-1.1:** Remove Task 1 (files don't exist). Review `useSharedGroups.ts` and `useUserSharedGroups.ts` for reuse potential.

---

### 2. Services (src/services/)

| File | Status | Action |
|------|--------|--------|
| `sharedGroupTransactionService.ts` | ✅ EXISTS | DELETE - Epic 14c transaction sync |
| `sharedGroupService.ts` | ✅ EXISTS | REVIEW - May contain useful group CRUD |

**Update Story 14d-v2-1.1:** Keep Task 2 for `sharedGroupTransactionService.ts`. Add review task for `sharedGroupService.ts`.

---

### 3. Types (src/types/)

| File | Status | Action |
|------|--------|--------|
| `sharedGroup.ts` | ✅ EXISTS | PRESERVE - Core type definitions needed |

**Note:** This file contains `SharedGroup`, `SharedGroupMember`, etc. types that Epic 14d-v2 will use.

---

### 4. Library Files (src/lib/)

| File | Status | Action |
|------|--------|--------|
| `sharedGroupCache.ts` | ❌ NOT FOUND | No action needed |
| `sharedGroupErrors.ts` | ✅ EXISTS | REVIEW - Error types may be useful |

**Update Story 14d-v2-1.1:** Remove Task 3 (cache file doesn't exist).

---

### 5. Migrations (src/migrations/)

| File | Status | Action |
|------|--------|--------|
| `clearSharedGroupCache.ts` | ✅ EXISTS | DELETE - Cache no longer exists |

---

### 6. Cloud Functions (functions/src/)

**Story 14d-v2-1.1 assumed:** Undeploy 3 shared group functions

| Function | Status | Action |
|----------|--------|--------|
| `getSharedGroupTransactions` | ❌ NOT DEPLOYED | No action needed |
| `memberUpdates` | ❌ NOT DEPLOYED | No action needed |
| `sendSharedGroupNotification` | ❌ NOT DEPLOYED | No action needed |

**Current deployed functions:** analyzeReceipt, onTransactionDeleted, cleanupStaleFcmTokens, cleanupCrossUserFcmToken, adminCleanupUserTokens, adminSendTestNotification, saveWebPushSubscription, deleteWebPushSubscription, adminTestWebPush, getVapidPublicKey

**Update Story 14d-v2-1.1:** Remove Task 4 (functions not deployed).

---

### 7. Transaction Type Fields (src/types/transaction.ts)

| Field | Status | Action |
|-------|--------|--------|
| `sharedGroupIds?: string[]` | ✅ EXISTS (line 82) | DELETE - Replace with `sharedGroupId: string \| null` |
| `deletedAt?: any` | ✅ EXISTS | KEEP - Used for soft delete |
| `_ownerId?: string` | ✅ EXISTS | KEEP - Client-side ownership tracking |

**Update Story 14d-v2-1.1:** Keep Task 5 for `sharedGroupIds` removal.

---

### 8. UI Components (src/components/SharedGroups/)

**Story 14d-v2-1.1 assumed:** 30 files to preserve

**Found: 27 files**

| Component | Purpose | Action |
|-----------|---------|--------|
| `ViewModeSwitcher.tsx` | Group/personal toggle | PRESERVE - Core UI |
| `JoinGroupDialog.tsx` | Join flow UI | PRESERVE |
| `TransactionGroupSelector.tsx` | Group picker | PRESERVE |
| `LeaveGroupDialog.tsx` | Leave flow UI | PRESERVE |
| `EmojiPicker.tsx` | Group emoji selection | PRESERVE |
| `ColorPicker.tsx` | Group color selection | PRESERVE |
| `GroupMembersManager.tsx` | Member management | PRESERVE |
| `AutoTagIndicator.tsx` | Auto-tag status | REVIEW - May need update |
| `InviteMembersPrompt.tsx` | Invite flow | PRESERVE |
| `DeleteGroupDialog.tsx` | Delete confirmation | PRESERVE |
| `DateRangeSelector.tsx` | Date filtering | PRESERVE |
| `SharedGroupSkeleton.tsx` | Loading state | PRESERVE |
| `RemoveMemberDialog.tsx` | Remove member UI | PRESERVE |
| `MemberFilterBar.tsx` | Member filtering | PRESERVE |
| `SharedGroupError.tsx` | Error display | PRESERVE |
| `MemberContributionChart.tsx` | Statistics chart | PRESERVE |
| `NotificationsList.tsx` | Notification display | PRESERVE |
| `TransactionCardSkeleton.tsx` | Loading state | PRESERVE |
| `ShareCodeDisplay.tsx` | Invite code display | PRESERVE |
| `PendingInvitationsSection.tsx` | Pending invites | PRESERVE |
| `SharedGroupErrorBoundary.tsx` | Error boundary | PRESERVE |
| `SharedGroupTotalCard.tsx` | Total display | PRESERVE |
| `ProfileIndicator.tsx` | Owner indicator | PRESERVE |
| `OwnerLeaveWarningDialog.tsx` | Owner leave warning | PRESERVE |
| `SyncButton.tsx` | Manual sync trigger | PRESERVE |
| `SharedGroupEmptyState.tsx` | Empty state | PRESERVE |
| `TransferOwnershipDialog.tsx` | Transfer ownership | PRESERVE |

**Update Story 14d-v2-1.1:** All UI components preserved. No deletions needed.

---

### 9. Test Files (tests/)

| File | Status | Action |
|------|--------|--------|
| `tests/unit/lib/sharedGroupErrors.test.ts` | ✅ EXISTS | KEEP if errors preserved |
| `tests/unit/hooks/useSharedGroups.test.ts` | ✅ EXISTS | REVIEW - depends on hook action |
| `tests/unit/components/SharedGroups/ViewModeSwitcher.test.tsx` | ✅ EXISTS | KEEP - UI preserved |
| `tests/unit/components/SharedGroups/JoinGroupDialog.test.tsx` | ✅ EXISTS | KEEP - UI preserved |

---

## Revised Story 14d-v2-1.1 Task List

Based on this inventory, Story 14d-v2-1.1 should be updated:

### Tasks to REMOVE (files don't exist):
- ~~Task 1: Remove shared group transaction hooks~~ (not found)
- ~~Task 3: Remove IndexedDB cache layer~~ (not found)
- ~~Task 4: Undeploy and remove Cloud Functions~~ (not deployed)

### Tasks to KEEP (files exist):
- Task 2: Remove `sharedGroupTransactionService.ts` (confirmed)
- Task 5: Clean transaction type fields - remove `sharedGroupIds` (confirmed)
- Task 8: Verify app compiles (still needed)
- Task 9: Evaluate UI components (all 27 preserved)
- Task 10: Run Firestore cleanup (if legacy data exists)

### Tasks to ADD:
- Review `sharedGroupService.ts` for reusable CRUD operations
- Review `useSharedGroups.ts` and `useUserSharedGroups.ts` for reuse
- Delete `clearSharedGroupCache.ts` migration file
- Review `sharedGroupErrors.ts` for useful error types

---

## Impact on Story Points

**Original estimate:** ~5 points (based on extensive cleanup)

**Revised estimate:** ~2-3 points
- Most assumed-to-exist files don't exist
- No Cloud Functions to undeploy
- Mainly service file deletion and type field cleanup

---

*Inventory completed by Archie - React Opinionated Architect*
*Date: 2026-02-01*
