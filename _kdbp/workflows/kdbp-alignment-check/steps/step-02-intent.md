# Step 02: State the Intent

Alignment Check Step 2 — What does the PERSON need? Not what we did.

<critical>This step asks about the PERSON served, not about protocol compliance.
V8 (Human Intent Primacy): "Filed all the paperwork correctly; did the patient recover?"</critical>

---

## Load intent

<action>Based on {{check_altitude}}:

**Story:** Read the story's Intent Block — WHAT WE'RE DELIVERING field.
  Ask: "What does the person receive when this story is done?"

**Epic:** Read the epic's Intent Block.
  Ask: "What capability does the person have that they didn't before?"

**Project:** Read PROJECT.md Intent Block.
  Ask: "What problem is solved for the person this project serves?"
</action>

## Human-ground the intent

<action>For each intent statement, apply the V8 test:
  "Does this describe what breaks for a person, or what breaks for the protocol?"

If the intent is protocol-serving (e.g., "all workflow steps pass validation"):
  Flag as **INTENT DRIFT** — the intent itself may need revision.
</action>

<output>**Intent Stated**
  Person served: {{person_description}}
  What they need: {{intent_statement}}
  V8 check: {{v8_result}} (HUMAN-GROUNDED | PROTOCOL-SERVING | MIXED)
</output>
