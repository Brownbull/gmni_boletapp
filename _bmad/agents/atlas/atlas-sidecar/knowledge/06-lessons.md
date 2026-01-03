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
- **Story 14.1 Animation Framework (2025-12-31):** Epic 14 Core Implementation begins. Created animation infrastructure: AnimationContext provider, useBreathing hook (3s cycle, scale 1.02, opacity 0.9-1.0), useStagger utility, comprehensive constants file matching motion-design-system.md. 80 unit tests. **Atlas Code Review Fixes:**
  - **Pattern #35: Duration Constants Match Design Spec** - Animation duration values (DURATION.FAST) must match motion-design-system.md exactly. During code review, DURATION.FAST was 150ms but design spec specified 100ms. Always verify constant values against source specification document.
  - **Pattern #36: No CSS Transition with requestAnimationFrame** - When using `requestAnimationFrame` for smooth animations, do NOT add CSS `transition` property to the style object. RAF already provides 60fps interpolation; adding CSS transition causes double-interpolation and potential jank on low-end devices. Removed `transition: 'transform 0.1s...'` from useBreathing style object.
  - **Pattern #37: Utility Functions Need Reduced Motion Warning** - Standalone utility functions like `calculateStaggerDelay()` that bypass React hooks don't automatically check `prefers-reduced-motion`. Add prominent JSDoc warnings: "This utility does NOT automatically check prefers-reduced-motion. Use hook instead, or pass enabled: false, or check useReducedMotion() first."
  - **Pattern #38: Clarify Deferred Integration in AC** - When acceptance criteria mention "integrated at app root" but implementation defers App.tsx integration to a later story (e.g., waiting for first consumer in Story 14.5), update the AC wording to match actual implementation plan. "AC #1: AnimationContext provider created (App.tsx integration deferred to Story 14.5)" prevents confusion during code review.
- **Story 14.2 Screen Transition System (2025-12-31):** Created PageTransition component for screen-level transitions, TransitionChild for staggered child reveals, useNavigationDirection hook for history-based forward/back detection. 54 unit tests. **Atlas Code Review Fixes:**
  - **Pattern #39: Handle 'none' Direction for Fade Transitions** - When implementing directional transitions (forward/back), handle `direction='none'` explicitly for fade-only transitions (tab switches). Don't default to a slide direction for the 'none' case. Added `pageTransitionFade` keyframe alongside `pageTransition` for cases requiring opacity-only animation without translateX. Per motion-design-system.md Section 2.1: "Tab | Tab | Fade crossfade | 150ms".
  - **Pattern #40: Single Canonical Type Location** - When a type (e.g., `NavigationDirection`) is needed by multiple files, define it once in the most logical location and import + re-export from other files. Duplicate type definitions (`export type NavigationDirection = ...` in multiple files) violate DRY and risk type drift. Fixed by importing from useNavigationDirection.ts into PageTransition.tsx.
  - **Pattern #41: Remove Dead Code During Review** - State variables that are initialized but never conditionally changed (e.g., `isVisible` always true, conditional return never triggers) are dead code. Remove them during code review rather than leaving for future cleanup. Dead code confuses developers and increases cognitive load.
- **Story 14.3 Scan Overlay Flow (2025-12-31):** Created ScanOverlay component and useScanOverlayState hook for non-blocking overlay during receipt processing. 46 unit tests. **Key Patterns:**
  - **Pattern #42: Layered Overlays with Progressive Reveal** - For scan overlays that progressively reveal results, layer: (1) semi-transparent backdrop with blur, (2) centered card with state-based content, (3) tip message for user guidance. Use existing `useStaggeredReveal` hook for item animation rather than creating new reveal logic.
  - **Pattern #43: ETA Calculation from History** - Calculate estimated processing time using rolling average of last N processing times (N=5 default). Store times in useRef to persist across renders. Default to 4 seconds when no history exists. Record actual processing time on success for future estimates.
  - **Pattern #44: State Machine Extends Existing Pattern** - When creating new state machine hooks (useScanOverlayState), extend the pattern from existing hooks (useScanState from Story 11.5). Maintain consistent state names (idle, uploading, processing, ready, error) and transition functions (startUpload, startProcessing, setReady, setError, reset, retry).
  - **Pattern #45: Non-Blocking Navigation Tip** - For overlays that allow user navigation during processing, add explicit tip text: "Puedes navegar mientras procesamos". This reassures users they won't lose progress if they navigate away. Don't use forced modal focus trap for non-blocking overlays.
