# Atlas Puppeteer: ECC Agent Orchestration Design

**Date:** 2026-02-02
**Status:** Draft
**Based On:** ECC Framework Analysis + Claude Code Task Tool Documentation

---

## Executive Summary

Transform Atlas into a **Puppeteer Orchestrator** that calls **ECC (Everything Claude Code) agents** as sub-agents using Claude Code's Task tool. Atlas maintains project intelligence oversight while delegating specialized tasks to battle-tested ECC agents.

**Key Insight:** ECC agents are installed as a Claude Code plugin and become available as sub-agent types that can be spawned via the Task tool.

---

## 1. How ECC Plugin Works

### Installation
```bash
# Add ECC as marketplace
/plugin marketplace add affaan-m/everything-claude-code

# Install the plugin
/plugin install everything-claude-code@everything-claude-code

# Copy rules (required - plugins can't distribute rules)
git clone https://github.com/affaan-m/everything-claude-code.git
cp -r everything-claude-code/rules/* ~/.claude/rules/
```

### What Gets Installed
From `plugin.json`:
```json
{
  "name": "everything-claude-code",
  "agents": [
    "./agents/architect.md",
    "./agents/build-error-resolver.md",
    "./agents/code-reviewer.md",
    "./agents/database-reviewer.md",
    "./agents/doc-updater.md",
    "./agents/e2e-runner.md",
    "./agents/planner.md",
    "./agents/refactor-cleaner.md",
    "./agents/security-reviewer.md",
    "./agents/tdd-guide.md",
    ...
  ]
}
```

---

## 2. ECC Agents Available

| Agent | Purpose | Tools | Model |
|-------|---------|-------|-------|
| **planner** | Implementation planning, feature breakdown | Read, Grep, Glob | opus |
| **architect** | System design, scalability, tech decisions | Read, Grep, Glob | opus |
| **tdd-guide** | Test-driven development, 80%+ coverage | Read, Write, Edit, Bash, Grep | opus |
| **code-reviewer** | Quality, security, maintainability review | Read, Grep, Glob, Bash | opus |
| **security-reviewer** | OWASP Top 10, vulnerability detection | Read, Write, Edit, Bash, Grep, Glob | opus |
| **build-error-resolver** | TypeScript/build errors, minimal diffs | Read, Write, Edit, Bash, Grep, Glob | opus |
| **database-reviewer** | Query optimization, schema design (PostgreSQL/Supabase) | Read, Write, Edit, Bash, Grep, Glob | opus |
| **e2e-runner** | Playwright E2E testing | Read, Write, Edit, Bash, Grep, Glob | opus |
| **refactor-cleaner** | Dead code cleanup, consolidation | Read, Write, Edit, Bash, Grep, Glob | opus |
| **doc-updater** | Documentation, codemaps | Read, Write, Edit, Bash, Grep, Glob | opus |

### Agent Capabilities by Type

| Category | Agents | Can Modify Code? |
|----------|--------|------------------|
| **Read-only** | planner, architect | No |
| **Read + Bash** | code-reviewer | No (can run commands) |
| **Full Write** | tdd-guide, security-reviewer, build-error-resolver, database-reviewer, e2e-runner, refactor-cleaner, doc-updater | Yes |

---

## 3. How to Call ECC Agents via Task Tool

### Task Tool Schema
```typescript
interface TaskInput {
  subagent_type: string;      // Agent name or built-in type
  prompt: string;             // Full context and instructions
  description: string;        // 3-5 word summary
  model?: "sonnet" | "opus" | "haiku";
  run_in_background?: boolean;
}
```

### Calling ECC Agents

Once ECC is installed, agents become available as `subagent_type`:

```typescript
// Call the planner agent
Task({
  subagent_type: "planner",
  description: "Plan authentication feature",
  prompt: `
    Plan the implementation of user authentication.

    Context:
    - Tech stack: React + Firebase
    - Existing patterns: [from 04-architecture.md]
    - Workflow chains affected: [from 08-workflow-chains.md]

    Output: implementation-plan.md with phases and file changes
  `
})

// Call the security-reviewer agent
Task({
  subagent_type: "security-reviewer",
  description: "Security review auth code",
  prompt: `
    Review authentication code for security vulnerabilities.

    Files to review:
    - src/services/authService.ts
    - src/hooks/useAuth.ts

    Check for: OWASP Top 10, hardcoded secrets, injection risks

    Output: Security findings with severity and recommendations
  `
})
```

### Built-in vs ECC Agents

| Type | Examples | When to Use |
|------|----------|-------------|
| **Built-in** | Explore, Plan, Bash | Fast exploration, simple tasks |
| **ECC Agents** | planner, code-reviewer, tdd-guide | Specialized expertise, complex tasks |

---

## 4. Parallel Execution

### Critical Rule
**Spawn multiple agents in a SINGLE message with multiple Task tool calls for true parallelism.**

From Claude Code docs: "The Task tool can run up to 7 agents simultaneously."

