# Step 09: Epic Checkpoint [GL] + [EC]

DBP behavioral close for epic creation. Ledger entry + Epic Completion Checkpoint.

<critical>GATED ON {{dbp_active}}. If false, this entire step is a no-op.</critical>

---

<check if="{{dbp_active}} == false">
  <output>**[Step 09] Skipped** — No behaviors registered.</output>
</check>

<check if="{{dbp_active}} == true">

  ## [GL] Session Ledger Entry

  <action>Draft ledger entry for epic creation session:
    | Date | Story | PM-Ref | Behavior | Outcome | Signals |
    | {{date}} | {{epic_names}} | epic-create | {{behavior_names}} | ✓ done | {{epic_drift_signals}} |
  </action>
  <action>Append row to behaviors/trajectory/ledger.md (auto-write, no confirmation needed)</action>
  <output>**[GL] Ledger Entry Written:**
    | {{date}} | {{epic_names}} | epic-create | {{behavior_names}} | ✓ done | {{signals}} |
  </output>

  ## [EC] Epic Completion Checkpoint

  <action>For each epic created, generate an Intent Block:
    1. **What the person receives:** One sentence — what improves for the end user
    2. **Analogy:** Physical-system analogy (Gabe Lens format)
    3. **Done-when:** Observable exit condition — all stories in epic pass review
  </action>

  <action>Write Intent Blocks to each epic file as `## Intent` section (after header)</action>

  <output>**[EC] Epic Intent Blocks Generated:**
    {{#each epics}}
    - {{epic_name}}: "{{intent_analogy}}"
    {{/each}}

    Intent blocks embedded in epic files for story-level inheritance.</output>

  <!-- Carry-forward signals -->
  <check if="any drift signals detected during epic creation">
    <output>**Carry-forward signals:**
      {{epic_drift_signals}}
      These will appear in next session's behavior load (Step 0).</output>
  </check>

</check>
