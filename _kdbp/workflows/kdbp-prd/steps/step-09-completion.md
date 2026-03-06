# Step 09: Polish, Completion & Session Ledger [GL]

Polish the document, announce completion, and record the session.

<critical>Three tasks:
1. Load and optimize the full document for flow and coherence
2. Announce completion with next-step guidance
3. If {{dbp_active}}: draft [GL] ledger entry for user confirmation</critical>

---

## Document Polish

<action>Load the complete prd.md and optimize:

  **Flow Check:**
  - Does the executive summary accurately reflect the full document?
  - Are section transitions smooth?
  - Is there redundant content that can be consolidated?
  - Are cross-references between sections consistent?

  **Coherence Check:**
  - Do success criteria align with functional requirements?
  - Do user journeys map to capability areas?
  - Does scoping match the FR coverage?
  - Are NFRs consistent with the stated constraints?

  **Header/Structure Check:**
  - Consistent heading levels
  - No orphaned sections
  - Proper numbering sequences (FR#, NFR#)

  Apply fixes and present changes for confirmation.</action>

<ask>Accept polish changes? (y/n)</ask>

## Completion

<action>Announce completion with achievement summary:
  - List all sections created
  - Highlight capability contract (FRs) completeness
  - Note document is ready for downstream work

  **Suggest next workflows:**
  - UX Design (run kdbp-ux-design)
  - Architecture (run kdbp-architect)
  - Epic Creation (run kdbp-create-epics)

  Update stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9]</action>

## Session Ledger [GL]

<check if="{{dbp_active}}">
  <action>Draft a ledger entry for this PRD session:

    | Date | Workflow | Values | Observation | Signal |
    |------|----------|--------|-------------|--------|
    | {{date}} | kdbp-prd | {{behavior_value_handles}} | [what happened] | [carry-forward] |

    **Observation:** Summarize key product decisions and how they connect
    to the behavior values (if relevant).
    **Signal:** Note any carry-forward signals for future sessions
    (e.g., scope risks, unresolved trade-offs, deferred decisions).</action>

  <ask>Confirm or edit the ledger entry before writing to
    `{behaviors_path}/trajectory/ledger.md`.</ask>
</check>
