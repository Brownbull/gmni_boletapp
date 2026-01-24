---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - docs/sprint-artifacts/epic-14c-retro-2026-01-20.md
  - docs/analysis/brainstorming-session-2026-01-21.md
  - docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md
---

# Gastify - Epic 14c: Refactor & Cleanup

## Overview

This epic prepares a clean foundation before Epic 14d (Shared Groups v2) by cleaning up the failed Epic 14c implementation and refactoring core app architecture.

**Context:** Epic 14c (original Shared Groups) was reverted after failing due to:
1. Delta sync cannot detect transaction removals
2. Multi-layer caching (React Query + IndexedDB + Firestore) got out of sync
3. Cost explosion from fallback full-refetch strategies
4. Multiple iteration approaches caused more harm than one committed approach

**This Epic:** Cleans up ~16,361 lines of legacy code, refactors App.tsx (non-scan portions), simplifies caching, and establishes clean architecture for Epic 14d.

**Approach:** "Shell & Stub" - Keep UI components as disabled placeholders, remove backend implementations, prepare for Epic 14d to implement real functionality.

---

## Prior Art: Epic 14d-old (Scan Architecture Refactor) - COMPLETED

**Important:** A previous Epic 14d (now archived at `docs/sprint-artifacts/epic14d-refactor-old/`) already completed significant App.tsx refactoring focused on **scan functionality**:

### What Was Already Done (Preserve This Work):

| Component | Status | Location |
|-----------|--------|----------|
| `useScanStateMachine` hook | ✅ DONE | `src/hooks/useScanStateMachine.ts` |
| `ScanContext` provider | ✅ DONE | `src/contexts/ScanContext.tsx` |
| Single scan flow migration | ✅ DONE | Uses ScanContext |
| Batch scan flow migration | ✅ DONE | Uses ScanContext |
| Dialog unification (scan) | ✅ DONE | Currency, Total, QuickSave dialogs |
| Mode selector popup | ✅ DONE | Long-press FAB |
| FAB visual states | ✅ DONE | Color + icon + shine per mode |
| State machine persistence | ✅ DONE | localStorage integration |

**31 scan-related state variables** were migrated from App.tsx to ScanContext.

### What This Epic Focuses On (Non-Scan):

This epic handles the **remaining** App.tsx refactoring that was NOT part of the scan refactor:

| Area | Status | This Epic |
|------|--------|-----------|
| Auth context | ❌ NOT DONE | Story 14c.9 |
| Navigation context | ❌ NOT DONE | Story 14c.9 |
| Theme context | ❌ NOT DONE | Story 14c.9 |
| Shared groups state | ❌ NOT DONE | Stories 14c.1-14c.8 |
| View mode state | ❌ NOT DONE | Story 14c.13 |
| Transaction caching | ❌ NOT DONE | Story 14c.12 |

**Critical:** Stories 14c.9-14c.11 must **preserve ScanContext** and only extract non-scan contexts.

---

## Epic Summary

| Part | Focus | Stories | Points |
|------|-------|---------|--------|
| 1 | Shared Groups Stub & Cleanup | 8 | 18 |
| 2 | App Architecture Refactor | 5 | 21 |
| 3 | Firebase & Infrastructure | 3 | 7 |
| 4 | Quality & Validation | 3 | 8 |
| 5 | Project Cleanup & Organization | 4 | 12 |
| **Total** | | **23** | **~66** |

---

## Part 1: Shared Groups Stub & Cleanup

**Goal:** Remove broken shared groups sync implementation while preserving UI shells for Epic 14d.

---

### Story 14c.1: Stub Cloud Functions

As a **developer**,
I want **shared group Cloud Functions removed from deployment**,
So that **no broken backend code is executing and we have a clean slate for Epic 14d**.

**Acceptance Criteria:**

**Given** the Cloud Functions `getSharedGroupTransactions` and `sendSharedGroupNotification` exist
**When** this story is completed
**Then:**
- `functions/src/getSharedGroupTransactions.ts` is deleted
- `functions/src/sendSharedGroupNotification.ts` is deleted
- Exports removed from `functions/src/index.ts`
- Functions are undeployed from Firebase (run `firebase functions:delete`)
- Build succeeds without these functions

**Points:** 2

---

### Story 14c.2: Stub Services

As a **developer**,
I want **shared group services replaced with stub implementations**,
So that **the app compiles but shared group operations return placeholder responses**.

**Acceptance Criteria:**

**Given** `sharedGroupService.ts` and `sharedGroupTransactionService.ts` have full implementations
**When** this story is completed
**Then:**
- `src/services/sharedGroupService.ts` functions return stub responses:
  - `createSharedGroup()` → throws "Feature temporarily unavailable"
  - `joinSharedGroup()` → throws "Feature temporarily unavailable"
  - `leaveSharedGroup()` → throws "Feature temporarily unavailable"
  - `getSharedGroups()` → returns empty array `[]`
  - All other functions → throw or return empty
