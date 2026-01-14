# Historical Lessons (Retrospectives)

> Section 6 of Atlas Memory
> Last Sync: 2026-01-10
> Last Optimized: 2026-01-10 (Generation 3)
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

## What to Avoid

| Failure | Prevention |
|---------|------------|
| Git Branch Divergence | Merge commits for sync PRs (not squash) |
| Bundle Size Growth (2.0 MB) | Code-splitting (deferred to Epic 15) |
| Unsafe Regex Patterns (ReDoS) | Use simple non-greedy patterns |
| API Key Leaks | Always use env variables |
| Scope Creep (7→21 stories) | Better upfront scoping |
| No-op Setter Wrappers | Remove completely when migrating to derived state |
| State Machine Callback Race Conditions | Pass compound payloads to atomic state transitions (Epic 14d.5) |
| Missing Asset Files | Always verify static assets exist during implementation (Story 14.18) |

---

## Critical Patterns

### Security
- **API Key Leaks**: Create fresh branch, don't rewrite history
- **ReDoS Prevention**: Avoid nested quantifiers. GOOD: `[\s\S]*?`
- **Input Sanitization**: `src/utils/sanitize.ts` blocks XSS patterns

### Git Strategy
- **3-Branch**: `feature/* → develop → staging → main`
- Merge commits for sync PRs
- Hotfixes backported immediately

### Firestore
- **Defensive Timestamps**: `try/catch` with `?.toDate?.()`
- **serverTimestamp()**: Use `*Create` interface with `FieldValue`
- **LISTENER_LIMITS**: Always apply limits to real-time queries

### React Query + Firestore
- **Don't use useQuery with subscriptions** - Use local state + useEffect
- **Prevent loops**: Use `initializedRef` flag, don't call `setData(cached)` every effect
- **Refs for stability**: Store subscribeFn in refs to avoid stale closures
- **Skip redundant updates**: JSON comparison before `setData`

### Filter Persistence (Story 14.13b)
- **Context sync**: Use `onStateChange` callback to sync to parent
- **Navigation-aware clearing**: Clear from outside, preserve within related views
- **Default month filter**: Current month, not "all time"
- **Multi-select**: Comma-separated values, check with `.includes(',')` before splitting

### State Machine Migration (Epic 14d)
- **Remove no-op wrappers**: If setter does nothing after migration, remove it completely
- **Replace calls with comments**: `// Story 14d: state now derived from scanState.phase`
- **DEV-gate console warnings**: `if (import.meta.env.DEV) { console.warn(...); }`
- **setTimeout(0)**: Valid for deferring React state update chains
- **Batch edit thumbnails**: Set `thumbnailUrl` directly on transaction object, NOT via `setScanImages()` (requires `capturing` phase, but batch edit is in `reviewing` phase)
- **Story obsolescence pattern**: When later stories implement earlier story's scope, mark earlier as "OBSOLETE - Superseded" rather than re-implementing (Story 14d.10 superseded by 14d.4d + 14d.5e)
- **Cleanup story scope revision**: Analyze actual codebase before cleanup - original estimates may be stale (Story 14d.11: 31 variables → 1 file, 5 pts → 2 pts)
- **Component prop interfaces vs duplicates**: Variables passed as props to child components are interfaces, NOT duplicates of context state. Dual-sync is intentional for prop passing (e.g., `batchImages` in App.tsx synced with `scanState.images`)

### Scan State Persistence (Story 14d.4d, 14d.5e, 14d.10)
- **Versioned format**: `PersistedScanState` with version field
- **Auto-migration**: `migrateOldFormat()` converts old → new on load
- **Interrupted scans**: Show toast, clear storage, user retries
- **Unified batch persistence**: Single storage key, batch fields in ScanState (Story 14d.5e)
- **Legacy batch migration**: `loadAndMigrateLegacyBatch()` auto-converts PendingBatch → ScanState
- **No expiration (ADR-020)**: User never loses work - 24h staleness NOT implemented intentionally (Story 14d.10 marked OBSOLETE - superseded by 14d.4d + 14d.5e)

### Dialog Unification (Story 14d.6)
- **Data capture pattern**: Capture dialog data BEFORE resolveDialog clears it, pass to callback
- **Backward compatibility**: `useScanOptional()` with prop fallback for gradual migration
- **Type constants**: `DIALOG_TYPES` object for string-safe dialog type comparisons
- **Centralized types**: All dialog data types in `scanStateMachine.ts` (lines 148-232)
- **Conditional rendering**: Components check `activeDialog?.type` before rendering

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
| Time Period Cascade | Q3→Month = July (first of Q3), not January |
| Period Comparison Utility | Create reusable `getPreviousPeriod()` in utils/ |
| ISO Week Handling | Use `getISOWeekNumber()` for week comparison (year boundary safe) |
| Change Direction Types | 'up' \| 'down' \| 'same' \| 'new' for analytics |

