#!/usr/bin/env python3
"""
Generates the SQL that corrects FitLab prices which the scraper stored wrong.

Background: a discounted FitLab card shows the old price (struck through) BEFORE the current one, and
FitLabScraper used to take the first price on the card. Every FitLab product that was on sale therefore
kept its regular price in the catalogue (Nutriversum 2 kg: stored 6.880, selling at 5.490). The scraper
is fixed; this brings the rows that are wrong today in line, so the first scrape after the deploy does
not report them as price drops (the alert e-mails, /price-drops and the newsletter digest all start
from that scrape).

What it does: reads the live protein listing of fitlab.rs (the category the scraper walks), finds the
cards that are on sale, and prints one guarded UPDATE that sets the current price on the rows still
holding the struck-through one. It only READS the website; it never touches a database. It corrects
the price the way a scraper run would (price text, numeric_price, last_updated) but writes NO price
history and NO drop percentage: nothing changed in the shop, the catalogue was wrong.

Sales start and end, so the output is a snapshot: generate it right before applying it
(apply-fitlab-sale-prices.sh does). Usage: python3 fitlab_sale_prices.py > fitlab_sale_prices.sql
"""
import re
import sys
import time
import urllib.request
from datetime import datetime

BASE = "https://fitlab.rs/sr/suplementi/proteini"
ORIGIN = "https://fitlab.rs"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/124.0.0.0 Safari/537.36")
MAX_PAGES = 40
MAX_SALE_CARDS = 60          # more than this means the markup changed, not that FitLab discounted everything
MIN_SALE_TO_OLD = 0.4        # a bigger "discount" is a different product/pack, not a sale


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "sr-RS,sr;q=0.9"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read().decode("utf-8", "replace")


def numeric(price_text):
    """PriceParser.parse for the formats FitLab prints: '5.490' (dot = thousands), '650', '1.950,50'."""
    s = re.sub(r"[^0-9.,]", "", price_text)
    if "," in s and s.rfind(",") > s.rfind("."):
        s = s.replace(".", "").replace(",", ".")
    elif "." in s and "," not in s and len(s.rsplit(".", 1)[1]) == 3:
        s = s.replace(".", "")
    return float(s)


def next_button_disabled(html):
    m = re.search(r"<button([^>]*)>\s*→\s*</button>", html)
    return m is None or re.search(r'(^|\s)disabled=""', m.group(1)) is not None


def walk_listing():
    """url -> {'old': text|None, 'cur': text|None} for every card of every page."""
    cards = {}
    pages = 0
    for page in range(1, MAX_PAGES + 1):
        html = get(BASE if page == 1 else f"{BASE}?page={page}")
        chunks = re.split(r'<div data-index="\d+"', html)[1:]
        if page == 1 and not chunks:
            sys.exit("no product cards found on the first page - the FitLab markup has changed, refusing to guess")
        pages = page
        for chunk in chunks:
            chunk = chunk[:25000]
            href = re.search(r'href="(/sr/proizvodi/[^"]+)"', chunk)
            if not href:
                continue
            url = ORIGIN + href.group(1)
            if url in cards:
                continue
            spans = re.findall(r'<span class="([^"]*)">\s*([\d.,]+)\s*(?:<!-- -->)?\s*RSD\s*</span>', chunk)
            old = [t for cls, t in spans if "line-through" in cls]
            cur = [t for cls, t in spans if "line-through" not in cls]
            cards[url] = {"old": old[0] if old else None, "cur": cur[0] if cur else None}
        if not chunks or next_button_disabled(html):
            break
        time.sleep(1.5)
    return cards, pages


def sql_literal(s):
    return "'" + s.replace("'", "''") + "'"


