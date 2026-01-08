#!/bin/bash

################################################################################
# Local Test Runner for Boletapp
#
# This script provides a central place to run all tests locally before pushing
# to GitHub. It simulates the CI/CD environment as closely as possible.
#
# Usage:
#   ./scripts/test-local.sh [command]
#
# Commands:
#   all        - Run complete CI/CD simulation (default)
#   quick      - Run fast tests only (unit + type-check)
#   unit       - Run unit tests only
#   integration - Run integration tests
#   e2e        - Run E2E tests
#   coverage   - Generate coverage report
#   ci         - Simulate exact CI environment
#   watch      - Run tests in watch mode
#   help       - Show this help message
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emojis for better readability
CHECK="✅"
CROSS="❌"
ROCKET="🚀"
HOURGLASS="⏳"
TARGET="🎯"
FIRE="🔥"

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}${1}${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}${HOURGLASS} ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}${CHECK} ${1}${NC}"
}

print_error() {
    echo -e "${RED}${CROSS} ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  ${1}${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  ${1}${NC}"
}

# Measure execution time
start_timer() {
    START_TIME=$(date +%s)
}

end_timer() {
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    echo -e "${CYAN}⏱️  Duration: ${DURATION}s${NC}"
}

# Check if Firebase emulators are running
check_emulators() {
    if curl -s http://localhost:4000 > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Check if a process is running on a port
check_port() {
    local port=$1
    if lsof -i:$port > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

################################################################################
# Test Functions
################################################################################

run_type_check() {
    print_step "Running TypeScript type check..."
    start_timer
    npm run type-check
    end_timer
    print_success "TypeScript check passed!"
}

run_unit_tests() {
    print_step "Running unit tests..."
    start_timer
    npm run test:unit
    end_timer
    print_success "Unit tests passed!"
}

run_integration_tests() {
    print_step "Running integration tests..."

    # Check if emulators are running
    if ! check_emulators; then
        print_warning "Firebase emulators not running. Starting emulators..."
        print_info "Run 'npm run emulators' in another terminal if you want to keep them running."

        # Start emulators in background
        firebase emulators:start --only auth,firestore --project boletapp-d609f > /dev/null 2>&1 &
        EMULATOR_PID=$!

        # Wait for emulators to be ready
        echo -n "Waiting for emulators to start"
        for i in {1..30}; do
            if check_emulators; then
                echo ""
                print_success "Firebase emulators ready!"
                break
            fi
            echo -n "."
            sleep 1
        done

        if ! check_emulators; then
            print_error "Failed to start Firebase emulators!"
            exit 1
        fi

        EMULATOR_STARTED=true
    else
        print_success "Firebase emulators already running!"
        EMULATOR_STARTED=false
    fi

    start_timer
    FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:integration
    end_timer
    print_success "Integration tests passed!"

    # Clean up emulators if we started them
    if [ "$EMULATOR_STARTED" = true ]; then
        print_info "Stopping Firebase emulators..."
        kill $EMULATOR_PID 2>/dev/null || true
        sleep 2
    fi
}

run_e2e_tests() {
    print_step "Running E2E tests..."

    # Set up environment variables for Vite build
    export VITE_FIREBASE_API_KEY=test-api-key
    export VITE_FIREBASE_AUTH_DOMAIN=test-project.firebaseapp.com
    export VITE_FIREBASE_PROJECT_ID=boletapp-d609f
    export VITE_FIREBASE_STORAGE_BUCKET=test-project.firebasestorage.app
    export VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
    export VITE_FIREBASE_APP_ID=1:123456789:web:test-app-id
    export VITE_GEMINI_API_KEY=test-gemini-key
    export VITE_GEMINI_MODEL=gemini-2.5-flash-preview-09-2025
    export CI=true

    start_timer
    npm run test:e2e
    end_timer
    print_success "E2E tests passed!"
}

run_coverage() {
    print_step "Generating coverage report..."

    # Check if emulators are running
    if ! check_emulators; then
        print_warning "Firebase emulators not running. Starting emulators..."
        firebase emulators:start --only auth,firestore --project boletapp-d609f > /dev/null 2>&1 &
        EMULATOR_PID=$!

        echo -n "Waiting for emulators to start"
        for i in {1..30}; do
            if check_emulators; then
                echo ""
                print_success "Firebase emulators ready!"
                break
            fi
            echo -n "."
            sleep 1
        done
        EMULATOR_STARTED=true
    else
        EMULATOR_STARTED=false
    fi

    start_timer
    FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:coverage
    end_timer

    # Clean up emulators if we started them
    if [ "$EMULATOR_STARTED" = true ]; then
        kill $EMULATOR_PID 2>/dev/null || true
        sleep 2
    fi

    print_success "Coverage report generated!"
    print_info "Open coverage/index.html to view the report"

    # Try to open coverage report in browser
    if command -v xdg-open > /dev/null; then
        xdg-open coverage/index.html 2>/dev/null || true
    elif command -v open > /dev/null; then
        open coverage/index.html 2>/dev/null || true
    fi
}

run_build() {
    print_step "Running production build..."
    start_timer
    npm run build
    end_timer
    print_success "Build completed!"

    # Show build size
    if [ -d "dist" ]; then
        SIZE=$(du -sh dist/ | cut -f1)
        print_info "Build size: $SIZE"
    fi
}

################################################################################
# Main Test Suites
################################################################################

run_quick() {
    print_header "${FIRE} QUICK TEST SUITE - Fast feedback before commit"

    TOTAL_START=$(date +%s)

    run_type_check
    run_unit_tests

    TOTAL_END=$(date +%s)
    TOTAL_DURATION=$((TOTAL_END - TOTAL_START))

    echo ""
    print_success "Quick tests completed in ${TOTAL_DURATION}s!"
    print_info "Run './scripts/test-local.sh all' for complete validation before push"
}

run_all() {
    print_header "${ROCKET} FULL TEST SUITE - Complete CI/CD simulation"

    TOTAL_START=$(date +%s)

    run_type_check
    run_unit_tests
    run_integration_tests
    run_e2e_tests
    run_coverage

    TOTAL_END=$(date +%s)
    TOTAL_DURATION=$((TOTAL_END - TOTAL_START))

    echo ""
    print_header "${TARGET} ALL TESTS PASSED!"
    echo -e "${GREEN}Total execution time: ${TOTAL_DURATION}s${NC}"
    echo ""
    print_success "Your code is ready to push! 🎉"
    echo ""
    print_info "Next steps:"
    echo "  1. Review changes: git status && git diff"
    echo "  2. Stage changes: git add ."
    echo "  3. Commit: git commit -m 'your message'"
    echo "  4. Push: git push origin main"
}

run_ci_simulation() {
    print_header "${ROCKET} CI/CD SIMULATION - Exact GitHub Actions environment"

    print_info "This simulates the exact workflow that runs on GitHub Actions"
    print_info "Uses same Node version, environment variables, and test sequence"
    echo ""

    # Check Node version
    NODE_VERSION=$(node --version)
    print_info "Node.js version: $NODE_VERSION"

    if [[ ! $NODE_VERSION == v20.* ]]; then
        print_warning "CI uses Node.js 20, you have $NODE_VERSION"
        print_info "Consider using 'nvm use 20' for exact CI environment"
    fi

    TOTAL_START=$(date +%s)

    # Simulate CI steps
    print_step "Step 1/6: TypeScript check"
    run_type_check

    print_step "Step 2/6: Unit tests"
    run_unit_tests

    print_step "Step 3/6: Integration tests"
    run_integration_tests

    print_step "Step 4/6: E2E tests"
    run_e2e_tests

    print_step "Step 5/6: Coverage report"
    run_coverage

    print_step "Step 6/6: Production build"
    run_build

    TOTAL_END=$(date +%s)
    TOTAL_DURATION=$((TOTAL_END - TOTAL_START))

    echo ""
    print_header "${TARGET} CI SIMULATION COMPLETE!"
    echo -e "${GREEN}Total execution time: ${TOTAL_DURATION}s${NC}"
    echo ""

    # Compare with CI target
    if [ $TOTAL_DURATION -lt 600 ]; then
        print_success "Under 10-minute CI target! (${TOTAL_DURATION}s)"
    else
        print_warning "Over 10-minute CI target (${TOTAL_DURATION}s)"
    fi
}

run_watch() {
    print_header "👀 WATCH MODE - Continuous testing"
    print_info "Tests will run automatically when you save files"
    print_info "Press 'q' to quit, 'a' to run all tests, 'p' to filter by pattern"
    echo ""
    npm run test
}

show_help() {
    cat << EOF
${CYAN}Local Test Runner for Boletapp${NC}

${YELLOW}Usage:${NC}
  ./scripts/test-local.sh [command]

${YELLOW}Commands:${NC}
  ${GREEN}all${NC}          Run complete test suite (type-check, unit, integration, E2E, coverage)
                ${CYAN}Time: ~30-60s | Use: Before pushing to GitHub${NC}

  ${GREEN}quick${NC}        Run fast tests only (type-check + unit tests)
                ${CYAN}Time: ~2-5s | Use: Before committing${NC}

  ${GREEN}ci${NC}           Simulate exact CI/CD environment (includes build)
                ${CYAN}Time: ~60-90s | Use: Final validation before major releases${NC}

  ${GREEN}unit${NC}         Run unit tests only
                ${CYAN}Time: ~500ms | Use: Testing specific functions${NC}

  ${GREEN}integration${NC}  Run integration tests (starts emulators if needed)
                ${CYAN}Time: ~8-10s | Use: Testing Firebase integration${NC}

  ${GREEN}e2e${NC}          Run E2E tests (Playwright manages dev server)
                ${CYAN}Time: ~18-20s | Use: Testing user workflows${NC}

  ${GREEN}coverage${NC}     Generate coverage report
                ${CYAN}Time: ~2-3s | Use: Checking test coverage${NC}

  ${GREEN}watch${NC}        Run tests in watch mode (auto-rerun on file changes)
                ${CYAN}Use: During development (TDD)${NC}

  ${GREEN}help${NC}         Show this help message

${YELLOW}Examples:${NC}
  ${CYAN}# Before committing (fastest)${NC}
  ./scripts/test-local.sh quick

  ${CYAN}# Before pushing to GitHub (recommended)${NC}
  ./scripts/test-local.sh all

  ${CYAN}# Full CI simulation (most thorough)${NC}
  ./scripts/test-local.sh ci

  ${CYAN}# Just unit tests${NC}
  ./scripts/test-local.sh unit

  ${CYAN}# Watch mode for TDD${NC}
  ./scripts/test-local.sh watch

${YELLOW}Tips:${NC}
  • Run ${GREEN}quick${NC} before every commit (2-5 seconds)
  • Run ${GREEN}all${NC} before pushing to GitHub (30-60 seconds)
  • Run ${GREEN}ci${NC} before major releases (60-90 seconds)
  • Use ${GREEN}watch${NC} during active development
  • Keep Firebase emulators running in another terminal for faster integration tests

${YELLOW}Documentation:${NC}
  • Full CI/CD guide: docs/ci-cd/README.md
  • Local testing: docs/ci-cd/03-local-testing.md
  • Debugging: docs/ci-cd/04-reading-logs.md

EOF
}

################################################################################
# Main Script
################################################################################

# Default to showing help if no command provided
COMMAND=${1:-all}

case "$COMMAND" in
    all)
        run_all
        ;;
    quick)
        run_quick
        ;;
    unit)
        print_header "${FIRE} UNIT TESTS"
        run_unit_tests
        ;;
    integration)
        print_header "${FIRE} INTEGRATION TESTS"
        run_integration_tests
        ;;
    e2e)
        print_header "${FIRE} E2E TESTS"
        run_e2e_tests
        ;;
    coverage)
        print_header "${FIRE} COVERAGE REPORT"
        run_coverage
        ;;
    ci)
        run_ci_simulation
        ;;
    watch)
        run_watch
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        echo ""
        show_help
        exit 1
        ;;
esac

exit 0
