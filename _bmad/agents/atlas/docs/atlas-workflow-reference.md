# Atlas-Enhanced BMAD Workflow Guide

> **Purpose:** This guide shows how Atlas integrates throughout the complete BMAD workflow, acting as the "Project Intelligence Thread" that accumulates knowledge and provides validation at key decision points.

---

## Overview

Atlas is the **Project Intelligence Guardian** - an agent that:
- **Accumulates knowledge** from every workflow that produces project artifacts
- **Validates alignment** at decision points to prevent drift
- **Provides push alerts** when changes affect existing workflows
- **Maintains continuity** across sprints and team members

This guide shows where Atlas plugs into each BMAD phase and what actions it performs.

---

## Atlas Integration Patterns

Atlas has three integration patterns:

| Pattern | Symbol | Description |
|---------|--------|-------------|
| **FEED** | `>>` | Workflow feeds knowledge nuggets to Atlas memory |
| **CONSULT** | `<<` | Workflow consults Atlas for context or patterns |
| **VALIDATE** | `<>` | Atlas validates alignment before proceeding |
| **ALERT** | `!!` | Atlas proactively flags issues (Push Alert) |

---

## Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ATLAS-ENHANCED BMAD WORKFLOW                           │
│                                                                             │
│  Legend: >> FEED   << CONSULT   <> VALIDATE   !! ALERT                     │
└─────────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════╗
║  PHASE 1: ANALYSIS                                                        ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌─────────────────┐                                                      ║
║  │  Brainstorming  │ >> Atlas: Capture innovation ideas & constraints     ║
║  └────────┬────────┘    Section: 1 (Purpose) + 7 (Strategy)              ║
║           │                                                               ║
║           ▼                                                               ║
║  ┌─────────────────┐                                                      ║
║  │  Product Brief  │ >> Atlas: Extract vision, principles, success       ║
║  └────────┬────────┘    Section: 1 (Purpose) + 3 (Personas)              ║
║           │                                                               ║
║           ▼                                                               ║
║  ┌─────────────────┐                                                      ║
║  │    Research     │ >> Atlas: Store market/technical insights           ║
║  └────────┬────────┘    Section: 7 (Strategy)                            ║
║           │                                                               ║
╚═══════════╪═══════════════════════════════════════════════════════════════╝
            │
            ▼
╔═══════════════════════════════════════════════════════════════════════════╗
║  PHASE 2: PLANNING                                                        ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌─────────────────┐                                                      ║
║  │  PRD Creation   │ >> Atlas: Features, personas, goals, journeys       ║
║  └────────┬────────┘    Section: 1 + 2 + 3                               ║
║           │                                                               ║
║           ▼                                                               ║
║  ┌─────────────────┐                                                      ║
║  │  Architecture   │ >> Atlas: Decisions, patterns, boundaries           ║
║  │                 │ !! ALERT: If conflicts with PRD vision              ║
║  └────────┬────────┘    Section: 4 (Architecture)                        ║
║           │                                                               ║
║           ▼                                                               ║
║  ┌─────────────────┐                                                      ║
║  │   UX Design     │ >> Atlas: User journeys, interaction patterns       ║
║  └────────┬────────┘    Section: 3 (Personas) + Workflow Chains          ║
║           │                                                               ║
║           ▼                                                               ║
║  ┌─────────────────┐                                                      ║
║  │ Epics & Stories │ >> Atlas: Feature inventory, workflow chains        ║
║  │                 │ !! ALERT: If story affects existing workflows       ║
║  └────────┬────────┘    Section: 2 (Features) + Workflow Chains          ║
║           │                                                               ║
╚═══════════╪═══════════════════════════════════════════════════════════════╝
            │
            ▼
╔═══════════════════════════════════════════════════════════════════════════╗
║  PHASE 3: SOLUTIONING                                                     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌─────────────────────┐                                                  ║
║  │ Implementation      │ <> Atlas: Validate PRD ↔ Architecture ↔ Stories ║
║  │ Readiness Check     │    Check: Are all requirements covered?         ║
║  └──────────┬──────────┘    Check: Architecture supports all features?   ║
║             │                                                             ║
║             ▼                                                             ║
║  ┌─────────────────────┐                                                  ║
║  │  Sprint Planning    │ >> Atlas: Sprint context, priorities            ║
║  │                     │ << Atlas: Historical velocity, blockers         ║
║  └──────────┬──────────┘    Section: 7 (Strategy)                        ║
║             │                                                             ║
╚═════════════╪═════════════════════════════════════════════════════════════╝
              │
              ▼
