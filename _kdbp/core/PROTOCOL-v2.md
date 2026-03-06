<\!-- FORKED FROM: docs/research/20260227/PROTOCOL-v2.md @ 2026-03-04. KDBP is self-contained; upstream changes are NOT auto-synced. -->

# Deep Behavior Framework — PROTOCOL

**Version:** 2.0.0
**Date:** 2026-03-02
**Status:** Release — Post adversarial review, 8 gaps addressed
**Replaces:** PROTOCOL v1.0.0-rc1

**Changes from v1:** Context budget tiers (G1), maintenance automation (G2), human authority gates (G3),
analogy limits field (G4), PM deference (G5), portability layer (G6), cross-behavior resolution (G7),
self-evaluation reliability (G8). See `adversarial review.md` for full findings.

---

## 1. What Is a Deep Behavior

```
┌─── GABE BLOCK: Deep Behavior ─────────────────────────┐
│                                                        │
│  THE PROBLEM                                           │
│  Skills know things. Workflows do things. Neither one  │
│  knows why the other exists. When a workflow step      │
│  fails, the agent can't ask "why do we do this?"      │
│  When a skill gets updated, the agent can't propagate  │
│  that to the workflows that depend on it. Skills and   │
│  workflows drift apart. The knowledge says one thing,  │
│  the execution does another, and nobody notices until  │
│  something breaks — or worse, everything "works" but   │
│  the output misses the point entirely.                 │
│                                                        │
│  THE ANALOGY                                           │
│  A mechanical clock with a maintenance manual bound    │
│  to it, and a purpose statement engraved on the case.  │
│                                                        │
│  The WORKFLOWS are the gear train — the physical       │
│  sequence that produces the output. The SKILLS are     │
│  the watchmaker's manual — engineering principles      │
│  explaining why each gear has that tooth count. The    │
│  VALUES are the purpose engraved on the case: "to      │
│  tell accurate time so people can coordinate."         │
│                                                        │
│  Without the manual, you replace a gear with one that  │
│  "looks right" but drifts 3 min/day. Without the      │
│  gears, the manual is theory on a shelf. Without the   │
│  purpose, you might build a beautiful clock that       │
│  nobody can read.                                      │
│                                                        │
│  The LINKAGE MAP is the parts diagram — which manual   │
│  page explains which gear. The EVOLUTION ENGINE is     │
│  the master watchmaker who opens the clock, measures   │
│  drift, traces it to a gear, checks the manual, and   │
│  either fixes the gear or updates the manual.          │
│                                                        │
│  The TRAJECTORY is the ship's logbook — a record of    │
│  every session, every correction, every drift signal,  │
│  readable across time to detect patterns no single     │
│  session could reveal.                                 │
│                                                        │
│  A behavior is a clock that knows its purpose, knows   │
│  why each gear exists, and maintains itself.           │
│                                                        │
│  CONSTRAINT BOX                                        │
│    IS:      A unified primitive that binds values to   │
│             knowledge to execution with explicit       │
│             causal links and a self-improvement loop   │
│    IS NOT:  A replacement for skills or workflows —    │
│             it contains them. They still exist as      │
│             layers inside a behavior.                  │
│    DECIDES: When to change HOW vs. WHY vs. WHAT        │
│             MATTERS — the hardest judgment call in     │
│             any system                                 │
│                                                        │
│  ONE-LINE HANDLE                                       │
│  "The clock that knows its purpose and maintains       │
│   itself"                                              │
│                                                        │
│  ANALOGY LIMITS                                        │
│  The clock analogy breaks when time is ambiguous —     │
│  a behavior that serves multiple "purposes" (Values)   │
│  isn't a single clock. Also: clocks have fixed gears;  │
│  behaviors evolve. When the behavior grows beyond its  │
│  first domain, the clock analogy narrows. Revisit at   │
│  Practicing maturity.                                  │
│                                                        │
│  SIGNAL: Deeper question ◆                             │
└────────────────────────────────────────────────────────┘
```

---

