#!/usr/bin/env bash
# Story 16-9: Deploy to staging Firebase Hosting + Firestore rules
#
# Usage:
#   bash scripts/deploy-staging.sh           # Deploy hosting + rules
#   bash scripts/deploy-staging.sh hosting   # Deploy hosting only
#   bash scripts/deploy-staging.sh rules     # Deploy Firestore rules only
#
# Prerequisites:
#   - Firebase CLI authenticated: firebase login
#   - .env.staging exists with valid Firebase config
#   - For rules: firebase.staging.json exists (points to firestore.staging.rules)

set -euo pipefail

PROJECT="boletapp-staging"
COMPONENT="${1:-all}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[deploy-staging]${NC} $1"; }
warn() { echo -e "${YELLOW}[deploy-staging]${NC} $1"; }
err() { echo -e "${RED}[deploy-staging]${NC} $1" >&2; }

# Validate environment
if [ ! -f ".env.staging" ]; then
    err ".env.staging not found. Cannot deploy without staging config."
    exit 1
fi

if ! command -v firebase &>/dev/null; then
    err "Firebase CLI not found. Install: npm install -g firebase-tools"
    exit 1
fi

deploy_hosting() {
    log "Building for staging..."
    npm run build:staging

    log "Deploying hosting to ${PROJECT}..."
    firebase deploy --only hosting --project "${PROJECT}"

    log "Hosting deployed. URL: https://${PROJECT}.web.app"
}

deploy_rules() {
    if [ ! -f "firestore.staging.rules" ]; then
        err "firestore.staging.rules not found."
        exit 1
    fi

    # INC-001 guard: boletapp-staging is shared with Gustify.
    # Deploying rules that lack Gustify paths breaks Gustify's Firestore access.
    REQUIRED_GUSTIFY_PATHS=("canonicalIngredients" "itemMappings" "recipes" "canonicalPreparedFoods" "unknownIngredients" "unknownPreparedFoods")
    MISSING=()
    for path in "${REQUIRED_GUSTIFY_PATHS[@]}"; do
        if ! grep -q "$path" firestore.staging.rules; then
            MISSING+=("$path")
        fi
    done
    if [ ${#MISSING[@]} -gt 0 ]; then
        err "BLOCKED: firestore.staging.rules is missing Gustify paths: ${MISSING[*]}"
        err "boletapp-staging is shared with Gustify — deploying without these paths will break Gustify."
        err "See: INC-001. The canonical combined rules live in the Gustify repo."
        exit 1
    fi

    log "Deploying Firestore rules to ${PROJECT}..."
    # Use staging config that points to firestore.staging.rules
    firebase deploy --only firestore:rules --project "${PROJECT}" --config firebase.staging.json

    log "Firestore staging rules deployed."
}

case "${COMPONENT}" in
    hosting)
        deploy_hosting
        ;;
    rules)
        deploy_rules
        ;;
    all)
        deploy_rules
        deploy_hosting
        ;;
    *)
        err "Unknown component: ${COMPONENT}. Use: hosting, rules, or all"
        exit 1
        ;;
esac

log "Staging deployment complete."
