#!/usr/bin/env python3
"""
Workflow Cost Analyzer — parses Claude Code session JSONL files to calculate
token consumption and estimated cost for any Claude Code project.

Auto-detects the current project from git root or cwd.

Usage:
    workflow-cost                                    # analyze current/latest session
    workflow-cost --session <id>                     # analyze specific session
    workflow-cost --csv --workflow dev --story X      # append to tracking CSV
    workflow-cost --report                           # summarize tracking CSV
    workflow-cost --project /path/to/project         # explicit project path

Session data lives at:
    ~/.claude/projects/{encoded-path}/{sessionId}.jsonl          (parent)
    ~/.claude/projects/{encoded-path}/{sessionId}/subagents/     (child agents)
"""

import argparse
import csv
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
    # Reverse the encoding: -home-user-project -> /home/user/project
    encoded_name = project_dir.name  # e.g. -home-khujta-projects-bmad-boletapp
    # The first char is always '-' (from the leading '/')
    project_root = Path(encoded_name.replace("-", "/", 1))
    # But this naive reversal breaks on multi-segment paths — use heuristic
    # Try progressively building the path until we find a real directory
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
                usage = msg.get("usage", {})
                model = msg.get("model", "unknown")

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
    }


def print_report(result: dict, project_name: str = "") -> None:
    """Print a human-readable cost report."""
    print()
    print("=" * 65)
    print("  WORKFLOW COST REPORT")
    if project_name:
        print(f"  Project: {project_name}")
    print("=" * 65)
    print()

    p = result["parent"]
    print(f"  Session:   {result['session_id'][:20]}...")
    print(f"  Duration:  {result['duration']}")
    print(f"  Messages:  {p['msg_count']} (parent) + {sum(s['msg_count'] for s in result['subagents'])} (subagents)")
    print()

    # Parent breakdown
    print(f"  PARENT CONVERSATION")
    for model, tokens in p["tokens_by_model"].items():
        name = model_short_name(model)
        cache_write = tokens["cache_5m"] + tokens["cache_1h"]
        print(f"    [{name}] {tokens['messages']} msgs | "
              f"in:{tokens['input']:,} out:{tokens['output']:,} "
              f"cache_w:{cache_write:,} cache_r:{tokens['cache_read']:,}")
    print(f"    Subtotal: ${result['parent_cost']:.2f}")
    print()

    # Subagent breakdown
    if result["subagents"]:
        print(f"  SUBAGENTS ({len(result['subagents'])})")
        for sa in result["subagents"]:
            models_used = ", ".join(model_short_name(m) for m in sa["tokens_by_model"])
            label = (sa["first_msg"] or "?")[:60]
            print(f"    {sa['file'][:30]}  [{models_used}]  ${sa['cost']:.2f}")
            print(f"      {label}")
        sa_total = sum(s["cost"] for s in result["subagents"])
        print(f"    Subtotal: ${sa_total:.2f}")
        print()

    # Totals
    print("-" * 65)

    # Token totals across all models
    total_in = sum(t["input"] for t in result["all_tokens"].values())
    total_out = sum(t["output"] for t in result["all_tokens"].values())
    total_c5m = sum(t["cache_5m"] for t in result["all_tokens"].values())
    total_c1h = sum(t["cache_1h"] for t in result["all_tokens"].values())
    total_cr = sum(t["cache_read"] for t in result["all_tokens"].values())
    total_cw = total_c5m + total_c1h
    total_all = total_in + total_out + total_cw + total_cr

    print(f"  Total tokens:  {total_all:>12,}")
    print(f"    Input:       {total_in:>12,}")
    print(f"    Output:      {total_out:>12,}")
    print(f"    Cache write: {total_cw:>12,}", end="")
    if total_c5m > 0:
        print(f"  (5m:{total_c5m:,} 1h:{total_c1h:,})")
    else:
        print(f"  (1h)")
    print(f"    Cache read:  {total_cr:>12,}")
    print()
    print(f"  ESTIMATED COST: ${result['total_cost']:.2f}")
    print("=" * 65)
    print()


