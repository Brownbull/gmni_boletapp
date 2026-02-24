"""
Core module for workflow-cost: pricing constants, project path resolution,
JSONL parsing, and session analysis.
"""

import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# Anthropic pricing per million tokens (as of 2026-02)
# Source: https://platform.claude.com/docs/en/about-claude/pricing
# Cache pricing has two tiers: 5min (1.25x input) and 1hr (2x input)
# Claude Code uses 1-hour cache exclusively
MODEL_PRICING = {
    "claude-opus-4-6": {
        "input": 5.00,
        "output": 25.00,
        "cache_5m": 6.25,       # 1.25x input
        "cache_1h": 10.00,      # 2x input
        "cache_read": 0.50,     # 0.1x input
    },
    "claude-opus-4-5-20251101": {
        "input": 5.00,
        "output": 25.00,
        "cache_5m": 6.25,
        "cache_1h": 10.00,
        "cache_read": 0.50,
    },
    "claude-opus-4-1-20250805": {
        "input": 15.00,
        "output": 75.00,
        "cache_5m": 18.75,
        "cache_1h": 30.00,
        "cache_read": 1.50,
    },
    "claude-sonnet-4-5-20250929": {
        "input": 3.00,
        "output": 15.00,
        "cache_5m": 3.75,
        "cache_1h": 6.00,
        "cache_read": 0.30,
    },
    "claude-haiku-4-5-20251001": {
        "input": 1.00,
        "output": 5.00,
        "cache_5m": 1.25,
        "cache_1h": 2.00,
        "cache_read": 0.10,
    },
}

# Fallback for unknown models — use Opus 4.6 pricing (safe upper bound)
DEFAULT_PRICING = MODEL_PRICING["claude-opus-4-6"]

CLAUDE_PROJECTS_DIR = Path.home() / ".claude" / "projects"


def resolve_project_dir(explicit_path: str | None = None) -> Path:
    """Resolve the Claude Code session directory for the current project.

    Claude Code encodes project paths as: absolute_path.replace('/', '-')
    e.g. /home/user/myproject -> -home-user-myproject
    stored at ~/.claude/projects/-home-user-myproject/
    """
    if explicit_path:
        project_root = Path(explicit_path).resolve()
    else:
        # Try git root first, fall back to cwd
        try:
            result = subprocess.run(
                ["git", "rev-parse", "--show-toplevel"],
                capture_output=True, text=True, timeout=5,
            )
            if result.returncode == 0:
                project_root = Path(result.stdout.strip())
            else:
                project_root = Path.cwd()
        except (subprocess.TimeoutExpired, FileNotFoundError):
            project_root = Path.cwd()

    encoded = str(project_root).replace("/", "-")
    session_dir = CLAUDE_PROJECTS_DIR / encoded

    if not session_dir.exists():
        print(f"ERROR: No Claude Code sessions found for project: {project_root}", file=sys.stderr)
        print(f"  Expected: {session_dir}", file=sys.stderr)
        # List available projects as hint
        if CLAUDE_PROJECTS_DIR.exists():
            projects = [d.name for d in CLAUDE_PROJECTS_DIR.iterdir() if d.is_dir() or d.suffix == ".jsonl"]
            if projects:
                print(f"  Available projects:", file=sys.stderr)
                for p in sorted(set(p.split(".")[0] for p in projects))[:10]:
                    print(f"    {p}", file=sys.stderr)
        sys.exit(1)

    return session_dir


def resolve_csv_path(project_dir: Path) -> Path:
    """Derive CSV path from the project's session directory.

    Reverses the encoding to find the project root, then looks for
    docs/sprint-artifacts/ or falls back to a .claude-costs.csv in the project root.
    """
    encoded_name = project_dir.name  # e.g. -home-khujta-projects-bmad-boletapp
    project_root = _decode_project_path(encoded_name)

    sprint_dir = project_root / "docs" / "sprint-artifacts"
    if sprint_dir.exists():
        return sprint_dir / "workflow-costs.csv"

    return project_root / ".claude-workflow-costs.csv"


