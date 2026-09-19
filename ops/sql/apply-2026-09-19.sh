#!/usr/bin/env bash
# Applies the three 2026-09-19 data-fix scripts to production, then re-scores every product.
#
#   ./ops/sql/apply-2026-09-19.sh            DRY RUN: every script runs inside a transaction that is rolled back.
#                                            Check that each UPDATE/DELETE reports the expected row count.
#   ./ops/sql/apply-2026-09-19.sh --apply    Same scripts with COMMIT, then POST /api/admin/recalculate-scores
#                                            and a short data-quality summary.
#
# Order: SupplementStore label fixes -> cross-product rows (price history + nutrition) -> value-score inputs.
# Every UPDATE/DELETE in those scripts is guarded by the exact old value, so re-running is harmless (0 rows).
# Reads DATABASE_URL, PROD_API_URL and ADMIN_TOKEN from ops/health-check/.env; secrets are never printed.
# Before writing, the affected products rows are saved to ~/Desktop/proteinoteka-backups/2026-09-19/.
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

# --- backup (read-only) -----------------------------------------------------------------------------
BACKUP_DIR="$HOME/Desktop/proteinoteka-backups/2026-09-19"
mkdir -p "$BACKUP_DIR"
BACKUP="$BACKUP_DIR/products_nutrition_before_value_score_fix.csv"
run_sql -c "\\copy (select id, name, store_id, protein_source, protein_per_100g, fat_per_100g, sugar_per_100g, calorie_per_100g, numeric_price, value_score from products order by id) to '$BACKUP' csv header"
echo "== backup written: $BACKUP"
# fix_cross_product_rows deletes price_history rows of these products; keep them restorable
BACKUP_PH="$BACKUP_DIR/price_history_1417_731_558_before_cross_product_fix.csv"
run_sql -c "\\copy (select * from price_history where product_id in (1417, 731, 558) order by id) to '$BACKUP_PH' csv header"
echo "== backup written: $BACKUP_PH"

# --- the three scripts ------------------------------------------------------------------------------
for f in fix_supplementstore_nutrition_2026-09-19.sql fix_cross_product_rows_2026-09-19.sql fix_value_score_inputs_2026-09-19.sql; do
  echo; echo "================ $f"
  if [ "$MODE" = apply ]; then
    sed -E 's/^ROLLBACK;.*$/COMMIT;/' "$HERE/$f" | run_sql -f -
  else
    sed -E 's/^COMMIT;.*$/ROLLBACK;/' "$HERE/$f" | run_sql -f -
  fi
done

if [ "$MODE" != apply ]; then
  echo; echo "== DRY RUN finished, nothing was changed. Row counts to expect:"
  echo "   supplementstore: UPDATE 2, 1, 1, 1, 1"
  echo "   cross-product:   DELETE 1, 1, 1 / UPDATE 2 / UPDATE 1 / UPDATE 2   (0 = already applied)"
  echo "   value-score:     UPDATE 1, 2, 1, 2, 1, 1, 4, 1"
  echo "   Re-run with --apply to commit."
  exit 0
fi

# --- re-score + summary -----------------------------------------------------------------------------
echo; echo "================ recalculate-scores"
"$ROOT/ops/health-check/recalculate-scores.sh"

echo; echo "================ data-quality summary"
DQ="$(mktemp)"
curl -sS -m 90 -H "X-Admin-Token: $ADMIN_TOKEN" -o "$DQ" "$PROD_API_URL/api/admin/data-quality"
python3 - "$DQ" <<'PY'
import sys, json, collections
d = json.load(open(sys.argv[1]))
c = collections.Counter(x.split(" ")[0] for x in d["outliers"])
r = d["report"]
print(f"products with value score: {r['withValueScore']}/{r['totalProducts']}")
for k in ("GROUP_PROTEIN_OUTLIER", "VALUE_SCORE_SKIPPED", "PROTEIN_SOURCE_SUSPECT", "PROTEIN_TOO_HIGH",
          "CALORIE_IMPOSSIBLE", "IDENTITY_DRIFT", "PRICE_CHANGE_IMPLAUSIBLE"):
    print(f"  {k:26s} {c.get(k, 0)}")
PY
rm -f "$DQ"