╔═══════════════════════════════════════════════════════════════════════════╗
║  PHASE 4: IMPLEMENTATION (The Core Development Loop)                      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌──────────────────────────────────────────────────────────────────────┐ ║
║  │                                                                      │ ║
║  │  ┌─────────────────┐                                                 │ ║
║  │  │  Create Story   │ << Atlas: Analyze workflow chain impact         │ ║
║  │  │                 │ !! ALERT: "This story affects [X] workflow"     │ ║
║  │  │                 │ >> Atlas: Story intent, ACs, workflow touch     │ ║
║  │  └────────┬────────┘    Section: 2 (Features)                        │ ║
║  │           │                                                          │ ║
║  │           ▼                                                          │ ║
║  │  ┌─────────────────┐                                                 │ ║
║  │  │   Dev Story     │ << Atlas: Testing patterns, seed data needs     │ ║
║  │  │                 │ << Atlas: Related workflow test scenarios       │ ║
║  │  └────────┬────────┘                                                 │ ║
║  │           │                                                          │ ║
║  │           ▼                                                          │ ║
║  │  ┌─────────────────┐                                                 │ ║
║  │  │  Code Review    │ <> Atlas: Validate architectural alignment      │ ║
║  │  │                 │ >> Atlas: Implementation patterns, decisions    │ ║
║  │  │                 │ !! ALERT: Coverage gaps, arch violations        │ ║
║  │  └────────┬────────┘    Section: 4 + 5 (Architecture + Testing)      │ ║
║  │           │                                                          │ ║
║  │           ▼                                                          │ ║
║  │  ┌─────────────────┐                                                 │ ║
║  │  │  Deploy Story   │ <> Atlas: Pre-deployment validation             │ ║
║  │  │                 │ >> Atlas: Deployment facts, environment state   │ ║
║  │  └────────┬────────┘    Section: 7 (Strategy - Deployment)           │ ║
║  │           │                                                          │ ║
║  │           ▼                                                          │ ║
║  │  ┌─────────────────┐                                                 │ ║
║  │  │   Next Story    │─────────────────────────────────────────────────┘ ║
║  │  └─────────────────┘                                                   ║
║  │                                                                        ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                              │                                            ║
║                              ▼ (After Epic Complete)                      ║
║  ┌─────────────────┐                                                      ║
║  │  Retrospective  │ >> Atlas: Lessons learned, process changes          ║
║  │                 │ >> Atlas: What worked, what to avoid                ║
║  │                 │ << Atlas: Previous retro commitments (follow-up)    ║
║  └─────────────────┘    Section: 6 (Historical Lessons) + 7 (Strategy)   ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## Phase-by-Phase Integration Details

### Phase 1: Analysis

#### Brainstorming Workflow

**Atlas Role:** Capture raw innovation nuggets before they're refined

**Integration Point:** End of brainstorming session

**Atlas Actions:**
```markdown
>> FEED to Section 1 (App Purpose) + Section 7 (Strategy):
   - Innovation ideas that define app direction
   - Constraints identified (market, technical, regulatory)
   - Key decisions made about scope or approach
```

**Nugget Template:**
```markdown
### Brainstorm - [Topic] - [Date]

**Summary:** Brainstorming session for [topic] identified [X] key directions.

**Innovation Ideas:**
- [Idea 1]: [Why it matters]
- [Idea 2]: [Why it matters]

**Constraints Identified:**
- [Constraint 1]: [Impact]

**Decisions Made:**
- [Decision]: [Rationale]

**Source:** [Session notes location]
```

---

#### Product Brief Workflow

**Atlas Role:** Extract foundational vision and principles

**Integration Point:** After brief is finalized

**Atlas Actions:**
```markdown
>> FEED to Section 1 (Purpose) + Section 3 (Personas):
   - App mission and vision statements
   - Core principles that guide decisions
   - Success criteria definitions
   - Initial user persona sketches
```

**Nugget Template:**
```markdown
### Product Brief - [App Name] - [Date]

**Summary:** Product brief established for [app name] - [one-line mission].

**Vision:** [Vision statement]

**Core Principles:**
1. [Principle 1]
2. [Principle 2]

**Success Criteria:**
- [Criterion 1]
- [Criterion 2]

**Initial Personas:**
- [Persona 1]: [Goals]

**Source:** docs/product-brief.md
```

