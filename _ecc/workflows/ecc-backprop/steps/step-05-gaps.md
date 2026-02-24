# Step 05: Gaps — Map Neurons to Prevention Layers

For each L2 neuron, identify which prevention layers cover it and what's missing.

<step n="5" goal="Map L2 neurons to FF-A, FF-B, FF-C prevention layers" tag="gaps">

  <action>Load docs/03-act/01-prevention/01-process-gates.md -> {{ff_a_gates}}
    Load docs/03-act/01-prevention/02-semantic-detection.md -> {{ff_b_gates}}
    Load docs/03-act/01-prevention/03-behavioral-monitoring.md -> {{ff_c_signals}}</action>

  <action>For each pattern in {{active_patterns}}, check 09-baseline.json:
    FF-A: Is a hook or workflow gate registered for this pattern? -> {{ff_a_covered}}
    FF-B: Are semantic keywords embedded in step-01-prerequisites or step-02-classification? -> {{ff_b_covered}}
    FF-C: Does behavioral-health-snapshot.sh track this signal? -> {{ff_c_covered}}</action>

  <action>Classify each gap:
    CRITICAL — HIGH confidence pattern + zero coverage in any layer
    PARTIAL   — coverage in 1-2 layers only
    COVERED   — all 3 layers present (may still need calibration)</action>

  <action>Build gap table:
    Pattern | FF-A | FF-B | FF-C | Class | Recommended Action</action>

  <output>**Prevention Layer Coverage**

    | Pattern | FF-A | FF-B | FF-C | Class    |
    |---------|------|------|------|----------|
    {{gap_table_rows}}

    **CRITICAL gaps (no coverage):** {{critical_gaps}}
    **PARTIAL coverage:** {{partial_gaps}}
    **Fully covered:** {{covered_patterns}}

    ---
    **Gabe Decision Block — Gate Priority**

    > Three layers = smoke detectors (FF-C) + alarms (FF-A) + fire inspectors (FF-B).
    > A CRITICAL gap = no detector at all. Fix those first — one undetected pattern
    > can consume a month of sessions.
    > A PARTIAL gap = detector but no alarm. Tolerable for low-cost patterns.
    > Don't add gates for everything — false alarm fatigue kills the system.
    > Target: CRITICAL gaps → 0. PARTIAL gaps → tolerate if pattern cost was <3 sessions.

    ---

    Proceeding to Step 6: Action item creation.</output>

</step>
