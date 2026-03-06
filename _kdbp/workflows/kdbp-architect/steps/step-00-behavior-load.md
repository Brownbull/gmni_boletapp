# Step 00: Behavior Load [LB]

Load active behavior values into hot tier for session orientation.

<critical>GRACEFUL DEGRADATION: If behaviors/ directory does not exist or REGISTRY.md
is empty, WARN and continue. All behavior checks in later steps become no-ops.</critical>

---

## Check for behaviors

<action>Read {project-root}/_kdbp/behaviors/REGISTRY.md</action>

<check if="REGISTRY.md does not exist or has no entries">
  <action>Set {{dbp_active}} = false</action>
  <output>**[LB] No behaviors registered.** Continuing without behavioral tracking.
  To set up behaviors, run `/khujta-dbp` and select [TI] Initialize Trajectory
  or [CB] Create Behavior.</output>
</check>

<check if="REGISTRY.md has one or more entries">

## Load active behavior(s)

<action>For each behavior listed in REGISTRY.md:
  1. Read `behaviors/{path}/BEHAVIOR.md`
  2. Extract Value Manifest table (ID | Handle | Altitude)
  3. Store handles as {{behavior_value_handles}} — one-liner per value
</action>

<action>Read last 3 entries from `behaviors/trajectory/ledger.md`
  Store as {{recent_ledger}} — handles only, not full entries.
  If ledger is empty: {{recent_ledger}} = "No entries yet"</action>

<action>Check `behaviors/trajectory/stories/active/` for active story files.
  If any exist: list as {{active_behavior_stories}}
  If none: {{active_behavior_stories}} = null</action>

<action>Set {{dbp_active}} = true</action>

<output>**[LB] Behavior Loaded**
  Active: {{behavior_names}} v{{version}} ({{maturity}})
  Values: {{value_count}} cached | Recent signals: {{recent_signals_summary}}
  Value handles cached for ledger recording and checkpoint reference.</output>

</check>

---

## Carry-forward context

<check if="{{recent_ledger}} contains drift signals (⚑ prefix)">
  <output>**Carry-forward from previous sessions:**
  {{drift_signals_list}}
  Keep these in mind during development.</output>
</check>
