#!/usr/bin/env python3
"""ECC PostToolUse Warnings for Edit — Content-based checks.

Reads tool input JSON from stdin. Checks for test anti-patterns.
Exit 0 = no issues. Exit 1 = non-blocking warning.

Hooks (from ECC-LEARNING-CYCLE-IMPROVEMENTS.md Section 2):
  1. toHaveBeenCalled in test files
  2. E2E test missing cleanup pattern
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
    new_string = tool_input.get("new_string", "")

    warnings = []

    # 1. toHaveBeenCalled warning (test files only)
    if file_path.endswith((".test.ts", ".test.tsx")):
        if "toHaveBeenCalled" in new_string and "toHaveBeenCalledWith" not in new_string:
            warnings.append(
                "\u26a0\ufe0f  toHaveBeenCalled detected. Per .claude/rules/testing.md, "
                "prefer toHaveBeenCalledWith over bare toHaveBeenCalled."
            )

    # 2. E2E cleanup reminder
    if "e2e" in file_path and file_path.endswith(".spec.ts"):
        try:
            with open(file_path) as f:
                content = f.read().lower()
            if "cleanup" not in content and "afterall" not in content and "aftereach" not in content:
                warnings.append(
                    "\u26a0\ufe0f  E2E test may be missing cleanup. Per E2E-TEST-CONVENTIONS.md, "
                    "always delete test data at end."
                )
        except OSError:
            pass

    if warnings:
        for w in warnings:
            print(w, file=sys.stderr)
        sys.exit(1)  # Non-blocking warning

    sys.exit(0)


if __name__ == "__main__":
    main()