CSV_HEADER = [
    "date", "session_id", "workflow", "story", "duration",
    "parent_msgs", "subagent_count", "subagent_msgs", "models",
    "total_input", "total_output", "total_cache_write", "total_cache_read",
    "parent_cost", "subagent_cost", "total_cost",
]


def _build_csv_row(result: dict, workflow: str = "", story: str = "") -> list:
    """Build a unified CSV row from a session result.

    Uses auto-detected workflow/story from JSONL as fallback when not explicitly provided.
    """
    p = result["parent"]
    sa_msgs = sum(s["msg_count"] for s in result["subagents"])
    sa_cost = sum(s["cost"] for s in result["subagents"])
    models = ", ".join(sorted(set(model_short_name(m) for m in result["all_tokens"])))
    total_in = sum(t["input"] for t in result["all_tokens"].values())
    total_out = sum(t["output"] for t in result["all_tokens"].values())
    total_cw = sum(t["cache_5m"] + t["cache_1h"] for t in result["all_tokens"].values())
    total_cr = sum(t["cache_read"] for t in result["all_tokens"].values())

    # Use detected workflow/story as fallback
    wf = workflow or p.get("detected_workflow", "")
    st = story or p.get("detected_story", "")

    date_str = ""
    if p["first_ts"]:
        try:
            dt = datetime.fromisoformat(p["first_ts"].replace("Z", "+00:00"))
            date_str = dt.strftime("%Y-%m-%d %H:%M")
        except (ValueError, TypeError):
            pass

    return [
        date_str, result["session_id"][:12], wf, st,
        result["duration"], p["msg_count"], len(result["subagents"]),
        sa_msgs, models, total_in, total_out, total_cw, total_cr,
        f"{result['parent_cost']:.2f}", f"{sa_cost:.2f}",
        f"{result['total_cost']:.2f}",
    ]


def append_csv(result: dict, csv_path: Path, workflow: str = "", story: str = "") -> None:
    """Append session cost data to the tracking CSV."""
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    is_new = not csv_path.exists()

    with open(csv_path, "a", newline="") as f:
        writer = csv.writer(f)
        if is_new:
            writer.writerow(CSV_HEADER)
        writer.writerow(_build_csv_row(result, workflow, story))

    print(f"  Appended to {csv_path}")


def print_csv_report(csv_path: Path) -> None:
    """Print summary of the tracking CSV."""
    if not csv_path.exists():
        print("No tracking data yet. Run workflows with --csv to start tracking.")
        return

    rows = []
    with open(csv_path) as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    if not rows:
        print("CSV exists but has no data rows.")
        return

    print()
    print("=" * 70)
    print("  WORKFLOW COST TRACKING SUMMARY")
    print(f"  Source: {csv_path}")
    print("=" * 70)
    print()
    print(f"  Total sessions tracked: {len(rows)}")

    total_cost = sum(float(r.get("total_cost", 0)) for r in rows)
    print(f"  Total cost: ${total_cost:.2f}")
    print()

    # Group by workflow
    by_workflow = {}
    for r in rows:
        wf = r.get("workflow", "unknown")
        if wf not in by_workflow:
            by_workflow[wf] = {"count": 0, "cost": 0.0, "durations": []}
        by_workflow[wf]["count"] += 1
        by_workflow[wf]["cost"] += float(r.get("total_cost", 0))
        dur = r.get("duration", "")
        if dur.endswith("min"):
            try:
                by_workflow[wf]["durations"].append(float(dur[:-3]))
            except ValueError:
                pass

    print(f"  {'Workflow':<25} {'Count':>6} {'Total':>10} {'Avg':>10} {'Avg Time':>10}")
    print(f"  {'-'*25} {'-'*6} {'-'*10} {'-'*10} {'-'*10}")
    for wf, data in sorted(by_workflow.items()):
        avg_cost = data["cost"] / data["count"] if data["count"] else 0
        avg_dur = f"{sum(data['durations'])/len(data['durations']):.0f}min" if data["durations"] else "?"
        print(f"  {wf:<25} {data['count']:>6} ${data['cost']:>8.2f} ${avg_cost:>8.2f} {avg_dur:>10}")

    print()

    # Recent sessions
    print("  Recent sessions:")
    for r in rows[-10:]:
        print(f"    {r.get('date', '?'):<18} {r.get('workflow', '?'):<20} "
              f"{r.get('story', '?'):<15} ${float(r.get('total_cost', 0)):>8.2f}  {r.get('duration', '?')}")

    print()
    print("=" * 70)
    print()