## 2. The Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      DEEP BEHAVIOR                          │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  VALUES (WHAT MATTERS)                  compass        │  │
│  │  Expressed as: Value Blocks (Gabe Lens format)        │  │
│  │  "What does success look like for the person served?" │  │
│  └────────────────────────┬──────────────────────────────┘  │
│                           │ grounds                         │
│  ┌────────────────────────▼──────────────────────────────┐  │
│  │  SKILLS (WHY)                           map            │  │
│  │  Expressed as: Prose + Gabe Blocks for complex reasons│  │
│  │  "Why do we do it this way? What breaks without it?"  │  │
│  └────────────────────────┬──────────────────────────────┘  │
│                           │ justifies                       │
│  ┌────────────────────────▼──────────────────────────────┐  │
│  │  WORKFLOWS (HOW)                        legs           │  │
│  │  Expressed as: Steps, sequences, decision points      │  │
│  │  "What do we do, in what order, with what output?"    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  EVOLUTION ENGINE              three loops             │  │
│  │  Loop 1 (Single):  Fix the step      ← Workflow       │  │
│  │  Loop 2 (Double):  Fix the reasoning ← Skill          │  │
│  │  Loop 3 (Triple):  Fix the direction ← Values         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  TRAJECTORY                    logbook                 │  │
│  │  Cross-session accumulator. Records outcomes,          │  │
│  │  drift signals, and intent at story/epic/project       │  │
│  │  level. Enables evaluation above session altitude.     │  │
│  │  References external PM — does NOT replace it.         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### The Grounding Chain

Every workflow step traces upward through two levels:

```
  Step: "Identify core user journeys before testing components"
    ↑ justified by
  Skill: "Integration tests catch interaction bugs that
          component tests miss"
    ↑ grounded in
  Value: "Is the smoke sensor connected?"
```

### One-Line Handle

**"Values are the compass, skills are the map, workflows are the legs"**

---

## 3. Where Gabe Lens Applies

Gabe Lens is the expression format for **anything that needs to survive compression,
resist over-specification, and communicate meaning rather than mechanism.**

| Layer                   | When to Use Gabe Lens                                                         | Format                     |
| ----------------------- | ----------------------------------------------------------------------------- | -------------------------- |
| **Values**              | ALWAYS — every value expressed as a Value Block                               | Value Block (§4)           |
| **Skills**              | When a reason is complex, counter-intuitive, or involves trade-offs           | Gabe Block (§5)            |
| **Skills**              | When a reason is simple and self-evident                                      | Plain prose                |
| **Workflows**           | NEVER — workflows are steps. Keep them concrete and sequential.               | Step lists, decision trees |
| **Trajectory — Intent** | ALWAYS — story/epic/project intent expressed through Gabe Lens                | Intent Block (§8)          |
| **Trajectory — Ledger** | NEVER — the ledger is a compact log, not conceptual                           | Structured table entries   |
| **Evolution reviews**   | When root cause is complex or fix involves trade-offs                         | Gabe Block (§5)            |

**Rule: Use Gabe Lens for direction and meaning. Use plain structure for execution and recording.**

---

## 4. The Value Block Format  [G4 — ANALOGY LIMITS added]