### Example: Parallel Code Review
```typescript
// SINGLE message with 3 Task calls = parallel execution
Task({
  subagent_type: "code-reviewer",
  description: "Review code quality",
  prompt: "Review src/features/auth/*.ts for code quality..."
})

Task({
  subagent_type: "security-reviewer",
  description: "Security analysis",
  prompt: "Analyze src/features/auth/*.ts for vulnerabilities..."
})

Task({
  subagent_type: "tdd-guide",
  description: "Test coverage review",
  prompt: "Review test coverage for src/features/auth/*.ts..."
})
```

All three run simultaneously, results collected when all complete.

### Background Execution
```typescript
Task({
  subagent_type: "e2e-runner",
  description: "Run E2E tests",
  prompt: "Execute E2E tests for auth flow...",
  run_in_background: true  // Returns immediately, check later
})
```

---

## 5. ECC Orchestration Pattern

From the ECC Longform Guide, the recommended orchestration flow:

```
Phase 1: RESEARCH (Explore agent) → research-summary.md
Phase 2: PLAN (planner agent) → plan.md
Phase 3: IMPLEMENT (tdd-guide agent) → code changes
Phase 4: REVIEW (code-reviewer agent) → review-comments.md
Phase 5: VERIFY (build-error-resolver if needed) → done or loop back
```

### Key Rules
1. Each agent gets **ONE clear input** and produces **ONE clear output**
2. Outputs become inputs for next phase
3. Never skip phases
4. Store intermediate outputs in files

### The Sub-Agent Context Problem

From ECC: "Sub-agents exist to save context by returning summaries instead of dumping everything. But the orchestrator has semantic context the sub-agent lacks."

**Solution - Iterative Retrieval Pattern:**
1. Orchestrator evaluates every sub-agent return
2. Ask follow-up questions before accepting
3. Sub-agent refines, returns improved answer
4. Loop until sufficient (max 3 cycles)

**Key:** Pass **objective context**, not just the query.

---

## 6. Atlas + ECC Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ATLAS PUPPETEER                               │
│              (Project Intelligence + Orchestrator)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │         ATLAS KNOWLEDGE LAYER                            │    │
│  │  • 08-workflow-chains.md (user journeys)                │    │
│  │  • 04-architecture.md (patterns)                         │    │
│  │  • 06-lessons.md (historical learnings)                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                    Context Injection                             │
│                           │                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              ECC AGENT LAYER (via Task tool)             │    │
│  │                                                          │    │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │    │
│  │   │ planner │  │architect│  │tdd-guide│  │ code-   │   │    │
│  │   │         │  │         │  │         │  │reviewer │   │    │
│  │   └─────────┘  └─────────┘  └─────────┘  └─────────┘   │    │
│  │                                                          │    │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │    │
│  │   │security-│  │ build-  │  │database-│  │  e2e-   │   │    │
│  │   │reviewer │  │resolver │  │reviewer │  │ runner  │   │    │
│  │   └─────────┘  └─────────┘  └─────────┘  └─────────┘   │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                    Result Synthesis                              │
│                           │                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │         ATLAS SYNTHESIS LAYER                            │    │
│  │  • Merge agent outputs                                   │    │
│  │  • Add workflow chain analysis                           │    │
│  │  • Feed learnings to knowledge fragments                 │    │
│  │  • Generate unified report                               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Workflow Types for Atlas

| Workflow | ECC Agent Sequence | When to Use |
|----------|-------------------|-------------|
| `feature` | planner → architect → tdd-guide → code-reviewer | New feature |
| `bugfix` | Explore → tdd-guide → code-reviewer | Bug fix |
| `refactor` | architect → refactor-cleaner → code-reviewer | Refactoring |
| `security` | security-reviewer → architect → code-reviewer | Security audit |
| `review` | code-reviewer + security-reviewer + tdd-guide (parallel) | PR review |
| `build-fix` | build-error-resolver | Build failures |
| `test` | tdd-guide → e2e-runner | Test creation |

---

## 8. Example: Feature Implementation

