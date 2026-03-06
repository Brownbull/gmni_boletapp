# Step 00: Pre-flight Check

Detect existing artifacts before creating anything. Prevent conflicts with existing setups.

<critical>DO NOT create any files in this step. Read-only scan.</critical>

---

## Check for existing behavior system

<action>Check if `{project-root}/_kdbp/behaviors/` directory exists</action>
<action>Check if `{project-root}/_kdbp/behaviors/REGISTRY.md` exists and has entries</action>

<check if="behaviors/ exists with populated REGISTRY.md">
  <output>**Existing behavior system detected.**
  Registry: `behaviors/REGISTRY.md`
  Behaviors found: {{existing_behavior_list}}

  This project already has a behavior system. Running kdbp-init will create a NEW behavior
  alongside existing ones (multi-behavior is supported per PROTOCOL-v2 §9).

  If you want to modify an existing behavior instead, use `/khujta-dbp` → [EB] Evolve.</output>

  <ask>
  **[A] Add** a new behavior alongside existing ones
  **[M] Migrate** — absorb existing behavior into a fresh init (destructive — backs up first)
  **[X] Exit** — stop init, use /khujta-dbp instead
  </ask>

  <check if="user chose [M] Migrate">
    <action>Create backup: copy `behaviors/` to `behaviors/_backup-{{date}}/`</action>
    <output>Backup created at `behaviors/_backup-{{date}}/`. Proceeding with fresh init.</output>
  </check>
  <check if="user chose [X] Exit">
    <action>HALT workflow</action>
  </check>
</check>

## Check for proto-DBP artifacts [AR-3]

<action>Scan for proto-DBP files that might contain early behavioral thinking:
  - `{project-root}/docs/values.md` or similar
  - `{project-root}/CLAUDE.md` sections about "values", "principles", "philosophy"
  - `{project-root}/docs/dbp/` or `{project-root}/docs/behavior/`  <!-- scanning for pre-existing user artifacts, not engine files -->
  - Any file matching `*value*`, `*principle*`, `*philosophy*` in docs/
</action>

<check if="proto-DBP artifacts found">
  <action>Store found paths as {{proto_artifacts}}</action>
  <output>**Proto-DBP artifacts detected:**
  {{proto_artifacts_list}}

  These will be reviewed in Step 02 (Human Context) as input to value discovery.
  Nothing is deleted — they become evidence for or against proposed values.</output>
</check>

## Check for framework coexistence

<action>Check for:
  - `{project-root}/_ecc/` directory
  - `{project-root}/_bmad/` directory
  - `{project-root}/.claude/settings.json` with hook configuration
</action>

<check if="_ecc/ or _bmad/ exists">
  <action>Store as {{existing_frameworks}}</action>
  <output>**Existing framework detected:** {{existing_frameworks}}
  KDBP coexists with ECC/_bmad. Commands use separate namespaces (kdbp-* vs ecc-*).
  Hook wiring will be checked in Step 08.</output>
</check>

## Check config.yaml

<action>Read `{project-root}/_kdbp/core/config.yaml`</action>

<check if="config.yaml has template placeholders ({{project_name}} etc.)">
  <action>Store {{config_needs_population}} = true</action>
  <output>Config needs populating. Will be filled in Step 08.</output>
</check>

---

## Pre-flight summary

<output>**Pre-flight complete.**
  - Existing behaviors: {{existing_behavior_count}} ({{behavior_action}})
  - Proto-DBP artifacts: {{proto_artifact_count}} found
  - Coexisting frameworks: {{existing_frameworks_summary}}
  - Config status: {{config_status}}

  Proceeding to project scan.</output>
