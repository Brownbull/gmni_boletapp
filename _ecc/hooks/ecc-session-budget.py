#!/usr/bin/env python3
"""PreCompact hook — Session budget counter + handoff note injection.

Counts compactions per session. Warns at 3, strongly recommends restart at 5.
Also injects a handoff note request so critical context survives compaction.

Uses a temp file keyed by PPID (parent process = Claude session) to track count.
Exit 0 always (informational — cannot block compaction).
"""
import json
import os
import sys
import time


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


def main():
    count = read_count() + 1
    write_count(count)

    duration = get_session_duration_min()
    duration_str = f" ({duration} min)" if duration >= 0 else ""

    messages = []

    if count >= 5:
        messages.append(
            f"SESSION BUDGET CRITICAL: {count} compactions{duration_str}. "
            "Context quality is severely degraded. "
            "STRONGLY RECOMMEND: save handoff note and start a fresh session."
        )
    elif count >= 3:
        messages.append(
            f"SESSION BUDGET WARNING: {count} compactions{duration_str}. "
            "Context quality is degrading. Consider: "
            "1. Save a handoff note. 2. Start a fresh session."
        )
    else:
        messages.append(
            f"Compaction #{count}{duration_str}."
        )

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
