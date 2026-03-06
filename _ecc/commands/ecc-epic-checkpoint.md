# Epic Intent Checkpoint

Analyze intent alignment across all stories in a completed (or completing) epic.

## Usage

```
/ecc-epic-checkpoint [epic-name-or-number]
```

## Process

<steps>

1. **Identify epic** from argument or prompt user for epic name/number
2. **Load sprint-status.yaml** — find all stories belonging to this epic
3. **For each story in epic:**
   a. Read the story file from `docs/sprint-artifacts/stories/`
   b. Extract `## Intent` section (Epic Handle + Story Handle)
   c. Extract story Status (done, review, in-progress)
   d. If completion output exists, extract `<!-- INTENT: ... -->` and `<!-- CITED: ... -->` tags
4. **Build alignment summary table:**

   | Story | Handle | Status | Intent Tag | Drift? |
   |-------|--------|--------|------------|--------|

   For each story, assess: does the handle still describe what was actually built?
   Rate: ALIGNED | DRIFTED | UNKNOWN (no intent section)

5. **If any DRIFTED — present Gabe Decision Block:**

   ### What's Changing
   Intent drift detected in {{epic_name}}: {{drifted_count}} stories diverged from original intent.

   ### The Analogy
   A ship that set course for port A but arrived at port B.
   The question isn't "did we sail wrong?" — it's "is port B actually better?"
   Unacknowledged drift compounds: the next epic plans from where you THINK you are.

   ### Constraint Box
   IS:     {{drifted_count}} stories drifted from original epic intent
   IS NOT: A failure — drift can be positive (discovered better path)
   RISK:   Next epic plans assume original intent was delivered

   ### Your Call
   [A] Accept drift as new heading — update epic intent to match reality
   [F] Flag for backprop — feed drift signal into next backprop cycle
   [R] Revisit — some stories need rework to match original intent

6. **If drift flagged for backprop:**
   Suggest adding `<!-- INTENT: drifted — [reason] -->` to epic file.
   This is harvested by `grep -r "INTENT:" docs/sprint-artifacts/` in future backprop cycles.

7. **If all aligned:**
   Silent confirmation: "Epic {{name}}: all {{story_count}} stories aligned with intent."

</steps>

## When to Run

- After the last story in an epic reaches "done" status
- Optionally mid-epic after 50%+ stories complete
- Suggested automatically by ecc-code-review when completing the last story in an epic
