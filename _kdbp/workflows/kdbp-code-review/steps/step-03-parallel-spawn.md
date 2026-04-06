# Step 03: Pre-Classify + Parallel Review Agent Spawn

Run deterministic pre-classifiers first, then spawn agents with pre-labelled input.
Tools detect; agents judge. Agents receive structured findings, not raw code to scan.

<critical>ECC ORCHESTRATOR: Spawning ONLY agents from {{review_agents}} ({{classification}} classification)</critical>
<critical>CRITICAL: Send ALL selected Task calls in a SINGLE message for true parallelism!</critical>

## 2a: Shell Pre-Classification (HIGH certainty findings)

<!-- Conditional pre-classification: scale checks to PR size -->
<action>Count {{files_to_review_count}} = number of files in {{files_to_review}}</action>

<action>Run deterministic checks on {{files_to_review}} — collect output as {{preclassified_findings}}:

```bash
# 1. AI slop patterns (HIGH certainty) — ALWAYS run
grep -rn "console\.\(log\|debug\|warn\)" src/ --include="*.ts" --include="*.tsx" \
  2>/dev/null | grep -v "__tests__\|\.test\.\|\.spec\." | head -20

# 2. TypeScript anti-patterns (HIGH certainty) — ALWAYS run
grep -rn ": any\b" src/ --include="*.ts" --include="*.tsx" \
  2>/dev/null | grep -v "\.test\." | head -20

# 3. TODO/FIXME left in code (HIGH certainty) — ALWAYS run
grep -rn "// TODO\|// FIXME\|// HACK\|// TEMP" src/ \
  --include="*.ts" --include="*.tsx" 2>/dev/null | head -10
```

Conditional checks (skip on small PRs to save tokens):
```bash
# 4. TypeScript errors — SKIP if files_to_review_count <= 3
#    Rationale: tsc --noEmit type-checks entire project; overkill for small changes
npx tsc --noEmit 2>&1 | head -30 || true

# 5. Circular dependencies — SKIP if files_to_review_count <= 5
#    Rationale: madge scans full dependency graph; unlikely to surface on small diffs
npx madge --circular src/ 2>/dev/null | head -20 || true
```

Run checks 4-5 ONLY if {{files_to_review_count}} exceeds their threshold.
If skipped, note in output: "tsc/madge skipped ({{files_to_review_count}} files, below threshold)"

Format results as:
| Type | Certainty | file:line | Finding |
Items 1-3: HIGH certainty. Item 4: HIGH certainty. Item 5: MEDIUM certainty.
Store as {{preclassified_findings}}.
</action>

<action>Set {{security_reviewer_model}}:
  - If {{classification}} == "COMPLEX" → "opus"
  - Otherwise → "sonnet"
</action>

## 2b: Prepare Scoped Context Per Agent

<!-- Each agent receives ONLY its relevant knowledge subset, not the full {{project_patterns}} blob -->
<action>Build scoped context variables from cached knowledge (loaded in Step 01):

  {{code_reviewer_context}}:
    - {{cached_review_patterns}} (code-review-patterns.md — 8 MUST-CHECK patterns)
    - {{cached_state_mgmt}} (state management conventions)

  {{security_reviewer_context}}:
    - OWASP Top 10 checklist (built into agent prompt — no external knowledge needed)
    - {{cached_review_patterns}} § Input Sanitization (P2) and § TOCTOU (P4) sections only

  {{architect_context}}:
    - {{cached_components}} (component patterns)
    - {{cached_db_patterns}} (database patterns, if present)
    - {{cached_state_mgmt}} (state management conventions)

  {{tdd_context}}:
    - {{cached_testing_guidelines}} (testing.md rules)
    - {{project_testing_patterns}} (already separated in Step 01)

  {{ui_reviewer_context}}:
    - {{cached_ui_patterns}} (ui-patterns.md — component manifest, theming rules, checklist)
    - {{cached_components}} (component-patterns.md — architecture-level patterns)
</action>

<agent-directives>
  IMPORTANT — include in EVERY agent prompt:
  1. File contents provided below. Do NOT use Read/Grep/Glob to read review files.
  2. Pre-classified HIGH certainty findings are listed below — DO NOT re-detect these.
     Focus your review on MEDIUM and LOW certainty items that require judgment.
  3. Return ONLY: numbered findings table (severity | certainty | description | file:line),
     recommendation (APPROVE / CHANGES REQUESTED / BLOCKED), score (X/10). Max ~50 lines. No code snippets.
