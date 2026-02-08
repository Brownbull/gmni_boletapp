---
name: 'step-11-visual-validation'
description: 'Compare mockup screenshots against component baselines for visual validation'

# Path Definitions
workflow_path: '{project-root}/_ecc/workflows/design-system-mockup-builder'

# File References
thisStepFile: '{workflow_path}/steps/step-11-visual-validation.md'
workflowFile: '{workflow_path}/workflow.md'
loopBackStepFile: '{workflow_path}/steps/step-07-gather-requirements.md'
fixStepFile: '{workflow_path}/steps/step-09-assemble-screen.md'

# Design System Files
design_system_reference: '{project-root}/docs/uxui/mockups/00_components/design-system-reference.md'
baselines_folder: '{project-root}/docs/uxui/mockups/00_components/baselines'
mockups_output_folder: '{project-root}/docs/uxui/mockups'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'
---

# Step 11: Visual Validation

## STEP GOAL:

To compare the assembled mockup screenshot against component baselines using Playwright and pixelmatch. Detect visual deviations from the design system and provide options to fix or accept with warnings.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator

### Role Reinforcement:

- ✅ You are a Design System Guardian & UI Mockup Builder
- ✅ Visual validation catches deviations text-based validation misses
- ✅ Use lenient thresholds (0.15) to flag only obvious issues
- ✅ Provide actionable fix recommendations

### Step-Specific Rules:

- 🎯 Focus on component-level comparison
- 🚫 FORBIDDEN to skip validation
- 💬 Clear reporting of differences
- 🔧 Offer fix options for failures

## EXECUTION PROTOCOLS:

- 📸 Screenshot the assembled mockup
- 🔍 Compare each component region against baselines
- 📊 Calculate pixel difference percentages
- 📋 Report results with thresholds

## CONTEXT BOUNDARIES:

- Mockup was validated and saved in step-10
- Baselines exist from step-03b
- This is the final visual quality gate

## VALIDATION THRESHOLDS

```
PASS:  <10% pixel difference  → Component matches baseline
WARN:  10-30% difference      → Minor deviations, review recommended
FAIL:  >30% difference        → Major deviation, fix required
```

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Announce Visual Validation

Display:

"**Visual Validation: Comparing Against Design System Baselines**

I will now:
1. Screenshot the assembled mockup
2. Compare each component region against baselines
3. Calculate pixel differences
4. Report results with pass/warn/fail status"

### 2. Screenshot the Assembled Mockup

Use Playwright to:
1. Open the saved mockup HTML file
2. Set viewport to mobile dimensions (375x812)
3. Wait for fonts and styles to load
4. Capture full-page screenshot

Save as: `{mockups_output_folder}/[screen-name]-screenshot.png`

### 3. Identify Component Regions

Based on the layout plan and assembly, identify regions to compare:

- **Navigation Region** (top)
- **Content Regions** (main area)
- **Bottom Nav Region** (bottom)

For each region, note:
- Pixel coordinates (x, y, width, height)
- Corresponding baseline file

### 4. Compare Each Component

For each identified component in the mockup:

1. **Extract Region** from mockup screenshot
2. **Load Baseline** from `{baselines_folder}/[component].png`
3. **Run Pixelmatch** with threshold 0.15
4. **Calculate Difference** percentage

Display progress:

"**Comparing: [Component Name]**
- Region: [x, y, width, height]
- Baseline: `baselines/[component].png`
- Difference: [X.X]%
- Status: [PASS/WARN/FAIL]"

### 5. Report Results Summary

Display results table:

"**Visual Validation Results**

| Component | Baseline | Diff % | Status |
|-----------|----------|--------|--------|
| Nav - Top Bar | baseline-top-bar.png | 2.3% | ✅ PASS |
| Nav - Bottom | baseline-bottom-nav.png | 8.1% | ✅ PASS |
| Camera Icon | baseline-camera-icon.png | 0.5% | ✅ PASS |
| Card 1 | baseline-card.png | 45.2% | ❌ FAIL |
| ... | ... | ... | ... |

