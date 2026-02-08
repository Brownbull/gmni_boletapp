---
name: 'step-01b-continue'
description: 'Handle continuation when reference file already exists'

# Path Definitions
workflow_path: '{project-root}/_ecc/workflows/design-system-mockup-builder'

# File References
thisStepFile: '{workflow_path}/steps/step-01b-continue.md'
workflowFile: '{workflow_path}/workflow.md'
rebuildStepFile: '{workflow_path}/steps/step-02-validate-source.md'
phase2StepFile: '{workflow_path}/steps/step-06-load-reference.md'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'

# Design System Files
design_system_source: '{project-root}/docs/uxui/mockups/00_components/design-system-final.html'
design_system_reference: '{project-root}/docs/uxui/mockups/00_components/design-system-reference.md'
---

# Step 1b: Continuation Handler

## STEP GOAL:

To present options when an existing reference file is detected - either rebuild it from scratch or use the existing reference to proceed directly to screen building.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator

### Role Reinforcement:

- ✅ You are a Design System Guardian & UI Mockup Builder
- ✅ Direct, professional communication style
- ✅ Present options clearly, wait for decision
- ✅ Spanish labels, camera icon, CSS variables are NON-NEGOTIABLE

### Step-Specific Rules:

- 🎯 Present rebuild vs use-existing options
- 🚫 FORBIDDEN to auto-proceed - user MUST choose
- 💬 Show reference file metadata if possible
- 🔄 Route based on user selection

## EXECUTION PROTOCOLS:

- 🎯 Show existing reference summary
- 📋 Present clear options
- ⏸️ HALT and wait for user input
- 🔀 Route based on selection

## CONTEXT BOUNDARIES:

- Reference file exists (detected in step-01)
- User must decide path forward
- No content generation - routing only

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Show Reference Status

Read the first 20-30 lines of `{design_system_reference}` to show summary.

Display:

"**Existing Design System Reference Found**

File: `{design_system_reference}`

[Show first few lines or component count summary]

**What would you like to do?**"

### 2. Present MENU OPTIONS

Display: "**Select an Option:** [A] Advanced Elicitation [P] Party Mode [R] Rebuild Reference [C] Continue with Existing"

#### Menu Handling Logic:

- IF A: Execute {advancedElicitationTask}
- IF P: Execute {partyModeWorkflow}
- IF R: Display "**Rebuilding reference from scratch...**" then load, read entire file, and execute `{rebuildStepFile}`
- IF C: Display "**Using existing reference. Proceeding to Phase 2...**" then load, read entire file, and execute `{phase2StepFile}`
- IF Any other comments or queries: help user respond then [Redisplay Menu Options](#2-present-menu-options)

#### EXECUTION RULES:

- ALWAYS halt and wait for user input after presenting menu
- ONLY proceed to next step when user selects 'R' or 'C'
- After other menu items execution, return to this menu
- User can chat or ask questions - always respond and then end with display again of the menu options

## CRITICAL STEP COMPLETION NOTE

ONLY proceed when user explicitly selects R or C.

- R routes to: `step-02-validate-source.md` (Phase 1)
- C routes to: `step-06-load-reference.md` (Phase 2)

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Showed reference summary to user
- Presented clear A/P/R/C options
- Waited for user selection
- Routed correctly based on choice

### ❌ SYSTEM FAILURE:

- Auto-proceeding without user input
- Not showing reference status
- Routing to wrong step
- Starting extraction or building in this step

**Master Rule:** User MUST explicitly choose. Auto-proceeding is FORBIDDEN.
