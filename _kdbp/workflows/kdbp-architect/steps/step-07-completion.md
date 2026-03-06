# Step 07: Architecture Completion + Ledger [GL]

Complete architecture document and record DBP session ledger.

---

## Architecture Completion

<output>**Architecture Document Complete!**

  Document: {output_folder}/architecture.md

  **Sections:**
  1. Project Context Analysis
  2. Starter Template Evaluation
  3. Core Architectural Decisions
  4. Implementation Patterns & Consistency Rules
  5. Project Structure & Boundaries
  6. Validation Results

  This document is the single source of truth for AI agent implementation.
  Every developer and AI agent should read it before writing code.</output>

<action>Update frontmatter:
  stepsCompleted: [1, 2, 3, 4, 5, 6, 7]
  lastStep: 7
  status: 'complete'
  completedAt: '{{date}}'
</action>

<output>**Next Steps:**
  - Run `/kdbp-create-epics` to break the architecture into implementation epics
  - Run `/kdbp-prd` if PRD needs updating based on architecture decisions
  - Share architecture document with team for review</output>

---

## DBP: Session Ledger [GL]

<critical>GATED ON {{dbp_active}}. If false, ledger section is a no-op.</critical>

<check if="{{dbp_active}} == false">
  <output>**[GL] Skipped** — No behaviors registered.</output>
</check>

<check if="{{dbp_active}} == true">
  <action>Draft ledger entry for architecture session:
    | Date | Story | PM-Ref | Behavior | Outcome | Signals |
    | {{date}} | architecture | architect | {{behavior_names}} | ✓ done | {{arch_drift_signals}} |
  </action>

  <output>**[GL] Ledger Entry Draft:**
    | {{date}} | architecture | architect | {{behavior_names}} | ✓ done | {{signals}} |
  </output>

  <ask>[Y] Write to ledger | [E] Edit first | [S] Skip</ask>

  <check if="user approves (Y)">
    <action>Append row to behaviors/trajectory/ledger.md</action>
  </check>

  <!-- Carry-forward: note architectural decisions with behavioral relevance -->
  <check if="architectural decisions relate to behavior values">
    <output>**Behavioral Relevance Note:**
      Architecture decisions at {{relevant_decision_areas}} relate to values: {{relevant_values}}.
      Noted for ledger recording and checkpoint reference.</output>
  </check>
</check>
