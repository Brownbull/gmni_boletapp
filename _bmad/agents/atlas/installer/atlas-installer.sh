#!/bin/bash
#
# Atlas Agent Installer
# Install, update, or uninstall Atlas in BMAD projects
#
# Usage:
#   ./atlas-installer.sh install /path/to/project
#   ./atlas-installer.sh update /path/to/project
#   ./atlas-installer.sh uninstall /path/to/project
#   ./atlas-installer.sh status /path/to/project
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located (installer directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Atlas source is the parent directory of installer
ATLAS_SOURCE="$(dirname "$SCRIPT_DIR")"
# BMAD source is the _bmad directory
BMAD_SOURCE="$(dirname "$(dirname "$ATLAS_SOURCE")")"

# Version tracking
ATLAS_VERSION="2.2.0"
ATLAS_VERSION_DATE="2024-12-18"
# 2.2.0 - Added complete Atlas BMM workflow alternatives (13 workflows)
# 2.1.0 - Added sharded memory architecture (index-guided loading)

# Template directory for Atlas workflows (inside installer)
TEMPLATES_DIR="$SCRIPT_DIR/templates"

print_banner() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  🗺️  ${GREEN}Atlas Agent Installer${NC} v${ATLAS_VERSION}                        ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC}     Project Intelligence Guardian                        ${BLUE}║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if target has BMAD installed
check_bmad() {
    local target="$1"
    if [[ ! -d "$target/_bmad" ]]; then
        print_error "BMAD not found at $target/_bmad"
        echo "  Atlas requires BMAD BMM module to be installed."
        echo "  Please install BMAD first: https://github.com/bmad-code-org/BMAD-METHOD"
        exit 1
    fi

    if [[ ! -d "$target/_bmad/bmm" ]]; then
        print_error "BMAD BMM module not found at $target/_bmad/bmm"
        echo "  Atlas requires the BMM module."
        exit 1
    fi

    print_success "BMAD BMM module found"
}

# Safe copy that skips if source and destination are the same file
safe_cp() {
    local src="$1"
    local dst="$2"

    # Resolve to absolute paths for comparison
    local abs_src="$(realpath "$src" 2>/dev/null || echo "$src")"
    local abs_dst="$(realpath "$dst" 2>/dev/null || echo "$dst")"

    # If dst is a directory, append filename
    if [[ -d "$dst" ]]; then
        abs_dst="$dst/$(basename "$src")"
        abs_dst="$(realpath "$abs_dst" 2>/dev/null || echo "$abs_dst")"
    fi

    if [[ "$abs_src" == "$abs_dst" ]]; then
        return 0  # Skip silently
    fi

    cp "$src" "$dst"
}

# Safe copy recursive that skips same-source operations
safe_cp_r() {
    local src="$1"
    local dst="$2"

    # Resolve to absolute paths for comparison
    local abs_src="$(realpath "$src" 2>/dev/null || echo "$src")"
    local abs_dst="$(realpath "$dst" 2>/dev/null || echo "$dst")"

    if [[ "$abs_src" == "$abs_dst" ]]; then
        return 0  # Skip silently
    fi

    cp -r "$src" "$dst"
}

# Check current Atlas installation status
check_atlas_status() {
    local target="$1"
    local has_atlas=false
    local has_workflows=false
    local has_commands=false
    local atlas_version="unknown"

    if [[ -d "$target/_bmad/agents/atlas" ]]; then
        has_atlas=true
        # Try to detect version from workflow guide
        if [[ -f "$target/_bmad/agents/atlas/atlas-sidecar/atlas-index.csv" ]]; then
            atlas_version="2.1.x-sharded"
        elif [[ -f "$target/_bmad/agents/atlas/docs/atlas-bmad-workflow-guide.md" ]]; then
            atlas_version="2.0.x-enhanced"
        else
            atlas_version="1.x-basic"
        fi
    fi

    if [[ -d "$target/_bmad/bmm/workflows/4-implementation/atlas-create-story" ]]; then
        has_workflows=true
    fi

    if [[ -f "$target/.claude/commands/bmad/agents/atlas.md" ]]; then
        has_commands=true
    fi

    echo "has_atlas=$has_atlas"
    echo "has_workflows=$has_workflows"
    echo "has_commands=$has_commands"
    echo "atlas_version=$atlas_version"
}

