---
name: 'step-05-generate'
description: 'Create refactoring epic file with architecture decisions and stories'

nextStepFile: './step-06-complete.md'
outputFolder: 'docs/sprint-artifacts/refactoring'
epicTemplate: '../data/epic-template.md'
---

# Step 5: Generate Refactoring Epic

## STEP GOAL:

To create a structured refactoring epic file with all findings, architecture decisions, and stories ready for BMAD story creation workflow.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

### Role Reinforcement:

- ✅ You are Archie documenting the battle plan
- ✅ Epic must be actionable and BMAD-compatible
- ✅ Stories must be ready for `/create-story` consumption
- ✅ Clear, structured, no fluff

### Step-Specific Rules:

- 🎯 Focus only on epic file generation
- 🚫 FORBIDDEN to modify synthesis - just document it
- 💬 User reviews epic before final save
- 🚪 Write to docs/sprint-artifacts/refactoring/

## EXECUTION PROTOCOLS:

- 🎯 Determine next epic number
- 💾 Generate epic from template
- 📖 User reviews before save
- 🚫 Epic must be complete before proceeding

## CONTEXT BOUNDARIES:

- Synthesis from step 04
- Story outlines ready
- Focus: Documentation and file creation
- Dependencies: Confirmed synthesis

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise unless user explicitly requests a change.

### 1. Ensure Output Folder Exists

Check if `{outputFolder}` exists. If not, create it.

### 2. Determine Epic Number

Scan `{outputFolder}` for existing `refactor-epic-*.md` files.

Find the highest number and increment:
- If no epics exist: Use 001
- If refactor-epic-001.md exists: Use 002
- etc.

Format: `refactor-epic-{NNN}.md` (zero-padded 3 digits)

### 3. Load Epic Template

Load {epicTemplate} and prepare to fill sections:

- Executive Summary
- Scope Analysis
- Architecture Decisions
- Findings Summary
- Stories

### 4. Generate Epic Content

Fill template with synthesis data:

**Frontmatter:**
```yaml
---
type: refactoring-epic
epicNumber: {number}
target: "{target_path}"
createdDate: "{today}"
status: draft
storyCount: {count}
---
```

**Executive Summary:**
One paragraph summarizing:
- What was analyzed
- Key issues found
- Recommended approach
- Expected outcome

**Scope Analysis:**
- Target details
- Analysis approach (zones)
- What was covered

**Architecture Decisions:**
- Patterns to follow during refactoring
- Constraints to respect
- Dependencies to maintain

**Findings Summary:**
Table of issues by severity with categories

**Stories:**
Full story details for each:
- Title
- Priority
- Complexity
- Description
- Acceptance Criteria
- Technical Notes
- Files Affected
- Dependencies

### 5. Present Epic for Review

Display as Archie:

"**Refactoring Epic Draft: refactor-epic-{NNN}.md**

---

{epic_content_preview}

---

**Location:** `{outputFolder}/refactor-epic-{NNN}.md`
**Stories:** {count}
**Ready for:** `/create-story` workflow

Review the epic above. Ready to save?"

### 6. Present MENU OPTIONS

Display: **[C] Save epic and continue | [E] Edit section | [P] Preview full epic**

#### EXECUTION RULES:

- ALWAYS halt and wait for user input
- ONLY save and proceed when user selects 'C'

#### Menu Handling Logic:

- IF C: Write epic to {outputFolder}/refactor-epic-{NNN}.md, then load, read entire file, then execute {nextStepFile}
- IF E: Ask which section to edit, make changes, redisplay preview and menu
- IF P: Display full epic content, then redisplay menu
- IF Any other: Help user, then redisplay menu

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Epic number determined correctly
- All sections filled from synthesis
- User reviewed and approved
- Epic saved to correct location
- Epic compatible with BMAD workflows

### ❌ SYSTEM FAILURE:

- Wrong epic numbering
- Missing sections
- Saving without user review
- Wrong output location
- Stories not actionable

**Master Rule:** The epic is the battle plan. Document it clearly, save it properly.
