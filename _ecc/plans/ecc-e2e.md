# ECC E2E Workflow — Design Document

Status: IMPLEMENTED
Date: 2026-02-07

## Purpose

A standalone workflow (`/ecc-e2e`) that handles all E2E testing as a dedicated concern, separated from the main development workflows. Replaces E2E content removed from ecc-create-story (Step 5.75), ecc-dev-story (TDD prompt), and provides a structured approach to staging-based E2E testing.

## Trigger Model: Standalone + Suggested (A+B)

### Standalone Invocation
```
/ecc-e2e                          # Auto-detect story from branch
/ecc-e2e 14d-v2-1-13+14          # Specify story key
/ecc-e2e src/features/shared-groups/  # Specify changed directory
```

### Suggested by Other Workflows

**ecc-dev-story** (Step 7 completion output):
```
If story touches UI components or user flows:
  "Consider running /ecc-e2e for E2E test coverage"
```

**ecc-code-review** (Step 3 synthesis):
```
If code-reviewer or architect flags missing E2E coverage:
  "Recommend: /ecc-e2e to add E2E coverage for new UI"
```

**ecc-create-story** (Step 6 story output):
```
If story has new UI components in File Specification:
  Add note to Dev Notes: "E2E coverage recommended — run /ecc-e2e after implementation"
```

## Input Analysis: Story + Diff (Option C)

The workflow accepts either input and cross-references both:

1. **Story-driven**: Reads story File Specification to find UI components, user flows, ACs
2. **Diff-driven**: Reads `git diff develop...HEAD --name-only` to find actual changed files
3. **Cross-reference**: Compare planned vs actual — flag discrepancies

Priority: git diff (actual changes) takes precedence for test targeting. Story provides context for AC validation and E2E scenario design.

## Agent Architecture

### Knowledge Sources (loaded at Step 0)

| Source | Path | Purpose |
|--------|------|---------|
| E2E Conventions | `tests/e2e/E2E-TEST-CONVENTIONS.md` | TestIds, viewport, timeouts, selectors, cleanup patterns |
| Testing Rules | `.claude/rules/testing.md` | Pre-flight checklist, tier commands, wait strategies |
| Staging Helpers | `tests/e2e/helpers/staging-helpers.ts` | Available utility functions (login, navigate, create, cleanup) |
| Cooldown Reset | `tests/e2e/helpers/cooldown-reset.ts` | Cooldown clearing for toggle features |
| Playwright CLI | `_bmad/tea/testarch/knowledge/playwright-cli.md` | CLI vs MCP decision, auto mode, element refs |
| Selector Resilience | `_bmad/tea/testarch/knowledge/selector-resilience.md` | Selector priority, healing patterns |
| Fixture Architecture | `_bmad/tea/testarch/knowledge/fixture-architecture.md` | Multi-user fixtures, data factories |
| Test Quality | `_bmad/tea/testarch/knowledge/test-quality.md` | 5-dimension scoring (TEA RV) |

### ECC Agents Used

| Agent | Role | When |
|-------|------|------|
| `everything-claude-code:e2e-runner` | Primary — writes and runs E2E tests | Always (EXTEND or CREATE modes) |
| `everything-claude-code:code-reviewer` | Reviews E2E test quality after writing | After test passes |
| Playwright CLI | TestId discovery, page snapshots | Pre-flight (Step 2) |

### TEA Integration (Hybrid — Option C)

TEA (Test Engineering Architect) is a BMAD interactive agent with 36 knowledge files, 9 workflows, and a full quality scoring system. It operates at a **broader scope** than ecc-e2e (epic-level, complex features) and is NOT spawnable via ECC's Task tool.

**Integration model: Knowledge + Escalation**

1. **Knowledge loading** — ecc-e2e loads 4-6 TEA knowledge files into agent prompts (selector resilience, playwright CLI, fixture architecture, test quality). This gives the e2e-runner TEA's best patterns without the overhead of TEA's interactive workflow.

2. **Quality rubric** — TEA's 5-dimension scoring (Determinism, Isolation, Maintainability, Coverage, Performance) is embedded in ecc-e2e's post-test review (Step 6), adapted for autonomous execution.

3. **Escalation triggers** — ecc-e2e's completion step (Step 7) assesses E2E complexity and flags when full TEA involvement is recommended. See "TEA Escalation Triggers" below.

### TEA Escalation Triggers

ecc-e2e is story-level. TEA operates at epic/feature scope. Suggest TEA when:

