# E2E Enforcement Options: Preventing Root Cause Recurrence

**Date:** 2026-02-05
**Source:** [e2e-lessons-learned-2026-02-05.md](e2e-lessons-learned-2026-02-05.md)
**Goal:** Eliminate the 60% AVOIDABLE waste (~55 min per E2E story) by enforcing correct patterns at the right layer.

---

## Defense Layers Overview

The project has 5 enforcement points where bad patterns can be caught. Listed from earliest (cheapest) to latest (most expensive):

```
Layer 1: Story Creation (ecc-create-story)        -- prevents bad ACs
Layer 2: Pre-Write Rules (.claude/rules/)          -- prevents bad code from being written
Layer 3: Pre-Edit Hooks (.claude/settings.json)    -- blocks bad patterns at edit time
Layer 4: Conventions Doc (E2E-TEST-CONVENTIONS.md) -- provides correct copy-paste patterns
Layer 5: Code Review (ecc-code-review)             -- catches what slipped through
```

Each option below maps to the root cause chains from the lessons doc and specifies which layer(s) it enforces at.

---

## Option 1: E2E Pre-Flight Checklist in Rules

**Layers:** 2 (rules) + 4 (conventions)
**Effort:** LOW (15 min)
**Prevents:** Chains 2, 3, 5 (selector guessing, optimistic updates, orphan accumulation)

### What

Add a mandatory pre-flight checklist to `.claude/rules/testing.md` that agents must complete before writing ANY E2E test code.

### Implementation

Add to `.claude/rules/testing.md` under E2E section:

```markdown
## E2E Pre-Flight Checklist (MANDATORY)

Before writing any E2E test interactions, complete these steps:

### Step 1: Component TestId Map
For EVERY component the test will interact with:
- Read the component's .tsx source file
- Extract all `data-testid` attributes (grep for `data-testid`)
- Record actual button/label text from translations.ts
- Note dialog open/close mechanics (backdrop testid, dismiss behavior)
- Note any loading states or optimistic placeholders in hooks

### Step 2: Data Flow Analysis
For EVERY mutation the test will trigger:
- Read the service function (e.g., groupService.ts) to understand the write
- Read the hook (e.g., useGroups.ts) to find optimistic update patterns
- Search for: "PENDING", "temp-", "loading", "optimistic" in hook code
- If optimistic updates exist: plan polling/retry logic BEFORE writing test

### Step 3: Environment Readiness
For staging-dependent features:
- Read firestore.rules for the collections the feature accesses
- Verify rules allow the test's cross-user operations (e.g., non-member reads)
- Check if any Cloud Functions are required and deployed to staging

### Step 4: Cleanup Strategy
- Plan try/finally cleanup from the start
- For shared staging: add pre-test cleanup of residual E2E data
- For multi-user: plan bidirectional cleanup (non-owner leaves, then owner deletes)
- Name test data with `E2E` prefix + `Date.now()` suffix for cleanup targeting
```

### Enforcement

Rules are loaded into every Claude Code session automatically. The agent reads `.claude/rules/testing.md` before any testing work.

### Trade-offs

- (+) Zero implementation cost, immediate effect
- (+) Works for all agents (ECC and manual)
- (-) Advisory only -- no hard enforcement, agent could skip it
- (-) Adds ~5-10 min upfront research per E2E story (but saves ~55 min in debug cycles)

---

## Option 2: Fix E2E-TEST-CONVENTIONS.md

**Layers:** 4 (conventions)
**Effort:** MEDIUM (30 min)
**Prevents:** Chains 2, 4, 5 (selector guessing, fixed timeouts, orphan accumulation)

### What

Fix the 11 documented problems in E2E-TEST-CONVENTIONS.md so agents copying patterns get correct code.

### Implementation

