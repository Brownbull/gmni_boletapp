#!/usr/bin/env python3
"""PreCompact hook — Session budget counter + handoff note injection.

Counts compactions per session. Warns at 3, BLOCKS at 5 (exit code 2).
Also injects a handoff note request + agent knowledge churn signal.

Uses a temp file keyed by PPID (parent process = Claude session) to track count.
Exit 0 = informational. Exit 1 = warning. Exit 2 = BLOCK (compaction rejected).

BLOCK_AT = 5: Sessions past 5 compactions produce unreliable output (L2-003 evidence).
"""
import json
import os
import subprocess
import sys
import time
from collections import Counter


def get_counter_file():
    """Counter file keyed to the Claude session (parent PID)."""
    ppid = os.getppid()
    return f"/tmp/claude-session-compactions-{ppid}"


def get_start_file():
    """Session start timestamp file."""
    ppid = os.getppid()
    return f"/tmp/claude-session-start-{ppid}"


def read_count():
    counter_file = get_counter_file()
    try:
        with open(counter_file) as f:
            return int(f.read().strip())
    except (FileNotFoundError, ValueError):
        return 0


def write_count(count):
    counter_file = get_counter_file()
    with open(counter_file, "w") as f:
        f.write(str(count))


def get_session_duration_min():
    start_file = get_start_file()
    try:
        with open(start_file) as f:
            start_time = float(f.read().strip())
        return int((time.time() - start_time) / 60)
    except (FileNotFoundError, ValueError):
        return -1


def check_knowledge_churn():
    """Detect Agent Knowledge File Churn (A-new-2 / L2-003 signal).

    If knowledge files appear in top churn, agents are being manually
    compensated for context loss. Returns list of (path, count) tuples.
    """
    try:
        result = subprocess.run(
            ["git", "log", "-100", "--name-only", "--pretty=format:", "--", "*/knowledge/*"],
            capture_output=True, text=True, timeout=3,
        )
        if result.returncode != 0:
            return []
        files = [f.strip() for f in result.stdout.splitlines() if f.strip()]
        counter = Counter(files)
        return [(path, count) for path, count in counter.most_common(5) if count >= 20]
    except Exception:
        return []


def main():
    count = read_count() + 1
    write_count(count)

    duration = get_session_duration_min()
    duration_str = f" ({duration} min)" if duration >= 0 else ""

    # --- HARD STOP at 5 compactions (A3) — exit code 2 = BLOCK ---

    if count >= 5:
        print(
            f"SESSION LIMIT: {count} compactions{duration_str}. Compaction BLOCKED.\n"
            "Context quality is severely degraded. ACTION REQUIRED:\n"
            "  1. Write a handoff note (what was done, what is next)\n"
            "  2. Run: git status && git diff --stat\n"
            "  3. Start a fresh session with a scoped task\n"
            "BoletApp evidence: sessions past 5 compactions produced 2,179 errors "
            "and required full context reconstruction.",
            file=sys.stderr,
        )
        sys.exit(2)

    messages = []

    # --- Budget warnings (counts 1–4) ---

    if count >= 3:
        messages.append(
            f"SESSION BUDGET WARNING: {count} compactions{duration_str}. "
            "Context quality is degrading. Consider: "
            "1. Save a handoff note. 2. Start a fresh session."
        )
    else:
        messages.append(f"Compaction #{count}{duration_str}.")

    # --- Agent Knowledge Churn signal (A-new-2) ---

    churn_files = check_knowledge_churn()
    if churn_files:
        churn_lines = "\n".join(f"  - {p}: {c} touches" for p, c in churn_files)
        messages.append(
            "KNOWLEDGE CHURN SIGNAL: Agent memory files are heavily modified:\n"
            f"{churn_lines}\n"
            "Context compensation is active at scale. "
            "Consider smaller session scopes and explicit handoff notes between sessions."
        )

    # --- Handoff note injection ---

    messages.append(
        "COMPACTION IMMINENT. Before context compresses, produce a brief handoff:\n"
        "1. Current task and status\n"
        "2. Key decisions made this session\n"
        "3. Immediate next step\n"
        "This note will be preserved in compressed context."
    )

    result = {"systemMessage": "\n\n".join(messages)}
    print(json.dumps(result))
    sys.exit(0)


if __name__ == "__main__":
    main()
