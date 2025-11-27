#!/bin/bash
# Script: scan-secrets.sh
# Story 4.1: Secrets Detection & Prevention
#
# This script provides manual secrets scanning capabilities using gitleaks.
#
# Usage:
#   ./scripts/scan-secrets.sh           # Scan current files (no git history)
#   ./scripts/scan-secrets.sh --history # Scan full git history
#   ./scripts/scan-secrets.sh --report  # Generate JSON report
#
# Exit codes:
#   0 - No secrets found
#   1 - Secrets found or error

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_ROOT/.gitleaks.toml"
REPORT_FILE="$PROJECT_ROOT/secrets-report.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gitleaks is installed
check_gitleaks() {
    if ! command -v gitleaks &> /dev/null; then
        echo -e "${RED}ERROR: gitleaks is not installed.${NC}"
        echo ""
        echo "Install gitleaks:"
        echo "  macOS: brew install gitleaks"
        echo "  Linux: wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.4/gitleaks_8.18.4_linux_x64.tar.gz"
        echo "         tar -xzf gitleaks_8.18.4_linux_x64.tar.gz"
        echo "         sudo mv gitleaks /usr/local/bin/"
        exit 1
    fi
}

# Scan current files (no git history)
scan_current() {
    echo -e "${YELLOW}Scanning current files for secrets...${NC}"
    echo ""

    if gitleaks detect --source "$PROJECT_ROOT" --config "$CONFIG_FILE" --no-git --verbose; then
        echo ""
        echo -e "${GREEN}No secrets found in current files.${NC}"
        return 0
    else
        echo ""
        echo -e "${RED}SECRETS DETECTED in current files!${NC}"
        return 1
    fi
}

# Scan full git history
scan_history() {
    echo -e "${YELLOW}Scanning full git history for secrets...${NC}"
    echo ""

    if gitleaks detect --source "$PROJECT_ROOT" --config "$CONFIG_FILE" --verbose; then
        echo ""
        echo -e "${GREEN}No secrets found in git history.${NC}"
        return 0
    else
        echo ""
        echo -e "${RED}SECRETS DETECTED in git history!${NC}"
        echo "Review the findings above and consider:"
        echo "  1. Rotating any exposed credentials immediately"
        echo "  2. Documenting findings in docs/security/secrets-scan-report.md"
        return 1
    fi
}

# Generate JSON report
generate_report() {
    echo -e "${YELLOW}Generating secrets scan report...${NC}"
    echo ""

    gitleaks detect --source "$PROJECT_ROOT" --config "$CONFIG_FILE" \
        --report-format json --report-path "$REPORT_FILE" --verbose || true

    if [ -f "$REPORT_FILE" ]; then
        echo ""
        echo -e "${GREEN}Report generated: $REPORT_FILE${NC}"
        echo ""
        echo "Summary:"
        jq -r 'length' "$REPORT_FILE" 2>/dev/null | xargs -I {} echo "  Total findings: {}"
    fi
}

# Main
main() {
    check_gitleaks

    case "${1:-}" in
        --history)
            scan_history
            ;;
        --report)
            generate_report
            ;;
        *)
            scan_current
            ;;
    esac
}

main "$@"