| Fix | Description |
|-----|-------------|
| Fix A1 | Replace `text=Ajustes` with `getByRole('menuitem', { name: 'Ajustes' })` in Navigation Pattern section |
| Fix A2 | Wrap cleanup example in `try/finally`, show both single-user and multi-user patterns |
| Fix A3 | Add `settings-dropdown-ajustes` to Common TestIds (or note that `getByRole` is the standard) |
| Fix A4 | Update file structure listing with all 6 staging spec files |
| Fix A5 | Fix run command to `npx playwright test tests/e2e/staging/... --project=staging` |
| Add A7 | New section: "Bilingual Selector Guidelines" with priority: testid > role > scoped-text |
| Add A8 | New section: "Waiting Strategies" -- `waitFor` for state changes, `waitForTimeout` only for settling |
| Add A9 | New section: "Optimistic Update Handling" with polling pattern for PENDING/loading states |
| Add A10 | New section: "Multi-User Tests" with `browser.newContext()`, independent auth, bidirectional cleanup |
| Add A11 | New section: "SPA Navigation After Reload" -- always re-navigate, never assume view persistence |

### Enforcement

Conventions doc is loaded by `ecc-dev-story` Step 0 for any story with E2E tasks. Agents copy patterns from it.

### Trade-offs

- (+) Fixes the copy-paste pipeline at source
- (+) All future E2E tests benefit immediately
- (-) Does not fix existing spec files (15 latent bugs remain)
- (-) Agents might not re-read conventions if they have prior session knowledge

---

## Option 3: Pre-Edit Hooks for E2E Anti-Patterns

**Layers:** 3 (pre-edit hooks)
**Effort:** MEDIUM (30-45 min)
**Prevents:** Chains 2, 4 (selector guessing, fixed timeouts)

### What

Add pattern-matching pre-edit hooks to `.claude/settings.json` that BLOCK writing known-bad E2E patterns.

### Implementation

Add to `.claude/settings.json` hooks:

```json
{
  "hooks": {
    "PreEdit": [
      {
        "pattern": "tests/e2e/**/*.spec.ts",
        "command": "node -e \"const c=process.argv[1]; const bad=[/text=Ajustes/,/waitForTimeout\\([3-9]\\d{3}/,/button:has\\(svg\\)/]; const found=bad.filter(r=>r.test(c)); if(found.length) {console.error('E2E anti-pattern: '+found.map(r=>r.source).join(', ')); process.exit(1);}\" \"$CONTENT\""
      }
    ]
  }
}
```

**Patterns to block:**

| Pattern | Reason | Suggested Fix |
|---------|--------|---------------|
| `text=Ajustes` | Bare text selector for navigation | Use `getByRole('menuitem', { name: 'Ajustes' })` |
| `waitForTimeout(3000+)` | Fixed timeout > 3s (likely waiting for async) | Use `waitFor({ state: 'hidden/visible' })` |
| `button:has(svg)` | Matches any SVG-containing button | Use `data-testid` |
| `waitForLoadState('networkidle')` | Never resolves with Firebase WebSocket | Use `waitForSelector` for specific element |

### Enforcement

Hard block -- Edit tool rejects the change with an error message explaining why and suggesting the fix.

### Trade-offs

- (+) Hard enforcement -- impossible to write bad patterns
- (+) Immediate feedback with fix suggestion
- (-) May false-positive on legitimate uses
- (-) Regex-based, can be circumvented with creative formatting
- (-) Only catches patterns at edit time, not in existing files

---

## Option 4: ECC Workflow E2E Step Enhancement

**Layers:** 1 (story creation) + 2 (dev workflow)
**Effort:** MEDIUM-HIGH (45-60 min)
**Prevents:** Chains 1, 2, 3 (Firestore rules, selector guessing, optimistic updates)

### What

Enhance `ecc-dev-story` and `ecc-create-story` workflow instructions to include mandatory E2E pre-flight research steps.

### Implementation

#### A. ecc-create-story Step 5.75 Enhancement

Add to Step 5.75 (E2E AC generation):

```xml
<step name="5.75.1: Component TestId Discovery">
  <for-each item="component" in="components_touched_by_story">
    <action>Read component TSX source</action>
    <action>Extract all data-testid attributes into a TestId Map</action>
    <action>Record button/label text from translations.ts</action>
    <action>Note optimistic update patterns in associated hooks</action>
  </for-each>
  <output>TestId Map table in story Dev Notes section</output>
</step>

<step name="5.75.2: Environment Prerequisites">
  <action>Read firestore.rules for collections accessed by feature</action>
  <action>Verify rules allow cross-user operations needed by E2E</action>
  <action>List any staging deployments needed before E2E runs</action>
  <output>Prerequisites section in story Dev Notes</output>
</step>
```

