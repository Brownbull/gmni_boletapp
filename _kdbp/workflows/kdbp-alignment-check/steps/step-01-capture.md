# Step 01: Capture Output

Alignment Check Step 1 — What did the behavior produce?

---

## Identify the output to evaluate

<ask>What is the scope of this alignment check?
[S] **Story** — evaluate outputs from a specific story
[E] **Epic** — evaluate outputs across a completed epic
[P] **Project** — full project-level alignment review
</ask>

Store as {{check_altitude}}.

## Gather outputs

<action>Based on altitude:

**Story:** Read the story file from `behaviors/trajectory/stories/`.
  List all artifacts produced (code, docs, configs, tests).
  Note the story's Intent Block handle.

**Epic:** Read all completed stories under the epic.
  Summarize the aggregate output — what was shipped?
  Note the epic's Intent Block handle.

**Project:** Read PROJECT.md Intent Block.
  List all active behaviors and their current maturity.
  Summarize what the project has produced to date.
</action>

<output>**Output Captured**
  Altitude: {{check_altitude}}
  Scope: {{scope_summary}}
  Artifacts: {{artifact_count}} items
  Intent handle: "{{intent_handle}}"
</output>
