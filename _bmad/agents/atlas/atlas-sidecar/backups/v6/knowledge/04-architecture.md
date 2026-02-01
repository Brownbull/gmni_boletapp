# Architectural Decisions & Patterns

> Section 4 of Atlas Memory
> Last Sync: 2026-01-24
> Last Optimized: 2026-01-24 (Generation 5)
> Sources: architecture.md, ADRs, tech-spec documents

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React 18 + TypeScript + Vite | PWA with mobile-first design |
| Styling | Tailwind CSS + CSS Custom Properties | Runtime theme switching |
| State | React Context + React Query | Analytics nav, auth, Firestore caching |
| Backend | Firebase (Auth, Firestore, Storage, Functions) | Serverless architecture |
| AI/ML | Google Gemini 2.0 Flash | Receipt OCR via Cloud Function |
| Testing | Vitest + Playwright | 84%+ coverage, 3100+ tests |
| CI/CD | GitHub Actions → Firebase Hosting | Auto-deploy on main merge |

## Data Model

```
users/{userId}/
  transactions/{transactionId}
  categoryMappings/{mappingId}
  merchantMappings/{mappingId}
  subcategoryMappings/{mappingId}
  userInsightProfile
  trustedMerchants/{merchantId}
  insightRecords/{insightId}
  groups/{groupId}
```

## Architectural Decisions (ADRs)

| ADR | Decision | Status |
|-----|----------|--------|
| ADR-010 | React Context for Analytics State | Active |
| ADR-011 | Chart Registry Pattern | Active |
| ADR-012 | Month-Aligned Weeks | Active |
| ADR-015 | Client-Side Insight Engine | Active |
| ADR-016 | Hybrid Insight Storage (local-first + Firestore) | Active |
| ADR-017 | Phase-Based Insight Priority | Active |
| ADR-018 | Quick Save Confidence Scoring (85% threshold) | Active |
| ADR-019 | Trust Merchant Auto-Save | Active |
| ADR-020 | Scan State Machine | Active |

## Key Patterns

### Security Rules
- All user data scoped by `request.auth.uid == userId`
- Cross-user access impossible by design

### Code Organization
```
src/
├── components/   # Reusable UI components
├── views/        # Page-level components
├── services/     # Firebase, Gemini API
├── hooks/        # Custom React hooks
├── contexts/     # React contexts (Auth, Scan, HistoryFilters)
├── types/        # TypeScript interfaces
├── utils/        # Pure utility functions
└── config/       # Constants, prompts
```

---

## AI Prompt System (V3 - Current)

### Prompt Architecture
- **Single Source of Truth**: `shared/schema/categories.ts` (36 store + 39 item categories)
- **Production Prompt**: `prompt-testing/prompts/v3-category-standard.ts`
- **Token Savings**: 21% smaller than V2 (~229 tokens/scan saved)
- **Currency**: AI auto-detects from receipt (no app hint needed)

