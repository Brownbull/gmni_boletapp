---
name: 'step-10-validate-save'
description: 'Validate assembled screen against reference, save if valid, proceed to visual validation'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/design-system-mockup-builder'

# File References
thisStepFile: '{workflow_path}/steps/step-10-validate-save.md'
workflowFile: '{workflow_path}/workflow.md'
nextStepFile: '{workflow_path}/steps/step-11-visual-validation.md'
checklistFile: '{workflow_path}/checklist.md'

# Design System Files
design_system_reference: '{project-root}/docs/uxui/mockups/00_components/design-system-reference.md'
mockups_output_folder: '{project-root}/docs/uxui/mockups'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/tasks/advanced-elicitation.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'
---

# Step 10: Validate, Save & Complete

## STEP GOAL:

To validate the assembled screen against prescriptive rules, save if valid, and proceed to visual validation for final quality gate.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator

### Role Reinforcement:

- ✅ You are a Design System Guardian & UI Mockup Builder
- ✅ Strict validation - no exceptions
- ✅ Fix before save, never skip
- ✅ Celebrate successful builds

### Step-Specific Rules:

- 🎯 Run all validation checks
- 🚫 FORBIDDEN to save with CRITICAL failures
- 💬 Offer to fix issues
- 🔄 Support building multiple screens

## EXECUTION PROTOCOLS:

- 🎯 Run prescriptive validation
- ❌ If fails: Show violations, offer fixes
- ✅ If passes: Save file
- 🔄 Proceed to visual validation

## CONTEXT BOUNDARIES:

- Assembled screen from previous step
- Validation checklist available
- Can loop back for more screens

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Announce Validation

Display: "**Validating Assembled Screen...**"

### 2. Run CRITICAL Checks

**Check 1: Spanish Nav Labels**
Search assembled HTML for:
- ✅ "Inicio" present
- ✅ "Analíticas" present
- ✅ "Ideas" present
- ✅ "Ajustes" present
- ❌ "Home" NOT present
- ❌ "Analytics" NOT present
- ❌ "Settings" NOT present

**Check 2: Camera Icon (Not Scan)**
Search for camera icon path:
- ✅ `M14.5 4h-5L7 7H4` present
- ❌ Scan icon paths NOT present

**Check 3: CSS Variables Only**
Search for hardcoded colors:
- ❌ No `#[0-9a-f]{3,6}` in style attributes or inline
- ✅ All colors use `var(--name)` format

**Check 4: Scan Center Position**
Search for scan-center margin:
- ✅ `margin-top: -56px` present
- ❌ `margin-top: -32px` NOT present

### 3. Run HIGH PRIORITY Checks

- [ ] All component HTML matches reference
- [ ] All CSS classes match reference
- [ ] SVG icons use exact paths

### 4. Report Validation Results

**IF ALL CRITICAL PASS:**

Display:

"✅ **VALIDATION PASSED**

**CRITICAL (4/4):**
- ✅ Spanish labels: Inicio, Analíticas, Ideas, Ajustes
- ✅ Camera icon present (not scan)
- ✅ CSS variables only (no hex)
- ✅ scan-center: margin-top -56px

**HIGH PRIORITY ([X]/[Y]):**
[List results]

**Screen is ready to save!**"

Proceed to Step 5.

**IF ANY CRITICAL FAILS:**

Display:

"❌ **VALIDATION FAILED**

**CRITICAL FAILURES:**
[List each failure with location]

**To Fix:**
[Specific fix instructions for each failure]

Would you like me to:
**[F] Fix Issues** - Apply corrections and re-validate
**[R] Review Assembly** - Go back to assembly step"

Wait for input. If F, apply fixes and re-run validation.

### 5. Save File (Only if Validation Passed)

Save to: `{mockups_output_folder}/[screen-name].html`

Display:

"✅ **Screen Saved Successfully**

File: `{mockups_output_folder}/[screen-name].html`

**Summary:**
- All CRITICAL checks passed
- Components from design system reference
- Ready for preview or implementation"

### 6. Proceed to Visual Validation

Display:

"**Text-based validation passed!**

Now proceeding to visual validation to compare screenshots against component baselines..."

### 7. Present MENU OPTIONS

Display: "**Select an Option:** [A] Advanced Elicitation [P] Party Mode [C] Continue to Visual Validation"

#### EXECUTION RULES:

- ALWAYS halt and wait for user input after presenting menu
- ONLY proceed to next step when user selects 'C'
- After other menu items execution, return to this menu
- User can chat or ask questions - respond then redisplay menu

#### Menu Handling Logic:

- IF A: Execute {advancedElicitationTask}
- IF P: Execute {partyModeWorkflow}
- IF C: Proceed to visual validation, load, read entire file, then execute {nextStepFile}
- IF Any other comments or queries: help user respond then [Redisplay Menu Options](#7-present-menu-options)

## CRITICAL STEP COMPLETION NOTE

ONLY WHEN:
1. All CRITICAL checks pass
2. File is saved
3. User selects 'C'

Then load and execute {nextStepFile} to run visual validation.

If validation fails, must fix before proceeding.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- All CRITICAL validation passed
- File saved only after validation
- Ready for visual validation
- All screens tracked
- Clear transition to step-11

### ❌ SYSTEM FAILURE:

- Saving despite validation failures
- Not offering fix options
- Not tracking built screens
- Skipping to visual validation without save
- Not proceeding to step-11

**Master Rule:** Never save a screen that fails CRITICAL validation. Visual validation in step-11 is the final quality gate.
