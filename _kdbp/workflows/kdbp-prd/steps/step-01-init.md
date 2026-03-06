# Step 01: Initialize + Continuation Detection

Set up the PRD workspace, discover input documents, and handle continuation.

<critical>Detect continuation FIRST — if prd.md exists with stepsCompleted
but is incomplete, resume from the last completed step. Do NOT re-initialize.</critical>

---

## Continuation Detection

<action>Check for existing document at `{planning_artifacts}/prd.md`.

  **If found with stepsCompleted (but NOT complete):**
  - Read complete file including frontmatter
  - Reload all inputDocuments listed in frontmatter
  - Determine next step from stepsCompleted array
  - Present welcome-back summary with progress
  - Jump to correct step file

  **If found and complete:** Offer validation or next workflows.
  **If not found → proceed with Fresh Setup below.**</action>

## Fresh Setup

### Input Document Discovery

<action>Discover context documents across:
  - `{planning_artifacts}/**`, `{output_folder}/**`, `{product_knowledge}/**`, `docs/**`

  Search for:
  - Product Brief (`*brief*.md`)
  - Research Documents (`*research*.md`)
  - Brainstorming output (`*brainstorm*.md`)
  - Project Context (`**/project-context.md`)

  For sharded content: check `*foo*/index.md` if `*foo*.md` not found.
  Load ALL confirmed files completely (no offset/limit).
  Track in frontmatter `inputDocuments` array.</action>

<ask>Report discovered documents with counts. Ask user to confirm or add more.
  Note brownfield (existing project docs) vs. greenfield status.</ask>

### Template Initialization

<action>Copy template from `{installed_path}/data/prd-template.md`
  to `{planning_artifacts}/prd.md`.
  Initialize frontmatter: stepsCompleted, inputDocuments, documentCounts.</action>

<ask>[C] Continue to Project Discovery</ask>

<action>Update stepsCompleted: [1]</action>
