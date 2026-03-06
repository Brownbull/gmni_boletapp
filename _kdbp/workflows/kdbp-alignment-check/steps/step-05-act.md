# Step 05: Act and Verify

Alignment Check Steps 5-6 — Act per classification, then verify.

<critical>V2 (Altitude Discipline): Alignment check results above Session altitude
are DRAFTS requiring human confirmation. Present findings, do not commit autonomously.</critical>

---

## Present findings to human

<output>**Alignment Check Report — {{check_altitude}} Altitude**

**Behavior:** {{behavior_name}} v{{version}}
**Scope:** {{scope_summary}}

### Value Alignment Summary
{{aligned_count}} ALIGNED | {{drifting_count}} DRIFTING | {{misaligned_count}} MISALIGNED

### Failures Requiring Action
{{for each failed_value}}
- **{{id}} "{{handle}}"** — {{rating}}
  Gap: {{gap_type}} → Evolution Type {{type}}
  Recommended action: {{recommendation}}
{{end}}

### Cross-Value Impact
{{cross_value_check}} — Does fixing one value break another?
</output>

## Human decision

<ask>Review the alignment check results. What action?
[E] **Evolve** — proceed to kdbp-evolve-behavior for each failure
[D] **Defer** — log findings, address in next evolution cycle
[A] **Accept** — acknowledge drift as intentional (document why)
[R] **Revise value** — the value itself needs changing (Type F — major version)
</ask>

## Verify (if Evolve selected)

<check if="Evolve selected">
  <action>After evolution completes, re-run value tests from Step 03:
    - For each previously DRIFTING/MISALIGNED value
    - Verify it now rates ALIGNED
    - Verify no previously ALIGNED values became DRIFTING
  </action>

  <check if="Verification passes">
    <output>**Alignment restored.** All tested values now ALIGNED.</output>
  </check>

  <check if="Verification fails">
    <output>**Verification failed.** Fix introduced new drift.
    Return to step-04-trace with updated results.</output>
  </check>
</check>

## Log result

<action>Add ledger entry:
  Date | Alignment-{{altitude}} | none | {{behavior_name}} | {{outcome}} | {{summary}}
</action>