---

### Phase 2: Planning

#### PRD Creation Workflow

**Atlas Role:** Extract comprehensive product definition

**Integration Point:** After PRD is complete

**Atlas Actions:**
```markdown
>> FEED to Section 1 + 2 + 3:
   - Section 1: Mission, principles, success criteria
   - Section 2: Feature inventory with intent for each
   - Section 3: User personas with goals and journeys
```

**Nugget Template:**
```markdown
### PRD Created - [App Name] - [Date]

**Summary:** PRD established defining [X] features for [target users].

**Mission:** [Mission statement - DIRECT QUOTE from PRD]

**Target Market:** [DIRECT QUOTE - country/region]
**Primary Currency:** [DIRECT QUOTE]

**User Personas:**
- [Persona 1]: [Primary goal]
- [Persona 2]: [Primary goal]

**Feature Categories:**
- [Category 1]: [X] features
- [Category 2]: [X] features

**Primary User Journeys:**
1. [Journey 1]: [Start] → [End]
2. [Journey 2]: [Start] → [End]

**Source:** docs/prd.md
```

---

#### Architecture Workflow

**Atlas Role:** Store architectural decisions and patterns; Alert on conflicts

**Integration Point:** After architecture is defined

**Atlas Actions:**
```markdown
>> FEED to Section 4 (Architecture):
   - Key architectural decisions with rationale
   - Patterns adopted (and why)
   - System boundaries and integrations
   - Data flow decisions

!! ALERT if architecture conflicts with PRD:
   - Feature requirements not supportable
   - Performance needs not addressed
   - Security requirements gaps
```

**Push Alert Trigger:**
```markdown
⚠️ ATLAS ALERT: Architecture Conflict Detected

**Issue:** [Specific conflict]
**PRD Requirement:** [What PRD says]
**Architecture Gap:** [What's missing or conflicting]
**Recommendation:** [Suggested resolution]
```

---

#### UX Design Workflow

**Atlas Role:** Map user journeys and interaction patterns

**Integration Point:** After UX specification is complete

**Atlas Actions:**
```markdown
>> FEED to Section 3 (Personas) + Workflow Chains:
   - User journey maps with all steps
   - Interaction patterns and conventions
   - Screen flows and navigation
   - Accessibility considerations
```

**Workflow Chain Update:**
```markdown
## Workflow Chains

### [Journey Name] Chain
1. [Screen/Action 1] → triggers [X]
2. [Screen/Action 2] → depends on [Y]
3. [Screen/Action 3] → affects [Z]

**Testing Implications:**
- E2E must cover: [full chain]
- States to test: [list states]
```

---

#### Epics & Stories Workflow

**Atlas Role:** Build feature inventory; Alert on workflow impacts

**Integration Point:** After epics/stories are created

**Atlas Actions:**
```markdown
>> FEED to Section 2 (Features) + Workflow Chains:
   - Story purposes and user value
   - Acceptance criteria summaries
   - Workflow touchpoints for each story

!! ALERT if story affects existing workflows:
   - "Story X-Y modifies [existing workflow]"
   - "New dependency: [downstream impact]"
   - "Testing gap: [existing tests may break]"
```

**Push Alert Trigger:**
```markdown
⚠️ ATLAS ALERT: Workflow Impact Detected

**Story:** [Story ID] - [Title]
**Affects Workflow:** [Workflow name]
**Impact:** [What changes]
**Downstream Effects:**
- [Effect 1]
- [Effect 2]
**Recommendation:** Update [X] tests, review [Y] integration
```

---

### Phase 3: Solutioning

#### Implementation Readiness Check

**Atlas Role:** Validate cross-document alignment

**Integration Point:** Before implementation begins

**Atlas Actions:**
```markdown
<> VALIDATE alignment:
   - PRD requirements → Architecture coverage
   - Architecture patterns → Story implementations
   - UX journeys → Story acceptance criteria
   - All features → Have corresponding stories

Report gaps and misalignments before coding starts.
```

---

#### Sprint Planning

**Atlas Role:** Provide historical context; Track sprint strategy

**Integration Point:** During sprint planning

