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
            List<String> names = Arrays.stream(storeNames.split(","))
                    .map(s -> s.trim().toLowerCase())
                    .filter(s -> !s.isEmpty())
                    .toList();
            if (names.size() == 1)
                return cb.equal(cb.lower(root.get("store").get("name")), names.get(0));
            return cb.lower(root.get("store").get("name")).in(names);
        };
    }

    public static Specification<Product> hasBrand(String brands) {
        return (root, query, cb) -> {
            if (brands == null || brands.isEmpty()) return cb.conjunction();
            List<String> list = Arrays.stream(brands.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
            if (list.size() == 1)
                return cb.equal(root.get("brand"), list.get(0));
            return root.get("brand").in(list);
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
            List<String> list = Arrays.stream(proteinSources.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
            if (list.size() == 1)
                return cb.equal(root.get("proteinSource"), list.get(0));
            return root.get("proteinSource").in(list);
        };
    }
}