def _decode_project_path(encoded: str) -> Path:
    """Decode a Claude Code encoded project path back to a filesystem path.

    Encoded: -home-khujta-projects-bmad-boletapp
    Decoded: /home/khujta/projects/bmad/boletapp

    Strategy: the encoded form is the absolute path with '/' replaced by '-'.
    Since directory names can contain '-', we can't just split. Instead, we
    progressively try splitting at each '-' to rebuild a valid path.
    """
    # Remove leading '-' (represents the leading '/')
    rest = encoded[1:]
    parts = rest.split("-")

    # Greedy path reconstruction: try to build valid paths
    path = Path("/")
    i = 0
    while i < len(parts):
        # Try single segment first
        candidate = parts[i]
        j = i + 1
        # If this segment doesn't exist, try joining with next segments
        while not (path / candidate).exists() and j < len(parts):
            candidate = candidate + "-" + parts[j]
            j += 1
        path = path / candidate
        i = j

    return path


_RE_COMMAND_NAME = re.compile(r"<command-name>/([\w-]+)</command-name>")
_RE_COMMAND_ARGS = re.compile(r"<command-args>(.*?)</command-args>")

# Workflows we track — anything else is classified as "other"
TRACKED_WORKFLOWS = {
    "ecc-dev-story", "ecc-code-review", "ecc-create-story",
    "ecc-e2e", "ecc-impact-analysis", "deploy-story",
}


def _detect_workflow_from_text(text: str) -> tuple[str, str]:
    """Extract workflow name and story from a user message text.

    Returns (workflow, story) or ("", "") if not detected.
    """
    m_name = _RE_COMMAND_NAME.search(text)
    if not m_name:
        return "", ""
    name = m_name.group(1)
    story = ""
    m_args = _RE_COMMAND_ARGS.search(text)
    if m_args:
        story = m_args.group(1).strip()
    return name, story


def parse_jsonl(filepath: Path) -> dict:
    """Parse a JSONL file and return aggregated token usage + metadata."""
    tokens_by_model = {}
    first_ts = None
    last_ts = None
    msg_count = 0
    first_user_msg = None
    task_calls = []
    detected_workflow = ""
    detected_story = ""
    # Track messages stripped by cozempic PreCompact: usage field absent or empty.
    # These represent pre-compaction turns whose token data was pruned from the JSONL.
    # When pruned_msgs > 0, the cost report is a lower bound (post-compaction only).
    pruned_msgs = 0

    with open(filepath) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
            except json.JSONDecodeError:
                continue

            ts = data.get("timestamp")
            if ts:
                if not first_ts:
                    first_ts = ts
                last_ts = ts

            if data.get("type") == "user":
                msg = data.get("message", {})
                content = msg.get("content", "")
                texts = []
                if isinstance(content, str):
                    texts.append(content)
                    if not first_user_msg:
                        first_user_msg = content[:150]
                elif isinstance(content, list):
                    for block in content:
                        if isinstance(block, dict) and block.get("type") == "text":
                            texts.append(block["text"])
                            if not first_user_msg:
                                first_user_msg = block["text"][:150]

                # Detect workflow from user messages (first match wins)
                if not detected_workflow:
                    for txt in texts:
                        wf, st = _detect_workflow_from_text(txt)
                        if wf and wf in TRACKED_WORKFLOWS:
                            detected_workflow = wf
                            detected_story = st
                            break

            if data.get("type") == "assistant":
                msg = data.get("message", {})
                raw_usage = msg.get("usage")
                usage = raw_usage or {}
                model = msg.get("model", "unknown")

                # Count messages where cozempic stripped the usage field
                if not raw_usage:
                    pruned_msgs += 1

                if model not in tokens_by_model:
                    tokens_by_model[model] = {
                        "input": 0, "output": 0,
                        "cache_5m": 0, "cache_1h": 0, "cache_read": 0,
                        "messages": 0,
                    }

                entry = tokens_by_model[model]
                entry["input"] += usage.get("input_tokens", 0)
                entry["output"] += usage.get("output_tokens", 0)
                entry["cache_read"] += usage.get("cache_read_input_tokens", 0)
                entry["messages"] += 1

                # Parse cache creation with 5min/1hr tier breakdown
                cache_detail = usage.get("cache_creation", {})
                if cache_detail:
                    entry["cache_5m"] += cache_detail.get("ephemeral_5m_input_tokens", 0)
                    entry["cache_1h"] += cache_detail.get("ephemeral_1h_input_tokens", 0)
                else:
                    # Fallback: no tier breakdown, assume 1hr (Claude Code default)
                    entry["cache_1h"] += usage.get("cache_creation_input_tokens", 0)
                msg_count += 1

                # Detect Task tool calls
                content = msg.get("content", [])
                if isinstance(content, list):
                    for block in content:
                        if (isinstance(block, dict)
                                and block.get("type") == "tool_use"
                                and block.get("name") == "Task"):
                            inp = block.get("input", {})
                            task_calls.append({
                                "subagent_type": inp.get("subagent_type", "?"),
                                "description": inp.get("description", "?"),
                                "model": inp.get("model", "inherited"),
                            })

    return {
        "tokens_by_model": tokens_by_model,
        "first_ts": first_ts,
        "last_ts": last_ts,
        "msg_count": msg_count,
        "first_user_msg": first_user_msg,
        "task_calls": task_calls,
        "detected_workflow": detected_workflow,
        "detected_story": detected_story,
        "pruned_msgs": pruned_msgs,
    }