```
User: "Implement shared groups invitation system"

ATLAS ORCHESTRATION:
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 1: CONTEXT (Atlas)                                         │
│                                                                   │
│ Atlas loads:                                                      │
│ - 08-workflow-chains.md: Identify affected user journeys         │
│ - 04-architecture.md: Current patterns and constraints           │
│ - 06-lessons.md: Past mistakes to avoid                          │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 2: PLAN (planner agent)                                    │
│                                                                   │
│ Task({                                                           │
│   subagent_type: "planner",                                      │
│   prompt: "Plan invitation system implementation.                │
│           Context: [workflow chains, architecture patterns]      │
│           Output: Phased plan with file changes"                 │
│ })                                                               │
│                                                                   │
│ Output: implementation-plan.md                                   │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 3: ARCHITECTURE (architect agent)                          │
│                                                                   │
│ Task({                                                           │
│   subagent_type: "architect",                                    │
│   prompt: "Review plan against Firestore patterns.               │
│           Input: implementation-plan.md                          │
│           Check: data model, security rules, indexes"            │
│ })                                                               │
│                                                                   │
│ Output: architecture-review.md                                   │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 4: IMPLEMENT (tdd-guide agent)                             │
│                                                                   │
│ Task({                                                           │
│   subagent_type: "tdd-guide",                                    │
│   prompt: "Implement invitation system using TDD.                │
│           Plan: implementation-plan.md                           │
│           Architecture: architecture-review.md                   │
│           Ensure 80%+ test coverage"                             │
│ })                                                               │
│                                                                   │
│ Output: Code changes + tests                                     │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 5: PARALLEL REVIEW (3 agents simultaneously)               │
│                                                                   │
│ Task({ subagent_type: "code-reviewer", ... })                    │
│ Task({ subagent_type: "security-reviewer", ... })                │
│ Task({ subagent_type: "tdd-guide", prompt: "Verify coverage" })  │
│                                                                   │
│ All three run in parallel, results collected together            │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 6: SYNTHESIS (Atlas)                                       │
│                                                                   │
│ Atlas:                                                           │
│ - Merges all review outputs                                      │
│ - Adds workflow chain impact analysis                            │
│ - Identifies cross-cutting concerns                              │
│ - Feeds learnings to knowledge fragments:                        │
│   * 02-features.md (new feature documented)                      │
│   * 08-workflow-chains.md (new invite flow)                      │
│   * 06-lessons.md (if issues found)                              │
│                                                                   │
│ Output: orchestration-report.md                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 9. Updated Atlas Agent Configuration

### New Critical Actions
```yaml
critical_actions:
  # Existing Atlas actions...
  - 'Load COMPLETE file _bmad/agents/atlas/atlas-sidecar/instructions.md'
  - 'Consult atlas-index.csv for relevant knowledge fragments'

  # NEW: ECC Orchestration
  - 'When orchestrating, load 08-workflow-chains.md for context injection'
  - 'Call ECC agents via Task tool: planner, architect, tdd-guide, code-reviewer, security-reviewer, build-error-resolver'
  - 'For parallel execution, spawn multiple agents in a SINGLE message'
  - 'Pass Atlas context (workflow chains, architecture patterns) to every sub-agent'
  - 'After orchestration, synthesize outputs and feed learnings to knowledge fragments'
```

### New Principles
```yaml
principles:
  # Existing principles...

  # NEW: Orchestration
  - I orchestrate ECC agents. I spawn planner, architect, tdd-guide, code-reviewer, security-reviewer via Task tool while injecting Atlas context.
  - I spawn in parallel when tasks are independent. Single message, multiple Task calls.
  - I pass objective context to sub-agents. They need to understand the PURPOSE, not just the query.
  - I use iterative retrieval. If a sub-agent's response is incomplete, I ask follow-up questions (max 3 cycles).
  - I synthesize, not just aggregate. After collecting outputs, I add workflow chain analysis and identify cross-cutting concerns.
```

---

## 10. Prerequisites

### For This Integration to Work

1. **Install ECC Plugin:**
   ```bash
   /plugin marketplace add affaan-m/everything-claude-code
   /plugin install everything-claude-code@everything-claude-code
   ```

2. **Install ECC Rules:**
   ```bash
   git clone https://github.com/affaan-m/everything-claude-code.git
   cp -r everything-claude-code/rules/* ~/.claude/rules/
   ```

3. **Verify Installation:**
   ```bash
   /plugin list everything-claude-code@everything-claude-code
   ```

4. **Available Commands After Install:**
   - `/plan` - Invoke planner agent
   - `/code-review` - Invoke code-reviewer
   - `/tdd` - Invoke tdd-guide
   - `/build-fix` - Invoke build-error-resolver
   - `/refactor-clean` - Invoke refactor-cleaner

---

## 11. Implementation Phases

### Phase 1: ECC Installation (Day 1)
- [ ] Install ECC plugin in boletapp
- [ ] Copy ECC rules to project
- [ ] Verify agents are accessible
- [ ] Test basic agent invocation

### Phase 2: Atlas Integration (Day 2-3)
- [ ] Update Atlas agent YAML with ECC orchestration prompts
- [ ] Add orchestration menu commands
- [ ] Create handoff document templates
- [ ] Test sequential workflow (planner → tdd-guide)

### Phase 3: Parallel Execution (Day 4)
- [ ] Implement parallel review workflow
- [ ] Test multi-agent parallel spawning
- [ ] Create merge/synthesis logic

### Phase 4: Knowledge Integration (Day 5)
- [ ] Implement post-orchestration knowledge feeding
- [ ] Auto-update workflow chains
- [ ] Test end-to-end feature workflow

---

## 12. Sources

- [Claude Code Task Tool Documentation](https://code.claude.com/docs/en/sub-agents)
- [Claude Code Plugins](https://code.claude.com/docs/en/plugins)
- [ECC GitHub Repository](https://github.com/affaan-m/everything-claude-code)
- [ECC Longform Guide](https://x.com/affaanmustafa/status/2014040193557471352)
- [Multi-Agent Orchestration Patterns](https://dev.to/bredmond1019/multi-agent-orchestration-running-10-claude-instances-in-parallel-part-3-29da)
- [Claude Plugins Registry](https://claude-plugins.dev/)

---

*Proposal ready for review and approval.*
