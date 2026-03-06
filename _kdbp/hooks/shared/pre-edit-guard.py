#!/usr/bin/env python3
"""PreToolUse:Edit guard — Anti-pattern detection + file size enforcement.

Exit 0 = allow. Exit 1 = non-blocking warning. Exit 2 = BLOCK.
Checks: read-before-edit (F-001), console.log, :any type, file size >500/800,
test file size, churn >20/40 (L2-004), E2E anti-patterns, gravity wells.
"""
import json
import os
import re
import subprocess
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

    # Read-before-edit (F-001): warn if file not in session reads list.
    if file_path and os.path.isfile(file_path):
        reads_file = f"/tmp/claude-reads-{os.getppid()}"
        try:
            session_reads = {l.strip() for l in open(reads_file) if l.strip()}
        except FileNotFoundError:
            session_reads = set()
        if os.path.abspath(file_path) not in session_reads:
            warnings.append(
                f"READ-FIRST: {os.path.basename(file_path)} not read this session. "
                "Read before editing to avoid wasted retries (F-001)."
            )

    if "console.log" in new_string:
        warnings.append(
            "console.log detected. Use proper logging or remove before commit."
        )

    if ": any" in new_string or ": any;" in new_string or ": any)" in new_string:
        warnings.append(
            'Explicit "any" type detected. Use proper typing.'
        )

    # File size: ECC_SIZE_EXCLUDE=basename,... skips 800-line BLOCK and churn BLOCK.
    size_exclude = {s.strip() for s in os.environ.get("ECC_SIZE_EXCLUDE", "").split(",") if s.strip()}

    if file_path and os.path.isfile(file_path):
        try:
            with open(file_path) as f:
                line_count = sum(1 for _ in f)
        except OSError:
            line_count = 0

        # BLOCK at 800 lines — hard limit, edit rejected (unless excluded)
        if line_count > 800 and os.path.basename(file_path) not in size_exclude:
            print(
                f"BLOCKED: {os.path.basename(file_path)} is {line_count} lines "
                f"(max 800). Split this file before adding more code.",
                file=sys.stderr,
            )
            sys.exit(2)

        # Warn at 500 lines
        if line_count > 500:
            warnings.append(
                f"Editing large file ({line_count} lines >500). Consider refactoring."
            )

        # Test file size limits
        is_test = file_path.endswith((".test.ts", ".test.tsx"))
        is_e2e = "e2e" in file_path and file_path.endswith(".spec.ts")
        is_integration = "integration" in file_path and is_test

        if is_e2e and line_count > 400:
            warnings.append(
                f"E2E test file exceeds 400 lines ({line_count}). Split the journey."
            )
        elif is_integration and line_count > 500:
            warnings.append(
                f"Integration test exceeds 500 lines ({line_count}). Split the file."
            )
        elif is_test and not is_integration and not is_e2e and line_count > 300:
            warnings.append(
                f"Unit test exceeds 300 lines ({line_count}). Split the file."
            )

    # Churn (L2-004): warn >20, BLOCK >40. ECC_GRAVITY_WELLS="file=hint;..." always blocks.
    CHURN_EXCLUSIONS = {"sprint-status.yaml"} | size_exclude
    gw_env = os.environ.get("ECC_GRAVITY_WELLS", "")
    GRAVITY_WELLS = {
        k.strip(): v.strip()
        for e in gw_env.split(";") if "=" in e
        for k, v in [e.split("=", 1)]
    }

    basename = os.path.basename(file_path) if file_path else ""
    if basename in GRAVITY_WELLS:
        print(
            f"BLOCKED: {basename} is a known gravity well (L2-004). "
            f"Decomposition required: {GRAVITY_WELLS[basename]}",
            file=sys.stderr,
        )
        sys.exit(2)

    if file_path and os.path.isfile(file_path) and os.path.basename(file_path) not in CHURN_EXCLUSIONS:
        # O-002: Cache per session — git log runs once per file, not once per edit.
        cache_file = f"/tmp/claude-churn-cache-{os.getppid()}"
        try:
            with open(cache_file) as f:
                churn_cache = json.load(f)
        except (FileNotFoundError, ValueError):
            churn_cache = {}

        abs_path = os.path.abspath(file_path)
        if abs_path in churn_cache:
            touch_count = churn_cache[abs_path]
        else:
            touch_count = 0
            try:
                repo_result = subprocess.run(
                    ["git", "rev-parse", "--show-toplevel"],
                    capture_output=True, text=True,
                    cwd=os.path.dirname(abs_path) or ".",
                    timeout=5,
                )
                if repo_result.returncode == 0:
                    repo_root = repo_result.stdout.strip()
                    churn_result = subprocess.run(
                        ["git", "log", "-50", "--follow", "--oneline", "--", file_path],
                        capture_output=True, text=True, cwd=repo_root, timeout=3,
                    )
                    if churn_result.returncode == 0:
                        touch_count = len(churn_result.stdout.strip().splitlines())
                    churn_cache[abs_path] = touch_count
                    try:
                        with open(cache_file, "w") as f:
                            json.dump(churn_cache, f)
                    except OSError:
                        pass
            except Exception:
                pass  # git unavailable or not a repo — skip

        if touch_count >= 40:
            print(
                f"BLOCKED: {os.path.basename(file_path)} modified {touch_count} times. "
                "Gravity well. Create a refactor story before modifying further.",
                file=sys.stderr,
            )
            sys.exit(2)
        elif touch_count >= 20:
            warnings.append(
                f"CHURN: {os.path.basename(file_path)} modified {touch_count} times. "
                "Consider a refactor story before this change."
            )

    # E2E anti-pattern checks — add project-specific selector issues here
    if "e2e" in file_path and file_path.endswith(".spec.ts"):

        long_timeouts = re.findall(r"waitForTimeout\((\d+)\)", new_string)
        for timeout_ms in long_timeouts:
            if int(timeout_ms) >= 3000:
                warnings.append(
                    f"E2E: waitForTimeout({timeout_ms}) is too long. "
                    "Use element.waitFor() for async ops."
                )

        if "networkidle" in new_string:
            warnings.append(
                "E2E: 'networkidle' never resolves with Firebase WebSocket. "
                "Use waitForSelector instead."
            )

    # Playwright config parallelism check (D-003 / L2-007)
    # Parallel E2E = shared staging data corruption.
    if "playwright.config" in file_path:
        if re.search(r"workers\s*:\s*[2-9]", new_string) or \
           re.search(r"fullyParallel\s*:\s*true", new_string):
            warnings.append(
                "E2E: Parallel test execution detected in playwright config. "
                "Run serially (fullyParallel: false, workers: 1) to prevent shared staging data corruption."
            )

    if warnings:
        for w in warnings:
            print(w, file=sys.stderr)
        sys.exit(1)

    sys.exit(0)


if __name__ == "__main__":
    main()