```
┌─── VALUE BLOCK: [Value Name] ─────────────────────────┐
│                                                        │
│  THE INTENT                                            │
│  [1-2 sentences: what this value protects or aims for. │
│   What goes wrong for the PERSON served when this      │
│   value is violated? Focus on human consequence.]      │
│                                                        │
│  THE ANALOGY                                           │
│  [Physical system mapping that captures direction.     │
│   Must convey what "aligned" FEELS like vs. what       │
│   "misaligned" FEELS like. Choose from: mechanical,    │
│   fluid, optical, chemical, electromagnetic,           │
│   thermodynamic, biological systems.]                  │
│                                                        │
│  CONSTRAINT BOX                                        │
│    IS:      [what this value IS]                       │
│    IS NOT:  [what it is NOT — prevents overextension]  │
│    DECIDES: [when skills or workflows conflict, this   │
│              value resolves the tie by pointing here]  │
│                                                        │
│  ONE-LINE HANDLE                                       │
│  [5-10 words. Must survive compaction and fatigue.]    │
│                                                        │
│  ALIGNMENT TESTS                                       │
│  [2-3 concrete questions asked of any output to check  │
│   if this value is being served. Compass readings,     │
│   not pass/fail gates.]                                │
│                                                        │
│  ANALOGY LIMITS                                        │
│  [Where does this analogy break? What aspect of the    │
│   real system does it NOT capture? When the system     │
│   evolves past this boundary, the analogy needs        │
│   updating. 2-3 sentences.]                            │
│                                                        │
│  EVALUATION ALTITUDE                                   │
│  [At what temporal scale can this be meaningfully      │
│   evaluated? Session | Story | Epic | Project]         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Value Block Example — "Deliver, Don't Decorate"

```
┌─── VALUE BLOCK: Deliver, Don't Decorate ──────────────┐
│                                                        │
│  THE INTENT                                            │
│  When tests pass but the user's core need isn't met,   │
│  the test suite has become decoration. The person       │
│  relying on these tests ships broken software with     │
│  confidence, which is worse than shipping with doubt.  │
│                                                        │
│  THE ANALOGY                                           │
│  A smoke detector that tests its own battery and LED   │
│  every night — all systems go — but the smoke sensor   │
│  was never connected. Components pass their own        │
│  checks. The system fails its only job.                │
│                                                        │
│  CONSTRAINT BOX                                        │
│    IS:      Tests must verify what the app DELIVERS    │
│             to people, not just what components DO     │
│    IS NOT:  A mandate to skip component tests — test   │
│             the LED too, just not ONLY the LED         │
│    DECIDES: Test the delivery chain before components  │
│                                                        │
│  ONE-LINE HANDLE                                       │
│  "Is the smoke sensor connected?"                      │
│                                                        │
│  ALIGNMENT TESTS                                       │
│  1. "Can I name the 3 core things this app delivers?   │
│      Does at least one test verify each?"              │
│  2. "If I deleted all component tests, would I catch   │
│      the most important failures with integration      │
│      tests alone?"                                     │
│  3. "Would a user say 'the app works' based on what    │
│      these tests verify?"                              │
│                                                        │
│  ANALOGY LIMITS                                        │
│  A smoke detector has one job. Software systems often  │
│  have multiple delivery chains. This analogy works for │
│  testing any single chain but doesn't help you decide  │
│  WHICH chain to test first when resources are limited. │
│  For prioritization, use the Epic Intent Block.        │
│                                                        │
│  EVALUATION ALTITUDE: Story                            │
└────────────────────────────────────────────────────────┘
```

---

## 5. Gabe Lens in the Skill Layer (WHY)  [G4 — ANALOGY LIMITS added]

Simple, self-evident reasons stay as prose:
> "Chilean VAT rate is 19% on net sales." — No block needed.

Complex, counter-intuitive, or trade-off reasons use a Gabe Block:

```
┌─── GABE BLOCK: [Reason Name] ─────────────────────────┐
│                                                        │
│  THE PROBLEM                                           │
│  [What breaks without this knowledge?]                 │
│                                                        │
│  THE ANALOGY                                           │
│  [Physical system mapping — spatial, visualizable]     │
│                                                        │
│  THE MAP                                               │
│  [ASCII diagram if relationships are complex]          │
│                                                        │
│  CONSTRAINT BOX                                        │
│    IS:      ...                                        │
│    IS NOT:  ...                                        │
│    DECIDES: ...                                        │
│                                                        │
│  ONE-LINE HANDLE                                       │
│  [5-10 words — the reason compressed to a phrase]      │
│                                                        │
│  ANALOGY LIMITS                                        │
│  [Where does this analogy break? When does it mislead? │
│   Note when to revisit. 2-3 sentences.]                │
│                                                        │
│  SIGNAL: Quick check ✓ | Deeper question ◆            │
└────────────────────────────────────────────────────────┘
```

**Analogy evolution rule:** Include analogy review in every evolution cycle.
When a behavior is evolved, ask: "Do our analogies still hold, or are they constraining our thinking?"

---

## 6. File Architecture  [G6 — portability layer]

The content layer (behaviors/, skills, workflows, values, trajectory) is **tool-agnostic markdown**.
It can be used with any agent framework. The integration layer (.claude/) is a Claude Code adapter.

```
project-root/
├── behaviors/                    # CONTENT LAYER — tool-agnostic
│   ├── REGISTRY.md               # Index of all behaviors
│   │   # Note: In KDBP deployments, PROTOCOL.md lives at _kdbp/core/PROTOCOL-v2.md (self-contained)
│   │
│   ├── trajectory/               # Cross-session accumulator
│   │   ├── PROJECT.md            # Project identity + values + value resolution order
│   │   ├── ledger.md             # The logbook — compact session log
│   │   ├── stories/
│   │   │   ├── active/           # In-progress story intent + progress
│   │   │   └── completed/        # Finished stories + evaluations
│   │   └── epics/
│   │       ├── active/
│   │       └── completed/
│   │
│   ├── [behavior-name]/          # One directory per behavior
│   │   ├── BEHAVIOR.md           # Identity + linkage map
│   │   ├── values/VALUES.md      # Value Blocks
│   │   ├── skills/                # Prose + Gabe Blocks
│   │   ├── workflow/             # Steps + decision trees
│   │   └── evolution/            # Changelog + review logs
│   │
│   └── ...
│
└── .claude/                      # INTEGRATION LAYER — Claude Code adapter
    ├── commands/
    │   ├── [behavior].md         # Slash command that activates behavior
    │   └── evolve.md             # /evolve → runs evolution protocol
    ├── settings.json             # Hook registrations
    └── CLAUDE.md
