# Step 10: Story Checkpoint [SC]

DBP bookend closing step. Evaluates behavioral alignment after story completion.
Gated on `{{dbp_active}}` — skips entirely if no behaviors registered.

<check if="{{dbp_active}} == false">
  <output>**Step 10 Skipped** — No behaviors registered (`dbp_active = false`).</output>
</check>

<check if="{{dbp_active}} == true">

  <!-- Load cold tier: full behavior values for evaluation -->
  <action>Load FULL behavior file: {behaviors_path}/{{behavior_name}}/BEHAVIOR.md</action>
  <action>Load story file: {{story_file}} (already in context from step-09)</action>

  <!-- Quick alignment scan — not a full EA, just a story-scoped check -->
  <action>For each value in the behavior's Value Manifest, assess:
    - Was this value **exercised** (actively guided a decision in this story)?
    - Was this value **neutral** (not relevant to this story's scope)?
    - Was this value **violated** or **drifted** (implementation contradicts the value)?

    Only flag exercised or violated — neutral values are silent.
  </action>

  <check if="any value was violated or drifted">
    <output>**[SC] STORY CHECKPOINT — Drift Detected**

      Story: {{story_key}}
      Behavior: {{behavior_names}}

      **Violations/Drift:**
      {{drift_details}}

      This is a recording — no action required now.
      Use `/khujta-dbp EA` for full alignment evaluation if concerned.
    </output>
    <action>Append drift signals to ledger entry for this story (update last row)</action>
  </check>

  <check if="no violations or drift">
    <output>**[SC] Story Checkpoint: aligned.** No drift detected for {{story_key}}.</output>
  </check>

</check>
