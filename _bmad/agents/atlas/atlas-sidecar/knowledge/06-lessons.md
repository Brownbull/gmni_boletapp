# Historical Lessons (Retrospectives)

> Section 6 of Atlas Memory
> Last Sync: 2025-12-18
> Sources: epic-8-retrospective.md, epic-9-retro-2025-12-16.md

## What Worked Well

| Lesson | Context | Source |
|--------|---------|--------|
| **PRD + Tech-Spec Workflow** | Essential for UX-heavy epics, prevents rework | Epic 7, 9 |
| **Story-to-Story Knowledge Transfer** | Dev records enable pattern reuse | Epic 8, 9 |
| **Code Review Discipline** | All stories get formal adversarial reviews | All Epics |
| **High Velocity** | 7+ points/day achievable with good planning | Epic 8, 9 |
| **CSS Custom Properties for Theming** | Runtime theme switching works well | Epic 7 |
| **Shared Prompts Architecture** | Centralized Gemini prompts enable A/B testing | Epic 8 |
| **Parallel CI Jobs** | 63% faster pipeline after Epic 8 optimization | Epic 8 |
| **Context Files** | Story context XML/MD files accelerate development | Epic 9 |

## What Failed / What to Avoid

| Failure | Root Cause | Prevention |
|---------|------------|------------|
| **Git Branch Divergence** | Squash merges create sync issues | Use 2-branch strategy, merge commits for sync |
| **EditView.tsx Complexity** | Accumulated tech debt | Scheduled for refactor in Epic 10 |
| **Scope Creep** | Epics grow significantly (7 → 21 stories) | Better upfront scoping |
| **Bundle Size Growth** | At 948KB, needs attention | Code-splitting, lazy loading |
| **API Key Security Incident** | Hardcoded in code, leaked to git | Always use environment variables |

## Hard-Won Wisdom

### API Key Security (Epic 8)
> "When a key leaks in git history, create fresh branch rather than rewriting history. GitGuardian catches keys in git history, not just current files."

### Git Strategy - 3-Branch Workflow
> "We use a **3-branch workflow**: `develop` (integration) → `staging` (pre-prod) → `main` (production). Feature branches from develop, PRs to develop, then promote through staging to main. Pre-flight sync check before epic deployments. Hotfixes backported immediately to all branches. Merge commits for sync PRs (not squash)."

**Deploy workflow:** `feature/* → develop → staging → main`

### UX Development
> "Architecture decisions before UX changes. Mockups before implementation for UX work."

### FCM with PWA (Story 9.18 Hotfix - 2025-12-18)
> "When using Firebase Cloud Messaging with vite-plugin-pwa, you MUST explicitly register and pass the FCM service worker to `getToken()`. Using `navigator.serviceWorker.ready` returns the PWA service worker (sw.js), not firebase-messaging-sw.js. Fix: Use `navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')` or `navigator.serviceWorker.register('/firebase-messaging-sw.js')` and wait for activation before calling `getToken()`."

### CI/CD Environment Variables Checklist (v9.1.0 Hotfix - 2025-12-20)
> "When adding new VITE_* environment variables to the app, you MUST also add them to the CI/CD deployment step in `.github/workflows/test.yml` AND add the corresponding secret to GitHub repository settings. Missing env vars cause silent failures in production (e.g., FCM token fails with missing VAPID key). **Checklist when adding new env var:**
> 1. Add to `.env` and `.env.example`
> 2. Add to `test.yml` deploy job `env:` section
> 3. Add secret to GitHub repo → Settings → Secrets → Actions"

### Defensive Firestore Data Handling (Story 10.1 - 2025-12-18)
> "When reading Firestore Timestamps in service code, always use defensive optional chaining and try/catch. Firestore data can be corrupted or have unexpected shape. Pattern: `try { const time = record?.shownAt?.toDate?.()?.getTime?.(); if (typeof time !== 'number' || isNaN(time)) return defaultValue; } catch { return defaultValue; }` - This prevents crashes from malformed data in production."

