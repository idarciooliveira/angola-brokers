#!/usr/bin/env python3
"""Builds build/bodiva.db from data/**/*.jsonl. The .jsonl files are the source of truth; the database is disposable.
Fails on a missing field, a wrong type or a duplicate key, so a bad PR or a broken scraper cannot slip in silently."""
import json, sqlite3, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA, DB = ROOT / "data", ROOT / "build" / "bodiva.db"

# table -> (glob, columns, primary key). A column ending in ? may be null or absent.
TABLES = {
 "prices": ("daily/*.jsonl", {"date": "TEXT", "kind": "TEXT", "code": "TEXT", "price": "REAL", "change_pct": "REAL?", "source": "TEXT", "scraped_at": "TEXT?", "note": "TEXT?"}, ("date", "kind", "code")),
 "instruments": ("instruments/ot.jsonl", {"code": "TEXT", "type": "TEXT", "issued": "TEXT", "maturity": "TEXT", "coupon_pct": "REAL", "source": "TEXT", "checked_on": "TEXT"}, ("code",)),
 "member_stats": ("market/members-*.jsonl", {"as_of": "TEXT", "period": "TEXT", "member": "TEXT", "name": "TEXT", "accounts": "INTEGER?", "accounts_share_pct": "REAL?", "custody_mm_kz": "REAL?", "volume_mm_kz": "REAL?", "source": "TEXT", "note": "TEXT?"}, ("period", "member")),
 "market_totals": ("market/totals.jsonl", {"period": "TEXT", "total_kz_bi": "REAL", "bilateral_kz_bi": "REAL?", "multilateral_kz_bi": "REAL?", "accounts": "INTEGER?", "partial": "INTEGER", "as_of": "TEXT?", "source": "TEXT"}, ("period",)),
 "broker_pricelists": ("brokers/*.jsonl", {"broker": "TEXT", "checked_on": "TEXT", "pct_public_debt_secondary": "REAL", "min_kz": "REAL", "extra_fees": "TEXT", "dividend_fee": "TEXT?", "maintenance": "TEXT?", "pricelist_date": "TEXT?", "pricelist_date_raw": "TEXT?", "stale": "INTEGER", "uncertain": "INTEGER", "source_url": "TEXT?", "note": "TEXT?"}, ("broker", "checked_on")),
}
ENUMS = {("prices", "kind"): {"stock", "ot", "bt", "corp_bond"}, ("broker_pricelists", "extra_fees"): {"included", "bodiva", "bodiva+cevama", "unclear"}}
PY = {"TEXT": str, "REAL": (int, float), "INTEGER": (int, bool)}

def load(name, glob, cols, pk):
    errors, rows, keys = [], [], set()
    for f in sorted(DATA.glob(glob)):
        for n, line in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
            where = f"{f.relative_to(ROOT)}:{n}"
            try:
                r = json.loads(line)
            except json.JSONDecodeError as e:
                errors.append(f"{where}: invalid JSON ({e})"); continue
            for k in r:
                if k not in cols: errors.append(f"{where}: unknown field {k}")
            for k, t in cols.items():
                optional, base = t.endswith("?"), t.rstrip("?")
                v = r.get(k)
                if v is None:
                    if not optional: errors.append(f"{where}: missing {k}")
                elif not isinstance(v, PY[base]): errors.append(f"{where}: {k} should be {base}, got {v!r}")
                elif (name, k) in ENUMS and v not in ENUMS[(name, k)]: errors.append(f"{where}: {k}={v!r} not allowed")
            key = tuple(r.get(k) for k in pk)
            if key in keys: errors.append(f"{where}: duplicate key {key}")
            keys.add(key); rows.append(r)
    return rows, errors

def main():
    all_errors, loaded = [], {}
    for name, (glob, cols, pk) in TABLES.items():
        rows, errs = load(name, glob, cols, pk)
        loaded[name] = rows; all_errors += errs
    if all_errors:
        print("\n".join(all_errors[:50]), file=sys.stderr)
        sys.exit(f"{len(all_errors)} problem(s) in data/, database not built")
    DB.parent.mkdir(exist_ok=True)
    DB.unlink(missing_ok=True)
    con = sqlite3.connect(DB)
    for name, (_, cols, pk) in TABLES.items():
        defs = ", ".join(f"{k} {t.rstrip('?')}" + ("" if t.endswith("?") else " NOT NULL") for k, t in cols.items())
        con.execute(f"CREATE TABLE {name} ({defs}, PRIMARY KEY ({', '.join(pk)}))")
        con.executemany(f"INSERT INTO {name} VALUES ({', '.join('?' * len(cols))})", [tuple(r.get(k) for k in cols) for r in loaded[name]])
        print(f"{name}: {len(loaded[name])} rows")
    con.commit(); con.close()
    print(f"built {DB.relative_to(ROOT)}")

if __name__ == "__main__":
    main()
