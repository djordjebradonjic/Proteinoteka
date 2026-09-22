package com.proteinoteka.service.producttype;

/** Physical form of a supplement, stored in {@code products.product_form}. */
public enum ProductForm {
    POWDER("powder"),
    CAPSULE("capsule"),
    TABLET("tablet"),
    GUMMY("gummy"),
    LIQUID("liquid"),
    OTHER("other");

    private final String code;

    ProductForm(String code) {
        this.code = code;
    }

    public String code() {
        return code;
    }

    /** Sold by the piece: the pack size is a unit count, the gram weight says little about the dose. */
    public boolean counted() {
        return this == CAPSULE || this == TABLET || this == GUMMY;
    }

    /** Null-safe check on a stored code — a missing form is treated as a powder. */
    public static boolean isCountedCode(String code) {
        return CAPSULE.code.equals(code) || TABLET.code.equals(code) || GUMMY.code.equals(code);
    }

    public static boolean isPowderOrUnknown(String code) {
        return code == null || POWDER.code.equals(code);
    }
}
