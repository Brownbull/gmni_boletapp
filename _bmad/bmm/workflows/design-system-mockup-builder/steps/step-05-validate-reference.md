---
name: 'step-05-validate-reference'
description: 'Validate the created reference file contains all required components'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/design-system-mockup-builder'

# File References
thisStepFile: '{workflow_path}/steps/step-05-validate-reference.md'
workflowFile: '{workflow_path}/workflow.md'
nextStepFile: '{workflow_path}/steps/step-06-load-reference.md'
checklistFile: '{workflow_path}/checklist.md'

# Design System Files
design_system_source: '{project-root}/docs/uxui/mockups/00_components/design-system-final.html'
design_system_reference: '{project-root}/docs/uxui/mockups/00_components/design-system-reference.md'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/tasks/advanced-elicitation.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'
---

# Step 5: Validate Reference

## STEP GOAL:

To validate that the reference file correctly captures all components from the design system and includes all prescriptive rules. This is the gate between Phase 1 and Phase 2.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator

### Role Reinforcement:

- ✅ You are a Design System Guardian & UI Mockup Builder
- ✅ Strict validation - no shortcuts
- ✅ All prescriptive rules must be present
- ✅ Reference must be usable for Phase 2

### Step-Specific Rules:

- 🎯 Focus ONLY on validation
- 🚫 FORBIDDEN to proceed with incomplete reference
- 💬 Clear pass/fail reporting
- 🔧 Allow fixes before proceeding

## EXECUTION PROTOCOLS:

- 🎯 Load and validate reference file
- ✅ Check all CRITICAL items
- 📋 Report validation results
- 🔧 Allow corrections if needed

## CONTEXT BOUNDARIES:

- Reference file was just created
- This is the final Phase 1 gate
- Must pass before Phase 2 can start

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Announce Validation

Display: "**Validating Design System Reference...**"

### 2. Load Reference File

Read: `{design_system_reference}`

### 3. Run Validation Checks

**CRITICAL CHECKS (Must Pass):**

- [ ] **Spanish Nav Labels Present**
  - Search for: Inicio, Analíticas, Ideas, Ajustes
  - All four must appear

- [ ] **Camera Icon Path Present**
  - Search for: `M14.5 4h-5L7 7H4`
  - Must be in icons section

- [ ] **CSS Variable Usage Documented**
  - Validation rules section exists
  - States MUST use var(--name)
  - States MUST NOT use hex

- [ ] **Scan Center Position Documented**
  - States margin-top: -56px
  - NOT -32px

**HIGH PRIORITY CHECKS:**

- [ ] **Design Tokens Section**
  - Colors listed
  - Spacing listed
  - Typography listed

- [ ] **Navigation HTML Snippets**
  - Bottom nav HTML present
  - Top bar HTML present
  - In copy-paste format

- [ ] **Icon Catalog**
  - All 5 nav icons documented
  - SVG paths included

**MEDIUM PRIORITY CHECKS:**

- [ ] **Component Sections**
  - Cards documented
  - Charts documented (if any)

- [ ] **File Size**
  - Rough token count <4000

### 4. Report Validation Results

**IF ALL CRITICAL PASS:**

Display:

"✅ **Reference Validation PASSED**

**CRITICAL (4/4):**
- ✅ Spanish nav labels: Inicio, Analíticas, Ideas, Ajustes
- ✅ Camera icon path documented
- ✅ CSS variable usage rules present
- ✅ Scan center -56px documented

**HIGH PRIORITY ([X]/[Y]):**
- [Status for each]

**MEDIUM PRIORITY ([X]/[Y]):**
- [Status for each]

**Phase 1 Complete!** Reference file ready for Phase 2."

**IF ANY CRITICAL FAILS:**

Display:

"❌ **Reference Validation FAILED**

**CRITICAL FAILURES:**
- ❌ [List each failure]

**To Fix:**
1. [Specific fix instructions]
2. Re-run this validation step

**Cannot proceed to Phase 2 until CRITICAL checks pass.**"

Offer to fix the issues:

"Would you like me to:
**[F] Fix Issues** - Update reference with missing items
**[R] Re-extract** - Go back to extraction step"

Wait for user input. Route accordingly.

### 5. Present MENU OPTIONS (Only if Validation Passed)

Display: "**Select an Option:** [A] Advanced Elicitation [P] Party Mode [C] Continue to Phase 2"

#### EXECUTION RULES:

- ALWAYS halt and wait for user input after presenting menu
- ONLY proceed to next step when user selects 'C'
- After other menu items execution, return to this menu
- User can chat or ask questions - respond then redisplay menu

#### Menu Handling Logic:

- IF A: Execute {advancedElicitationTask} - to review extraction completeness
- IF P: Execute {partyModeWorkflow}
- IF C: Proceed to Phase 2, load, read entire file, then execute {nextStepFile}
- IF Any other comments or queries: help user respond then [Redisplay Menu Options](#5-present-menu-options)

## CRITICAL STEP COMPLETION NOTE

This is the Phase 1/Phase 2 gate:

- **All CRITICAL checks must pass** to proceed
- ONLY WHEN C is selected after passing validation
- Then load and execute {nextStepFile} (Phase 2 begins)

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- All CRITICAL checks pass
- Validation report shown
- User approved proceeding
- Clear handoff to Phase 2

### ❌ SYSTEM FAILURE:

- Proceeding despite CRITICAL failures
- Not showing validation report
- Skipping checks
- No fix option for failures

**Master Rule:** Phase 2 CANNOT start until this validation passes. No exceptions.
