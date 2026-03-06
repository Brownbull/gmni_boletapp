# Step 00: Behavior Load for Alignment Check

Load full cold tier — this workflow evaluates values, so all value content is required.

<critical>Alignment checks require COLD TIER content: full Value Blocks, full Intent Blocks,
and PROJECT.md. This is one of the few workflows that loads everything upfront.</critical>

---

## Load behavior

<action>Read {project-root}/_kdbp/behaviors/REGISTRY.md</action>

<check if="No behaviors registered">
  <output>**BLOCKED — No behaviors registered.** Cannot run alignment check.</output>
  <stop/>
</check>

## Load cold tier

<action>
  1. Read `behaviors/{path}/values/VALUES.md` — full Value Blocks
  2. Read `behaviors/{path}/BEHAVIOR.md` — identity + manifests
  3. Read `behaviors/{path}/DEPENDENCY-MAP.md` — linkage table
  4. Read `behaviors/trajectory/PROJECT.md` — project intent + value resolution order
  5. Check `behaviors/trajectory/stories/active/` for active story/epic Intent Blocks
  6. Store all as {{cold_tier}}
</action>

<output>**[LB] Cold Tier Loaded for Alignment Check**
  Behavior: {{behavior_name}} v{{version}}
  Values: {{value_count}} full blocks loaded
  Project Intent: {{project_intent_status}}
  Active stories: {{active_story_count}}</output>