- `src/services/sharedGroupTransactionService.ts` is deleted entirely
- `src/lib/sharedGroupErrors.ts` is deleted (no longer needed)
- App compiles and runs without errors
- Existing imports don't break (stubs satisfy type contracts)

**Points:** 3

---

### Story 14c.3: Stub Hooks

As a **developer**,
I want **shared group hooks replaced with stub implementations**,
So that **components using these hooks don't crash but show empty/disabled states**.

**Acceptance Criteria:**

**Given** `useSharedGroups`, `useUserSharedGroups`, and `useSharedGroupTransactions` hooks exist
**When** this story is completed
**Then:**
- `src/hooks/useSharedGroups.ts` returns:
  - `sharedGroups: []`
  - `isLoading: false`
  - `error: null`
- `src/hooks/useUserSharedGroups.ts` returns:
  - `groups: []`
  - `isLoading: false`
- `src/hooks/useSharedGroupTransactions.ts` is deleted entirely
- Components using these hooks render without errors
- No network calls are made to fetch shared group data

**Points:** 2

---

### Story 14c.4: Clean IndexedDB Cache

As a **developer**,
I want **the shared group IndexedDB cache layer removed**,
So that **no stale cached data remains and the caching complexity is eliminated**.

**Acceptance Criteria:**

**Given** `src/lib/sharedGroupCache.ts` implements IndexedDB caching
**When** this story is completed
**Then:**
- `src/lib/sharedGroupCache.ts` is deleted
- On app initialization, any existing `sharedGroupCache` IndexedDB database is deleted
- Add cleanup code to clear legacy cache:
  ```typescript
  // In app initialization
  indexedDB.deleteDatabase('sharedGroupCache');
  ```
- No references to sharedGroupCache remain in codebase
- App compiles and runs without IndexedDB errors

**Points:** 2

---

### Story 14c.5: Placeholder UI States

As a **user**,
I want **shared group UI components to show disabled states with tooltips**,
So that **I understand the feature is temporarily unavailable without the app crashing**.

**Acceptance Criteria:**

**Given** the `src/components/SharedGroups/` directory contains 27 component files
**When** this story is completed
**Then:**
- `ViewModeSwitcher.tsx` shows only "Personal" mode, group options disabled with tooltip "Coming soon"
- `TransactionGroupSelector.tsx` is disabled with tooltip "Shared groups coming soon"
- `JoinGroupDialog.tsx` shows message "This feature is being rebuilt. Check back soon!"
- `GroupMembersManager.tsx` shows empty state "No groups available"
- All action buttons (create, join, invite) are disabled with tooltips
- No crashes when navigating to shared group related screens
- Consistent "Coming soon" messaging across all disabled components

**Points:** 3

---

### Story 14c.6: Firestore Data Cleanup Script

As a **developer**,
I want **a manual script to clean up Firestore shared group data**,
So that **we start Epic 14d with a clean database state**.

**Acceptance Criteria:**

**Given** Firestore contains `sharedGroups` and `pendingInvitations` collections
**When** this script is run manually
**Then:**
- Script location: `scripts/cleanup-shared-groups.ts`
- Script performs:
  1. Deletes all documents in `sharedGroups` collection
  2. Deletes all documents in `pendingInvitations` collection
  3. For all transactions: sets `sharedGroupIds` to empty array `[]` (NOT delete the field)
  4. Logs count of affected documents
  5. Requires confirmation before executing destructive operations
- Script can be run with: `npx ts-node scripts/cleanup-shared-groups.ts`
- Script has dry-run mode: `--dry-run` flag to preview changes
- Field `sharedGroupIds` remains on transaction documents (empty, not removed)

**Points:** 3

---

### Story 14c.7: Security Rules Simplification

As a **developer**,
I want **Firestore security rules simplified to deny shared group access**,
So that **no unauthorized access is possible and rules are ready for Epic 14d rebuild**.

**Acceptance Criteria:**

**Given** `firestore.rules` contains complex shared group rules (lines 6-209)
**When** this story is completed
**Then:**
- SharedGroups collection rules simplified to:
  ```
  match /sharedGroups/{groupId} {
    allow read, write: if false; // Disabled until Epic 14d
  }
  ```
- PendingInvitations collection rules simplified to:
  ```
  match /pendingInvitations/{invitationId} {
    allow read, write: if false; // Disabled until Epic 14d
  }
  ```
- Cross-user transaction read via `sharedGroupIds` removed (users can only read own transactions)
- Collection group query rules removed
- Rules deploy successfully: `firebase deploy --only firestore:rules`
- Existing personal transaction rules remain unchanged

