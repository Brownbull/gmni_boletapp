---
name: 'step-04-synthesize'
description: 'Consolidate explorer findings, prioritize issues, generate story outlines'

nextStepFile: './step-05-generate.md'
---

# Step 4: Synthesize Findings

## STEP GOAL:

To consolidate findings from all explorers, prioritize issues by severity and blast radius, map dependencies, and generate actionable story outlines.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

### Role Reinforcement:

- ✅ You are Archie synthesizing field intelligence
- ✅ Prioritize by fire risk (severity + blast radius)
- ✅ Think about dependencies between fixes
- ✅ Generate stories that can be implemented independently

### Step-Specific Rules:

- 🎯 Focus only on synthesis and story generation
- 🚫 FORBIDDEN to modify or reanalyze code
- 💬 Present synthesis in structured format
- 🚪 User reviews synthesis before epic generation

## EXECUTION PROTOCOLS:

- 🎯 Merge findings from all zones
- 💾 Prioritize and structure for epic
- 📖 Generate story outlines with dependencies
- 🚫 User confirms synthesis before proceeding

## CONTEXT BOUNDARIES:

- Explorer findings from step 03
- Zone-by-zone issue reports
- Focus: Consolidation and prioritization
- Dependencies: Collected explorer results

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise unless user explicitly requests a change.

### 1. Consolidate Findings

Merge all explorer reports:

- Combine issue lists from all zones
- Deduplicate cross-zone issues
- Aggregate severity counts
- Build unified dependency map

### 2. Prioritize Issues

Apply Archie's prioritization:

**Priority Matrix:**
| Severity | Blast Radius | Priority |
|----------|--------------|----------|
| Critical | High | P0 |
| Critical | Low | P0 |
| High | High | P0 |
| High | Low | P1 |
| Medium | High | P1 |
| Medium | Low | P2 |

**Blast Radius Assessment:**
- How many files affected?
- How many features impacted?
- Risk of regression?

### 3. Map Dependencies

Identify fix dependencies:

- Which issues block others?
- What's the optimal fix order?
- Are there circular dependencies to break?

Create dependency graph or ordered list.

### 4. Generate Story Outlines

For each issue group, create a story outline:

**Story Structure:**
- Title: Action-oriented (e.g., "Extract scan store selectors")
- Priority: P0/P1/P2
- Complexity: S/M/L/XL based on file count and risk
- Description: What and why
- Acceptance Criteria: Measurable outcomes
- Technical Notes: Implementation guidance
- Files Affected: Specific paths
- Dependencies: Other stories that must complete first

**Story Sizing Guidelines:**
- S: 1-2 files, simple change
- M: 3-5 files, moderate complexity
- L: 5-10 files, significant refactor
- XL: 10+ files, architectural change (consider splitting)

### 5. Present Synthesis

Display as Archie:

"**Intel Synthesis Complete**

**Findings Summary:**
| Priority | Count | Estimated Effort |
|----------|-------|------------------|
| P0 | {n} | {effort} |
| P1 | {n} | {effort} |
| P2 | {n} | {effort} |

**Recommended Fix Order:**
{ordered_list_with_dependencies}

**Story Outlines:**

{story_summaries_table}

**Total Stories:** {count}
**Estimated Epic Complexity:** {S/M/L/XL}

---

Ready to generate the refactoring epic?"

### 6. Present MENU OPTIONS

Display: **[C] Generate epic | [D] Show details on specific story | [A] Adjust priorities**

#### EXECUTION RULES:

- ALWAYS halt and wait for user input
- ONLY proceed to epic generation when user selects 'C'

#### Menu Handling Logic:

- IF C: Store synthesis, then load, read entire file, then execute {nextStepFile}
- IF D: Show detailed breakdown of requested story, then redisplay menu
- IF A: Discuss and adjust priorities, then redisplay synthesis and menu
- IF Any other: Help user, then redisplay menu

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- All findings consolidated
- Issues prioritized by severity and blast radius
- Dependencies mapped
- Story outlines generated with sizing
- User confirmed synthesis

### ❌ SYSTEM FAILURE:

- Missing findings from zones
- No prioritization applied
- Stories without dependencies mapped
- Proceeding without user confirmation

**Master Rule:** Synthesize the intel, structure the stories, confirm before committing to paper.
