#!/usr/bin/env python3
"""PostToolUse:Read tracker — records files read this session.

Appends the resolved file path to /tmp/claude-reads-{PPID} so that
pre-edit-guard.py can warn when Claude edits a file it hasn't read yet.

Exit 0 always — this is a tracker, not a gate.

Why: Report finding F-001 (Acting Before Reading). Claude frequently edits
files without first reading them, causing doubled tool calls and wasted retries.
The read list is the memory; pre-edit-guard is the enforcement point.
"""
import json
import os
import sys


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    tool_input = data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    if not file_path:
        sys.exit(0)

    # Normalize to absolute path so pre-edit-guard comparison is reliable
    try:
        abs_path = os.path.abspath(file_path)
    except Exception:
        sys.exit(0)

    reads_file = f"/tmp/claude-reads-{os.getppid()}"

    # O-006: Dedup — only write if path not already recorded.
    # Keeps file bounded to unique paths (not total reads).
    try:
        try:
            with open(reads_file) as f:
                existing = {line.strip() for line in f if line.strip()}
        except FileNotFoundError:
            existing = set()
        if abs_path not in existing:
            with open(reads_file, "a") as f:
                f.write(abs_path + "\n")
    except OSError:
        pass  # Best effort — never block on tracker failure

    sys.exit(0)


if __name__ == "__main__":
    main()