```

### Slash Command Integration (Integration Layer)

A slash command is the Claude Code adapter that loads the behavior context progressively.
The behavior content itself has no Claude Code syntax.

**.claude/commands/[behavior].md**
```markdown
Activate the [Behavior Name] behavior.

Context loading protocol (see §11 for full tier definitions):

HOT (always load):
1. Read behaviors/[behavior]/BEHAVIOR.md — handles and identity only
2. Read last 3 entries from behaviors/trajectory/ledger.md
3. Read behaviors/trajectory/stories/active/ — one-line handle per active story

WARM (load on first request in this domain):
4. Load relevant skill file(s) for this task
5. Load relevant workflow file(s) for this task

COLD (load only at evaluation checkpoints):
6. Full Value Blocks from behaviors/[behavior]/values/VALUES.md
7. Full Intent Blocks from active story/epic files
8. Full PROJECT.md

At session end: generate ledger entry per §12, present to human for review.
```

---

## 7. The BEHAVIOR.md Format

Unchanged from v1 — the identity file and linkage map format.

```markdown
---
behavior: [name]
version: 1.0.0
domain: [domain description]
maturity: seedling | growing | practicing | mastered
last_evolution: YYYY-MM-DD
---

# Behavior: [Name]

## Identity
[2-3 sentences: what this behavior enables, who it serves, what domain.]

## Value Manifest
| Value        | Handle                  | Altitude |
| ------------ | ----------------------- | -------- |
| [Value name] | "[one-line handle]"     | Story    |

(Full Value Blocks in values/VALUES.md)

## Skill Manifest
| Skill File    | Scope             | Has Gabe Blocks? |
| ------------- | ----------------- | ---------------- |
| [file.md]     | [scope]           | Yes/No           |

## Workflow Manifest
| Workflow File | Trigger            | Steps | Output       |
| ------------- | ------------------ | ----- | ------------ |
| [file.md]     | [trigger]          | N     | [output]     |

## Linkage Map

### [workflow-file.md]

| Step | Action             | Skill Reason       | Value Ground |
| ---- | ------------------ | ------------------ | ------------ |
| 1    | [action]           | [skill file §ref]  | V1: [handle] |

### Orphan Analysis

**Skill reasons with no workflow steps** (knowledge not operationalized):
**Workflow steps with no skill reason** (unjustified steps):
**Values with no linked steps** (values not implemented):

## Evolution Rules
See §10. Behavior-specific triggers listed here.
```

---

## 8. The Trajectory — Intent Expressed Through Gabe Lens

### The Intent Block Format  [G4 — ANALOGY LIMITS added]

```
┌─── INTENT BLOCK: [Name] ─────────────── [level] ─────┐
│                                                        │
│  WHAT WE'RE DELIVERING                                 │
│  [1-3 sentences in plain language. What does the       │
│   person/user get when this is done? Not what we       │
│   build — what they RECEIVE.]                          │
│                                                        │
│  THE ANALOGY                                           │
│  [Physical system mapping. Survives architecture       │
│   changes because it describes meaning, not mechanism.]│
│                                                        │
│  CONSTRAINT BOX                                        │
│    IS:      [what this delivers]                       │
│    IS NOT:  [what this does NOT deliver — scope bound] │
│    DECIDES: [what trade-off this resolves]             │
│                                                        │
│  ONE-LINE HANDLE                                       │
│  [5-10 words — the intent compressed]                  │
│                                                        │
│  ANALOGY LIMITS                                        │
│  [Where does this analogy break? What will it          │
│   misrepresent if the product evolves? When to         │
│   revisit. 2-3 sentences.]                             │
│                                                        │
│  DONE WHEN                                             │
│  [2-3 concrete observable outcomes, not implementation │
│   checkboxes.]                                         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Example — Story-level Intent (with ANALOGY LIMITS)

