# Historical Lessons (Retrospectives)

> Section 6 of Atlas Memory
> Last Optimized: 2026-01-24 (Generation 5)
> Sources: Epic retrospectives, code reviews

## What Worked Well

| Lesson | Context |
|--------|---------|
| PRD + Tech-Spec Workflow | Essential for UX-heavy epics |
| Story-to-Story Knowledge Transfer | Dev records enable pattern reuse |
| Code Review Discipline | All stories get adversarial reviews |
| Parallel CI Jobs | 63% faster after Epic 8 optimization |
| Mockup-First Workflow | Design before implementation for UX |
| Single Source of Truth Schema | Categories/currencies in shared/schema/ |
| Unified View Pattern | Consolidate similar views with mode prop |
| Versioned Persistence Format | Version field enables safe migrations |
| Phased Migration | Parallel systems reduce regression risk |
| Atlas Agent Integration | Consistent code reviews + architectural memory |
| Design-First Workflow (Mockups) | HTML mockups as source of truth guided Epic 14 |
| Prompt Iteration Workflow | Fast feedback loop using Epic 8 test harness |
| Tiered CI/CD | develop=smoke ~3min, main=full ~5min |
| Incremental Modal Migration | Migrate components to Modal Manager one-by-one while keeping old APIs for compatibility (14e-4) |
| useEffect Modal Orchestration | Complex modals with state dependencies use useEffect + refs to trigger openModal on state transitions (14e-5) |
| Pure Utility Extraction Pattern | Extract pure functions FIRST before handler refactoring - enables unit testing without mocking hooks/context (14e-8a) |
| Dependency Injection for Purity | Pass validator functions as params instead of importing directly - `parseLocationResult(scan, defaults, getCitiesForCountry)` enables testing (14e-8a) |
| Archie Pre-Review Pattern | Run architecture review (Archie) before code review to catch magic numbers and missing JSDoc annotations early - reduces code review iterations (14e-8b) |
| Review Follow-up in Same Story | Address code review findings immediately in same story rather than deferring - keeps story clean and avoids accumulating tech debt (14e-10) |
| useShallow Combined Selectors | Combine multiple Zustand selectors into single useShallow() call to reduce re-renders - batch related state reads (14e-10) |
| Partial Integration Pattern | When orchestrator component rendered outside main layout, return null for phases handled by other components to avoid duplicate UI and layout issues (14e-11) |
| Defensive Phase Guards | State components should have phase guards (`if (phase !== 'expected') return null`) even if called from orchestrator - prevents rendering when used outside expected context (14e-11) |
| Translation Key Fallbacks Hide Bugs | `t('key') \|\| 'Fallback'` patterns mask missing keys in production - verify keys exist in translations.ts, don't rely on fallback strings appearing (14e-11) |
| Context Provider Render Timing | Composition hooks in component body execute BEFORE React Context providers in JSX render - cannot use useCategoriesContext() in useSettingsViewProps because CategoriesFeature renders inside return statement. Workaround: View components consume context directly via useCategoriesContextOptional() with prop fallback (14e-17b) |
| Verify Staging Before Review | `git status` with `MM` prefix indicates both staged AND unstaged changes - all implementation changes must be staged before marking story for review. Run `git status --porcelain` to verify no unstaged changes exist in claimed files (14e-18c) |
| Entity Re-Export Pattern | FSD entities use re-exports from source files (`export { Type } from '../../types/file'`) - maintains backward compatibility while establishing canonical entity path. No code duplication. (14e-19) |
| Shared Hook Extraction Pattern | Extract common state+effects to `src/shared/hooks/` with barrel exports. Keep compatibility wrappers (e.g., `setToastMessage`) in consumer for gradual migration of ~20+ call sites. Related hooks may have duplicate implementations as tech debt until consumer migrates fully (14e-20a: useDialogHandlers toast unused after useToast extraction) |
| Zustand Persist Store Migration | For settings migration from useState+localStorage to Zustand persist: (1) use merge function for legacy key migration during hydration, (2) mock `zustand/middleware` in tests to avoid localStorage timing issues, (3) replace useState with store selectors (14e-20b) |
| AppProviders Consolidation Pattern | Move provider composition to `src/app/AppProviders.tsx` per FSD layer. Optional handlers prop enables graceful test degradation. View-scoped providers (HistoryFilters, Analytics) stay per-view. Provider order: outermost (no deps) → innermost (may use all) (14e-22) |
| Phase+View Visibility Pattern | Scan overlays need BOTH phase-based AND view-based visibility to match batch mode behavior. Batch mode: `visible={isProcessing && (view === 'batch-capture' \|\| view === 'batch-review')}`. Single scan should behave identically - only show ScanOverlay on scan-related views (scan/scan-result/transaction-editor). Prevents overlay appearing on unrelated views during navigation (14e-23a) |
| Navigation Store Pattern | Move view state (view, previousView, settingsSubview) and cross-view state (pendingFilters, analyticsInitialState) to Zustand store with devtools. Re-export types from original location for backward compatibility. Store's setView automatically tracks previousView - no separate setter needed. useShallow() required for action object selectors to prevent infinite re-renders (14e-25a.1) |
| Handler Hook to Store Migration | When migrating from handler hooks (useNavigationHandlers) to Zustand stores: (1) Move pure state to store, (2) Keep DOM-dependent logic (scroll refs, dialog dismissal) as local wrappers in consumer, (3) Move useEffect side effects to consumer, (4) Handler hooks can stay for test coverage but mark as "replaced by local wrappers" (14e-25a.1 V1/V3 review fix) |
| Composition Hook Data Ownership | Create `useViewData()` hooks that call data hooks internally (useAuth, usePaginatedTransactions) vs `useViewProps()` that receive data as params. Data ownership hooks enable view-level data lifecycle control without App.tsx prop drilling (14e-25a.2a: useHistoryViewData pattern) |

