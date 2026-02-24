# Step 06: Actions — Build & Approve Implementation Queue

Build the action item list, prioritize by impact/effort, then get human approval before any implementation.

<step n="6" goal="Prioritize action items — human approval gate" tag="actions">

  <action>For each gap in {{critical_gaps}} and {{partial_gaps}}, generate one action item:
    ID: FF-[layer]-[number]  (e.g., FF-A-03, FF-B-01, FF-C-02)
    Pattern: L2-00X
    Gap: [what coverage is missing]
    Action: [one concrete implementation step]
    Layer: FF-A | FF-B | FF-C
    Effort: Low=<1hr | Med=1-3hr | High=>3hr
    File: [exact _template/ path to modify]</action>

  <action>Sort by: CRITICAL gaps first, then by Effort ascending (low-effort CRITICAL wins first)</action>

  <action>Write docs/03-act/01-prevention/04-action-items.md with the full sorted list.
    Mark each item as: pending | in-progress | complete</action>

  <output>**Action Item Queue**

    {{action_items | formatted_list}}

    **Total items:** {{total_action_count}}
    **Critical gap items:** {{critical_count}}
    **Estimated total effort:** {{total_effort}}

    ---
    **Gabe Decision Block — Scope Gate**

    > This is the "lighten the ship" moment.
    > Each action item = cargo. Some is essential, some is ballast.
    > Rule: implement ONLY items that directly correspond to HIGH-confidence L2 patterns.
    > Low-confidence patterns with Low-effort items: OK if <30 min total.
    > Do NOT add "nice to have" gates — every extra gate = maintenance overhead.
    > Solo developer rule: if total effort >1 day, cut the lowest-confidence items.

    ---</output>

  <ask>Review the action item queue.
    Approve, remove, or reorder items.
    Mark any item OUT-OF-SCOPE to skip it.
    Reply: [Approved] or [list items to remove/reorder]</ask>

  <action>Update 04-action-items.md to reflect the approved queue.
    Mark approved items as "pending" (ready for implementation).</action>

  <output>**Approved queue saved.**
    {{approved_count}} items ready for implementation.
    Proceeding to Step 7: Implement.</output>

</step>
