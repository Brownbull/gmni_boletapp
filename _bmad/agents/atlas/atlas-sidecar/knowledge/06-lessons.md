# Historical Lessons (Retrospectives)

> Section 6 of Atlas Memory
> Last Optimized: 2026-01-20 (Generation 6)
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
| Task checkboxes | Mark `[x]` immediately after implementation |
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

---

## Sync Notes

- **2026-01-24:** Deployment Epic 14c Part 4 COMPLETE - 18 stories (20-36) deployed to production via atlas-deploy-story workflow. **Deployment lesson:** `.credentials.json` file accidentally committed triggered gitleaks CI failure. Fix: Rewrite history to exclude file, add to `.gitignore`. **Pattern Added:** Pre-commit hooks should catch credentials files before CI; gitleaks scans full commit history not just HEAD.
- **2026-01-24:** Story 14c-refactor.36 COMPLETE - DashboardView pagination test fixes. **Root cause:** NOT icon buttons (story hypothesis wrong). Actual issue: ViewHandlersContext provides `handleNavigateToHistory` mock which causes "View All" to navigate away instead of showing inline pagination. **Fix:** Add `beforeEach` to set `handleNavigateToHistory = undefined` for pagination tests. All 39/41 tests pass (2 skipped). 5,280 total tests pass. **Pattern Added:** Context callbacks affect fallback behavior - tests for fallback paths must override context mocks.
- **2026-01-24:** Story 14c-refactor.35d CODE REVIEW PASSED - **1 MEDIUM fix applied:** Architecture doc line counts were 2-6x off (estimates vs actual `wc -l`). Fixed: Components (AppOverlays ~300→599, viewRenderers ~150→432, ViewHandlersContext ~80→229) and all 11 hooks (largest: useScanHandlers ~150→1,006). **Pattern Added:** Documentation line counts MUST use actual `wc -l` values, never estimates. Hook extraction totals ~5,000 lines across 11 hooks. Reserved void statements for future Epic 14d documented as intentional.
- **2026-01-24:** Story 14c-refactor.35d COMPLETE - Dead code removal (371 lines removed from App.tsx: 4,221→3,850). **Target NOT achieved** (1,500-2,000 line goal was aspirational). Realistic minimum is ~3,000-3,500 lines due to handler complexity, state coupling. Removed: `_processBatchImages_DEPRECATED` (210 lines), legacy batch cancel system (76+18 lines), deprecated scan handlers (15 lines), commented view blocks (32 lines). Build passes, 5,274/5,280 tests pass (6 pre-existing). Created `docs/sprint-artifacts/epic14c-refactor/app-architecture-final.md` documenting final state and recommendations. **Pattern Added:** Aspirational LOC targets must account for actual state/handler complexity.
- **2026-01-24:** Story 14c-refactor.35a CODE REVIEW FINAL - App.tsx audit (4,221 lines). **Status: DONE.** Initial review found 5 items (all resolved). Final Atlas review found 1 MEDIUM (File List deduplication), 2 LOW (checklist context, gap quantification) - all fixed. **Patterns Added:** File List deduplication, checklist context, gap quantification. Full report: `docs/sprint-artifacts/epic14c-refactor/35a-app-audit-report.md`. This audit enables Stories 35b/35c/35d.
- **2026-01-23:** Story 14c-refactor.34c Atlas Code Review - useItemsViewProps hook (37 tests). **Review Findings Fixed:** (1) File List missing ItemsView.tsx - added; (2) Verification checklist unmarked despite task completion - aligned; (3) Hook line count 210→242 corrected. Pattern: Deprecated handlers provide empty functions for backward compat while view uses ViewHandlersContext internally. `as any` cast on spread props documented.
- **2026-01-23:** Story 14c-refactor.32a code review - "No changes needed" is a VALID audit outcome. Props alignment stories (30a, 31a, 32a) may find names already aligned due to previous migration work (Story 27). Document: (1) What was audited, (2) Why no changes needed, (3) Git context if files show modifications from other stories.
- **2026-01-23:** CRITICAL BUG FIX (14c-refactor.30b) - Composition hooks placed AFTER early returns caused "Rendered more hooks than previous render" error. Fix: Moved hooks before `if (!user) return`. Added "Hooks before early returns" pattern to React Patterns table.
- **2026-01-23:** Story 14c-refactor.35 SPLIT via atlas-story-sizing workflow - 5 tasks + 23 subtasks exceeded limits (max 4/15). "Final cleanup" stories aggregate multiple concerns. Split by_phase into 35a (audit/docs), 35b (view renderers), 35c (handler hooks), 35d (dead code/verification). Pattern: Audit→Action→Verification phases fit different context windows. 35b and 35c can run in parallel after 35a.
- **2026-01-23:** Story 14c-refactor.30 SPLIT via atlas-story-sizing workflow - 5 tasks + 24 subtasks exceeded limits (max 4/15) → split by_phase into 30a (interface), 30b (hook), 30c (integration). Props alignment stories benefit from interface→hook→integration phasing.
- **2026-01-23:** Story 14c-refactor.31 SPLIT via atlas-story-sizing workflow - 5 tasks + 17 subtasks exceeded limits → split by_phase into 31a (interface), 31b (hook), 31c (integration). TrendsView follows same pattern as HistoryView.
- **2026-01-23:** Story 14c-refactor.33 SPLIT via atlas-story-sizing workflow - 4 tasks + 16 subtasks exceeded limits (max 15). TransactionEditorView has the most callbacks of any view. Split by_phase into 33a (interface), 33b (hook), 33c (integration). All 4 props alignment stories (30-33) now follow consistent phasing pattern.
- **2026-01-23:** Story 14c-refactor.32 SPLIT via atlas-story-sizing workflow - 4 tasks + 15 subtasks at LARGE boundary (exactly at max limits). User opted for split for consistency with 30/31 pattern despite "LOW risk" designation. BatchReviewView follows same interface→hook→integration phasing as HistoryView/TrendsView.
- **2026-01-23:** Story 14c-refactor.34 SPLIT via atlas-story-sizing workflow - 5 tasks + 31 subtasks severely exceeded limits (double the 15-subtask max). Split by_feature into 34a (DashboardView hook, 3pt), 34b (SettingsView hook, 3pt), 34c (ItemsView hook + verification, 2pt). Independent hook stories are better than one large "create multiple hooks" story. SettingsView hook is most complex due to 15+ callbacks.
- **2026-01-23:** Story 14c-refactor.27 code review - Context migration patterns: (1) File List MUST match git reality - claim InsightsView/ReportsView modified but they weren't; (2) Task checkboxes must be `[x]` when done; (3) "Complex pattern" is valid deferral reason but document explicitly; (4) TODO(story-id) for follow-up work
- **2026-01-22:** Story 14c-refactor.25 complete - ViewHandlersContext created (15 tests), views can access handlers via `useViewHandlers()` without prop drilling; incremental migration path documented in viewRenderers.tsx
- **2026-01-22:** Story 14c-refactor.22e verification - Dead code removal (-197 lines), all 5,020 tests pass; line target ~2,800-3,200 requires additional refactoring in Stories 25-26
- **2026-01-22:** Story 14c-refactor.22d code review - Added 28 tests for AppOverlays.tsx (component tests for conditional overlay rendering), fixed doc count "14 overlays" → "15 overlays"
- **2026-01-22:** Story 14c-refactor.22c code review - Added 49 tests for viewRenderers.tsx (render functions need smoke tests even if simple)
- **2026-01-22:** Added Story Sizing Patterns section from 14c-refactor.22a split analysis - context window limitations require upfront story sizing
- **2026-01-22:** Updated atlas-create-story workflow with Step 5.5 (Context Window Sizing Analysis) - prevents oversized stories
- **2026-01-22:** Story 14c-refactor.21 code review - Removed unused `dismissScanDialog` prop from useDialogHandlers (pattern enforcement)
- **2026-01-22:** Added hook extraction patterns from 14c-refactor.20 Atlas code review (no unused props, TODO story tracking, incremental integration)
- **2026-01-22:** Added documentation consolidation patterns from 14c-refactor.24 code review (root file deletions, broken link check, section header counts)
- **2026-01-22:** Added documentation story patterns from 14c-refactor.19 code review (File List completeness, AC implementation changes)
- **2026-01-22:** Added integration testing patterns from 14c-refactor.18 (console warnings, share code validation)
- **2026-01-21:** Added README documentation pattern from 14c-refactor.8 code review (archived scripts need separate section, not just table entry)
- **2026-01-21:** Added commit-before-deploy pattern from 14c-refactor.7 code review (Firebase deployed but changes not committed)
- **2026-01-21:** Added Firestore batch retry pattern and dry-run loop prevention from 14c-refactor.6 code review
- **2026-01-21:** Added story documentation pattern - verify code review fixes actually applied (14c-refactor.4 review)
- **2026-01-21:** Added i18n fallback pattern lesson from 14c-refactor.5 code review (translation keys missing but tests passed due to mock)
- **Generation 6 (2026-01-20):** Added Epic 14c failure lessons (delta sync, multi-op testing, cost control)
- **Generation 5 (2026-01-17):** Consolidated 15+ story code reviews into pattern tables
- **Reduction:** 528 → ~280 lines (~47% smaller)
- Detailed story learnings available in `docs/sprint-artifacts/` story files
- Epic 14c full analysis: `docs/sprint-artifacts/epic-14c-retro-2026-01-20.md`