### Extract Shared Utilities Early (Story 10a.4 - 2025-12-21)
> "When multiple components share the same configuration objects or calculation logic (e.g., INSIGHT_TYPE_CONFIG for icons/colors, ISO week calculation), extract to shared utility files BEFORE implementation grows. Story 10a.4 required post-review refactoring to extract 60+ lines of duplicate config into `src/utils/insightTypeConfig.ts` and `src/utils/dateHelpers.ts`. **Pattern:** If >2 components will use the same logic, create a shared utility file upfront. Exports should include both data (INSIGHT_TYPE_CONFIG) and helper functions (getInsightConfig, getIconByName)."

### Type-Safe Dynamic Icon Lookups (Story 10a.4 - 2025-12-21)
> "When using Lucide icons dynamically by name string, avoid double-casting `(LucideIcons as unknown as Record<string, LucideIcon>)[name]`. Instead, create a helper function that provides proper type safety with explicit fallback: `export function getIconByName(name: string): LucideIcon { const icons = LucideIcons as Record<string, LucideIcon | undefined>; return icons[name] || LucideIcons.Lightbulb; }` This prevents silent failures when icon names are misspelled."

### Keyboard Accessibility for Touch Features (Story 10a.4 - 2025-12-21)
> "When implementing touch-based features like long-press selection mode, always provide keyboard alternatives. Story 10a.4 review found that long-press was inaccessible to keyboard-only users. **Fix:** Add `onKeyDown` handler with `Shift+Enter` to toggle selection (parallels long-press), `aria-pressed` for selection state, and `aria-label` with full context for screen readers."

### Unused State Variables with Refs (Story 11.1 - 2025-12-21)
> "When using useState alongside useRef for async loop cancellation, the state setter is needed for reactivity but the getter may be unused (only the ref is checked in the loop). Prefix unused state with underscore (e.g., `_batchCancelRequested`) to satisfy TypeScript's unused variable check while retaining the setter for state updates."

### ESLint prefer-const in Async Loops (Story 11.1 - 2025-12-21)
> "Always use `const` for variables that are assigned once, even if they come from conditional expressions like `result.country || defaultCountry || ''`. The CI security lint enforces `prefer-const` which catches these in the pipeline."

### Quick Save Card Confidence Heuristic (Story 11.2 - 2025-12-21)
> "For AI-extracted receipt data, use a weighted confidence score based on field completeness: merchant (20%), total (25%), date (15%), category (15%), items (25%). Show Quick Save Card only for scores >= 85%, otherwise route to EditView. This ensures users can quick-save reliable extractions while reviewing questionable ones."

### Staggered Animation with React Fragments (Story 11.3 - 2025-12-21)
> "When implementing conditional animation wrappers, use `React.Fragment` for the no-animation case to avoid unnecessary DOM nodes. Pattern: `const Wrapper = shouldAnimate ? AnimatedItem : React.Fragment;` with conditional props. For fake timer testing of animation hooks, advance timers in single `act()` blocks rather than testing each step individually - setInterval callbacks may fire together between acts."

### GPU-Accelerated CSS Animations (Story 11.3 - 2025-12-21)
> "For smooth 60fps animations, use only `transform` and `opacity` properties with `will-change` hint. Define keyframes in CSS (not JS) with `animation: name duration easing forwards`. Always include `@media (prefers-reduced-motion: reduce)` to disable animations for accessibility. Animation class should start with `opacity: 0` inline style that keyframe overrides."

### Firestore serverTimestamp() Type Safety (Story 11.4 - 2025-12-22)
> "When creating Firestore documents with `serverTimestamp()`, don't use `as any` type assertions. Instead, create a separate `*Create` interface (e.g., `TrustedMerchantCreate`) that uses `FieldValue` for timestamp fields instead of `Timestamp`. Import `FieldValue` from `firebase/firestore` and use the Create type for `setDoc()` operations. The read interface (with `Timestamp` fields) is used when reading documents back. This maintains full type safety and makes the intent clear."

### Scan State Machine Integration Pattern (Story 11.5 - 2025-12-22)
> "When integrating a state machine hook (useScanState) with existing boolean props (isAnalyzing, scanError), use `useRef` to track previous prop values and `useEffect` to trigger state transitions on prop changes. Pattern: `const prevRef = useRef(prop); useEffect(() => { if (prop && !prevRef.current) startProcessing(); if (!prop && prevRef.current) setReady(); prevRef.current = prop; }, [prop]);` This bridges parent-controlled state with child state machine."

## Patterns to Avoid