**Points:** 1

---

### Story 14c.8: Remove Dead Code & Migration Scripts

As a **developer**,
I want **all dead code and obsolete migration scripts removed**,
So that **the codebase is clean and doesn't confuse future development**.

**Acceptance Criteria:**

**Given** the codebase contains dead/obsolete shared group code
**When** this story is completed
**Then:**
- `src/utils/memberUpdateDetection.ts` is deleted (failed delta sync approach)
- `scripts/add-sharedGroupIds-field.ts` is archived to `scripts/archive/`
- `scripts/fix-duplicate-sharedGroupIds.ts` is archived to `scripts/archive/`
- Any disabled emulator connection code removed
- Comments referencing "Story 14c.X" removed or updated
- Console.log statements related to shared groups removed
- No TypeScript errors after removal
- Git history preserved (files moved/deleted, not lost)

**Points:** 2

---

## Part 2: App Architecture Refactor

**Goal:** Break down App.tsx (~3800 lines) and simplify state management per retrospective requirements.

---

### Story 14c.9: App.tsx Decomposition - Contexts (Non-Scan)

As a **developer**,
I want **non-scan App.tsx contexts extracted into separate files**,
So that **the main App component is smaller and concerns are separated**.

**Prerequisites:**
- **PRESERVE** existing `ScanContext` from Epic 14d-old (`src/contexts/ScanContext.tsx`)
- This story extracts **only non-scan** contexts

**Acceptance Criteria:**

**Given** App.tsx contains inline context definitions beyond ScanContext
**When** this story is completed
**Then:**
- Create additional contexts in `src/contexts/` directory:
  - `AuthContext.tsx` - authentication state and methods
  - `NavigationContext.tsx` - navigation state, active routes, view switching
  - `ThemeContext.tsx` - theme preferences, dark mode
  - `NotificationContext.tsx` - push notification state (non-scan related)
  - `AppStateContext.tsx` - app lifecycle, online/offline status
- Each context file exports:
  - Context object
  - Provider component
  - Custom hook (e.g., `useAuth`, `useNavigation`)
- **ScanContext remains unchanged** - do NOT modify or duplicate
- App.tsx imports and composes these providers alongside ScanContext
- App.tsx reduced by ~500-700 lines (non-scan portions)
- All existing functionality preserved
- No regressions in auth, navigation, or theme behavior

**Exclusions (Already Done in Epic 14d-old):**
- Scan state machine
- Scan dialogs (currency, total, quicksave)
- Batch processing state
- FAB mode state

**Points:** 5

---

### Story 14c.10: App.tsx Decomposition - Hooks (Non-Scan)

As a **developer**,
I want **non-scan App.tsx initialization and effect logic extracted into custom hooks**,
So that **App.tsx is declarative and logic is reusable**.

**Prerequisites:**
- **PRESERVE** existing scan hooks from Epic 14d-old:
  - `useScanStateMachine.ts`
  - `useBatchProcessing.ts`
  - `useBatchCapture.ts`
  - `useBatchReview.ts`

**Acceptance Criteria:**

**Given** App.tsx contains complex useEffect chains beyond scan functionality
**When** this story is completed
**Then:**
- Create `src/hooks/app/` directory with:
  - `useAppInitialization.ts` - Firebase init, auth state restoration
  - `useDeepLinking.ts` - URL handling, deep link routing (non-scan)
  - `usePushNotifications.ts` - FCM registration, general notification handling
  - `useOnlineStatus.ts` - Network connectivity monitoring
  - `useAppLifecycle.ts` - Foreground/background state
- Each hook is self-contained with its own effects
- **Scan-related hooks remain unchanged** - do NOT modify or duplicate
- App.tsx uses these hooks declaratively
- App.tsx reduced by ~300-500 additional lines (non-scan portions)
- Deep linking continues to work (test with share links)
- Push notifications continue to work

**Exclusions (Already Done in Epic 14d-old):**
- `useScanStateMachine` - scan state machine
- Scan-related useEffects
- processScan() logic (moved to ScanContext)
- handleBatchProcess() logic (moved to ScanContext)

**Points:** 5

---

### Story 14c.11: App.tsx Decomposition - Components

As a **developer**,
I want **App.tsx layout and routing extracted into components**,
So that **App.tsx becomes a simple composition root**.

**Prerequisites:**
- **PRESERVE** ScanContext provider in the provider composition
- Ensure ScanContext is composed at the correct level (app-wide)

**Acceptance Criteria:**

