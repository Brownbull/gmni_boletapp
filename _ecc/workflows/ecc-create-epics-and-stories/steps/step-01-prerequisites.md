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

  <!-- FRAMEWORK UPGRADE ISOLATION GATE (A-new-1 / L2-002) -->
  <check if="epic title or description contains: upgrade, migrate, update _bmad, update _ecc, bump, framework, tooling">
    <output>**⚠️  FRAMEWORK UPGRADE DETECTED**

      Does this epic combine framework changes with feature work?
      Framework upgrades must be isolated epics — never combined with feature stories.

      BoletApp evidence: 2 combined upgrades produced 990 + 775 file blast events.
      Regressions became undetectable because framework changes masked feature changes.

      Confirm: Is this epic ONLY a framework upgrade (no feature stories)?</output>
    <ask>Framework-only epic? [Y] proceed / [N] explain why combined</ask>
  </check>

  <!-- EPIC ISOLATION CHECK (A5 / L2-005) -->
  <check if="sprint-status.yaml exists">
    <action>Read sprint-status.yaml. Find all epics with status=in-progress.</action>
    <check if="any in-progress epic overlaps the same feature area (same file prefix or label)">
      <output>**⚠️  EPIC COLLISION RISK**

        In-progress epic(s) may overlap this area.
        BoletApp evidence: 14c+14d+14e running simultaneously generated 200 commits
        in one month with unresolvable merge conflicts.

        Complete the in-progress epic first, or explicitly acknowledge the overlap.</output>
      <ask>In-progress epic complete, or is overlap intentional? Confirm before continuing.</ask>
    </check>
  </check>

  <!-- COMPRESSION TRIGGER (A2 / L2-002) -->
  <check if="sprint-status.yaml exists">
    <action>Count completed epics since the last epic containing a story with
      'consolidation', 'compression', 'refactor', or 'cleanup' in its title.</action>
    <check if="count >= 3">
      <output>**Compression trigger fired: {{count}} epics without consolidation.**

        Prepending Story 0 to this epic:
        "Consolidation: audit and merge duplicate patterns from recent epics"

        BoletApp evidence: Epic 15 consumed 15-20% of total project cost because
        no compression stories ran between Epics 1-14.</output>
      <action>Insert Story 0: "Consolidation: audit and merge duplicate patterns from recent epics" into this epic's story list.</action>
    </check>
  </check>

  <!-- SEMANTIC DRIFT CHECK (FF-B / Epic Level) -->
  <!-- Catches patterns the keyword gates miss. Especially L2-005 (epic rerun) and L2-008. -->
  <action>Assess this epic's design for L2 pattern resemblance:
    L2-001: Any epic proposing new distributed/sync infrastructure without a spike story?
    L2-002: Is this epic a pure cleanup blast without the compression trigger having fired?
    L2-005: Does this epic semantically duplicate a prior closed epic? (Mode 2: Prior Epic Rerun)
    L2-008: Does this epic propose aligning/standardizing something that has silently diverged?
    Rate each: NONE / MEDIUM / HIGH</action>

  <check if="any pattern rates HIGH AND corresponding gate has NOT already triggered above">
    <output>**⚠️ SEMANTIC DRIFT (FF-B, epic level): Resembles [L2-00X] [pattern name]**

      The keyword gate did not fire, but the epic-level semantic pattern is the same.
      Evidence: [specific similarity to this epic's scope]
      Gate to invoke: [corresponding ff_a_gate]</output>
    <ask>Acknowledge pattern risk before continuing? [Y] or explain why different? [N + reason]</ask>
  </check>

  <!-- USER GATE: Confirm requirements -->
  <ask>Do these extracted requirements accurately represent what needs to be built? Any additions or corrections?</ask>
</step>
