# Story 14.24: Persistent Transaction State & Single Active Transaction

## Status: Ready for Development

## Overview
Make the transaction editor state truly persistent across navigation, implement a "single active transaction" paradigm, and properly handle credit usage only on successful scans.

## User Story
As a user, I want my in-progress transaction to persist when I navigate away, be warned if I try to edit another transaction while one is in progress, and only have credits deducted when scans complete successfully.

## Key Concepts

### Single Active Transaction Paradigm
- Only ONE transaction can be in "edit mode" at any time
- This includes: new scans, manual entries, and editing existing transactions
- If user tries to edit another transaction while one is active, show conflict dialog

### Transaction States
```
┌─────────────────────────────────────────────────────────────────┐
│                    ACTIVE TRANSACTION STATES                     │
├─────────────────────────────────────────────────────────────────┤
│ idle          │ No active transaction                           │
│ draft         │ User made changes (no scan yet)                 │
│ image_pending │ Image loaded but not scanned                    │
│ scanning      │ Scan in progress (credit reserved, not charged) │
│ scan_complete │ Scan successful (credit charged)                │
│ scan_error    │ Scan failed (credit NOT charged)                │
│ editing       │ User is editing (new or existing transaction)   │
└─────────────────────────────────────────────────────────────────┘
```

### Credit Usage Rules
- **Reserve credit** when scan starts (decrement UI counter)
- **Confirm charge** only on successful scan completion
- **Refund** (restore UI counter) if scan fails with error
- User sees: "Scan failed. Your credit was not used."

---

## Acceptance Criteria

### AC #1: State Persistence Across Navigation
- [ ] User can navigate away during any state and return to same state
- [ ] Image preview persists if loaded but not scanned
- [ ] Form changes persist (merchant, category, items, etc.)
- [ ] Scan progress persists (show overlay when returning during scan)
- [ ] Empty state (no changes, no image) does NOT persist - just resets

### AC #2: Single Active Transaction Enforcement
- [ ] Attempting to edit another transaction shows conflict dialog
- [ ] Dialog options: "Continue editing current" / "Discard and edit new"
- [ ] If "Discard" chosen, confirm with appropriate warning (credit loss if applicable)
- [ ] Nav bar camera button respects this rule too

### AC #3: Transaction List View Mode
- [ ] Clicking transaction in list opens READ-ONLY detail view
- [ ] Detail view shows all transaction info (same layout as editor)
- [ ] "Edit" button at bottom to enter edit mode
- [ ] "Edit" button triggers conflict check if active transaction exists

### AC #4: Credit Deduction on Success Only
- [ ] Credit reserved (UI shows -1) when scan starts
- [ ] Credit confirmed only when scan returns successfully
- [ ] Credit restored if scan fails (API error, timeout, etc.)
- [ ] Toast: "Scan failed. Your credit was not used."
- [ ] No credit reserved for manual entry (until scan requested)

### AC #5: Nav Bar Scan Progress Indicator
- [ ] Camera icon shows progress indicator during scan
- [ ] Works in both single and batch mode
- [ ] Indicator visible across all tabs
- [ ] Tapping icon during scan shows "Scan in progress" state

### AC #6: Conflict Dialog UX
- [ ] "Transaction in Progress" dialog when conflict detected
- [ ] Shows: "You have an unsaved transaction. What would you like to do?"
- [ ] Options:
  - "Continue editing" → Returns to active transaction
  - "View this transaction" → Opens read-only view of clicked transaction
  - "Discard draft" → Confirms discard, then allows new edit
- [ ] Different wording if credit was used vs not used

### AC #7: Cancel/Discard Flow
- [ ] Cancel with credit used: "Discarding will waste 1 credit. Are you sure?"
- [ ] Cancel without credit: "Discard changes?"
- [ ] Cancel with only image loaded: "Discard image?"
- [ ] After confirm, clear all state and return to appropriate view

---

## Technical Design

### State Structure (App.tsx)
```typescript
interface ActiveTransaction {
  // Core state
  state: 'idle' | 'draft' | 'image_pending' | 'scanning' | 'scan_complete' | 'scan_error' | 'editing';

  // Transaction data
  transaction: Transaction | null;
  originalTransaction: Transaction | null; // For existing transactions

  // Source tracking
  source: 'new' | 'existing';
  existingId?: string; // If editing existing

  // Scan state
  pendingImage: string | null;
  scanError: string | null;

  // Credit tracking
  creditReserved: boolean; // True while scanning
  creditCharged: boolean;  // True after successful scan

  // Dirty tracking
  hasChanges: boolean; // True if user modified anything
}
```

