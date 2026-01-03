---
name: 'step-02-validate-source'
description: 'Validate that design-system-final.html exists and is valid'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/design-system-mockup-builder'

# File References
thisStepFile: '{workflow_path}/steps/step-02-validate-source.md'
workflowFile: '{workflow_path}/workflow.md'
nextStepFile: '{workflow_path}/steps/step-03-extract.md'

# Design System Files
design_system_source: '{project-root}/docs/uxui/mockups/00_components/design-system-final.html'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/tasks/advanced-elicitation.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'
---

# Step 2: Validate Design System Source

## STEP GOAL:

To validate that the design system source file exists and contains valid content before attempting extraction.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator

### Role Reinforcement:

- ✅ You are a Design System Guardian & UI Mockup Builder
- ✅ Validate before proceeding
- ✅ Clear error messages if issues found

### Step-Specific Rules:

- 🎯 Focus ONLY on file validation
- 🚫 FORBIDDEN to start extraction in this step
- 💬 Report validation status clearly
- 🛑 HALT if file missing or invalid

## EXECUTION PROTOCOLS:

- 🎯 Check file exists
- 📖 Verify basic structure (HTML with :root styles)
- ✅ Auto-proceed if valid
- 🛑 HALT with instructions if invalid

## CONTEXT BOUNDARIES:

- Coming from init or rebuild path
- Only validating source file existence
- No extraction work in this step

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Announce Validation

Display: "**Validating design system source...**"

### 2. Check File Exists

Attempt to read: `{design_system_source}`

### 3. Validate Content Structure

Check for required elements:
- `<!DOCTYPE html>` or `<html`
- `:root {` (CSS custom properties)
- Component sections (look for common patterns)

### 4. Report and Route

**IF FILE EXISTS AND VALID:**

Display:

"✅ **Design System Source Validated**

File: `{design_system_source}`
Status: Found and valid

Proceeding to extraction..."

Then load, read entire file, and execute `{nextStepFile}`

**IF FILE MISSING:**

Display:

"❌ **Design System Source NOT FOUND**

Expected file: `{design_system_source}`

**To Fix:**
1. Create your design system HTML file at the path above
2. Include :root with CSS custom properties
3. Add your component definitions
4. Re-run this workflow

**WORKFLOW HALTED** - Cannot proceed without design system source."

**HALT** - Do not continue.

**IF FILE INVALID (exists but wrong structure):**

Display:

"⚠️ **Design System Source Invalid**

File exists but missing required structure.

**Required Elements:**
- HTML document structure
- `:root { }` block with CSS custom properties
- Component definitions

Please fix the file and re-run this workflow.

**WORKFLOW HALTED**"

**HALT** - Do not continue.

## CRITICAL STEP COMPLETION NOTE

This is a validation gate:
- If valid: Auto-proceed to `step-03-extract.md`
- If invalid: HALT with clear instructions

No menu required - validation is pass/fail.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Correctly detected file presence
- Validated basic structure
- Provided clear status message
- Routed correctly (proceed or halt)

### ❌ SYSTEM FAILURE:

- Proceeding despite missing file
- Starting extraction in this step
- Unclear error messages
- Not halting on validation failure

**Master Rule:** Do NOT proceed if source file is missing or invalid. Clear error messaging is required.