def calculate_cost(tokens_by_model: dict) -> float:
    """Calculate total estimated cost from token usage grouped by model."""
    total = 0.0
    for model, tokens in tokens_by_model.items():
        pricing = MODEL_PRICING.get(model, DEFAULT_PRICING)
        total += tokens["input"] * pricing["input"] / 1_000_000
        total += tokens["output"] * pricing["output"] / 1_000_000
        total += tokens["cache_5m"] * pricing["cache_5m"] / 1_000_000
        total += tokens["cache_1h"] * pricing["cache_1h"] / 1_000_000
        total += tokens["cache_read"] * pricing["cache_read"] / 1_000_000
    return total


def merge_tokens(base: dict, addition: dict) -> dict:
    """Merge two tokens_by_model dicts."""
    merged = {}
    for model in set(list(base.keys()) + list(addition.keys())):
        merged[model] = {}
        for key in ("input", "output", "cache_5m", "cache_1h", "cache_read", "messages"):
            merged[model][key] = base.get(model, {}).get(key, 0) + addition.get(model, {}).get(key, 0)
    return merged


def find_latest_session(project_dir: Path) -> str:
    """Find the most recently modified JSONL file (the active session)."""
    jsonl_files = list(project_dir.glob("*.jsonl"))
    if not jsonl_files:
        print("ERROR: No session JSONL files found", file=sys.stderr)
        sys.exit(1)
    latest = max(jsonl_files, key=lambda f: f.stat().st_mtime)
    return latest.stem


def model_short_name(model: str) -> str:
    if "opus" in model:
        return "opus"
    if "sonnet" in model:
        return "sonnet"
    if "haiku" in model:
        return "haiku"
    return model[:20]


def analyze_session(session_id: str, project_dir: Path) -> dict:
    """Analyze a full session including subagents."""
    parent_file = project_dir / f"{session_id}.jsonl"
    if not parent_file.exists():
        print(f"ERROR: Session file not found: {parent_file}", file=sys.stderr)
        sys.exit(1)

    parent = parse_jsonl(parent_file)
    all_tokens = dict(parent["tokens_by_model"])
    parent_cost = calculate_cost(parent["tokens_by_model"])

    # Parse subagent sessions
    subagents_dir = project_dir / session_id / "subagents"
    subagent_results = []
    if subagents_dir.exists():
        for sa_file in sorted(subagents_dir.glob("agent-*.jsonl")):
            # Skip compact agents (auto-compaction, negligible cost)
            if "compact" in sa_file.name:
                continue
            sa = parse_jsonl(sa_file)
            sa_cost = calculate_cost(sa["tokens_by_model"])
            subagent_results.append({
                "file": sa_file.name,
                "first_msg": sa["first_user_msg"],
                "tokens_by_model": sa["tokens_by_model"],
                "cost": sa_cost,
                "msg_count": sa["msg_count"],
            })
            all_tokens = merge_tokens(all_tokens, sa["tokens_by_model"])

    total_cost = calculate_cost(all_tokens)

    # Calculate duration
    duration_str = "?"
    if parent["first_ts"] and parent["last_ts"]:
        try:
            t1 = datetime.fromisoformat(parent["first_ts"].replace("Z", "+00:00"))
            t2 = datetime.fromisoformat(parent["last_ts"].replace("Z", "+00:00"))
            mins = (t2 - t1).total_seconds() / 60
            duration_str = f"{mins:.0f}min"
        except (ValueError, TypeError):
            pass

    return {
        "session_id": session_id,
        "parent": parent,
        "parent_cost": parent_cost,
        "subagents": subagent_results,
        "all_tokens": all_tokens,
        "total_cost": total_cost,
        "duration": duration_str,
        "total_pruned_msgs": parent["pruned_msgs"],
    }
