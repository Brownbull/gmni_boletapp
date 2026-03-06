# Step 01: Initialize + Project Understanding

Set up the UX design workspace and establish project context.

<critical>Detect continuation FIRST — if ux-design-specification.md exists with
stepsCompleted, resume from last completed step. Do NOT re-initialize.</critical>

---

## Continuation Detection

<action>Check for existing document at `{planning_artifacts}/*ux-design-specification*.md`.

  **If found with stepsCompleted frontmatter:**
  - Read complete document + frontmatter
  - Determine next step from stepsCompleted array
  - Present welcome-back summary with progress
  - Jump to correct step file

  **If not found → proceed with Fresh Setup below.**</action>

## Fresh Setup

### Input Document Discovery

<action>Discover context documents across:
  - `{planning_artifacts}/**`, `{output_folder}/**`, `{product_knowledge}/**`, `docs/**`

  Search for:
  - Product Brief (`*brief*.md`)
  - PRD (`*prd*.md`)
  - Project Documentation (multiple possible)
  - Project Context (`**/project-context.md`)

  For sharded content: if `*foo*.md` not found, check `*foo*/index.md`.
  Load ALL confirmed files completely (no offset/limit).</action>

<ask>Report discovered documents and ask user to confirm or add more.</ask>

### Template Initialization

<action>Copy template from `{installed_path}/data/ux-design-template.md`
  to `{planning_artifacts}/ux-design-specification.md`.
  Initialize frontmatter: `stepsCompleted: []`, `inputDocuments: [...]`</action>

## Project Understanding

<action>Analyze loaded documents and present understanding:

  **From documents:** Key insights summary
  **Target Users:** User descriptions
  **Key Features/Goals:** Main goals

  If gaps exist, ask the essential questions:
  1. What are you building? (1-2 sentences)
  2. Who is this for? (target audience)
  3. What makes this special? (unique value)
  4. What's the main user action? (core use case)

  Explore deeper:
  - What problem are users solving?
  - What frustrates them with current solutions?
  - How tech-savvy are they? What devices?

  Identify 2-3 UX design challenges and 2-3 design opportunities.</action>

<ask>
  [A] Advanced Elicitation (deeper discovery)
  [P] Party Mode (multiple perspectives)
  [C] Continue to core experience</ask>

<action>Append "## Executive Summary" section with:
  Project Vision, Target Users, Key Design Challenges, Design Opportunities.
  Update stepsCompleted: [1]</action>
