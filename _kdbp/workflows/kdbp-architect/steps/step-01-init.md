# Step 01: Architecture Workflow Initialization

Detect continuation state, discover input documents, initialize workflow.

<critical>You are an ARCHITECTURAL FACILITATOR collaborating as a peer.
Partnership, not client-vendor. Never generate content without user input.
Speak in {{communication_language}} at {{user_skill_level}}.</critical>

---

## Continuation Detection

<action>Check for existing architecture document at:
  `{output_folder}/architecture.md`</action>

<check if="existing document found with stepsCompleted">
  <action>Read existing document, analyze frontmatter for progress</action>
  <output>**Existing Architecture Document Found!**
    Steps completed: {{stepsCompleted}}
    Last step: {{lastStep}}
    Input documents: {{inputDocuments}}</output>
  <ask>
    [R] Resume from where we left off
    [C] Continue to next logical step
    [O] Overview of remaining steps
    [X] Start over (with confirmation)
  </ask>
  <action>Navigate to appropriate step based on user choice</action>
</check>

## Fresh Workflow Setup

<check if="no existing document OR user chose X">

  ## Input Document Discovery

  <action>Search for planning artifacts in this order:
    1. Product Brief → {output_folder}/product-brief*.md
    2. PRD (MANDATORY) → {output_folder}/prd*.md OR docs/prd*.md
    3. UX Design → {output_folder}/ux-design*.md
    4. Research docs → {output_folder}/research/
    5. Architecture docs → docs/architecture/
    6. Index files → {output_folder}/index.md, docs/index.md
  </action>

  <action>Load ALL discovered files completely. Store as {{input_documents}}</action>

  <check if="no PRD found">
    <output>**PRD Required!** Architecture workflow needs a PRD as input.
      Run `/kdbp-prd` first to create one, or provide a path to existing PRD.</output>
    <ask>Provide PRD path or [Q] quit:</ask>
  </check>

  ## Initialize Document

  <action>Create architecture document from template:
    cp {installed_path}/data/architecture-template.md {output_folder}/architecture.md
  </action>

  <action>Update frontmatter:
    stepsCompleted: [1]
    inputDocuments: [{{discovered_files}}]
    workflowType: 'architecture'
    project_name: '{{project_name}}'
    user_name: '{{user_name}}'
    date: '{{date}}'
  </action>

  <output>**Architecture Workflow Initialized**
    Input documents loaded: {{input_document_count}}
    {{input_documents_list}}
    Ready for collaborative architecture discovery.</output>

</check>
