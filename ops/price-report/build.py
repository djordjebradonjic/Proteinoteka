#!/usr/bin/env python3
"""Turns panel.csv (see panel.sql) into frontend/lib/price-reports/<edition>.ts.

Usage: python3 build.py panel.csv 2026-09 <baseline YYYY-MM-DD> <end YYYY-MM-DD> <fresh-after YYYY-MM-DD> [excluded,stores] > out.ts

A listing is dropped from the statistics when its history can't be trusted:
  * stale   - not refreshed since before <fresh-after>, so today's price is unverified
  * unstable- 3+ price changes in the window, or a price that goes A -> B -> A (an ended promo /
              a scraper re-pointing one row between products), see the price-drops audit
  * a gainer (mass/gainer), or a move larger than 50% (a different pack on the same row)
  * a store in the optional exclusion list (Ogistrashop: its short promos expire between weekly
    scrapes, so a baseline promo price looks like a later 'price rise')
The result is a like-for-like comparison: the same listing then and now.
"""
import csv, json, re, statistics as st, sys, collections

path, edition, baseline, end, fresh_after = sys.argv[1:6]
EXCLUDED = set(sys.argv[6].split(",")) if len(sys.argv) > 6 and sys.argv[6] else set()
rows = list(csv.DictReader(open(path, encoding="utf-8")))
GAINER = re.compile(r"\b(mass|gainer)\b", re.I)

# Listings filed under the wrong brand in the products table (verified 2026-09-19: 534 sits in the same
# product group as the other Nutriversum ISO Pro listings, 363/417 say Nutriversum in the name).
BRAND_FIX = {"534": "Nutriversum", "363": "Nutriversum", "417": "Nutriversum"}

def brand_of(r):
    if r["id"] in BRAND_FIX: return BRAND_FIX[r["id"]]
    return "Nutriversum" if re.search(r"nutriversum", r["name"], re.I) else r["brand"]

def category(r):
    src = (r["protein_source"] or "").lower(); n = r["name"].lower()
    if ("hydro" in n or "hidro" in n) and src in ("", "whey_concentrate", "whey_isolate", "blend") \
            and not re.search(r"beef|hovezi|goveđ", n):
        return "hydrolysate"
    return src or "unknown"

def reason(r):
    n, a, b = int(r["n_after"]), float(r["p_then"]), float(r["p_now"])
    if r["store"] in EXCLUDED: return "excludedStore"
    if GAINER.search(r["name"]): return "gainer"
    if r["last_updated"] < fresh_after: return "stale"
    seq = ([float(x) for x in r["path"].split(">")] if r["path"] else []) + [b]
    if n >= 3: return "unstable"
    for i in range(len(seq)):
        for j in range(i + 2, len(seq)):
            if seq[j] == seq[i] and any(seq[k] != seq[i] for k in range(i + 1, j)): return "unstable"
    if abs(b / a - 1) > 0.5: return "implausible"
    return None

dropped = collections.Counter(); kept = []
for r in rows:
    why = reason(r)
    if why: dropped[why] += 1
    else:
        r["chg"] = float(r["p_now"]) / float(r["p_then"]) - 1
        r["cat"] = category(r)
        kept.append(r)

UP = 0.0005
def summarize(rs):
    ch = [r["chg"] for r in rs]; ups = [c for c in ch if c > UP]; dns = [c for c in ch if c < -UP]
    return {"n": len(ch), "up": len(ups), "down": len(dns), "same": len(ch) - len(ups) - len(dns),
            "mean": round(st.mean(ch) * 100, 1), "median": round(st.median(ch) * 100, 1),
            "riserMean": round(st.mean(ups) * 100, 1) if ups else 0.0,
            "fallerMean": round(st.mean(dns) * 100, 1) if dns else 0.0}

