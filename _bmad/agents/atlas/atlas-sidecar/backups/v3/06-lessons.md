# Historical Lessons (Retrospectives)

> Section 6 of Atlas Memory
> Last Sync: 2026-01-10
> Last Optimized: 2026-01-06 (Generation 1)
> Sources: Epic retrospectives, code reviews, Story 14.22, Story 14.14b, Story 14.15b, Story 14.23, Story 14d.4d

## What Worked Well

| Lesson | Context | Source |
|--------|---------|--------|
| PRD + Tech-Spec Workflow | Essential for UX-heavy epics | Epic 7, 9 |
| Story-to-Story Knowledge Transfer | Dev records enable pattern reuse | Epic 8, 9 |
| Code Review Discipline | All stories get adversarial reviews | All Epics |
| High Velocity | 7+ points/day with good planning | Epic 8, 9 |
| Parallel CI Jobs | 63% faster after Epic 8 optimization | Epic 8 |
| Mockup-First Workflow | Design before implementation for UX | Epic 13 |
| Persona-Driven Design | María, Diego, Rosa, Tomás inform decisions | Epic 13 |
| Single Source of Truth Schema | Categories/currencies in shared/schema/ | Story 14.15b |
| Token Optimization | V3 prompt 21% smaller than V2 | Story 14.15b |
| Unified View Pattern | Consolidate similar views with mode prop | Story 14.23 |
| Credit Reserve Pattern | Reserve→Confirm/Refund for async ops | Story 14.24 |
| localStorage for Ephemeral State | Client-only state separate from React Query | Story 14.24 |
| Versioned Persistence Format | Version field enables safe migrations | Story 14d.4d |
| Phased Migration | Parallel systems reduce regression risk | Story 14d.4d |

## What Failed / What to Avoid

| Failure | Root Cause | Prevention |
|---------|------------|------------|
| Git Branch Divergence | Squash merges create sync issues | Merge commits for sync PRs |
| Bundle Size Growth | At 2.0 MB, CRITICAL | Code-splitting (deferred to Epic 15) |
| Unsafe Regex Patterns | ReDoS in sanitize.ts | Use simple non-greedy patterns |
| API Key Leak | Hardcoded in code | Always use env variables |
| Scope Creep | Epics grow 7→21 stories | Better upfront scoping |

## Hard-Won Wisdom

### Security
- **API Key Leaks**: Create fresh branch, don't rewrite history. GitGuardian checks full history.
- **ReDoS Prevention**: Avoid nested quantifiers. BAD: `(?:(?!<\/script>)<[^<]*)*`. GOOD: `[\s\S]*?`

### Git Strategy
- **3-Branch Workflow**: `feature/* → develop → staging → main`
- Merge commits for sync PRs (not squash)
- Hotfixes backported immediately to all branches

### Firestore
- **Defensive Timestamps**: Always use try/catch with `?.toDate?.()?.getTime?.()`
- **serverTimestamp()**: Use separate `*Create` interface with `FieldValue` for writes

### Time Period Navigation (Story 14.14b)
- **Cascade on Granularity Change**: When user switches from coarse to fine granularity (e.g., Quarter→Month), set to FIRST unit of current period, not first unit of year
  - Q3 → Month = **July** (first month of Q3), not January
  - Year → Quarter = Q1; Year → Month = January
  - Month → Week = Week 1 of current month
- **Preserve Context on Drill-Up**: When going from fine to coarse (Month→Year), keep current values
- **Reference**: `TrendsView.tsx` `setTimePeriod()` callback (~lines 1840-1943)

### CI/CD (Story 14.22)
- **Gitleaks Parallelized**: Separate job runs ~8s alongside setup (~3min)
- Setup uses shallow clone; only gitleaks needs `fetch-depth: 0`
- Total PR time: ~6 min

