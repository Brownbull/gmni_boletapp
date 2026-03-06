# Step 03: Run Value Tests

Alignment Check Step 3 — For each value at this altitude, ask its alignment tests.

---

## Filter values by altitude

<action>From {{values}} (full Value Blocks), filter to values whose
EVALUATION ALTITUDE matches or is below {{check_altitude}}:
  - Session values: always included
  - Story values: included for Story, Epic, Project checks
  - Epic values: included for Epic and Project checks
  - Project values: included only for Project checks

Store filtered set as {{testable_values}}.
</action>

## Run alignment tests

<action>For EACH value in {{testable_values}}:
  1. Read the value's ALIGNMENT TESTS (2-3 questions)
  2. Answer each question against the captured output
  3. Rate the value: **ALIGNED** | **DRIFTING** | **MISALIGNED**

Criteria:
  - ALIGNED: all alignment test questions answer YES
  - DRIFTING: at least one question is UNCERTAIN or PARTIALLY
  - MISALIGNED: at least one question answers NO
</action>

## Results table

<output>**Value Alignment Results**

| Value | Handle | Rating | Notes |
|-------|--------|--------|-------|
{{for each testable_value}}
| {{id}} | "{{handle}}" | {{rating}} | {{notes}} |
{{end}}

Summary: {{aligned_count}} ALIGNED | {{drifting_count}} DRIFTING | {{misaligned_count}} MISALIGNED
</output>

<check if="All values ALIGNED">
  <output>**All values aligned at {{check_altitude}} altitude.**
  No evolution needed. Log clean check in ledger.</output>
</check>

<check if="Any value DRIFTING or MISALIGNED">
  <output>**Alignment failures detected.** Proceeding to failure tracing.</output>
</check>
