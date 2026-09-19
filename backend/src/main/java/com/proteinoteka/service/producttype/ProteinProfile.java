package com.proteinoteka.service.producttype;

import com.proteinoteka.model.Product;
import com.proteinoteka.service.BaseScraperEnricher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Protein powder rules. This is the logic that used to be inlined in
 * {@code ScraperService.saveOrUpdateProduct}, moved here unchanged — do not "improve" it as part of
 * unrelated work: it is covered by {@code ProteinProfileTest} so protein scraping keeps behaving
 * exactly as before.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProteinProfile implements ProductTypeProfile {

    private final BaseScraperEnricher baseEnricher;

    @Override
    public String code() {
        return ProductTypes.PROTEIN;
    }

    @Override
    public Optional<String> rejectReason(Product scraped, boolean categoryTrusted) {
        if (baseEnricher.isNonProteinProduct(scraped.getName())) {
            return Optional.of("not a protein supplement");
        }
        // Mass gainers and snacks with too little protein (gainers, bars, spreads)
        if (scraped.getProteinPer100g() != null && scraped.getProteinPer100g() < 25.0) {
            return Optional.of("protein " + scraped.getProteinPer100g()
                    + "g/100g too low for a protein supplement");
        }
        return Optional.empty();
    }

    @Override
    public void sanitize(Product scraped, String storeName) {
        if (scraped.getProteinPer100g() != null) {
            if (scraped.getProteinPer100g() < 15 || scraped.getProteinPer100g() > 100) {
                log.warn("[{}] Invalid protein value for '{}': {}g/100g — setting null",
                        storeName, scraped.getName(), scraped.getProteinPer100g());
                scraped.setProteinPer100g(null);
            }
        }
        if (scraped.getSugarPer100g() != null && scraped.getSugarPer100g() > 100) {
            log.warn("[{}] Invalid sugar value for '{}': {}g/100g — setting null",
                    storeName, scraped.getName(), scraped.getSugarPer100g());
            scraped.setSugarPer100g(null);
        }
        if (scraped.getFatPer100g() != null && scraped.getFatPer100g() > 100) {
            log.warn("[{}] Invalid fat value for '{}': {}g/100g — setting null",
                    storeName, scraped.getName(), scraped.getFatPer100g());
            scraped.setFatPer100g(null);
        }
        if (scraped.getCaloriePer100g() != null && scraped.getCaloriePer100g() > 900) {
            log.warn("[{}] Invalid calorie value for '{}': {}kcal/100g — setting null",
                    storeName, scraped.getName(), scraped.getCaloriePer100g());
            scraped.setCaloriePer100g(null);
        }
    }

    @Override
    public double minPrice(String currency) {
        return "EUR".equals(currency) ? 5.0 : 1000.0;
    }

    // If protein is null (the listing carries no nutrition and the detail page was skipped),
    // take it from the stored row — the price is always updated for existing products.
    @Override
    public boolean restoreFromStored(Product scraped, Optional<Product> stored, String storeName) {
        if (scraped.getProteinPer100g() != null && scraped.getProteinPer100g() >= 15) return true;

        if (stored.isPresent() && stored.get().getProteinPer100g() != null
                && stored.get().getProteinPer100g() >= 15) {
            Product fb = stored.get();
            scraped.setProteinPer100g(fb.getProteinPer100g());
            if (scraped.getFatPer100g() == null)         scraped.setFatPer100g(fb.getFatPer100g());
            if (scraped.getSugarPer100g() == null)       scraped.setSugarPer100g(fb.getSugarPer100g());
            if (scraped.getCaloriePer100g() == null)     scraped.setCaloriePer100g(fb.getCaloriePer100g());
            if (scraped.getProteinSource() == null)      scraped.setProteinSource(fb.getProteinSource());
            if (scraped.getPrimaryWeightGrams() == null) scraped.setPrimaryWeightGrams(fb.getPrimaryWeightGrams());
            log.info("[{}] '{}' — protein null from listing, restored from DB ({}g/100g)",
                    storeName, scraped.getName(), scraped.getProteinPer100g());
            return true;
        }
        log.warn("[{}] Skipping '{}' - no valid protein data (protein={})",
                storeName, scraped.getName(), scraped.getProteinPer100g());
        return false;
    }

    // Update protein if it is null or changed by more than 3g/100g (catches reformulations and
    // corrects wrong old values); fat/sugar/kcal/source only fill gaps.
    @Override
    public void mergeInto(Product existing, Product scraped) {
        if (scraped.getProteinPer100g() != null && scraped.getProteinPer100g() <= 95
                && scraped.getProteinPer100g() >= 15) {
            Double existingProtein = existing.getProteinPer100g();
            if (existingProtein == null || existingProtein < 15
                    || Math.abs(scraped.getProteinPer100g() - existingProtein) > 3.0) {
                existing.setProteinPer100g(scraped.getProteinPer100g());
            }
        }
        if (existing.getFatPer100g() == null && scraped.getFatPer100g() != null)
            existing.setFatPer100g(scraped.getFatPer100g());
        if (existing.getSugarPer100g() == null && scraped.getSugarPer100g() != null)
            existing.setSugarPer100g(scraped.getSugarPer100g());
        boolean kcalSuspect = existing.getCaloriePer100g() != null && existing.getCaloriePer100g() < 200;
        if ((existing.getCaloriePer100g() == null || kcalSuspect) && scraped.getCaloriePer100g() != null
                && scraped.getCaloriePer100g() >= 200)
            existing.setCaloriePer100g(scraped.getCaloriePer100g());
        if (existing.getProteinSource() == null && scraped.getProteinSource() != null)
            existing.setProteinSource(scraped.getProteinSource());
    }

    // Protein products need protein+fat+sugar+calorie+proteinSource filled; non-protein names never
    // get proteinSource from AI, so protein+fat is enough for those. Stores that publish nutrition as
    // images only ever yield the core fields, so protein+fat is all that can be expected there.
    @Override
    public boolean isDetailComplete(Product stored, boolean nutritionInImages) {
        if (stored.getProteinPer100g() == null || stored.getFatPer100g() == null) return false;
        if (nutritionInImages) return true;
        return baseEnricher.isNonProteinProduct(stored.getName())
                || (stored.getSugarPer100g() != null
                && stored.getCaloriePer100g() != null && stored.getCaloriePer100g() >= 200
                && stored.getProteinSource() != null);
    }
}