</agent-directives>

## 2c: Spawn Agents

<output>**Spawning {{classification}} Review Team: {{review_agents}}**</output>

<ecc-parallel-spawn agents="{{review_agents}}">
  <!-- Task 1: Code Reviewer (ALWAYS included) -->
  <task-call id="code_review" if="code-reviewer in {{review_agents}}">
    subagent_type: "everything-claude-code:code-reviewer"
    model: "sonnet"
    max_turns: 5
    description: "Code quality review for {{story_key}}"
    prompt: |
      ## Code Review Task — Story: {{story_key}}
      **IMPORTANT: File contents provided below. Do NOT read files yourself.**

      **Pre-classified HIGH certainty findings (do NOT re-detect these):**
      {{preclassified_findings}}

      **Acceptance Criteria:** {{acceptance_criteria}}
      **Code Review Patterns:** {{code_reviewer_context}}
      **Adversarial Patterns (tag findings with IDs where applicable, e.g. `[P6] broken ref`):**
      P1 Missing Infrastructure | P2 Wrong Ordering | P4 Self-Inconsistency |
      P5 No Scaling Strategy | P6 Orphaned References | P7 No Validation Before Action |
      P8 Missing Lifecycle | P9 Incomplete Specification
      (Full reference: `_kdbp/knowledge/adversarial-patterns.md`)

      **Review focus:** MEDIUM/LOW certainty items — quality, error handling, performance,
      naming, DRY, complexity, coupling. Skip items already listed in pre-classified findings.

      **Output (max 50 lines):**
      | # | Sev | Cert | Finding | file:line |
      Recommendation: APPROVE / CHANGES REQUESTED
      Score: X/10

      **FILE CONTENTS:** {{file_contents_manifest}}
  </task-call>

  <!-- Task 2: Security Reviewer (STANDARD + COMPLEX only) -->
  <task-call id="security_review" if="security-reviewer in {{review_agents}}">
    subagent_type: "everything-claude-code:security-reviewer"
    model: "{{security_reviewer_model}}"
    max_turns: 5
    description: "Security review for {{story_key}}"
    prompt: |
      ## Security Review Task — Story: {{story_key}}
      **IMPORTANT: File contents provided below. Do NOT read files yourself.**

      **Security-relevant patterns:**
      {{security_reviewer_context}}

      **Check:** OWASP Top 10 (injection, XSS, auth, access control, secrets, data exposure, CSRF, input validation)

      **Output (max 50 lines):**
      | # | Sev | Vulnerability | file:line | Remediation |
      Secrets detected: Y/N
      Recommendation: APPROVE / BLOCK / CHANGES REQUESTED
      Score: X/10

      **FILE CONTENTS:** {{file_contents_manifest}}
  </task-call>

  <!-- Task 3: Architect (COMPLEX only) -->
  <task-call id="architecture_review" if="architect in {{review_agents}}">
    subagent_type: "everything-claude-code:architect"
    model: "opus"
    max_turns: 5
    description: "Architecture review for {{story_key}}"
    prompt: |
      ## Architecture Review Task — Story: {{story_key}}
      **IMPORTANT: File contents provided below. Do NOT read files yourself.**

      **Architecture Source:** {{architecture_reference}}
      **Architectural ACs:** {{architectural_acs}}
      **File Specification:** {{file_specification_table}}
      **Architecture Patterns:** {{architect_context}}

      **Validate:** file locations, pattern compliance, anti-patterns, architectural ACs, separation of concerns, dependency management

      **Output (max 50 lines):**
      | AC ID | Status | Notes |
      File location compliance: X/Y | Pattern violations: [list] | Alignment: ALIGNED / DRIFT
      Recommendation: APPROVE / CHANGES REQUESTED / BLOCKED
      Score: X/10

      **FILE CONTENTS:** {{file_contents_manifest}}
  </task-call>

  <!-- Task 4: TDD Guide (SIMPLE + COMPLEX only) -->
  <task-call id="test_review" if="tdd-guide in {{review_agents}}">
    subagent_type: "everything-claude-code:tdd-guide"
    model: "sonnet"
    max_turns: 5
    description: "Test review for {{story_key}}"
    prompt: |
      ## Test Coverage Review Task — Story: {{story_key}}
      **IMPORTANT: File contents provided below. Do NOT read files yourself.**

      **Acceptance Criteria:** {{acceptance_criteria}}
      **Testing Patterns:** {{tdd_context}}

      **Review:** AC coverage, edge cases, error scenarios, assertion quality, mock appropriateness, naming

      **Known Async Pipelines (check if story touches any component):**
      {{pipeline_context}}

      **Integration Seam Check (MANDATORY for stories touching async pipelines or cross-boundary handoffs):**
      Integration seams are: Cloud Function ↔ Firestore listener, Firestore write ↔ client onSnapshot,
      event emitter ↔ event handler (mitt bus), upload ↔ queue ↔ process ↔ deliver.
      NOTE: store→component and hook→store are NOT integration seams — those are unit test territory.
      For each seam: does at least ONE test exercise the handoff with real data flow (emulator or staging)?
      If ALL seams are mocked on both sides: flag as "Integration Gap" (severity: HIGH, certainty: HIGH).
      Example gap: "usePendingScan mocks onSnapshot; processReceiptScan mocks Firestore write — nobody tests
      that writing the doc actually triggers the listener."

      **Quality Score (each 0-100):** Determinism, Isolation, Maintainability, Coverage, Performance. 70+ = GOOD.

      **Output (max 50 lines):**
      Coverage gaps: [AC] missing test for [scenario] [file]
      Integration Gaps: [handoff] [missing coverage] [files] — or NONE
      <!-- INTEGRATION_SEAM_CHECK: [PASS|FAIL|N/A] handoffs=[N] tested=[N] -->
      | Dimension | Score | Notes |
      Overall: X/100 — GOOD / NEEDS IMPROVEMENT
      Recommendation: APPROVE / CHANGES REQUESTED
      Score: X/10

      **FILE CONTENTS:** {{file_contents_manifest}}
  </task-call>

  <!-- Task 5: UI Consistency Reviewer (CONDITIONAL — only when UI files touched) -->
  <!-- Fires when any file in {{files_to_review}} matches src/features/*/components/, src/components/, src/shared/ui/ -->
  <task-call id="ui_consistency_review" if="{{files_to_review}} contains .tsx files in UI paths">
    subagent_type: "everything-claude-code:code-reviewer"
    model: "sonnet"
    max_turns: 5
    description: "UI consistency review for {{story_key}}"
    prompt: |
      ## UI Consistency Review Task — Story: {{story_key}}
      **IMPORTANT: File contents provided below. Do NOT read files yourself.**

      You are a UI CONSISTENCY reviewer. Your ONLY job is to check that new/modified UI code
      follows the established patterns in this project. You are NOT reviewing code quality
      (that's the code reviewer's job) — you are reviewing VISUAL and INTERACTION consistency.

      **UI Pattern Manifest (MANDATORY compliance):**
      {{ui_reviewer_context}}

      **Check each file against this checklist:**
      1. THEMING: All colors use CSS variables (no hardcoded hex/rgb). Dark mode supported.
      2. COMPONENTS: Reuses existing components (ConfirmationDialog, TransactionCard, Toast,
         CategoryCombobox, CircularProgress, ScanOverlay) — NO new primitives without justification.
      3. LAYOUT: max-w-md constraint, 44px touch targets, safe area awareness.
      4. ICONS: Lucide React only, correct size/strokeWidth pattern.
      5. MODALS: Registered in ModalManager, uses ConfirmationDialog pattern, focus trap, ESC dismiss.
      6. FORMS: Standard input pattern, label+id association, keyboard navigation.
      7. i18n: All user-facing strings via translations (no hardcoded text).
      8. ANIMATIONS: Uses constants from animation/constants.ts.
      9. STATE: Zustand stores, no new state libraries introduced.
      10. ACCESSIBILITY: ARIA labels, roles, live regions, focus management.

      **Severity guide:**
      - BLOCK: Hardcoded colors, missing dark mode, new icon library, new state library
      - HIGH: Missing i18n, no focus management in modal, touch target < 44px
      - MEDIUM: New component that could reuse existing, missing animation constants
      - LOW: Minor pattern deviation, missing aria-label on decorative element

      **Output (max 40 lines):**
      | # | Sev | Check | Finding | file:line |
      New components introduced: [list] — justified: Y/N
      Existing components reused: [list]
      Recommendation: APPROVE / CHANGES REQUESTED
      Consistency Score: X/10

      **FILE CONTENTS:** {{file_contents_manifest}}
  </task-call>
</ecc-parallel-spawn>

<action>Wait for all selected agents to complete</action>
<action>Collect outputs — extract: finding #, severity, agent, one-line description, file:line</action>
