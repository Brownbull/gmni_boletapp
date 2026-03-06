# Step 06: Value Curation

Human authority gate. The user approves the final value set. Agent has proposed and challenged;
now the human decides.

<critical>HUMAN AUTHORITY: Every value in the final set must be explicitly approved by the user.
The agent never writes values to disk without this confirmation.</critical>

---

## Present final candidate set

<output>**Value Curation — Your Decision**

  Behavior: `{{behavior_name}}` v{{behavior_version}} (seedling)

  **Surviving values ({{challenged_value_count}}):**
  {{for each challenged value}}
  {{n}}. **{{value_name}}** — "{{one_line_handle}}"
     Challenge status: {{challenge_status}}
     Altitude: {{evaluation_altitude}}
  {{end for}}

  {{if demoted_to_skills is not empty}}
  **Demoted to skills ({{demoted_count}}):**
  {{for each demoted}}
  - ~~{{value_name}}~~ → skill (reason: {{demote_reason}})
  {{end for}}
  {{end if}}</output>

## User curation

<ask>
This is your final say on values. You can:
**[Y] Accept** this set as-is
**[E] Edit** — modify any value's name, handle, or content
**[A] Add** a new value (will need a quick challenge pass)
**[R] Remove** a surviving value
**[P] Promote** a demoted skill back to value (human override)
</ask>

<check if="user chose [E] Edit">
  <action>Ask which value and what to change. Apply edits. Re-present.</action>
</check>

<check if="user chose [A] Add">
  <action>Ask user to describe the value. Generate a Value Block.
  Run the 5 challenge questions from Step 05 (quick pass).
  Add to set. Re-present.</action>
</check>

<check if="user chose [R] Remove">
  <action>Ask which to remove. Remove from set. Re-present.</action>
</check>

<check if="user chose [P] Promote">
  <action>Ask which skill to promote. Move back to values with "human override" flag.
  Re-present.</action>
</check>

## Confirm final set

<action>After all edits, present the final set one more time.</action>

<ask>
**Final confirmation.** These {{final_value_count}} values will be written to
`behaviors/{{behavior_name}}/VALUES.md`. Once written, they can be evolved
through `/khujta-dbp` → [EB] Evolve, but this is your starting compass.

**[Y] Confirm and proceed to scaffold**
**[E] One more edit**
</ask>

<action>Store final confirmed values as {{final_values}}.
Store final skills (demoted) as {{final_skills}}.</action>

<output>**Values confirmed.** {{final_value_count}} values locked for `{{behavior_name}}`.
  Next: creating the file structure.</output>
