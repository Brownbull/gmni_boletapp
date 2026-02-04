# Atlas Agent - Workflows & Commands Reference

> Consolidated reference for all Atlas workflows, orchestration, and continuous learning features.
> Last Updated: 2026-02-02
> **Role:** Project Intelligence Guardian + Puppeteer Orchestrator

## Quick Reference

### Orchestration Commands (NEW)

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `orchestrate` | Multi-agent workflow execution | feature\|bugfix\|refactor\|review\|story |
| `spawn` | Spawn BMAD agent as sub-agent | Focused task delegation |
| `parallel` | Parallel multi-agent review | PR review, comprehensive analysis |
| `handoff` | Create agent handoff document | Between workflow phases |

### Learning Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/atlas-instinct-status` | View learned patterns | Check learning progress |
| `/atlas-evolve` | Promote patterns to knowledge | When instincts reach 0.8+ confidence |
| `/atlas-sync-observations` | Process observations manually | Force pattern analysis |
| `/atlas-create-story` | Create story with workflow analysis | Story creation phase |
| `/atlas-dev-story` | Implement with pattern guidance | Implementation phase |
| `/atlas-code-review` | ADVERSARIAL review with validation | Code review phase |
| `/atlas-deploy-story` | Pre/post-deployment validation | Deployment phase |
| `/atlas-retrospective` | Epic retro with memory feeding | Epic completion |
| `/atlas-sprint-planning` | Planning with historical velocity | Sprint planning |
| `/atlas-sprint-status` | Current project status | Status check |
| `/atlas-story-sizing` | Analyze story size constraints | Story refinement |
| `/atlas-story-context` | Load relevant context | Before implementation |
| `/atlas-story-ready` | Mark ready with validation | Story readiness check |
| `/atlas-story-done` | Completion with learning capture | Story completion |
| `/atlas-correct-course` | Course correction guidance | When blocked |
| `/atlas-epic-tech-context` | Technical context for epic | Epic planning |
| `/atlas-e2e` | Persona-driven E2E testing | Test planning |

---

## Continuous Learning System

### Overview

Atlas continuously learns from session observations using ECC (Everything Claude Code) patterns integrated with Atlas's sharded memory architecture.

### Hooks (Automatic)

| Hook | Trigger | Action |
|------|---------|--------|
| `session-start.cjs` | Session startup, resume, compact | Inject context + high-confidence instincts |
| `session-end.cjs` | Session clear | Persist state, trigger evaluation |
| `post-tool-use.cjs` | Edit, Write, Bash, Read, Grep, Glob | Capture observation to JSONL |
| `evaluate-session.cjs` | Session end (10+ observations) | Detect patterns, update instincts |

### Confidence Scale

| Range | Level | Meaning |
|-------|-------|---------|
| 0.3-0.4 | Tentative | Newly detected, needs confirmation |
| 0.5-0.6 | Moderate | Confirmed 2-3 times |
| 0.7-0.8 | Strong | Consistently observed pattern |
| 0.8-0.9 | Evolution Ready | Candidate for permanent knowledge |

### Knowledge Evolution Path

```
Tool Usage
  → Observation (observations.jsonl)
    → Pattern Detection (evaluate-session.cjs)
      → Instinct (instincts.json, 0.3-0.8 confidence)
        → Evolved Pattern (10-instincts.md, permanent)
          → Core Knowledge (06-lessons.md, after review)
```

### Learning Workflows

#### `/atlas-instinct-status`
**Purpose:** Display active instincts and learning statistics

**Output:**
- Learning system status (enabled/disabled)
- Active instincts with confidence levels
- Observation statistics by tool
- Evolution candidates (>= 0.8 confidence)
- Decay warnings (stale instincts)

#### `/atlas-evolve`
**Purpose:** Promote high-confidence instincts to permanent knowledge

**Process:**
1. Identify instincts >= 0.8 confidence
2. Review each candidate (approve/reject/edit/skip)
3. Format as knowledge nugget
4. Append to `10-instincts.md`
5. Update sync history

#### `/atlas-sync-observations`
**Purpose:** Manually trigger observation analysis

**Use When:**
- Want immediate pattern analysis
- Session didn't reach 10 observation threshold
- Testing the learning system

---

## Development Lifecycle Workflows

### Phase 1: Story Creation

#### `/atlas-create-story`
**Purpose:** Create stories with workflow chain analysis

**Features:**
- Analyzes requirements against existing workflows
- Push alerts if story affects existing flows
- Suggests additional ACs based on workflow impact
- Dual-mode: create new OR analyze existing stories

**Atlas Integration:**
- Consults: `08-workflow-chains.md`
- Feeds: Story intent to memory

### Phase 2: Implementation

#### `/atlas-dev-story`
**Purpose:** Atlas-enhanced story implementation

**Features:**
- Pattern guidance from architecture
- Testing pattern recommendations
- Lessons learned avoidance
- Workflow chain awareness

**Atlas Integration:**
- Consults: `04-architecture.md`, `05-testing.md`, `06-lessons.md`
- Feeds: Implementation learnings

#### `/atlas-story-context`
**Purpose:** Load relevant context for implementation

**Use Before:** Starting work on a story to understand dependencies

#### `/atlas-story-ready`
**Purpose:** Mark story ready for development

**Validates:**
- Dependencies met
- ACs complete
- Testing patterns identified

### Phase 3: Code Review

#### `/atlas-code-review`
**Purpose:** ADVERSARIAL review with Atlas validation

**Features:**
- Architecture pattern compliance
- Workflow chain validation
- Coverage gap detection
- Push alerts on drift

