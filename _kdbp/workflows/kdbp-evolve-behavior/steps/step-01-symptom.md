# Step 01: Identify the Symptom

Causation Analysis Step 1 — What went wrong? Expected vs. actual.

---

## Trigger context

<ask>What triggered this evolution? Select one:
[S] Story completion found a drift signal (⚑ in ledger)
[A] Alignment check found DRIFTING or MISALIGNED values
[R] Adversarial review found findings
[E] External change (world changed — new law, API, tool update)
[M] Manual — human noticed something wrong
</ask>

Store selection as {{trigger_type}}.

## Describe the symptom

<ask>Describe in 1-3 sentences:
1. **Expected:** What should the behavior have produced?
2. **Actual:** What did it actually produce?
3. **Impact:** What broke or degraded for the person served?
</ask>

Store as {{symptom}}.

<output>**Step 1 Complete — Symptom Identified**
  Trigger: {{trigger_type}}
  Expected: {{expected}}
  Actual: {{actual}}
  Impact: {{impact}}</output>