### AI Prompt Optimization (Story 14.15b)
- **V3 Prompt Production**: 21% token reduction (~229 tokens/scan) vs V2
- **Currency Auto-Detection**: AI detects from receipt symbols/text, no app hint needed
- **Single Source of Truth**: Categories in `shared/schema/categories.ts` (36 store + 39 item)
- **Rule #10 Pattern**: "MUST have at least one item" - handles parking, utilities, single-charge receipts
- **Legacy Normalization**: Map old categories at read time (Fresh Food → Produce, Drinks → Beverages)
- **Prebuild Pattern**: `functions/package.json` copies prompts + schema, fixes import paths via sed
- **Cost Savings**: ~$17/month at 1M scans
- **Reference**: `prompt-testing/TOKEN-ANALYSIS.md`, `story-14.15b-v3-prompt-integration.md`

### Unified View Pattern (Story 14.23)
- **Mode Prop Pattern**: Use `mode: 'new' | 'existing'` to differentiate behaviors in single component
- **State Machine for UI**: Scan button states (idle→pending→scanning→complete→error) drive visual feedback
- **Gradual Migration**: Comment out old views with deprecation notice, don't delete immediately
- **Preserve Navigation State**: Check `pendingScan.status` to restore correct state when user returns
- **Parent-Managed State**: Keep transaction/scan state in App.tsx, pass callbacks to view
- **Reference**: `src/views/TransactionEditorView.tsx`, `story-14.23-unified-transaction-editor.md`

### Filter Persistence Pattern (Story 14.13b)
- **Context State Sync**: Use `onStateChange` callback in Provider to sync state to parent
- **Navigation-Aware Clearing**: Clear filters when navigating FROM outside, preserve when navigating WITHIN related views
- **Default Month Filter**: Always start with current month, not "all time" - users must explicitly clear
- **Multi-Select Handling**: Store comma-separated values, check with `.includes(',')` before splitting
- **Category Normalization**: Use `normalizeItemCategory()` to handle translated category names in filtering
- **Early Return Bug**: Always check ALL filter conditions, not just temporal - category filters were skipped when no temporal filter
- **Reference**: `src/contexts/HistoryFiltersContext.tsx`, `src/views/ItemsView.tsx`, `story-14.13b-header-clear-filter-buttons.md`

### Single Active Transaction Pattern (Story 14.24 - IMPLEMENTED)
- **One Transaction Rule**: Only one transaction can be in edit mode at any time
- **Credit Reserve Pattern**: `reserveCredits()` → `confirmReservedCredits()` / `refundReservedCredits()`
  - Reserve: Deducts locally (UI shows change) but doesn't persist to Firestore
  - Confirm: Called on scan success - persists to Firestore
  - Refund: Called on scan error - restores original credits, shows toast
- **State Persistence**: `pendingScanStorage.ts` stores `PendingScan` in localStorage per-user
  - Survives page refresh, tab close, navigation
  - Key: `boletapp_pending_scan_{userId}`
- **Conflict Detection**: `hasActiveTransactionConflict()` in App.tsx (~lines 691-766)
  - Checks: scan_in_progress, credit_used, has_unsaved_changes
  - `TransactionConflictDialog` shows resolution options: view, discard, cancel
- **Architecture**: localStorage for pending scans is CORRECT - doesn't conflict with React Query
  - React Query: Server-synced data (transactions, mappings)
  - localStorage: Client-only ephemeral state (pending scan)
- **Reference**: `story-14.24-persistent-transaction-state.md`, `src/components/dialogs/TransactionConflictDialog.tsx`

### Multi-Dimension Filter Pattern (Story 14.13a - COMPLETE 2026-01-09)

**Problem:** Analytics drill-down navigation loses context when navigating to HistoryView/ItemsView.
- User drills: Store Categories → Supermercado → Alimentos Frescos (4 items)
- Clicks "4 items" → Shows 5 items (only storeCategory filter applied, itemGroup ignored)

**Root Cause:** `matchesCategoryFilter` only checked `tx.category` (store), not `tx.items[]` for item-level.

