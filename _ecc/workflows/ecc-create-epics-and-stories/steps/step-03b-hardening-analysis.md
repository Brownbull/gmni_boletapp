# Step 03b: Hardening Analysis (Parallel)

Spawn Architect + Security Reviewer in a SINGLE message for true parallelism.

<step n="3b" goal="Analyze stories for hardening needs" tag="hardening-analysis">

  <output>**Spawning Hardening Analysis (Architect + Security Reviewer)...**</output>

  <parallel-execution-rule>
    HOW TO ACHIEVE TRUE PARALLELISM:
    You MUST issue BOTH Task tool invocations in your NEXT SINGLE RESPONSE.
    Do NOT wait for one to complete before spawning the other.
  </parallel-execution-rule>

  <ecc-parallel-spawn>
    <task-call id="architect_hardening">
      subagent_type: "everything-claude-code:architect"
      model: "opus"
      description: "Hardening analysis for Epic {{current_epic.number}}"
      prompt: |
        ## Hardening Pattern Analysis

        **Epic:** {{current_epic.number}} — {{current_epic.title}}
        **Stories to Analyze:** {{story_list_with_risk_flags}}
        **Hardening Pattern Catalog:** {{cached_hardening_patterns}}
        **Project Patterns:** {{project_patterns}}

        ## Task
        For each story, check its risk flags against the 6 hardening patterns:
        1. **Data Pipeline Hardening** — triggered by DATA_PIPELINE flag
        2. **Error Resilience** — triggered by ERROR_RESILIENCE flag
        3. **Input Sanitization** — triggered by INPUT_SANITIZATION flag
        4. **E2E and Test Infrastructure** — triggered by E2E_TESTING flag
        5. **Pure Component Patterns** — triggered by PURE_COMPONENT flag
        6. **Cross-Store Coupling** — triggered by CROSS_STORE flag

        For each match, determine:
        - What specific hardening tasks are needed (reference the pattern catalog)
        - CLASSIFICATION: BUILT-IN or SEPARATE
          - BUILT-IN: hardening adds <= 2 tasks / 8 subtasks to the story
          - SEPARATE: hardening exceeds threshold or is cross-cutting across stories

        ## Required Output
        Per story:
        ```
        Story N.M: {title}
        - Patterns matched: [list]
        - BUILT-IN additions: Task: {description} ({pattern})
        - SEPARATE stories needed: [list or "none"]
        ```
        Summary:
        ```
        SEPARATE HARDENING STORIES:
        - H-N.1: {title} (pattern: {pattern}, hardens: Story N.M)
        ```
    </task-call>

    <task-call id="security_analysis">
      subagent_type: "everything-claude-code:security-reviewer"
      model: "sonnet"
      description: "Security surface analysis for Epic {{current_epic.number}}"
      prompt: |
        ## Security Surface Analysis

        **Epic:** {{current_epic.number}} — {{current_epic.title}}
        **Stories:** {{story_list_with_risk_flags}}
        **Security Rules:** {{cached_security_rules}}

        ## Task
        For each story, identify:
        1. **User Input Paths** — where user data enters
        2. **DOM Rendering Points** — where user data is displayed
        3. **Auth/Authorization** — authentication touchpoints, permission checks
        4. **File Handling** — file uploads, downloads, MIME validation
        5. **External Data** — Firestore reads, API calls, third-party integrations

        Classify severity: HIGH (dedicated task), MEDIUM (built-in subtasks), LOW (framework defaults)

        ## Required Output
        Per story:
        ```
        Story N.M: {title}
        - Input paths: [list with severity]
        - Security tasks needed: [list of tasks to add]
        ```
        Summary: HIGH-severity items: {count}, Stories needing security tasks: [list]
    </task-call>
  </ecc-parallel-spawn>

  <action>Collect architect output as {{hardening_analysis}}</action>
  <action>Collect security reviewer output as {{security_analysis}}</action>
</step>
