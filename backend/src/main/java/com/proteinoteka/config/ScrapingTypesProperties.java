package com.proteinoteka.config;

import com.proteinoteka.service.producttype.ProductTypes;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Which product types are scraped, and where.
 *
 * <pre>
 * scraping.types.enabled=protein,creatine        (env SCRAPING_TYPES_ENABLED; default: protein only)
 * scraping.types.stores.creatine=GymBeam,FitLab  (env SCRAPING_TYPES_STORES_CREATINE; empty = every store)
 * </pre>
 *
 * The first is the kill switch for a whole family, the second stages a rollout store by store.
 * Protein is always on: it is the site's core data and turning it off by a typo would blank the catalogue.
 */
@Component
@ConfigurationProperties(prefix = "scraping.types")
@Getter
@Setter
public class ScrapingTypesProperties {

    private List<String> enabled = new ArrayList<>(List.of(ProductTypes.PROTEIN));

    private Map<String, List<String>> stores = new HashMap<>();

    public boolean isEnabled(String productType, String storeName) {
        if (ProductTypes.PROTEIN.equals(productType)) return true;
        if (!enabled.contains(productType)) return false;
        List<String> only = stores.get(productType);
        return only == null || only.isEmpty() || only.contains(storeName);
    }
}
