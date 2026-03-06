# Step 03: Behavior Identity

Name the behavior and define its scope. A behavior is a named set of values + skills + workflows
that serves a specific domain and user population.

<critical>Per PROTOCOL-v2 §15: Seed → Values → Harvest → Design → Link → Test → Stabilize.
This step is the Seed phase.</critical>

---

## Propose behavior identity

<action>Based on {{human_context}} and {{project_scan}}, draft:
  - **Behavior name:** Short, descriptive (e.g., "boletapp-dev", "archie-care", "legal-safety")
  - **Domain:** What area does this behavior cover? (e.g., "expense tracking for elderly users")
  - **Target users:** Who does the software serve? (from human context)
  - **Builder profile:** Who develops this? Skill level, team size
  - **Maturity:** Always `seedling` for new behaviors (per §17)
</action>

<output>**Proposed Behavior Identity**

  Name: `{{proposed_behavior_name}}`
  Domain: {{proposed_domain}}
  Serves: {{proposed_target_users}}
  Built by: {{proposed_builder_profile}}
  Maturity: seedling (v1.0.0)

  This name will be used for the directory (`behaviors/{{proposed_behavior_name}}/`)
  and all trajectory references.</output>

<ask>
Does this look right? You can:
**[Y] Accept** this identity
**[E] Edit** — change name, domain, or target users
</ask>

<check if="user chose [E] Edit">
  <action>Incorporate user changes. Re-present for confirmation.</action>
</check>

## Store behavior identity

<action>Store confirmed values:
  {{behavior_name}} — the final behavior name
  {{behavior_domain}} — the domain description
  {{behavior_target_users}} — who it serves
  {{behavior_builder}} — who builds it
  {{behavior_maturity}} = "seedling"
  {{behavior_version}} = "1.0.0"
</action>

<output>**Behavior identity confirmed:** `{{behavior_name}}` v{{behavior_version}} (seedling)
  Next: proposing values based on your human context.</output>
