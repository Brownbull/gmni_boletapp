# Step 03: ECC Planner - Requirements Analysis

Spawn ECC Planner for requirements analysis. Skip for TRIVIAL classification.

<step n="2" goal="Spawn ECC Planner for requirements analysis (skip for TRIVIAL)">

  <check if="{{classification}} == 'TRIVIAL'">
    <action>Verify orchestrator has: loaded architecture patterns, codebase context, prior story reference</action>
    <check if="no prior story pattern reference OR codebase context is empty">
      <output>Insufficient context for TRIVIAL classification. Upgrading to SIMPLE (planner).</output>
      <action>Set {{classification}} = "SIMPLE"</action>
      <action>Set {{pipeline_agents}} = ["planner"]</action>
    </check>
    <check if="context is sufficient">
      <action>Skip planner — orchestrator generates analysis directly from epic + codebase context</action>
      <action>Set {{planner_analysis}} from orchestrator's own analysis</action>
      <output>**TRIVIAL classification** — orchestrator generating analysis directly (no planner agent)</output>
    </check>
  </check>

  <check if="'planner' in {{pipeline_agents}}">
    <output>**Spawning ECC Planner...**
      Task: Analyze story requirements for {{story_key}}
      Classification: {{classification}}</output>

    <ecc-spawn agent="planner">
      <task-call>
        subagent_type: "everything-claude-code:planner"
        model: "sonnet"
        max_turns: 5
        description: "Analyze story requirements for {{story_key}}"
        prompt: |
          ## Story Requirements Analysis

          **Story:** {{story_key}}
          **Classification:** {{classification}}
          **Requirements:** {{story_requirements}}
          **Acceptance Criteria:** {{acceptance_criteria}}

          **IMPORTANT: Codebase context provided below. Do NOT read files yourself.**
          **IMPORTANT: Sizing guidelines — SMALL <=3 tasks/<=4 files, MEDIUM 3-6/<=8, LARGE 6-8/<=12, >8 tasks = split.**

          **Analysis Required:**
          1. **Requirements Breakdown** — core functionality, dependencies, external integrations
          2. **Implementation Approach** — recommended approach, alternatives, trade-offs
          3. **Risk Assessment** — technical risks, complexity factors, unknowns
          4. **Task Decomposition** — task breakdown with estimates, sizing classification
          5. **Testing Strategy** — key unit + integration test scenarios

          **Output (max 80 lines, structured tables preferred):**
          - Implementation approach recommendation
          - Risk: HIGH/MEDIUM/LOW
          - Task breakdown table: | Task | Subtasks | Files | Complexity |
          - Sizing: SMALL/MEDIUM/LARGE (must not be TOO_LARGE)
          - Testing strategy outline

          ---
          **PROJECT PATTERNS:** {{project_patterns}}
          ---
          **CODEBASE CONTEXT:** {{codebase_context}}
      </task-call>
    </ecc-spawn>

    <action>Collect planner output as {{planner_analysis}}</action>
    <output>**ECC Planner Complete**
      **Approach:** {{planner_approach}}
      **Risk:** {{risk_level}}
      **Tasks:** {{task_suggestions}}</output>
  </check>
</step>
