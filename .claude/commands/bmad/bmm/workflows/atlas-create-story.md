---
description: "Create stories with Atlas workflow chain analysis - identifies impacts on existing workflows and provides push alerts for downstream effects"
---

Load the workflow definition from `_bmad/bmm/workflows/4-implementation/atlas-create-story/workflow.yaml` and execute the instructions from `_bmad/bmm/workflows/4-implementation/atlas-create-story/instructions.xml`.

This is an Atlas-enhanced version of create-story that includes:
- Workflow chain analysis against existing user journeys
- Push alerts if story affects existing workflows
- Additional acceptance criteria suggestions based on workflow impact
- Memory feeding to Atlas after story creation

Execute the workflow steps in order, consulting Atlas memory where indicated.
