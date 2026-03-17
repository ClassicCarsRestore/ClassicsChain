#!/usr/bin/env python3
"""
Process k6 benchmark results into tables and charts
for the ClassicsChain thesis performance evaluation chapter.

Usage:
    python3 process_results.py --results-dir results/ --output-dir results/report_YYYYMMDD
"""

import argparse
import csv
import json
import sys
from datetime import datetime
from pathlib import Path

try:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.ticker as ticker
    import numpy as np
except ImportError:
    print("ERROR: matplotlib and numpy required. Install with:")
    print("  pip install matplotlib numpy")
    sys.exit(1)


# ── K6 Summary Parsing ─────────────────────────────────────────


def load_summaries(results_dir):
    """Load all k6 JSON summary files from results directory."""
    summaries = {}
    for f in sorted(Path(results_dir).glob("*_summary.json")):
        name = f.stem.replace("_summary", "")
        with open(f) as fh:
            summaries[name] = json.load(fh)
    return summaries


def _get_metric(summary, name):
    """Get a metric dict, handling both --summary-export (flat) and end-of-test JSON (nested under 'values')."""
    raw = summary.get("metrics", {}).get(name, {})
    return raw.get("values", raw)


def extract_http_metrics(summary):
    """Extract HTTP request duration metrics from k6 summary."""
    duration = _get_metric(summary, "http_req_duration")
    failed = _get_metric(summary, "http_req_failed")
    reqs = _get_metric(summary, "http_reqs")

    return {
        "p50": duration.get("p(50)", duration.get("med", 0)),
        "p90": duration.get("p(90)", 0),
        "p95": duration.get("p(95)", 0),
        "p99": duration.get("p(99)", 0),
        "avg": duration.get("avg", 0),
        "min": duration.get("min", 0),
        "max": duration.get("max", 0),
        "med": duration.get("med", 0),
        "error_rate": failed.get("rate", failed.get("value", 0)),
        "req_per_sec": reqs.get("rate", 0),
        "total_reqs": reqs.get("count", 0),
    }


# ── Table Generation ───────────────────────────────────────────


def generate_baseline_table(summaries, output_dir):
    """Table 1: Baseline latency per endpoint."""
    rows = []
    endpoint_map = {
        "baseline_read_vehicles": ("GET /vehicles", "session"),
        "baseline_write_vehicle": ("POST /certifiers/vehicles", "oauth2"),
        "baseline_write_event_anchored": ("POST /events (anchored)", "oauth2"),
    }

    for key, (endpoint, auth) in endpoint_map.items():
        matching = [s for name, s in summaries.items() if name.startswith(key)]
        if not matching:
            continue
        m = extract_http_metrics(matching[0])
        rows.append(
            [
                endpoint,
                auth,
                f"{m['p50']:.1f}",
                f"{m['p95']:.1f}",
                f"{m['p99']:.1f}",
                f"{m['avg']:.1f}",
                f"{m['error_rate']*100:.2f}%",
                f"{m['req_per_sec']:.1f}",
            ]
        )

    headers = ["Endpoint", "Auth", "p50", "p95", "p99", "Avg", "Error%", "Req/s"]
    write_csv(output_dir / "table_baseline_latency.csv", headers, rows)
    return rows, headers


# ── Chart Generation ───────────────────────────────────────────


def chart_latency_boxplot(summaries, output_dir):
    """Chart 1: Latency boxplot per endpoint category."""
    categories = {
        "Read\nVehicles": "baseline_read_vehicles",
        "Write\nVehicle": "baseline_write_vehicle",
        "Write\nAnchored": "baseline_write_event_anchored",
    }

    data = []
    labels = []
    for label, prefix in categories.items():
        matching = [s for n, s in summaries.items() if n.startswith(prefix)]
        if matching:
            m = extract_http_metrics(matching[0])
            data.append([m["min"], m["p50"], m["p50"], m["p95"], m["max"]])
            labels.append(label)

    if not data:
        return

    fig, ax = plt.subplots(figsize=(10, 6))

    for i, (d, label) in enumerate(zip(data, labels)):
        min_v, p50, med, p95, max_v = d
        box = ax.bxp(
            [{"med": med, "q1": min_v, "q3": p95, "whislo": min_v, "whishi": max_v, "fliers": []}],
            positions=[i + 1],
            widths=0.6,
            patch_artist=True,
        )
        color = "#4ECDC4" if "Read" in label else "#FF6B6B"
        if "Anchored" in label:
            color = "#FFE66D"
        box["boxes"][0].set_facecolor(color)

    ax.set_xticklabels(labels, fontsize=9)
    ax.set_ylabel("Latency (ms)")
    ax.set_title("Baseline Latency by Endpoint")
    ax.yaxis.set_major_formatter(ticker.FormatStrFormatter("%.0f"))
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    fig.savefig(output_dir / "chart_latency_boxplot.png", dpi=150)
    plt.close(fig)