**Solution Implemented:**
1. `drillDownPath` takes priority over legacy filters in `matchesCategoryFilter`
2. Item-level filtering iterates `tx.items[]` with `expandItemCategoryGroup()`
3. FilterChips shows **separate pills** for store and item dimensions
4. IconFilterBar dropdown reads from `drillDownPath` and expands groups to categories
5. `itemCategory` takes priority over `itemGroup` (more specific wins)

**Key Files Modified:**
- `src/utils/historyFilterUtils.ts` - drillDownPath filtering logic
- `src/hooks/useHistoryFilters.ts` - getCategoryFilterLabel, hasCategoryFilter
- `src/components/history/FilterChips.tsx` - Two-pill display for multi-dimension
- `src/components/history/IconFilterBar.tsx` - Read drillDownPath in dropdown
- `src/views/TrendsView.tsx` - Skip drillDownPath for "Más" aggregated categories

**Key Learnings:**
1. Transaction filters check `tx.category`; item filters check `tx.items[]`
2. More specific filter (itemCategory) takes priority over general (itemGroup)
3. Filter badges must show ALL active dimensions separately
4. Sync pending state in dropdown when committed state changes from navigation

**Reference:** `story-14.13a-multi-level-filter-support.md`, 16 unit tests in `historyFilterUtils.drillDown.test.ts`

### Header Clear Filter Buttons (Story 14.13b - COMPLETE 2026-01-10)

**Problem:** Users drilling from TrendsView had no quick way to clear all filters from Compras/Productos views.

**Solution Implemented:**
1. **X Clear Button** next to view titles (Compras/Productos) when any filters are active
2. **Filter Persistence Across Tabs**: Switching between Transactions/Items in IconFilterBar preserves both filter sets
3. **drillDownPath Multi-Dimension**: Store and item filters can coexist using `drillDownPath.storeCategory` + `drillDownPath.itemCategory`

**Key Implementation Details:**
- Clear button dispatches `CLEAR_ALL_FILTERS` action (resets temporal, category, location, group)
- Button: 18px X icon, `var(--text-secondary)` color, hover to `var(--text-primary)`, 44px touch target
- Filter persistence: `applyTransactionFilter()` and `applyItemFilter()` now preserve existing filter from other dimension
- Visual: Button appears only when `hasActiveFilters` or `hasTemporalOrCategoryFilters` is true

**Key Files Modified:**
- `src/views/HistoryView.tsx` - Added clear button next to "Compras" title
- `src/views/ItemsView.tsx` - Added clear button next to "Productos" title
- `src/components/history/IconFilterBar.tsx` - Filter persistence in apply functions

**Key Learnings:**
1. `drillDownPath` enables true multi-dimension filtering (store + item simultaneously)
2. Inline hover handlers (`onMouseEnter/onMouseLeave`) work well for simple color changes
3. Use `min-w-11 min-h-11` (44px) for touch targets per WCAG guidelines
4. AC #5 (independent clearing) is automatically handled by shared `CLEAR_ALL_FILTERS` since both views use same context

**Reference:** `story-14.13b-header-clear-filter-buttons.md`

### Navigation Filter Preservation Bug (Story 14.13 - BUG FIX 2026-01-10)

**Problem:** Filters set by `handleNavigateToHistory` were immediately cleared when navigating from TrendsView to History/Items view.

**Root Cause:** `navigateToView()` in App.tsx clears `pendingHistoryFilters` when navigating to history/items from "unrelated" views. The 'trends' and 'insights' views were not in the `isFromRelatedView` check.

**Sequence (before fix):**
1. TrendsView calls `setPendingHistoryFilters(filterState)` → filters set ✓
2. TrendsView calls `navigateToView('items')`
3. `navigateToView` checks: `isFromRelatedView = 'trends' === 'history'...` → **FALSE**
4. `isToHistoryOrItems && !isFromRelatedView` → **TRUE** → `setPendingHistoryFilters(null)` 💥
5. ItemsView mounts with no filters

