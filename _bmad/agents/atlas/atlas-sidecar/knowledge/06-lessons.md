# Historical Lessons (Retrospectives)

> Section 6 of Atlas Memory
> Last Sync: 2026-01-12
> Last Optimized: 2026-01-12 (Generation 4)
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
| Font Size Scaling | `--font-size-*` CSS variables with `[data-font-size="normal"]` override (Story 14.37) |
| Theme-Aware Toast | Use `--insight-celebration-bg/icon` for achievement notifications (Story 14.37) |

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

## Code Review Learnings

### Story 14.33b - View Switcher & Carousel (2026-01-12)

| Pattern | Detail |
|---------|--------|
| Touch Targets | Carousel dots: use 44px button wrapper around 8px visual dot |
| Gradient CSS | `background` not `backgroundColor` for gradients |
| Unused Variables | TS6133 error if style variable declared but not applied |
| Keyboard A11y | Add `tabIndex={0}` + `onKeyDown` for ArrowLeft/Right navigation |
| Carousel Pattern | CSS transform + translateX for performant sliding |
| View Persistence | localStorage for view mode preference |

### Story 14.35 - Dynamic Location Data (2026-01-12)

| Pattern | Detail |
|---------|--------|
| Query Key Centralization | ALL React Query keys MUST be in `src/lib/queryKeys.ts` - never define locally in hooks |
| DEV-gated Warnings | Wrap console.warn in `if (import.meta.env.DEV)` per Atlas lessons |
| Module Cache Testing | Export `_clearCache()` helper for test isolation; call in beforeEach/afterEach |
| API Fallback Strategy | Sync fallback data for instant render; async API fetch updates cache |
| Localization Storage | Store English values for backward compatibility; display in user's language |
| Chilean Coverage | 240+ cities covering all 16 regions including 52 Santiago comunas |

### Story 14.35b - Foreign Location Display (2026-01-12)

| Pattern | Detail |
|---------|--------|
| Flag + Localization Coupling | When showing foreign flags, ALWAYS use `useLocationDisplay(lang)` for localized city/country names |
| Lang Prop Threading | Components displaying location must receive `lang` prop to enable localization |
| Hook Return Value Testing | Test ALL return values from hooks (countryCode was missing tests initially) |
| File List Accuracy | Story File List MUST match actual git changes - include ALL modified files |
| Localization Pattern | `getCityName(englishName)` returns name in user's language via `useLocationDisplay(lang)` |

### Story 14.33c.1 - Airlock Generation & Persistence (2026-01-12)

| Pattern | Detail |
|---------|--------|
| Mock Implementation Docs | Document mock behavior in JSDoc when AI/API endpoints are deferred |
| Test Isolation Exports | Export `_resetMockState()` for module-level state reset in tests |
| Credit System TODO | Mark CRITICAL TODOs for placeholder implementations that need Firestore persistence |
| Theme Prop Convention | Keep unused theme props with JSDoc note when CSS variables handle theming |
| Wildcard Security Rules | `users/{userId}/{document=**}` covers all subcollections including new airlocks |
| Temporal Filter Coverage | Always create tests for filter components with year/quarter/month/week levels |

### Story 14.37 - Toast Theming & Font Size Scaling (2026-01-13)

| Pattern | Detail |
|---------|--------|
| CSS Variable Theming | Replace hardcoded Tailwind colors with CSS vars for runtime theme switching |
| Icon Container Centering | Use explicit `w-12 h-12 flex items-center justify-center` for consistent icon alignment |
| Font Size System | CSS custom properties (`--font-size-xs` to `--font-size-3xl`) with data attribute override |
| Backwards Compatibility | Default to 'small' (current sizes) - 'normal' is opt-in larger sizes |
| jsdom Style Testing | Use `element.style.property` not `toHaveStyle()` for CSS variable assertions |
| Incremental Adoption | Font size variables can be adopted by components incrementally |

### Story 14.41 - View Mode Edit Button (2026-01-13)