1. **Hardcoding API keys** - Always use environment variables
2. **Squash merging** on sync PRs - Creates divergence
3. **Skipping code review** - All stories need formal review
4. **Running expensive CI checks on every PR** - Lighthouse on main only
5. **Sequential CI jobs** when parallel is possible
6. **Assuming details not in docs** - VERIFY with source documents
7. **Using `navigator.serviceWorker.ready` with multiple service workers** - Returns first SW, not specific one
8. **Adding env vars without updating CI/CD** - Causes silent production failures (VAPID key incident 2025-12-20)

## Patterns to Follow

1. **Formal code reviews** for every story
2. **Tech-spec** for complex epics
3. **Retrospective** at epic completion
4. **Prompt versioning** (v2.6.0 → v3.0+)
5. **Context files** for each story (XML or MD)
6. **Pre-flight sync** before deployments
7. **Story-driven test coverage** - Each story has tests
8. **CI/CD time budgets** - Keep PRs under 7 min

9. **Defensive Firestore reads** - Always handle corrupted Timestamps with try/catch
10. **Extract shared utilities early** - If >2 components use same logic, create shared util file
11. **Type-safe icon lookups** - Use helper functions with explicit fallbacks, not double-casting
12. **Keyboard alternatives for touch** - Long-press needs Shift+Enter equivalent, aria-pressed state
13. **Credit/resource deduction after success** - Deduct user credits AFTER operation succeeds, not before (prevents lost credits on failure)
14. **Staggered reveal animation** - Use CSS keyframes with `will-change`, wrap items in AnimatedItem component, cap total animation time with maxDurationMs
15. **Reduced motion preference** - Create `useReducedMotion` hook that subscribes to media query changes, skip all animations when true
16. **Type-safe serverTimestamp()** - Use separate *Create interface with FieldValue for writes, not `as any` casts
17. **Pass actual loading state** - Don't hardcode loading props (e.g., `loading={false}`), always use actual hook state
18. **State machine sync via useRef** - When syncing internal hook state with parent props, use `useRef` to track previous values and `useEffect` to detect transitions (e.g., `prevIsAnalyzingRef.current` pattern)
19. **Document unused-by-design states** - If a state machine has states intentionally unused in current flow (e.g., `uploading` when API is atomic), add comment explaining design decision and future use case
20. **PWA viewport with dvh and safe areas** - Use `h-screen h-[100dvh]` (fallback first, then dvh) instead of `min-h-screen` or `100vh` for PWA compatibility. **Critical:** `min-h-dvh` sets MINIMUM height and won't prevent scrolling - use `h-[100dvh]` for fixed viewport. Add `viewport-fit=cover` meta tag and CSS custom properties for safe areas: `--safe-top: env(safe-area-inset-top, 0px)`. Use flex column layout with `flex-1 overflow-y-auto` for scrollable content and `calc()` for bottom padding: `calc(6rem + var(--safe-bottom))`. **Warning:** `flex-1` without flex parent does nothing - ensure parent has `display: flex`

## Team Agreements

- Pre-flight sync check before epic deployments
- Hotfixes backported immediately to all branches
- Merge commits for sync PRs (not squash)
- Architecture decisions before UX changes
- Mockups before implementation for UX work
- Every epic ends with deployment story

---

## Sync Notes

- Lessons compiled from Epic 8 and Epic 9 retrospectives
- API key incident documented as key learning
- CI/CD optimization standards established in Epic 8
- Retrospectives reviewed: Epic 3, 7, 8, 9
- Defensive Firestore pattern added from Story 10.1 code review (2025-12-18)
- Shared utilities + accessibility patterns added from Story 10a.4 code review (2025-12-21)
- Epic 10a deployed to production (v9.3.0) - 2025-12-21
- Credit deduction timing pattern added from Story 11.1 code review (2025-12-21)
- Quick Save confidence heuristic pattern added from Story 11.2 implementation (2025-12-21)
- Staggered animation and reduced motion patterns added from Story 11.3 (2025-12-21)
- serverTimestamp() type safety pattern added from Story 11.4 code review (2025-12-22)
- Scan state machine integration pattern added from Story 11.5 (2025-12-22)
- PWA viewport with dvh and safe areas pattern added from Story 11.6 (2025-12-22)