- **Story 14.3 Atlas Code Review (2025-12-31):** Additional patterns discovered during adversarial code review:
  - **Pattern #46: Use Animation Constants Not Hardcoded Durations** - Animation components should import `DURATION` from `../animation/constants.ts` instead of using hardcoded Tailwind classes like `duration-200`. Pattern: Use `style={{ transitionDuration: \`${DURATION.NORMAL}ms\` }}` with `transition-opacity` class. This ensures duration changes in the design system propagate to all components.
  - **Pattern #47: Re-export Types from Single Canonical Location** - When a type (e.g., `ScanOverlayState`) is needed by both hook and component, define it ONCE in the hook file and re-export from the component: `export type { ScanOverlayState } from '../../hooks/useScanOverlayState';`. This prevents duplicate definitions and type drift.
  - **Pattern #48: Clarify Deferred App.tsx Integration in Task Description** - When a component/hook is created but App.tsx integration is deferred to a consuming story, update task description to be explicit: "Export from index.ts (App.tsx integration deferred to scan flow consumer)". This prevents code review from flagging missing integration as a bug when it's intentional.
- **Story 14.5 Dynamic Polygon Component (2025-12-31):** Created DynamicPolygon SVG visualization with 3-6 vertex support, breathing animation, and category labeling. 28 unit tests (5 added during code review). **Atlas Code Review Fixes:**
  - **Pattern #49: Valid Tailwind Classes for SVG Hover Effects** - Tailwind classes like `hover:r-10` are invalid (SVG `r` attribute is not a CSS property). For SVG element hover effects, use: (1) valid Tailwind transform classes like `hover:scale-125`, (2) inline styles with `cursor: 'pointer'`, `transition: 'transform 150ms ease-out'`, and `transformOrigin` pointing to the element's center. Never invent Tailwind classes - verify they exist in the Tailwind CSS docs.
  - **Pattern #50: Extract Repeated Calculations to useMemo** - When the same calculation (e.g., vertex positions from angle, radius, and spending ratio) is performed once in useMemo and again in a render loop, consolidate into a single useMemo that returns all derived data. Pattern: `const vertexPositions = useMemo(() => categories.map((cat, i) => ({ x, y, category: cat })), [categories]);` then map over `vertexPositions` in JSX instead of recalculating.
  - **Pattern #51: Unique IDs for Multi-Instance SVG Components** - When SVG components use `<defs>` with `id` attributes (gradients, filters, masks), IDs must be unique per component instance. Use `useMemo(() => \`prefix-${Math.random().toString(36).slice(2, 11)}\`, [])` to generate stable unique IDs. Multiple instances with the same gradient ID will all reference the first definition, causing visual bugs.
  - **Pattern #52: Test Keyboard Navigation for Interactive SVG Elements** - When SVG elements have `onClick`, `role="button"`, and `tabIndex={0}`, they MUST also have `onKeyDown` handlers for Enter and Space keys. Tests MUST verify keyboard accessibility: `fireEvent.keyDown(element, { key: 'Enter' })` should trigger the same action as click. Missing keyboard tests = missing accessibility coverage.
- **Story 14.6 Polygon Dual Mode (2026-01-01):** Added PolygonModeToggle segmented control and PolygonWithModeToggle integrated component. Implemented usePolygonMode hook with localStorage persistence and aggregation functions. 74 unit tests (46 new + 28 from Story 14.5). **Key Patterns:**
  - **Pattern #53: Mode Aggregation Functions as Pure Utilities** - When a component can display data in multiple modes (merchant categories vs item groups), extract aggregation logic into pure functions (`aggregateByMerchantCategory`, `aggregateByItemGroup`) alongside the hook. This enables testing aggregation logic independently from React state management. Hook provides state + actions, utilities provide data transformation.
  - **Pattern #54: localStorage Validation with Fallback** - When persisting mode/preference to localStorage, validate the stored value against allowed values before using. Pattern: `const stored = localStorage.getItem(key); if (stored && VALID_MODES.includes(stored)) return stored; return defaultValue;`. This prevents crashes from corrupted or outdated stored values.
  - **Pattern #55: CSS Transitions for Mode Switching** - Use `transition-all duration-300 ease-out` wrapper for smooth visual transitions when switching between display modes. The polygon shape morphs naturally as React re-renders with new data - no complex SVG path interpolation needed. Simpler than animating SVG path `d` attribute directly.
