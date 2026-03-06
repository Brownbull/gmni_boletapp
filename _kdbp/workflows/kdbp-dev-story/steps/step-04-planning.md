# Step 04: Planning + Sizing + Mark In-Progress

Spawn ECC Planner, validate post-planning scope, mark story in-progress.

## Phase 0: Conditional Architecture Intent Gate

<!-- Only fires for architecture/decomposition/integration stories — FEATURE and BUGFIX skip entirely -->
<action>Classify {{story_context}} story type from ACs and title:
  - ARCHITECTURE: creates new modules, services, or infrastructure patterns
  - DECOMPOSITION: splits existing code into new structure
  - INTEGRATION: connects two or more existing systems
  - FEATURE: adds user-visible functionality to existing patterns
  - BUGFIX: fixes a defect
  Set {{story_type}}</action>

<check if="{{story_type}} in [ARCHITECTURE, DECOMPOSITION, INTEGRATION]">
  <action>Extract ## Intent section from story file → {{epic_handle}}, {{story_handle}}</action>
  <check if="## Intent section exists">
    <action>Assess: Does the planned architecture serve the epic intent ({{epic_handle}})?
      Check for:
      - Gold-plating: more infrastructure than the intent requires
      - Scope creep: decisions that serve future epics, not this one
      - Pattern over-engineering: elegant pattern not demanded by intent
      Rate: ALIGNED (proceed silently) | DRIFTED (explain)</action>
    <check if="DRIFTED">
      <output>**INTENT DRIFT DETECTED (Architecture Gate)**
        **Epic Handle:** {{epic_handle}} | **Story Handle:** {{story_handle}}
        **Drift:** {{drift_explanation}}
        Architecture may not serve the stated intent — judgment call.</output>
      <ask>[Y] Override with justification / [N] Revise approach</ask>
    </check>
  </check>
  <check if="## Intent section NOT found">
    <output>Architecture gate skipped — no Intent section in story file.</output>
  </check>
</check>

## Phase A: ECC Planner

<critical>ECC ORCHESTRATOR: Spawning ECC Planner agent</critical>

<action>Prepare planner context:
  - Story requirements: {{story_context}}
  - Architecture patterns: {{project_patterns}}
  - Incomplete tasks: {{task_list}}
</action>

<output>**Spawning ECC Planner...**
  Task: Create implementation plan for story {{story_key}}
  Context: Project patterns + story requirements
</output>

<ecc-spawn agent="planner">
  <task-call>
    subagent_type: "everything-claude-code:planner"
    model: "{{planning_model}}"
    max_turns: 7
    description: "Plan story implementation"
    prompt: |
      Plan the implementation for story: {{story_key}}

      **Story Requirements:** {{story_context}}
      **Tasks to Implement:** {{task_list}}
      **Architecture Patterns:** {{project_patterns}}

      **Output Required:**
      1. Implementation approach for each task
      2. File changes required (paths must match story File Specification)
      3. Dependencies and order
      4. Risk assessment
      5. Testing strategy alignment

      Create a clear implementation plan that the TDD Guide agent can follow.
  </task-call>
</ecc-spawn>

<action>Collect planner output as {{implementation_plan}}</action>
<output>**ECC Planner Complete** — {{implementation_plan_summary}}</output>

<!-- ═══ P4 SELF-INCONSISTENCY CHECK ═══ -->
<!-- Fires AFTER planning (file paths known) but BEFORE complexity check + status change -->
<!-- Only fires when story touches framework config — not application code -->

<check if="any file path in {{implementation_plan}} matches '_kdbp/' OR 'CLAUDE.md' OR '.claude/' OR '_ecc/'">

<action>P4 self-inconsistency gate — read the current versions of:
  1. Framework files being modified (the "before" state)
  2. The planned changes from {{implementation_plan}}

  Check for contradictions:
  - Does a planned edit to a hook contradict a rule in CLAUDE.md?
  - Does a new workflow step contradict an existing hook's enforcement?
  - Does a config change break an assumption in another config file?
  - Does a rule change conflict with the hook that enforces it?

  Rate: CONSISTENT | INCONSISTENT (list contradictions)
</action>

<check if="INCONSISTENT">
  <output>**[P4] SELF-INCONSISTENCY DETECTED**
  The planned changes contradict existing framework rules:
  {{contradictions_list}}
  </output>
  <ask>[F] Fix contradictions before proceeding
[O] Override with justification (document why the contradiction is intentional)</ask>
</check>

</check>

## Phase B: Post-Planning Complexity Check

<critical>MID-STORY SIZING: Check if planning revealed hidden complexity</critical>

<action>Extract from {{implementation_plan}}:
  - {{planned_files}}: Number of files planner identified for changes
  - {{planned_subtasks}}: Subtasks inferred from plan
</action>
<action>Compare to original story: {{original_files}} and {{original_subtasks}}</action>
<action>Calculate: {{file_growth}} = planned_files - original_files | {{subtask_growth}} = planned_subtasks - original_subtasks</action>

<check if="file_growth > 3 OR subtask_growth > 5">
  <output>**COMPLEXITY GROWTH DETECTED**

    **Original:** {{original_files}} files, {{original_subtasks}} subtasks
    **After Planning:** {{planned_files}} files (+{{file_growth}}), {{planned_subtasks}} subtasks (+{{subtask_growth}})
    **Recommendation:** Consider splitting this story before proceeding.
  </output>

  <ask>How to proceed?
    [C]ontinue - Accept increased scope (document risk)
    [S]plit - Split story now before implementation
    [A]bort - Stop and re-scope with SM</ask>

  <check if="user chooses C">
    <action>Document in Dev Notes: Complexity Growth Accepted {date}, original vs actual scope, risk noted</action>
    <output>Proceeding with increased scope. Risk documented.</output>
  </check>
  <check if="user chooses S">
    <action>Invoke story-sizing workflow for this story</action>
    <action>Create split stories, update sprint-status.yaml, continue with first split story</action>
  </check>
  <check if="user chooses A">
    <action>Mark story status as "blocked" in sprint-status.yaml</action>
    <output>Story blocked for re-scoping. Run create-story to revise.</output>
    <stop/>
  </check>
</check>

<check if="file_growth &lt;= 3 AND subtask_growth &lt;= 5">
  <output>Planning scope matches story estimate. Proceeding.</output>
</check>

## Phase C: Mark Story In-Progress

<check if="{{sprint_status}} file exists">
  <action>Update story status: ready-for-dev → in-progress in {{sprint_status}}</action>
  <output>Story {{story_key}} marked in-progress</output>
</check>
