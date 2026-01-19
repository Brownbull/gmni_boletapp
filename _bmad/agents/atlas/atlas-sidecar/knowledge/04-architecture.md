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
| `src/lib/queryClient.ts` | QueryClient (5min stale, 30min cache) |
| `src/lib/queryKeys.ts` | Hierarchical cache keys |
| `src/hooks/useFirestoreSubscription.ts` | Real-time subscriptions + cache |
| `src/hooks/useFirestoreQuery.ts` | One-time fetch hook |
| `src/hooks/useFirestoreMutation.ts` | Mutations with cache invalidation |

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

---

## Sync Notes

- Generation 4: Consolidated Epic 14d verbose details
- 2026-01-15: Added Epic 14c Household Sharing architecture
- 2026-01-15: Added Cloud Functions documentation
- 2026-01-19: Added Story 14c.17 Share Link Deep Linking pattern
- Code review learnings in 06-lessons.md
- Story details in docs/sprint-artifacts/
