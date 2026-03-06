# Step 00: Behavior Check

Set `{{dbp_active}}` flag for downstream ledger recording. Lightweight — no cold-tier loads.

---

<action>Check if {project-root}/_kdbp/behaviors/REGISTRY.md exists and has entries</action>

<check if="REGISTRY.md does not exist or has no entries">
  <action>Set {{dbp_active}} = false</action>
  <output>**No behaviors registered.** Proceeding without behavioral tracking.</output>
</check>

<check if="REGISTRY.md has one or more entries">
  <action>Set {{dbp_active}} = true</action>
  <action>Store behavior name(s) as {{behavior_names}} from REGISTRY.md</action>
  <output>**Behaviors active:** {{behavior_names}}. Ledger recording enabled.</output>
</check>