**Solution:**
```typescript
// Before (broken):
const isFromRelatedView = view === 'history' || view === 'items' || view === 'transaction-editor';

// After (fixed):
const isFromRelatedView = view === 'history' || view === 'items' || view === 'transaction-editor' || view === 'trends' || view === 'insights';
```

**Key Learning:** When adding navigation flows that set pending state before navigating, ensure the source view is in the "related views" list to prevent unintended state clearing.

**Reference:** `story-14.13-analytics-polygon-integration.md`, `src/App.tsx` line ~859

### Scan State Persistence Pattern (Story 14d.4d - Code Review 2026-01-10)

**Problem:** pendingScan localStorage format needed migration to ScanState format for state machine compatibility.

**Solution Implemented:**
1. **Versioned Storage Format**: `PersistedScanState` with `version: 1` and `persistedAt` timestamp
2. **Automatic Migration**: `migrateOldFormat()` converts PendingScan → ScanState on load
3. **Parallel Persistence**: Both ScanContext state AND legacy pendingScan saved during migration
4. **Phased Approach**: Keep legacy API with `@deprecated` annotations; full removal in separate story

**Key Implementation:**
```typescript
// New format (version 1)
interface PersistedScanState {
  version: number;        // SCAN_STATE_VERSION = 1
  state: ScanState;       // Full state machine state
  persistedAt: number;    // Timestamp for debugging
}

// Migration mapping
status: 'analyzing' → phase: 'error' (interrupted)
status: 'analyzed' → phase: 'reviewing'
status: 'images_added' → phase: 'capturing'
analyzedTransaction → results[0]
```

**Key Learnings:**
1. **DEV-gate console warnings**: Always wrap with `import.meta.env.DEV`
2. **Avoid redundant calls**: `clearPendingScan()` delegates to `clearPersistedScanState()` - don't call both
3. **Version field enables migration**: Increment `SCAN_STATE_VERSION` for breaking changes
4. **Interrupted scans can't recover**: Show toast, clear storage, user must retry (MVP limitation)

**Reference:** `story-14d.4d-pending-scan-migration.md`, `src/services/pendingScanStorage.ts`

### Batch Scan Context Integration (Story 14d.5 - IN PROGRESS 2026-01-10)

**Problem:** Batch scan flow uses 15+ local state variables in App.tsx, making it hard to reason about and test.

**Solution (Incremental Bridge Pattern):**
1. **Extend ScanContext with batch computed values** - Add `isBatchMode`, `isBatchCapturing`, `isBatchProcessing`, `isBatchReviewing`, `batchProgress` to ScanContextValue
2. **Extend bridge hook** - Add batch state syncing to `useScanStateBridge` (mode, images, progress tracking)
3. **Views use useScanOptional()** - Components read from context when available, fall back to props
4. **Entry points dispatch to context** - When entering batch mode, also call `startBatchScanContext(userId)`

**Key Implementation:**
```typescript
// ScanContext batch computed values
const isBatchMode = state.mode === 'batch';
const isBatchProcessing = isBatchMode && state.phase === 'scanning';
const batchProgress = useMemo(() => {
  if (!state.batchProgress) return null;
  return { current, total, completed: completed.length, failed: failed.length };
}, [state.batchProgress]);

// View pattern (BatchCaptureView, BatchReviewView)
const scanContext = useScanOptional();
const isProcessing = scanContext?.isBatchProcessing ?? isProcessingProp;
```

**Key Learnings:**
1. **Incremental migration reduces risk** - Keep local state during transition, remove when views fully migrate
2. **useScanOptional() enables gradual adoption** - Components work with or without context
3. **Computed values simplify consumption** - `isBatchProcessing` cleaner than `state.mode === 'batch' && state.phase === 'scanning'`
4. **Pure presentation components don't need context** - BatchSummaryCard receives data via props from parent