# Show installation status
cmd_status() {
    local target="$1"

    print_banner
    echo "Checking Atlas status in: $target"
    echo ""

    if [[ ! -d "$target" ]]; then
        print_error "Target directory does not exist: $target"
        exit 1
    fi

    eval "$(check_atlas_status "$target")"

    echo "Installation Status:"
    echo "─────────────────────────────────────────"

    if [[ "$has_atlas" == "true" ]]; then
        print_success "Atlas Agent: Installed ($atlas_version)"
    else
        print_warning "Atlas Agent: Not installed"
    fi

    if [[ "$has_workflows" == "true" ]]; then
        print_success "Atlas Workflows: Installed"
        # Check which workflows are installed
        local all_workflows=(
            "atlas-create-story" "atlas-code-review" "atlas-retrospective" "atlas-e2e"
            "atlas-dev-story" "atlas-sprint-planning" "atlas-sprint-status"
            "atlas-correct-course" "atlas-deploy-story" "atlas-epic-tech-context"
            "atlas-story-context" "atlas-story-done" "atlas-story-ready"
        )
        for workflow in "${all_workflows[@]}"; do
            if [[ -d "$target/_bmad/bmm/workflows/4-implementation/$workflow" ]]; then
                echo "    - $workflow"
            fi
        done
    else
        print_warning "Atlas Workflows: Not installed"
    fi

    if [[ "$has_commands" == "true" ]]; then
        print_success "Slash Commands: Installed"
    else
        print_warning "Slash Commands: Not installed"
    fi

    echo ""

    if [[ "$has_atlas" == "false" ]]; then
        echo "Recommendation: Run 'install' to add Atlas to this project"
    elif [[ "$has_workflows" == "false" ]]; then
        echo "Recommendation: Run 'update' to add enhanced workflows"
    else
        echo "Status: Fully installed. Run 'update' to get latest version."
    fi
}