## What to Avoid

| Failure | Prevention |
|---------|------------|
| Oversized Stories (14c-refactor.22a) | Max 4 tasks, 15 subtasks, 8 files per story - split upfront, not mid-development |
| Git Branch Divergence | Merge commits for sync PRs (not squash) |
| Bundle Size Growth (2.92 MB) | Code-splitting (deferred to Epic 14E) |
| Unsafe Regex Patterns (ReDoS) | Use simple non-greedy patterns |
| API Key Leaks | Always use env variables |
| Scope Creep (7→21 stories) | Better upfront scoping |
| No-op Setter Wrappers | Remove completely when migrating to derived state |
| State Machine Callback Race Conditions | Pass compound payloads to atomic state transitions |
| Missing Asset Files | Verify static assets exist during implementation |
| Large File Sprawl | Modularize before files exceed 500 lines |
| Legacy Code Extension | Refactor FIRST before extending |
| Cost Monitoring Gap | Set up Firebase budget alerts proactively |
| Infinite Loop in useEffect | Use refs to track data changes, not useMemo results |
| Default Array Parameters | `{ items = [] }` creates new ref - use module-level const |
| No-op Code with Logging | Code that logs but doesn't call setter = bug (14c.19: setGroupMode logged but never called) |
| Aggressive Caching with Real-Time Sync | 1hr staleTime + refetchOnMount:false breaks cross-user sync - use default React Query settings for shared data (14c.20→14c.23) |
| Delta Sync Cannot Detect Deletions | Delta fetch shows adds/mods but NOT removals - design soft delete or tombstones BEFORE implementing sync (14c failure) |
| First-Works-Then-Fails Pattern | Sync that works once may fail on subsequent ops due to stale refs/listeners - test 3+ consecutive operations always (14c failure) |
| Full Refetch Fallback = Cost Bomb | When delta breaks, do NOT ship refetchOnMount:true - costs explode O(txns × users × navs), 100 users = $3/day (14c failure) |
| Refactor Before Extending Legacy | Epic 14c extended transaction system without refactoring first - caused cascade of sync bugs (apply Epic 12-14 retro lesson) |
| Aspirational LOC Targets | 1,500-2,000 line target for 4,800-line App.tsx was unrealistic - actual minimum ~3,500 lines due to state/handler complexity (14c-refactor.35d) |
| Orchestrator Outside Layout | Rendering orchestrator BEFORE AppLayout causes any content to push views down - use null returns during partial integration when overlays handle phases (14e-11 header-in-middle bug) |
| Dialog Type Conflicts | Multiple components checking same condition (scan complete) can trigger conflicting UI (ScanCompleteModal vs QuickSaveCard) - check for active dialog type before showing local modals (14e-11) |
| Untracked New Files | `git status` shows `??` for untracked files - new files need `git add` before commit. Story marked "done" with untracked files = incomplete. Run `git status --porcelain` and verify all claimed files have `A ` or `M ` prefix (14e-22 code review fix) |

---

## Critical Patterns by Domain

### Security
| Pattern | Rule |
|---------|------|
| API Key Leaks | Create fresh branch, don't rewrite history |
| ReDoS Prevention | Avoid nested quantifiers. GOOD: `[\s\S]*?` |
| Input Sanitization | `src/utils/sanitize.ts` blocks XSS patterns |

### Git Strategy
| Pattern | Rule |
|---------|------|
| 3-Branch | `feature/* → develop → staging → main` |
| Merge commits | For sync PRs, not squash |
| Hotfixes | Backported immediately |
| Credentials in commits | gitleaks scans full history; must rewrite history if leaked, not just delete file |
| Pre-commit gitleaks | Install gitleaks locally to catch secrets before push |

### Firestore
| Pattern | Rule |
|---------|------|
| Defensive Timestamps | `try/catch` with `?.toDate?.()` |
| serverTimestamp() | Use `*Create` interface with `FieldValue` |
| LISTENER_LIMITS | Always apply limits to real-time queries |
| Cross-User Queries | Use Cloud Function with server-side validation, NOT client collectionGroup |
| Collection Group Limitation | Firestore CANNOT evaluate `resource.data.*` in collection group queries |
| Batch commit retry | Use `commitBatchWithRetry()` with exponential backoff (MAX_RETRIES=2, 500ms base) for batch commits (14c-refactor.6) |
| Dry-run loops | NEVER loop through docs in dry-run - use `count()` aggregation and return immediately (14c-refactor.6) |

