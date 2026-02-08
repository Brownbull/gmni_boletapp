---
name: 'step-06-load-reference'
description: 'Load the design system reference - mandatory gate for Phase 2'

# Path Definitions
workflow_path: '{project-root}/_ecc/workflows/design-system-mockup-builder'

# File References
thisStepFile: '{workflow_path}/steps/step-06-load-reference.md'
workflowFile: '{workflow_path}/workflow.md'
nextStepFile: '{workflow_path}/steps/step-07-gather-requirements.md'
phase1InitFile: '{workflow_path}/steps/step-01-init.md'

# Design System Files
design_system_reference: '{project-root}/docs/uxui/mockups/00_components/design-system-reference.md'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'
---

# Step 6: Load Reference (Phase 2 Gate)

## STEP GOAL:

To load the design system reference file into context. This is a MANDATORY step that cannot be skipped. Phase 2 screen building REQUIRES this reference.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator

### Role Reinforcement:

- ✅ You are a Design System Guardian & UI Mockup Builder
- ✅ Reference is your ONLY source for components
- ✅ From this point, ONLY use what's in reference
- ✅ NO inventing components

### Step-Specific Rules:

- 🎯 Load reference file completely
- 🚫 FORBIDDEN to proceed without reference
- 📋 Confirm reference is in context
- 🔄 Auto-proceed after loading

## EXECUTION PROTOCOLS:

- 🎯 Attempt to load reference file
- ✅ Confirm it's loaded and valid
- 🛑 HALT and redirect if missing
- 🔄 Auto-proceed to next step

## CONTEXT BOUNDARIES:

- This is the Phase 2 entry point
- Reference file MUST exist
- All subsequent steps depend on this

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Announce Phase 2

Display:

"**Phase 2: Screen Building**

Loading design system reference..."

### 2. Load Reference File

Read entire file: `{design_system_reference}`

### 3. Verify Reference Loaded

**IF REFERENCE LOADED SUCCESSFULLY:**

Display:

"✅ **Design System Reference Loaded**

**Available Components:**
- [List component types found]

**Prescriptive Rules Active:**
- Spanish labels: Inicio, Analíticas, Ideas, Ajustes
- Camera icon for center button
- CSS variables only (no hex)
- scan-center: margin-top -56px

**From this point forward:**
- I will ONLY use components from this reference
- NO invented components allowed
- All output will be validated against these rules

Proceeding to gather screen requirements..."

Then load, read entire file, and execute `{nextStepFile}`

**IF REFERENCE FILE MISSING:**

Display:

"❌ **Design System Reference NOT FOUND**

Expected: `{design_system_reference}`

**Phase 2 cannot proceed without the reference file.**

This means Phase 1 was not completed. You need to:
1. Run Phase 1 first to extract the design system
2. Create the reference file

Redirecting to Phase 1..."

Then load, read entire file, and execute `{phase1InitFile}`

### 4. Auto-Proceed

This step has no menu - it's a loading gate.

After successful load, immediately proceed to `{nextStepFile}`

## CRITICAL STEP COMPLETION NOTE

This is an auto-proceed step with a hard gate:

- **Reference exists:** Load it, proceed to step-07
- **Reference missing:** Redirect to step-01 (Phase 1)

No user interaction required unless reference is missing.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Reference file loaded into context
- Component list displayed
- Rules acknowledged
- Proceeding to requirements gathering

### ❌ SYSTEM FAILURE:

- Proceeding without loading reference
- Inventing components not in reference
- Not redirecting when reference missing
- Skipping rule acknowledgment

**Master Rule:** The reference file is your ONLY source for components in Phase 2. If it's not loaded, you cannot build screens.