**Given** App.tsx contains inline JSX for providers, routing, and layout
**When** this story is completed
**Then:**
- Create components:
  - `src/components/App/AppProviders.tsx` - Composes all context providers **including ScanContext**
  - `src/components/App/AppRoutes.tsx` - Route definitions and navigation
  - `src/components/App/AppLayout.tsx` - Main layout wrapper (header, content, nav)
  - `src/components/App/AppErrorBoundary.tsx` - Top-level error handling
- AppProviders composition order (outer to inner):
  ```tsx
  <QueryClientProvider>      {/* React Query */}
    <AuthProvider>           {/* Auth state */}
      <ThemeProvider>        {/* Theme/dark mode */}
        <ScanProvider>       {/* PRESERVE - from Epic 14d-old */}
          <NavigationProvider>
            <AppStateProvider>
              {children}
            </AppStateProvider>
          </NavigationProvider>
        </ScanProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
  ```
- App.tsx line reduction deferred to 14c-refactor.20-22
- All routes continue to work
- Error boundaries catch and display errors properly
- **ScanContext functionality fully preserved**

**Points:** 3

---

### Story 14c.22a: Interim Cleanup (This Sprint)

> **Status:** ready-for-dev

As a **developer**,
I want **to integrate the existing handler hooks and extract view rendering JSX**,
So that **App.tsx reaches ~2,000 lines as an achievable interim target**.

**Background:**

Story 14c-refactor.22 revealed that the original 200-300 line target is unrealistic because:
- Handler hooks (useTransactionHandlers, useScanHandlers, etc.) require 26+ props each
- All state (47 useState, ~40 useCallback) remains in App.tsx
- The hooks moved logic but not state ownership

This interim story achieves meaningful cleanup without major architectural changes.

**Acceptance Criteria:**

1. **Given** useScanHandlers exists but is commented out in App.tsx
   **When** this story is completed
   **Then:**
   - useScanHandlers is integrated and functional
   - ~100 lines of scan handler code removed from App.tsx

2. **Given** useDialogHandlers exists but is commented out in App.tsx
   **When** this story is completed
   **Then:**
   - useDialogHandlers is integrated and functional
   - ~80 lines of dialog handler code removed from App.tsx

3. **Given** renderViewSwitch() is ~913 lines inline in App.tsx
   **When** this story is completed
   **Then:**
   - `src/components/App/viewRenderers.tsx` created
   - renderViewSwitch moved to separate file
   - App.tsx imports and uses the extracted function

4. **Given** overlay/modal rendering is ~656 lines inline in App.tsx
   **When** this story is completed
   **Then:**
   - `src/components/App/AppOverlays.tsx` created
   - All dialogs, modals, sheets extracted
   - App.tsx imports and uses AppOverlays

5. **Given** all extractions are complete
   **When** measuring App.tsx
   **Then:**
   - App.tsx is ~1,800-2,200 lines (down from ~4,800)
   - All tests pass
   - Build succeeds
   - Manual smoke test passes

**Points:** 3

---

### Story 14c.25: ViewHandlersContext (Next Sprint)

> **Status:** draft
> **NEXT SPRINT:** This story follows 14c-refactor.22a and requires it to be complete.

As a **developer**,
I want **a context to provide view handlers without prop drilling**,
So that **handler hooks don't require 26+ props and App.tsx can be further reduced**.

**Background:**

The handler hooks (useTransactionHandlers, useScanHandlers, useNavigationHandlers, useDialogHandlers) each require 17-26+ props because they need access to:
- User/auth state
- All state setters (setView, setCurrentTransaction, etc.)
- UI callbacks (setToastMessage, setShowDialog, etc.)

A ViewHandlersContext can expose these handlers via context, eliminating prop drilling.

**Acceptance Criteria:**

1. **Given** handler hooks require many props
   **When** this story is completed
   **Then:**
   - `src/contexts/ViewHandlersContext.tsx` created
   - Context provides: transaction, scan, navigation, dialog handlers
   - Handlers are stable references (useMemo)

2. **Given** view components need these handlers
   **When** this story is completed
   **Then:**
   - `useViewHandlers()` hook provides access to all handlers
   - Views consume handlers via context instead of props
   - Prop drilling reduced by ~60%

3. **Given** App.tsx currently passes handlers as props
   **When** this story is completed
   **Then:**
   - App.tsx wraps children with ViewHandlersProvider
   - Handler prop interfaces simplified
   - App.tsx reduced by ~200-400 additional lines

**Points:** 2

---

### Story 14c.26: View-Specific Prop Composition Hooks (Next Sprint)

> **Status:** draft
> **NEXT SPRINT:** This story follows 14c-refactor.25 and requires it to be complete.

As a **developer**,
I want **dedicated hooks that compose all props needed for each complex view**,
So that **view prop assembly is encapsulated, testable, and App.tsx becomes a minimal orchestrator**.

**Background:**