def scan_all_sessions(project_dir: Path, project_name: str = "", limit: int = 0,
                      csv_path: Path | None = None) -> None:
    """Scan all sessions for a project and print a cost summary."""
    jsonl_files = sorted(project_dir.glob("*.jsonl"), key=lambda f: f.stat().st_mtime)
    if not jsonl_files:
        print("No session files found.", file=sys.stderr)
        sys.exit(1)

    results = []
    errors = 0
    for jf in jsonl_files:
        try:
            result = analyze_session(jf.stem, project_dir)
            results.append(result)
        except (SystemExit, Exception):
            errors += 1

    # Sort by session start time
    results.sort(key=lambda r: r["parent"].get("first_ts") or "")

    if limit > 0:
        results = results[-limit:]

    print()
    print("=" * 90)
    print("  ALL SESSIONS COST REPORT")
    if project_name:
        print(f"  Project: {project_name}")
    print(f"  Sessions: {len(results)} analyzed" + (f", {errors} unreadable" if errors else ""))
    print("=" * 90)
    print()

    total_cost = 0.0
    total_msgs = 0
    total_sa_msgs = 0
    by_model = {}

    print(f"  {'Date':<18} {'Dur':>5} {'Msgs':>5} {'SAs':>4} {'Model':<8} {'Cost':>9}")
    print(f"  {'-'*18} {'-'*5} {'-'*5} {'-'*4} {'-'*8} {'-'*9}")

    for r in results:
        p = r["parent"]
        date_str = ""
        if p["first_ts"]:
            try:
                dt = datetime.fromisoformat(p["first_ts"].replace("Z", "+00:00"))
                date_str = dt.strftime("%Y-%m-%d %H:%M")
            except (ValueError, TypeError):
                pass

        sa_count = len(r["subagents"])
        sa_msgs = sum(s["msg_count"] for s in r["subagents"])
        models = ", ".join(sorted(set(model_short_name(m) for m in r["all_tokens"])))

        print(f"  {date_str:<18} {r['duration']:>5} {p['msg_count']:>5} {sa_count:>4} {models:<8} ${r['total_cost']:>7.2f}")

        total_cost += r["total_cost"]
        total_msgs += p["msg_count"]
        total_sa_msgs += sa_msgs

        for model, tokens in r["all_tokens"].items():
            short = model_short_name(model)
            if short not in by_model:
                by_model[short] = {"cost": 0.0, "sessions": 0, "msgs": 0}
            by_model[short]["cost"] += calculate_cost({model: tokens})
            by_model[short]["sessions"] += 1
            by_model[short]["msgs"] += tokens["messages"]

    print()
    print("-" * 90)
    print()

    # Model breakdown
    print(f"  {'Model':<10} {'Sessions':>8} {'Messages':>10} {'Cost':>12} {'Avg/Session':>12}")
    print(f"  {'-'*10} {'-'*8} {'-'*10} {'-'*12} {'-'*12}")
    for model, data in sorted(by_model.items(), key=lambda x: -x[1]["cost"]):
        avg = data["cost"] / data["sessions"] if data["sessions"] else 0
        print(f"  {model:<10} {data['sessions']:>8} {data['msgs']:>10,} ${data['cost']:>10.2f} ${avg:>10.2f}")

    print()
    print(f"  TOTAL: {len(results)} sessions | {total_msgs:,} parent msgs | {total_sa_msgs:,} subagent msgs")
    print(f"  TOTAL ESTIMATED COST: ${total_cost:.2f}")
    print("=" * 90)
    print()

    # Export to CSV if requested
    if csv_path:
        csv_path.parent.mkdir(parents=True, exist_ok=True)
        with open(csv_path, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(CSV_HEADER)
            for r in results:
                writer.writerow(_build_csv_row(r))

        print(f"  Exported to {csv_path}")
        print()


def resolve_stats_path(csv_path: Path) -> Path:
    """Derive stats JSON path from the CSV path."""
    return csv_path.with_name("workflow-cost-stats.json")


def generate_stats(csv_path: Path) -> dict:
    """Read the tracking CSV and compute cost statistics.

    Returns a dict with averages, percentiles, outlier thresholds, and recent outliers.
    Filters out zero-cost sessions (empty/aborted).
    """
    if not csv_path.exists():
        return {}

    rows = []
    with open(csv_path) as f:
        reader = csv.DictReader(f)
        for r in reader:
            cost = float(r.get("total_cost", 0))
            if cost > 0:
                rows.append(r)

    if not rows:
        return {}

    costs = [float(r["total_cost"]) for r in rows]
    costs_sorted = sorted(costs)
    n = len(costs_sorted)

    def percentile(data, p):
        k = (p / 100) * (len(data) - 1)
        f = int(k)
        c = f + 1 if f + 1 < len(data) else f
        return data[f] + (k - f) * (data[c] - data[f])

    # Rolling averages
    last_10 = costs[-10:] if n >= 10 else costs
    last_20 = costs[-20:] if n >= 20 else costs
    avg_overall = sum(costs) / n
    avg_last_10 = sum(last_10) / len(last_10)
    avg_last_20 = sum(last_20) / len(last_20)

    # Percentiles
    p50 = percentile(costs_sorted, 50)
    p75 = percentile(costs_sorted, 75)
    p90 = percentile(costs_sorted, 90)
    p95 = percentile(costs_sorted, 95)

    # Outlier thresholds: warning at p75, high at p90
    warning_threshold = max(p75, avg_last_20 * 1.5)
    high_threshold = max(p90, avg_last_20 * 2.0)

    # Find recent outliers (last 20 sessions above warning)
    recent_outliers = []
    recent = rows[-20:]
    for r in recent:
        cost = float(r["total_cost"])
        if cost >= warning_threshold:
            ratio = cost / avg_last_20 if avg_last_20 > 0 else 0
            recent_outliers.append({
                "date": r.get("date", "?"),
                "session_id": r.get("session_id", "?"),
                "cost": cost,
                "ratio": round(ratio, 1),
            })

    # Trend: last 10 vs previous 10
    trend = None
    if n >= 20:
        prev_10 = costs[-20:-10]
        avg_prev_10 = sum(prev_10) / len(prev_10)
        if avg_prev_10 > 0:
            trend_pct = ((avg_last_10 - avg_prev_10) / avg_prev_10) * 100
            trend = round(trend_pct, 1)

    # By-model breakdown
    by_model = {}
    for r in rows:
        models = r.get("models", "unknown")
        cost = float(r["total_cost"])
        if models not in by_model:
            by_model[models] = {"count": 0, "total_cost": 0.0}
        by_model[models]["count"] += 1
        by_model[models]["total_cost"] += cost

    # Per-workflow breakdown (for tracked workflows)
    by_workflow = {}
    for r in rows:
        wf = r.get("workflow", "").strip()
        if not wf:
            continue
        cost = float(r["total_cost"])
        if wf not in by_workflow:
            by_workflow[wf] = {"costs": []}
        by_workflow[wf]["costs"].append(cost)

    # Compute per-workflow stats
    workflow_stats = {}
    for wf, data in by_workflow.items():
        wf_costs = data["costs"]
        wf_sorted = sorted(wf_costs)
        wf_n = len(wf_sorted)
        if wf_n == 0:
            continue
        wf_last_10 = wf_costs[-10:] if wf_n >= 10 else wf_costs
        workflow_stats[wf] = {
            "count": wf_n,
            "total_cost": round(sum(wf_costs), 2),
            "avg": round(sum(wf_costs) / wf_n, 2),
            "avg_last_10": round(sum(wf_last_10) / len(wf_last_10), 2),
            "p50": round(percentile(wf_sorted, 50), 2),
            "p75": round(percentile(wf_sorted, 75), 2),
            "p90": round(percentile(wf_sorted, 90), 2),
        }

    return {
        "generated": datetime.now().isoformat(),
        "csv_path": str(csv_path),
        "total_sessions": n,
        "total_cost": round(sum(costs), 2),
        "averages": {
            "overall": round(avg_overall, 2),
            "last_10": round(avg_last_10, 2),
            "last_20": round(avg_last_20, 2),
        },
        "percentiles": {
            "p50": round(p50, 2),
            "p75": round(p75, 2),
            "p90": round(p90, 2),
            "p95": round(p95, 2),
        },
        "thresholds": {
            "warning": round(warning_threshold, 2),
            "high": round(high_threshold, 2),
        },
        "trend_last10_vs_prev10_pct": trend,
        "recent_outliers": recent_outliers,
        "by_model": by_model,
        "by_workflow": workflow_stats,
    }


def write_stats(stats: dict, stats_path: Path) -> None:
    """Write stats to JSON file."""
    stats_path.parent.mkdir(parents=True, exist_ok=True)
    with open(stats_path, "w") as f:
        json.dump(stats, f, indent=2)
    print(f"  Stats written to {stats_path}")


def print_cost_notice(session_cost: float, stats: dict, workflow: str = "") -> None:
    """Print a compact cost notification for end-of-workflow display.

    When workflow is specified, shows both overall and workflow-specific comparison.
    """
    if not stats:
        print()
        print(f"  Session Cost: ${session_cost:.2f}")
        print(f"  (No historical data for comparison)")
        print()
        return

    avg_10 = stats["averages"]["last_10"]
    avg_overall = stats["averages"]["overall"]
    warning = stats["thresholds"]["warning"]
    high = stats["thresholds"]["high"]
    trend = stats.get("trend_last10_vs_prev10_pct")

    # Per-workflow stats
    wf_stats = stats.get("by_workflow", {}).get(workflow) if workflow else None

    # Determine status (against overall thresholds)
    if session_cost >= high:
        status = "HIGH"
        icon = "!!"
    elif session_cost >= warning:
        status = "WARN"
        icon = "! "
    else:
        status = "OK"
        icon = "  "

    ratio = session_cost / avg_10 if avg_10 > 0 else 0

    print()
    print("+" + "-" * 55 + "+")
    title = f"|  COST NOTICE"
    if workflow:
        title += f"  [{workflow}]"
    print(f"{title:<56}|")
    print("+" + "-" * 55 + "+")

    if status in ("HIGH", "WARN"):
        line = f"|  {icon} Session Cost: ${session_cost:>8.2f}  ({ratio:.1f}x avg)"
        print(f"{line:<56}|")
    else:
        line = f"|     Session Cost: ${session_cost:>8.2f}"
        print(f"{line:<56}|")

    # Overall comparison
    avg_str = f"|     All sessions avg (10): ${avg_10:>8.2f}"
    print(f"{avg_str:<56}|")

    overall_str = f"|     All sessions avg:      ${avg_overall:>8.2f}  ({stats['total_sessions']} total)"
    print(f"{overall_str:<56}|")

    # Workflow-specific comparison
    if wf_stats:
        sep = f"|  {'─' * 52}"
        print(f"{sep:<56}|")
        wf_avg = f"|     {workflow} avg (10): ${wf_stats['avg_last_10']:>8.2f}"
        print(f"{wf_avg:<56}|")
        wf_all = f"|     {workflow} avg:      ${wf_stats['avg']:>8.2f}  ({wf_stats['count']} runs)"
        print(f"{wf_all:<56}|")
        wf_p90 = f"|     {workflow} P90:      ${wf_stats['p90']:>8.2f}"
        print(f"{wf_p90:<56}|")
        # Workflow-specific status
        if session_cost > wf_stats["p90"]:
            wf_warn = f"|     !! Above P90 for this workflow"
            print(f"{wf_warn:<56}|")

    if trend is not None:
        direction = "+" if trend > 0 else ""
        trend_str = f"|     Cost trend (10 vs prev 10): {direction}{trend:.1f}%"
        print(f"{trend_str:<56}|")

    if status != "OK" and not wf_stats:
        p90_str = f"|     P90 threshold: ${stats['percentiles']['p90']:>8.2f}"
        print(f"{p90_str:<56}|")

    print("+" + "-" * 55 + "+")
    print()


def print_stats_summary(stats: dict) -> None:
    """Print full stats summary (for --stats without --csv)."""
    if not stats:
        print("No stats available. Run with --csv first to build tracking data.")
        return

    print()
    print("=" * 65)
    print("  WORKFLOW COST STATISTICS")
    print("=" * 65)
    print()

    print(f"  Sessions analyzed: {stats['total_sessions']}")
    print(f"  Total cost: ${stats['total_cost']:.2f}")
    print()

    print("  Averages:")
    print(f"    Overall:       ${stats['averages']['overall']:>8.2f}")
    print(f"    Last 10:       ${stats['averages']['last_10']:>8.2f}")
    print(f"    Last 20:       ${stats['averages']['last_20']:>8.2f}")
    print()

    print("  Percentiles:")
    print(f"    P50 (median):  ${stats['percentiles']['p50']:>8.2f}")
    print(f"    P75:           ${stats['percentiles']['p75']:>8.2f}")
    print(f"    P90:           ${stats['percentiles']['p90']:>8.2f}")
    print(f"    P95:           ${stats['percentiles']['p95']:>8.2f}")
    print()

    print("  Outlier Thresholds:")
    print(f"    Warning (>):   ${stats['thresholds']['warning']:>8.2f}")
    print(f"    High (>):      ${stats['thresholds']['high']:>8.2f}")
    print()

    trend = stats.get("trend_last10_vs_prev10_pct")
    if trend is not None:
        direction = "+" if trend > 0 else ""
        print(f"  Cost Trend (last 10 vs prev 10): {direction}{trend:.1f}%")
        print()

    outliers = stats.get("recent_outliers", [])
    if outliers:
        print(f"  Recent Outliers ({len(outliers)}):")
        for o in outliers:
            print(f"    {o['date']:<18}  ${o['cost']:>8.2f}  ({o['ratio']}x avg)  [{o['session_id']}]")
        print()

    # Per-workflow breakdown
    wf_stats = stats.get("by_workflow", {})
    if wf_stats:
        print("  Per-Workflow Breakdown:")
        print(f"    {'Workflow':<25} {'Runs':>5} {'Avg':>8} {'Avg(10)':>8} {'P50':>8} {'P75':>8} {'P90':>8}")
        print(f"    {'-'*25} {'-'*5} {'-'*8} {'-'*8} {'-'*8} {'-'*8} {'-'*8}")
        for wf, ws in sorted(wf_stats.items(), key=lambda x: -x[1]["count"]):
            print(f"    {wf:<25} {ws['count']:>5} ${ws['avg']:>6.2f} ${ws['avg_last_10']:>6.2f} "
                  f"${ws['p50']:>6.2f} ${ws['p75']:>6.2f} ${ws['p90']:>6.2f}")
        print()

    print("=" * 65)
    print()


def main():
    parser = argparse.ArgumentParser(
        prog="workflow-cost",
        description="Analyze Claude Code session token consumption and estimated cost.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
MODES
  Default (no flags)     Analyze the latest session for the current project.
  --session <id>         Analyze a specific session by ID.
  --scan-all             Scan ALL sessions and show full cost history table.
  --scan-all --csv       Regenerate the tracking CSV from all sessions.
  --scan-all --csv --stats  Regenerate CSV + compute stats + print summary.
  --csv                  Append the current session to tracking CSV.
  --csv --stats          Append to CSV + compute stats + print cost notice.
  --stats                Recompute stats from existing CSV (no session analysis).
  --report               Print a cumulative summary of the tracking CSV.

EXAMPLES
  workflow-cost                              Analyze latest session, current project
  workflow-cost --session abc123             Analyze a specific session
  workflow-cost --scan-all                   Full cost history for all sessions
  workflow-cost --scan-all --last 20         Last 20 sessions only
  workflow-cost --scan-all --csv             Regenerate full tracking CSV
  workflow-cost --scan-all --csv --stats     Regenerate CSV + stats JSON + summary
  workflow-cost --csv --workflow "ecc-dev-story" --story "15-TD-22"
                                             Append session to CSV with metadata
  workflow-cost --csv --stats --workflow "ecc-code-review" --story "15-TD-22"
                                             Append + stats + cost notice
  workflow-cost --stats                      Regenerate stats from existing CSV
  workflow-cost --report                     Cumulative CSV summary
  workflow-cost --project /path/to/other     Analyze a different project

COST TRACKING
  CSV file:   docs/sprint-artifacts/workflow-costs.csv   (per-project)
  Stats file: docs/sprint-artifacts/workflow-cost-stats.json

  Stats include: rolling averages (last 10/20), percentiles (P50/P75/P90/P95),
  per-workflow breakdown (ecc-dev-story, ecc-code-review, etc.), outlier
  thresholds, and cost trend direction.

  Cost notice compares the session cost against both overall and workflow-specific
  averages and flags if it exceeds P90 thresholds.

WORKFLOW DETECTION
  ECC workflows (ecc-dev-story, ecc-code-review, etc.) are auto-detected from
  session content. When using --csv, detected workflow/story are used as defaults
  if --workflow/--story are not provided explicitly.

PRICING
  Uses official Anthropic pricing (Feb 2026):
    Opus 4.6   — $5/$25 per 1M tokens (input/output)
    Sonnet 4.5 — $3/$15 per 1M tokens
    Haiku 4.5  — $1/$5 per 1M tokens
  Cache: 1-hour write = 2x input, read = 0.1x input

SETUP
  Works in any Claude Code project. Auto-detects project from git root or cwd.
  Install: copy to ~/.local/bin/workflow-cost (or anywhere on PATH)
  Slash command: /workflow-cost (requires .claude/commands/workflow-cost.md)
""",
    )
    parser.add_argument("--session", metavar="ID",
                        help="Session ID to analyze (default: latest)")
    parser.add_argument("--project", metavar="PATH",
                        help="Explicit project path (default: git root or cwd)")
    parser.add_argument("--csv", action="store_true",
                        help="Append results to tracking CSV (or regenerate with --scan-all)")
    parser.add_argument("--report", action="store_true",
                        help="Print cumulative summary of tracking CSV")
    parser.add_argument("--scan-all", action="store_true",
                        help="Scan ALL sessions and show full cost history table")
    parser.add_argument("--last", type=int, default=0, metavar="N",
                        help="With --scan-all, limit to last N sessions")
    parser.add_argument("--workflow", default="", metavar="NAME",
                        help="Workflow name for CSV tracking (auto-detected if omitted)")
    parser.add_argument("--story", default="", metavar="ID",
                        help="Story ID for CSV tracking (auto-detected if omitted)")
    parser.add_argument("--stats", action="store_true",
                        help="Compute stats from CSV and print cost notice/summary")
    args = parser.parse_args()

    project_dir = resolve_project_dir(args.project)
    csv_path = resolve_csv_path(project_dir)
    stats_path = resolve_stats_path(csv_path)
    project_name = project_dir.name

    if args.scan_all:
        export_csv = csv_path if args.csv else None
        scan_all_sessions(project_dir, project_name, limit=args.last, csv_path=export_csv)
        if args.stats and csv_path.exists():
            stats = generate_stats(csv_path)
            if stats:
                write_stats(stats, stats_path)
                print_stats_summary(stats)
        return

    if args.report:
        print_csv_report(csv_path)
        return

    # Stats-only mode (no session analysis)
    if args.stats and not args.csv and not args.session:
        stats = generate_stats(csv_path)
        if stats:
            write_stats(stats, stats_path)
            print_stats_summary(stats)
        else:
            print("No tracking data yet. Run with --csv first to build tracking data.")
        return

    session_id = args.session or find_latest_session(project_dir)
    result = analyze_session(session_id, project_dir)
    print_report(result, project_name)

    if args.csv:
        append_csv(result, csv_path, workflow=args.workflow, story=args.story)

    if args.stats:
        # Determine workflow name: explicit > detected from session
        wf_name = args.workflow or result["parent"].get("detected_workflow", "")
        stats = generate_stats(csv_path)
        if stats:
            write_stats(stats, stats_path)
            print_cost_notice(result["total_cost"], stats, workflow=wf_name)
        else:
            print_cost_notice(result["total_cost"], {}, workflow=wf_name)


if __name__ == "__main__":
    main()
