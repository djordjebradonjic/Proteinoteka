package com.proteinoteka;

import com.proteinoteka.model.Product;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.ListJoin;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.Arrays;
import java.util.List;

public class ProductSpecifications {

    public static Specification<Product> hasName(String name) {
        return (root, query, cb) -> name == null || name.isEmpty() ?
                cb.conjunction() : cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%");
    }

    public static Specification<Product> hasStoreName(String storeNames) {
        return (root, query, cb) -> {
            if (storeNames == null || storeNames.isEmpty()) return cb.conjunction();
            Predicate[] predicates = Arrays.stream(storeNames.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(s -> cb.equal(cb.lower(root.get("store").get("name")), s.toLowerCase()))
                    .toArray(Predicate[]::new);
            return predicates.length == 1 ? predicates[0] : cb.or(predicates);
        };
    }

    public static Specification<Product> hasBrand(String brands) {
        return (root, query, cb) -> {
            if (brands == null || brands.isEmpty()) return cb.conjunction();
            Predicate[] predicates = Arrays.stream(brands.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(s -> cb.equal(cb.lower(root.get("brand")), s.toLowerCase()))
                    .toArray(Predicate[]::new);
            return predicates.length == 1 ? predicates[0] : cb.or(predicates);
        };
    }

    public static Specification<Product> priceGreaterThan(Double minPrice) {
        return (root, query, cb) -> minPrice == null ?
                cb.conjunction() : cb.greaterThanOrEqualTo(root.get("numericPrice"), minPrice);
    }

    public static Specification<Product> priceLessThan(Double maxPrice) {
        return (root, query, cb) -> maxPrice == null ?
                cb.conjunction() : cb.lessThanOrEqualTo(root.get("numericPrice"), maxPrice);
    }

    public static Specification<Product> hasFlavour(String flavours) {
        return (root, query, cb) -> {
            if (flavours == null || flavours.isEmpty()) return cb.conjunction();
            query.distinct(true);
            ListJoin<Product, String> join = root.joinList("flavours", JoinType.INNER);
            String[] parts = flavours.split(",");
            if (parts.length == 1)
                return cb.equal(cb.lower(join), parts[0].trim().toLowerCase());
            Predicate[] predicates = Arrays.stream(parts)
                    .map(f -> cb.equal(cb.lower(join), f.trim().toLowerCase()))
                    .toArray(Predicate[]::new);
            return cb.or(predicates);
        };
    }

    public static Specification<Product> hasProteinSource(String proteinSources) {
        return (root, query, cb) -> {
            if (proteinSources == null || proteinSources.isEmpty()) return cb.conjunction();
            Predicate[] predicates = Arrays.stream(proteinSources.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(s -> cb.equal(root.get("proteinSource"), s))
                    .toArray(Predicate[]::new);
            return predicates.length == 1 ? predicates[0] : cb.or(predicates);
        };
    }

    public static Specification<Product> hasProductType(String productType) {
        return (root, query, cb) -> cb.equal(root.get("productType"),
                productType == null || productType.isEmpty() ? "protein" : productType);
    }

    public static Specification<Product> hasMarket(String market) {
        return (root, query, cb) -> market == null || market.isEmpty() ?
                cb.equal(root.get("market"), "rs") : cb.equal(root.get("market"), market);
    }

    public static Specification<Product> hasWeightRange(String ranges) {
        return (root, query, cb) -> {
            if (ranges == null || ranges.isEmpty()) return cb.conjunction();
            Predicate[] predicates = Arrays.stream(ranges.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(range -> {
                        String[] parts = range.split("-");
                        if (parts.length != 2) return cb.conjunction();
                        try {
                            double min = Double.parseDouble(parts[0]);
                            double max = Double.parseDouble(parts[1]);
                            return cb.and(
                                    cb.greaterThanOrEqualTo(root.get("primaryWeightGrams"), min),
                                    cb.lessThan(root.get("primaryWeightGrams"), max)
                            );
                        } catch (NumberFormatException e) {
                            return cb.conjunction();
                        }
                    })
                    .toArray(Predicate[]::new);
            return predicates.length == 1 ? predicates[0] : cb.or(predicates);
        };
    }
}
