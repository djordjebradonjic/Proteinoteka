#!/usr/bin/env python3
"""
Proteinoteka production health check.

Deterministic, READ-ONLY checks against the live site, the admin API, and the
production database. Does not decide severity or write a human report — it
just gathers facts as one JSON blob (printed to stdout and appended to
history/<timestamp>.json so trends across runs are visible). The `/proveri-sajt`
Claude Code skill reads that JSON and writes the actual Serbian-language report.

Usage:
    cp .env.example .env   # fill in ADMIN_TOKEN + DATABASE_URL
    python3 check.py

Requires: python3, the `requests` package (pip install requests), and the
`psql` CLI on PATH (used read-only — every query below is a plain SELECT).
"""
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import requests
except ImportError:
    print("Nedostaje 'requests' paket. Instaliraj sa: pip install requests", file=sys.stderr)
    sys.exit(1)

HERE = Path(__file__).resolve().parent
HISTORY_DIR = HERE / "history"
REQUIRED_ENV = ["PROD_API_URL", "SITE_URL_RS", "SITE_URL_HR", "ADMIN_TOKEN", "DATABASE_URL"]


def load_env():
    env = dict(os.environ)
    env_file = HERE / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            env.setdefault(key.strip(), value.strip())
    missing = [k for k in REQUIRED_ENV if not env.get(k)]
    if missing:
        print(
            f"Nedostaju env varijable: {', '.join(missing)}. "
            f"Kopiraj .env.example u .env (u istom folderu) i popuni ih.",
            file=sys.stderr,
        )
        sys.exit(1)
    return env


def http_get(url, headers=None, timeout=15):
    try:
        return requests.get(url, headers=headers, timeout=timeout)
    except requests.RequestException as e:
        return e


# ───────────────────────── A. Dostupnost sajta ─────────────────────────

def check_availability(cfg):
    urls = {
        "homepage_rs": cfg["SITE_URL_RS"] + "/",
        "homepage_hr": cfg["SITE_URL_HR"] + "/",
        "sitemap_rs": cfg["SITE_URL_RS"] + "/sitemap.xml",
        "sitemap_hr": cfg["SITE_URL_HR"] + "/sitemap.xml",
        "robots_rs": cfg["SITE_URL_RS"] + "/robots.txt",
        "robots_hr": cfg["SITE_URL_HR"] + "/robots.txt",
    }
    results = {}
    for key, url in urls.items():
        resp = http_get(url)
        if isinstance(resp, Exception):
            results[key] = {"url": url, "ok": False, "error": str(resp)}
        else:
            results[key] = {"url": url, "ok": resp.status_code == 200, "status_code": resp.status_code}
    return results


def check_homepage_grid(availability):
    """Homepage should always show products. If the empty-state string shows
    up here (no filters applied), it's the known ISR-cache-poisoning bug
    pattern (see project memory project_isr_empty_grid_bug), not a real empty
    result set."""
    findings = {}
    for market, key in (("rs", "homepage_rs"), ("hr", "homepage_hr")):
        url = availability[key]["url"]
        resp = http_get(url)
        if isinstance(resp, Exception):
            findings[market] = {"empty_grid_suspected": None, "error": str(resp)}
            continue
        findings[market] = {"empty_grid_suspected": "Nema rezultata" in resp.text}
    return findings


def check_robots(availability):
    findings = {}
    baselines = {
        "rs": HERE / "robots-baseline-rs.txt",
        "hr": HERE / "robots-baseline-hr.txt",
    }
    for market, key in (("rs", "robots_rs"), ("hr", "robots_hr")):
        url = availability[key]["url"]
        resp = http_get(url)
        if isinstance(resp, Exception):
            findings[market] = {"error": str(resp)}
            continue
        current = set(re.findall(r"^Disallow:\s*(.+)$", resp.text, re.MULTILINE))
        baseline_file = baselines[market]
        baseline_text = baseline_file.read_text() if baseline_file.exists() else ""
        baseline = set(re.findall(r"^Disallow:\s*(.+)$", baseline_text, re.MULTILINE))
        findings[market] = {
            "new_disallow_rules": sorted(current - baseline),
            "removed_disallow_rules": sorted(baseline - current),
        }
    return findings


def check_sitemap(availability, previous_run):
    findings = {}
    for market, key in (("rs", "sitemap_rs"), ("hr", "sitemap_hr")):
        url = availability[key]["url"]
        resp = http_get(url)
        if isinstance(resp, Exception):
            findings[market] = {"url_count": None, "error": str(resp)}
            continue
        count = resp.text.count("<url>")
        prev_count = None
        if previous_run:
            prev_count = previous_run.get("sitemap", {}).get(market, {}).get("url_count")
        drop_pct = round((prev_count - count) / prev_count * 100, 1) if prev_count else None
        findings[market] = {"url_count": count, "previous_url_count": prev_count, "drop_pct_vs_previous_run": drop_pct}
    return findings


# ───────────────────────── B. Postojeći admin API ─────────────────────────

def check_scrape_status(cfg):
    url = cfg["PROD_API_URL"] + "/api/admin/scrape/status"
    resp = http_get(url, headers={"X-Admin-Token": cfg["ADMIN_TOKEN"]})
    if isinstance(resp, Exception):
        return {"error": str(resp)}
    if resp.status_code != 200:
        return {"error": f"HTTP {resp.status_code}", "body": resp.text[:300]}
    return resp.json()