### CSS & Theming
| Pattern | Rule |
|---------|------|
| Safe Area Insets | `env(safe-area-inset-*)` for fixed elements |
| Mono Theme | `--accent` MUST be grayscale |
| Viewport Units | `h-[100dvh]` not `min-h-dvh` |
| Touch Targets | Minimum 44px |

### Mobile/PWA
| Pattern | Rule |
|---------|------|
| Haptic Feedback | `navigator.vibrate(10)` with reduced motion check |
| Swipe Direction Lock | Lock after 10px movement |
| Long-press | Use pointer events, store timeout in useRef |
| FAB State Animation | CSS `::after` pseudo-element for shine, `border-radius: inherit` |

### FAB Visual States (Story 14d.8)
| Pattern | Rule |
|---------|------|
| Color scheme organization | Centralized config file with helper functions (`fabColors.ts`) |
| Error priority | Error state colors override mode colors (user needs to see problems) |
| Animation CSS strategy | Inline `<style>` in component for animation keyframes (colocation) |
| JSDOM gradient limitation | JSDOM strips `linear-gradient()` from style; test via class assertions |
| Legacy fallback | Keep old props (`isBatchMode`, `scanStatus`) for backward compatibility |
| useMemo for derived state | Wrap color/icon computation in `useMemo` with mode/phase deps |

### Celebration System (Story 14.18)
| Pattern | Rule |
|---------|------|
| Multi-sensory feedback | confetti + haptic + sound with graceful degradation |
| Reduced motion | `prefers-reduced-motion` check; non-visual alternatives (haptic/sound) still trigger |
| Dual API | Declarative (props) + imperative (ref) for component flexibility |
| Audio caching | Pre-create Audio elements to avoid playback delays |
| Asset verification | Verify static assets exist during code review (not just code) |

### Personal Records (Story 14.19)
| Pattern | Rule |
|---------|------|
| ISO week calculation | Use UTC-based calculation for consistent week IDs across timezones |
| Date string parsing | Parse `YYYY-MM-DD` at noon local time to avoid timezone edge cases |
| Cooldown system | Session cooldown (30min) + type cooldown (24h) with localStorage |
| Record detection | Only detect after 2+ weeks of historical data per category |
| Banner timing | Show banner after 1.5s delay to let confetti play first |
| Fire-and-forget storage | Store records async without blocking celebration flow |
| **Hook integration** | Hooks/components MUST be integrated into App.tsx to be visible to users |
| **Module exports** | New components MUST be exported from domain `index.ts` (e.g., celebrations/index.ts) |

### Testing
| Pattern | Rule |
|---------|------|
| localStorage Mock | `vi.stubGlobal('localStorage', mockObj)` |
| Timestamp Mock | Factory with `toDate()`, `seconds`, `nanoseconds` |
| Hook tests | Use `.tsx` extension when JSX wrappers needed |
| Timer act() wrapping | Wrap `vi.advanceTimersByTime()` in `act()` to avoid React warnings |

### React Strict Mode Dev Warnings (KNOWN - LOW PRIORITY)
| Warning | Cause | Fix |
|---------|-------|-----|
| ECharts `disconnect` undefined | echarts-for-react unmounts twice in StrictMode; ResizeObserver sensor cleanup races | Library issue - cosmetic in DEV only, not in prod. Upgrade echarts-for-react when fix released. |
| ScanStateMachine PROCESS_START ignored | StrictMode double-render triggers dispatch twice; state already `scanning` | Expected behavior - warning is DEV-gated. Second dispatch is safely ignored by state machine. |

---

## UX Design Principles

### The Gastify Voice
- **Observes without judging**: "Restaurants up 23%" not "You overspent"
- **Reveals opportunity**: Trade-off visibility without guilt
- **Celebrates progress**: Personal records, milestones
- **Normalizes setbacks**: "La vida es rara. Los datos también."

### Key Design Patterns
- **Dynamic Polygon**: 3-6 sided spending shape
- **"Everything Breathes"**: Motion system with subtle animations
- **"Intentional or Accidental?"**: Non-judgmental spending prompts (Story 14.17 COMPLETE)
  - Component: `src/components/insights/IntentionalPrompt.tsx`
  - Trigger: `shouldShowIntentionalPrompt()` for category_trend/spending_velocity >30% up
  - Storage: `recordIntentionalResponse()` in insightProfileService
  - Translations: intentionalPromptTitle, intentionalYes, intentionalNo

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

- Generation 3: Consolidated story-specific learnings into pattern tables
- Full story details available in `docs/sprint-artifacts/` story files
- Backup: `backups/v3/knowledge/06-lessons.md`