def main():
    cards, pages = walk_listing()
    corrections, skipped = [], []
    for url, c in cards.items():
        if not c["old"]:
            continue
        if not c["cur"]:
            skipped.append((url, "on sale but no current price found"))
            continue
        old, cur = numeric(c["old"]), numeric(c["cur"])
        if not (MIN_SALE_TO_OLD * old <= cur < old):
            skipped.append((url, f"implausible sale {c['old']} -> {c['cur']}"))
            continue
        corrections.append((url, c["old"], old, c["cur"], cur))
    if len(corrections) > MAX_SALE_CARDS:
        sys.exit(f"{len(corrections)} cards on sale - the markup must have changed, refusing to guess")
    for url, why in skipped:
        print(f"skipped {url}: {why}", file=sys.stderr)
    print(f"{len(cards)} products on {pages} pages, {len(corrections)} on sale", file=sys.stderr)

    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    values = ",\n    ".join(
        f"({sql_literal(url)}, {int(old_n) if old_n == int(old_n) else old_n}, "
        f"{sql_literal(cur_t)}, {int(cur_n) if cur_n == int(cur_n) else cur_n})"
        for url, _old_t, old_n, cur_t, cur_n in corrections)

    print(f"""-- FitLab sale-price correction, generated {now} from {BASE} ({len(cards)} products on {pages} pages, {len(corrections)} on sale).
--
-- The scraper stored the struck-through regular price of every FitLab product that was on sale (fixed in the
-- scraper). This sets the current price on the rows that still hold that regular price. Guarded by the exact old
-- value (numeric_price = old) and the product URL, so re-running is harmless (0 rows) and a row the scraper has
-- already refreshed is left alone. Writes no price_history and no drop percentage: nothing changed in the shop,
-- the catalogue was wrong, so there is nothing to announce.
--
-- Afterwards run POST /api/admin/recalculate-scores (apply-fitlab-sale-prices.sh does): value score,
-- protein per RSD and the percentile rank all depend on the price.
--
-- This runs in a transaction that ends with ROLLBACK. apply-fitlab-sale-prices.sh --apply turns it into COMMIT.
{"" if corrections else "-- Nothing is on sale right now: the statements below match no rows."}
BEGIN;

-- STEP 1 - preview (read-only): what each sale card would do
SELECT COALESCE(p.id::text, '-')            AS product_id,
       COALESCE(p.name, '(not in the catalogue)') AS name,
       p.price                              AS stored_price,
       v.sale_price                         AS current_price,
       CASE WHEN p.id IS NULL                  THEN 'not in the catalogue (a family the scraper does not keep)'
            WHEN p.numeric_price = v.old_numeric THEN 'WILL BE CORRECTED'
            ELSE 'stored price is not the struck-through one - left alone' END AS action
FROM (VALUES
    {values if corrections else "('', 0, '', 0)"}
) AS v(url, old_numeric, sale_price, sale_numeric)
LEFT JOIN products p ON p.url = v.url AND p.store_id = (SELECT id FROM stores WHERE name = 'FitLab')
ORDER BY action DESC, v.url;

-- STEP 2 - the correction (expect UPDATE n, n = the number of 'WILL BE CORRECTED' rows above)
UPDATE products p
SET price = v.sale_price,
    numeric_price = v.sale_numeric,
    last_updated = now()
FROM (VALUES
    {values if corrections else "('', 0, '', 0)"}
) AS v(url, old_numeric, sale_price, sale_numeric)
WHERE p.store_id = (SELECT id FROM stores WHERE name = 'FitLab')
  AND p.url = v.url
  AND p.numeric_price = v.old_numeric;

-- STEP 3 - result: every FitLab row that is on sale now, with the price the site will show
SELECT p.id, p.name, p.price, p.numeric_price
FROM products p
WHERE p.store_id = (SELECT id FROM stores WHERE name = 'FitLab')
  AND p.url IN ({", ".join(sql_literal(u) for u, *_ in corrections) if corrections else "''"})
ORDER BY p.id;

ROLLBACK;  -- apply-fitlab-sale-prices.sh --apply turns this line into COMMIT
""")


if __name__ == "__main__":
    main()
