# Step 01: Project Scan

Read project artifacts to understand what is being built, for whom, and why.

<critical>READ ONLY — do not modify any project files. Gather context for Steps 02-04.</critical>

---

## Scan project files

<action>Read the following files (skip any that don't exist):
  1. `{project-root}/README.md` — project description
  2. `{project-root}/package.json` or equivalent — name, description, dependencies
  3. `{project-root}/CLAUDE.md` — developer instructions and conventions
  4. `{project-root}/docs/` — scan directory listing for planning artifacts (PRD, architecture, etc.)
  5. `{project-root}/src/` or equivalent — top-level directory listing only (structure, not code)
</action>

## Extract project signals

<action>From scanned files, extract and store:
  - {{project_name}} — name of the project
  - {{project_description}} — 1-2 sentence description
  - {{tech_stack}} — languages, frameworks, key dependencies
  - {{target_users}} — who uses this (if mentioned in README/PRD)
  - {{project_stage}} — early/mid/mature (infer from commit count, file count, docs presence)
  - {{planning_artifacts}} — list of any PRD, architecture, epics, stories found in docs/
</action>

## Scan for human signals in existing docs

<action>If planning artifacts exist (PRD, architecture docs), scan them for:
  - User persona descriptions
  - Problem statements ("the user needs...", "the pain point is...")
  - Success criteria that mention people, not metrics
  - Any "why" statements about the project's purpose
  Store as {{human_signals_from_docs}}</action>

<check if="{{proto_artifacts}} from Step 00 is not empty">
  <action>Read each proto-DBP artifact found in pre-flight.
  Extract any value-like statements, principles, or philosophical positions.
  Store as {{proto_value_signals}}</action>
</check>

---

## Project scan summary

<output>**Project Scan Complete**

  **{{project_name}}** — {{project_description}}
  Stack: {{tech_stack}}
  Stage: {{project_stage}}
  Target users: {{target_users}}

  Planning artifacts: {{planning_artifacts_summary}}
  Human signals found: {{human_signals_count}}
  Proto-value signals: {{proto_value_count}}

  This gives us the technical landscape. Next: understanding the HUMAN context.</output>
