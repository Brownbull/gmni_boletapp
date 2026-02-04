# Atlas Sync Observations

Manually trigger observation analysis and instinct updates.

<critical>You MUST have already loaded and processed: {installed_path}/workflow.yaml</critical>

<workflow>

<step n="1" goal="Check Current State">
<action>Read `{learning_config}` to verify learning is enabled</action>
<check if="learning disabled">
<action>Report "Learning system is disabled in config.json"</action>
<action>Ask user if they want to enable it</action>
</check>
<action>Count observations in `{observations_file}`</action>
<action>Report current state:

## Current Learning State

**Learning System:** [Enabled/Disabled]
**Observations Pending:** [count]
**Last Evaluation:** [timestamp from session-state.tmp or "Never"]

</action>
</step>

<step n="2" goal="Preview Observations">
<action>Read and parse observations from `{observations_file}`</action>
<action>Display observation summary:

### Observation Summary

| Tool | Count | Success Rate |
|------|-------|--------------|
| Edit | [count] | [%] |
| Write | [count] | [%] |
| Bash | [count] | [%] |
| Read | [count] | [%] |
| Other | [count] | [%] |

**Time Range:** [oldest] to [newest]
**Sessions Covered:** [unique session count]

</action>
</step>

<step n="3" goal="Run Pattern Detection">
<action>Execute the evaluation script:

```bash
node "{evaluator_script}"
```

</action>
<action>Capture and display output</action>
<check if="evaluation fails">
<action>Report error and suggest checking the evaluator script</action>
</check>
</step>

<step n="4" goal="Display Results">
<action>Read updated `{instincts_file}`</action>
<action>Compare before/after state</action>
<action>Report changes:

## Sync Results

### Patterns Detected
[List newly detected patterns]

### Instinct Updates
| Instinct | Change | New Confidence |
|----------|--------|----------------|
| [pattern] | [New/Reinforced/Decayed] | [confidence] |

### Observations Processed
- **Processed:** [count]
- **Archived:** [count] (older than threshold)
- **Retained:** [count] (recent, for context)

</action>
</step>

<step n="5" goal="Optional: Archive Old Observations">
<ask>Archive processed observations to reduce file size? [Y/N]
- This moves older observations to an archive folder
- Recent observations ([keepRecentCount] from config) are retained
</ask>
<check if="user approves archival">
<action>Create archive folder if needed: `{atlas_learning}/archive/`</action>
<action>Move old observations with timestamp: `observations-{timestamp}.jsonl`</action>
<action>Report archival complete</action>
</check>
</step>

<step n="6" goal="Display Summary">
<action>Output final summary:

## Sync Complete

**Observations Processed:** [count]
**Active Instincts:** [count]
**New Instincts:** [count]
**Reinforced Instincts:** [count]
**Decayed Instincts:** [count]

### Quick Actions
- `/atlas-instinct-status` - View full instinct details
- `/atlas-evolve` - Promote high-confidence instincts
- Continue working to generate more observations

</action>
</step>

</workflow>
