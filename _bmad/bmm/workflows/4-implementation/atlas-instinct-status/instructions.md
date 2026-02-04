# Atlas Instinct Status

Display the current state of Atlas's continuous learning system.

<critical>You MUST have already loaded and processed: {installed_path}/workflow.yaml</critical>

<workflow>

<step n="1" goal="Load Learning Configuration">
<action>Read the learning configuration from `{learning_config}`</action>
<action>Report learning system status (enabled/disabled)</action>
<action>Display configuration summary:
  - Session evaluation threshold
  - Confidence range (min/max)
  - Evolution threshold
  - Active pattern detection types
</action>
</step>

<step n="2" goal="Display Observation Statistics">
<action>Count lines in `{observations_file}` to get observation count</action>
<action>If observations exist, analyze by tool type</action>
<action>Show observation breakdown:
  - Total observations since last evaluation
  - Breakdown by tool (Edit, Write, Bash, Read, etc.)
  - Oldest and newest observation timestamps
</action>
</step>

<step n="3" goal="Display Active Instincts">
<action>Read `{instincts_file}` and parse instincts</action>
<action>Sort instincts by confidence (highest first)</action>
<action>Display instincts table:

| Pattern | Confidence | Context | First Seen | Last Confirmed | Occurrences |
|---------|------------|---------|------------|----------------|-------------|
| [pattern description] | [0.30-0.90] | [context type] | [date] | [date] | [count] |

</action>
<check if="no instincts exist">
<action>Report "No active instincts yet. Use more tools to generate observations."</action>
</check>
</step>

<step n="4" goal="Identify Evolution Candidates">
<action>Filter instincts with confidence >= 0.8 (evolution threshold)</action>
<check if="evolution candidates exist">
<action>Display evolution candidates:

### Evolution Candidates (Ready for Promotion)

These instincts have reached high confidence and can be promoted to permanent knowledge via `/atlas-evolve`:

| Pattern | Confidence | Occurrences |
|---------|------------|-------------|
| [pattern] | [confidence] | [count] |

</action>
</check>
<check if="no evolution candidates">
<action>Report "No instincts have reached evolution threshold (0.8) yet."</action>
</check>
</step>

<step n="5" goal="Show Decay Warnings">
<action>Identify instincts not confirmed in 7+ days</action>
<check if="stale instincts exist">
<action>Display decay warnings:

### Decay Warnings

These instincts haven't been confirmed recently and may lose confidence:

| Pattern | Confidence | Days Since Confirmed |
|---------|------------|----------------------|
| [pattern] | [confidence] | [days] |

Consider using similar workflows to reinforce these patterns.
</action>
</check>
</step>

<step n="6" goal="Display Summary">
<action>Output final summary:

## Atlas Learning System Status

**System:** [Enabled/Disabled]
**Active Instincts:** [count]
**Observations Pending:** [count]
**Evolution Candidates:** [count]
**Instincts at Risk (Decay):** [count]

### Quick Actions
- `/atlas-sync-observations` - Process observations and update instincts
- `/atlas-evolve` - Promote high-confidence instincts to permanent knowledge
- View `{atlas_knowledge}/10-instincts.md` for evolved patterns

</action>
</step>

</workflow>