**Atlas Integration:**
- Consults: `04-architecture.md`, `08-workflow-chains.md`
- Feeds: `04-architecture.md`, `05-testing.md`
- Alerts: Architectural violations, coverage gaps

### Phase 4: Deployment

#### `/atlas-deploy-story`
**Purpose:** Pre/post-deployment validation

**Features:**
- Pre-deployment checklist
- Post-deployment verification
- Memory feeding with deployment outcomes

#### `/atlas-story-done`
**Purpose:** Story completion with learning capture

**Features:**
- Verify all ACs implemented
- Capture lessons learned
- Update workflow chains if affected

---

## Planning & Status Workflows

#### `/atlas-sprint-planning`
**Purpose:** Epic planning with workflow context

**Features:**
- Historical velocity consultation
- Pattern-informed estimation
- Risk identification
- Workflow chain context

#### `/atlas-sprint-status`
**Purpose:** Summarize current project status

**Output:**
- Epic progress
- Story status
- Blockers and risks
- Workflow chain health

#### `/atlas-story-sizing`
**Purpose:** Analyze story size constraints

**Features:**
- Pre-generation estimate
- Post-generation validation
- Split recommendations for oversized stories

#### `/atlas-correct-course`
**Purpose:** Course correction during development

**Use When:**
- Significant blockers encountered
- Requirements changed mid-story
- Technical approach needs revision

---

## Retrospective & Learning

#### `/atlas-retrospective`
**Purpose:** Epic retrospective with Atlas integration

**Features:**
- Historical lessons feeding
- Process strategy feeding
- Pattern validation
- Push alerts on pattern changes

**Atlas Integration:**
- Feeds: `06-lessons.md`, `07-process.md`
- Updates: Sync history

#### `/atlas-epic-tech-context`
**Purpose:** Technical context for epic planning

**Provides:**
- Relevant architecture decisions
- Applicable patterns
- Historical lessons for similar epics

---

## E2E Testing

#### `/atlas-e2e`
**Purpose:** Persona-driven E2E test generation

**Features:**
- Uses personas from `03-personas.md`
- Workflow chain scenarios from `08-workflow-chains.md`
- Generates test cases aligned with user journeys

---

## Atlas Memory Architecture

### Knowledge Fragments

| # | Fragment | Purpose | Tags |
|---|----------|---------|------|
| 01 | purpose.md | App mission, principles | purpose, mission |
| 02 | features.md | Feature inventory | features, capabilities |
| 03 | personas.md | User personas, goals | personas, ux |
| 04 | architecture.md | Tech stack, patterns | architecture, decisions |
| 05 | testing.md | Test strategies | testing, coverage |
| 06 | lessons.md | Retrospective learnings | lessons, wisdom |
| 07 | process.md | Branching, deployment | process, strategy |
| 08 | workflow-chains.md | User journeys | workflows, journeys |
| 09 | sync-history.md | Sync log, drift | sync, updates |
| 10 | instincts.md | Learned patterns | instincts, learning |

### Learning System Files

| File | Purpose |
|------|---------|
| `learning/config.json` | Learning configuration |
| `learning/observations.jsonl` | Tool usage observations |
| `learning/instincts.json` | Active instinct patterns |
| `learning/session-state.tmp` | Session persistence |

### Index-Guided Loading

Always consult `atlas-index.csv` before loading fragments:
1. Identify relevant tags from query
2. Load ONLY needed fragments (2-3 max)
3. Never load all fragments at once

---

## Integration Patterns

### Feed (`>>`)
Workflow sends knowledge nuggets to Atlas memory.
- PRD → `01-purpose.md`, `02-features.md`
- Code Review → `04-architecture.md`, `05-testing.md`
- Retrospective → `06-lessons.md`

### Consult (`<<`)
Workflow queries Atlas for context.
- Dev Story asks: "What patterns apply?"
- Sprint Planning asks: "What was velocity?"

### Validate (`<>`)
Atlas validates alignment at decision points.
- Implementation Readiness: PRD ↔ Architecture ↔ Stories
- Code Review: Implementation vs. patterns

### Alert (`!!`)
Atlas proactively flags issues.
- Story affects existing workflow
- Coverage gaps detected
- Architectural violations

---

## Configuration

### Enable/Disable Learning

Edit `atlas-sidecar/learning/config.json`:

```json
{
  "learning": {
    "enabled": true  // Set to false to disable
  }
}
```

### Adjust Thresholds

```json
{
  "learning": {
    "sessionEvaluationThreshold": 10  // Min observations to trigger evaluation
  },
  "instincts": {
    "minConfidence": 0.3,           // Minimum to keep instinct
    "evolutionThreshold": 0.8        // Minimum to evolve to knowledge
  }
}
```

### Configure Observation Capture

```json
{
  "observations": {
    "captureTools": ["Edit", "Write", "Bash", "Read", "Grep", "Glob"],
    "ignorePaths": ["node_modules/", ".git/"],
    "sensitiveFields": ["password", "secret", "token"]
  }
}
```

---

## Troubleshooting

### Hooks Not Firing
1. Check hooks registered in `.claude/settings.local.json`
2. Verify `.cjs` extension in command paths
3. Test manually: `echo '{}' | node hooks/session-start.cjs`

### No Observations Captured
1. Check `learning.enabled` is `true` in config.json
2. Verify tool is in `captureTools` list
3. Check path isn't in `ignorePaths`

### Instincts Not Evolving
1. Run `/atlas-instinct-status` to check confidence levels
2. Ensure 10+ observations before evaluation triggers
3. Run `/atlas-sync-observations` to force evaluation

### Memory Not Loading
1. Check `atlas-index.csv` has correct fragment paths
2. Verify fragment files exist in `knowledge/`
3. Use index-guided loading (don't load all at once)
