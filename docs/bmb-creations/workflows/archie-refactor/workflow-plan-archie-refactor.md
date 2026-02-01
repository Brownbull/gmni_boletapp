---
stepsCompleted: ['step-01-discovery', 'step-02-classification', 'step-03-requirements', 'step-04-tools', 'step-05-plan-review', 'step-06-design']
created: 2026-01-29
status: DESIGN_COMPLETE
approvedDate: 2026-01-29
workflowName: archie-refactor
targetPath: _bmad/bmm/workflows/archie-refactor/
---

# Workflow Creation Plan: archie-refactor

## Discovery Notes

**User's Vision:**
Create a refactoring analysis workflow that bridges BMAD's agent system with Claude Code's subagent orchestration. The workflow leverages Archie (react-opinionated-architect) as the strategic brain to analyze scope and determine approach, then deploys the archie-refactor-orchestrator subagent for parallel codebase exploration. Output is a reusable epic file that can feed into story creation workflows.

**Who It's For:**
- Developers facing large refactoring efforts
- Teams needing to break down complex modules
- Projects where context window limits single-pass analysis

**What It Produces:**
- Epic file with architecture decisions and story descriptions
- Located in `docs/sprint-artifacts/` for integration with BMAD pipeline
- Ready for `/create-story` or `/sprint-planning` consumption

**Key Insights:**
1. **Two-tier architecture**: Archie (agent) provides strategic analysis; subagent handles tactical parallel exploration
2. **Archie has authority**: react-opinionated-architect is the "proof of action" with full project context
3. **Epic file as artifact**: Output designed for BMAD pipeline integration
4. **Workflow chaining**: Post-analysis options connect to story creation and sprint planning

## Workflow Flow

```
Target Input → Archie Analysis → Scope Decision → Subagent Deployment →
Synthesis → Epic Generation → Post-Analysis Menu
```

## Integration Points

- **Agent**: `bmad:bmm:agents:react-opinionated-architect`
- **Subagent**: `.claude/agents/archie-refactor-orchestrator.md`
- **Output chains to**: `create-story`, `sprint-planning`
- **Output location**: `docs/sprint-artifacts/refactoring/`

## Post-Analysis Options

| Option | Action |
|--------|--------|
| [S] Create Stories | Chain to `/create-story` with epic file |
| [P] Sprint Planning | Chain to `/sprint-planning` with new stories |
| [R] Re-run | Re-analyze with different scope |
| [D] Done | Exit workflow |

---

## Classification Decisions

**Workflow Name:** archie-refactor
**Target Path:** `_bmad/bmm/workflows/archie-refactor/`

**4 Key Decisions:**
1. **Document Output:** true (epic file with architecture decisions and stories)
2. **Module Affiliation:** BMM (software development workflows)
3. **Session Type:** single-session (subagent handles complexity)
4. **Lifecycle Support:** create-only (launcher workflow)

**Structure Implications:**
- Single `steps-c/` folder (no edit/validate modes)
- No continuation logic needed
- Simple init step
- Focus on orchestration, not complex state tracking

---

## Requirements

**Flow Structure:**
- Pattern: Linear (6 steps)
- Phases: Init → Archie Analysis → Scope Confirm → Subagent Deploy → Synthesis → Complete
- Estimated steps: 6
- Early exit: If no issues found, exit with notice

**User Interaction:**
- Style: Guided with checkpoints
- Decision points:
  - Scope confirmation before subagent deployment
  - Epic review before saving
  - Post-analysis action selection
- Checkpoint frequency: 2-3 times during workflow

**Inputs Required:**
- Required: Target path (file or directory to analyze)
- Optional: Specific focus area (e.g., "state management only")
- Prerequisites: Target must exist in codebase

**Output Specifications:**
- Type: Document (structured epic file)
- Format: Structured
- Naming: `refactor-epic-{number}.md`
- Location: `docs/sprint-artifacts/refactoring/`
- Sections:
  - Executive Summary
  - Scope Analysis
  - Architecture Decisions
  - Findings Summary (table)
  - Stories (with priority, complexity, AC, files)

**Success Criteria:**
- Target analyzed by Archie + subagents
- Issues identified and prioritized by severity
- Epic file generated with actionable stories
- Stories ready for `/create-story` consumption
- OR clean exit if no issues found

**Instruction Style:**
- Overall: Mixed
- Prescriptive: Orchestration steps (subagent deployment, result gathering)
- Intent-based: Archie analysis (persona-driven assessment)

---

## Tools Configuration

**Core BMAD Tools:**
- **Party Mode:** excluded - Not needed for orchestration workflow
- **Advanced Elicitation:** excluded - Analysis handled by Archie + subagent
- **Brainstorming:** excluded - Not a creative workflow

**LLM Features:**
- **Sub-Agents:** included - Core feature, spawns archie-refactor-orchestrator
- **File I/O:** included - Writes epic file to docs/sprint-artifacts/refactoring/
- **Web-Browsing:** excluded - Not needed
- **Sub-Processes:** excluded - Not needed

**Memory:**
- Type: single-session
- Tracking: None needed - subagent handles complexity

**External Integrations:**
- BMAD Agent: react-opinionated-architect (loaded in Phase 2)
- Claude Code Subagent: archie-refactor-orchestrator (spawned in Phase 3)
- No additional MCP or external tools

**Installation Requirements:**
- None - all tools are built-in

---

## Workflow Design

### File Structure
```
_bmad/bmm/workflows/archie-refactor/
├── workflow.md
├── data/
│   └── epic-template.md
└── steps-c/
    ├── step-01-init.md
    ├── step-02-analyze.md
    ├── step-03-orchestrate.md
    ├── step-04-synthesize.md
    ├── step-05-generate.md
    └── step-06-complete.md
```

### Step Sequence

| Step | Type | Goal | Menu |
|------|------|------|------|
| 01-init | Init (Non-continuable) | Accept target, validate, load Archie | Auto-proceed |
| 02-analyze | Middle (Standard) | Archie scope analysis | C (confirm scope) |
| 03-orchestrate | Middle (Simple) | Spawn subagent | Auto-proceed |
| 04-synthesize | Middle (Standard) | Consolidate findings | C |
| 05-generate | Middle (Standard) | Create epic file | Review + C |
| 06-complete | Final | Post-analysis menu | S/P/R/D |

### Special Features
- Subagent integration in step-03
- Early exit in step-02 if no issues
- Workflow chaining in step-06 to create-story/sprint-planning
- Auto-incrementing epic numbering

---

## Foundation Build Complete

**Created:**
- Folder structure at: `_bmad/bmm/workflows/archie-refactor/`
- `workflow.md` - Main entry point
- `data/epic-template.md` - Structured epic template

**Configuration:**
- Workflow name: archie-refactor
- Continuable: No (single-session)
- Document output: Yes (structured epic)
- Mode: create-only

**Next Steps:**
- Build 6 step files in `steps-c/`
