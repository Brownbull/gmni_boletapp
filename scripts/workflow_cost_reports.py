"""
Output, CSV, and statistics functions for workflow-cost.

Depends on workflow_cost_core for token analysis primitives.
"""

import csv
import json
import sys
from datetime import datetime
from pathlib import Path

from workflow_cost_core import calculate_cost, model_short_name, merge_tokens, parse_jsonl


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

    # Warn when cozempic PreCompact stripped usage data from pre-compaction messages.
    # The cost shown only reflects the post-compaction portion of the session.
    pruned = result.get("total_pruned_msgs", 0)
    if pruned > 0:
        total_asst = p["msg_count"]
        pct = pruned * 100 // total_asst if total_asst > 0 else 0
        print()
        print(f"  *** INCOMPLETE DATA: {pruned} of {total_asst} parent messages missing usage")
        print(f"      (~{pct}% pruned by cozempic PreCompact — cost is a LOWER BOUND)")

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
    cost_label = "ESTIMATED COST (LOWER BOUND)" if pruned > 0 else "ESTIMATED COST"
    print(f"  {cost_label}: ${result['total_cost']:.2f}")
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
    from workflow_cost_core import analyze_session

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
        pruned_flag = " !" if r.get("total_pruned_msgs", 0) > 0 else "  "

        print(f"  {date_str:<18} {r['duration']:>5} {p['msg_count']:>5} {sa_count:>4} "
              f"{models:<8} ${r['total_cost']:>7.2f}{pruned_flag}")

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
    print(f"  (! = session has pruned usage data — cost is lower bound)")
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


def print_cost_notice(session_cost: float, stats: dict, workflow: str = "",
                      pruned_msgs: int = 0) -> None:
    """Print a compact cost notification for end-of-workflow display.

    When workflow is specified, shows both overall and workflow-specific comparison.
    When pruned_msgs > 0, flags the cost as a lower bound.
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

    if pruned_msgs > 0:
        warn_line = f"|  !! LOWER BOUND — {pruned_msgs} msgs pruned (cozempic)"
        print(f"{warn_line:<56}|")

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