After ViewHandlersContext (14c-refactor.23) eliminates handler prop drilling, the remaining complexity in App.tsx is assembling data props for each view. Complex views like TransactionEditorView need 30-100 props combining:

- User data (user, preferences, credits)
- Transaction data (current transaction, items, mappings)
- UI state (mode, scan state, dialog state)
- Callbacks (now via context)

View-specific composition hooks encapsulate this assembly:

```typescript
// Before: 80 props defined inline in App.tsx
<TransactionEditorView
  user={user}
  transaction={currentTransaction}
  mode={transactionEditorMode}
  scanState={scanState}
  // ... 76 more props
/>

// After: Hook composes everything
const editorProps = useTransactionEditorViewProps();
<TransactionEditorView {...editorProps} />
```

**Acceptance Criteria:**

1. **Given** TransactionEditorView needs ~100 props
   **When** this story is completed
   **Then:**
   - useTransactionEditorViewProps() hook created
   - Hook composes all data props from existing hooks/context
   - App.tsx uses spread: `<TransactionEditorView {...editorProps} />`

2. **Given** TrendsView needs analytics state + callbacks
   **When** this story is completed
   **Then:**
   - useTrendsViewProps() hook created
   - Hook composes analytics initial state, pending filters

3. **Given** HistoryView needs filter state + pagination
   **When** this story is completed
   **Then:**
   - useHistoryViewProps() hook created
   - Hook composes filter state, transactions, pagination

4. **Given** BatchReviewView needs batch state + handlers
   **When** this story is completed
   **Then:**
   - useBatchReviewViewProps() hook created
   - Hook composes batch receipts, scan state

5. **Given** all composition hooks are integrated
   **When** measuring App.tsx
   **Then:**
   - App.tsx is ~800-1,000 lines (down from ~2,000)
   - renderViewSwitch() is clean with spread props
   - All tests pass
   - Build succeeds

**Points:** 3

---

### Story 14c.27: View Migration to ViewHandlersContext

> **Status:** ready-for-dev
> **Depends on:** 14c-refactor.25 (ViewHandlersContext)
> **Optional after:** 14c-refactor.26 (can run in parallel)

As a **developer**,
I want **views to consume handlers via useViewHandlers() instead of props**,
So that **handler props can be removed from view interfaces, reducing prop surface area and improving discoverability**.

**Background:**

Story 14c-refactor.25 created ViewHandlersContext infrastructure - handlers are AVAILABLE via context. Story 26 creates prop composition hooks for DATA props. This story migrates views to actually USE the context for handlers, removing handler callback props from view interfaces.

```typescript
// Before: Handlers passed via props
function TransactionEditorView({ onSaveTransaction, onDeleteTransaction, ... }) {
  const handleSave = () => onSaveTransaction(tx);
}

// After: Handlers from context
function TransactionEditorView({ /* data props only */ }) {
  const { transaction } = useViewHandlers();
  const handleSave = () => transaction.saveTransaction(tx);
}
```

**Acceptance Criteria:**

1. **Given** priority views receive handler props
   **When** this story is completed
   **Then:**
   - Views call `useViewHandlers()` to get handlers
   - Handler props removed from view interfaces
   - ViewRenderProps shrinks accordingly

2. **Given** all migrations are complete
   **When** testing
   **Then:**
   - All critical workflow paths work (scan, save, batch)
   - All tests pass (with ViewHandlersProvider wrapper)
   - Build succeeds

**Views to Migrate:**
- TransactionEditorView (~15 handler props)
- TrendsView (~5 handler props)
- BatchReviewView (~8 handler props)
- HistoryView, ItemsView, DashboardView, SettingsView (~2-4 each)

**Points:** 3

---

### Story 14c.12: Transaction Service Simplification

As a **developer**,
I want **transaction caching simplified to React Query only**,
So that **there's a single source of truth and no cache synchronization issues**.

**Acceptance Criteria:**

**Given** transactions use multiple cache layers (React Query + IndexedDB + localStorage)
**When** this story is completed
**Then:**
- Transaction fetching uses React Query as single cache layer
- Remove any IndexedDB caching for transactions (beyond shared groups)
- Remove localStorage caching for transactions
- React Query configured with appropriate staleTime and cacheTime:
  - `staleTime: 5 * 60 * 1000` (5 minutes)
  - `cacheTime: 30 * 60 * 1000` (30 minutes)
- Firestore offline persistence remains enabled (built-in caching)
- Transaction queries are simple and predictable
- No "works first time, fails second time" issues
- Performance remains acceptable (< 500ms for cached data)

**Points:** 5

---

### Story 14c.13: View Mode State Unification

As a **developer**,
I want **view mode state unified to a single source of truth**,
So that **there's no synchronization between localStorage, Firestore, and React state**.

**Acceptance Criteria:**