# Install Atlas (fresh installation)
cmd_install() {
    local target="$1"

    print_banner
    echo "Installing Atlas to: $target"
    echo ""

    if [[ ! -d "$target" ]]; then
        print_error "Target directory does not exist: $target"
        exit 1
    fi

    check_bmad "$target"

    eval "$(check_atlas_status "$target")"

    if [[ "$has_atlas" == "true" ]]; then
        print_warning "Atlas is already installed. Use 'update' to upgrade."
        echo ""
        read -p "Do you want to run update instead? [y/N] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cmd_update "$target"
            return
        fi
        exit 0
    fi

    echo ""
    echo "Installing components:"
    echo "─────────────────────────────────────────"

    # 1. Create agents directory if needed
    mkdir -p "$target/_bmad/agents"

    # 2. Copy Atlas agent (excluding installer directory and project-specific memory)
    echo ""
    print_info "Installing Atlas Agent..."
    mkdir -p "$target/_bmad/agents/atlas"
    mkdir -p "$target/_bmad/agents/atlas/atlas-sidecar"
    mkdir -p "$target/_bmad/agents/atlas/atlas-sidecar/knowledge"
    mkdir -p "$target/_bmad/agents/atlas/docs"
    mkdir -p "$target/_bmad/agents/atlas/templates"

    # Copy core files
    safe_cp "$ATLAS_SOURCE/atlas.agent.yaml" "$target/_bmad/agents/atlas/"
    print_success "Copied atlas.agent.yaml"

    # Copy docs (consolidated structure)
    safe_cp "$ATLAS_SOURCE/docs/README.md" "$target/_bmad/agents/atlas/docs/"
    safe_cp "$ATLAS_SOURCE/docs/atlas-workflow-reference.md" "$target/_bmad/agents/atlas/docs/"
    print_success "Copied documentation"

    # Copy templates
    safe_cp "$ATLAS_SOURCE/templates/atlas-memory-template.md" "$target/_bmad/agents/atlas/templates/"
    print_success "Copied templates"

    # Copy sidecar files (fresh versions)
    safe_cp "$ATLAS_SOURCE/atlas-sidecar/instructions.md" "$target/_bmad/agents/atlas/atlas-sidecar/"
    print_success "Copied sidecar instructions"

    # Copy atlas-index.csv (sharded memory index)
    safe_cp "$ATLAS_SOURCE/atlas-sidecar/atlas-index.csv" "$target/_bmad/agents/atlas/atlas-sidecar/"
    print_success "Copied atlas-index.csv (knowledge fragment index)"

    # Copy sharded knowledge fragments (fresh versions)
    local fragments=(
        "01-purpose.md" "02-features.md" "03-personas.md"
        "04-architecture.md" "05-testing.md" "06-lessons.md"
        "07-process.md" "08-workflow-chains.md" "09-sync-history.md"
    )
    for fragment in "${fragments[@]}"; do
        if [[ -f "$ATLAS_SOURCE/atlas-sidecar/knowledge/$fragment" ]]; then
            safe_cp "$ATLAS_SOURCE/atlas-sidecar/knowledge/$fragment" \
               "$target/_bmad/agents/atlas/atlas-sidecar/knowledge/"
        fi
    done
    print_success "Created sharded knowledge fragments (9 files)"

    # Keep legacy atlas-memory.md for backwards compatibility
    if [[ -f "$ATLAS_SOURCE/templates/atlas-memory-template.md" ]]; then
        safe_cp "$ATLAS_SOURCE/templates/atlas-memory-template.md" "$target/_bmad/agents/atlas/atlas-sidecar/atlas-memory.md"
        print_info "Created legacy atlas-memory.md (for backwards compatibility)"
    fi

    # 3. Copy Atlas-enhanced workflows
    echo ""
    print_info "Installing Atlas Workflows..."

    # Original 4 workflows (from BMAD source)
    local original_workflows=("atlas-create-story" "atlas-code-review" "atlas-retrospective" "atlas-e2e")

    for workflow in "${original_workflows[@]}"; do
        if [[ -d "$BMAD_SOURCE/bmm/workflows/4-implementation/$workflow" ]]; then
            mkdir -p "$target/_bmad/bmm/workflows/4-implementation/$workflow"
            # Use find + safe_cp for directory contents to handle same-source
            for file in "$BMAD_SOURCE/bmm/workflows/4-implementation/$workflow/"*; do
                if [[ -f "$file" ]]; then
                    safe_cp "$file" "$target/_bmad/bmm/workflows/4-implementation/$workflow/"
                fi
            done
            print_success "Installed $workflow"
        else
            print_warning "Source workflow not found: $workflow"
        fi
    done

    # New Atlas workflows (from installer templates)
    local template_workflows=(
        "atlas-dev-story" "atlas-sprint-planning" "atlas-sprint-status"
        "atlas-correct-course" "atlas-deploy-story" "atlas-epic-tech-context"
        "atlas-story-context" "atlas-story-done" "atlas-story-ready"
    )

    for workflow in "${template_workflows[@]}"; do
        if [[ -d "$TEMPLATES_DIR/bmm-workflows/$workflow" ]]; then
            mkdir -p "$target/_bmad/bmm/workflows/4-implementation/$workflow"
            # Use find + safe_cp for directory contents to handle same-source
            for file in "$TEMPLATES_DIR/bmm-workflows/$workflow/"*; do
                if [[ -f "$file" ]]; then
                    safe_cp "$file" "$target/_bmad/bmm/workflows/4-implementation/$workflow/"
                fi
            done
            print_success "Installed $workflow"
        else
            print_warning "Template workflow not found: $workflow"
        fi
    done

    # 4. Copy slash commands
    echo ""
    print_info "Installing Slash Commands..."

    # Get the .claude/commands directory from the project root (parent of _bmad)
    local project_root="$(dirname "$BMAD_SOURCE")"
    local commands_source="$project_root/.claude/commands/bmad"

    mkdir -p "$target/.claude/commands/bmad/agents"
    mkdir -p "$target/.claude/commands/bmad/bmm/workflows"

    # Copy atlas agent command
    if [[ -f "$commands_source/agents/atlas.md" ]]; then
        safe_cp "$commands_source/agents/atlas.md" "$target/.claude/commands/bmad/agents/"
        print_success "Installed /bmad:agents:atlas command"
    fi

    # Copy original workflow commands (from source project)
    local cmd_workflows=("atlas-create-story" "atlas-code-review" "atlas-retrospective" "atlas-e2e")
    for cmd in "${cmd_workflows[@]}"; do
        if [[ -f "$commands_source/bmm/workflows/$cmd.md" ]]; then
            safe_cp "$commands_source/bmm/workflows/$cmd.md" "$target/.claude/commands/bmad/bmm/workflows/"
            print_success "Installed /bmad:bmm:workflows:$cmd command"
        fi
    done

    # Copy new workflow commands (from templates)
    local template_cmds=(
        "atlas-dev-story" "atlas-sprint-planning" "atlas-sprint-status"
        "atlas-correct-course" "atlas-deploy-story" "atlas-epic-tech-context"
        "atlas-story-context" "atlas-story-done" "atlas-story-ready"
    )
    for cmd in "${template_cmds[@]}"; do
        if [[ -f "$TEMPLATES_DIR/slash-commands/$cmd.md" ]]; then
            safe_cp "$TEMPLATES_DIR/slash-commands/$cmd.md" "$target/.claude/commands/bmad/bmm/workflows/"
            print_success "Installed /bmad:bmm:workflows:$cmd command"
        fi
    done

    # 5. Installation summary
    echo ""
    echo "─────────────────────────────────────────"
    print_success "Atlas installation complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Initialize Atlas memory by running: /bmad:agents:atlas"
    echo "  2. Select 'sync' to populate memory from your PRD, architecture, etc."
    echo "  3. Start using Atlas-enhanced workflows (13 available):"
    echo "     - /bmad:bmm:workflows:atlas-create-story"
    echo "     - /bmad:bmm:workflows:atlas-code-review"
    echo "     - /bmad:bmm:workflows:atlas-retrospective"
    echo "     - /bmad:bmm:workflows:atlas-e2e"
    echo "     - /bmad:bmm:workflows:atlas-dev-story"
    echo "     - /bmad:bmm:workflows:atlas-sprint-planning"
    echo "     - /bmad:bmm:workflows:atlas-sprint-status"
    echo "     - /bmad:bmm:workflows:atlas-correct-course"
    echo "     - /bmad:bmm:workflows:atlas-deploy-story"
    echo "     - /bmad:bmm:workflows:atlas-epic-tech-context"
    echo "     - /bmad:bmm:workflows:atlas-story-context"
    echo "     - /bmad:bmm:workflows:atlas-story-done"
    echo "     - /bmad:bmm:workflows:atlas-story-ready"
    echo ""
    echo "Documentation: $target/_bmad/agents/atlas/docs/"
}

