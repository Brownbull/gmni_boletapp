---
agentName: 'Atlas'
agentType: 'expert'
agentFile: '_bmad/agents/atlas/atlas.agent.yaml'
validationDate: '2026-02-02'
stepsCompleted:
  - v-01-load-review.md
  - v-02a-validate-metadata.md
  - v-02b-validate-persona.md
  - v-02c-validate-menu.md
  - v-02d-validate-structure.md
  - v-02e-validate-sidecar.md
  - v-03-summary.md
---

# Validation Report: Atlas

## Agent Overview

**Name:** Atlas
**Type:** Expert (has sidecar folder with knowledge fragments)
**Module:** stand-alone
**hasSidecar:** true (implicit - has atlas-sidecar/ folder)
**File:** _bmad/agents/atlas/atlas.agent.yaml

---

## Validation Findings

### Metadata Validation

**Status:** ✅ PASS (Fixed 2026-02-02)

**Checks:**
- [x] name: clear display name - "Atlas"
- [x] title: concise function description - "Project Intelligence Guardian + Application Alignment Sentinel"
- [x] icon: appropriate emoji - "🗺️"
- [x] type: correct value - "expert"
- [x] id: "atlas" (ADDED)
- [x] module: "stand-alone" (ADDED)
- [x] hasSidecar: true (ADDED)

**Detailed Findings:**

*PASSING:*
- `metadata.name`: "Atlas" - Clear and descriptive
- `metadata.title`: "Project Intelligence Guardian + Application Alignment Sentinel" - Accurately describes function
- `metadata.icon`: "🗺️" - Appropriate map emoji representing project navigation
- `metadata.type`: "expert" - Correct type for agent with sidecar

*WARNINGS:*
- Missing `id` field - Should add `id: 'atlas'` (kebab-case identifier)
- Missing `module` field - Should add `module: 'stand-alone'`
- Missing `hasSidecar` field - Should add `hasSidecar: true` to explicitly indicate sidecar usage

*FAILURES:*
None - these are recommendations, not blocking issues.

---

### Persona Validation

**Status:** ✅ PASS

**Checks:**
- [x] role: specific, not generic - "Project Intelligence Guardian + Application Alignment Sentinel"
- [x] identity: defines who agent is - Clear keeper of application knowledge
- [x] communication_style: speech patterns defined - "Direct and analytical with structured observations"
- [x] principles: 9 actionable principles present

**Detailed Findings:**

*PASSING:*
- **Role:** "Project Intelligence Guardian + Application Alignment Sentinel" - Specific, unique, achievable
- **Identity:** Excellent narrative defining Atlas as "keeper of this application's soul" with clear scope
- **Communication Style:** "Direct and analytical with structured observations. Presents findings as numbered insights, flags issues with clear recommendations, and speaks with quiet authority born from deep project knowledge." - Clear speech pattern description
- **Principles:** 9 well-crafted principles including:
  1. "I believe every change ripples" - Workflow chain awareness
  2. "I believe in documented truth" - Anti-hallucination
  3. "I NEVER ASSUME - I QUOTE" - Critical fact verification
  4. "I believe in flag and suggest" - Advisor pattern
  5. "I operate as advisor, never executor" - Clear boundaries
  6. "I believe workflows matter more than features" - E2E focus
  7. "I believe in continuous learning" - Learning system integration
  8. "I believe clarity prevents drift" - Knowledge maintenance
  9. "I verify before I synthesize" - Citation verification

*WARNINGS:*
- Communication style could include memory reference patterns ("Last time you mentioned...") per BMAD expert agent standards

*FAILURES:*
None

---

### Menu Validation

**Status:** ✅ PASS