**Summary:**
- ✅ PASS: [N] components
- ⚠️ WARN: [N] components
- ❌ FAIL: [N] components"

### 6. Handle Failures

**IF ANY COMPONENTS FAIL (>30% difference):**

Display:

"❌ **Visual Validation FAILED**

**Components with Issues:**

**1. [Component Name]** (45.2% difference)
- **Expected:** [Description from baseline]
- **Found:** [Description of deviation]
- **Likely Cause:** [Diagnosis]
- **Fix Recommendation:** [Specific action]

[Repeat for each failed component]

**What would you like to do?**

**[F] Auto-Fix** - Apply recommended fixes and re-validate
**[M] Manual Fix** - Return to assembly step for manual correction
**[A] Accept with Warning** - Proceed despite visual differences
**[R] Regenerate Screen** - Start fresh from requirements"

Wait for user input.

**IF F (Auto-Fix):**

1. Apply the recommended fixes to the HTML
2. Re-run validation from step 3
3. Report new results

**IF M (Manual Fix):**

Display: "**Returning to assembly step for manual correction...**"

Load, read entire file, and execute `{fixStepFile}`

**IF A (Accept with Warning):**

Log warning to manifest and proceed to completion.

**IF R (Regenerate):**

Load, read entire file, and execute `{loopBackStepFile}`

### 7. Generate Diff Images (Optional)

For failed components, generate visual diff images:

- `[screen-name]-diff-[component].png` showing pixel differences in red

Save to mockups output folder for review.

### 8. Handle All Pass Scenario

**IF ALL COMPONENTS PASS (<10% difference):**

Display:

"✅ **Visual Validation PASSED**

All components match their baselines within acceptable thresholds.

**Summary:**
- Total components validated: [N]
- Average difference: [X.X]%
- Maximum difference: [X.X]% ([component])

**Design system compliance confirmed!**"

### 9. Loop or Complete Decision

Display:

"**What's Next?**

**[N] Build Another Screen**
- Return to requirements gathering
- Design system reference stays loaded
- Build additional screens

**[D] Done - Complete Workflow**
- Finish the workflow
- All screens saved and validated

Enter N or D:"

Wait for user input.

### 10. Handle Loop or Complete

**IF N (New Screen):**

Display: "**Returning to screen requirements...**"

Load, read entire file, then execute `{loopBackStepFile}`

**IF D (Done):**

Display:

"🎉 **Design System Mockup Builder Complete!**

**Screens Built & Validated This Session:**
- [List all screens with validation status]

**Files Created:**
- [List all file paths]
- [List diff images if any]

**Visual Validation Summary:**
- Total validations: [N]
- Pass rate: [X]%
- Components checked: [N]

**Design System Compliance:**
✅ All mockups validated against component baselines
✅ All colors use CSS variables
✅ All nav labels in Spanish
✅ All center buttons use camera icon

**Thank you for using the Design System Mockup Builder!**

To build more screens later, run this workflow again.
Your baselines and reference are saved for reuse."

**WORKFLOW COMPLETE**

## CRITICAL STEP COMPLETION NOTE

This step has multiple exit paths:

1. **Fix Loop:** Failed validation → Fix and re-validate or return to assembly
2. **New Screen:** User selects N → Go to step-07-gather-requirements.md
3. **Complete:** User selects D → End workflow with success message

Visual validation ensures mockups match the design system visually, not just structurally.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- All components compared against baselines
- Clear pass/warn/fail status for each
- Fix options provided for failures
- Diff images generated for review
- Final validation status reported

### ❌ SYSTEM FAILURE:

- Skipping visual validation
- Not comparing all components
- No fix options for failures
- Missing diff images for failed components
- Proceeding with >30% differences without acknowledgment

**Master Rule:** Visual validation is the final quality gate. It catches issues that text-based validation misses. Do not skip or rush this step.