# Update existing Atlas installation
cmd_update() {
    local target="$1"

    print_banner
    echo "Updating Atlas in: $target"
    echo ""

    if [[ ! -d "$target" ]]; then
        print_error "Target directory does not exist: $target"
        exit 1
    fi

    check_bmad "$target"

    eval "$(check_atlas_status "$target")"

    if [[ "$has_atlas" == "false" ]]; then
        print_warning "Atlas is not installed. Use 'install' first."
        echo ""
        read -p "Do you want to run install instead? [y/N] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cmd_install "$target"
            return
        fi
        exit 0
    fi

    echo ""
    echo "Updating components:"
    echo "─────────────────────────────────────────"

    # Backup existing memory (both legacy and sharded)
    if [[ -f "$target/_bmad/agents/atlas/atlas-sidecar/atlas-memory.md" ]]; then
        safe_cp "$target/_bmad/agents/atlas/atlas-sidecar/atlas-memory.md" \
           "$target/_bmad/agents/atlas/atlas-sidecar/atlas-memory.md.backup"
        print_info "Backed up existing atlas-memory.md"
    fi

    # Backup existing sharded knowledge if present
    if [[ -d "$target/_bmad/agents/atlas/atlas-sidecar/knowledge" ]]; then
        local backup_dir="$target/_bmad/agents/atlas/atlas-sidecar/knowledge-backup-$(date +%Y%m%d-%H%M%S)"
        safe_cp_r "$target/_bmad/agents/atlas/atlas-sidecar/knowledge" "$backup_dir"
        print_info "Backed up existing knowledge fragments to knowledge-backup-*"
    fi

    # 1. Update Atlas agent core files (preserve memory)
    echo ""
    print_info "Updating Atlas Agent..."

    safe_cp "$ATLAS_SOURCE/atlas.agent.yaml" "$target/_bmad/agents/atlas/"
    print_success "Updated atlas.agent.yaml"

    # Update docs (consolidated structure)
    mkdir -p "$target/_bmad/agents/atlas/docs"
    safe_cp "$ATLAS_SOURCE/docs/README.md" "$target/_bmad/agents/atlas/docs/"
    safe_cp "$ATLAS_SOURCE/docs/atlas-workflow-reference.md" "$target/_bmad/agents/atlas/docs/"
    # Clean up old documentation files if they exist
    rm -f "$target/_bmad/agents/atlas/docs/export-guide.md" 2>/dev/null
    rm -f "$target/_bmad/agents/atlas/docs/atlas-setup-guide.md" 2>/dev/null
    rm -f "$target/_bmad/agents/atlas/docs/workflow-integration-guide.md" 2>/dev/null
    rm -f "$target/_bmad/agents/atlas/docs/atlas-bmad-workflow-guide.md" 2>/dev/null
    print_success "Updated documentation"

    # Update templates
    mkdir -p "$target/_bmad/agents/atlas/templates"
    safe_cp "$ATLAS_SOURCE/templates/atlas-memory-template.md" "$target/_bmad/agents/atlas/templates/"
    print_success "Updated templates"

    # Update sidecar instructions
    safe_cp "$ATLAS_SOURCE/atlas-sidecar/instructions.md" "$target/_bmad/agents/atlas/atlas-sidecar/"
    print_success "Updated sidecar instructions"

    # Update/Add atlas-index.csv
    safe_cp "$ATLAS_SOURCE/atlas-sidecar/atlas-index.csv" "$target/_bmad/agents/atlas/atlas-sidecar/"
    print_success "Updated atlas-index.csv"

    # Create/update sharded knowledge structure
    mkdir -p "$target/_bmad/agents/atlas/atlas-sidecar/knowledge"
    local fragments=(
        "01-purpose.md" "02-features.md" "03-personas.md"
        "04-architecture.md" "05-testing.md" "06-lessons.md"
        "07-process.md" "08-workflow-chains.md" "09-sync-history.md"
    )
    local new_fragments=0
    for fragment in "${fragments[@]}"; do
        if [[ ! -f "$target/_bmad/agents/atlas/atlas-sidecar/knowledge/$fragment" ]]; then
            if [[ -f "$ATLAS_SOURCE/atlas-sidecar/knowledge/$fragment" ]]; then
                safe_cp "$ATLAS_SOURCE/atlas-sidecar/knowledge/$fragment" \
                   "$target/_bmad/agents/atlas/atlas-sidecar/knowledge/"
                new_fragments=$((new_fragments + 1))
            fi
        fi
    done
    if [[ $new_fragments -gt 0 ]]; then
        print_success "Added $new_fragments new knowledge fragment(s)"
    fi
    print_info "Preserved existing knowledge fragments (backup created)"

    # 2. Update/Add Atlas-enhanced workflows
    echo ""
    print_info "Updating Atlas Workflows..."

    # Original 4 workflows (from BMAD source)
    local original_workflows=("atlas-create-story" "atlas-code-review" "atlas-retrospective" "atlas-e2e")

    for workflow in "${original_workflows[@]}"; do
        if [[ -d "$BMAD_SOURCE/bmm/workflows/4-implementation/$workflow" ]]; then
            mkdir -p "$target/_bmad/bmm/workflows/4-implementation/$workflow"
            # Use find + safe_cp for directory contents to handle same-source
            for file in "$BMAD_SOURCE/bmm/workflows/4-implementation/$workflow/"*; do
                if [[ -f "$file" ]]; then
                    safe_cp "$file" "$target/_bmad/bmm/workflows/4-implementation/$workflow/"
                fi
            done
            print_success "Updated $workflow"
        else
            print_warning "Source workflow not found: $workflow"
        fi
    done

    # New Atlas workflows (from installer templates)
    local template_workflows=(
        "atlas-dev-story" "atlas-sprint-planning" "atlas-sprint-status"
        "atlas-correct-course" "atlas-deploy-story" "atlas-epic-tech-context"
        "atlas-story-context" "atlas-story-done" "atlas-story-ready"
    )

    for workflow in "${template_workflows[@]}"; do
        if [[ -d "$TEMPLATES_DIR/bmm-workflows/$workflow" ]]; then
            mkdir -p "$target/_bmad/bmm/workflows/4-implementation/$workflow"
            # Use find + safe_cp for directory contents to handle same-source
            for file in "$TEMPLATES_DIR/bmm-workflows/$workflow/"*; do
                if [[ -f "$file" ]]; then
                    safe_cp "$file" "$target/_bmad/bmm/workflows/4-implementation/$workflow/"
                fi
            done
            print_success "Updated/Installed $workflow"
        else
            print_warning "Template workflow not found: $workflow"
        fi
    done

    # 3. Update/Add slash commands
    echo ""
    print_info "Updating Slash Commands..."

    local project_root="$(dirname "$BMAD_SOURCE")"
    local commands_source="$project_root/.claude/commands/bmad"

    mkdir -p "$target/.claude/commands/bmad/agents"
    mkdir -p "$target/.claude/commands/bmad/bmm/workflows"

    if [[ -f "$commands_source/agents/atlas.md" ]]; then
        safe_cp "$commands_source/agents/atlas.md" "$target/.claude/commands/bmad/agents/"
        print_success "Updated /bmad:agents:atlas command"
    fi

    # Copy original workflow commands (from source project)
    local cmd_workflows=("atlas-create-story" "atlas-code-review" "atlas-retrospective" "atlas-e2e")
    for cmd in "${cmd_workflows[@]}"; do
        if [[ -f "$commands_source/bmm/workflows/$cmd.md" ]]; then
            safe_cp "$commands_source/bmm/workflows/$cmd.md" "$target/.claude/commands/bmad/bmm/workflows/"
            print_success "Updated /bmad:bmm:workflows:$cmd command"
        fi
    done

    # Copy new workflow commands (from templates)
    local template_cmds=(
        "atlas-dev-story" "atlas-sprint-planning" "atlas-sprint-status"
        "atlas-correct-course" "atlas-deploy-story" "atlas-epic-tech-context"
        "atlas-story-context" "atlas-story-done" "atlas-story-ready"
    )
    for cmd in "${template_cmds[@]}"; do
        if [[ -f "$TEMPLATES_DIR/slash-commands/$cmd.md" ]]; then
            safe_cp "$TEMPLATES_DIR/slash-commands/$cmd.md" "$target/.claude/commands/bmad/bmm/workflows/"
            print_success "Updated/Installed /bmad:bmm:workflows:$cmd command"
        fi
    done

    # 4. Update summary
    echo ""
    echo "─────────────────────────────────────────"
    print_success "Atlas update complete!"
    echo ""
    echo "Your atlas-memory.md and knowledge fragments have been preserved."
    echo "A backup was created at: atlas-memory.md.backup"
    echo ""
    echo "Now includes 13 Atlas-enhanced workflows!"
    echo "Consider running '/bmad:agents:atlas sync' to update memory"
    echo "with any new documentation since last sync."
}

