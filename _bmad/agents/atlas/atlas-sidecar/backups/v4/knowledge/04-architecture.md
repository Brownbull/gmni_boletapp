# Architectural Decisions & Patterns

> Section 4 of Atlas Memory
> Last Sync: 2026-01-10
> Last Optimized: 2026-01-10 (Generation 3)
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

## Scan State Machine (Epic 14d)

### Core Architecture
```typescript
type ScanPhase = 'idle' | 'capturing' | 'scanning' | 'reviewing' | 'saving' | 'error';
type ScanMode = 'single' | 'batch' | 'statement';
type CreditStatus = 'none' | 'reserved' | 'confirmed' | 'refunded';
```

### Key Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Request Precedence | Active blocks new | Prevent data loss |
| Persistence | No expiration | User never loses work |
| Dialogs | Overlay state, not phase | More flexible |
| Credits | Reserve→Confirm/Refund | Fair billing |
| Batch State (14d.5a) | ScanContext owns images | Single source of truth, no dual-sync |

### Story 14d.5a: Batch State Migration (Option A) - COMPLETE

**Decision:** Full migration - ScanContext is sole source of truth for batch mode.

**Status:** ✅ Phase 0-1 + Phase 2 COMPLETE (2026-01-11)

**Key Files:**
- `src/utils/imageUtils.ts` - Thumbnail generation utilities (extracted from useBatchCapture)
- `src/views/BatchCaptureView.tsx` - Uses `useScanOptional()` for context, props fallback for tests
- `src/contexts/ScanContext.tsx` - Owns `state.images` and `state.mode` for both single and batch

**Migration Pattern (COMPLETE):**
| Old (App.tsx) | New (ScanContext) | Status |
|---------------|-------------------|--------|
| `isBatchCaptureMode` | `state.mode === 'batch'` | ✅ REMOVED |
| `setIsBatchCaptureMode(true)` | `startBatchScan(userId)` | ✅ Migrated |
| `setIsBatchCaptureMode(false)` | `resetScanContext()` | ✅ Migrated |
| `batchImages` | `state.images` | Deferred to 14d.5c |
| `setBatchImages(imgs)` | `setImages(imgs)` | Deferred to 14d.5c |

**Exit Handler Pattern (Phase 2d):**
```typescript
// handleBatchReviewBack, handleBatchDiscardConfirm, handleBatchSaveComplete
resetScanContext(); // Clears mode + images in context

// FAB return-to-batch (when batchImages.length > 0)
if (!isBatchModeFromContext && user?.uid) {
  startBatchScanContext(user.uid); // Re-sync context with local state
}
```

**Why Option A over B:**
1. Single source of truth - no dual-sync complexity
2. Better for 14d.5b-e - processing/results/persistence already in context
3. Matches single-scan pattern - consistent architecture

### Story 14d.5b: Batch Processing Integration (2026-01-11)

**Decision:** Callback integration - hook accepts optional callbacks, caller wires to context.

**Key Pattern:**
```typescript
// In useBatchProcessing.ts
export interface BatchProcessingCallbacks {
  onItemStart?: (index: number) => void;
  onItemSuccess?: (index: number, result: Transaction) => void;
  onItemError?: (index: number, error: string) => void;
  // Story 14d.5: Now passes results/images for atomic batchReceipts creation
  onComplete?: (results: ProcessingResult[], images: string[]) => void;
}

// Deduplication via Set to prevent duplicate callbacks
const callbacksCalled = {
  started: new Set<number>(),
  succeeded: new Set<number>(),
  failed: new Set<number>(),
};
```

**Wiring Pattern (App.tsx) - UPDATED 2026-01-12:**
```typescript
// CRITICAL: Create batchReceipts INSIDE callback for atomic state update
batchProcessing.startProcessing(images, currency, storeType, {
  onItemStart: dispatchBatchItemStart,
  onItemSuccess: dispatchBatchItemSuccess,
  onItemError: dispatchBatchItemError,
  onComplete: (processingResults, imageUrls) => {
    const receipts = createBatchReceiptsFromResults(processingResults, imageUrls);
    dispatchBatchComplete(receipts); // Pass receipts for atomic update
  },
});
```

**Why Callbacks over Direct Context Access:**
1. Hook remains testable in isolation (no context dependency)
2. Caller controls dispatch timing
3. Backwards compatible - callbacks are optional

### Story 14d.5 Race Condition Fix (2026-01-12)

**Problem:** BatchReviewView showed empty/wrong view after processing completed.

**Root Cause:** State machine race condition:
1. `BATCH_COMPLETE` dispatched → triggers React re-render
2. Re-render sees `phase='reviewing'` but `batchReceipts=null`
3. `setBatchReceiptsContext()` called AFTER re-render (too late)

**Solution:** Atomic state update - pass `batchReceipts` in `BATCH_COMPLETE` payload:
```typescript
// BATCH_COMPLETE action type now accepts optional payload
| { type: 'BATCH_COMPLETE'; payload?: { batchReceipts: BatchReceipt[] } }

// Reducer sets both phase AND receipts atomically
case 'BATCH_COMPLETE': {
  return {
    ...state,
    phase: 'reviewing',
    batchReceipts: action.payload?.batchReceipts ?? state.batchReceipts,
  };
}
```

**Pattern:** When state machine actions need additional data for correct UI rendering, pass that data as part of the action payload rather than dispatching separately.