**Status:**
- [x] ScanContext batch values (isBatchMode, isBatchCapturing, isBatchProcessing, isBatchReviewing, batchProgress)
- [x] Bridge batch state syncing
- [x] BatchCaptureView/BatchReviewView context integration
- [x] App.tsx batch entry points dispatch to context
- [ ] Remove local batch state from App.tsx (deferred)
- [ ] Batch dialog migration (deferred to Story 14d.6)

**Reference:** `story-14d.5-batch-scan-refactor.md`, `src/contexts/ScanContext.tsx`, `src/hooks/useScanStateBridge.ts`

### PendingScan Cleanup Pattern (Story 14d.4e - Code Review 2026-01-10)

**Problem:** Migrating ~35 `pendingScan` usages to ScanContext while maintaining backwards compatibility.

**Solution Implemented:**
1. **Complete useState removal**: Removed `pendingScan` and `pendingScanInitializedRef` from App.tsx
2. **Status mapping**: `'analyzing'` → `phase === 'scanning'`, `'analyzed'` → `phase === 'reviewing'`, etc.
3. **Deprecation markers**: `@deprecated` JSDoc on PendingScan type and legacy API functions
4. **Future cleanup TODO**: Added comment for complete legacy removal in separate story

**Issues Found and Fixed (Code Review):**
- **17 console.warn statements in useScanStateMachine.ts NOT DEV-gated** → Wrapped in `if (import.meta.env.DEV)`
- **3 console.warn statements in pendingScanStorage.ts NOT DEV-gated** → Wrapped in `if (import.meta.env.DEV)`

**Key Learnings:**
1. **DEV-gate ALL debugging output**: `if (import.meta.env.DEV) { console.warn(...); }` - prevents console noise in production
2. **Migration comments help**: Replace setter calls with comments explaining the migration: `// Story 14d.4e: state now derived from scanState.phase`
3. **Build size benefit**: DEV-gating + tree-shaking reduced bundle by ~1.4KB
4. **Test verification**: Run related tests after migration (106 tests covering state machine + context + storage)

**Acceptance Criteria Pattern:**
- Mark AC complete only when implementation verified in code
- Leave unchecked ACs for manual testing (E2E verification)

**Reference:** `story-14d.4e-pendingscan-cleanup.md`, `src/hooks/useScanStateMachine.ts`, `src/services/pendingScanStorage.ts`

### State Machine Migration Pattern (Story 14d.4c - Code Review 2026-01-10)

**Problem:** When migrating from useState to derived state via state machine, leaving no-op setter wrappers creates dead code that confuses future maintainers.

**Anti-Pattern Detected:**
- Created no-op `setScanButtonState` wrapper that did nothing
- Called it 36 times throughout App.tsx expecting state changes
- Actual state derived from `scanState.phase` via `useMemo`

**Solution Applied:**
1. **Remove no-op wrappers completely** - If setter does nothing, don't keep it
2. **Replace calls with comments** - Explain that state is now derived: `// Story 14d.4c: scanButtonState derived from phase`
3. **Keep only the derived value** - `const scanButtonState = useMemo(() => ..., [scanState.phase])`

**Key Learnings:**
1. **Dead code removal** - When migrating to derived state, remove ALL setter calls, not just the useState
2. **setTimeout(0) pattern** - Valid for deferring to next tick when chaining React state updates
3. **Null-op wrappers** - If `setScanError(null)` is a no-op, document that error clearing happens elsewhere (reset/processStart)
4. **State derivation clarity** - Use `useMemo` directly, not intermediate variables like `derivedScanButtonState`

**Reference:** `story-14d.4c-state-variable-removal.md` Code Review section

