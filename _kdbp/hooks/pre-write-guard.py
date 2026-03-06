#!/usr/bin/env python3
"""PreToolUse:Write guard — Planning artifact gate + P1 infrastructure check.

When creating a NEW file in src/, checks if a planning artifact (ADR)
exists in docs/decisions/ for the current branch/epic.

P1 (Missing Infrastructure): When creating files in known directory types,
checks that required sibling infrastructure files exist.
Value: Structural Humility — "Built the house, forgot the plumbing"

Exit 0 = allow. Exit 1 = non-blocking warning. Does NOT block.
"""
import json
import os
import re
import sys


def check_adr(file_path, rel_path, project_dir):
    """Original ADR check for new src/ files."""
    if not rel_path.startswith("src/"):
        return None
    if os.path.isfile(file_path):
        return None

    decisions_dir = os.path.join(project_dir, "docs", "decisions")
    if os.path.isdir(decisions_dir):
        adrs = [f for f in os.listdir(decisions_dir)
                if f.endswith(".md") and f != "TEMPLATE.md"]
        if adrs:
            return None

    return (
        "Creating new file in src/ with no planning artifacts in "
        "docs/decisions/. Consider writing an ADR before implementation."
    )


def check_infrastructure(file_path, rel_path, project_dir):
    """P1: Check required infrastructure files per directory type."""
    warnings = []

    # Only check new files (not overwrites)
    if os.path.isfile(file_path):
        return warnings

    parent_dir = os.path.dirname(file_path)

    # FSD barrel export check: src/features/{name}/ needs index.ts(x)
    fsd_match = re.match(r"src/features/([^/]+)/", rel_path)
    if fsd_match:
        feature_root = os.path.join(
            project_dir, "src", "features", fsd_match.group(1)
        )
        has_barrel = (
            os.path.isfile(os.path.join(feature_root, "index.ts"))
            or os.path.isfile(os.path.join(feature_root, "index.tsx"))
        )
        if not has_barrel and os.path.isdir(feature_root):
            warnings.append(
                f"P1: Feature module '{fsd_match.group(1)}' has no barrel "
                f"export (index.ts/tsx). Create it to maintain FSD pattern."
            )

    # Workflow step infrastructure: steps/ needs step-00-behavior-load.md or step-00-preflight.md
    if "/steps/" in rel_path and rel_path.endswith(".md"):
        steps_dir = parent_dir
        has_bookend = (
            os.path.isfile(os.path.join(steps_dir, "step-00-behavior-load.md"))
            or os.path.isfile(os.path.join(steps_dir, "step-00-preflight.md"))
        )
        if not has_bookend and os.path.isdir(steps_dir):
            warnings.append(
                "P1: Creating workflow step without step-00 bookend. "
                "Need step-00-behavior-load.md or step-00-preflight.md."
            )

    # Trajectory infrastructure: needs PROJECT.md and ledger.md
    if "behaviors/trajectory/" in rel_path or rel_path.startswith("trajectory/"):
        traj_dir = parent_dir
        # Walk up to trajectory root if we're in a subdirectory
        while traj_dir and not traj_dir.endswith("trajectory"):
            traj_dir = os.path.dirname(traj_dir)
        if traj_dir and os.path.isdir(traj_dir):
            if not os.path.isfile(os.path.join(traj_dir, "PROJECT.md")):
                warnings.append(
                    "P1: Writing to trajectory/ without PROJECT.md. "
                    "Trajectory requires PROJECT.md for value resolution."
                )

    return warnings


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    tool_input = data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    if not file_path:
        sys.exit(0)

    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", ".")

    # Make path relative to project
    if file_path.startswith(project_dir):
        rel_path = file_path[len(project_dir):].lstrip("/")
    else:
        rel_path = file_path

    warnings = []

    # Original ADR check
    adr_warn = check_adr(file_path, rel_path, project_dir)
    if adr_warn:
        warnings.append(adr_warn)

    # P1: Infrastructure checks
    infra_warns = check_infrastructure(file_path, rel_path, project_dir)
    warnings.extend(infra_warns)

    if warnings:
        for w in warnings:
            print(f"  {w}", file=sys.stderr)
        sys.exit(1)

    sys.exit(0)


if __name__ == "__main__":
    main()
