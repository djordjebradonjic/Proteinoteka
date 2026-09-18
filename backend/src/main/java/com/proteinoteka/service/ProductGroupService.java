package com.proteinoteka.service;

import com.proteinoteka.dto.StorePriceDTO;
import com.proteinoteka.model.Product;
import com.proteinoteka.model.ProductGroup;
import com.proteinoteka.repository.ProductGroupRepository;
import com.proteinoteka.repository.ProductRepository;
import com.proteinoteka.util.ProductLineMatcher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductGroupService {

    private final ProductRepository productRepository;
    private final ProductGroupRepository productGroupRepository;

    /**
     * Two listings are the same pack only if their weights are within this fraction. Real cross-store
     * noise is ~1-2% (2270/2260/2300, 900/908, 1800/1816); 5% keeps that together while separating
     * genuinely different pack sizes (Gold Standard 2020g vs 2270g is 12%). The previous 10% window
     * also let a chain of members drift apart.
     */
    public static final double WEIGHT_TOLERANCE = 0.05;

    /**
     * Protein type used for grouping. Beef as the protein source is its own family (labels flip
     * between "beef" and "hydrolysate" for the same Monster Beef product) and an explicit "hydro"
     * in the name wins over a whey label, same as the value score.
     */
    public static String groupingSource(Product p) {
        if (ValueScoreCalculator.beefContent(p) == ValueScoreCalculator.BeefContent.PRIMARY) return "beef";
        return normalizeSource(ValueScoreCalculator.effectiveSource(p));
    }

    /** Average of the members' real weights (never the group's stored weight, which goes stale). */
    public static double averageWeight(List<Product> members) {
        return members.stream()
                .map(Product::getPrimaryWeightGrams)
                .filter(w -> w != null && w > 0)
                .mapToDouble(Double::doubleValue)
                .average().orElse(0);
    }

    /**
     * Single source of truth for "does this product belong in this group" — used by auto-assignment
     * and by the audit so they can never disagree. Same market and brand, same pack size (against
     * the members' actual average weight), same protein type, same product line, and no other
     * listing from the same store (a comparison group has at most one listing per store).
     */
    public static boolean fitsGroup(Product p, ProductGroup g, List<Product> members) {
        if (members.isEmpty() || p.getBrand() == null || p.getPrimaryWeightGrams() == null
                || p.getPrimaryWeightGrams() <= 0 || g.getBrand() == null) return false;
        String market = p.getMarket() != null ? p.getMarket() : "rs";
        if (!market.equalsIgnoreCase(g.getMarket() != null ? g.getMarket() : "rs")) return false;
        if (!p.getBrand().trim().equalsIgnoreCase(g.getBrand().trim())) return false;

        double avg = averageWeight(members);
        if (avg <= 0 || Math.abs(p.getPrimaryWeightGrams() - avg) / avg > WEIGHT_TOLERANCE) return false;

        if (!groupingSource(p).equals(groupingSource(members.get(0)))) return false;

        if (p.getStore() != null && members.stream().anyMatch(m ->
                m.getStore() != null && m.getStore().getId().equals(p.getStore().getId()))) return false;

        // brand+weight+source alone can't tell apart distinct product lines sold under one brand
        // (e.g. "Iso Cool" vs "Iso Sensation 93", or a store's private-label "Rice Protein" vs
        // "Vegan Blend"): require a shared distinguishing word, or both fully generic.
        return members.stream().anyMatch(m ->
                ProductLineMatcher.sameProductLine(p.getName(), p.getBrand(), m.getName(), m.getBrand()));
    }

    // ── Public: get store prices for a product ────────────────────────────────

    public List<StorePriceDTO> getStorePrices(Long productId) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return List.of();

        Long groupId = product.getGroupId();
        if (groupId == null) {
            return List.of(new StorePriceDTO(
                    product.getId(),
                    product.getStore() != null ? product.getStore().getName() : "Unknown",
                    product.getPrice(),
                    product.getNumericPrice(),
                    product.getName(),
                    product.getPrimaryWeightGrams(),
                    product.getProteinSource(),
                    product.getCanonicalSlug(),
                    product.getUrl()
            ));
        }

        // Return cheapest per store (handles same-store multiple flavors in one group)
        Map<String, StorePriceDTO> cheapestPerStore = new LinkedHashMap<>();
        productRepository.findByGroupId(groupId).stream()
                .sorted(Comparator.comparingDouble(p -> p.getNumericPrice() != null ? p.getNumericPrice() : Double.MAX_VALUE))
                .forEach(p -> {
                    String store = p.getStore() != null ? p.getStore().getName() : "Unknown";
                    cheapestPerStore.putIfAbsent(store, new StorePriceDTO(
                            p.getId(), store, p.getPrice(), p.getNumericPrice(),
                            p.getName(), p.getPrimaryWeightGrams(),
                            p.getProteinSource(), p.getCanonicalSlug(),
                            p.getUrl()
                    ));
                });

        return cheapestPerStore.values().stream()
                .sorted(Comparator.comparingDouble(s -> s.numericPrice() != null ? s.numericPrice() : Double.MAX_VALUE))
                .toList();
    }

    // ── Admin: auto-generate groups from matching algorithm ───────────────────

    @Transactional
    public Map<String, Object> autoGenerateGroups() {
        List<Product> all = productRepository.findAll();

        // First let ungrouped products join EXISTING groups. Without this a product that was
        // scraped before its group existed (or that the scraper's one-shot tryAutoAssign missed)
        // stays ungrouped forever, and generating new groups from leftovers creates duplicates
        // of groups that already exist.
        int attached = 0;
        for (Product p : all) {
            if (p.getGroupId() == null && p.getBrand() != null && p.getPrimaryWeightGrams() != null) {
                tryAutoAssign(p);
                if (p.getGroupId() != null) attached++;
            }
        }

        // Group by market + brand (lowercase) + protein type
        Map<String, List<Product>> byBrandSource = new HashMap<>();
        for (Product p : all) {
            if (p.getBrand() == null || p.getPrimaryWeightGrams() == null) continue;
            if (p.getGroupId() != null) continue;
            String market = p.getMarket() != null ? p.getMarket() : "rs";
            String key = market + "|" + p.getBrand().toLowerCase().trim() + "|" + groupingSource(p);
            byBrandSource.computeIfAbsent(key, k -> new ArrayList<>()).add(p);
        }

        int created = 0;
        int skipped = 0;

        for (List<Product> brandSourceGroup : byBrandSource.values()) {
            List<List<Product>> weightClusters = clusterByWeight(brandSourceGroup);

            for (List<Product> weightCluster : weightClusters) {
                // Further split by product line name (prevents Iso Cool + Iso Sensation merging)
                List<List<Product>> lineGroups = splitByProductLine(weightCluster);

                for (List<Product> cluster : lineGroups) {
                    // Deduplicate: keep at most one product per store (best value score wins)
                    Map<Long, Product> bestPerStore = new LinkedHashMap<>();
                    for (Product p : cluster) {
                        if (p.getStore() == null) continue;
                        Long storeId = p.getStore().getId();
                        Product existing = bestPerStore.get(storeId);
                        if (existing == null
                                || (p.getValueScore() != null && (existing.getValueScore() == null
                                        || p.getValueScore() > existing.getValueScore()))) {
                            bestPerStore.put(storeId, p);
                        }
                    }

                    List<Product> deduped = new ArrayList<>(bestPerStore.values());

                    if (bestPerStore.size() < 2) {
                        skipped++;
                        continue;
                    }

                    String canonicalName = deduped.stream()
                            .max(Comparator.comparingInt(p -> p.getName().length()))
                            .map(Product::getName).orElse("Unknown");
                    String brand = deduped.get(0).getBrand();
                    double avgWeight = deduped.stream()
                            .mapToDouble(Product::getPrimaryWeightGrams).average().orElse(0);

                    String market = deduped.get(0).getMarket() != null ? deduped.get(0).getMarket() : "rs";

                    ProductGroup group = new ProductGroup();
                    group.setCanonicalName(canonicalName);
                    group.setBrand(brand);
                    group.setWeightGrams(avgWeight);
                    group.setMarket(market);
                    group = productGroupRepository.save(group);

                    for (Product p : deduped) {
                        p.setGroupId(group.getId());
                    }
                    productRepository.saveAll(deduped);
                    created++;
                }
            }
        }

        return Map.of("groupsCreated", created, "clustersTooSmall", skipped, "productsAttachedToExistingGroups", attached);
    }

    /**
     * Splits a weight-clustered list into sub-lists by product line name similarity.
     * Prevents merging of distinct product lines that share brand+weight+source
     * (e.g. "Iso Cool" vs "Iso Sensation 93" from Ultimate Nutrition).
     */
    private List<List<Product>> splitByProductLine(List<Product> cluster) {
        List<List<Product>> lines = new ArrayList<>();

        for (Product p : cluster) {
            boolean placed = false;
            for (List<Product> line : lines) {
                Product first = line.get(0);
                if (ProductLineMatcher.sameProductLine(p.getName(), p.getBrand(), first.getName(), first.getBrand())) {
                    line.add(p);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                List<Product> newLine = new ArrayList<>();
                newLine.add(p);
                lines.add(newLine);
            }
        }
        return lines;
    }

    // ── Admin: list all groups with their products ────────────────────────────

    public List<Map<String, Object>> listGroups() {
        return productGroupRepository.findAll().stream()
                .map(group -> {
                    List<Product> members = productRepository.findByGroupId(group.getId());
                    List<Map<String, Object>> products = members.stream()
                            .sorted(Comparator.comparingDouble(p -> p.getNumericPrice() != null ? p.getNumericPrice() : Double.MAX_VALUE))
                            .map(p -> {
                                Map<String, Object> pm = new LinkedHashMap<>();
                                pm.put("id", p.getId());
                                pm.put("name", p.getName());
                                pm.put("store", p.getStore() != null ? p.getStore().getName() : "Unknown");
                                pm.put("price", p.getNumericPrice());
                                pm.put("weight", p.getPrimaryWeightGrams());
                                pm.put("source", p.getProteinSource());
                                return pm;
                            }).toList();

                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("groupId", group.getId());
                    m.put("canonicalName", group.getCanonicalName());
                    m.put("brand", group.getBrand());
                    m.put("weightGrams", group.getWeightGrams());
                    m.put("storeCount", products.stream()
                            .map(p -> p.get("store")).collect(Collectors.toSet()).size());
                    m.put("products", products);
                    return m;
                })
                .sorted(Comparator.comparingInt(m -> -((Integer) m.get("storeCount"))))
                .toList();
    }

    // ── Admin: manually confirm a group ──────────────────────────────────────

    @Transactional
    public ProductGroup confirmGroup(List<Long> productIds, String canonicalName) {
        List<Product> products = productRepository.findAllById(productIds);
        if (products.isEmpty()) throw new IllegalArgumentException("No products found");

        String brand = products.stream()
                .filter(p -> p.getBrand() != null)
                .map(Product::getBrand)
                .findFirst().orElse(null);
        double avgWeight = products.stream()
                .filter(p -> p.getPrimaryWeightGrams() != null)
                .mapToDouble(Product::getPrimaryWeightGrams)
                .average().orElse(0);
        String market = products.stream()
                .filter(p -> p.getMarket() != null)
                .map(Product::getMarket)
                .findFirst().orElse("rs");

        ProductGroup group = new ProductGroup();
        group.setCanonicalName(canonicalName);
        group.setBrand(brand);
        group.setWeightGrams(avgWeight);
        group.setMarket(market);
        group = productGroupRepository.save(group);

        for (Product p : products) {
            p.setGroupId(group.getId());
        }
        productRepository.saveAll(products);
        return group;
    }

    // ── Admin: delete a group (unassigns all products) ────────────────────────

    @Transactional
    public void deleteGroup(Long groupId) {
        List<Product> members = productRepository.findByGroupId(groupId);
        members.forEach(p -> p.setGroupId(null));
        productRepository.saveAll(members);
        productGroupRepository.deleteById(groupId);
    }

    // ── Auto-assign: called from scraper when a product is saved, and by autoGenerateGroups ──

    @Transactional
    public void tryAutoAssign(Product product) {
        if (product.getBrand() == null || product.getPrimaryWeightGrams() == null) return;
        if (product.getGroupId() != null) return;

        String market = product.getMarket() != null ? product.getMarket() : "rs";
        List<ProductGroup> candidates = productGroupRepository
                .findByBrandIgnoreCaseAndMarket(product.getBrand().toLowerCase().trim(), market);

        List<ProductGroup> matches = new ArrayList<>();
        Map<Long, List<Product>> membersByGroup = new HashMap<>();
        for (ProductGroup g : candidates) {
            List<Product> members = productRepository.findByGroupId(g.getId());
            if (fitsGroup(product, g, members)) {
                matches.add(g);
                membersByGroup.put(g.getId(), members);
            }
        }

        // Ambiguous (two groups fit — usually a duplicate group for the same product): leave it
        // for a human / the audit rather than guess.
        if (matches.size() == 1) {
            ProductGroup g = matches.get(0);
            product.setGroupId(g.getId());
            productRepository.save(product);
            List<Product> all = new ArrayList<>(membersByGroup.get(g.getId()));
            all.add(product);
            refreshWeight(g, all);
        }
    }

    // ── Admin: recompute group metadata and drop groups that can't compare anything ──────────

    /**
     * Group weight/name were only set at creation, so they went stale as members changed (a group
     * named "…1kg" whose members are all 900g). Recomputes each group's weight from its members and
     * dissolves groups with fewer than two listings (nothing to compare). Idempotent.
     */
    @Transactional
    public Map<String, Object> refreshGroupMetadata() {
        int weightsUpdated = 0;
        int dissolved = 0;
        for (ProductGroup g : productGroupRepository.findAll()) {
            List<Product> members = productRepository.findByGroupId(g.getId());
            if (members.size() < 2) {
                members.forEach(p -> p.setGroupId(null));
                productRepository.saveAll(members);
                productGroupRepository.deleteById(g.getId());
                dissolved++;
                continue;
            }
            if (refreshWeight(g, members)) weightsUpdated++;
        }
        return Map.of("weightsUpdated", weightsUpdated, "groupsDissolved", dissolved);
    }

    private boolean refreshWeight(ProductGroup g, List<Product> members) {
        double avg = averageWeight(members);
        if (avg <= 0) return false;
        if (g.getWeightGrams() != null && Math.abs(g.getWeightGrams() - avg) / avg <= 0.005) return false;
        g.setWeightGrams(avg);
        productGroupRepository.save(g);
        return true;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static String normalizeSource(String source) {
        if (source == null) return "unknown";
        // Treat blend and whey_concentrate as the same family — scraper ambiguity
        if ("blend".equals(source) || "whey_concentrate".equals(source)) return "whey_base";
        return source;
    }

    private List<List<Product>> clusterByWeight(List<Product> products) {
        List<Product> sorted = products.stream()
                .sorted(Comparator.comparingDouble(p -> p.getPrimaryWeightGrams() != null ? p.getPrimaryWeightGrams() : 0))
                .toList();

        List<List<Product>> clusters = new ArrayList<>();
        List<Product> current = new ArrayList<>();

        for (Product p : sorted) {
            if (p.getPrimaryWeightGrams() == null) continue;
            if (current.isEmpty()) {
                current.add(p);
            } else {
                double refWeight = current.get(0).getPrimaryWeightGrams();
                if (p.getPrimaryWeightGrams() <= refWeight * (1 + WEIGHT_TOLERANCE)) {
                    current.add(p);
                } else {
                    clusters.add(new ArrayList<>(current));
                    current.clear();
                    current.add(p);
                }
            }
        }
        if (!current.isEmpty()) clusters.add(current);
        return clusters;
    }
}
