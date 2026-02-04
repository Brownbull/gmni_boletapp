# Atlas Quick Reference

> **Atlas** - Project Intelligence Guardian + Puppeteer Orchestrator

---

## Core Commands

| Command | What It Does |
|---------|--------------|
| `sync` | Reconcile knowledge with PRD, architecture, stories |
| `analyze` | Trace workflow chain impact of proposed changes |
| `query` | Ask anything about the application |
| `validate` | Check work alignment with PRD/arch/stories |
| `status` | Show knowledge state and gaps |

## Testing Commands

| Command | What It Does |
|---------|--------------|
| `test` | Identify needed tests and seed data |
| `generate` | Create seed data scripts with documentation |

## Memory Commands

| Command | What It Does |
|---------|--------------|
| `memory-status` | Scan memory health, size, optimization candidates |
| `memory-optimize` | Consolidate memory with versioned backup |
| `memory-restore` | Restore from previous backup |

---

## Orchestration Commands (Puppeteer)

| Command | What It Does |
|---------|--------------|
| `orchestrate` | Execute multi-agent workflow (feature\|bugfix\|refactor\|review\|story) |
| `spawn` | Spawn a specific BMAD agent as sub-agent |
| `parallel` | Run parallel multi-agent review (tdd-guide + architect + code-reviewer + security-reviewer) |
| `handoff` | Create handoff document for agent-to-agent transfer |

### Workflow Types (ECC Agents)
```
feature   : planner → architect → tdd-guide → code-reviewer
bugfix    : Explore → build-error-resolver → tdd-guide
refactor  : architect → refactor-cleaner → tdd-guide
review    : tdd-guide + security-reviewer + architect (parallel)
story     : planner → tdd-guide → code-reviewer
epic-plan : planner → architect
```

### Available Sub-Agents (ECC Framework)
| Agent | subagent_type | Purpose |
|-------|---------------|---------|
| Planner | everything-claude-code:planner | Implementation planning |
| Architect | everything-claude-code:architect | System design, patterns |
| TDD Guide | everything-claude-code:tdd-guide | Test-first development |
| Code Reviewer | everything-claude-code:code-reviewer | Quality, maintainability |
| Security Reviewer | everything-claude-code:security-reviewer | OWASP, vulnerabilities |
| Build Resolver | everything-claude-code:build-error-resolver | Build/TS error fixing |
| Database Reviewer | everything-claude-code:database-reviewer | Query optimization |
| E2E Runner | everything-claude-code:e2e-runner | E2E test generation |
| Refactor Cleaner | everything-claude-code:refactor-cleaner | Dead code removal |
| Doc Updater | everything-claude-code:doc-updater | Documentation updates |
| Explore | Explore | Fast codebase exploration |
| Plan | Plan | Quick implementation planning |
| Bash | Bash | Command execution |

### Parallel Execution Rule
```
CRITICAL: Spawn multiple agents in a SINGLE message
with multiple Task calls for true parallelism.
```

---

## Learning System Commands

| Slash Command | When to Use |
|---------------|-------------|
| `/atlas-instinct-status` | Check learning progress, view active patterns |
| `/atlas-evolve` | Promote patterns ≥0.8 confidence to knowledge |
| `/atlas-sync-observations` | Force observation analysis (don't wait for session end) |

### Confidence Levels
```
0.3-0.4  Tentative     Newly detected
0.5-0.6  Moderate      Confirmed 2-3 times
0.7-0.8  Strong        Consistently observed
0.8-0.9  Evolution     Ready for permanent knowledge
```

---

## Development Workflow Commands

| Slash Command | Phase | Purpose |
|---------------|-------|---------|
| `/atlas-create-story` | Story Creation | Create with workflow chain analysis |
| `/atlas-story-context` | Pre-Implementation | Load relevant context |
| `/atlas-story-ready` | Readiness Check | Validate dependencies and ACs |
| `/atlas-dev-story` | Implementation | Pattern-guided development |
| `/atlas-code-review` | Review | ADVERSARIAL validation |
| `/atlas-deploy-story` | Deployment | Pre/post-deployment checks |
| `/atlas-story-done` | Completion | Capture learnings |

## Planning Commands

| Slash Command | Purpose |
|---------------|---------|
| `/atlas-sprint-planning` | Plan with historical velocity |
| `/atlas-sprint-status` | Current progress and risks |
| `/atlas-story-sizing` | Detect oversized stories |
| `/atlas-correct-course` | Handle blockers mid-sprint |
| `/atlas-retrospective` | Epic retro with memory feeding |

## Other Commands

| Slash Command | Purpose |
|---------------|---------|
| `/atlas-e2e` | Persona-driven E2E test generation |
| `/atlas-epic-tech-context` | Technical context for epic planning |

---

## Key Protocols

### 1. Anti-Hallucination
- **QUOTE** directly from docs for critical facts
- Say **"NOT FOUND IN DOCS"** if not explicitly documented
- **CITE** source file and section

### 2. Workflow Chain Thinking
```
Upstream Dependencies → The Change → Downstream Impacts
```
Always trace the full chain before advising.

### 3. Flag and Suggest Pattern
```
**Issue:** [What's wrong]
**Reference:** [PRD/Arch/Story section]
**Impact:** [What it affects]
**Recommendations:**
1. [Option A]
2. [Option B]
```

### 4. Puppeteer Orchestrator
- **Spawn** specialized agents for focused tasks
- **Coordinate** handoffs between agent phases
- **Synthesize** outputs with workflow chain analysis
- Decisions still belong to the team

### 5. Parallel Execution
- Independent tasks → spawn in parallel
- Use SINGLE message with MULTIPLE Task calls
- Merge results, resolve conflicts

### 6. Push Alerts (Always Active)
Proactively flag during:
- Story creation (workflow impacts)
- Code review (coverage gaps)
- Architecture changes (pattern conflicts)

---

## Knowledge Fragments

| # | Fragment | Contains |
|---|----------|----------|
| 01 | purpose.md | Mission, principles, target market |
| 02 | features.md | Feature inventory, connections |
| 03 | personas.md | User personas, goals |
| 04 | architecture.md | Tech stack, patterns, decisions |
| 05 | testing.md | Test strategy, coverage |
| 06 | lessons.md | Retrospective learnings |
| 07 | process.md | Branching, deployment |
| 08 | workflow-chains.md | User journeys |
| 09 | sync-history.md | Sync log, drift tracking |
| 10 | instincts.md | Learned patterns |

**Loading Rule:** Consult `atlas-index.csv` first, load only 2-3 relevant fragments.

---

## File Locations

```
_bmad/agents/atlas/
├── atlas.agent.yaml              # Agent definition
├── ATLAS-QUICK-REFERENCE.md      # This file
├── atlas-workflows-reference.md  # Full workflow docs
├── hooks/                        # Learning hooks
│   ├── session-start.cjs
│   ├── session-end.cjs
│   ├── post-tool-use.cjs
│   └── evaluate-session.cjs
└── atlas-sidecar/
    ├── atlas-index.csv           # Fragment index
    ├── instructions.md           # Private protocols
    ├── knowledge/                # 10 sharded fragments
    └── learning/                 # Learning system data
        ├── config.json
        ├── observations.jsonl
        ├── instincts.json
        └── session-state.tmp
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Hooks not firing | Check `.claude/settings.local.json` has hooks registered |
| No observations | Verify `learning.enabled: true` in config.json |
| Instincts not evolving | Run `/atlas-instinct-status`, need 10+ observations |
| Memory not loading | Check `atlas-index.csv` paths match actual files |

---

*Last updated: 2026-02-02*
