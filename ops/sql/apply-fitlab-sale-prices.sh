#!/usr/bin/env bash
# Corrects the FitLab prices the scraper stored wrong (the struck-through regular price of every product that was
# on sale), so the first scrape after the deploy does not report them as price drops.
#
#   ./ops/sql/apply-fitlab-sale-prices.sh            DRY RUN: the SQL runs inside a transaction that is rolled back.
#                                                    Read the preview table: 'WILL BE CORRECTED' rows = UPDATE n.
#   ./ops/sql/apply-fitlab-sale-prices.sh --apply    Same SQL with COMMIT, then POST /api/admin/recalculate-scores.
#
# The SQL is generated from the live fitlab.rs listing every time (sales start and end, so a saved copy would go
# stale): fitlab_sale_prices.py only READS the website. The UPDATE is guarded by the URL and the exact old
# price, so a second run changes 0 rows. Run it right before the deploy / before enabling the next FitLab scrape.
# Reads DATABASE_URL, PROD_API_URL and ADMIN_TOKEN from ops/health-check/.env; secrets are never printed.
# Before writing, the FitLab rows are saved to ~/Desktop/proteinoteka-backups/fitlab-sale-prices-<date>/.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
MODE=dry
[ "${1:-}" = "--apply" ] && MODE=apply

set -a
# shellcheck disable=SC1091
. "$ROOT/ops/health-check/.env"
set +a
: "${DATABASE_URL:?DATABASE_URL missing in ops/health-check/.env}"

eval "$(python3 - <<'PY'
import os, urllib.parse as u
p = u.urlparse(os.environ["DATABASE_URL"])
print(f"PGUSER={p.username!r}; PGPASSWORD={u.unquote(p.password or '')!r}; PGHOSTNAME={p.hostname!r}; "
      f"PGPORT={p.port!r}; PGDB={p.path.lstrip('/')!r}; export PGUSER PGPASSWORD")
PY
)"

# The local resolver has returned bogus addresses for the Railway proxy host; fall back to its public IP.
HOSTADDR_FALLBACK="${PG_HOSTADDR:-66.33.22.234}"
CONN="host=$PGHOSTNAME port=$PGPORT dbname=$PGDB connect_timeout=10"
if ! psql "$CONN" -Atqc "select 1" >/dev/null 2>&1; then
  CONN="$CONN hostaddr=$HOSTADDR_FALLBACK"
  psql "$CONN" -Atqc "select 1" >/dev/null || { echo "Cannot connect to the production database"; exit 1; }
fi
run_sql() { psql "$CONN" -v ON_ERROR_STOP=1 "$@"; }

echo "== mode: $MODE"

# --- the SQL, from the live shop (read-only on the website) ------------------------------------------
SQL="$(mktemp)"
trap 'rm -f "$SQL"' EXIT
python3 "$HERE/fitlab_sale_prices.py" > "$SQL"    # prints "N products on P pages, M on sale" to stderr

# --- backup (read-only) -----------------------------------------------------------------------------
BACKUP_DIR="$HOME/Desktop/proteinoteka-backups/fitlab-sale-prices-$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"
BACKUP="$BACKUP_DIR/fitlab_products_before_sale_price_fix.csv"
run_sql -c "\\copy (select id, name, url, price, numeric_price, last_updated, value_score, protein_per_rsd, percentile_rank from products where store_id = (select id from stores where name = 'FitLab') order by id) to '$BACKUP' csv header"
echo "== backup written: $BACKUP"

# --- the correction ---------------------------------------------------------------------------------
echo; echo "================ fitlab_sale_prices.sql"
if [ "$MODE" = apply ]; then
  sed -E 's/^ROLLBACK;.*$/COMMIT;/' "$SQL" | run_sql -f -
else
  sed -E 's/^COMMIT;.*$/ROLLBACK;/' "$SQL" | run_sql -f -
  echo; echo "== DRY RUN finished, nothing was changed."
  echo "   Expect UPDATE n, n = the number of 'WILL BE CORRECTED' rows in the preview (0 = nothing to correct)."
  echo "   Re-run with --apply to commit."
  exit 0
fi

# --- re-score + summary -----------------------------------------------------------------------------
echo; echo "================ recalculate-scores"
"$ROOT/ops/health-check/recalculate-scores.sh"

echo; echo "================ data-quality: price-change consistency"
DQ="$(mktemp)"
curl -sS -m 90 -H "X-Admin-Token: $ADMIN_TOKEN" -o "$DQ" "$PROD_API_URL/api/admin/data-quality"
python3 - "$DQ" <<'PY'
import sys, json, collections
d = json.load(open(sys.argv[1]))
c = collections.Counter(x.split(" ")[0] for x in d["outliers"])
print(f"PRICE_CHANGE_STALE: {c.get('PRICE_CHANGE_STALE', 0)}  PRICE_CHANGE_IMPLAUSIBLE: {c.get('PRICE_CHANGE_IMPLAUSIBLE', 0)}")
if c.get("PRICE_CHANGE_STALE", 0):
    print("  A corrected row that already had price history is now below its last recorded price, so the audit expects")
    print("  a drop percentage. That drop is real (regular price -> sale price); POST /api/admin/recalculate-price-changes")
    print("  stores it. Leave it if you do not want those rows on /price-drops.")
PY
rm -f "$DQ"