**Atlas Actions:**
```markdown
<< CONSULT for context:
   - Historical velocity patterns
   - Previous blockers and how resolved
   - Technical debt affecting this sprint
   - Lessons from previous retrospectives

>> FEED to Section 7 (Strategy):
   - Sprint goals and priorities
   - Risk mitigation strategies
   - Capacity allocation decisions
```

---

### Phase 4: Implementation

#### Create Story Workflow

**Atlas Role:** Analyze workflow chain impact; Provide push alerts

**Integration Point:** During story creation

**Atlas Actions:**
```markdown
<< CONSULT Atlas before finalizing story:
   - Does this story affect existing workflows?
   - What downstream impacts should be considered?
   - What test scenarios are implied?

!! ALERT (Push Alert) if workflow impact detected:
   ⚠️ "This story touches [Consumer Request Flow]"
   ⚠️ "Consider impact on: [list affected areas]"
   ⚠️ "Suggested additional ACs: [list]"

>> FEED to Section 2 after story created:
   - Story intent and user value
   - Key acceptance criteria
   - Workflow touchpoints identified
```

**Create-Story Atlas Integration Step:**
```xml
<step n="X" goal="Atlas Workflow Analysis (if Atlas installed)">
  <check if="Atlas agent installed (_bmad/agents/atlas/ exists)">
    <action>Load Atlas memory to understand current workflow chains</action>
    <action>Analyze story requirements against existing workflows</action>

    <check if="story affects existing workflows">
      <output>
        ⚠️ **ATLAS PUSH ALERT: Workflow Impact Detected**

        This story affects the following existing workflows:
        {{list_affected_workflows}}

        **Downstream Impacts:**
        {{list_downstream_impacts}}

        **Recommended Additional Acceptance Criteria:**
        {{list_suggested_acs}}

        **Testing Considerations:**
        {{list_test_scenarios}}
      </output>

      <ask>Include these considerations in the story? [Y/N]</ask>
    </check>

    <check if="no workflow impacts">
      <output>✅ Atlas: No existing workflow impacts detected.</output>
    </check>
  </check>
</step>
```

---

#### Dev Story Workflow

**Atlas Role:** Provide testing patterns and context

**Integration Point:** When developer starts implementation

**Atlas Actions:**
```markdown
<< CONSULT Atlas for:
   - Testing patterns for similar features
   - Seed data requirements based on workflows
   - Related workflow test scenarios to consider
   - Historical issues with similar implementations
```

---

#### Code Review Workflow

**Atlas Role:** Validate alignment; Extract learnings; Alert on gaps

**Integration Point:** During code review

**Atlas Actions:**
```markdown
<> VALIDATE architectural alignment:
   - Does implementation follow documented patterns?
   - Are architectural decisions respected?
   - Does code match story acceptance criteria?

>> FEED to Section 4 + 5:
   - Implementation patterns adopted (and why)
   - Technical decisions made during implementation
   - Test coverage achieved
   - Any deviations from architecture (documented)

!! ALERT on issues:
   - Coverage gaps detected
   - Architectural violations
   - Missing workflow validations
```

**Code-Review Atlas Integration Step:**
```xml
<step n="X" goal="Atlas Validation (if Atlas installed)">
  <check if="Atlas agent installed">
    <action>Load Atlas memory for architectural patterns</action>
    <action>Compare implementation against documented decisions</action>

    <check if="architectural violations detected">
      <output>
        ⚠️ **ATLAS ALERT: Architectural Alignment Issues**

        **Violation 1:** {{violation_description}}
        **Documented Pattern:** {{expected_pattern}}
        **Actual Implementation:** {{actual_pattern}}
        **Recommendation:** {{fix_suggestion}}
      </output>
    </check>

    <check if="coverage gaps detected">
      <output>
        ⚠️ **ATLAS ALERT: Coverage Gaps**

        Based on workflow chain analysis, these scenarios need testing:
        {{list_missing_test_scenarios}}
      </output>
    </check>

    <action>After review complete, prompt for Atlas memory update</action>
    <ask>Update Atlas with implementation learnings? [Y/N]</ask>

    <check if="user says Y">
      <action>Generate nugget with:
        - Patterns adopted
        - Technical decisions
        - Test coverage notes
      </action>
      <action>Append to Atlas memory Section 4 + 5</action>
    </check>
  </check>
</step>
```

---

#### Deploy Story Workflow

**Atlas Role:** Pre-deployment validation; Update with deployment facts

**Integration Point:** Before and after deployment

