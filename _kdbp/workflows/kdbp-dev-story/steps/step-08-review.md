# Step 08: Self-Review

Quick code-reviewer self-review before marking story review-ready.
Full review (security, architecture, TDD) runs separately via /kdbp-code-review.

<!-- O-007: Skip self-review for TRIVIAL stories — kdbp-code-review provides full external coverage. -->
<check if="{{task_count}} <= 2 AND {{file_count}} <= 3 AND NOT {{has_security_keywords}} AND NOT {{has_security_files}}">
  <output>**Step 08 Skipped — TRIVIAL story scope** (≤2 tasks, ≤3 files, no security signals).
    Self-review omitted. kdbp-code-review will provide full external review.
    Proceeding to Step 09.</output>
  <!-- goto step-08 -->
</check>

<critical>SELF-REVIEW: code-reviewer only. Full review runs via /kdbp-code-review.</critical>

<!-- Read changed files once — avoid agent reading independently -->
<action>Read ALL files in {{progress_tracker}}.files_changed using parallel Read calls</action>
<action>Store as {{file_contents_manifest}} for the review agent</action>

<ecc-spawn agent="code-reviewer">
  <task-call>
    subagent_type: "everything-claude-code:code-reviewer"
    model: "sonnet"
    max_turns: 7
    description: "Self-review for {{story_key}}"
    prompt: |
      ## Quick Self-Review
      **Story:** {{story_key}}
      **IMPORTANT: File contents provided below. Do NOT read files yourself.**

      **Project Patterns:** {{project_patterns}}

      **Review focus:** quality, error handling, performance, naming, DRY, obvious security issues

      **Adversarial Pattern Checklist** — tag findings with pattern IDs:
      - [P2] ORDERING: Are operations sequenced correctly? (e.g., read-before-write, check-before-act)
      - [P6] ORPHANED REFS: Do file paths, imports, or cross-references resolve to existing targets?
      - [P7] UNVALIDATED ASSUMPTIONS: Are there assumptions about external state (API shape, env vars,
        config values) that are not validated before use?
      - [P9] INCOMPLETE SPEC: Are data models, interfaces, or configs fully specified? (types, defaults, constraints)

      **Output (max 50 lines):**
      | # | Sev | Finding | file:line |
      Recommendation: APPROVE / CHANGES REQUESTED
      Score: X/10

      **P2 ORDERING verdict** (required): `ORDERING: clean` or `ORDERING: violated — [detail]`

      ---
      **FILE CONTENTS:**
      {{file_contents_manifest}}
  </task-call>
</ecc-spawn>

<action>Collect code review output</action>
<action>Extract {{p2_ordering_verdict}} from code-reviewer output (ORDERING: clean | violated)</action>

<check if="HIGH severity issues found">
  <action>Fix HIGH severity issues before proceeding</action>
  <action>Re-run affected tests</action>
</check>

<!-- Agent config integrity gate — catches misconfigured hooks/workflows before story closes -->
<action>Run agnix if installed:
```bash
if command -v agnix >/dev/null 2>&1; then
  agnix . 2>&1 | head -30
else
  echo "[INFO] agnix not installed — skipping config lint (install: npm install -g agnix)"
fi
```
If agnix reports violations in `_kdbp/hooks/` or `_kdbp/workflows/`: fix before proceeding.
If agnix not installed: note in output, do not block.
</action>
