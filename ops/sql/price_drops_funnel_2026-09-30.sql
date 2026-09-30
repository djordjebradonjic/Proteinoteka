-- Read-only funnel: why so few products qualify for "najveći pad cene" (protein only).
-- Mirrors ListingFreshness.isConfirmedForDeals / isRecentPriceChange / price-drop logic.

WITH candidates AS (
    SELECT
        p.id,
        p.name,
        p.market,
        p.numeric_price,
        p.last_updated,
        p.missed_scrapes,
        s.name AS store_name,
        (SELECT COUNT(*) FROM price_history h WHERE h.product_id = p.id) AS history_rows,
        (SELECT h.numeric_price FROM price_history h WHERE h.product_id = p.id ORDER BY h.timestamp DESC LIMIT 1) AS prev_price,
        (SELECT h.timestamp FROM price_history h WHERE h.product_id = p.id ORDER BY h.timestamp DESC LIMIT 1) AS newest_history_ts
    FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE p.product_type = 'protein'
      AND p.market IN ('rs', 'hr')
      AND EXISTS (SELECT 1 FROM price_history h WHERE h.product_id = p.id)
)
SELECT
    market,
    COUNT(*) AS total_candidates,
    COUNT(*) FILTER (WHERE numeric_price IS NOT NULL AND numeric_price > 0) AS has_valid_price,
    COUNT(*) FILTER (WHERE prev_price IS NOT NULL AND prev_price > numeric_price) AS is_a_real_drop,
    COUNT(*) FILTER (WHERE last_updated >= now() - interval '8 days' AND (missed_scrapes IS NULL OR missed_scrapes = 0)) AS passes_deal_confirmation_8d,
    COUNT(*) FILTER (WHERE newest_history_ts >= now() - interval '7 days') AS passes_recent_drop_7d,
    COUNT(*) FILTER (
        WHERE prev_price IS NOT NULL AND prev_price > numeric_price
        AND last_updated >= now() - interval '8 days' AND (missed_scrapes IS NULL OR missed_scrapes = 0)
        AND newest_history_ts >= now() - interval '7 days'
    ) AS passes_all_freshness_checks
FROM candidates
GROUP BY market
ORDER BY market;

-- Detail: real drops that fail ONLY the freshness gates (stale deals we correctly hide now)
SELECT market, store_name, name, numeric_price, prev_price,
       round((prev_price - numeric_price) / prev_price * 100, 1) AS drop_pct,
       last_updated, missed_scrapes, newest_history_ts
FROM candidates
WHERE prev_price IS NOT NULL AND prev_price > numeric_price
  AND NOT (
        last_updated >= now() - interval '8 days' AND (missed_scrapes IS NULL OR missed_scrapes = 0)
        AND newest_history_ts >= now() - interval '7 days'
  )
ORDER BY drop_pct DESC
LIMIT 25;
