#!/usr/bin/env python3
"""ECC PreToolUse Guard for Edit — Anti-pattern detection + file size enforcement.

Reads tool input JSON from stdin. Checks for known anti-patterns.
Exit 0 = allow (no issues).
Exit 1 = non-blocking warning.
Exit 2 = BLOCK (edit rejected — file exceeds 800-line hard limit).

Checks:
  1. console.log in code → warn
  2. Explicit "any" type → warn
  3. File size >500 lines → warn
  4. File size >800 lines → BLOCK
  5. Test file size limits → warn (unit >300, integration >500, e2e >400)
  6. E2E anti-patterns → warn (bare text selectors, long timeouts, networkidle)
"""
import json
import os
import re
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

    # 1. console.log detection
    if "console.log" in new_string:
        warnings.append(
            "\u26a0\ufe0f  console.log detected. Use proper logging or remove before commit."
        )

    # 2. Explicit "any" type
    if ": any" in new_string or ": any;" in new_string or ": any)" in new_string:
        warnings.append(
            '\u26a0\ufe0f  Explicit "any" type detected. Please use proper typing.'
        )

    # 3-6. File size checks (only if file exists)
    if file_path and os.path.isfile(file_path):
        try:
            with open(file_path) as f:
                line_count = sum(1 for _ in f)
        except OSError:
            line_count = 0

        # 3a. BLOCK at 800 lines — hard limit, edit rejected
        if line_count > 800:
            print(
                f"\u26a0\ufe0f  BLOCKED: {os.path.basename(file_path)} is {line_count} lines "
                f"(max 800). Split this file before adding more code.",
                file=sys.stderr,
            )
            sys.exit(2)  # BLOCK — edit rejected

        # 3b. Warn at 500 lines
        if line_count > 500:
            warnings.append(
                f"\u26a0\ufe0f  Editing large file ({line_count} lines >500). Consider refactoring first."
            )

        # 4. Unit test >300 lines (not integration/e2e)
        if file_path.endswith((".test.ts", ".test.tsx")):
            if "integration" not in file_path and "e2e" not in file_path:
                if line_count > 300:
                    warnings.append(
                        f"\u26a0\ufe0f  Unit test file exceeds 300 lines ({line_count}). "
                        "Per .claude/rules/testing.md, consider splitting."
                    )

        # 5. Integration test >500 lines
        if "integration" in file_path and file_path.endswith(
            (".test.ts", ".test.tsx")
        ):
            if line_count > 500:
                warnings.append(
                    f"\u26a0\ufe0f  Integration test file exceeds 500 lines ({line_count}). "
                    "Per .claude/rules/testing.md, consider splitting."
                )

        # 6. E2E test >400 lines
        if "e2e" in file_path and file_path.endswith(".spec.ts"):
            if line_count > 400:
                warnings.append(
                    f"\u26a0\ufe0f  E2E test file exceeds 400 lines ({line_count}). "
                    "Per E2E-TEST-CONVENTIONS.md, consider splitting journey."
                )

    # 7-9. E2E anti-pattern detection (only for e2e spec files)
    if "e2e" in file_path and file_path.endswith(".spec.ts"):
        # 7. Bare text=Ajustes selector (matches 2 elements in strict mode)
        if "text=Ajustes" in new_string:
            warnings.append(
                "\u26a0\ufe0f  E2E: 'text=Ajustes' matches 2 elements. "
                "Use getByRole('menuitem', { name: 'Ajustes' }) instead."
            )

        # 8. Long fixed timeouts for async operations
        long_timeouts = re.findall(r"waitForTimeout\((\d+)\)", new_string)
        for timeout_ms in long_timeouts:
            if int(timeout_ms) >= 3000:
                warnings.append(
                    f"\u26a0\ufe0f  E2E: waitForTimeout({timeout_ms}) is too long. "
                    "Use element.waitFor({ state: 'hidden/visible' }) for async ops."
                )

        # 9. networkidle (never resolves with Firebase WebSocket)
        if "networkidle" in new_string:
            warnings.append(
                "\u26a0\ufe0f  E2E: 'networkidle' never resolves with Firebase WebSocket. "
                "Use waitForSelector for specific elements instead."
            )

    if warnings:
        # Print warnings to stderr (shown as hook feedback)
        for w in warnings:
            print(w, file=sys.stderr)
        sys.exit(1)  # Non-blocking warning

    sys.exit(0)


if __name__ == "__main__":
    main()
