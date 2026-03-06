# Step 02: Locate in Workflow

Causation Analysis Step 2 — Which workflow step(s) produced or missed the symptom?

---

## Trace through linkage map

<action>Read {{linkage_map}} from DEPENDENCY-MAP.md.
  For each workflow step related to the symptom:
  1. Mark the step(s) where the failure is visible
  2. Note the skill reason(s) that justify each marked step
  3. Note the value ground(s) for each skill reason
</action>

## Build the failure chain

<output>**Failure Chain:**
```
SYMPTOM: {{symptom_summary}}
  ↓
WORKFLOW STEP(S): {{step_ids}} in {{workflow_file}}
  ↓
SKILL REASON(S): {{skill_refs}} (file §ref)
  ↓
VALUE GROUND(S): {{value_ids}}: {{value_handles}}
```
</output>

<check if="No workflow step can be linked to the symptom">
  <output>**Gap detected:** Symptom has no matching workflow step.
  This is likely a Type D (Gap) or Type F (Alignment) root cause.
  Proceeding to classification.</output>
</check>
