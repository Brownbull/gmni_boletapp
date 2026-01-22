# Story 14c-refactor.20: App.tsx Handler Extraction - Transaction & Scan Handlers

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **transaction and scan event handlers extracted from App.tsx into custom hooks**,
So that **App.tsx handler logic is modularized and testable, reducing coupling and improving maintainability**.

## Background

Story 14c-refactor.11 created the App component architecture (AppLayout, AppProviders, AppRoutes, AppErrorBoundary) but deferred handler extraction due to scope. This is the first of three stories to complete the App.tsx decomposition:

- **14c-refactor.20** (this story): Transaction + Scan handlers (~350-500 lines)
- **14c-refactor.21**: Navigation + Dialog handlers (~200 lines)
- **14c-refactor.22**: JSX/view rendering into AppRoutes + final cleanup (~3200 lines)

## Acceptance Criteria

### Core Functionality

1. **Given** App.tsx contains transaction handlers (lines ~1600-1900)
   **When** this story is completed
   **Then:**
   - Create `src/hooks/app/useTransactionHandlers.ts` containing:
     - `handleSaveTransaction` - Save new transaction to Firestore with insight generation
     - `handleUpdateTransaction` - Update existing transaction with member timestamp updates
     - `handleDeleteTransaction` - Delete transaction with cascade image deletion
     - `handleWipeAllTransactions` - Wipe all user data with confirmation
     - `createDefaultTransaction` - Factory for new transactions with defaults (location, currency, shared groups)
   - Each handler uses `useCallback` with proper dependencies
   - Handlers receive required services/state via hook parameters
   - Barrel export via `src/hooks/app/index.ts` (extend existing)