#### B. ecc-dev-story E2E Knowledge Enhancement

Replace the 6-line `e2e` session knowledge block with:

```yaml
e2e:
  environment: staging_only
  viewport: { width: 360, height: 780 }
  screenshots_required: true
  cleanup_required: true
  use_data_testid: true
  pre_flight_required: true
  selector_priority: [data-testid, getByRole, scoped_locator, text_last_resort]
  wait_strategy: observable_state_first_timeout_settling_only
  optimistic_updates: poll_for_resolved_value
  multi_user: browser_newContext_with_try_finally
  cleanup_pattern: try_finally_with_pre_cleanup
  spa_reload: always_re_navigate_after_reload
  bilingual: prefer_testid_over_text_selectors
```

#### C. Fix "verify locally" to "verify against staging"

In ecc-create-story Step 5.75, change:
```
- [ ] Verify test passes locally before PR
```
to:
```
- [ ] Verify test passes against staging: npx playwright test --project=staging
```

### Enforcement

Workflow instructions control agent behavior at the orchestration level. The story creation step produces a TestId Map that the dev-story step consumes, eliminating guesswork.

### Trade-offs

- (+) Catches issues at the earliest possible point (story creation)
- (+) TestId Map eliminates phantom testIds entirely
- (+) Firestore rules check prevents Chain 1 class of failures
- (-) Adds ~10 min to story creation workflow
- (-) Requires updating 2 workflow XML files
- (-) Only helps agents using ECC workflows (manual dev won't benefit)

---

## Option 5: Fix Existing Spec Files (Tech Debt)

**Layers:** N/A (direct code fixes)
**Effort:** HIGH (2-3 hours as separate TD story)
**Prevents:** 15 latent bugs in existing specs

### What

Fix the 15 documented latent bugs across 5 existing spec files.

### Implementation

| Priority | Files | Fixes |
|----------|-------|-------|
| P1 | All 5 specs | Add `try/finally` cleanup wrappers |
| P1 | All 5 specs | Replace `text=Ajustes` with role-based selector |
| P1 | transaction-sharing-toggle.spec.ts | Remove phantom testId `transaction-sharing-helper-text` |
| P1 | verify-staging-ui.spec.ts | Fix phantom testId `user-avatar` -> `profile-avatar` |
| P2 | group-delete-journey.spec.ts | Add pre-test orphan cleanup |
| P2 | view-mode-filtering-journey.spec.ts | Replace CSS class selector with data-testid in deleteOldTestGroups |
| P2 | view-mode-filtering-journey.spec.ts | Replace early `return` with `test.skip()` |
| P2 | user-sharing-preferences.spec.ts | Fix accent-insensitive comparisons |
| P2 | user-sharing-preferences.spec.ts | Add group cleanup after creation |
| P3 | verify-staging-ui.spec.ts | Remove dead credentials |
| P3 | user-sharing-preferences.spec.ts | Replace `networkidle` with element-based wait |

### Enforcement

These are direct code changes. Once fixed, pre-edit hooks (Option 3) prevent regression.

### Trade-offs

- (+) Fixes real bugs in existing test suite
- (+) Prevents false passes from phantom testIds
- (-) High effort, requires reading 5 source files
- (-) Tests may break during fix (need staging environment)
- (-) Should be a separate TD story, not done ad-hoc

---

## Option 6: Conditional Global Setup in Playwright Config

**Layers:** Infrastructure
**Effort:** LOW (15 min)
**Prevents:** D1 (noisy emulator errors on every staging run)

### What

Make `global-setup.ts` skip emulator auth when running staging project.

### Implementation

In `tests/e2e/global-setup.ts`, check which project is running:

```typescript
export default async function globalSetup(config: FullConfig) {
  const projects = config.projects.map(p => p.name);
  // Skip emulator auth for staging-only runs
  if (projects.length === 1 && projects[0] === 'staging') {
    console.log('[E2E Global Setup] Skipping - staging tests handle their own auth');
    return;
  }
  // ... existing emulator auth logic
}
```

Or move `globalSetup` from top-level config to only the `authenticated` project via `dependencies`.

### Enforcement

Config change -- automatic.

### Trade-offs

- (+) Eliminates confusing error output
- (+) Makes staging test output clean
- (-) Minor change, low impact on actual test reliability

---

## Option 7: Shared E2E Helper Module

**Layers:** 4 (conventions via code)
**Effort:** MEDIUM-HIGH (1-2 hours)
**Prevents:** Chains 2, 4, 5 (all selector and cleanup issues across all specs)

### What

Extract common E2E patterns from `join-flow-opt-in.spec.ts` (the most battle-tested spec) into a shared helper module that all specs import.

### Implementation

Create `tests/e2e/helpers/staging-helpers.ts`:

```typescript
export async function loginAsUser(page: Page, userName: string): Promise<void>
export async function navigateToGrupos(page: Page): Promise<void>
export async function createGroup(page: Page, name: string, sharingOn?: boolean): Promise<void>
export async function deleteGroupAsOwner(page: Page, name: string): Promise<boolean>
export async function leaveGroupAsMember(page: Page, name: string): Promise<boolean>
export async function waitForResolvedValue(locator: Locator, isPlaceholder: (text: string) => boolean): Promise<string>
export async function cleanupE2EGroups(page: Page): Promise<void>
```

Then refactor all 6 staging specs to import from this module.

### Enforcement

Correct patterns are encoded in shared code, not documentation. Hard to use wrong pattern when the right one is importable.

### Trade-offs

- (+) Single source of truth for navigation, cleanup, selectors
- (+) Fix a bug once, all specs benefit
- (+) Reduces spec file sizes (helpers extracted)
- (-) High effort (touching all 6 spec files)
- (-) Helper module becomes a single point of failure
- (-) Should be a separate story, not done inline

---

## Recommendation: Phased Implementation

### Phase 1: Immediate (< 30 min) -- Break the Feedback Loop

| Option | Action | Blocks Recurrence Of |
|--------|--------|---------------------|
| **1** | Add E2E pre-flight checklist to `.claude/rules/testing.md` | Chains 2, 3, 5 |
| **2** (partial) | Fix the 3 most dangerous patterns in `E2E-TEST-CONVENTIONS.md`: `text=Ajustes`, cleanup `try/finally`, run command | Chains 2, 4, 5 |
| **6** | Fix global-setup.ts to skip for staging | D1 noise |

**Expected impact:** Eliminates ~40% of AVOIDABLE waste on next E2E story.

### Phase 2: Next Sprint Planning (1-2 hours) -- Strengthen Guardrails

| Option | Action | Blocks Recurrence Of |
|--------|--------|---------------------|
| **2** (full) | Complete E2E-TEST-CONVENTIONS.md rewrite with all missing sections | All chains |
| **3** | Add pre-edit hooks for E2E anti-patterns | Chains 2, 4 |
| **4** | Enhance ECC workflow E2E steps | Chains 1, 2, 3 |

**Expected impact:** Eliminates ~80% of AVOIDABLE waste.

### Phase 3: Tech Debt Story (2-3 hours) -- Clean Existing Debt

| Option | Action | Blocks Recurrence Of |
|--------|--------|---------------------|
| **5** | Fix 15 latent bugs in existing specs | Existing false passes, orphan leaks |
| **7** | Extract shared helper module | All future specs get correct patterns for free |

**Expected impact:** Eliminates remaining 20% + prevents latent bugs from surfacing.

---

## Decision Matrix

| Option | Effort | Impact | ROI | Dependencies |
|--------|--------|--------|-----|-------------|
| 1. Rules pre-flight | 15 min | HIGH | Best | None |
| 2. Fix conventions | 30 min | HIGH | Great | None |
| 3. Pre-edit hooks | 30-45 min | MEDIUM | Good | None |
| 4. ECC workflow | 45-60 min | HIGH | Good | None |
| 5. Fix existing specs | 2-3 hr | MEDIUM | Moderate | Staging env |
| 6. Fix global setup | 15 min | LOW | Easy win | None |
| 7. Shared helpers | 1-2 hr | HIGH | Great | Option 5 first |

**Minimum viable fix:** Options 1 + 2 (partial) + 6 = 45 min total, blocks 3 of 5 root cause chains.
