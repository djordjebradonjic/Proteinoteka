package com.proteinoteka.service;

import com.proteinoteka.dto.StorePriceDTO;
import com.proteinoteka.model.Product;
import com.proteinoteka.model.ProductGroup;
import com.proteinoteka.repository.ProductGroupRepository;
import com.proteinoteka.repository.ProductRepository;
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
                    product.getCanonicalSlug()
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
                            p.getProteinSource(), p.getCanonicalSlug()
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

        // Group by market + brand (lowercase) + protein_source_normalized
        Map<String, List<Product>> byBrandSource = new HashMap<>();
        for (Product p : all) {
            if (p.getBrand() == null || p.getPrimaryWeightGrams() == null) continue;
            if (p.getGroupId() != null) continue;
            String market = p.getMarket() != null ? p.getMarket() : "rs";
            String key = market + "|" + p.getBrand().toLowerCase().trim() + "|" + normalizeSource(p.getProteinSource());
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

        return Map.of("groupsCreated", created, "clustersTooSmall", skipped);
    }

    /**
     * Splits a weight-clustered list into sub-lists by product line name similarity.
     * Prevents merging of distinct product lines that share brand+weight+source
     * (e.g. "Iso Cool" vs "Iso Sensation 93" from Ultimate Nutrition).
     */
    private List<List<Product>> splitByProductLine(List<Product> cluster) {
        List<List<Product>> lines = new ArrayList<>();

        for (Product p : cluster) {
            Set<String> pWords = productLineWords(p.getName(), p.getBrand());
            boolean placed = false;

            for (List<Product> line : lines) {
                Set<String> lineWords = productLineWords(line.get(0).getName(), line.get(0).getBrand());
                if (hasWordOverlap(pWords, lineWords)) {
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

    private static final Set<String> NAME_STOPWORDS = Set.of(
            "whey", "protein", "proteini", "isolate", "izolat", "kazein", "casein",
            "concentrate", "koncentrat", "hydrolysate", "hidrolizat", "vegan", "plant",
            "100", "pure", "natural", "ukus", "flavor", "flavour", "vanilla", "vanila",
            "chocolate", "cokolada", "sport", "nutrition", "the", "and", "with", "pro",
            "ultra", "gold", "lean", "diet", "basic", "complete", "premium", "iso",
            "zero", "raw", "blend", "fusion", "powder", "instant", "formula"
    );

    private Set<String> productLineWords(String name, String brand) {
        if (name == null) return Collections.emptySet();
        String lower = name.toLowerCase();
        if (brand != null) lower = lower.replace(brand.toLowerCase().trim(), "");
        lower = lower.replaceAll("\\d+[.,]?\\d*\\s*(kg|g|gr\\b|lb\\b)", "");
        lower = lower.replaceAll("[^a-zčćšđž\\s]", " ");
        Set<String> words = new HashSet<>();
        for (String w : lower.split("\\s+")) {
            if (w.length() > 2 && !NAME_STOPWORDS.contains(w)) words.add(w);
        }
        return words;
    }

    private boolean hasWordOverlap(Set<String> a, Set<String> b) {
        if (a.isEmpty() || b.isEmpty()) return true; // can't distinguish → assume same line
        Set<String> intersection = new HashSet<>(a);
        intersection.retainAll(b);
        return !intersection.isEmpty();
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

    // ── Auto-assign: called from scraper when a new product is saved ──────────

    @Transactional
    public void tryAutoAssign(Product product) {
        if (product.getBrand() == null || product.getPrimaryWeightGrams() == null) return;
        if (product.getGroupId() != null) return;

        String brandNorm = product.getBrand().toLowerCase().trim();
        String sourceNorm = normalizeSource(product.getProteinSource());
        double weight = product.getPrimaryWeightGrams();
        String market = product.getMarket() != null ? product.getMarket() : "rs";

        List<ProductGroup> candidates = productGroupRepository.findByBrandIgnoreCaseAndMarket(brandNorm, market);
        List<ProductGroup> matches = candidates.stream()
                .filter(g -> {
                    if (g.getWeightGrams() == null) return false;
                    double ratio = weight / g.getWeightGrams();
                    return ratio >= 0.90 && ratio <= 1.10;
                })
                .filter(g -> {
                    // Check source compatibility by looking at existing members
                    List<Product> members = productRepository.findByGroupId(g.getId());
                    if (members.isEmpty()) return true;
                    String existingSource = normalizeSource(members.get(0).getProteinSource());
                    return existingSource.equals(sourceNorm);
                })
                .filter(g -> {
                    // A price-comparison group should have at most one listing per store —
                    // reject groups that already contain a product from this product's store,
                    // since the brand+weight+source heuristic alone can't tell apart two
                    // different product lines from the same brand/store (e.g. "Battery Complete
                    // Whey" vs "Battery Whey Protein" at the same weight).
                    if (product.getStore() == null) return true;
                    List<Product> members = productRepository.findByGroupId(g.getId());
                    return members.stream().noneMatch(m ->
                            m.getStore() != null && m.getStore().getId().equals(product.getStore().getId()));
                })
                .toList();

        if (matches.size() == 1) {
            product.setGroupId(matches.get(0).getId());
            productRepository.save(product);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String normalizeSource(String source) {
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
                if (p.getPrimaryWeightGrams() <= refWeight * 1.10) {
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