| Trigger | When | TEA Workflow |
|---------|------|-------------|
| **Epic start** | Beginning a new epic with significant UI surface | `/bmad_tea_test-design` (TD) — coverage strategy for the epic |
| **Epic completion** | All stories in epic done, before final deploy | `/bmad_tea_test-review` (RV) — quality audit across all E2E specs |
| **Complex new feature** | Feature introduces new auth flows, multi-user patterns, or complex state | `/bmad_tea_automate` (TA) — risk-prioritized test expansion |
| **High E2E complexity** | ecc-e2e Step 7 flags: multi-user concurrent + >3 specs created + flaky retries | Suggest RV in completion output |
| **Low quality score** | ecc-e2e Step 6 scores <60/100 on TEA 5-dimension rubric | Suggest RV for deeper audit |
| **Cross-epic E2E gaps** | Code review flags E2E gaps spanning multiple features | `/bmad_tea_trace` (TR) — requirements-to-test traceability |

**Escalation output (Step 7):**
```
TEA Follow-Up Recommended: YES
  Reason: Multi-user concurrent pattern + 2 new specs created + quality score 58/100
  Suggested: /bmad_tea_test-review for quality audit
  Scope: tests/e2e/staging/join-flow-*.spec.ts + group-delete-*.spec.ts
```

## Workflow Steps

### Step 0: Load E2E Knowledge

```
Load and cache:
  - tests/e2e/E2E-TEST-CONVENTIONS.md → {{e2e_conventions}}
  - .claude/rules/testing.md → {{testing_rules}}
  - tests/e2e/helpers/staging-helpers.ts → {{staging_helpers_api}}
  - tests/e2e/helpers/cooldown-reset.ts → {{cooldown_helpers}}
  - _bmad/tea/testarch/knowledge/playwright-cli.md → {{playwright_cli_knowledge}}
  - _bmad/tea/testarch/knowledge/selector-resilience.md → {{selector_patterns}}
```

### Step 1: Analyze Story for E2E Need

**Input collection:**
- Read story file (if provided or detected from branch)
- Run `git diff develop...HEAD --name-only` for actual changes
- Extract UI component files from both sources

**Auto-classification (no user dialog unless ambiguous):**

| Classification | Criteria | Action |
|---------------|----------|--------|
| **SKIP** | No UI files changed, no user-flow ACs, backend-only | Report "E2E not needed" + justification |
| **VERIFY** | Existing E2E spec covers the changed views | Run existing spec, verify it passes |
| **EXTEND** | Existing spec covers the feature but not new functionality | Add steps/assertions to existing spec |
| **CREATE** | No existing spec covers this feature area | Create new spec file |

**Detection logic:**
```
1. List all changed .tsx files that are components/views (not types/utils)
2. Search tests/e2e/staging/*.spec.ts for imports or TestIds matching changed components
3. If match found with full coverage → VERIFY
4. If match found but new ACs not covered → EXTEND
5. If no match → CREATE
6. If no UI files changed → SKIP
```

**Present decision to user for confirmation:**
```
E2E Analysis: EXTEND (extend existing test)
  Story: 14d-v2-1-13+14
  Changed UI: GruposView.tsx, JoinGroupByCode.tsx, EditGroupDialog.tsx
  Existing coverage: join-flow-opt-in.spec.ts covers join flow
  Gap: New validation logic in JoinGroupByCode not tested

  Proceed with EXTEND? [Y/N/Override]
```

### Step 2: Pre-Flight Checklist (enforced, exceptions require user approval)

**Mandatory before writing any test code.** Each step must pass or get explicit user exception.

#### 2a: TestId Discovery (Playwright CLI Auto Mode)

Following TEA's auto-mode pattern:
```
1. Check if dev:staging is running (curl localhost:5174)
2. If running → use playwright-cli snapshot for TestId extraction:
     playwright-cli -s=ecc-e2e-{timestamp} open http://localhost:5174
     playwright-cli -s=ecc-e2e-{timestamp} snapshot
   → Returns element refs (roles, labels, data-testid) in ~93% fewer tokens
3. If NOT running → fallback to reading .tsx source files:
     - Read component source, grep for data-testid
     - Read translations.ts for button/label text
     - Warn user: "Playwright CLI unavailable — using source file fallback"
4. If MCP playwright tools available → use MCP for richer DOM introspection
```

**Output:** `{{testid_map}}` — complete map of all interactive elements on target views

#### 2b: Data Flow Analysis