### React Query + Firestore Subscription Pattern (Story 14.29)
- **Don't Use useQuery with Subscriptions**: useQuery expects queryFn to return data; subscriptions update asynchronously
- **Pattern**: Use local state + useEffect for subscription lifecycle, React Query cache only for persistence
- **Prevent Re-render Loops**: Don't call `setData(cached)` on every effect run - use `initializedRef` flag
- **Reset on Key Change**: Track `lastKeyStringRef` to reset initialization when query key changes (user logout/login)
- **Refs for Stability**: Store subscribeFn and queryKey in refs to avoid stale closures
- **Skip Redundant Updates**: Use `dataRef` + JSON comparison to skip `setData` when data unchanged
- **Avoid useState for Derived Data**: Use `useMemo` instead of useState+useEffect for computed values (e.g., `distinctAliases`)
- **DevTools in Production**: ReactQueryDevtools guarded by `import.meta.env.DEV` - automatically excluded from production builds
- **Reference**: `src/hooks/useFirestoreSubscription.ts`, `story-14.29-react-query-migration.md`

### Transaction Pagination Pattern (Story 14.27)
- **Hybrid Architecture**: Real-time listener for recent 100 + useInfiniteQuery for older pages
- **Cursor Pagination**: Use `startAfter(lastDoc)` - NOT offset-based (offset fetches all skipped docs)
- **hasMore Detection**: Fetch `pageSize + 1` docs, check if >pageSize returned
- **Deduplication**: Merge real-time and paginated by ID, sort by date descending
- **Query Key Hierarchy**: `['transactions', 'paginated', userId, appId]` for selective invalidation
- **Virtualization**: Deferred - react-window v2 API changed, simple list acceptable for expected sizes
- **Tests**: Hook tests need `.tsx` extension when using JSX wrappers
- **Scroll-to-Top on Page Change**: When navigating pages, scroll to top like turning book pages
  - Use `useCallback` helper: `scrollToTop()` with `scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })`
  - For async loads (Firestore pagination): Use `useEffect` watching loading state transition (true→false)
- **Reference**: `src/hooks/usePaginatedTransactions.ts`, `story-14.27-transaction-pagination.md`

### Fullscreen Modal Pattern (ImageViewer)
- **Problem**: `position: fixed` inside scrollable containers gets clipped/constrained
- **Solution**: Use `createPortal(jsx, document.body)` to render at document root level
- **Z-Index**: Use `z-[100]` or higher to ensure modal is above all content
- **Nav Bar Visibility**: Set `bottom: calc(70px + env(safe-area-inset-bottom))` to leave nav visible
- **Background**: Dark overlay `rgba(0, 0, 0, 0.9)` covering content area only
- **Image Sizing**: `max-w-full max-h-full object-contain` to fit without scrolling
- **Body Scroll Lock**: `document.body.style.overflow = 'hidden'` on mount, restore on unmount
- **Reference**: `src/components/ImageViewer.tsx`

---

## Pattern Reference (92 patterns consolidated)

### Animation & Motion (#35-48, #56-64)
| Pattern | Summary |
|---------|---------|
| Duration Constants | Use `DURATION.FAST/NORMAL/SLOWER` from constants.ts |
| No CSS Transition with RAF | requestAnimationFrame provides interpolation; don't double up |
| Reduced Motion | Check `useReducedMotion()` before all animations |
| Global CSS Keyframes | Define in index.html, not inline JSX (performance) |
| Entry Animation | Use `isVisible` state + useEffect with small delay |
| Staggered Reveal | TransitionChild with indices 0-N, cap at MAX_DURATION |
| useCountUp Hook | Animates 0→target with ease-out, respects reduced motion |

### React Patterns (#17-27, #53-55, #67-69)
| Pattern | Summary |
|---------|---------|
| Extract Shared Utils | If >2 components use same logic, create shared util |
| Single Canonical Type | Define once in hook, re-export from components |
| useCallback for Convenience | Wrap hook functions with proper deps |
| Unused State with Refs | Prefix with underscore: `_batchCancelRequested` |
| Hook Wrapper for Services | Service = pure logic, hook = React state |
| **Time Period Cascade** | When switching granularity, adjust related values (Q3→Month = July, not January) |

