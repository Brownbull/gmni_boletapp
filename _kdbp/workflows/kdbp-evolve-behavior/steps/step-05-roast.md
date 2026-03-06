# Step 05: Adversarial Review (The Roast)

Causation Analysis Step 6 — Challenge the proposed fix before committing.

<critical>Run with a DIFFERENT agent instance or model when possible.
If not practical, human MUST review the roast output for pulled punches —
the same agent that proposed the fix will tend to defend it.</critical>

---

## Round 1: Propose

<action>State the proposed change clearly:
  - What changed and why
  - Which files were modified
  - What improvement is expected
</action>

## Round 2: Attack

<action>Switch perspective. Find the weakest point of the proposed fix:
  - "What if this fix is wrong?"
  - "What edge case would break this?"
  - "What would an opponent argue?"
  - "Does this fix introduce a new problem elsewhere?"

Rate attack strength: STRONG (found real flaw) | WEAK (cosmetic concern) | SOFT (defended the proposal)
</action>

<check if="Attack rated SOFT">
  <output>**Soft punch detected.** The attack did not genuinely challenge the fix.
  Re-run Round 2 with explicit instruction: find the WEAKEST point, not any point.</output>
</check>

## Round 2b: Pattern Check

<action>Cross-reference the Round 2 finding against `_kdbp/knowledge/adversarial-patterns.md` (P1-P12).
If it matches a known pattern, tag it: `[P#] finding`. Known patterns carry more weight than novel findings.</action>

## Round 3: Defend or Adapt

<check if="Round 2 found a real flaw">
  <action>Adapt the fix to address the flaw. Do NOT dismiss valid attacks.</action>
</check>

<check if="Round 2 found no real flaw">
  <action>Defend the original fix with evidence from the failure chain.</action>
</check>

## Round 4: Stress Test

<action>Apply the fix (mentally or on paper) to 3 cases:
  1. **Common:** A typical use case the behavior handles daily
  2. **Complex:** A multi-step scenario with dependencies
  3. **Novel:** A scenario the behavior has never seen (from a different domain if possible)

For each: does the fix hold? Does it degrade anything?
</action>

## Round 5: Commit or Abort

<ask>The roast is complete. Binary decision — no hedging (V5):
[C] **Commit** — fix survives all rounds, proceed to versioning
[A] **Abort** — fix does not survive, log findings and defer to next cycle
</ask>

<check if="Abort selected">
  <action>Log the evolution attempt in `evolution/` with:
    - Date, symptom, classification, proposed fix, reason for abort
    - Carry-forward: what would need to change for this fix to work?</action>
  <output>**Evolution aborted.** Logged to evolution/. No version bump.</output>
  <stop/>
</check>
