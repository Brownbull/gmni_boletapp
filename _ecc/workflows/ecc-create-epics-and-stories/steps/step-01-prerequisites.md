# Step 01: Prerequisite Validation & Requirements Extraction

Extract requirements as structured lists (FRs, NFRs, ARs, UX) — NOT full prose.

<step n="1" goal="Validate planning artifacts and extract all requirements" tag="prerequisites">

  <action>Search {epics_dir} for PRD: *prd*.md or *prd*/index.md -> {{prd_path}}</action>
  <action>Search {epics_dir} for Architecture: *architecture*.md or *architecture*/index.md -> {{architecture_path}}</action>
  <action>Search {epics_dir} for UX Design: *ux*.md, *ux*.html, *ux-design*.md -> {{ux_path}} (optional)</action>

  <check if="PRD not found">
    <output>**ERROR: PRD document not found in {epics_dir}**
      The PRD is required for epic/story creation.
      Run `/bmad-bmm-create-prd` first, or provide the PRD path.</output>
    <ask>Provide PRD path or create one first?</ask>
  </check>

  <check if="Architecture not found">
    <output>**ERROR: Architecture document not found in {epics_dir}**
      The Architecture document is required for epic/story creation.
      Run `/bmad-bmm-create-architecture` first, or provide the path.</output>
    <ask>Provide Architecture path or create one first?</ask>
  </check>

  <action>Read {{prd_path}} and extract:
    - All Functional Requirements (FR1, FR2, ...) -> {{functional_requirements}}
    - All NonFunctional Requirements (NFR1, NFR2, ...) -> {{nonfunctional_requirements}}
    - Count: {{fr_count}} FRs, {{nfr_count}} NFRs</action>

  <action>Read {{architecture_path}} and extract:
    - All Additional Requirements (AR1, AR2, ...) -> {{architectural_requirements}}
    - Technology stack decisions -> {{tech_stack}}
    - Key architectural patterns -> {{arch_patterns}}
    - Count: {{ar_count}} ARs</action>

  <check if="UX design found">
    <action>Read {{ux_path}} and extract:
      - All UX Requirements (UX1, UX2, ...) -> {{ux_requirements}}
      - Count: {{ux_count}} UX requirements</action>
  </check>

  <check if="UX design NOT found">
    <action>Set {{ux_requirements}} = "No UX design document provided"</action>
    <action>Set {{ux_count}} = 0</action>
  </check>

  <output>**Requirements Extracted**

    **Source Documents:**
    - PRD: {{prd_path}}
    - Architecture: {{architecture_path}}
    - UX Design: {{ux_path}} (or "not provided")

    **Requirements Summary:**
    - Functional Requirements: {{fr_count}} FRs
    - NonFunctional Requirements: {{nfr_count}} NFRs
    - Architectural Requirements: {{ar_count}} ARs
    - UX Requirements: {{ux_count}} UX

    **Functional Requirements:**
    {{functional_requirements}}

    **NonFunctional Requirements:**
    {{nonfunctional_requirements}}

    **Architectural Requirements (key):**
    {{architectural_requirements_summary}}
  </output>

  <!-- USER GATE: Confirm requirements -->
  <ask>Do these extracted requirements accurately represent what needs to be built? Any additions or corrections?</ask>
</step>
