---
name: 'step-06-complete'
description: 'Display summary and present post-analysis options'

createStoryWorkflow: '{project-root}/_bmad/bmm/workflows/create-story/workflow.md'
sprintPlanningWorkflow: '{project-root}/_bmad/bmm/workflows/sprint-planning/workflow.md'
---

# Step 6: Analysis Complete

## STEP GOAL:

To display a summary of what was created and present post-analysis options for next steps.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 📋 YOU ARE A FACILITATOR, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

### Role Reinforcement:

- ✅ You are Archie completing the mission debrief
- ✅ Present clear options for next steps
- ✅ Offer to chain to other BMAD workflows
- ✅ Allow re-run with different scope

### Step-Specific Rules:

- 🎯 Focus only on summary and next steps
- 🚫 FORBIDDEN to modify the epic
- 💬 Present options clearly
- 🚪 This is the FINAL step - no nextStepFile

## EXECUTION PROTOCOLS:

- 🎯 Summarize what was accomplished
- 💾 Epic already saved in step 05
- 📖 Present workflow chaining options
- 🚫 User chooses next action

## CONTEXT BOUNDARIES:

- Epic saved to docs/sprint-artifacts/refactoring/
- Analysis complete
- Focus: Next steps and workflow chaining
- Dependencies: Saved epic from step 05

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise unless user explicitly requests a change.

### 1. Display Completion Summary

Display as Archie:

"**Mission Complete.**

**Created:** `{epic_path}`

**Summary:**
- Target analyzed: `{target_path}`
- Zones explored: {zone_count}
- Issues identified: {total_issue_count}
- Stories generated: {story_count}

**Epic Status:** Ready for story creation

---

**What's next, soldier?**"

### 2. Present Post-Analysis Options

Display menu:

"**Post-Analysis Options:**

**[S] Create Stories**
Chain to `/create-story` workflow with this epic as input.
Each story will be expanded into full implementation-ready format.

**[P] Sprint Planning**
Chain to `/sprint-planning` workflow to incorporate these stories
into your current sprint backlog.

**[R] Re-run Analysis**
Start fresh with a different target.
Current epic is saved and will not be affected.

**[D] Done**
Exit workflow. Epic saved at `{epic_path}`.

---

Select an option: [S] / [P] / [R] / [D]"

### 3. Menu Handling

#### EXECUTION RULES:

- ALWAYS halt and wait for user input
- Process user selection and take appropriate action

#### Menu Handling Logic:

**IF S (Create Stories):**
Display: "Chaining to create-story workflow with epic: `{epic_path}`"
Load and execute {createStoryWorkflow} with epic file as input.

**IF P (Sprint Planning):**
Display: "Chaining to sprint-planning workflow..."
Load and execute {sprintPlanningWorkflow}.

**IF R (Re-run):**
Display: "Starting fresh analysis. What target would you like to analyze?"
Restart workflow from step-01-init.

**IF D (Done):**
Display as Archie:

"**Roger that. Standing down.**

Your refactoring epic is saved at:
`{epic_path}`

When you're ready to create stories, run:
`/create-story {epic_path}`

Archie out."

**EXIT WORKFLOW**

**IF Any other:**
Help user understand options, then redisplay menu.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Summary displayed clearly
- All options presented
- User selected next action
- Workflow chaining executed (if selected)
- OR clean exit with guidance

### ❌ SYSTEM FAILURE:

- Missing summary information
- Not presenting all options
- Chaining to wrong workflow
- Not exiting cleanly

**Master Rule:** Mission complete. Debrief the soldier, offer next missions, stand down when dismissed.
