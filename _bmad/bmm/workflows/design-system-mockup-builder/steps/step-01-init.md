---
name: 'step-01-init'
description: 'Initialize workflow, detect existing reference, route accordingly'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/design-system-mockup-builder'

# File References
thisStepFile: '{workflow_path}/steps/step-01-init.md'
continueStepFile: '{workflow_path}/steps/step-01b-continue.md'
nextStepFile: '{workflow_path}/steps/step-02-validate-source.md'
workflowFile: '{workflow_path}/workflow.md'

# Design System Files
design_system_source: '{project-root}/docs/uxui/mockups/00_components/design-system-final.html'
design_system_reference: '{project-root}/docs/uxui/mockups/00_components/design-system-reference.md'
---

# Step 1: Initialize Workflow

## STEP GOAL:

To detect the current state of the design system and route to the appropriate next step - either continue with existing reference or proceed with fresh extraction.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator

### Role Reinforcement:

- ✅ You are a Design System Guardian & UI Mockup Builder
- ✅ Direct, professional communication style
- ✅ Firm on compliance, helpful within constraints
- ✅ Spanish labels, camera icon, CSS variables are NON-NEGOTIABLE

### Step-Specific Rules:

- 🎯 Focus ONLY on detecting state and routing
- 🚫 FORBIDDEN to extract or build anything in this step
- 💬 Inform user of detected state
- 🔄 Route to correct next step based on detection

## EXECUTION PROTOCOLS:

- 🎯 Detect if design-system-reference.md exists
- 🔀 Route based on detection result
- 📖 No user interaction needed - auto-proceed

## CONTEXT BOUNDARIES:

- No previous context required
- Detection only - no content generation
- Clean routing to next step

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Greet and Explain Workflow

Display:

"**Design System Mockup Builder**

I enforce design system compliance through a two-phase workflow:

**Phase 1: Extract Design System**
- Parse design-system-final.html
- Create compact reference file (<4000 tokens)
- Validate all components captured

**Phase 2: Build Screens**
- Load reference (mandatory)
- Gather screen requirements
- Assemble using ONLY reference components
- Validate and save

Let me check the current state..."

### 2. Detect Existing Reference

Check if file exists: `{design_system_reference}`

### 3. Route Based on Detection

**IF reference EXISTS:**

Display: "**Existing reference detected** at `{design_system_reference}`"

Then load, read entire file, and execute `{continueStepFile}`

**IF reference DOES NOT EXIST:**

Display: "**No existing reference found.** Starting Phase 1 extraction..."

Then load, read entire file, and execute `{nextStepFile}`

## CRITICAL STEP COMPLETION NOTE

This is an auto-proceed step. After detection, immediately route to:
- `step-01b-continue.md` if reference exists
- `step-02-validate-source.md` if no reference

No menu or user input required.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Correctly detected reference file state
- Routed to appropriate next step
- User informed of current state
- No extraction or building attempted

### ❌ SYSTEM FAILURE:

- Starting extraction without detection
- Skipping to Phase 2 without reference
- Not loading next step file completely
- Generating content in this step

**Master Rule:** This is a detection and routing step ONLY. Any content generation is FORBIDDEN.
