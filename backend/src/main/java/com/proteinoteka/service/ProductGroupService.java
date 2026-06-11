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

        // Group by brand (lowercase) + protein_source_normalized
        Map<String, List<Product>> byBrandSource = new HashMap<>();
        for (Product p : all) {
            if (p.getBrand() == null || p.getPrimaryWeightGrams() == null) continue;
            if (p.getGroupId() != null) continue; // skip already grouped
            String key = p.getBrand().toLowerCase().trim() + "|" + normalizeSource(p.getProteinSource());
            byBrandSource.computeIfAbsent(key, k -> new ArrayList<>()).add(p);
        }

        int created = 0;
        int skipped = 0;

        for (List<Product> brandSourceGroup : byBrandSource.values()) {
            // Cluster by weight (within ±10%)
            List<List<Product>> weightClusters = clusterByWeight(brandSourceGroup);

            for (List<Product> cluster : weightClusters) {
                Set<Long> storeIds = cluster.stream()
                        .filter(p -> p.getStore() != null)
                        .map(p -> p.getStore().getId())
                        .collect(Collectors.toSet());

                // Only create group if products span at least 2 stores
                if (storeIds.size() < 2) {
                    skipped++;
                    continue;
                }

                // Use the longest name as canonical name
                String canonicalName = cluster.stream()
                        .max(Comparator.comparingInt(p -> p.getName().length()))
                        .map(Product::getName)
                        .orElse("Unknown");

                String brand = cluster.get(0).getBrand();
                double avgWeight = cluster.stream()
                        .mapToDouble(Product::getPrimaryWeightGrams)
                        .average().orElse(0);

                ProductGroup group = new ProductGroup();
                group.setCanonicalName(canonicalName);
                group.setBrand(brand);
                group.setWeightGrams(avgWeight);
                group = productGroupRepository.save(group);

                for (Product p : cluster) {
                    p.setGroupId(group.getId());
                }
                productRepository.saveAll(cluster);
                created++;
            }
        }

        return Map.of("groupsCreated", created, "clustersTooSmall", skipped);
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

        ProductGroup group = new ProductGroup();
        group.setCanonicalName(canonicalName);
        group.setBrand(brand);
        group.setWeightGrams(avgWeight);
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

        List<ProductGroup> candidates = productGroupRepository.findByBrandIgnoreCase(brandNorm);
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