- **Story 14.4 Quick Save Path (2026-01-01):** Enhanced QuickSaveCard with spring animations, success checkmark, and onSaveComplete callback for Trust Merchant chaining. 33 unit tests (7 new for animations). **Key Patterns:**
  - **Pattern #56: onSaveComplete Callback for Animation Chaining** - When a save action has a success animation followed by navigation or next prompt (Trust Merchant), use an `onSaveComplete` callback prop instead of having parent immediately dismiss. Pattern: QuickSaveCard shows success animation, waits for DURATION.SLOWER (400ms), then calls `onSaveComplete()`. Parent handles dismissal and next action in callback. This separates animation timing from parent logic.
  - **Pattern #57: DEPRECATED - See Pattern #60** - Originally suggested inline keyframes; replaced by global CSS approach for performance.
  - **Pattern #60: Global CSS Keyframes over Inline Styles** - Define `@keyframes` in global CSS (`index.html` `<style>`) rather than inline JSX `<style>` elements. Inline styles create new DOM elements on every render, causing performance overhead. Add new animations to the `prefers-reduced-motion` media query list for accessibility. Pattern: `@keyframes animationName { ... }` + `.animate-class { animation: ... }` in global CSS, then use class in JSX: `className={prefersReducedMotion ? '' : 'animate-class'}`.
  - **Pattern #58: Success State Replaces Action Buttons** - When showing a success state (checkmark + "¡Guardado!"), HIDE the action buttons (Save, Edit, Cancel) completely rather than disabling them. This creates cleaner visual feedback and prevents user from clicking during animation. Use conditional rendering: `{showSuccess ? <SuccessState /> : <ActionButtons />}`.
  - **Pattern #59: Entry Animation via isVisible State + useEffect** - For modal entry animations (slide-up + fade-in), use `useState(false)` for `isVisible` and `useEffect` to set `true` after mount with small delay (50ms). Apply CSS transform/opacity based on `isVisible`. With reduced motion, initialize `isVisible` to `true` to skip animation. Pattern enables smooth mounting without CSS animation classes.
