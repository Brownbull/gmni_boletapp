#!/bin/bash
# PostToolUse:Edit — TypeScript type checking (DISABLED — moved to step-02).
#
# tsc --noEmit previously ran after every .ts/.tsx edit, causing:
#   - ~1,000 compiler runs per session window (5–30s each)
#   - Pre-existing errors injected as context noise after every edit
#   - Duplicate run with step-02-parallel-spawn.md pre-classification
#
# TypeScript errors are now caught exclusively at code review (step-02),
# where tsc output is organized as HIGH certainty findings in a structured
# table rather than raw stderr after every keystroke.
#
# O-001 + O-003: overhead audit 2026-03-02.

exit 0