```
┌─── INTENT BLOCK: Batch Receipt Review ──── story ─────┐
│                                                        │
│  WHAT WE'RE DELIVERING                                 │
│  When someone scans 5 receipts at once, they need to   │
│  review all of them before any get saved — check       │
│  amounts, fix categories, toss bad scans. Right now    │
│  they can only handle them one at a time, in order.    │
│                                                        │
│  THE ANALOGY                                           │
│  A photo lab proof sheet. The photographer gets a      │
│  contact sheet with tiny thumbnails of every frame.    │
│  They mark good ones, cross out bad ones, make notes   │
│  before committing to printing any of them.            │
│                                                        │
│  CONSTRAINT BOX                                        │
│    IS:      A review step between scanning and saving  │
│    IS NOT:  A redesign of the scanning flow itself     │
│    DECIDES: Users review before saving, not after      │
│                                                        │
│  ONE-LINE HANDLE                                       │
│  "The proof sheet before the print run"                │
│                                                        │
│  ANALOGY LIMITS                                        │
│  A proof sheet is read-only — you mark it but don't    │
│  edit the photos. If the intent expands to include     │
│  editing receipt details (not just approve/discard),   │
│  the analogy narrows. Also: proof sheets don't have    │
│  undo — the analogy breaks if we add undo/redo.        │
│                                                        │
│  DONE WHEN                                             │
│  1. User can see all scanned receipts at once          │
│  2. User can edit, discard, or re-categorize any       │
│     receipt before saving                              │
│  3. Nothing is saved until user confirms               │
│                                                        │
└────────────────────────────────────────────────────────┘
```

*(See v1 §8 for project-level and epic-level examples — same format, add ANALOGY LIMITS field.)*

---

## 9. Trajectory File Formats  [G5 — PM deference; G7 — cross-behavior resolution]

### PROJECT.md

```markdown
---
project: [name]
version: [semver]
last_reviewed: YYYY-MM-DD
active_behaviors: [behavior-a, behavior-b]
external_pm: [github | linear | jira | none]
external_pm_url: [base URL for issue links]
---

# Project: [Name]

## Project Intent
(Intent Block — see §8)

## Project-Level Values
(Value Blocks that apply across all behaviors)

## Value Resolution Order  [G7 — NEW]
When behavior values conflict with each other:
1. Project-level values take precedence over all behavior values
2. Safety-related values take precedence over productivity values
3. If still ambiguous: human decides and logs the decision in ledger.md
   under a "RESOLUTION:" prefix

When behavior values conflict with each other (not project values):
List explicit precedence rules here for this project's known conflicts.
Example: "Testing behavior value 'delivery chain first' takes precedence
over dev-workflow value 'ship incrementally' when writing integration tests."

## Active Epics
- [Epic ref]: [handle] (status)

## Behaviors In Use
| Behavior | Applies To | Key Value Handle |
| -------- | ---------- | ---------------- |
```

### ledger.md — The Logbook  [G5 — unique artifact, not PM replacement]

The ledger is the **only artifact that captures what happens INSIDE a Claude Code session.**
External PM tools (GitHub Issues, Linear) track story status. The ledger tracks session signals.
They are complementary, not competing.

```markdown
# Trajectory Ledger

## Format
| Date | Story | PM-Ref | Behavior | Outcome | Signals |

Outcome: ✓ done | ~ partial | ✗ blocked | ⚑ drift detected
PM-Ref: link to GitHub Issue / Linear ticket / "none"

---

| Date       | Story | PM-Ref       | Behavior     | Outcome | Signals                              |
| ---------- | ----- | ------------ | ------------ | ------- | ------------------------------------ |
| 2026-02-25 | 14e-7 | GH#234       | dev-workflow | ✓       | Scan store extracted                 |
| 2026-02-26 | 14e-8 | GH#235       | dev-workflow | ~       | ⚑ Batch↔scan store coupling         |

## Unresolved Drift Signals
- YYYY-MM-DD: [signal] → [affected scope]

## Resolutions (cross-behavior value conflicts)
- YYYY-MM-DD RESOLUTION: [testing] beat [dev-workflow] on story 14e-7 because [reason]
```

### Story Files  [G5 — link to external PM]

```markdown
---
story: [id]
epic: [epic-id]
pm_ref: [GitHub Issue URL or Linear ticket URL]
status: active | completed
sessions: N
behaviors: [list]
---

# Story [id]: [title]

## Intent
(Intent Block)

## Session Log
- YYYY-MM-DD: [what happened this session, by agent]

## Carry-Forward Signals
- [signal for next session or epic]
```

---

## 10. The Evolution Engine  [G8 — different agent for adversarial review]

### Three Loops

```
SINGLE LOOP: Fix the step (workflow broke)
  Detect → fix workflow step → done

DOUBLE LOOP: Fix the reasoning (skill outdated)
  Detect → trace to skill reason → challenge reason
  → fix skill → cascade to linked workflow steps → done

TRIPLE LOOP: Fix the direction (values misaligned)
  Detect → trace to value test failure
  → Is the value correct but skill/workflow not serving it?
    → Add/fix skill + workflow
  → Is the value itself wrong? (rare — major version bump)
    → Adversarial review of value → cascade everything
```

### Root Cause Classification

