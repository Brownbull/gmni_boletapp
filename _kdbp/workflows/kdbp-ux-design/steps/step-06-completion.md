# Step 06: UX Design Completion + Session Ledger [GL]

Validate the specification and record the session.

<critical>Two tasks:
1. Validate the complete UX design specification for coherence
2. If {{dbp_active}}: draft [GL] ledger entry for user confirmation</critical>

---

## Specification Validation

<action>Load and review the complete ux-design-specification.md.

  **Coherence Check:**
  - Does the executive summary align with detailed sections?
  - Do experience principles thread through all design decisions?
  - Are emotional goals reflected in visual foundation and patterns?
  - Do component specs match the user journey requirements?
  - Is the responsive strategy consistent with platform decisions?

  **Coverage Check:**
  - [ ] Executive Summary (vision, users, challenges, opportunities)
  - [ ] Core User Experience (defining experience, platform, principles)
  - [ ] Emotional Response (goals, journey, micro-emotions)
  - [ ] UX Patterns & Inspiration
  - [ ] Design System Foundation
  - [ ] Visual Foundation (colors, typography, spacing)
  - [ ] Design Directions (chosen direction, rationale)
  - [ ] User Journey Flows (Mermaid diagrams)
  - [ ] Component Strategy (gap analysis, custom components)
  - [ ] UX Consistency Patterns
  - [ ] Responsive Design & Accessibility

  Flag gaps or inconsistencies for user review.</action>

## Completion

<action>Announce completion with checklist of what was accomplished.
  Update frontmatter: `stepsCompleted: [1, 2, 3, 4, 5, 6]`

  **Suggest next steps:**
  - Wireframing / Prototyping
  - Architecture (run kdbp-architect)
  - Epic Creation (run kdbp-create-epics)
  - Figma Design (manual)</action>

## Session Ledger [GL]

<check if="{{dbp_active}}">
  <action>Draft a ledger entry for this UX design session:

    | Date | Workflow | Values | Observation | Signal |
    |------|----------|--------|-------------|--------|
    | {{date}} | kdbp-ux-design | {{behavior_value_handles}} | [what happened] | [carry-forward] |

    **Observation:** Summarize key UX decisions made and how they connect
    to the behavior values (if relevant).
    **Signal:** Note any carry-forward signals for future sessions.</action>

  <ask>Confirm or edit the ledger entry before writing to
    `{behaviors_path}/trajectory/ledger.md`.</ask>
</check>
