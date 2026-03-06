#!/usr/bin/env python3
"""PostToolUse:Edit warnings — Test content-based checks.

Reads tool input JSON from stdin. Checks for test anti-patterns.
Exit 0 = no issues. Exit 1 = non-blocking warning.

Checks:
  1. toHaveBeenCalled without toHaveBeenCalledWith → warn
  2. E2E test missing cleanup pattern → warn
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

    # 1. toHaveBeenCalled without specificity (test files only)
    if file_path.endswith((".test.ts", ".test.tsx")):
        if "toHaveBeenCalled" in new_string and "toHaveBeenCalledWith" not in new_string:
            warnings.append(
                "toHaveBeenCalled detected. Prefer toHaveBeenCalledWith for specificity."
            )

    # 2. Missing mock check (F-002) — external imports without jest.mock()
    # Reads the FULL file post-edit to check import/mock balance.
    # Only fires for unit test files (not integration or e2e — those may intentionally use real modules).
    is_unit_test = (
        file_path.endswith((".test.ts", ".test.tsx"))
        and "integration" not in file_path
        and "e2e" not in file_path
    )
    if is_unit_test and os.path.isfile(file_path):
        try:
            with open(file_path) as f:
                content = f.read()

            # Find all imported module specifiers
            import_re = re.compile(
                r"""^import\s+(?:type\s+)?(?:\{[^}]*\}|\w+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]""",
                re.MULTILINE,
            )
            imports = import_re.findall(content)

            # Filter to external modules only (not relative, not test infra)
            test_infra = {
                "@testing-library", "@jest", "jest-", "vitest", "@vitest",
                "msw", "nock", "@firebase/testing", "firebase-functions-test",
            }
            external = [
                m for m in imports
                if not m.startswith((".", "@/", "~/"))
                and not any(m.startswith(h) or m == h.rstrip("/") for h in test_infra)
            ]

            # Find all mocked modules: jest.mock('pkg') or jest.mock("pkg")
            mock_re = re.compile(r"""jest\.mock\(\s*['"]([^'"]+)['"]""")
            mocked = set(mock_re.findall(content))

            # An import is covered if its exact specifier is mocked,
            # OR if the top-level package name is mocked (e.g. 'firebase/auth' covered by 'firebase')
            def is_covered(module: str) -> bool:
                if module in mocked:
                    return True
                top = module.split("/")[0]
                return top in mocked

            unmocked = [m for m in external if not is_covered(m)]
            # Deduplicate by top-level package to keep the message concise
            seen = set()
            unique_unmocked = []
            for m in unmocked:
                top = m.split("/")[0]
                if top not in seen:
                    seen.add(top)
                    unique_unmocked.append(m)

            if unique_unmocked:
                listed = ", ".join(unique_unmocked[:4])
                warnings.append(
                    f"MOCK CHECK: External import(s) without jest.mock(): {listed}. "
                    "Add mocks or confirm this is intentional (integration test? real module OK?)."
                )
        except OSError:
            pass

    # 2. E2E cleanup reminder
    if "e2e" in file_path and file_path.endswith(".spec.ts"):
        try:
            with open(file_path) as f:
                content = f.read().lower()
            if "cleanup" not in content and "afterall" not in content and "aftereach" not in content:
                warnings.append(
                    "E2E test may be missing cleanup. Always delete test data at end."
                )
        except OSError:
            pass

    if warnings:
        for w in warnings:
            print(f"  {w}", file=sys.stderr)
        sys.exit(1)

    sys.exit(0)


if __name__ == "__main__":
    main()
