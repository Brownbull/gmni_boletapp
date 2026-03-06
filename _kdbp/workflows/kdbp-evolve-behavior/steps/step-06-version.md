# Step 06: Version and Log

Causation Analysis Step 7 — Determine version bump, write changelog, archive review.

---

## Determine version bump

<action>Based on classification and fix scope:
  - **Patch** (0.0.x) — Type A or C: workflow step fix, linkage fix
  - **Minor** (0.x.0) — Type B, D, or E: knowledge expansion, skill update
  - **Major** (x.0.0) — Type F: value revision (rare — requires human approval)

Current version: {{current_version}}
New version: {{new_version}}
</action>

## Update BEHAVIOR.md

<action>
  1. Update `version:` in YAML frontmatter
  2. Update `last_evolution:` to today's date
  3. If skills were added/removed: update Skill Manifest table
  4. If workflow steps changed: update Workflow Manifest
</action>

## Write evolution log

<action>Create `evolution/{{date}}-{{type}}.md`:

```markdown
# Evolution: {{date}} — Type {{type}} ({{type_name}})

**Version:** {{old_version}} → {{new_version}}
**Trigger:** {{trigger_type}}
**Symptom:** {{symptom_summary}}
**Classification:** Type {{type}} — {{loop_type}} loop
**Fix:** {{fix_summary}}

## Roast Summary
- Round 2 attack: {{attack_summary}}
- Round 4 stress test: {{stress_results}}
- Round 5 decision: Commit

## Files Modified
{{modified_files_list}}

## Cascade Impact
{{cascade_summary}}
```
</action>

## Update ledger

<action>Add entry to `behaviors/trajectory/ledger.md`:
  Date | Evolution-{{type}} | none | {{behavior_name}} | ✓ | v{{old}} → v{{new}}, {{one_line_summary}}
</action>

## Update linkage map

<action>If any steps, skills, or values changed:
  1. Re-run orphan analysis on DEPENDENCY-MAP.md
  2. Verify no new Type 2 orphans (BLOCKED steps)
  3. Update linkage entries for modified steps
</action>

<output>**Evolution Complete**
  {{behavior_name}} v{{old_version}} → v{{new_version}}
  Type: {{type}} ({{type_name}}) — {{loop_type}} loop
  Files: {{file_count}} modified
  Orphan check: {{orphan_status}}
</output>
