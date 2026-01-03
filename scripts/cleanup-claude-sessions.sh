#!/bin/bash
# Claude Code Session Cleanup Script
# Kills stuck Claude Code sessions and related MCP plugin processes

# # Interactive mode (shows menu)
# ./scripts/cleanup-claude-sessions.sh

# # Command-line options
# ./scripts/cleanup-claude-sessions.sh -l          # List processes
# ./scripts/cleanup-claude-sessions.sh -g          # Graceful cleanup (SIGTERM)
# ./scripts/cleanup-claude-sessions.sh -f          # Force cleanup (SIGKILL)
# ./scripts/cleanup-claude-sessions.sh -k          # Kill old, keep current
# ./scripts/cleanup-claude-sessions.sh -m          # Kill only MCP plugins

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Claude Code Session Cleanup Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to list processes
list_processes() {
    echo -e "${YELLOW}Current Claude-related processes:${NC}"
    echo ""

    # Claude binary processes
    echo -e "${BLUE}Claude Binary Processes:${NC}"
    CLAUDE_PROCS=$(pgrep -af "claude.*native-binary" 2>/dev/null || true)
    if [ -n "$CLAUDE_PROCS" ]; then
        echo "$CLAUDE_PROCS" | while read -r line; do
            PID=$(echo "$line" | awk '{print $1}')
            # Extract model info if present
            if echo "$line" | grep -q "claude-opus"; then
                MODEL="opus"
            elif echo "$line" | grep -q "claude-sonnet"; then
                MODEL="sonnet"
            else
                MODEL="default"
            fi
            # Check if it's a resumed session
            if echo "$line" | grep -q "\-\-resume"; then
                SESSION_ID=$(echo "$line" | grep -oP '(?<=--resume )[a-f0-9-]+')
                echo -e "  PID ${GREEN}$PID${NC} - Model: $MODEL - Resumed session: $SESSION_ID"
            else
                echo -e "  PID ${GREEN}$PID${NC} - Model: $MODEL"
            fi
        done
        CLAUDE_COUNT=$(echo "$CLAUDE_PROCS" | wc -l)
    else
        echo "  (none found)"
        CLAUDE_COUNT=0
    fi
    echo ""

    # MCP Plugin processes
    echo -e "${BLUE}MCP Plugin Processes (superpowers-chrome, etc.):${NC}"
    MCP_PROCS=$(pgrep -af "\.claude/plugins" 2>/dev/null || true)
    if [ -n "$MCP_PROCS" ]; then
        echo "$MCP_PROCS" | while read -r line; do
            PID=$(echo "$line" | awk '{print $1}')
            echo -e "  PID ${GREEN}$PID${NC}"
        done
        MCP_COUNT=$(echo "$MCP_PROCS" | wc -l)
    else
        echo "  (none found)"
        MCP_COUNT=0
    fi
    echo ""

    # Firebase MCP if present
    echo -e "${BLUE}Firebase MCP Processes:${NC}"
    FIREBASE_PROCS=$(pgrep -af "firebase.*mcp" 2>/dev/null || true)
    if [ -n "$FIREBASE_PROCS" ]; then
        echo "$FIREBASE_PROCS" | while read -r line; do
            PID=$(echo "$line" | awk '{print $1}')
            echo -e "  PID ${GREEN}$PID${NC}"
        done
        FIREBASE_COUNT=$(echo "$FIREBASE_PROCS" | wc -l)
    else
        echo "  (none found)"
        FIREBASE_COUNT=0
    fi
    echo ""

    echo -e "${YELLOW}Summary: ${CLAUDE_COUNT:-0} Claude processes, ${MCP_COUNT:-0} MCP plugins, ${FIREBASE_COUNT:-0} Firebase MCP${NC}"
}

