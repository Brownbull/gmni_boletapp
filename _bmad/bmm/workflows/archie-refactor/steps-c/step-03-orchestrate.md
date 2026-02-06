---
name: 'step-03-orchestrate'
description: 'Deploy archie-refactor-orchestrator subagent for parallel code exploration'

nextStepFile: './step-04-synthesize.md'
subagentFile: '.claude/agents/archie-refactor-orchestrator.md'
---

# Step 3: Deploy Exploration Subagent

## STEP GOAL:

To spawn the archie-refactor-orchestrator Claude Code subagent to perform parallel exploration of the target zones, then gather results for synthesis.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

### Role Reinforcement:

- ✅ You are Archie deploying your exploration squad
- ✅ The subagent handles parallel exploration
- ✅ Your job is to dispatch and collect results
- ✅ Maintain Archie's voice throughout

### Step-Specific Rules:

- 🎯 Focus only on subagent deployment and result collection
- 🚫 FORBIDDEN to manually analyze code - delegate to subagent
- 💬 Display progress as subagent works
- 🚪 Auto-proceed to synthesis when results collected

## EXECUTION PROTOCOLS:

- 🎯 Spawn subagent with scope from step 02
- 💾 Collect and store explorer findings
- 📖 Display progress indicators
- 🚫 Wait for subagent completion before proceeding

## CONTEXT BOUNDARIES:

- Scope analysis from step 02
- Zone segmentation strategy defined
- Focus: Parallel exploration via subagent
- Dependencies: Confirmed scope from step 02

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise unless user explicitly requests a change.

### 1. Prepare Subagent Prompt

Construct the prompt for archie-refactor-orchestrator based on scope analysis:

```
Analyze the following target for refactoring opportunities:

Target: {target_path}
Zones: {zone_list}

For each zone, deploy an explore subagent to analyze:
1. Current structure and responsibilities
2. Dependencies (imports from other layers/features)
3. Pattern violations against FSD rules
4. State management issues (server vs client state)
5. Complexity hotspots (functions > 50 lines, files > 300 lines)
6. Test coverage gaps

Return consolidated findings with:
- Issues prioritized by severity (Critical/High/Medium)
- Dependency map
- Story outlines for remediation
```

### 2. Deploy Subagent

Display as Archie:

"**Deploying exploration squad...**

Spawning `archie-refactor-orchestrator` to analyze {N} zones in parallel.

⏳ This may take a moment depending on target size..."

**Spawn the subagent using the Task tool:**

Use Task tool with:
- subagent_type: "archie-refactor-orchestrator"
- prompt: [constructed prompt from step 1]
- description: "Parallel refactoring analysis"

### 3. Display Progress

While subagent works, display:

"**Squad deployed. Explorers active.**

Zones being analyzed:
{zone_progress_list}

Waiting for all explorers to report back..."

### 4. Collect Results

When subagent returns:

- Capture all explorer findings
- Aggregate issue counts by severity
- Collect dependency information
- Store story outlines

### 5. Confirm Results Received

Display as Archie:

"**All explorers reporting in.**

Collected findings from {N} zones:
- {critical_count} critical issues
- {high_count} high priority issues
- {medium_count} medium priority issues

**Proceeding to synthesis...**"

### 6. Auto-Proceed to Synthesis

Results collected. Automatically proceed to synthesis step.

Load, read entire file, then execute {nextStepFile}.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Subagent spawned with correct scope
- All zone explorers completed
- Findings collected and aggregated
- Auto-proceeded to synthesis

### ❌ SYSTEM FAILURE:

- Manually analyzing instead of delegating
- Proceeding without subagent completion
- Losing explorer findings
- Not using Task tool for subagent

**Master Rule:** Delegate to the squad, collect the intel, proceed to synthesis.
