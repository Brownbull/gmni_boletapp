# KDBP Critical Points — What Makes It Work

Ten mechanisms that make the framework reliable. Each has an analogy.
See [FRAMEWORK.md](FRAMEWORK.md) for the architecture diagram and command table.

---

## 1. Graceful Degradation (`{{dbp_active}}` flag)

**Problem:** KDBP must work even if no behaviors exist yet.

Step 00 checks `behaviors/REGISTRY.md`. If missing or empty:
- Sets `{{dbp_active}} = false`, warns once
- All later DBP checks become **no-ops** (zero overhead)
- Suggests `/khujta-dbp` → [TI] or [CB] to set up behaviors

**Analogy:** Smoke detector with no battery — wiring is there, building works,
you just don't get alerts until you install one.

---

## 2. Context Tier Discipline

Behavior data loads in tiers to avoid polluting the context window:

| Tier | When | What | Budget |
|------|------|------|--------|
| **Hot** | Step 00 (always) | Value handles + last 3 ledger entries | <1,500 tokens |
| **Warm** | Never in dev workflows | Full skill/workflow files (DBP agent only) | — |
| **Cold** | [SC]/[EC] checkpoints only | Full Value Blocks for alignment eval | On demand |

**Analogy:** Dashboard shows speed + fuel (hot). Manual in the glove box (warm).
Full engine diagnostic only at the shop (cold).

---

## 3. Value Handle Caching

Compressed one-liners cached at Step 00:
```
V1: "Name the section before pulling the lever."
V2: "Nurse handles vitals, surgeon decides the OR."
```

Survive context compaction (short + stored early). Later ledger entries and checkpoint
evaluations reference `V1`, `V2`.

**Analogy:** Post-it notes on the monitor. Policy manual on the shelf,
but post-its are enough for shift decisions.

---

## 4. Ledger = Always Draft, Always Human-Confirmed

Every ledger entry: **DRAFT → human reviews → human confirms → write**.

The agent NEVER writes to `behaviors/trajectory/ledger.md` without confirmation.

**Analogy:** You sign the logbook, not the machine.

---

## 5. Feed-Forward Gates (FF-A, FF-B, FF-C)

Three layers of pattern detection from the backprop analysis:

| Layer | What | Where in KDBP |
|-------|------|---------------|
| **FF-A** | Keyword gates (L2-001, L2-003, L2-007) | pre-edit-guard hook (all commands) |
| **FF-B** | Semantic drift (L2-005, L2-008, L2-009) | dev-story/02, create-story/03, create-epics/02 |
| **FF-C** | Compound health (churn + LOC + fix:feat) | create-epics/08 |

**Analogy:** FF-A = smoke detector (catches keywords). FF-B = doctor (reads symptoms).
FF-C = annual physical (checks overall health).

---

## 6. Hook Enforcement (11 Hooks, All Tier 1)

Hooks fire on every tool call — independent of workflow compliance.

| Hook | Event | What It Enforces |
|------|-------|------------------|
| `pre-edit-guard.py` | PreToolUse:Edit | BLOCKS >200 lines, protected paths, FF-A gates |
| `pre-write-guard.py` | PreToolUse:Write | BLOCKS >200 lines, requires ADR for new src/, P1 infra checks |
| `post-edit-warn.py` | PostToolUse:Edit | WARNS approaching 200-line limit |
| `post-edit-typecheck.sh` | PostToolUse:Edit | TypeScript type-check after every edit |
| `post-read-tracker.py` | PostToolUse:Read | Tracks file reads (context usage signal) |
| `post-bash-script-guard.sh` | PostToolUse:Bash | Guards against dangerous bash patterns |
| `post-memory-notify.sh` | PostToolUse:W\|E | Notifies on memory file changes |
| `session-start.sh` | SessionStart | Initializes session tracking |
| `session-budget.py` | PreCompact | Warns at 3+ compactions |
| `session-stop.sh` | Stop | Logs session cost and duration |
| `pre-commit.sh` | pre-commit (git) | Sprint-status.yaml consistency |

**Key insight:** "If it's not a hook, it's a suggestion. Suggestions get ignored."

---

## 7. Workflow Cost Tracking

Dev workflows run `workflow-cost --csv --stats` at completion — mandatory, never skippable.