For EVERY mutation the test will trigger:
```
1. Read the service function (e.g., groupService.ts)
2. Read the hook (e.g., useGroups.ts)
3. Search for: PENDING, temp-, loading, optimistic patterns
4. If optimistic updates exist → plan polling/retry logic BEFORE writing test
5. Document expected state transitions
```

**Output:** `{{data_flow_map}}` — mutations, optimistic patterns, expected state transitions

#### 2c: Environment Readiness

```
1. Read firestore.rules for collections the feature accesses
2. Verify rules allow the test's operations (cross-user reads, group access)
3. Check if Cloud Functions are required and deployed
4. Verify test users exist (alice, bob, charlie, diana)
```

**Output:** `{{env_readiness}}` — pass/fail with details

#### 2d: Cleanup Strategy

```
1. Determine data created during test (groups, invitations, preferences)
2. Plan try/finally cleanup from the start
3. Name test data: E2E prefix + Date.now() suffix
4. For multi-user: plan bidirectional cleanup
5. Check if cooldown resets are needed (toggle features)
```

**Output:** `{{cleanup_plan}}` — cleanup sequence, cooldown resets, residual data handling

**Exception handling:**
```
If any pre-flight step fails:
  Present issue + recommendation to user
  Ask: [F]ix (attempt to resolve) / [S]kip (proceed with known risk) / [A]bort
  User must explicitly approve skipping — no silent bypass
```

### Step 3: Multi-User Detection and Strategy

**Auto-detect from story context:**

```
Indicators of multi-user need:
  - Story mentions: sharing, invitation, join, group membership, cross-user
  - Changed files include: invitationService, groupService with member operations
  - ACs mention multiple user perspectives (e.g., "owner sees...", "member sees...")
  - Existing related tests use multi-user pattern (browser contexts)
```

**Strategy recommendation:**

| Pattern | When | How |
|---------|------|-----|
| **Concurrent** | Users must see each other's actions in real-time (e.g., join flow where owner creates, member joins) | Separate browser contexts (`browser.newContext()`), both open simultaneously |
| **Sequential** | Users act independently in sequence (e.g., user A creates data, user B verifies later) | Single page, login/logout between users via TestUserMenu |
| **Single-user** | Feature only involves one user | Standard staging test pattern |

**Present recommendation:**
```
Multi-User Analysis:
  Pattern: CONCURRENT (owner creates group, member joins via code)
  Users: alice (owner), bob (member)

  Approach:
  - Create separate browser contexts for alice and bob
  - Alice creates group + gets share code
  - Bob joins using share code (concurrent context)
  - Both verify their respective views

  Cleanup:
  1. Bob leaves group (member context)
  2. Alice deletes group (owner context)
  3. Close both contexts

  Cooldown resets needed: YES (sharing toggle cooldown)
  → Will call resetAllCooldowns() in test setup

  Proceed? [Y/N/Adjust]
```

### Step 4: Write/Extend E2E Test

**Spawn e2e-runner agent with full context:**

```
subagent_type: "everything-claude-code:e2e-runner"
prompt: |
  ## E2E Test {mode}: {story_key}

  **Mode:** {EXTEND|CREATE}
  **Target:** {test_file_path}

  **Pre-Flight Results:**
  - TestId Map: {testid_map}
  - Data Flow: {data_flow_map}
  - Environment: {env_readiness}
  - Cleanup Plan: {cleanup_plan}
  - Multi-User Strategy: {multi_user_strategy}

  **E2E Conventions (MUST follow):**
  {e2e_conventions}

  **Available Helpers (import from staging-helpers.ts):**
  {staging_helpers_api}

  **Cooldown Helpers (if needed):**
  {cooldown_helpers}

  **Selector Priority (from TEA):**
  1. data-testid (always preferred)
  2. getByRole with name
  3. Scoped locator within known container
  4. text= (last resort, breaks on translations)

  **Wait Strategy (from conventions):**
  - Observable state: element.waitFor({ state: 'hidden/visible' })
  - Settling only: waitForTimeout(<1000ms)
  - NEVER: waitForTimeout(2000+) for async operations
  - NEVER: waitForLoadState('networkidle') with Firebase

  **Screenshot Convention:**
  - Directory: test-results/{spec-name}/ (PERSISTENT — not cleaned by Playwright)
  - Playwright auto-artifacts (traces, videos): playwright-artifacts/ (cleaned per run)
  - Pattern: {step}-{description}.png
  - Capture at: load, nav change, dialog, form submit, final state, error
  - Re-running a spec only overwrites its own folder; other specs' screenshots persist

  **Viewport (MANDATORY):**
  { width: 360, height: 780 }

  **Test Users:**
  alice, bob, charlie, diana
  Auth via: [data-testid="test-login-button"] → [data-testid="test-user-{name}"]

  **Requirements:**
  {story_acs_relevant_to_e2e}

  **Write the test following ALL conventions above.**
```

