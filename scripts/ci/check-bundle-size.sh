#!/bin/bash
#
# Bundle Size Check Script
# Story 3.6: Performance Baselines & Lighthouse CI
#
# Checks if bundle size exceeds threshold (10% above baseline)
# Baseline: 637KB, Threshold: 700KB
#

set -e

# Build the project
echo "Building project..."
npm run build > /dev/null 2>&1

# Calculate total JS bundle size in KB
BUNDLE_SIZE=$(du -sk dist/assets/*.js 2>/dev/null | awk '{total += $1} END {print total}')

# Configuration
BASELINE_SIZE=637
THRESHOLD_SIZE=700

# Output results
echo ""
echo "=========================================="
echo "       Bundle Size Analysis"
echo "=========================================="
echo ""
echo "Current bundle size:  ${BUNDLE_SIZE} KB"
echo "Baseline size:        ${BASELINE_SIZE} KB"
echo "Threshold (10%):      ${THRESHOLD_SIZE} KB"
echo ""

# Calculate percentage change
if [ "$BASELINE_SIZE" -gt 0 ]; then
  CHANGE=$(( (BUNDLE_SIZE - BASELINE_SIZE) * 100 / BASELINE_SIZE ))
  if [ "$CHANGE" -gt 0 ]; then
    echo "Change from baseline: +${CHANGE}%"
  else
    echo "Change from baseline: ${CHANGE}%"
  fi
fi

echo ""

# Check against threshold
if [ "$BUNDLE_SIZE" -gt "$THRESHOLD_SIZE" ]; then
  echo "WARNING: Bundle size exceeds threshold!"
  echo ""
  echo "Recommendations:"
  echo "  1. Check for new large dependencies"
  echo "  2. Consider code splitting"
  echo "  3. Use dynamic imports for routes"
  echo "  4. Review tree shaking effectiveness"
  echo ""
  exit 1
else
  echo "Bundle size is within acceptable range"
  echo ""
  exit 0
fi