### SVG & Charts (#49-52, #62-64)
| Pattern | Summary |
|---------|---------|
| Unique SVG IDs | Use `useMemo(() => \`prefix-${random}\`, [])` for gradients/filters |
| Transform Origin | Set `transformOrigin: 'center center'` for scaling |
| Keyboard Navigation | If onClick exists, add onKeyDown for Enter/Space |
| Test Keyboard A11y | `fireEvent.keyDown(el, { key: 'Enter' })` must trigger action |

### CSS & Theming (#70-72, #87-90)
| Pattern | Summary |
|---------|---------|
| Safe Area Insets | `env(safe-area-inset-top/bottom)` for fixed headers/nav |
| Header Variants | Use variant prop (`home|detail|settings`) not boolean flags |
| Mono Theme | `--accent` MUST be grayscale (zinc-600/400) |
| Three Themes | `:root`, `.dark`, `[data-theme="X"]`, `[data-theme="X"].dark` |
| Viewport Units | Use `h-[100dvh]` not `min-h-dvh` for fixed viewport |

### Testing (#23-27)
| Pattern | Summary |
|---------|---------|
| localStorage Mock | Use `vi.stubGlobal('localStorage', mockObj)` in happy-dom |
| Timestamp Mock | Create factory with `toDate()`, `seconds`, `nanoseconds` |
| Test New Components | Every new `.tsx` file needs corresponding test file |
| Verify App.tsx Integration | Components exist but may be unreachable without routing |

### Mobile/PWA (#20-22, #65-69)
| Pattern | Summary |
|---------|---------|
| Haptic Feedback | `navigator.vibrate(10)` with reduced motion check |
| Swipe Direction Lock | Lock after 10px movement to prevent scroll conflict |
| Long-press Detection | Use pointer events, store timeout in useRef |

### Mockup/Design (#28-34, #74)
| Pattern | Summary |
|---------|---------|
| Gastify Branding | User-facing app is "Gastify", not "Boletapp" |
| CLP Format | Dot separator: $45.200 (not $45,200) |
| Carousel Integration | 3-level: container → wrapper (overflow:hidden) → track + indicator |
| Centered Modal | `top:50%; left:50%; transform:translate(-50%,-50%)` with matching keyframes |
| Canonical Mockup | Reference home-dashboard.html as source of truth |

### Documentation (#85-86)
| Pattern | Summary |
|---------|---------|
| AC Claims Match Implementation | Update ACs when mockup-driven changes relocate features |
| Story Artifacts Accuracy | Update file lists, test counts, section headers on review |

---

## UX Design Principles (Epics 13-15)

### The Gastify Voice
- **Observes without judging**: "Restaurants up 23%" not "You overspent"
- **Reveals opportunity**: Trade-off visibility without guilt
- **Celebrates progress**: Personal records, milestones
- **Normalizes setbacks**: "La vida es rara. Los datos también."

### Key Design Patterns
- **Dynamic Polygon**: 3-6 sided spending shape
- **Expanding Lava**: Inner polygon = spending, outer = budget (inverted)
- **"Everything Breathes"**: Motion system with subtle animations
- **"Intentional or Accidental?"**: Non-judgmental spending prompts

---

## Team Agreements

1. Pre-flight sync check before epic deployments
2. Hotfixes backported immediately to all branches
3. Merge commits for sync PRs (not squash)
4. Architecture decisions before UX changes
5. Mockups before implementation for UX work
6. Every epic ends with deployment story
7. Brainstorming before major UX redesigns

---

## Sync Notes

- **Generation 1 Optimization (2026-01-06)**: Consolidated 92 patterns from 67KB to ~15KB
- Patterns organized by category with summary tables
- Full pattern details available in backup: `backups/v1/knowledge/06-lessons.md`
- Code examples removed (reference source files instead)
