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

### Modal Manager (Epic 14e - Story 14e-4)
| Pattern | Rule |
|---------|------|
| Incremental migration | Keep old state APIs while migrating to Modal Manager - remove after all consumers migrated |
| Code splitting | Use React.lazy() in registry - verified chunks: CreditInfoModal 3KB, SignOutDialog 3.4KB |
| onClose composition | ModalManager composes onClose: calls store.closeModal() THEN props.onClose() |
| Backward compatibility | Export old state (showCreditInfoModal) via hooks while new pattern (openModal) is adopted |
| Props defaulting | Modal components should default isOpen=true for ModalManager, use prop when standalone |
| i18n for modals | Use t() function with fallbacks - SignOutDialog pattern: `t('key') || fallback` |

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
| Story consolidation check | When splitting large story (14e-6 → 6a/b/c/d), check if upcoming stories overlap with split scope - 14e-7 was absorbed by 14e-6c |
| "may be consolidated" note | Add note in sprint-status.yaml when split creates potential overlap with future stories |

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
| 2026-01-24 | Workflow validation, CI groups, context callbacks |
| 2026-01-23 | Story sizing splits (30-35), hooks before early returns |
| 2026-01-22 | Handler extraction, ViewHandlersContext, documentation |
| 2026-01-21 | Service stubs, Firestore retry, i18n fallback |
| 2026-01-20 | Epic 14c failure lessons (delta sync, cost control) |

**Detailed logs:** Story files in `docs/sprint-artifacts/`
**Epic 14c analysis:** `docs/sprint-artifacts/epic-14c-retro-2026-01-20.md`