| Type             | Description                       | Fix Path                                    | Loop          |
| ---------------- | --------------------------------- | ------------------------------------------- | ------------- |
| **A) Doing**     | Step wrong, reason right          | Fix the workflow step                       | Single        |
| **B) Knowing**   | Reason wrong or outdated          | Fix skill reason, cascade to linked steps   | Double        |
| **C) Linking**   | Wrong mapping in linkage          | Fix linkage map                             | Single/Double |
| **D) Gap**       | Missing knowledge                 | Research, add to skills, modify workflow    | Double        |
| **E) Drift**     | World changed (new law, tool)     | Update skill + workflow to match reality    | Double        |
| **F) Alignment** | Output correct but misses purpose | Triple loop — value tests reveal misalign   | Triple        |

**Type F is the most dangerous** because all steps pass, all reasons hold, but the behavior solved
the wrong problem. Only value alignment tests at the correct altitude catch Type F.

### The Causation Analysis Protocol

```
STEP 1: IDENTIFY THE SYMPTOM — Expected vs. actual?
STEP 2: LOCATE IN WORKFLOW — Which step(s)? Mark in linkage map.
STEP 3: TRACE TO SKILL — What reason(s) justify this step?
STEP 4: CLASSIFY ROOT CAUSE (A through F)
STEP 5: APPLY FIX per classification
STEP 6: ADVERSARIAL REVIEW (The Roast)  [G8 — different agent preferred]
  Run with a DIFFERENT agent instance or model when possible.
  If not practical, human must review the roast output for pulled punches —
  the same agent that proposed the fix will tend to defend it.
  - "What if this fix is wrong?"
  - "What edge case would break this?"
  - "What would an opponent argue?"
  Iterate until the fix survives.
STEP 7: VERSION AND LOG
  Patch (step fix) / Minor (knowledge expansion) / Major (value revision)
  Write changelog. Archive review.
```

### The Adversarial Growth Protocol (The Roast)

```
ROUND 1: PROPOSE — State the change and why it improves things
ROUND 2: ATTACK — Switch perspective (different agent preferred), find weakest point
ROUND 3: DEFEND OR ADAPT — Fix if the attack reveals a real flaw
ROUND 4: STRESS TEST — Apply to 3 cases: common, complex, novel
ROUND 5: COMMIT OR ABORT — Survives → version bump. Doesn't → log and defer.
```

### The Alignment Check Protocol

```
STEP 1: CAPTURE OUTPUT — What did the behavior produce?
STEP 2: STATE THE INTENT — Use the Intent Block from trajectory.
        What does the PERSON/USER need? Not what we did.
STEP 3: RUN VALUE TESTS — For each value at this altitude, ask its alignment tests.
        Record: ALIGNED | DRIFTING | MISALIGNED
STEP 4: TRACE FAILURES — Skill gap | Workflow gap | Linkage gap | Value gap
STEP 5: ACT per classification
STEP 6: VERIFY — Re-run value tests against proposed fix.
        Does it serve the value? Does it break another value?
```

---

## 11. Context Loading Tiers  [G1 — REPLACES v1 §11 "Temporal Scale / What Gets Loaded"]

The framework must not cost more context than it saves. Three tiers enforce this.

```
┌─────────────────────────────────────────────────────────────┐
│                   CONTEXT LOADING TIERS                      │
│                                                             │
│  HOT — Always loaded  ─────────────────────────────────     │
│  Target: < 1,500 tokens total                               │
│  Content:                                                   │
│    · BEHAVIOR.md identity section + handles only           │
│      (NOT full Value Blocks — just the handles table)       │
│    · Last 3 ledger entries                                  │
│    · Active story one-line handle (from story file header)  │
│    · PROJECT.md value resolution order (compact)            │
│  Purpose: Session orientation without context debt          │
│                                                             │
│  WARM — On demand, per task  ──────────────────────────     │
│  Target: < 3,000 tokens added                               │
│  Content:                                                   │
│    · Specific skill file(s) relevant to current task        │
│    · Specific workflow file(s) relevant to current task     │
│    · Active story Intent Block                              │
│  Trigger: Load when the first request in this domain        │
│  arrives. Keep loaded until the domain changes.             │
│                                                             │
│  COLD — Evaluation checkpoints only  ──────────────────     │
│  Target: Loaded once per checkpoint, not per session        │
│  Content:                                                   │
│    · Full Value Blocks (values/VALUES.md)                   │
│    · Full Intent Blocks for story/epic being evaluated      │
│    · Full PROJECT.md                                        │
│    · Evolution history if relevant                          │
│  Trigger: Story completion, epic completion, alignment check│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Evaluation Altitude

| Level       | Question                                     | What to evaluate             | Who evaluates  |
| ----------- | -------------------------------------------- | ---------------------------- | -------------- |
| **Session** | "Did the steps execute correctly?"           | Workflow execution only      | Agent alone    |
| **Story**   | "Did this deliver its intent?"               | Skill alignment + story vals | Agent drafts → Human approves |
| **Epic**    | "Is this group serving the purpose?"         | Epic vals + drift review     | Agent prepares → Human decides |
| **Project** | "Are we building the right thing?"           | Project vals + fundamentals  | Human-driven; agent provides data |

---

## 12. Session End Protocol  [G2 — agent-generated; G3 — human reviews]

**The agent executes steps 1-3. The human reviews and approves. The human does NOT write from scratch.**

```
AGENT EXECUTES:
1. Generate ledger entry:
   - Date, story, PM-Ref (from story file), behavior(s), outcome code
   - Drift signals (⚑) if noticed during session
   - Format per ledger.md schema

