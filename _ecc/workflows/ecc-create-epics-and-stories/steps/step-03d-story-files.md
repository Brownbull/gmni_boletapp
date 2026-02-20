# Step 03d: Story File Generation

Generate full story files with File Specs and Architectural ACs using parallel Architect spawns.
Story files use the SAME format as ecc-create-story output for compatibility with ecc-dev-story and ecc-code-review.

<step n="3d" goal="Generate full story files with File Specs and Architectural ACs" tag="story-files">

  <action>Split {{consolidated_story_list}} into batches of up to 3 stories</action>

  <loop for="each batch in story batches">
    <parallel-execution-rule>
      For each story in the batch, spawn an Architect agent in a SINGLE message.
      All stories in the batch are independent and can be generated in parallel.
    </parallel-execution-rule>

    <ecc-parallel-spawn>
      <task-call for="each story in batch">
        subagent_type: "everything-claude-code:architect"
        model: "opus"
        description: "Generate story file for {{story.key}}"
        prompt: |
          ## Story File Generation

          **Story:** {{story.key}} — {{story.title}}
          **User Story:** {{story.user_story}}
          **Acceptance Criteria:** {{story.acceptance_criteria}}
          **Tasks (from planner + hardening):** {{story.tasks}}
          **Hardening Notes:** {{story.hardening_notes}}
          **Security Notes:** {{story.security_notes}}
          **Project Architecture Patterns:** {{project_patterns}}
          **Tech Stack:** {{tech_stack}}

          ---

          ## Phase 1: Architecture Discovery
          Load architecture context — do NOT ask the user:
          1. Reference the architecture document patterns
          2. Scan existing codebase for conventions (file structure, naming, imports)
          3. If no existing code, infer from architecture doc
          **Foundation check:** If first story for new feature module, include directory scaffolding.

          ## Phase 2: File Specification (MANDATORY)
          Specify EXACT file paths for every new/modified file:
          | File/Component | EXACT Path | Pattern Reference | Status |
          |----------------|------------|-------------------|--------|

          ## Phase 3: Architectural Acceptance Criteria (MANDATORY)
          - AC-ARCH-LOC-{n}: {Component} located at {exact_path}
          - AC-ARCH-PATTERN-{n}: Follows {pattern_name} for {aspect}
          - AC-ARCH-NO-{n}: {anti-pattern} must NOT occur

          ## Phase 4: Task/Subtask Refinement
          Refine task breakdown: ensure each task has subtasks, include TDD subtasks,
          include hardening subtasks where flagged, verify sizing limits.

          ## Phase 5: Dev Notes
          Architecture patterns, technical pitfalls, hardening rationale, E2E recommendations.

          **Output:** Complete story file in markdown matching ecc-create-story template
      </task-call>
    </ecc-parallel-spawn>

    <action>For each completed story file:
      1. Write to {story_dir}/{{story.key}}.md
      2. Append summary to {{epics_file}}</action>
  </loop>

  <output>**Story Files Generated for Epic {{current_epic.number}}**
    {{generated_story_files_list}}</output>
</step>
