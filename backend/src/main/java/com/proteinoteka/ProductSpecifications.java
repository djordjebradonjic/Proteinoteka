package com.proteinoteka;

import com.proteinoteka.model.Product;
import org.springframework.data.jpa.domain.Specification;

public class ProductSpecifications {
    public static Specification<Product> hasName(String name) {
        return (root, query, cb) -> name == null || name.isEmpty() ?
                cb.conjunction() : cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%");
    }
    public static Specification<Product> hasStoreName(String storeName) {
        return (root, query, cb) -> cb.equal(cb.lower(root.get("store").get("name")), storeName.toLowerCase());
    }

    public static Specification<Product> hasBrand(String brand) {
        return (root, query, cb) -> brand == null || brand.isEmpty() ?
                cb.conjunction() : cb.equal(root.get("brand"), brand);
    }

    public static Specification<Product> priceGreaterThan(Double minPrice) {
        return (root, query, cb) -> minPrice == null ?
                cb.conjunction() : cb.greaterThanOrEqualTo(root.get("numericPrice"), minPrice);
    }

    public static Specification<Product> priceLessThan(Double maxPrice) {
        return (root, query, cb) -> maxPrice == null ?
                cb.conjunction() : cb.lessThanOrEqualTo(root.get("numericPrice"), maxPrice);
    }
}
