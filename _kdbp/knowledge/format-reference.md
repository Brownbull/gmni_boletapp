# DBP Format Reference

<!-- Extracted from PROTOCOL-v2.md §3-9, §17. Loaded on-demand when writing blocks.
     See PROTOCOL-v2.md for full context and examples. -->

## Where Gabe Lens Applies (§3)

| Layer | When | Format |
|-------|------|--------|
| Values | ALWAYS | Value Block |
| Skills (complex) | Trade-offs, counter-intuitive reasons | Gabe Block |
| Skills (simple) | Self-evident facts | Plain prose |
| Workflows | NEVER | Steps + decision trees |
| Intent | ALWAYS | Intent Block |
| Ledger | NEVER | Structured table |

**Rule:** Gabe Lens for direction and meaning. Plain structure for execution and recording.

---

## Value Block (§4) — 7 mandatory fields

```
VALUE BLOCK: [Value Name]

THE INTENT — What goes wrong for the PERSON served when violated?
THE ANALOGY — Physical system: aligned vs. misaligned feels like what?
CONSTRAINT BOX — IS / IS NOT / DECIDES
ONE-LINE HANDLE — 5-10 words, survives compaction
ALIGNMENT TESTS — 2-3 compass-reading questions
ANALOGY LIMITS — Where does the analogy break? When to revisit?
EVALUATION ALTITUDE — Session | Story | Epic | Project
```

---

## Gabe Block (§5) — for complex skill reasons

```
GABE BLOCK: [Reason Name]

THE PROBLEM — What breaks without this knowledge?
THE ANALOGY — Physical system mapping (spatial, visualizable)
THE MAP — ASCII diagram (optional, for complex relationships)
CONSTRAINT BOX — IS / IS NOT / DECIDES
ONE-LINE HANDLE — 5-10 words
ANALOGY LIMITS — Where does it break? When to revisit?
SIGNAL — Quick check or Deeper question
```

---

## Intent Block (§8) — 6 mandatory fields

```
INTENT BLOCK: [Name] — [level: story|epic|project]

WHAT WE'RE DELIVERING — What does the person RECEIVE? (not what we build)
THE ANALOGY — Physical system, survives architecture changes
CONSTRAINT BOX — IS / IS NOT / DECIDES
ONE-LINE HANDLE — 5-10 words
ANALOGY LIMITS — Where does it break if product evolves?
DONE WHEN — 2-3 concrete observable outcomes
```

---

## BEHAVIOR.md Format (§7)

```yaml
---
behavior: [name]
version: 1.0.0
domain: [description]
maturity: seedling | growing | practicing | mastered
last_evolution: YYYY-MM-DD
---
```

Sections: Identity, Value Manifest (table), Skill Manifest (table),
Workflow Manifest (table), Linkage Map (step→reason→value), Orphan Analysis.

---

## Trajectory Formats (§9)

### PROJECT.md
```yaml
---
project: [name]
version: [semver]
last_reviewed: YYYY-MM-DD
active_behaviors: [list]
external_pm: github | linear | jira | none
external_pm_url: [base URL]
---
```
Sections: Project Intent (Intent Block), Project-Level Values,
Value Resolution Order (G7), Active Epics, Behaviors In Use.

### ledger.md
```
| Date | Story | PM-Ref | Behavior | Outcome | Signals |
Outcome: done | ~ partial | blocked | drift detected
```

### Story Files
```yaml
---
story: [id]
epic: [epic-id]
pm_ref: [URL]
status: active | completed
sessions: N
behaviors: [list]
---
```
Sections: Intent (Intent Block), Session Log, Carry-Forward Signals.

---

## File Architecture (§6)

```
behaviors/              # CONTENT LAYER — tool-agnostic
  REGISTRY.md
  trajectory/
    PROJECT.md
    ledger.md
    stories/active/ + completed/
    epics/active/ + completed/
  [behavior-name]/
    BEHAVIOR.md
    values/VALUES.md
    skills/
    workflow/
    evolution/

.claude/                # INTEGRATION LAYER — Claude Code adapter
  commands/
  settings.json
```

---

## Maturity Model (§17)

| Level | Version | Key Criteria |
|-------|---------|-------------|
| **Seedling** | v0.x-v1.0 | Values defined, ANALOGY LIMITS present, linkage map exists |
| **Growing** | v1.x+ | 1+ evolution cycle with human approval, orphan analysis clean, 3+ scenarios tested |
| **Practicing** | v2.x+ | Adversarial review survived, alignment checks at story+epic, no analogy rot |
| **Mastered** | v3.x+ | Evolution produces only minor changes, values stable, serves as reference |