### V3 Key Rules
1. Extract ALL visible line items (max 100)
2. MUST have at least one item (Rule #10)
3. Store category = type of establishment
4. Item category = what the item IS
5. Currency can be null (app asks user)

**Reference**: `prompt-testing/TOKEN-ANALYSIS.md`

---

## React Query Integration (Story 14.29)

> **Full Docs**: `docs/architecture/react-query-caching.md`

| File | Purpose |
|------|---------|
| `src/lib/queryClient.ts` | QueryClient (global defaults) |
| `src/lib/queryKeys.ts` | Hierarchical cache keys |
| `src/hooks/useFirestoreSubscription.ts` | Real-time subscriptions + cache |
| `src/hooks/useFirestoreQuery.ts` | One-time fetch hook |
| `src/hooks/useFirestoreMutation.ts` | Mutations with cache invalidation |

**Global Defaults** (`queryClient.ts`):
```typescript
staleTime: 5 * 60 * 1000,    // 5 minutes
gcTime: 30 * 60 * 1000,      // 30 minutes
refetchOnMount: false,        // Use cached data
refetchOnWindowFocus: true,   // Catch updates while user was away (multi-device)
refetchOnReconnect: false,    // Firestore handles reconnection internally
```

**Per-Hook Overrides** (Story 14c.20):
- Shared group transactions: `staleTime: 1hr`, `gcTime: 24hr` (cost optimization)
- See "Shared Group Cache Optimization" section below

**Critical Pattern**: Use refs for subscribeFn to avoid infinite loops. See `06-lessons.md` for pitfalls.

---

## Firestore Cost Optimization (Stories 14.25-14.27)

### LISTENER_LIMITS Constant
```typescript
export const LISTENER_LIMITS = {
    TRANSACTIONS: 100,
    GROUPS: 50,
    TRUSTED_MERCHANTS: 200,
    MAPPINGS: 500,
} as const;
```

**Result**: ~$19/week → ~$1/week (95% reduction)

---

## Scan State Machine (Epic 14d) - COMPLETE

> **Full Spec**: `docs/sprint-artifacts/epic14d/scan-request-lifecycle.md`

### Core Types
```typescript
type ScanPhase = 'idle' | 'capturing' | 'scanning' | 'reviewing' | 'saving' | 'error';
type ScanMode = 'single' | 'batch' | 'statement';
```

### Key Decisions (ADR-020)
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Request Precedence | Active blocks new | Prevent data loss |
| Persistence | No expiration | User never loses work |
| Batch State | ScanContext owns all | Single source of truth |
| Credits | Reserve→Confirm/Refund | Fair billing |

### Critical Patterns (from Epic 14d)

**Atomic State Updates:** Pass compound data in action payload, not separate dispatches.
```typescript
// BATCH_COMPLETE includes batchReceipts to prevent race conditions
dispatch({ type: 'BATCH_COMPLETE', payload: { batchReceipts } });
```

**Batch Edit Thumbnails:** Set `thumbnailUrl` on transaction, NOT via `setScanImages()` (requires wrong phase).

**Callback Integration:** Hooks accept optional callbacks; caller controls dispatch timing.

### Computed Values
| Value | Logic | Use |
|-------|-------|-----|
| `hasActiveRequest` | `phase !== 'idle'` | Block new scans |
| `canNavigateFreely` | `isIdle \|\| (!hasDialog && !isProcessing)` | Nav control |

### Provider Placement
```tsx
<QueryClientProvider><AuthProvider><ScanProvider>{/* App */}</ScanProvider></AuthProvider></QueryClientProvider>
```

---

## Filter Persistence Pattern (Story 14.13b)

### Data Flow
```
TrendsView drill-down → buildSemanticDrillDownPath() → HistoryNavigationPayload.drillDownPath
    ↓
App.tsx handleNavigateToHistory → pendingHistoryFilters.category.drillDownPath
    ↓
HistoryView/ItemsView → matchesCategoryFilter() checks all dimensions
```

### Behavior
- **Persist when**: Navigating within history/items/transaction-editor views
- **Clear when**: Navigating from outside (dashboard, settings, analytics)
- **Default**: Current month (not "all time")

**Reference**: `src/contexts/HistoryFiltersContext.tsx`

---

## Key Component Patterns

### Quick Save Confidence Scoring
| Field | Weight |
|-------|--------|
| merchant | 20% |
| total | 25% |
| date | 15% |
| category | 15% |
| items | 25% |

**Threshold**: >= 85% shows QuickSaveCard

### Trust Merchant Flow
```
First Save → TrustMerchantPrompt → User confirms → Stored
Second Scan → checkMerchantTrust() → Auto-categorize + Quick Save
```

### Transaction Editor (Story 14.23)
- **Mode Prop**: `mode: 'new' | 'existing'`
- **State Machine**: `idle → pending → scanning → complete | error`
- **Unified**: Replaces ScanResultView + EditView

### PWA Viewport
- Dynamic viewport: `h-[100dvh]` with `vh` fallback
- Safe area insets: `env(safe-area-inset-bottom)` for nav
- Touch targets: Minimum 44px

---

## Input Sanitization

**File**: `src/utils/sanitize.ts`

Functions: `sanitizeMerchantName`, `sanitizeItemName`, `sanitizeLocation`, `sanitizeSubcategory`

**Patterns Blocked**: Script tags, event handlers, protocol attacks, control characters

---

## Epic Progress Summary

| Epic | Status | Key Patterns |
|------|--------|--------------|
| Epic 10-13 | COMPLETE | Insight engine, batch processing, design system |
| Epic 14 | 25/26 done | React Query, Firestore optimization, unified editor |
| Epic 14d | ✅ COMPLETE | Scan state machine, navigation blocking |

---

## Story 14.40: Category Statistics Popup (2026-01-13)

**Pattern:** Modal popup with statistics aggregation on category icon tap

**Components Created:**
- `CategoryStatisticsPopup` - Modal following InsightDetailModal pattern
- `useCategoryStatistics` - Hook with useMemo for efficient recalculation
- `statisticsUtils.ts` - calculateMedian, calculateBasicStats, findMostFrequent

**Key Decisions:**
- Price Trend (periodComparison) returns `null` - deferred to future story
- Store-group filtering uses `STORE_CATEGORY_GROUPS` mapping (English keys)
- Popup integrated into TrendsView via `handleOpenStatsPopup` callback

**Testing:** 46 tests (16 component + 16 utils + 14 hook)

---

## Epic 14c: Household Sharing (2026-01-15)

**Pattern:** Top-level Firestore collections for cross-user access

**New Collections:**
- `/sharedGroups/{groupId}` - Shared household groups
- `/pendingInvitations/{invitationId}` - Email-based invitations

**ADR-011:** Hybrid Model Architecture
- Top-level collections enable cross-user read access
- Members array with max 10 members per group
- Owner controls group settings, members can only add themselves

**Security Rules Helper Functions:**
- `isGroupMember()` - UID in members array
- `isGroupOwner()` - UID matches ownerId
- `isJoiningGroup()` - User accepting invitation
- `isInvitedUser()` - Email matches auth token

**Reference:** `docs/architecture/architecture.md` (ADR-011)

**Error Handling (Story 14c.11):**
- `src/lib/sharedGroupErrors.ts` - Error types and classification
- `src/components/SharedGroups/SharedGroupError.tsx` - Unified error UI
- `src/components/SharedGroups/SharedGroupErrorBoundary.tsx` - React error boundary
- Error categories: Recoverable, Non-recoverable, Temporary (network), Degraded (storage)
- IndexedDB quota exceeded triggers cleanup + fallback to in-memory

**Share Link Deep Linking (Story 14c.17):**
- `src/utils/deepLinkHandler.ts` - URL parsing for `/join/{shareCode}` pattern
- `src/hooks/useJoinLinkHandler.ts` - State machine for join flow (idle→loading→confirming→joining→success|error)
- `src/components/SharedGroups/JoinGroupDialog.tsx` - WCAG 2.1 AA compliant join confirmation dialog
- sessionStorage for pending join codes (unauthenticated flow)
- Existing functions reused: `getSharedGroupPreview()`, `joinByShareCode()`
- Auto-switches to group mode after successful join

---

## Firebase Cloud Functions (Documented 2026-01-15)

**Functions:**
| Function | Type | Purpose |
|----------|------|---------|
| `analyzeReceipt` | HTTPS Callable | Receipt OCR, image processing, storage |
| `onTransactionDeleted` | Firestore Trigger | Cascade delete images |

**analyzeReceipt Details:**
- Rate limit: 10/min per user
- Image validation: 10MB max, 5 images max
- Gemini model: `gemini-2.0-flash`
- Prompt versioning: V1, V2, V3 (V3 current)

**Reference:** `docs/architecture/api-contracts.md`

**Secret Manager Migration (Story 14c.14):**
- Deprecated: `functions.config().gemini?.api_key` (removed March 2026)
- Production: Secret Manager via `.runWith({ secrets: ['GEMINI_API_KEY'] })`
- Local: `functions/.env` file (gitignored)
- Error handling: Descriptive message guides developers to correct setup

---

**View Mode Persistence (Story 14c.18):**
- Firestore path: `artifacts/{appId}/users/{userId}/preferences/settings.viewModePreference`
- Schema: `{ mode: 'personal' | 'group', groupId?: string, updatedAt?: Timestamp }`
- Coordination hook: `useViewModePreferencePersistence` orchestrates context + Firestore + validation
- Debounced save: 1-second setTimeout for Firestore, localStorage immediate
- Group validation: `validateAndRestoreMode(groups)` verifies membership before restoring group mode

---

## Shared Group Cache Optimization (ARCHIVED - Epic 14c Reverted)

> ⚠️ **ARCHIVED:** Epic 14c was reverted 2026-01-20. This pattern documented for future reference.
> See `docs/sprint-artifacts/epic-14c-retro-2026-01-20.md` for failure analysis.
> Epic 14d-v2 uses changelog-driven sync instead.

**Key Lessons (preserved for Epic 14d-v2):**
- Delta sync cannot detect transaction REMOVALS
- Aggressive caching (1hr stale) breaks cross-user sync
- `resetQueries()` before `invalidateQueries()` to clear in-memory cache
- `refetchType: 'all'` needed for inactive queries

---

## Epic 14c-refactor: Service Stubbing Pattern (2026-01-21)

**Pattern:** Replace full service implementations with type-safe stubs during feature cleanup

### Stub Service Pattern

```typescript
// Mutating functions throw error
export async function createSharedGroup(...): Promise<SharedGroup> {
    throw new Error('Feature temporarily unavailable');
}

// Query functions return empty results
export async function getSharedGroupsForUser(...): Promise<SharedGroup[]> {
    return [];
}

// Subscription functions call callback immediately with empty data
export function subscribeToSharedGroups(
    _db: Firestore,
    _userId: string,
    onUpdate: (groups: SharedGroup[]) => void,
    _onError?: (error: Error) => void
): Unsubscribe {
    onUpdate([]);  // Immediate callback with empty data
    return () => {};  // No-op unsubscribe
}
```

### Key Decisions

| Decision | Rationale |
|----------|-----------|
| Stub vs Delete | Runtime import dependencies require stub files to exist |
| Preserve Types | `JoinError`, `InvitationError`, `LeaveGroupError` for backwards compatibility |
| Preserve Utilities | `generateShareCode`, `getShareLink`, `isShareCodeExpired` - no network calls |
| Keep JSDoc | Document STUB status clearly for future developers |

### Files Affected
- `src/services/sharedGroupService.ts` (~1325 → ~405 lines)
- `src/services/sharedGroupTransactionService.ts` (~720 → ~122 lines)

**Reference:** Story 14c-refactor.2

### Hook Stub Pattern (Story 14c-refactor.3)

```typescript
// Hook stub returns empty state, uses useMemo/useCallback for stable references
export function useUserSharedGroups(_db: Firestore, _userId: string | undefined): UseUserSharedGroupsResult {
    const getGroupById = useCallback((_groupId: string) => undefined, []);
    return useMemo(() => ({
        groups: [], isLoading: false, error: undefined, groupCount: 0, hasGroups: false, getGroupById
    }), [getGroupById]);
}
```

**Files Deleted:**
- `src/hooks/useSharedGroupTransactions.ts` (697 lines) - React Query + IndexedDB hook

**Files Stubbed:**
- `src/hooks/useSharedGroups.ts` (83 → 44 lines)
- `src/hooks/useUserSharedGroups.ts` (145 → 85 lines)

**App.tsx Changes:**
- Removed `useSharedGroupTransactions`, `useNotificationDeltaFetch` calls
- Removed `detectMemberUpdates` useEffect block
- Added inline stub values for shared group transactions

**Reference:** Story 14c-refactor.3

### IndexedDB Migration Pattern (Story 14c-refactor.4)

**Pattern:** One-time migration scripts for clearing legacy client-side storage

```typescript
// src/migrations/clearSharedGroupCache.ts
const MIGRATION_KEY = 'boletapp_migrations_v1';

export async function clearLegacySharedGroupCache(): Promise<void> {
    const migrations = JSON.parse(localStorage.getItem(MIGRATION_KEY) || '{}');
    if (migrations['shared_group_cache_cleared']) return;

    try {
        await new Promise<void>((resolve) => {
            const request = indexedDB.deleteDatabase('boletapp_shared_groups');
            request.onsuccess = () => resolve();
            request.onerror = () => resolve();  // Mark complete to avoid retry loops
            request.onblocked = () => resolve();
        });
    } catch (err) { /* graceful handling */ }

    migrations['shared_group_cache_cleared'] = Date.now();
    localStorage.setItem(MIGRATION_KEY, JSON.stringify(migrations));
}
```

**Key Decisions:**

| Decision | Rationale |
|----------|-----------|
| localStorage tracking | Survives page refreshes, simple, reliable |
| Fire-and-forget call | Non-blocking app startup |
| Mark complete on error | Prevent infinite retry loops |
| Console log only in DEV | Clean production experience |

**Integration:** Call from `main.tsx` before React render (non-blocking):
```typescript
clearLegacySharedGroupCache().catch(console.error);
```

**Reference:** Story 14c-refactor.4

---

## App-Level Hook Pattern (Story 14c-refactor.10)

**Pattern:** Extract cross-cutting concerns into app-level coordination hooks

### Hook Directory Structure

```
src/hooks/app/
├── index.ts                    # Barrel exports
├── useAppInitialization.ts     # Auth + services coordination
├── useAppLifecycle.ts          # Foreground/background, beforeunload
├── useAppPushNotifications.ts  # Push notifications coordination
├── useDeepLinking.ts           # URL deep link handling
└── useOnlineStatus.ts          # Network connectivity monitoring
```

### Key Patterns

| Pattern | Implementation |
|---------|----------------|
| Wrapper Hooks | New hooks wrap existing hooks rather than replacing them |
| Refs for Callbacks | All hooks use refs for callbacks to prevent useEffect churn |
| Derived State | `useMemo` for computed values (isJoining, isPendingAuth, isPushEnabled) |
| SSR Safety | Check `typeof window/document/navigator !== 'undefined'` |

### Usage Example

```typescript
// Coordination hooks wrap base hooks for app-level concerns
const { isOnline, wasOffline } = useOnlineStatus({
    onOffline: () => setToastMessage({ text: 'Sin conexión', type: 'info' }),
});

const { isInForeground, registerBeforeUnloadGuard } = useAppLifecycle({
    onBackground: () => saveState(),
});
```

**Reference:** Story 14c-refactor.10, tests/unit/hooks/app/

---

## Transaction & Scan Handler Hooks (Story 14c-refactor.20)

**Pattern:** Extract App.tsx handler logic into testable hooks with props-based dependency injection

### Hook Directory Structure (Extended)

```
src/hooks/app/
├── index.ts                    # Barrel exports
├── useAppInitialization.ts     # Auth + services coordination
├── useAppLifecycle.ts          # Foreground/background, beforeunload
├── useAppPushNotifications.ts  # Push notifications coordination
├── useDeepLinking.ts           # URL deep link handling
├── useOnlineStatus.ts          # Network connectivity monitoring
├── useTransactionHandlers.ts   # Transaction CRUD (save, delete, wipe, export)
├── useScanHandlers.ts          # Scan dialog/utility handlers (not integrated)
├── useNavigationHandlers.ts    # View navigation, filter clearing, scroll position ← NEW
└── useDialogHandlers.ts        # Toast, credit modal, conflict dialog ← NEW (not integrated)
```

### Key Patterns

| Pattern | Implementation |
|---------|----------------|
| Props-based injection | Pass callbacks/services as props, not internal context |
| Fire-and-forget Firestore | Don't await in critical path (offline persistence) |
| useCallback stability | All handlers wrapped with exhaustive deps |
| useMemo for result | Return object wrapped in useMemo |
| Incremental extraction | Complex functions (processScan) stay in App.tsx with TODO for future |

### Integration Status

| Hook | Status | Lines | Tests |
|------|--------|-------|-------|
| useTransactionHandlers | ✅ Integrated | ~520 | 36 |
| useScanHandlers | ⏳ Created, not integrated | ~825 | 69 |
| useNavigationHandlers | ✅ Integrated | ~280 | 38 |
| useDialogHandlers | ⏳ Created, not integrated | ~285 | 26 |

**Reference:** Story 14c-refactor.20, 14c-refactor.20a, 14c-refactor.20b, 14c-refactor.21

---

## ViewHandlersContext Migration Pattern (Story 14c-refactor.27)

**Pattern:** Migrate views from handler props to context consumption incrementally

### Architecture

```
App.tsx
   ↓
ViewHandlersProvider (wraps view rendering area)
   ↓ provides
{ transaction, scan, navigation, dialog } handler bundles
   ↓ consumed by
Views via useViewHandlers() hook
```

### Migration Strategy

| Phase | Action | Status |
|-------|--------|--------|
| 1 | Create ViewHandlersContext + Provider | ✅ Story 25 |
| 2 | Add useViewHandlers() to views | ✅ Story 27 |
| 3 | Mark old props @deprecated | ✅ Story 27 |
| 4 | Keep props for backward compatibility | ✅ Current state |
| 5 | Remove deprecated props | ⏳ TODO(14c-refactor.29) |

### Views Migrated (7/9)

| View | Handlers from Context |
|------|----------------------|
| TransactionEditorView | dialog.showToast, dialog.openCreditInfoModal |
| TrendsView | navigation.handleNavigateToHistory, navigation.navigateBack |
| BatchReviewView | navigation.navigateBack, dialog.openCreditInfoModal |
| HistoryView | navigation.navigateBack, navigation.navigateToView |
| ItemsView | navigation.navigateBack, navigation.navigateToView |
| DashboardView | navigation.handleNavigateToHistory |
| SettingsView | dialog.showToast (with type wrapper) |

### Deferred Views

- **InsightsView** - Complex `onMenuClick`/`onProfileClick` callback pattern
- **ReportsView** - Complex drill-down navigation pattern

**Rationale:** These views have menu/profile callbacks that interact with navigation in ways that need separate analysis to avoid conflicts with context handlers.

### Key Files

- `src/contexts/ViewHandlersContext.tsx` - Context + Provider + useViewHandlers()
- `src/components/App/viewRenderers.tsx` - Migration status documentation
- `tests/setup/test-utils.tsx` - createMockViewHandlers() for tests

**Reference:** Story 14c-refactor.25, 14c-refactor.27

---

## Hook-to-View Type Conversion Pattern (Story 14c-refactor.31b)

**Pattern:** Composition hooks return plain objects for JSON compatibility; views may expect different types.

### Example: spendingByMember

```typescript
// Hook returns plain object (composable, serializable)
export interface SpendingByMember {
    [userId: string]: number;
}

// TrendsViewProps expects Map
spendingByMember?: Map<string, number>;

// Conversion at render time
spendingByMember={new Map(Object.entries(trendsViewDataProps.spendingByMember))}
```

### Key Decisions

| Decision | Rationale |
|----------|-----------|
| Hooks return plain objects | JSON-compatible, easier testing, composable |
| Views own type conversion | View-level concern, keeps hooks pure |
| Document in both places | JSDoc in hook + story notes |

**Reference:** Story 14c-refactor.31b

---

## Sync Notes

### Generation 5 (2026-01-24)
- Archived Epic 14c cache optimization (reverted)
- Consolidated Epic 14c-refactor patterns

### Key Patterns Added (2026-01-21 to 2026-01-25)
| Pattern | Source |
|---------|--------|
| Service/Hook Stubbing | Epic 14c-refactor.2-3 |
| IndexedDB Migration | Epic 14c-refactor.4 |
| App-Level Hooks | Epic 14c-refactor.10 |
| Handler Extraction | Epic 14c-refactor.20-21 |
| ViewHandlersContext | Epic 14c-refactor.25-27 |
| Hook-to-View Type Conversion | Epic 14c-refactor.31b |
| Zustand Store Foundation | Epic 14e-6a |
| Settings Store Extension | Epic 14e-35 (locale migration) |
| Transaction Editor Store | Epic 14e-36a/b/c (App.tsx state migration) |

---

## Zustand Store Pattern (Epic 14e - Story 14e-6a)

**Pattern:** Feature-based Zustand store with phase guards

### Store Structure
```typescript
// src/features/scan/store/useScanStore.ts
export const useScanStore = create<ScanState & ScanActions>()(
  devtools(
    (set, get) => ({
      ...initialScanState,

      _guardPhase: (expected, actionName) => {
        const state = get();
        if (!allowed.includes(state.phase)) {
          if (import.meta.env.DEV) {
            console.warn(`[ScanStore] ${actionName} blocked...`);
          }
          return false;
        }
        return true;
      },

      startSingle: (userId) => {
        if (!get()._guardPhase('idle', 'startSingle')) return;
        set({ ...newState }, false, 'scan/startSingle');
      },
    }),
    { name: 'scan-store', enabled: import.meta.env.DEV }
  )
);
```

### Key Decisions
| Decision | Rationale |
|----------|-----------|
| DevTools DEV-only | `enabled: import.meta.env.DEV` prevents prod overhead |
| Phase guard helper | `_guardPhase()` as internal action for DRY |
| Action naming | `scan/{actionName}` for DevTools visibility |
| Type reuse | Import from @/types, no duplication |

**Reference:** Story 14e-6a-scan-zustand-store-foundation, Story 14e-6b-scan-zustand-store-complete

**Story 14e-6b Additions (2026-01-25):**
- 21 additional actions: DIALOG_*, RESULT_*, SAVE_*, BATCH_*, CONTROL
- resolveDialog takes `(type, result)` for type validation matching original reducer
- Pre-scan options (SET_STORE_TYPE, SET_CURRENCY) tracked for 14e-6c

**Story 14e-6c Additions (2026-01-25) - Selectors & Module Exports:**
- 14 memoized selector hooks: useScanPhase, useScanMode, useHasActiveRequest, useIsProcessing, useIsIdle, useHasError, useHasDialog, useIsBlocking, useCreditSpent, useCanNavigateFreely, useCanSave, useCurrentView, useImageCount, useResultCount
- useScanActions hook uses `useShallow` from `zustand/react/shallow` for stable object references
- Direct access: `getScanState()` and `scanActions` object for non-React code (services)
- Module exports: `@features/scan` barrel re-exports entire store module
- Type convenience exports in store/index.ts

- Code review learnings in 06-lessons.md
- Story details in docs/sprint-artifacts/

**Story 14e-12a/12b Additions (2026-01-26) - Batch Review Store:**
- Second Zustand store following scan store pattern: `useBatchReviewStore`
- 6 save/edit actions: `saveStart`, `saveItemSuccess`, `saveItemFailure`, `saveComplete`, `startEditing`, `finishEditing`
- Phase guards inline (not via helper) with DEV-only console.warn
- `startEditing` validates receipt exists before phase transition
- `saveComplete` transitions to `complete` (any success) or `error` (all failed)
- Action naming: `batch-review/{actionName}` for DevTools
- 78 tests covering phase transition matrix and edge cases
- Reference: `src/features/batch-review/store/`

**Story 14e-13 Additions (2026-01-26) - Batch Review Selectors:**
- 14 memoized selector hooks following scan store pattern
- Phase selectors: useBatchReviewPhase, useIsBatchReviewing, useIsEditing, useIsSaving, useIsComplete, useHasBatchError
- Data selectors: useBatchItems, useCurrentBatchItem, useCurrentBatchIndex, useEditingReceiptId
- Computed selectors: useBatchProgress (useShallow for object), useBatchTotalAmount, useValidBatchCount, useIsBatchEmpty
- useBatchReviewActions hook uses `useShallow` for stable object references
- Direct access: `getBatchReviewState()` and `batchReviewActions` for non-React code
- Module exports: `@features/batch-review` barrel re-exports entire store module

**Story 14e-25a.1 Additions (2026-01-27) - Navigation Store:**
- Third Zustand store for app-wide navigation state: `useNavigationStore`
- State: view, previousView, settingsSubview, scrollPositions, pendingHistoryFilters, pendingDistributionView, analyticsInitialState
- Actions: setView (auto-tracks previousView), navigateToView (with cross-view options), navigateBack, setSettingsSubview, saveScrollPosition, getScrollPosition, clearPendingFilters, clearAnalyticsInitialState, setPendingHistoryFilters, setPendingDistributionView, setAnalyticsInitialState
- Typed selectors: useCurrentView, usePreviousView, useSettingsSubview, usePendingHistoryFilters, usePendingDistributionView, useAnalyticsInitialState
- useNavigationActions hook uses `useShallow` for stable object references
- Convenience hook: useNavigation returns view state + common actions combined
- Direct access: `getNavigationState()` and `navigationActions` for non-React code
- View type relocated: `src/app/types.ts` (re-exported from `src/components/App/types.ts` for backward compatibility)
- 42 unit tests covering all actions, selectors, and direct access patterns
- Reference: `src/shared/stores/useNavigationStore.ts`
- 56 tests covering all selectors and direct access functions
- Code review fix: Test stability verification extended to all 11 actions (was only 4)

**Story 14e-36a/b/c Additions (2026-01-29) - Transaction Editor Store:**
- Fourth Zustand store replacing 7 useState calls from App.tsx: `useTransactionEditorStore`
- State: currentTransaction, navigationList, mode, isReadOnly, creditUsedInSession, animateItems, isSaving
- Actions: setTransaction, clearTransaction, setMode, setReadOnly, setCreditUsed, setAnimateItems, setNavigationList, setSaving, reset
- Individual selectors: useCurrentTransaction, useEditorMode, useIsReadOnly, useIsSaving, useAnimateItems, useCreditUsedInSession, useNavigationList
- Computed selectors: useIsEditing, useCanNavigate, useHasUnsavedChanges
- useTransactionEditorActions hook uses `useShallow` for stable object references
- Direct access: `getTransactionEditorState()` and `transactionEditorActions` for non-React code
- Handler hook migration: `useTransactionEditorHandlers` now reads from store instead of props (17→8 props)
- 79 tests covering store, selectors, computed selectors, actions hook, direct access
- Reference: `src/features/transaction-editor/store/`

**Story 14e-14a Additions (2026-01-26) - Batch Review Handlers:**
- Handler directory: `src/features/batch-review/handlers/` with barrel exports
- `BatchNavigationContext` interface for props-based dependency injection (follows processScan pattern)
- `navigateToPreviousReceipt` and `navigateToNextReceipt` handlers extracted from App.tsx
- `buildTransactionWithThumbnail(receipt)` helper eliminates code duplication
- 19 tests covering bounds checking, navigation, thumbnail handling, edge cases
- Code review fix: Added empty array edge case test for test symmetry
- Reference: `src/features/batch-review/handlers/`

**Story 14e-14b Additions (2026-01-26) - Batch Edit & Save Handlers:**
- `BatchEditContext`, `SaveContext`, `SaveCompleteContext` interfaces for dependency injection
- `editBatchReceipt(receipt, batchIndex, context)` - Converts 1-based UI index to 0-based, injects thumbnail URL
- `saveBatchTransaction(transaction, context)` - Auth check, category/merchant/item name mappings, Firestore save
- `handleSaveComplete(transactions, context)` - Reset state, show BATCH_COMPLETE dialog, navigate to dashboard
- Helper types: `CategoryMappingResult`, `MerchantMatchResult`, `ItemNameMappingResult`, `BatchProcessingController`
- MERCHANT_CONFIDENCE_THRESHOLD = 0.7 (matches processScan pattern)
- Fire-and-forget pattern for mapping usage increments and member timestamp updates
- 39 tests (12 editReceipt + 27 save) covering auth, mappings, shared groups, state reset
- Code review fix: Console.warn prefix `[App]` for consistency with source App.tsx
- Reference: `src/features/batch-review/handlers/editReceipt.ts`, `save.ts`

**Story 14e-14c Additions (2026-01-26) - Batch Discard & Credit Check Handlers:**
- `DiscardContext`, `CreditCheckContext` interfaces for props-based dependency injection
- `handleReviewBack(context)` - Shows BATCH_DISCARD dialog when receipts exist, navigates directly when none
- `confirmDiscard(context)` - Dismisses dialog, clears all batch state, navigates to dashboard
- `cancelDiscard(context)` - Dismisses dialog only (minimal function)
- `confirmWithCreditCheck(context)` - Batch uses 1 super credit (isSuper: true) flat rate
- Type import pattern: `UserCredits` imported and re-exported for external consumers
- 36 tests (24 discard + 12 credit check) covering behavior, execution order, integration flows
- Code review fix: Staged untracked files, fixed UserCredits type reference
- Reference: `src/features/batch-review/handlers/discard.ts`, `creditCheck.ts`

**Story 14e-14d Additions (2026-01-26) - Batch Handler App.tsx Integration:**
- All 9 handlers imported from `@features/batch-review/handlers` into App.tsx
- Inline context creation (Approach A): context objects created at call site in thin wrappers
- Handlers integrated: navigateToPreviousReceipt, navigateToNextReceipt, editBatchReceipt, saveBatchTransaction, handleSaveComplete, handleReviewBack, confirmDiscard, cancelDiscard, confirmWithCreditCheck
- ~91 lines of handler logic removed from App.tsx, replaced with thin wrappers (2-8 lines each)
- Unused import cleanup: `BatchCompleteDialogData` removed (now internal to handlers)
- Code review action item: Feature barrel `@features/batch-review` missing discard/credit exports (consistency fix for future)
- 6,512 tests pass, build succeeds
- Reference: `src/App.tsx:149-159` (imports), `src/App.tsx:1572-1963` (wrappers)

**Story 14e-15 Additions (2026-01-26) - Component Store Integration Pattern:**
- **Pattern:** Component consumes store action directly via selector, with optional prop fallback for backwards compatibility
- BatchReviewCard uses `useBatchReviewStore((state) => state.discardItem)` directly (AC5 requirement)
- `onDiscard` prop marked `@deprecated`, optional with fallback to store action
- Handler pattern: `handleDiscard()` checks prop first, falls back to store action with `receipt.id`
- Test pattern: Mock store with selector pattern, verify `mockDiscardItem` called with entity ID
- 38 component tests (17 BatchReviewCard including AC5 store integration test)
- 5,709 tests pass, build succeeds
- Reference: `src/features/batch-review/components/BatchReviewCard.tsx:143-157`

```typescript
// Component Store Integration Pattern (14e-15)
const discardItemFromStore = useBatchReviewStore((state) => state.discardItem);

const handleDiscard = () => {
  if (onDiscard) {
    onDiscard();  // Backwards compatibility
  } else {
    discardItemFromStore(receipt.id);  // Store action with entity ID
  }
};
```

**Story 14e-16 Additions (2026-01-26) - BatchReviewFeature Orchestrator:**
- Phase-based rendering orchestrator: `BatchReviewFeature.tsx` (811 lines)
- Phases: idle→null, loading→LoadingState/ProcessingState, reviewing/editing/saving→full UI, complete→CompleteState, error→ErrorState
- Inline discard confirmation dialog (alternative to ModalManager - keeps component self-contained)
- Auto-complete detection via `useHadItems` selector (Zustand flag persists across remounts, unlike React ref)
- Props-based dependency injection for callbacks (onEditReceipt, onSaveReceipt, onSaveAll, onBack, onDiscardReceipt)
- 24 tests covering all phases, handler callbacks, theme support
- Pattern: Store flag (`hadItems`) preferred over React ref for state that must persist across component remounts
- Reference: `src/features/batch-review/BatchReviewFeature.tsx`

**Story 14e-18b Additions (2026-01-27) - Credit Handlers Extraction:**
- Credit handler directory: `src/features/credit/handlers/` with barrel exports
- `CreditHandlerContext` interface for props-based dependency injection
- Factory pattern handlers:
  - `createBatchConfirmWithCreditCheck(ctx)` - Shows credit warning dialog (1 super credit for batch)
  - `createCreditWarningConfirm(ctx)` - Confirms and triggers batch callback (async)
  - `createCreditWarningCancel(ctx)` - Cancels and clears state
- Simplified context: Removed `deductSuperCredits` (not needed in warning handlers)
- 23 tests covering sufficient/insufficient credits, confirm/cancel flows, async callbacks
- Code review finding: Duplication with batch-review `confirmWithCreditCheck` - intentional foundation for migration
- Reference: `src/features/credit/handlers/creditHandlers.ts`

---

## ProcessScan Handler Pattern (Story 14e-8c - 2026-01-25)

**Pattern:** Main orchestration handler with dependency injection via interface

### Handler Structure

```typescript
// src/features/scan/handlers/processScan/processScan.ts

export async function processScan(params: ProcessScanParams): Promise<ProcessScanResult> {
  const { scan, user, mapping, ui, scanOverlay, services, t, lang, ... } = params;

  // 13-step orchestration:
  // 1. Validate images
  // 2. Check credits
  // 3. Deduct credit
  // 4. Call Gemini OCR (with timeout race)
  // 5. Parse date/location
  // 6. Validate total (may show dialog)
  // 7. Build initial transaction
  // 8. Apply all mappings
  // 9. Handle currency detection (may show dialog)
  // 10. Set current transaction
  // 11. Determine success route
  // 12. Dispatch success
  // 13. Handle trusted auto-save (if applicable)
}
```

### Key Decisions

| Decision | Rationale |
|----------|-----------|
| ProcessScanParams interface | Groups all dependencies by category (scan, user, mapping, ui, services) |
| Thin App.tsx wrapper (~95 lines) | Collects dependencies from React hooks/state, delegates to handler |
| Merchant confidence threshold: 0.7 | Prevents false positive mapping applications |
| Timeout: 120s via Promise.race | Prevents indefinite waits on slow OCR |
| Credit refund on error | Ensures users aren't charged for failed scans |

### App.tsx Wrapper Pattern

```typescript
const processScan = useCallback(async (imagesToProcess?: string[]) => {
  await processScanHandler({
    scan: { images, currency, storeType, defaultCountry, defaultCity },
    user: { userId, creditsRemaining, defaultCurrency, transactions },
    mapping: { mappings, applyCategoryMappings, findMerchantMatch, ... },
    ui: { setScanError, setCurrentTransaction, showScanDialog, ... },
    scanOverlay,
    services: { analyzeReceipt, deductUserCredits, addUserCredits, getCitiesForCountry },
    t, lang, viewMode, trustedAutoSave, prefersReducedMotion,
  });
}, [/* dependencies */]);
```

### Test Coverage

- **processScan.test.ts**: 23 unit tests (main handler)
- **subhandlers.test.ts**: 32 unit tests (sub-handlers)
- **utils.test.ts**: 45 unit tests (pure utilities)
- **Total**: 100 tests for scan feature

**Reference:** Story 14e-8c, `src/features/scan/handlers/processScan/`

---

## Scan Feature Component Migration (Story 14e-9a - 2026-01-25)

**Pattern:** Feature-based directory migration with backward compatibility

### Component Structure

```
src/features/scan/
├── index.ts                    # Module barrel (exports store, handlers, components)
├── store/                      # Zustand store (14e-6a-d)
├── handlers/                   # processScan handler (14e-8a-c)
└── components/                 # UI components (14e-9a)
    ├── index.ts                # Component barrel exports
    ├── states/                 # State-specific components (future)
    ├── ScanOverlay.tsx
    ├── ScanStatusIndicator.tsx
    ├── ScanModeSelector.tsx
    ├── ScanProgress.tsx
    ├── ScanError.tsx
    ├── ScanReady.tsx
    ├── ScanSkeleton.tsx
    └── ScanCompleteModal.tsx
```

### Migration Strategy

| Step | Action | Notes |
|------|--------|-------|
| 1 | `git mv` components | Preserves git history |
| 2 | Update internal imports | Use `@/` path aliases |
| 3 | Create barrel exports | Re-export in `components/index.ts` |
| 4 | Update old barrel | Re-export from new location for backward compatibility |
| 5 | Update consumers | Prefer `@features/scan/components` import path |

### Backward Compatibility

```typescript
// src/components/scan/index.ts - OLD BARREL
// Re-exports migrated components for backward compatibility
export {
  ScanStatusIndicator,
  ScanOverlay,
  ScanModeSelector,
  // ... etc
} from '@features/scan/components';

// Components still in this directory (not yet migrated)
export { BatchUploadPreview } from './BatchUploadPreview';
export { BatchProcessingOverlay } from './BatchProcessingOverlay';
// ... etc
```

### Vitest Path Alias Configuration

```typescript
// vitest.config.unit.ts - REQUIRED for test files
// tsconfig.json `include: ['src']` means path aliases only work in src/
// Tests in tests/ directory need explicit aliases
resolve: {
  alias: {
    '@features': path.resolve(__dirname, 'src/features'),
    '@entities': path.resolve(__dirname, 'src/entities'),
    '@managers': path.resolve(__dirname, 'src/managers'),
    '@shared': path.resolve(__dirname, 'src/shared'),
    '@app': path.resolve(__dirname, 'src/app'),
    '@': path.resolve(__dirname, 'src'),
  },
}
```

**Reference:** Story 14e-9a-move-scan-components

---

## FeatureOrchestrator Pattern (Epic 14e - Story 14e-21)

**Pattern:** Centralized feature composition component that delegates rendering to feature modules.

### Component Location

```
src/app/FeatureOrchestrator.tsx
```

### Architecture

FeatureOrchestrator composes all feature modules into a single render tree:

```typescript
export function FeatureOrchestrator({
  scanFeatureProps,
  batchReviewFeatureProps,
  creditFeatureProps,
  categoriesFeatureProps,
  renderModalManager = true,
}: FeatureOrchestratorProps): React.ReactElement {
  return (
    <>
      {/* Headless features */}
      {categoriesFeatureProps && <CategoriesFeature {...props} />}

      {/* Conditional UI features */}
      {creditFeatureProps && <CreditFeature {...props} />}

      {/* Overlay features (handle own visibility) */}
      <ScanFeature {...scanFeatureProps} />
      {batchReviewFeatureProps && <BatchReviewFeature {...props} />}

      {/* Modal rendering (must be last for z-index) */}
      {renderModalManager && <ModalManager />}
    </>
  );
}
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Props-based composition | Features receive props from App.tsx, orchestrator just composes |
| Optional features | Only render features when props provided |
| Render order | CategoriesFeature (headless) → CreditFeature (dialog) → Overlays → ModalManager |
| No state management | Orchestrator does NOT manage feature state - only composition |

### Feature Visibility

Each feature handles its own visibility internally via Zustand store:

| Feature | Visibility Logic | Renders |
|---------|------------------|---------|
| CategoriesFeature | Always | Headless (context provider) |
| CreditFeature | Always | Dialog when triggered |
| ScanFeature | phase !== 'idle' | Phase-appropriate scan UI |
| BatchReviewFeature | phase !== 'idle' | Phase-appropriate batch UI |
| ModalManager | Always | Active modal or null |

**Reference:** Story 14e-21-create-feature-orchestrator

---

## AppProviders Pattern (Epic 14e - Story 14e-22)

**Pattern:** Consolidated provider composition in app shell layer

### Component Location

```
src/app/AppProviders.tsx
```

### Architecture

AppProviders consolidates all app-level React context providers:

```typescript
export function AppProviders({
  children,
  fontFamily = 'outfit',
  db,
  userId,
  appId,
  handlers,
}: AppProvidersProps): JSX.Element {
  return (
    <ThemeProvider fontFamily={fontFamily}>
      <NavigationProvider>
        <AppStateProvider>
          <NotificationProvider db={db} userId={userId} appId={appId}>
            {handlers ? (
              <ViewHandlersProvider
                transaction={handlers.transaction}
                scan={handlers.scan}
                navigation={handlers.navigation}
                dialog={handlers.dialog}
              >
                {children}
              </ViewHandlersProvider>
            ) : (
              children
            )}
          </NotificationProvider>
        </AppStateProvider>
      </NavigationProvider>
    </ThemeProvider>
  );
}
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Optional handlers | Enables graceful degradation in tests (no handler mocking needed) |
| Provider order | ThemeProvider outermost (no deps) → ViewHandlersProvider innermost (may use all) |
| View-scoped providers excluded | HistoryFiltersProvider, AnalyticsProvider remain per-view to prevent re-renders |
| Handler bundles object | Single `handlers` prop groups all handler types for clean API |

### Provider Hierarchy (Complete)

```
main.tsx (external)
├── QueryClientProvider
├── AuthProvider
├── ViewModeProvider
├── ScanProvider
└── AppErrorBoundary
    └── App.tsx
        └── AppProviders (THIS COMPONENT)
            ├── ThemeProvider
            ├── NavigationProvider
            ├── AppStateProvider
            └── NotificationProvider
                └── Views (views own their data via internal hooks)
```

**Reference:** Story 14e-22-appproviders-refactor, 14e-25d-viewhandlers-deletion-cleanup

> **Story 14e-25d Update (2026-01-28):** ViewHandlersProvider DELETED. Views now own their data via direct hooks:
> - `useHistoryNavigation()` - replaces navigation.handleNavigateToHistory
> - `useNavigationActions()` - view navigation from Zustand store
> - `useToast()` - replaces dialog.showToast
