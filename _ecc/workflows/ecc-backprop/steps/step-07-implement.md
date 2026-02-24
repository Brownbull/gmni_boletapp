# Step 07: Implement — Build Gates in _template/ [DOCK POINT]

Implement each approved action item one at a time. Multi-session work — use DOCK POINTS between items.

**DOCK POINT**: Safe to stop between any two action items. Resume by re-reading this step.

<step n="7" goal="Implement approved gates in _template/" tag="implement">

  <action>Read docs/03-act/01-prevention/04-action-items.md.
    Find all items with status=pending -> {{pending_items}}</action>

  <check if="{{pending_items}} is empty">
    <output>**All action items complete.** Proceeding to Step 8: Validate.</output>
  </check>

  <loop for="each item in {{pending_items}}">
    <action>Set {{current_item}} = current action item</action>

    <output>**Implementing: {{current_item.id}} — {{current_item.action}}**
      Layer: {{current_item.layer}} | File: {{current_item.file}}
      Pattern: {{current_item.pattern}}</output>

    <check if="{{current_item.layer}} == 'FF-A'">
      <action>Modify the appropriate hook or workflow step in _template/:
        Hooks: _template/hooks/ (pre-edit-guard.py, pre-write-guard.py, session-budget.py, etc.)
        Workflow gates: _template/_ecc/workflows/*/steps/step-01-prerequisites.md
                     or _template/_ecc/workflows/*/steps/step-02-classification.md
        Constraint: hook ≤200 lines; workflow step ≤200 lines.
        If hook exceeds 200 lines, extract a helper function — do NOT split into multiple hooks.</action>
    </check>

    <check if="{{current_item.layer}} == 'FF-B'">
      <action>Add semantic keywords/pattern to existing semantic drift check blocks in:
        _template/_ecc/workflows/ecc-create-epics-and-stories/steps/step-01-prerequisites.md
        _template/_ecc/workflows/ecc-create-story/steps/step-02-classification.md
        Embed inside existing check blocks — do NOT add new top-level <check> blocks per keyword.</action>
    </check>

    <check if="{{current_item.layer}} == 'FF-C'">
      <action>Modify _template/scripts/behavioral-health-snapshot.sh:
        Add new signal: C[N] — detect {{current_item.pattern}} via git metrics.
        Exit contract: 0=silent, 1=warn, 2=alert.
        Keep script ≤200 lines. Extract helper function if needed.</action>
    </check>

    <action>Mark {{current_item.id}} as status=complete in 04-action-items.md</action>

    <output>**{{current_item.id}} complete.**
      ---
      DOCK POINT: Safe to stop here. Resume at next pending item.</output>
  </loop>

  <output>**All items implemented.**
    Proceeding to Step 8: Validate.</output>

</step>