### Story 14d.5 Hotfix: Batch Edit Thumbnail Pattern (2026-01-12)

**Problem:** `handleBatchEditReceipt` called `setScanImages(receipt.imageUrl)` which triggered `SET_IMAGES ignored` warnings because the action requires `capturing` phase, but batch edit happens in `reviewing` phase.

**Solution:** Set `thumbnailUrl` directly on the transaction object:
```typescript
// WRONG - triggers state machine validation error
setScanImages(receipt.imageUrl ? [receipt.imageUrl] : []);

// CORRECT - bypasses state machine, sets thumbnail for TransactionEditorView
const transactionWithThumbnail = receipt.imageUrl
    ? { ...receipt.transaction, thumbnailUrl: receipt.imageUrl }
    : receipt.transaction;
setCurrentTransaction(transactionWithThumbnail);
```

**Why This Works:** `TransactionEditorView` checks `currentTransaction.thumbnailUrl` first, then falls back to `scanImages[0]`. By setting thumbnailUrl directly, we don't need to modify scan state.

**Files Fixed:** `handleBatchEditReceipt`, `handleBatchPrevious`, `handleBatchNext` in App.tsx

### Story 14d.5d: Batch Edit & Dialog State (2026-01-11)

**Decision:** Dedicated batchEditingIndex + typed dialog data for batch completion.

**Key Additions:**
```typescript
// In ScanState
batchEditingIndex: number | null;  // Index of receipt being edited

// New dialog types
type ScanDialogType = ... | 'batch_discard' | 'batch_complete';

// Type-safe dialog data
interface BatchCompleteDialogData {
  transactions: Transaction[];
  creditsUsed: number;
}
```

**Why Dedicated Index:**
1. Avoids confusion with `activeResultIndex` (used for single-mode)
2. Explicit intent - null means "not editing batch receipt"
3. Bounds validation in reducer prevents invalid states

**Dialog State Pattern:**
- `batch_discard`: Confirmation when discarding batch review results
- `batch_complete`: Summary modal with saved transactions and credits
- Data passed via `activeDialog.data` property (type-safe)

**Note:** `showBatchCancelConfirm` kept in App.tsx (uses `batch_cancel_warning` from 14d.4b)

### Computed Values
| Value | Logic | Use |
|-------|-------|-----|
| `hasActiveRequest` | `phase !== 'idle'` | Block new scans |
| `isBlocking` | `hasActiveRequest && hasDialog` | User must resolve |
| `canNavigateFreely` | `isIdle \|\| (!hasDialog && !isProcessing)` | Allow/block nav |

### Provider Placement
```tsx
<QueryClientProvider>
  <AuthProvider>
    <ScanProvider>  {/* Story 14d.2 */}
      {/* App content */}
    </ScanProvider>
  </AuthProvider>
</QueryClientProvider>
```

**Reference**: `docs/sprint-artifacts/epic14d/scan-request-lifecycle.md`

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
| Epic 10 | COMPLETE | Insight engine, 12 generators |
| Epic 10a | COMPLETE | Home+History merge, shared filter context |
| Epic 11 | COMPLETE | QuickSave (85% confidence), trust merchants |
| Epic 12 | COMPLETE | Batch processing, credit-after-save |
| Epic 13 | COMPLETE | 10 HTML mockups, motion design system |
| Epic 14 | IN PROGRESS | React Query, Firestore optimization, unified editor |
| Epic 14d | IN PROGRESS | Scan state machine, navigation blocking |

### Story 14d.9: Statement Placeholder View (2026-01-12)

**Patterns Adopted:**
- ScanContext integration: Uses `useScan()` hook with `reset()` per ADR-020
- View routing: Added to View type union, excludes from TopHeader/main padding
- Accessibility: Focus/blur handlers mirror hover states for keyboard users

**Technical Decisions:**
- Safe area insets: Added `env(safe-area-inset-*)` for iOS notch/home indicator
- Shared style helper: `getButtonHoverStyle()` centralizes hover/focus logic
- Violet theme: #8b5cf6 matches FAB statement mode color

**Code Pattern:**
```typescript
// Shared hover/focus style handler for buttons
const getButtonHoverStyle = (isDark: boolean, isBackButton: boolean) => ({
  onMouseEnter: (e) => { /* hover in */ },
  onMouseLeave: (e) => { /* hover out */ },
  onFocus: (e) => { /* keyboard focus */ },
  onBlur: (e) => { /* keyboard blur */ },
});

// Usage: {...getButtonHoverStyle(isDark, true)}
```

---

## Epic Progress Summary

| Epic | Status | Key Patterns |
|------|--------|--------------|
| Epic 10 | COMPLETE | Insight engine, 12 generators |
| Epic 10a | COMPLETE | Home+History merge, shared filter context |
| Epic 11 | COMPLETE | QuickSave (85% confidence), trust merchants |
| Epic 12 | COMPLETE | Batch processing, credit-after-save |
| Epic 13 | COMPLETE | 10 HTML mockups, motion design system |
| Epic 14 | IN PROGRESS | React Query, Firestore optimization, unified editor |
| Epic 14d | IN PROGRESS | Scan state machine, navigation blocking |

---

## Sync Notes

- Generation 3 optimization: Consolidated code examples → reference docs
- Code review learnings moved to 06-lessons.md
- Story-specific details reference story files in docs/sprint-artifacts/