2. Update active story file:
   - Append session log entry: what was accomplished
   - Update carry-forward signals

3. Draft entry for human review:
   Present generated entry with:
   "Session log generated. Review and confirm [Y/N]?
    Any corrections or signals I missed?"

HUMAN APPROVES (or corrects and confirms):
4. Confirm or edit the ledger entry
5. Confirm or edit the story file update

6. If this session completes the story:
   → Both agent and human trigger Story Completion Checkpoint (§13)
```

---

## 13. Story Completion Checkpoint  [G2 — agent-generated; G3 — human approves]

```
AGENT EXECUTES — produces a DRAFT for human review:

1. Gather all session entries for this story from ledger.md

2. Draft story summary for trajectory/stories/completed/

3. Skill evaluation (double loop):
   - Did any skill reason prove wrong or incomplete?
   - Did we learn something new?
   - Draft skill file updates if needed

4. Story-altitude value evaluation:
   For each value with EVALUATION ALTITUDE: Story
   - Load full Value Blocks (cold tier — checkpoint)
   - Run alignment tests against story output + Intent Block
   - Draft: ALIGNED | DRIFTING | MISALIGNED per value
   - If DRIFTING or MISALIGNED → draft evolution review

5. Present to human:
   "Story evaluation draft ready. Review:
    · Story summary [Y/N + corrections]
    · Skill learnings [Y/N + corrections]
    · Value alignment: [table] [Y/N + corrections]
    Your judgment is authoritative."

HUMAN APPROVES — final authority above session altitude:
6. Review and approve/correct each section
7. Sign off: triggers archiving and carry-forward
```

---

## 14. Epic Completion Checkpoint  [G2 — agent-generated; G3 — human decides alignment]

```
AGENT EXECUTES — produces a DRAFT:

1. Gather all completed story files for this epic

2. Compile drift log from all stories

3. Epic-altitude value evaluation draft:
   For each value with EVALUATION ALTITUDE: Epic
   - Load full Value Blocks (cold tier)
   - Run alignment tests against cumulative output + epic Intent Block
   - Draft: ALIGNED | DRIFTING | MISALIGNED

4. Project-value evaluation draft:
   - Does this epic serve the project's Intent Block?
   - Has the project direction shifted?

5. Behavior evolution draft:
   - Skill updates needed? Workflow redesigns?

6. Present to human:
   "Epic evaluation draft ready. Key question:
    Does this epic serve '[one-line project intent handle]'?
    Review: [alignment table] [evolution proposals]
    Your judgment on direction is authoritative."

HUMAN DECIDES:
7. Alignment judgment — human makes the final call
8. Evolution approvals — human approves version bumps
9. Archive — trigger after human confirmation
```

---

## 15. Behavior Creation Protocol

*(Unchanged from v1 — same 7-phase process: Seed → Values → Harvest → Design → Link → Test → Stabilize.)*

**Addition:** In Phase 2 (Values), for each Value Block, write the ANALOGY LIMITS field before
stress-testing. This catches weak analogies before they become embedded in skill reasoning.

---

## 16. The Absorption Protocol

*(Unchanged from v1 — same 7-step process: Discover → Graph → Complement → Extract → Integrate → Reconcile → Evolve.)*

**Addition:** In Step 7 (Evolve), include analogy review: "Do absorbed analogies conflict with
existing analogies? Which better captures the real mechanism?"

---

## 17. Maturity Model

```
SEEDLING (v0.x or v1.0)
  Values defined but untested against real outputs.
  Linkage map may have gaps. ANALOGY LIMITS may be incomplete.