### Step 5: Run and Verify

**Ensure staging is available:**
```
1. Check if dev:staging is running (curl localhost:5174)
2. If not: warn user "Start dev:staging first: npm run dev:staging"
3. Wait for user confirmation
```

**Run test:**
```bash
npx playwright test {test_file} --project=staging
```

**On failure (max 2 retries):**
```
1. Analyze failure output (screenshot, trace, error message)
2. Classify failure:
   - Selector not found → re-check TestId map, fix selector
   - Timeout → check wait strategy, add polling
   - State mismatch → check optimistic update handling
   - Auth failure → verify test user, re-login
   - Flaky/timing → add settling wait, increase timeout
3. Fix and retry
4. If still failing after 2 retries:
   - Show full error + trace to user
   - Ask: [F]ix manually / [S]kip test / [D]efer (create TD story for flaky test)
```

**On success:**
```
1. Capture final screenshots
2. Run once more to verify determinism (not flaky)
3. Report: test name, duration, screenshots captured
```

### Step 6: Post-Test Quality Check

**Spawn code-reviewer for E2E test quality:**
```
subagent_type: "everything-claude-code:code-reviewer"
prompt: |
  Review this E2E test for quality:
  - Follows project E2E conventions?
  - Uses data-testid selectors (not fragile selectors)?
  - Has proper cleanup (try/finally)?
  - Screenshots at key interaction points?
  - Wait strategy correct (no networkidle, no long timeouts)?
  - Test data named with E2E prefix + timestamp?
  - Multi-user cleanup bidirectional?

  TEA 5-Dimension Quality Score:
  1. Determinism: No random/flaky patterns?
  2. Isolation: No shared state leaking between tests?
  3. Maintainability: Uses staging-helpers, follows conventions?
  4. Coverage: ACs covered by test assertions?
  5. Performance: Runs within 60-120s budget?
```

### Step 7: Update Story + TEA Escalation Assessment

```
1. Add E2E results to story Dev Notes:
   - E2E Action: {VERIFY|EXTEND|CREATE}
   - Test File: {path}
   - Result: PASS/FAIL
   - Multi-User: {pattern used}
   - Quality Score: {5-dimension average}

2. If story has E2E-related ACs → mark as satisfied
3. If new test created → add to story File List

4. Assess TEA escalation (auto-detect):
   - Count specs created/modified in this session
   - Check if multi-user concurrent pattern was used
   - Check if retries were needed (flaky signal)
   - Get quality score from Step 6
   - Check if this is the last story in the epic

   TEA escalation triggers:
   - Quality score < 60 → suggest /bmad_tea_test-review
   - Multi-user + >2 specs + retries → suggest /bmad_tea_test-review
   - Last story in epic → suggest /bmad_tea_test-review for full epic audit
   - Complex new auth/state patterns → suggest /bmad_tea_automate

5. Output TEA recommendation (or "No TEA follow-up needed")
```

## Workflow Integration Points

### ecc-create-story
Step 6 story template → add to Dev Notes:
```
### E2E Coverage
- E2E Recommended: YES/NO
- Reason: {auto-detected from File Specification}
- Run after implementation: /ecc-e2e {story_key}
```

### ecc-dev-story
Step 7 completion → suggest in next steps:
```
{{#if story_has_ui_components}}
- Run /ecc-e2e for E2E test coverage
{{/if}}
```

### ecc-code-review
Step 3 synthesis → flag missing coverage:
```
{{#if changed_ui_without_e2e}}
- [MEDIUM] No E2E coverage for new UI components
  Recommend: /ecc-e2e {story_key}
{{/if}}
```

## Multi-User Decision Tree

```
Story mentions sharing/invitation/group membership?
├── YES → Multi-user needed
│   ├── Users must interact in same session? (e.g., join flow)
│   │   └── YES → CONCURRENT (separate browser contexts)
│   │       ├── Cleanup: bidirectional (member leaves → owner deletes)
│   │       └── Cooldown: check if toggle features need resetAllCooldowns()
│   └── Users act independently? (e.g., verify data visibility)
│       └── YES → SEQUENTIAL (login/logout via TestUserMenu)
│           ├── Cleanup: single-direction (last user cleans up)
│           └── Cooldown: reset between user switches if needed
└── NO → SINGLE-USER
    ├── Cleanup: standard try/finally
    └── Cooldown: only if testing toggle features
```

