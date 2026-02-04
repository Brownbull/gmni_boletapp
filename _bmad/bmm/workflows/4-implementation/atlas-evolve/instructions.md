# Atlas Evolve - Promote Instincts to Knowledge

Evolve high-confidence instincts into permanent knowledge fragments.

<critical>You MUST have already loaded and processed: {installed_path}/workflow.yaml</critical>
<critical>This workflow modifies Atlas knowledge. Changes require user confirmation.</critical>

<workflow>

<step n="1" goal="Load Evolution Candidates">
<action>Read `{instincts_file}` and parse instincts</action>
<action>Filter instincts with confidence >= 0.8 (evolution threshold)</action>
<check if="no evolution candidates">
<action>Report "No instincts have reached evolution threshold (0.8)."</action>
<action>Suggest running `/atlas-instinct-status` to see current instinct levels</action>
<action>Exit workflow</action>
</check>
<action>Display candidates found:

## Evolution Candidates

Found [count] instinct(s) ready for evolution:

| # | Pattern | Confidence | Context | Occurrences |
|---|---------|------------|---------|-------------|
| 1 | [pattern] | [confidence] | [context] | [count] |

</action>
</step>

<step n="2" goal="Review Each Candidate">
<action>For each evolution candidate, present for review:</action>

### Candidate [#]: [Pattern Description]

**Confidence:** [value] (threshold: 0.8)
**Context Type:** [context]
**First Seen:** [date]
**Last Confirmed:** [date]
**Total Occurrences:** [count]

**What this pattern means:**
[Explain the pattern in practical terms]

**Applicability:**
- When to apply this pattern
- Situations where it helps

<ask>Evolve this instinct to permanent knowledge? [Y/N/Edit/Skip]
- **Y**: Promote as-is to 10-instincts.md
- **N**: Reject and mark as rejected pattern
- **Edit**: Modify description before promoting
- **Skip**: Leave as active instinct for now
</ask>
</step>

<step n="3" goal="Format as Knowledge Nugget">
<action>For each approved candidate, format as knowledge nugget:</action>

```markdown
### Evolved Pattern - [Category] - {date}

**Pattern:** [instinct_description]
**Confidence at Evolution:** [confidence]
**Evidence:** [occurrences] occurrences across sessions
**Context:** [context_type]

**Applicability:**
- [when to apply this pattern]

**Source:** Continuous learning (evolved from instinct [id])
```
</step>

<step n="4" goal="Update Knowledge Fragment">
<action>Read current `{instincts_fragment}`</action>
<action>Append new evolved patterns under appropriate category section:
  - Code Review Patterns
  - Testing Patterns
  - Git & Staging Patterns
  - Implementation Patterns
  - Workflow Patterns
</action>
<action>Update the "Learning Statistics" section with new counts</action>
<action>Present changes for confirmation before saving</action>
</step>

<step n="5" goal="Update Instincts File">
<action>Remove evolved instincts from `{instincts_file}`</action>
<action>Add rejected patterns to rejected list in fragment</action>
<action>Save updated instincts.json</action>
</step>

<step n="6" goal="Update Sync History">
<action>Add entry to `{sync_history}`:

| {date} | **Atlas Evolution**: Promoted [count] instinct(s) to permanent knowledge via `/atlas-evolve` |

</action>
</step>

<step n="7" goal="Report Summary">
<action>Display evolution summary:

## Evolution Complete

**Promoted to Knowledge:** [count] pattern(s)
**Rejected:** [count] pattern(s)
**Skipped (still active):** [count] pattern(s)

### Evolved Patterns
[List promoted patterns]

### Next Steps
- View evolved patterns: `{instincts_fragment}`
- Consider adding to core lessons if pattern is universally applicable
- Run `/atlas-instinct-status` to see remaining active instincts

</action>
</step>

</workflow>
