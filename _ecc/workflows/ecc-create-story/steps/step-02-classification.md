# Step 02: Adaptive Story Classification

Classify story complexity for adaptive agent selection. Not every story needs planner + architect.

<step n="1.5" goal="Classify story complexity for adaptive agent selection" tag="classification">
  <critical>ADAPTIVE PIPELINE: Select agents based on story complexity</critical>

  <action>Analyze story requirements for complexity signals:
    - {{est_tasks}}: Estimated task count from epic description
    - {{est_files}}: Estimated file count from epic description
    - {{is_known_pattern}}: Does the story reference prior stories as pattern
    - {{is_structural_move}}: Is this a file move/rename/consolidation with no logic changes
    - {{involves_new_feature}}: Does this create a new feature module from scratch
    - {{involves_database}}: Search for: database, schema, collection, index, query, batch operations
    - {{involves_auth}}: Search for: auth, authentication, authorization, token, password, secret</action>

  <!-- Classification logic (cascade - first match wins) -->
  <classification>
    <check if="{{is_structural_move}} AND {{is_known_pattern}} AND est_tasks <= 4 AND est_files <= 5">
      <action>Set {{classification}} = "TRIVIAL"</action>
      <action>Set {{pipeline_agents}} = [] (orchestrator generates story directly)</action>
    </check>

    <check if="{{classification}} is NOT set AND est_tasks <= 4 AND est_files <= 8 AND ({{is_known_pattern}} OR {{is_structural_move}})">
      <action>Set {{classification}} = "SIMPLE"</action>
      <action>Set {{pipeline_agents}} = ["planner"]</action>
    </check>

    <check if="{{classification}} is NOT set AND ({{involves_new_feature}} OR est_tasks > 6 OR est_files > 10 OR ({{involves_database}} AND {{involves_auth}}))">
      <action>Set {{classification}} = "COMPLEX"</action>
      <action>Set {{pipeline_agents}} = ["planner", "architect"]</action>
    </check>

    <check if="{{classification}} is NOT set">
      <action>Set {{classification}} = "STANDARD"</action>
      <action>Set {{pipeline_agents}} = ["planner", "architect"]</action>
    </check>
  </classification>

  <!-- Force-include optional reviewers for COMPLEX stories -->
  <check if="{{classification}} == 'COMPLEX' AND {{involves_database}}">
    <action>Add "database-reviewer" to {{pipeline_agents}}</action>
  </check>
  <check if="{{classification}} == 'COMPLEX' AND {{involves_auth}}">
    <action>Add "security-reviewer" to {{pipeline_agents}}</action>
  </check>

  <output>**Adaptive Classification**

    **Story:** {{story_key}}
    **Classification:** {{classification}}
    **Signals:**
    - Est. tasks: {{est_tasks}} | Est. files: {{est_files}}
    - Known pattern: {{is_known_pattern}} | Structural move: {{is_structural_move}}
    - New feature: {{involves_new_feature}} | Database: {{involves_database}} | Auth: {{involves_auth}}
    **Pipeline agents:** {{pipeline_agents}}
    {{#if classification == "TRIVIAL"}}
    Orchestrator will generate story directly — no subagents needed.
    {{/if}}</output>

  <!-- SPIKE-FIRST GATE (A1 / L2-001): Infrastructure pattern detection -->
  <action>Check story title and parent epic title for spike-keywords:
    sync, real-time, migration, delta, distributed, integration, new service,
    new provider, offline, cache invalidation, webhook</action>
  <check if="spike-keyword found">
    <action>Check sprint-status.yaml for a story in this epic with
      'spike' or 'POC' in its title and status=complete.</action>
    <check if="no completed spike story found">
      <output>**⚠️  INFRASTRUCTURE PATTERN: {{spike_keyword}}**

        A spike story must be completed before implementation stories can be created.
        Create first: "Spike: validate [approach] feasibility"

        BoletApp evidence: Epic 14c (delta sync) — 19 days, 78K lines deleted, zero shipped.
        Cause: full implementation without validating the approach first.</output>
      <ask>Create a spike story first? [Y] or acknowledge risk and continue? [N + reason]</ask>
    </check>
  </check>

  <!-- SEMANTIC DRIFT CHECK (FF-B / L2 Pattern Library) -->
  <!-- Catches patterns the keyword gates above miss — same problem, different surface words. -->
  <!-- Reference: docs/layer2/l2-baseline.json (regenerate: python3 scripts/build-l2-baseline.py) -->
  <action>Assess semantic similarity between this story and the 9 L2 patterns:
    L2-001 Wrong-Path Spiral — "build new distributed layer, new sync approach, real-time infra"
    L2-002 Blast-Radius Cleanup — "consolidate all tech debt, full codebase audit, extract shared pattern"
    L2-003 Context Thrashing — "fix multiple concerns at once, re-align everything, update all knowledge"
    L2-004 Churn File Indicator — "modify shared/central file, change core type, update global state"
    L2-005 Parallel Epic Collision — "new epic while another active, pivot, concurrent track"
    L2-006 Sprint Overhead Spiral — "add process, more ceremony, improve workflow tooling"
    L2-007 E2E Sinkhole — "build e2e test suite, playwright infra, integration test framework"
    L2-008 Consensus Drift — "standardize patterns across all modules, align per-component conventions"
    L2-009 Context Pollution — "load all knowledge, context loaded but unused, too much context, irrelevant for task"
    Rate each: NONE / MEDIUM / HIGH (HIGH = strongly resembles, even without exact keywords)</action>

  <check if="any pattern rates HIGH AND its FF-A gate has NOT already triggered above">
    <output>**⚠️ SEMANTIC DRIFT (FF-B): Resembles [L2-00X] [pattern name]**

      The keyword gate did not fire, but the semantic pattern is the same.
      Evidence: [specific reason this story resembles the pattern]
      Gate to invoke: [ff_a_gate from l2-baseline.json]
      Note: L2-008 (Consensus Drift) has no keyword gate — FF-B is its only detector.</output>
    <ask>Acknowledge pattern risk? [Y] proceed / [N + explanation why this is different]</ask>
  </check>
</step>
