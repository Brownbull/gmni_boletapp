# Step 04a: Story Breakdown (Planner)

Per-epic: spawn planner for story breakdown with risk flags for hardening analysis.

<step n="3a" goal="Break epic into user stories with risk flags" tag="story-breakdown">

  <ecc-spawn agent="planner">
    <task-call>
      subagent_type: "everything-claude-code:planner"
      model: "opus"
      description: "Story breakdown for Epic {{current_epic.number}}"
      prompt: |
        ## Story Breakdown for Epic {{current_epic.number}}: {{current_epic.title}}

        **Epic Goal:** {{current_epic.user_outcome}}

        **Functional Requirements to Cover:**
        {{current_epic_frs_detail}}

        **NonFunctional Requirements:**
        {{current_epic_nfrs_detail}}

        **Architectural Requirements:**
        {{current_epic_ars_detail}}

        **UX Requirements (if applicable):**
        {{current_epic_ux_detail}}

        **Tech Stack:** {{tech_stack}}
        **Project Patterns:** {{project_patterns}}

        ---

        ## SIZING GUIDELINES (Opus 4.6)
        - **SMALL (1-2 pts):** 1-3 tasks, <=10 subtasks, <=4 files
        - **MEDIUM (3-5 pts):** 3-6 tasks, <=25 subtasks, <=8 files
        - **LARGE (5-8 pts):** 6-8 tasks, <=40 subtasks, <=12 files
        - **TOO LARGE (needs split):** >8 tasks OR >40 subtasks OR >12 files

        ## Story Design Principles
        1. Each story must be completable by a single dev agent
        2. Stories flow sequentially within the epic (no forward dependencies)
        3. Database/schema creation happens in the story that first needs it
        4. Each story has clear Given/When/Then acceptance criteria

        ## Required Output Per Story
        1. **Title** — descriptive, action-oriented
        2. **User Story** — "As a {user_type}, I want {capability}, so that {benefit}"
        3. **Acceptance Criteria** — Given/When/Then format
        4. **FR Coverage** — which FRs this story implements
        5. **Preliminary Sizing** — SMALL/MEDIUM/LARGE with task count estimate
        6. **Risk Flags** — DATA_PIPELINE, ERROR_RESILIENCE, INPUT_SANITIZATION,
           E2E_TESTING, PURE_COMPONENT, CROSS_STORE
        7. **Key Files** — major files this story will create or modify
        8. **Intent Handle** — one-line linking story to epic intent.
           Format: "This story [verb] the [epic analogy] by [specific contribution]"
           Example: "This story builds the loading dock for the warehouse by enabling CSV import"
           Must reference the epic's ONE-LINE HANDLE from the Intent Block.
    </task-call>
  </ecc-spawn>

  <action>Collect planner output as {{story_breakdown}}</action>
  <action>Extract {{story_list}} — array of stories with ACs, sizing, risk flags</action>
  <action>Extract {{story_count}} — number of user stories for this epic</action>
</step>