# Uninstall Atlas
cmd_uninstall() {
    local target="$1"

    print_banner
    echo "Uninstalling Atlas from: $target"
    echo ""

    if [[ ! -d "$target" ]]; then
        print_error "Target directory does not exist: $target"
        exit 1
    fi

    eval "$(check_atlas_status "$target")"

    if [[ "$has_atlas" == "false" && "$has_workflows" == "false" && "$has_commands" == "false" ]]; then
        print_info "Atlas is not installed in this project."
        exit 0
    fi

    echo -e "${YELLOW}WARNING: This will remove Atlas and all related files!${NC}"
    echo ""
    echo "The following will be removed:"

    if [[ "$has_atlas" == "true" ]]; then
        echo "  - $_bmad/agents/atlas/ (including your atlas-memory.md!)"
    fi
    if [[ "$has_workflows" == "true" ]]; then
        echo "  - Atlas-enhanced workflows (atlas-create-story, atlas-code-review, etc.)"
    fi
    if [[ "$has_commands" == "true" ]]; then
        echo "  - Atlas slash commands"
    fi

    echo ""
    read -p "Are you sure you want to uninstall Atlas? [y/N] " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Uninstall cancelled."
        exit 0
    fi

    echo ""
    echo "Removing components:"
    echo "─────────────────────────────────────────"

    # 1. Remove Atlas agent
    if [[ -d "$target/_bmad/agents/atlas" ]]; then
        # Backup memory before removal
        if [[ -f "$target/_bmad/agents/atlas/atlas-sidecar/atlas-memory.md" ]]; then
            cp "$target/_bmad/agents/atlas/atlas-sidecar/atlas-memory.md" \
               "$target/atlas-memory-backup-$(date +%Y%m%d-%H%M%S).md"
            print_info "Memory backed up to project root"
        fi
        rm -rf "$target/_bmad/agents/atlas"
        print_success "Removed Atlas agent"
    fi

    # 2. Remove Atlas workflows (all 13)
    local all_workflows=(
        "atlas-create-story" "atlas-code-review" "atlas-retrospective" "atlas-e2e"
        "atlas-dev-story" "atlas-sprint-planning" "atlas-sprint-status"
        "atlas-correct-course" "atlas-deploy-story" "atlas-epic-tech-context"
        "atlas-story-context" "atlas-story-done" "atlas-story-ready"
    )
    for workflow in "${all_workflows[@]}"; do
        if [[ -d "$target/_bmad/bmm/workflows/4-implementation/$workflow" ]]; then
            rm -rf "$target/_bmad/bmm/workflows/4-implementation/$workflow"
            print_success "Removed $workflow workflow"
        fi
    done

    # 3. Remove slash commands
    if [[ -f "$target/.claude/commands/bmad/agents/atlas.md" ]]; then
        rm "$target/.claude/commands/bmad/agents/atlas.md"
        print_success "Removed atlas agent command"
    fi

    local all_cmd_workflows=(
        "atlas-create-story" "atlas-code-review" "atlas-retrospective" "atlas-e2e"
        "atlas-dev-story" "atlas-sprint-planning" "atlas-sprint-status"
        "atlas-correct-course" "atlas-deploy-story" "atlas-epic-tech-context"
        "atlas-story-context" "atlas-story-done" "atlas-story-ready"
    )
    for cmd in "${all_cmd_workflows[@]}"; do
        if [[ -f "$target/.claude/commands/bmad/bmm/workflows/$cmd.md" ]]; then
            rm "$target/.claude/commands/bmad/bmm/workflows/$cmd.md"
            print_success "Removed $cmd command"
        fi
    done

    # Cleanup empty directories
    rmdir "$target/.claude/commands/bmad/agents" 2>/dev/null || true
    rmdir "$target/_bmad/agents" 2>/dev/null || true

    echo ""
    echo "─────────────────────────────────────────"
    print_success "Atlas uninstallation complete!"
    echo ""
    echo "Your memory file has been backed up to the project root."
    echo "Standard BMAD workflows remain untouched."
}

