# Step 07: Generate Story File

Compile comprehensive story file with mandatory architectural ACs from all agent outputs.

<step n="6" goal="Generate comprehensive story file with mandatory architectural ACs">

  <action>Set {{complexity_estimate}} from risk_level: HIGH->Complex, MEDIUM->Moderate, LOW->Simple</action>
  <action>Count {{functional_ac_count}} = number of functional ACs from epic requirements</action>
  <action>Count {{arch_ac_count}} = number of architectural ACs (from architect or orchestrator)</action>
  <action>Count {{task_count}} = number of tasks from planner breakdown (or orchestrator analysis)</action>
  <action>Extract {{tasks_from_planner}} formatted task/subtask list</action>

  <action>Compile story file from:
    - Original requirements and ACs from epic
    - Architectural ACs (from architect or orchestrator)
    - Task breakdown (from planner or orchestrator)
    - Technical design with exact file paths
    - Technical review notes (if any)
    - Dependency notes from Step 5</action>

  <output>**Generating Story File...**</output>

  <story-template>
    ```markdown
    # Story: {{story_key}}

    ## Status: ready-for-dev
    ## Epic: {{epic_name}}

    ## Overview
    {{story_requirements}}

    ## Functional Acceptance Criteria
    {{functional_acs}}

    ## Architectural Acceptance Criteria (MANDATORY)
    > These ACs are MANDATORY and will be validated during code review.

    ### File Location Requirements
    {{file_location_acs}}
    ### Pattern Requirements
    {{pattern_acs}}
    ### Anti-Pattern Requirements (Must NOT Happen)
    {{antipattern_acs}}

    ## File Specification
    | File/Component | Exact Path | Pattern | AC Reference |
    |----------------|------------|---------|--------------|
    {{file_specification_table}}

    ## Tasks / Subtasks
    {{tasks_from_planner}}

    ## Dev Notes
    ### Architecture Guidance
    {{architect_notes}}
    ### Technical Notes
    {{technical_notes}}
    ### E2E Testing
    E2E coverage recommended — run `/ecc-e2e {{story_key}}` after implementation.

    ## ECC Analysis Summary
    - Risk Level: {{risk_level}}
    - Complexity: {{complexity_estimate}}
    - Classification: {{classification}}
    - Agents consulted: {{pipeline_agents_summary}}
    ```
  </story-template>

  <output>## Story Created: {{story_key}}
    **File:** {story_dir}/{{story_key}}.md
    **Sections:**
    - Functional ACs: {{functional_ac_count}}
    - Architectural ACs: {{arch_ac_count}} (MANDATORY)
    - File Specification: exact paths
    - Tasks: {{task_count}}
    - Dev Notes: ECC-generated
    **Agents:** {{pipeline_agents_summary}}</output>

  <!-- DBP: [WI] Intent Block Generation (gated on dbp_active) -->
  <check if="{{dbp_active}}">
    <action>Generate Intent Block for the created story:
      1. **What the person receives:** One sentence — what improves for the end user
      2. **Analogy:** Physical-system analogy (Gabe Lens format)
      3. **Done-when:** Observable exit condition
    </action>
    <action>Append Intent Block as `## Intent` section at top of story file (after header, before ACs)</action>
    <output>**[WI] Intent Block Added:**
      Person receives: {{intent_person_receives}}
      Analogy: {{intent_analogy}}
      Done-when: {{intent_done_when}}</output>
  </check>
</step>
