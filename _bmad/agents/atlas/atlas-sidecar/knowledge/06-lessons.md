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
