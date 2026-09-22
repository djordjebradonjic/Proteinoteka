package com.proteinoteka.service.producttype;

/**
 * Codes stored in {@code products.product_type}. The column is a plain string (no DB enum) so a new
 * supplement family only needs a {@link ProductTypeProfile} bean, not a migration.
 */
public final class ProductTypes {

    private ProductTypes() {}

    public static final String PROTEIN = "protein";
    public static final String CREATINE = "creatine";
}
