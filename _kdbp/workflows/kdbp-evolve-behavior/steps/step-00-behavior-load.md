# Step 00: Behavior Load [LB]

Load active behavior values into hot tier for evolution session.

<critical>This workflow modifies behavior files directly. It requires a behavior to be
loaded and active. If no behavior is registered, STOP — evolution cannot run.</critical>

---

## Check for behaviors

<action>Read {project-root}/_kdbp/behaviors/REGISTRY.md</action>

<check if="REGISTRY.md does not exist or has no entries">
  <output>**[LB] BLOCKED — No behaviors registered.**
  Evolution requires an active behavior. Run `/khujta-dbp` → [CB] Create Behavior first.</output>
  <stop/>
</check>

<check if="REGISTRY.md has one or more entries">

## Load target behavior

<action>For each behavior listed in REGISTRY.md:
  1. Read `behaviors/{path}/BEHAVIOR.md` — extract version, maturity, last_evolution
  2. Read `behaviors/{path}/values/VALUES.md` — full Value Blocks (cold tier needed for evolution)
  3. Read `behaviors/{path}/DEPENDENCY-MAP.md` — linkage table
  4. Store as {{behavior}}, {{values}}, {{linkage_map}}
</action>

<action>Read last 5 entries from `behaviors/trajectory/ledger.md`
  Store as {{recent_ledger}}</action>

<action>Set {{dbp_active}} = true</action>

<output>**[LB] Behavior Loaded for Evolution**
  Target: {{behavior_name}} v{{version}} ({{maturity}})
  Values: {{value_count}} loaded (cold tier — full blocks)
  Linkage: {{step_count}} steps mapped
  Last evolution: {{last_evolution}}</output>

</check>