### Key Functions
```typescript
// Check if can start editing
canStartEditing(): { allowed: boolean; conflict?: ActiveTransaction }

// Handle edit attempt
handleEditAttempt(transactionId?: string): void
// - If no active → allow
// - If active with changes → show conflict dialog
// - If active idle → allow (replace)

// Reserve credit for scan
reserveCredit(): void
// - Decrement UI counter
// - Set creditReserved = true

// Confirm or refund credit
confirmCredit(): void  // On scan success
refundCredit(): void   // On scan error

// Clear active transaction
clearActiveTransaction(confirm?: boolean): Promise<boolean>
// - If creditCharged, warn about wasted credit
// - If hasChanges, warn about losing changes
// - Returns true if cleared, false if user cancelled
```

### Navigation Integration
- `useEffect` on route changes to check for unsaved state
- `beforeunload` event for browser navigation
- Custom `NavigationGuard` component

---

## Tasks

### Phase 1: State Architecture
- [ ] Task 1.1: Define `ActiveTransaction` interface and state
- [ ] Task 1.2: Create `useActiveTransaction` hook with all state management
- [ ] Task 1.3: Integrate hook into App.tsx, replace scattered state
- [ ] Task 1.4: Implement state persistence (survives navigation)

### Phase 2: Credit Management
- [ ] Task 2.1: Implement `reserveCredit()` / `confirmCredit()` / `refundCredit()`
- [ ] Task 2.2: Update `processScan` to use reserve/confirm pattern
- [ ] Task 2.3: Handle scan errors with refund and toast
- [ ] Task 2.4: Update credit display to show reserved state

### Phase 3: Conflict Detection
- [ ] Task 3.1: Create `TransactionConflictDialog` component
- [ ] Task 3.2: Implement `canStartEditing()` check
- [ ] Task 3.3: Wrap all edit entry points with conflict check
- [ ] Task 3.4: Handle conflict resolution (continue/view/discard)

### Phase 4: Read-Only Transaction View
- [ ] Task 4.1: Create `TransactionDetailView` component (read-only)
- [ ] Task 4.2: Add "Edit" button with conflict check
- [ ] Task 4.3: Update transaction list click handler
- [ ] Task 4.4: Style differences between view and edit modes

### Phase 5: Nav Bar Integration
- [ ] Task 5.1: Add scan progress indicator to camera icon
- [ ] Task 5.2: Update camera button click to check conflicts
- [ ] Task 5.3: Show appropriate state when tapped during scan
- [ ] Task 5.4: Handle batch mode indicator

### Phase 6: Cancel/Discard Flows
- [ ] Task 6.1: Implement `clearActiveTransaction()` with confirmations
- [ ] Task 6.2: Different dialogs based on state (credit used, changes made, etc.)
- [ ] Task 6.3: Update all cancel buttons to use new flow
- [ ] Task 6.4: Navigation guards (browser back, tab close)

---

## Dependencies
- Story 14.23 (Unified Transaction Editor) - COMPLETE
- Existing credit service infrastructure

## Estimated Effort
- **Size**: Large (5-8 points)
- **Risk**: Medium - Significant state management refactor

---

## Session Progress

_(To be filled during implementation)_

---

## Resume Prompt for New Session
```
Continue implementing Story 14.24: Persistent Transaction State & Single Active Transaction.

Read the story at `docs/sprint-artifacts/epic14/stories/story-14.24-persistent-transaction-state.md`.

**Goal**: Make transaction editing truly persistent with "single active transaction" paradigm.

**Key Changes**:
1. Only ONE transaction can be edited at a time
2. State persists across navigation (image, form changes, scan progress)
3. Credits only charged on SUCCESSFUL scans (reserve → confirm/refund pattern)
4. Transaction list shows READ-ONLY view, "Edit" button to enter edit mode
5. Conflict dialog when trying to edit while another transaction is active
6. Nav bar camera icon shows scan progress across all tabs

**Start with Phase 1**: State Architecture
- Define ActiveTransaction interface
- Create useActiveTransaction hook
- Integrate into App.tsx

**Key context files**:
- src/App.tsx - Current state management
- src/views/TransactionEditorView.tsx - Editor component
- src/services/creditService.ts - Credit management
- src/types/scan.ts - PendingScan type (to be replaced/extended)
```
