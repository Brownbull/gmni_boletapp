# Atlas Agent Installer

A bash script to install, update, or uninstall the Atlas Agent in BMAD-enabled projects.

## Quick Start

```bash
# Check installation status
./atlas-installer.sh status /path/to/your-project

# Fresh install (for projects without Atlas)
./atlas-installer.sh install /path/to/your-project

# Update existing Atlas installation
./atlas-installer.sh update /path/to/your-project

# Remove Atlas from a project
./atlas-installer.sh uninstall /path/to/your-project
```

## Requirements

- Target project must have BMAD BMM module installed (`_bmad/bmm/`)
- Bash 4.0+ recommended
- Write permissions to target project

## What Gets Installed

### Atlas Agent Core
- `_bmad/agents/atlas/atlas.agent.yaml` - Agent definition
- `_bmad/agents/atlas/atlas-sidecar/` - Memory and instructions
- `_bmad/agents/atlas/docs/` - Documentation
- `_bmad/agents/atlas/templates/` - Memory template

### Atlas-Enhanced Workflows
- `atlas-create-story` - Story creation with workflow chain analysis
- `atlas-code-review` - Code review with architecture validation
- `atlas-retrospective` - Retrospective with lesson feeding
- `atlas-e2e` - Persona-driven E2E test generation

### Slash Commands
- `/bmad:agents:atlas` - Main Atlas agent
- `/bmad:bmm:workflows:atlas-create-story`
- `/bmad:bmm:workflows:atlas-code-review`
- `/bmad:bmm:workflows:atlas-retrospective`
- `/bmad:bmm:workflows:atlas-e2e`

## Commands

### status

Check the current Atlas installation status:

```bash
./atlas-installer.sh status /path/to/project
```

Shows:
- Whether Atlas Agent is installed (and version)
- Whether Atlas workflows are installed
- Whether slash commands are installed
- Recommendations for next steps

### install

Fresh installation for projects without Atlas:

```bash
./atlas-installer.sh install /path/to/project
```

This will:
1. Verify BMAD BMM module exists
2. Create `_bmad/agents/atlas/` with all files
3. Create Atlas-enhanced workflows
4. Create slash commands
5. Initialize fresh `atlas-memory.md` from template

### update

Update an existing Atlas installation:

```bash
./atlas-installer.sh update /path/to/project
```

This will:
1. Backup existing `atlas-memory.md`
2. Update agent core files
3. Update or add Atlas workflows
4. Update or add slash commands
5. Preserve your existing memory content

### uninstall

Remove Atlas from a project:

```bash
./atlas-installer.sh uninstall /path/to/project
```

This will:
1. Backup `atlas-memory.md` to project root
2. Remove `_bmad/agents/atlas/`
3. Remove Atlas workflows
4. Remove Atlas slash commands
5. Leave standard BMAD workflows untouched

## After Installation

1. **Initialize Atlas Memory**
   ```
   /bmad:agents:atlas
   ```
   Select `sync` to populate memory from your PRD, architecture, etc.

2. **Start Using Atlas Workflows**
   - `/bmad:bmm:workflows:atlas-create-story` for new stories
   - `/bmad:bmm:workflows:atlas-code-review` for code reviews
   - `/bmad:bmm:workflows:atlas-retrospective` for retrospectives
   - `/bmad:bmm:workflows:atlas-e2e` for E2E test generation

## Sharded Memory Architecture (v2.1+)

Atlas now uses **index-guided selective loading** to prevent context explosion:

```
atlas-sidecar/
├── atlas-index.csv           # Knowledge fragment index
├── instructions.md           # Core directives
└── knowledge/                # Sharded knowledge (9 fragments)
    ├── 01-purpose.md         # App mission, principles
    ├── 02-features.md        # Feature inventory
    ├── 03-personas.md        # User personas
    ├── 04-architecture.md    # Tech stack, patterns
    ├── 05-testing.md         # Test strategy
    ├── 06-lessons.md         # Retrospective learnings
    ├── 07-process.md         # Branching, deployment
    ├── 08-workflow-chains.md # User journeys
    └── 09-sync-history.md    # Sync tracking
```

**Why Sharding?**
- **Token efficiency**: Each interaction loads ~500-2000 tokens instead of ~10000+
- **Scalable**: Knowledge can grow indefinitely without context pressure
- **Targeted updates**: Sync operations update specific fragments
- **Pattern**: Same approach used by TEA (Test Architect) agent

**How it works:**
1. Atlas consults `atlas-index.csv` to determine relevant fragments
2. Loads ONLY the needed fragment(s) based on the query type
3. Updates individual fragments during sync (not entire memory)

## Version History

- **2.1.0** (2024-12-18): Sharded memory architecture
  - Index-guided selective loading (atlas-index.csv)
  - 9 knowledge fragments instead of monolithic memory
  - Backwards compatibility with legacy atlas-memory.md
  - Updated installer to handle sharded files

- **2.0.0** (2024-12-18): Initial installer with enhanced workflows
  - Atlas Agent core
  - Four Atlas-enhanced workflows
  - Install/update/uninstall/status commands
  - Memory preservation on update
