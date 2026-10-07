#!/usr/bin/env python3
"""One-off seed: turns the raw scrapes in .firecrawl/ and the BRK table in prototypes/painel.html into data/*.jsonl.
Daily updates will replace this with a scraper that writes the same record shapes (see data/README.md)."""
import json, re, subprocess, datetime as dt
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / ".firecrawl"
OUT = ROOT / "data"
AS_OF = "2026-10-05"  # "Última actualização 10/5/2026" in the dashboard page; inferred, not read from the ticker itself

def write(path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows), encoding="utf-8")
    print(f"{path.relative_to(ROOT)}: {len(rows)} rows")

def scraped_at(p):
    return dt.datetime.fromtimestamp(p.stat().st_mtime, dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# ---- daily prices: ticker on bodiva.ao/estatistica/dashboard ----
STOCKS = {"SBAOAAAA": "SBA", "UNTLAAAA": "UNTL", "BCGAAAAA": "BCG", "ENSAAAAA": "ENSA", "BAIAAAAA": "BAI", "BFAAAAAA": "BFA"}
dash = RAW / "dash.json"
md = json.loads(dash.read_text())["markdown"]
seen, daily = set(), []
for code, price, chg in re.findall(r"# ([A-Z0-9]+)\n\n# ([\d.]+)(?: %)?\n\n(-?[\d.]+)(?: %)?", md):
    if code in seen:
        continue
    seen.add(code)
    if code in STOCKS:
        kind, code = "stock", STOCKS[code]
    elif re.fullmatch(r"O[A-Z]\d{2}[A-Z]\d{2}[A-Z]", code):
        kind = "ot"
    else:
        kind = "corp_bond"
    daily.append(dict(date=AS_OF, kind=kind, code=code, price=float(price), change_pct=float(chg),
                      source="https://www.bodiva.ao/estatistica/dashboard", scraped_at=scraped_at(dash)))

# BDV and Bilhetes do Tesouro are not in dash.json; they come from the same ticker copied on biccorretora.ao
bic = RAW / "biccorr-cust.md"
t = bic.read_text()
src = "https://www.biccorretora.ao (copy of the BODIVA ticker)"
m = re.search(r"BDVAAAAA(\d[\d\s]*?),00", t)
daily.append(dict(date=AS_OF, kind="stock", code="BDV", price=float(re.sub(r"\s", "", m.group(1))), change_pct=0.0,
                  source=src, scraped_at=scraped_at(bic), note="date inferred; other prices in that copy differ from dash.json"))
for days, rate in dict(re.findall(r"BT (\d+)d(\d+\.\d+)% a\.a\.", t)).items():
    daily.append(dict(date=AS_OF, kind="bt", code=f"BT{days}", price=float(rate), change_pct=None,
                      source=src, scraped_at=scraped_at(bic), note="price = annual rate in %; date inferred"))
write(OUT / "daily" / f"{AS_OF}.jsonl", daily)

# ---- member stats from the Power BI report ----
pbi = json.loads((RAW / "pbi-parsed.json").read_text())
names = {"AUREA": "Áurea", "BFACM": "BFA Capital Markets", "LMB": "Lwei", "HCPS": "Hemera Capital Partners", "LUCRUM": "Lucrum Trust",
         "SINV": "Standard Invest", "PRIME": "Prime Solutions", "INCD": "Inovadora Capital", "MADZ": "Madz Global",
         "PCAP": "Prospectum Capital", "VALOR": "Valor", "EAGLESTONE": "Eaglestone", "KYROS": "Kyros", "SAFIRA": "Safira",
         "KITADI": "Kitadi", "FINCREST": "Fincrest", "RESULTADOS": "Resultados", "BICSCVM": "BIC Corretora", "BNSC": "Black N Share",
         "SAVINGS": "Savings", "AURORASDVM": "Aurora", "BMA": "Millennium Atlântico", "ABO": "ABO", "BNA": "BNA (banco central)",
         "SBA": "Standard Bank Angola", "FINIBANCO": "Finibanco", "BPC": "BPC", "BIC": "Banco BIC"}
for period, as_of in (("2025", "2025-12-31"), ("2026", AS_OF)):
    d = pbi[period]
    members = set(d["vol"]) | set(d["acc"]) | (set(d["cus"]) if period == "2026" else set())
    rows = []
    for k in sorted(members):
        acc = d["acc"].get(k)
        rows.append(dict(as_of=as_of, period=period, member=k, name=names.get(k, k),
                         accounts=acc[0] if acc else None, accounts_share_pct=acc[1] if acc else None,
                         custody_mm_kz=round(d["cus"][k], 2) if period == "2026" and k in d["cus"] else None,
                         volume_mm_kz=round(d["vol"][k], 2) if k in d["vol"] else None,
                         source="https://www.bodiva.ao/estatistica/dashboard (Power BI, read by tooltip)",
                         note="volume = internal + purchases + sales between members, counts both sides" +
                              ("; 2025 custody and accounts not captured" if period == "2025" else "")))
    write(OUT / "market" / f"members-{period}.jsonl", rows)

totals = [("2022", 1.10, None, None), ("2023", 7.67, None, None), ("2024", 6.05, None, None), ("2025", 5.73, None, None), ("2026", 7.90, 6.85, 1.05)]
write(OUT / "market" / "totals.jsonl", [dict(period=p, total_kz_bi=t, bilateral_kz_bi=b, multilateral_kz_bi=m_, accounts=61036 if p == "2026" else None,
        partial=(p == "2026"), as_of=AS_OF if p == "2026" else None, source="https://www.bodiva.ao/estatistica/dashboard") for p, t, b, m_ in totals])

# ---- broker price lists: the BRK table that painel.html uses ----
html = (ROOT / "prototypes" / "painel.html").read_text()
js = re.search(r"const BRK=(\[.*?\n\]);", html, re.S).group(1)
brk = json.loads(subprocess.run(["node", "-e", f"console.log(JSON.stringify({js}))"], capture_output=True, text=True, check=True).stdout)
urls = {
 "BFA Capital Markets": "https://www.bfacapitalmarkets.ao/api/media/0c4coa2d/pre%C3%A7ario-capital-markets.pdf",
 "Standard Invest": "https://cms.standardinvest.co.ao/uploads/SI_Precario_05022026_PT_73a5f23880.pdf",
 "Áurea": "https://backoffice.aurea.ao/api/assets/aurea/c5ddce08-2c45-4b25-9e39-bcc48e48c30f/",
 "BIC Corretora": "https://www.biccorretora.ao/docs/precario.pdf",
 "Inovadora Capital": "https://inovadoracapital.ao/assets/docs/PRE%C3%87ARIO_V10.pdf",
 "Kitadi Capital Partners": "https://kitadicp.com/_files/ugd/679fca_f904c34e12e047ce95ee1456097c61ae.pdf",
 "Banco BIC": "https://www.bancobic.ao/dotAsset/9ebe53dc-eeea-4675-a635-839ef5021448.pdf",
 "Millennium Atlântico": "https://www.atlantico.ao/media/x5qbhsgj/atl_pre_outros-clientes_20260421.pdf",
 "Fincrest": "https://fincrestsdvm.com/wp-content/uploads/2024/06/Fincrest-Precario-Servicos-_revisto.pdf",
 "Eaglestone": "https://eaglestone.eu/xms/files/Eaglestone_SDVM_-_Precario_2026.pdf",
 "Kyros": "https://kyros-sdvm.com/documents/Prec%CC%A7a%CC%81rio_Kyros_SDVM_a_vigorar_14082025.pdf",
 "Madz Global": "https://madzglobal.co.ao/precario",
 "Distribuidora Valor": "https://distribuidoravalor.ao/Assets/documentosPDF/Precario_Distribuidora_Valor_09022026.pdf",
 "Lucrum Trust": "https://lucrumtrust.ao/wp-content/uploads/2026/05/Precario-Lucrum-Trust-2026-.pdf",
 "Prime Solutions": "https://www.primesolutions.ao/assets/docs/precario.pdf",
 "Lwei Brokers": "https://pt.scribd.com/document/809582116/Lwei-Mansamusa-Brokers-SCVM-S-A-Precario-1",
 "Prospectum Capital": "https://prospectum.ao/assets/docs/Prospectum-Precario-Capital.pdf",
}
def iso(s):
    m = re.fullmatch(r"(\d\d)/(\d\d)/(\d{4})", s)
    return f"{m[3]}-{m[2]}-{m[1]}" if m else None
rows = []
for b in brk:
    extra = "bodiva" if b.get("lwei") else "included" if b.get("incl") else "unclear" if b.get("q") else "bodiva+cevama"
    rows.append(dict(broker=b["n"], checked_on="2026-10-07", pct_public_debt_secondary=b["pct"], min_kz=b.get("min") or 0,
                     extra_fees=extra, dividend_fee=b["div"], maintenance=b["man"],
                     pricelist_date=iso(b["dt"]), pricelist_date_raw=b["dt"], stale=bool(b.get("old")), uncertain=bool(b.get("q")),
                     source_url=urls.get(b["n"]),
                     note="BFA CM: 0,25% corretora + 0,05% BFA" if b["n"] == "BFA Capital Markets" else None))
write(OUT / "brokers" / "pricelists.jsonl", rows)