GROWING (v1.x after first evolution)
  Survived one evolution cycle with human approval at story altitude.
  Orphan analysis clean. 3+ scenarios tested.
  Value tests run against at least 3 real executions.
  ANALOGY LIMITS reviewed once.

PRACTICING (v2.x+, multiple evolution cycles)
  Survived adversarial review (different agent instance preferred).
  Alignment checks run at story + epic altitude with human approval.
  Absorption integrated and reconciled.
  No analogy rot detected (ANALOGY LIMITS reviewed per cycle).

MASTERED (v3.x+, stable over time)
  Evolution cycles produce only minor changes.
  Values stable — rarely produce Type F detections.
  PM deference fully established — trajectory supplements, not competes.
  Serves as reference for new behaviors.
```

---

## 18. Quick Reference

```
┌─────────────────────────────────────────────────────────┐
│           DEEP BEHAVIOR QUICK REFERENCE  v2.0           │
│                                                         │
│  LAYERS:                                                │
│    Values   (WHAT MATTERS) → Value Blocks (Gabe Lens)   │
│    Skills   (WHY)          → Prose + Gabe Blocks        │
│    Workflow (HOW)          → Steps + decision trees     │
│    Linkage  step → reason → value (grounding chain)     │
│    Trajectory (cross-session; references external PM)   │
│                                                         │
│  CONTEXT TIERS:                                         │
│    Hot  (<1,500t): handles + last 3 entries + handle    │
│    Warm (<3,000t): skill + workflow for current task    │
│    Cold (checkpoint only): full blocks + evaluations    │
│                                                         │
│  GABE LENS APPLIES TO:                                  │
│    ✓ Values (always — include ANALOGY LIMITS)           │
│    ✓ Complex skill reasons (include ANALOGY LIMITS)     │
│    ✓ Intent definitions (include ANALOGY LIMITS)        │
│    ✗ Workflows (keep concrete)                          │
│    ✗ Ledger entries (keep compact)                      │
│                                                         │
│  EVALUATION AUTHORITY:                                  │
│    Session → agent alone                                │
│    Story   → agent drafts, HUMAN APPROVES               │
│    Epic    → agent prepares, HUMAN DECIDES              │
│    Project → human-driven                               │
│                                                         │
│  ADVERSARIAL REVIEW:                                    │
│    Preferred: different agent instance / model          │
│    Fallback: same agent + human reviews for soft spots  │
│                                                         │
│  PROTOCOLS:                                             │
│    CREATE:  Seed → Values → Harvest → Design → Link    │
│             → Test → Ship                               │
│    EVOLVE:  Detect → Locate → Trace → Classify → Fix  │
│             → Roast (diff agent) → Version              │
│                                                         │
│  ROOT CAUSES:                                           │
│    A) Doing    = step wrong       → fix step            │
│    B) Knowing  = reason wrong     → fix reason+cascade  │
│    C) Linking  = wrong mapping    → fix linkage         │
│    D) Gap      = missing knowledge→ research+add        │
│    E) Drift    = world changed    → update both         │
│    F) Alignment= wrong direction  → triple loop         │
│                                                         │
│  KEY HANDLES:                                           │
│    "The clock that knows its purpose and maintains      │
│     itself"                                             │
│    "Values are the compass, skills the map,             │
│     workflows the legs"                                 │
│    "Treasure maps use landmarks, not street names"      │
│    "The ship's logbook reveals the drift"               │
│    "Ledger captures what no PM tool can see"            │
│                                                         │
│  FILE HOME: behaviors/ (content) + .claude/ (adapter)  │
│  PORTABILITY: behaviors/ is tool-agnostic markdown      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Appendix: v1 → v2 Gap Index

| Gap | Category           | v1                                   | v2                                              |
| --- | ------------------ | ------------------------------------ | ----------------------------------------------- |
| G1  | Context budget     | Uniform loading — no tiers           | Hot/Warm/Cold tiers with token targets          |
| G2  | Maintenance        | Human writes session log manually    | Agent generates; human reviews and approves     |
| G3  | Human authority    | Not explicit above session level     | Explicit authority table per altitude           |
| G4  | Analogy limits     | No failure mode documentation        | ANALOGY LIMITS field in all Gabe Lens blocks    |
| G5  | PM deference       | Trajectory parallel to external PM   | Ledger = unique artifact; stories link to PM    |
| G6  | Portability        | Claude Code specific throughout      | Content layer tool-agnostic; .claude/ = adapter |
| G7  | Cross-behavior     | No conflict resolution order         | Value resolution order in PROJECT.md            |
| G8  | Self-eval          | Same agent evaluates own output      | Different agent preferred; human reviews roast  |
