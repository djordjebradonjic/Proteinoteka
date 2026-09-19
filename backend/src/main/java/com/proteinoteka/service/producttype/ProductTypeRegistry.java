package com.proteinoteka.service.producttype;

import com.proteinoteka.model.Product;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Looks up the {@link ProductTypeProfile} for a stored type code. Spring collects every profile bean. */
@Component
public class ProductTypeRegistry {

    private final Map<String, ProductTypeProfile> byCode = new LinkedHashMap<>();

    public ProductTypeRegistry(List<ProductTypeProfile> profiles) {
        for (ProductTypeProfile profile : profiles) {
            if (byCode.put(profile.code(), profile) != null) {
                throw new IllegalStateException("Two profiles declare product type '" + profile.code() + "'");
            }
        }
    }

    /** A blank code means a row created before product types existed, i.e. protein. */
    public ProductTypeProfile forCode(String code) {
        String key = (code == null || code.isBlank()) ? ProductTypes.PROTEIN : code;
        ProductTypeProfile profile = byCode.get(key);
        if (profile == null) throw new IllegalArgumentException("Unknown product type '" + code + "'");
        return profile;
    }

    public ProductTypeProfile forProduct(Product product) {
        return forCode(product.getProductType());
    }

    public boolean isKnown(String code) {
        return code != null && byCode.containsKey(code);
    }

    public Collection<ProductTypeProfile> all() {
        return byCode.values();
    }
}