# Show help
show_help() {
    print_banner
    echo "Usage: atlas-installer.sh <command> <target-directory>"
    echo ""
    echo "Commands:"
    echo "  install    Install Atlas in a new project"
    echo "  update     Update existing Atlas installation"
    echo "  uninstall  Remove Atlas from a project"
    echo "  status     Check Atlas installation status"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./atlas-installer.sh install /path/to/project"
    echo "  ./atlas-installer.sh update /path/to/project"
    echo "  ./atlas-installer.sh status /path/to/project"
    echo ""
    echo "Requirements:"
    echo "  - Target project must have BMAD BMM module installed"
    echo "  - Bash 4.0+ recommended"
}

# Main entry point
main() {
    local command="${1:-help}"
    local target="${2:-}"

    case "$command" in
        install)
            if [[ -z "$target" ]]; then
                print_error "Target directory required"
                echo "Usage: $0 install /path/to/project"
                exit 1
            fi
            cmd_install "$target"
            ;;
        update)
            if [[ -z "$target" ]]; then
                print_error "Target directory required"
                echo "Usage: $0 update /path/to/project"
                exit 1
            fi
            cmd_update "$target"
            ;;
        uninstall)
            if [[ -z "$target" ]]; then
                print_error "Target directory required"
                echo "Usage: $0 uninstall /path/to/project"
                exit 1
            fi
            cmd_uninstall "$target"
            ;;
        status)
            if [[ -z "$target" ]]; then
                print_error "Target directory required"
                echo "Usage: $0 status /path/to/project"
                exit 1
            fi
            cmd_status "$target"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