| Workflow | Completion Step | Command |
|----------|----------------|---------|
| `/kdbp-dev-story` | step-09 | `workflow-cost --csv --stats --workflow "kdbp-dev-story" --story "{{story_key}}"` |
| `/kdbp-code-review` | step-08 | `workflow-cost --csv --stats --workflow "kdbp-code-review" --story "{{story_key}}"` |
| `/kdbp-create-story` | step-08 | `workflow-cost --csv --stats --workflow "kdbp-create-story" --story "{{story_key}}"` |

The full terminal output (including the COST NOTICE box) is stored as `{{cost_report_output}}`
and presented in the completion summary under **Session Cost**.

Also included in completion output:
- Story status + task count + coverage %
- Architectural validation results (file location / pattern / anti-pattern ACs)
- E2E coverage gaps (if UI changes detected on critical paths)
- Backend deploy targets (if backend files changed)
- Git staging verification + commit commands
- P3 usage tracking tags (`<!-- CITED: L2-004, L2-006 -->`)
- Intent alignment tags (`<!-- INTENT: aligned -->`)

**Analogy:** The fuel receipt at the end of the trip — you always know what it cost.

---

## 8. Capability Contract (PRD → Everything)

`/kdbp-prd` step-07 produces Functional Requirements (FRs). This is THE contract:

- UX designers ONLY design what's in FRs
- Architects ONLY support what's in FRs
- Epics ONLY implement what's in FRs

**If a capability is missing from the FR list, it will NOT exist.**

---

## 9. A/P/C Collaboration Menus

Planning workflows offer three options at decision points:

| Option | Name | What It Does |
|--------|------|------------|
| **[A]** | Advanced Elicitation | Deep dive — edge cases, hidden requirements |
| **[P]** | Party Mode | Devil's advocate — challenge assumptions |
| **[C]** | Continue | Move to next step (default) |

---

## 10. The `/khujta-dbp` Agent (20 Protocols)

Standalone agent for ALL direct behavior management:

| Category | Protocols | Purpose |
|----------|-----------|---------|
| **Create** | [CB] [MB] [AB] [EB] | Create behavior, milestone, story, epic |
| **Trajectory** | [TI] [TR] [RC] | Initialize, read, reconstruct trajectory |
| **Evaluate** | [SC] [EC] [GL] [EA] | Story/epic/session/evolution checkpoints |
| **Work** | [WI] [WV] [WG] | Intent blocks, value weave, grounding chains |
| **Maintain** | [LM] [LB] [MA] [SP] | Ledger maintenance, load, merge, split |
| **Query** | [QR] [DA] | Quick reference, deep analysis |

Loads protocol definitions from `_kdbp/core/PROTOCOL-v2.md` on demand.
NEVER invoked automatically — only by user running `/khujta-dbp`.

[EB] and [EA] also have dedicated workflows (`kdbp-evolve-behavior`, `kdbp-alignment-check`)
that implement §10 Evolution Engine as step-by-step sequences with The Roast and value tests.

---

## Directory Structure

```
_kdbp/
├── .claude/settings.json          ← Hook wiring (11 hooks)
├── agents/khujta-dbp.md           ← DBP specialist agent (20 protocols)
├── behaviors/                     ← Template stubs (populated per-project)
│   ├── REGISTRY.md
│   └── trajectory/
│       ├── ledger.md
│       ├── PROJECT.md
│       ├── stories/{active,completed}/
│       └── epics/{active,completed}/
├── commands/                      ← 12 slash commands
├── core/                          ← Self-contained engine (forked from BMAD)
│   ├── PROTOCOL-v2.md             ← Canonical protocol spec (forked, 961 lines — whitelisted in hook)
│   ├── workflow.xml
│   ├── config.yaml
│   └── advanced-elicitation/
├── hooks/                         ← 11 enforcement hooks (all Tier 1)
├── knowledge/                     ← 3 reference docs
└── workflows/                     ← 11 workflows (98 step files total)
    ├── kdbp-dev-story/      (12)  ├── kdbp-brainstorm/    (6)
    ├── kdbp-code-review/    (10)  ├── kdbp-architect/     (8)
    ├── kdbp-create-story/   (10)  ├── kdbp-ux-design/     (7)
    ├── kdbp-create-epics/   (13)  ├── kdbp-prd/          (10)
    ├── kdbp-evolve-behavior/ (7)  ├── kdbp-alignment-check/  (6)
    └── kdbp-init/            (9)  ← One-time onboarding
```
