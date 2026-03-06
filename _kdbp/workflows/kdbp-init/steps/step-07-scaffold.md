# Step 07: Scaffold

Create the behavior directory structure, BEHAVIOR.md, VALUES.md, PROJECT.md, and trajectory stubs.

<critical>This step creates files on disk. Each file is presented as DRAFT for user confirmation
before writing.</critical>

---

## Create directory structure

<action>Create the following directories:
  {project-root}/_kdbp/behaviors/{{behavior_name}}/
  {project-root}/_kdbp/behaviors/{{behavior_name}}/evolution/  ← for changelog + review logs
  {project-root}/_kdbp/behaviors/trajectory/
  {project-root}/_kdbp/behaviors/trajectory/stories/
  {project-root}/_kdbp/behaviors/trajectory/stories/active/
  {project-root}/_kdbp/behaviors/trajectory/stories/completed/
  {project-root}/_kdbp/behaviors/trajectory/epics/
  {project-root}/_kdbp/behaviors/trajectory/epics/active/
  {project-root}/_kdbp/behaviors/trajectory/epics/completed/
</action>

## Generate REGISTRY.md

<action>Draft REGISTRY.md:

```markdown
# Behavior Registry

| Behavior | Path | Version | Maturity | Active |
|----------|------|---------|----------|--------|
| {{behavior_name}} | {{behavior_name}}/BEHAVIOR.md | {{behavior_version}} | seedling | yes |
```

Present as DRAFT.</action>

<ask>**[Y] Write** REGISTRY.md | **[E] Edit** first</ask>
<action>Write to `{project-root}/_kdbp/behaviors/REGISTRY.md`</action>

## Generate BEHAVIOR.md

<action>Draft BEHAVIOR.md following PROTOCOL-v2 §15:

```markdown
# Behavior: {{behavior_name}}

Version: {{behavior_version}}
Maturity: seedling
Created: {{date}}
Domain: {{behavior_domain}}
Target Users: {{behavior_target_users}}
Builder: {{behavior_builder}}

## Identity
{{behavior_name}} guides how {{project_name}} serves {{behavior_target_users}}.

## Value Manifest
| ID | Handle | Altitude |
|----|--------|----------|
{{for each final_value}}
| V{{n}} | "{{one_line_handle}}" | {{evaluation_altitude}} |
{{end for}}

## Linkage Map
Populated during first evolution cycle ([SC] or [EB]).
Initial values have no linked workflow steps yet — this is expected at seedling maturity.

## Skills
{{if final_skills is not empty}}
{{for each final_skill}}
- **{{skill_name}}:** {{skill_description}} (demoted from value during init — {{demote_reason}})
{{end for}}
{{else}}
No skills defined yet. Skills emerge during evolution cycles.
{{end if}}
```

Present as DRAFT.</action>

<ask>**[Y] Write** BEHAVIOR.md | **[E] Edit** first</ask>
<action>Write to `{project-root}/_kdbp/behaviors/{{behavior_name}}/BEHAVIOR.md`</action>

## Generate VALUES.md

<action>Draft VALUES.md with full Value Blocks (from Step 06 final set):

```markdown
# Values: {{behavior_name}}

Version: {{behavior_version}}
Last Updated: {{date}}

{{for each final_value}}
{{full_value_block}}

---
{{end for}}
```

Present as DRAFT.</action>

<ask>**[Y] Write** VALUES.md | **[E] Edit** first</ask>
<action>Write to `{project-root}/_kdbp/behaviors/{{behavior_name}}/VALUES.md`</action>

## Generate PROJECT.md

<action>Draft PROJECT.md per PROTOCOL-v2 §9:

```markdown
---
project: {{project_name}}
version: 1.0.0
last_reviewed: {{date}}
active_behaviors: [{{behavior_name}}]
external_pm: none
external_pm_url: ""
---

# Project: {{project_name}}

## Project Intent
{{project_description}}
Built for: {{behavior_target_users}}
Built by: {{behavior_builder}}

## Project-Level Values
(Currently same as {{behavior_name}} values — diverge as more behaviors are added)

## Value Resolution Order
When behavior values conflict:
1. Safety-related values take precedence over productivity values
2. If still ambiguous: human decides and logs in ledger.md under RESOLUTION: prefix

## Active Epics
(None yet — populated by /kdbp-create-epics)

## Behaviors In Use
| Behavior | Applies To | Key Value Handle |
|----------|-----------|-----------------|
| {{behavior_name}} | {{behavior_domain}} | "{{first_value_handle}}" |
```

Present as DRAFT.</action>

<ask>**[Y] Write** PROJECT.md | **[E] Edit** first</ask>
<action>Write to `{project-root}/_kdbp/behaviors/trajectory/PROJECT.md`</action>

## Create trajectory stubs

<action>Create empty ledger:

```markdown
# Trajectory Ledger

## Format
| Date | Story | PM-Ref | Behavior | Outcome | Signals |

Outcome: ✓ done | ~ partial | ✗ blocked | ⚑ drift detected

---

| Date | Story | PM-Ref | Behavior | Outcome | Signals |
|------|-------|--------|----------|---------|---------|

## Unresolved Drift Signals
(None yet)

## Resolutions
(None yet)
```

Write to `{project-root}/_kdbp/behaviors/trajectory/ledger.md` (no confirmation needed — it's empty).</action>

---

<output>**Scaffold complete.**
  Created: {{file_count}} files in behaviors/
  - REGISTRY.md
  - {{behavior_name}}/BEHAVIOR.md
  - {{behavior_name}}/VALUES.md
  - trajectory/PROJECT.md
  - trajectory/ledger.md
  - {{behavior_name}}/evolution/ (directory)
  - trajectory/stories/{active,completed}/ (directories)
  - trajectory/epics/{active,completed}/ (directories)

  Next: wiring config and verifying the system works.</output>