def check_data_quality(cfg):
    out = {}
    for market in ("rs", "hr"):
        url = cfg["PROD_API_URL"] + f"/api/admin/data-quality?market={market}"
        resp = http_get(url, headers={"X-Admin-Token": cfg["ADMIN_TOKEN"]})
        if isinstance(resp, Exception):
            out[market] = {"error": str(resp)}
            continue
        if resp.status_code != 200:
            out[market] = {"error": f"HTTP {resp.status_code}", "body": resp.text[:300]}
            continue
        out[market] = resp.json()
    return out


# ───────────────────────── C. Direktan read-only psql ─────────────────────────

def run_psql(cfg, sql, maxsplit=-1):
    """Runs one read-only SQL statement via the psql CLI. Every call site below
    passes a plain SELECT — this tool never writes to the database."""
    try:
        result = subprocess.run(
            ["psql", cfg["DATABASE_URL"], "-v", "ON_ERROR_STOP=1", "-t", "-A", "-F", "\t", "-c", sql],
            capture_output=True, text=True, timeout=30,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        return None, str(e)
    if result.returncode != 0:
        return None, result.stderr.strip()
    rows = [line.split("\t", maxsplit) for line in result.stdout.splitlines() if line.strip()]
    return rows, None


def check_scrape_log_trend(cfg):
    rows, err = run_psql(cfg, """
        SELECT store_name, status, COUNT(*)
        FROM scrape_log
        WHERE started_at > now() - interval '14 days'
        GROUP BY store_name, status
        ORDER BY store_name, status;
    """)
    if err:
        return {"error": err}
    counts = {}
    for store, status, count in rows:
        counts.setdefault(store, {})[status] = int(count)

    # maxsplit=3 caps error_message (free-text, could theoretically contain a tab) to one field
    rows2, err2 = run_psql(cfg, """
        SELECT DISTINCT ON (store_name) store_name, status, started_at, error_message
        FROM scrape_log
        WHERE started_at > now() - interval '14 days' AND status IN ('BLOCKED','FAILED','PARTIAL')
        ORDER BY store_name, started_at DESC;
    """, maxsplit=3)
    last_issue = {}
    if err2:
        last_issue = {"error": err2}
    else:
        for row in rows2:
            store, status, started_at, error_message = (row + [None] * 4)[:4]
            last_issue[store] = {"status": status, "started_at": started_at, "error_message": error_message}

    return {"counts_last_14d": counts, "last_non_success_per_store": last_issue}


def check_missed_scrapes(cfg):
    rows, err = run_psql(cfg, """
        SELECT
          COUNT(*) FILTER (WHERE missed_scrapes >= 1),
          COUNT(*) FILTER (WHERE missed_scrapes >= 2),
          COUNT(*)
        FROM products;
    """)
    if err or not rows:
        return {"error": err or "no rows returned"}
    at_least_1, at_least_2, total = rows[0]
    return {
        "products_with_at_least_1_miss": int(at_least_1),
        "products_with_at_least_2_misses": int(at_least_2),
        "total_products": int(total),
    }


def check_price_history_activity(cfg):
    rows, err = run_psql(cfg, """
        SELECT s.name, COUNT(ph.id)
        FROM stores s
        LEFT JOIN products p ON p.store_id = s.id
        LEFT JOIN price_history ph ON ph.product_id = p.id AND ph.timestamp > now() - interval '7 days'
        GROUP BY s.name
        ORDER BY s.name;
    """)
    if err:
        return {"error": err}
    return {store: int(count) for store, count in rows}


def check_dead_link_spotcheck(cfg, sample_size=8):
    rows, err = run_psql(cfg, f"""
        SELECT url FROM products
        WHERE url IS NOT NULL
        ORDER BY random()
        LIMIT {sample_size};
    """)
    if err:
        return {"error": err}
    results = []
    for row in rows:
        url = row[0]
        resp = http_get(url, timeout=10)
        if isinstance(resp, Exception):
            results.append({"url": url, "ok": False, "error": str(resp)})
        else:
            results.append({"url": url, "ok": resp.status_code < 400, "status_code": resp.status_code})
    return results


# ───────────────────────── main ─────────────────────────

def load_previous_run():
    if not HISTORY_DIR.exists():
        return None
    files = sorted(HISTORY_DIR.glob("*.json"))
    if not files:
        return None
    try:
        return json.loads(files[-1].read_text())
    except (json.JSONDecodeError, OSError):
        return None


def main():
    cfg = load_env()
    previous_run = load_previous_run()

    availability = check_availability(cfg)
    report = {
        "meta": {"generated_at": datetime.now(timezone.utc).isoformat()},
        "availability": availability,
        "homepage_grid": check_homepage_grid(availability),
        "robots": check_robots(availability),
        "sitemap": check_sitemap(availability, previous_run),
        "scrape_status": check_scrape_status(cfg),
        "data_quality": check_data_quality(cfg),
        "db": {
            "scrape_log_trend_14d": check_scrape_log_trend(cfg),
            "missed_scrapes": check_missed_scrapes(cfg),
            "price_history_activity_7d_by_store": check_price_history_activity(cfg),
        },
        "dead_link_spotcheck": check_dead_link_spotcheck(cfg),
    }

    HISTORY_DIR.mkdir(exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
    (HISTORY_DIR / f"{ts}.json").write_text(json.dumps(report, indent=2, ensure_ascii=False, default=str))

    print(json.dumps(report, indent=2, ensure_ascii=False, default=str))


if __name__ == "__main__":
    main()
