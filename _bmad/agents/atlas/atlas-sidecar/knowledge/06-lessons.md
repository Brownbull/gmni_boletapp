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

### Firestore
| Pattern | Rule |
|---------|------|
| Defensive Timestamps | `try/catch` with `?.toDate?.()` |
| serverTimestamp() | Use `*Create` interface with `FieldValue` |
| LISTENER_LIMITS | Always apply limits to real-time queries |
| Cross-User Queries | Use Cloud Function with server-side validation, NOT client collectionGroup |
| Collection Group Limitation | Firestore CANNOT evaluate `resource.data.*` in collection group queries |

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

## Sync Notes

- **Generation 6 (2026-01-20):** Added Epic 14c failure lessons (delta sync, multi-op testing, cost control)
- **Generation 5 (2026-01-17):** Consolidated 15+ story code reviews into pattern tables
- **Reduction:** 528 → ~280 lines (~47% smaller)
- Detailed story learnings available in `docs/sprint-artifacts/` story files
- Epic 14c full analysis: `docs/sprint-artifacts/epic-14c-retro-2026-01-20.md`
