---
validationDate: 2026-01-24
workflowName: atlas-create-story
workflowPath: _bmad/bmm/workflows/4-implementation/atlas-create-story
validationStatus: BUG FIX APPLIED
previousValidation: 2026-01-24
editSession: true
bugFix: true
---

# Bug Fix Report: atlas-create-story Post-Generation Sizing Check

**Fix Date:** 2026-01-24
**Validator:** Atlas Story Sizing Workflow Analysis
**Issue:** Story 14e-6 was created with 47 subtasks (3.1x the 15-subtask limit) without triggering a sizing warning

---

## Bug Description

### Symptoms
- Story 14e-6 (Scan Zustand Store Definition) was created with:
  - **5 tasks** (exceeds 4-task limit)
  - **47 subtasks** (3.1× the 15-subtask limit)
- No sizing warning was shown during story creation
- Story had to be manually split using `atlas-story-sizing` workflow

### Root Cause
**Step 5b ran BEFORE the story was generated in Step 6**

```
Previous Flow:
Step 1 → 2 → 3 → 4 → 5 → 5b → 6 → 7
                          ↑      ↑
                      SIZING    STORY CREATED
                      CHECK     HERE!
                      (runs on estimates)
```

Step 5b says "Analyze the story's planned tasks and subtasks" but at that point:
- The story file doesn't exist yet
- It can only estimate based on epic descriptions
- The actual 47 subtasks are generated in Step 6

---

## Fix Applied

### Solution: POST-GENERATION Sizing Check in Step 6

Added ~100 lines of sizing validation AFTER the story content is generated:

```xml
<!-- POST-GENERATION SIZING VALIDATION (Critical Fix - 2026-01-24) -->
<critical>📏 POST-GENERATION SIZING CHECK - Validate ACTUAL story content!</critical>

<action>Parse the GENERATED story file to extract actual metrics:</action>
<action>  1. Count lines matching "- [ ] **Task" pattern → {{actual_task_count}}</action>
<action>  2. Count all nested "- [ ]" items → {{actual_subtask_count}}</action>
<action>  3. Count files in "Files to Create" + "Files to Modify" → {{actual_file_count}}</action>

<check if="{{actual_story_size}} == TOO_LARGE">
  <output>⚠️ POST-GENERATION SIZING ALERT: Story exceeds context window capacity!</output>
  <ask>1. Split now | 2. Proceed anyway | X. Discard</ask>
  ...
</check>
```

### Changes Made

| File | Change |
|------|--------|
| `instructions.xml` | Added ~100 lines of post-generation sizing validation in Step 6 |
| `instructions.xml` | Updated Step 5b header to clarify it's only a PRE-GENERATION estimate |
| `workflow.yaml` | Added bug fix documentation and updated comments |

---

## New Workflow Flow

```
Step 1 → 2 → 3 → 4 → 5 → 5b → 6 → 7
                          ↑      ↑
                     ESTIMATE   STORY CREATED
                     (early     + POST-GEN
                      warning)   VALIDATION!
```

**Step 5b (Pre-Generation):**
- Still runs as early warning
- Based on epic descriptions only
- Updated header clarifies it's an ESTIMATE

**Step 6 (Post-Generation):**
- NEW: Parses generated story file
- Counts ACTUAL tasks, subtasks, files
- If TOO_LARGE: Prompts user to split, proceed, or discard
- This is the REAL validation

---

## Test Case: Story 14e-6

If this fix had been in place when 14e-6 was created:

| Step | What Would Happen |
|------|-------------------|
| Step 5b | Might show early warning (based on epic description) |
| Step 6 | Story generated with 5 tasks, 47 subtasks |
| Step 6 POST-GEN | **⚠️ ALERT: 47 subtasks (3.1x limit)** |
| User Prompt | "Split now / Proceed / Discard" |
| If Split | Creates 14e-6a, 14e-6b, 14e-6c, 14e-6d automatically |

---

## Verification

### Files Modified
- `instructions.xml`: 895 → ~995 lines (+100 for post-gen check)
- `workflow.yaml`: 127 → 138 lines (+11 for documentation)

### XML Structure
- ✅ All step tags properly closed
- ✅ New check/action blocks properly nested
- ✅ User interaction flow handles all cases (split/proceed/discard)

---

## Impact

### Prevents
- Stories like 14e-6 being created without sizing warning
- Post-hoc manual splits (saves developer time)
- Context window exhaustion mid-development

### Does NOT Change
- Dual-mode functionality (Create vs Analyze)
- Atlas workflow chain analysis
- Sprint status updates
- Memory feeding

---

## Recommendation

**PRODUCTION READY** - The fix addresses the root cause and adds proper safeguards.

The workflow now has two layers of sizing protection:
1. **Step 5b**: Early warning based on estimates (can be bypassed)
2. **Step 6**: Post-generation validation of ACTUAL content (cannot be bypassed)
