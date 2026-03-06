# Step 08: Wire + Verify

Populate config.yaml, check hook wiring, and dry-run step-00 to verify the behavior system loads.

<critical>This is the final step. After this, /kdbp-dev-story and other workflows will detect
and load the new behavior through their step-00-behavior-load.</critical>

---

## Populate config.yaml

<check if="{{config_needs_population}} == true">
  <action>Read `{project-root}/_kdbp/core/config.yaml`</action>

  <ask>Let me populate the KDBP config. Please confirm or edit:
  - **Project name:** {{project_name}}
  - **Your name:** {{user_name_from_context}}
  - **Skill level:** beginner | intermediate | advanced
  - **Language:** English (or your preference)
  </ask>

  <action>Update `{project-root}/_kdbp/core/config.yaml` with confirmed values.
  Replace template placeholders with actual values.</action>
</check>

<check if="{{config_needs_population}} == false">
  <output>Config already populated. Skipping.</output>
</check>

## Check hook wiring [AR-12]

<action>Read `{project-root}/.claude/settings.json` if it exists.
If it exists, check whether hook commands reference `_kdbp/hooks/` paths.</action>

<!-- Case 1: Already wired to KDBP -->
<check if="settings.json exists AND hooks reference _kdbp/hooks/">
  <output>**KDBP hooks already active.** Hook wiring: SKIPPED (already configured).</output>
  <action>Set {{hook_status}} = "already-wired" and {{restart_needed}} = false</action>
</check>

<!-- Case 2: Old hooks exist (ECC, BMAD, or other non-KDBP paths) -->
<check if="settings.json exists AND hooks do NOT reference _kdbp/hooks/">
  <action>Set {{old_settings_path}} = `{project-root}/.claude/settings.pre-kdbp.{{date}}.json`</action>

  <output>**Existing hooks detected** — but they point to non-KDBP paths.
  Current hook paths reference: {{existing_hook_paths_summary}}

  KDBP needs its own hooks wired. The existing settings.json will be backed up.</output>

  <ask>
  **[M] Migrate** — backup current settings.json, write KDBP hooks
  **[S] Skip** — keep existing hooks (KDBP workflows will run but hooks won't enforce KDBP rules)
  </ask>

  <check if="user chose [M] Migrate">
    <action>
    1. Copy `{project-root}/.claude/settings.json` → `{{old_settings_path}}`
    2. Read KDBP template settings from `{project-root}/_kdbp/.claude/settings.json`
    3. Preserve any non-hook fields from the old settings.json (permissions, enableAllProjectMcpServers, etc.)
    4. Merge: keep old non-hook config + replace hooks section with KDBP hooks
    5. Write merged result to `{project-root}/.claude/settings.json`
    </action>

    <output>**Settings migrated.**
    - Backup: `{{old_settings_path}}`
    - New hooks: 11 KDBP Tier 1 gates wired
    - Non-hook settings preserved from original

    To restore old hooks: `cp {{old_settings_path}} {project-root}/.claude/settings.json`</output>

    <action>Set {{hook_status}} = "migrated" and {{restart_needed}} = true</action>
  </check>

  <check if="user chose [S] Skip">
    <action>Set {{hook_status}} = "skipped-kept-old" and {{restart_needed}} = false</action>
  </check>
</check>

<!-- Case 3: No settings.json at all -->
<check if="settings.json does not exist">
  <output>**No hooks configured.** KDBP includes 11 Tier 1 enforcement hooks that protect
  file size limits, dangerous patterns, session tracking, and cost reporting.

  These hooks fire on every tool call — independent of which workflow you run.</output>

  <ask>
  **[W] Wire hooks** — create settings.json with all 11 hooks configured
  **[S] Skip** — run without hooks (not recommended — enforcement becomes suggestions)
  </ask>

  <check if="user chose [W] Wire hooks">
    <action>Create `{project-root}/.claude/` directory if needed.
    Copy `{project-root}/_kdbp/.claude/settings.json` to `{project-root}/.claude/settings.json`.</action>
    <output>Hooks wired. 11 Tier 1 gates active.</output>
    <action>Set {{hook_status}} = "fresh-install" and {{restart_needed}} = true</action>
  </check>

  <check if="user chose [S] Skip">
    <action>Set {{hook_status}} = "skipped-none" and {{restart_needed}} = false</action>
  </check>
</check>

## Dry-run step-00-behavior-load

<output>**Verification: dry-running step-00-behavior-load**
  This simulates what every KDBP workflow will do at startup.</output>

<action>Execute the step-00-behavior-load logic manually:
  1. Read `{project-root}/_kdbp/behaviors/REGISTRY.md`
  2. Verify it has entries
  3. Read `{project-root}/_kdbp/behaviors/{{behavior_name}}/BEHAVIOR.md`
  4. Extract Value Manifest table → cache handles
  5. Read `{project-root}/_kdbp/behaviors/trajectory/ledger.md` → last 3 entries
  6. Set {{dbp_active}} = true
</action>

<check if="dry-run succeeds">
  <output>**Dry-run PASSED**
  - Registry: {{behavior_count}} behavior(s) found
  - Handles cached: {{handle_count}} values
  - Ledger: {{ledger_entry_count}} entries (expected: 0 for fresh init)
  - {{dbp_active}} = true

  The behavior system is live. All KDBP workflows will now detect and load
  `{{behavior_name}}` at their Step 0.</output>
</check>

<check if="dry-run fails">
  <output>**Dry-run FAILED**
  Error: {{dry_run_error}}

  This needs to be fixed before workflows can use the behavior system.</output>

  <action>Diagnose and fix the issue. Common causes:
  - REGISTRY.md path doesn't match BEHAVIOR.md location
  - BEHAVIOR.md missing Value Manifest table
  - File permissions issue
  Re-run dry-run after fix.</action>
</check>

---

## Init complete

<output>**KDBP Init Complete**

  Behavior: `{{behavior_name}}` v{{behavior_version}} (seedling)
  Values: {{final_value_count}} — {{value_handles_list}}
  Config: {{config_status}}
  Hooks: {{hook_status}}
  Dry-run: {{dry_run_status}}</output>

<check if="{{restart_needed}} == true">
  <output>**ACTION REQUIRED: Restart your Claude Code session.**
  Hooks are loaded once at session start. The new KDBP hooks will not take effect
  until you exit and re-open Claude Code in this project.

  {{#if hook_status == "migrated"}}Old settings backed up to: `{{old_settings_path}}`{{/if}}</output>
</check>

<output>
  **What's next:**
  {{#if restart_needed}}1. **Restart this session** (hooks won't fire until you do)
  2. {{else}}{{/if}}Run any KDBP workflow:
  - `/kdbp-prd` — define product requirements (values will orient the PRD)
  - `/kdbp-create-epics` — generate epics and stories (values will generate Intent Blocks)
  - `/kdbp-dev-story` — develop a story (Step 0 will load your behavior automatically)
  - `/khujta-dbp` — manage behaviors, run reflections, evolve values

  Your first evolution cycle will happen at the first story completion ([SC] checkpoint).
  Until then, values are seedling — untested against real outputs. This is expected.

  **Handle chain:** {{all_handles_chained}}</output>