## Cooldown/Status Reset Strategy

Some features have cooldown periods (e.g., sharing toggle). E2E tests need to bypass these:

```
1. Detect if story involves features with cooldowns:
   - Sharing toggle → group-level + user-level cooldown
   - Check invitationService for cooldown fields

2. If cooldowns detected:
   - Import resetAllCooldowns from helpers/cooldown-reset.ts
   - Call in test setup (before toggle operations)
   - Document in test comments WHY reset is needed

3. Status resets:
   - If test modifies user preferences → reset in cleanup
   - If test creates/modifies groups → full group cleanup
   - If test generates invitations → clean invitation documents
```

## Playwright CLI Auto-Mode (TEA Pattern)

```
Decision order:
1. Is dev:staging running? (curl check)
   ├── YES → playwright-cli available
   │   ├── Use CLI snapshot for TestId discovery (93% token savings)
   │   ├── Use CLI screenshot for visual verification
   │   └── Use CLI network for API call analysis
   └── NO → fallback to source file reading
       ├── Read .tsx files, grep data-testid
       ├── Read translations.ts for button text
       └── Warn user: "Start dev:staging for better TestId discovery"

2. If CLI encounters error (port conflict, browser crash):
   ├── Inform user of specific error
   ├── Recommend: kill conflicting process / restart dev:staging
   └── Offer: proceed with source file fallback

3. If MCP Playwright tools available (future):
   ├── Use MCP for richer DOM introspection (drag-drop, complex flows)
   └── CLI still preferred for simple snapshots (faster, fewer tokens)
```

## File Structure

```
_ecc/workflows/ecc-e2e/
  workflow.yaml         # 70 lines — agents, knowledge paths, staging settings, TEA escalation thresholds
  instructions.xml      # 531 lines — 7-step workflow (Steps 0-7)

_ecc/commands/ecc-e2e.md  # Command stub → workflow.xml → workflow.yaml
.claude/commands/ecc-e2e.md  # Copy (created by setup.sh or manually)
```

## Implementation Prompt

```
Create the ecc-e2e workflow in _ecc/workflows/ecc-e2e/.

The workflow is standalone, invoked via /ecc-e2e command. It:

1. Loads E2E conventions, testing rules, staging-helpers API, TEA playwright knowledge
2. Analyzes story + git diff to auto-classify: SKIP/VERIFY/EXTEND/CREATE
3. Runs mandatory pre-flight: TestId map (playwright-cli with source fallback),
   data flow analysis, environment readiness, cleanup strategy
4. Auto-detects multi-user need and recommends concurrent vs sequential pattern
5. Spawns e2e-runner agent with full pre-flight context to write/extend tests
6. Runs tests against staging with retry logic (max 2)
7. Spawns code-reviewer for TEA 5-dimension quality scoring
8. Updates story with E2E results + assesses TEA escalation triggers

Key files to reference:
- tests/e2e/E2E-TEST-CONVENTIONS.md (495 lines, full patterns guide)
- tests/e2e/helpers/staging-helpers.ts (shared utilities)
- tests/e2e/helpers/cooldown-reset.ts (cooldown clearing)
- _bmad/tea/testarch/knowledge/playwright-cli.md (CLI auto-mode)
- _bmad/tea/testarch/knowledge/selector-resilience.md
- _bmad/tea/testarch/knowledge/fixture-architecture.md
- .claude/rules/testing.md (pre-flight checklist)

Use ECC workflow patterns (see ecc-dev-story for reference).
Target: instructions.xml ~300 lines, workflow.yaml ~80 lines.
Pre-flight enforcement is mandatory — exceptions require explicit user approval.
```

## Sizing

Actual: 531 lines instructions.xml + 70 lines workflow.yaml + 15 lines command stub = 616 total.

## Resolved Questions

1. **Auto-start dev:staging?** NO — workflow warns user and waits for confirmation. Auto-starting risks port conflicts.
2. **Auto-commit E2E changes?** NO — workflow suggests committing in "Next Steps" but leaves it to the user.
3. **Flaky detection (run twice)?** YES, mandatory — second run after first pass confirms determinism. Flaky signal feeds TEA escalation.
