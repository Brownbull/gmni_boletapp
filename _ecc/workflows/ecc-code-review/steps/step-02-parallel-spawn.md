# Step 02: Parallel Review Agent Spawn

Spawn all selected ECC review agents in a SINGLE message for true parallelism.

<critical>ECC ORCHESTRATOR: Spawning ONLY agents from {{review_agents}} ({{classification}} classification)</critical>
<critical>CRITICAL: Send ALL selected Task calls in a SINGLE message for true parallelism!</critical>

<action>Set {{security_reviewer_model}}:
  - If {{classification}} == "COMPLEX" → "opus"
  - Otherwise → "sonnet"
</action>

<agent-directives>
  IMPORTANT — include in EVERY agent prompt:
  1. File contents provided below. Do NOT use Read/Grep/Glob to read review files.
  2. Return ONLY: numbered findings table (severity | description | file:line), recommendation (APPROVE / CHANGES REQUESTED / BLOCKED), score (X/10). Max ~50 lines. No code snippets.
</agent-directives>

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

      **Acceptance Criteria:** {{acceptance_criteria}}
      **Project Patterns:** {{project_patterns}}

      **Review:** quality, error handling, performance, naming, DRY, complexity

      **Output (max 50 lines):**
      | # | Sev | Finding | file:line |
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
      **Patterns:** {{project_patterns}}

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
      **Testing Patterns:** {{project_testing_patterns}}

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
</ecc-parallel-spawn>

<action>Wait for all selected agents to complete</action>
<action>Collect outputs — extract: finding #, severity, agent, one-line description, file:line</action>