**Given** view mode is stored in localStorage, Firestore userPreferences, and React state
**When** this story is completed
**Then:**
- View mode state stored ONLY in React Context (in-memory)
- Remove `ViewModePreference` from `userPreferencesService.ts`
- Remove localStorage `viewModePreference` key usage
- Remove Firestore `viewModePreference` field writes
- On app load: default to "Personal" mode (no persistence needed for now)
- Epic 14d will implement proper persistence if needed
- No stale view mode state bugs
- Clean removal of ~150 lines from userPreferencesService.ts

**Points:** 3

---

## Part 3: Firebase & Infrastructure

**Goal:** Audit and optimize Firebase configuration per retrospective requirements.

---

### Story 14c.14: Firebase Indexes Audit

As a **developer**,
I want **Firestore composite indexes audited and optimized**,
So that **unused indexes are removed and query performance is optimal**.

**Acceptance Criteria:**

**Given** `firestore.indexes.json` contains composite index definitions
**When** this story is completed
**Then:**
- Review all composite indexes in `firestore.indexes.json`
- Remove indexes related to shared groups queries:
  - Any index on `sharedGroupIds` field
  - Any index combining `sharedGroupIds` with other fields
- Verify remaining indexes are actually used by queries
- Document each remaining index with a comment explaining its purpose
- Deploy updated indexes: `firebase deploy --only firestore:indexes`
- No query performance regressions for personal transactions

**Points:** 2

---

### Story 14c.15: Cloud Functions Audit

As a **developer**,
I want **all Cloud Functions audited and consolidated**,
So that **only necessary functions remain and naming is consistent**.

**Acceptance Criteria:**

**Given** `functions/src/` contains multiple Cloud Functions
**When** this story is completed
**Then:**
- Inventory all Cloud Functions with their purposes
- Identify and remove any unused functions
- Ensure consistent naming convention (camelCase)
- Verify all functions have proper error handling
- Update `functions/src/index.ts` exports to match
- Document each function's purpose in code comments
- Functions deploy successfully: `firebase deploy --only functions`
- Create `docs/architecture/cloud-functions.md` documenting all functions

**Points:** 3

---

### Story 14c.16: Firestore Cost Monitoring Setup

As a **product owner**,
I want **Firestore cost monitoring dashboards and alerts configured**,
So that **we can detect cost issues before Epic 14d launch**.

**Acceptance Criteria:**

**Given** Firestore costs are not currently monitored
**When** this story is completed
**Then:**
- Firebase Console budget alert configured:
  - Alert at 50% of monthly budget
  - Alert at 80% of monthly budget
  - Alert at 100% of monthly budget
- Google Cloud Monitoring dashboard created showing:
  - Daily read operations
  - Daily write operations
  - Daily delete operations
  - Storage usage
- Document monitoring setup in `docs/operations/cost-monitoring.md`
- Alerts send email to project owner

**Points:** 2

---

## Part 4: Quality & Validation

**Goal:** Ensure refactored code works correctly and is well documented.

---

### Story 14c.17: Test Suite Cleanup

As a **developer**,
I want **tests updated to reflect the refactored codebase**,
So that **the test suite passes and provides confidence in the changes**.

**Acceptance Criteria:**

**Given** tests exist for shared group functionality and App.tsx
**When** this story is completed
**Then:**
- Delete tests for removed files:
  - `sharedGroupTransactionService.test.ts`
  - `sharedGroupCache.test.ts`
  - `memberUpdateDetection.test.ts`
  - `useSharedGroupTransactions.test.ts`
- Update tests for stubbed services:
  - `sharedGroupService.test.ts` → test stub behavior
  - `useSharedGroups.test.ts` → test empty returns
- Add tests for new extracted contexts and hooks:
  - `AuthContext.test.tsx`
  - `useAppInitialization.test.ts`
- Firestore rules tests updated for simplified rules
- All tests pass: `npm test`
- Test coverage remains above 70%

**Points:** 3

---

### Story 14c.18: Integration Testing

As a **QA engineer**,
I want **full app smoke testing completed**,
So that **we have confidence no regressions were introduced**.

**Acceptance Criteria:**

**Given** significant refactoring has been done
**When** this story is completed
**Then:**
- Manual smoke test checklist completed:
  - [ ] App loads without errors
  - [ ] Login/logout works
  - [ ] Transaction creation works
  - [ ] Transaction editing works
  - [ ] Transaction deletion works
  - [ ] Receipt scanning works
  - [ ] History view loads
  - [ ] Dashboard displays correctly
  - [ ] Settings page works
  - [ ] Push notifications received (if configured)
  - [ ] Offline mode shows cached data
  - [ ] Deep links work
- Shared groups features show disabled/placeholder states
- No console errors during normal usage
- Performance acceptable (no noticeable slowdowns)
- Document any issues found

