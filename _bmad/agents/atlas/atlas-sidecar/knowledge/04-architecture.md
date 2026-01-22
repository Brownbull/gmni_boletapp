# Architectural Decisions & Patterns

> Section 4 of Atlas Memory
> Last Sync: 2026-01-15
> Last Optimized: 2026-01-12 (Generation 4)
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

## Shared Group Cache Optimization (Story 14c.20)

**Problem:** Full Firestore fetch on every view mode switch due to `refetchOnMount: true`

**Solution:** Cache-first strategy with delta sync + real-time invalidation

### React Query Configuration

```typescript
// useSharedGroupTransactions.ts
useQuery({
    queryKey: QUERY_KEYS.sharedGroupTransactions(groupId),
    queryFn: async () => { /* IndexedDB → Delta sync → Firestore fallback */ },

    // Story 14c.20: Cache Optimization
    staleTime: 60 * 60 * 1000,        // 1 hour (safety net)
    gcTime: 24 * 60 * 60 * 1000,      // 24 hours (survive view switches)
    refetchOnMount: false,             // Use cached data on mount
    refetchOnWindowFocus: false,       // Delta sync handles freshness
});
```

### Real-Time Sync Architecture

```
User A saves transaction → updateMemberTimestampsForTransaction() → memberUpdates.userA.lastSyncAt
                                          ↓
User B's onSnapshot listener detects memberUpdates change (1-3 seconds)
                                          ↓
detectMemberUpdates() compares timestamps → shouldInvalidate: true
                                          ↓
await clearGroupCacheById() → IndexedDB cleared (MUST await!)
                                          ↓
resetQueries() + invalidateQueries({ refetchType: 'all' }) → Force fresh fetch
                                          ↓
queryFn → IndexedDB empty → Firestore fetch → User B sees change
```

### Critical Bug Fixes (Learned Patterns)

#### 1. Race Condition: IndexedDB Clear vs React Query Refetch
```typescript
// ❌ BUG: Fire-and-forget causes race condition
clearGroupCacheById(groupId).catch(...);  // Starts async
queryClient.invalidateQueries({...});      // Triggers immediately
// queryFn reads STALE IndexedDB data before clear completes!

// ✅ FIX: Await IndexedDB clear before invalidating
await clearGroupCacheById(groupId);
queryClient.invalidateQueries({...});
```

#### 2. Inactive Query Not Refetching
```typescript
// ❌ BUG: invalidateQueries only refetches ACTIVE queries
// With refetchOnMount: false, inactive queries stay stale
queryClient.invalidateQueries({ queryKey: [...] });

// ✅ FIX: Use refetchType: 'all' to force refetch inactive queries
queryClient.invalidateQueries({
    queryKey: [...],
    refetchType: 'all'  // Critical for cache optimization
});
```

#### 3. Delta Sync Can't Detect Removals
```typescript
// ❌ LIMITATION: Delta query filters by sharedGroupIds array-contains groupId
// When transaction is REMOVED from group, sharedGroupIds no longer contains groupId
// Delta sync query returns empty → cache still has stale transaction

// ✅ FIX: Use resetQueries() to clear React Query in-memory cache
await queryClient.resetQueries({ queryKey: [...] });  // Clear in-memory
queryClient.invalidateQueries({ queryKey: [...], refetchType: 'all' });  // Force fresh fetch
```

#### 4. memberUpdates Write Reliability
```typescript
// ❌ RISK: Fire-and-forget batch write can fail silently
await transaction.save();
updateMemberTimestampsForTransaction(...).catch(...);  // If fails, no sync signal

// ✅ FIX: Retry logic with exponential backoff
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;
// Attempt → fail → wait 500ms → retry → fail → wait 1000ms → retry
```

### Manual Sync Feature

**Location:** Settings > Grupos > [Group Header] (compact sync icon)

**Components:**
- `useManualSync` hook - Cooldown tracking, cache invalidation
- `SyncButton` component - Compact mode (icon only) in group header

**Behavior:**
| State | Button | Display |
|-------|--------|---------|
| Idle | Sync icon | Tooltip: "Sincronizar transacciones" |
| Syncing | Spinner | Disabled |
| Cooldown | Clock icon | Tooltip: "Espera Xs" |

### Cost Impact

| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| Daily reads/user | ~10,000+ | ~700-1,500 | ~85% |
| Monthly (50 users) | ~$9 | ~$2 | ~78% |

**Key Files:**
- `src/hooks/useSharedGroupTransactions.ts` - React Query config
- `src/hooks/useManualSync.ts` - Manual sync hook (60s cooldown)
- `src/components/SharedGroups/SyncButton.tsx` - UI component
- `src/App.tsx:533-575` - Cache invalidation on memberUpdates change
- `src/services/sharedGroupService.ts:1284-1353` - Retry logic for timestamps

---

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

## Sync Notes

- Generation 4: Consolidated Epic 14d verbose details
- 2026-01-15: Added Epic 14c Household Sharing architecture
- 2026-01-15: Added Cloud Functions documentation
- 2026-01-19: Added Story 14c.17 Share Link Deep Linking pattern
- 2026-01-19: Added Story 14c.18 View Mode Persistence pattern
- 2026-01-19: Added Story 14c.14 Secret Manager Migration pattern
- 2026-01-20: Added Story 14c.20 Shared Group Cache Optimization pattern
- 2026-01-21: Added Epic 14c-refactor Service Stubbing Pattern
- 2026-01-21: Added Epic 14c-refactor Hook Stubbing Pattern (Story 14c-refactor.3)
- 2026-01-21: Added IndexedDB Migration Pattern (Story 14c-refactor.4)
- 2026-01-21: Added App-Level Hook Pattern (Story 14c-refactor.10)
- 2026-01-21: Updated React Query defaults (refetchOnWindowFocus: true for multi-device sync)
- 2026-01-21: Story 14c-refactor.12 - Transaction Service Simplification (dead query keys removed, TODO markers added)
- 2026-01-21: Story 14c-refactor.13 - View Mode State Unification (context simplified to in-memory only, Shell & Stub pattern)
- 2026-01-22: Story 14c-refactor.17 - Test Suite Cleanup (92 new tests: 5 context files + 1 hook, security rules deny-all pattern)
- Code review learnings in 06-lessons.md
- Story details in docs/sprint-artifacts/
