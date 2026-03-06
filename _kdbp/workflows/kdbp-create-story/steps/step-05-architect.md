# Step 05: ECC Architect - Technical Design

Spawn ECC Architect for technical design. Skip for TRIVIAL/SIMPLE classification.

<step n="3" goal="Spawn ECC Architect for technical design (skip for TRIVIAL/SIMPLE)">

  <check if="{{classification}} == 'TRIVIAL' OR {{classification}} == 'SIMPLE'">
    <action>Skip architect — orchestrator generates file specification and architectural ACs directly from:
      - Planner analysis (or orchestrator analysis for TRIVIAL)
      - Codebase context (pre-loaded files, existing directory structure)
      - Prior story patterns (if {{is_known_pattern}})</action>
    <action>Set {{architect_design}} from orchestrator's own analysis</action>
    <action>Generate {{file_locations}} from existing codebase structure + FSD conventions</action>
    <action>Generate {{architectural_acs}} based on standard FSD patterns</action>

    <action>Validate generated {{architectural_acs}} include:
      - At least 1 AC-ARCH-LOC-{n} (file location)
      - At least 1 AC-ARCH-PATTERN-{n} (pattern compliance)
      - At least 1 AC-ARCH-NO-{n} (anti-pattern)
      - Architecture source documented in {{architecture_reference}}</action>
    <check if="generated ACs fail validation">
      <output>Orchestrator-generated ACs insufficient. Upgrading to spawn architect agent.</output>
      <action>Add "architect" to {{pipeline_agents}}</action>
    </check>

    <output>**{{classification}} classification** — orchestrator generating file spec and architectural ACs directly</output>
  </check>

  <check if="'architect' in {{pipeline_agents}}">
    <output>**Spawning ECC Architect...**
      Task: Technical design + architectural ACs for {{story_key}}</output>

    <ecc-spawn agent="architect">
      <task-call>
        subagent_type: "everything-claude-code:architect"
        model: "sonnet"
        max_turns: 5
        description: "Technical design for {{story_key}}"
        prompt: |
          ## Technical Design Task

          **Story:** {{story_key}}
          **Classification:** {{classification}}
          **Requirements:** {{story_requirements}}
          **Planner Analysis:** {{planner_analysis}}

          **IMPORTANT: Codebase context provided below. Do NOT read files yourself.**

          ## Phase 1: Architecture Discovery
          1. Check epic document for architecture references
          2. Use provided architecture docs (<db-patterns>, state management, component patterns)
          3. Identify conventions from provided codebase context
          **Foundation check:** If first story for new feature module, include directory scaffolding.

          ## Phase 2: Technical Design
          1. Component Design — new components, modifications, interactions
          2. Data Model — data structures, database changes, API contracts
          3. Dependencies — internal, external packages
          4. Dev Notes — technical guidance, pitfalls, reference implementations

          ## Phase 3: File Specification (MANDATORY)
          | File/Component | EXACT Path | Pattern Reference |

          ## Phase 4: Architectural Acceptance Criteria (MANDATORY)
          - AC-ARCH-LOC-{n}: File location requirements
          - AC-ARCH-PATTERN-{n}: Pattern compliance
          - AC-ARCH-NO-{n}: Anti-patterns (must NOT happen)

          **Output (max 80 lines):** Architecture source, file spec table, architectural ACs, dev notes

          ---
          **PROJECT PATTERNS:** {{project_patterns}}
          ---
          **CODEBASE CONTEXT:** {{codebase_context}}
      </task-call>
    </ecc-spawn>

    <action>Collect architect output as {{architect_design}}</action>
    <action>Extract {{file_locations}} from architect output</action>
    <action>Extract {{architectural_acs}} from architect output</action>
    <action>Set {{architecture_source}} from architect's discovery phase</action>

    <output>**ECC Architect Complete**
      **Architecture Source:** {{architecture_source}}
      **Files:** {{file_locations}}
      **Architectural ACs:** {{architectural_acs}}</output>
  </check>
</step>

<!-- ═══ DESIGN QUALITY GATE (P9 + P5 + P8) ═══ -->
<!-- Birth defects cluster — catch at creation time, not in code review -->

<step n="3b" goal="Design completeness check — catch specification gaps before they become code">

  <action>Review {{architect_design}} and {{file_locations}} against 3 structural checks:

  **[P9] Specification Completeness** — For every entity (data model, API contract,
  component interface, config structure) in the design:
    - Is the format fully specified? (field names, types, constraints, defaults)
    - Rate: COMPLETE | HAS_GAPS
    - HAS_GAPS entities: list what is missing

  **[P5] Growth Bound** — For every persistent entity (database record, file on disk,
  collection, log, cache) in the design:
    - Has a growth limit been declared? (max rows, max size, TTL, rotation policy)
    - Rate: BOUNDED | UNBOUNDED
    - UNBOUNDED entities: flag for scaling discussion

  **[P8] Lifecycle** — For every new entity introduced by this story:
    - Is there a creation mechanism? (who creates it, when, how)
    - Is there a retirement mechanism? (cleanup, archival, deletion)
    - Rate: HAS_LIFECYCLE | MISSING
    - MISSING entities: flag — things that are born but never die accumulate
  </action>

  <output>**Design Quality Gate**
  | Entity | P9 Spec | P5 Growth | P8 Lifecycle |
  {{quality_gate_table}}
  </output>

  <check if="any entity has HAS_GAPS or UNBOUNDED or MISSING">
    <ask>[F] Fix gaps now — return to architect with specific gaps to fill
[A] Acknowledge gaps and proceed — document gaps as tech debt in story ACs</ask>
  </check>

</step>
