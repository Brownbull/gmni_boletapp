# Historical Lessons (Retrospectives)

> Section 6 of Atlas Memory
> Last Sync: 2025-12-22
> Sources: epic-8-retrospective.md, epic-9-retro-2025-12-16.md, brainstorming-session-2025-12-22.md

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
| **Structured Brainstorming** | Progressive Flow (Role Playing → Mind Mapping → SCAMPER → Action Planning) for major UX redesigns | Epic 13 Prep |
| **Persona-Driven Design** | Detailed personas (María, Diego, Rosa, Tomás) with specific journeys inform all design decisions | Brainstorming 2025-12-22 |
| **Mockup-First Workflow** | Design all mockups before implementation for UX work | Epic 13 Planning |

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
21. **Styled dialogs over window.confirm** - Never use native `window.confirm()` for confirmations as it breaks: (1) theme consistency (native dialogs ignore dark mode), (2) mobile UX (look different across platforms), (3) accessibility patterns (project uses custom modals). Create reusable `ConfirmationDialog` component matching existing dialog patterns like `CreditWarningDialog`
22. **Long-press detection with pointer events** - Use `onPointerDown`, `onPointerUp`, `onPointerLeave`, and `onPointerCancel` for cross-platform touch support. Store timeout in `useRef`, track long-press state in `useRef<boolean>`, and clear timeout on all release/cancel events. Test with fake timers using `vi.useFakeTimers()` and `vi.advanceTimersByTime()`
23. **Test new components during code review** - Every new component file (`.tsx`) must have a corresponding test file. During code review, verify test coverage exists for all new files - missing tests is a blocking issue
24. **Worker pattern for concurrent queues** - When implementing parallel processing with concurrency limits, use a worker pattern instead of `Promise.allSettled` to maintain FIFO order. Create N workers that pull from a shared queue until empty. Pattern: `const workers = Array(limit).fill(null).map(() => worker(queue)); await Promise.all(workers);` Each worker runs `while (queue.length > 0) { const item = queue.shift(); await process(item); }`. This ensures first-in-first-out and controlled concurrency.
25. **AbortController for cancellation** - Use `AbortController` with `AbortSignal` for cancellation in async operations. Can't abort in-flight API calls, but can stop pending queue items. Pass `abortSignal` to processing function and check `abortSignal?.aborted` before starting each new item. Pattern: `abortControllerRef.current = new AbortController(); // on cancel: abortControllerRef.current.abort();`
26. **Hook wrapper for service state** - Wrap complex service modules with React hooks to manage state. Service handles pure logic (processImagesInParallel), hook handles React state (useState, useMemo, useCallback). Hook exposes both state (states, isProcessing) and actions (startProcessing, cancel, retry). This separation enables testing service logic in isolation.
27. **Verify App.tsx integration for new views** - When reviewing stories that add new views/features, verify that: (1) View type is added to `type View = ...`, (2) Component is imported, (3) Component is rendered in the main JSX with proper routing, (4) Navigation handlers are wired. Components can exist and have tests but still be unreachable if not integrated. This is a common gap between "components created" and "feature usable".
28. **Gastify branding in UI/mockups** - The user-facing app brand is "Gastify" (NOT "Boletapp"). "Boletapp" is the internal project/repo name only. All UI mockups, HTML prototypes, and user-visible text must use "Gastify". CLP currency uses dot separator ($45.200 NOT $45,200).
29. **Integrated Carousel with Rounded Navigation Bar** - For carousels with indicator bars that visually integrate with the card (rounded corners flow seamlessly from card to navigation bar), use a 3-level structure:
    - **Outer container** (`.carousel-container`): `position: relative;` only - NO overflow hidden
    - **Inner wrapper** (`.carousel-wrapper`): Has `overflow: hidden;`, `border-radius: var(--radius-lg) var(--radius-lg) 0 0;` (top corners only), `border: 1px solid var(--border-light);`, `border-bottom: none;`
    - **Indicator bar** (sibling to wrapper, inside container): Has `border-radius: 0 0 var(--radius-lg) var(--radius-lg);` (bottom corners only), `border: 1px solid var(--border-light);`, `border-top: none;`, `overflow: hidden;`

    **Key insight:** The wrapper clips content to top rounded corners, while the indicator bar provides bottom rounded corners. Both share the same border style so they appear as one unified card. The indicator bar MUST be outside the wrapper (to avoid being clipped) but inside the container (to stay together as a unit).

    **HTML Structure:**
    ```html
    <div class="carousel-container">
      <div class="carousel-wrapper">  <!-- overflow:hidden here -->
        <div class="carousel-track">
          <div class="carousel-slide active">...</div>
          <div class="carousel-slide">...</div>
        </div>
      </div>
      <!-- Indicator bar OUTSIDE wrapper, INSIDE container -->
      <div class="carousel-indicator-bar">
        <button class="carousel-segment active" data-slide="0"></button>
        <button class="carousel-segment" data-slide="1"></button>
      </div>
    </div>
    ```
