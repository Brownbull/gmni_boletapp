# Story 19-6: Group Transaction Feed and Posting UI

## Status: ready-for-dev

## Intent
**Epic Handle:** "Pin your receipts to the shared board"
**Story Handle:** "This story builds the shared board by filling it with pinned receipts -- the feed shows what everyone shared"

## Story
As a group member, I want to see all transactions posted to the group and post my own transactions, so that the group has a shared view of expenses.

## Acceptance Criteria

### Functional
- **AC-1:** Given a group with posted transactions, when viewing, then all transactions are listed chronologically with poster name, merchant, amount, date
- **AC-2:** Given a user's personal transactions, when they tap "Post to Group", then they select a group and the transaction is copied
- **AC-3:** Given a posted transaction, when viewed by group members, then personal data (alias, images) is NOT visible
- **AC-4:** Given admin viewing a < 30-day transaction, when they tap delete, then the deletion Cloud Function is called
- **AC-5:** Given a >= 30-day transaction, when anyone views it, then no delete option is shown (immutable)

### Architectural
- **AC-ARCH-LOC-1:** Feed at `src/features/groups/components/GroupTransactionFeed.tsx`
- **AC-ARCH-LOC-2:** Post action at `src/features/groups/handlers/useGroupTransactions.ts`
- **AC-ARCH-PATTERN-1:** TanStack Query for group transaction subscription
- **AC-ARCH-PATTERN-2:** Post action calls `postToGroup` Cloud Function

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Transaction feed | `src/features/groups/components/GroupTransactionFeed.tsx` | FSD component | NEW |
| Transaction card | `src/features/groups/components/GroupTransactionCard.tsx` | FSD component | NEW |
| Post-to-group handler | `src/features/groups/handlers/useGroupTransactions.ts` | Feature hook | NEW |
| Post-to-group UI | `src/features/groups/components/PostToGroupSheet.tsx` | FSD component | NEW |
| Tests | `tests/unit/features/groups/GroupTransactionFeed.test.tsx` | Vitest/RTL | NEW |

## Tasks

### Task 1: Group Transaction Query (2 subtasks)
- [ ] 1.1: Create TanStack Query hook for group transaction subscription (onSnapshot)
- [ ] 1.2: Sort by postedAt descending, paginate at 20 per page

### Task 2: Transaction Feed UI (3 subtasks)
- [ ] 2.1: Create `GroupTransactionFeed.tsx` -- list of group transaction cards
- [ ] 2.2: Create `GroupTransactionCard.tsx` -- poster name, merchant, amount, date, admin delete button (conditional)
- [ ] 2.3: 30-day badge: show "deletable" indicator on transactions within window

### Task 3: Post-to-Group Flow (3 subtasks)
- [ ] 3.1: Create `PostToGroupSheet.tsx` -- bottom sheet listing user's recent transactions with "Post" button
- [ ] 3.2: Create `useGroupTransactions.ts` handler -- calls `postToGroup` Cloud Function
- [ ] 3.3: Add "Post to Group" action to personal transaction detail/history (entry point)

### Task 4: Admin Deletion UI (2 subtasks)
- [ ] 4.1: Delete button on group transaction card (visible to admins only, for < 30-day transactions)
- [ ] 4.2: Confirmation dialog before deletion -- calls `deleteGroupTransaction` Cloud Function

### Task 5: Tests and Verification (2 subtasks)
- [ ] 5.1: Unit tests: feed rendering, post action, admin delete visibility
- [ ] 5.2: Run `npm run test:quick`

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 5
- **Subtasks:** 12
- **Files:** ~5

## Dependencies
- **19-3** (post function), **19-4** (delete function), **19-5** (group detail exists)

## Risk Flags
- PURE_COMPONENT (empty feed, loading state)
- E2E_TESTING (data-testid)

## Dev Notes
- The post-to-group entry point could be: (a) from personal transaction detail view, (b) from group detail view. Both are valid -- implement (a) first as it's the natural flow.
- Personal data exclusion: the Cloud Function (19-3) handles this. The UI just displays what's in the group transaction doc.
- 30-day calculation on client: compare `postedAt` with current time. This is UX-only -- security rules enforce server-side.