| Pattern | Detail |
|---------|--------|
| Disabled Prop Pattern | Consistent: opacity 0.7, cursor 'default', native `disabled` attribute |
| Conditional Rendering | Read-only mode: remove interactive wrapper, keep display component |
| Translation Key Check | Always verify translation keys exist before using `t('key')` |
| Lang Prop Threading | Localized components (LocationSelect) must receive `lang` prop explicitly |
| Edit Button Styling | Use accent color to match related "Editar transacción" button |

### Story 14.38 - Item View Toggle (2026-01-13)

| Pattern | Detail |
|---------|--------|
| Barrel Export Consistency | New components MUST be exported from domain `index.ts` for import consistency |
| Empty Ternary Cleanup | Remove no-op `${cond ? '' : ''}` patterns from className templates |
| InsightsViewSwitcher Pattern | Reusable pill-toggle: sliding indicator + rounded-full + CSS vars for theming |
| Local State for View Mode | View toggles (grouped/original) use local useState, no persistence needed |

### Story 14.30 - Test Technical Debt Cleanup (2026-01-13, 2026-01-14)

| Pattern | Detail |
|---------|--------|
| CSS Variable Testing | Use `getAttribute('style').toContain('var(--bg)')` not `toHaveClass()` for CSS var theming |
| Async Dialog Testing | Use `waitFor()` for dialog close verification; query buttons inside `alertdialog` role |
| Legacy Prompt Versioning | V1/V2 use 13/9 categories (legacy), V3 uses 39/39 (shared/schema/categories.ts) |
| Task Checkbox Discipline | Mark tasks `[x]` immediately after implementation - don't leave unchecked when complete |
| Skipped Test Documentation | Use `describe.skip()` with JSDoc explaining WHY skip is necessary and WHERE coverage exists |
| **Dead Code Discovery** | `shared/prompts/` is entirely dead code - `prompt-testing/prompts/` is source of truth |
| **Vitest Shard Limitation** | Vitest shards by file count, not duration; early files get heavy tests |
| **Large Test File Impact** | Files >1400 lines cause shard imbalance; consider splitting |
| **Branch Test Drift** | Tests passing on main may fail on feature branch - verify before CI optimization |
| **Test Filter State** | `HistoryFiltersProvider` defaults to current month - tests with old dates need `initialState={{ temporal: { level: 'all' } }}` |
| **Translation Key Alignment** | Test `mockT` must include ALL keys used by component - check component source for actual `t('key')` calls |
| **CI Coverage Redundancy** | Don't run tests twice - each shard can collect coverage, merge in single job (saves 14 min) |
| **Shard Count Scaling** | 3→5 shards helps but doesn't solve imbalance; Vitest doesn't weight by duration |
| **Local Test Verification** | Always verify test fixes locally before CI run - faster iteration cycle |
| **Multi-Session File Lists** | For stories spanning multiple sessions, organize File List by session with clear labels |
| **Bun + npm Hybrid** | Use Bun for install (fast), npm for scripts (conservative) - proven safe pattern |

### Story 14.32 - Usage & Cost Audit (2026-01-13)

| Pattern | Detail |
|---------|--------|
| Cost Figure Accuracy | Document actual vs theoretical costs with clear notes - $0.00175/scan actual vs $0.026 theoretical |
| File List Completeness | Story File List MUST include ALL modified files discovered via `git status` |
| Line Number Freshness | Update line references during code review - they drift as code changes |
| AC Task Status | Use "DEFERRED" not "N/A" when task is punted to future work |
| Budget Threshold Consistency | Keep threshold values consistent across related documents |
| Documentation-Only Stories | Audit stories still need adversarial review for accuracy of claims |

---

## Sync Notes

- Generation 3: Consolidated story-specific learnings into pattern tables
- Generation 4: Added Code Review Learnings section
- Story 14.37: Font size scaling system and toast theme integration (2026-01-13)
- **Story 14.30 Code Review (2026-01-14):** Added multi-session file list and Bun+npm hybrid patterns
- Full story details available in `docs/sprint-artifacts/` story files
- Backup: `backups/v3/knowledge/06-lessons.md`