### React Query + Firestore
| Pattern | Rule |
|---------|------|
| No useQuery with subscriptions | Use local state + useEffect |
| Prevent loops | Use `initializedRef` flag |
| Refs for stability | Store subscribeFn in refs |
| Skip redundant updates | JSON comparison before `setData` |

### State Machine (Epic 14d)
| Pattern | Rule |
|---------|------|
| Atomic state updates | Pass compound data in action payload |
| Batch edit thumbnails | Set `thumbnailUrl` on transaction, NOT via `setScanImages()` |
| DEV-gate console warnings | `if (import.meta.env.DEV) { console.warn(...); }` |
| setTimeout(0) | Valid for deferring React state update chains |

### Modal Manager (Epic 14e - Stories 14e-4, 14e-5)
| Pattern | Rule |
|---------|------|
| Incremental migration | Keep old state APIs while migrating to Modal Manager - remove after all consumers migrated |
| Code splitting | Use React.lazy() in registry - verified chunks: CreditInfoModal 3KB, SignOutDialog 3.4KB |
| onClose composition | ModalManager composes onClose: calls store.closeModal() THEN props.onClose() |
| Backward compatibility | Export old state (showCreditInfoModal) via hooks while new pattern (openModal) is adopted |
| Props defaulting | Modal components should default isOpen=true for ModalManager, use prop when standalone |
| i18n for modals | Use t() function with fallbacks - SignOutDialog pattern: `t('key') || fallback` |
| openModalDirect for refs | Use openModalDirect/closeModalDirect in useCallback handlers that access refs (14e-5 conflict dialog) |
| useEffect modal triggers | Open modals via useEffect on state transitions, NOT in handler - prevents stale closures (14e-5 learning dialogs) |
| Test cleanup after migration | Remove mocks and describe blocks for migrated modals from old test files (14e-5 AppOverlays.test.tsx) |
| Vitest path aliases | Add tsconfigPaths() to vitest.config.unit.ts for @managers/*, @/* aliases to work in tests (14e-5 fix) |
| Batch edit mode preservation | Check `wasInBatchEditingMode` BEFORE calling saveTransaction - setScanImages([]) only works in 'capturing' phase (14e-5 bug fix) |
| FAB navigation batch awareness | FAB navigateToActiveRequest must check `scanState.mode` - batch→batch-review, single→transaction-editor (14e-5 bug fix) |
| Single scan image limit | When single scan mode but multiple images selected, use first image only and show toast suggesting batch mode (14e-5 bug fix) |

### Shared Groups (Epic 14c)
| Pattern | Rule |
|---------|------|
| Top-level collections | Cross-user access requires collection outside user path |
| Security rule helpers | `isGroupMember()`, `isGroupOwner()`, `isJoiningGroup()` |
| Query key centralization | ALL React Query keys in `src/lib/queryKeys.ts` |
| Barrel exports | New components MUST export from domain `index.ts` |
| Firestore indexes | Composite indexes for array-contains + orderBy |
| Array deduplication | `[...new Set(ids)]` on both read AND write |
| Selection mode | Long-press entry (500ms), exit on delete complete |
| Cross-user transactions | Cloud Function `getSharedGroupTransactions` with server-side membership validation |
| UUID-obscurity NOT security | Don't rely on unguessable IDs for access control |
| Query key without date range | `sharedGroupTransactions(groupId)` only - enables cache sharing (14c.16) |
| Client-side date filtering | Fetch ALL once, filter via `useMemo` - fixes year dropdown bug (14c.16) |
| Three-tier return values | `rawTransactions` → `allTransactions` → `transactions` for filter flexibility |
| Wire raw data to views | Pass `rawTransactions` (not filtered) to views for year picker computation (14c.16 follow-up) |
| Error classification | Use `classifyError()` utility to detect Firebase/network/storage errors (14c.11) |
| Quota exceeded handling | `writeToCacheWithRetry()` cleans cache before retry, returns gracefully on failure |
| Error boundary wrapping | Domain views (GruposView) wrapped with `SharedGroupErrorBoundary` in parent (SettingsView) |
| Test mock completeness | Mock ALL imported functions including `writeToCacheWithRetry` to avoid vitest warnings |
| Coordination hooks | Use separate hook (`useViewModePreferencePersistence`) to orchestrate context + Firestore + validation (14c.18) |
| Three-ref lifecycle tracking | `hasInitialSyncRef`, `prevModeRef`, `hasAppliedFirestoreRef` prevent loops and track state phases (14c.18) |
| Firestore preference priority | Firestore > localStorage > default on preference load (14c.18) |
| Group validation timing | Wait for groups to load before validating group mode preference (14c.18) |
| Fallback to personal mode | If persisted groupId not found in user's groups, default to personal (14c.18) |
| Multi-effect race condition | NEVER split state read + state write across two useEffects - combine into single effect to avoid stale state (14c.18 race condition fix) |
| Unified validation pattern | When loading depends on multiple sources, wait for ALL to finish in ONE effect before applying state (14c.18 race condition fix) |
| nanoid URL-safe validation | Share code regex must include `_-` characters: `/^[a-zA-Z0-9_-]{16}$/` (14c.17 bug fix) |
| Type consolidation | Duplicate interfaces → single file in `src/types/`, re-export for backwards compatibility (14c.15) |
| Env vars for config | Client-side config via `import.meta.env.VITE_*` with validation + helpful error (14c.15) |
| Cache optimization revert | Story 14c.20 aggressive caching (1hr stale, 24hr gc) caused sync issues - reverted to baseline (14c.23) |
| Delta sync complexity | V2 delta sync with `removedFromGroupIds` added complexity without solving core sync timing issues |
| Revert over fix forward | When cache strategy fundamentally breaks sync, revert to known-good state rather than patch |
| Epic 14c FAILED | Entire epic reverted 2026-01-20 - see `docs/sprint-artifacts/epic-14c-retro-2026-01-20.md` for full analysis |

### Real-Time Sync (Epic 14c FAILURE LESSONS)
| Pattern | Rule |
|---------|------|
| Deletion detection REQUIRED | Delta sync cannot see removals - must design soft delete, tombstones, or version vectors BEFORE implementation |
| Multi-operation testing | Test 3+ consecutive operations: add→sync→modify→sync→delete→sync; single-op tests give false confidence |
| No full refetch fallback | When delta breaks, STOP and fix - do NOT ship `refetchOnMount: true` as band-aid (costs explode) |
| Tiered sync windows | Real-time only for recent data (60 days); older data on-demand with cooldown |
| Manual refresh cooldown | Rate limit: 1min (x3), then 15min, reset daily - prevents abuse |
| State staleness after first op | useRef for comparison must update AFTER handling event; listener cleanup on component unmount |
| Cost monitoring BEFORE launch | Set Firestore budget alerts before shipping any multi-user feature |
| Caching vs real-time tradeoff | Cannot optimize for BOTH minimal reads AND instant sync without sophisticated infrastructure |

### i18n & Translations
| Pattern | Rule |
|---------|------|
| No hardcoded strings | Use `t('key')` function always |
| Check existing keys | Search translations.ts before adding |
| Both languages | Add en AND es simultaneously |
| Test mockT | Return actual translations, not just keys |
| Fallback masks bugs | `t('key') \|\| 'Fallback'` hides missing keys - verify keys exist in translations.ts (14c-refactor.5) |
| File List accuracy | If claiming translations.ts modified, grep for the keys to verify (14c-refactor.5 review finding) |

---

## Pattern Quick Reference

### Animation & Motion
| Pattern | Rule |
|---------|------|
| Duration Constants | Use `DURATION.FAST/NORMAL/SLOWER` |
| No CSS + RAF | Don't double up animation sources |
| Reduced Motion | Check `useReducedMotion()` before all |
| Staggered Reveal | Use indices with `maxDurationMs` cap |

### React Patterns
| Pattern | Rule |
|---------|------|
| Extract Shared Utils | If >2 components use same logic |
| Single Canonical Type | Define once in hook, re-export |
| useCallback | Wrap hook functions with proper deps |
| Unused State | Prefix with underscore: `_cancelRequested` |
| useMemo in useEffect deps | Use ref to track source data changes |
| Hooks before early returns | ALL hooks must be called BEFORE `if (!user) return` or `if (error) return` - React requires same hook order every render (14c-refactor.30b bug fix) |

### CSS & Theming
| Pattern | Rule |
|---------|------|
| Safe Area Insets | `env(safe-area-inset-*)` for fixed elements |
| Mono Theme | `--accent` MUST be grayscale |
| Viewport Units | `h-[100dvh]` not `min-h-dvh` |
| Touch Targets | Minimum 44px |
| Theme-Aware Components | Use CSS vars not hardcoded Tailwind colors |

### Mobile/PWA
| Pattern | Rule |
|---------|------|
| Haptic Feedback | `navigator.vibrate(10)` with reduced motion check |
| Swipe Direction Lock | Lock after 10px movement |
| Long-press | Use pointer events, store timeout in useRef |
| Portal for modals | `createPortal(content, document.body)` escapes overflow:hidden |

### Testing
| Pattern | Rule |
|---------|------|
| localStorage Mock | `vi.stubGlobal('localStorage', mockObj)` |
| Timestamp Mock | Factory with `toDate()`, `seconds`, `nanoseconds` |
| Hook tests | Use `.tsx` extension when JSX wrappers needed |
| Timer act() wrapping | Wrap `vi.advanceTimersByTime()` in `act()` |
| Filter State in Tests | Use `initialState={{ temporal: { level: 'all' } }}` for old dates |
| Explicit Test Groups | Module-based configs vs `--shard` for predictable CI |
| Portal components | Use `document.body.querySelectorAll()` in tests |
| Context callbacks affect fallback | When ViewHandlersContext provides callback (e.g., handleNavigateToHistory), component calls it instead of fallback behavior. Tests for fallback (inline pagination) must set mock to undefined (14c-refactor.36) |
| CI Group Coverage | New test directories need: (1) `vitest.config.ci.group-{name}.ts`, (2) job in `.github/workflows/test.yml`, (3) `merge-coverage` needs update (14e-1) |
| Collocated Tests Pattern | Feature-based tests at `src/features/**/store/__tests__/` need CI group include patterns - add to existing group (e.g., managers) rather than creating new CI job (14e-6d) |
| Test path aliases | Use relative imports in test files, NOT `@features/*` path aliases - vite-tsconfig-paths may not resolve new directories until committed. Relative paths always work: `../../../../../../src/features/...` (14e-8a) |
| Vitest explicit aliases | tsconfig.json `include: ['src']` means tsconfigPaths() only resolves aliases for src/ files. Add explicit aliases to vitest.config.unit.ts `resolve.alias` for @features/@entities/@managers/@shared/@app/@ to work in tests/ directory (14e-9a) |
| Integration test aliases | vite.config.ts ALSO needs explicit `resolve.alias` for integration tests (not just vitest.config.unit.ts). When `vitest run tests/integration` uses vite.config.ts, missing aliases cause "Failed to resolve import" errors (14e-9b) |
| Prop-based component migration | Before converting components to Zustand hooks, verify they actually USE context. Many "consumer" components are prop-based presentation components that receive state from parents - no migration needed (14e-9b finding: only ScanCompleteModal used context) |
| Test file migration when view owns data | When migrating views from props to internal hooks (useViewData pattern), ALL test files using props-based rendering MUST be updated to mock internal hooks. Tests using old API will fail with "must be used within Provider" errors. Search for all tests that `import { ViewName }` and verify they mock internal hooks (14e-25a.2b: HistoryViewThumbnails.test.tsx had 30 failing tests - missed during implementation) |
| useShallow test mock pattern | When component changes from individual selectors to useShallow combined selector, update test mock to mock `useScanStore` with selector function, not individual `useScanPhase`/`useScanMode` hooks (14e-10) |

---

## UX Design Principles

### The Boletapp Voice
- **Observes without judging**: "Restaurants up 23%" not "You overspent"
- **Reveals opportunity**: Trade-off visibility without guilt
- **Celebrates progress**: Personal records, milestones
- **Normalizes setbacks**: "La vida es rara. Los datos tambi&#233;n."

### Key Design Patterns
| Pattern | Implementation |
|---------|----------------|
| Dynamic Polygon | 3-6 sided spending shape |
| "Everything Breathes" | Motion system with subtle animations |
| "Intentional or Accidental?" | Non-judgmental spending prompts |
| Skeleton loading | `animate-pulse` + `role="status"` + `aria-label` |
| Context-aware empty states | Check `memberCount <= 1` for invite vs scan CTAs |

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

## Code Review Patterns (Consolidated)

### Story Documentation
| Pattern | Rule |
|---------|------|
| Task checkboxes | Mark `[x]` IMMEDIATELY after completing EACH task/subtask - batch marking at story end causes 40+ unchecked items (14e-17 failure) |
| File List | MUST match git changes, never empty |
| Story status | Update before commit (not "Ready for Dev") |
| AC partial implementation | Document alternatives explicitly |
| Multi-session stories | Organize File List by session with labels |
| Code Review Fixes section | Verify fixes were actually applied to code, not just documented (14c-refactor.4) |
| Doc code examples | Keep embedded code examples in sync with actual implementation |
| Commit before claiming deployed | Run `git status` before marking deployment tasks complete - Firebase deploy without commit = lost work risk (14c-refactor.7) |
| README script documentation | When archiving scripts, update README with separate "Archived Scripts" section - don't just leave entries in active table (14c-refactor.8) |
| Deferral documentation | When tasks deferred, mark `[ ]` with "DEFERRED:" prefix and rationale; add TODO(story-id) for follow-up (14c-refactor.27) |
| File List vs git reality | Before marking done, `git status` must match File List - claiming unmodified files is HIGH severity finding (14c-refactor.27) |
| Staging verification | Before code review, verify files are STAGED (not just modified): `A ` or `M ` prefix OK, but ` M` (unstaged) or `??` (untracked) = files WILL NOT be committed. Run `git add` on all implementation files before marking ready-for-review (14e-23a: 328 lines of ScanFeature.tsx changes were unstaged) |

### Story Sizing Patterns (Story 14c-refactor.22a Split)
| Pattern | Rule |
|---------|------|
| Context window reality | One dev cycle = one context window = limited capacity |
| SMALL story (1 pt) | 1-2 tasks, ≤5 subtasks, single file focus |
| MEDIUM story (2-3 pts) | 2-3 tasks, ≤10 subtasks, 2-4 files |
| LARGE story (5 pts) | 3-4 tasks, ≤15 subtasks, 4-8 files (upper limit) |
| TOO LARGE (split required) | >4 tasks OR >15 subtasks OR >8 files - split BEFORE development |
| Post-hoc split cost | Worse than upfront split - wastes context discovering scope, requires refactoring story docs |
| Task independence | Each task should be completable without prior task context (enables splitting) |
| Dependency chains | If Task B needs Task A output, they're candidates for separate stories |
| 22a→22e example | 5 tasks became 5 stories: hooks (22a) → types (22b) → function (22c) → component (22d) → verify (22e) |
| 30/31 props pattern | Props alignment stories split by_phase: interface (a) → hook (b) → integration (c) - consistent 2pt stories |
| Story consolidation check | When splitting large story (14e-6 → 6a/b/c/d), check if upcoming stories overlap with split scope - 14e-7 was absorbed by 14e-6c |
| "may be consolidated" note | Add note in sprint-status.yaml when split creates potential overlap with future stories |
| Reducer migration inventory | When splitting reducer→store migrations, create explicit action inventory with ownership per split story (14e-6b: SET_STORE_TYPE/SET_CURRENCY fell between 6a/6b scopes) |

### Hook Extraction Patterns (Story 14c-refactor.20)
| Pattern | Rule |
|---------|------|
| No unused props | Remove props from interface if not used - don't accept then void/ignore (14c-refactor.20) |
| TODO story tracking | Link TODOs to specific future stories: `// TODO(story-id): description` (14c-refactor.20) |
| Incremental integration | Large extractions can split: hooks created → integrated → tested across multiple stories (14c-refactor.20/20a/20b) |
| Design decision docs | When keeping code in original location by design, document rationale in story (processScan in App.tsx) |
| Props pattern for handlers | Pass callbacks as props (not internal hooks) for testability and reduced coupling |

### Component Patterns
| Pattern | Rule |
|---------|------|
| Barrel exports | Add to domain `index.ts` immediately |
| Unused variables | TS6133 if declared but not applied |
| Empty ternary | Remove no-op `${cond ? '' : ''}` patterns |
| Lang prop threading | Localized components must receive `lang` prop |
| Disabled prop | opacity 0.7, cursor 'default', native `disabled` |
| Component integration | New components MUST be rendered in views, not just exported |
| i18n `t` prop | Pass `t` function to components with user-facing text |
| getText fallback | Use `getText(key)` helper for components that may not have `t` |
| Error boundary integration | Wrap domain views (e.g., GruposView) with domain error boundary |
| Props type export | Export interface alongside component: `export type { FooProps }` |
| Tests with new components | Create unit tests alongside new components - conditional rendering logic needs test coverage (14c-refactor.22d: 28 tests added) |
| Store action in component | Use store selector directly `useFooStore((s) => s.action)`, mark callback prop as `@deprecated` optional (14e-15: BatchReviewCard discardItem) |
| Store test mock pattern | Mock with selector: `vi.fn((selector) => selector({ action: mockFn }))`, verify `mockFn.toHaveBeenCalledWith(entityId)` |

### Data & State
| Pattern | Rule |
|---------|------|
| Query keys | Centralize in `src/lib/queryKeys.ts` |
| Module cache testing | Export `_clearCache()` for test isolation |
| Category name language | Normalize before comparison (Spanish storage, English hooks) |
| Two-way batch binding | Update BOTH currentTransaction AND batchReceipt in context |

### Firestore Rules
| Pattern | Rule |
|---------|------|
| Deploy rules | `firebase deploy --only firestore:rules` after changes |
| Collection group queries | Auth-only + limit, NOT resource.data.* conditions |
| Email comparison | `request.auth.token.email.lower()` for case-insensitive |
| Status-only updates | `affectedKeys().hasOnly(['status'])` pattern |

---

### Integration Testing (Story 14c-refactor.18)
| Pattern | Rule |
|---------|------|
| Console warnings | COOP warning from Firebase Auth popup is expected (browser security policy, not a bug) |
| SES intrinsics | "SES Removing unpermitted intrinsics" is from browser extensions, not our code |
| Share code validation | Invalid format codes (not 16 chars) silently redirect - add user-friendly error in Epic 14d |
| Deep link testing | Test with VALID format codes (16-char alphanumeric) not human-readable strings like "TESTCODE" |

### Documentation Stories (Story 14c-refactor.19, 14c-refactor.24)
| Pattern | Rule |
|---------|------|
| File List completeness | Include ALL modified files - Atlas memory files, sprint-status.yaml, not just main docs |
| AC implementation changes | When approach differs from AC spec (e.g., deprecation notices vs archive moves), update Dev Notes AND File List |
| Document footer sync | Footer version/date MUST match header "Last Updated" - stale footers cause confusion |
| Deprecation in place | Valid alternative to moving files - add notice, document decision change in story |
| Root file deletions | When deleting root-level files (run_app.local.md, steps_for_epics.md), document in Completion Notes even if duplicates |
| Broken link check | After moving/archiving files, grep for references to old paths in *.md files (14c-refactor.24: docs/index.md referenced archived tech-spec) |
| Section header counts | Verify "(N)" in section headers matches actual item count - easy to miss when list grows |
| Audit "no changes" outcome | Valid when audit discovers work already done (e.g., 32a found names aligned by Story 27). Document: what audited, why no changes, git context for other-story modifications (14c-refactor.32a) |

### Audit Documentation Accuracy (Story 14c-refactor.35a)
| Pattern | Rule |
|---------|------|
| Verify line counts | Use `wc -l` and `awk` to measure actual line counts - don't estimate "~200 lines" when actual is 91 (14c-refactor.35a) |
| Verify dead code claims | Grep for claimed patterns (e.g., commented view blocks) before listing as dead code (14c-refactor.35a: patterns not found) |
| Story vs audit alignment | When story background claims "~3,700 lines" but audit measures 4,221, update BOTH documents to match reality |
| Output filename consistency | Dev Notes output path and File List must match - don't claim `app-tsx-audit-report.md` but create `35a-app-audit-report.md` |
| Target alignment | When story and audit have different targets (1,500-2,000 vs 1,000-1,200), clarify which is authoritative |
| File List deduplication | Files created in a story should only appear under "Created", not also "Modified" - even if edited during development |
| Checklist context | When including testing checklists in audit docs, clarify they apply to follow-up implementation stories, not the audit itself |
| Gap quantification | Explicitly quantify gaps (e.g., "2,791 lines vs 1,500 target = 86% over minimum") - helps stakeholders understand scope of additional work |
| Extracted code line counts | When documenting extracted components/hooks, run `wc -l` on EACH file - estimates can be 2-6x off (14c-refactor.35d: useScanHandlers claimed ~150, actual 1,006) |

### Workflow Design Patterns (atlas-create-story 2026-01-24)
| Pattern | Rule |
|---------|------|
| Post-generation validation | Validation steps must run AFTER content generation |
| Two-layer validation | Estimate (pre-gen) + actual validation (post-gen) |
| Parse actual content | Count actual tasks/subtasks from generated file |

---

## Sync Notes

### Generation 5 (2026-01-24)
- Consolidated Epic 14c-refactor code review patterns (36 stories → pattern tables)
- Added workflow design patterns from atlas-create-story bug fix
- Added CI Group Coverage pattern (new test directories need 3 file updates)
- Added context callback testing pattern

### Key Additions by Date (Consolidated)
| Date | Key Patterns Added |
|------|-------------------|
| 2026-01-29 | Placeholder handler documentation pattern (14e-29d atlas-code-review: handleReduceBatch stub evolved from "stub - 14e-29c" comment to explicit JSDoc explaining WHY it's a no-op - deprioritized UX flow, user workarounds documented. Pattern: Placeholder handlers need explicit JSDoc explaining (1) why it exists, (2) why it's not implemented, (3) what user should do instead, (4) future implementation notes. Prevents "is this a bug?" confusion), Test count accuracy in story docs (14e-29d atlas-code-review: Story claimed 6807 tests but actual run showed 5962 - test counts can drift across multi-day development. Pattern: Re-run tests and update count in story BEFORE marking for review, not during initial implementation), Comprehensive staging audit before review (14e-33 atlas-code-review: Found 2 HIGH severity issues - AC1 implementation (`src/components/scan/BatchUploadPreview.tsx`) and tests (`tests/unit/components/scan/BatchUploadPreview.test.tsx`) showed ` M` (unstaged). Story marked "done" but implementation would be LOST on commit. Pattern: Run `git status --porcelain` before marking story done - ALL claimed files must have `A ` `M ` or `D ` prefix (staged). Files with ` M` `??` `AM` `MM` need `git add` before commit. Verify: no space before status letter = staged correctly), Mobile-first touch target pattern (14e-33: Replace hover-only opacity `opacity-0 group-hover:opacity-100` with always-visible buttons + `min-w-[44px] min-h-[44px]` for 44px touch targets + semi-transparent background for visibility. Desktop hover patterns don't work on touch devices), Zustand store synchronous access in callbacks (14e-33: Use `useBatchReviewStore.getState().items` for synchronous state checks in useCallback handlers - React context state (`scanState.batchReceipts`) may be stale when callback executes. Pattern: When state exists in both Zustand and Context, check Zustand via `getState()` as source of truth), Stale state recovery pattern (14e-33: Auto-detect corrupted/cleared localStorage by checking `!hadItems && isEmpty` - user lands on view but never had data. Pattern: Add recovery case in auto-complete useEffect to reset and navigate to safe state), Dual-store sync pattern (14e-33: When operating on items that exist in TWO stores (batch-review store + scan store), call BOTH store actions: `batchReviewActions.discardItem(id)` AND `scanActions.discardBatchReceipt(id)`. Prevents index misalignment and duplicate saves) |
| 2026-01-28 | Comprehensive staging verification pattern (14e-25b1 atlas-code-review: found 5 staging issues - story file `??` untracked, deleted files ` D` unstaged, modified index ` M` unstaged, `AM`/`MM` staged-with-unstaged - verify ALL claimed files have clean `A `/`M `/`D ` prefix with no space before letter), TrendsView data ownership pattern (useTrendsViewData hook follows useHistoryViewData composition pattern - view owns data via internal hooks, receives NO props from App.tsx except `__testData` for testing), Re-stage after Archie review fixes (14e-25c.1 atlas-code-review: `AM` prefix on useSettingsViewData.ts and test file indicated staged old version + unstaged Archie V1/V2 fixes - always run `git add` AGAIN after applying any review follow-ups, not just after initial implementation), SettingsView composition hook pattern (55+ props organized into nested objects: profile, preferences, theme, subscription, mappings, navigation, account - structured return enables subview data slicing without flat 55-field interface), Multi-file staging verification for new directories (14e-28 atlas-code-review: 4 files ~1,118 lines in `src/views/TransactionEditorView/` + `src/shared/utils/scanHelpers.ts` were `??` untracked - would have been LOST on commit. Pattern: When story creates NEW directories/files, run `git status --porcelain` and verify ALL have `A ` prefix - `??` means UNTRACKED. Run `git add <new-paths>` BEFORE marking story done), Handler extraction Phase 1 pattern (14e-28: Extract handlers to hooks FIRST, defer view integration to Phase 2 story - allows incremental validation without breaking existing prop flow. Creates: useXxxHandlers + useXxxData hooks. Defers: View calling hooks directly, deleting composition hook, App.tsx cleanup), Wrapper pattern staging verification (14e-28b atlas-code-review V1+V2: Wrapper pattern creates TWO files that BOTH need staging. Status `MD` indicates staged modification but unstaged deletion - running `git add` on such files can convert to `R` (rename) when git detects content similarity. Pattern: (1) Wrapper file has `A ` prefix, (2) Renamed file shows `R` (rename) status, (3) No `??` untracked, (4) No mixed `MD`/`MM`/`AM` - if `MD` appears, run `git add` to convert to proper `R` rename status), Consolidated handler hook requires NEW tests (14e-29a atlas-code-review: 582-line useBatchReviewHandlers.ts had ZERO tests despite consolidating 5 handler files with existing tests. Pattern: When consolidating handlers into a React hook, create NEW hook tests - existing handler tests validate pure functions but NOT useCallback wrappers/React integration. Hook adds: memoization, props destructuring, store imports, return object stability. Atlas review added 31 tests for the new hook) |
| 2026-01-27 | Check for duplication before extraction (14e-18b: credit handlers duplicated batch-review - grep codebase for existing implementations), stage files before claiming complete (untracked files = incomplete story - 14e-18c: CreditFeature.tsx untracked despite story marked done), trigger-based cross-component communication (14e-18c: triggerCreditCheck prop with useRef edge detection for false→true transitions), entity re-org staging verification (14e-19: created files showed `??` untracked, modified showed ` M` unstaged - run `git status --porcelain` and verify all claimed files have `A ` or `M ` prefix before review), shared hook extraction with compatibility wrapper (14e-20a: useToast + setToastMessage wrapper for ~20+ call sites), duplicate hook implementations = tech debt (14e-20a: useDialogHandlers toast unused but not removed), story spec typos don't invalidate implementation (14e-20a: `autoDissmissMs` spec vs correct `autoDismissMs` code), CI group coverage for new test directories (14e-21: `tests/unit/app/` not covered - added to vitest.config.ci.group-views.ts), AppProviders consolidation pattern (14e-22: provider composition in src/app/ with optional handlers for test degradation), git status verification before review (14e-22 code review: `??` untracked files caught - run `git add` before marking done), handler hook to store migration pattern (14e-25a.1 V1/V3 review fix: replace useNavigationHandlers with local App.tsx wrappers that use store actions + DOM refs for scroll handling - handler hooks can remain for test coverage but mark as legacy), composition hook data ownership pattern (14e-25a.2a: useHistoryViewData encapsulates data hooks internally vs useHistoryViewProps which receives data as params - allows view to own data lifecycle without prop drilling), shared mockState object for hook tests (14e-25a.2a: use module-level `mockState = {}` modified in beforeEach/tests instead of `require()` dynamic imports - path aliases don't resolve in require()), Dev Agent Record requirement (14e-25a.2a code review: story missing File List/Change Log sections - verify Dev Agent Record exists before marking done), AC documentation must match implementation (14e-25a.2a code review: AC1 said `services` but hook returns `appId` - update AC to reflect actual returns), re-stage after review follow-up fixes (14e-25a.2a atlas-code-review: `AM` prefix = staged old version + unstaged fixes - run `git add` after applying review follow-ups to ensure correct version is committed) |
| 2026-01-26 | Integration test aliases (vite.config.ts + vitest.config.unit.ts - BOTH required), prop-based component migration verification, File List must match git reality (14e-9b code review), review follow-up in same story pattern, useShallow combined selectors, useShallow test mock pattern (14e-10 review follow-up), partial integration pattern, defensive phase guards, orchestrator-outside-layout anti-pattern, dialog type conflict prevention (14e-11 post-deployment fixes), translation key verification before fallback (14e-16 - grep translations.ts before adding `t('key') \|\| 'fallback'` patterns), task checkbox discipline - mark `[x]` immediately not batch at end (14e-17 code review - 40 unchecked tasks found) |
| 2026-01-25 | Zustand store pattern, line count verification, reducer migration inventory pattern (14e-6b), collocated tests CI coverage (14e-6d), pure utility extraction pattern, dependency injection for purity (14e-8a), Archie pre-review pattern (14e-8b) |
| 2026-01-24 | Workflow validation, CI groups, context callbacks |
| 2026-01-23 | Story sizing splits (30-35), hooks before early returns |
| 2026-01-22 | Handler extraction, ViewHandlersContext, documentation |
| 2026-01-21 | Service stubs, Firestore retry, i18n fallback |
| 2026-01-20 | Epic 14c failure lessons (delta sync, cost control) |

**Detailed logs:** Story files in `docs/sprint-artifacts/`
**Epic 14c analysis:** `docs/sprint-artifacts/epic-14c-retro-2026-01-20.md`