**Points:** 3

---

### Story 14c.19: Documentation Update

As a **developer**,
I want **architecture documentation updated**,
So that **future development has accurate reference material**.

**Acceptance Criteria:**

**Given** significant architecture changes were made
**When** this story is completed
**Then:**
- Update `docs/architecture/` with:
  - New App.tsx structure diagram
  - Context provider hierarchy
  - Simplified caching architecture
- Create `docs/architecture/epic-14c-refactor-summary.md`:
  - What was removed
  - What was refactored
  - New file structure
  - Decisions made and rationale
- Update README.md if needed
- Archive old shared groups documentation to `docs/archive/`
- Brainstorming session document finalized

**Points:** 2

---

## Part 5: Project Cleanup & Organization

**Goal:** Clean up project structure, consolidate configuration files, and organize documentation before Epic 14d.

---

### Story 14c.23: Test and Config File Consolidation

As a **developer**,
I want **test configuration files consolidated and root directory cleaned up**,
So that **the project root is uncluttered, test configs are organized, and the codebase is maintainable**.

**Acceptance Criteria:**

**Given** 22 vitest configuration files exist in the root directory
**When** this story is completed
**Then:**
- Create `tests/config/` directory and move all vitest CI configs there
- Move root documentation files (`run_app.local.md`, `steps_for_epics.md`) to appropriate `docs/` locations
- Delete temporary/generated files (log files, firebase exports)
- Update `package.json` scripts to reference new paths
- Update `.github/workflows/test.yml` to reference new paths
- Create `tests/config/README.md` documenting config file purposes
- CI pipeline passes after move
- Root directory reduced from ~50 files to ~30 files

**Points:** 3

---

### Story 14c.24: Documentation Consolidation and Folder Cleanup

As a **developer**,
I want **documentation consolidated, obsolete files removed, and non-code folders organized**,
So that **documentation is findable, up-to-date, and the project structure is clean for Epic 14d**.

**Acceptance Criteria:**

**Given** duplicate and misplaced documentation files exist
**When** this story is completed
**Then:**
- Delete duplicate files at `docs/` root (architecture-epic7.md, prd-epic7.md)
- Consolidate archive folders (`docs/.archive/` → `docs/archive/`)
- Move misplaced files to correct locations (branching-strategy.md → ci-cd/, etc.)
- Consolidate `docs/planning/` and `docs/planning-artifacts/`
- Move `docs/excalidraw-diagrams/` to `docs/architecture/diagrams/excalidraw/`
- Clean up non-code folders (`functions/_bmad/`, old backups, `test-results/`)
- Update `docs/README.md` and `docs/index.md` to reflect current structure
- Add "Project Structure" section to root `README.md`
- Evaluate and document decision for `docs/design-references/` (23MB) and `prompt-testing/`

**Points:** 3

---

### Story 14c.28: App.tsx Comment Consolidation

As a **developer maintaining the codebase**,
I want **App.tsx comments cleaned up and consolidated**,
So that **the file is readable without story reference noise, and comments provide meaningful context**.

**Acceptance Criteria:**

