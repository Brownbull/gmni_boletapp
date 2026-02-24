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
    - {{involves_database}}: Search for: Firestore, database, schema, collection, index, query, writeBatch
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
</step>
