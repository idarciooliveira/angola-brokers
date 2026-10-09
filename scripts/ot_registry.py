#!/usr/bin/env python3
"""Treasury bond reference data: reads the BODIVA daily bulletin and adds new bonds to data/instruments/ot.jsonl.

The ticker only has code, price and change. Issue date, maturity date and coupon come from the "Boletim Oficial de Mercado"
(PDF), which lists them for every bond traded that day. They never change after issue, so a bond is written once and
checked against later bulletins. A bond that does not trade is not in the bulletin; run the script on a later day.
bodiva.ao times out on a direct connection, so the PDF is fetched with the Firecrawl CLI like daily_prices.py does.

    python3 scripts/ot_registry.py                       # bulletin of the latest day in data/daily
    python3 scripts/ot_registry.py --date 2026-10-08     # bulletin of a given session day
    python3 scripts/ot_registry.py --from FILE --date D  # parse a saved Firecrawl JSON for day D instead of scraping
    python3 scripts/ot_registry.py --dry-run             # print the new rows, write nothing
"""
import argparse, datetime as dt, json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BULLETIN = "https://www.bodiva.ao/media/boletim-diario/boletimdiario{}.pdf"
RAW = ROOT / ".firecrawl" / "daily"
OUT = ROOT / "data" / "instruments" / "ot.jsonl"
DAILY = ROOT / "data" / "daily"

# | code | OT-NR | issue date | maturity date | coupon | YTM | ...
# Other tables (repos, auctions) repeat the code and dates but put a price or an amount in the fifth and sixth cells,
# so the sixth cell has to be a percentage (the YTM) for the row to count.
ROW = re.compile(r"^\|\s*([A-Z0-9]{8})\s*\|\s*(OT-[A-Z]+)\s*\|\s*(\d\d/\d\d/\d{4})\s*\|\s*(\d\d/\d\d/\d{4})\s*\|"
                 r"\s*(\d+,\d+)%\s*\|\s*\d+,\d+%\s*\|")


def iso(d):
    return dt.datetime.strptime(d, "%d/%m/%Y").date().isoformat()


def scrape(day):
    RAW.mkdir(parents=True, exist_ok=True)
    out = RAW / f"boletim-{day}.json"
    cmd = ["firecrawl", "scrape", BULLETIN.format(day.replace("-", "")), "--format", "markdown", "--max-age", "0", "-o", str(out)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0 or not out.exists():
        sys.exit(f"firecrawl failed ({r.returncode}): {r.stderr.strip() or r.stdout.strip()}")
    return out


def parse(markdown, day):
    found = {}
    for line in markdown.splitlines():
        m = ROW.match(line)
        if not m:
            continue
        code, typ, issued, maturity, coupon = m.groups()
        # The code is O + term letter + day + month letter + year + series letter; day and year must match the maturity.
        # The bulletin has typos (OII5A30A on 2026-10-08), so a row that disagrees with itself is skipped, not trusted.
        if not (re.fullmatch(r"O[A-Z]\d{2}[A-Z]\d{2}[A-Z]", code) and code[2:4] == maturity[:2] and code[5:7] == maturity[8:]):
            print(f"skipping {code}: code does not match maturity {maturity}", file=sys.stderr)
            continue
        row = dict(code=code, type=typ, issued=iso(issued), maturity=iso(maturity), coupon_pct=float(coupon.replace(",", ".")),
                   source=BULLETIN.format(day.replace("-", "")), checked_on=day)
        facts = {k: row[k] for k in ("type", "issued", "maturity", "coupon_pct")}
        if found.setdefault(code, row) is not row and {k: found[code][k] for k in facts} != facts:
            sys.exit(f"{code}: the bulletin lists it twice with different terms")
    if not found:
        sys.exit("no bond rows found; the PDF probably did not convert")
    return list(found.values())


def merge(old, rows):
    """Adds bonds that are new. A bond already in the file must have the same terms; if not, something is wrong."""
    known = {r["code"]: r for r in old}
    new = []
    for r in rows:
        k = known.get(r["code"])
        if k is None:
            new.append(r)
        elif any(k[f] != r[f] for f in ("type", "issued", "maturity", "coupon_pct")):
            sys.exit(f"{r['code']}: bulletin of {r['checked_on']} disagrees with {OUT.relative_to(ROOT)}: {k} vs {r}")
    return new


def missing_from(codes):
    latest = sorted(DAILY.glob("*.jsonl"))[-1]
    seen = {json.loads(l)["code"] for l in latest.read_text(encoding="utf-8").splitlines()
            if l.strip() and json.loads(l)["kind"] == "ot"}
    return latest.stem, sorted(seen - codes)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--from", dest="src", type=Path, help="saved Firecrawl JSON with a markdown field")
    ap.add_argument("--date", help="session day (YYYY-MM-DD); default is the latest file in data/daily")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    day = dt.date.fromisoformat(a.date).isoformat() if a.date else sorted(DAILY.glob("*.jsonl"))[-1].stem
    src = a.src or scrape(day)
    rows = parse(json.loads(src.read_text(encoding="utf-8")).get("markdown", ""), day)

    old = [json.loads(l) for l in OUT.read_text(encoding="utf-8").splitlines() if l.strip()] if OUT.exists() else []
    new = merge(old, rows)
    if a.dry_run:
        print("\n".join(json.dumps(r, ensure_ascii=False) for r in new))
        print(f"{len(new)} new of {len(rows)} bonds in the bulletin of {day} (dry run, nothing written)", file=sys.stderr)
        return
    if new:
        merged = sorted(old + new, key=lambda r: (r["maturity"], r["code"]))
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in merged), encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)}: {len(new)} new, {len(rows) - len(new)} already known (bulletin of {day})")
    stem, gone = missing_from({r["code"] for r in old + new})
    if gone:
        print(f"data/daily/{stem}.jsonl has bonds with no reference row: {', '.join(gone)}. "
              "They do not trade in this bulletin; try another day.", file=sys.stderr)


if __name__ == "__main__":
    main()