# Function to kill processes
kill_processes() {
    local PATTERN=$1
    local NAME=$2
    local SIGNAL=${3:-TERM}

    PIDS=$(pgrep -f "$PATTERN" 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        COUNT=$(echo "$PIDS" | wc -w)
        echo -e "${YELLOW}Killing $COUNT $NAME process(es) with SIG$SIGNAL...${NC}"
        echo "$PIDS" | xargs kill -$SIGNAL 2>/dev/null || true
        return 0
    else
        echo -e "${GREEN}No $NAME processes found${NC}"
        return 1
    fi
}

# Function for graceful cleanup
graceful_cleanup() {
    echo -e "${YELLOW}Starting graceful cleanup (SIGTERM)...${NC}"
    echo ""

    # Kill Claude binary processes first
    kill_processes "claude.*native-binary" "Claude binary"

    # Wait a moment for graceful shutdown
    sleep 2

    # Kill MCP plugins
    kill_processes "\.claude/plugins" "MCP plugin"

    # Kill Firebase MCP if present
    kill_processes "firebase.*mcp" "Firebase MCP"

    echo ""
    echo -e "${GREEN}Graceful cleanup complete!${NC}"
}

# Function for force cleanup
force_cleanup() {
    echo -e "${RED}Starting force cleanup (SIGKILL)...${NC}"
    echo ""

    # Force kill Claude binary processes
    kill_processes "claude.*native-binary" "Claude binary" "KILL"

    # Force kill MCP plugins
    kill_processes "\.claude/plugins" "MCP plugin" "KILL"

    # Force kill Firebase MCP
    kill_processes "firebase.*mcp" "Firebase MCP" "KILL"

    echo ""
    echo -e "${GREEN}Force cleanup complete!${NC}"
}

# Function to kill all except current session
kill_except_current() {
    CURRENT_PID=$$
    PARENT_PID=$PPID

    echo -e "${YELLOW}Killing all Claude sessions except the current one...${NC}"
    echo -e "${BLUE}(Preserving processes related to PID $PARENT_PID)${NC}"
    echo ""

    # Get all Claude PIDs except current conversation chain
    CLAUDE_PIDS=$(pgrep -f "claude.*native-binary" 2>/dev/null || true)

    if [ -n "$CLAUDE_PIDS" ]; then
        for PID in $CLAUDE_PIDS; do
            # Skip if it's a parent of our current process
            # This is tricky - we'll skip the most recent ones (highest PIDs)
            # as they're likely the current session
            echo -e "  Checking PID $PID..."
        done

        # Get the two highest PIDs (likely current session)
        CURRENT_PIDS=$(echo "$CLAUDE_PIDS" | sort -n | tail -2)

        for PID in $CLAUDE_PIDS; do
            if echo "$CURRENT_PIDS" | grep -q "^$PID$"; then
                echo -e "  ${GREEN}Skipping PID $PID (likely current session)${NC}"
            else
                echo -e "  ${RED}Killing PID $PID${NC}"
                kill -TERM $PID 2>/dev/null || true
            fi
        done
    fi

    echo ""
    echo -e "${GREEN}Selective cleanup complete!${NC}"
}

# Main menu
show_menu() {
    echo ""
    echo -e "${BLUE}Options:${NC}"
    echo "  1) List all Claude-related processes"
    echo "  2) Graceful cleanup (SIGTERM) - kills all Claude sessions"
    echo "  3) Force cleanup (SIGKILL) - use if graceful doesn't work"
    echo "  4) Kill old sessions (try to keep current)"
    echo "  5) Kill only MCP plugins (keep Claude sessions)"
    echo "  q) Quit"
    echo ""
}

# Parse command line arguments
case "${1:-}" in
    -l|--list)
        list_processes
        exit 0
        ;;
    -g|--graceful)
        list_processes
        echo ""
        graceful_cleanup
        exit 0
        ;;
    -f|--force)
        list_processes
        echo ""
        force_cleanup
        exit 0
        ;;
    -k|--keep-current)
        list_processes
        echo ""
        kill_except_current
        exit 0
        ;;
    -m|--mcp-only)
        kill_processes "\.claude/plugins" "MCP plugin"
        kill_processes "firebase.*mcp" "Firebase MCP"
        exit 0
        ;;
    -h|--help)
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  -l, --list          List all Claude-related processes"
        echo "  -g, --graceful      Graceful cleanup (SIGTERM)"
        echo "  -f, --force         Force cleanup (SIGKILL)"
        echo "  -k, --keep-current  Kill old sessions, try to keep current"
        echo "  -m, --mcp-only      Kill only MCP plugins"
        echo "  -h, --help          Show this help"
        echo ""
        echo "Without options, runs in interactive mode."
        exit 0
        ;;
    "")
        # Interactive mode
        list_processes

        while true; do
            show_menu
            read -p "Select option: " choice

            case $choice in
                1)
                    echo ""
                    list_processes
                    ;;
                2)
                    echo ""
                    graceful_cleanup
                    echo ""
                    list_processes
                    ;;
                3)
                    echo ""
                    force_cleanup
                    echo ""
                    list_processes
                    ;;
                4)
                    echo ""
                    kill_except_current
                    echo ""
                    list_processes
                    ;;
                5)
                    echo ""
                    kill_processes "\.claude/plugins" "MCP plugin"
                    kill_processes "firebase.*mcp" "Firebase MCP"
                    echo ""
                    list_processes
                    ;;
                q|Q)
                    echo -e "${GREEN}Goodbye!${NC}"
                    exit 0
                    ;;
                *)
                    echo -e "${RED}Invalid option${NC}"
                    ;;
            esac
        done
        ;;
    *)
        echo -e "${RED}Unknown option: $1${NC}"
        echo "Use -h or --help for usage information."
        exit 1
        ;;
esac
