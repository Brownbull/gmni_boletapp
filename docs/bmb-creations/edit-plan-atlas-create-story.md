---
mode: edit
targetWorkflowPath: '_bmad/bmm/workflows/4-implementation/atlas-create-story'
workflowName: 'atlas-create-story'
editSessionDate: '2026-01-24'
stepsCompleted:
  - step-e-01-assess-workflow.md
  - step-e-02-discover-edits.md
hasValidationReport: true
validationStatus: COMPLETE (no issues)
---

# Edit Plan: atlas-create-story

## Workflow Snapshot

**Path:** _bmad/bmm/workflows/4-implementation/atlas-create-story
**Format:** BMAD Compliant ✅ (YAML+XML Architecture)
**Files:**
- workflow.yaml (107 lines)
- instructions.xml (483 lines)
- validation-report-2026-01-22.md

## Validation Status

✅ COMPLETE - All 5 warnings were resolved on 2026-01-22
No issues require fixing.

---

## Edit Goals

### Direct Changes

**Category:** workflow.yaml + instructions.xml (Multiple)

**Enhancement Goal:** Merge atlas-story-sizing functionality into atlas-create-story so users can either create new stories OR analyze existing stories for sizing issues from a single workflow.

**Changes Requested:**

#### workflow.yaml Changes:
- [ ] Add `split_strategies` section from atlas-story-sizing
- [ ] Add `sizing_analysis_mode` to atlas_features
- [ ] Update description to reflect dual-mode capability

#### instructions.xml Changes:
- [ ] Modify Step 0 to add mode selection after Atlas initialization
- [ ] Add new routing: "Create New" vs "Analyze Existing"
- [ ] Add Step 0c: Story Selection (for analyze mode) - from atlas-story-sizing Step 1
- [ ] Add Step 0d: Load & Parse Stories (for analyze mode) - from atlas-story-sizing Step 2
- [ ] Add Step 0e: Sizing Analysis (for analyze mode) - from atlas-story-sizing Step 3
- [ ] Add Step 0f: Split Recommendations (for analyze mode) - from atlas-story-sizing Step 4
- [ ] Add Step 0g: Execute Splits (for analyze mode) - from atlas-story-sizing Step 5
- [ ] Modify routing to continue to Step 6 (Update Sprint Status) after splits
- [ ] Ensure existing "Create New" path remains unchanged

**Rationale:**
User wants a single entry point for story management that handles both creation (with sizing checks) and retrospective sizing analysis (with split capability). This consolidates two related workflows and prevents having to run separate commands.

**Source Material:**
- atlas-story-sizing/workflow.yaml (lines 86-99: split_strategies)
- atlas-story-sizing/instructions.xml (Steps 1-5: batch analysis flow)

---

## Edits Applied

### workflow.yaml Changes ✅

1. **[YAML Config]** Updated description for dual-mode capability
   - User approved: Yes
   - Change: "Create stories..." → "Dual-mode story workflow: Create new OR analyze existing..."

2. **[YAML Config]** Added `sizing_analysis_mode: true` to atlas_features
   - User approved: Yes
   - Line 76 added

3. **[YAML Config]** Added `split_strategies` section (lines 99-112)
   - User approved: Yes
   - Added 4 split strategies: by_layer, by_feature, by_phase, by_file

4. **[YAML Config]** Updated "What Atlas adds" comments (lines 114-125)
   - User approved: Yes
   - Added item 6: DUAL-MODE capability

### instructions.xml Changes ✅

5. **[XML Instructions]** Added Step 0b: Mode Selection
   - User approved: Yes
   - Routes to [C]reate (Step 1) or [A]nalyze (Step 0c)

6. **[XML Instructions]** Added Step 0c: Select Stories to Analyze
   - User approved: Yes
   - Adapted from atlas-story-sizing Step 1

7. **[XML Instructions]** Added Step 0d: Load & Parse Stories
   - User approved: Yes
   - Adapted from atlas-story-sizing Step 2

8. **[XML Instructions]** Added Step 0e: Sizing Analysis
   - User approved: Yes
   - Adapted from atlas-story-sizing Step 3

9. **[XML Instructions]** Added Step 0f: Split Recommendations
   - User approved: Yes
   - Adapted from atlas-story-sizing Step 4

10. **[XML Instructions]** Added Step 0g: Execute Splits
    - User approved: Yes
    - Adapted from atlas-story-sizing Step 5, routes to Step 7

11. **[XML Instructions]** Updated Step 7 for dual-mode output
    - User approved: Yes
    - Create mode: Original story creation output
    - Analyze mode: Sizing analysis summary with split details

---

## Design Notes

**Mode Flow Diagram:**
```
atlas-create-story invoked
        ↓
   Step 0: Atlas Init
        ↓
   Step 0b: Mode Selection
        ↓
   ┌─────────────────┬────────────────────┐
   ↓                 ↓
[C] Create New   [A] Analyze Existing
   ↓                 ↓
Step 1-5b:       Step 0c: Select Stories
Standard         Step 0d: Parse Stories
Creation         Step 0e: Sizing Analysis
Flow             Step 0f: Split Recs
   ↓             Step 0g: Execute Splits
   ↓                 ↓
   └─────────────────┴────────────────────┘
                 ↓
          Step 6: Update Sprint Status
          Step 7: Feed Atlas Memory
```

**Key Design Decisions:**
1. Use "0x" numbering for analyze steps to keep existing step numbers stable
2. Reuse Step 6-7 for both paths (sprint status update, Atlas memory)
3. Keep sizing check in create path (Step 5b) - it's still valuable for new stories

---

## Completion Summary

**Completed:** 2026-01-24
**Session Type:** Enhancement (merge atlas-story-sizing)

**Total Edits:** 11
- Validation Fixes: 0
- Direct Changes: 11

**Files Modified:** 4
1. workflow.yaml (+19 lines → 126 total)
2. instructions.xml (+412 lines → 895 total)
3. validation-report-2026-01-24.md (new)
4. edit-plan-atlas-create-story.md (this file)

**Final Validation Status:** ✅ PASS (0 critical, 1 warning)

**Workflow is ready for:** Production use - dual-mode story management