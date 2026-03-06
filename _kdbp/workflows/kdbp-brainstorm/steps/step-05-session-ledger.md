# Step 05: Session Ledger [GL]

DBP behavioral close for brainstorming session. Record in ledger.

<critical>GATED ON {{dbp_active}}. If false, this entire step is a no-op.</critical>

---

<check if="{{dbp_active}} == false">
  <output>**[Step 05] Skipped** — No behaviors registered.</output>
</check>

<check if="{{dbp_active}} == true">

  <action>Draft ledger entry for brainstorming session:
    | Date | Story | PM-Ref | Behavior | Outcome | Signals |
    | {{date}} | brainstorm:{{session_topic}} | brainstorm | {{behavior_names}} | ✓ done | {{session_drift_signals}} |
  </action>

  <action>Append row to behaviors/trajectory/ledger.md (auto-write, no confirmation needed)</action>
  <output>**[GL] Ledger Entry Written:**
    | {{date}} | brainstorm:{{session_topic}} | brainstorm | {{behavior_names}} | ✓ done | {{signals}} |
  </output>

  <!-- Carry-forward: note if brainstorming revealed behavioral insights -->
  <check if="ideas touched on behavior-relevant themes">
    <output>**Behavioral Insight:**
      Brainstorming session touched on themes related to {{relevant_values}}.
      Consider reviewing these ideas against behavior value blocks.</output>
  </check>

</check>