- **Story 14.4 Atlas Code Review (2026-01-01):** APPROVED with 3 fixes applied: (1) **MEDIUM:** Moved inline `<style>` keyframes to global CSS in `index.html` - prevents DOM element recreation on every render (Pattern #60 supersedes #57), (2) **LOW:** Corrected story file list - removed erroneous `usePolygonMode.ts` reference (belongs to Story 14.6), (3) **LOW:** Wrapped async `fireEvent` calls in `act()` to reduce React act() warnings in tests. **Key Lesson:** Inline `<style>` JSX blocks may seem convenient for component-specific animations, but cause performance overhead because React recreates the DOM element on every render. Global CSS in `index.html` is preferred for all keyframe definitions - use CSS classes conditionally based on `prefersReducedMotion` for accessibility.
- **Story 14.8 Enhanced Existing Charts (2026-01-01):** Added animation enhancements to SimplePieChart and StackedBarChart. Created useCountUp hook for animated count-up values. 60 unit tests (13 for useCountUp, 22 for SimplePieChart, 25 for StackedBarChart). **Key Patterns:**
  - **Pattern #61: useCountUp Hook for Money Value Animation** - Created reusable `useCountUp` hook that animates from 0 (or startValue) to target with ease-out cubic curve. Features: configurable duration (default 400ms), optional start value, reduced motion support (returns target immediately when `prefers-reduced-motion`), rounds to integers. Hook at `src/hooks/useCountUp.ts`. Use for any numeric values that should animate on load (totals, counts, percentages).
  - **Pattern #62: CSS Transform Origin for SVG Hover Effects** - When scaling SVG elements (pie slices, chart segments), set `transformOrigin: 'center center'` to scale from element center, not top-left. Combined with `transition: 'transform 100ms ease-out'`, creates smooth hover breathing effect without layout shift.
  - **Pattern #63: Touch Feedback with Haptic Vibration** - For mobile touch feedback, use `onTouchStart` + `onTouchEnd` with `navigator.vibrate(10)` for brief haptic pulse. Check `!prefersReducedMotion` before triggering haptic. Press-in effect: 0.95x scale on touch start, 1.0x on touch end. Release pop: optionally use 1.05x briefly on touch end before returning to 1.0x.
  - **Pattern #64: Staggered Bar Chart Entry Animation** - For bar charts, use `scaleY(0→1)` with `transformOrigin: 'bottom'` for bars to "grow up" from baseline. Stagger delay per bar: 100ms for ≤10 bars, 50ms for >10 bars, capped at `STAGGER.MAX_DURATION - DURATION.NORMAL` total. Use `transitionDelay` with inline styles, not CSS animation-delay (more control for dynamic stagger values).
- **Story 14.8 Atlas Code Review (2026-01-01):** APPROVED with 1 fix applied: **MEDIUM:** Moved `useCountUp.test.ts` from `tests/unit/components/charts/` to `tests/unit/hooks/` to match project convention (hook tests in hooks/ directory). Updated imports from `../../../../src` to `../../../src`. All 60 tests passing. **Key Lesson:** Hook tests should be placed in `tests/unit/hooks/` not colocated with component tests, even when the hook is primarily used by specific components. This maintains consistent test discovery and follows established project patterns (e.g., `useReducedMotion.test.ts`, `useScanState.test.ts` are in `tests/unit/hooks/`).
- **Story 14.6 Atlas Code Review (2026-01-01):** APPROVED with 3 fixes applied: (1) **HIGH:** Duplicate `PolygonMode` type definition in both `usePolygonMode.ts` and `PolygonModeToggle.tsx` - fixed by keeping single canonical location in hook and re-exporting from component (Pattern #40), (2) **MEDIUM:** Hardcoded animation durations (Tailwind `duration-150`, `duration-300`, inline `150ms`) replaced with `DURATION` constants from animation framework (Pattern #46), (3) **LOW:** Removed redundant `role="button"` on `<button>` element. **Key Lesson:** When creating types used across hook + component, define ONCE in the hook (which owns the state) and have component import + re-export. Also reinforced that ALL animation durations should use central constants - even "small" inline values like hover transitions benefit from the design system tokenization for consistency and future maintainability.
- **Story 14.9 Swipe Time Navigation (2026-01-01):** Created useSwipeNavigation hook for horizontal swipe gesture detection and temporal navigation utilities. 61 unit tests (32 for swipe hook, 29 for temporal navigation). **Key Patterns:**
  - **Pattern #65: Swipe Direction Locking for Scroll Conflict Prevention** - When implementing swipe gestures that coexist with scroll, lock direction after initial 10px movement. Track `directionLocked` and `isHorizontal` via refs. If vertical movement exceeds horizontal, abort swipe and reset. If horizontal exceeds vertical, lock to horizontal and call `preventDefault()` on move events. This prevents accidental swipe triggers during scroll and vice versa.
  - **Pattern #66: Temporal Navigation at Current Granularity** - Time navigation functions (`getNextTemporalPeriod`, `getPrevTemporalPeriod`) should respect the current temporal level (year/quarter/month/week/day). When at week 5 of October, next period is week 1 of November, not week 6. Functions handle all boundary crossings (month→month, year→year) automatically.
  - **Pattern #67: useCallback for Hook Convenience Functions** - When adding convenience functions to existing hooks (like `goNextPeriod`/`goPrevPeriod` to `useHistoryFilters`), use `useCallback` with proper dependencies (`[state.temporal, dispatch]`) to maintain referential stability. This prevents unnecessary re-renders when consumers use these functions as effect dependencies.
  - **Pattern #68: Swipe Haptic Feedback Configuration** - Make haptic feedback optional with `hapticEnabled` prop (default `true`). Use brief 10ms vibration (`navigator.vibrate(10)`) for subtle feedback. Always check `navigator.vibrate` exists before calling (Safari desktop doesn't support it). This provides tactile confirmation of successful navigation without being intrusive.
  - **Pattern #69: Swipe Progress as 0-1 Normalized Value** - Return `swipeProgress` as normalized 0-1 value (`Math.min(Math.abs(diffX) / threshold, 1)`) for visual feedback flexibility. Consumers can use this for opacity, transform intensity, or other continuous effects. Capping at 1 prevents over-extended visual feedback when swipe exceeds threshold.
- **Story 14.9 Atlas Code Review (2026-01-01):** APPROVED with 2 fixes applied: (1) **MEDIUM:** Added JSDoc note to `hapticEnabled` option documenting that consumers should check `useReducedMotion()` and set `hapticEnabled: false` when reduced motion is preferred, (2) **MEDIUM:** Added JSDoc note to `SwipeNavigationResult` interface clarifying that visual feedback state (`swipeProgress`) should respect `prefersReducedMotion` in consuming components. **Key Lesson:** Hooks that provide animation/motion data but don't internally check reduced motion should document this responsibility for consumers. Pattern #77 (reduced motion preference) applies to haptic feedback too - it's a form of motion feedback.
- **Story 14.7 Atlas Code Review (2026-01-01):** APPROVED with 4 fixes applied: (1) **MEDIUM:** Hardcoded glow filter `id="glow"` changed to dynamic `id={glowFilterId}` using same `useMemo(() => \`lava-glow-${Math.random()...}\`, [])` pattern as gradient - prevents ID collision with multiple LavaOverlay instances (Pattern #51), (2) **LOW:** Added 2 edge case tests for negative spending/budget values in `calculateProximity()`, (3) **LOW:** Removed unused `LavaOverlayProps` type import from test file, (4) **LOW:** Updated glow filter test to check for dynamic `lava-glow-*` ID pattern. **Key Lesson:** When applying Pattern #51 (unique SVG IDs), apply it consistently to ALL `<defs>` elements - filters, gradients, masks, clipPaths. Easy to miss secondary defs when focusing on the primary one. The test caught this by checking for hardcoded `#glow` which would fail after the fix.
- **Story 14.10 Top Header Bar (2026-01-02):** Navigation Infrastructure Phase 2 begins. Created TopHeader component with three variants (home/detail/settings), integrated AppLogo with theme-aware gradients, and added to App.tsx layout. 28 unit tests. **Key Patterns:**
  - **Pattern #70: Header Variant Pattern for App-Wide Navigation** - When implementing an app-wide header, use a variant prop (`'home' | 'detail' | 'settings'`) rather than multiple boolean flags. Each variant defines: left element (logo vs back button), center content (wordmark vs title), right element (menu vs nothing). This creates a single source of truth for header behavior and simplifies parent component logic (`variant={view === 'settings' ? 'settings' : view === 'edit' ? 'detail' : 'home'}`).
  - **Pattern #71: Safe Area Inset for Fixed Headers** - Fixed headers on notch devices need `paddingTop: 'env(safe-area-inset-top, 0px)'` in inline style. The main content area below needs corresponding top padding: `paddingTop: 'calc(3.5rem + env(safe-area-inset-top, 0px))'` where 3.5rem (56px) is header height plus buffer. Using CSS custom properties like `--safe-top` is optional but creates consistency with bottom nav pattern.
  - **Pattern #72: View Title Props for Context-Aware Headers** - When header shows different text based on current view (Gastify/Analytics/History/Insights), use a `viewTitle` prop separate from `title`. `viewTitle` is for home variant (Logo + view-specific text), `title` is for detail variant (Back button + custom text). This prevents prop overloading and makes header behavior predictable.
  - **Pattern #73: App.tsx Integration for Navigation Components** - When adding fixed navigation components (header, nav), immediately integrate into App.tsx in the same story rather than deferring. Navigation components need view-state wiring (`onBack`, `onMenuClick`) that's clearest when done alongside component creation. Add translation keys to `translations.ts` in same PR.
- **Story 14.10 Atlas Code Review (2026-01-02):** APPROVED with story documentation updates. No code changes required. (1) Test count corrected from 16 to 28 (exceeded estimates), (2) AC #3 updated to reflect HistoryView merge from Story 10a.1, (3) File list updated to show AppLogo inline instead of separate file. **Key Lesson:** Story artifacts should be updated during review to match actual implementation - prevents confusion in future retrospectives. Header design evolved from "hamburger menu" to "profile avatar dropdown" during implementation to better match mockups.
- **Story 14.11 Bottom Nav Redesign (2026-01-02):** Redesigned Nav.tsx to match home-dashboard.html mockup with 5 items: Inicio, Analíticas, (FAB), Ideas, Alertas. 46 unit tests. **Key Patterns:**
  - **Pattern #74: Canonical Mockup Source** - When multiple mockup files exist for the same component (e.g., navigation-alternatives.html vs home-dashboard.html), identify the CANONICAL source and reference it in story headers. Use "Mockup: <file> (canonical), <file> (exploration)" syntax. The canonical mockup is the final approved design; exploration mockups may show different options.
  - Animation framework integration: Uses `DURATION.FAST`, `EASING.OUT` from constants.ts (Pattern #46)
  - Haptic feedback with reduced motion check: 10ms vibration via navigator.vibrate (Pattern #23, #77)
  - CSS variable theming: All colors use --primary, --text-tertiary for automatic dark/light mode
  - Safe area handling: Uses `env(safe-area-inset-bottom)` for iOS home indicator (Pattern #71)
- **Story 14.11 Atlas Code Review (2026-01-02):** APPROVED with 3 documentation fixes: (1) **MEDIUM:** Story AC #2 labels updated to match canonical mockup (Alertas not Ajustes), (2) **LOW:** Story context section updated with correct Spanish labels, (3) **LOW:** Mockup reference clarified as home-dashboard.html (canonical). **Key Lesson:** Initial code review flagged "Alerts vs Settings" discrepancy as HIGH severity, but user clarified home-dashboard.html is the canonical source which uses Alertas. Always verify canonical mockup before flagging design deviations. The design-system-reference.md was stale (showed Ajustes) - canonical mockup takes precedence.
- **Story 14.12 Home Dashboard Refresh (2026-01-02):** Phase 3 View Integration begins. Redesigned DashboardView with 4 TransitionChild sections (polygon, summary, quick actions, recent transactions). 51 unit tests. **Key Patterns:**
  - **Pattern #75: Dual-View Dashboard Pattern** - Dashboard maintains two view modes: (1) **Dashboard View** with mini polygon, month summary, quick actions, and 5 recent transactions; (2) **Full List View** with filter bar, sort controls, and paginated transactions. Toggle between views using internal state (`showFullList`) or `onViewHistory` callback if provided. Pattern: `if (showFullList) return <FullListView />; return <DashboardView />`.
  - **Pattern #76: Mini Polygon with Category Aggregation** - For dashboard mini polygon (180x180px), aggregate current month's transactions by category, sort by amount descending, and take top 6 categories. Pattern: `Object.entries(categoryTotals).map(([name, amount]) => ({ name, amount, color: getColor(name) })).sort((a, b) => b.amount - a.amount).slice(0, 6)`. Show fallback message if fewer than 3 categories available.
  - **Pattern #77: Month-over-Month Comparison** - Calculate percentage change from previous month: `const change = ((monthSpent - previousMonthSpent) / previousMonthSpent) * 100`. Return null if previousMonthSpent is 0 (avoid division by zero). Show arrow indicator (↑/↓) with red for increase, green for decrease. Always show absolute value with 1 decimal place.
  - **Pattern #78: Quick Action Button Prominence** - Primary action (Scan Receipt) uses `backgroundColor: 'var(--accent)'` with white text. Secondary action (Add Manual) uses card styling with border. Both buttons use `min-h-[56px]` for consistent tap target size and `hover:scale-[1.02]` for subtle feedback. Use `ScanLine` icon (NOT Camera) per mockup convention.
  - **Pattern #79: Staggered Section Entry** - Use 4 TransitionChild components with indices 0-3 for main sections. This creates natural visual flow: polygon (0) → summary (1) → actions (2) → transactions (3). Each section's stagger delay builds on previous, capped by `STAGGER.MAX_DURATION`.
  - **Pattern #80: SVG Polygon Initial Opacity for Animation** - When animating SVG elements with CSS keyframes that start from `opacity: 0`, set `opacity: 0` in the element's inline style to prevent a flash of the final state before animation begins. Pattern: `style={{ opacity: 0, animation: 'radarExpand 1s ease-out forwards' }}`. The keyframe's `forwards` fill-mode keeps the element visible after animation completes. This prevents the "flash of unstyled content" issue where elements briefly show their final state before animating.
  - **Pattern #81: Coordinated Multi-Element Animation Timing** - When animating multiple SVG elements (polygons, dots) that should appear in sequence, use consistent base delays and durations. Pattern for radar chart: (1) Previous polygon: 0.1s delay, 1s duration; (2) Current polygon: 0.3s delay, 1s duration; (3) Data dots: 0.8s delay (after polygon mostly expanded), 0.5s duration. All elements start with `opacity: 0` inline and use CSS keyframes with `forwards` fill-mode. Dots use simple `fade-in` (no scale/transform) to appear "in place" rather than moving.
  - **Pattern #82: Category Selection Comparison Overlays** - When a category is selected in a radar/polygon chart, show comparison data as slide-in overlays. Previous month info slides from left (`translateX(-20px)` → `0`), current month slides from right (`translateX(20px)` → `0`). Use `React.Fragment key={selectedCategory.name}` to force re-animation when selection changes. Occidental reading order: Previous (past) on left, Current (present) on right.
  - **Pattern #83: Trigger Animations on Data Change** - When month selection or data changes, increment an `animationKey` state variable to re-trigger all keyed animations: `setAnimationKey(prev => prev + 1)`. Apply key to animated elements: `key={\`element-${animationKey}\`}`. This forces React to remount elements, restarting their CSS animations without requiring animation reset logic.
  - **Pattern #84: Month Picker Toggle with Ref Exclusion** - When implementing click-outside-to-close for dropdowns, exclude the toggle button from the outside click handler using a ref. Pattern: `if (toggleRef.current?.contains(target)) return;` before checking if click is outside. This prevents the toggle button's click from both toggling open AND triggering the outside-click close handler.
  - **Integration Note:** Story 14.12 integrates previously created components: DynamicPolygon (14.5), PageTransition (14.2), TransitionChild (14.2), useCountUp (14.8), useReducedMotion (existing). No new App.tsx changes needed - DashboardView already wired.
- **Story 14.12 Atlas Code Review (2026-01-03):** APPROVED after fixing documentation discrepancies. Key findings:
  - **Pattern #85: Verify AC Claims Match Implementation** - Story AC#4 claimed "Quick Actions" buttons done, but implementation moved scan to Nav.tsx FAB per mockup alignment. Code review found test file explicitly stated "REMOVED per Story 14.12 mockup alignment". **Fix:** Update story ACs to reflect actual implementation when design decisions change. Test coverage section claimed "4 tests" for AC#4 but actual count was 0. **Lesson:** When mockup-driven changes remove or relocate features, update ALL story sections: AC checklist, Test Coverage breakdown, Test Plan steps, Implementation Details. Documentation accuracy is HIGH priority - misleading story files cause confusion in future sprints.
  - **Pattern #86: Month Picker Documentation Accuracy** - Story described "Year selector showing last 5 years" and "Month grid (4x3)" but implementation uses arrow-based navigation. Always update AC descriptions to match implementation, especially when mockup interpretation differs from initial specification.
- **Story 14.12 Theming Refinements (2026-01-03):** Added 3 color themes (Normal/Ni No Kuni, Professional, Monochrome) with light/dark mode support. Key patterns discovered:
  - **Pattern #87: Mono Theme Requires Grayscale Accent** - For a truly monochrome theme, `--accent` MUST be grayscale (zinc-600 light, zinc-400 dark), not blue. Blue accent colors (even for CTAs) break the monochrome aesthetic. Progress bars, FAB buttons, and other accent elements should all use grayscale.
  - **Pattern #88: Mono Dark Primary Color Must Be Visible** - In mono dark mode, `--primary` cannot be white/near-white (#fafafa) because logo, FAB, and avatar all use `background: var(--primary)` with white text - creating invisible white-on-white. Use zinc-700 (#3f3f46) for mono dark `--primary` to ensure visibility against zinc-950 background.
  - **Pattern #89: Date String Timezone Parsing** - When parsing ISO date strings (`"2025-01-02"`), `new Date("2025-01-02")` parses as UTC midnight, which converts to previous day in western timezones (Chile UTC-3/4). **Fix:** Detect ISO format with regex and parse as local: `const [year, month, day] = dateStr.split('-').map(Number); new Date(year, month - 1, day);`. This ensures "January 2nd" displays as January 2nd regardless of timezone.
  - **Pattern #90: CSS Variable Theming for Three Themes** - Organize CSS custom properties in index.html with: (1) `:root` for default theme (Normal) light mode, (2) `.dark` for default theme dark mode, (3) `[data-theme="professional"]` + `[data-theme="professional"].dark` for second theme, (4) `[data-theme="mono"]` + `[data-theme="mono"].dark` for third theme. Each theme needs complete variable set including: --bg, --bg-secondary, --bg-tertiary, --surface, --primary, --primary-hover, --secondary, --accent, --text-primary/secondary/tertiary, --border-light/medium, --chart-1 through --chart-6.
