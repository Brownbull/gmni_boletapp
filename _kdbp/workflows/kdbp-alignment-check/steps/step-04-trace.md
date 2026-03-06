# Step 04: Trace Failures

Alignment Check Step 4 — For each DRIFTING or MISALIGNED value, classify the gap.

---

## Trace each failure

<action>For each value rated DRIFTING or MISALIGNED:

1. **Check linkage:** Does this value have linked skills and workflow steps in DEPENDENCY-MAP.md?
   - If NO → **Linkage Gap** (Type 3 orphan — value not implemented)
   - If YES → continue

2. **Check skills:** Are the linked skill reasons still correct?
   - If NO → **Skill Gap** (outdated or incorrect reasoning)
   - If YES → continue

3. **Check workflow:** Do the linked workflow steps execute correctly?
   - If NO → **Workflow Gap** (step broken or missing)
   - If YES → continue

4. **Check value:** Is the value itself still correct for this project?
   - If NO → **Value Gap** (value needs revision — rare, major version)
   - If YES → the gap is in execution, not structure
</action>

## Gap classification table

<output>**Failure Trace Results**

| Value | Rating | Gap Type | Detail |
|-------|--------|----------|--------|
{{for each failed_value}}
| {{id}} | {{rating}} | {{gap_type}} | {{detail}} |
{{end}}
</output>

## Map to evolution type

<action>Each gap type maps to an evolution classification:
  - Linkage Gap → Type C (fix linkage) or Type D (fill gap)
  - Skill Gap → Type B (fix skill) or Type E (world changed)
  - Workflow Gap → Type A (fix step)
  - Value Gap → Type F (alignment — human required)

Store as {{evolution_recommendations}}.
</action>