2. **Given** App.tsx contains scan flow handlers (lines ~1200-1600)
   **When** this story is completed
   **Then:**
   - Create `src/hooks/app/useScanHandlers.ts` containing:
     - `processScan` - Core scan processing with Gemini API, credit deduction, mapping auto-apply
     - `handleRescan` - Re-scan with existing images (re-process after user confirms currency/total)
     - `handleQuickSave` - Quick save for high-confidence scans (≥85% confidence)
     - `handleSaveAndShowQuickSave` - Save via quick save card with insight generation
     - Scan state wrapper functions for ScanContext compatibility
   - Handlers integrate with ScanContext for state management
   - Handlers preserve existing workflow chains (Scan Receipt Flow #1, Quick Save Flow #2)
   - Credit deduct/refund pattern maintained for API failure recovery

3. **Given** the handlers are extracted
   **When** App.tsx uses these hooks
   **Then:**
   - App.tsx imports and uses `useTransactionHandlers` and `useScanHandlers`
   - All transaction and scan flows continue to work identically
   - No behavioral changes to any user-facing functionality
   - TypeScript compiles without errors
   - Existing tests pass
   - App.tsx reduced by ~400-500 lines

### Atlas Workflow Impact Requirements

4. **Given** the Auth → Scan → Save Critical Path (#1)
   **When** handlers are extracted
   **Then:**
   - Handlers access `user.uid` correctly through hook closure or context
   - Transaction saves complete atomically (no partial saves)
   - Firestore writes use correct `user.uid` for document paths
   - Test: Save transaction, verify `userId` field matches auth user

5. **Given** the Scan Receipt Flow (#1) depends on ScanContext
   **When** scan handlers are extracted
   **Then:**
   - ScanContext integration maintains identical event ordering
   - `dispatchProcessStart` → API call → `dispatchProcessSuccess/Error` sequence preserved
   - Error handling maintains credit refund on API failure
   - Test: Scan receipt, verify state transitions match expected sequence

6. **Given** the Quick Save Flow (#2) has specific timing requirements
   **When** quick save handlers are extracted
   **Then:**
   - Transaction save completes before insight generation fires
   - Trust merchant prompt appears after save (not during)
   - Quick save eligibility checks remain atomic with save
   - Test: Quick save flow, verify insight appears after save toast

7. **Given** credit operations must maintain atomicity
   **When** handlers perform credit deduct/refund
   **Then:**
   - Credit deduction happens BEFORE API call
   - Credit refund executes on API failure (not handler failure)
   - Super credits vs normal credits handled correctly (batch mode)
   - Test: Simulate API failure, verify credits are refunded

### Dependencies

8. **Given** this story depends on prior refactoring
   **When** starting implementation
   **Then:**
   - Story 14c-refactor.11 (Components) MUST be completed first
   - Existing app hooks from 14c-refactor.10 are available for import
   - ScanContext from Epic 14d-old is stable and unchanged

## Tasks / Subtasks

### Task 1: Analyze Handler Dependencies (AC: #1, #2)

- [ ] 1.1 Inventory transaction handlers in App.tsx (lines ~1600-1900)
- [ ] 1.2 Inventory scan handlers in App.tsx (lines ~1200-1600)
- [ ] 1.3 Document handler signatures and dependencies for each
- [ ] 1.4 Identify shared state requirements between handlers
- [ ] 1.5 Plan hook interface (props vs internal hook usage)

### Task 2: Create useTransactionHandlers Hook (AC: #1, #4)

- [ ] 2.1 Create `src/hooks/app/useTransactionHandlers.ts`
- [ ] 2.2 Define props interface:
  ```typescript
  interface UseTransactionHandlersProps {
    user: User | null;
    services: { db: Firestore; appId: string } | null;
    viewMode: ViewMode;
    activeGroup: SharedGroup | null;
    userPreferences: UserPreferences;
    // Callbacks for UI updates
    setToastMessage: (msg: { text: string; type: 'success' | 'info' } | null) => void;
    setCurrentTransaction: (tx: Transaction | null) => void;
    // Additional dependencies as needed
  }
  ```
- [ ] 2.3 Extract `handleSaveTransaction` with full logic:
  - Firestore write with `firestoreAddTransaction`
  - Mapping usage increment (`incrementMappingUsage`, `incrementMerchantMappingUsage`)
  - Insight generation (async, fire-and-forget)
  - Member timestamp updates for shared groups
  - Toast notification
- [ ] 2.4 Extract `handleUpdateTransaction` with:
  - Firestore update with `firestoreUpdateTransaction`
  - Member timestamp updates for shared groups
  - React Query cache invalidation
- [ ] 2.5 Extract `handleDeleteTransaction` with cascade:
  - Storage image deletion
  - Firestore delete with `firestoreDeleteTransaction`
  - React Query cache invalidation
- [ ] 2.6 Extract `handleWipeAllTransactions`
- [ ] 2.7 Extract `createDefaultTransaction` factory:
  - Include default location, currency from preferences
  - Auto-assign sharedGroupIds when in group view mode
- [ ] 2.8 Ensure all handlers use `useCallback` for stable references
- [ ] 2.9 Add JSDoc comments explaining handler behavior

### Task 3: Create useScanHandlers Hook (AC: #2, #5, #6, #7)

- [ ] 3.1 Create `src/hooks/app/useScanHandlers.ts`
- [ ] 3.2 Define props interface:
  ```typescript
  interface UseScanHandlersProps {
    user: User | null;
    services: { db: Firestore; appId: string } | null;
    // ScanContext state and actions (from useScan())
    scanState: ScanState;
    dispatchProcessStart: () => void;
    dispatchProcessSuccess: (result: Transaction) => void;
    dispatchProcessError: (error: string) => void;
    setScanContextImages: (images: string[]) => void;
    resetScanContext: () => void;
    // Credit operations
    deductUserCredits: (amount: number) => Promise<boolean>;
    addUserCredits: (amount: number) => Promise<void>;
    userCredits: number;
    // Mapping hooks for auto-apply
    mappings: CategoryMapping[];
    merchantMappings: MerchantMapping[];
    subcategoryMappings: SubcategoryMapping[];
    findMerchantMatch: (name: string) => MerchantMapping | null;
    // User preferences
    userPreferences: UserPreferences;
    lang: Language;
  }
  ```
- [ ] 3.3 Extract `processScan` with full Gemini API integration:
  - Credit deduction BEFORE API call
  - `analyzeReceipt()` call with store type and currency
  - Mapping auto-apply (`applyCategoryMappings`, `findMerchantMatch`)
  - Currency/total mismatch detection
  - Credit refund on API failure
  - ScanContext state updates (`dispatchProcessStart/Success/Error`)
- [ ] 3.4 Extract `handleRescan` for re-processing:
  - Re-process existing images with new parameters
  - Used after user confirms currency/total mismatch
- [ ] 3.5 Extract `handleQuickSave` for high-confidence auto-save:
  - Confidence check with `shouldShowQuickSave` (≥85%)
  - Weighted scoring for quick save eligibility
  - Integration with trust merchant system
- [ ] 3.6 Extract `handleSaveAndShowQuickSave` with insight generation:
  - Save transaction via `handleSaveTransaction`
  - Show insight card (async)
  - Trust merchant prompt if eligible
- [ ] 3.7 Add scan state wrapper functions for compatibility (if needed)
- [ ] 3.8 Ensure credit deduct/refund follows atomic pattern
- [ ] 3.9 Add JSDoc comments explaining scan flow

### Task 4: Update Barrel Export (AC: #1)

- [ ] 4.1 Update `src/hooks/app/index.ts` to export new hooks
- [ ] 4.2 Verify all existing exports still work
- [ ] 4.3 Add type exports for handler props interfaces

### Task 5: Integrate Hooks in App.tsx (AC: #3)

- [ ] 5.1 Import new hooks in App.tsx
- [ ] 5.2 Call hooks with required dependencies
- [ ] 5.3 Replace inline handler definitions with hook returns
- [ ] 5.4 Remove extracted handler code from App.tsx
- [ ] 5.5 Verify no duplicate handler definitions remain
- [ ] 5.6 Count App.tsx line reduction (target: ~400-500 lines removed)

### Task 6: Testing (AC: #4, #5, #6, #7)

- [ ] 6.1 Create `tests/unit/hooks/app/useTransactionHandlers.test.ts`
- [ ] 6.2 Create `tests/unit/hooks/app/useScanHandlers.test.ts`
- [ ] 6.3 Test transaction save with mock Firestore (verify userId field)
- [ ] 6.4 Test scan flow state transitions (processScan)
- [ ] 6.5 Test credit deduct/refund on API failure
- [ ] 6.6 Test quick save eligibility and flow
- [ ] 6.7 Test createDefaultTransaction with view mode variations
- [ ] 6.8 Run full test suite: `npm test`
- [ ] 6.9 Run build: `npm run build`

### Task 7: Manual Verification (AC: #3, #4, #5, #6)

- [ ] 7.1 Manual smoke test:
  - [ ] Create new transaction (manual entry)
  - [ ] Scan receipt (single mode)
  - [ ] Quick save flow (high confidence receipt)
  - [ ] Edit existing transaction
  - [ ] Delete transaction
  - [ ] Batch scan flow (uses same save path)
- [ ] 7.2 Verify no console errors
- [ ] 7.3 Verify toast messages appear correctly
- [ ] 7.4 Verify insight generation after save

## Dev Notes

### Estimation

- **Points:** 3 pts
- **Risk:** MEDIUM - Core transaction/scan flows, requires careful testing

### Dependencies

- **Requires:** Story 14c-refactor.11 complete (components created)
- **Blocks:** Story 14c-refactor.21 (navigation/dialog handlers), 14c-refactor.22 (final cleanup)

### Handler Inventory (from App.tsx analysis)

| Handler | Approx Lines | Key Dependencies |
|---------|-------------|------------------|
| `handleSaveTransaction` | ~100 | firestoreAddTransaction, mappings, insights, sharedGroups |
| `handleUpdateTransaction` | ~80 | firestoreUpdateTransaction, memberTimestamps |
| `handleDeleteTransaction` | ~50 | firestoreDeleteTransaction, storage cascade |
| `handleWipeAllTransactions` | ~30 | wipeAllTransactions |
| `createDefaultTransaction` | ~25 | viewMode, activeGroup, userPreferences |
| `processScan` | ~150 | analyzeReceipt, credits, mappings, ScanContext |
| `handleRescan` | ~40 | processScan (re-invoke) |
| `handleQuickSave` | ~60 | shouldShowQuickSave, trustedMerchants |
| `handleSaveAndShowQuickSave` | ~50 | handleSaveTransaction, insights, trust |
| **Total** | **~585** | |

### Handler Dependency Analysis

**Transaction Handlers Depend On:**
- `user` (useAuth) - for `user.uid` in Firestore paths
- `services.db` - Firestore instance
- `services.appId` - for multi-tenancy
- `viewMode`, `activeGroup` (ViewModeContext) - for shared group tagging
- `queryClient` (React Query) - for cache invalidation
- `setToastMessage` - UI callback for success/error feedback
- `setCurrentTransaction` - UI state update
- `generateInsightForTransaction` - async insight generation

**Scan Handlers Depend On:**
- `user` (useAuth) - for credit operations and user context
- `scanState` + actions (ScanContext) - state machine
- `deductUserCredits`, `addUserCredits` (useUserCredits) - credit management
- `mappings`, `merchantMappings`, `subcategoryMappings` - auto-apply
- `findMerchantMatch` - merchant fuzzy matching
- `userPreferences` - default currency, location
- `analyzeReceipt` (Gemini service) - API call
- `lang` - for translations in reconciliation

### Hook Design Decisions

1. **Props Pattern:** Pass UI callbacks and services as props (reduces coupling to App.tsx state)
2. **Context Access:** ScanContext accessed via `useScan()` inside the hook (already tightly coupled)
3. **Callback Stability:** All handlers wrapped in `useCallback` with exhaustive deps
4. **Error Handling:**
   - Transaction errors: Show toast, don't throw
   - Scan errors: Dispatch to ScanContext, may refund credits

### Credit Atomicity Pattern (CRITICAL)

```typescript
// Correct pattern - deduct before API, refund on error
const canProceed = await deductUserCredits(1);
if (!canProceed) {
  // Insufficient credits - show warning, don't call API
  return;
}

try {
  const result = await analyzeReceipt(...);
  // Success - credit already deducted, no action needed
  dispatchProcessSuccess(result);
} catch (error) {
  await addUserCredits(1); // Refund on API failure ONLY
  dispatchProcessError(error.message);
}
```

### Testing Standards

- Mock Firestore with `vi.fn()` for service calls
- Mock ScanContext with test provider or mock `useScan()` return
- Test credit operations with mock `deductUserCredits`/`addUserCredits`
- Minimum 80% coverage for new hooks
- Target: 40+ tests across both hooks

## Atlas Workflow Analysis

> This section was generated by Atlas workflow chain analysis (2026-01-21)

### Affected Workflows

- **Scan Receipt Flow (#1)**: Handler extraction changes how scan processing is invoked - `processScan` must maintain exact state machine event ordering (`PROCESS_START` → API → `PROCESS_SUCCESS/ERROR`)
- **Quick Save Flow (#2)**: Save handlers are tightly coupled to quick save eligibility - must preserve timing for trust merchant prompts (prompt appears AFTER save, not during)
- **Batch Processing Flow (#3)**: Batch handlers use same `handleSaveTransaction` path as single scan - extracted handlers must support both modes via `sharedGroupIds` array
- **Auth → Scan → Save Critical Path**: Transaction handlers require user auth context - `user.uid` must be accessible in hook closure for Firestore document paths

### Downstream Effects to Consider

- Transaction save handlers must remain atomic (no partial saves to Firestore)
- Credit operations must maintain same error recovery patterns (refund on API failure only)
- ScanContext state updates must preserve navigation timing (phase transitions trigger view changes)
- Insight generation fires async after save completes (fire-and-forget pattern)
- Member timestamp updates for shared groups (cross-user cache invalidation)

### Testing Implications

- **Existing tests to verify:** `useScanStateMachine.test.ts` (state transitions), transaction persistence tests
- **New scenarios to add:** Isolated handler unit tests, context access verification, credit atomicity tests, shared group tagging tests

### Workflow Chain Visualization

```
[User Action: Scan/Save]
        ↓
[useScanHandlers] → processScan()
        ↓
[Credit Deduction] ←── BEFORE API call
        ↓
[API Call: analyzeReceipt()] → Gemini
        ↓
[Success?] ─No→ [Credit Refund] → dispatchProcessError
        │
       Yes
        ↓
[Apply Mappings] → merchant, category, subcategory auto-apply
        ↓
[dispatchProcessSuccess] → currentTransaction set
        ↓
[User: Quick Save or Edit]
        ↓
[useTransactionHandlers] → handleSaveTransaction()
        ↓
[Firestore Write] → user/{uid}/transactions/{txId}
        ↓
[Cache Invalidation] → React Query
        ↓
[Toast] → "Guardado"
        ↓
[Insight Generation] ─ async fire-and-forget ─→ InsightCard
```

## References

- [Source: docs/sprint-artifacts/epic14c-refactor/epics.md#Story-14c.20] - Story definition
- [Source: docs/sprint-artifacts/epic14c-refactor/14c-refactor-11-app-decomposition-components.md] - Prior story context
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/08-workflow-chains.md] - Workflow dependencies
- [Source: src/App.tsx:1200-1900] - Handlers to extract
- [Source: src/contexts/ScanContext.tsx] - ScanContext patterns
- [Source: src/hooks/app/] - Existing app-level hooks from 14c-refactor.10

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**To Create:**
- `src/hooks/app/useTransactionHandlers.ts`
- `src/hooks/app/useScanHandlers.ts`
- `tests/unit/hooks/app/useTransactionHandlers.test.ts`
- `tests/unit/hooks/app/useScanHandlers.test.ts`

**To Modify:**
- `src/App.tsx` - Import and use new hooks, remove inline handlers
- `src/hooks/app/index.ts` - Add new exports
