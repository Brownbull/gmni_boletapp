# Story 18-10b: Transaction Matching UI

## Status: drafted

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Build the courtroom — where the user sees the evidence and makes the call on every match"

## Architecture Reference
- **V5 Plan:** `docs/architecture/proposals/implemented/EPIC-18-CREDIT-CARD-STATEMENT-SCANNING.md`
- **Atomicity:** Use Firestore writeBatch for save operations (mixed updates + creates)
- **Virtualization:** Required for 80+ transaction matching review on mobile

## Story
As a user, I want to see proposed matches between my statement transactions and existing app transactions, and approve matches, reject them to create new transactions, or manually search and pick matches, so that my spending history is reconciled with explicit confirmation on every action.

## Acceptance Criteria

### Functional
- **AC-1:** Review screen shows list of statement transactions with match proposals
- **AC-2:** Each match card shows: statement txn + proposed match side-by-side, confidence badge
- **AC-3:** User has exactly 3 actions per statement transaction: approve match, reject + create new, manual pick/create
- **AC-4:** Approve match: triggers merge (via 18-10a), sets statementVerified=true
- **AC-5:** If amounts differ: AmountConflictDialog shows receipt total vs statement amount, user picks
- **AC-6:** Reject + create new: creates transaction (source='statement_scan', synthetic item), original untouched
- **AC-7:** No match found: user can search/select existing transaction OR create new
- **AC-8:** Summary header: X matched, Y unmatched, Z new — with "Save All" action
- **AC-9:** Re-import banner: "X transactions from this statement are already verified"
- **AC-10:** Matching is NEVER automatic — user confirms every action (Core Rule)

### Architectural
- **AC-ARCH-1:** Matching UI in `src/features/statement-scan/components/`
- **AC-ARCH-2:** Uses TransactionCard pattern for displaying existing matches
- **AC-ARCH-3:** All modals use ConfirmationDialog pattern + ModalManager registry
- **AC-ARCH-4:** All strings via translations, dark mode supported

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| Matching review UI | `src/features/statement-scan/components/MatchingReviewView.tsx` | NEW |
| Match card | `src/features/statement-scan/components/MatchCard.tsx` | NEW |
| Transaction search | `src/features/statement-scan/components/TransactionSearchDialog.tsx` | NEW |
| Amount conflict dialog | `src/features/statement-scan/components/AmountConflictDialog.tsx` | NEW |
| Statement store | `src/features/statement-scan/store/useStatementScanStore.ts` | MODIFY (add matching phase) |
| Translations | `src/utils/translations.ts` | MODIFY |
| Modal registry | `src/managers/ModalManager/ModalManager.tsx` | MODIFY |

## Tasks

### Task 1: Matching Review UI (4 subtasks)
- [ ] 1.1: Create MatchingReviewView: virtualized list (react-window) of statement transactions with match proposals (supports 80+ cards on mobile)
- [ ] 1.2: Create MatchCard: shows statement txn + proposed match side-by-side, confidence badge
- [ ] 1.3: Three action buttons per card: Approve, Reject + Create New, Manual Pick
- [ ] 1.4: Summary header: X matched, Y unmatched, Z new — with "Save All" action

### Task 2: Manual Match + Search (2 subtasks)
- [ ] 2.1: Create TransactionSearchDialog: search existing transactions by merchant/amount/date
- [ ] 2.2: Select from search results → treat as approve match flow

### Task 3: Amount Conflict Dialog (2 subtasks)
- [ ] 3.1: Create AmountConflictDialog: show receipt total vs statement amount, user picks which to keep
- [ ] 3.2: Register in ModalManager

### Task 4: Store + Save (3 subtasks)
- [ ] 4.1: Extend useStatementScanStore: add matching phase, matchResults[], user decisions
- [ ] 4.2: Save flow using Firestore writeBatch for atomicity: batch update matched transactions + batch create new transactions (500 chunk limit per batch)
- [ ] 4.3: Error handling: if batch fails, show error toast with retry option — no partial state (writeBatch is atomic)

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 4
- **Subtasks:** 10
- **Files:** ~7

## Dependencies
- 18-10a matching logic (provides matching algorithm + merge functions)

## Risk Flags
- UI_STATE (matching phase adds significant state to the store)
- BATCH_OPERATIONS (mixed updates + creates, must respect 500 chunk limit)
