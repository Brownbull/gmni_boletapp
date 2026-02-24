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

Source modules (split from monolithic for maintainability):
    scripts/workflow_cost_core.py    — pricing, paths, JSONL parsing, session analysis
    scripts/workflow_cost_reports.py — all output, CSV, and statistics functions

Installed binary: ~/.local/bin/workflow-cost (self-contained monolithic copy)
To sync after editing modules: cp scripts/workflow-cost.py ~/.local/bin/workflow-cost
  and manually apply the same changes to the installed binary.
"""

import argparse
import sys
from pathlib import Path

# When run directly from scripts/, add scripts/ to the path for submodule imports
_SCRIPTS_DIR = Path(__file__).parent
if str(_SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_DIR))

from workflow_cost_core import (
    resolve_project_dir,
    resolve_csv_path,
    find_latest_session,
    analyze_session,
)
from workflow_cost_reports import (
    print_report,
    append_csv,
    print_csv_report,
    scan_all_sessions,
    resolve_stats_path,
    generate_stats,
    write_stats,
    print_cost_notice,
    print_stats_summary,
)


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

INCOMPLETE DATA WARNING
  If cozempic's PreCompact hook ran during the session, some messages will have
  had their usage data stripped from the JSONL file. When this happens, the cost
  shown is a LOWER BOUND — actual cost may be significantly higher.
  The report prints a warning: "INCOMPLETE DATA: N msgs pruned (cozempic)"

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
            print_cost_notice(
                result["total_cost"], stats,
                workflow=wf_name,
                pruned_msgs=result.get("total_pruned_msgs", 0),
            )
        else:
            print_cost_notice(
                result["total_cost"], {},
                workflow=wf_name,
                pruned_msgs=result.get("total_pruned_msgs", 0),
            )


if __name__ == "__main__":
    main()