# sensitivity check: the same statistics without the one store whose data was refreshed in bulk on the last day
robust = [r for r in kept if r["store"] != "Proteinbox"]
cats = collections.defaultdict(list)
for r in kept: cats[r["cat"]].append(r)
MAIN = ["whey_concentrate", "whey_isolate", "vegan", "blend", "casein"]
categories = []
for k in MAIN:
    s = summarize(cats[k]); s["key"] = k
    s["meanRobust"] = summarize([r for r in cats[k] if r["store"] != "Proteinbox"])["mean"]
    categories.append(s)
other = [r for k, v in cats.items() if k not in MAIN for r in v]
s = summarize(other); s["key"] = "other"; s["meanRobust"] = summarize([r for r in other if r["store"] != "Proteinbox"])["mean"]
categories.append(s)

brands = []
bb = collections.defaultdict(list)
for r in kept:
    if brand_of(r): bb[brand_of(r)].append(r)
for b, rs in bb.items():
    if len(rs) >= 4:
        s = summarize(rs); s["brand"] = b; s["max"] = round(max(r["chg"] for r in rs) * 100, 1); brands.append(s)
brands.sort(key=lambda x: (-x["up"] / x["n"], -x["n"]))

risers = [r for r in kept if r["chg"] > UP]
by_month = collections.Counter(r["last_price_change_at"][:7] for r in risers)
by_day = collections.Counter(r["first_change"][:10] for r in risers if r["first_change"])
day_detail = {}
for day, _ in by_day.most_common(2):
    sel = [r for r in risers if r["first_change"] and r["first_change"][:10] == day]
    day_detail[day] = {"stores": len({r["store"] for r in sel}),
                       "brands": dict(collections.Counter(brand_of(r) or "?" for r in sel).most_common())}

# same brand + same pack + same percentage in two different stores
cross = []; used = set()
for i, a in enumerate(risers):
    if not brand_of(a): continue
    grp = [a]
    for b in risers[i + 1:]:
        if b["store"] == a["store"] or brand_of(b) != brand_of(a): continue
        wa, wb = float(a["w"] or 0), float(b["w"] or 0)
        if wa and wb and abs(wa - wb) / wa <= 0.05 and abs(a["chg"] - b["chg"]) <= 0.006: grp.append(b)
    if len(grp) > 1 and not ({g["id"] for g in grp} & used):
        used |= {g["id"] for g in grp}
        cross.append({"brand": brand_of(a), "grams": round(float(a["w"])), "pct": round(a["chg"] * 100, 1),
                      "from": round(float(a["p_then"])), "to": round(float(a["p_now"])),
                      "stores": len({g["store"] for g in grp})})

def move(r):
    return {"name": r["name"], "brand": brand_of(r), "from": round(float(r["p_then"])),
            "to": round(float(r["p_now"])), "pct": round(r["chg"] * 100, 1)}
movers = sorted(kept, key=lambda r: r["chg"])
report = {
    "edition": edition, "baseline": baseline, "end": end,
    "panelStoreCount": len({r["store"] for r in rows if r["store"] not in EXCLUDED}),
    "excludedStoreCount": len(EXCLUDED),
    "panelTotal": len(rows), "used": len(kept), "dropped": dict(dropped),
    "overall": {**summarize(kept), "meanRobust": summarize(robust)["mean"]},
    "categories": categories, "brands": brands,
    "risersByMonth": dict(sorted(by_month.items())),
    "biggestDays": by_day.most_common(4),
    "dayDetail": day_detail,
    "crossStore": cross,
    "biggestRises": [move(r) for r in movers[::-1][:8]],
    "falls": [move(r) for r in movers if r["chg"] < -UP],
}
print("// GENERATED by ops/price-report/build.py from a read-only production query - do not edit by hand.")
print("// Deliberately contains no store names: the published report describes the market, not individual shops.")
print("// A dated edition of the price report: the numbers below describe the window, not today's prices.")
print(f"export const REPORT_{edition.replace('-', '_')} = " + json.dumps(report, ensure_ascii=False, indent=2) + " as const;")
