# Step 03: Classify — Match Findings to L2 Taxonomy

Two-step classification: deterministic keyword detection, then semantic reasoning.
Use planner agent for synthesis quality on this step.

<step n="3" goal="Classify findings against L2 taxonomy" tag="classify">

  <action>Load docs/02-understand/01-taxonomy/01-meta-patterns.md -> {{meta_patterns}}
    Load docs/02-understand/01-taxonomy/02-code-patterns.md -> {{code_patterns}}</action>

  <!-- Step 1: Deterministic keyword check -->
  <action>DETERMINISTIC CHECK — for each pattern, report keyword hit count:
    L2-001 (Wrong-Path Spiral): reverts with >500 line delta; "sync", "migration", "real-time" in epic titles
    L2-002 (Blast-Radius Cleanup): PRs with >100 file changes; "consolidate", "cleanup", "extract"
    L2-003 (Context Thrashing): single commits >5MB or >1000 errors; "re-align everything"
    L2-004 (Churn Indicator): any file edited >20x in commit history
    L2-005 (Parallel Epic Collision): overlapping epic date ranges in sprint-status.yaml
    L2-006 (Sprint Overhead Spiral): PR count / feature count ratio > 2.0
    L2-007 (E2E Sinkhole): CI config changes > 10; e2e PRs with no green runs
    L2-008 (Consensus Drift): "standardize", "align", "per-component" without compression trigger</action>

  <!-- Step 2: Semantic reasoning — catches what keywords miss -->
  <action>SEMANTIC CHECK — for each finding in {{key_findings}}, assess:
    Which L2 pattern does this most closely resemble?
    Rate: STRONG / MEDIUM / WEAK / NONE
    Note: L2-008 has NO keyword gate — semantic is its only detector.
    Consider flagged outliers from Step 2 when rating.</action>

  <action>Build classification table:
    Pattern | Keyword hit | Semantic rating | Evidence file | Confidence (HIGH/MED/LOW)
    HIGH = keyword hit + semantic STRONG, or semantic STRONG with direct cost evidence
    MED  = keyword hit only, or semantic MEDIUM
    LOW  = weak signal, may be noise</action>

  <output>**L2 Classification Results**

    | Pattern | Name               | Keyword | Semantic | Confidence |
    |---------|--------------------|---------|----------|------------|
    | L2-001  | Wrong-Path Spiral  | {{l2_001_kw}} | {{l2_001_sem}} | {{l2_001_conf}} |
    | L2-002  | Blast-Radius Cleanup | {{l2_002_kw}} | {{l2_002_sem}} | {{l2_002_conf}} |
    | L2-003  | Context Thrashing  | {{l2_003_kw}} | {{l2_003_sem}} | {{l2_003_conf}} |
    | L2-004  | Churn Indicator    | {{l2_004_kw}} | {{l2_004_sem}} | {{l2_004_conf}} |
    | L2-005  | Parallel Collision | {{l2_005_kw}} | {{l2_005_sem}} | {{l2_005_conf}} |
    | L2-006  | Sprint Overhead    | {{l2_006_kw}} | {{l2_006_sem}} | {{l2_006_conf}} |
    | L2-007  | E2E Sinkhole       | {{l2_007_kw}} | {{l2_007_sem}} | {{l2_007_conf}} |
    | L2-008  | Consensus Drift    | N/A | {{l2_008_sem}} | {{l2_008_conf}} |

    **Active patterns (HIGH):** {{active_patterns}}
    **Possible patterns (MED):** {{possible_patterns}}
    **New patterns (no existing L2 ID):** {{novel_patterns}}

    Proceeding to Step 4: Neuron file creation for HIGH confidence patterns.</output>

</step>
