#!/usr/bin/env python3
"""build-l2-baseline.py — Build FF-B semantic baseline from L2 neuron docs.

Reads docs/layer2/L2-*.md files. Extracts Gabe Handle, Tier A meta-pattern,
and "What Happened" excerpt. Outputs docs/layer2/l2-baseline.json.

The baseline JSON is the reference file for FF-B semantic detection:
- Workflow agents read it to assess new story/epic similarity to known patterns
- Each pattern includes: signals (keywords), description, and the FF-A gate it triggers

Usage:
  python3 scripts/build-l2-baseline.py [layer2-dir] [output-path]

Defaults:
  layer2-dir:  docs/layer2
  output-path: docs/layer2/l2-baseline.json

Re-run whenever L2 neuron docs are updated.
"""

import json
import os
import re
import sys
import glob


LAYER2_DIR = sys.argv[1] if len(sys.argv) > 1 else "docs/layer2"
OUTPUT_PATH = sys.argv[2] if len(sys.argv) > 2 else os.path.join(LAYER2_DIR, "l2-baseline.json")


# FF-B signal keywords and gate mappings — one source of truth per neuron.
# These supplement the doc excerpts with detection-oriented metadata.
PATTERN_META = {
    "L2-001": {
        "signals": [
            "real-time sync", "delta sync", "distributed", "new data layer",
            "integration service", "migration", "offline", "cache invalidation",
            "webhook", "new infrastructure", "new provider",
        ],
        "ff_a_gate": "Spike-first check (ecc-create-story/step-02-classification)",
        "mode": "Mode 1: L2 Pattern Match",
    },
    "L2-002": {
        "signals": [
            "consolidate all", "cleanup", "remove dead code", "refactor everything",
            "audit all", "extract pattern", "framework upgrade", "tooling migration",
            "bump version", "premature abstraction",
        ],
        "ff_a_gate": "Compression trigger + Framework upgrade gate (step-01-prerequisites)",
        "mode": "Mode 1: L2 Pattern Match",
    },
    "L2-003": {
        "signals": [
            "update knowledge", "re-read context", "resolve confusion", "re-explore",
            "fix everything at once", "multiple concerns simultaneously", "24 hour",
        ],
        "ff_a_gate": "Session budget hard-stop (session-budget.py + pre-edit-guard.py churn check)",
        "mode": "Mode 3: Ancestor Path Check (fix-of-fix-of-fix chain)",
    },
    "L2-004": {
        "signals": [
            "modify shared component", "change core type", "central file",
            "global state", "shared utils", "translations", "App.tsx",
        ],
        "ff_a_gate": "Churn-count warning in pre-edit-guard.py",
        "mode": "Mode 1: L2 Pattern Match",
    },
    "L2-005": {
        "signals": [
            "new epic while current in progress", "pivot", "parallel work",
            "concurrent", "start fresh", "separate track", "new priority",
        ],
        "ff_a_gate": "Epic isolation check (step-01-prerequisites)",
        "mode": "Mode 2: Prior Epic Rerun",
    },
    "L2-006": {
        "signals": [
            "add sprint ceremony", "add tracking", "process improvement",
            "add tooling", "update config for process", "more documentation",
        ],
        "ff_a_gate": "Process-scale calibration (CLAUDE.md Process Scale section)",
        "mode": "Mode 1: L2 Pattern Match",
    },
    "L2-007": {
        "signals": [
            "e2e tests", "playwright", "cypress", "integration test suite",
            "ci pipeline", "test infrastructure", "shared test state", "end-to-end",
        ],
        "ff_a_gate": "E2E isolation requirement (ecc-dev-story/step-01-story-discovery)",
        "mode": "Mode 1: L2 Pattern Match",
    },
    "L2-008": {
        "signals": [
            "standardize approach", "align conventions", "each component has its own",
            "multiple dialects", "per-view", "per-module", "consistent pattern across",
        ],
        "ff_a_gate": "No FF-A gate — FF-B only (Consensus Drift has no keyword trigger)",
        "mode": "Mode 1: L2 Pattern Match (FF-B unique coverage)",
    },
}


def extract_section(content: str, heading: str) -> str:
    """Extract the first paragraph under a ## heading."""
    pattern = rf"## {re.escape(heading)}\n\n(.*?)(?=\n## |\Z)"
    match = re.search(pattern, content, re.DOTALL)
    if match:
        text = match.group(1).strip()
        # Take first 400 chars, truncate at sentence boundary
        if len(text) > 400:
            cut = text[:400].rfind(". ")
            text = text[: cut + 1] if cut > 100 else text[:400]
        return text
    return ""


def parse_neuron_file(filepath: str) -> dict:
    """Extract key fields from an L2 neuron .md file."""
    with open(filepath) as f:
        content = f.read()

    # Extract neuron ID from filename
    basename = os.path.basename(filepath)
    neuron_id = re.match(r"(L2-\d+)", basename)
    neuron_id = neuron_id.group(1) if neuron_id else "L2-???"

    # Extract title (first # heading)
    title_match = re.search(r"^# (.+)$", content, re.MULTILINE)
    name = title_match.group(1) if title_match else basename

    # Extract Gabe Handle (blockquote or ## Gabe Handle section)
    handle = extract_section(content, "Gabe Handle")
    if not handle:
        handle_match = re.search(r'"([^"]+)"', content)
        handle = handle_match.group(1) if handle_match else ""

    return {
        "id": neuron_id,
        "name": name.replace(f"{neuron_id}: ", ""),
        "handle": handle,
        "tier_a": extract_section(content, "Tier A: Meta-Pattern"),
        "what_happened": extract_section(content, "What Happened"),
        **PATTERN_META.get(neuron_id, {"signals": [], "ff_a_gate": "none", "mode": ""}),
    }


def build_baseline() -> dict:
    neuron_files = sorted(glob.glob(os.path.join(LAYER2_DIR, "L2-*.md")))
    if not neuron_files:
        print(f"ERROR: No L2-*.md files found in {LAYER2_DIR}", file=sys.stderr)
        sys.exit(1)

    patterns = [parse_neuron_file(f) for f in neuron_files]

    return {
        "version": "1.0",
        "description": "FF-B semantic baseline: L2 pattern library for drift detection",
        "source": "docs/layer2/L2-*.md — regenerate with: python3 scripts/build-l2-baseline.py",
        "thresholds": {
            "warn": 0.8,
            "block": 0.95,
            "note": "For agent-based detection: LOW=no resemblance / MEDIUM=resembles / HIGH=strongly resembles",
        },
        "usage": (
            "Compare new story/epic context against each pattern's signals and description. "
            "HIGH similarity => invoke the pattern's ff_a_gate. "
            "L2-008 has no FF-A gate — only detectable via semantic reasoning (FF-B unique)."
        ),
        "patterns": patterns,
    }


if __name__ == "__main__":
    baseline = build_baseline()
    with open(OUTPUT_PATH, "w") as f:
        json.dump(baseline, f, indent=2)

    print(f"Generated: {OUTPUT_PATH}")
    print(f"Patterns: {len(baseline['patterns'])}")
    for p in baseline["patterns"]:
        print(f"  {p['id']}: {p['name']} ({len(p['signals'])} signals, gate: {p['ff_a_gate'][:40]}...)")
