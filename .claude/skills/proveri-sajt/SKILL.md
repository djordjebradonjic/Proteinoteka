---
name: proveri-sajt
description: Periodična provera da li su cene/podaci na Proteinoteci ispravni i ažurni i da li sajt (RS + HR) radi kako treba. Pokreće read-only health-check skriptu protiv produkcije i piše prioritizovan izveštaj na srpskom. Koristi kad korisnik traži "proveri sajt", "proveri podatke/cene", "health check", ili slično periodično proveravanje ispravnosti.
---

# Provera ispravnosti sajta i podataka (health check)

Ovaj skill pokreće `ops/health-check/check.py` — deterističku, isključivo read-only skriptu koja prikuplja činjenice sa produkcije (RS i HR): dostupnost sajta, sitemap/robots zdravlje, status poslednjih scrape-ova po prodavnici, `DataQualityService` coverage/outliers, i par direktnih SQL provera (scrape_log trend, missed_scrapes, price_history aktivnost, spot-check mrtvih linkova). Skripta sama ne donosi zaključke — to je tvoj posao: pročitaj JSON i napiši ljudski izveštaj.

## Koraci

1. **Proveri da `.env` postoji.** Ako `ops/health-check/.env` ne postoji, reci korisniku da kopira `.env.example` u `.env` i popuni `ADMIN_TOKEN`/`DATABASE_URL`, pa stani — ne pokušavaj da nagađaš kredencijale.

2. **Pokreni skriptu:**
   ```
   cd ops/health-check && python3 check.py
   ```
   Ako padne zbog nedostajućeg `requests` paketa ili `psql` binarnog fajla, javi korisniku tačnu grešku i predloži instalaciju (`pip install requests`, odn. `apt install postgresql-client`) — ne pokušavaj zaobilazna rešenja.

3. **Učitaj i prethodni run** ako postoji (`ops/health-check/history/*.json`, pretposlednji fajl po imenu — poslednji je onaj koji je skripta upravo napisala) radi poređenja trenda (raste li broj BLOCKED runova, missed_scrapes, outlier-a; pada li broj URL-ova u sitemap-u).

4. **Protumači nalaze.** Ne prepisuj sirov JSON — svaki nalaz stavi u kontekst:
   - `homepage_grid.*.empty_grid_suspected: true` na golom homepage-u (bez filtera) je **uvek** hitno — to je poznati ISR-cache-poisoning obrazac (prazan grid keširan do 6h). Prva akcija: `POST /api/revalidate` sa `Authorization: Bearer <ADMIN_TOKEN>`.
   - `robots.new_disallow_rules` koji nije prazan je **uvek** vredan pažnje — mogao je slučajno blokirati prave stranice (ovo se već dešavalo).
   - `sitemap.*.drop_pct_vs_previous_run` veći od ~15% je sumnjiv (mogući tihi fallback na prazan sitemap zbog pada products fetch-a).
   - `scrape_status` + `db.scrape_log_trend_14d`: prodavnica je 🔴 ako nema nijedan SUCCESS u poslednjih 14 dana (blizu ili preko `STALE_DAYS` praga koji `checkOutliers()` koristi), 🟡 ako ima BLOCKED/FAILED/PARTIAL zapise u poslednjih 14 dana ali se i dalje povremeno uspešno skrejpuje. Iskoristi `last_non_success_per_store[store].error_message` da kažeš TAČNO zašto (firewall/anti-bot stranica, istekao SSL sertifikat, no-products) — ne samo "ima problem".
   - `data_quality.*.outliers` — grupiši po tipu (STALE_PRODUCT, CALORIE_IMPOSSIBLE, PROTEIN_TOO_HIGH/LOW, itd.), reci koliko ih ima i iz koje prodavnice najviše dolazi (ako je 90% STALE_PRODUCT iz jedne prodavnice, to je posledica BLOCKED scrape-a te prodavnice, ne 60 nezavisnih problema — poveži ih).
   - `db.missed_scrapes.products_with_at_least_2_misses` — ovi proizvodi nestaju iz kataloga posle sledećeg promašaja (3-strike pravilo); ako je broj visok i raste, to je rani signal da neka prodavnica gubi bitku sa anti-bot zaštitom.
   - `db.price_history_activity_7d_by_store` — prodavnica sa SUCCESS scrape statusom ali 0 novih `price_history` redova nedeljama nije nužno greška (cene se možda stvarno nisu menjale), ali zaslužuje pomen ako traje predugo (npr. >3 nedelje) jer bi mogla značiti da se cene tiho ne upisuju.
   - `dead_link_spotcheck` — svaki `ok: false` je mrtav link koji čeka na nedeljni `DeadLinkCheckService` prolaz (subota 04:00); pomeni ga kao 🟡, ne 🔴 (sistem će ga sam očistiti u roku od nedelju dana).

5. **Napiši izveštaj na srpskom**, grupisan ovako:
   - 🔴 **Hitno** — prazan homepage grid, sajt/sitemap/robots/DB/admin API nedostupni, prodavnica bez uspešnog scrape-a 14+ dana.
   - 🟡 **Treba pažnju** — BLOCKED/FAILED/PARTIAL runovi (sa razlogom), missed_scrapes raste, price_history ćuti predugo za neku prodavnicu, mrtvi linkovi, outlier count raste u odnosu na prošli run, nove robots.txt Disallow linije.
   - 🟢 **U redu** — jedna-dve rečenice, bez nabrajanja.

   Za svaku 🔴/🟡 stavku predloži konkretnu sledeću akciju, po mogućstvu tačnu komandu, npr.:
   `POST /api/admin/scrape/{store} sa X-Admin-Token da odmah ponovo probaš scrape za <prodavnicu>`.

6. **Ne izvršavaj sam nikakve promene/re-scrape pozive.** Samo predloži. Ako korisnik u nastavku razgovora zatraži da nešto od predloženog i uradiš (npr. pozoveš re-scrape endpoint za jednu prodavnicu), to je u redu da uradiš — ali ne bez traženja.

## Napomena o bezbednosti

`ops/health-check/.env` sadrži produkcijski admin token i lozinku baze u plaintext-u — nikad ga ne prikazuj u izveštaju niti ga citiraj napolje (npr. u artifact ili poruku koja izlazi iz ovog razgovora).
