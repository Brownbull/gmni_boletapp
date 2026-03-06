# Step 02: Epic Design

Spawn ECC Planner agent for epic design. Epics must be USER-VALUE focused, not technical layers.

<step n="2" goal="Design user-value-focused epics with FR coverage map" tag="epic-design">

  <output>**Spawning ECC Planner for Epic Design...**
    Task: Group requirements into user-value-focused epics with coverage map</output>

  <ecc-spawn agent="planner">
    <task-call>
      subagent_type: "everything-claude-code:planner"
      model: "opus"
      description: "Design epics from requirements"
      prompt: |
        ## Epic Design Task

        **Goal:** Group requirements into user-value-focused epics.

        **Requirements:**
        {{functional_requirements}}

        **NonFunctional Requirements:**
        {{nonfunctional_requirements}}

        **Architectural Requirements:**
        {{architectural_requirements}}

        **UX Requirements:**
        {{ux_requirements}}

        **Tech Stack:**
        {{tech_stack}}

        ---

        ## Epic Design Principles (MANDATORY)

        1. **User-Value First** — each epic must enable users to accomplish something meaningful
           - CORRECT: "User can build architectures on a canvas" (clear user outcome)
           - WRONG: "Database Setup" or "API Layer" (no user value)
        2. **Incremental Delivery** — each epic delivers value independently
        3. **No Forward Dependencies** — each epic works without requiring future epics to function
        4. **Stories Flow Sequentially** — within an epic, each story builds on the previous one only

        ## Required Output

        1. **Epic List** — for each epic:
           - Title (user-value focused), User outcome (1 sentence)
           - FRs covered, NFRs addressed, Key ARs involved
           - Estimated story count (including hardening stories)
           - Preliminary sizing (total estimated points)
        2. **FR Coverage Map** — table mapping EVERY FR to an epic (100% coverage required)
        3. **NFR Coverage Map** — table mapping EVERY NFR to relevant epics
        4. **Dependency Flow** — the order epics should be built and why
        5. **Risk Assessment** — which epics have the most complexity or unknowns
        6. **Intent Block (per epic)** — Gabe Lens format, ~200 tokens each:
           - WHAT WE'RE DELIVERING: What does the user get when this epic ships? (not what we build — what they RECEIVE)
           - THE ANALOGY: Physical system mapping that captures the epic's value (survives architecture changes)
           - CONSTRAINT BOX: IS (what this delivers) / IS NOT (scope bound) / DECIDES (trade-off resolved)
           - ONE-LINE HANDLE: 5-10 words — the epic's compressed identity
           - DONE WHEN: 2-3 observable outcomes (user-visible, not implementation checkboxes)

        **IMPORTANT:** Consider that each user-facing story will likely need 1-2 hardening tasks
        built in, and complex stories may generate separate hardening stories. Factor this into
        your story count estimates (multiply naive count by ~1.3x).
    </task-call>
  </ecc-spawn>

  <action>Collect planner output as {{epic_design}}</action>
  <action>Extract {{epic_list}} — array of epics with titles, FRs, NFRs, ARs</action>
  <action>Extract {{fr_coverage_map}} — FR -> Epic mapping</action>
  <action>Extract {{epic_count}} — total number of epics</action>
  <action>Extract {{epic_intent_blocks}} — Intent Block per epic (Gabe Lens format)</action>

  <output>**Epic Design Complete**
    **Epics: {{epic_count}}** | **Intent Blocks:** {{epic_count}} epics with Gabe Lens intent
    {{epic_list_summary}}
    **FR Coverage:** {{fr_coverage_count}}/{{fr_count}} FRs mapped (must be 100%)
    **Dependency Flow:**
    {{dependency_flow}}</output>

  <!-- USER GATE: Approve epic structure -->
  <ask>Do you approve this epic structure? You can:
    - [A] Approve and proceed to story generation
    - [M] Modify — suggest changes to epic groupings
    - [R] Redesign — ask the Planner to try a different approach</ask>
</step>