**Given** App.tsx has ~300 story reference comments (Story X.Y, AC #N patterns)
**When** this story is completed
**Then:**
- Story number references removed from inline comments
- Related props grouped under single descriptive comments
- Comments explaining "why" preserved, comments explaining "what" removed
- File header updated to describe responsibility (not implementation history)
- Zero changes to actual code logic (comments only)
- All tests still pass

**Points:** 1

**Story file:** [14c-refactor-28-app-comment-consolidation.md](stories/14c-refactor-28-app-comment-consolidation.md)

---

### Story 14c.29: App.tsx Prop Composition Integration

As a **developer maintaining App.tsx**,
I want **inline prop objects replaced with prop composition hook calls**,
So that **App.tsx is reduced from 4,200 lines to ~1,500-2,000 lines**.

**Background:**

This is the **missing integration step** that was deferred from Story 26. Story 26 created 4 prop composition hooks (`useHistoryViewProps`, `useTrendsViewProps`, `useBatchReviewViewProps`, `useTransactionEditorViewProps`) but integration into App.tsx was deferred to Story 27. Story 27 only migrated views to USE context, not to REMOVE the prop passing from App.tsx.

**Acceptance Criteria:**

**Given** 4 prop composition hooks exist and views use ViewHandlersContext
**When** this story is completed
**Then:**
- HistoryView, TrendsView, BatchReviewView, TransactionEditorView use hook spreads
- Deprecated handler props (`onBack`, `onNavigateToView`, etc.) removed from view calls
- App.tsx reduced from 4,200 to ~1,500-2,000 lines
- All tests pass

**Points:** 5

**Story file:** [14c-refactor-29-app-prop-composition-integration.md](stories/14c-refactor-29-app-prop-composition-integration.md)

---

## Story Dependencies

```
14c.1 (Cloud Functions) ──┐
14c.2 (Services) ─────────┼──► 14c.5 (Placeholder UI)
14c.3 (Hooks) ────────────┘
                              │
14c.4 (IndexedDB) ────────────┤
                              │
14c.6 (Firestore Script) ─────┼──► 14c.7 (Security Rules)
                              │
14c.8 (Dead Code) ────────────┘

14c.9 (Contexts) ──► 14c.10 (Hooks) ──► 14c.11 (Components)
                                              │
14c.12 (Transaction Service) ─────────────────┤
                                              │
14c.13 (View Mode) ───────────────────────────┘

14c.14 (Indexes) ──┐
14c.15 (Functions) ┼──► 14c.16 (Monitoring)
                   │
All Part 1-3 ──────┴──► 14c.17 (Tests) ──► 14c.18 (Integration) ──► 14c.19 (Docs)
                                                                          │
                                                     ┌────────────────────┘
                                                     ▼
                                         14c.23 (Config Consolidation)
                                                     │
                                                     ▼
                                         14c.24 (Docs Consolidation)
                                                    │
                                                    ▼
                                        14c.28 (Comment Cleanup)

14c.26 (Prop Hooks) ──┬──► 14c.29 (Prop Integration) ──► App.tsx ~1,500-2,000 lines
14c.27 (Context Migration) ─┘
```

---

## Recommended Execution Order

**Sprint 1 (Focus: Cleanup)**
1. 14c.1 - Stub Cloud Functions
2. 14c.2 - Stub Services
3. 14c.3 - Stub Hooks
4. 14c.4 - Clean IndexedDB Cache
5. 14c.5 - Placeholder UI States
6. 14c.8 - Remove Dead Code

**Sprint 2 (Focus: Data & Rules)**
7. 14c.6 - Firestore Data Cleanup Script
8. 14c.7 - Security Rules Simplification
9. 14c.14 - Firebase Indexes Audit
10. 14c.15 - Cloud Functions Audit

**Sprint 3 (Focus: Refactor)**
11. 14c.9 - App.tsx Decomposition - Contexts
12. 14c.10 - App.tsx Decomposition - Hooks
13. 14c.11 - App.tsx Decomposition - Components
14. 14c.12 - Transaction Service Simplification
15. 14c.13 - View Mode State Unification

**Sprint 4 (Focus: Quality)**
16. 14c.16 - Firestore Cost Monitoring Setup
17. 14c.17 - Test Suite Cleanup
18. 14c.18 - Integration Testing
19. 14c.19 - Documentation Update

**Sprint 5 (Focus: Project Cleanup)**
20. 14c.23 - Test and Config File Consolidation
21. 14c.24 - Documentation Consolidation and Folder Cleanup
22. 14c.28 - App.tsx Comment Consolidation
23. 14c.29 - App.tsx Prop Composition Integration (CRITICAL - line reduction)

---

## Success Criteria for Epic 14c

- [ ] All shared group backend code removed or stubbed
- [ ] App.tsx reduced from ~4200 lines to ~1500-2000 lines (via Story 29)
- [ ] Single caching layer (React Query only)
- [ ] View mode state unified
- [ ] All tests passing
- [ ] No console errors in production build
- [ ] Firestore cost monitoring active
- [ ] Documentation updated
- [ ] Root directory cleaned up (~30 files vs ~50)
- [ ] Test configs consolidated to `tests/config/`
- [ ] Documentation folders organized and indexed
- [ ] Clean foundation ready for Epic 14d

---

## References

- [Epic 14c Retrospective](../epic-14c-retro-2026-01-20.md)
- [Brainstorming Session](../../analysis/brainstorming-session-2026-01-21.md)
- [Epic 14d Definition (Shared Groups v2)](../epic14d-shared-groups-v2/epics.md)
- [Epic 14d-old (Scan Refactor) - COMPLETED](../epic14d-refactor-old/epic-14d-scan-architecture-refactor.md) - Prior art for App.tsx refactoring
- [Scan Architecture Plan](../epic14d-refactor-old/scan-architecture-refactor-plan.md) - Details on ScanContext implementation

---

*Generated from Brainstorming Session 2026-01-21*
*Epic: 14c-refactor*
*Updated: 2026-01-21 - Added prior art references from Epic 14d-old*
*Updated: 2026-01-22 - Added Part 5: Project Cleanup stories (14c.23, 14c.24)*
*Updated: 2026-01-23 - Added Story 14c.28: App.tsx Comment Consolidation*
*Updated: 2026-01-23 - Added Story 14c.29: App.tsx Prop Composition Integration (missing line reduction step)*