30. **Expandable List with Toggle Button** - For lists that show 2 items by default and expand to 5 on click, use this pattern:
    - **Toggle button:** Small circular button (18x18px) next to title with + icon, changes to - when expanded. Uses `border-radius: 50%;`, press-squish effect (`transform: scale(0.95)` on active), and color change when expanded (`background: var(--primary);`, `color: white;`).
    - **Collapsible items:** Add `.collapsible` class to items 3-5. CSS: `.item.collapsible { display: none; }` and `.list.expanded .item.collapsible { display: flex; }`
    - **JavaScript:** Toggle function adds/removes `expanded` class on list, swaps + / - SVG icons using `innerHTML`.

    **Key insight:** The expand button should be clearly interactive but subtle - small enough not to dominate the title, but visible enough to invite interaction. Using SVG icons (+ and -) instead of text characters ensures consistent rendering.

31. **Unique Animation Keyframe Names in HTML Mockups** - When adding `@keyframes` in `<style>` blocks, use UNIQUE names (e.g., `modalFadeIn`, `cardSlideUp`) instead of generic names (`fadeIn`, `slideUp`). Later definitions override earlier ones, causing unexpected behavior. A centered modal's `fadeIn` with `transform: translate(-50%, -50%)` will break an overlay's `fadeIn` that expects no transform.

32. **JavaScript Style Reset Must Restore Defaults** - When toggling UI states (dropdowns, selections), the reset function must restore original inline styles, NOT clear them to empty strings. Pattern:
    ```javascript
    // WRONG - clears intentional styling
    closeAll() { elements.forEach(el => { el.style.border = ''; }); }

    // CORRECT - restores default styling
    closeAll() { elements.forEach(el => { el.style.border = '1px solid var(--border-medium)'; el.style.background = 'var(--bg-primary)'; }); }
    ```
    **Key insight:** Setting `style.property = ''` removes inline styles entirely, falling back to CSS class definitions which may not exist for dynamically-styled elements.

33. **Nested Background Contrast with Border** - For pill/tag elements inside cards, use `background: var(--bg-primary)` + `border: 1px solid var(--border-medium)` instead of relying solely on `var(--bg-tertiary)`. The border provides visual distinction when background colors are too similar (especially in dark mode where tertiary/secondary may be nearly identical).

34. **Centered Modal vs Bottom Sheet Patterns** - Two distinct modal patterns for mobile mockups:
    - **Bottom Sheet:** `position: absolute; bottom: 0; left: 0; right: 0;` with `border-radius: var(--radius-xl) var(--radius-xl) 0 0;`, `animation: slideUp`, and drag handle (gray bar at top).
    - **Centered Modal:** `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);` with full `border-radius: var(--radius-xl);`, `animation: modalFadeIn` (keyframes MUST include the transform), and NO drag handle.

    **Critical:** Centered modal animation keyframes must preserve the centering transform:
    ```css
    @keyframes modalFadeIn {
      from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
      to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
    ```

## Team Agreements

- Pre-flight sync check before epic deployments
- Hotfixes backported immediately to all branches
- Merge commits for sync PRs (not squash)
- Architecture decisions before UX changes
- Mockups before implementation for UX work
- Every epic ends with deployment story
- **Brainstorming before major UX redesigns** - Use structured brainstorming (Progressive Flow) with detailed personas before significant UX work (added 2025-12-22)

## UX Design Principles (Epic 13-15)

<!-- Source: brainstorming-session-2025-12-22.md -->

### The Boletapp Voice
| Principle | Description |
|-----------|-------------|
| **Observes without judging** | "Restaurants up 23%" not "You overspent" |
| **Reveals opportunity** | Trade-off visibility without guilt |
| **Invites experimentation** | "What if you tried...?" |
| **Celebrates progress** | Personal records, milestones |
| **Normalizes setbacks** | "La vida es rara. Los datos también." |

