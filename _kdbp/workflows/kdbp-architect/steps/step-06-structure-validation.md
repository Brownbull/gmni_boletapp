# Step 06: Project Structure, Boundaries & Validation

Define complete project structure, validate architecture coherence and completeness.

<critical>This step combines BMAD Steps 06 (structure) and 07 (validation).
Structure must be complete enough for AI agents to create correct file paths.
Validation must catch conflicts before implementation begins.</critical>

---

## Project Structure

<action>Define complete directory structure:
  - Root configuration files
  - Source code organization (feature-based or layer-based)
  - Test organization (co-located or separate)
  - Build and distribution
  - Documentation

  Map requirements to structure:
  - Epic/Feature → specific directories/files
  - Cross-cutting concerns → shared locations
  - Integration points → boundary files
</action>

<action>Define architectural boundaries:
  - API boundaries (what calls what)
  - Component boundaries (shared vs feature-specific)
  - Data boundaries (which modules own which data)
  - Service boundaries (if microservices)</action>

<output>**Complete Project Structure:**
  {{directory_tree}}

  **Boundaries:**
  {{boundaries_summary}}</output>

<ask>Does this structure work?
  [A] Advanced Elicitation | [P] Party Mode | [C] Continue to validation</ask>

---

## Architecture Validation

<action>Run validation checks:

  **1. Coherence Validation:**
  - Decision compatibility (do decisions contradict?)
  - Pattern consistency (do patterns align with decisions?)
  - Structure alignment (does structure support patterns?)

  **2. Requirements Coverage:**
  - FR coverage: each FR has a home in the structure
  - NFR coverage: each NFR has a pattern/decision addressing it
  - Cross-cutting coverage: shared concerns have explicit patterns

  **3. Implementation Readiness:**
  - Decision completeness: no critical decisions missing
  - Structure completeness: all known files have paths
  - Pattern completeness: no obvious conflict points unaddressed
</action>

<action>Gap analysis:
  - **Critical gaps** (block implementation) — must resolve now
  - **Important gaps** (shape architecture) — should resolve
  - **Deferrable gaps** (post-MVP) — note for later</action>

<check if="critical gaps found">
  <output>**Critical Gaps Found:**
    {{critical_gaps}}
    These must be resolved before proceeding.</output>
  <ask>Address gaps now or defer specific items?</ask>
</check>

<output>**Validation Results:**
  Coherence: {{coherence_status}}
  Requirements: {{coverage_status}}
  Readiness: {{readiness_status}}
  Gaps: {{gap_count}} ({{critical_count}} critical)</output>

<action>Append "## Project Structure & Boundaries" and "## Validation Results" sections.
  Update stepsCompleted: [1, 2, 3, 4, 5, 6]</action>
