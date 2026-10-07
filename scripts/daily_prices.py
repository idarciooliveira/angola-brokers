#!/usr/bin/env python3
"""Daily prices: scrapes the ticker on bodiva.ao/estatistica/dashboard and writes data/daily/YYYY-MM-DD.jsonl.

bodiva.ao times out on a direct connection, so the page is fetched with the Firecrawl CLI and the raw response is kept in
.firecrawl/daily/ for audit. Run it after the session closes (15:30 in Luanda): the date written is that day's session.
The "Última actualização" label on the page belongs to the Power BI report, not the ticker, so it is not used.
If every ticker price and change equals the previous day file, the ticker did not move (holiday, no publication) and
nothing is written. BDV and the Bilhetes do Tesouro rates are not in this ticker, so this script does not write them.

    python3 scripts/daily_prices.py                       # scrape, write the day file, validate with build_db.py
    python3 scripts/daily_prices.py --from FILE --date D  # parse a saved Firecrawl JSON for session D instead of scraping
    python3 scripts/daily_prices.py --dry-run             # print the rows, write nothing
    python3 scripts/daily_prices.py --force               # replace this script's rows in an existing day file
"""
import argparse, datetime as dt, html as htmllib, json, re, subprocess, sys
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
URL = "https://www.bodiva.ao/estatistica/dashboard"
RAW = ROOT / ".firecrawl" / "daily"
OUT = ROOT / "data" / "daily"
# ticker code -> short code used in data/. A new share code makes the script fail until it is added here.
STOCKS = {"SBAOAAAA": "SBA", "UNTLAAAA": "UNTL", "BCGAAAAA": "BCG", "ENSAAAAA": "ENSA", "BAIAAAAA": "BAI", "BFAAAAAA": "BFA",
          "BDVAAAAA": "BDV"}
LUANDA, CLOSE = ZoneInfo("Africa/Luanda"), dt.time(15, 30)  # multilateral 09:00-15:00, bilateral until 15:30
MIN_ROWS = 10  # the ticker had 18 instruments on 2026-10-05; far fewer means the page did not render

TICKER_ITEM = re.compile(
    r'<h1 class="text-gray-50[^"]*">\s*([A-Z0-9]+)\s*</h1>.*?'   # instrument code
    r'<h1 class="font-normal[^"]*">\s*([\d.]+)\s*%?\s*</h1>.*?'   # price (the page sometimes appends a stray %)
    r'<span class="text-sm[^"]*font-bold">\s*(-?[\d.]+)\s*%?\s*</span>', re.S)


def now_utc():
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def session_day():
    now = dt.datetime.now(LUANDA)
    if now.weekday() >= 5:
        sys.exit("no session on weekends; pass --date to force a day")
    if now.time() < CLOSE:
        sys.exit(f"session still open in Luanda ({now:%H:%M}); run after 15:30 or pass --date")
    return now.date().isoformat()


def scrape():
    RAW.mkdir(parents=True, exist_ok=True)
    out = RAW / f"{now_utc().replace(':', '')}.json"
    # --max-age 0: Firecrawl serves cached copies by default, which hides both new prices and site outages
    cmd = ["firecrawl", "scrape", URL, "--format", "html,markdown", "--wait-for", "8000", "--max-age", "0", "-o", str(out)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0 or not out.exists():
        sys.exit(f"firecrawl failed ({r.returncode}): {r.stderr.strip() or r.stdout.strip()}")
    return out


def classify(code):
    if code in STOCKS:
        return "stock", STOCKS[code]
    if re.fullmatch(r"O[A-Z]\d{2}[A-Z]\d{2}[A-Z]", code):
        return "ot", code
    if code.endswith("AAAA"):
        sys.exit(f"unknown share code {code}: add it to STOCKS in {Path(__file__).name}")
    return "corp_bond", code


def parse(page, scraped_at, date):
    h = htmllib.unescape(page["html"])
    rows, seen = [], set()
    for code, price, chg in TICKER_ITEM.findall(h):
        if code in seen:  # the marquee repeats every item
            continue
        seen.add(code)
        kind, short = classify(code)
        if float(price) <= 0:
            sys.exit(f"{code}: price {price} is not positive")
        rows.append(dict(date=date, kind=kind, code=short, price=float(price), change_pct=float(chg),
                         source=URL, scraped_at=scraped_at))
    if len(rows) < MIN_ROWS:
        sys.exit(f"only {len(rows)} ticker items found (expected at least {MIN_ROWS}); page probably did not render")
    return rows


def ticker_rows(path):
    return {(r["kind"], r["code"]): (r["price"], r["change_pct"])
            for r in map(json.loads, path.read_text(encoding="utf-8").splitlines()) if r["source"] == URL}


def stale_since(date, rows):
    """Returns the previous day file if the ticker shows exactly the same prices and changes, else None."""
    prev = [f for f in sorted(OUT.glob("*.jsonl")) if f.stem < date]
    if not prev:
        return None
    return prev[-1] if ticker_rows(prev[-1]) == {(r["kind"], r["code"]): (r["price"], r["change_pct"]) for r in rows} else None


def merge(path, rows, force):
    """Keeps rows from other sources (e.g. BT rates from biccorretora.ao) and replaces this script's rows only with --force."""
    if not path.exists():
        return rows, "new"
    old = [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]
    ours = {(r["kind"], r["code"]): r for r in old if r["source"] == URL}
    same = len(ours) == len(rows) and all(
        (o := ours.get((r["kind"], r["code"]))) and (o["price"], o["change_pct"]) == (r["price"], r["change_pct"]) for r in rows)
    if same:
        return None, "unchanged"
    if not force:
        sys.exit(f"{path.relative_to(ROOT)} already has different prices from this source; rerun with --force to replace them")
    new_keys = {(r["kind"], r["code"]) for r in rows}
    kept = [r for r in old if r["source"] != URL and (r["kind"], r["code"]) not in new_keys]
    return rows + kept, "replaced"


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--from", dest="src", type=Path, help="saved Firecrawl JSON with an html field")
    ap.add_argument("--date", help="session day (YYYY-MM-DD); default is today in Luanda, after 15:30")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()

    date = dt.date.fromisoformat(a.date).isoformat() if a.date else session_day()
    src = a.src or scrape()
    page = json.loads(src.read_text(encoding="utf-8"))
    meta = page.get("metadata", {})
    if not a.src and meta.get("cacheState") == "hit":
        sys.exit(f"firecrawl returned a cached copy from {meta.get('cachedAt')}, not a fresh page")
    scraped_at = dt.datetime.fromtimestamp(src.stat().st_mtime, dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    rows = parse(page, scraped_at, date)

    if a.dry_run:
        print("\n".join(json.dumps(r, ensure_ascii=False) for r in rows))
        print(f"{len(rows)} rows for {date} (dry run, nothing written)", file=sys.stderr)
        return
    if prev := stale_since(date, rows):
        print(f"ticker unchanged since {prev.stem}; nothing written for {date}")
        return
    path = OUT / f"{date}.jsonl"
    merged, status = merge(path, rows, a.force)
    if merged is None:
        print(f"{path.relative_to(ROOT)}: unchanged")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in merged), encoding="utf-8")
    print(f"{path.relative_to(ROOT)}: {len(rows)} rows from the ticker ({status})", flush=True)
    subprocess.run([sys.executable, str(ROOT / "scripts" / "build_db.py")], check=True)


if __name__ == "__main__":
    main()