### Key Design Patterns
- **"Intentional or Accidental?"** - Non-judgmental spending awareness prompts
- **Emotional Airlock** - Curiosity → Playfulness → Reveal for difficult insights
- **Dynamic Polygon** - 3-6 sided spending visualization
- **Expanding Lava Metaphor** - Inner polygon = spending, outer = budget (inverted)
- **"Everything Breathes"** - Motion design system with subtle animations

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
- Styled dialogs pattern added from Story 12.1 code review (2025-12-22)
- Long-press detection pattern added from Story 12.1 code review (2025-12-22)
- Test new components rule enforced from Story 12.1 code review (2025-12-22)
- Parallel processing patterns (worker queue, AbortController, hook wrapper) added from Story 12.2 (2025-12-22)
- Story 12.2 code review: Background processing is implicit via async/await - no explicit visibilitychange handling needed (browser doesn't pause JS execution on blur)
- **Story 12.3 (2025-12-22):** Batch review queue with summary cards, edit/discard actions, and save-all. Key pattern: useBatchReview hook manages receipt state, confidence scoring determines status (ready/review/edited/error). Parent components integrate via callbacks (onEditReceipt, onRetryReceipt).
- **Story 12.3 Code Review (2025-12-22):** CRITICAL FINDING - Components (BatchReviewView, useBatchReview, BatchSummaryCard) were created but NOT integrated into App.tsx. Code review discovered the integration gap and completed wiring: added useBatchProcessing integration, BatchReviewView rendering, batch context support in EditView. **Lesson: "Done" story status requires verification of App.tsx integration for new views/features, not just component creation.**
- **Brainstorming session 2025-12-22:** Full UX redesign planned for Epics 13-15 (~128 points)
  - Reference: docs/analysis/brainstorming-session-2025-12-22.md
  - Key innovations: Dynamic Polygon, Savings GPS, Emotional Airlock
  - Personas: María (parent), Diego (young pro), Rosa (abuelita), Tomás (drifter)
  - Voice Principles: Observes without judging, Celebrates progress, Normalizes setbacks
- **Story 12.5 Code Review (2025-12-23):** BatchInsight component for aggregate batch summary after save. Pattern: Modal dialog with `role="dialog" aria-modal="true"`, confetti celebration for 5+ receipts, fire-and-forget mapping updates. 17 tests covering rendering, actions, a11y, theming.
- **Story 12.99 Epic Release Deployment (2025-12-23):** Epic 12 deployed to production. Atlas Code Review APPROVED. Bundle size at 1.84 MB (approaching threshold - recommend code-splitting in future). 59 batch-related integration tests verified. **Push Alert:** Bundle has doubled since 948KB baseline - prioritize lazy loading for batch components in Epic 13-15 UX redesign.
- **Story 13.1 Critical Use Cases (2025-12-23):** First documentation-only story in Epic 13 UX Design phase. Created comprehensive E2E use cases document with Gherkin test scenarios. Pattern: For design epics, use case documents serve as E2E testing baseline AND mockup validation criteria. All 6 use cases mapped to personas with step-by-step flows, UI states, success metrics, edge cases, and error handling.
- **Story 13.1 Atlas Code Review (2025-12-23):** Adversarial review found HIGH severity issues - future features (breathing polygon, goals GPS, emotional airlock) were documented as testable without status indicators. **Fix:** Added implementation status legend (🟢 CURRENT / 🟡 FUTURE), expanded from 6 to 8 use cases (added UC7: Trust Merchant, UC8: Insight Discovery to cover shipped workflows), added Appendix D: Currency & Locale Standards for CLP formatting and Chilean Spanish colloquialisms. **Key Lesson:** Documentation stories still need adversarial review - misleading E2E authors is HIGH severity. Always check workflow chain coverage against Atlas Section 8 to identify missing use cases for shipped features.
- **Story 13.2 Voice & Tone Guidelines (2025-12-23):** Created comprehensive voice guidelines at `docs/uxui/voice-tone-guidelines.md`. Document includes 5 voice principles with Do/Don't examples, message templates for all categories (Insights, Alerts, Celebrations, Setbacks, System), Rosa-friendly alternatives, Chilean Spanish adaptation guide, Emotional Airlock pattern documentation, and writing checklist. **Reference for Implementation:** All Epic 14+ messaging should follow these guidelines - especially "observes without judging" principle.
- **Story 13.2 Atlas Code Review (2025-12-23):** APPROVED with 4 fixes applied: (1) Added Use Case Mapping table linking voice guidelines to E2E use cases, (2) Added "Intentional or Accidental?" pattern scope clarification - applies to Setbacks, Trend Alerts, Out-of-Character only, (3) Added Epic context to implementation notes (e.g., "Implementation Note (Epic 15)"), (4) Fixed CLP currency format ($13.500 not $13,500). **Key Lesson:** Documentation stories that establish design patterns need use case mapping for implementation traceability and epic context for features not yet built.
- **Story 13.3 Motion Design System (2025-12-23):** Created comprehensive motion design specification at `docs/uxui/motion-design-system.md`. Document establishes "Everything Breathes" animation system with: 5 timing curves (ease-out, ease-in-out, ease-in, spring, linear), 8 duration tokens, 6 animation categories, full screen transition matrix, breathing effect specs (3s cycle, scale 1.02, opacity 0.9-1.0), Settings exception (instant load), and prefers-reduced-motion fallbacks for ALL animations. **Key Patterns for Epic 14:** CSS custom properties for animation tokens, Tailwind config extension for keyframes, useReducedMotion hook pattern, GPU-accelerated transforms only (no layout thrashing). **Implementation Note:** Document builds on existing Epic 11.3 patterns (AnimatedItem, staggered reveal) and provides complete keyframe examples ready for copy-paste into Epic 14 implementation.
- **Story 13.3 Atlas Code Review (2025-12-23):** APPROVED with 8 fixes applied: (1) Added implementation status legend (🟢 CURRENT / 🟡 FUTURE) to differentiate Epic 11 patterns from Epic 14 new features, (2) Aligned Progressive Reveal timing to match existing code (100ms stagger, 20px translateY, 2500ms max duration) instead of spec-only values, (3) Marked useCountUp hook as FUTURE with explicit "create in Epic 14" note, (4) Updated testing checklist to show Epic 11.3 tests as passing, (5) Fixed Tailwind config to use ESM syntax (export default), (6) Removed duplicate useReducedMotion definition, (7) Added section status tags throughout document, (8) Fixed Related Documents with correct paths. **Key Lesson:** Design specs MUST align with existing code values - discrepancies between spec (50ms, 12px) and implementation (100ms, 20px) cause developer confusion. When documenting patterns that already exist in code, VERIFY actual values from source files before publishing.
- **Story 13.4 Home Dashboard Mockup (2025-12-23):** Created comprehensive mockup with Dynamic Polygon visualization, lava metaphor (inner=spending, outer=budget), breathing animations, and María persona validation. Includes HTML interactive prototype, Excalidraw wireframes, and detailed MD spec. **Patterns Adopted:** Breathing animation (3s healthy, 2s overspend), use case mapping (UC2: Weekly Health Check), implementation status legend.
- **Story 13.4 Atlas Code Review (2025-12-23):** APPROVED with 4 fixes applied: (1) Fixed CLP currency format throughout spec (dot separator: $45.000 not $45,000), (2) Added implementation status legend with 🟢 CURRENT / 🟡 FUTURE markers, (3) Added use case mapping table (UC2: Weekly Health Check, UC1: First Receipt Scan), (4) Added Epic 11.3 animation references for reuse (useReducedMotion, useStaggeredReveal, AnimatedItem). **CORRECTION (2025-12-27):** "Gastify" is the CORRECT app brand name for UI/mockups (project codename is "Boletapp" but user-facing brand is "Gastify"). Design mockups benefit from linking to existing code patterns to prevent reimplementation.
- **Story 13.4 Design System HTML Components (2025-12-27):** Atlas dev-story validation of `design-system-final.html` (590KB). Comprehensive component library with 3 themes (Professional, Mono, Ni No Kuni), 2 fonts (Outfit, Space Grotesk), 8 tab sections (Transactions, Settings, Scan, Analytics, Insights, Navigation, Components, Design). All 10 ACs validated against file: typography scale, color palette with CSS custom properties, 4px grid spacing, card variants, button variants, navigation components, form elements, feedback states, icon library, and interactive comparisons. **Key Lesson:** Story file path accuracy - Dev Agent Record referenced `design-system-components.html` but actual file was at `00_components/design-system-final.html`. Always verify file paths in completion notes match actual filesystem location before marking story complete.
- **Story 13.4 Atlas Code Review (2025-12-27):** APPROVED with 4 fixes applied: (1) Added `@media (prefers-reduced-motion: reduce)` CSS block to disable all animations for accessibility, (2) Added ARIA attributes to navigation tabs (`role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`) and expandable transaction items (`role="button"`, `aria-expanded`, `aria-label`, `tabindex="0"`), (3) Added Implementation Status Legend (🟢 CURRENT / 🟡 FUTURE) with Component Status table, (4) Added Use Case Mapping table linking component sections to E2E use cases from Story 13.1. Typography scale note added (H1: 28px→32px, H2: 22px→24px adjustment). CLP format ($45.990 with dot separator) verified correct. **Key Lesson:** Design mockups with interactive elements MUST include accessibility attributes even in prototypes - pattern compliance extends to HTML mockups, not just production code. The `prefers-reduced-motion` pattern from Story 13.3 applies to ALL deliverables including mockups.
- **Story 13.5 Extract Design System Reference (2025-12-27):** Created compact reference file (`docs/uxui/mockups/00_components/design-system-reference.md`) at ~1800 tokens from 591KB source. Unblocks all mockup stories (13.6-13.13). **Key Lesson:** Large HTML design system files should be extracted to compact markdown references with prescriptive validation rules to prevent context overflow in AI mockup generation. Reference must include CSS variable requirements, Spanish label enforcement (Inicio/Analíticas/Ideas/Ajustes), camera icon specification (NOT scan), and critical positioning values (scan-center: margin-top -56px).
- **Story 13.5 Atlas Code Review (2025-12-27):** APPROVED with 6 fixes applied: (1) Fixed CLP currency format (dot separator: $45.200 not $45,200), (2) Added Implementation Status Legend (🟢 CURRENT / 🟡 FUTURE), (3) Added Use Case Mapping table linking to Story 13.1 use cases, (4) Added Themes & Fonts documentation (3 themes, 2 fonts), (5) Added Accessibility Requirements section (prefers-reduced-motion, ARIA patterns), (6) Updated Quick Reference with CLP format reminder. **CRITICAL BRANDING CLARIFICATION:** "Gastify" is the CORRECT user-facing app brand - "Boletapp" is the internal project/repo name only. Added Pattern #28 to Patterns to Follow. **Key Lesson:** Design system references inherit ALL Epic 13 requirements: Implementation Status Legend, Use Case Mapping, CLP dot format, accessibility patterns. Also corrected erroneous Story 13.4 review notes that incorrectly suggested replacing Gastify with Boletapp.
- **Story 13.6 Home Dashboard Mockup Iteration (2025-12-29):** Documented two reusable UI patterns for carousel-based cards (Pattern #29: Integrated Carousel with Rounded Navigation Bar, Pattern #30: Expandable List with Toggle Button). These patterns enable: (1) Carousels where the navigation indicator bar visually integrates with the card using split border-radius (top on wrapper, bottom on indicator), (2) Lists that show 2 items by default and expand to 5 via a small circular +/- button next to the title. **Key Implementation Files:** `docs/uxui/mockups/home-dashboard/layout-a-analytics-first.html` demonstrates both patterns in the "Transacciones/Artículos" carousel. **Reference for Future Mockups:** Both patterns are reusable across Gastify and other projects - the 3-level container structure (container → wrapper → track + indicator bar as siblings) is essential for the rounded corner integration to work.
- **Story 13.9 Scan Overlay Mockup (2025-12-30):** Documented four reusable patterns for interactive mockups with modals and dropdowns:
  - **Pattern #31: Unique Animation Keyframe Names** - When adding new `@keyframes` animations in `<style>` blocks within HTML mockups, use UNIQUE names (e.g., `modalFadeIn` instead of `fadeIn`). Duplicate keyframe names override earlier definitions, causing unexpected behavior. Example: A centered modal's `fadeIn` with `transform: translate(-50%, -50%)` broke existing overlay `fadeIn` that expected no transform.
  - **Pattern #32: JavaScript Style Reset Must Restore Defaults** - When JavaScript toggles UI states (dropdowns, modals), the "close/reset" function must restore original inline styles, not clear them. Clearing (`style.border = ''`) removes intentional styling. Pattern: `closeAllDropdowns() { tags.forEach(t => { t.style.border = '1px solid var(--border-medium)'; t.style.background = 'var(--bg-primary)'; }); }` instead of setting to empty string.
  - **Pattern #33: Nested Background Contrast** - For pill/tag elements inside cards, use `background: var(--bg-primary)` + `border: 1px solid var(--border-medium)` for sufficient contrast. Using `var(--bg-tertiary)` inside `var(--bg-secondary)` cards creates insufficient visual separation. The border provides the visual distinction when background colors are similar.
  - **Pattern #34: Centered Modal vs Bottom Sheet** - Bottom sheets use `position: absolute; bottom: 0;` with `border-radius: var(--radius-xl) var(--radius-xl) 0 0;` and `animation: slideUp`. Centered modals use `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);` with full `border-radius: var(--radius-xl);` and `animation: modalFadeIn` (with matching transform in keyframes). Centered modals should NOT have the drag handle (gray bar at top).
  **Key Implementation Files:** `docs/uxui/mockups/01_views/scan-overlay.html` demonstrates all patterns in the Edit Transaction Interactive state with functional dropdowns and Item Edit modal.
