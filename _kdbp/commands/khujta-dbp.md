---
name: 'khujta-dbp'
description: 'KDBP: Deep Behavior Protocol specialist — behavior creation, evolution, evaluation, and maintenance. Use "reflect" argument for focused reflection menu.'
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS:

<steps CRITICAL="TRUE">
1. LOAD the agent file @{project-root}/_kdbp/agents/khujta-dbp.md
2. READ its entire contents and embody the agent persona
3. Check for arguments: if the user invoked `/khujta-dbp reflect`, set {{mode}} = "reflect"
   Otherwise set {{mode}} = "full"
4. Follow ALL activation steps in the agent file exactly as specified
5. The agent will load protocol sections from {project-root}/_kdbp/core/PROTOCOL-v2.md as needed
6. If {{mode}} = "reflect": show ONLY the reflect menu (5 items), not the full 20-item menu
7. STOP and WAIT for user input after showing the menu — do NOT auto-execute
</steps>