**Atlas Actions:**
```markdown
<> VALIDATE before deployment:
   - All ACs implemented and tested?
   - Architectural alignment confirmed?
   - No blocking technical debt?

>> FEED to Section 7 after deployment:
   - Deployment date and environment
   - What was deployed (story/feature)
   - Any deployment issues and resolutions
   - Environment state changes
```

---

#### Retrospective Workflow

**Atlas Role:** Extract lessons; Update process knowledge; Check commitments

**Integration Point:** After retrospective discussion

**Atlas Actions:**
```markdown
<< CONSULT before retrospective:
   - Previous retrospective commitments
   - What did we commit to improve?
   - Did we follow through?

>> FEED to Section 6 + 7:
   - Section 6: Lessons learned (what worked, what to avoid)
   - Section 7: Process changes adopted
   - Action items and commitments made
```

**Retrospective Atlas Integration Step:**
```xml
<step n="X" goal="Atlas Memory Update">
  <check if="Atlas agent installed">
    <action>Generate retrospective nugget with:
      - Epic summary
      - Key lessons learned
      - What worked well
      - What to avoid
      - Process changes adopted
      - Action items committed
    </action>

    <output>
      **Atlas Memory Update**

      The following insights will be added to Atlas memory:

      **Section 6 - Historical Lessons:**
      {{lessons_nugget}}

      **Section 7 - Process & Strategy:**
      {{process_nugget}}
    </output>

    <ask>Confirm Atlas memory update? [Y/N]</ask>

    <check if="user confirms">
      <action>Append nuggets to Atlas memory</action>
      <action>Update Sync History table</action>
      <output>✅ Atlas memory updated with retrospective insights</output>
    </check>
  </check>
</step>
```

---

## Atlas Memory Sections Reference

| Section | Content | Fed By |
|---------|---------|--------|
| **1. App Purpose & Core Principles** | Mission, vision, principles, success criteria | Product Brief, PRD |
| **2. Feature Inventory + Intent** | Features, user value, story purposes | PRD, Epics, Create-Story |
| **3. User Personas & Goals** | Personas, goals, journeys, UX patterns | PRD, UX Design |
| **4. Architectural Decisions & Patterns** | Technical decisions, patterns, boundaries | Architecture, Code Review |
| **5. Testing Patterns & Coverage** | Test strategies, seed data, coverage | Dev-Story, Code Review |
| **6. Historical Lessons** | What worked, what to avoid, insights | Retrospective |
| **7. Process & Strategy** | Branching, deployment, team decisions | Sprint Planning, Retrospective, Deploy |

---

## Push Alert Triggers (Always Active)

Atlas monitors these moments and proactively alerts:

| Moment | Trigger | Alert Content |
|--------|---------|---------------|
| **Story Creation** | Story affects existing workflow | Workflow impact analysis |
| **Code Review** | Coverage gaps detected | Missing test scenarios |
| **Code Review** | Architectural violation | Pattern mismatch + fix suggestion |
| **Architecture** | Conflicts with PRD | Requirement coverage gaps |
| **Deploy** | Incomplete validation | Blocking issues |

---

## Quick Start: Adding Atlas to a Workflow

### Minimal Integration Template

Add this to any workflow's final step:

```xml
<step n="FINAL" goal="Atlas Integration (Optional)">
  <check if="directory exists: _bmad/agents/atlas/">
    <output>
      **Atlas Memory Update Available**

      This [workflow name] produced insights that Atlas can learn from.
    </output>

    <ask>Update Atlas memory with these insights? [Y/N]</ask>

    <check if="user says Y">
      <action>Determine appropriate section(s) based on content</action>
      <action>Generate nugget with:
        - Date and source document
        - Summary (1-2 sentences)
        - Key points (3-5 bullets)
        - Workflow implications
      </action>
      <action>Append to _bmad/agents/atlas/atlas-sidecar/atlas-memory.md</action>
      <action>Update Sync History table</action>
      <output>✅ Atlas memory updated</output>
    </check>
  </check>
</step>
```

---

## Atlas-Enhanced Workflow Variants

Pre-built Atlas-enhanced workflow variants are available for key implementation workflows:

| Workflow | Standard | Atlas-Enhanced | Description |
|----------|----------|----------------|-------------|
| Create Story | `/bmad:bmm:workflows:create-story` | `/bmad:bmm:workflows:atlas-create-story` | Adds workflow chain analysis and push alerts |
| Code Review | `/bmad:bmm:workflows:code-review` | `/bmad:bmm:workflows:atlas-code-review` | Adds architectural validation and pattern compliance |
| Retrospective | `/bmad:bmm:workflows:retrospective` | `/bmad:bmm:workflows:atlas-retrospective` | Adds lesson feeding and pattern validation |
| E2E Testing | N/A | `/bmad:bmm:workflows:atlas-e2e` | Persona-driven E2E test generation and execution |

These variants gracefully fall back to standard behavior if Atlas is not installed.

### Atlas-Enhanced Workflow Files

```
_bmad/bmm/workflows/4-implementation/
├── atlas-create-story/
│   ├── workflow.yaml          # Atlas-enabled configuration
│   └── instructions.xml       # Workflow chain analysis steps
├── atlas-code-review/
│   ├── workflow.yaml          # Atlas validation configuration
│   └── instructions.xml       # Architecture + pattern validation
├── atlas-retrospective/
│   ├── workflow.yaml          # Historical lessons configuration
│   └── instructions.md        # Memory feeding + pattern validation
└── atlas-e2e/
    ├── workflow.yaml          # Persona-driven testing configuration
    └── instructions.xml       # E2E test generation and execution
```

---

## Exporting to Another Project

To add Atlas-enhanced BMAD workflow to a new project:

### 1. Copy Atlas Agent
```bash
cp -r _bmad/agents/atlas/ /new-project/_bmad/agents/
```

### 2. Copy Atlas-Enhanced Workflows
```bash
cp -r _bmad/bmm/workflows/4-implementation/atlas-create-story/ \
      /new-project/_bmad/bmm/workflows/4-implementation/
cp -r _bmad/bmm/workflows/4-implementation/atlas-code-review/ \
      /new-project/_bmad/bmm/workflows/4-implementation/
cp -r _bmad/bmm/workflows/4-implementation/atlas-retrospective/ \
      /new-project/_bmad/bmm/workflows/4-implementation/
cp -r _bmad/bmm/workflows/4-implementation/atlas-e2e/ \
      /new-project/_bmad/bmm/workflows/4-implementation/
```

### 3. Copy Slash Commands
```bash
cp .claude/commands/bmad/agents/atlas.md /new-project/.claude/commands/bmad/agents/
cp .claude/commands/bmad/bmm/workflows/atlas-create-story.md \
   /new-project/.claude/commands/bmad/bmm/workflows/
cp .claude/commands/bmad/bmm/workflows/atlas-code-review.md \
   /new-project/.claude/commands/bmad/bmm/workflows/
cp .claude/commands/bmad/bmm/workflows/atlas-retrospective.md \
   /new-project/.claude/commands/bmad/bmm/workflows/
cp .claude/commands/bmad/bmm/workflows/atlas-e2e.md \
   /new-project/.claude/commands/bmad/bmm/workflows/
```

### 4. Customize Configuration
Edit `_bmad/agents/atlas/atlas.agent.yaml`:
- Update `critical_actions` paths if your _bmad location differs
- Customize prompts for your project's terminology

### 5. Initial Sync
Run Atlas and use `sync` command to populate memory from existing docs.

### 6. Use Atlas-Enhanced Workflows
Instead of the standard workflows, use:
- `/bmad:bmm:workflows:atlas-create-story` - For workflow-aware story creation
- `/bmad:bmm:workflows:atlas-code-review` - For architecture-validated reviews
- `/bmad:bmm:workflows:atlas-retrospective` - For wisdom-accumulating retrospectives
- `/bmad:bmm:workflows:atlas-e2e` - For persona-driven E2E test generation

---

## Benefits of Atlas Integration

1. **Knowledge Continuity** - Project knowledge survives team changes
2. **Drift Prevention** - Catch misalignments before they become bugs
3. **Workflow Awareness** - Understand how changes ripple through the system
4. **Test Coverage Intelligence** - Know what scenarios to test based on workflows
5. **Historical Learning** - Learn from retrospectives, don't repeat mistakes
6. **Onboarding Acceleration** - New team members can query Atlas for context

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-18 | Initial Atlas-BMAD workflow guide |

---

*This guide is part of the BMAD Method. For questions or contributions, visit the [BMAD GitHub](https://github.com/bmad-code-org/BMAD-METHOD).*