**Checks:**
- [x] Menu section exists and properly formatted
- [x] 10 menu items defined
- [x] Each item has trigger, action, and description
- [x] Actions reference internal prompts (#prompt-id format)
- [x] No prohibited patterns

**Detailed Findings:**

*PASSING:*
- 10 menu items covering comprehensive functionality:
  1. `sync` → `#sync-memory` - Reconcile knowledge with source documents
  2. `analyze` → `#analyze-impact` - Analyze changes against app intent
  3. `test` → `#test-coverage` - Identify needed tests and seed data
  4. `generate` → `#generate-seeds` - Create seed data scripts
  5. `query` → `#open-query` - Answer questions about application
  6. `validate` → `#validate-alignment` - Check work alignment
  7. `status` → `#show-status` - Show knowledge state and gaps
  8. `memory-status` → `#memory-status-scan` - Memory health scan
  9. `memory-optimize` → `#memory-optimize` - Consolidate and optimize memory
  10. `memory-restore` → `#memory-restore` - Restore from backups
- All actions reference corresponding prompts that exist in the prompts section
- Descriptions are clear and actionable
- Menu covers core Atlas capabilities (sync, analysis, testing, memory management)

*WARNINGS:*
- Triggers don't follow the `XX or fuzzy match` convention with 2-letter codes
- Descriptions don't start with `[XX]` code prefix

*FAILURES:*
None - trigger format is a style recommendation, not a requirement

---

### Structure Validation

**Status:** ✅ PASS

**Agent Type:** Expert (stand-alone with sidecar)

**Checks:**
- [x] Valid YAML syntax - Parses without errors
- [x] Required fields present - metadata, persona, critical_actions, prompts, menu
- [x] Field types correct - Arrays, strings, multi-line blocks
- [x] Consistent indentation
- [x] Agent type appropriate structure

**Detailed Findings:**

*PASSING:*
- YAML parses correctly
- Proper 2-space indentation throughout
- Multi-line strings use pipe (`|`) syntax correctly
- Array fields properly formatted with dashes
- All major sections present:
  - `agent.metadata` ✅
  - `agent.persona` ✅
  - `agent.critical_actions` ✅ (7 actions)
  - `agent.prompts` ✅ (10 prompts)
  - `agent.menu` ✅ (10 items)

*WARNINGS:*
None

*FAILURES:*
None

---

### Sidecar Validation

**Status:** ✅ PASS

**Agent Type:** Expert (with sidecar)

**Checks:**
- [x] Sidecar folder exists - `_bmad/agents/atlas/atlas-sidecar/`
- [x] Sidecar path format correct - Uses relative path from agent location
- [x] Sidecar files exist at specified paths
- [x] All referenced files present
- [x] No broken path references

**Detailed Findings:**

*PASSING:*

**Sidecar Folder Structure:**
```
atlas-sidecar/
├── atlas-index.csv              ✅ Knowledge fragment index
├── atlas-memory.md              ✅ Consolidated memory (legacy)
├── atlas-memory.md.backup       ✅ Backup file
├── instructions.md              ✅ Private instructions (250 lines)
├── memory-versions.yaml         ✅ Version tracking
├── backups/                     ✅ Versioned backups (v4, v5, v6)
├── knowledge/                   ✅ Sharded knowledge fragments
│   ├── 01-purpose.md            ✅ App mission, principles
│   ├── 02-features.md           ✅ Feature inventory
│   ├── 03-personas.md           ✅ User personas
│   ├── 04-architecture.md       ✅ Tech stack, patterns
│   ├── 05-testing.md            ✅ Test strategy
│   ├── 06-lessons.md            ✅ Retrospective learnings
│   ├── 07-process.md            ✅ Branching, deployment
│   ├── 08-workflow-chains.md    ✅ User journeys
│   ├── 09-sync-history.md       ✅ Sync log
│   ├── 10-instincts.md          ✅ Learned patterns (NEW)
│   └── README.md                ✅ Documentation
└── learning/                    ✅ Continuous learning system (NEW)
    ├── config.json              ✅ Learning configuration
    ├── observations.jsonl       ✅ Tool usage observations
    ├── instincts.json           ✅ Active instinct patterns
    └── session-state.tmp        ✅ Session persistence
```

**Critical Actions Validation:**
- ✅ Loads instructions.md: `'Load COMPLETE file _bmad/agents/atlas/atlas-sidecar/instructions.md and follow ALL protocols'`
- ✅ Consults index: `'Consult _bmad/agents/atlas/atlas-sidecar/atlas-index.csv'`
- ✅ Loads only needed fragments: `'Load ONLY the needed fragment files'`
- ✅ Workflow chain analysis: `'ALWAYS trace workflow chains and downstream impacts'`
- ✅ Flag and suggest pattern: `'surface issues with concrete recommendations'`
- ✅ Advisor boundary: `'I advise, I never execute'`
- ✅ Push alerts: `'Push alerts are ALWAYS active'`

**Index Validation (atlas-index.csv):**
- 10 knowledge fragments registered
- All fragments have id, section number, name, description, tags, and file path
- All referenced files exist in knowledge/ folder

**Instructions Validation (instructions.md):**
- 8 operational protocols defined
- Anti-hallucination rules present
- Workflow chain thinking documented
- Flag and suggest pattern documented
- Advisor boundaries clearly stated
- Sharded memory architecture explained
- Continuous learning protocol (NEW - Protocol 8)

*WARNINGS:*
- Critical actions reference paths without `{project-root}` prefix (uses relative paths from agent location instead)
- This is acceptable but differs from standard BMAD expert agent path format

*FAILURES:*
None

---

## Overall Summary

| Category | Status | Issues |
|----------|--------|--------|
| Metadata | ✅ PASS | Fixed - added id, module, hasSidecar |
| Persona | ✅ PASS | Fixed - added memory reference patterns |
| Menu | ✅ PASS | None |
| Structure | ✅ PASS | None |
| Sidecar | ✅ PASS | None |

**Overall Status: ✅ PASS (all recommendations implemented)**

---

## Recommendations

### ✅ All Recommendations Implemented (2026-02-02)

1. ~~Add missing metadata fields~~ **DONE** - Added `id`, `module`, `hasSidecar`
2. ~~Add memory reference patterns to communication_style~~ **DONE** - Added reference patterns

### Optional (Not Implemented)
3. Consider using 2-letter trigger codes for menu items (e.g., `SY` for sync) - Style preference only

---

## New Continuous Learning Features Validated

The Atlas agent has been enhanced with ECC (Everything Claude Code) Continuous Learning integration:

### Hooks Registered
- `session-start.cjs` - Injects context and high-confidence instincts
- `session-end.cjs` - Persists state and triggers evaluation
- `post-tool-use.cjs` - Captures tool observations to JSONL

### Learning Workflows Added
- `/atlas-instinct-status` - Display active instincts and statistics
- `/atlas-evolve` - Promote high-confidence patterns to knowledge
- `/atlas-sync-observations` - Manual observation processing

### Knowledge Fragment Added
- `10-instincts.md` - Evolved patterns from continuous learning

### Configuration
- `learning/config.json` - Tunable thresholds and patterns

All new continuous learning components validated and functional.

---

*Validation completed: 2026-02-02*
*Validator: BMAD Agent Validation Workflow*
