#!/usr/bin/env bash
# Triggers POST /api/admin/recalculate-scores on production and nothing else.
# Reads PROD_API_URL and ADMIN_TOKEN from ops/health-check/.env; the token is never printed.
# Idempotent: re-scores every product with the deployed ValueScoreCalculator and clears the
# score of products that can't be scored fairly (see CLAUDE.md "Value score").
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
set -a
# shellcheck disable=SC1091
. "$HERE/.env"
set +a

: "${PROD_API_URL:?PROD_API_URL missing in .env}"
: "${ADMIN_TOKEN:?ADMIN_TOKEN missing in .env}"

curl -sS -X POST --max-time 120 \
  -H "X-Admin-Token: $ADMIN_TOKEN" \
  -w '\nHTTP %{http_code}\n' \
  "$PROD_API_URL/api/admin/recalculate-scores"
