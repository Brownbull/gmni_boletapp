# Deep Behavior Quick Reference v2.0

<!-- Extracted from PROTOCOL-v2.md §18. This is the DEFAULT agent load — ~240 tokens. -->

```
LAYERS:
  Values   (WHAT MATTERS) → Value Blocks (Gabe Lens)
  Skills   (WHY)          → Prose + Gabe Blocks
  Workflow (HOW)          → Steps + decision trees
  Linkage  step → reason → value (grounding chain)
  Trajectory (cross-session; references external PM)

CONTEXT TIERS:
  Hot  (<1,500t): handles + last 3 entries + handle
  Warm (<3,000t): skill + workflow for current task
  Cold (checkpoint only): full blocks + evaluations

GABE LENS APPLIES TO:
  YES: Values (always), complex skill reasons, intent definitions
       — all include ANALOGY LIMITS field
  NO:  Workflows (keep concrete), ledger entries (keep compact)

EVALUATION AUTHORITY:
  Session → agent alone
  Story   → agent drafts, HUMAN APPROVES
  Epic    → agent prepares, HUMAN DECIDES
  Project → human-driven

ADVERSARIAL REVIEW:
  Preferred: different agent instance / model
  Fallback: same agent + human reviews for soft spots

PROTOCOLS:
  CREATE:  Seed → Values → Harvest → Design → Link → Test → Ship
  EVOLVE:  Detect → Locate → Trace → Classify → Fix → Roast → Version

ROOT CAUSES:
  A) Doing    = step wrong       → fix step
  B) Knowing  = reason wrong     → fix reason+cascade
  C) Linking  = wrong mapping    → fix linkage
  D) Gap      = missing knowledge→ research+add
  E) Drift    = world changed    → update both
  F) Alignment= wrong direction  → triple loop

KEY HANDLES:
  "The clock that knows its purpose and maintains itself"
  "Values are the compass, skills the map, workflows the legs"
  "Treasure maps use landmarks, not street names"
  "The ship's logbook reveals the drift"
  "Ledger captures what no PM tool can see"
  "Record everything, evaluate when it matters"

FILE HOME: behaviors/ (content) + .claude/ (adapter)
PORTABILITY: behaviors/ is tool-agnostic markdown
```
