---
name: archie-refactor
description: "Refactoring analysis workflow using Archie (react-opinionated-architect) for strategic scoping and Claude Code subagent for parallel codebase exploration. Outputs structured epic files with architecture decisions and stories."
web_bundle: true
---

# Archie Refactor Workflow

**Goal:** Analyze large files or modules for refactoring opportunities using a two-tier architecture: Archie for strategic analysis and a Claude Code subagent for parallel exploration. Produces BMAD-compatible epic files ready for story creation.

**Your Role:** You are orchestrating a refactoring analysis workflow. You will load the react-opinionated-architect agent for strategic analysis, then deploy the archie-refactor-orchestrator subagent for parallel code exploration. Your job is to guide the user through scope confirmation and deliver actionable refactoring stories.

---

## WORKFLOW ARCHITECTURE

This uses **step-file architecture** for disciplined execution:

### Core Principles

- **Micro-file Design**: Each step is a self-contained instruction file
- **Just-In-Time Loading**: Only the current step file is in memory
- **Sequential Enforcement**: Steps completed in order
- **Orchestration Focus**: Delegates heavy analysis to agent and subagent

### Step Processing Rules

1. **READ COMPLETELY**: Always read the entire step file before taking any action
2. **FOLLOW SEQUENCE**: Execute numbered sections in order
3. **WAIT FOR INPUT**: Halt at menus and wait for user selection
4. **CHECK CONTINUATION**: Only proceed when user selects appropriate option
5. **LOAD NEXT**: When directed, load and execute the next step file

### Critical Rules

- **NEVER** load multiple step files simultaneously
- **ALWAYS** read entire step file before execution
- **NEVER** skip steps unless explicitly optional
- **ALWAYS** follow exact instructions in step files
- **ALWAYS** halt at menus and wait for input

---

## INITIALIZATION SEQUENCE

### 1. Configuration Loading

Load and read config from `{project-root}/_bmad/bmm/config.yaml`:

- `user_name`, `communication_language`, `output_folder`

### 2. Accept Target

The workflow expects a target path as an argument:

```
/bmad:bmm:workflows:archie-refactor <target-path>
```

Where `<target-path>` is:
- A file path (e.g., `src/features/scan/store/index.ts`)
- A directory path (e.g., `src/features/scan/`)

If no target provided, prompt: "What file or directory would you like to analyze for refactoring?"

### 3. Route to First Step

Load, read completely, then execute `steps-c/step-01-init.md`

---

## WORKFLOW FLOW

```
step-01-init → step-02-analyze → step-03-orchestrate →
step-04-synthesize → step-05-generate → step-06-complete
```

**Early Exit:** If Archie determines no significant issues exist, the workflow exits early at step-02 with a notice.

**Post-Analysis Options:** At step-06, user can chain to:
- `/create-story` - Create stories from the epic
- `/sprint-planning` - Run sprint planning
- Re-run with different scope
- Exit

---

## OUTPUT

- **Location:** `docs/sprint-artifacts/refactoring/`
- **Naming:** `refactor-epic-{number}.md`
- **Format:** Structured epic with architecture decisions and stories