def chart_throughput_vs_vus(summaries, output_dir):
    """Chart 2: Throughput from scaling tests."""
    fig, ax = plt.subplots(figsize=(8, 6))

    for label, prefix, color in [
        ("Mixed (ramp)", "scaling_mixed", "#45B7D1"),
        ("Spike", "scaling_spike", "#FF6B6B"),
    ]:
        matching = [s for n, s in summaries.items() if n.startswith(prefix)]
        if matching:
            m = extract_http_metrics(matching[0])
            ax.bar(label, m["req_per_sec"], color=color, alpha=0.8)

    ax.set_ylabel("Requests/second")
    ax.set_title("Throughput by Test Type (Scaling)")
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    fig.savefig(output_dir / "chart_throughput_scaling.png", dpi=150)
    plt.close(fig)


def chart_spike_recovery(results_dir, output_dir):
    """Chart 3: Spike test latency over time."""
    spike_files = sorted(Path(results_dir).glob("scaling_spike_*.json"))
    spike_files = [f for f in spike_files if "summary" not in f.name]
    if not spike_files:
        return

    timestamps = []
    latencies = []

    with open(spike_files[-1]) as fh:
        for line in fh:
            try:
                entry = json.loads(line.strip())
                if entry.get("type") == "Point" and entry.get("metric") == "http_req_duration":
                    ts = entry["data"]["time"]
                    val = entry["data"]["value"]
                    timestamps.append(ts)
                    latencies.append(val)
            except (json.JSONDecodeError, KeyError):
                continue

    if not timestamps:
        return

    start_time = None
    bucketed = {}
    for ts_str, lat in zip(timestamps, latencies):
        ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
        if start_time is None:
            start_time = ts
        elapsed = (ts - start_time).total_seconds()
        bucket = int(elapsed // 5) * 5
        if bucket not in bucketed:
            bucketed[bucket] = []
        bucketed[bucket].append(lat)

    if not bucketed:
        return

    times = sorted(bucketed.keys())
    p50s = [np.percentile(bucketed[t], 50) for t in times]
    p95s = [np.percentile(bucketed[t], 95) for t in times]

    fig, ax = plt.subplots(figsize=(12, 6))
    ax.plot(times, p50s, label="p50", color="#4ECDC4", linewidth=1.5)
    ax.plot(times, p95s, label="p95", color="#FF6B6B", linewidth=1.5)
    ax.fill_between(times, p50s, p95s, alpha=0.1, color="#FF6B6B")

    ax.axvspan(0, 30, alpha=0.05, color="red", label="Spike ramp")
    ax.axvspan(30, 150, alpha=0.05, color="orange", label="Peak hold")
    ax.axvspan(150, 180, alpha=0.05, color="green", label="Ramp down")

    ax.set_xlabel("Time (seconds)")
    ax.set_ylabel("Latency (ms)")
    ax.set_title("Spike Test: Latency Over Time")
    ax.legend()
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(output_dir / "chart_spike_recovery.png", dpi=150)
    plt.close(fig)


# ── Utilities ──────────────────────────────────────────────────


def write_csv(path, headers, rows):
    """Write CSV table."""
    with open(path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
    print(f"  Written: {path}")


def print_table(headers, rows, title=""):
    """Pretty-print a table to console."""
    if title:
        print(f"\n{'='*60}")
        print(f"  {title}")
        print(f"{'='*60}")

    if not rows:
        print("  (no data)")
        return

    col_widths = [max(len(str(h)), max(len(str(r)) for r in col)) for h, col in zip(headers, zip(*rows))]
    fmt = "  ".join(f"{{:<{w}}}" for w in col_widths)

    print(fmt.format(*headers))
    print("-" * sum(col_widths + [2 * (len(headers) - 1)]))
    for row in rows:
        print(fmt.format(*row))


# ── Main ───────────────────────────────────────────────────────


def main():
    parser = argparse.ArgumentParser(description="Process k6 benchmark results")
    parser.add_argument("--results-dir", default="results", help="Directory containing k6 result files")
    parser.add_argument("--output-dir", default=None, help="Output directory for tables and charts")
    args = parser.parse_args()

    results_dir = Path(args.results_dir)
    if not results_dir.exists():
        print(f"Results directory not found: {results_dir}")
        sys.exit(1)

    output_dir = Path(args.output_dir) if args.output_dir else results_dir / f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Loading summaries from: {results_dir}")
    summaries = load_summaries(results_dir)
    print(f"Found {len(summaries)} summary files")

    if not summaries:
        print("No summary files found. Run benchmark tests first.")
        sys.exit(1)

    # Generate tables
    print("\n--- Tables ---")
    rows, headers = generate_baseline_table(summaries, output_dir)
    print_table(headers, rows, "Baseline Latency")

    # Generate charts
    print("\n--- Charts ---")
    chart_latency_boxplot(summaries, output_dir)
    print("  Generated: chart_latency_boxplot.png")

    chart_throughput_vs_vus(summaries, output_dir)
    print("  Generated: chart_throughput_scaling.png")

    chart_spike_recovery(results_dir, output_dir)
    print("  Generated: chart_spike_recovery.png")

    print(f"\nReport generated in: {output_dir}")


if __name__ == "__main__":
    main()
